/**
 * REMASTER — dựng lại master của một run đã có (offline, chỉ ffmpeg, không gọi Flow, không tốn credit).
 *
 *   node --experimental-strip-types scripts/remaster-run.ts --run <runDir>
 *        [--aspect 16:9|9:16] [--pacing viral-reel|cinema|fast] [--subtitles none|dialogue]
 *        [--music file] [--ambience file] [--narration none|vo] [--out-subdir premium_master] [--manifest file]
 *        [--out-name MASTER_PREMIUM] [--overrides overrides.json] [--take-tag final] [--no-grain] [--keep-work]
 *
 * Nguồn shot: master_production_manifest.json (pipeline) -> bible.json + shot_XX_<tag>_best.mp4 (run premium dạng proto)
 * -> quét shot_XX_video.mp4.
 *
 * Dữ liệu giám khảo đã lưu (L8 / L11) được dùng như pipeline --resume --master-only (hai đường remaster cho cùng một bản dựng):
 *   - manifest: shots[i].beatWindow (hoặc beatWindow / phán quyết của bản tốt nhất trong shots[i].takes), shots[i].forceWindow,
 *     shots[i].hflip (hoặc masterWindow.forced / masterWindow.hflip của lần dựng trước);
 *   - bible.json (run proto): state.json video[XX][<tag>_best] -> phán quyết của bản đó -> beat_in / beat_peak / beat_out.
 *   --overrides luôn thắng; --ignore-stored-beats bỏ qua dữ liệu đã lưu (chọn cửa sổ thuần theo chuyển động / âm thanh).
 *
 * --overrides <json>: chỉnh từng shot (khoá là số shot: "4", "04" hoặc "shot_04"), đường dẫn tương đối tính theo thư mục file json:
 *   { "shots": { "04": { "forceWindow": { "inSec": 3.55, "outSec": 5.8 } },
 *                "10": { "hflip": true, "beatWindow": { "inSec": 3.6, "peakSec": 5.0, "outSec": 5.6 } },
 *                "07": { "videoPath": "edit/shot_07_edit.mp4", "forceWindow": { "inSec": 0.24, "outSec": 1.64 } },
 *                "13": { "skip": true } },
 *     "options": { "ambiencePath": "amb.wav", "endFadeSec": 0.6, "limiterSlackDb": 1 } }
 *   Trường mỗi shot: forceWindow, beatWindow, hflip, videoPath, skip, gainOffsetDb, fxSpans, beat, shotSize, actingBeat, action.
 *
 * Chỉ ghi vào <runDir>/<out-subdir>/ (<out-name>.mp4 + phụ đề + <out-name>_report.json — báo cáo theo tên bản master, kèm md5 nguồn).
 */
import fs from 'fs';
import path from 'path';
import {
  masterFilm,
  probeMedia,
  resolveFfmpegPath,
  shotSizeFromCoverage,
  cleanCaptionText,
  type MasterShotInput,
  type MasterPacing,
  type MasterOptions,
  type BeatWindow,
  type ForcedWindow,
  type FxSpan,
} from '../services/premiumMasteringEngine.ts';
import { beatWindowFromVerdict } from '../services/premiumShotProduction.ts';

const USAGE = `Cách dùng:
  node --experimental-strip-types scripts/remaster-run.ts --run <runDir> [--aspect 16:9|9:16]
       [--pacing viral-reel|cinema|fast] [--subtitles none|dialogue] [--music <file>] [--ambience <file>]
       [--narration none|vo] [--out-subdir premium_master] [--manifest <file>] [--out-name MASTER_PREMIUM]
       [--overrides <json>] [--take-tag final] [--ignore-stored-beats] [--no-grain] [--keep-work]`;

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq > 0) {
      out[a.slice(2, eq)] = a.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      out[a.slice(2)] = next;
      i++;
    } else out[a.slice(2)] = true;
  }
  return out;
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T, flag: string): T {
  if (value === undefined || value === true) return fallback;
  const v = String(value) as T;
  if (!allowed.includes(v)) {
    console.error(`❌ ${flag} không hợp lệ: "${v}" (cho phép: ${allowed.join(', ')})`);
    process.exit(1);
  }
  return v;
}

const BEAT_FROM_PHASE: Record<string, string> = {
  PRE_MAIN_BUILDUP: 'setup',
  MAIN_CLIMAX_CONFLICT: 'climax',
  POST_MAIN_AFTERMATH: 'resolution',
};

/**
 * Ưu tiên file NẰM TRONG thư mục run (giống resolveRunFile của pipeline): run đã copy / di chuyển vẫn giữ đường dẫn tuyệt đối
 * của run gốc trong manifest, nên đường dẫn thô chỉ được thử SAU CÙNG.
 */
function resolveFile(raw: string | undefined, dirs: string[], preferredPath?: string): string {
  const candidates: string[] = [];
  if (preferredPath) candidates.push(preferredPath);
  const base = raw ? path.basename(String(raw).replace(/\\/g, '/')) : '';
  if (base) for (const d of dirs) candidates.push(path.join(d, base));
  if (raw) candidates.push(raw);
  return candidates.find((c) => c && fs.existsSync(c)) || preferredPath || raw || '';
}

const pad2 = (v: unknown) => String(v ?? '').replace(/^shot_/i, '').padStart(2, '0');

function num(v: unknown): number | undefined {
  const n = Number(v);
  return v === null || v === undefined || v === '' || !Number.isFinite(n) ? undefined : n;
}

function parseForced(v: any, where: string, errors: string[]): ForcedWindow | undefined {
  if (!v) return undefined;
  const inSec = num(v.inSec ?? v.in);
  const outSec = num(v.outSec ?? v.out);
  if (inSec === undefined || outSec === undefined || outSec <= inSec || inSec < 0) {
    errors.push(`${where}.forceWindow không hợp lệ (cần 0 <= inSec < outSec): ${JSON.stringify(v)}`);
    return undefined;
  }
  return { inSec, outSec };
}

function parseBeat(v: any, where: string, errors: string[]): BeatWindow | undefined {
  if (!v) return undefined;
  const inSec = num(v.inSec ?? v.beat_in ?? v.in);
  const peakSec = num(v.peakSec ?? v.beat_peak ?? v.peak);
  const outSec = num(v.outSec ?? v.beat_out ?? v.out);
  if (inSec === undefined || peakSec === undefined || outSec === undefined || !(inSec <= peakSec && peakSec <= outSec)) {
    errors.push(`${where}.beatWindow không hợp lệ (cần inSec <= peakSec <= outSec): ${JSON.stringify(v)}`);
    return undefined;
  }
  return { inSec, peakSec, outSec };
}

function parseFx(v: any, where: string, errors: string[]): FxSpan[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: FxSpan[] = [];
  for (const s of v) {
    const inSec = num(s?.inSec);
    const outSec = num(s?.outSec);
    if (inSec === undefined || outSec === undefined || outSec <= inSec) {
      errors.push(`${where}.fxSpans có khoảng không hợp lệ: ${JSON.stringify(s)}`);
      continue;
    }
    out.push({ inSec, outSec, ...(num(s?.frac) !== undefined ? { frac: num(s.frac) } : {}) });
  }
  return out;
}

/** Cửa sổ nhịp đã lưu ({ inSec, peakSec, outSec } hoặc phán quyết có beatInSec / beat.{inSec,...}) -> BeatWindow hợp lệ hoặc undefined. */
function storedBeat(w: any, durationSec?: number): BeatWindow | undefined {
  if (!w || typeof w !== 'object') return undefined;
  const asVerdict = 'peakSec' in w || 'inSec' in w || 'outSec' in w ? { beatInSec: w.inSec, beatPeakSec: w.peakSec, beatOutSec: w.outSec } : w;
  return beatWindowFromVerdict(asVerdict, durationSec) || undefined;
}

function storedForce(w: any): ForcedWindow | undefined {
  const inSec = num(w?.inSec);
  const outSec = num(w?.outSec);
  return inSec !== undefined && outSec !== undefined && inSec >= 0 && outSec > inSec ? { inSec, outSec } : undefined;
}

/** Từ một shot của manifest pipeline: beatWindow / forceWindow / hflip đã lưu (L8 / L11). */
function manifestStoredWindows(s: any, durationSec?: number): { beatWindow?: BeatWindow; forceWindow?: ForcedWindow; hflip?: boolean; from: string[] } {
  const from: string[] = [];
  let beatWindow = storedBeat(s?.beatWindow, durationSec);
  if (beatWindow) from.push('beatWindow');
  if (!beatWindow && Array.isArray(s?.takes)) {
    const best = s.takes.find((t: any) => t && t.take === s.bestTake) || null;
    beatWindow = storedBeat(best?.beatWindow, durationSec) || storedBeat(best?.verdict, durationSec);
    if (beatWindow) from.push(`take ${best?.take} verdict`);
  }
  let forceWindow = storedForce(s?.forceWindow);
  if (forceWindow) from.push('forceWindow');
  else if (s?.masterWindow?.forced) {
    forceWindow = storedForce(s.masterWindow);
    if (forceWindow) from.push('masterWindow.forced');
  }
  let hflip: boolean | undefined;
  if (typeof s?.hflip === 'boolean') {
    hflip = s.hflip;
    from.push('hflip');
  } else if (s?.masterWindow?.hflip === true) {
    hflip = true;
    from.push('masterWindow.hflip');
  }
  return { ...(beatWindow ? { beatWindow } : {}), ...(forceWindow ? { forceWindow } : {}), ...(hflip !== undefined ? { hflip } : {}), from };
}

/**
 * Run proto (bible.json + state.json): phán quyết của bản tốt nhất (video[XX][<tag>_best]) -> cửa sổ nhịp. Chỉ dùng khi file
 * shot_XX_<tag>_best.mp4 đúng là bản đó (cùng kích thước với shot_XX_<tag>_take_K.mp4) — state.json có thể đã đổi do run đang chạy.
 */
function prototypeStoredBeat(runDir: string, state: any, shotIdx: string, videoPath: string, durationSec?: number): { beatWindow?: BeatWindow; note: string } {
  const m = /^shot_(\d+)_(\w+?)_best\.mp4$/i.exec(path.basename(videoPath || ''));
  if (!m) return { note: '' };
  const tag = m[2];
  const rec = state?.video?.[shotIdx];
  if (!rec || typeof rec !== 'object') return { note: '' };
  const k = Number(rec[`${tag}_best`]);
  const list: any[] = Array.isArray(rec[tag]) ? rec[tag] : [];
  const entry = list.find((t) => t && Number(t.k) === k) || null;
  if (!k || !entry) return { note: '' };
  const takeFile = path.join(runDir, `shot_${shotIdx}_${tag}_take_${k}.mp4`);
  try {
    if (fs.existsSync(takeFile) && fs.existsSync(videoPath) && fs.statSync(takeFile).size !== fs.statSync(videoPath).size) {
      return { note: `state.json chọn bản ${k} nhưng ${path.basename(videoPath)} không phải bản đó → bỏ qua nhịp đã lưu` };
    }
  } catch {}
  const beatWindow = storedBeat(entry.verdict, durationSec);
  return beatWindow ? { beatWindow, note: `state.json ${tag} bản ${k}` } : { note: entry.verdict ? '' : `state.json ${tag} bản ${k} chưa có phán quyết` };
}

interface ShotOverride {
  forceWindow?: ForcedWindow;
  beatWindow?: BeatWindow;
  hflip?: boolean;
  videoPath?: string;
  skip?: boolean;
  gainOffsetDb?: number;
  fxSpans?: FxSpan[];
  beat?: string;
  shotSize?: string;
  actingBeat?: string;
  action?: string;
}

function loadOverrides(file: string): { shots: Map<string, ShotOverride>; options: Partial<MasterOptions> } {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`❌ Không tìm thấy file --overrides: ${abs}`);
    process.exit(1);
  }
  let raw: any;
  try {
    raw = JSON.parse(fs.readFileSync(abs, 'utf-8'));
  } catch (err: any) {
    console.error(`❌ --overrides lỗi JSON (${err.message}): ${abs}`);
    process.exit(1);
  }
  const dir = path.dirname(abs);
  const errors: string[] = [];
  const shotsRaw = raw && typeof raw === 'object' && raw.shots && typeof raw.shots === 'object' ? raw.shots : raw;
  const shots = new Map<string, ShotOverride>();
  for (const [key, v] of Object.entries<any>(shotsRaw || {})) {
    if (key === 'options' || !v || typeof v !== 'object') continue;
    if (!/^(shot_)?\d+$/i.test(key)) {
      errors.push(`khoá shot "${key}" không hợp lệ (dùng "4", "04" hoặc "shot_04")`);
      continue;
    }
    const where = `shots.${key}`;
    const o: ShotOverride = {
      forceWindow: parseForced(v.forceWindow, where, errors),
      beatWindow: parseBeat(v.beatWindow, where, errors),
      fxSpans: parseFx(v.fxSpans, where, errors),
    };
    if (v.hflip !== undefined) o.hflip = Boolean(v.hflip);
    if (v.skip) o.skip = true;
    if (typeof v.videoPath === 'string' && v.videoPath) o.videoPath = path.resolve(dir, v.videoPath); // tuyệt đối giữ nguyên, tương đối tính theo thư mục file json
    if (num(v.gainOffsetDb) !== undefined) o.gainOffsetDb = num(v.gainOffsetDb);
    for (const k of ['beat', 'shotSize', 'actingBeat', 'action'] as const) if (typeof v[k] === 'string' && v[k]) o[k] = v[k];
    if (o.videoPath && !fs.existsSync(o.videoPath)) errors.push(`${where}.videoPath không tồn tại: ${o.videoPath}`);
    shots.set(pad2(key), o);
  }
  const options: Partial<MasterOptions> = {};
  const ro = raw?.options && typeof raw.options === 'object' ? raw.options : {};
  if (typeof ro.ambiencePath === 'string') options.ambiencePath = path.resolve(dir, ro.ambiencePath);
  if (typeof ro.musicPath === 'string') options.musicPath = path.resolve(dir, ro.musicPath);
  for (const k of ['endFadeSec', 'ambienceBelowStemLu', 'audioCrossfadeFrames', 'exposureTargetP50', 'targetLufs', 'truePeakDb', 'minIntegratedLufs', 'maxLimiterGainReductionDb', 'limiterSlackDb', 'maxMidFxFrac'] as const) {
    if (num(ro[k]) !== undefined) (options as any)[k] = num(ro[k]);
  }
  for (const k of ['gainMap', 'exposureNormalize'] as const) if (typeof ro[k] === 'boolean') (options as any)[k] = ro[k];
  if (ro.toneCurve === false || typeof ro.toneCurve === 'string') options.toneCurve = ro.toneCurve;
  if (errors.length) {
    console.error(`❌ --overrides có lỗi (${abs}):`);
    for (const e of errors) console.error(`   - ${e}`);
    process.exit(1);
  }
  return { shots, options };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h || typeof args.run !== 'string') {
    console.log(USAGE);
    process.exit(args.help || args.h ? 0 : 1);
  }
  const runDir = path.resolve(String(args.run));
  if (!fs.existsSync(runDir)) {
    console.error(`❌ Không tìm thấy thư mục run: ${runDir}`);
    process.exit(1);
  }
  const manifestPath = path.resolve(typeof args.manifest === 'string' ? args.manifest : path.join(runDir, 'master_production_manifest.json'));
  const manifestDir = path.dirname(manifestPath);
  const ffmpegPath = resolveFfmpegPath();
  const takeTag = typeof args['take-tag'] === 'string' ? String(args['take-tag']) : '';
  const overrides = typeof args.overrides === 'string' ? loadOverrides(args.overrides) : { shots: new Map<string, ShotOverride>(), options: {} as Partial<MasterOptions> };

  let manifest: any = null;
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (err: any) {
      console.warn(`⚠️ Manifest lỗi JSON (${err.message}) — chuyển sang bible.json / quét shot_XX_video.mp4.`);
    }
  }

  // Video mặc định của một shot: shot_XX_video.mp4 (pipeline) -> shot_XX_<tag>_best.mp4 (run proto: final rồi draft).
  const tags = takeTag ? [takeTag] : ['final', 'draft'];
  const defaultVideo = (idx: string) => {
    const cands = [path.join(runDir, `shot_${idx}_video.mp4`), ...tags.map((t) => path.join(runDir, `shot_${idx}_${t}_best.mp4`))];
    return cands.find((c) => fs.existsSync(c)) || cands[0];
  };

  let source = 'manifest';
  let rawShots: any[] = Array.isArray(manifest?.shots) ? manifest.shots : [];
  let bible: any = null;
  let protoState: any = null;
  const useStored = !args['ignore-stored-beats'];
  const storedNotes: string[] = [];
  if (!rawShots.length) {
    const biblePath = path.join(runDir, 'bible.json');
    if (fs.existsSync(biblePath)) {
      try {
        bible = JSON.parse(fs.readFileSync(biblePath, 'utf-8'));
      } catch (err: any) {
        console.warn(`⚠️ bible.json lỗi JSON (${err.message}) — chuyển sang quét shot_XX_video.mp4.`);
      }
    }
    if (Array.isArray(bible?.shots) && bible.shots.length) {
      source = 'bible';
      const statePath = path.join(runDir, 'state.json');
      if (fs.existsSync(statePath)) {
        try {
          protoState = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        } catch (err: any) {
          console.warn(`⚠️ state.json lỗi JSON (${err.message}) — bỏ qua nhịp diễn đã lưu của giám khảo.`);
        }
      }
      rawShots = bible.shots.map((s: any, i: number) => ({ shotIdx: pad2(s.shotNumber ?? i + 1), premium: s, videoPath: undefined }));
    }
  }
  if (!rawShots.length) {
    source = 'scan';
    const re = takeTag ? new RegExp(`^shot_(\\d+)_(?:video|${takeTag}_best)\\.mp4$`, 'i') : /^shot_(\d+)_video\.mp4$/i;
    rawShots = fs
      .readdirSync(runDir)
      .map((f) => re.exec(f))
      .filter(Boolean)
      .map((m) => ({ shotIdx: m![1], videoPath: path.join(runDir, m![0]) }))
      .sort((a, b) => Number(a.shotIdx) - Number(b.shotIdx));
  }
  if (!rawShots.length) {
    console.error(`❌ Không có shot nào trong ${manifestPath}, ${path.join(runDir, 'bible.json')} hoặc shot_XX_video.mp4 trong ${runDir}`);
    process.exit(1);
  }

  const isPremium = rawShots.some((s) => s && s.premium);
  const spokenLang = (manifest?.dialogueLang || bible?.dialogueLang) === 'vi' ? 'vi' : 'en';
  const subtitles = pickEnum(args.subtitles, ['dialogue', 'none'] as const, isPremium ? 'dialogue' : 'none', '--subtitles');
  const pacing = pickEnum(args.pacing, ['viral-reel', 'cinema', 'fast'] as const, 'viral-reel', '--pacing') as MasterPacing;
  const narration = pickEnum(args.narration, ['none', 'vo'] as const, 'none', '--narration');
  const notes: string[] = [];

  const usedOverrides = new Set<string>();
  const shots: MasterShotInput[] = [];
  rawShots.forEach((s: any, i: number) => {
    const shotIdx = String(s.shotIdx || String(s.shotNumber || i + 1).padStart(2, '0'));
    const ov = overrides.shots.get(pad2(shotIdx));
    if (ov) usedOverrides.add(pad2(shotIdx));
    if (ov?.skip) {
      notes.push(`Shot ${shotIdx}: bỏ qua theo --overrides (skip).`);
      return;
    }
    const premium = s.premium || null;
    let subtitleVi = '';
    let hasDialogue = false;
    if (premium) {
      hasDialogue = !!premium.dialogue;
      subtitleVi = premium.dialogue?.lineVi || s.subtitleVi || '';
    } else if (subtitles === 'dialogue' && s.subtitleVi) {
      // Run cũ: subtitleVi là lời thuyết minh dài -> chỉ nhận câu ngắn (<= 2 cue) như lời thoại.
      const clean = cleanCaptionText(s.subtitleVi);
      if (clean.length <= 84) {
        subtitleVi = clean;
        hasDialogue = true;
      } else notes.push(`Shot ${shotIdx}: bỏ phụ đề thuyết minh dài ${clean.length} ký tự (không phải lời thoại).`);
    }
    const spoken = premium?.dialogue ? String((spokenLang === 'vi' ? premium.dialogue.lineVi : premium.dialogue.lineEn) || '') : '';
    const videoPath = ov?.videoPath || resolveFile(s.videoPath, [runDir, manifestDir], defaultVideo(pad2(shotIdx)));
    const shot: MasterShotInput = {
      shotIdx,
      videoPath,
      dialogueText: spoken || undefined,
      beat: ov?.beat || premium?.beat || BEAT_FROM_PHASE[String(s.macroPhase || '')] || undefined,
      shotSize: ov?.shotSize || premium?.shotSize || shotSizeFromCoverage(s.coverageType, i),
      hasDialogue,
      subtitleVi,
      voiceoverPath: s.voiceoverPath
        ? resolveFile(
            s.voiceoverPath,
            [path.join(runDir, 'voiceovers'), runDir, path.join(manifestDir, 'voiceovers')],
            path.join(runDir, 'voiceovers', `shot_${shotIdx}_vo.mp3`)
          )
        : undefined,
      actingBeat: ov?.actingBeat || premium?.actingBeatEn || undefined,
      action: ov?.action || premium?.actionEn || undefined,
    };
    // L8 / L11: dữ liệu đã lưu của giám khảo / dựng phim (như pipeline --resume --master-only); --overrides thắng.
    if (useStored) {
      const dur = num(premium?.durationSeconds ?? s.durationSeconds);
      if (source === 'manifest') {
        const st = manifestStoredWindows(s, dur);
        if (st.beatWindow) shot.beatWindow = st.beatWindow;
        if (st.forceWindow) shot.forceWindow = st.forceWindow;
        if (st.hflip !== undefined) shot.hflip = st.hflip;
        if (st.from.length) storedNotes.push(`Shot ${shotIdx}: ${st.from.join(' + ')} từ manifest${st.beatWindow ? ` (nhịp ${st.beatWindow.inSec}/${st.beatWindow.peakSec}/${st.beatWindow.outSec}s)` : ''}`);
      } else if (source === 'bible' && protoState) {
        const st = prototypeStoredBeat(runDir, protoState, pad2(shotIdx), videoPath, dur);
        if (st.beatWindow) {
          shot.beatWindow = st.beatWindow;
          storedNotes.push(`Shot ${shotIdx}: beat_in/peak/out ${st.beatWindow.inSec}/${st.beatWindow.peakSec}/${st.beatWindow.outSec}s từ ${st.note}`);
        } else if (st.note) storedNotes.push(`Shot ${shotIdx}: ${st.note}`);
      }
    }
    if (ov?.forceWindow) shot.forceWindow = ov.forceWindow;
    if (ov?.beatWindow) shot.beatWindow = ov.beatWindow;
    if (ov?.hflip !== undefined) shot.hflip = ov.hflip;
    if (ov?.fxSpans) shot.fxSpans = ov.fxSpans;
    if (ov?.gainOffsetDb !== undefined) shot.gainOffsetDb = ov.gainOffsetDb;
    shots.push(shot);
  });
  for (const key of overrides.shots.keys()) {
    if (!usedOverrides.has(key)) notes.push(`--overrides: shot ${key} không có trong danh sách shot của run — bỏ qua.`);
  }
  if (!shots.length) {
    console.error('❌ Không còn shot nào để dựng (tất cả bị skip?).');
    process.exit(1);
  }

  let aspect = typeof args.aspect === 'string' ? args.aspect : '';
  if (aspect && !['16:9', '9:16'].includes(aspect)) {
    console.error(`❌ --aspect không hợp lệ: "${aspect}" (cho phép: 16:9, 9:16)`);
    process.exit(1);
  }
  if (!aspect) {
    const first = shots.find((s) => s.videoPath && fs.existsSync(s.videoPath));
    const p = first ? probeMedia(ffmpegPath, first.videoPath) : null;
    aspect = p && p.height > p.width ? '9:16' : '16:9';
  }

  const outSubdir = typeof args['out-subdir'] === 'string' ? args['out-subdir'] : 'premium_master';
  const outDir = path.join(runDir, outSubdir);
  const outBaseName = typeof args['out-name'] === 'string' ? args['out-name'] : 'MASTER_PREMIUM';
  // Tên bản master khác mặc định -> phụ đề cũng theo tên đó (không ghi đè phụ đề của bản master khác trong cùng thư mục).
  const subtitleBaseName = typeof args['out-name'] === 'string' && outBaseName !== 'MASTER_PREMIUM' ? `${outBaseName}_subtitles` : 'master_subtitles';
  const musicPath = typeof args.music === 'string' ? path.resolve(args.music) : overrides.options.musicPath;
  const ambiencePath = typeof args.ambience === 'string' ? path.resolve(args.ambience) : overrides.options.ambiencePath;
  for (const [flag, p] of [['--music', musicPath], ['--ambience', ambiencePath]] as const) {
    if (p && !fs.existsSync(p)) {
      console.error(`❌ ${flag}: không tìm thấy ${p}`);
      process.exit(1);
    }
  }

  console.log('========================================================================');
  console.log(`🎬 REMASTER (offline ffmpeg) — ${manifest?.movieTitle || bible?.movieTitle || path.basename(runDir)}`);
  console.log(`   Run: ${runDir}`);
  console.log(`   Nguồn shot: ${source === 'manifest' ? manifestPath : source === 'bible' ? `${path.join(runDir, 'bible.json')} (take ${tags.join(' > ')})` : `quét shot_XX_video.mp4${takeTag ? ` / shot_XX_${takeTag}_best.mp4` : ''}`}`);
  console.log(
    `   Kiểu: ${isPremium ? 'premium' : 'legacy'} · ${shots.length} shot · ${aspect} · pacing ${pacing} · phụ đề ${subtitles} · narration ${narration}${musicPath ? ` · nhạc ${musicPath}` : ''}${ambiencePath ? ` · ambience ${ambiencePath}` : ''}`
  );
  if (overrides.shots.size || storedNotes.length) {
    for (const s of shots) {
      const tags2 = [
        s.forceWindow ? `force ${s.forceWindow.inSec}-${s.forceWindow.outSec}s` : '',
        s.beatWindow ? `beat ${s.beatWindow.inSec}/${s.beatWindow.peakSec}/${s.beatWindow.outSec}s` : '',
        s.hflip ? 'hflip' : '',
        overrides.shots.get(pad2(s.shotIdx))?.videoPath ? `video ${path.basename(s.videoPath)}` : '',
      ].filter(Boolean);
      if (tags2.length) console.log(`   Cửa sổ shot ${s.shotIdx}: ${tags2.join(' · ')}`);
    }
  }
  console.log(`   ffmpeg: ${ffmpegPath}`);
  console.log(`   Xuất ra: ${outDir}`);
  for (const n of notes) console.log(`   ℹ️ ${n}`);
  if (useStored) {
    const withBeat = shots.filter((s) => s.beatWindow).length;
    console.log(
      `   Nhịp diễn đã lưu (L8): ${withBeat}/${shots.length} cảnh có beat_window${source === 'bible' ? (protoState ? ' (state.json)' : ' (không có state.json)') : source === 'manifest' ? ' (manifest)' : ''}`
    );
    for (const n of storedNotes) console.log(`      · ${n}`);
  } else console.log('   Nhịp diễn đã lưu: bỏ qua (--ignore-stored-beats)');
  console.log('========================================================================');

  const t0 = Date.now();
  const report = masterFilm(shots, {
    ...overrides.options,
    ffmpegPath,
    outDir,
    outBaseName,
    subtitleBaseName,
    aspectRatio: aspect,
    pacing,
    subtitles,
    musicPath,
    ambiencePath,
    narration,
    grain: !args['no-grain'],
    keepWorkFiles: !!args['keep-work'],
  });

  console.log('------------------------------------------------------------------------');
  console.log(`✅ Master: ${report.masterPath}`);
  console.log(`   ${report.width}x${report.height} @ ${report.fps}fps · ${report.durationSec}s · ${report.frameCount} khung (dự kiến ${report.expectedFrameCount})`);
  console.log(`   ${report.shotCount} shot · ASL ${report.avgShotSec}s · median ${report.medianShotSec}s · ${report.captionCount} cue phụ đề`);
  console.log(
    `   Loudness: ${report.measured.integratedLufs} LUFS (mục tiêu ${report.integratedTargetLufs}) · true peak ${report.measured.truePeakDb} dBTP · LRA ${report.measured.lra} LU (${report.loudnormMode}${report.limiterGainReductionDb != null ? `, limiter ép tối đa ~${report.limiterGainReductionDb} dB` : ''})`
  );
  const cj = report.audio?.cutJumps;
  if (cj) console.log(`   Nhảy mức tại điểm cắt (0.4 s trước/sau): median ${cj.medianAbsDb} dB · max ${cj.maxAbsDb} dB · [${cj.jumpsDb.join(', ')}]`);
  const pic = report.picture;
  if (pic) {
    console.log(
      `   Hình: p50 luma ${pic.p50Luma} · p1 ${pic.p1Luma} · cháy đỏ ${pic.redClipPct}% · góc/tâm ${pic.cornerCentreRatio} · nhảy phơi sáng tại điểm cắt median ${pic.medianCutExposureJump}`
    );
  }
  console.log(`   Phụ đề: ${report.srtPath} | ${report.assPath}`);
  console.log(`   Báo cáo: ${report.reportPath || path.join(outDir, `${outBaseName}_report.json`)}`);
  if (report.warnings.length) {
    console.log('   ⚠️ Cảnh báo:');
    for (const w of report.warnings) console.log(`      - ${w}`);
  }
  console.log(`   ⏱️ ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

try {
  main();
} catch (err: any) {
  console.error('❌ Remaster thất bại:', err?.message || err);
  process.exit(1);
}
