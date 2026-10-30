// Prototype Stage 4-7: Veo takes from approved keyframes -> strict judge -> best take -> premium mastering.
// Usage: node --experimental-strip-types proto_stage47.ts <runDir> --tag draft --model "Veo 3.1 - Lite" --takes 1 [--only 1,2] [--master-only] [--parallel 3]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { Flow } from '../../services/flowSdkClient.ts';
import * as E from '../../services/premiumPromptEngine.ts';
import * as M from '../../services/premiumMasteringEngine.ts';

const argv = process.argv.slice(2);
const runDir = path.resolve(argv[0]);
const flag = (name: string, def = '') => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : def; };
const tag = flag('--tag', 'draft');
const model = flag('--model', 'Veo 3.1 - Lite');
const takes = Math.max(1, Math.min(4, parseInt(flag('--takes', '1'), 10)));
const parallel = Math.max(1, parseInt(flag('--parallel', '3'), 10));
const only = flag('--only', '').split(',').map((n) => parseInt(n, 10)).filter((n) => n > 0);
const masterOnly = argv.includes('--master-only');
const durationSec = parseInt(flag('--duration', '8'), 10);
// ffmpeg-static của dự án (Windows: ffmpeg.exe, Linux/macOS: ffmpeg) — đường dẫn tương đối, chạy được trên mọi máy.
const FF = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

const bible = JSON.parse(fs.readFileSync(path.join(runDir, 'bible.json'), 'utf-8'));
const stateP = path.join(runDir, 'state.json');
const state = JSON.parse(fs.readFileSync(stateP, 'utf-8'));
state.video = state.video || {};
const save = () => fs.writeFileSync(stateP, JSON.stringify(state, null, 2), 'utf-8');
const pad = (n: number) => String(n).padStart(2, '0');
const withTimeout = <T>(p: Promise<T>, ms: number, what: string) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms / 1000}s: ${what}`)), ms))]);

function probeDur(file: string): number {
  try { execSync(`"${FF}" -hide_banner -i "${file}"`, { stdio: 'pipe' }); } catch (e: any) {
    const m = String(e.stderr || '').match(/Duration: (\d+):(\d+):([\d.]+)/);
    if (m) return +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]);
  }
  return 8;
}

async function judgeTake(shot: any, file: string, key: string) {
  // Judge dày khung (10 khung đều + khung đầu/cuối tham chiếu) + cổng trượt cứng — 3 ảnh tĩnh từng bỏ lọt nhân vật tan chảy.
  const dur = probeDur(file);
  const N = 8;
  const times = Array.from({ length: N }, (_, i) => Number((0.2 + (i * (dur - 0.5)) / (N - 1)).toFixed(2)));
  const images: Array<{ base64: string; mimeType: string }> = [];
  const id = String(shot.shotNumber).padStart(2, '0');
  for (const ref of [`shot_${id}_start_frame.png`, `shot_${id}_end_frame.png`]) {
    const rp = path.join(runDir, ref);
    if (fs.existsSync(rp)) {
      const small = path.join(runDir, `${key}_ref_${ref.includes('start') ? 'start' : 'end'}.jpg`);
      execSync(`"${FF}" -hide_banner -loglevel error -y -i "${rp}" -vf scale=480:-2 -q:v 5 "${small}"`);
      images.push({ base64: fs.readFileSync(small).toString('base64'), mimeType: 'image/jpeg' });
    }
  }
  const nRef = images.length;
  times.forEach((t, i) => {
    const out = path.join(runDir, `${key}_d${String(i + 1).padStart(2, '0')}.jpg`);
    execSync(`"${FF}" -hide_banner -loglevel error -y -ss ${t} -i "${file}" -frames:v 1 -vf scale=480:-2 -q:v 5 "${out}"`);
    images.push({ base64: fs.readFileSync(out).toString('base64'), mimeType: 'image/jpeg' });
  });
  const happy = /smile|proud|happy|laugh|grin|smug|sly/i.test(String(shot.actingBeatEn || ''));
  const gates = `
REFERENCE: the first ${nRef} image(s) are the approved START${nRef > 1 ? ' and END' : ''} keyframes of this shot — elements present in them (steam, water, rocks, light) are intended. The remaining ${N} images are frames of the take at t=${times.join(', ')} s.
HARD FAIL GATES (any true => pass=false, overall <= 55): (1) any body turns translucent, melts, or fuses with mud/water/FX; (2) a character's design drifts from the keyframes (proportions, snout shape, stripes, colours, cartoon style becoming realistic); (3) an extra character, human, or on-screen text appears; (4) the scripted action "${shot.actionEn}" is not visible at any point; ${happy ? '' : `(5) any character smiles, grins or laughs — this beat is "${shot.actingBeatEn}" and must read as that emotion; `}(6) facing direction flips unexpectedly.
Also return "beat_in", "beat_peak", "beat_out" in seconds (take time) where the scripted acting beat "${shot.actingBeatEn}" reads best and cleanest, inside the gates.`;
  // Dịch vụ văn bản của Flow hay báo lỗi tạm thời khi đang có nhiều lệnh video -> thử lại 4 lần, chờ tăng dần.
  for (let attempt = 1; attempt <= 4; attempt++) {
  try {
    const looks = bible.characters.filter((c: any) => (shot.characters || []).includes(c.id)).map((c: any) => `${c.displayNameEn}: ${String(c.lookEn).slice(0, 160)}`).join('; ');
    // Flow từ chối prompt có ảnh dài hơn ~4.000 ký tự (lỗi chung "dịch vụ không hoạt động") -> judge gọn < 3.000 ký tự.
    const compact = `You are a strict animation supervisor judging ONE AI video take of a Pixar-style cartoon short.
Shot ${shot.shotNumber} (${shot.shotSize}): action "${shot.actionEn}". Acting beat: "${shot.actingBeatEn}". Characters: ${looks}.${gates}
Score each 0-10: identityMatch, anatomyStable, noMorphing, actingVisible, compositionClear, effectsRestraint, motionQuality. overall 0-100.
Reply ONLY JSON: {"scores":{...},"overall":n,"pass":bool,"artifacts":["short tags"],"note":"one sentence","beat_in":s,"beat_peak":s,"beat_out":s}`.slice(0, 3400);
    const res: any = await withTimeout(Flow.generate.text({ prompt: compact, images }), 300_000, 'judge');
    const v: any = E.parseJudgeVerdict(res.text);
    if (v) {
      const m = String(res.text).match(/"beat_in"\s*:\s*([\d.]+)[\s\S]*?"beat_peak"\s*:\s*([\d.]+)[\s\S]*?"beat_out"\s*:\s*([\d.]+)/);
      if (m) v.beat = { inSec: +m[1], peakSec: +m[2], outSec: +m[3] };
    }
    return v;
  } catch (e: any) {
    console.warn(`   ⚠️ judge ${key} lần ${attempt}: ${e.message}`);
    await new Promise((r) => setTimeout(r, 20_000 * attempt));
  }
  }
  return null;
}

async function renderShot(shot: any) {
  const id = pad(shot.shotNumber);
  const kfMedia = state.media[`shot_${id}_start_frame`];
  const motion = state.prompts[`shot_${id}_motion`];
  if (!kfMedia || !motion) { console.warn(`   ⚠️ cảnh ${id} thiếu keyframe/motion prompt`); return; }
  const rec = (state.video[id] = state.video[id] || {});
  const list = (rec[tag] = rec[tag] || []);
  for (let k = 1; k <= takes; k++) {
    const file = path.join(runDir, `shot_${id}_${tag}_take_${k}.mp4`);
    if (!fs.existsSync(file)) {
      if (masterOnly) continue;
      let ok = false;
      let dropLastFrame = false;
      for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
        try {
          const t0 = Date.now();
          const endMedia = state.media[`shot_${id}_end_frame`];
          const req: any = { prompt: motion, modelDisplayName: model, aspectRatio: '16:9', durationSeconds: durationSec, resolution: '720p', firstFrameImageMediaId: kfMedia };
          if (endMedia && !dropLastFrame) req.lastFrameImageMediaId = endMedia;
          const res: any = await withTimeout(Flow.generate.video(req), 900_000, `video ${id}`);
          fs.writeFileSync(file, Buffer.from(res.base64, 'base64'));
          console.log(`   ✅ video shot_${id} ${tag} take ${k} (${((Date.now() - t0) / 1000).toFixed(0)}s, ${model}${req.lastFrameImageMediaId ? ', first+last frame' : ''})`);
          ok = true;
        } catch (e: any) {
          console.warn(`   ⚠️ video shot_${id} take ${k} lần ${attempt}: ${e.message}`);
          // Lỗi dịch vụ tạm thời -> giữ khung cuối; chỉ bỏ khung cuối khi lỗi liên quan tới khung hình/ảnh tham chiếu.
          if (/frame|image|ảnh|khung|unsupported|không hỗ trợ/i.test(String(e.message))) dropLastFrame = true;
        }
      }
      if (!ok) continue;
    }
    if (!list.find((t: any) => t.k === k && t.verdict)) {
      const verdict = await judgeTake(shot, file, `shot_${id}_${tag}_take_${k}`);
      const entry = { k, path: file, verdict };
      const idx = list.findIndex((t: any) => t.k === k);
      if (idx >= 0) list[idx] = entry; else list.push(entry);
      save();
      console.log(`   🏅 judge shot_${id} take ${k}: ${verdict ? `${verdict.overall}/100 ${verdict.pass ? 'PASS' : 'FAIL'} — ${verdict.note} | artifacts: ${(verdict.artifacts || []).join('; ')}${verdict.beat ? ` | beat ${verdict.beat.inSec}-${verdict.beat.peakSec}-${verdict.beat.outSec}s` : ''}` : 'null (fail-closed)'}`);
    }
  }
  const valid = list.filter((t: any) => fs.existsSync(t.path));
  if (valid.length) {
    const { best } = E.pickBestTake(valid) as { best: any; index: number };
    fs.copyFileSync(best.path, path.join(runDir, `shot_${id}_${tag}_best.mp4`));
    rec[`${tag}_best`] = best.k;
    save();
  }
}

(async () => {
  const shots = bible.shots.filter((s: any) => !only.length || only.includes(s.shotNumber));
  for (let i = 0; i < shots.length; i += parallel) {
    await Promise.all(shots.slice(i, i + parallel).map((s: any, j: number) => new Promise((r) => setTimeout(r, j * 2500)).then(() => renderShot(s))));
  }
  const inputs = bible.shots
    .map((s: any) => ({ s, f: path.join(runDir, `shot_${pad(s.shotNumber)}_${tag}_best.mp4`) }))
    .filter((x: any) => fs.existsSync(x.f))
    .map((x: any) => ({ shotIdx: pad(x.s.shotNumber), videoPath: x.f, beat: x.s.beat, shotSize: x.s.shotSize, hasDialogue: Boolean(x.s.dialogue), subtitleVi: x.s.dialogue?.lineVi || '' }));
  if (!inputs.length) { console.log('Không có video để master'); return; }
  const outDir = path.join(runDir, `master_${tag}`);
  fs.mkdirSync(outDir, { recursive: true });
  const report = M.masterFilm(inputs, { ffmpegPath: FF, outDir, aspectRatio: '16:9', pacing: (flag('--pacing', 'viral-reel') as any), subtitles: 'dialogue', grain: true, log: (m: string) => console.log('   🎚️', m) });
  console.log('🏁 MASTER', JSON.stringify({ path: report.masterPath, res: `${report.width}x${report.height}`, dur: report.durationSec, shots: report.shotCount, asl: report.avgShotSec, median: report.medianShotSec, lufs: report.measured, warnings: report.warnings }, null, 0));
})().catch((e) => { console.error('❌', e); process.exit(1); });
