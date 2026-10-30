// Re-master a run from its best takes, with per-shot clip overrides (e.g. a hand-trimmed cut-on-action clip).
// Usage: node --experimental-strip-types proto_master.ts <runDir> --tag final --out master_final_v2 [--override 9=path.mp4,11=path.mp4] [--music file] [--pacing viral-reel]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from '../../services/premiumMasteringEngine.ts';

const argv = process.argv.slice(2);
const runDir = path.resolve(argv[0]);
const flag = (name: string, def = '') => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : def; };
const tag = flag('--tag', 'final');
const outName = flag('--out-dir', '') || flag('--out', `master_${tag}_v2`);
const overrides: Record<number, string> = {};
const editDir = flag('--edit-dir', '');
if (editDir) {
  const edAbs = path.isAbsolute(editDir) ? editDir : path.join(runDir, editDir);
  if (fs.existsSync(edAbs)) {
    for (const fn of fs.readdirSync(edAbs)) {
      const m = fn.match(/^shot_(\d+)_edit\.mp4$/);
      if (m) overrides[parseInt(m[1], 10)] = path.join(edAbs, fn);
    }
  }
}
for (const pair of flag('--override', '').split(',').filter(Boolean)) {
  const [n, p] = pair.split('=');
  overrides[parseInt(n, 10)] = path.isAbsolute(p) ? p : path.join(runDir, p);
}
// ffmpeg-static của dự án (Windows: ffmpeg.exe, Linux/macOS: ffmpeg) — đường dẫn tương đối, chạy được trên mọi máy.
const _ffStatic = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
const FF = fs.existsSync(_ffStatic) ? _ffStatic : 'ffmpeg';
const pad = (n: number) => String(n).padStart(2, '0');
const bibleFile = flag('--bible', 'bible.json');
const bible = JSON.parse(fs.readFileSync(path.isAbsolute(bibleFile) ? bibleFile : path.join(runDir, bibleFile), 'utf-8'));

const inputs = bible.shots
  .map((s: any) => ({ s, f: overrides[s.shotNumber] || path.join(runDir, `shot_${pad(s.shotNumber)}_${tag}_best.mp4`) }))
  .filter((x: any) => fs.existsSync(x.f))
  .map((x: any) => {
    const ov = Boolean(overrides[x.s.shotNumber]);
    // Clip dựng tay đã được cắt với lề 0.25s trước / 0.45s sau -> khoá cứng đúng đoạn (giữ cả đoạn "hold" cuối phim và trọn câu thoại).
    const dur = ov ? M.probeMedia(FF, x.f).durationSec : 0;
    const hold = x.s.shotNumber === bible.shots[bible.shots.length - 1].shotNumber;
    const hasDlg = Boolean(x.s.dialogue);
    return {
      shotIdx: pad(x.s.shotNumber), videoPath: x.f, beat: x.s.beat, shotSize: x.s.shotSize, hasDialogue: hasDlg, subtitleVi: x.s.dialogue?.lineVi || '',
      actingBeat: x.s.actingBeatEn, action: x.s.actionEn,
      ...(ov && dur > 0.8 ? { forceWindow: { inSec: hasDlg ? 0.05 : 0.25, outSec: Number((dur - (hold || hasDlg ? 0.05 : 0.45)).toFixed(3)) } } : {}),
    };
  });
console.log('shots:', inputs.map((i: any) => `${i.shotIdx}${overrides[parseInt(i.shotIdx, 10)] ? '*' : ''}`).join(' '));
const outDir = path.join(runDir, outName);
fs.mkdirSync(outDir, { recursive: true });
const report = M.masterFilm(inputs, {
  ffmpegPath: FF, outDir, aspectRatio: '16:9', pacing: flag('--pacing', 'viral-reel') as any, subtitles: flag('--subtitles', 'dialogue') as any,
  musicPath: flag('--music', '') || undefined, ambiencePath: flag('--ambience', '') || undefined, grain: true, log: (m: string) => console.log('   🎚️', m),
});
console.log('🏁 MASTER', JSON.stringify({ path: report.masterPath, res: `${report.width}x${report.height}`, dur: report.durationSec, shots: report.shotCount, asl: report.avgShotSec, median: report.medianShotSec, lufs: report.measured, warnings: report.warnings }));
