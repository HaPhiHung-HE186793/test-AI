/**
 * PREMIUM MASTERING ENGINE — Stage 7 offline (chỉ dùng ffmpeg-static, không gọi Flow, không tốn credit).
 *
 * Một lần dựng duy nhất (r3 — bài học từ render thật dino_premium_v2):
 *   chọn đoạn từng clip: forceWindow của dựng phim (L11) > nhịp diễn của giám khảo beatWindow (L8: cửa sổ PHẢI chứa beat_peak,
 *     chuyển động/âm thanh chỉ để phân xử hoà, loại cửa sổ có khung giữa > 40% FX bụi nước/bùn/hơi nước, trọng số âm thanh theo nhịp)
 *   -> hình: trim chính xác theo khung + hflip (sửa hướng màn hình) + scale lanczos + chuẩn hoá phơi sáng từng cảnh (p50 ~76-84)
 *      + 1 đường cong toe/shoulder chung (chặn cháy kênh đỏ) + grain rất nhẹ (L10)
 *   -> âm thanh: stem Veo với bản đồ gain kịch tính từng cảnh (cân mức + giữ liền mạch tại điểm cắt) + crossfade 4-6 khung
 *      + nền ambience liên tục (tuỳ chọn) + nhạc nền hạ dưới tiếng nói/va chạm (tuỳ chọn)
 *      -> MỘT gain tĩnh về -14 LUFS + limiter true-peak nhẹ; cần ép > 3 dB thì chấp nhận -15/-16 LUFS; KHÔNG loudnorm động (L9)
 *   -> phụ đề thoại 1 dòng -> libx264 slow CRF16 1080p 24fps CFR -> báo cáo <outBaseName>_report.json kèm md5 nguồn (L11).
 *
 * Ghi chú typing: dùng 'fs' / 'path' / 'child_process' (không tiền tố node:) vì types/ambient.d.ts
 * khai báo rút gọn cho 'node:*' (thiếu statSync, spawnSync...).
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import os from 'os';
import crypto from 'crypto';

export type MasterPacing = 'viral-reel' | 'cinema' | 'fast';
export type ShotCategory = 'establishing' | 'acting' | 'action' | 'insert';

/** L8: nơi giám khảo thấy rõ nhịp diễn nhất trong take (giây theo clip nguồn): beat_in / beat_peak / beat_out. */
export interface BeatWindow {
  inSec: number;
  peakSec: number;
  outSec: number;
}

/** L11: đoạn [in, out) do dựng phim chỉ định (giây theo clip nguồn) — dùng nguyên, không chấm điểm lại. */
export interface ForcedWindow {
  inSec: number;
  outSec: number;
}

/** Khoảng FX che hành động (bụi nước / bùn / hơi nước) do giám khảo hoặc dựng phim đánh dấu; frac = tỉ lệ khung bị phủ (mặc định 1). */
export interface FxSpan {
  inSec: number;
  outSec: number;
  frac?: number;
}

export interface MasterShotInput {
  shotIdx: string;
  videoPath: string;
  beat?: string;
  shotSize?: string;
  hasDialogue?: boolean;
  subtitleVi?: string;
  voiceoverPath?: string;
  /** Câu thoại được nói (ngôn ngữ Veo nói) — dùng số từ để ước lượng độ dài lời nói khi dò giọng. */
  dialogueText?: string;
  /** L8: beat_in / beat_peak / beat_out của giám khảo — cửa sổ bắt buộc chứa beat_peak. */
  beatWindow?: BeatWindow;
  /** L11: dựng phim chỉ định đúng đoạn dùng (bỏ qua chấm điểm). */
  forceWindow?: ForcedWindow;
  /** L11: lật ngang (sửa hướng màn hình / trục 180°). */
  hflip?: boolean;
  /** Nhịp diễn (bible actingBeatEn) — nhận biết nhịp lắng (mercy/relief/daze...) cho trọng số âm thanh và bản đồ gain. */
  actingBeat?: string;
  /** Hành động (bible actionEn) — nhận biết va chạm / gầm (nhịp hành động). */
  action?: string;
  /** Khoảng FX đã biết (giám khảo nhìn khung dày) — gộp với ước lượng FX của engine. */
  fxSpans?: FxSpan[];
  /** Ghi đè độ lệch mức kịch tính (dB) của cảnh trong bản đồ gain. */
  gainOffsetDb?: number;
}

export interface MasterOptions {
  ffmpegPath: string;
  outDir: string;
  outBaseName?: string; // mặc định 'MASTER_FINAL_MOVIE'
  subtitleBaseName?: string; // mặc định 'master_subtitles'
  aspectRatio: string;
  pacing: MasterPacing;
  subtitles: 'dialogue' | 'none';
  musicPath?: string;
  narration?: 'none' | 'vo';
  targetLufs?: number; // -14
  truePeakDb?: number; // -1.5
  grain?: boolean; // mặc định true (rất nhẹ)
  fps?: number; // 24
  keepWorkFiles?: boolean;
  log?: (msg: string) => void;
  /** Nền ambience liên tục (lặp với crossfade, ~16 LU dưới stem). */
  ambiencePath?: string;
  /** Ambience thấp hơn stem bao nhiêu LU (mặc định 16). */
  ambienceBelowStemLu?: number;
  /** Crossfade âm thanh tại mỗi điểm cắt, tính theo khung (mặc định 5, khuyến nghị 4-6). */
  audioCrossfadeFrames?: number;
  /** Mức integrated thấp nhất chấp nhận khi limiter phải ép quá maxLimiterGainReductionDb (mặc định -16). */
  minIntegratedLufs?: number;
  /** Limiter ép đỉnh tối đa (dB) trước khi hạ mục tiêu (mặc định 3). */
  maxLimiterGainReductionDb?: number;
  /** "~3 dB": đỉnh hiếm (<= 1% khối 10 ms) được ép thêm tối đa chừng này dB (mặc định 1). 0 = trần cứng. */
  limiterSlackDb?: number;
  /** Bản đồ gain kịch tính từng cảnh (mặc định bật). */
  gainMap?: boolean;
  /** Khoảng LRA mong muốn (mặc định [8, 11]). */
  lraRange?: [number, number];
  /** Chuẩn hoá phơi sáng từng cảnh (mặc định bật). */
  exposureNormalize?: boolean;
  /** p50 luma mục tiêu (0-255, mặc định 80 ± 4). */
  exposureTargetP50?: number;
  /** Đường cong toe/shoulder (cú pháp curves của ffmpeg); false = tắt. */
  toneCurve?: string | false;
  /** Mờ dần hình + tiếng ở cuối phim (giây, mặc định 0.5; 0 = tắt). */
  endFadeSec?: number;
  /** Loại cửa sổ có khung giữa bị FX phủ quá tỉ lệ này (mặc định 0.4). */
  maxMidFxFrac?: number;
  /** L10: cảnh có độ sáng góc trên-phải / tâm vượt ngưỡng này được thêm vai sáng mềm ở góc (mặc định 1.8; 0 = tắt). */
  flareRatioMax?: number;
}

export interface MasterSourceInfo {
  shotIdx: string;
  videoPath: string;
  md5: string | null;
  bytes: number;
}

export interface ExposurePlan {
  black: number;
  gamma: number;
  white: number;
  p1Src: number;
  p50Src: number;
  p99Src: number;
  redClipSrc: number;
  p1Out: number;
  p50Out: number;
  p99Out: number;
  redClipOut: number;
  note?: string;
  /** L10: độ sáng góc trên-phải / tâm của cảnh (khung mẫu trong cửa sổ). */
  cornerCentreRatio?: number | null;
  /** L10: đã thêm vai sáng mềm (roll-off) cho góc trên-phải vì cornerCentreRatio > ngưỡng. */
  flareRolloff?: boolean;
}

export interface MasterShotReport {
  shotIdx: string;
  inSec: number;
  outSec: number;
  durSec: number;
  masterStartSec: number;
  forced: boolean;
  hflip: boolean;
  beatWindow?: BeatWindow;
  beatPeakInWindow?: boolean;
  fxMid?: number;
  audio: {
    winLufs: number | null;
    headLufs: number | null;
    tailLufs: number | null;
    offsetDb: number;
    gainDb: number;
    /** Gain theo bản đồ kịch tính trước khi áp trần đỉnh. */
    dramaticGainDb?: number;
    /** Mức short-term (1 s to nhất) dùng cho bản đồ gain. */
    levelLufs?: number | null;
    /** Cách nối tiếng ở điểm cắt VÀO cảnh này (crossfade / J-cut / L-cut). */
    lapIn?: CutLap | null;
    /** Sửa đỉnh nhọn cô lập (giây theo clip nguồn). */
    repairs?: Array<{ atSec: number; durMs: number; attDb: number }>;
  };
  exposure?: ExposurePlan | null;
}

export interface CutJumpReport {
  cutsSec: number[];
  jumpsDb: number[];
  medianAbsDb: number | null;
  maxAbsDb: number | null;
}

export interface MasterAudioReport {
  policy: string;
  crossfadeFrames: number;
  gainMap: boolean;
  gainMapSpread: number;
  limiterSlackDb?: number;
  limiterReleaseMs?: number;
  /** % khối 10 ms limiter chạm tới / vượt maxGr dB (tiêu chí: vượt <= 1%). */
  limiterLimitedBlockPct?: number | null;
  limiterOverBudgetBlockPct?: number | null;
  /** Các mục tiêu đã thử trên premix thật (vòng kín) và mục tiêu được chọn. */
  goalSearch?: Array<{ goalLufs: number; integratedLufs: number | null; lra: number | null; truePeakDb: number | null; maxGr: number; overPct: number; accepted: boolean }>;
  plan?: {
    spreadNeg: number;
    spreadPos: number;
    cutWeight: number;
    predicted: AudioPlan['predicted'];
    ok: boolean;
  };
  staticGainDb: number | null;
  limiterCeilingDb: number | null;
  limiterMaxGainReductionDb: number | null;
  targetLufs: number;
  goalLufs: number;
  premix: { integratedLufs: number | null; truePeakDb: number | null; lra: number | null };
  ambience: { path: string; lufs: number | null; gainDb: number; belowStemLu: number } | null;
  music: { path: string; lufs: number | null; gainDb: number } | null;
  cutJumps: CutJumpReport | null;
  premixCutJumps: CutJumpReport | null;
}

export interface MasterPictureReport {
  toneCurve: string | null;
  exposureNormalize: boolean;
  targetP50: number;
  p1Luma: number | null;
  p50Luma: number | null;
  p99Luma: number | null;
  redClipPct: number | null;
  cornerCentreRatio: number | null;
  cutExposureJumps: number[];
  medianCutExposureJump: number | null;
}

export interface MasterReport {
  masterPath: string;
  srtPath: string;
  assPath: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  shotCount: number;
  avgShotSec: number;
  medianShotSec: number;
  windows: Array<{ shotIdx: string; inSec: number; outSec: number; reason: string; forced?: boolean; hflip?: boolean; beatPeakSec?: number; fxMid?: number }>;
  measured: { integratedLufs: number | null; truePeakDb: number | null; lra: number | null };
  warnings: string[];
  frameCount?: number | null;
  expectedFrameCount?: number;
  encoderDupFrames?: number | null;
  encoderDropFrames?: number | null;
  loudnormMode?: string;
  limiterCeilingDb?: number | null;
  limiterGainReductionDb?: number | null;
  integratedTargetLufs?: number;
  stemLufs?: number | null;
  captionCount?: number;
  pacing?: MasterPacing;
  // r3
  reportPath?: string;
  engineVersion?: string;
  createdAt?: string;
  outBaseName?: string;
  sources?: MasterSourceInfo[];
  shots?: MasterShotReport[];
  audio?: MasterAudioReport;
  picture?: MasterPictureReport;
}

export interface MediaProbe {
  durationSec: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
}

export interface WindowChoice {
  inSec: number;
  outSec: number;
  reason: string;
  inFrame: number;
  outFrame: number;
  category: ShotCategory;
  sourceFrames: number;
  speechInSec?: number;
  speechOutSec?: number;
  speechConfidence?: number;
  /** Đoạn do dựng phim chỉ định (forceWindow). */
  forced?: boolean;
  /** beat_peak của giám khảo (giây nguồn) khi có beatWindow. */
  beatPeakSec?: number;
  /** Cửa sổ chứa beat_peak. */
  beatPeakInWindow?: boolean;
  /** Ước lượng tỉ lệ FX ở khung giữa cửa sổ (0..1). */
  fxMid?: number;
}

export interface SelectWindowParams {
  pacing: MasterPacing;
  beat?: string;
  shotSize?: string;
  hasDialogue?: boolean;
  fps?: number;
  isFinal?: boolean; // shot cuối: cho phép giữ lâu hơn (kết trên phản ứng)
  /** Số từ của câu thoại đã biết -> độ dài lời nói dự kiến (~2.6 từ/giây). */
  dialogueWords?: number;
  /** Hạt giống ổn định (vd. shotIdx) để độ dài các cảnh cùng loại không đều như máy đếm nhịp. */
  seed?: string;
  beatWindow?: BeatWindow;
  forceWindow?: ForcedWindow;
  actingBeat?: string;
  action?: string;
  fxSpans?: FxSpan[];
  /** Mặc định 0.4. */
  maxMidFxFrac?: number;
}

export interface ClipAnalysis {
  probe: MediaProbe;
  fps: number;
  frameCount: number;
  motion: number[]; // trung bình |Δluma| giữa khung k-1 và k (0..255)
  energyDb: number[]; // RMS toàn dải mỗi khung
  voiceDb: number[]; // RMS dải giọng nói 300-3400Hz mỗi khung
  lowDb: number[]; // RMS dải trầm < 250Hz (gầm, va chạm)
  highDb: number[]; // RMS dải cao > 4kHz (mưa, xì, tia nước)
  /** Ước lượng tỉ lệ khung bị FX (bùn / bụi nước / hơi nước) phủ, 0..1 mỗi khung. */
  fx?: number[];
}

export const MASTER_ENGINE_VERSION = 'premium-master-r3';
/** Toe/shoulder mềm: hạ trung tính ~2/255, đen sâu hơn, trắng chặn ở ~242 (hết cháy kênh đỏ). */
export const DEFAULT_TONE_CURVE = "0/0 0.09/0.04 0.5/0.48 0.85/0.84 1/0.95";

const SAMPLE_RATE = 48000;
const DEFAULT_XFADE_FRAMES = 5; // crossfade âm thanh 4-6 khung tại mỗi điểm cắt
const HEAD_GUARD_SEC = 0.25;
const TAIL_GUARD_SEC = 0.4;

const PACING_RANGES: Record<MasterPacing, Record<ShotCategory, [number, number]> & { dialogueMin: number; dialogueCap: number }> = {
  'viral-reel': {
    action: [1.2, 2.2],
    insert: [1.2, 2.2],
    acting: [2.0, 3.2],
    establishing: [2.2, 3.0],
    dialogueMin: 2.0,
    dialogueCap: 5.0,
  },
  cinema: {
    action: [2.5, 4.0],
    insert: [2.5, 3.5],
    acting: [3.0, 5.0],
    establishing: [3.5, 5.5],
    dialogueMin: 2.5,
    dialogueCap: 5.5,
  },
  fast: {
    action: [0.8, 1.3],
    insert: [0.8, 1.2],
    acting: [1.2, 1.8],
    establishing: [1.2, 1.8],
    dialogueMin: 1.5,
    dialogueCap: 5.0,
  },
};

const CATEGORY_WEIGHTS: Record<ShotCategory, { m: number; s: number; drift: number }> = {
  action: { m: 0.65, s: 0, drift: 0.1 },
  insert: { m: 0.55, s: 0.1, drift: 0.12 },
  acting: { m: 0.35, s: 0.15, drift: 0.22 },
  establishing: { m: 0.2, s: 0.35, drift: 0.28 },
};

// Nhịp lắng / nhịp hành động (L8 trọng số âm thanh, L9 bản đồ gain).
const STRONG_QUIET_RE = /(merc|relie|exhal|calm|gentl|tender|peace|forgiv|spare)/i;
const SOFT_QUIET_RE = /(daz|wary|soft|tired|exhaust|weary|sad|kind|hope|quiet|sigh|pride|proud|suspic|groggy)/i;
const IMPACT_ACTION_RE = /(land|strik|slam|\bhit|charg|crash|snap|smash|bash|butt|\bram|tackl|lunge|bite|stomp|stamp|roar|fall|tumbl|splash|swing|swipe|kick|punch|explo)/i;
const IMPACT_BEATS = new Set(['inciting', 'escalation', 'reversal', 'climax']);
/**
 * Hành động va chạm / di chuyển lớn (cùng nghĩa hasContactAction của premiumPromptEngine, chép lại để engine dựng không phụ thuộc):
 * khi không có nhịp của giám khảo, cửa sổ phải KẾT THÚC TRƯỚC cú va chạm đầu tiên (L4: cú va chạm rơi đúng điểm cắt, bán bằng âm thanh).
 */
const CONTACT_ACTION_RE =
  /\b(?:charg(?:e|es|ed|ing)|slam\w*|throw\w*|threw|tumbl\w*|collid\w*|bit(?:e|es|ing)\b(?!\s+(?:a|her|his|its|their|the)\s+(?:lower\s+)?lip)|leap\w*|lung(?:e|es|ed|ing)|rid(?:e|es|ing)\b|rode\b|run(?:s|ning)?\b|ran\b|blast\w*|tackl\w*|headbutt\w*|smash\w*|crash\w*|toppl\w*|chas(?:e|es|ed|ing)\b|sprint\w*|swe(?:ep|eps|eping|pt)\b)/i;

export function isContactActionText(action?: string): boolean {
  return CONTACT_ACTION_RE.test(String(action || ''));
}
const BEAT_GAIN_OFFSET_DB: Record<string, number> = { setup: -2.5, inciting: -1, escalation: 0, reversal: 1, climax: 2, resolution: -2.5 };

// ----------------------------------------------------------------------------
// ffmpeg helpers
// ----------------------------------------------------------------------------

export function resolveFfmpegPath(workspaceRoot?: string): string {
  const root = workspaceRoot || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const bin = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  // Engine nạp từ nơi khác (script tạm import qua file:///) -> thử thêm node_modules của thư mục đang chạy.
  const local = [root, process.cwd()].map((r) => path.join(r, 'node_modules', 'ffmpeg-static', bin)).find((p) => fs.existsSync(p));
  return local || 'ffmpeg';
}

/** Chấp nhận cả chuỗi kiểu getFfmpegBinary() của pipeline: `"C:\...\ffmpeg.exe" -nostdin`. */
export function normalizeFfmpegPath(p?: string): string {
  let s = String(p || '').trim();
  s = s.replace(/\s+-nostdin\s*$/i, '').trim();
  s = s.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  return s || resolveFfmpegPath();
}

function runFfmpeg(ffmpegPath: string, args: string[], timeoutMs = 600_000) {
  const res = spawnSync(ffmpegPath, ['-hide_banner', '-nostdin', ...args], {
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    timeout: timeoutMs,
    windowsHide: true,
  });
  return {
    status: res.status,
    stderr: String(res.stderr || ''),
    error: res.error ? String(res.error.message || res.error) : '',
  };
}

/** Chạy ffmpeg với filter graph đặt trong file (tránh giới hạn độ dài dòng lệnh trên Windows). */
function runWithGraphFile(ffmpegPath: string, preArgs: string[], graphFile: string, postArgs: string[], timeoutMs: number) {
  let r = runFfmpeg(ffmpegPath, [...preArgs, '-filter_complex_script', graphFile, ...postArgs], timeoutMs);
  if (r.status !== 0 && /Unrecognized option 'filter_complex_script'|Option filter_complex_script not found/i.test(r.stderr)) {
    r = runFfmpeg(ffmpegPath, [...preArgs, '-/filter_complex', graphFile, ...postArgs], timeoutMs);
  }
  return r;
}

/** Chạy ffmpeg và lấy stdout nhị phân (rawvideo / PCM). */
function runFfmpegBinary(ffmpegPath: string, args: string[], timeoutMs = 300_000): Buffer | null {
  const res = spawnSync(ffmpegPath, ['-hide_banner', '-nostdin', '-loglevel', 'error', ...args], {
    maxBuffer: 1024 * 1024 * 1024,
    timeout: timeoutMs,
    windowsHide: true,
  });
  const buf = res.stdout as unknown as Buffer;
  return buf && buf.length ? buf : null;
}

function tailOf(text: string, lines = 12): string {
  return text.split(/\r?\n/).filter(Boolean).slice(-lines).join('\n');
}

function fmtNum(n: number, digits = 6): string {
  return Number(n.toFixed(digits)).toString();
}

function round2(n: number | null | undefined): number | null {
  return n == null || !Number.isFinite(n) ? null : Number(n.toFixed(2));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function probeMedia(ffmpegPath: string, file: string): MediaProbe {
  const r = runFfmpeg(normalizeFfmpegPath(ffmpegPath), ['-i', file], 60_000);
  return parseProbe(r.stderr);
}

function parseProbe(stderr: string): MediaProbe {
  const d = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  const durationSec = d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0;
  const lines = stderr.split(/\r?\n/);
  const vLine = lines.find((l) => /Stream #\d+:\d+.*Video:/.test(l)) || '';
  const vBody = vLine.slice(vLine.indexOf('Video:'));
  const wh = /\b(\d{2,5})x(\d{2,5})\b/.exec(vBody);
  const fpsM = /([\d.]+)\s*fps/.exec(vBody) || /([\d.]+)\s*tbr/.exec(vBody);
  return {
    durationSec,
    width: wh ? Number(wh[1]) : 0,
    height: wh ? Number(wh[2]) : 0,
    fps: fpsM ? Number(fpsM[1]) : 0,
    hasAudio: lines.some((l) => /Stream #\d+:\d+.*Audio:/.test(l)),
  };
}

/** Đo EBU R128 (integrated, LRA, true peak) của một file. */
export function measureLoudness(ffmpegPath: string, file: string, maxSec?: number) {
  const args = ['-nostats', ...(maxSec ? ['-t', String(maxSec)] : []), '-i', file, '-vn', '-af', 'ebur128=peak=true:framelog=verbose', '-f', 'null', '-'];
  const r = runFfmpeg(normalizeFfmpegPath(ffmpegPath), args, 600_000);
  const idx = r.stderr.lastIndexOf('Summary:');
  const summary = idx >= 0 ? r.stderr.slice(idx) : '';
  const num = (re: RegExp) => {
    const m = re.exec(summary);
    if (!m) return null;
    if (/inf/i.test(m[1])) return m[1].startsWith('-') ? -120 : null;
    const v = Number(m[1]);
    return Number.isFinite(v) ? v : null;
  };
  return {
    integratedLufs: num(/I:\s*(-?[\d.]+|-?inf)\s*LUFS/),
    lra: num(/LRA:\s*(-?[\d.]+|-?inf)\s*LU\b/),
    truePeakDb: num(/Peak:\s*(-?[\d.]+|-?inf)\s*dBFS/),
  };
}

function countVideoFrames(ffmpegPath: string, file: string): number | null {
  // Phải decode: với -c copy ffmpeg 6.x không in "frame=".
  const r = runFfmpeg(ffmpegPath, ['-i', file, '-map', '0:v:0', '-f', 'null', '-'], 600_000);
  const all = [...r.stderr.matchAll(/frame=\s*(\d+)/g)];
  return all.length ? Number(all[all.length - 1][1]) : null;
}

/** md5 của file nguồn (báo cáo truy vết: biết chính xác take nào đã vào master). */
export function fileMd5(file: string): string | null {
  try {
    return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
// Loudness BS.1770 (K-weighting) tính trong JS trên PCM — đo nhanh cửa sổ tuỳ ý (cửa sổ cảnh, 0.4 s quanh điểm cắt, LRA).
// ----------------------------------------------------------------------------

export interface LoudTrack {
  sr: number;
  n: number;
  /** Tổng tích luỹ năng lượng K-weighted (cộng các kênh) — prefix[i] = Σ_{k<i}. */
  prefix: Float64Array;
}

/** Giải mã âm thanh thành PCM float32 xen kênh, 48 kHz. */
export function decodePcm(ffmpegPath: string, file: string, channels = 2, startSec = 0, durSec = 0): Float32Array | null {
  const buf = runFfmpegBinary(normalizeFfmpegPath(ffmpegPath), [
    ...(startSec > 0 ? ['-ss', fmtNum(startSec, 4)] : []),
    '-i', file,
    ...(durSec > 0 ? ['-t', fmtNum(durSec, 4)] : []),
    '-map', '0:a:0', '-vn', '-ac', String(channels), '-ar', String(SAMPLE_RATE), '-f', 'f32le', 'pipe:1',
  ]);
  if (!buf) return null;
  const usable = buf.length - (buf.length % 4);
  const copy = new Uint8Array(usable);
  copy.set(buf.subarray(0, usable));
  return new Float32Array(copy.buffer);
}

/** Lọc K-weighting (BS.1770-4, hệ số 48 kHz) và tích luỹ năng lượng. */
export function kWeightedTrack(pcm: Float32Array, channels: number, sr = SAMPLE_RATE): LoudTrack {
  const n = Math.floor(pcm.length / Math.max(1, channels));
  const energy = new Float64Array(n);
  const b0 = 1.53512485958697, b1 = -2.69169618940638, b2 = 1.19839281085285, a1 = -1.69065929318241, a2 = 0.73248077421585;
  const c1 = -1.99004745483398, c2 = 0.99007225036621;
  for (let c = 0; c < channels; c++) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0, z1 = 0, z2 = 0;
    for (let i = 0; i < n; i++) {
      const x = pcm[i * channels + c];
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x;
      const z = y - 2 * y1 + y2 - c1 * z1 - c2 * z2;
      y2 = y1;
      y1 = y;
      z2 = z1;
      z1 = z;
      energy[i] += z * z;
    }
  }
  const prefix = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + energy[i];
  return { sr, n, prefix };
}

function lufsOfPower(p: number): number {
  return p > 1e-12 ? -0.691 + 10 * Math.log10(p) : -120;
}

/** Loudness (không gate) của đoạn mẫu [s0, s1). */
export function trackLoudness(t: LoudTrack, s0: number, s1: number): number {
  const a = clamp(Math.round(s0), 0, t.n);
  const b = clamp(Math.round(s1), 0, t.n);
  if (b <= a) return -120;
  return lufsOfPower((t.prefix[b] - t.prefix[a]) / (b - a));
}

/** Integrated loudness có gate (block 400 ms, bước 100 ms, gate tuyệt đối -70, tương đối -10 LU). */
export function gatedLoudness(t: LoudTrack, s0 = 0, s1 = t.n): number {
  const a = clamp(Math.round(s0), 0, t.n);
  const b = clamp(Math.round(s1), 0, t.n);
  const blk = Math.round(0.4 * t.sr);
  const hop = Math.round(0.1 * t.sr);
  if (b - a < blk) return trackLoudness(t, a, b);
  const powers: number[] = [];
  for (let s = a; s + blk <= b; s += hop) powers.push((t.prefix[s + blk] - t.prefix[s]) / blk);
  const abs = powers.filter((p) => lufsOfPower(p) > -70);
  if (!abs.length) return -120;
  const rel = lufsOfPower(abs.reduce((x, y) => x + y, 0) / abs.length) - 10;
  const gated = abs.filter((p) => lufsOfPower(p) > rel);
  return lufsOfPower(gated.reduce((x, y) => x + y, 0) / Math.max(1, gated.length));
}

/** LRA (EBU Tech 3342): short-term 3 s, bước 100 ms, gate -70 / -20 LU, p95 - p10. */
export function loudnessRange(t: LoudTrack, s0 = 0, s1 = t.n): number | null {
  const a = clamp(Math.round(s0), 0, t.n);
  const b = clamp(Math.round(s1), 0, t.n);
  const blk = Math.round(3 * t.sr);
  const hop = Math.round(0.1 * t.sr);
  if (b - a < blk) return null;
  const st: number[] = [];
  for (let s = a; s + blk <= b; s += hop) st.push((t.prefix[s + blk] - t.prefix[s]) / blk);
  const abs = st.filter((p) => lufsOfPower(p) > -70);
  if (abs.length < 2) return null;
  const rel = lufsOfPower(abs.reduce((x, y) => x + y, 0) / abs.length) - 20;
  const vals = abs.map(lufsOfPower).filter((l) => l > rel).sort((x, y) => x - y);
  if (vals.length < 2) return null;
  return percentile(vals, 0.95) - percentile(vals, 0.1);
}

/** Bước nhảy mức (dB) tại mỗi điểm cắt: loudness 0.4 s ngay sau trừ 0.4 s ngay trước (theo cách đo đã chốt cho L9). */
export function cutJumpsFromTrack(t: LoudTrack, cutsSec: number[], winSec = 0.4): CutJumpReport {
  const w = winSec * t.sr;
  const jumps = cutsSec.map((c) => {
    const s = c * t.sr;
    return Number((trackLoudness(t, s, s + w) - trackLoudness(t, s - w, s)).toFixed(2));
  });
  const abs = jumps.map((j) => Math.abs(j));
  return {
    cutsSec: cutsSec.map((c) => Number(c.toFixed(3))),
    jumpsDb: jumps,
    medianAbsDb: abs.length ? Number(percentile(abs, 0.5).toFixed(2)) : null,
    maxAbsDb: abs.length ? Number(Math.max(...abs).toFixed(2)) : null,
  };
}

/** Đo bước nhảy mức tại các điểm cắt của một file (0.4 s trước / sau mỗi điểm cắt). */
export function measureCutJumps(ffmpegPath: string, file: string, cutsSec: number[], winSec = 0.4): CutJumpReport | null {
  const pcm = decodePcm(ffmpegPath, file, 2);
  if (!pcm) return null;
  return cutJumpsFromTrack(kWeightedTrack(pcm, 2), cutsSec, winSec);
}

// ----------------------------------------------------------------------------
// Phân tích clip & chọn đoạn tốt nhất
// ----------------------------------------------------------------------------

function parseMetadataPrints(stderr: string): Map<string, Array<{ t: number; v: number }>> {
  const out = new Map<string, Array<{ t: number; v: number }>>();
  const lastT = new Map<string, number>();
  for (const line of stderr.split(/\r?\n/)) {
    const m = /^\[(Parsed_a?metadata_\d+) @ [^\]]+\]\s*(.*)$/.exec(line);
    if (!m) continue;
    const inst = m[1];
    const body = m[2];
    const tm = /pts_time:\s*(-?[\d.eE+-]+)/.exec(body);
    if (tm) {
      lastT.set(inst, Number(tm[1]));
      continue;
    }
    const kv = /^lavfi\.[\w.]+=(.*)$/.exec(body.trim());
    if (!kv || !lastT.has(inst)) continue;
    const raw = kv[1].trim();
    let v = /inf/i.test(raw) ? (raw.startsWith('-') ? -120 : 0) : Number(raw);
    if (!Number.isFinite(v)) v = -120;
    if (!out.has(inst)) out.set(inst, []);
    out.get(inst)!.push({ t: lastT.get(inst)!, v });
  }
  return out;
}

/**
 * Ước lượng tỉ lệ khung bị FX phủ (bùn bắn / bụi nước / hơi nước) — dùng để loại cửa sổ mà khung giữa chỉ thấy FX.
 * Nền = trung vị theo thời gian của clip (máy gần như tĩnh); tiền cảnh = điểm ảnh lệch nền > 28;
 * FX = tiền cảnh mang màu bùn (nâu bão hoà) hoặc trắng / lục lam nhạt sáng (bụi nước, hơi nước).
 * Giá trị = (FX / tiền cảnh) × min(1, diện tích FX / 15% khung): chỉ cao khi FX vừa lớn vừa át chủ thể.
 * Đã hiệu chỉnh trên dino_premium_v2: vương miện bùn shot 7 (3.5-4.25 s) 0.57-0.78, hơi thở shot 4 (5.75-6.75 s) ~0.5-0.6,
 * hơi nước che Tide shot 10 (2.25-3.25 s) ~0.45-0.54; cận mặt không FX < 0.3.
 */
export function estimateFxTrack(ffmpegPath: string, file: string, fps: number, frameCount?: number): number[] {
  const W = 96;
  const H = 54;
  const buf = runFfmpegBinary(normalizeFfmpegPath(ffmpegPath), ['-i', file, '-vf', `fps=${fps},scale=${W}:${H}:flags=area,format=rgb24`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']);
  const N = W * H;
  const frames = buf ? Math.floor(buf.length / (N * 3)) : 0;
  const total = Math.max(frameCount || 0, frames);
  const out = new Array<number>(total).fill(0);
  if (frames < 3 || !buf) return out;
  // Nền: trung vị theo thời gian (lấy tối đa 48 khung rải đều).
  const pick: number[] = [];
  const step = Math.max(1, frames / 48);
  for (let f = 0; f < frames && pick.length < 48; f += step) pick.push(Math.floor(f));
  const bg = new Float32Array(N * 3);
  const tmp = new Array<number>(pick.length);
  for (let i = 0; i < N * 3; i++) {
    for (let j = 0; j < pick.length; j++) tmp[j] = buf[pick[j] * N * 3 + i];
    tmp.sort((x, y) => x - y);
    bg[i] = tmp[Math.floor(tmp.length / 2)];
  }
  for (let f = 0; f < frames; f++) {
    let fg = 0;
    let fx = 0;
    const base = f * N * 3;
    for (let p = 0; p < N; p++) {
      const r = buf[base + p * 3];
      const g = buf[base + p * 3 + 1];
      const b = buf[base + p * 3 + 2];
      const d = Math.max(Math.abs(r - bg[p * 3]), Math.abs(g - bg[p * 3 + 1]), Math.abs(b - bg[p * 3 + 2]));
      if (d <= 28) continue;
      fg++;
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const sat = mx > 0 ? (mx - mn) / mx : 0;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      let hue = 0;
      if (mx > mn) {
        const dd = mx - mn;
        if (mx === r) hue = (((g - b) / dd) % 6 + 6) % 6;
        else if (mx === g) hue = (b - r) / dd + 2;
        else hue = (r - g) / dd + 4;
        hue *= 60;
      }
      // Bùn sẫm bão hoà (vương miện bùn shot 13 r3: lum < 25) cũng là bùn khi đủ bão hoà.
      const mud = hue >= 12 && hue <= 42 && ((sat >= 0.5 && lum >= 25 && lum <= 160) || (sat >= 0.6 && lum >= 12 && lum < 25));
      const spray = (sat < 0.3 && lum > 130) || (hue >= 150 && hue <= 210 && sat < 0.5 && lum > 110);
      if (mud || spray) fx++;
    }
    const fxArea = fx / N;
    const share = fxArea / Math.max(fg / N, 0.08);
    out[f] = Number((share * Math.min(1, fxArea / 0.15)).toFixed(3));
  }
  return out;
}

export function analyzeClip(ffmpegPath: string, file: string, fps: number, opts: { fx?: boolean } = {}): ClipAnalysis {
  const probe = probeMedia(ffmpegPath, file);
  const n = Math.max(1, Math.round(SAMPLE_RATE / fps));
  const parts = [
    `[0:v:0]fps=${fps},scale=192:-2,format=yuv420p,tblend=all_mode=difference,signalstats,metadata=mode=print:key=lavfi.signalstats.YAVG[vm]`,
  ];
  const maps = ['-map', '[vm]'];
  if (probe.hasAudio) {
    const stat = `asetnsamples=n=${n}:p=0,astats=metadata=1:reset=1,ametadata=mode=print:key=lavfi.astats.Overall.RMS_level`;
    parts.push(
      `[0:a:0]aresample=${SAMPLE_RATE},aformat=sample_fmts=fltp:channel_layouts=mono,asplit=4[af][av][al][ah]`,
      `[af]${stat}[ao1]`,
      `[av]highpass=f=300,highpass=f=300,lowpass=f=3400,lowpass=f=3400,${stat}[ao2]`,
      `[al]lowpass=f=250,lowpass=f=250,${stat}[ao3]`,
      `[ah]highpass=f=4000,highpass=f=4000,${stat}[ao4]`
    );
    maps.push('-map', '[ao1]', '-map', '[ao2]', '-map', '[ao3]', '-map', '[ao4]');
  }
  const r = runFfmpeg(
    ffmpegPath,
    ['-loglevel', 'repeat+info', '-nostats', '-i', file, '-filter_complex', parts.join(';'), ...maps, '-f', 'null', '-'],
    300_000
  );
  const prints = parseMetadataPrints(r.stderr);
  const keys = [...prints.keys()];
  const idxOf = (k: string) => Number(k.slice(k.lastIndexOf('_') + 1));
  const vKey = keys.find((k) => k.startsWith('Parsed_metadata_'));
  const aKeys = keys.filter((k) => k.startsWith('Parsed_ametadata_')).sort((a, b) => idxOf(a) - idxOf(b));
  const vPts = vKey ? prints.get(vKey)! : [];

  let frameCount = 0;
  for (const p of vPts) frameCount = Math.max(frameCount, Math.round(p.t * fps) + 1);
  if (!frameCount) frameCount = Math.max(1, Math.round((probe.durationSec || 0) * fps));

  const toFrames = (pts: Array<{ t: number; v: number }>, fill: number) => {
    const arr = new Array<number>(frameCount).fill(fill);
    for (const p of pts) {
      const k = Math.round(p.t * fps);
      if (k >= 0 && k < frameCount) arr[k] = p.v;
    }
    return arr;
  };
  const motion = toFrames(vPts, 0);
  if (frameCount > 1) motion[0] = motion[1];
  const energyDb = aKeys[0] ? toFrames(prints.get(aKeys[0])!, -120) : new Array<number>(frameCount).fill(-120);
  const voiceDb = aKeys[1] ? toFrames(prints.get(aKeys[1])!, -120) : new Array<number>(frameCount).fill(-120);
  const lowDb = aKeys[2] ? toFrames(prints.get(aKeys[2])!, -120) : new Array<number>(frameCount).fill(-120);
  const highDb = aKeys[3] ? toFrames(prints.get(aKeys[3])!, -120) : new Array<number>(frameCount).fill(-120);
  const out: ClipAnalysis = { probe, fps, frameCount, motion, energyDb, voiceDb, lowDb, highDb };
  if (opts.fx !== false) {
    try {
      out.fx = estimateFxTrack(ffmpegPath, file, fps, frameCount).slice(0, frameCount);
    } catch {
      /* ước lượng FX là phụ — lỗi thì bỏ qua */
    }
  }
  return out;
}

/** Hash ổn định -> [0,1) (độ dài cảnh không đổi giữa các lần dựng lại cùng một run). */
function seededUnit(seed: string): number {
  let h = 2166136261;
  for (const ch of String(seed || '')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10007) / 10007;
}

/** Ước lượng thời lượng câu nói theo số từ (~2.6 từ/giây + đệm), giới hạn 0.8-4.5s. */
export function expectedSpeechSec(words: number): number {
  return Math.min(4.5, Math.max(0.8, words / 2.6 + 0.3));
}

/**
 * Dò lời nói: mỗi khung có "độ giống giọng" = mức dải 300-3400Hz so với nền của clip × mức trội của dải giọng so với dải
 * trầm (gầm/va chạm) và dải cao (mưa/xì). Biết số từ -> tìm đoạn dài đúng bằng câu nói có điểm cao nhất; không biết -> cụm mạnh nhất.
 */
function detectSpeech(an: ClipAnalysis, words: number | undefined): { s: number; e: number; conf: number } | null {
  const F = an.frameCount;
  const fps = an.fps;
  const v = an.voiceDb;
  const floor = percentile(v, 0.2);
  const peak = percentile(v, 0.98);
  if (peak - floor < 6 || peak < -50) return null;
  // Âm thanh Veo (gầm, va chạm, mưa) thường nặng dải trầm/cao hơn hẳn dải giọng: so độ trội với mức NỀN của chính clip.
  const dom = v.map((db, k) => db - Math.max(an.lowDb[k] ?? -120, an.highDb[k] ?? -120));
  const domBase = percentile(dom, 0.5);
  const q = v.map((db, k) => {
    const level = Math.min(1, Math.max(0, (db - floor) / (peak - floor)));
    const relative = Math.min(1, Math.max(0, (dom[k] - domBase - 2) / 8));
    const absolute = Math.min(1, Math.max(0, (dom[k] + 3) / 9));
    return level * Math.max(relative, absolute);
  });
  const Q = [0];
  for (let k = 0; k < F; k++) Q.push(Q[k] + q[k]);
  if (words && words > 0) {
    const E = Math.min(F, Math.max(1, Math.round(expectedSpeechSec(words) * fps)));
    let best = { s: 0, score: -1 };
    for (let a = 0; a + E <= F; a++) {
      const score = (Q[a + E] - Q[a]) / E;
      if (score > best.score + 1e-9) best = { s: a, score };
    }
    if (best.score < 0.22) return null;
    // Bó sát vào phần thật sự có tiếng trong đoạn tìm được (không kéo dài cue khi câu ngắn hơn ước lượng).
    let s0 = best.s;
    let e0 = best.s + E;
    const thr = 0.35 * Math.max(...q.slice(s0, e0));
    while (s0 < e0 - 1 && q[s0] < thr) s0++;
    while (e0 > s0 + 1 && q[e0 - 1] < thr) e0--;
    return { s: s0, e: e0, conf: Number(best.score.toFixed(3)) };
  }
  const gap = Math.round(0.3 * fps);
  const clusters: Array<{ s: number; e: number; sum: number }> = [];
  for (let k = 0; k < F; k++) {
    if (q[k] < 0.4) continue;
    const last = clusters[clusters.length - 1];
    if (last && k - last.e <= gap) {
      last.e = k + 1;
      last.sum += q[k];
    } else clusters.push({ s: k, e: k + 1, sum: q[k] });
  }
  const real = clusters.filter((c) => c.e - c.s >= Math.round(0.25 * fps)).sort((a, b) => b.sum - a.sum);
  if (!real.length) return null;
  const c = real[0];
  return { s: c.s, e: c.e, conf: Number((c.sum / (c.e - c.s)).toFixed(3)) };
}

function percentile(values: number[], q: number): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const pos = Math.min(s.length - 1, Math.max(0, (s.length - 1) * q));
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

/** Map cỡ cảnh premium hoặc coverageType cũ về nhóm nhịp dựng. */
export function categorizeShot(shotSize?: string): ShotCategory {
  const s = String(shotSize || '').toUpperCase();
  if (s === 'EWS' || s === 'WS' || s === 'MASTER_ESTABLISHING') return 'establishing';
  if (s === 'CU' || s === 'MCU' || s === 'ECU' || s === 'KULESHOV_REACTION') return 'acting';
  if (s === 'INSERT' || s === 'INSERT_DETAIL_CUTAWAY') return 'insert';
  return 'action';
}

/** coverageType (pipeline cũ) -> cỡ cảnh premium gần nhất. */
export function shotSizeFromCoverage(coverageType?: string, shotIndex = 0): string {
  switch (String(coverageType || '').toUpperCase()) {
    case 'MASTER_ESTABLISHING':
      return shotIndex === 0 ? 'EWS' : 'WS';
    case 'OTS_CONFRONTATION':
      return 'OTS';
    case 'KULESHOV_REACTION':
      return 'CU';
    case 'INSERT_DETAIL_CUTAWAY':
      return 'INSERT';
    case 'POV_SUBJECTIVE':
      return 'POV';
    case 'LOW_ANGLE_HERO_APEX':
      return 'MS';
    default:
      return 'MS';
  }
}

/** Nhịp lắng (setup / mercy / relief / daze...) trừ khi hành động là va chạm. */
export function isQuietBeat(beat?: string, actingBeat?: string, action?: string): boolean {
  const b = String(beat || '').toLowerCase();
  const acting = String(actingBeat || '');
  const act = String(action || '');
  if (STRONG_QUIET_RE.test(acting)) return true;
  return (b === 'setup' || b === 'resolution' || SOFT_QUIET_RE.test(acting)) && !IMPACT_ACTION_RE.test(act);
}

/**
 * L8: trọng số năng lượng âm thanh khi chọn cửa sổ — dương cho nhịp hành động / va chạm, ÂM cho nhịp lắng
 * (setup, relief, mercy, daze, resolution: chọn đoạn yên hơn thay vì đoạn gầm to nhất).
 */
export function audioEnergyWeight(category: ShotCategory, beat?: string, actingBeat?: string, action?: string): number {
  if (isQuietBeat(beat, actingBeat, action)) return -0.15;
  const b = String(beat || '').toLowerCase();
  const impactBeat = IMPACT_BEATS.has(b);
  if (category === 'action' || category === 'insert') return impactBeat || IMPACT_ACTION_RE.test(String(action || '')) ? 0.3 : 0.15;
  if (category === 'acting') return impactBeat ? 0.12 : 0.05;
  return 0.1;
}

/** L9: độ lệch mức kịch tính của cảnh (dB): setup/resolution -2.5, mercy/relief -3, inciting -1, escalation 0, reversal +1, climax +2. */
export function beatGainOffsetDb(beat?: string, actingBeat?: string, action?: string): number {
  const b = String(beat || '').toLowerCase();
  let off = BEAT_GAIN_OFFSET_DB[b] ?? 0;
  const acting = String(actingBeat || '');
  if (STRONG_QUIET_RE.test(acting)) return -3;
  if (SOFT_QUIET_RE.test(acting) && !IMPACT_ACTION_RE.test(String(action || ''))) off = Math.min(off, -1.5);
  return off;
}

function fxTrackFor(an: ClipAnalysis, spans?: FxSpan[]): number[] {
  const F = an.frameCount;
  const fx = new Array<number>(F).fill(0);
  if (an.fx) for (let k = 0; k < F; k++) fx[k] = an.fx[k] ?? 0;
  for (const s of spans || []) {
    if (!s || !Number.isFinite(s.inSec) || !Number.isFinite(s.outSec)) continue;
    const frac = Number.isFinite(s.frac) ? clamp(Number(s.frac), 0, 1) : 1;
    const a = clamp(Math.floor(s.inSec * an.fps), 0, F);
    const b = clamp(Math.ceil(s.outSec * an.fps), 0, F);
    for (let k = a; k < b; k++) fx[k] = Math.max(fx[k], frac);
  }
  return fx;
}

function validBeatWindow(bw?: BeatWindow): bw is BeatWindow {
  return !!bw && [bw.inSec, bw.peakSec, bw.outSec].every((v) => Number.isFinite(v));
}

function validForcedWindow(fw?: ForcedWindow): fw is ForcedWindow {
  return !!fw && Number.isFinite(fw.inSec) && Number.isFinite(fw.outSec) && fw.outSec > fw.inSec;
}

/**
 * Chọn cửa sổ [in, out) từ một phân tích clip có sẵn (thuần tính toán — dùng được trong test).
 * Thứ tự ưu tiên: forceWindow (dựng phim) > beatWindow (giám khảo: bắt buộc chứa beat_peak) > thoại > chuyển động/âm thanh.
 */
export function chooseWindowFromAnalysis(an: ClipAnalysis, params: SelectWindowParams): WindowChoice {
  const fps = an.fps;
  const F = an.frameCount;
  const pacing: MasterPacing = PACING_RANGES[params.pacing] ? params.pacing : 'viral-reel';
  const ranges = PACING_RANGES[pacing];
  const category = categorizeShot(params.shotSize);
  const beat = String(params.beat || '').toLowerCase();
  const minStartF = Math.ceil(HEAD_GUARD_SEC * fps);
  const maxEndF = Math.floor(F - TAIL_GUARD_SEC * fps);
  const maxMidFx = Number.isFinite(params.maxMidFxFrac) ? Number(params.maxMidFxFrac) : 0.4;
  const fx = fxTrackFor(an, params.fxSpans);
  const sec = (f: number) => Number((f / fps).toFixed(4));
  const fxAt = (f: number) => Number((fx[clamp(f, 0, F - 1)] ?? 0).toFixed(3));
  const make = (a: number, b: number, reason: string, extra: Partial<WindowChoice> = {}): WindowChoice => ({
    inFrame: a,
    outFrame: b,
    inSec: sec(a),
    outSec: sec(b),
    reason,
    category,
    sourceFrames: F,
    fxMid: fxAt(a + Math.floor((b - a) / 2)),
    ...extra,
  });
  const sp = params.hasDialogue && an.probe.hasAudio ? detectSpeech(an, params.dialogueWords) : null;
  const speechExtra = (a: number, b: number): Partial<WindowChoice> =>
    sp && sp.e > a && sp.s < b ? { speechInSec: sec(Math.max(sp.s, a)), speechOutSec: sec(Math.min(sp.e, b)), speechConfidence: sp.conf } : {};

  // 0) L11: dựng phim chỉ định — dùng nguyên (chỉ lượng tử hoá theo khung và kẹp trong clip).
  if (validForcedWindow(params.forceWindow)) {
    const a = clamp(Math.round(params.forceWindow.inSec * fps), 0, Math.max(0, F - 1));
    const b = clamp(Math.round(params.forceWindow.outSec * fps), a + 1, F);
    const peakNote = validBeatWindow(params.beatWindow)
      ? (() => {
          const pk = Math.round(params.beatWindow.peakSec * fps);
          return pk >= a && pk < b ? `, chứa beat_peak ${params.beatWindow.peakSec}s` : `, KHÔNG chứa beat_peak ${params.beatWindow.peakSec}s`;
        })()
      : '';
    const extra: Partial<WindowChoice> = { forced: true, ...speechExtra(a, b) };
    if (validBeatWindow(params.beatWindow)) {
      const pk = Math.round(params.beatWindow.peakSec * fps);
      extra.beatPeakSec = params.beatWindow.peakSec;
      extra.beatPeakInWindow = pk >= a && pk < b;
    }
    return make(a, b, `forceWindow: dựng phim chỉ định ${sec(a)}-${sec(b)}s${peakNote}`, extra);
  }

  if (maxEndF - minStartF < Math.round(0.5 * fps)) {
    return make(0, F, `clip quá ngắn (${sec(F)}s) — dùng toàn bộ`);
  }

  // Tín hiệu dùng chung: chuyển động, năng lượng âm tương đối, điểm cắt sau hành động, cú nhảy hình.
  const w = { ...CATEGORY_WEIGHTS[category], e: audioEnergyWeight(category, beat, params.actingBeat, params.action) };
  if (beat === 'climax' || beat === 'escalation') w.m += 0.1;
  if (beat === 'setup' || beat === 'resolution') w.drift += 0.05;
  const d = an.motion;
  const med = percentile(d, 0.5);
  const p95 = percentile(d, 0.95);
  const norm = Math.max(p95, 2);
  const spikes: number[] = [];
  for (let k = 1; k < F; k++) {
    const nb = Math.max(d[k - 1] || 0, d[k + 1] || 0);
    if (d[k] > Math.max(4 * med, 18) && d[k] > 2.5 * nb) spikes.push(k);
  }
  const m = d.map((x) => Math.min(1.5, x / norm));
  // Năng lượng âm tương đối trong clip (Veo luôn to ~-15 LUFS nên thang tuyệt đối bị bão hoà).
  const eFloor = Math.max(-70, percentile(an.energyDb, 0.1));
  const eSpan = Math.max(6, percentile(an.energyDb, 0.95) - eFloor);
  const e = an.energyDb.map((db) => Math.min(1, Math.max(0, (db - eFloor) / eSpan)));
  // FX TƯƠNG ĐỐI trong clip: màu bối cảnh / sọc cam luôn cho ~0.1-0.2 → chỉ phần vượt trung vị mới là FX che hành động.
  // Phạt LIÊN TỤC (không chỉ trên cổng 0.4): bản dino_premium_v2 r3 có vương miện bùn 0.39 (shot 13) và cú nổ bùn 0.36 (shot 9),
  // đều dưới cổng nên bộ chọn rơi đúng vào đó.
  const fxMed = percentile(fx, 0.5);
  const fxSpanN = Math.max(0.12, percentile(fx, 0.95) - fxMed);
  const fxN = fx.map((v) => clamp(((v || 0) - fxMed) / fxSpanN, 0, 1.5));
  const SM = [0];
  const SM2 = [0];
  const SE = [0];
  const SFX = [0];
  const SFXN = [0];
  for (let k = 0; k < F; k++) {
    SM.push(SM[k] + m[k]);
    SM2.push(SM2[k] + m[k] * m[k]);
    SE.push(SE[k] + e[k]);
    SFX.push(SFX[k] + (fx[k] || 0));
    SFXN.push(SFXN[k] + fxN[k]);
  }
  // Điểm cắt: thưởng điểm ra ngay SAU khi một hành động vừa xong, phạt điểm ra giữa một cú chuyển động mạnh.
  const p75 = percentile(m, 0.75);
  const look = Math.max(2, Math.round(0.6 * fps));
  const cutQ = new Array<number>(F + 1).fill(0);
  const midSpike = new Array<number>(F + 1).fill(0);
  for (let b = 1; b <= F; b++) {
    let pre = 0;
    for (let k = Math.max(0, b - look); k < b; k++) pre = Math.max(pre, m[k]);
    const at = (m[b - 1] + (m[b] ?? m[b - 1])) / 2;
    cutQ[b] = pre > 0.25 ? Math.min(1, Math.max(0, (pre - at) / pre)) * Math.min(1, pre) : 0;
    midSpike[b] = Math.min(1, Math.max(0, (at - Math.max(p75, 0.2)) / Math.max(0.2, 1.5 - p75)));
  }
  const energyTerm = (a: number, L: number) => {
    const meanM = (SM[a + L] - SM[a]) / L;
    const varM = (SM2[a + L] - SM2[a]) / L - meanM * meanM;
    const meanE = (SE[a + L] - SE[a]) / L;
    return { meanM, meanE, v: w.m * meanM + w.e * meanE - w.s * Math.sqrt(Math.max(0, varM)) };
  };

  let [minSec, maxSec] = ranges[category];
  let targetFrac = 0.5;
  if (beat === 'climax' || beat === 'escalation') targetFrac = 0.35;
  if (beat === 'setup' || beat === 'resolution') targetFrac = 0.65;
  if (params.isFinal) {
    maxSec += 1.5;
    targetFrac = 0.85;
  }
  if (params.seed) targetFrac = Math.min(0.95, Math.max(0.05, targetFrac + (seededUnit(params.seed) - 0.5) * 0.5));

  // 1) L8: nhịp diễn của giám khảo — cửa sổ BẮT BUỘC chứa beat_peak (vào trước đỉnh >= 0.3 s, ra sau đỉnh >= ~4 khung);
  //    ưu tiên phủ [beat_in, beat_out]; chuyển động / âm thanh chỉ phân xử hoà; loại cửa sổ có khung giữa > 40% FX.
  if (validBeatWindow(params.beatWindow)) {
    const bw = params.beatWindow;
    const peakF = clamp(Math.round(bw.peakSec * fps), 0, F - 1);
    const bin = clamp(Math.round(Math.min(bw.inSec, bw.peakSec) * fps), 0, peakF);
    const bout = clamp(Math.round(Math.max(bw.outSec, bw.peakSec) * fps), peakF + 1, F);
    const leadF = Math.round(0.3 * fps);
    const tailF = Math.max(2, Math.round(0.17 * fps));
    const lo = Math.min(minStartF, Math.max(0, peakF - leadF));
    const hi = Math.max(maxEndF, Math.min(F, peakF + tailF + 1));
    const leadEff = Math.min(leadF, peakF - lo);
    const tailEff = Math.min(tailF, hi - peakF - 1);
    const span = bout - bin;
    let minF = Math.round((sp ? ranges.dialogueMin : minSec) * fps);
    let maxF = Math.round((sp ? ranges.dialogueCap : maxSec) * fps);
    if (span > maxF) maxF = Math.min(Math.round(maxF * 1.5), span);
    maxF = Math.max(1, Math.min(maxF, hi - lo));
    minF = Math.max(1, Math.min(minF, maxF));
    const targetF = minF + targetFrac * (maxF - minF);
    const actionLike = category === 'action' || category === 'insert' || IMPACT_ACTION_RE.test(String(params.action || ''));
    const pref = actionLike ? 0.62 : 0.5;
    let best: { score: number; a: number; L: number; cover: number; fxMid: number } | null = null;
    for (let L = minF; L <= maxF; L++) {
      for (let a = lo; a + L <= hi; a++) {
        if (a > peakF - leadEff || a + L < peakF + 1 + tailEff) continue;
        const ov = Math.max(0, Math.min(a + L, bout) - Math.max(a, bin));
        const cover = ov / span;
        const purity = ov / L;
        const pos = (peakF - a) / L;
        const fxMid = fx[a + Math.floor(L / 2)] || 0;
        const meanFx = (SFX[a + L] - SFX[a]) / L;
        let score = 1.0 * cover + 0.6 * purity - 0.35 * Math.abs(pos - pref) - (0.1 * Math.abs(L - targetF)) / Math.max(1, maxF - minF);
        score += 0.08 * energyTerm(a, L).v + 0.04 * cutQ[a + L] - 0.04 * midSpike[a + L];
        for (const s of spikes) if (s > a && s < a + L) score -= Math.min(s - a, a + L - s) < 0.4 * fps ? 0.3 : 0.1;
        if (fxMid > maxMidFx) score -= 3;
        score -= 0.25 * meanFx;
        score -= 0.15 * (fxN[a + Math.floor(L / 2)] || 0) + (0.1 * (SFXN[a + L] - SFXN[a])) / L;
        if (sp) score += (0.8 * Math.max(0, Math.min(a + L, sp.e) - Math.max(a, sp.s))) / Math.max(1, sp.e - sp.s);
        if (!best || score > best.score) best = { score, a, L, cover, fxMid };
      }
    }
    if (best) {
      const a = best.a;
      const b = best.a + best.L;
      const fxNote = best.fxMid > maxMidFx ? `, khung giữa vẫn ${Math.round(best.fxMid * 100)}% FX (không còn lựa chọn khác)` : '';
      return make(
        a,
        b,
        `beat: chứa beat_peak ${sec(peakF)}s, phủ ${Math.round(best.cover * 100)}% nhịp ${sec(bin)}-${sec(bout)}s của giám khảo${fxNote} (${pacing} ${sec(minF)}-${sec(maxF)}s)`,
        { beatPeakSec: bw.peakSec, beatPeakInWindow: peakF >= a && peakF < b, ...speechExtra(a, b) }
      );
    }
  }

  // 2) Thoại: giữ trọn câu nói (dò theo độ dài câu đã biết + độ trội của dải giọng), tối đa dialogueCap giây.
  let dialogueNote = '';
  if (params.hasDialogue) dialogueNote = an.probe.hasAudio ? ', thoại: không tách được giọng nói' : ', thoại: clip không có âm thanh';
  if (sp) {
    const capF = Math.round(ranges.dialogueCap * fps);
    const minF = Math.round(ranges.dialogueMin * fps);
    const spS = sp.s;
    const spE = Math.min(sp.e, spS + capF);
    let a = Math.max(minStartF, spS - Math.round(0.2 * fps));
    let b = Math.min(maxEndF, spE + Math.round(0.3 * fps));
    while (b - a < minF && (a > minStartF || b < maxEndF)) {
      if (b < maxEndF) b++;
      if (b - a < minF && a > minStartF) a--;
    }
    if (b - a > capF) b = a + capF;
    const clipped = spE > b || spS < a ? ' (lời thoại bị chạm biên clip)' : '';
    return make(
      a,
      b,
      `dialogue: giữ lời nói ${sec(spS)}-${sec(spE)}s${params.dialogueWords ? ` (~${params.dialogueWords} từ)` : ''}, độ tin ${sp.conf}${clipped} (${pacing}, tối đa ${ranges.dialogueCap}s)`,
      { speechInSec: sec(Math.max(spS, a)), speechOutSec: sec(Math.min(spE, b)), speechConfidence: sp.conf }
    );
  }

  // 3) Chuyển động + năng lượng âm (trọng số âm thanh theo nhịp) + phạt FX liên tục.
  //    Va chạm / di chuyển lớn (L4) không có nhịp giám khảo: cửa sổ kết thúc TRƯỚC cú va chạm đầu tiên (FX bùng lên / cú nhảy hình)
  //    và năng lượng âm của cú va chạm bị trừ điểm (trọng số âm) — cú va chạm thuộc về điểm cắt, không thuộc về cửa sổ.
  const contactLike = CONTACT_ACTION_RE.test(String(params.action || ''));
  let endF = maxEndF;
  let contactNote = '';
  if (contactLike) {
    const fromF = Math.max(minStartF + 1, Math.round(0.6 * fps));
    // Cú va chạm = FX bùng lên (từ mức yên < 0.5 lên >= 0.8 giữ 3 khung) hoặc cú nhảy hình; cắt trước điểm FX bắt đầu dâng.
    let impactF = -1;
    let calmF = -1;
    for (let k = Math.max(0, fromF - Math.round(0.5 * fps)); k < maxEndF; k++) {
      if (fxN[k] < 0.5) calmF = k;
      if (k < fromF) continue;
      const fxOnset = calmF >= 0 && fxN[k] >= 0.8 && (fxN[k + 1] ?? 0) >= 0.8 && (fxN[k + 2] ?? 0) >= 0.8;
      if (fxOnset || spikes.includes(k)) {
        impactF = fxOnset ? Math.min(k, calmF + 1) : k;
        break;
      }
    }
    const capF = impactF - Math.max(1, Math.round(0.1 * fps));
    if (impactF > 0 && capF - minStartF >= Math.round(minSec * fps)) {
      endF = capF;
      contactNote = `, va chạm: dừng trước ${sec(impactF)}s`;
    }
    w.e = Math.min(w.e, -0.1);
  }
  const usable = endF - minStartF;
  let minF = Math.min(usable, Math.round(minSec * fps));
  const maxF = Math.max(minF, Math.min(usable, Math.round(maxSec * fps)));
  minF = Math.max(1, minF);
  const targetF = minF + targetFrac * (maxF - minF);
  let best = { score: -Infinity, a: minStartF, L: minF, meanM: 0, meanE: 0, fxMid: 0 };
  for (let L = minF; L <= maxF; L++) {
    for (let a = minStartF; a + L <= endF; a++) {
      const et = energyTerm(a, L);
      const midK = a + Math.floor(L / 2);
      const fxMid = fx[midK] || 0;
      let score = et.v - w.drift * (a / F) - (0.15 * Math.abs(L - targetF)) / Math.max(1, maxF - minF) + 0.12 * cutQ[a + L] - 0.1 * midSpike[a + L];
      for (const s of spikes) {
        if (s > a && s < a + L) score -= Math.min(s - a, a + L - s) < 0.4 * fps ? 1.0 : 0.35;
      }
      if (fxMid > maxMidFx) score -= 1.5;
      score -= (0.3 * (SFX[a + L] - SFX[a])) / L;
      score -= 0.5 * (fxN[midK] || 0) + (0.5 * (SFXN[a + L] - SFXN[a])) / L;
      if (score > best.score) best = { score, a, L, meanM: et.meanM, meanE: et.meanE, fxMid };
    }
  }
  const spikeNote = spikes.length ? `, ${spikes.length} cú nhảy hình trong clip đã né` : '';
  const fxNote = best.fxMid > maxMidFx ? `, khung giữa ${Math.round(best.fxMid * 100)}% FX` : '';
  return make(
    best.a,
    best.a + best.L,
    `${category}${beat ? `/${beat}` : ''}: chuyển động ${best.meanM.toFixed(2)}, năng lượng âm ${best.meanE.toFixed(2)} (trọng số ${w.e >= 0 ? '+' : ''}${w.e})${spikeNote}${fxNote}${contactNote}${dialogueNote} (${pacing} ${minSec}-${maxSec}s)`
  );
}

/** Phân tích chuyển động từng khung + năng lượng âm thanh rồi chọn đoạn [in,out) tốt nhất (lượng tử hoá theo khung). */
export function selectBestWindow(ffmpegPath: string, videoPath: string, params: SelectWindowParams): WindowChoice {
  const fps = params.fps && params.fps > 0 ? params.fps : 24;
  return chooseWindowFromAnalysis(analyzeClip(normalizeFfmpegPath(ffmpegPath), videoPath, fps), { ...params, fps });
}

// ----------------------------------------------------------------------------
// Phụ đề
// ----------------------------------------------------------------------------

export function cleanCaptionText(text: string): string {
  return String(text || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/@[\p{L}\p{N}_:.-]+/gu, ' ')
    .replace(/\b[A-Z0-9]+(?:_[A-Z0-9]+)+\b/g, ' ')
    .replace(/[{}\\]/g, ' ')
    .replace(/["“”]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?…;:])/g, '$1')
    .trim();
}

/** Chia thành các cue 1 dòng <= maxChars, ưu tiên ngắt ở cuối câu, cân đối độ dài. */
export function splitCaption(text: string, maxChars = 42): string[] {
  const sentences = text.split(/(?<=[.!?…;])\s+/).filter(Boolean);
  const pieces: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= maxChars) {
      pieces.push(sentence);
      continue;
    }
    const words = sentence.split(' ').flatMap((wd) => {
      const parts: string[] = [];
      for (let i = 0; i < wd.length; i += maxChars) parts.push(wd.slice(i, i + maxChars));
      return parts;
    });
    const parts = Math.ceil(sentence.length / maxChars);
    const target = sentence.length / parts;
    let cur = '';
    for (const wd of words) {
      const next = cur ? `${cur} ${wd}` : wd;
      if (cur && (next.length > maxChars || cur.length >= target)) {
        pieces.push(cur);
        cur = wd;
      } else cur = next;
    }
    if (cur) pieces.push(cur);
  }
  const chunks: string[] = [];
  for (const p of pieces) {
    const last = chunks[chunks.length - 1];
    if (last && last.length + 1 + p.length <= maxChars) chunks[chunks.length - 1] = `${last} ${p}`;
    else chunks.push(p);
  }
  return chunks;
}

function srtTime(sec: number): string {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(r).padStart(3, '0')}`;
}

function assTime(sec: number): string {
  const cs = Math.max(0, Math.round(sec * 100));
  const h = Math.floor(cs / 360_000);
  const m = Math.floor((cs % 360_000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const r = cs % 100;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(r).padStart(2, '0')}`;
}

function buildAssHeader(W: number, H: number, title: string): string {
  const fontSize = Math.round(0.043 * Math.min(W, H));
  const outline = Math.max(2, Math.round(fontSize * 0.07));
  const marginV = Math.round(H * (H > W ? 0.15 : 0.06));
  const marginLR = Math.round(W * 0.06);
  return [
    '[Script Info]',
    `Title: ${title}`,
    'ScriptType: v4.00+',
    `PlayResX: ${W}`,
    `PlayResY: ${H}`,
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    'YCbCr Matrix: TV.709',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Dialogue,Arial,${fontSize},&H00FFFFFF,&H000000FF,&H00101010,&H8C000000,-1,0,0,0,100,100,0,0,1,${outline},1,2,${marginLR},${marginLR},${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    '',
  ].join('\n');
}

/** Escape đường dẫn cho option của filter ass/subtitles (gạch chéo xuôi + escape dấu ':' ổ đĩa). */
export function escapeFilterPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/:/g, '\\:');
}

export function resolveCanvas(aspectRatio: string): { width: number; height: number } {
  const m = /^\s*(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)\s*$/.exec(String(aspectRatio || '16:9'));
  const aw = m ? Number(m[1]) : 16;
  const ah = m ? Number(m[2]) : 9;
  const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
  if (!aw || !ah || aw === ah) return { width: 1080, height: 1080 };
  return aw > ah ? { width: even((1080 * aw) / ah), height: 1080 } : { width: 1080, height: even((1080 * ah) / aw) };
}

// ----------------------------------------------------------------------------
// Hình: đường cong toe/shoulder, chuẩn hoá phơi sáng từng cảnh, chặn cháy kênh đỏ, đo ảnh master (L10)
// ----------------------------------------------------------------------------

function parseCurvePoints(curve: string): Array<[number, number]> {
  const pts = String(curve || '')
    .trim()
    .split(/\s+/)
    .map((p) => p.split('/').map(Number) as [number, number])
    .filter((p) => p.length === 2 && p.every((v) => Number.isFinite(v)))
    .sort((a, b) => a[0] - b[0]);
  return pts.length >= 2 ? pts : [[0, 0], [1, 1]];
}

/** Spline bậc ba tự nhiên (giống interp=natural của filter curves). */
function naturalSpline(pts: Array<[number, number]>): (x: number) => number {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const n = xs.length;
  const h: number[] = [];
  for (let i = 0; i < n - 1; i++) h.push(Math.max(1e-9, xs[i + 1] - xs[i]));
  const alpha = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) alpha[i] = (3 / h[i]) * (ys[i + 1] - ys[i]) - (3 / h[i - 1]) * (ys[i] - ys[i - 1]);
  const l = new Array<number>(n).fill(1);
  const mu = new Array<number>(n).fill(0);
  const z = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    l[i] = 2 * (xs[i + 1] - xs[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }
  const c = new Array<number>(n).fill(0);
  const b = new Array<number>(n).fill(0);
  const d = new Array<number>(n).fill(0);
  for (let j = n - 2; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (ys[j + 1] - ys[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let j = 0;
    while (j < n - 2 && x > xs[j + 1]) j++;
    const dx = x - xs[j];
    return ys[j] + b[j] * dx + c[j] * dx * dx + d[j] * dx * dx * dx;
  };
}

/** LUT 256 mức (0..255, số thực) của đường cong; false/'' = đồng nhất. */
export function toneCurveLut(curve: string | false | null | undefined): Float64Array {
  const lut = new Float64Array(256);
  if (!curve) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }
  const f = naturalSpline(parseCurvePoints(curve));
  for (let i = 0; i < 256; i++) lut[i] = clamp(f(i / 255), 0, 1) * 255;
  return lut;
}

function lutAt(lut: Float64Array, x: number): number {
  const v = clamp(x, 0, 255);
  const i = Math.floor(v);
  const j = Math.min(255, i + 1);
  return lut[i] + (lut[j] - lut[i]) * (v - i);
}

/** Biến đổi phơi sáng của một kênh (0..255): bỏ lớp đen nhấc (black), gamma, hệ số trắng, rồi đường cong chung. */
function exposureTransform(v: number, black: number, gamma: number, white: number, curve: Float64Array): number {
  const x = clamp((v / 255 - black) / Math.max(1e-6, 1 - black), 0, 1);
  return lutAt(curve, 255 * Math.pow(x, 1 / gamma) * white);
}

function histPercentile(hist: Float64Array, total: number, q: number): number {
  const target = q * total;
  let acc = 0;
  for (let i = 0; i < hist.length; i++) {
    acc += hist[i];
    if (acc >= target) return i;
  }
  return hist.length - 1;
}

/**
 * Tính kế hoạch phơi sáng cho một cảnh từ các điểm ảnh RGB mẫu (đã giải mã đúng ma trận màu nguồn):
 * kéo p50 luma (Rec.709) vào [target ± tol] bằng gamma (kẹp 0.85-1.35), bỏ lớp đen nhấc để p1 <= ~9,
 * chặn cháy kênh đỏ (R >= 250 sau biến đổi không quá 0.3% điểm ảnh) bằng hệ số trắng.
 */
export function planExposure(
  rgb: Uint8Array,
  o: { targetP50?: number; tolerance?: number; curve?: string | false; gammaRange?: [number, number]; maxBlack?: number; maxRedClip?: number } = {}
): ExposurePlan {
  const curve = toneCurveLut(o.curve === undefined ? DEFAULT_TONE_CURVE : o.curve);
  const target = Number.isFinite(o.targetP50) ? Number(o.targetP50) : 80;
  const tol = Number.isFinite(o.tolerance) ? Number(o.tolerance) : 4;
  const [gMin, gMax] = o.gammaRange || [0.85, 1.35];
  const maxB = Number.isFinite(o.maxBlack) ? Number(o.maxBlack) : 0.08;
  const maxRed = Number.isFinite(o.maxRedClip) ? Number(o.maxRedClip) : 0.003;
  const nPix = Math.floor(rgb.length / 3);
  const step = Math.max(1, Math.floor(nPix / 120000));
  const evalPlan = (B: number, G: number, Wp: number) => {
    const lut = new Float64Array(256);
    for (let v = 0; v < 256; v++) lut[v] = exposureTransform(v, B, G, Wp, curve);
    const hist = new Float64Array(256);
    let red = 0;
    let n = 0;
    for (let p = 0; p < nPix; p += step) {
      const r = lut[rgb[p * 3]];
      const g = lut[rgb[p * 3 + 1]];
      const b = lut[rgb[p * 3 + 2]];
      hist[clamp(Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b), 0, 255)]++;
      if (r >= 250) red++;
      n++;
    }
    return { p1: histPercentile(hist, n, 0.01), p50: histPercentile(hist, n, 0.5), p99: histPercentile(hist, n, 0.99), red: n ? red / n : 0 };
  };
  const src = (() => {
    const hist = new Float64Array(256);
    let red = 0;
    let n = 0;
    for (let p = 0; p < nPix; p += step) {
      const r = rgb[p * 3];
      hist[clamp(Math.round(0.2126 * r + 0.7152 * rgb[p * 3 + 1] + 0.0722 * rgb[p * 3 + 2]), 0, 255)]++;
      if (r >= 254) red++;
      n++;
    }
    return { p1: histPercentile(hist, n, 0.01), p50: histPercentile(hist, n, 0.5), p99: histPercentile(hist, n, 0.99), red: n ? red / n : 0 };
  })();
  if (!nPix) {
    return { black: 0, gamma: 1, white: 1, p1Src: 0, p50Src: 0, p99Src: 0, redClipSrc: 0, p1Out: 0, p50Out: 0, p99Out: 0, redClipOut: 0, note: 'không có điểm ảnh mẫu' };
  }
  const base = evalPlan(0, 1, 1);
  const desired = clamp(base.p50, target - tol, target + tol);
  // L10: sàn gamma 0.85 để p50 kẹt ở 85-90 trên cảnh quá sáng (shot 9: 117 -> 90) -> hạ sàn tới 0.75 khi vẫn trên target + tol.
  let gLo = gMin;
  const solveGamma = (B: number) => {
    let lo = gLo;
    let hi = gMax;
    const atLo = evalPlan(B, lo, 1);
    const atHi = evalPlan(B, hi, 1);
    if (atLo.p50 >= desired) return lo;
    if (atHi.p50 <= desired) return hi;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (evalPlan(B, mid, 1).p50 < desired) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  let B = 0;
  let G = solveGamma(0);
  let res = evalPlan(B, G, 1);
  if (!o.gammaRange && res.p50 > target + tol && G <= gLo + 1e-3 && gLo > 0.75) {
    gLo = 0.75;
    G = solveGamma(0);
    res = evalPlan(B, G, 1);
  }
  if (res.p1 > 10) {
    for (let b = 0.005; b <= maxB + 1e-9; b += 0.005) {
      const g = solveGamma(b);
      const r2 = evalPlan(b, g, 1);
      B = b;
      G = g;
      res = r2;
      if (r2.p1 <= 9) break;
    }
  }
  let Wp = 1;
  if (res.red > maxRed) {
    let lo = 0.85;
    let hi = 1;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (evalPlan(B, G, mid).red > maxRed * 0.66) hi = mid;
      else lo = mid;
    }
    Wp = lo;
    res = evalPlan(B, G, Wp);
  }
  return {
    black: Number(B.toFixed(4)),
    gamma: Number(G.toFixed(4)),
    white: Number(Wp.toFixed(4)),
    p1Src: src.p1,
    p50Src: src.p50,
    p99Src: src.p99,
    redClipSrc: Number((src.red * 100).toFixed(3)),
    p1Out: res.p1,
    p50Out: res.p50,
    p99Out: res.p99,
    redClipOut: Number((res.red * 100).toFixed(3)),
  };
}

/** L10: độ sáng trung bình góc trên-phải (25% × 25%) / vùng tâm, trung vị trên các khung mẫu RGB (w × h). */
export function cornerCentreRatioOf(rgb: Uint8Array, w: number, h: number): number | null {
  const fsz = w * h * 3;
  const frames = fsz > 0 ? Math.floor(rgb.length / fsz) : 0;
  const ratios: number[] = [];
  for (let f = 0; f < frames; f++) {
    let corner = 0;
    let cn = 0;
    let centre = 0;
    let ce = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = f * fsz + (y * w + x) * 3;
        const lum = 0.2126 * rgb[i] + 0.7152 * rgb[i + 1] + 0.0722 * rgb[i + 2];
        if (x >= w * 0.75 && y < h * 0.25) {
          corner += lum;
          cn++;
        } else if (x >= w * 0.375 && x < w * 0.625 && y >= h * 0.375 && y < h * 0.625) {
          centre += lum;
          ce++;
        }
      }
    }
    if (cn && ce && centre > 0) ratios.push(corner / cn / (centre / ce));
  }
  return ratios.length ? Number(percentile(ratios, 0.5).toFixed(2)) : null;
}

/**
 * L10: vai sáng mềm cho góc trên-phải (mặt trời / lens flare): một đường cong chỉ nén vùng sáng, trộn bằng mặt nạ dốc tuyến tính
 * từ giữa khung ra góc (maskedmerge — nhanh, không geq từng khung). Đo trên dino_premium_v2 r3: góc/tâm 2.52 -> ~2.0 mà p50 không đổi.
 */
export function flareRolloffGraph(inLabel: string, outLabel: string, W: number, H: number, fps: number, tag: string): string {
  // Dấu phẩy nằm trong nháy đơn của giá trị geq -> không cần escape ở mức filtergraph.
  const m = `255*clip((X/W-0.45)/0.55,0,1)*clip((0.55-Y/H)/0.55,0,1)`;
  return (
    `[${inLabel}]split=2[fra${tag}][frb${tag}];[frb${tag}]curves=all='0/0 0.35/0.33 1/0.6'[frc${tag}];` +
    `color=c=black:s=${W}x${H}:r=${fps}:d=${fmtNum(1 / fps, 5)},format=gbrp,geq=r='${m}':g='${m}':b='${m}'[frm${tag}];` +
    `[fra${tag}][frc${tag}][frm${tag}]maskedmerge[${outLabel}]`
  );
}

/** Lấy mẫu khung (RGB, giải mã đúng ma trận màu nguồn) đều trong [inSec, outSec). */
function sampleFramesRgb(ff: string, file: string, inSec: number, outSec: number, count = 10, w = 320, h = 180): Uint8Array | null {
  const dur = Math.max(0.05, outSec - inSec);
  const rate = Math.max(0.5, count / dur);
  const buf = runFfmpegBinary(ff, [
    ...(inSec > 0 ? ['-ss', fmtNum(inSec, 4)] : []),
    '-t', fmtNum(dur, 4),
    '-i', file,
    '-vf', `fps=${fmtNum(rate, 4)},scale=${w}:${h}:flags=area,format=rgb24`,
    '-frames:v', String(count),
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1',
  ]);
  return buf ? new Uint8Array(buf.buffer, buf.byteOffset, buf.length - (buf.length % 3)) : null;
}

/** Đo ảnh của master: p1/p50/p99 luma, % điểm ảnh cháy kênh đỏ (R >= 254), góc trên-phải / trung tâm, bước nhảy phơi sáng tại điểm cắt. */
export function measurePicture(ffmpegPath: string, file: string, cutsSec: number[] = [], fps = 24): MasterPictureReport {
  const ff = normalizeFfmpegPath(ffmpegPath);
  const out: MasterPictureReport = {
    toneCurve: null,
    exposureNormalize: false,
    targetP50: 0,
    p1Luma: null,
    p50Luma: null,
    p99Luma: null,
    redClipPct: null,
    cornerCentreRatio: null,
    cutExposureJumps: [],
    medianCutExposureJump: null,
  };
  const W = 640;
  const H = 360;
  const buf = runFfmpegBinary(ff, ['-i', file, '-vf', `fps=2,scale=${W}:${H}:flags=neighbor,format=rgb24`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']);
  if (buf) {
    const fsz = W * H * 3;
    const frames = Math.floor(buf.length / fsz);
    const hist = new Float64Array(256);
    let n = 0;
    let red = 0;
    const ratios: number[] = [];
    for (let f = 0; f < frames; f++) {
      let corner = 0;
      let cn = 0;
      let centre = 0;
      let ce = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = f * fsz + (y * W + x) * 3;
          const r = buf[i];
          const lum = 0.2126 * r + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2];
          hist[Math.round(lum)]++;
          n++;
          if (r >= 254) red++;
          if (x >= W * 0.75 && y < H * 0.25) {
            corner += lum;
            cn++;
          } else if (x >= W * 0.375 && x < W * 0.625 && y >= H * 0.375 && y < H * 0.625) {
            centre += lum;
            ce++;
          }
        }
      }
      if (cn && ce && centre > 0) ratios.push(corner / cn / (centre / ce));
    }
    if (n) {
      out.p1Luma = histPercentile(hist, n, 0.01);
      out.p50Luma = histPercentile(hist, n, 0.5);
      out.p99Luma = histPercentile(hist, n, 0.99);
      out.redClipPct = Number(((red / n) * 100).toFixed(3));
    }
    if (ratios.length) out.cornerCentreRatio = Number(percentile(ratios, 0.5).toFixed(2));
  }
  if (cutsSec.length) {
    const w = 64;
    const h = 36;
    const small = runFfmpegBinary(ff, ['-i', file, '-vf', `fps=${fps},scale=${w}:${h}:flags=area,format=rgb24`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']);
    if (small) {
      const fsz = w * h * 3;
      const frames = Math.floor(small.length / fsz);
      const mean = (f: number) => {
        let s = 0;
        for (let p = 0; p < w * h; p++) {
          const i = f * fsz + p * 3;
          s += 0.2126 * small[i] + 0.7152 * small[i + 1] + 0.0722 * small[i + 2];
        }
        return s / (w * h);
      };
      const lumas = new Array<number>(frames);
      for (let f = 0; f < frames; f++) lumas[f] = mean(f);
      for (const c of cutsSec) {
        const k = Math.round(c * fps);
        const pre = lumas.slice(Math.max(0, k - 6), k);
        const post = lumas.slice(k, Math.min(frames, k + 6));
        if (!pre.length || !post.length) continue;
        out.cutExposureJumps.push(Number((post.reduce((a, b) => a + b, 0) / post.length - pre.reduce((a, b) => a + b, 0) / pre.length).toFixed(1)));
      }
      if (out.cutExposureJumps.length) out.medianCutExposureJump = Number(percentile(out.cutExposureJumps.map(Math.abs), 0.5).toFixed(1));
    }
  }
  return out;
}

// ----------------------------------------------------------------------------
// Âm thanh: bản đồ gain kịch tính (L9)
// ----------------------------------------------------------------------------

export interface GainMapShot {
  /** Loudness có gate của cửa sổ (LUFS). */
  winLufs: number;
  /** Loudness 0.4 s đầu / cuối cửa sổ (LUFS). */
  headLufs: number;
  tailLufs: number;
  /** Độ lệch kịch tính mong muốn (dB). */
  offsetDb: number;
}

/**
 * Giải gain từng cảnh (dB) bằng bình phương tối thiểu:
 *   Σ λ (win_i + g_i − R − s·off_i)²  [mỗi cảnh về cùng một mức + độ lệch kịch tính]
 * + Σ μ ((head_{i+1} + g_{i+1}) − (tail_i + g_i) − s·(off_{i+1} − off_i))²  [không nhảy mức tại điểm cắt]
 * + Σ ν g_i²  [không đẩy / hạ quá tay]
 * Cảnh im lặng (< -60 LUFS) giữ gain 0.
 */
export interface GainMapOptions {
  levelWeight?: number;
  /** Trọng số liền mạch tại điểm cắt (mặc định 0.6). */
  cutWeight?: number;
  reg?: number;
  /** Hệ số nhân độ lệch kịch tính (cả hai phía); spreadNeg / spreadPos ghi đè từng phía. */
  spread?: number;
  /** Nhân độ lệch ÂM (nhịp lắng) — đào sâu đoạn yên để có LRA mà không đẩy đỉnh lên. */
  spreadNeg?: number;
  /** Nhân độ lệch DƯƠNG (cao trào). */
  spreadPos?: number;
  /** Huber (dB): bước nhảy lớn hơn mức này bị giảm trọng số (đuôi im lặng của một cảnh không kéo lệch cả bản đồ). */
  huberDb?: number;
  /** Mức biên (0.4 s đầu / cuối) không tính thấp hơn mức cảnh quá chừng này dB — đoạn lặng ở biên do nền ambience lấp (mặc định 10). */
  boundaryFloorDb?: number;
  maxBoostDb?: number;
  maxCutDb?: number;
  /** Trần gain từng cảnh (dB) — ví dụ để đỉnh không cần limiter ép quá 3 dB. */
  maxGainDb?: number[];
}

function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row) => row.slice());
  const v = b.slice();
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    [v[c], v[p]] = [v[p], v[c]];
    const piv = M[c][c] || 1e-12;
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / piv;
      if (!f) continue;
      for (let k = c; k < n; k++) M[r][k] -= f * M[c][k];
      v[r] -= f * v[c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let acc = v[r];
    for (let k = r + 1; k < n; k++) acc -= M[r][k] * x[k];
    x[r] = acc / (M[r][r] || 1e-12);
  }
  return x;
}

/**
 * Giải gain từng cảnh (dB) bằng bình phương tối thiểu:
 *   Σ λ (win_i + g_i − R − off'_i)²  [mỗi cảnh về cùng một mức + độ lệch kịch tính]
 * + Σ μ_c ((head_{i+1} + g_{i+1}) − (tail_i + g_i) − (off'_{i+1} − off'_i))²  [không nhảy mức tại điểm cắt; Huber]
 * + Σ ν g_i²  [không đẩy / hạ quá tay]
 * với off' = off × spreadNeg (off < 0) hoặc × spreadPos (off > 0); tuỳ chọn trần gain từng cảnh (active set).
 * Cảnh im lặng (< -60 LUFS) giữ gain 0.
 */
export function solveGainMap(shots: GainMapShot[], o: GainMapOptions = {}): number[] {
  const n = shots.length;
  if (!n) return [];
  const lam = o.levelWeight ?? 1;
  const mu = o.cutWeight ?? 0.6;
  const nu = o.reg ?? 0.02;
  const sNeg = o.spreadNeg ?? o.spread ?? 1;
  const sPos = o.spreadPos ?? o.spread ?? 1;
  const huber = o.huberDb ?? 0;
  const maxBoost = o.maxBoostDb ?? 12;
  const maxCut = o.maxCutDb ?? 15;
  const off = shots.map((x) => (x.offsetDb < 0 ? sNeg : sPos) * x.offsetDb);
  const live = shots.map((x) => Number.isFinite(x.winLufs) && x.winLufs > -60);
  const liveIdx = shots.map((_, i) => i).filter((i) => live[i]);
  if (!liveIdx.length) return shots.map(() => 0);
  const R = percentile(liveIdx.map((i) => shots[i].winLufs - off[i]), 0.5);
  const floorDb = o.boundaryFloorDb ?? 10;
  const bound = (x: number, level: number) => (Number.isFinite(x) && x > -70 ? Math.max(x, level - floorDb) : level);
  const cutK: number[] = [];
  for (let i = 0; i + 1 < n; i++) {
    const j = i + 1;
    cutK.push(bound(shots[j].headLufs, shots[j].winLufs) - bound(shots[i].tailLufs, shots[i].winLufs) - (off[j] - off[i]));
  }
  const caps = (o.maxGainDb || []).map((c) => (Number.isFinite(c) ? c : Infinity));
  const fixed = new Map<number, number>();
  let g = new Array<number>(n).fill(0);
  for (let pass = 0; pass <= n; pass++) {
    let w = cutK.map(() => mu);
    for (let irls = 0; irls < (huber > 0 ? 5 : 1); irls++) {
      const A: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
      const b = new Array<number>(n).fill(0);
      for (let i = 0; i < n; i++) {
        A[i][i] += nu;
        if (!live[i]) {
          A[i][i] += 1e6; // khoá gain = 0
          continue;
        }
        if (fixed.has(i)) {
          A[i][i] += 1e6;
          b[i] += 1e6 * fixed.get(i)!;
        }
        A[i][i] += lam;
        b[i] += lam * (R + off[i] - shots[i].winLufs);
      }
      for (let i = 0; i + 1 < n; i++) {
        const j = i + 1;
        if (!live[i] || !live[j]) continue;
        const m = w[i];
        A[i][i] += m;
        A[j][j] += m;
        A[i][j] -= m;
        A[j][i] -= m;
        b[i] += m * cutK[i];
        b[j] -= m * cutK[i];
      }
      g = solveLinear(A, b);
      if (huber > 0) {
        w = cutK.map((k, i) => {
          const r = Math.abs(g[i + 1] - g[i] + k);
          return r > huber ? (mu * huber) / r : mu;
        });
      }
    }
    // Trần gain (active set): cảnh vượt trần bị khoá đúng bằng trần rồi giải lại các cảnh còn lại.
    let added = false;
    for (let i = 0; i < n; i++) {
      const cap = Math.min(maxBoost, caps[i] ?? Infinity);
      if (live[i] && !fixed.has(i) && g[i] > cap + 1e-6) {
        fixed.set(i, cap);
        added = true;
      }
    }
    if (!added) break;
  }
  return g.map((v, i) => (live[i] ? Number(clamp(fixed.has(i) ? fixed.get(i)! : v, -maxCut, Math.min(maxBoost, caps[i] ?? Infinity)).toFixed(2)) : 0));
}

/** Một sửa đỉnh nhọn cô lập (giọt nước, tiếng tách): khối [b0, b1) của cửa sổ cảnh, hạ attDb. */
export interface TransientRepair {
  b0: number;
  b1: number;
  attDb: number;
}

export interface AudioPlanInput {
  /** Công suất K-weighted trung bình mỗi khối của cửa sổ từng cảnh (khối = 1/5 khung). */
  winPow: Float64Array[];
  /** Đỉnh mẫu (dBFS) mỗi khối của cửa sổ từng cảnh. */
  winPeakDb: Float32Array[];
  gm: GainMapShot[];
  /** Số khối mỗi giây. */
  bps: number;
  /** Công suất K-weighted mỗi khối của nền ambience (lặp vòng) — null nếu không có. */
  ambPow: Float64Array | null;
  ambBelowLu: number;
  targetLufs: number;
  minLufs: number;
  /** Trần limiter (dBFS) và mức ép tối đa cho phép (dB). */
  ceilDb: number;
  maxGrDb: number;
  /** "~3 dB": đỉnh hiếm được ép thêm tối đa chừng này dB (mặc định 1) nếu số khối 10 ms vượt maxGrDb <= maxOverBudgetFrac. */
  limiterSlackDb?: number;
  /** Tỉ lệ khối được phép vượt maxGrDb (mặc định 0.01 = 1%, tiêu chí của hội đồng đánh giá). */
  maxOverBudgetFrac?: number;
  /** Thời gian nhả của limiter (s) để mô hình hoá ảnh hưởng tới loudness / LRA (mặc định 0.04, giống limiter khi render). */
  limiterReleaseSec?: number;
  lraRange: [number, number];
  useGainMap: boolean;
  /** Công suất K-weighted các khối NGAY TRƯỚC điểm vào (theo thời gian, phần tử cuối sát điểm vào) — cho pre-lap (J-cut). */
  prePow?: Float64Array[];
  /** Công suất K-weighted các khối NGAY SAU điểm ra — cho post-lap (L-cut). */
  postPow?: Float64Array[];
  /** Đỉnh mẫu (dBFS) của các khối pre / post tương ứng. */
  prePeakDb?: Float32Array[];
  postPeakDb?: Float32Array[];
  /** Độ dài crossfade mặc định tại điểm cắt (khối). */
  xfadeBlocks?: number;
  /** Cận dưới LRA mà kế hoạch nhắm tới trên mô hình (mặc định lraRange[0] + 0.1). */
  lraAimLow?: number;
  /** Một cảnh được hạ dưới bản đồ kịch tính tối đa bao nhiêu dB để đỉnh vừa trần (mặc định 4). */
  maxPressureDb?: number;
  /** Lưới tham số thử (mặc định: nhịp lắng ×1..6, cao trào ×0/0.5/1, liền mạch 0.3/0.6/1.2). */
  grid?: { spreadNeg?: number[]; spreadPos?: number[]; cutWeight?: number[] };
  /** Ghi lại mọi phương án đã thử (gỡ lỗi / kiểm thử). */
  trace?: (plan: AudioPlan) => void;
  debug?: (msg: string) => void;
}

/** Cách nối tiếng tại một điểm cắt: crossfade ngắn đặt giữa, J-cut (tiếng cảnh sau vào sớm) hoặc L-cut (tiếng cảnh trước kéo dài). */
export interface CutLap {
  kind: 'xfade' | 'J' | 'L';
  /** Số khối tiếng của cảnh SAU nằm trước điểm cắt. */
  preBlocks: number;
  /** Số khối tiếng của cảnh TRƯỚC nằm sau điểm cắt. */
  postBlocks: number;
}

export interface AudioPlan {
  gains: number[];
  dramaticGains: number[];
  repairs: TransientRepair[][];
  cuts: CutLap[];
  goalLufs: number;
  staticGainDb: number;
  params: { spreadNeg: number; spreadPos: number; cutWeight: number };
  predicted: {
    /** Loudness premix (trước gain tĩnh). */
    integratedLufs: number;
    /** LRA / bước nhảy dự kiến SAU gain tĩnh + limiter. */
    lra: number | null;
    cutJumpMedianDb: number | null;
    maxGainReductionDb: number;
    ambienceGainDb: number | null;
    /** % khối (1/5 khung) limiter có tác động / vượt maxGrDb. */
    limitedBlockPct?: number;
    overBudgetBlockPct?: number;
  };
  cost: number;
  ok: boolean;
}

const TP_MARGIN_DB = 0.3; // đỉnh thật (true peak) cao hơn đỉnh mẫu ~0.3 dB
const LIMITER_RELEASE_SEC = 0.04; // limiter oversample 192 kHz: attack 5 ms, nhả 40 ms (ít "nén" loudness / LRA hơn 80 ms)
const MIN_LRA_FILM_SEC = 15; // phim ngắn hơn: bỏ ràng buộc / cảnh báo LRA (LRA dùng cửa sổ 3 s, không ổn định)
const LRA_MODEL_BIAS_LU = 0.5; // mô hình khối đánh giá LRA sau limiter thấp hơn thực đo ~0.5-0.8 LU (dino_premium_v2)

/**
 * L9: lập kế hoạch hỗn âm trên mô hình khối (nhanh, không render): bản đồ gain kịch tính (Huber, độ trải bất đối xứng),
 * sửa đỉnh nhọn cô lập (<= 40 ms, cao hơn mức xung quanh >= 14 dB), trần gain từng cảnh để limiter không phải ép quá maxGrDb,
 * rồi chọn mục tiêu -14 (hạ dần tới minLufs nếu buộc phải) với LRA trong khoảng và bước nhảy tại điểm cắt nhỏ nhất.
 */
export function planAudioMix(inp: AudioPlanInput): AudioPlan {
  const n = inp.gm.length;
  const bps = inp.bps;
  const lens = inp.winPow.map((p) => p.length);
  const totalB = lens.reduce((a, b) => a + b, 0);
  const starts: number[] = [];
  lens.reduce((acc, l) => (starts.push(acc), acc + l), 0);
  const cutsSec = starts.slice(1).map((s) => s / bps);
  const ambI = inp.ambPow ? gatedLoudness(trackFromPowers(inp.ambPow, bps)) : null;
  const [lraLo, lraHi] = inp.lraRange;
  const lraAim: [number, number] = [Number.isFinite(inp.lraAimLow) ? Number(inp.lraAimLow) : lraLo + 0.1, lraHi - 0.3];
  // Mức xung quanh (±0.2 s, bỏ chính nhóm khối đang xét) để nhận biết đỉnh nhọn cô lập.
  const localLoud = inp.winPow.map((p) => {
    const half = Math.round(0.2 * bps);
    const pre = new Float64Array(p.length + 1);
    for (let k = 0; k < p.length; k++) pre[k + 1] = pre[k] + p[k];
    return (k: number, e: number) => {
      const a = Math.max(0, k - half);
      const b = Math.min(p.length, e + half);
      const cnt = b - a - (e - k);
      return cnt > 0 ? lufsOfPower((pre[b] - pre[a] - (pre[e] - pre[k])) / cnt) : -120;
    };
  });

  const xfB = Math.max(1, Math.round(inp.xfadeBlocks ?? 25));
  const defaultLap = (): CutLap => ({ kind: 'xfade', preBlocks: Math.floor(xfB / 2), postBlocks: xfB - Math.floor(xfB / 2) });
  const virtual = (gains: number[], repairs: TransientRepair[][], laps?: CutLap[]) => {
    const stem = new Float64Array(totalB);
    const peak = new Float64Array(totalB).fill(-120);
    const shotPow: Float64Array[] = [];
    const shotPk: Float64Array[] = [];
    for (let i = 0; i < n; i++) {
      const f = Math.pow(10, gains[i] / 10);
      const p = inp.winPow[i];
      const pk = inp.winPeakDb[i];
      const sp = new Float64Array(p.length);
      const spk = new Float64Array(p.length);
      for (let k = 0; k < p.length; k++) {
        sp[k] = p[k] * f;
        spk[k] = (pk[k] ?? -120) + gains[i];
      }
      for (const r of repairs[i]) {
        for (let k = r.b0; k < r.b1 && k < sp.length; k++) {
          sp[k] *= Math.pow(10, -r.attDb / 10);
          spk[k] -= r.attDb;
        }
      }
      shotPow.push(sp);
      shotPk.push(spk);
      stem.set(sp, starts[i]);
      peak.set(spk, starts[i]);
    }
    // Đỉnh ước lượng của phần tiếng ngoài cửa sổ (pre/post-lap) từ công suất (giả định crest 12 dB).
    const pkFromPow = (pw: number) => lufsOfPower(pw) + 0.691 + 12;
    // Vùng chồng tiếng tại điểm cắt (crossfade công suất bằng nhau, qsin).
    for (let c = 0; c + 1 < n && laps; c++) {
      const lap = laps[c];
      const L = lap.preBlocks + lap.postBlocks;
      if (L <= 0) continue;
      const cut = starts[c + 1];
      const fa = Math.pow(10, gains[c] / 10);
      const fb = Math.pow(10, gains[c + 1] / 10);
      const pre = inp.prePow?.[c + 1];
      const post = inp.postPow?.[c];
      for (let k = cut - lap.preBlocks; k < cut + lap.postBlocks; k++) {
        if (k < 0 || k >= totalB) continue;
        const x = (k - (cut - lap.preBlocks) + 0.5) / L;
        const a = k < cut ? shotPow[c][shotPow[c].length - (cut - k)] ?? 0 : (post?.[k - cut] ?? 0) * fa;
        const b = k < cut ? (pre ? pre[pre.length - (cut - k)] ?? 0 : 0) * fb : shotPow[c + 1][k - cut] ?? 0;
        const ca = Math.cos((x * Math.PI) / 2);
        const sb = Math.sin((x * Math.PI) / 2);
        stem[k] = a * ca * ca + b * sb * sb;
        const prePk = inp.prePeakDb?.[c + 1];
        const postPk = inp.postPeakDb?.[c];
        const pa = k < cut ? shotPk[c][shotPk[c].length - (cut - k)] ?? -120 : postPk ? (postPk[k - cut] ?? -120) + gains[c] : pkFromPow(a);
        const pb = k < cut ? (prePk ? (prePk[prePk.length - (cut - k)] ?? -120) + gains[c + 1] : pkFromPow(b)) : shotPk[c + 1][k - cut] ?? -120;
        peak[k] = Math.max(pa + 20 * Math.log10(Math.max(1e-6, ca)), pb + 20 * Math.log10(Math.max(1e-6, sb)));
      }
    }
    let ambGain: number | null = null;
    const mix = new Float64Array(stem);
    if (inp.ambPow && ambI != null && ambI > -70) {
      const stemI = gatedLoudness(trackFromPowers(stem, bps));
      ambGain = stemI - inp.ambBelowLu - ambI;
      const af = Math.pow(10, ambGain / 10);
      for (let k = 0; k < totalB; k++) mix[k] += inp.ambPow[k % inp.ambPow.length] * af;
    }
    return { track: trackFromPowers(mix, bps), pow: mix, peak, ambGain };
  };

  // Mô hình gain tĩnh + limiter: GR tức thời mỗi khối = đỉnh + G + biên TP − trần; nhả theo hàm mũ (release);
  // G chỉnh 3 vòng để loudness SAU limiter đúng mục tiêu (giống vòng kiểm tra AAC khi render thật).
  const slack = Math.max(0, inp.limiterSlackDb ?? 1);
  const maxOverFrac = inp.maxOverBudgetFrac ?? 0.01;
  const relDecay = Math.exp(-1 / bps / Math.max(0.005, inp.limiterReleaseSec ?? LIMITER_RELEASE_SEC));
  const finalize = (gains: number[], repairs: TransientRepair[][], laps: CutLap[], goal: number) => {
    const v = virtual(gains, repairs, laps);
    const I0 = gatedLoudness(v.track);
    let G = goal - I0;
    let post = v.track;
    let maxGr = 0;
    let limited = 0;
    let over = 0;
    for (let it = 0; it < 3; it++) {
      const out = new Float64Array(totalB);
      const gf = Math.pow(10, G / 10);
      let gr = 0;
      maxGr = 0;
      limited = 0;
      over = 0;
      for (let k = 0; k < totalB; k++) {
        const inst = Math.max(0, v.peak[k] + G + TP_MARGIN_DB - inp.ceilDb);
        gr = Math.max(inst, gr * relDecay);
        maxGr = Math.max(maxGr, inst);
        if (gr > 0.1) limited++;
        if (inst > inp.maxGrDb) over++;
        out[k] = v.pow[k] * gf * Math.pow(10, -gr / 10);
      }
      post = trackFromPowers(out, bps);
      const I1 = gatedLoudness(post);
      if (Math.abs(goal - I1) < 0.02) break;
      G += goal - I1;
    }
    if (inp.debug) {
      let at = 0;
      for (let k = 0; k < totalB; k++) if (v.peak[k] + G + TP_MARGIN_DB - inp.ceilDb >= maxGr - 1e-9) at = k;
      inp.debug(`finalize goal ${goal}: I0 ${I0.toFixed(2)} G ${G.toFixed(2)} (naive ${(goal - I0).toFixed(2)}) maxGr ${maxGr.toFixed(2)} at block ${at} (${(at / bps).toFixed(3)}s) limited ${(100 * limited / totalB).toFixed(1)}% over ${(100 * over / totalB).toFixed(2)}%`);
    }
    return { v, I0, G, post, maxGr, limitedFrac: limited / Math.max(1, totalB), overFrac: over / Math.max(1, totalB) };
  };

  // Sửa đỉnh nhọn cô lập + trần gain theo đỉnh "kéo dài" (sustained) so với mức đỉnh cho phép B (dBFS premix).
  const peakPlan = (gains: number[], B: number) => {
    const caps: number[] = [];
    const repairs: TransientRepair[][] = [];
    for (let i = 0; i < n; i++) {
      const pk = inp.winPeakDb[i];
      const g = gains[i];
      const over = (k: number) => pk[k] + g + TP_MARGIN_DB > B;
      const reps: TransientRepair[] = [];
      let sustained = -Infinity;
      for (let k = 0; k < pk.length; k++) {
        if (!over(k)) continue;
        let e = k + 1;
        while (e < pk.length && (over(e) || (e + 1 < pk.length && over(e + 1)))) e++;
        let top = -Infinity;
        for (let q = k; q < e; q++) top = Math.max(top, pk[q]);
        const isolated = (e - k) / bps <= 0.04 && top - localLoud[i](k, e) >= 14;
        if (isolated) reps.push({ b0: Math.max(0, k - 1), b1: Math.min(pk.length, e + 1), attDb: Number(Math.min(12, top + g + TP_MARGIN_DB - B + 0.2).toFixed(2)) });
        else sustained = Math.max(sustained, top);
        k = e;
      }
      repairs.push(reps);
      caps.push(Number.isFinite(sustained) ? B - TP_MARGIN_DB - sustained : Infinity);
    }
    return { caps, repairs };
  };
  // J/L-cut: tại điểm cắt có một phía gần lặng, cho tiếng phía to lấn qua điểm cắt (tối đa ~0.42 s) thay vì đổi gain cả cảnh.
  const chooseLaps = (gains: number[], repairs: TransientRepair[][]) => {
    const laps: CutLap[] = [];
    for (let c = 0; c + 1 < n; c++) laps.push(defaultLap());
    const lapLimit = (c: number) => Math.floor(0.45 * Math.min(lens[c], lens[c + 1]));
    // Phần tiếng lấn qua điểm cắt chỉ được "nối" mức của chính phía đó (<= mức 0.4 s biên + 3 dB), không mang một sự kiện to hơn vào cảnh kia.
    const edgeLevel = (pw: Float64Array, fromEnd: boolean) => {
      const m = Math.min(pw.length, Math.round(0.4 * bps));
      let sum = 0;
      for (let q = 0; q < m; q++) sum += pw[fromEnd ? pw.length - 1 - q : q];
      return lufsOfPower(sum / Math.max(1, m));
    };
    const maxLevel = (pw: Float64Array | undefined, count: number, fromEnd: boolean) => {
      let mx = -120;
      if (!pw) return mx;
      const w = Math.max(1, Math.round(0.1 * bps));
      for (let q = 0; q + w <= count; q++) {
        let sum = 0;
        for (let r = q; r < q + w; r++) sum += pw[fromEnd ? pw.length - count + r : r] ?? 0;
        mx = Math.max(mx, lufsOfPower(sum / w));
      }
      return mx;
    };
    for (let c = 0; c + 1 < n; c++) {
      const opts: CutLap[] = [defaultLap()];
      const tailA = edgeLevel(inp.winPow[c], true);
      const headB = edgeLevel(inp.winPow[c + 1], false);
      const preOk = (cnt: number) => maxLevel(inp.prePow?.[c + 1], cnt, true) <= headB + 3;
      const postOk = (cnt: number) => maxLevel(inp.postPow?.[c], cnt, false) <= tailA + 3;
      const preAvail = inp.prePow?.[c + 1]?.length ?? 0;
      const postAvail = inp.postPow?.[c]?.length ?? 0;
      for (const m of [1, 2]) {
        const lapLen = m * xfB;
        const j: CutLap = { kind: 'J', preBlocks: Math.min(lapLen, preAvail), postBlocks: Math.min(5, postAvail) };
        const l: CutLap = { kind: 'L', preBlocks: Math.min(5, preAvail), postBlocks: Math.min(lapLen, postAvail) };
        if (j.preBlocks + j.postBlocks <= lapLimit(c) && j.preBlocks + j.postBlocks > xfB && preOk(j.preBlocks)) opts.push(j);
        if (l.preBlocks + l.postBlocks <= lapLimit(c) && l.preBlocks + l.postBlocks > xfB && postOk(l.postBlocks)) opts.push(l);
      }
      if (opts.length === 1) continue;
      const jumpOf = (o: CutLap) => {
        laps[c] = o;
        const t = virtual(gains, repairs, laps).track;
        return Math.abs(cutJumpsFromTrack(t, [cutsSec[c]]).jumpsDb[0]);
      };
      const base = jumpOf(opts[0]);
      let best = { o: opts[0], j: base };
      for (const o of opts.slice(1)) {
        const jv = jumpOf(o);
        if (jv < best.j - 1e-9) best = { o, j: jv };
      }
      laps[c] = best.j <= base - 1.5 ? best.o : opts[0];
    }
    return laps;
  };

  const evalCombo = (goal: number, sNeg: number, sPos: number, mu: number) => {
    const base: GainMapOptions = { spreadNeg: sNeg, spreadPos: sPos, cutWeight: mu, huberDb: 3, boundaryFloorDb: 10 };
    const dram = inp.useGainMap ? solveGainMap(inp.gm, base) : inp.gm.map(() => 0);
    const none: TransientRepair[][] = dram.map(() => []);
    const laps = chooseLaps(dram, none);
    // Trần theo đỉnh: hạ cảnh nào có đỉnh "kéo dài" vượt trần cứng (maxGr + slack); mức tích hợp giảm theo nên lặp tới khi ổn định
    // (tối đa 5 lượt, trần chỉ siết dần). Không đạt = mục tiêu này không khả thi (bộ chọn sẽ hạ mục tiêu).
    let gains = dram.slice();
    let repairs: TransientRepair[][] = none;
    let caps = dram.map(() => Infinity);
    let fin = finalize(gains, repairs, laps, goal);
    for (let pass = 0; pass < 5; pass++) {
      const B = inp.ceilDb + inp.maxGrDb + slack - fin.G;
      const pp = peakPlan(gains, B);
      repairs = pp.repairs;
      if (!gains.some((g, i) => g > pp.caps[i] + 0.05)) break;
      caps = caps.map((c, i) => Math.min(c, pp.caps[i]));
      gains = inp.useGainMap ? solveGainMap(inp.gm, { ...base, maxGainDb: caps }) : dram.map((g, i) => Math.min(g, caps[i]));
      fin = finalize(gains, repairs, laps, goal);
    }
    repairs = peakPlan(gains, inp.ceilDb + inp.maxGrDb + slack - fin.G).repairs;
    fin = finalize(gains, repairs, laps, goal);
    const v = fin.v;
    const I = fin.I0;
    const G = fin.G;
    const maxGr = fin.maxGr;
    const feasible = maxGr <= inp.maxGrDb + 0.15 || (maxGr <= inp.maxGrDb + slack + 0.15 && fin.overFrac <= maxOverFrac);
    const lra = loudnessRange(fin.post);
    const jumps = cutJumpsFromTrack(fin.post, cutsSec);
    // LRA (cửa sổ 3 s) chỉ có nghĩa với phim đủ dài.
    const lraMiss = lra == null || totalB / bps < MIN_LRA_FILM_SEC ? 0 : lra < lraAim[0] ? lraAim[0] - lra : lra > lraAim[1] ? lra - lraAim[1] : 0;
    const pressure = gains.map((g, i) => Math.max(0, dram[i] - g));
    const maxPress = Math.max(0, ...pressure);
    const repairDb = repairs.flat().reduce((a, r) => a + r.attDb, 0);
    const jm = jumps.medianAbsDb ?? 0;
    const cost =
      2 * (inp.targetLufs - goal) +
      1.5 * lraMiss +
      2 * Math.max(0, jm - 4.3) +
      0.1 * jm +
      0.3 * maxPress +
      0.05 * pressure.reduce((a, b) => a + b, 0) +
      0.02 * repairDb +
      0.5 * Math.max(0, maxGr - inp.maxGrDb) +
      (feasible ? 0 : 100 + maxGr);
    const ok = feasible && lraMiss < 0.01 && jm < 4.5 && maxPress <= (inp.maxPressureDb ?? 4);
    const plan: AudioPlan = {
      gains,
      dramaticGains: dram,
      repairs,
      cuts: laps,
      goalLufs: goal,
      staticGainDb: Number(G.toFixed(2)),
      params: { spreadNeg: sNeg, spreadPos: sPos, cutWeight: mu },
      predicted: {
        integratedLufs: Number(I.toFixed(2)),
        lra: lra == null ? null : Number(lra.toFixed(2)),
        cutJumpMedianDb: jumps.medianAbsDb,
        maxGainReductionDb: Number(Math.max(0, maxGr).toFixed(2)),
        ambienceGainDb: v.ambGain == null ? null : Number(v.ambGain.toFixed(2)),
        limitedBlockPct: Number((fin.limitedFrac * 100).toFixed(2)),
        overBudgetBlockPct: Number((fin.overFrac * 100).toFixed(2)),
      },
      cost: Number(cost.toFixed(3)),
      ok,
    };
    return plan;
  };

  const negs = inp.useGainMap ? inp.grid?.spreadNeg || [1, 2, 3, 4, 5, 6] : [1];
  const poss = inp.useGainMap ? inp.grid?.spreadPos || [0, 0.5, 1] : [1];
  const mus = inp.useGainMap ? inp.grid?.cutWeight || [0.3, 0.6, 1.2] : [0.6];
  let best: AudioPlan | null = null;
  for (let goal = inp.targetLufs; goal >= inp.minLufs - 1e-9; goal -= 0.25) {
    let bestGoal: AudioPlan | null = null;
    let bestOk: AudioPlan | null = null;
    for (const sNeg of negs) for (const sPos of poss) for (const mu of mus) {
      const p = evalCombo(goal, sNeg, sPos, mu);
      if (inp.trace) inp.trace(p);
      if (!bestGoal || p.cost < bestGoal.cost) bestGoal = p;
      if (p.ok && (!bestOk || p.cost < bestOk.cost)) bestOk = p;
    }
    if (bestOk) return bestOk; // mục tiêu cao nhất đạt mọi điều kiện
    if (bestGoal && (!best || bestGoal.cost < best.cost)) best = bestGoal;
  }
  return best!;
}

/** LoudTrack từ công suất trung bình mỗi khối (sr = số khối / giây). */
function trackFromPowers(pow: Float64Array, bps: number): LoudTrack {
  const prefix = new Float64Array(pow.length + 1);
  for (let k = 0; k < pow.length; k++) prefix[k + 1] = prefix[k] + pow[k];
  return { sr: bps, n: pow.length, prefix };
}

// ----------------------------------------------------------------------------
// Master
// ----------------------------------------------------------------------------

interface Segment {
  shot: MasterShotInput;
  win: WindowChoice;
  probe: MediaProbe;
  inputIdx: number;
  startF: number;
  lenF: number;
  voInputIdx?: number;
  voDelayMs?: number;
  voLufs?: number | null;
  /** cover = scale phủ kín + crop (cx: tâm crop ngang 0..1, mặc định giữa); fit-blur = giữ trọn khung trên nền mờ. */
  reframe?: { mode: 'cover' | 'fit-blur'; cx?: number };
  hflip: boolean;
  dramaticGainDb?: number;
  repairs?: TransientRepair[];
  /** Mức "short-term" của cảnh = loudness 1 s to nhất trong cửa sổ (dùng cho bản đồ gain). */
  levelLufs?: number | null;
  winLufs: number | null;
  headLufs: number | null;
  tailLufs: number | null;
  offsetDb: number;
  gainDb: number;
  exposure?: ExposurePlan | null;
}

function median(values: number[]): number {
  return percentile(values, 0.5);
}

/**
 * Trọng tâm chuyển động theo chiều ngang (0..1) và độ trải của nó, để đặt khung crop 9:16 vào nhân vật thay vì luôn crop giữa.
 * null = clip gần như tĩnh (giữ crop giữa).
 */
export function analyzeHorizontalFocus(
  ffmpegPath: string,
  file: string,
  inSec = 0,
  durSec = 0
): { cx: number; spread: number; cols: number[] } | null {
  const probe = probeMedia(ffmpegPath, file);
  if (!probe.width || !probe.height) return null;
  const W = 64;
  const H = Math.max(2, Math.round((W * probe.height) / probe.width / 2) * 2);
  const res = spawnSync(
    normalizeFfmpegPath(ffmpegPath),
    [
      '-hide_banner', '-nostdin', '-loglevel', 'error',
      ...(inSec > 0 ? ['-ss', fmtNum(inSec, 3)] : []),
      ...(durSec > 0 ? ['-t', fmtNum(durSec, 3)] : []),
      '-i', file,
      '-vf', `fps=8,scale=${W}:${H},format=gray,tblend=all_mode=difference`,
      '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1',
    ],
    { maxBuffer: 256 * 1024 * 1024, timeout: 120_000, windowsHide: true }
  );
  const buf: any = res.stdout;
  if (!buf || !buf.length) return null;
  const frame = W * H;
  const frames = Math.floor(buf.length / frame);
  if (frames < 2) return null;
  const col = new Array<number>(W).fill(0);
  for (let f = 1; f < frames; f++) {
    for (let y = 0; y < H; y++) {
      const row = f * frame + y * W;
      for (let x = 0; x < W; x++) {
        const v = buf[row + x];
        if (v > 6) col[x] += v;
      }
    }
  }
  if (col.reduce((a, b) => a + b, 0) < frames * H * 2) return null;
  // Mưa / nhiễu / máy rung tạo chuyển động đều khắp khung: trừ mức nền (trung vị cột) để chỉ còn chủ thể.
  const base = percentile(col, 0.5);
  const net = col.map((v) => Math.max(0, v - base));
  const total = net.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let cx = 0;
  for (let x = 0; x < W; x++) cx += ((x + 0.5) / W) * net[x];
  cx /= total;
  let v2 = 0;
  for (let x = 0; x < W; x++) v2 += Math.pow((x + 0.5) / W - cx, 2) * net[x];
  return { cx, spread: Math.sqrt(v2 / total), cols: net };
}

/** Cửa sổ crop (độ rộng frac của khung nguồn) chứa nhiều chuyển động chủ thể nhất: tâm cửa sổ + tỉ lệ chuyển động nằm trong nó. */
function bestCropWindow(cols: number[], frac: number): { cx: number; coverage: number } {
  const W = cols.length;
  const w = Math.max(1, Math.round(W * frac));
  const total = cols.reduce((a, b) => a + b, 0) || 1;
  let best = { start: Math.floor((W - w) / 2), sum: -1 };
  for (let s0 = 0; s0 + w <= W; s0++) {
    let sum = 0;
    for (let x = s0; x < s0 + w; x++) sum += cols[x];
    if (sum > best.sum) best = { start: s0, sum };
  }
  return { cx: (best.start + w / 2) / W, coverage: best.sum / total };
}

/** Biểu thức volume (eval=frame) giảm còn `floor` trong các cửa sổ [a,b] với dốc vào/ra `ramp` giây. */
function duckExpression(windows: Array<[number, number]>, floor: number, ramp = 0.25): string {
  const ws = windows.filter(([a, b]) => b > a);
  if (!ws.length) return '1';
  // Biểu thức nằm trong nháy đơn của đồ thị filter nên dấu phẩy không cần escape.
  const terms = ws.map(([a, b]) => `clip(min((t-${fmtNum(a - ramp, 3)})/${ramp},(${fmtNum(b + ramp, 3)}-t)/${ramp}),0,1)`);
  let w = terms[0];
  for (let i = 1; i < terms.length; i++) w = `max(${w},${terms[i]})`;
  return `1-${fmtNum(1 - floor, 4)}*${w}`;
}

const DEFAULT_MAX_LIMITER_GR_DB = 3; // limiter không được ép đỉnh quá 3 dB (giữ sức nặng cú va chạm ở cao trào)
const DEFAULT_MIN_INTEGRATED_LUFS = -16; // không đạt -14 trong giới hạn đó -> chấp nhận -15/-16 + cảnh báo (không loudnorm động)
const MUSIC_BELOW_STEM_LU = 10; // nhạc nền thấp hơn stem Veo 10 LU
const VO_ABOVE_STEM_LU = 4; // thuyết minh cao hơn stem Veo 4 LU
const DUCK_FLOOR = 0.4; // ≈ -8 dB dưới thoại / thuyết minh
const AAC_TP_MARGIN_DB = 0.25; // AAC làm đỉnh nhích lên ~0.1-0.2 dB (đo trên dino_premium_v2): limiter đặt trần thấp hơn mục tiêu TP

export function masterFilm(shots: MasterShotInput[], opts: MasterOptions): MasterReport {
  const ff = normalizeFfmpegPath(opts.ffmpegPath);
  const fps = opts.fps && opts.fps > 0 ? opts.fps : 24;
  const pacing: MasterPacing = PACING_RANGES[opts.pacing] ? opts.pacing : 'viral-reel';
  const outBase = opts.outBaseName || 'MASTER_FINAL_MOVIE';
  const subBase = opts.subtitleBaseName || 'master_subtitles';
  const targetLufs = Number.isFinite(opts.targetLufs) ? Number(opts.targetLufs) : -14;
  const truePeak = Number.isFinite(opts.truePeakDb) ? Number(opts.truePeakDb) : -1.5;
  const minLufs = Math.min(targetLufs, Number.isFinite(opts.minIntegratedLufs) ? Number(opts.minIntegratedLufs) : DEFAULT_MIN_INTEGRATED_LUFS);
  const maxGr = Number.isFinite(opts.maxLimiterGainReductionDb) ? Math.max(0, Number(opts.maxLimiterGainReductionDb)) : DEFAULT_MAX_LIMITER_GR_DB;
  const xfFrames = clamp(Math.round(Number.isFinite(opts.audioCrossfadeFrames) ? Number(opts.audioCrossfadeFrames) : DEFAULT_XFADE_FRAMES), 1, 12);
  const useGainMap = opts.gainMap !== false;
  const [lraLo, lraHi] = opts.lraRange && opts.lraRange.length === 2 ? opts.lraRange : [8, 11];
  const exposureOn = opts.exposureNormalize !== false;
  const targetP50 = Number.isFinite(opts.exposureTargetP50) ? Number(opts.exposureTargetP50) : 80;
  const toneCurve = opts.toneCurve === false ? null : typeof opts.toneCurve === 'string' && opts.toneCurve.trim() ? opts.toneCurve.trim() : DEFAULT_TONE_CURVE;
  const endFadeSec = Number.isFinite(opts.endFadeSec) ? Math.max(0, Number(opts.endFadeSec)) : 0.5;
  const ambBelow = Number.isFinite(opts.ambienceBelowStemLu) ? Number(opts.ambienceBelowStemLu) : 16;
  const grain = opts.grain !== false;
  const log = opts.log || ((msg: string) => console.log(msg));
  const { width: W, height: H } = resolveCanvas(opts.aspectRatio);
  const outDir = path.resolve(opts.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const workDir = path.join(outDir, `${outBase}_work`);
  fs.mkdirSync(workDir, { recursive: true });
  const warnings: string[] = [];
  const sampleAt = (frame: number) => Math.round((frame * SAMPLE_RATE) / fps);
  const wordCount = (t?: string) => String(t || '').trim().split(/\s+/).filter(Boolean).length;
  const aFmt = `aformat=sample_fmts=fltp:sample_rates=${SAMPLE_RATE}:channel_layouts=stereo`;

  // 1) Chọn đoạn cho từng shot
  const segs: Segment[] = [];
  const usable = shots.filter((s) => {
    const ok = !!s && !!s.videoPath && fs.existsSync(s.videoPath);
    if (!ok && s) warnings.push(`Shot ${s.shotIdx}: không tìm thấy video (${s.videoPath || 'trống'}) — bỏ qua.`);
    return ok;
  });
  if (!usable.length) throw new Error('masterFilm: không có clip video nào để dựng.');

  let cursorF = 0;
  let upscaled = 0;
  usable.forEach((shot, i) => {
    const an = analyzeClip(ff, shot.videoPath, fps);
    const win = chooseWindowFromAnalysis(an, {
      pacing,
      beat: shot.beat,
      shotSize: shot.shotSize,
      hasDialogue: !!shot.hasDialogue,
      dialogueWords: shot.hasDialogue ? wordCount(shot.dialogueText) || undefined : undefined,
      seed: `${shot.shotIdx}:${path.basename(shot.videoPath)}`,
      fps,
      isFinal: i === usable.length - 1,
      beatWindow: shot.beatWindow,
      forceWindow: shot.forceWindow,
      actingBeat: shot.actingBeat,
      action: shot.action,
      fxSpans: shot.fxSpans,
      maxMidFxFrac: opts.maxMidFxFrac,
    });
    const hflip = !!shot.hflip;
    if (win.beatPeakInWindow === false) {
      warnings.push(`Shot ${shot.shotIdx}: cửa sổ ${win.inSec}-${win.outSec}s KHÔNG chứa beat_peak ${win.beatPeakSec}s của giám khảo.`);
    }
    if ((win.fxMid ?? 0) > (Number.isFinite(opts.maxMidFxFrac) ? Number(opts.maxMidFxFrac) : 0.4)) {
      warnings.push(`Shot ${shot.shotIdx}: khung giữa cửa sổ ~${Math.round((win.fxMid ?? 0) * 100)}% FX (bùn / bụi nước / hơi nước) — kiểm tra hành động còn đọc được.`);
    }
    const p = an.probe;
    let reframe: Segment['reframe'] = { mode: 'cover' };
    if (p.width && p.height) {
      const srcAspect = p.width / p.height;
      const dstAspect = W / H;
      if (Math.abs(srcAspect - dstAspect) > 0.02) {
        // Phần nguồn còn lại sau khi scale phủ kín + crop.
        const keepFrac = srcAspect > dstAspect ? dstAspect / srcAspect : srcAspect / dstAspect;
        if (keepFrac >= 0.75) {
          warnings.push(`Shot ${shot.shotIdx}: nguồn ${p.width}x${p.height} khác tỉ lệ khung ${W}x${H} — scale phủ kín + crop giữa.`);
        } else if (srcAspect > dstAspect) {
          // Ngang -> dọc: đặt khung crop theo trọng tâm chuyển động; nhân vật trải rộng hơn khung -> giữ trọn khung trên nền mờ.
          const focus = analyzeHorizontalFocus(ff, shot.videoPath, win.inSec, win.outSec - win.inSec);
          // hflip lật trước khi crop -> lật cả phân bố chuyển động theo cột.
          const cols = focus ? (hflip ? [...focus.cols].reverse() : focus.cols) : null;
          const crop = cols ? bestCropWindow(cols, keepFrac) : null;
          if (crop && crop.coverage < 0.55) {
            reframe = { mode: 'fit-blur' };
            warnings.push(
              `Shot ${shot.shotIdx}: nguồn ${p.width}x${p.height} ngang, chủ thể trải rộng hơn khung ${W}x${H} (khung crop chỉ chứa ${Math.round(crop.coverage * 100)}% chuyển động) — giữ trọn khung trên nền mờ (nên quay lại bản ${opts.aspectRatio} trên Flow).`
            );
          } else {
            const cx = crop ? crop.cx : 0.5;
            reframe = { mode: 'cover', cx };
            warnings.push(
              `Shot ${shot.shotIdx}: nguồn ${p.width}x${p.height} ngang — crop ${W}x${H} theo chủ thể (x=${cx.toFixed(2)}${crop ? `, chứa ${Math.round(crop.coverage * 100)}% chuyển động` : ', clip tĩnh: crop giữa'}) (nên quay lại bản ${opts.aspectRatio} trên Flow).`
            );
          }
        } else {
          reframe = { mode: 'fit-blur' };
          warnings.push(`Shot ${shot.shotIdx}: nguồn ${p.width}x${p.height} dọc trong khung ngang ${W}x${H} — giữ trọn khung trên nền mờ.`);
        }
      }
      if (Math.min(p.width, p.height) < Math.min(W, H) * 0.9) upscaled++;
    }
    if (!p.hasAudio) warnings.push(`Shot ${shot.shotIdx}: clip không có âm thanh — chèn khoảng lặng.`);
    const lenF = win.outFrame - win.inFrame;
    segs.push({
      shot, win, probe: p, inputIdx: i, startF: cursorF, lenF, reframe, hflip,
      winLufs: null, headLufs: null, tailLufs: null,
      offsetDb: Number.isFinite(shot.gainOffsetDb) ? Number(shot.gainOffsetDb) : beatGainOffsetDb(shot.beat, shot.actingBeat, shot.action),
      gainDb: 0,
    });
    cursorF += lenF;
    log(`   -> ✂️  Shot ${shot.shotIdx}: ${win.inSec.toFixed(2)}s → ${win.outSec.toFixed(2)}s (${(lenF / fps).toFixed(2)}s)${hflip ? ' · hflip' : ''} · ${win.reason}`);
  });
  if (upscaled) {
    warnings.push(`${upscaled}/${segs.length} clip nguồn độ phân giải thấp hơn ${W}x${H} — đã upscale lanczos; dùng bản upscale 1080p của Flow để nét hơn.`);
  }
  const totalF = cursorF;
  const totalSec = totalF / fps;
  const lraMatters = totalSec >= MIN_LRA_FILM_SEC;
  const totalS = sampleAt(totalF);
  const cutsSec = segs.slice(1).map((s) => s.startF / fps);

  // Truy vết nguồn (L11): md5 từng clip đã dùng.
  const sources: MasterSourceInfo[] = segs.map((s) => {
    let bytes = 0;
    try {
      bytes = fs.statSync(s.shot.videoPath).size;
    } catch {}
    return { shotIdx: s.shot.shotIdx, videoPath: path.resolve(s.shot.videoPath), md5: fileMd5(s.shot.videoPath), bytes };
  });

  // Cửa sổ lời thoại trên dòng thời gian master (để hạ nhạc nền).
  const speechWindows: Array<[number, number]> = [];
  for (const s of segs) {
    if (!s.shot.hasDialogue) continue;
    const segStart = s.startF / fps;
    const segEnd = (s.startF + s.lenF) / fps;
    if (s.win.speechInSec != null && s.win.speechOutSec != null) {
      speechWindows.push([segStart + (s.win.speechInSec - s.win.inSec) - 0.1, Math.min(segEnd, segStart + (s.win.speechOutSec - s.win.inSec) + 0.2)]);
    } else speechWindows.push([segStart, segEnd]);
  }

  // 2) Đo âm thanh từng cửa sổ (JS, BS.1770): mức cả cửa sổ, 0.4 s đầu / cuối, công suất + đỉnh mỗi khối 1/5 khung
  //    (khối thẳng hàng với điểm cắt) -> mô hình khối để lập kế hoạch hỗn âm.
  const blk = Math.round(0.4 * SAMPLE_RATE);
  const blockLen = Math.max(1, Math.round(sampleAt(1) / 5));
  const bps = SAMPLE_RATE / blockLen;
  const winPow: Float64Array[] = [];
  const winPeakDb: Float32Array[] = [];
  const prePow: Float64Array[] = [];
  const postPow: Float64Array[] = [];
  const prePeakDb: Float32Array[] = [];
  const postPeakDb: Float32Array[] = [];
  const maxLapBlocks = Math.round(0.5 * bps); // J/L-cut lấn tối đa 0.5 s
  for (const s of segs) {
    const s0 = sampleAt(s.win.inFrame);
    const s1w = sampleAt(s.win.outFrame);
    const nb = Math.max(1, Math.round((s1w - s0) / blockLen));
    const pw = new Float64Array(nb);
    const pk = new Float32Array(nb).fill(-120);
    winPow.push(pw);
    winPeakDb.push(pk);
    let pre = new Float64Array(0);
    let post = new Float64Array(0);
    let prk = new Float32Array(0);
    let pok = new Float32Array(0);
    if (s.probe.hasAudio) {
      const pcm = decodePcm(ff, s.shot.videoPath, 2);
      if (pcm) {
        const t = kWeightedTrack(pcm, 2);
        const s1 = Math.min(t.n, s1w);
        const blockAt = (a: number): [number, number] => {
          const e = Math.min(t.n, a + blockLen);
          if (e <= a || a < 0) return [0, -120];
          let m = 0;
          for (let q = a * 2; q < e * 2; q++) m = Math.max(m, Math.abs(pcm[q]));
          return [(t.prefix[e] - t.prefix[a]) / (e - a), m > 1e-6 ? 20 * Math.log10(m) : -120];
        };
        s.winLufs = round2(gatedLoudness(t, s0, s1));
        s.headLufs = round2(trackLoudness(t, s0, Math.min(s1, s0 + blk)));
        s.tailLufs = round2(trackLoudness(t, Math.max(s0, s1 - blk), s1));
        for (let b = 0; b < nb; b++) [pw[b], pk[b]] = blockAt(s0 + b * blockLen);
        const npre = Math.min(maxLapBlocks, Math.floor(s0 / blockLen));
        pre = new Float64Array(npre);
        prk = new Float32Array(npre);
        for (let b = 0; b < npre; b++) [pre[b], prk[b]] = blockAt(s0 - (npre - b) * blockLen);
        const npost = Math.max(0, Math.min(maxLapBlocks, Math.floor((t.n - s1w) / blockLen)));
        post = new Float64Array(npost);
        pok = new Float32Array(npost);
        for (let b = 0; b < npost; b++) [post[b], pok[b]] = blockAt(s1w + b * blockLen);
        // Mức "short-term" của cảnh: loudness của 1 s to nhất (cửa sổ ngắn hơn 1 s: cả cửa sổ).
        const w1 = Math.min(nb, Math.round(bps));
        let best = 0;
        let acc = 0;
        for (let b = 0; b < nb; b++) {
          acc += pw[b];
          if (b >= w1) acc -= pw[b - w1];
          if (b >= w1 - 1) best = Math.max(best, acc / w1);
        }
        s.levelLufs = round2(lufsOfPower(best));
      }
    }
    prePow.push(pre);
    postPow.push(post);
    prePeakDb.push(prk);
    postPeakDb.push(pok);
  }

  // 3) Đầu vào âm thanh phụ: VO (nếu vừa khung), nhạc nền, ambience.
  const voWindows: Array<[number, number]> = [];
  const voFiles: Array<{ seg: Segment; file: string }> = [];
  if (opts.narration === 'vo') {
    for (const s of segs) {
      const vo = s.shot.voiceoverPath;
      if (!vo || !fs.existsSync(vo)) continue;
      const voDur = probeMedia(ff, vo).durationSec;
      const room = s.lenF / fps - 0.15;
      if (!voDur || voDur > room) {
        warnings.push(`Shot ${s.shot.shotIdx}: VO dài ${voDur.toFixed(2)}s > cửa sổ ${(s.lenF / fps).toFixed(2)}s — bỏ VO (không cắt ngang câu).`);
        continue;
      }
      s.voDelayMs = Math.round((s.startF / fps + 0.08) * 1000);
      s.voLufs = measureLoudness(ff, vo).integratedLufs;
      voWindows.push([s.voDelayMs / 1000, s.voDelayMs / 1000 + voDur]);
      voFiles.push({ seg: s, file: vo });
    }
  }
  let musicLufs: number | null = null;
  let musicOk = false;
  if (opts.musicPath) {
    if (fs.existsSync(opts.musicPath)) {
      musicLufs = measureLoudness(ff, opts.musicPath, 300).integratedLufs;
      musicOk = true;
    } else warnings.push(`Không tìm thấy file nhạc ${opts.musicPath} — bỏ nhạc nền.`);
  }
  let ambLufs: number | null = null;
  let ambDur = 0;
  let ambOk = false;
  let ambPow: Float64Array | null = null;
  if (opts.ambiencePath) {
    if (fs.existsSync(opts.ambiencePath)) {
      ambDur = probeMedia(ff, opts.ambiencePath).durationSec;
      const pcm = decodePcm(ff, opts.ambiencePath, 2, 0, 180);
      if (pcm && ambDur > 0.5) {
        const t = kWeightedTrack(pcm, 2);
        ambLufs = round2(gatedLoudness(t));
        ambOk = ambLufs != null && ambLufs > -70;
        const nb = Math.floor(t.n / blockLen);
        ambPow = new Float64Array(Math.max(1, nb));
        for (let b = 0; b < nb; b++) ambPow[b] = (t.prefix[(b + 1) * blockLen] - t.prefix[b * blockLen]) / blockLen;
      }
      if (!ambOk) warnings.push(`Ambience ${opts.ambiencePath} im lặng hoặc quá ngắn — bỏ nền ambience.`);
    } else warnings.push(`Không tìm thấy file ambience ${opts.ambiencePath} — bỏ nền ambience.`);
  }

  // 4) Stem Veo: trim theo mẫu + gain từng cảnh + crossfade xfFrames khung đặt GIỮA điểm cắt (nửa trước / nửa sau).
  const xfS = sampleAt(xfFrames);
  const segAudio = segs.map((s, i) => {
    const s0 = sampleAt(s.win.inFrame);
    const s1 = sampleAt(s.win.outFrame);
    return { s0, s1, pre: 0, post: 0, i };
  });
  // Mặc định: crossfade xfFrames khung đặt GIỮA điểm cắt; kế hoạch hỗn âm có thể đổi thành J-cut / L-cut (xem applyLaps).
  for (let i = 1; i < segs.length; i++) {
    const pre = Math.min(Math.floor(xfS / 2), segAudio[i].s0); // phần tiếng trước điểm vào của cảnh sau
    segAudio[i].pre = pre;
    segAudio[i - 1].post = xfS - pre; // phần tiếng sau điểm ra của cảnh trước
  }
  const applyLaps = (laps: CutLap[]) => {
    laps.forEach((lap, c) => {
      const pre = Math.min(lap.preBlocks * blockLen, segAudio[c + 1].s0);
      const post = lap.postBlocks * blockLen;
      if (pre + post <= 0) return;
      segAudio[c + 1].pre = pre;
      segAudio[c].post = post;
    });
  };
  const endFadeS = Math.round(Math.min(endFadeSec, totalSec / 3) * SAMPLE_RATE);
  const stemGraph = (gains: number[], repairs: TransientRepair[][]) => {
    const lines: string[] = [];
    segs.forEach((s, i) => {
      const sa = segAudio[i];
      const a0 = sa.s0 - sa.pre;
      const a1 = sa.s1 + sa.post;
      const lenS = a1 - a0;
      const fades: string[] = [];
      if (i === 0) fades.push(`afade=t=in:ss=0:ns=${Math.round(0.01 * SAMPLE_RATE)}`);
      if (i === segs.length - 1 && endFadeS > 0) {
        const outS = Math.min(endFadeS, Math.floor(lenS / 2));
        fades.push(`afade=t=out:ss=${lenS - outS}:ns=${outS}`);
      }
      const g = gains[i] || 0;
      // Sửa đỉnh nhọn cô lập: đường bao hạ mức theo từng mẫu (dốc 4 ms) — chỉ ở các khối đã đánh dấu.
      const reps = repairs[i] || [];
      const env = reps
        .map((r) => {
          const t0 = (sa.pre + r.b0 * blockLen) / SAMPLE_RATE;
          const t1 = (sa.pre + r.b1 * blockLen) / SAMPLE_RATE;
          const f = Math.pow(10, -r.attDb / 20);
          return `(1-${fmtNum(1 - f, 5)}*clip(min((t-${fmtNum(t0 - 0.004, 5)})/0.004,(${fmtNum(t1 + 0.004, 5)}-t)/0.004),0,1))`;
        })
        .join('*');
      const repair = env ? `,aeval=exprs='val(0)*${env}|val(1)*${env}'` : '';
      const tail = `${repair}${Math.abs(g) >= 0.01 ? `,volume=${g.toFixed(2)}dB` : ''}${fades.length ? `,${fades.join(',')}` : ''}`;
      if (s.probe.hasAudio) {
        lines.push(
          `[${s.inputIdx}:a:0]aresample=${SAMPLE_RATE}:first_pts=0,${aFmt},atrim=start_sample=${Math.max(0, a0)}:end_sample=${a1},asetpts=PTS-STARTPTS,apad=whole_len=${lenS}${tail}[a${i}]`
        );
      } else {
        lines.push(`anullsrc=r=${SAMPLE_RATE}:cl=stereo,atrim=end_sample=${lenS},aformat=sample_fmts=fltp${tail}[a${i}]`);
      }
    });
    let cur = 'a0';
    for (let i = 1; i < segs.length; i++) {
      const ns = Math.max(1, segAudio[i].pre + segAudio[i - 1].post);
      lines.push(`[${cur}][a${i}]acrossfade=ns=${ns}:o=1:c1=qsin:c2=qsin[ax${i}]`);
      cur = `ax${i}`;
    }
    lines.push(`[${cur}]apad=whole_len=${totalS},atrim=end_sample=${totalS},asetpts=PTS-STARTPTS[stem]`);
    return lines;
  };
  const videoInputs: string[] = [];
  segs.forEach((s) => videoInputs.push('-i', s.shot.videoPath));
  const wavArgs = ['-c:a', 'pcm_f32le', '-ar', String(SAMPLE_RATE), '-ac', '2'];
  const stemPath = path.join(workDir, 'stem.wav');
  const renderStem = (gains: number[], repairs: TransientRepair[][]) => {
    const g = path.join(workDir, 'stem_graph.txt');
    fs.writeFileSync(g, stemGraph(gains, repairs).join(';\n'), 'utf-8');
    const r = runWithGraphFile(ff, ['-nostats', ...videoInputs], g, ['-map', '[stem]', ...wavArgs, '-y', stemPath], 900_000);
    if (r.status !== 0 || !fs.existsSync(stemPath)) throw new Error(`masterFilm: dựng stem âm thanh thất bại (graph: ${g}):\n${tailOf(r.stderr) || r.error}`);
  };
  const premixPath = path.join(workDir, 'premix.wav');
  let musicGainDb: number | null = null;
  let ambGainDb = 0;
  let stemLufs: number | null = null;
  const renderPremix = (): { stemLufs: number | null } => {
    const stemPcm = decodePcm(ff, stemPath, 2);
    const sl = stemPcm ? gatedLoudness(kWeightedTrack(stemPcm, 2)) : null;
    const ref = sl != null && sl > -70 ? sl : -20;
    if (!voFiles.length && !musicOk && !ambOk) {
      fs.copyFileSync(stemPath, premixPath);
      return { stemLufs: round2(sl) };
    }
    const inputs: string[] = ['-i', stemPath];
    const lines: string[] = [];
    let next = 1;
    let veo = '0:a:0';
    const mixIn: string[] = [];
    const needKey = musicOk;
    if (voWindows.length) {
      lines.push(`[${veo}]volume='${duckExpression(voWindows, DUCK_FLOOR, 0.15)}':eval=frame[veoduck]`);
      veo = 'veoduck';
    }
    if (needKey) {
      lines.push(`[${veo}]asplit=2[veomain][veokey]`);
      veo = 'veomain';
    }
    mixIn.push(veo);
    for (const v of voFiles) {
      const idx = next++;
      inputs.push('-i', v.file);
      const voGain = v.seg.voLufs != null && v.seg.voLufs > -70 ? clamp(ref + VO_ABOVE_STEM_LU - v.seg.voLufs, -20, 20) : 0;
      lines.push(`[${idx}:a:0]aresample=${SAMPLE_RATE},${aFmt},volume=${voGain.toFixed(2)}dB,adelay=delays=${v.seg.voDelayMs}:all=1[vo${v.seg.inputIdx}]`);
      mixIn.push(`vo${v.seg.inputIdx}`);
    }
    if (musicOk && opts.musicPath) {
      const idx = next++;
      inputs.push('-stream_loop', '-1', '-i', opts.musicPath);
      musicGainDb = clamp(musicLufs != null && musicLufs > -70 ? ref - MUSIC_BELOW_STEM_LU - musicLufs : -12, -40, 12);
      const fadeOutSt = Math.max(0, totalSec - 1.5);
      const duck = [...speechWindows, ...voWindows];
      lines.push(
        `[${idx}:a:0]aresample=${SAMPLE_RATE},${aFmt},volume=${musicGainDb.toFixed(2)}dB,atrim=end_sample=${totalS},asetpts=PTS-STARTPTS,afade=t=in:d=0.8,afade=t=out:st=${fmtNum(fadeOutSt, 3)}:d=1.5${
          duck.length ? `,volume='${duckExpression(duck, DUCK_FLOOR)}':eval=frame` : ''
        }[mus0]`,
        // Hạ nhạc dưới tiếng nói / gầm / va chạm của stem (sidechain), không chỉ dưới thoại.
        `[mus0][veokey]sidechaincompress=threshold=0.06:ratio=4:attack=10:release=300:makeup=1[mus]`
      );
      mixIn.push('mus');
    }
    if (ambOk && opts.ambiencePath && ambLufs != null) {
      const idx = next++;
      inputs.push('-i', opts.ambiencePath);
      ambGainDb = clamp(ref - ambBelow - ambLufs, -40, 24);
      const fadeOut = Math.max(0.3, endFadeSec);
      const head = `[${idx}:a:0]aresample=${SAMPLE_RATE},${aFmt},highpass=f=60,volume=${ambGainDb.toFixed(2)}dB`;
      const finish = `atrim=end_sample=${totalS},asetpts=PTS-STARTPTS,afade=t=in:d=0.6,afade=t=out:st=${fmtNum(Math.max(0, totalSec - fadeOut), 3)}:d=${fmtNum(fadeOut, 3)}[amb]`;
      if (ambDur >= totalSec + 0.2) {
        lines.push(`${head},${finish}`);
      } else {
        // Lặp với crossfade (không có chỗ nối gắt).
        const xf = Math.min(1, ambDur / 3);
        const copies = Math.max(2, Math.ceil((totalSec + 0.5 - xf) / Math.max(0.1, ambDur - xf)));
        lines.push(`${head},asplit=${copies}${Array.from({ length: copies }, (_, k) => `[ac${k}]`).join('')}`);
        let cur = 'ac0';
        for (let k = 1; k < copies; k++) {
          lines.push(`[${cur}][ac${k}]acrossfade=d=${fmtNum(xf, 3)}:c1=qsin:c2=qsin[acx${k}]`);
          cur = `acx${k}`;
        }
        lines.push(`[${cur}]${finish}`);
      }
      mixIn.push('amb');
    }
    lines.push(`${mixIn.map((l) => (l.includes(':') ? `[${l}]` : `[${l}]`)).join('')}amix=inputs=${mixIn.length}:duration=first:normalize=0,atrim=end_sample=${totalS}[premix]`);
    const g = path.join(workDir, 'premix_graph.txt');
    fs.writeFileSync(g, lines.join(';\n'), 'utf-8');
    const r = runWithGraphFile(ff, ['-nostats', ...inputs], g, ['-map', '[premix]', ...wavArgs, '-y', premixPath], 900_000);
    if (r.status !== 0 || !fs.existsSync(premixPath)) throw new Error(`masterFilm: hỗn âm thất bại (graph: ${g}):\n${tailOf(r.stderr) || r.error}`);
    return { stemLufs: round2(sl) };
  };

  // 5) Kế hoạch hỗn âm trên mô hình khối (không render): bản đồ gain kịch tính + sửa đỉnh nhọn cô lập + trần gain theo đỉnh,
  //    chọn mục tiêu -14 LUFS (hạ dần tới minLufs chỉ khi buộc phải) với LRA trong khoảng và bước nhảy tại điểm cắt nhỏ.
  const gmShots: GainMapShot[] = segs.map((s) => ({
    winLufs: s.levelLufs ?? s.winLufs ?? -120,
    headLufs: s.headLufs ?? -120,
    tailLufs: s.tailLufs ?? -120,
    offsetDb: s.offsetDb,
  }));
  let ceilDb = truePeak - AAC_TP_MARGIN_DB;
  const slackDb = Number.isFinite(opts.limiterSlackDb) ? Math.max(0, Number(opts.limiterSlackDb)) : 1;
  const planInput: AudioPlanInput = {
    winPow,
    winPeakDb,
    prePow,
    postPow,
    prePeakDb,
    postPeakDb,
    xfadeBlocks: xfFrames * Math.round(sampleAt(1) / blockLen),
    limiterSlackDb: slackDb,
    limiterReleaseSec: LIMITER_RELEASE_SEC,
    gm: gmShots,
    bps,
    ambPow: ambOk ? ambPow : null,
    ambBelowLu: ambBelow,
    targetLufs,
    minLufs,
    ceilDb,
    maxGrDb: maxGr,
    lraRange: [lraLo, lraHi],
    useGainMap,
  };
  // Mô hình khối đo đúng loudness premix nhưng đánh giá thấp LRA sau limiter ~0.5-0.8 LU (đo trên dino_premium_v2):
  // lượt 1 lập kế hoạch "lạc quan" rồi kiểm LRA THẬT trên bản AAC; trượt thì lượt 2 dùng kế hoạch thận trọng.
  let plan = planAudioMix({ ...planInput, lraAimLow: lraLo - LRA_MODEL_BIAS_LU });
  const limitedPath = path.join(workDir, 'master_audio.wav');
  const checkPath = path.join(workDir, 'audio_check.m4a');
  const aacArgs = ['-c:a', 'aac', '-b:a', '192k', '-ar', String(SAMPLE_RATE), '-ac', '2'];
  const renderLimited = (gainDb: number, ceil: number) => {
    const lim = Math.min(1, Math.max(0.0625, Math.pow(10, ceil / 20)));
    const r = runFfmpeg(ff, [
      '-nostats', '-i', premixPath,
      '-af', `volume=${gainDb.toFixed(2)}dB,aresample=192000,alimiter=limit=${lim.toFixed(5)}:attack=5:release=${Math.round(LIMITER_RELEASE_SEC * 1000)}:level=0:latency=1,aresample=${SAMPLE_RATE},${aFmt},apad=whole_len=${totalS},atrim=end_sample=${totalS}`,
      ...wavArgs, '-y', limitedPath,
    ], 900_000);
    if (r.status !== 0) throw new Error(`masterFilm: gain tĩnh + limiter thất bại:\n${tailOf(r.stderr) || r.error}`);
    const c = runFfmpeg(ff, ['-nostats', '-i', limitedPath, ...aacArgs, '-y', checkPath], 900_000);
    return c.status === 0 ? measureLoudness(ff, checkPath) : null;
  };
  let goal = plan.goalLufs;
  let staticGain: number | null = null;
  let grNeeded: number | null = null;
  let limiterLimitedPct: number | null = null;
  let limiterOverPct: number | null = null;
  let premixJumps: CutJumpReport | null = null;
  let premixLraJs: number | null = null;
  let premixMeas: { integratedLufs: number | null; lra: number | null; truePeakDb: number | null } = { integratedLufs: null, lra: null, truePeakDb: null };
  let audioChecks: Array<{ goalLufs: number; integratedLufs: number | null; lra: number | null; truePeakDb: number | null; maxGr: number; overPct: number; accepted: boolean }> = [];
  let finalLra: number | null = null;
  let mixPass = 0;
  const runMix = () => {
    mixPass++;
    ceilDb = truePeak - AAC_TP_MARGIN_DB;
    goal = plan.goalLufs;
    staticGain = null;
    grNeeded = null;
    limiterLimitedPct = null;
    limiterOverPct = null;
    audioChecks = [];
    finalLra = null;
    segs.forEach((s, i) => {
      s.gainDb = plan.gains[i] || 0;
      s.dramaticGainDb = plan.dramaticGains[i] || 0;
      s.repairs = plan.repairs[i] || [];
    });
    applyLaps(plan.cuts);
    log(
      `   -> 🔊 Kế hoạch hỗn âm lượt ${mixPass} (${segs.length} shot, crossfade ${xfFrames} khung${ambOk ? ', nền ambience' : ''}${musicOk ? ', nhạc nền' : ''}): độ trải nhịp lắng ×${plan.params.spreadNeg} / cao trào ×${plan.params.spreadPos}, liền mạch ${plan.params.cutWeight} → mục tiêu ${plan.goalLufs} LUFS, dự kiến LRA ${plan.predicted.lra}, nhảy mức median ${plan.predicted.cutJumpMedianDb} dB, limiter ép tối đa ${plan.predicted.maxGainReductionDb} dB (${plan.predicted.limitedBlockPct}% khối bị chạm, ${plan.predicted.overBudgetBlockPct}% > ${maxGr} dB)${plan.ok ? '' : ' — không phương án nào đạt mọi điều kiện, dùng phương án tốt nhất'}`
    );
    for (const s of segs) {
      const reps = s.repairs || [];
      if (s.dramaticGainDb != null && s.dramaticGainDb - s.gainDb > 0.05) {
        log(`   -> 🔊 Shot ${s.shot.shotIdx}: hạ ${(s.dramaticGainDb - s.gainDb).toFixed(2)} dB so với bản đồ kịch tính để đỉnh vừa trần limiter`);
      }
      const ci = segs.indexOf(s);
      const lap = ci > 0 ? plan.cuts[ci - 1] : null;
      if (lap && lap.kind !== 'xfade') {
        log(`   -> 🔊 Cắt ${segs[ci - 1].shot.shotIdx}→${s.shot.shotIdx}: ${lap.kind}-cut (tiếng ${lap.kind === 'J' ? `cảnh sau vào sớm ${((lap.preBlocks * blockLen) / SAMPLE_RATE).toFixed(2)}s` : `cảnh trước kéo dài ${((lap.postBlocks * blockLen) / SAMPLE_RATE).toFixed(2)}s`})`);
      }
      for (const r of reps) {
        log(`   -> 🔊 Shot ${s.shot.shotIdx}: sửa đỉnh nhọn cô lập ${((r.b0 * blockLen) / SAMPLE_RATE + s.win.inSec).toFixed(3)}s (nguồn), ${(((r.b1 - r.b0) * blockLen) / SAMPLE_RATE * 1000).toFixed(0)} ms, -${r.attDb} dB`);
      }
    }
    renderStem(plan.gains, plan.repairs);
    const pm = renderPremix();
    stemLufs = pm.stemLufs;
    const premixPcm = decodePcm(ff, premixPath, 2);
    const premixTrack = premixPcm ? kWeightedTrack(premixPcm, 2) : null;
    premixJumps = premixTrack ? cutJumpsFromTrack(premixTrack, cutsSec) : null;
    premixLraJs = premixTrack ? loudnessRange(premixTrack) : null;

    // 6) MỘT gain tĩnh + limiter true-peak nhẹ (oversample 192 kHz). Không loudnorm động.
    //    Kế hoạch đã giữ đỉnh trong maxGr dB; đỉnh thật cao hơn mô hình -> hạ mục tiêu (tối đa tới minLufs). Kiểm tra vòng kín trên bản AAC.
    premixMeas = measureLoudness(ff, premixPath);
    const preI = premixMeas.integratedLufs != null && premixMeas.integratedLufs > -70 ? premixMeas.integratedLufs : null;
    const preTp = premixMeas.truePeakDb;
    // Đỉnh mẫu mỗi khối 10 ms của premix THẬT -> kiểm tra ngân sách limiter cho từng mục tiêu mà không cần render.
    const peaks10: number[] = [];
    if (premixPcm) {
      const b10 = Math.round(0.01 * SAMPLE_RATE);
      for (let a = 0; a * 2 < premixPcm.length; a += b10) {
        let m = 0;
        for (let q = a * 2; q < Math.min(premixPcm.length, (a + b10) * 2); q++) m = Math.max(m, Math.abs(premixPcm[q]));
        peaks10.push(m > 1e-6 ? 20 * Math.log10(m) : -120);
      }
    }
    const grStats = (gain: number) => {
      let mx = 0;
      let limited = 0;
      let over = 0;
      for (const pk of peaks10) {
        const gr = pk + gain + TP_MARGIN_DB - ceilDb;
        if (gr > mx) mx = gr;
        if (gr > 0.1) limited++;
        if (gr > maxGr) over++;
      }
      const n10 = Math.max(1, peaks10.length);
      return { maxGr: mx, limitedPct: (100 * limited) / n10, overPct: (100 * over) / n10 };
    };
    const grOk = (st: { maxGr: number; overPct: number }) => st.maxGr <= maxGr + 0.15 || (st.maxGr <= maxGr + slackDb + 0.15 && st.overPct <= 1);
    // Một mục tiêu: gain tĩnh + limiter -> AAC kiểm tra, chỉnh gain theo sai số loudness và hạ trần nếu true peak vượt (tối đa 4 lượt).
    const tryGoal = (g: number) => {
      let sg = g - (preI as number);
      let ceil = truePeak - AAC_TP_MARGIN_DB;
      let chk: ReturnType<typeof measureLoudness> | null = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        chk = renderLimited(sg, ceil);
        if (!chk || chk.integratedLufs == null || chk.truePeakDb == null) return { chk: null, sg, ceil };
        const iErr = g - chk.integratedLufs;
        const tpExcess = chk.truePeakDb - truePeak;
        log(`   -> 🔊 Kiểm tra AAC ${fmtNum(g, 2)} LUFS lượt ${attempt + 1}: ${chk.integratedLufs} LUFS, TP ${chk.truePeakDb} dBTP, LRA ${chk.lra} (gain tĩnh ${sg.toFixed(2)} dB, trần ${ceil.toFixed(2)} dB)`);
        if (tpExcess <= 0 && Math.abs(iErr) <= 0.15) break;
        if (tpExcess > 0) ceil -= tpExcess + 0.1;
        if (Math.abs(iErr) > 0.15) sg += iErr;
      }
      return { chk, sg, ceil };
    };
    if (preI != null) {
      log(`   -> 🔊 Premix ${preI} LUFS / TP ${preTp} dBTP / LRA ${premixMeas.lra} — tìm mục tiêu cao nhất (từ ${targetLufs} LUFS) giữ limiter <= ${maxGr} dB (+${slackDb} dB trên <= 1% khối) và LRA ${lraLo}-${lraHi} LU`);
      // Vòng kín trên premix thật: thử nâng mục tiêu từ -14 xuống tới mục tiêu của kế hoạch (bước 0.25), chọn mục tiêu to nhất đạt cả
      // ngân sách limiter lẫn LRA đo trên bản AAC. Không đạt -> mục tiêu của kế hoạch (đã kiểm trên mô hình).
      const candidates: number[] = [];
      for (let g = targetLufs; g > plan.goalLufs + 1e-9; g -= 0.25) candidates.push(Number(g.toFixed(2)));
      candidates.push(plan.goalLufs);
      let accepted: { g: number; sg: number; ceil: number; chk: ReturnType<typeof measureLoudness> } | null = null;
      let lastRendered: number | null = null;
      for (const g of candidates) {
        const st = grStats(g - preI + 0.3);
        const isPlan = Math.abs(g - plan.goalLufs) < 1e-6;
        if (!grOk(st) && !isPlan) {
          audioChecks.push({ goalLufs: g, integratedLufs: null, lra: null, truePeakDb: null, maxGr: Number(st.maxGr.toFixed(2)), overPct: Number(st.overPct.toFixed(2)), accepted: false });
          continue;
        }
        const r = tryGoal(g);
        lastRendered = g;
        const lra = r.chk?.lra ?? null;
        const okLra = !lraMatters || (lra != null && lra >= lraLo && lra <= lraHi + 0.5);
        const st2 = grStats(r.sg);
        audioChecks.push({ goalLufs: g, integratedLufs: r.chk?.integratedLufs ?? null, lra, truePeakDb: r.chk?.truePeakDb ?? null, maxGr: Number(st2.maxGr.toFixed(2)), overPct: Number(st2.overPct.toFixed(2)), accepted: false });
        // Gain tĩnh đã được chỉnh theo loudness THẬT sau limiter -> kiểm lại ngân sách limiter trước khi nhận mục tiêu này.
        if (r.chk && ((okLra && grOk(st2)) || isPlan)) {
          accepted = { g, sg: r.sg, ceil: r.ceil, chk: r.chk };
          audioChecks[audioChecks.length - 1].accepted = true;
          break;
        }
      }
      if (accepted) {
        goal = accepted.g;
        staticGain = accepted.sg;
        ceilDb = accepted.ceil;
        finalLra = accepted.chk.lra;
        if (lastRendered !== accepted.g) tryGoal(accepted.g);
      } else {
        warnings.push('Không đo được bản AAC kiểm tra — dùng gain tĩnh của kế hoạch.');
        staticGain = plan.goalLufs - preI;
        renderLimited(staticGain, ceilDb);
      }
      const fin = grStats(staticGain as number);
      grNeeded = fin.maxGr;
      limiterLimitedPct = Number(fin.limitedPct.toFixed(2));
      limiterOverPct = Number(fin.overPct.toFixed(2));
      log(`   -> 🔊 Chốt ${fmtNum(goal, 2)} LUFS: gain tĩnh ${(staticGain as number).toFixed(2)} dB, limiter ép tối đa ~${Math.max(0, fin.maxGr).toFixed(2)} dB (${limiterLimitedPct}% khối 10 ms bị chạm, ${limiterOverPct}% > ${maxGr} dB)`);
    } else {
      warnings.push('Hỗn âm gần như im lặng — bỏ qua gain tĩnh.');
      renderLimited(0, ceilDb);
    }
  };
  runMix();
  if (useGainMap && lraMatters && finalLra != null && finalLra < lraLo) {
    const conservative = planAudioMix(planInput);
    if (conservative.goalLufs !== plan.goalLufs || conservative.params.spreadNeg !== plan.params.spreadNeg || conservative.params.spreadPos !== plan.params.spreadPos) {
      log(`   -> 🔊 LRA thật ${finalLra} LU < ${lraLo} — lượt 2 với kế hoạch thận trọng (mục tiêu ${conservative.goalLufs} LUFS)`);
      plan = conservative;
      runMix();
    }
  }
  if (lraMatters && premixLraJs != null && (premixLraJs < lraLo || premixLraJs > lraHi + 1)) warnings.push(`LRA hỗn âm ${premixLraJs.toFixed(1)} LU ngoài khoảng ${lraLo}-${lraHi} LU.`);
  const limiterGR = grNeeded != null ? Number(Math.max(0, grNeeded).toFixed(2)) : null;
  if (limiterGR != null && limiterGR > maxGr + slackDb + 0.25) warnings.push(`Limiter phải ép đỉnh ~${limiterGR} dB (> ${maxGr} + ${slackDb} dB) ở ${fmtNum(goal, 1)} LUFS.`);
  if (goal < targetLufs - 0.25) {
    warnings.push(`Đỉnh quá cao để đạt ${targetLufs} LUFS với limiter ~${maxGr} dB — chấp nhận ${fmtNum(goal, 2)} LUFS (không dùng loudnorm động).`);
  }

  // 7) Phụ đề thoại: 1 dòng <= 42 ký tự, chỉ khi nhân vật đang nói (bám theo lời nói dò được, không kéo dài sau câu)
  const srtPath = path.join(outDir, `${subBase}.srt`);
  const assPath = path.join(outDir, `${subBase}.ass`);
  let srt = '';
  let assEvents = '';
  let cueCount = 0;
  if (opts.subtitles === 'dialogue') {
    for (const s of segs) {
      const text = cleanCaptionText(s.shot.subtitleVi || '');
      if (!text || s.shot.hasDialogue === false) continue;
      const segStart = s.startF / fps;
      const segEnd = (s.startF + s.lenF) / fps;
      let cueStart = segStart + 0.1;
      let cueEnd = segEnd - 0.08;
      if (s.win.speechInSec != null && s.win.speechOutSec != null) {
        const speechDur = s.win.speechOutSec - s.win.speechInSec;
        const readSec = Math.max(1.2, text.length / 15, speechDur + 0.25);
        cueStart = Math.max(segStart, segStart + (s.win.speechInSec - s.win.inSec) - 0.1);
        cueEnd = Math.min(segEnd - 0.04, cueStart + readSec);
        if (cueEnd - cueStart < 1.0) cueStart = Math.max(segStart, cueEnd - 1.0);
      } else {
        cueEnd = Math.min(cueEnd, cueStart + Math.max(1.2, text.length / 15) + 0.3);
      }
      const chunks = splitCaption(text, 42);
      const totalChars = chunks.reduce((n, c) => n + c.length, 0) || 1;
      let t = cueStart;
      chunks.forEach((chunk, ci) => {
        const end = ci === chunks.length - 1 ? cueEnd : t + ((cueEnd - cueStart) * chunk.length) / totalChars;
        cueCount++;
        srt += `${cueCount}\n${srtTime(t)} --> ${srtTime(end)}\n${chunk}\n\n`;
        assEvents += `Dialogue: 0,${assTime(t)},${assTime(end)},Dialogue,,0,0,0,,{\\fad(60,60)}${chunk}\n`;
        t = end;
      });
    }
  }
  fs.writeFileSync(srtPath, srt, 'utf-8');
  fs.writeFileSync(assPath, opts.subtitles === 'dialogue' ? buildAssHeader(W, H, outBase) + assEvents : '', 'utf-8');

  // 8) Phơi sáng từng cảnh (L10): lấy mẫu khung trong cửa sổ -> black / gamma / white để p50 về target ± 4 sau đường cong chung;
  //    góc trên-phải quá sáng so với tâm (> flareRatioMax) -> vai sáng mềm ở góc.
  const flareMax = Number.isFinite(opts.flareRatioMax) ? Number(opts.flareRatioMax) : 1.8;
  if (exposureOn) {
    for (const s of segs) {
      const rgb = sampleFramesRgb(ff, s.shot.videoPath, s.win.inSec, s.win.outSec, 10);
      s.exposure = rgb ? planExposure(rgb, { targetP50: targetP50, tolerance: 4, curve: toneCurve || false }) : null;
      if (!s.exposure) warnings.push(`Shot ${s.shot.shotIdx}: không lấy được khung mẫu để chuẩn hoá phơi sáng.`);
      else if (s.exposure.p50Out > targetP50 + 4) warnings.push(`Shot ${s.shot.shotIdx}: p50 sau chuẩn hoá vẫn ${s.exposure.p50Out} (> ${targetP50 + 4}) dù gamma ${s.exposure.gamma}.`);
      if (s.exposure && rgb && flareMax > 0) {
        const ratio = cornerCentreRatioOf(rgb, 320, 180);
        s.exposure.cornerCentreRatio = ratio;
        s.exposure.flareRolloff = ratio != null && ratio > flareMax;
      }
    }
  }

  // 9) Đồ thị hình: trim chính xác theo khung -> hflip -> scale lanczos (phủ kín / crop theo trọng tâm / giữ trọn trên nền mờ)
  //    -> RGB (ma trận bt709 tường minh) -> phơi sáng từng cảnh -> concat -> đường cong toe/shoulder -> YUV bt709 -> grain -> mờ cuối -> phụ đề
  // Sau fps=<fps> timebase đúng bằng 1/fps nên pts == chỉ số khung -> trim bằng start_pts/end_pts nguyên.
  const scaleFlags = 'flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv';
  const toRgb = 'scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int,format=gbrp';
  const vLines = segs.map((s, i) => {
    const head = `[${s.inputIdx}:v:0]fps=${fps},trim=start_pts=${s.win.inFrame}:end_pts=${s.win.outFrame},setpts=PTS-STARTPTS${s.hflip ? ',hflip' : ''}`;
    const ex = s.exposure;
    const lut =
      ex && (ex.black > 0 || Math.abs(ex.gamma - 1) > 0.004 || ex.white < 0.999)
        ? (() => {
            const e = `255*pow(clip((val/255-${fmtNum(ex.black, 4)})/${fmtNum(1 - ex.black, 4)},0,1),${fmtNum(1 / ex.gamma, 5)})*${fmtNum(ex.white, 4)}`;
            return `,lutrgb=r='${e}':g='${e}':b='${e}'`;
          })()
        : '';
    const tailChain = `${toRgb}${lut}`;
    // L10: vai sáng góc trên-phải (lens flare / mặt trời) sau phơi sáng, trước concat.
    const flare = ex?.flareRolloff === true;
    const outV = flare ? `vpre${i}` : `v${i}`;
    const flareTail = flare ? `;${flareRolloffGraph(outV, `v${i}`, W, H, fps, String(i))}` : '';
    if (s.reframe?.mode === 'fit-blur') {
      return (
        `${head},split=2[bg${i}][fg${i}];` +
        `[bg${i}]scale=${W}:${H}:force_original_aspect_ratio=increase:${scaleFlags},crop=${W}:${H},boxblur=luma_radius=40:luma_power=2:chroma_radius=20,eq=brightness=-0.06:saturation=0.85[bgb${i}];` +
        `[fg${i}]scale=${W}:${H}:force_original_aspect_ratio=decrease:${scaleFlags},setsar=1[fgs${i}];` +
        `[bgb${i}][fgs${i}]overlay=x=(W-w)/2:y=(H-h)/2,setsar=1,${tailChain}[${outV}]${flareTail}`
      );
    }
    const cx = s.reframe?.cx;
    const cropX = cx == null ? '' : `:x='max(0,min(iw-${W},${fmtNum(cx, 4)}*iw-${W / 2}))':y=(ih-${H})/2`;
    return `${head},scale=${W}:${H}:force_original_aspect_ratio=increase:${scaleFlags},crop=${W}:${H}${cropX},setsar=1,${tailChain}[${outV}]${flareTail}`;
  });
  const look: string[] = [];
  if (toneCurve) look.push(`curves=all='${toneCurve}'`);
  look.push('scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int', 'format=yuv420p');
  if (grain) look.push('noise=c0s=2:c0f=t+a');
  if (endFadeSec > 0) look.push(`fade=t=out:st=${fmtNum(Math.max(0, totalSec - Math.min(endFadeSec, totalSec / 3)), 4)}:d=${fmtNum(Math.min(endFadeSec, totalSec / 3), 4)}`);
  if (cueCount > 0) {
    // Dấu ' không escape được bên trong giá trị filter có nháy -> dùng bản sao ở thư mục tạm.
    let assForFilter = assPath;
    if (assPath.includes("'")) {
      assForFilter = path.join(os.tmpdir(), `hyperion_subs_${Date.now()}.ass`);
      fs.copyFileSync(assPath, assForFilter);
    }
    look.push(`ass=filename='${escapeFilterPath(assForFilter)}'`);
  }
  look.push('setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709', 'format=yuv420p');
  const finalGraph = [...vLines, `${segs.map((_, i) => `[v${i}]`).join('')}concat=n=${segs.length}:v=1:a=0[vcat]`, `[vcat]${look.join(',')}[vout]`].join(';\n');
  const graphPath = path.join(workDir, 'final_graph.txt');
  fs.writeFileSync(graphPath, finalGraph, 'utf-8');

  const masterPath = path.join(outDir, `${outBase}.mp4`);
  const tmpPath = path.join(outDir, `${outBase}.rendering.mp4`);
  log(`   -> 🎞️  Encode master ${W}x${H} ${fps}fps (libx264 slow CRF16 tune film, 1 lần duy nhất)...`);
  const enc = runWithGraphFile(
    ff,
    ['-nostats', ...videoInputs, '-i', limitedPath],
    graphPath,
    [
      '-map', '[vout]', '-map', `${segs.length}:a:0`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'film', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-r', String(fps), '-fps_mode', 'cfr',
      ...aacArgs,
      '-movflags', '+faststart', '-y', tmpPath,
    ],
    3_600_000
  );
  if (enc.status !== 0 || !fs.existsSync(tmpPath)) {
    throw new Error(`masterFilm: ffmpeg encode thất bại (graph: ${graphPath}):\n${tailOf(enc.stderr) || enc.error}`);
  }
  let finalPath = masterPath;
  try {
    if (fs.existsSync(masterPath)) fs.rmSync(masterPath, { force: true });
    fs.renameSync(tmpPath, masterPath);
  } catch (err: any) {
    finalPath = tmpPath;
    warnings.push(`Không ghi đè được ${masterPath} (${err?.message || err}) — master nằm tại ${tmpPath}.`);
  }
  const dupM = [...enc.stderr.matchAll(/dup=\s*(\d+)/g)].pop();
  const dropM = [...enc.stderr.matchAll(/drop=\s*(\d+)/g)].pop();
  const encoderDupFrames = dupM ? Number(dupM[1]) : 0;
  const encoderDropFrames = dropM ? Number(dropM[1]) : 0;
  if (encoderDupFrames || encoderDropFrames) warnings.push(`Encoder báo dup=${encoderDupFrames} drop=${encoderDropFrames} khung.`);

  // 10) Đo lại kết quả: loudness, bước nhảy mức tại điểm cắt, ảnh.
  const probe = probeMedia(ff, finalPath);
  const measured = measureLoudness(ff, finalPath);
  const frameCount = countVideoFrames(ff, finalPath);
  const cutJumps = cutsSec.length ? measureCutJumps(ff, finalPath, cutsSec) : null;
  const picture = measurePicture(ff, finalPath, cutsSec, fps);
  picture.toneCurve = toneCurve;
  picture.exposureNormalize = exposureOn;
  picture.targetP50 = targetP50;
  if (measured.integratedLufs != null && Math.abs(measured.integratedLufs - goal) > 1) {
    warnings.push(`Loudness ${measured.integratedLufs} LUFS lệch mục tiêu ${fmtNum(goal, 1)} quá 1 LU.`);
  }
  if (measured.truePeakDb != null && measured.truePeakDb > truePeak + 0.05) {
    warnings.push(`True peak ${measured.truePeakDb} dBTP vượt mục tiêu ${truePeak} dBTP.`);
  }
  if (lraMatters && measured.lra != null && (measured.lra < lraLo - 0.5 || measured.lra > lraHi + 0.5)) warnings.push(`LRA master ${measured.lra} LU ngoài khoảng ${lraLo}-${lraHi} LU.`);
  if (cutJumps?.medianAbsDb != null && cutJumps.medianAbsDb >= 5) warnings.push(`Bước nhảy mức tại điểm cắt median ${cutJumps.medianAbsDb} dB (mục tiêu < 5 dB).`);
  if (picture.redClipPct != null && picture.redClipPct > 0.3) warnings.push(`Cháy kênh đỏ ${picture.redClipPct}% điểm ảnh (> 0.3%).`);
  if (flareMax > 0 && picture.cornerCentreRatio != null && picture.cornerCentreRatio > flareMax) {
    const rolled = segs.filter((s) => s.exposure?.flareRolloff).map((s) => s.shot.shotIdx);
    warnings.push(
      `Góc trên-phải / tâm ${picture.cornerCentreRatio} (> ${flareMax}; POMMI 1.29)${rolled.length ? ` dù đã thêm vai sáng góc cho cảnh ${rolled.join(', ')}` : ''} → kiểm tra lens flare / mặt trời trong khung.`
    );
  }
  if (frameCount != null && frameCount !== totalF) warnings.push(`Số khung ${frameCount} khác dự kiến ${totalF}.`);
  if (probe.width !== W || probe.height !== H) warnings.push(`Kích thước master ${probe.width}x${probe.height} khác ${W}x${H}.`);

  const lens = segs.map((s) => s.lenF / fps);
  const reportPath = path.join(outDir, `${outBase}_report.json`);
  const report: MasterReport = {
    masterPath: finalPath,
    srtPath,
    assPath,
    width: probe.width || W,
    height: probe.height || H,
    fps: probe.fps || fps,
    durationSec: Number((frameCount != null ? frameCount / fps : probe.durationSec).toFixed(3)),
    shotCount: segs.length,
    avgShotSec: Number((lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(3)),
    medianShotSec: Number(median(lens).toFixed(3)),
    windows: segs.map((s) => ({
      shotIdx: s.shot.shotIdx,
      inSec: s.win.inSec,
      outSec: s.win.outSec,
      reason: s.win.reason,
      forced: !!s.win.forced,
      hflip: s.hflip,
      ...(s.win.beatPeakSec != null ? { beatPeakSec: s.win.beatPeakSec } : {}),
      fxMid: s.win.fxMid,
    })),
    measured,
    warnings,
    frameCount,
    expectedFrameCount: totalF,
    encoderDupFrames,
    encoderDropFrames,
    loudnormMode: 'static-gain',
    limiterCeilingDb: Number(ceilDb.toFixed(2)),
    limiterGainReductionDb: limiterGR,
    integratedTargetLufs: Number(goal.toFixed(2)),
    stemLufs,
    captionCount: cueCount,
    pacing,
    reportPath,
    engineVersion: MASTER_ENGINE_VERSION,
    createdAt: new Date().toISOString(),
    outBaseName: outBase,
    sources,
    shots: segs.map((s) => ({
      shotIdx: s.shot.shotIdx,
      inSec: s.win.inSec,
      outSec: s.win.outSec,
      durSec: Number((s.lenF / fps).toFixed(4)),
      masterStartSec: Number((s.startF / fps).toFixed(4)),
      forced: !!s.win.forced,
      hflip: s.hflip,
      ...(s.shot.beatWindow ? { beatWindow: s.shot.beatWindow } : {}),
      ...(s.win.beatPeakInWindow != null ? { beatPeakInWindow: s.win.beatPeakInWindow } : {}),
      fxMid: s.win.fxMid,
      audio: {
        winLufs: s.winLufs,
        headLufs: s.headLufs,
        tailLufs: s.tailLufs,
        offsetDb: s.offsetDb,
        gainDb: s.gainDb,
        dramaticGainDb: s.dramaticGainDb,
        levelLufs: s.levelLufs ?? null,
        lapIn: segs.indexOf(s) > 0 ? plan.cuts[segs.indexOf(s) - 1] : null,
        repairs: (s.repairs || []).map((r) => ({
          atSec: Number((s.win.inSec + (r.b0 * blockLen) / SAMPLE_RATE).toFixed(3)),
          durMs: Math.round((((r.b1 - r.b0) * blockLen) / SAMPLE_RATE) * 1000),
          attDb: r.attDb,
        })),
      },
      exposure: s.exposure ?? null,
    })),
    audio: {
      policy: 'gain-map + crossfade + static gain + true-peak limiter (no dynamic loudnorm)',
      crossfadeFrames: xfFrames,
      gainMap: useGainMap,
      gainMapSpread: plan.params.spreadNeg,
      limiterSlackDb: slackDb,
      limiterReleaseMs: Math.round(LIMITER_RELEASE_SEC * 1000),
      limiterLimitedBlockPct: limiterLimitedPct,
      limiterOverBudgetBlockPct: limiterOverPct,
      goalSearch: audioChecks,
      plan: {
        spreadNeg: plan.params.spreadNeg,
        spreadPos: plan.params.spreadPos,
        cutWeight: plan.params.cutWeight,
        predicted: plan.predicted,
        ok: plan.ok,
      },
      staticGainDb: round2(staticGain),
      limiterCeilingDb: Number(ceilDb.toFixed(2)),
      limiterMaxGainReductionDb: limiterGR,
      targetLufs,
      goalLufs: Number(goal.toFixed(2)),
      premix: { integratedLufs: premixMeas.integratedLufs, truePeakDb: premixMeas.truePeakDb, lra: premixMeas.lra },
      ambience: ambOk && opts.ambiencePath ? { path: path.resolve(opts.ambiencePath), lufs: ambLufs, gainDb: round2(ambGainDb) ?? 0, belowStemLu: ambBelow } : null,
      music: musicOk && opts.musicPath ? { path: path.resolve(opts.musicPath), lufs: musicLufs, gainDb: round2(musicGainDb) ?? 0 } : null,
      cutJumps,
      premixCutJumps: premixJumps,
    },
    picture,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  if (!opts.keepWorkFiles) {
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch {}
  }
  return report;
}
