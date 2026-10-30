/**
 * 🎬 HYPERION STUDIO — PREMIUM PROMPT ENGINE (đường sản xuất premium cho Giai đoạn 1-4)
 *
 * Viết prompt NGẮN bằng văn xuôi điện ảnh theo hướng dẫn chính thức của Google (Vertex Veo prompt guide / best-practice, 2026-10-28):
 *   - Ảnh keyframe (Nano Banana Pro): phong cách -> cỡ cảnh/góc máy -> ai -> trạng thái đầu cảnh -> bố cục -> bối cảnh + 1 nguồn sáng + 1 họ màu.
 *   - Video image-to-video (Veo 3.1): CHỈ mô tả chuyển động + diễn xuất + âm thanh; thoại dạng "<Tên> says: câu thoại" (không ngoặc kép).
 *   - Không phủ định, không ID kỹ thuật, không số đo, tối đa 1 hiệu ứng, không để tím + cam + cyan tranh nhau.
 * lintPremiumPrompt là bộ kiểm tra THẬT trên văn bản cuối cùng (không tự chấm điểm nhãn của chính mình).
 */

// ───────────────────────────── Types ─────────────────────────────

export type PremiumStyleKey = 'pixar3d' | 'graphic2d' | 'photoreal';

export interface PremiumStylePreset {
  labelVi: string;
  styleSentenceEn: string;
  shortStyleEn: string;
  sheetStyleEn: string;
  defaultLightingEn: string;
  paletteRuleEn: string;
}

export type PremiumShotSize = 'EWS' | 'WS' | 'MS' | 'MCU' | 'CU' | 'ECU' | 'OTS' | 'INSERT' | 'POV';
export type PremiumBeat = 'setup' | 'inciting' | 'escalation' | 'reversal' | 'climax' | 'resolution';
export type PremiumCharId = 'char1' | 'char2';
/** 'edit' = prompt sửa ảnh Nano Banana Pro (khung cuối dựng bằng cách SỬA khung đầu, L1). */
export type PremiumPromptKind = 'image' | 'video' | 'sheet' | 'edit';
/** Hướng nhìn trên màn hình (trục 180°): mặc định char1 nhìn sang phải, char2 nhìn sang trái. */
export type PremiumScreenFacing = 'left' | 'right';

export interface PremiumCharacter {
  id: PremiumCharId;
  safeId: string /* ASCII UPPER_SNAKE for Flow folders */;
  displayNameVi: string;
  displayNameEn: string;
  species: string;
  lookEn: string /* <=40 words, includes one signature colour accent */;
  voiceEn: string;
  canSpeak: boolean;
  personalityVi: string /* MEM-10 textarea: body stats, temperament, [ACTION_..]/[SKILL_1_..]/[SKILL_2_..] codes */;
}

export interface PremiumEnvironment {
  safeId: string;
  displayNameVi: string;
  lookEn: string;
  timeOfDayEn: string;
  lightingEn: string /* ONE motivated key light */;
  paletteEn: string /* one dominant hue + one accent */;
}

export interface PremiumDialogue {
  speaker: PremiumCharId;
  lineEn: string /* <=8 words */;
  lineVi: string;
}

export interface PremiumShot {
  shotNumber: number;
  titleVi: string;
  beat: PremiumBeat;
  shotSize: PremiumShotSize;
  cameraMoveEn: string /* one simple move or 'static' */;
  characters: PremiumCharId[];
  startStateEn: string /* what the first frame shows */;
  actionEn: string /* ONE visible action */;
  actingBeatEn: string /* facial/body expression change A->B */;
  gazeEn: string;
  dialogue: null | PremiumDialogue;
  vocalEn: string /* non-verbal vocal reaction for creatures, may be '' */;
  sfxEn: string;
  ambientEn: string;
  fxLevel: 0 | 1 | 2;
  fxEn: string /* the single allowed effect or '' */;
  durationSeconds: 4 | 6 | 8;
  /** Chỉ khi --narration vo: một câu thuyết minh tiếng Việt ngắn (<= 14 từ) cho cảnh không có thoại. */
  narrationVi?: string;
  /**
   * Khung CUỐI của cảnh (L1): cùng nơi, cùng cỡ cảnh, cùng bố cục với startStateEn — chỉ đổi tư thế + biểu cảm.
   * Hành động va chạm dừng MỘT BƯỚC trước khi chạm (L4). normalizeStoryBible / buildFallbackStoryBible luôn điền trường này.
   */
  endStateEn?: string;
  /** Ghi đè hướng nhìn trên màn hình cho cảnh này (mặc định char1 -> 'right', char2 -> 'left'). */
  facing?: Partial<Record<PremiumCharId, PremiumScreenFacing>>;
}

export interface PremiumStoryBible {
  movieTitle: string;
  loglineVi: string;
  style: PremiumStyleKey;
  characters: PremiumCharacter[] /* 1-2 */;
  environment: PremiumEnvironment;
  shots: PremiumShot[];
}

export interface PremiumLintReport {
  ok: boolean;
  words: number;
  issues: string[];
}

export interface PremiumJudgeVerdict {
  overall: number;
  scores: Record<string, number>;
  artifacts: string[];
  pass: boolean;
  note: string;
  /** Cổng cứng (L7) đã đọc được: true = đạt. Chỉ có khi giám khảo trả cổng hoặc opts.requireHardGates. */
  hardGates?: Record<string, boolean>;
  /** Tên các cổng cứng bị trượt (thiếu / không đọc được cũng tính là trượt — fail closed). */
  failedGates?: string[];
  /** Giây trong take nơi nhịp diễn bắt đầu / rõ nhất / kết thúc (null khi giám khảo không thấy nhịp). */
  beatInSec?: number | null;
  beatPeakSec?: number | null;
  beatOutSec?: number | null;
}

// ───────────────────────────── Style presets ─────────────────────────────

export const STYLE_PRESETS: Record<PremiumStyleKey, PremiumStylePreset> = {
  pixar3d: {
    labelVi: 'Hoạt hình 3D điện ảnh phong cách Pixar',
    styleSentenceEn:
      'Stylized 3D animated feature film look, Pixar-like 3D animation, appealing rounded shapes, expressive faces with large readable eyes, soft global illumination, clean physically based materials, shallow cinematic depth of field.',
    shortStyleEn: 'Pixar-like 3D animation, soft global illumination, expressive faces.',
    sheetStyleEn:
      'Stylized 3D animated feature character design, Pixar-like 3D animation, appealing rounded shapes, large readable eyes, clean physically based materials.',
    defaultLightingEn: 'a soft warm key light from one side with gentle bounce fill',
    paletteRuleEn: 'one dominant hue family with a single complementary accent colour',
  },
  graphic2d: {
    labelVi: 'Hoạt hình 2D truyện tranh vẽ tay',
    styleSentenceEn:
      'Hand-inked 2D graphic-novel animation, confident expressive linework, flat cel shading with soft painted shadows, painterly muted backgrounds, limited colour palette, cinematic staging.',
    shortStyleEn: 'Hand-inked 2D graphic-novel animation, cel shading, painterly muted backgrounds.',
    sheetStyleEn:
      'Hand-inked 2D graphic-novel character design, clean confident linework, flat cel shading, limited muted colour palette.',
    defaultLightingEn: 'a low raking key light from one side casting long soft shadows',
    paletteRuleEn: 'muted desaturated base colours with one warm accent',
  },
  photoreal: {
    labelVi: 'Phim tài liệu thiên nhiên chân thực',
    styleSentenceEn:
      'Natural-history documentary realism, filmed with long telephoto lenses, natural available light, restrained true-to-life colour, fine film grain, patient observational camera.',
    shortStyleEn: 'Natural-history documentary realism, natural light, restrained colour.',
    sheetStyleEn:
      'Natural-history reference photography, true-to-life anatomy and texture, soft even studio light, restrained true-to-life colour.',
    defaultLightingEn: 'soft natural daylight from one direction',
    paletteRuleEn: 'natural restrained earth tones with one subtle accent',
  },
};

export const PREMIUM_SHOT_SIZES: PremiumShotSize[] = ['EWS', 'WS', 'MS', 'MCU', 'CU', 'ECU', 'OTS', 'INSERT', 'POV'];
export const PREMIUM_BEATS: PremiumBeat[] = ['setup', 'inciting', 'escalation', 'reversal', 'climax', 'resolution'];
export const PREMIUM_JUDGE_PASS_SCORE = 70;

const FACE_SIZES = new Set<string>(['CU', 'MCU', 'ECU']);
const WIDE_SIZES = new Set<string>(['WS', 'EWS']);

export function isFaceShotSize(size: string): boolean {
  return FACE_SIZES.has(size);
}

export function isWideShotSize(size: string): boolean {
  return WIDE_SIZES.has(size);
}

const SIZE_NAME_EN: Record<PremiumShotSize, string> = {
  EWS: 'extreme wide shot',
  WS: 'wide shot',
  MS: 'medium shot',
  MCU: 'medium close-up',
  CU: 'close-up',
  ECU: 'extreme close-up',
  OTS: 'over-the-shoulder shot',
  INSERT: 'insert detail shot',
  POV: 'point-of-view shot',
};

const LENS_FEEL_EN: Record<PremiumShotSize, string> = {
  EWS: '24mm lens feel, deep focus',
  WS: '28mm lens feel, deep focus',
  MS: '35mm lens feel, softly blurred background',
  MCU: '50mm lens feel, shallow focus',
  CU: '85mm lens feel, shallow focus',
  ECU: 'macro lens feel, very shallow focus',
  OTS: '50mm lens feel, shallow focus',
  INSERT: 'macro lens feel, shallow focus',
  POV: '24mm lens feel, natural perspective',
};

// ───────────────────────────── Text helpers ─────────────────────────────

export function countWords(text: string): number {
  return String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function str(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

function squash(text: string): string {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([,;])(?:\s*[,;])+/g, '$1')
    .replace(/\.(?:\s*\.)+/g, '.')
    .replace(/^[\s,;:.]+/, '')
    .trim();
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function lowerFirst(s: string): string {
  if (!s) return s;
  // Chỉ hạ chữ hoa của từ thông dụng đầu câu, không đụng vào tên riêng.
  if (/^(A|An|The|Its|Their|His|Her|Both|Each|Eyes|Eye|Looking|Staring|Gazing|Glancing|Watching|Peering|Locked|Fixed|On|At|Toward|Towards|Into|Up|Down|Over|Past|Across|Back|Away|Straight|Worry|Relief|Panic|Shock|Surprise|Fear|Rage|Joy|Pride|Focus|Annoyance|Exhaustion|Wariness)\b/.test(s)) {
    return s.charAt(0).toLowerCase() + s.slice(1);
  }
  return s;
}

function sentence(text: string): string {
  let s = squash(text).replace(/[\s,;:—–-]+$/, '');
  if (!s) return '';
  if (!/[.!?]$/.test(s)) s += '.';
  return cap(s);
}

function stripEnd(text: string): string {
  return squash(text).replace(/[\s,;:.!?—–-]+$/, '');
}

const DANGLING_TAIL_RE =
  /\s+(?:and|or|but|with|of|the|a|an|to|in|on|at|as|while|for|from|by|into|onto|its|their|his|her|that|which|who|whose|then|than|so|over|under|near|beside|across|through|around|behind|toward|towards|distant|far)$/i;

function clampWords(text: string, max: number): string {
  const words = squash(text).split(' ').filter(Boolean);
  if (!max || max <= 0) return '';
  if (words.length <= max) return words.join(' ');
  let out = words.slice(0, max).join(' ');
  for (let i = 0; i < 4; i++) {
    out = out.replace(/[\s,;:—–-]+$/, '');
    const next = out.replace(DANGLING_TAIL_RE, '');
    if (next === out) break;
    out = next;
  }
  return out.replace(/[\s,;:—–-]+$/, '');
}

function article(word: string): string {
  return /^[aeiou]/i.test(String(word || '').trim()) ? 'an' : 'a';
}

function withArticle(phrase: string): string {
  const p = squash(phrase);
  if (!p) return p;
  if (/^(a|an|the|some|one|two|three|several|her|his|its|their)\b/i.test(p)) return p;
  return `${article(p)} ${p}`;
}

function stripArticle(phrase: string): string {
  return squash(phrase).replace(/^(a|an|the)\s+/i, '');
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Bỏ dấu tiếng Việt -> ASCII. */
export function asciiFold(s: string): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/** Mã ASCII UPPER_SNAKE an toàn cho thư mục nhân vật / bối cảnh Flow (MEM-10). */
export function toSafeId(input: string, fallback = 'ENTITY'): string {
  const id = asciiFold(String(input ?? ''))
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
    .replace(/_+$/g, '');
  if (!id) return fallback;
  return /^[0-9]/.test(id) ? `C_${id}` : id;
}

function humanizeId(id: string): string {
  return String(id || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function titleCaseVi(s: string): string {
  return squash(s)
    .split(' ')
    .map((w) => (w ? w.charAt(0).toLocaleUpperCase('vi') + w.slice(1) : w))
    .join(' ');
}

/** Regex khớp nguyên từ, an toàn với chữ có dấu (\b của JS chỉ hiểu ASCII). */
function vw(pattern: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`, 'iu');
}

function findAll(res: RegExp[], text: string): string[] {
  const out: string[] = [];
  for (const re of res) {
    const g = re.global ? re : new RegExp(re.source, re.flags + 'g');
    for (const m of text.matchAll(g)) out.push(m[0].trim());
  }
  return out;
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/** Bỏ các mệnh đề (ngăn bởi dấu phẩy / chấm phẩy / gạch dài) khớp điều kiện xấu, giữ phần còn lại của câu. */
function dropClauses(text: string, bad: (clause: string) => boolean): string {
  const sentences = squash(text).split(/(?<=[.!?])\s+/);
  const kept: string[] = [];
  for (const sent of sentences) {
    if (!sent) continue;
    const endMatch = sent.match(/[.!?]+$/);
    const end = endMatch ? endMatch[0] : '';
    const body = end ? sent.slice(0, -end.length) : sent;
    const clauses = body.split(/\s*[,;]\s+|\s+[—–]\s+|\s+-\s+/);
    const good = clauses.filter((c) => c.trim() && !bad(c));
    if (!good.length) continue;
    let joined = good.join(', ');
    if (good[0] !== clauses[0]) joined = cap(joined.replace(/^(and|but|or|then|so|while|yet)\s+/i, ''));
    kept.push(joined + end);
  }
  return kept.join(' ');
}

// ───────────────────────────── Lint vocabulary ─────────────────────────────

const NEGATION_RE =
  /\b(?:no|not|zero|never|without|avoid|avoids|avoiding|nor|cannot|none|nothing|nobody|\w+n['’]t)\b/gi;
const ARTIFACT_RE = /\b(?:domes?|suspended mid-?air|supernova|thermonuclear|cataclysmic|time stops|frozen in time|force field|bubble shield)\b/gi;
const EFFECT_TERM_RE =
  /\b(?:lava|lightning|explosions?|exploding|explodes?|sparks?|fireballs?|fire balls?|shock ?waves?|lasers?|(?<!\b(?:sun|moon|light|sunlight|moonlight|day|daylight|window)[\s-]?)beams?)\b/gi;
/** Hành động va chạm / di chuyển lớn: không diễn được trong một cảnh cận mặt. */
const CONTACT_ACTION_RE =
  /\b(?:charg(?:e|es|ed|ing)|slam\w*|throw\w*|threw|tumbl\w*|collid\w*|bit(?:e|es|ing)\b(?!\s+(?:a|her|his|its|their|the)\s+(?:lower\s+)?lip)|leap\w*|lung(?:e|es|ed|ing)|rid(?:e|es|ing)\b|rode\b|run(?:s|ning)?\b|ran\b|blast\w*|tackl\w*|headbutt\w*|smash\w*|crash\w*|toppl\w*|chas(?:e|es|ed|ing)\b|sprint\w*|swe(?:ep|eps|eping|pt)\b)/i;

export function hasContactAction(text: string): boolean {
  return CONTACT_ACTION_RE.test(String(text || ''));
}
const PURPLE_RE = /\b(?:purple|violet|magenta|lilac|lavender|indigo|mauve)\b/i;
const ORANGE_RE = /\b(?:orange|amber|tangerine|apricot)\b/i;
const CYAN_RE = /\b(?:cyan|teal|turquoise|aqua|aquamarine)\b/i;
const METRIC_RES: RegExp[] = [
  /\b\d+(?:[.,]\d+)?\s?-?(?:m\/s|km\/h|mph|km|cm|m|meters?|metres?|kilometers?|kilometres?|feet|foot|ft|tons?|tonnes?|kg|kilograms?|lbs?|degrees?|deg|fps|percent|k)\b/gi,
  /[+±-]?\d+(?:[.,]\d+)?\s?(?:°|%)/g,
  /\b[XYZ]\s?=/g,
  /\b\d+(?:\.\d+)?s\s?[-–]\s?\d+(?:\.\d+)?s\b/g,
];
const RAW_ID_RES: RegExp[] = [/@[A-Za-z_]\w*/g, /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g, /\bSTAGE\s*:/g];
const TEXT_REQUEST_RE =
  /\b(?:text|labels?|labell?ed|captions?|titles?|typography|lettering|logos?|watermarks?|subtitles?|signage)\b/gi;
const PHOTO_WORD_RE = /\b(?:photograph(?:y|ic|s)?|photo-?real(?:istic|ism)?|8k|hyper-?realistic|dslr)\b/gi;

const WORD_RANGES: Record<PremiumPromptKind, [number, number]> = {
  image: [50, 130],
  video: [30, 100],
  sheet: [40, 120],
  edit: [40, 160],
};

function effectTerms(text: string): string[] {
  const out: string[] = [];
  for (const m of String(text || '').matchAll(EFFECT_TERM_RE)) {
    const w = m[0].toLowerCase().replace(/\s+/g, '');
    let stem = w;
    if (/^explo/.test(w)) stem = 'explosion';
    else if (/^shockwave/.test(w)) stem = 'shockwave';
    else if (/^fireball/.test(w)) stem = 'fireball';
    else if (w !== 'lava') stem = w.replace(/s$/, '');
    out.push(stem);
  }
  return uniq(out);
}

function hasHueTrio(text: string): boolean {
  const t = String(text || '');
  return PURPLE_RE.test(t) && ORANGE_RE.test(t) && CYAN_RE.test(t);
}

/** Che phần câu thoại sau "says ...:" để từ phủ định trong lời thoại không bị tính là lệnh phủ định. */
function maskDialogue(text: string): string {
  return String(text || '').replace(
    /(\bsays\b[^:.!?\n]{0,80}:)[\s\S]*?(?=\s(?:SFX|Ambient noise|Ambient)\s*:|$)/gi,
    '$1 LINE.'
  );
}

/**
 * Bộ kiểm tra prompt THẬT: đếm từ theo loại, bắt số đo, ID thô, ngoặc vuông, từ phủ định, ngoặc kép quanh thoại,
 * từ ẩn dụ gây ảo giác, chồng hiệu ứng và bộ ba màu tím + cam + cyan.
 */
export function lintPremiumPrompt(
  text: string,
  kind: PremiumPromptKind,
  opts: { maxEffectTerms?: number; style?: PremiumStyleKey; shotSize?: string } = {}
): PremiumLintReport {
  const t = String(text ?? '');
  const issues: string[] = [];
  const words = countWords(t);
  const [min, max] = WORD_RANGES[kind] || WORD_RANGES.image;
  if (words < min || words > max) issues.push(`word count ${words} outside ${min}-${max} for ${kind}`);

  const metric = uniq(findAll(METRIC_RES, t));
  if (metric.length) issues.push(`measurement tokens: ${metric.join(', ')}`);
  const ids = uniq(findAll(RAW_ID_RES, t));
  if (ids.length) issues.push(`raw IDs: ${ids.join(', ')}`);
  if (/[\[\]]/.test(t)) issues.push('square brackets');

  const masked = maskDialogue(t);
  const neg = uniq(findAll([NEGATION_RE], masked).map((w) => w.toLowerCase()));
  if (neg.length) issues.push(`negation words: ${neg.join(', ')}`);
  if (/["“”„«»]/.test(t) || /\bsays\b[^:]{0,80}:\s*['‘’]/i.test(t)) issues.push('quotation marks around dialogue');
  const frag = DANGLING_FRAGMENT_LINT_RE.exec(masked);
  if (frag) issues.push(`dangling fragment after truncation: "${squash(frag[0]).slice(0, 60)}"`);

  const art = uniq(findAll([ARTIFACT_RE], t).map((w) => w.toLowerCase()));
  if (art.length) issues.push(`artifact/metaphor words: ${art.join(', ')}`);

  const fx = effectTerms(t);
  const maxFx = typeof opts.maxEffectTerms === 'number' ? opts.maxEffectTerms : 1;
  if (fx.length > maxFx) issues.push(`too many effect terms (${fx.join(', ')}); keep at most ${maxFx}`);

  if (hasHueTrio(t)) issues.push('three competing hues (purple + orange + cyan families)');

  const textReq = uniq(findAll([TEXT_REQUEST_RE], masked).map((w) => w.toLowerCase()));
  if (textReq.length) issues.push(`text/label request: ${textReq.join(', ')}`);

  if (opts.shotSize && FACE_SIZES.has(opts.shotSize) && kind !== 'sheet') {
    const m = CONTACT_ACTION_RE.exec(maskDialogue(t));
    if (m) issues.push(`face-size shot (${opts.shotSize}) asks for a contact/locomotion action: ${m[0].toLowerCase()}`);
  }

  if (opts.style && opts.style !== 'photoreal') {
    const photo = uniq(findAll([PHOTO_WORD_RE], t).map((w) => w.toLowerCase()));
    if (photo.length) issues.push(`photo wording in ${opts.style} style: ${photo.join(', ')}`);
  }

  return { ok: issues.length === 0, words, issues };
}

// ───────────────────────────── Sanitising free text (LLM / user) ─────────────────────────────

const NUM_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

// Thay theo CỤM (không thay từng từ): "molten lava dripping" -> "glowing orange drool dripping", "crackling with purple lightning" -> "with bright purple zigzag stripes".
const EFFECT_SOFTENERS: Array<[RegExp, string | ((m: string, ...g: any[]) => string)]> = [
  [/\b(?:molten\s+)?lava\b(?=\s+(?:dripping|oozing|drooling|trickling|seeping|pouring|flowing))/gi, 'glowing orange drool'],
  [
    /\bcrackling with\s+(?:(\w+)\s+)?lightning\b/gi,
    (_m: string, c?: string) => `with bright ${c && !/^(?:the|a|an)$/i.test(c) ? `${c} ` : ''}zigzag stripes`,
  ],
  [/\b(?:molten\s+)?lava\b/gi, 'glowing orange'],
  [/\blightning\b/gi, 'zigzag'],
  [/\bsparks\b/gi, 'glints'],
  [/\bspark\b/gi, 'glint'],
  [/\bexplosions\b/gi, 'bursts'],
  [/\bexplosion\b|\bexploding\b|\bexplodes?\b/gi, 'burst'],
  [/\bfire ?balls?\b/gi, 'glowing orb'],
  [/\bshock ?waves?\b/gi, 'ripple'],
  [/\blasers?\b/gi, 'bright'],
  [/(?<!\b(?:sun|moon|light|sunlight|moonlight|day|daylight|window)[\s-]?)\bbeams\b/gi, 'stripes'],
  [/(?<!\b(?:sun|moon|light|sunlight|moonlight|day|daylight|window)[\s-]?)\bbeam\b/gi, 'stripe'],
];

/** "glowing glowing orange cracks" -> "glowing orange cracks" (sau khi thay cụm hiệu ứng). */
function dedupeWords(text: string): string {
  return String(text || '').replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');
}

/** "A huge spinosaurus" -> "a huge spinosaurus" khi cụm ngoại hình đứng sau tên. */
function lcArticle(text: string): string {
  return String(text || '').replace(/^(A|An|The)\b/, (m) => m.toLowerCase());
}

/** Đổi từ hiệu ứng trong mô tả ngoại hình thành từ chỉ màu/hoa văn (giữ nhận diện, bỏ "pháo hoa"). */
function softenEffects(text: string, keepFirst = false): string {
  let t = String(text || '');
  const terms = effectTerms(t);
  if (!terms.length) return t;
  const keep = keepFirst ? terms[0] : '';
  for (const [re, rep] of EFFECT_SOFTENERS) {
    t = t.replace(re, (m: string, ...g: any[]) => {
      const stem = effectTerms(m)[0];
      if (stem && stem === keep) return m;
      return typeof rep === 'function' ? rep(m, ...g) : rep;
    });
  }
  return squash(dedupeWords(t));
}

function stripPurple(text: string): string {
  return dropClauses(text, (c) => PURPLE_RE.test(c));
}

/**
 * Làm sạch văn bản tiếng Anh do LLM/người dùng viết: thay ID bằng tên hiển thị, bỏ ngoặc vuông, số đo, mốc thời gian,
 * đổi số nhỏ thành chữ, bỏ mệnh đề phủ định và từ ẩn dụ gây ảo giác. Idempotent.
 */
function cleanEn(raw: any, idMap?: Map<string, string>): string {
  let t = str(raw);
  if (!t.trim()) return '';
  t = t.replace(/[\r\n\t]+/g, ' ');
  t = t.replace(/[“”„«»"]/g, '');
  t = t.replace(/(^|\s)['‘’]([^'‘’]{1,80})['‘’](?=[\s.,!?;:]|$)/g, '$1$2');
  t = t.replace(/\[([^\]]*)\]/g, (_m, inner: string) => (/_/.test(inner) && /^[A-Z0-9_\s:-]+$/.test(inner) ? '' : inner));
  t = t.replace(/[\[\]{}<>]/g, '');
  t = t.replace(/@?\bSTAGE\s*:\s*/g, '');
  t = t.replace(/@?\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/g, (_m, id: string) => idMap?.get(id) || humanizeId(id));
  t = t.replace(/@([\p{L}\w]+)/gu, (_m, id: string) => idMap?.get(toSafeId(id, '')) || id);
  t = t.replace(/\(?\b\d+(?:\.\d+)?s?\s?[-–]\s?\d+(?:\.\d+)?s\b\)?:?/g, '');
  t = t.replace(/\b[XYZ]\s?[:=]\s?-?\d+(?:\.\d+)?\s?(?:m|%)?/g, '');
  t = t.replace(/[+±-]?\d+(?:[.,]\d+)?\s?(?:°C?|%)/g, '');
  t = t.replace(
    /\b\d+(?:[.,]\d+)?\s?-?(?:m\/s|km\/h|mph|km|cm|m|meters?|metres?|kilometers?|kilometres?|feet|foot|ft|tons?|tonnes?|kg|kilograms?|lbs?|degrees?|deg|fps|percent|k)\b/gi,
    ''
  );
  t = t.replace(/(?<![\w#.,])(\d{1,2})(?![\w.,%°])/g, (_m, d: string) => NUM_WORDS[Number(d)] ?? '');
  t = t.replace(/(?<![\w#])\d{3,}(?:[.,]\d+)*(?![\w%°])/g, '');
  t = dropClauses(t, (c) => new RegExp(NEGATION_RE.source, 'i').test(c) || new RegExp(ARTIFACT_RE.source, 'i').test(c));
  t = t.replace(/\(\s*\)/g, '');
  return tidyEn(t);
}

/** Sửa chỗ hở sau khi xoá token: "at on the dune" -> "on the dune", "A otter" -> "An otter". */
function tidyEn(text: string): string {
  let t = squash(text);
  for (let i = 0; i < 3; i++) {
    const next = t
      // "about to hit" / "up to" / "close to" là cụm có nghĩa (trước va chạm), không phải giới từ treo.
      .replace(/\b(?:at|of|in|on|to|by|from|with|for|about(?!\s+to\b)|around)\s+(?=(?:at|of|in|on|to|by|from|with|for|and|or)\b|[,.;:!?]|$)/gi, '')
      .replace(/\b(?:and|or)\s+(?=[,.;:!?]|$)/gi, '');
    if (next === t) break;
    t = squash(next);
  }
  t = t.replace(/\b([Aa])\s+(?=[aeiou][a-z])/g, (_m, a: string) => `${a}n `).replace(/\ban\s+(?=[bcdfghjklmnpqrstvwxyz][a-z])/g, 'a ');
  return squash(t);
}

/** Một mô tả bị cắt cụt (mất chủ ngữ, bắt đầu bằng giới từ / liên từ) coi như không dùng được. */
function usableDescription(text: string, minWords: number): boolean {
  return countWords(text) >= minWords && !/^(with|and|or|but|in|on|at|of|under|inside|into|while|as|to|from|by)\b/i.test(text);
}

function cleanName(raw: string): string {
  let n = squash(str(raw).replace(/[\[\]@"“”]/g, ''));
  if (!n) return '';
  if (/_/.test(n) || /^[A-Z0-9 ]{3,}$/.test(n)) n = humanizeId(n.replace(/^STAGE:\s*/i, ''));
  n = asciiFold(n).replace(/[^A-Za-z0-9' -]/g, '').trim();
  return clampWords(n, 3);
}

// ───────────────────────────── Prompt-building helpers ─────────────────────────────

function preset(style: PremiumStyleKey): PremiumStylePreset {
  return STYLE_PRESETS[style] || STYLE_PRESETS.pixar3d;
}

function coerceStyle(v: any): PremiumStyleKey {
  const s = String(v || '').toLowerCase();
  if (s === 'graphic2d' || s === 'photoreal' || s === 'pixar3d') return s;
  if (/2d|graphic|comic|anime/.test(s)) return 'graphic2d';
  if (/photo|real|documentary/.test(s)) return 'photoreal';
  return 'pixar3d';
}

function buildIdMap(characters: PremiumCharacter[], environment?: PremiumEnvironment | null): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of characters || []) {
    if (!c) continue;
    map.set(c.safeId, c.displayNameEn);
    map.set(toSafeId(c.displayNameVi, ''), c.displayNameEn);
    map.set(toSafeId(c.displayNameEn, ''), c.displayNameEn);
  }
  if (environment?.safeId) map.set(environment.safeId, `the ${stripArticle(envPhrase(environment, 4))}`);
  return map;
}

function shotCharacters(shot: PremiumShot, characters: PremiumCharacter[]): PremiumCharacter[] {
  const out: PremiumCharacter[] = [];
  for (const id of shot?.characters || []) {
    const c = (characters || []).find((x) => x && x.id === id);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

/** Nhân vật mà máy quay "kể" trong cảnh: OTS -> người quay mặt về máy; còn lại -> nhân vật đầu tiên. */
function focusCharacter(shot: PremiumShot, cs: PremiumCharacter[]): PremiumCharacter | undefined {
  if (shot.shotSize === 'OTS' && cs.length >= 2) return cs[1];
  return cs[0];
}

/** Ai đang nhìn: nếu câu ánh nhìn nhắc tên nhân vật chính của khung hình ("looking at Mun") thì chủ thể là người còn lại. */
function gazeOwner(gaze: string, focus: PremiumCharacter | undefined, cs: PremiumCharacter[]): PremiumCharacter | undefined {
  if (!focus || cs.length < 2) return focus;
  const re = new RegExp(`\b${escapeRe(focus.displayNameEn)}\b`, 'i');
  if (!re.test(gaze) || startsWithName(gaze, [focus.displayNameEn])) return focus;
  return cs.find((c) => c !== focus) || focus;
}

/** Phụ kiện màu đặc trưng: đoạn ngay trước "as a signature accent", sau dấu phẩy / "and" cuối cùng. */
function accentPhrase(lookEn: string): string {
  const m = lookEn.match(/^(.*?)\s+as (?:a|the|its|her|his|their)?\s*signature(?: colou?r)? accent/i);
  let body = m ? m[1] : '';
  if (!body) {
    const clause = lookEn.split(/,\s*/).find((c) => /\bsignature\b|\baccent\b/i.test(c));
    if (!clause) return '';
    body = clause.replace(/\b(?:as )?(?:a |the )?signature(?: colou?r)?(?: accent)?\b|\baccent\b/gi, '');
  }
  const parts = body.split(/,\s*|\s+and\s+/);
  return squash(parts[parts.length - 1] || '');
}

const PHRASE_BREAK_RE =
  /^(?:with|and|under|dotted|casting|beside|near|along|across|where|that|which|from|in|on|at|of|through|over|while|as|against|framed|surrounded|leaning|stretching|patterned|filled|covered|raking|streaming|winding|down|up|around|behind|toward|towards|below|above|beneath|between)$/i;
const KEEP_SUFFIX_WORDS = new Set([
  'morning', 'evening', 'ceiling', 'building', 'clearing', 'painting', 'ring', 'king', 'spring', 'string', 'wing', 'thing', 'swing', 'ceiling',
  'red', 'bed', 'shed', 'seed', 'speed', 'weed', 'reed', 'sled', 'hundred', 'bald', 'flatbed',
]);

/** Rút gọn theo ranh giới cụm từ (trước "with/and/from/…" hoặc sau dấu phẩy), không cắt giữa cụm, bỏ phân từ treo. */
function clampPhrase(text: string, max: number): string {
  const t = squash(text);
  const words = t.split(' ').filter(Boolean);
  if (words.length <= max) return t.replace(/[\s,;:—–-]+$/, '');
  let cut = -1;
  for (let i = Math.min(max, words.length - 1); i >= 2; i--) {
    if (PHRASE_BREAK_RE.test(words[i].replace(/[,;.]$/, '')) || /[,;]$/.test(words[i - 1])) {
      cut = i;
      break;
    }
  }
  let out = cut >= Math.max(2, Math.ceil(max / 2)) ? words.slice(0, cut).join(' ') : clampWords(t, max);
  for (let k = 0; k < 4; k++) {
    let next = out.replace(/[\s,;:—–-]+$/, '').replace(DANGLING_TAIL_RE, '');
    const last = (next.match(/(\S+)$/) || ['', ''])[1].toLowerCase();
    if (/(?:ed|ing)$/.test(last) && !KEEP_SUFFIX_WORDS.has(last) && countWords(next) > 2) next = next.replace(/\s+\S+$/, '');
    if (next === out) break;
    out = next;
  }
  return out.replace(/[\s,;:—–-]+$/, '');
}

// Đuôi cụt sau khi cắt chữ (bản render dino_premium_v2): "..., Ember." / "..., the tip." / "..., whose single rounded striped head." /
// "... and the brow." / "... the mouth firmly." / "... a smug closed-mouth." — NBP đọc mảnh vụn và bỏ mất hành động.
const FRAG_DET_RE = /^(?:the|a|an|its|his|her|their|this|that|these|those|one|both|each|[A-Z][\w-]*'s)$/;
const FRAG_RELATIVE_RE = /^(?:whose|which|who|that|where|while|as|whom)\b/i;
const TAIL_ADVERB_RE = /^(?:firmly|tightly|slowly|gently|softly|slightly|barely|fully|partly|partially|nearly|almost|quickly|sharply|warily|calmly|loosely|very|so|too|quite|still|just|even|half)$/i;
const TAIL_COMPOUND_ADJ_RE = /^[a-z]+-(?:mouth(?:ed)?|quarter|eyed|lidded|shaped|sized|faced|legged|tailed|toothed|like|thin|deep|high|long|wide|set|tipped|backed|fingered)$/i;

/** Mảnh cụt ở cuối (sau dấu phẩy cuối / "and" / "with"): tên trần, cụm danh từ 1-3 chữ không động từ, mệnh đề quan hệ bị cắt. */
function isDanglingFragment(fragment: string, names: string[] = []): boolean {
  const f = squash(fragment).replace(/[.,;:!?]+$/, '');
  if (!f) return true;
  const words = f.split(' ');
  if (names.some((n) => n && n.toLowerCase() === f.toLowerCase())) return true;
  if (words.length === 1) return true;
  if (FRAG_RELATIVE_RE.test(f)) return true;
  const verbish = words.some((w) => /(?:ing|ed)$/i.test(w) && !KEEP_SUFFIX_WORDS.has(w.toLowerCase()));
  return words.length <= 3 && FRAG_DET_RE.test(words[0]) && !verbish;
}

/**
 * Bỏ đuôi cụt của văn bản ĐÃ BỊ CẮT: trạng từ / tính từ ghép treo ("firmly", "closed-mouth"), mảnh sau dấu phẩy cuối
 * ("Ember", "the tip", "whose ... head"), mảnh "and/with + 1-3 chữ" ("and the brow", "with a smug"). Không đụng văn bản nguyên vẹn.
 */
function trimDanglingTail(text: string, names: string[] = []): string {
  let out = squash(text).replace(/[\s,;:—–-]+$/, '');
  for (let k = 0; k < 6; k++) {
    const before = out;
    const last = (out.match(/(\S+)$/) || ['', ''])[1];
    if (countWords(out) > 2 && (TAIL_ADVERB_RE.test(last) || TAIL_COMPOUND_ADJ_RE.test(last))) {
      out = out.replace(/\s+\S+$/, '');
    } else {
      const comma = out.lastIndexOf(',');
      const tail = comma >= 0 ? out.slice(comma + 1) : '';
      const conj = /\s(?:and|with)\s+((?:\S+\s+){0,2}\S+)$/i.exec(out);
      if (comma >= 0 && countWords(out.slice(0, comma)) >= 2 && isDanglingFragment(tail, names)) out = out.slice(0, comma);
      else if (conj && countWords(out.slice(0, conj.index)) >= 2) {
        const ws = conj[1].split(' ');
        const verbish = ws.some((w) => /(?:ing|ed)$/i.test(w) && !KEEP_SUFFIX_WORDS.has(w.toLowerCase()));
        if (!verbish && (ws.length === 1 || FRAG_DET_RE.test(ws[0]))) out = out.slice(0, conj.index);
      }
    }
    out = out.replace(/[\s,;:—–-]+$/, '').replace(DANGLING_TAIL_RE, '').replace(/[\s,;:—–-]+$/, '');
    if (out === before) break;
  }
  return out;
}

/**
 * Rút gọn theo MỆNH ĐỀ (ngăn bởi dấu phẩy / chấm phẩy): giữ trọn các mệnh đề đầu vừa ngân sách, không bao giờ cắt giữa mệnh đề
 * (trừ khi mệnh đề đầu tiên đã dài hơn ngân sách: khi đó cắt theo cụm rồi bỏ đuôi cụt). Văn bản vừa ngân sách giữ nguyên.
 */
function clampClauses(text: string, max: number, names: string[] = []): string {
  const t = squash(text).replace(/[\s,;:—–-]+$/, '');
  if (!max || max <= 0) return '';
  if (countWords(t) <= max) return t;
  const parts = t.split(/(?<=[,;])\s+/);
  let out = '';
  for (const p of parts) {
    const next = out ? `${out} ${p}` : p;
    if (countWords(next) > max) break;
    out = next;
  }
  out = out.replace(/[\s,;:—–-]+$/, '');
  if (!out) out = trimDanglingTail(clampPhrase(parts[0], max), names);
  return out || clampPhrase(t, max);
}

/**
 * Rút gọn TRƯỜNG của Story Bible (startStateEn / endStateEn / actingBeatEn): theo mệnh đề, rồi bỏ đuôi cụt ("the mouth firmly",
 * "a smug closed-mouth", "the long tail"). Văn bản vừa ngân sách giữ nguyên (idempotent).
 */
function clampField(text: string, max: number, names: string[] = []): string {
  const t = squash(text).replace(/[\s,;:—–-]+$/, '');
  if (countWords(t) <= max) return t;
  return trimDanglingTail(clampClauses(t, max, names), names);
}

/** Văn bản có đuôi cụt (lint): ", Ember." / ", the tip." / ", whose ... head." / "the mouth firmly." / "closed-mouth." cuối câu. */
const DANGLING_FRAGMENT_LINT_RE =
  /,\s+(?:[A-Z][a-z]+|(?:the|its|his|her|their)\s+[a-z-]+|(?:whose|which)\s+[^.,;]{0,60})\.(?=\s|$)|\s(?:firmly|tightly|slightly|barely|nearly)\.(?=\s|$)|\s[a-z]+-(?:mouth|quarter)\.(?=\s|$)/;

/** Rút gọn phụ kiện màu: cắt trước giới từ đầu tiên ("down the back", "on the forehead"), rồi bỏ tính từ phía trước, giữ danh từ. */
function accentShort(accent: string, budget: number): string {
  const words = squash(accent).split(' ').filter(Boolean);
  if (words.length <= budget) return words.join(' ');
  const breakAt = words.findIndex((w, i) => i >= 2 && PHRASE_BREAK_RE.test(w));
  const head = breakAt > 0 ? words.slice(0, breakAt) : words;
  if (head.length <= budget) return head.join(' ');
  const art = /^(a|an|the)$/i.test(head[0]) ? head[0] : '';
  return tidyEn(`${art} ${head.slice(-(Math.max(1, budget - (art ? 1 : 0)))).join(' ')}`);
}

/** Cụm đầu (loài + thân hình). Thiếu chỗ: bỏ "with ..." trước, rồi bỏ tính từ phía trước để GIỮ danh từ chỉ loài. */
function headPhrase(first: string, budget: number): string {
  if (countWords(first) <= budget) return first;
  let head = squash(first.split(/\s+with\s+/i)[0]);
  let words = head.split(' ');
  if (words.length <= budget) return head;
  // Mô tả dáng sau danh từ loài ("... tyrannosaurus standing upright on two hind legs"): cắt trước phân từ / giới từ đầu tiên.
  const cutAt = words.findIndex(
    (w, i) => i >= 2 && (PHRASE_BREAK_RE.test(w) || /^(?:standing|sitting|crouching|leaning|holding|wearing|carrying|walking|perched|posed)$/i.test(w))
  );
  if (cutAt > 0) {
    head = words.slice(0, cutAt).join(' ');
    words = head.split(' ');
    if (words.length <= budget) return head;
  }
  const art = /^(a|an|the)$/i.test(words[0]) ? words[0] : '';
  const tail = words.slice(-(Math.max(1, budget - (art ? 1 : 0))));
  return tidyEn(`${art} ${tail.join(' ')}`);
}

/**
 * Tóm tắt ngoại hình trong ngân sách từ: cụm đầu (loài) + các chi tiết giữa nếu còn chỗ + LUÔN giữ phụ kiện màu đặc trưng.
 * includeDetails=false -> chỉ "loài + phụ kiện" (dùng cho keyframe vì ảnh tham chiếu đã mang chi tiết).
 */
function lookSummary(lookEn: string, max: number, includeDetails = true): string {
  const t = squash(lookEn);
  if (!t) return '';
  if (includeDetails && countWords(t) <= max) return t;
  const accent = accentPhrase(t);
  const body = t.replace(/\s+as (?:a|the|its|her|his|their)?\s*signature(?: colou?r)? accent.*$/i, '');
  let parts = body.split(/,\s*/);
  if (accent) {
    const last = parts[parts.length - 1];
    const stripped = squash(last.slice(0, Math.max(0, last.toLowerCase().lastIndexOf(accent.toLowerCase()))).replace(/\s*\band\s*$/i, ''));
    parts = stripped ? [...parts.slice(0, -1), stripped] : parts.slice(0, -1);
  }
  const accentText = accent ? accentShort(accent, Math.max(3, Math.floor(max / 2))) : '';
  const budget = max - (accentText ? countWords(accentText) + 1 : 0);
  let out = headPhrase(parts[0] || t, Math.max(2, budget));
  if (includeDetails) {
    for (const mid of parts.slice(1)) {
      if (countWords(out) + countWords(mid) + 1 > budget) break;
      out += `, ${mid}`;
    }
  }
  if (!accentText) return clampPhrase(out, max);
  const joiner = /\bwith\b/i.test(out) || out.includes(',') ? 'and' : 'with';
  return `${out} ${joiner} ${accentText}`;
}

/** Một cụm nhận diện ngắn: loài + thân hình + phụ kiện màu đặc trưng. */
function lookPhrase(c: PremiumCharacter, maxWords: number): string {
  const look = cleanEn(c.lookEn);
  if (!look) return withArticle(c.species || 'character');
  return lcArticle(lookSummary(look, maxWords, false));
}

/** Cụm nhận diện CỐ ĐỊNH của một nhân vật: dùng nguyên văn ở mọi keyframe để Veo Quality (không có Ingredients) giữ đúng nhân vật. */
const IDENTITY_WORDS = 10;
function identityPhrase(c: PremiumCharacter): string {
  return lookPhrase(c, IDENTITY_WORDS);
}

function envPhrase(env: PremiumEnvironment, maxWords: number): string {
  const look = cleanEn(env?.lookEn) || 'an open natural landscape';
  return clampPhrase(look.split(/;\s*/)[0], maxWords);
}

/** Hạ chữ hoa đầu cụm mô tả (không đụng từ viết tắt). */
function lcFirst(s: string): string {
  return s && /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** Câu phong cách theo cỡ cảnh: toàn cảnh/POV bỏ "shallow depth of field" để khỏi mâu thuẫn với "deep focus". */
function styleSentenceFor(p: PremiumStylePreset, size: PremiumShotSize | 'PLATE', hasCharacters = true): string {
  const wide = size === 'PLATE' || size === 'WS' || size === 'EWS' || size === 'POV';
  const noFaces = size === 'PLATE' || !hasCharacters;
  if (!wide && !noFaces) return p.styleSentenceEn;
  return sentence(dropClauses(p.styleSentenceEn, (c) => (wide && /depth of field/i.test(c)) || (noFaces && /\bfaces?\b|\beyes\b/i.test(c))));
}

function refIndex(order: string[] | undefined, test: (entry: string) => boolean, prefer?: RegExp): number {
  if (!Array.isArray(order) || !order.length) return 0;
  const entries = order.map((s) => String(s || '').toLowerCase());
  if (prefer) {
    const idx = entries.findIndex((e) => test(e) && prefer.test(e));
    if (idx >= 0) return idx + 1;
  }
  const idx = entries.findIndex(test);
  return idx >= 0 ? idx + 1 : 0;
}

function charRefIndex(order: string[] | undefined, c: PremiumCharacter): number {
  const keys = [c.id, c.safeId.toLowerCase(), c.displayNameEn.toLowerCase()].filter(Boolean);
  return refIndex(order, (e) => keys.some((k) => e.includes(k)), /sheet|turnaround|body/);
}

function envRefIndex(order: string[] | undefined): number {
  return refIndex(order, (e) => /env|stage|plate|setting|location|background|scene/.test(e));
}

function isVertical(aspect: string): boolean {
  const m = String(aspect || '').match(/(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)/);
  return !!m && Number(m[1]) < Number(m[2]);
}

function aspectSentence(aspect: string): string {
  const m = String(aspect || '').match(/(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)/);
  if (!m) return '';
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (w > h) return 'Wide horizontal composition.';
  if (w < h) return 'Tall vertical composition with layered depth.';
  return 'Square composition.';
}

function angleWord(shot: PremiumShot): string {
  // Trạng thái đầu cảnh tự nêu góc máy ("low angle, Ember ...") -> dùng đúng góc đó, không để câu cỡ cảnh mâu thuẫn (shot 7 r3).
  const stated = /^\s*(low|high)[- ]angle\b|^\s*(eye)[- ]level\b/i.exec(String(shot?.startStateEn || ''));
  if (stated) return stated[1] ? `${stated[1].toLowerCase()}-angle` : 'eye-level';
  if (shot.shotSize === 'EWS') return 'high-angle';
  if (shot.beat === 'climax' && ['WS', 'MS', 'MCU', 'CU', 'OTS'].includes(shot.shotSize)) return 'low-angle';
  if (shot.beat === 'reversal' && ['WS', 'MS', 'MCU', 'CU', 'ECU'].includes(shot.shotSize)) return 'high-angle';
  return 'eye-level';
}

function framingSentence(shot: PremiumShot, cs: PremiumCharacter[]): string {
  const size = shot.shotSize;
  if (size === 'POV') {
    const viewer = cs[0]?.displayNameEn;
    return viewer ? `Point-of-view shot through ${viewer}'s eyes, ${LENS_FEEL_EN.POV}.` : `Point-of-view shot, ${LENS_FEEL_EN.POV}.`;
  }
  if (size === 'INSERT') return `Insert detail shot, ${LENS_FEEL_EN.INSERT}.`;
  return sentence(`${cap(angleWord(shot))} ${SIZE_NAME_EN[size]}, ${LENS_FEEL_EN[size]}`);
}

function compositionSentence(shot: PremiumShot, cs: PremiumCharacter[], aspect: string): string {
  const a = cs[0]?.displayNameEn || '';
  const b = cs[1]?.displayNameEn || '';
  const subj = a && b ? `${a} and ${b}` : a || 'The subject';
  const poss = a ? `${a}'s` : "The subject's";
  const vertical = isVertical(aspect);
  if (!a && shot.shotSize !== 'INSERT') {
    return `Clear readable geography with a strong foreground, midground and background, composed on rule-of-thirds lines${vertical ? ' in a tall frame' : ''}.`;
  }
  // Trục 180° (L-review): char1 bên trái nhìn sang phải, char2 bên phải nhìn sang trái — cả ở cảnh cận một người.
  const fa = cs[0] ? screenFacing(shot, cs[0]) : 'right';
  const pair = cs[0] && cs[1] ? leftRight(shot, cs[0], cs[1]) : null;
  const pairText = pair
    ? `${pair[0].displayNameEn} on the left facing ${screenFacing(shot, pair[0])}, ${pair[1].displayNameEn} on the right facing ${screenFacing(shot, pair[1])}`
    : '';
  switch (shot.shotSize) {
    case 'EWS':
      return pair
        ? `${pairText}, tiny against the vast landscape on a rule-of-thirds line with generous open space${vertical ? ' above' : ''}.`
        : `${subj} tiny against the vast landscape facing screen-${fa}, placed on a rule-of-thirds line with generous open space${vertical ? ' above' : ''}.`;
    case 'WS':
      // Nhân vật quá nhỏ thì hành động (quật đuôi, ngã) không đọc được và Veo không diễn nổi -> chiếm ~nửa chiều cao khung.
      return pair
        ? `${pairText}, full bodies filling half the frame height.`
        : `${subj} in full body facing screen-${fa}, filling half the frame height, on a rule-of-thirds line with clear geography.`;
    case 'MS':
      // "So le theo chiều sâu" từng đặt nhân vật B sau lưng A -> cú húc/đớp không thể xảy ra. Hai nhân vật phải đối mặt.
      return pair
        ? `${pairText}, framed head to midsection, both faces readable.`
        : `${subj} framed from head to midsection facing screen-${fa}, slightly off-centre, with room in the direction of the gaze.`;
    case 'MCU':
      return `${poss} head and chest fill the frame in three-quarter view facing screen-${fa}, background softly blurred${b ? `, ${b} soft in the background` : ''}.`;
    case 'CU':
      return `${poss} face fills most of the frame in three-quarter view facing screen-${fa}${b ? `, ${b} soft in the background` : ''}.`;
    case 'ECU':
      return `${poss} eyes and brow fill the frame, the head turned toward screen-${fa}.`;
    case 'OTS': {
      if (!(a && b)) return `${subj} framed from head to midsection facing screen-${fa}, slightly off-centre, with room in the direction of the gaze.`;
      // cs[0] = vai tiền cảnh (quay lưng), cs[1] = người quay mặt về máy. Vai tiền cảnh đứng đúng phía của nó trên trục.
      const fgSide = screenFacing(shot, cs[0]) === 'right' ? 'left' : 'right';
      const bSide = fgSide === 'left' ? 'right' : 'left';
      return `Over ${a}'s shoulder in soft foreground blur on the ${fgSide}, ${b} on the ${bSide} faces camera in sharp focus, turned toward screen-${screenFacing(shot, cs[1])}.`;
    }
    case 'INSERT':
      return 'The detail fills the frame against a softly blurred background.';
    case 'POV':
      return a && b ? `${b} ahead in the centre of the frame, seen through ${a}'s eyes.` : 'Looking ahead into the scene.';
    default:
      return '';
  }
}

function startsWithName(text: string, names: string[]): boolean {
  const t = text.trim().toLowerCase();
  return names.some((n) => n && (t.startsWith(n.toLowerCase() + ' ') || t.startsWith(n.toLowerCase() + "'") || t.startsWith(n.toLowerCase() + ',')));
}

const GAZE_VERB_3RD: Record<string, string> = {
  looking: 'looks', staring: 'stares', gazing: 'gazes', glancing: 'glances', watching: 'watches',
  peering: 'peers', squinting: 'squints', peeking: 'peeks', glaring: 'glares', beaming: 'beams',
};

function gazeSentence(name: string, gaze: string, mode: 'still' | 'motion', names: string[]): string {
  const g = stripEnd(gaze);
  if (!g) return '';
  const who = name || 'The subject';
  if (startsWithName(g, names)) {
    if (mode === 'motion') {
      return sentence(g.replace(/^(\S+(?:\s\S+)?)\s+(looking|staring|gazing|glancing|watching|peering|squinting|peeking|glaring)\b/i, (m, n: string, v: string) =>
        names.some((x) => x && x.toLowerCase() === n.toLowerCase()) ? `${n} ${GAZE_VERB_3RD[v.toLowerCase()]}` : m
      ));
    }
    return sentence(g);
  }
  if (mode === 'motion' && /^eyes?\s+(?!keep)\w+ing\b/i.test(g)) return sentence(`${who}'s ${lowerFirst(g).replace(/^(eyes?)\s+/i, '$1 keep ')}`);
  if (/^(looking|staring|gazing|glancing|watching|peering|squinting|peeking)\b/i.test(g)) {
    return sentence(`${who} ${mode === 'still' ? 'is' : 'keeps'} ${lowerFirst(g)}`);
  }
  if (/^eyes?\b/i.test(g)) return sentence(`${who}'s ${lowerFirst(g)}`);
  if (/^(locked|fixed|focused|glued|trained)\b/i.test(g)) {
    return sentence(`${who}'s gaze ${mode === 'still' ? 'is' : 'stays'} ${lowerFirst(g)}`);
  }
  if (/^(at|on|toward|towards|to|into|up|down|over|past|across|back|away|off|straight|around|ahead|sideways)\b/i.test(g)) {
    return sentence(`${who} looks ${lowerFirst(g)}`);
  }
  return sentence(g);
}

/**
 * Ánh nhìn mang tư thế / di chuyển ("looking up at the sky while falling") mà trạng thái đầu cảnh không có -> mâu thuẫn:
 * keyframe shot 7 dino_premium_v2 thành Ember ngã cười thay vì cận chân đứng trên bùn.
 */
function gazeContradictsStart(gaze: string, start: string): boolean {
  const g = String(gaze || '');
  if (!g.trim()) return false;
  const m = STANCE_CONFLICT_RE.exec(g) || LOCOMOTION_RE.exec(g);
  if (!m) return false;
  const stem = m[0].toLowerCase().replace(/(?:ing|ed|en|es|s)$/, '').slice(0, 4);
  return stem.length >= 3 && !new RegExp(`\\b${escapeRe(stem)}`, 'i').test(String(start || ''));
}

const BODY_PART_RE =
  /\b(eyes?|brows?|mouth|smile|grin|frown|glare|expression|cheeks|jaws?|ears|nostrils|shoulders|posture|body|grip|legs?|muscles|tail|snout|steps)\b/i;

function actingSentence(name: string, acting: string, names: string[]): string {
  const a = stripEnd(acting);
  if (!a) return '';
  if (!name || startsWithName(a, names)) return sentence(a);
  if (/\bthe face\b/i.test(a)) return sentence(a.replace(/\bthe face\b/i, `${name}'s face`));
  if (/^(the|her|his|its|their)\b/i.test(a) && BODY_PART_RE.test(a.split(/\s+/).slice(0, 4).join(' '))) {
    return sentence(a.replace(/^(the|her|his|its|their)\b/i, `${name}'s`));
  }
  if (/^(eyes?|brows?|mouth|cheeks|ears|nostrils|shoulders|posture|jaws?|tail)\b/i.test(a)) return sentence(`${name}'s ${lowerFirst(a)}`);
  return sentence(`On ${name}'s face, ${lowerFirst(a)}`);
}

function cameraSentence(move: string): string {
  const m = stripEnd(move);
  if (!m || /^(static|locked[- ]off|still|fixed)\b/i.test(m)) return 'Static camera, one continuous shot.';
  return sentence(`${cap(m)}, one continuous shot`);
}

/**
 * Đo trên bản nháp Veo: đẩy máy ở góc qua vai làm nhân vật tiền cảnh biến mất; đẩy máy ở cảnh toàn có nhân vật
 * di chuyển làm không gian "mọc" thêm vật thể. Hai trường hợp này giữ máy đứng yên.
 */
function safeCameraMove(shot: PremiumShot): string {
  const m = cleanCameraMove(shot.cameraMoveEn);
  if (shot.shotSize === 'OTS') return 'static';
  if ((shot.shotSize === 'WS' || shot.shotSize === 'EWS') && /\b(push|dolly|zoom|crane|track)/i.test(m)) return 'static';
  // Cận mặt: máy di chuyển nhiều làm trôi nhận diện khuôn mặt.
  if ((shot.shotSize === 'CU' || shot.shotSize === 'ECU') && m !== 'slow push in') return 'static';
  return m;
}

/**
 * Tên loài trần ("the tyrannosaurus") kéo Veo Quality về hình mẫu khủng long thật: bản cuối đã biến Ember từ T-rex non
 * hoạt hình thành T-rex trưởng thành kiểu thật. Lần nhắc đầu dùng mô tả nhận diện hoạt hình + dấu hiệu đặc trưng,
 * các lần sau dùng "the cartoon <loài>".
 */
function speciesHandles(c: PremiumCharacter, style: PremiumStyleKey): { first: string; short: string; next: string } {
  const sp = stripEnd(cleanEn(c.species)).toLowerCase() || 'creature';
  const look = cleanEn(c.lookEn);
  // "cartoon" kéo Veo về kiểu toon 2D phẳng; khung hình & bảng nhân vật nói "3D animated" nên giữ cùng một từ.
  const kind = style === 'photoreal' ? '' : style === 'graphic2d' ? 'hand-drawn ' : 'animated ';
  const lookLc = look.toLowerCase();
  const spAt = lookLc.indexOf(sp);
  const adj = spAt > 0
    ? clampWords(look.slice(0, spAt).replace(/^(a|an|the)\s+/i, '').replace(/,/g, '').trim(), 3).toLowerCase()
    : '';
  // Dấu hiệu đặc trưng = cụm cuối cùng ngay trước "as a signature accent", bỏ phần chỉ vị trí ("down the back").
  const beforeAccent = look.split(/\s+as (?:a|the|its|his|her) signature accent/i)[0];
  const hasAccent = beforeAccent.length < look.length;
  const lastPart = hasAccent ? beforeAccent.split(/,\s*|\s+and\s+/).pop() || '' : '';
  const accent = clampWords(
    lastPart.replace(/^(and|with)\s+/i, '').replace(/^(a|an)\s+/i, '').replace(/\s+(down|along|on|across|over|around|running)\b.*$/i, ''),
    7
  ).toLowerCase();
  const short = squash(`the ${adj ? `${adj} ` : ''}${kind}${sp}`);
  const first = squash(`${short}${accent ? ` with ${accent}` : ''}`);
  return { first, short, next: `the ${kind}${sp}` };
}

/**
 * Veo đọc tên riêng như tên người: bản nháp vẽ chữ "Ember" lên góc hình và thêm một cô gái vào mép khung khi prompt
 * nhắc tên nhân vật đang ở ngoài khung. Prompt video gọi nhân vật trong khung bằng loài, không bao giờ gọi tên nhân vật ngoài khung.
 */
function anchorNamesForVeo(
  text: string,
  cs: PremiumCharacter[],
  all: PremiumCharacter[],
  style: PremiumStyleKey = 'pixar3d',
  speakers: PremiumCharacter[] = [],
  compact = false
): string {
  // Nhãn người nói "<Tên> says:" giữ nguyên tên (hướng dẫn Veo: mỗi nhân vật có tên + chất giọng). Tên của người nói được
  // gắn vào thân hình ở lần nhắc đầu ("Kiki, the small animated sea otter with a red scarf, ...") để Veo biết ai mở miệng.
  // Bảo vệ cả câu thoại (tên gọi trong lời thoại "Grandma Lan... did you hear that?" phải giữ nguyên).
  const speakerTags: string[] = [];
  let out = text.replace(/\b([A-Z][\w'-]*(?:\s[A-Z][\w'-]*)?)\s+says(\s+in\s+\w+)?:[\s\S]*?(?=\s(?:SFX|Ambient noise)\s*:|$)/g, (m) => {
    speakerTags.push(m);
    return `§SPK${speakerTags.length - 1}§`;
  });
  const unboundSpeakers = new Map<string, string>();
  for (const c of all) {
    const name = c.displayNameEn;
    if (!name) continue;
    const n = escapeRe(name);
    if (cs.includes(c)) {
      const h0 = speciesHandles(c, style);
      const h = compact && !speakers.includes(c) ? { ...h0, first: h0.short } : h0;
      const bind = speakers.includes(c);
      let used = false;
      out = out.replace(new RegExp(`\\b${n}('s)?\\b`, 'g'), (_m, poss: string) => {
        // "…teal stripes's tail" sai ngữ pháp: dạng sở hữu dùng mô tả ngắn; sau lần nhắc đầu luôn dùng mô tả gọn.
        let r: string;
        if (poss) r = `${used ? h.next : bind ? `${h.short} ${name}` : h.short}'s`;
        else r = used ? h.next : bind ? `${name}, ${h.first},` : h.first;
        used = true;
        return r;
      });
      if (bind && !used) unboundSpeakers.set(name, h.first);
    } else {
      out = out
        .replace(new RegExp(`\\b(toward|towards|at|to|on|into|finding|over|after|back toward)\\s+${n}(?:'s\\s+[a-z]+)?\\b`, 'gi'), '$1 a point just off-screen')
        .replace(new RegExp(`\\b${n}'s\\s+[a-z]+\\b`, 'g'), 'a point just off-screen')
        .replace(new RegExp(`\\b${n}\\b`, 'g'), 'a point just off-screen');
    }
  }
  out = out.replace(/§SPK(\d+)§/g, (_m, i: string) => {
    const tag = speakerTags[Number(i)];
    for (const [name, first] of unboundSpeakers) {
      if (tag.startsWith(`${name} says`)) return tag.replace(name, `${name}, ${first},`);
    }
    return tag;
  });
  out = out.replace(/,\s*([.!?;:])/g, '$1').replace(/,\s*,/g, ',');
  return squash(out.replace(/(^|[.!?]\s+)the\b/g, (_m, p: string) => `${p}The`));
}

/** "In a bright, squeaky young voice" / "With deep rumbling growls" — đặt TRƯỚC "<Tên> says:" để giữ đúng mẫu của Google. */
function voicePhrase(voiceEn: string): string {
  const v = stripEnd(cleanEn(voiceEn)).replace(/^(?:in|with|using)\s+/i, '');
  if (!v) return '';
  return `${/\bvoice\b/i.test(v) ? 'In' : 'With'} ${withArticle(v)}`;
}

function dialogueLine(text: string, maxWords: number): string {
  let l = squash(str(text).replace(/[“”„«»"]/g, '').replace(/^['‘’]+|['‘’]+$/g, ''));
  l = l
    .replace(/@?\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/g, (_m, id: string) => humanizeId(id))
    .replace(/[\[\]@]/g, '')
    .replace(/\bsays\s*:/gi, '');
  l = clampWords(l, maxWords);
  if (!l) return '';
  if (!/[.!?…]$/.test(l)) l += '.';
  return cap(l);
}

function vocalSentence(name: string, vocal: string, names: string[]): string {
  const v = stripEnd(vocal);
  if (!v) return '';
  const who = name || 'The subject';
  if (startsWithName(v, names)) return sentence(v);
  if (/^(a|an|the|one|some|soft|low|deep|tiny|small|loud|short|quiet|happy|sharp|long|little|brief|high|raspy|shaky|weary|full|contented|startled|surprised|dazed)\b/i.test(v)) {
    return sentence(`${who} lets out ${withArticle(v)}`);
  }
  return sentence(`${who} ${lowerFirst(v)}`);
}

// ───────────────────────────── Real-render rules (L1-L7): expression, stance, screen direction, water, contact ─────────────────────────────

/** Nhịp vui: chỉ ở đây mới được cười / nhe răng (L5). */
const HAPPY_RE =
  /\b(?:smil\w*|grin\w*|laugh\w*|giggl\w*|chuckl\w*|joy\w*|happ(?:y|ily|iness)|delight\w*|beam(?:s|ing)?|cheer\w*|glee\w*|playful\w*|triumph\w*|elat\w*|excit\w*|amus\w*|smirk\w*|smug\w*)\b/i;
const DAZED_RE = /\b(?:daz(?:e|ed|es|ing)|grogg\w*|woozy|dizz\w*|unfocused)\b/i;
/** Nhịp KHÔNG vui -> "miệng khép, môi che răng, vẻ mặt nghiêm <cảm xúc>". Thứ tự = ưu tiên. */
const SERIOUS_EMOTIONS: Array<[RegExp, string]> = [
  [/\bsuspic\w*/i, 'suspicious'],
  [/\b(?:merc(?:y|iful)\w*|compassion\w*|forgiv\w*)\b/i, 'merciful'],
  [/\b(?:terror|terrif\w*|fear\w*|afraid|scared|frighten\w*|dread\w*)\b/i, 'fearful'],
  [/\b(?:shock\w*|disbelief|horrif\w*|stunned)\b/i, 'shocked'],
  [/\b(?:startl\w*|surpris\w*|alarm\w*|panic\w*)\b/i, 'startled'],
  [/\b(?:alert\w*|wary|warily|wariness|watchful\w*|cautious\w*|tense\w*|suspense)\b/i, 'wary'],
  [/\brespect\w*/i, 'respectful'],
  [/\b(?:rage|anger|angry|furious|fury|annoy\w*|irritat\w*)\b/i, 'angry'],
  [/\b(?:fierce\w*|glar\w*|protective\w*|menac\w*|threaten\w*|warning)\b/i, 'fierce'],
  [/\b(?:determin\w*|resolve|resolute|stubborn\w*|steely|focus\w*|courage\w*|brave\w*)\b/i, 'determined'],
  [/\b(?:worr\w*|nervous\w*|anxious\w*|concern\w*|uneas\w*)\b/i, 'worried'],
  [/\b(?:sad|sadness|sorrow\w*|grief|griev\w*|gloom\w*|despair\w*)\b/i, 'sad'],
  [/\b(?:exhaust\w*|tired|weary|weari\w*|fatigue\w*)\b/i, 'tired'],
  [/\b(?:serious\w*|solemn\w*|stern\w*)\b/i, 'serious'],
];
/** Nhịp êm (nhẹ nhõm, biết ơn, hy vọng): không ép khép miệng, không đòi nụ cười. */
const CALM_EMOTIONS: Array<[RegExp, string]> = [
  [/\brelie\w*/i, 'relieved'],
  [/\bgrat(?:eful|itude)\w*/i, 'grateful'],
  [/\bhope\w*/i, 'hopeful'],
  [/\b(?:proud|pride)\b/i, 'proud'],
  [/\bcontent\w*/i, 'contented'],
  [/\bcurio\w*/i, 'curious'],
  [/\b(?:calm\w*|peace\w*|rest\w*|relax\w*|sleepy)\b/i, 'calm'],
];

interface BeatExpression {
  kind: 'happy' | 'dazed' | 'serious' | 'calm' | 'none';
  adj: string;
}

function classifyExpression(text: string): BeatExpression {
  const t = String(text || '');
  if (!t.trim()) return { kind: 'none', adj: '' };
  if (HAPPY_RE.test(t)) return { kind: 'happy', adj: 'happy' };
  if (DAZED_RE.test(t)) return { kind: 'dazed', adj: 'dazed' };
  // Cảm xúc xuất hiện SAU CÙNG thắng: "brave face tightens with worry" -> worried, "fierce, total focus" -> determined.
  const lastHit = (list: Array<[RegExp, string]>): string => {
    let best = '';
    let at = -1;
    for (const [re, adj] of list) {
      for (const m of t.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))) {
        if ((m.index ?? 0) > at) {
          at = m.index ?? 0;
          best = adj;
        }
      }
    }
    return best;
  };
  const serious = lastHit(SERIOUS_EMOTIONS);
  if (serious) return { kind: 'serious', adj: serious };
  const calm = lastHit(CALM_EMOTIONS);
  if (calm) return { kind: 'calm', adj: calm };
  return { kind: 'none', adj: '' };
}

/** Chân mày theo cảm xúc cho biến thể "miệng mở" (đang gầm / hét / nói). */
function browsFor(adj: string): string {
  if (/^(?:startled|fearful|shocked|worried|sad)$/.test(adj)) return 'raised brows';
  if (/^(?:angry|fierce|determined|suspicious|wary)$/.test(adj)) return 'lowered brows';
  return 'soft brows';
}

/** "relief turns into sharp alert suspicion" -> { from: "relief turns", to: "sharp alert suspicion" }. */
function actingParts(acting: string): { from: string; to: string } {
  const a = stripEnd(acting);
  let first = -1;
  let lastEnd = -1;
  for (const m of a.matchAll(/\b(?:into|then|as|becomes?|gives? way to)\b/gi)) {
    if (first < 0) first = m.index ?? 0;
    lastEnd = (m.index ?? 0) + m[0].length;
  }
  if (first < 0) return { from: a, to: a };
  return { from: squash(a.slice(0, first)), to: squash(a.slice(lastEnd)) };
}

/**
 * Phần văn bản thuộc về người mang nhịp diễn (owner): cảnh hai nhân vật chỉ xét mệnh đề của owner, để "Tide ... with a smug
 * closed-mouth look" không biến cú sốc của Ember thành nhịp vui (shot 13 dino_premium_v2). Không có owner -> cả câu (như cũ).
 */
function ownerText(text: string, owner?: PremiumCharacter, cs?: PremiumCharacter[], focus?: PremiumCharacter): string {
  const t = String(text || '');
  if (!owner || !cs || cs.length < 2) return t;
  return clausesOf(t, owner, cs, focus).join(', ');
}

/** Biểu cảm khung ĐẦU: trạng thái đầu cảnh (mệnh đề của owner), nếu không nói gì thì vế A của nhịp diễn. */
function startExpression(shot: PremiumShot, owner?: PremiumCharacter, cs?: PremiumCharacter[], focus?: PremiumCharacter): BeatExpression {
  const s = classifyExpression(ownerText(shot?.startStateEn || '', owner, cs, focus));
  if (s.kind !== 'none') return s;
  return classifyExpression(actingParts(shot?.actingBeatEn || '').from);
}

/** Biểu cảm khung CUỐI: vế B của nhịp diễn (nguồn chuẩn), rồi tới endStateEn (mệnh đề của owner), rồi cả câu diễn. */
function endExpression(shot: PremiumShot, owner?: PremiumCharacter, cs?: PremiumCharacter[], focus?: PremiumCharacter): BeatExpression {
  const parts = actingParts(shot?.actingBeatEn || '');
  const t = classifyExpression(parts.to);
  if (t.kind === 'serious') {
    const actionEnd = String(shot?.actionEn || '').split(/,?\s+then\s+/i).pop() || '';
    if (HAPPY_RE.test(ownerText(actionEnd, owner, cs, focus)) || HAPPY_RE.test(ownerText(shot?.endStateEn || '', owner, cs, focus))) {
      return { kind: 'happy', adj: 'happy' };
    }
  }
  if (t.kind !== 'none') return t;
  const e = classifyExpression(ownerText(shot?.endStateEn || '', owner, cs, focus));
  if (e.kind !== 'none') return e;
  return classifyExpression(shot?.actingBeatEn || '');
}

/** Cụm danh từ mô tả biểu cảm cuối: "a serious suspicious expression", "a small proud smile". */
function expressionNoun(e: BeatExpression, actingTarget: string): string {
  if (e.kind === 'serious') return `a serious ${e.adj} expression`;
  if (e.kind === 'dazed') return 'a dazed expression with a slack jaw';
  if (e.kind === 'calm') return `${article(e.adj)} ${e.adj} expression`;
  if (e.kind === 'happy') {
    const t = stripEnd(actingTarget);
    const m = /\b(smile|grin|laugh|smirk)s?\b/i.exec(t);
    if (!m) return 'a happy expression';
    const head = t.slice(0, (m.index ?? 0) + m[0].length).split(/\s+/).slice(-4);
    while (head.length > 1 && /^(?:into|to|a|an|the|then|as|and|[A-Z][\w-]*'s)$/i.test(head[0].replace(/,$/, ''))) head.shift();
    return withArticle(head.join(' '));
  }
  return '';
}

// Miệng MỞ theo kịch bản: gầm / hét / nói, há hốc chữ O vì sốc ("round-mouthed O of shock", "a round shocked mouth"),
// gầm gừ nhe răng ("snarl", "lips curled back", "bared teeth") — khi đó KHÔNG ép "mouth firmly closed" (tự mâu thuẫn).
const OPEN_MOUTH_RE =
  /\b(?:roar\w*|scream\w*|shriek\w*|yell\w*|shout\w*|howl\w*|bellow\w*|gasp\w*|yawn\w*|chomp\w*|gap(?:e|es|ing)|agape|mid-?roar|open-?mouth\w*|snap(?:s|ped|ping)?\s+(?:at|toward|towards)|jaws?\s+snap\w*|bit(?:e|es|ing)\b(?!\s+(?:a|her|his|its|their|the)\s+(?:lower\s+)?lip)|(?:mouth|jaws?)\s+(?:\w+\s+)?(?:open|agape)|open(?:s|ing)?\s+(?:the\s+|its\s+|his\s+|her\s+|their\s+)?(?:mouth|jaws?)|laugh\w*|cheer\w*|sing(?:s|ing)?|round(?:ed)?-?mouth\w*|round\s+(?:[\w-]+\s+)?mouth|(?:round|big|wide|little|small)\s+O|O\s+of\s+\w+|O-shaped|snarl\w*|lips?\s+(?:\w+\s+)?curl\w*\s+back|curl\w*\s+(?:the\s+|its\s+|his\s+|her\s+|their\s+)?lips?\s+back|bar(?:e|es|ed|ing)\s+(?:the\s+|its\s+|his\s+|her\s+|their\s+)?(?:[\w-]+\s+)?(?:teeth|fangs)|(?:show(?:s|ing)?|flash(?:es|ing)?)\s+(?:the\s+|its\s+|his\s+|her\s+|their\s+|all\s+)?(?:[\w-]+\s+)?(?:teeth|fangs)|(?:teeth|fangs)\s+(?:bared|showing)|jaw\s+(?:drops?|dropped|dropping))\b/i;
const CLOSE_MOUTH_RE =
  /\bclos(?:e|es|ed|ing)\s+(?:the\s+|its\s+|his\s+|her\s+|their\s+)?(?:jaws?|mouth|lips)\b|\b(?:jaws?|mouth|lips)\s+(?:\w+\s+)?(?:closed|shut)\b|\bclosed-mouth\w*/i;

/**
 * Kịch bản cho người mang nhịp diễn MỞ miệng ở khung đầu / khung cuối (chỉ xét mệnh đề của người đó).
 * Khung cuối kế thừa miệng mở của khung đầu khi nhịp diễn không chuyển trạng thái ("Ember's face stays frozen in shock").
 */
function scriptedOpenMouth(
  shot: PremiumShot,
  owner: PremiumCharacter | undefined,
  cs: PremiumCharacter[],
  focus: PremiumCharacter | undefined
): { start: boolean; end: boolean } {
  if (!owner) return { start: false, end: false };
  const openIn = (cl: string[]) => cl.some((c) => OPEN_MOUTH_RE.test(c) && !CLOSE_MOUTH_RE.test(c));
  const parts = actingParts(shot.actingBeatEn || '');
  const startCl = clausesOf(shot.startStateEn || '', owner, cs, focus);
  const endCl = clausesOf(shot.endStateEn || '', owner, cs, focus);
  const transition = parts.to !== parts.from;
  const start = openIn(startCl) || (transition && OPEN_MOUTH_RE.test(parts.from) && !CLOSE_MOUTH_RE.test(parts.from));
  const endExplicit = openIn(endCl) || (transition && OPEN_MOUTH_RE.test(parts.to) && !CLOSE_MOUTH_RE.test(parts.to));
  const endClosed = endCl.some((c) => CLOSE_MOUTH_RE.test(c)) || CLOSE_MOUTH_RE.test(String(shot.actionEn || ''));
  const inherits = start && !endClosed && !ACTING_TRANSITION_RE.test(String(shot.actingBeatEn || ''));
  return { start, end: endExplicit || inherits };
}

/** Mệnh đề thuộc về một nhân vật: theo chủ ngữ đứng đầu mệnh đề ("Tide snaps at Ember, who twists aside"). */
function clausesOf(text: string, owner: PremiumCharacter | undefined, cs: PremiumCharacter[], defaultOwner?: PremiumCharacter): string[] {
  const out: string[] = [];
  if (!owner) return out;
  let subject: PremiumCharacter[] = defaultOwner ? [defaultOwner] : cs.slice(0, 1);
  for (const raw of String(text || '').split(/\s*(?:[,;.]|\bwhile\b|\band\b|\bthen\b)\s*/i)) {
    const clause = raw.trim();
    if (!clause) continue;
    if (/^(?:both|they|the two|each)\b/i.test(clause)) subject = cs;
    else {
      const named = cs.find((c) => c.displayNameEn && new RegExp(`^(?:the\\s+)?${escapeRe(c.displayNameEn)}\\b`, 'i').test(clause));
      if (named) subject = [named];
    }
    if (subject.includes(owner)) out.push(clause);
  }
  return out;
}

/** Ai mang nhịp diễn: người được nhắc tên trong câu diễn, rồi người thực hiện hành động, rồi người nói, rồi nhân vật chính khung hình. */
function actingOwnerOf(shot: PremiumShot, cs: PremiumCharacter[], focus: PremiumCharacter | undefined): PremiumCharacter | undefined {
  const acting = String(shot?.actingBeatEn || '');
  const action = String(shot?.actionEn || '');
  const named = cs.find((c) => c.displayNameEn && new RegExp(`\\b${escapeRe(c.displayNameEn)}\\b`, 'i').test(acting));
  if (named) return named;
  const actor = cs.find((c) => startsWithName(action, [c.displayNameEn]) || action.trim().toLowerCase() === c.displayNameEn.toLowerCase());
  if (actor) return actor;
  const d = shot?.dialogue;
  const speaker = d ? cs.find((c) => c.id === d.speaker) : undefined;
  return speaker || focus;
}

interface ExpressionLine {
  owner?: PremiumCharacter;
  /** Câu đầy đủ ("Ember's mouth is firmly closed, lips covering the teeth, serious suspicious expression."). */
  full: string;
  /** Mệnh đề gọn để nối vào câu diễn xuất khi thiếu chỗ ("mouth firmly closed, lips covering the teeth"). */
  clause: string;
}

/**
 * Biểu cảm dương tính cho nhịp không vui (L5): Veo/NBP mặc định cười nhe răng. mode 'start'/'end' cho ảnh, 'motion' cho Veo.
 * Không dùng phủ định (lint cấm). Người đang nói / đang gầm vẫn mở miệng: chỉ giữ "vẻ mặt nghiêm". Cận mắt (ECU): chỉ mắt + chân mày.
 */
function expressionLine(shot: PremiumShot, cs: PremiumCharacter[], focus: PremiumCharacter | undefined, mode: 'start' | 'end' | 'motion'): ExpressionLine {
  const none: ExpressionLine = { full: '', clause: '' };
  if (!cs.length || shot.shotSize === 'INSERT') return none;
  const owner = actingOwnerOf(shot, cs, focus);
  if (!owner) return none;
  const name = owner.displayNameEn;
  const out = (full: string, clause: string): ExpressionLine => ({ owner, full, clause });
  const CLOSED = 'mouth firmly closed, lips covering the teeth';
  const d = shot.dialogue;
  const speaks = !!d && d.speaker === owner.id && owner.canSpeak !== false;
  const actor = cs.find((c) => startsWithName(String(shot.actionEn || ''), [c.displayNameEn])) || focus;
  const scripted = scriptedOpenMouth(shot, owner, cs, focus);
  if (shot.shotSize === 'ECU') {
    // Cận mắt: chỉ thấy mắt + chân mày; nhắc tới miệng kéo NBP nới khung hình.
    const ee = mode === 'start' ? startExpression(shot, owner, cs, focus) : endExpression(shot, owner, cs, focus);
    if (ee.kind === 'dazed') return out(`${name}'s eyes stay unfocused and dazed.`, 'eyes unfocused and dazed');
    if (ee.kind !== 'serious') return none;
    return out(
      mode === 'motion' ? `${name}'s eyes and brows keep a serious ${ee.adj} look.` : `${name}'s eyes and brows show a serious ${ee.adj} look.`,
      `brows set in a serious ${ee.adj} look`
    );
  }
  if (mode === 'start') {
    const e = startExpression(shot, owner, cs, focus);
    if (e.kind === 'dazed') return out(`${name}'s jaw hangs slack, eyes unfocused.`, 'jaw slack, eyes unfocused');
    if (e.kind !== 'serious') return none;
    const open = scripted.start || OPEN_MOUTH_RE.test(actingParts(shot.actingBeatEn || '').from);
    return open
      ? out(`${name} has a serious ${e.adj} expression with ${browsFor(e.adj)}.`, `with ${browsFor(e.adj)}`)
      : out(`${name}'s mouth is firmly closed, lips covering the teeth, serious ${e.adj} expression.`, CLOSED);
  }
  const e = endExpression(shot, owner, cs, focus);
  if (e.kind === 'dazed') return out(`${name}'s jaw hangs slack, eyes unfocused.`, 'jaw slack, eyes unfocused');
  if (e.kind !== 'serious') return none;
  if (mode === 'end') {
    const endText = shot.endStateEn || '';
    const actingTo = actingParts(shot.actingBeatEn || '').to;
    const open =
      (endText ? clausesOf(endText, owner, cs, focus) : clausesOf(shot.actionEn, owner, cs, actor)).some((c) => OPEN_MOUTH_RE.test(c) && !CLOSE_MOUTH_RE.test(c)) ||
      (OPEN_MOUTH_RE.test(actingTo) && !CLOSE_MOUTH_RE.test(actingTo)) ||
      scripted.end;
    if (open || speaks) return out(`${name} has a serious ${e.adj} expression with ${browsFor(e.adj)}.`, `with ${browsFor(e.adj)}`);
    return out(`${name}'s mouth is firmly closed, lips covering the teeth, serious ${e.adj} expression.`, CLOSED);
  }
  // motion
  if (speaks) return out(`${name} keeps a serious ${e.adj} expression.`, '');
  const action = String(shot.actionEn || '');
  const vocal = String(shot.vocalEn || '');
  const vocalOwner = cs.find((c) => vocal.toLowerCase().startsWith(c.displayNameEn.toLowerCase())) || focus;
  const ends = out(`${name} ends with the mouth firmly closed, lips covering the teeth, and a serious ${e.adj} expression.`, `ending with the ${CLOSED}`);
  if (CLOSE_MOUTH_RE.test(action)) return ends;
  // Kịch bản giữ miệng mở tới cuối (há hốc vì sốc, gầm gừ): chỉ giữ vẻ nghiêm + chân mày, không ép khép miệng.
  if (scripted.end) return out(`${name}'s expression stays serious and ${e.adj}, with ${browsFor(e.adj)}.`, `with ${browsFor(e.adj)}`);
  const actingText = String(shot.actingBeatEn || '');
  const opensDuring =
    clausesOf(action, owner, cs, actor).some((c) => OPEN_MOUTH_RE.test(c)) ||
    (vocalOwner === owner && OPEN_MOUTH_RE.test(vocal)) ||
    (OPEN_MOUTH_RE.test(actingText) && !CLOSE_MOUTH_RE.test(actingText));
  if (opensDuring) return out(`${name}'s expression stays serious and ${e.adj}, with ${browsFor(e.adj)}.`, `with ${browsFor(e.adj)}`);
  const s = startExpression(shot, owner, cs, focus);
  const startOpen = s.kind === 'dazed' || scripted.start;
  if (startOpen || /\bthen\b/i.test(action)) return ends;
  return out(`${name} keeps the mouth firmly closed, lips covering the teeth, with a serious ${e.adj} expression.`, CLOSED);
}

function expressionSentence(shot: PremiumShot, cs: PremiumCharacter[], focus: PremiumCharacter | undefined, mode: 'start' | 'end' | 'motion'): string {
  return expressionLine(shot, cs, focus, mode).full;
}

// Dáng đứng theo loài (đọc từ lookEn trước, rồi species): Veo kéo T-rex hoạt hình về bốn chân / dáng khủng long thật.
const TINY_ARM_BIPED_RE = /tyrannosaur|\bt-?rex\b|\brex\b|carnotaur|abelisaur|albertosaur|tarbosaur|giganotosaur|daspletosaur/i;
const BIPED_SPECIES_RE =
  /raptor|allosaur|spinosaur|baryonyx|suchomimus|dilophosaur|ceratosaur|theropod|compsognath|megalosaur|deinonych|oviraptor|troodon|therizinosaur|gallimimus|ornithomim/i;
const QUAD_SPECIES_RE =
  /triceratops|stegosaur|ankylosaur|sauropod|brachiosaur|diplodoc|apatosaur|brontosaur|styracosaur|protoceratops|pachyrhinosaur|kentrosaur|nodosaur/i;

interface StanceInfo {
  kind: 'biped' | 'quadruped';
  arms: string;
}

function stanceOf(c: PremiumCharacter | undefined): StanceInfo | null {
  if (!c) return null;
  const look = String(c.lookEn || '').toLowerCase();
  const sp = String(c.species || '').toLowerCase();
  let kind: StanceInfo['kind'] | null = null;
  if (/\b(?:on all fours|four (?:\w+ )?legs|quadruped\w*)\b/.test(look)) kind = 'quadruped';
  else if (/\b(?:two (?:\w+ )?(?:hind |back )?legs|bipedal|upright on (?:its|his|her|two))\b/.test(look)) kind = 'biped';
  else if (TINY_ARM_BIPED_RE.test(sp) || BIPED_SPECIES_RE.test(sp)) kind = 'biped';
  else if (QUAD_SPECIES_RE.test(sp)) kind = 'quadruped';
  else if (TINY_ARM_BIPED_RE.test(look) || BIPED_SPECIES_RE.test(look)) kind = 'biped';
  else if (QUAD_SPECIES_RE.test(look)) kind = 'quadruped';
  if (!kind) return null;
  const tiny = /\b(?:tiny|short|stubby|little|small)\s+(?:two-fingered\s+)?(?:arms|forelimbs)\b|two-fingered/.test(look) || TINY_ARM_BIPED_RE.test(sp) || TINY_ARM_BIPED_RE.test(look);
  return { kind, arms: kind === 'biped' ? (tiny ? 'tiny arms tucked to the chest' : 'clawed arms held close to the chest') : '' };
}

/** Dáng đứng của nhân vật (để giám khảo / tài liệu dùng): "stands on two hind legs, tiny arms tucked to the chest". */
function stanceDescription(c: PremiumCharacter): string {
  const st = stanceOf(c);
  if (!st) return '';
  return st.kind === 'biped' ? `stands on two hind legs, ${st.arms}` : 'stands on four sturdy legs';
}

const STANCE_CONFLICT_RE =
  /\b(?:lie|lies|lying|lay|laid|sprawl\w*|sits?|sitting|sat|seated|fall(?:s|ing|en)?|fell|toppl\w*|tumbl\w*|collaps\w*|on (?:the|its|his|her|their) (?:back|side|belly)|roll(?:s|ed|ing)?|kneel\w*|knelt|crouch\w*|curl(?:s|ed|ing)? up|asleep|sleep\w*|settl\w* down|swim\w*|fly|flies|flying|leap\w*|jump\w*|surg\w* up|bursts? up|face-?down|pressed sideways|rest(?:s|ing|ed)?|resting)\b/i;
const DRINK_RE = /\b(?:drink\w*|laps?|lapping|sips?|sipping|mid-?sip|lowers? (?:a |the |its |his |her )?(?:broad |long )?(?:snout|head|muzzle) to the water)\b/i;
const STANCE_SIZES = new Set<string>(['EWS', 'WS', 'MS', 'OTS', 'POV', 'MCU']);

function stanceSentence(
  shot: PremiumShot,
  cs: PremiumCharacter[],
  focus: PremiumCharacter | undefined,
  frameText: string,
  mode: 'still' | 'motion',
  compact = false
): string {
  if (!STANCE_SIZES.has(shot.shotSize) || !cs.length) return '';
  const visible = shot.shotSize === 'OTS' && cs.length >= 2 ? [cs[1]] : shot.shotSize === 'POV' ? cs.slice(1) : cs;
  const entries = visible
    .map((c) => ({ c, st: stanceOf(c) }))
    .filter((x): x is { c: PremiumCharacter; st: StanceInfo } => !!x.st && !clausesOf(frameText, x.c, cs, focus).some((cl) => STANCE_CONFLICT_RE.test(cl)));
  if (!entries.length) return '';
  if (shot.shotSize === 'MCU') {
    const arms = entries.filter((x) => x.st.kind === 'biped');
    if (!arms.length) return '';
    if (arms.length >= 2) return 'Both keep their arms tucked close to the chest.';
    return `${arms[0].c.displayNameEn}'s ${arms[0].st.arms.replace(/ (?:tucked|held)/, ' stay tucked')}.`;
  }
  if (entries.length >= 2 && entries.every((x) => x.st.kind === 'biped')) {
    if (compact) return mode === 'still' ? 'Both stand on two hind legs.' : 'Both stay upright on two hind legs.';
    return mode === 'still' ? 'Both stand on two strong hind legs, arms held close to the chest.' : 'Both stay upright on two hind legs, arms close to the chest.';
  }
  return entries
    .map(({ c, st }) => {
      const n = c.displayNameEn;
      if (st.kind === 'quadruped') return mode === 'still' ? `${n} stands on four sturdy legs.` : `${n} stays on four sturdy legs.`;
      const drinking = clausesOf(frameText, c, cs, focus).some((cl) => DRINK_RE.test(cl));
      if (compact) return drinking ? `${n} bends at the hips on two hind legs.` : mode === 'still' ? `${n} stands on two hind legs.` : `${n} stays upright on two hind legs.`;
      if (mode === 'still') return drinking ? `${n} bends forward at the hips on two hind legs, ${st.arms}.` : `${n} stands on two strong hind legs, ${st.arms}.`;
      return drinking ? `${n} bends at the hips on two hind legs to drink, ${st.arms}.` : `${n} stays upright on two hind legs, ${st.arms}.`;
    })
    .join(' ');
}

/** Hướng nhìn trên màn hình: ghi đè của cảnh -> "<Tên> faces screen-left" trong văn bản cảnh -> mặc định char1 phải / char2 trái. */
function screenFacing(shot: PremiumShot, c: PremiumCharacter): PremiumScreenFacing {
  const o = shot?.facing?.[c.id];
  if (o === 'left' || o === 'right') return o;
  const name = c.displayNameEn ? escapeRe(c.displayNameEn) : '';
  if (name) {
    const text = `${shot?.startStateEn || ''}. ${shot?.actionEn || ''}. ${shot?.endStateEn || ''}`;
    const m = new RegExp(
      `\\b${name}\\b[^.;]{0,40}?\\b(?:fac(?:es|ing|ed)|turn(?:s|ed|ing)?|look(?:s|ing|ed)?|point(?:s|ing|ed)?|head(?:s|ing|ed)?)\\s+(?:toward\\s+|towards\\s+|to\\s+)?(?:the\\s+)?screen[- ](left|right)\\b`,
      'i'
    ).exec(text);
    if (m) return m[1].toLowerCase() as PremiumScreenFacing;
  }
  return c.id === 'char2' ? 'left' : 'right';
}

/** Hai nhân vật trên trục 180°: người nhìn sang phải đứng bên trái. */
function leftRight(shot: PremiumShot, a: PremiumCharacter, b: PremiumCharacter): [PremiumCharacter, PremiumCharacter] {
  const fa = screenFacing(shot, a);
  const fb = screenFacing(shot, b);
  if (fa === 'left' && fb === 'right') return [b, a];
  if (fa === fb && a.id === 'char2' && b.id === 'char1') return [b, a];
  return [a, b];
}

function directionSentence(shot: PremiumShot, cs: PremiumCharacter[], mode: 'still' | 'motion', compact = false): string {
  if (!cs.length || shot.shotSize === 'POV' || shot.shotSize === 'INSERT') return '';
  if (cs.length >= 2) {
    const [l, r] = leftRight(shot, cs[0], cs[1]);
    if (compact) return `${l.displayNameEn} stays left, ${r.displayNameEn} stays right.`;
    return `${l.displayNameEn} stays on the left facing screen-${screenFacing(shot, l)}, ${r.displayNameEn} on the right facing screen-${screenFacing(shot, r)}.`;
  }
  const c = cs[0];
  return mode === 'still' ? `${c.displayNameEn} faces screen-${screenFacing(shot, c)}.` : `${c.displayNameEn} keeps facing screen-${screenFacing(shot, c)}.`;
}

// Nước / hiệu ứng (L6): "water spray" trên đất khô sinh ra vòi nước; "dripping from the jaw" sinh ra vòi chảy như vòi nước.
const WATER_SET_RE =
  /\b(?:water|pools?|ponds?|lakes?|rivers?|streams?|creeks?|shallows|sea|ocean|waves?|surf|puddles?|springs?|waterfalls?|marsh\w*|swamps?|ford|riverbank|shore\w*|beach)\b/i;
const WATER_CONTACT_RE =
  /\b(?:in|into|through|across|under)\s+(?:the\s+|a\s+)?(?:[\w-]+\s+){0,2}?(?:water|pools?|ponds?|lakes?|rivers?|streams?|shallows|sea|waves|surf|puddles?|springs?|ford)\b|\b(?:wad(?:e|es|ed|ing)|splash\w*|paddl\w*|swim\w*|div(?:e|es|ing)|plung\w*|dunk\w*|drink\w*|laps?\b|lapping|sips?\b|sipping|mid-?sip|feet in|knee-deep|ankle-deep|waist-deep|water'?s edge)\b/i;
const WATER_FX_RE = /\b(?:water|spray\w*|splash\w*|droplets?|foam\w*|ripples?|sea)\b/i;
const BIG_SPLASH_RE =
  /\b(?:walls?|curtains?|tower\w*|geysers?|columns?|pillars?|erupt\w*|jets?|fountains?|huge|massive|giant|enormous|tall|tidal|waves? of|burst of|explo\w*|plumes?|crown)\b/i;
const STREAM_VERBS = '(?:streaming|pouring|gushing|dripping|running|flowing|spraying|cascading|spilling|spurting|squirting|jetting|draining|sheeting|drooling|trickling)';

/** "water dripping from the jaw" -> "a few droplets on the jaw"; "water streaming off the snout" -> "a few droplets on the snout". Idempotent. */
function waterPhrasing(text: string): string {
  let t = String(text || '');
  if (!t.trim()) return t;
  t = t.replace(
    new RegExp(`\\b(water|drool|saliva|slobber|mud|slime|droplets?|drops)\\s+${STREAM_VERBS}\\s+(?:off|from|down|out of|over|along)\\s+((?:the|its|his|her|their|[A-Z][\\w'-]*'s)\\s+)?([\\w-]+)`, 'gi'),
    (_m, what: string, det: string | undefined, part: string) => `${/mud|slime/i.test(what) ? 'a few flecks of mud' : 'a few droplets'} on ${det || 'the '}${part}`
  );
  t = t.replace(new RegExp(`\\b([\\w-]+)\\s+${STREAM_VERBS}\\s+(?:with\\s+)?water\\b`, 'gi'), '$1 with a few droplets');
  t = t.replace(/\b(?:dripping|streaming|sopping|soaking)\s+wet\b/gi, 'damp');
  t = t.replace(/\bwater\s+(?:jets?|spouts?|fountains?|torrents?)\b/gi, 'a few droplets');
  t = t.replace(new RegExp(`\\bwater\\s+${STREAM_VERBS}(?!\\s+(?:off|from|down|out|over|along))\\b`, 'gi'), 'a few droplets');
  return squash(t);
}

/** Hiệu ứng vật lý hợp lệ: nước chỉ khi thân thể chạm nước có sẵn trong bối cảnh; bùn/nước luôn thấp quanh chân. '' = bỏ hiệu ứng. */
function physicalFx(shot: PremiumShot, envLook?: string): string {
  const fx = stripEnd(String(shot?.fxEn || ''));
  if (!fx || !(Number(shot?.fxLevel) > 0)) return '';
  if (/\bmud\w*/i.test(fx)) return BIG_SPLASH_RE.test(fx) ? 'a low splash of mud around the feet' : fx;
  if (WATER_FX_RE.test(fx)) {
    const body = `${shot?.startStateEn || ''} ${shot?.actionEn || ''} ${shot?.endStateEn || ''}`;
    const setHasWater = typeof envLook === 'string' && envLook.trim() ? WATER_SET_RE.test(envLook) : true;
    if (!setHasWater || !WATER_CONTACT_RE.test(body)) return '';
    return BIG_SPLASH_RE.test(fx) ? 'a low splash of water around the feet' : fx;
  }
  return fx;
}

/** Cận mặt: bỏ hơi nước / sương / khói (Veo dựng thành cột hơi che mặt). */
function dropSteamAdjectives(text: string): string {
  return tidyEn(String(text || '').replace(/\b(?:steaming|steamy|misty|foggy|smoky|smoking|hazy)\s+/gi, ''));
}
function dropSteam(text: string): string {
  const t = dropSteamAdjectives(text);
  const out = dropClauses(t, (c) => /\b(?:steam|mist|fog|smoke|vapou?r|haze)\b/i.test(c));
  return out.trim() ? tidyEn(out) : t;
}

// Va chạm giữa hai nhân vật (L4): húc / cắn / quật đuôi làm thân hình dính vào nhau -> cảnh dừng MỘT BƯỚC trước khi chạm.
const PAIR_CONTACT_RE =
  /\b(?:head-?butt\w*|butt(?:s|ed|ing)?\s+(?:heads|into)|ram(?:s|med|ming)?\b|tackl\w*|slam\w*\s+into|crash\w*\s+into|collid\w*|smash\w*\s+into|charg(?:e|es|ed|ing)\s+(?:at|into|toward|towards)|lung(?:e|es|ed|ing)\s+(?:at|into)|pounc\w*|bit(?:e|es|ing)\b(?!\s+(?:a|her|his|its|their|the)\s+(?:lower\s+)?lip)|bites?\s+down|snap(?:s|ped|ping)?\s+at|swip(?:e|es|ed|ing)\s+at|(?<!mid-)strik(?:e|es|ing)\b|struck|hits?\b|hitting|punch\w*|kick(?:s|ed|ing)?\s+(?!off\b)|shov\w*|grab\w*|tail\s+(?:\w+\s+)?sweeps?|sweeps?\s+(?:\w+\s+)?(?:[A-Z][\w-]*'s\s+)?legs|high[- ]fives?)/i;
const PRE_CONTACT_RE =
  /\b(?:about to|just before|one step|a step (?:from|away)|a single step|inches from|a hand'?s(?:-| )width|a head'?s(?:-| )width|empty air|gap|short of|almost touching|nearly touching)\b/i;
const CAMERA_WORD_RE =
  /\b(?:camera|zoom\w*|close-?up|wide shot|medium shot|long shot|pulls? back|push(?:es)? in|cuts? to|pans?|panning|tilts?|tilting|dolly|crane|reframe\w*)\b/i;
const LOCOMOTION_RE =
  /\b(?:walk\w*|run(?:s|ning)?|ran|plod\w*|strid\w*|march\w*|charg\w*|hurr\w*|dash\w*|gallop\w*|sprint\w*|rush\w*|stomp(?:s|ed|ing)?\s+(?:off|away|toward|towards|across)|waddl\w*|creep\w*|tiptoe\w*|heads? off|sets? off|circl\w*|chas\w*)\b/i;
const REVEAL_RE =
  /\b(steps?|stepping|stepped|walks?|walking|walked|emerg(?:es|ing|ed|e)|comes?|coming|crawls?|crawling|bursts?|bursting|slips?|slipping|slides?|sliding|creeps?|creeping|rises?|rising|rose|pops?|popping)\s+(?:up\s+)?(?:out of|out from(?: behind)?|from behind|from within|out through)\s+((?:the\s+|a\s+)?[\w-]+(?:\s+(?!onto\b|into\b|toward\b|towards\b|to\b|on\b|and\b|with\b|as\b|while\b)[\w-]+)?)(?:\s+(?:onto|into|toward|towards|to|on)\s+(?:the\s+)?[\w-]+(?:\s+(?!and\b|with\b|as\b|while\b)[\w-]+)?)?/gi;

function isContactShot(shot: PremiumShot, cs: PremiumCharacter[]): boolean {
  return cs.length >= 2 && PAIR_CONTACT_RE.test(String(shot?.actionEn || ''));
}

/** Hành động tại chỗ (L4): "steps out of the reeds onto the bank" -> "leans forward at the edge of the reeds"; lao về phía máy -> ngang khung. */
function inPlaceAction(action: string): string {
  let t = String(action || '');
  t = t.replace(REVEAL_RE, (_m, verb: string, place: string) => {
    const v = verb.toLowerCase();
    const lean = /ing$/.test(v) ? 'leaning' : /(?:ed|rose)$/.test(v) ? 'leaned' : 'leans';
    return `${lean} forward at the edge of ${place}`;
  });
  t = t.replace(/\b(enters?|entering|entered)\s+(?:the\s+)?(?:frame|shot)(?:\s+from\s+(?:the\s+)?\w+)?/gi, (_m, v: string) =>
    /ing$/i.test(v) ? 'turning toward the camera' : /ed$/i.test(v) ? 'turned toward the camera' : 'turns toward the camera'
  );
  if (LOCOMOTION_RE.test(t)) t = t.replace(/\b(?:toward|towards|at|into)\s+(?:the\s+)?(?:camera|lens|viewer)\b/gi, 'across the frame');
  return squash(t);
}

/** Khung cuối suy ra từ hành động khi LLM không đưa (cùng cỡ cảnh: chỉ đổi tư thế + biểu cảm; va chạm dừng một bước trước). */
function deriveEndState(s: PremiumShot, characters: PremiumCharacter[]): string {
  const cs = shotCharacters(s, characters);
  const action = stripEnd(String(s.actionEn || ''));
  const actor =
    cs.find((c) => startsWithName(action, [c.displayNameEn])) ||
    cs.find((c) => new RegExp(`^(?:the\\s+)?${escapeRe(c.displayNameEn)}'s\\b`, 'i').test(action)) ||
    cs[0];
  if (isContactShot(s, cs) && actor) {
    const target = cs.find((c) => c !== actor) || cs[1];
    const part = /\b(tail|jaws?|claws?|horns?|fists?|paws?)\b/i.exec(action)?.[1]?.toLowerCase();
    if (part) return `${actor.displayNameEn}'s ${part} a hand's width from ${target.displayNameEn} just before contact, ${target.displayNameEn} bracing with wide eyes`;
    return `${actor.displayNameEn} one step from ${target.displayNameEn} just before contact, ${target.displayNameEn} bracing with wide eyes`;
  }
  const expr = expressionNoun(endExpression(s, actingOwnerOf(s, cs, cs[0]), cs, cs[0]), actingParts(s.actingBeatEn || '').to);
  const neutral = (NEUTRAL_STATE_BY_BEAT[s.beat] || NEUTRAL_STATE_BY_BEAT.escalation).adj;
  const parts = action.split(/,?\s+then\s+/i);
  let clause = stripEnd(parts[parts.length - 1] || action);
  if (actor && parts.length > 1 && !startsWithName(clause, [actor.displayNameEn]) && !/^(?:the|a|an|its|his|her|their)\b/i.test(clause)) {
    clause = `${actor.displayNameEn} ${clause}`;
  }
  // Di chuyển lớn: khung cuối giữ nguyên vị trí trong khung (L1/L4) -> "đang bước", không phải "đã tới nơi".
  if (actor && LOCOMOTION_RE.test(clause)) clause = `${actor.displayNameEn} mid-stride${expr ? '' : `, ${neutral}`}`;
  if (!usableDescription(clause, 2)) clause = actor ? `${actor.displayNameEn} ${neutral}` : 'the scene settles';
  // Biểu cảm gắn cho người mang nhịp diễn; mệnh đề không mở đầu bằng người đó ("the door swings open ...") thì nêu tên.
  const owner = actingOwnerOf(s, cs, cs[0]);
  const exprTail = !expr ? '' : owner && !startsWithName(clause, [owner.displayNameEn]) && !clause.startsWith(`${owner.displayNameEn}'s`) ? `, ${owner.displayNameEn} showing ${expr}` : `, showing ${expr}`;
  return clampField(stripEnd(`${clause}${exprTail}`), 26, cs.map((c) => c.displayNameEn));
}

/** endStateEn sạch: nước nhỏ giọt, bỏ từ máy quay (giữ cùng cỡ cảnh), va chạm -> một bước trước khi chạm, thiếu -> suy ra. */
function settleEndState(s: PremiumShot, characters: PremiumCharacter[]): string {
  const cs = shotCharacters(s, characters);
  let end = squash(waterPhrasing(String(s.endStateEn || '')).replace(/,?\s*(?:exactly\s+|just\s+)?(?:the\s+same\s+)?as\s+(?:in|before in|shown in)\s+(?:the\s+)?(?:image|frame|picture)\s+(?:\w+)\b/gi, ''));
  end = dropClauses(end, (c) => CAMERA_WORD_RE.test(c));
  if (s.beat !== 'climax' && effectTerms(end).length) end = softenEffects(end);
  end = clampField(stripEnd(end), 40, cs.map((c) => c.displayNameEn));
  if (isContactShot(s, cs) && (!end || (PAIR_CONTACT_RE.test(end) && !PRE_CONTACT_RE.test(end)))) return deriveEndState(s, characters);
  if (!usableDescription(end, 3)) return deriveEndState(s, characters);
  return end;
}

/**
 * Luật vật lý & dàn dựng rút từ bản render thật (áp sau planCoverage): hành động tại chỗ, nước nhỏ giọt, hiệu ứng nước chỉ khi chạm nước,
 * khung cuối cho MỌI cảnh. Idempotent.
 */
function applyRealRenderRules(shots: PremiumShot[], characters: PremiumCharacter[], environment: PremiumEnvironment | null): PremiumShot[] {
  const envLook = environment?.lookEn || '';
  return shots.map((s0) => {
    const s = cloneShot(s0);
    s.actionEn = waterPhrasing(inPlaceAction(s.actionEn)) || s.actionEn;
    s.startStateEn = waterPhrasing(s.startStateEn) || s.startStateEn;
    const fx = physicalFx(s, envLook);
    if (!fx) {
      s.fxLevel = 0;
      s.fxEn = '';
    } else {
      s.fxEn = fx;
    }
    s.endStateEn = settleEndState(s, characters);
    return s;
  });
}

/** Thời điểm lấy khung cho giám khảo (L7): khung đầu + >= 10 khung đều nhau + khung cuối (giây, làm tròn mili giây). */
export function denseJudgeFrameTimes(durationSec: number, opts: { count?: number; fps?: number } = {}): number[] {
  const dur = Math.max(0, Number(durationSec) || 0);
  const fps = Math.max(1, Number(opts?.fps) || 24);
  const count = Math.max(10, Math.round(Number(opts?.count) || 12));
  const last = Math.max(0, dur - 1 / fps);
  const out = [0];
  for (let i = 1; i <= count; i++) out.push((last * i) / (count + 1));
  out.push(last);
  return uniq(out.map((t) => Math.round(t * 1000) / 1000)).sort((a, b) => a - b);
}

// ───────────────────────────── Story room (Stage 1) ─────────────────────────────

/** Prompt cho Gemini (Flow.generate.text): trả về MỘT object JSON đúng cấu trúc PremiumStoryBible. */
export function buildStoryRoomPrompt(params: {
  script: string;
  shotCount: number;
  style: PremiumStyleKey;
  aspectRatio: string;
  dialogueLang: 'en' | 'vi';
  narration?: 'none' | 'vo';
}): string {
  const style = coerceStyle(params.style);
  const vo = params.narration === 'vo';
  const p = preset(style);
  const n = Math.max(1, Math.min(40, Math.round(Number(params.shotCount) || 12)));
  const aspect = String(params.aspectRatio || '16:9');
  const vertical = isVertical(aspect);
  const langRule =
    params.dialogueLang === 'vi'
      ? 'lineVi is the spoken line in natural, colloquial Vietnamese (the character says it on screen); lineEn is its English meaning.'
      : 'lineEn is the spoken line in natural, colloquial English (the character says it on screen); lineVi is its natural Vietnamese subtitle.';

  return [
    `You are the head of story at a premium animation studio. Turn the user's idea into a plan for a short film of exactly ${n} shots, aspect ratio ${aspect}${vertical ? ' (vertical: favour close and medium shots and vertical staging)' : ''}.`,
    `Visual style: ${p.styleSentenceEn}`,
    '',
    "USER IDEA (may be Vietnamese; keep its characters, world and events, invent only what it leaves open):",
    '<<<',
    String(params.script || '').trim(),
    '>>>',
    '',
    'STORY RULES',
    '- Character-driven: the main character wants something specific and visible, and something stands in the way.',
    '- Shots follow cause and effect through six beats in this order: setup -> inciting -> escalation -> reversal -> climax -> resolution. Each shot happens because of the previous one.',
    "- Keep the user's characters and world. Use one or two characters. Use dinosaurs only if the idea mentions dinosaurs.",
    '- One visible action per shot, something the camera can see within a few seconds.',
    '- Every big action is followed by a reaction close-up of a face.',
    '- Each shot has a clear acting beat: an expression change from A to B shown in eyes, brows, mouth and posture.',
    '- Prefer in-place or sideways actions (turning the head, rearing up, stamping, recoiling, lunging across the frame). Avoid long walks, runs or charges toward the camera.',
    '- Every character in a shot is fully visible from its first frame: no body reveals (stepping out of reeds, rising out of water, entering the frame).',
    '- Contact between two characters (headbutt, bite, tackle, tail sweep, hit, grab) never happens inside one shot. Cut on action: the action shot ends ONE STEP BEFORE contact, and the impact lands on the cut into the next reaction shot, sold by sound.',
    '- Expressions: only happy beats show smiles, grins or laughter. Suspicion, fear, shock, anger, determination and mercy keep the mouth closed with the lips covering the teeth; a dazed face has a slack jaw and unfocused eyes.',
    '- Body stance follows the species and stays the same in every shot (for example a tyrannosaurus stands on two hind legs with tiny arms tucked to the chest and bends at the hips to drink).',
    '',
    'CAMERA RULES',
    '- shotSize is one of EWS, WS, MS, MCU, CU, ECU, OTS, INSERT, POV.',
    '- At least 35% of shots are CU, MCU or ECU on faces; at most 25% are WS or EWS; the first shot may be a WS or EWS establishing shot.',
    '- Never use the same shotSize twice in a row. OTS needs both characters in the shot.',
    '- cameraMoveEn is one simple move: "static", "slow push in", "slow pull back", "gentle pan left", "gentle pan right", "slow tilt up" or "handheld follow".',
    '- Screen direction (180-degree rule): char1 stays on the left of frame facing screen-right and char2 on the right facing screen-left in every shot, close-ups included.',
    '',
    'SOUND AND DIALOGUE',
    vo
      ? '- narrationVi: for shots WITHOUT dialogue, one short Vietnamese voice-over line (at most 12 words) that adds meaning the picture cannot show; "" for dialogue shots. All other sound comes from the scene.'
      : '- There is no narrator and no voice-over. All sound comes from the scene.',
    `- A character with canSpeak true may say one short in-character line in a shot: at most 8 words, specific and natural. ${langRule}`,
    '- Animals that should stay animal-like and creatures set canSpeak false and use vocalEn instead: a short non-verbal sound such as "a low curious rumble" or "a startled squeak".',
    '- Put dialogue in at most half of the shots; silence and reactions carry the rest.',
    '- sfxEn: the specific sounds of the action. ambientEn: the background sound of the place.',
    '',
    'LOOK RULES',
    `- One environment for the whole film, lit by ONE motivated key light (sun, window, lamp, fire) and ${p.paletteRuleEn}.`,
    '- Effects: fxLevel 0 for setup and resolution shots, at most 1 for inciting, escalation and reversal, and 2 only for one or two climax shots. fxEn names the single effect (for example "a burst of sand") or is "".',
    '- Keep spectacle rare: lightning, explosions, lava, sparks or laser beams only if the idea truly needs one of them, and then only that one.',
    '- Water: a splash only where a body touches water that is already in the set (feet in the shallows, a snout dipping into the pool), kept low around the feet; everywhere else at most "a few droplets". Never water streaming or dripping from a jaw, and never spray on dry ground. Splashes of mud stay lower than the body.',
    '- English fields are plain, concrete, visual English: no numbers, measurements, code IDs, brackets, quotation marks or metaphors, and no negative phrasing (describe what is there, never what is absent).',
    '',
    'CHARACTERS (1-2)',
    "- displayNameEn: a short name usable in English prompts (keep the user's name if it has one, otherwise a short friendly name).",
    '- safeId: the name in ASCII UPPER_SNAKE_CASE without accents.',
    '- lookEn: at most 40 words. Species and body shape first, then face and eyes, then ONE signature colour accent written as "... as a signature accent". Appealing, simple, readable shapes.',
    '- voiceEn: the voice style, e.g. "a bright, squeaky young voice" or, for creatures, "deep rumbling growls".',
    '- personalityVi (Vietnamese, for the character folder), exactly three parts:',
    '  "• Chỉ số hình thể: chiều cao, cân nặng, giải phẫu\\n• Tính cách & Linh hồn cảm xúc: ...\\n• Hành động & Chiêu thức đặc trưng:\\n  - [ACTION_NAME]: ...\\n  - [SKILL_1_NAME]: ...\\n  - [SKILL_2_NAME]: ..."',
    '',
    'ENVIRONMENT',
    '- lookEn: the empty set in at most 35 words (no characters). lightingEn: the single motivated key light and its direction. paletteEn: one dominant hue family plus one accent.',
    '',
    'SHOT FIELDS',
    '- startStateEn: what the first frame shows: pose, expression and position (max 25 words).',
    '- endStateEn: what the LAST frame shows (max 25 words): the same place, the same shot size, the same camera framing and the same character positions as startStateEn; only poses and expressions change. For a contact action it is the moment one step before contact.',
    '- actionEn: the one visible action during the shot, starting with the character name (max 20 words).',
    '- actingBeatEn: the expression change, e.g. "worry melts into a proud grin" (max 16 words).',
    '- gazeEn: where the eyes look, e.g. "looking down at the water" (max 10 words).',
    '- durationSeconds: 4, 6 or 8 (use 8 for most shots).',
    '- titleVi: a short Vietnamese shot title.',
    '',
    'Reply with ONE JSON object only (no markdown fences, no comments), with exactly this structure:',
    JSON.stringify(
      {
        movieTitle: 'short Vietnamese title',
        loglineVi: 'one Vietnamese sentence: who wants what, and what stands in the way',
        style,
        characters: [
          {
            id: 'char1',
            safeId: 'ASCII_UPPER_SNAKE',
            displayNameVi: '...',
            displayNameEn: '...',
            species: '...',
            lookEn: '...',
            voiceEn: '...',
            canSpeak: true,
            personalityVi: '...',
          },
        ],
        environment: {
          safeId: 'ASCII_UPPER_SNAKE',
          displayNameVi: '...',
          lookEn: '...',
          timeOfDayEn: '...',
          lightingEn: '...',
          paletteEn: '...',
        },
        shots: [
          {
            shotNumber: 1,
            titleVi: '...',
            beat: 'setup',
            shotSize: 'WS',
            cameraMoveEn: 'static',
            characters: ['char1'],
            startStateEn: '...',
            endStateEn: '...',
            actionEn: '...',
            actingBeatEn: '...',
            gazeEn: '...',
            dialogue: { speaker: 'char1', lineEn: '...', lineVi: '...' },
            vocalEn: '',
            sfxEn: '...',
            ambientEn: '...',
            fxLevel: 0,
            fxEn: '',
            durationSeconds: 8,
            ...(vo ? { narrationVi: '...' } : {}),
          },
        ],
      },
      null,
      2
    ),
    `Use "dialogue": null for shots without a spoken line. Produce exactly ${n} shots.`,
  ].join('\n');
}

// ───────────────────────────── Coverage planner ─────────────────────────────

function cloneShot(s: PremiumShot): PremiumShot {
  return {
    ...s,
    characters: Array.isArray(s.characters) ? [...s.characters] : [],
    dialogue: s.dialogue ? { ...s.dialogue } : null,
  };
}

/**
 * Ép luật phủ góc máy: không lặp cỡ cảnh liền kề; >=35% CU/MCU/ECU; <=25% WS/EWS (cảnh đầu được phép là toàn cảnh mở màn);
 * ngân sách hiệu ứng theo nhịp (setup/resolution 0, các nhịp giữa <=1, climax tối đa 2 cảnh mức 2).
 */
const NEUTRAL_STATE_BY_BEAT: Record<PremiumBeat, { adj: string; noun: string; target: string; actionTail: string }> = {
  setup: { adj: 'calm and watchful', noun: 'calm watchfulness', target: 'quiet curiosity', actionTail: 'takes a slow breath and blinks' },
  inciting: { adj: 'startled and alert', noun: 'startled surprise', target: 'wary alarm', actionTail: 'lifts the head sharply, eyes widening' },
  escalation: { adj: 'tense and focused', noun: 'tense focus', target: 'steely resolve', actionTail: 'narrows the eyes and leans in' },
  reversal: { adj: 'shaken and wide-eyed', noun: 'shock', target: 'stubborn determination', actionTail: 'flinches, then stares in disbelief' },
  climax: { adj: 'fierce and determined', noun: 'fierce determination', target: 'fiery resolve', actionTail: 'sets the jaw and draws a deep breath' },
  resolution: { adj: 'tired but relieved', noun: 'quiet relief', target: 'a small proud smile', actionTail: 'lets out a long breath, shoulders dropping' },
};

const ACTING_TRANSITION_RE = /\b(?:into|turns?|melts?|softens?|hardens?|gives? way|breaks?|grows?|fades?|snaps?|shifts?|settles?|eases?|then|becomes?|widens?|narrows?|drops?|lifts?|tightens?|relaxes?|steadies|trembles?)\b/i;

/** "rage" -> "tense focus turns into rage": nhịp diễn một từ không có thay đổi A->B thì Veo không diễn được. */
function actingWithTransition(acting: string, beat: PremiumBeat): string {
  const a = stripEnd(acting);
  if (!a) return '';
  if (countWords(a) <= 3 && !ACTING_TRANSITION_RE.test(a)) {
    const from = (NEUTRAL_STATE_BY_BEAT[beat] || NEUTRAL_STATE_BY_BEAT.escalation).noun;
    return `${from} turns into ${a.toLowerCase()}`;
  }
  return a;
}

/**
 * Cảnh bị nâng lên cận mặt để đủ tỉ lệ 35% nhưng mang hành động va chạm / di chuyển lớn / hiệu ứng → đổi thành CẢNH PHẢN ỨNG
 * (khuôn mặt + thay đổi biểu cảm), không để khung hình đầu "mặt kín khung" mâu thuẫn với "quật đuôi / phóng sét".
 */
function toReactionShot(s: PremiumShot, nameOf: (id: PremiumCharId) => string): void {
  const id = s.dialogue && s.characters.includes(s.dialogue.speaker) ? s.dialogue.speaker : s.characters[0] || 'char1';
  const name = nameOf(id) || 'The character';
  const st = NEUTRAL_STATE_BY_BEAT[s.beat] || NEUTRAL_STATE_BY_BEAT.escalation;
  s.characters = [id, ...s.characters.filter((x) => x !== id)];
  s.startStateEn = `${name}'s face, ${st.adj}`;
  s.actionEn = `${name} ${st.actionTail}`;
  const acting = stripEnd(s.actingBeatEn || '');
  s.actingBeatEn =
    acting && !hasContactAction(acting) && effectTerms(acting).length === 0
      ? actingWithTransition(acting, s.beat)
      : `${st.noun} turns into ${st.target}`;
  s.fxLevel = 0;
  s.fxEn = '';
  s.cameraMoveEn = /push/i.test(s.cameraMoveEn) ? 'slow push in' : 'static';
  // Khung cuối cũ thuộc về hành động cũ (va chạm / hiệu ứng): để trống, applyRealRenderRules suy ra lại từ cảnh phản ứng.
  if (s.endStateEn) s.endStateEn = '';
}

function unsuitableForFace(s: PremiumShot): boolean {
  return hasContactAction(s.actionEn) || effectTerms(s.actionEn).length > 0;
}

/**
 * Ép luật phủ góc máy: không lặp cỡ cảnh liền kề; >=35% CU/MCU/ECU; <=25% WS/EWS (cảnh đầu được phép là toàn cảnh mở màn);
 * ngân sách hiệu ứng theo nhịp (setup/resolution 0, các nhịp giữa <=1, climax tối đa 2 cảnh mức 2).
 * opts.characters (nếu có): tên nhân vật để viết lại cảnh phản ứng và đặt người nói / người hành động quay mặt về máy ở góc qua vai.
 */
export function planCoverage(shots: PremiumShot[], opts: { characters?: PremiumCharacter[] } = {}): PremiumShot[] {
  const out = (Array.isArray(shots) ? shots : []).filter(Boolean).map(cloneShot);
  const n = out.length;
  if (!n) return out;
  const chars = (opts?.characters || []).filter(Boolean);
  const nameOf = (id: PremiumCharId) => chars.find((c) => c.id === id)?.displayNameEn || '';
  const actorIdOf = (text: string): PremiumCharId | null =>
    chars.find((c) => c.displayNameEn && startsWithName(String(text || ''), [c.displayNameEn]))?.id || null;

  out.forEach((s, i) => {
    s.shotNumber = i + 1;
    if (!(PREMIUM_SHOT_SIZES as string[]).includes(s.shotSize)) s.shotSize = 'MS';
    if (s.shotSize === 'OTS' && s.characters.length < 2) s.shotSize = 'MS';
    if (FACE_SIZES.has(s.shotSize) && !s.characters.length) s.characters = ['char1'];
  });

  const minFace = Math.ceil(n * 0.35);
  const maxWide = Math.max(Math.floor(n * 0.25), WIDE_SIZES.has(out[0].shotSize) && n > minFace ? 1 : 0);
  const faceCount = () => out.filter((s) => FACE_SIZES.has(s.shotSize)).length;
  const wideCount = () => out.filter((s) => WIDE_SIZES.has(s.shotSize)).length;

  // 1) Giới hạn toàn cảnh: giữ cảnh mở màn, rồi cảnh kết, rồi theo thứ tự.
  const wideIdx = out.map((s, i) => (WIDE_SIZES.has(s.shotSize) ? i : -1)).filter((i) => i >= 0);
  if (wideIdx.length > maxWide) {
    const rank = (i: number) => (i === 0 ? -2 : i === n - 1 ? -1 : i);
    const keep = new Set([...wideIdx].sort((a, b) => rank(a) - rank(b)).slice(0, maxWide));
    for (const i of wideIdx) if (!keep.has(i)) out[i].shotSize = 'MS';
  }

  // 2) Đủ tỉ lệ cận mặt: ưu tiên cảnh có thoại, cảnh phản ứng, rồi MS/OTS/POV, INSERT sau cùng.
  if (faceCount() < minFace) {
    const pref = (s: PremiumShot, i: number): number => {
      if (i === 0 && WIDE_SIZES.has(s.shotSize)) return 99;
      let score = s.dialogue ? 0 : s.actingBeatEn ? 2 : 4;
      score += { MS: 0, OTS: 1, POV: 2, WS: 3, EWS: 4, INSERT: 6 }[s.shotSize] ?? 5;
      if (!s.characters.length) score += 10;
      // Ưu tiên cảnh không có va chạm / di chuyển lớn / hiệu ứng (cảnh đó buộc phải viết lại thành cảnh phản ứng).
      if (unsuitableForFace(s)) score += 8;
      return score;
    };
    const candidates = out
      .map((s, i) => ({ s, i, p: pref(s, i) }))
      .filter((x) => !FACE_SIZES.has(x.s.shotSize))
      .sort((a, b) => a.p - b.p || a.i - b.i);
    for (const c of candidates) {
      if (faceCount() >= minFace) break;
      c.s.shotSize = c.s.dialogue ? 'MCU' : 'CU';
      if (!c.s.characters.length) c.s.characters = ['char1'];
      const speaker = c.s.dialogue?.speaker;
      if (speaker && c.s.characters.includes(speaker) && c.s.characters[0] !== speaker) {
        c.s.characters = [speaker, ...c.s.characters.filter((id) => id !== speaker)];
      }
      if (unsuitableForFace(c.s)) toReactionShot(c.s, nameOf);
    }
  }

  // 3) Không lặp cỡ cảnh liền kề.
  const alternatives = (s: PremiumShot): PremiumShotSize[] => {
    const two = s.characters.length >= 2;
    if (FACE_SIZES.has(s.shotSize)) return s.dialogue ? ['MCU', 'CU', 'ECU'] : ['CU', 'MCU', 'ECU'];
    if (WIDE_SIZES.has(s.shotSize)) return ['WS', 'EWS', 'MS', ...(two ? (['OTS'] as PremiumShotSize[]) : [])];
    const mids: PremiumShotSize[] = ['MS', ...(two ? (['OTS'] as PremiumShotSize[]) : []), 'MCU', 'CU'];
    return mids;
  };
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (let i = 1; i < n; i++) {
      if (out[i].shotSize !== out[i - 1].shotSize) continue;
      const cur = out[i];
      const prev = out[i - 1].shotSize;
      const next = i + 1 < n ? out[i + 1].shotSize : null;
      const wasFace = FACE_SIZES.has(cur.shotSize);
      const pick = alternatives(cur).find((alt) => {
        if (alt === prev || alt === next || alt === cur.shotSize) return false;
        if (WIDE_SIZES.has(alt) && !WIDE_SIZES.has(cur.shotSize) && wideCount() >= maxWide) return false;
        if (wasFace && !FACE_SIZES.has(alt) && faceCount() <= minFace) return false;
        return true;
      });
      const fallbackPick = (PREMIUM_SHOT_SIZES as PremiumShotSize[]).find(
        (alt) =>
          alt !== prev &&
          alt !== next &&
          (alt !== 'OTS' || cur.characters.length >= 2) &&
          !WIDE_SIZES.has(alt) &&
          (FACE_SIZES.has(alt) || !wasFace || faceCount() > minFace)
      );
      const chosen = pick || fallbackPick;
      if (chosen) {
        cur.shotSize = chosen;
        if (FACE_SIZES.has(chosen) && !cur.characters.length) cur.characters = ['char1'];
        changed = true;
      }
    }
    if (!changed) break;
  }

  // 4) Ngân sách hiệu ứng theo nhịp.
  let climaxBig = 0;
  for (const s of out) {
    let lvl = [0, 1, 2].includes(Number(s.fxLevel)) ? Number(s.fxLevel) : 0;
    const fx = stripEnd(s.fxEn || '');
    const capLvl = s.beat === 'setup' || s.beat === 'resolution' ? 0 : s.beat === 'climax' ? 2 : 1;
    lvl = Math.min(lvl, capLvl);
    if (!fx) lvl = 0;
    if (lvl === 2) {
      if (climaxBig >= 2) lvl = 1;
      else climaxBig++;
    }
    s.fxLevel = lvl as 0 | 1 | 2;
    s.fxEn = lvl === 0 ? '' : fx;
  }

  // 5) Góc qua vai: người quay mặt về máy (characters[1]) là người nói; không có thoại thì là người thực hiện hành động.
  for (const s of out) {
    if (s.shotSize !== 'OTS' || s.characters.length < 2) continue;
    const facing = s.dialogue && s.characters.includes(s.dialogue.speaker) ? s.dialogue.speaker : actorIdOf(s.actionEn);
    if (facing && s.characters[1] !== facing) s.characters = [s.characters.find((id) => id !== facing)!, facing];
  }
  return out;
}

// ───────────────────────────── Fallback cast & story (deterministic) ─────────────────────────────

interface SpeciesProfile {
  re: RegExp;
  speciesEn: string;
  lookEn: string;
  limbsEn: string;
  voiceEn: string;
  canSpeak: boolean;
  defaultNameEn: string;
  statsVi: string;
}

const SPECIES_LIBRARY: SpeciesProfile[] = [
  { re: vw('rái cá|otters?'), speciesEn: 'sea otter', lookEn: 'a small round-bellied sea otter with glossy chocolate-brown fur, a cream face, tiny round ears, big hazel eyes and a bright red scarf as a signature accent', limbsEn: 'paws', voiceEn: 'a bright, squeaky young voice', canSpeak: true, defaultNameEn: 'Ollie', statsVi: 'Cao khoảng 60 cm, nặng 5 kg; thân tròn, chân ngắn có màng, đuôi dẹt khỏe, bộ lông dày bóng mượt.' },
  { re: vw('gấu trúc|pandas?'), speciesEn: 'panda', lookEn: 'a chubby young panda with soft black-and-white fur, round ears, gentle dark eyes and a bright green headband as a signature accent', limbsEn: 'paws', voiceEn: 'a soft, sleepy young voice', canSpeak: true, defaultNameEn: 'Bao', statsVi: 'Cao khoảng 90 cm, nặng 40 kg; thân tròn mũm mĩm, tay chân ngắn, lông trắng đen mềm.' },
  { re: vw('cú mèo|owls?'), speciesEn: 'owl', lookEn: 'a round little owl with fluffy speckled brown feathers, huge golden eyes, tiny ear tufts and a red bow tie as a signature accent', limbsEn: 'wings', voiceEn: 'a soft, thoughtful hooting voice', canSpeak: true, defaultNameEn: 'Hoot', statsVi: 'Cao khoảng 25 cm, nặng 300 g; thân tròn, đôi mắt rất to, cánh ngắn lông lốm đốm.' },
  { re: vw('mèo|cats?|kittens?'), speciesEn: 'kitten', lookEn: 'a fluffy ginger kitten with a white muzzle, oversized pointed ears, big green eyes and a sky-blue collar bell as a signature accent', limbsEn: 'paws', voiceEn: 'a soft, cheeky young voice', canSpeak: true, defaultNameEn: 'Mochi', statsVi: 'Cao khoảng 25 cm, nặng 2 kg; thân nhỏ mềm mại, tai to nhọn, đuôi xù.' },
  { re: vw('chó|cún|dogs?|pupp(?:y|ies)'), speciesEn: 'puppy', lookEn: 'a scruffy little terrier puppy with sandy fur, floppy ears, a shiny black nose, big brown eyes and a yellow bandana as a signature accent', limbsEn: 'paws', voiceEn: 'an eager, scratchy young voice', canSpeak: true, defaultNameEn: 'Biscuit', statsVi: 'Cao khoảng 35 cm, nặng 6 kg; thân nhỏ chắc, tai cụp, đuôi ngắn luôn vẫy.' },
  { re: vw('(?<!báo\\s)cáo|fox(?:es)?'), speciesEn: 'fox', lookEn: 'a slender young red fox with a white-tipped bushy tail, tall pointed ears, clever amber eyes and a green satchel strap as a signature accent', limbsEn: 'paws', voiceEn: 'a quick, clever young voice', canSpeak: true, defaultNameEn: 'Rusty', statsVi: 'Cao khoảng 40 cm, nặng 6 kg; thân thon, chân dài, đuôi xù to.' },
  { re: vw('gấu|bears?'), speciesEn: 'bear cub', lookEn: 'a stocky brown bear cub with thick fluffy fur, a round snout, warm brown eyes and a blue knitted beanie as a signature accent', limbsEn: 'paws', voiceEn: 'a deep, gentle young voice', canSpeak: true, defaultNameEn: 'Bruno', statsVi: 'Cao khoảng 80 cm, nặng 30 kg; thân chắc nịch, bàn chân to, lông dày.' },
  { re: vw('thỏ|rabbits?|bunn(?:y|ies)'), speciesEn: 'rabbit', lookEn: 'a small grey rabbit with long floppy ears, a twitchy pink nose, bright black eyes and a yellow raincoat as a signature accent', limbsEn: 'paws', voiceEn: 'a quick, breathy young voice', canSpeak: true, defaultNameEn: 'Clover', statsVi: 'Cao khoảng 30 cm, nặng 2 kg; tai dài, chân sau khỏe, đuôi bông tròn.' },
  { re: vw('chim|birds?|sparrows?'), speciesEn: 'sparrow', lookEn: 'a round little sparrow with fluffy brown feathers, a tiny beak, shiny black eyes and a bright blue tail tip as a signature accent', limbsEn: 'wings', voiceEn: 'a tiny, chirpy voice', canSpeak: true, defaultNameEn: 'Pip', statsVi: 'Cao khoảng 15 cm, nặng 30 g; thân tròn, cánh ngắn, mỏ nhỏ.' },
  { re: vw('khỉ|monkeys?'), speciesEn: 'monkey', lookEn: 'a lanky young monkey with soft tan fur, a heart-shaped face, big curious brown eyes and an orange headband as a signature accent', limbsEn: 'hands', voiceEn: 'a cheeky, excitable young voice', canSpeak: true, defaultNameEn: 'Coco', statsVi: 'Cao khoảng 50 cm, nặng 6 kg; tay dài, đuôi dài, mặt hình trái tim.' },
  { re: vw('voi|elephants?'), speciesEn: 'baby elephant', lookEn: 'a chubby baby elephant with soft grey skin, huge floppy ears, a curly trunk, big gentle eyes and a pink flower behind one ear as a signature accent', limbsEn: 'feet', voiceEn: 'a warm, wobbly young voice', canSpeak: true, defaultNameEn: 'Tumbo', statsVi: 'Cao khoảng 1 m, nặng 120 kg; tai to, vòi cong, chân tròn mập.' },
  { re: vw('sư tử|lions?'), speciesEn: 'lion cub', lookEn: 'a fluffy lion cub with golden fur, an unruly little mane, big amber eyes and a green leaf necklace as a signature accent', limbsEn: 'paws', voiceEn: 'a proud, raspy young voice', canSpeak: true, defaultNameEn: 'Leo', statsVi: 'Cao khoảng 50 cm, nặng 15 kg; thân tròn, bờm nhỏ xù, bàn chân to.' },
  { re: vw('hổ|tigers?'), speciesEn: 'tiger cub', lookEn: 'a bouncy tiger cub with bright orange fur and bold black stripes, white cheeks, big green eyes and a blue wristband as a signature accent', limbsEn: 'paws', voiceEn: 'a bold, bouncy young voice', canSpeak: true, defaultNameEn: 'Raja', statsVi: 'Cao khoảng 55 cm, nặng 18 kg; thân dẻo, sọc đen đậm, đuôi dài.' },
  { re: vw('rồng|dragons?'), speciesEn: 'baby dragon', lookEn: 'a small chubby dragon with emerald-green scales, stubby wings, a round belly, big golden eyes and a red scarf as a signature accent', limbsEn: 'claws', voiceEn: 'a husky, playful young voice', canSpeak: true, defaultNameEn: 'Ember', statsVi: 'Cao khoảng 1 m, nặng 25 kg; bụng tròn, cánh ngắn, đuôi dài có gai mềm.' },
  { re: vw('robot|người máy'), speciesEn: 'robot', lookEn: 'a small rounded robot with a cream-white shell, a dark screen face showing big round blue eyes, stubby arms and a red antenna tip as a signature accent', limbsEn: 'hands', voiceEn: 'a cheerful, slightly digital voice', canSpeak: true, defaultNameEn: 'Bolt', statsVi: 'Cao khoảng 70 cm, nặng 20 kg; thân tròn vỏ trắng kem, mặt màn hình, tay ngắn.' },
  { re: vw('cô bé|bé gái|little girl|girl'), speciesEn: 'young girl', lookEn: 'a cheerful young girl with messy dark hair in two buns, rosy cheeks, big brown eyes and a bright yellow raincoat as a signature accent', limbsEn: 'hands', voiceEn: 'a bright, cheerful young voice', canSpeak: true, defaultNameEn: 'Mai', statsVi: 'Cao khoảng 1,2 m, nặng 22 kg; dáng nhỏ nhắn nhanh nhẹn.' },
  { re: vw('cậu bé|bé trai|little boy|boy'), speciesEn: 'young boy', lookEn: 'a lively young boy with a mop of black hair, a gap-toothed grin, big brown eyes and a red baseball cap as a signature accent', limbsEn: 'hands', voiceEn: 'a lively, scratchy young voice', canSpeak: true, defaultNameEn: 'Tom', statsVi: 'Cao khoảng 1,25 m, nặng 25 kg; dáng gầy nhanh nhẹn.' },
  { re: vw('ông lão|ông cụ|ông già|ông nội|ông ngoại|old man|grandpa'), speciesEn: 'old man', lookEn: 'a kind old man with a round white beard, bushy eyebrows, twinkling eyes, a soft cardigan and a green flat cap as a signature accent', limbsEn: 'hands', voiceEn: 'a warm, gravelly old voice', canSpeak: true, defaultNameEn: 'Grandpa Ho', statsVi: 'Cao khoảng 1,65 m, nặng 60 kg; dáng hơi còng, tay gân guốc.' },
  { re: vw('bà lão|bà cụ|bà già|bà nội|bà ngoại|old woman|grandma'), speciesEn: 'grandmother', lookEn: 'a lively grandmother with silver hair in a bun, round glasses, smiling eyes and a bright red shawl as a signature accent', limbsEn: 'hands', voiceEn: 'a warm, crackly old voice', canSpeak: true, defaultNameEn: 'Grandma Lan', statsVi: 'Cao khoảng 1,5 m, nặng 48 kg; dáng nhỏ, bước đi nhanh nhẹn.' },
  { re: vw('chàng trai|thanh niên|anh chàng|young man|man'), speciesEn: 'young man', lookEn: 'a lanky young man with tousled black hair, a friendly grin, warm brown eyes and a teal hoodie as a signature accent', limbsEn: 'hands', voiceEn: 'a warm, easygoing voice', canSpeak: true, defaultNameEn: 'Minh', statsVi: 'Cao khoảng 1,72 m, nặng 62 kg; dáng cao gầy.' },
];

const DEFAULT_SPECIES: SpeciesProfile = {
  re: /$^/,
  speciesEn: 'young woman',
  lookEn: 'a curious young woman with short dark hair, warm brown eyes, an easy smile and a mustard-yellow jacket as a signature accent',
  limbsEn: 'hands',
  voiceEn: 'a warm, friendly voice',
  canSpeak: true,
  defaultNameEn: 'An',
  statsVi: 'Cao khoảng 1,6 m, nặng 50 kg; dáng thon nhanh nhẹn.',
};

interface DinoProfile {
  key: 'trex' | 'spino' | 'trike';
  speciesEn: string;
  lookEn: string;
  voiceEn: string;
  defaultNameEn: string;
  statsVi: string;
  temperVi: string;
  codes: Array<[string, string]>;
}

const DINO_LIBRARY: Record<'trex' | 'spino' | 'trike', DinoProfile> = {
  trex: {
    key: 'trex',
    speciesEn: 'tyrannosaurus',
    lookEn: 'a stocky young tyrannosaurus with charcoal-grey pebbly skin, a broad expressive snout, big amber eyes, a nicked brow scar and bright ember-orange stripes down the back as a signature accent',
    voiceEn: 'deep chesty growls and proud huffs',
    defaultNameEn: 'Ember',
    statsVi: 'Cao 6 m, dài 12 m, nặng khoảng 8 tấn; đầu to, mõm rộng biểu cảm, tay trước ngắn hai ngón, chân sau to khỏe, đuôi dày; da xám than sần với sọc cam rực dọc lưng, vết sẹo nhỏ trên chân mày.',
    temperVi: 'Kiêu hãnh, nóng nảy nhưng giàu lòng trắc ẩn; giấu nỗi sợ mất mái nhà sau tiếng gầm, càng bị dồn ép càng bùng lên ý chí.',
    codes: [
      ['ACTION_WARNING_ROAR', 'Dậm chân và gầm cảnh cáo để bảo vệ lãnh thổ.'],
      ['SKILL_1_HEADBUTT_CHARGE', 'Cúi đầu lao tới húc trán cực mạnh vào ngực đối thủ.'],
      ['SKILL_2_STOMP_QUAKE', 'Dậm chân thật mạnh làm mặt đất rung chuyển khiến đối thủ mất thăng bằng.'],
    ],
  },
  spino: {
    key: 'spino',
    speciesEn: 'spinosaurus',
    lookEn: 'a lanky spinosaurus with slate-blue crocodile-like skin, a long narrow snout, sly green eyes and a tall teal-striped sail as a signature accent',
    voiceEn: 'raspy hisses and clicking chuffs',
    defaultNameEn: 'Tide',
    statsVi: 'Cao 5 m tính cả buồm lưng, dài 14 m, nặng khoảng 7 tấn; thân thon dài, mõm hẹp như cá sấu, vuốt trước cong, buồm lưng cao; da xanh xám đá phiến với sọc xanh ngọc trên buồm.',
    temperVi: 'Xảo quyệt, kiên nhẫn, đói khát nhưng biết tôn trọng kẻ mạnh hơn mình.',
    codes: [
      ['ACTION_REED_AMBUSH', 'Ẩn mình trong lau sậy rồi trồi lên bất ngờ.'],
      ['SKILL_1_SNAP_LUNGE', 'Lao tới đớp nhanh bằng chiếc mõm dài.'],
      ['SKILL_2_TAIL_SWEEP', 'Xoay người quật đuôi quét ngã đối thủ.'],
    ],
  },
  trike: {
    key: 'trike',
    speciesEn: 'triceratops',
    lookEn: 'a sturdy triceratops with olive-green skin, a wide frill, three stubby horns, kind brown eyes and a frill edged in bright yellow as a signature accent',
    voiceEn: 'low honking snorts',
    defaultNameEn: 'Moss',
    statsVi: 'Cao 3 m, dài 9 m, nặng khoảng 9 tấn; diềm cổ rộng, ba sừng ngắn, bốn chân to chắc; da xanh ô liu, viền diềm vàng tươi.',
    temperVi: 'Bướng bỉnh, trung thành, chậm nóng nhưng một khi nổi giận thì không gì cản nổi.',
    codes: [
      ['ACTION_HORN_SHAKE', 'Lắc sừng và cào đất thị uy.'],
      ['SKILL_1_HORN_CHARGE', 'Cúi đầu lao tới bằng ba chiếc sừng.'],
      ['SKILL_2_FRILL_BLOCK', 'Dùng diềm cổ rộng chặn đòn và hất văng đối thủ.'],
    ],
  },
};

interface ActivityProfile {
  re: RegExp;
  code: string;
  titleVi: string;
  verbVi: string;
  propEn: string;
  tryEn: string;
  wobbleEn: string;
  glideEn: string;
  mishapEn: string /* may contain {soft} */;
  triumphEn: string;
  detailEn: string /* may contain {limbs} */;
  sfxEn: string;
  fxSmallEn?: string;
  fxBigEn?: string;
  actionVi: string;
}

const ACTIVITY_LIBRARY: ActivityProfile[] = [
  { re: vw('trượt ván|ván trượt|skateboard(?:ing)?|skate'), code: 'SKATE', titleVi: 'Chuyến trượt ván đầu tiên', verbVi: 'trượt ván', propEn: 'a small wooden skateboard', tryEn: 'pushes off and rolls forward on the skateboard', wobbleEn: 'wobbles on the skateboard, arms windmilling for balance', glideEn: 'glides along on the skateboard in a smooth curve', mishapEn: 'hits a bump and tumbles off the skateboard into {soft}', triumphEn: 'carves a long, confident turn on the skateboard', detailEn: '{limbs} gripping the edge of the skateboard', sfxEn: 'skateboard wheels rumbling', actionVi: 'Đạp ván lấy đà rồi lao vút về phía trước.' },
  { re: vw('lướt sóng|ván lướt|surf(?:ing|board)?'), code: 'SURF', titleVi: 'Con sóng đầu tiên', verbVi: 'lướt sóng', propEn: 'a small surfboard', tryEn: 'paddles hard and pops up on the surfboard', wobbleEn: 'wobbles on the surfboard, knees shaking', glideEn: 'rides the wave in a smooth line', mishapEn: 'loses balance and flips off the surfboard into {soft}', triumphEn: 'rides the curl of a big wave', detailEn: '{limbs} gripping the surfboard rails', sfxEn: 'the board slapping the water', fxSmallEn: 'a burst of white sea spray', fxBigEn: 'a tall curtain of sea spray', actionVi: 'Chèo mạnh rồi bật đứng dậy trên ván.' },
  { re: vw('xe đạp|đạp xe|bicycles?|bikes?|cycling'), code: 'BIKE', titleVi: 'Chiếc xe đạp đầu tiên', verbVi: 'đạp xe', propEn: 'a little bicycle', tryEn: 'pedals off on the bicycle', wobbleEn: 'wobbles on the bicycle, handlebars shaking', glideEn: 'rides the bicycle smoothly downhill', mishapEn: 'hits a bump and topples off the bicycle into {soft}', triumphEn: 'rides the bicycle fast and steady, grinning into the wind', detailEn: '{limbs} gripping the handlebars', sfxEn: 'a bicycle chain clicking and tyres crunching', actionVi: 'Đạp mạnh bàn đạp lao xuống dốc.' },
  { re: vw('diều|thả diều|kites?'), code: 'KITE', titleVi: 'Cánh diều bay cao', verbVi: 'thả diều', propEn: 'a bright diamond kite', tryEn: 'runs and launches the kite into the wind', wobbleEn: 'tugs at the kite string as the kite dips and spins', glideEn: 'lets the kite climb high into the sky', mishapEn: 'gets yanked off balance by a gust and tumbles into {soft}', triumphEn: 'holds the kite steady high in the sky', detailEn: '{limbs} gripping the taut kite string', sfxEn: 'kite fabric snapping in the wind', actionVi: 'Chạy ngược gió thả cánh diều bay lên.' },
  { re: vw('nấu ăn|nấu|làm bánh|bánh kếp|cook(?:ing)?|bak(?:e|ing)|pancakes?'), code: 'COOK', titleVi: 'Chiếc bánh đầu tiên', verbVi: 'nấu ăn', propEn: 'a small frying pan', tryEn: 'flips a pancake in the frying pan', wobbleEn: 'juggles the pancake as it flops around the pan', glideEn: 'catches the pancake neatly in the pan', mishapEn: 'flips too hard and tumbles backward into {soft}', triumphEn: 'flips a perfect golden pancake high and catches it', detailEn: 'batter bubbling in the frying pan', sfxEn: 'butter sizzling and a pan clanking', fxSmallEn: 'a puff of flour', fxBigEn: 'a big cloud of flour', actionVi: 'Hất chảo lật bánh thật điệu nghệ.' },
  { re: vw('nhảy múa|khiêu vũ|múa|dance|dancing'), code: 'DANCE', titleVi: 'Điệu nhảy đầu tiên', verbVi: 'nhảy múa', propEn: 'a pair of dancing shoes', tryEn: 'tries the first dance steps', wobbleEn: 'trips mid-spin, arms flailing', glideEn: 'twirls in a smooth, graceful spin', mishapEn: 'slips mid-spin and lands in {soft}', triumphEn: 'leaps into a joyful spinning finale', detailEn: 'feet tapping out the rhythm', sfxEn: 'feet tapping and cloth swishing', actionVi: 'Xoay một vòng thật duyên dáng.' },
  { re: vw('leo núi|leo|climb(?:ing)?'), code: 'CLIMB', titleVi: 'Đỉnh cao đầu tiên', verbVi: 'leo trèo', propEn: 'a coil of climbing rope', tryEn: 'grabs the first handhold and starts climbing', wobbleEn: 'dangles from one handhold, legs kicking', glideEn: 'scrambles quickly up the rock face', mishapEn: 'slips and slides back down into {soft}', triumphEn: 'hauls up onto the top and raises both arms', detailEn: '{limbs} gripping a rough handhold', sfxEn: 'scraping on rock and pebbles trickling down', actionVi: 'Bám chắc mỏm đá rồi đu người lên cao.' },
  { re: vw('đàn|ghi-?ta|guitar|hát|sing(?:ing)?|music'), code: 'MUSIC', titleVi: 'Giai điệu đầu tiên', verbVi: 'chơi nhạc', propEn: 'a little wooden guitar', tryEn: 'strums the first chord on the guitar', wobbleEn: 'fumbles the strings with a sour twang', glideEn: 'plays a bright little melody', mishapEn: 'snaps a string with a loud twang and topples backward into {soft}', triumphEn: 'plays the melody perfectly from start to finish', detailEn: 'guitar strings vibrating under {limbs}', sfxEn: 'guitar strings twanging', actionVi: 'Gảy hợp âm đầu tiên vang lên trong trẻo.' },
];

const DEFAULT_ACTIVITY: ActivityProfile = {
  re: /$^/,
  code: 'EXPLORE',
  titleVi: 'Chuyến phiêu lưu đầu tiên',
  verbVi: 'khám phá',
  propEn: 'a small backpack',
  tryEn: 'sets off along the path with the backpack',
  wobbleEn: 'hops across wobbly stepping stones, arms out for balance',
  glideEn: 'strides along confidently',
  mishapEn: 'trips over a root and tumbles into {soft}',
  triumphEn: 'reaches the top of the hill and looks out at the view',
  detailEn: 'footprints pressing into the ground',
  sfxEn: 'footsteps and backpack straps creaking',
  actionVi: 'Xốc ba lô lên vai và bước đi khám phá.',
};

interface EnvProfile {
  re: RegExp;
  labelVi: string;
  lookEn: string;
  shortEn: string;
  timeOfDayEn: string;
  lightingEn: string;
  paletteEn: string;
  groundEn: string;
  softSpotEn: string;
  ambientEn: string;
  goalEn: string;
  interior?: boolean;
  hideSpotEn?: string;
  threatEn?: string;
}

const ABANDONED_HOUSE_ENV: EnvProfile = {
  re: vw('nhà hoang|căn nhà hoang|ngôi nhà hoang|nhà bỏ hoang|nhà ma|biệt thự hoang|abandoned house|haunted house|abandoned mansion'),
  labelVi: 'Căn nhà hoang',
  lookEn: 'a dusty abandoned house hallway with peeling wallpaper, a creaky wooden floor, an old armchair and a closed door at the far end',
  shortEn: 'the dusty hallway',
  timeOfDayEn: 'late afternoon',
  lightingEn: 'pale daylight through a single dusty window on the left',
  paletteEn: 'dusty browns and faded greens with one warm accent',
  groundEn: 'dust',
  softSpotEn: 'a pile of old blankets',
  ambientEn: 'creaking floorboards and soft wind outside',
  goalEn: 'the closed door at the far end',
  interior: true,
  hideSpotEn: 'behind the old armchair',
  threatEn: 'a slow knock at the closed door',
};

const HOUSE_ENV: EnvProfile = {
  re: vw('căn nhà|ngôi nhà|hành lang|căn phòng|phòng ngủ|phòng khách|gác mái|tầng hầm|house|hallway|corridor|bedroom|living room|attic|basement|mansion'),
  labelVi: 'Căn nhà cũ',
  lookEn: 'an old wooden house hallway with faded wallpaper, framed pictures, a worn rug and a closed door at the far end',
  shortEn: 'the old hallway',
  timeOfDayEn: 'late afternoon',
  lightingEn: 'warm daylight through a single window on the left',
  paletteEn: 'warm wood browns and muted creams with one teal accent',
  groundEn: 'dust',
  softSpotEn: 'a pile of soft cushions',
  ambientEn: 'a ticking clock and creaking floorboards',
  goalEn: 'the closed door at the far end',
  interior: true,
  hideSpotEn: 'behind the old sofa',
  threatEn: 'a strange creak behind the closed door',
};

const PARK_HILL_ENV: EnvProfile = {
  re: vw('công viên|con dốc|dốc công viên|park|skate ?park|slope'),
  labelVi: 'Con dốc công viên',
  lookEn: 'a paved path winding down a gentle park hill lined with low hedges, benches and leafy trees',
  shortEn: 'the park hill',
  timeOfDayEn: 'late afternoon',
  lightingEn: 'a warm low sun from the left',
  paletteEn: 'fresh greens and warm path greys with a sunny yellow accent',
  groundEn: 'leaves',
  softSpotEn: 'a round leafy bush',
  ambientEn: 'birdsong, distant children playing and a light breeze',
  goalEn: 'the bottom of the hill',
};

const NIGHT_RE = vw('nửa đêm|ban đêm|đêm khuya|trong đêm|lúc đêm|đêm tối|đêm|midnight|night|nighttime');
const HORROR_RE = vw('kinh dị|rùng rợn|ma quái|hồn ma|bóng ma|con ma|ma ám|hồi hộp|sợ hãi|horror|scary|haunted|ghosts?|creepy|thriller|spooky');

/** Kịch bản nói "nửa đêm / ban đêm": đổi giờ, ánh sáng (trăng), bảng màu và tiếng nền cho hợp đêm. */
function applyNight(env: EnvProfile, script: string): EnvProfile {
  if (!NIGHT_RE.test(script)) return env;
  return {
    ...env,
    timeOfDayEn: /nửa đêm|midnight/i.test(script) ? 'midnight' : 'night',
    lightingEn: env.interior ? 'cool moonlight from a single window on the left' : 'cool moonlight from one side',
    paletteEn: NIGHT_PALETTE_EN,
    ambientEn: env.interior ? 'creaking floorboards and soft wind outside' : 'crickets and a soft night breeze',
  };
}

const ENV_LIBRARY: EnvProfile[] = [
  { re: vw('núi lửa|nham thạch|dung nham|volcan(?:o|ic|oes)|lava|magma'), labelVi: 'Thung lũng núi lửa', lookEn: 'a wide volcanic valley of dark basalt ridges and warm steaming pools, with sparse ferns on the rocks and a slow lava river glowing far in the background', shortEn: 'the volcanic valley', timeOfDayEn: 'golden hour', lightingEn: 'a low golden sun from the right raking across the rocks', paletteEn: 'warm amber and dusty rust tones with a small teal accent', groundEn: 'mud', softSpotEn: 'a patch of soft mud', ambientEn: 'low wind, bubbling hot springs and a distant rumble', goalEn: 'the last warm pool' },
  { re: vw('sa mạc|cồn cát|desert|dunes?'), labelVi: 'Sa mạc', lookEn: 'a sunny desert of rolling sand dunes dotted with round green shrubs and a few tall cacti under a wide clear sky', shortEn: 'the sunny dunes', timeOfDayEn: 'late afternoon', lightingEn: 'a low warm sun from the left casting long soft shadows', paletteEn: 'warm sand and apricot tones with a sage-green accent', groundEn: 'sand', softSpotEn: 'a round desert shrub', ambientEn: 'dry wind whispering over the sand', goalEn: 'the shady oasis' },
  { re: vw('bãi biển|biển|đại dương|hòn đảo|beach|ocean|seaside|sea|island'), labelVi: 'Bãi biển', lookEn: 'a sunny beach with soft pale sand, gentle turquoise waves and a few leaning palm trees', shortEn: 'the sunny beach', timeOfDayEn: 'late morning', lightingEn: 'a bright high sun from behind the camera', paletteEn: 'turquoise water and pale sand tones with a coral accent', groundEn: 'sand', softSpotEn: 'the soft wet sand', ambientEn: 'rolling waves and distant gulls', goalEn: 'the tide pool' },
  { re: vw('tuyết|băng giá|mùa đông|snowy|snow|ice|winter'), labelVi: 'Đồi tuyết', lookEn: 'a snowy hillside with soft white drifts and frosted pine trees', shortEn: 'the snowy hillside', timeOfDayEn: 'clear morning', lightingEn: 'a low bright winter sun from the left', paletteEn: 'cool blues and whites with a warm red accent', groundEn: 'snow', softSpotEn: 'a deep snowdrift', ambientEn: 'soft wind over snow', goalEn: 'the frozen pond' },
  { re: vw('khu rừng|rừng|forest|woods|jungle'), labelVi: 'Khu rừng xanh', lookEn: 'a lush green forest clearing with mossy roots, tall ferns and a small stream', shortEn: 'the forest clearing', timeOfDayEn: 'morning', lightingEn: 'soft morning sun streaming through the canopy from behind', paletteEn: 'fresh greens and mossy browns with a warm golden accent', groundEn: 'leaves', softSpotEn: 'a pile of fallen leaves', ambientEn: 'birdsong and rustling leaves', goalEn: 'the clear stream' },
  { re: vw('dòng sông|sông|hồ|suối|river|lake|pond|stream'), labelVi: 'Bờ sông', lookEn: 'a calm riverbank with smooth pebbles, tall reeds and willow trees leaning over clear water', shortEn: 'the riverbank', timeOfDayEn: 'morning', lightingEn: 'soft morning sun from the left', paletteEn: 'cool greens and river blues with a warm yellow accent', groundEn: 'water', softSpotEn: 'a clump of reeds', ambientEn: 'flowing water and croaking frogs', goalEn: 'the shallow ford' },
  { re: vw('thành phố|đường phố|phố|city|street|town'), labelVi: 'Phố nhỏ', lookEn: 'a cosy city street of small colourful shops, lamp posts and potted plants', shortEn: 'the city street', timeOfDayEn: 'early evening', lightingEn: 'a warm glow from a shop window on the right', paletteEn: 'warm brick and honey tones with a teal accent', groundEn: 'dust', softSpotEn: 'a big potted hedge', ambientEn: 'distant traffic hum and a café murmur', goalEn: 'the corner bakery' },
  { re: vw('ngôi làng|làng|quê|nông trại|cánh đồng|ruộng|village|farm|countryside|field'), labelVi: 'Làng quê', lookEn: 'a peaceful countryside lane between golden rice fields and a small wooden house', shortEn: 'the countryside lane', timeOfDayEn: 'golden hour', lightingEn: 'a low warm sun from behind the hills', paletteEn: 'golden yellows and soft greens with a red roof accent', groundEn: 'dust', softSpotEn: 'a haystack', ambientEn: 'crickets, a gentle breeze and a distant rooster', goalEn: 'the old well' },
  { re: vw('hang động|hang|caves?|caverns?'), labelVi: 'Hang động', lookEn: 'a cave with smooth rounded rock walls, a shallow pool and hanging roots', shortEn: 'the cave', timeOfDayEn: 'daytime', lightingEn: 'a single shaft of daylight from an opening above', paletteEn: 'cool stone greys with a warm golden accent', groundEn: 'pebbles', softSpotEn: 'a pile of soft moss', ambientEn: 'dripping water echoes', goalEn: 'the shallow pool' },
  { re: vw('nhà bếp|bếp|căn bếp|kitchen'), labelVi: 'Căn bếp', lookEn: 'a cosy kitchen with wooden counters, hanging copper pots and a checkered floor', shortEn: 'the cosy kitchen', timeOfDayEn: 'morning', lightingEn: 'warm morning sun through a window on the left', paletteEn: 'warm wood and cream tones with a red accent', groundEn: 'flour', softSpotEn: 'a big sack of flour', ambientEn: 'a ticking clock and birds outside the window', goalEn: 'the breakfast table' },
  ABANDONED_HOUSE_ENV,
  HOUSE_ENV,
  PARK_HILL_ENV,
  { re: vw('núi|đồi|mountains?|hills?'), labelVi: 'Sườn núi', lookEn: 'a grassy mountain slope with rocky outcrops and distant blue peaks', shortEn: 'the mountain slope', timeOfDayEn: 'late afternoon', lightingEn: 'a warm low sun from the right', paletteEn: 'grassy greens and slate greys with a warm orange accent', groundEn: 'dust', softSpotEn: 'a clump of tall grass', ambientEn: 'mountain wind and distant bird calls', goalEn: 'the summit' },
];

const PREHISTORIC_ENV: EnvProfile = {
  re: /$^/,
  labelVi: 'Thung lũng tiền sử',
  lookEn: 'a prehistoric river valley of giant ferns, mossy boulders and a wide shallow pool fed by a small waterfall',
  shortEn: 'the prehistoric valley',
  timeOfDayEn: 'golden hour',
  lightingEn: 'a low golden sun from the right',
  paletteEn: 'mossy greens and warm amber tones with a small teal accent',
  groundEn: 'mud',
  softSpotEn: 'a patch of soft mud',
  ambientEn: 'buzzing insects, a distant waterfall and calling birds',
  goalEn: 'the shallow pool',
};

const DEFAULT_ENV: EnvProfile = {
  re: /$^/,
  labelVi: 'Đồng cỏ',
  lookEn: 'a sunny park meadow of tall grass and wildflowers beside a gentle hill and a lone oak tree',
  shortEn: 'the sunny meadow',
  timeOfDayEn: 'late afternoon',
  lightingEn: 'a warm low sun from the left',
  paletteEn: 'fresh greens and warm golden tones with a sky-blue accent',
  groundEn: 'grass',
  softSpotEn: 'a soft bush',
  ambientEn: 'birdsong and a light breeze',
  goalEn: 'the top of the hill',
};

const DINO_RE = /khủng long|dinosaur|t-?rex|tyrannosaur|spinosaur|raptor|triceratops|jurassic|tiền sử|prehistoric/i;

function detectEnv(text: string, isDino: boolean): EnvProfile {
  const t = String(text || '');
  const base = ENV_LIBRARY.find((e) => e.re.test(t)) || (isDino ? PREHISTORIC_ENV : DEFAULT_ENV);
  return applyNight(base, t);
}

function detectActivity(text: string): ActivityProfile {
  const t = String(text || '');
  for (const a of ACTIVITY_LIBRARY) if (a.re.test(t)) return a;
  return DEFAULT_ACTIVITY;
}

function extractPlaceVi(script: string): string {
  const m = String(script || '').match(
    /(?:^|[\s,])(?:tại|ở|trên|trong|giữa lòng)\s+([\p{L}\s]{2,60}?)(?=\s+(?:giữa|và|với|của|rồi|thì|để|lần|khi|nơi|cùng|lúc|vào|suốt)\s|[,.:;!?]|$)/iu
  );
  if (!m) return '';
  const phrase = squash(m[1]);
  const n = countWords(phrase);
  return n >= 1 && n <= 6 ? cap(phrase) : '';
}

function findNameAfter(script: string, index: number, length: number): string {
  const after = script.slice(index + length, index + length + 48);
  const m = after.match(/^\s*(?:(?:nhỏ|bé|con|tên|là|tên là|named|called|little|tiny|young)\s+){0,3}([\p{Lu}][\p{L}'-]{1,20})/u);
  return m ? m[1] : '';
}

interface CastMember {
  profile: SpeciesProfile;
  nameVi: string;
  nameEn: string;
}

function detectCast(script: string): CastMember[] {
  const s = String(script || '');
  const hits: Array<{ p: SpeciesProfile; index: number; len: number }> = [];
  for (const p of SPECIES_LIBRARY) {
    const g = new RegExp(p.re.source, p.re.flags.includes('g') ? p.re.flags : p.re.flags + 'g');
    const m = g.exec(s);
    if (!m) continue;
    const overlaps = hits.some((h) => m.index < h.index + h.len && h.index < m.index + m[0].length);
    if (!overlaps) hits.push({ p, index: m.index, len: m[0].length });
  }
  hits.sort((a, b) => a.index - b.index);
  const named = /tên(?:\s+là)?\s+([\p{Lu}][\p{L}'-]{1,20})/u.exec(s);
  const cast: CastMember[] = hits.slice(0, 2).map((h, i) => {
    const near = findNameAfter(s, h.index, h.len) || (i === 0 && named ? named[1] : '');
    const nameVi = near || h.p.defaultNameEn;
    return { profile: h.p, nameVi, nameEn: cleanName(nameVi) || h.p.defaultNameEn };
  });
  if (!cast.length) {
    const nameVi = named ? named[1] : DEFAULT_SPECIES.defaultNameEn;
    cast.push({ profile: DEFAULT_SPECIES, nameVi, nameEn: cleanName(nameVi) || DEFAULT_SPECIES.defaultNameEn });
  }
  if (cast.length === 2 && cast[0].nameEn === cast[1].nameEn) {
    cast[1] = { ...cast[1], nameEn: cast[1].profile.defaultNameEn === cast[0].nameEn ? 'Bo' : cast[1].profile.defaultNameEn, nameVi: cast[1].profile.defaultNameEn };
  }
  return cast;
}

function buildPersonalityVi(statsVi: string, temperVi: string, codes: Array<[string, string]>): string {
  return [
    `• Chỉ số hình thể: ${statsVi}`,
    `• Tính cách & Linh hồn cảm xúc: ${temperVi}`,
    '• Hành động & Chiêu thức đặc trưng:',
    ...codes.map(([code, desc]) => `  - [${code}]: ${desc}`),
  ].join('\n');
}

function ensurePersonalityVi(
  raw: string,
  d: { statsVi: string; temperVi: string; codes: Array<[string, string]> }
): string {
  let t = String(raw || '').trim();
  let temper = d.temperVi;
  if (t && !/•|Chỉ số|Tính cách|\[ACTION_|\[SKILL_/i.test(t)) {
    temper = t;
    t = '';
  }
  if (!t) return buildPersonalityVi(d.statsVi, temper, d.codes);
  const lines: string[] = [t];
  if (!/Chỉ số hình thể/i.test(t)) lines.unshift(`• Chỉ số hình thể: ${d.statsVi}`);
  if (!/Tính cách/i.test(t)) lines.push(`• Tính cách & Linh hồn cảm xúc: ${temper}`);
  const missing = d.codes.filter(([code]) => {
    const prefix = code.startsWith('ACTION_') ? '[ACTION_' : code.startsWith('SKILL_1_') ? '[SKILL_1_' : '[SKILL_2_';
    return !t.includes(prefix);
  });
  if (missing.length) {
    if (!/Hành động/i.test(t)) lines.push('• Hành động & Chiêu thức đặc trưng:');
    for (const [code, desc] of missing) lines.push(`  - [${code}]: ${desc}`);
  }
  return lines.join('\n');
}

interface FallbackCtx {
  H: string;
  B: string;
  HVi: string;
  BVi: string;
  hasB: boolean;
  hSpeaks: boolean;
  bSpeaks: boolean;
  limbs: string;
  prop: string;
  act: ActivityProfile;
  env: EnvProfile;
}

interface TemplateShot {
  prio: number;
  shot: Omit<PremiumShot, 'shotNumber'>;
}

function mkShot(
  ctx: FallbackCtx,
  prio: number,
  s: Partial<Omit<PremiumShot, 'shotNumber'>> & Pick<PremiumShot, 'titleVi' | 'beat' | 'shotSize' | 'startStateEn' | 'actionEn' | 'actingBeatEn'>
): TemplateShot {
  return {
    prio,
    shot: {
      cameraMoveEn: 'static',
      characters: ['char1'],
      gazeEn: '',
      dialogue: null,
      vocalEn: '',
      sfxEn: '',
      ambientEn: ctx.env.ambientEn,
      fxLevel: 0,
      fxEn: '',
      durationSeconds: 8,
      ...s,
    },
  };
}

function say(speaks: boolean, speaker: PremiumCharId, lineEn: string, lineVi: string): PremiumDialogue | null {
  return speaks ? { speaker, lineEn, lineVi } : null;
}

function dinoTemplate(ctx: FallbackCtx): TemplateShot[] {
  const A = ctx.H;
  const B = ctx.B;
  const G = ctx.env.goalEn;
  // Rút từ bản render thật (dino_premium_v2): hành động tại chỗ, không "bước ra khỏi lau sậy", va chạm dừng một bước trước khi chạm
  // (cú chạm rơi vào điểm cắt + tiếng động ở cảnh sau), nước chỉ nhỏ giọt, nhịp không vui giữ miệng khép, mỗi cảnh có khung cuối.
  return [
    mkShot(ctx, 1, { titleVi: 'Hồ nước cuối cùng', beat: 'setup', shotSize: 'EWS', cameraMoveEn: 'slow push in', startStateEn: `${A} stands small on a ridge above ${G}, the valley stretching out below`, actionEn: `${A} stops at the edge of the ridge and spots ${G} below`, actingBeatEn: 'tired drooping shoulders lift as hope returns to the eyes', gazeEn: `looking down at ${G}`, vocalEn: 'a weary rumbling sigh', sfxEn: 'heavy footsteps crunching on gravel', endStateEn: `${A} at the edge of the ridge with the shoulders lifted and hopeful eyes fixed on ${G} below` }),
    mkShot(ctx, 2, { titleVi: 'Ngụm nước bị cắt ngang', beat: 'setup', shotSize: 'CU', startStateEn: `${A} lowers a broad snout to the water, eyes half closed with relief`, actionEn: `${A} laps the water, then freezes mid-sip`, actingBeatEn: 'relief turns into sharp alert suspicion, brows tightening', gazeEn: 'eyes flicking to the side', vocalEn: 'a low questioning rumble', sfxEn: 'water lapping, then sudden stillness', endStateEn: `${A} frozen mid-sip with the eyes turned sideways in sharp suspicion, brows tightened, a few droplets on the chin` }),
    mkShot(ctx, 1, { titleVi: 'Kẻ lạ trong lau sậy', beat: 'inciting', shotSize: 'OTS', characters: ['char1', 'char2'], startStateEn: `${B}'s head and sail stand above the tall reeds across ${G}, staring at ${A}`, actionEn: `${B} slowly tilts the long snout toward ${A}`, actingBeatEn: `${B}'s sly grin slowly widens to show teeth`, gazeEn: `${B} stares straight at ${A}`, vocalEn: 'a raspy clicking chuff', sfxEn: 'reeds rustling and a soft wet click', endStateEn: `${B} with the long snout tilted toward ${A} and a sly toothy grin, ${A}'s striped back still in the left foreground` }),
    mkShot(ctx, 2, { titleVi: 'Lời cảnh cáo', beat: 'inciting', shotSize: 'MCU', cameraMoveEn: 'slow push in', startStateEn: `${A} straightens to full height, chest puffed out, a few droplets on the jaw`, actionEn: `${A} stamps one foot and lets out a warning roar`, actingBeatEn: 'surprise hardens into a fierce, protective glare', gazeEn: `locked on ${B}`, vocalEn: 'a deep warning roar', sfxEn: 'a heavy foot stamp and pebbles skittering', endStateEn: `${A} mid-roar with the jaws open and a fierce protective glare, head and chest filling the frame as before` }),
    mkShot(ctx, 3, { titleVi: 'Vờn nhau', beat: 'escalation', shotSize: 'WS', cameraMoveEn: 'static', characters: ['char1', 'char2'], startStateEn: `${A} and ${B} face each other in the shallows of ${G}, both crouched low`, actionEn: `${A} and ${B} sway from side to side in the shallows, sizing each other up`, actingBeatEn: `${A} and ${B} keep their heads low, tense and wary, nostrils flaring`, gazeEn: `${A} watches ${B}'s eyes`, sfxEn: 'slow splashing footsteps in the shallows', endStateEn: `${A} and ${B} still facing each other in the shallows with heads lowered and wary eyes locked` }),
    mkShot(ctx, 4, { titleVi: 'Móng vuốt bám bùn', beat: 'escalation', shotSize: 'INSERT', characters: ['char2'], startStateEn: `close detail of ${B}'s clawed foot pressing into the wet mud at the water's edge`, actionEn: `the claws dig in and grip as ${B} shifts weight forward`, actingBeatEn: 'the leg muscles tense and coil', sfxEn: 'squelching mud and a tense creak', endStateEn: `${B}'s claws sunk deep into the wet mud, the leg muscles coiled` }),
    mkShot(ctx, 1, { titleVi: 'Cú đớp hụt', beat: 'escalation', shotSize: 'MS', cameraMoveEn: 'handheld follow', characters: ['char1', 'char2'], startStateEn: `${B} lunges with jaws wide open toward ${A} at the edge of ${G}, both with feet in the shallows`, actionEn: `${B} snaps at ${A}, who twists aside just in time`, actingBeatEn: `${A}'s eyes go wide, then narrow with focus`, gazeEn: `${A} tracks ${B}'s jaws`, vocalEn: 'a sharp startled snort', sfxEn: 'jaws snapping shut and splashing footsteps', endStateEn: `${B}'s jaws shut on empty air a head's width from ${A}, who is twisted aside with wide eyes` }),
    mkShot(ctx, 2, { titleVi: 'Nụ cười xảo quyệt', beat: 'escalation', shotSize: 'CU', characters: ['char2'], startStateEn: `${B} with a few droplets on the long snout, eyes narrowed`, actionEn: `${B} shakes the head with a smug flick of the snout`, actingBeatEn: 'annoyance turns into a cunning, confident smile', gazeEn: `eyes sliding back toward ${A}`, vocalEn: 'a low amused hiss', sfxEn: 'water droplets pattering', endStateEn: `${B} with a cunning, confident smile and the eyes slid back toward ${A}` }),
    mkShot(ctx, 1, { titleVi: 'Cú quật đuôi', beat: 'reversal', shotSize: 'WS', characters: ['char1', 'char2'], startStateEn: `${B} spins around with the tail swinging low toward ${A}'s legs while ${A} stands proud and unaware`, actionEn: `${B}'s tail sweeps low toward ${A}'s legs`, actingBeatEn: `${A}'s confident stance collapses into shock`, gazeEn: `${A} glancing down at the tail`, vocalEn: 'a surprised grunt', sfxEn: 'a fast whoosh of the swinging tail', endStateEn: `${B}'s tail a hand's width from ${A}'s shins, ${A}'s eyes going wide with shock` }),
    mkShot(ctx, 1, { titleVi: 'Ánh mắt không khuất phục', beat: 'reversal', shotSize: 'ECU', cameraMoveEn: 'slow push in', startStateEn: `${A} lying in the mud, one eye open, breathing hard`, actionEn: `${A}'s eye snaps into focus at the sound of approaching footsteps`, actingBeatEn: 'fear in the eye hardens into stubborn determination', gazeEn: `eye sliding toward ${B}`, vocalEn: 'a shaky breath that turns into a low growl', sfxEn: 'a heavy thud and a wet splat of mud, then slow heavy footsteps drawing closer', endStateEn: `${A}'s eye narrowed with stubborn determination, mud on the eyelid` }),
    mkShot(ctx, 1, { titleVi: 'Cú húc trời giáng', beat: 'climax', shotSize: 'MS', cameraMoveEn: 'handheld follow', characters: ['char1', 'char2'], startStateEn: `${A} surges up out of the mud, head lowered, charging at ${B}`, actionEn: `${A} charges at ${B} with the head lowered`, actingBeatEn: `${A}'s face sets into fierce, total focus`, gazeEn: `locked on ${B}'s chest`, vocalEn: 'a full-throated battle roar', sfxEn: 'pounding footsteps through the mud', fxLevel: 1, fxEn: 'a low spray of mud around the feet', endStateEn: `${A} one step from ${B} with the lowered head just before ${B}'s chest, ${B}'s eyes going wide` }),
    mkShot(ctx, 1, { titleVi: 'Choáng váng', beat: 'climax', shotSize: 'CU', characters: ['char2'], startStateEn: `${B} staggering backward, dazed, eyes unfocused`, actionEn: `${B} stumbles back, blinks hard and shakes off the daze`, actingBeatEn: 'shock melts into wary respect', gazeEn: `looking up at ${A}`, vocalEn: 'a small dazed whimper', sfxEn: 'a deep thud, then stumbling footsteps in the shallows', endStateEn: `${B} steady again with the head tilted and wary, respectful eyes` }),
    mkShot(ctx, 2, { titleVi: 'Lòng khoan dung', beat: 'climax', shotSize: 'OTS', cameraMoveEn: 'slow push in', characters: ['char2', 'char1'], startStateEn: `${A} looms over ${B}, jaws open, ready to strike`, actionEn: `${A} pauses mid-strike, then slowly closes the jaws`, actingBeatEn: 'rage softens into mercy', gazeEn: `looking down into ${B}'s eyes`, vocalEn: 'a long low exhale', sfxEn: 'heavy breathing and dripping water', endStateEn: `${A} with the jaws gently closed and soft merciful eyes looking down at ${B}` }),
    mkShot(ctx, 3, { titleVi: 'Rút lui', beat: 'resolution', shotSize: 'MS', characters: ['char2'], startStateEn: `${B} backing away toward the reeds, head bowed`, actionEn: `${B} gives a small nod and turns toward the reeds`, actingBeatEn: 'wariness eases into quiet gratitude', gazeEn: `glancing back at ${A} one last time`, vocalEn: 'a soft clicking chuff', sfxEn: 'reeds rustling', endStateEn: `${B} turned toward the reeds with the head bowed, glancing back with quiet gratitude` }),
    mkShot(ctx, 1, { titleVi: 'Ngụm nước chiến thắng', beat: 'resolution', shotSize: 'MCU', cameraMoveEn: 'slow push in', startStateEn: `${A}, muddy and tired, standing alone at the edge of ${G}`, actionEn: `${A} lowers the snout and drinks at last`, actingBeatEn: 'exhaustion eases into a small proud smile', gazeEn: 'eyes half closed in relief', vocalEn: 'a contented rumbling purr', sfxEn: 'water lapping gently', endStateEn: `${A} drinking from ${G} with the eyes half closed and a small proud smile` }),
    mkShot(ctx, 3, { titleVi: 'Hoàng hôn trên thung lũng', beat: 'resolution', shotSize: 'EWS', cameraMoveEn: 'slow pull back', startStateEn: `the valley at dusk with ${A} small beside ${G}`, actionEn: `${A} settles down beside the water as the light fades`, actingBeatEn: `${A}'s whole body relaxes into rest`, gazeEn: 'looking out at the horizon', sfxEn: 'soft lapping water and a long contented breath', endStateEn: `${A} resting beside ${G} in the fading light` }),
  ];
}

function genericTemplate(ctx: FallbackCtx): TemplateShot[] {
  const H = ctx.H;
  const B = ctx.B;
  const P = ctx.prop;
  const act = ctx.act;
  const soft = ctx.env.softSpotEn;
  const ground = ctx.env.groundEn;
  const fxSmall = act.fxSmallEn || `a puff of ${ground} kicking up`;
  const fxBig = act.fxBigEn || `a long arc of ${ground} spraying behind`;
  const detail = act.detailEn.replace('{limbs}', `${H}'s ${ctx.limbs}`);
  const mishap = act.mishapEn.replace('{soft}', soft);
  const shots: TemplateShot[] = [
    mkShot(ctx, 1, { titleVi: 'Đứng trước thử thách', beat: 'setup', shotSize: 'EWS', cameraMoveEn: 'slow push in', startStateEn: `${H} stands small at the edge of ${ctx.env.shortEn}, holding ${P}`, actionEn: `${H} takes a deep breath and steps forward`, actingBeatEn: `${H}'s posture straightens with nervous resolve`, gazeEn: 'looking out at the open ground ahead', vocalEn: 'a small nervous gulp', sfxEn: 'soft footsteps' }),
    mkShot(ctx, 1, { titleVi: 'Hít một hơi thật sâu', beat: 'setup', shotSize: 'CU', startStateEn: `${H} peeking over ${P}, eyes wide with nervous excitement`, actionEn: `${H} bites a lip, then breaks into an eager grin`, actingBeatEn: 'worry melts into eager determination', gazeEn: 'looking at the challenge ahead', dialogue: say(ctx.hSpeaks, 'char1', 'Okay. I can do this.', 'Được rồi. Mình làm được mà.'), vocalEn: 'an excited little chirp', sfxEn: 'a nervous gulp' }),
    mkShot(ctx, 3, { titleVi: 'Siết chặt', beat: 'inciting', shotSize: 'INSERT', startStateEn: `close detail of ${detail}`, actionEn: `${H}'s ${ctx.limbs} tighten their grip, ready to go`, actingBeatEn: `${H}'s grip trembles, then steadies`, sfxEn: 'a soft creak' }),
    mkShot(ctx, 1, { titleVi: 'Cú bắt đầu', beat: 'inciting', shotSize: 'MS', cameraMoveEn: 'handheld follow', startStateEn: `${H} poised and ready with ${P}`, actionEn: `${H} ${act.tryEn}`, actingBeatEn: `${H}'s eyes squeeze shut, then pop open in surprise`, gazeEn: 'staring straight ahead', vocalEn: 'a startled gasp', sfxEn: act.sfxEn }),
    mkShot(ctx, 2, { titleVi: 'Chao đảo', beat: 'escalation', shotSize: 'WS', cameraMoveEn: 'gentle pan right', startStateEn: `${H} small in the middle of ${ctx.env.shortEn}, moving fast`, actionEn: `${H} ${act.wobbleEn}`, actingBeatEn: 'panic flashes across the face, mouth wide open', gazeEn: 'eyes darting around', vocalEn: 'a wobbly squeal', sfxEn: act.sfxEn, fxLevel: 1, fxEn: fxSmall }),
    mkShot(ctx, 1, { titleVi: 'Lấy lại thăng bằng', beat: 'escalation', shotSize: 'MCU', cameraMoveEn: 'handheld follow', startStateEn: `${H} with cheeks puffed and arms out for balance`, actionEn: `${H} steadies and finds the balance`, actingBeatEn: 'panic gives way to a surprised, delighted smile', gazeEn: 'looking at the path ahead', dialogue: say(ctx.hSpeaks, 'char1', 'Whoa, whoa, whoa!', 'Ối, ối, ối!'), vocalEn: 'a delighted squeak', sfxEn: act.sfxEn }),
    ctx.hasB
      ? mkShot(ctx, 2, { titleVi: 'Bạn cổ vũ', beat: 'escalation', shotSize: 'OTS', cameraMoveEn: 'static', characters: ['char1', 'char2'], startStateEn: `${B} watching from the side as ${H} passes by with ${P}`, actionEn: `${B} claps and cheers as ${H} goes past`, actingBeatEn: `${B}'s worried face breaks into a proud grin`, gazeEn: `${B} watches ${H}`, dialogue: say(ctx.bSpeaks, 'char2', 'Look at you go!', 'Cậu làm được rồi kìa!'), vocalEn: 'a happy cheer', sfxEn: act.sfxEn })
      : mkShot(ctx, 2, { titleVi: 'Bay bổng', beat: 'escalation', shotSize: 'MS', cameraMoveEn: 'handheld follow', startStateEn: `${H} gaining confidence with ${P}`, actionEn: `${H} ${act.glideEn}`, actingBeatEn: 'a proud grin spreads across the face', gazeEn: 'looking ahead with bright eyes', sfxEn: act.sfxEn }),
    mkShot(ctx, 3, { titleVi: 'Niềm vui vỡ òa', beat: 'escalation', shotSize: 'CU', startStateEn: `${H}'s face beaming with pride`, actionEn: `${H} lets out a happy laugh mid-motion`, actingBeatEn: 'pride turns into giddy joy', gazeEn: 'eyes squinting with joy', dialogue: say(ctx.hSpeaks, 'char1', "I'm doing it!", 'Mình làm được rồi!'), vocalEn: 'a happy trill', sfxEn: 'rushing wind' }),
    mkShot(ctx, 2, { titleVi: 'Ôi thôi!', beat: 'reversal', shotSize: 'ECU', startStateEn: `${H}'s eyes going wide at something ahead`, actionEn: `${H} spots the trouble too late and gasps`, actingBeatEn: 'joy snaps into wide-eyed alarm', gazeEn: 'staring at the trouble ahead', dialogue: say(ctx.hSpeaks, 'char1', 'Uh-oh.', 'Ôi thôi.'), vocalEn: 'a sharp gasp', sfxEn: 'a sudden scrape' }),
    mkShot(ctx, 1, { titleVi: 'Cú ngã nhào', beat: 'reversal', shotSize: 'WS', startStateEn: `${H} moving fast toward ${soft}`, actionEn: `${H} ${mishap}`, actingBeatEn: 'shock freezes on the face mid-fall', gazeEn: 'eyes squeezed shut', vocalEn: 'a surprised yelp', sfxEn: 'a clatter, a thud and rustling', fxLevel: 1, fxEn: fxSmall }),
    mkShot(ctx, 1, { titleVi: 'Ngơ ngác', beat: 'climax', shotSize: 'CU', startStateEn: `${H}'s head popping up out of ${soft}, covered in ${ground}, dazed`, actionEn: `${H} blinks and shakes off the ${ground}`, actingBeatEn: 'dazed shock wobbles into a crooked smile', gazeEn: 'looking down at the mess', vocalEn: 'a dazed little hiccup', sfxEn: 'rustling and a soft pop' }),
    ctx.hasB
      ? mkShot(ctx, 1, { titleVi: 'Cùng bật cười', beat: 'climax', shotSize: 'MCU', cameraMoveEn: 'slow push in', characters: ['char1', 'char2'], startStateEn: `${H} sitting in ${soft} while ${B} leans in, both trying to keep a straight face`, actionEn: `${H} bursts out laughing and ${B} joins in`, actingBeatEn: 'a giggle grows into a full belly laugh', gazeEn: `${H} looks up at ${B}`, dialogue: say(ctx.hSpeaks, 'char1', 'Again! One more time!', 'Lần nữa! Thêm lần nữa!'), vocalEn: 'a burst of happy laughter', sfxEn: 'rustling leaves' })
      : mkShot(ctx, 1, { titleVi: 'Bật cười', beat: 'climax', shotSize: 'MCU', cameraMoveEn: 'slow push in', startStateEn: `${H} sitting in ${soft}, shoulders starting to shake`, actionEn: `${H} bursts out laughing, rolling back in the mess`, actingBeatEn: 'a giggle grows into a full belly laugh', gazeEn: 'eyes squeezed shut with laughter', dialogue: say(ctx.hSpeaks, 'char1', 'Again! One more time!', 'Lần nữa! Thêm lần nữa!'), vocalEn: 'a burst of happy chittering laughter', sfxEn: 'rustling leaves' }),
    mkShot(ctx, 2, { titleVi: 'Thử lại lần nữa', beat: 'climax', shotSize: 'MS', cameraMoveEn: 'handheld follow', startStateEn: `${H} back on track with ${P}, focused and determined`, actionEn: `${H} ${act.triumphEn}`, actingBeatEn: 'focus breaks into a triumphant grin', gazeEn: 'looking straight at the goal', vocalEn: 'a joyful whoop', sfxEn: act.sfxEn, fxLevel: 2, fxEn: fxBig }),
    ctx.hasB
      ? mkShot(ctx, 3, { titleVi: 'Đập tay ăn mừng', beat: 'resolution', shotSize: 'OTS', characters: ['char1', 'char2'], startStateEn: `${B} waiting with a raised hand as ${H} walks up, scuffed and proud`, actionEn: `${B} gives ${H} a big high five`, actingBeatEn: `${B}'s happy grin softens into a proud, warm smile`, gazeEn: `${B} beams at ${H}`, dialogue: say(ctx.bSpeaks, 'char2', 'You were amazing!', 'Cậu giỏi lắm!'), vocalEn: 'a happy laugh', sfxEn: 'a bright slap of a high five' })
      : mkShot(ctx, 3, { titleVi: 'Phủi bụi đứng dậy', beat: 'resolution', shotSize: 'MS', startStateEn: `${H} standing tall with ${P}, a little scuffed and proud`, actionEn: `${H} dusts off and hugs ${P}`, actingBeatEn: 'tired joy settles into a proud, contented smile', gazeEn: 'looking back at the path behind', sfxEn: 'a soft pat' }),
    mkShot(ctx, 1, { titleVi: 'Ngày tuyệt nhất', beat: 'resolution', shotSize: 'CU', cameraMoveEn: 'slow push in', startStateEn: `${H}'s happy, scuffed face in the warm light`, actionEn: `${H} sniffs, rubs the nose and grins toward the horizon`, actingBeatEn: 'the grin softens into a contented sigh', gazeEn: 'looking out at the horizon', dialogue: say(ctx.hSpeaks, 'char1', 'Best day ever.', 'Ngày tuyệt nhất luôn.'), vocalEn: 'a happy little sigh', sfxEn: 'a soft breath' }),
    mkShot(ctx, 2, { titleVi: 'Hành trình tiếp tục', beat: 'resolution', shotSize: 'EWS', cameraMoveEn: 'slow pull back', startStateEn: `${H} small in ${ctx.env.shortEn} as the light turns golden`, actionEn: `${H} heads off again with ${P}, ready for another go`, actingBeatEn: `${H}'s steps gain a happy bounce`, gazeEn: 'looking at the way ahead', sfxEn: act.sfxEn }),
  ];
  return shots;
}

/** Khuôn hồi hộp / kinh dị: trốn -> tiếng động -> lắng nghe -> tiến lại gần -> giật mình -> che chở -> nhẹ nhõm. */
function tensionTemplate(ctx: FallbackCtx): TemplateShot[] {
  const H = ctx.H;
  const B = ctx.B;
  const two = ctx.hasB;
  const env = ctx.env;
  const short = env.shortEn;
  const hide = env.hideSpotEn || `behind ${env.softSpotEn}`;
  const door = env.goalEn;
  const threat = env.threatEn || 'a strange sound in the dark';
  const both = two ? `${H} and ${B}` : H;
  const pair: PremiumCharId[] = two ? ['char1', 'char2'] : ['char1'];
  return [
    mkShot(ctx, 1, { titleVi: 'Bước vào bóng tối', beat: 'setup', shotSize: 'EWS', cameraMoveEn: 'slow push in', characters: pair, startStateEn: `${both} small at the edge of ${short}, huddled close together`, actionEn: `${both} tiptoe deeper into ${short}`, actingBeatEn: `${H}'s brave face tightens with worry`, gazeEn: 'looking into the darkness ahead', vocalEn: 'a nervous little breath', sfxEn: 'soft careful footsteps' }),
    two
      ? mkShot(ctx, 1, { titleVi: 'Chỗ trốn', beat: 'setup', shotSize: 'MCU', characters: ['char1', 'char2'], startStateEn: `${H} crouched ${hide}, clutching ${B}'s sleeve`, actionEn: `${H} tugs ${B} down out of sight ${hide}`, actingBeatEn: 'worry tightens into wide-eyed alertness', gazeEn: 'eyes darting toward the far end of the room', dialogue: say(ctx.hSpeaks, 'char1', `${B}, hide here. Quick!`, `${ctx.BVi}, trốn vào đây. Nhanh lên!`), vocalEn: 'a tiny shaky breath', sfxEn: 'cloth rustling and a soft creak' })
      : mkShot(ctx, 1, { titleVi: 'Chỗ trốn', beat: 'setup', shotSize: 'MCU', startStateEn: `${H} crouched ${hide}, knees pulled in`, actionEn: `${H} ducks low and pulls into the shadows ${hide}`, actingBeatEn: 'worry tightens into wide-eyed alertness', gazeEn: 'eyes darting toward the far end of the room', dialogue: say(ctx.hSpeaks, 'char1', 'Stay quiet. Stay very quiet.', 'Im lặng nào. Thật im lặng.'), vocalEn: 'a tiny shaky breath', sfxEn: 'cloth rustling and a soft creak' }),
    mkShot(ctx, 1, { titleVi: 'Tiếng động lạ', beat: 'inciting', shotSize: 'INSERT', startStateEn: `close detail of ${H}'s fingers gripping the edge of the hiding spot`, actionEn: `${H}'s fingers tighten and freeze as ${threat} echoes`, actingBeatEn: `${H}'s fingers tremble, then go completely still`, sfxEn: `${threat} echoing in the quiet` }),
    mkShot(ctx, 2, { titleVi: 'Nín thở', beat: 'inciting', shotSize: 'ECU', startStateEn: `${H}'s eyes wide open in the dark`, actionEn: `${H}'s eyes dart toward the sound and lock there`, actingBeatEn: 'alertness snaps into wide-eyed fear', gazeEn: `eyes fixed on ${door}`, vocalEn: 'a tiny sharp gasp', sfxEn: 'a faint echo fading away' }),
    two
      ? mkShot(ctx, 1, { titleVi: 'Có nghe thấy không?', beat: 'escalation', shotSize: 'OTS', characters: ['char2', 'char1'], startStateEn: `${H} leaning close to ${B} in the dark, whispering`, actionEn: `${H} leans close and whispers to ${B}`, actingBeatEn: `${H}'s whisper trembles as fear creeps in`, gazeEn: `${H} looks up at ${B}`, dialogue: say(ctx.hSpeaks, 'char1', `${B}, did you hear that?`, `${ctx.BVi} ơi, có nghe thấy không?`), vocalEn: 'a shaky whisper', sfxEn: 'a held breath' })
      : mkShot(ctx, 1, { titleVi: 'Ai đó?', beat: 'escalation', shotSize: 'MS', startStateEn: `${H} peeking out ${hide}`, actionEn: `${H} leans out slowly and calls into the dark`, actingBeatEn: 'fear wobbles into shaky courage', gazeEn: `looking toward ${door}`, dialogue: say(ctx.hSpeaks, 'char1', 'Hello? Is someone there?', 'Ai đó? Có ai ở đó à?'), vocalEn: 'a shaky whisper', sfxEn: 'a held breath' }),
    two
      ? mkShot(ctx, 2, { titleVi: 'Lắng nghe', beat: 'escalation', shotSize: 'CU', characters: ['char2'], startStateEn: `${B}'s face turned toward the sound, listening hard`, actionEn: `${B} tilts an ear toward ${door} and listens`, actingBeatEn: 'calm concern hardens into quiet, steely focus', gazeEn: `eyes fixed on ${door}`, dialogue: say(ctx.bSpeaks, 'char2', 'Stay behind me, little one.', 'Ở sau lưng ta nhé.'), vocalEn: 'a slow steadying breath', sfxEn: 'a faint scratching sound' })
      : mkShot(ctx, 2, { titleVi: 'Lắng nghe', beat: 'escalation', shotSize: 'CU', startStateEn: `${H}'s face turned toward the sound, listening hard`, actionEn: `${H} tilts an ear toward ${door} and listens`, actingBeatEn: 'fear hardens into quiet, stubborn focus', gazeEn: `eyes fixed on ${door}`, vocalEn: 'a slow steadying breath', sfxEn: 'a faint scratching sound' }),
    mkShot(ctx, 1, { titleVi: 'Tiến lại gần', beat: 'escalation', shotSize: 'MS', cameraMoveEn: 'handheld follow', characters: two ? ['char2', 'char1'] : ['char1'], startStateEn: two ? `${B} stepping slowly toward ${door} with ${H} close behind` : `${H} stepping slowly toward ${door}`, actionEn: two ? `${B} creeps toward ${door}, ${H} clinging to one hand` : `${H} creeps toward ${door} one careful step at a time`, actingBeatEn: `${H}'s shoulders hunch tighter with every creak`, gazeEn: `looking at ${door}`, sfxEn: 'creaking floorboards and slow footsteps' }),
    mkShot(ctx, 3, { titleVi: 'Bàn tay chạm cửa', beat: 'escalation', shotSize: 'INSERT', characters: [two ? 'char2' : 'char1'], startStateEn: `close detail of ${two ? B : H}'s hand reaching for the old door handle`, actionEn: 'the hand closes slowly around the handle and turns it', actingBeatEn: 'the fingers tremble, then steady', sfxEn: 'a rusty latch clicking' }),
    mkShot(ctx, 1, { titleVi: 'Cánh cửa bật mở', beat: 'reversal', shotSize: 'WS', characters: pair, startStateEn: `${both} in front of ${door} as it swings wide open`, actionEn: `the door swings open and a startled black cat leaps out past ${both}`, actingBeatEn: `${H}'s whole body jolts in shock`, gazeEn: 'eyes squeezed shut', vocalEn: 'a high startled shriek', sfxEn: 'a door banging open and a loud yowl', fxLevel: 1, fxEn: 'a puff of dust from the doorway' }),
    mkShot(ctx, 2, { titleVi: 'Hét lên', beat: 'reversal', shotSize: 'ECU', startStateEn: `${H}'s face frozen mid-scream, eyes squeezed shut`, actionEn: `${H} screams with both eyes squeezed shut`, actingBeatEn: 'shock bursts into a full scream', vocalEn: 'a piercing scream', sfxEn: 'a scream echoing down the hall' }),
    two
      ? mkShot(ctx, 1, { titleVi: 'Che chở', beat: 'climax', shotSize: 'MCU', cameraMoveEn: 'slow push in', characters: ['char2', 'char1'], startStateEn: `${B} pulling ${H} close with both arms`, actionEn: `${B} wraps both arms around ${H} and turns toward the doorway`, actingBeatEn: `${B}'s face hardens into fierce protectiveness`, gazeEn: 'glaring at the doorway', dialogue: say(ctx.bSpeaks, 'char2', 'I have you. Stay close.', 'Có ta đây. Ở gần ta nhé.'), vocalEn: 'a firm protective hush', sfxEn: 'heavy breathing' })
      : mkShot(ctx, 1, { titleVi: 'Can đảm', beat: 'climax', shotSize: 'MCU', cameraMoveEn: 'slow push in', startStateEn: `${H} trembling, fists clenched`, actionEn: `${H} opens both eyes and takes one brave step forward`, actingBeatEn: 'terror hardens into trembling courage', gazeEn: 'glaring at the doorway', dialogue: say(ctx.hSpeaks, 'char1', 'Okay. I am brave. I am brave.', 'Được rồi. Mình dũng cảm mà.'), vocalEn: 'a shaky determined breath', sfxEn: 'heavy breathing' }),
    mkShot(ctx, 1, { titleVi: 'Chỉ là một chú mèo', beat: 'climax', shotSize: 'CU', startStateEn: two ? `${H} peeking out from behind ${B}'s arm` : `${H} peeking through spread fingers`, actionEn: `${H} opens one eye and peeks at the doorway`, actingBeatEn: 'terror melts into stunned surprise', gazeEn: 'looking at the doorway', dialogue: say(ctx.hSpeaks, 'char1', 'Wait, it is just a cat?', 'Khoan đã, chỉ là một chú mèo?'), vocalEn: 'a small surprised squeak', sfxEn: 'a soft meow' }),
    mkShot(ctx, 1, { titleVi: 'Bật cười', beat: 'resolution', shotSize: 'MCU', cameraMoveEn: 'slow push in', characters: pair, startStateEn: two ? `${H} and ${B} sitting on the floor, hearts still racing` : `${H} sitting on the floor, heart still racing`, actionEn: two ? `${H} giggles and ${B} joins in, laughing with relief` : `${H} giggles, then laughs with relief`, actingBeatEn: 'fear melts into shaky, relieved laughter', gazeEn: two ? `${H} looks up at ${B}` : 'looking at the doorway', dialogue: two ? say(ctx.bSpeaks, 'char2', 'You were very brave tonight.', 'Tối nay con dũng cảm lắm.') : say(ctx.hSpeaks, 'char1', 'Silly cat. You scared me!', 'Mèo ngốc. Làm mình sợ quá!'), vocalEn: 'a burst of relieved laughter', sfxEn: 'a soft purr' }),
    mkShot(ctx, 2, { titleVi: 'Bình yên', beat: 'resolution', shotSize: 'CU', startStateEn: `${H}'s face, calm again in the soft light`, actionEn: two ? `${H} leans into ${B}'s shoulder with a sleepy smile` : `${H} lets out a long breath and smiles`, actingBeatEn: 'relief settles into a sleepy, contented smile', gazeEn: 'eyes half closed', vocalEn: 'a small contented sigh', sfxEn: 'a soft purr' }),
    mkShot(ctx, 2, { titleVi: 'Màn đêm yên tĩnh', beat: 'resolution', shotSize: 'EWS', cameraMoveEn: 'slow pull back', characters: pair, startStateEn: `${short} quiet again, with ${both} small in the soft light`, actionEn: `${both} settle down together as the house falls quiet`, actingBeatEn: `${H}'s whole body relaxes into rest`, gazeEn: 'looking at the sleeping cat', sfxEn: 'a soft purr and a ticking clock' }),
  ];
}

/** Chọn N cảnh theo độ ưu tiên (giữ thứ tự kể chuyện); N lớn hơn khuôn thì nhân bản nhịp leo thang trước cú đảo chiều. */
function selectTemplateShots(template: TemplateShot[], n: number): Array<Omit<PremiumShot, 'shotNumber'>> {
  const list = template.map((t, i) => ({ ...t, order: i }));
  if (n >= list.length) {
    const esc = list.filter((t) => t.shot.beat === 'escalation');
    const reversalAt = list.findIndex((t) => t.shot.beat === 'reversal');
    let k = 0;
    while (list.length < n && esc.length) {
      const src = esc[k % esc.length];
      const insertAt = reversalAt >= 0 ? reversalAt + k : list.length;
      list.splice(insertAt, 0, { ...src, shot: { ...src.shot, characters: [...src.shot.characters] } });
      k++;
    }
    return list.slice(0, n).map((t) => t.shot);
  }
  const chosen = [...list].sort((a, b) => a.prio - b.prio || a.order - b.order).slice(0, n);
  return chosen.sort((a, b) => a.order - b.order).map((t) => t.shot);
}

function limbsFor(species: string): string {
  const s = String(species || '').toLowerCase();
  if (/saur|rex|dino|dragon|lizard|croc|raptor|tops/.test(s)) return 'claws';
  if (/bird|owl|sparrow|parrot|duck|chick/.test(s)) return 'wings';
  if (/girl|boy|man|woman|human|person|child|robot|grand|monkey|kid/.test(s)) return 'hands';
  if (/elephant/.test(s)) return 'feet';
  return 'paws';
}

function envProfileFromEnvironment(env: PremiumEnvironment | null, script: string, isDino: boolean): EnvProfile {
  const known = env ? [...ENV_LIBRARY, PREHISTORIC_ENV, DEFAULT_ENV].find((e) => e.lookEn === env.lookEn) : undefined;
  const fromEnv = known || (env ? ENV_LIBRARY.find((e) => e.re.test(env.lookEn || '')) : undefined);
  const base = fromEnv || detectEnv(script, isDino);
  if (!env) return base;
  const out = { ...base, shortEn: `the ${stripArticle(envPhrase(env, 4))}` };
  return NIGHT_TOD_RE.test(env.timeOfDayEn || '') ? applyNight(out, 'night') : out;
}

function buildTemplateShots(params: {
  characters: PremiumCharacter[];
  environment: PremiumEnvironment | null;
  script: string;
  shotCount: number;
  isDino: boolean;
}): PremiumShot[] {
  const c1 = params.characters[0];
  const c2 = params.characters[1];
  const act = detectActivity(params.script);
  const env = envProfileFromEnvironment(params.environment, params.script, params.isDino);
  const ctx: FallbackCtx = {
    H: c1?.displayNameEn || 'Pip',
    B: c2?.displayNameEn || c1?.displayNameEn || 'Pip',
    HVi: c1?.displayNameVi || c1?.displayNameEn || 'Pip',
    BVi: c2?.displayNameVi || c2?.displayNameEn || c1?.displayNameVi || 'Pip',
    hasB: !!c2,
    hSpeaks: !!c1?.canSpeak,
    bSpeaks: !!c2?.canSpeak,
    limbs: limbsFor(c1?.species || ''),
    prop: act.propEn,
    act,
    env,
  };
  const useDino = params.isDino && !!c2;
  const template = useDino ? dinoTemplate(ctx) : HORROR_RE.test(params.script) ? tensionTemplate(ctx) : genericTemplate(ctx);
  const picked = selectTemplateShots(template, params.shotCount);
  return picked.map((s, i) => ({ ...s, shotNumber: i + 1 }));
}

/**
 * Kịch bản dự phòng tất định khi LLM không khả dụng: chạy được với mọi kịch bản; nếu kịch bản nhắc tới khủng long
 * thì tạo hai chú khủng long cách điệu giàu biểu cảm và một câu chuyện sinh tồn có lòng khoan dung ở cao trào.
 */
export function buildFallbackStoryBible(params: { script: string; shotCount: number; style: PremiumStyleKey }): PremiumStoryBible {
  const script = String(params?.script || '');
  const style = coerceStyle(params?.style);
  const shotCount = Math.max(1, Math.min(40, Math.round(Number(params?.shotCount) || 12)));
  const isDino = DINO_RE.test(script);
  const envProfile = detectEnv(script, isDino);
  const placeVi = extractPlaceVi(script);
  const envNameVi = placeVi || envProfile.labelVi;

  let characters: PremiumCharacter[];
  let movieTitle: string;
  let loglineVi: string;

  if (isDino) {
    const pair = script.match(
      /:\s*([^.:;]+?)\s+(?:và|vs\.?|versus|and|đấu với|đối đầu với|đối đầu)\s+([^.:;]+?)\s*(?:[.;!?]|$)/iu
    );
    // Tên dừng trước động từ / mệnh đề phía sau: "Thủy quái lôi đình tranh giành nguồn nước" -> "Thủy quái lôi đình".
    const cutName = (t: string) =>
      squash(
        t.replace(
          /\s+(?:tranh giành|giành giật|giành|tranh|chiến đấu|đánh nhau|quyết đấu|giao chiến|đối đầu|đụng độ|săn|để|vì|trong|tại|ở|khi|nhằm|fight(?:ing|s)?|battl(?:e|es|ing)|for|over|in|at)(?:\s.*)?$/iu,
          ''
        )
      );
    let nameVi1 = pair && countWords(cutName(pair[1])) <= 5 ? titleCaseVi(cutName(pair[1])) : '';
    let nameVi2 = pair && countWords(cutName(pair[2])) <= 5 ? titleCaseVi(cutName(pair[2])) : '';
    const waterRe = /thủy|nước|water|spino|sông|biển|đầm|sóng/i;
    const trikeRe = /triceratops|ba sừng|tam giác/i;
    const k2: 'spino' | 'trike' = trikeRe.test(script) && !waterRe.test(script) ? 'trike' : 'spino';
    if (nameVi1 && waterRe.test(nameVi1) && !waterRe.test(nameVi2)) {
      [nameVi1, nameVi2] = [nameVi2, nameVi1];
    }
    const d1 = DINO_LIBRARY.trex;
    const d2 = DINO_LIBRARY[k2];
    const en1 = nameVi1 && countWords(nameVi1) === 1 ? cleanName(nameVi1) : d1.defaultNameEn;
    const en2 = nameVi2 && countWords(nameVi2) === 1 ? cleanName(nameVi2) : d2.defaultNameEn;
    nameVi1 = nameVi1 || en1;
    nameVi2 = nameVi2 || en2;
    characters = [
      { id: 'char1', safeId: toSafeId(nameVi1, 'DINO_ONE'), displayNameVi: nameVi1, displayNameEn: en1, species: d1.speciesEn, lookEn: d1.lookEn, voiceEn: d1.voiceEn, canSpeak: false, personalityVi: buildPersonalityVi(d1.statsVi, d1.temperVi, d1.codes) },
      { id: 'char2', safeId: toSafeId(nameVi2, 'DINO_TWO'), displayNameVi: nameVi2, displayNameEn: en2, species: d2.speciesEn, lookEn: d2.lookEn, voiceEn: d2.voiceEn, canSpeak: false, personalityVi: buildPersonalityVi(d2.statsVi, d2.temperVi, d2.codes) },
    ];
    if (characters[1].safeId === characters[0].safeId) characters[1].safeId = `${characters[1].safeId}_2`;
    movieTitle = `${nameVi1} và ${nameVi2}`;
    loglineVi = `Giữa ${envNameVi}, ${nameVi1} phải giữ lấy nguồn nước cuối cùng trước ${nameVi2} đang đói khát — và ở khoảnh khắc chiến thắng, nhận ra sức mạnh thật sự nằm ở lòng khoan dung.`;
  } else {
    const cast = detectCast(script);
    const act = detectActivity(script);
    characters = cast.map((m, i) => {
      const id: PremiumCharId = i === 0 ? 'char1' : 'char2';
      const temperVi =
        i === 0
          ? 'Tò mò, lạc quan, hơi vụng về nhưng bền bỉ; gặp rắc rối là bật cười rồi thử lại.'
          : 'Điềm tĩnh, hay cổ vũ, luôn ở bên cạnh bạn mình những lúc khó khăn.';
      const codes: Array<[string, string]> =
        i === 0
          ? [
              [`ACTION_${act.code}`, act.actionVi],
              ['SKILL_1_BALANCE_RECOVERY', 'Dang tay giữ thăng bằng, xoay người lấy lại tư thế trong tích tắc.'],
              ['SKILL_2_BIG_LAUGH', 'Bật cười giòn tan biến cú ngã thành niềm vui và đứng dậy thử lại.'],
            ]
          : [
              ['ACTION_CHEER', 'Vỗ tay, nhảy cẫng lên cổ vũ bạn.'],
              ['SKILL_1_HELPING_HAND', 'Chìa tay kéo bạn đứng dậy sau cú ngã.'],
              ['SKILL_2_HIGH_FIVE', 'Đập tay ăn mừng thật kêu.'],
            ];
      return {
        id,
        safeId: toSafeId(m.nameVi, id === 'char1' ? 'CHARACTER_ONE' : 'CHARACTER_TWO'),
        displayNameVi: m.nameVi,
        displayNameEn: m.nameEn,
        species: m.profile.speciesEn,
        lookEn: m.profile.lookEn,
        voiceEn: m.profile.voiceEn,
        canSpeak: m.profile.canSpeak,
        personalityVi: buildPersonalityVi(m.profile.statsVi, temperVi, codes),
      };
    });
    if (characters[1] && characters[1].safeId === characters[0].safeId) characters[1].safeId = `${characters[1].safeId}_2`;
    if (HORROR_RE.test(script)) {
      const who = characters[1] ? `${characters[0].displayNameVi} và ${characters[1].displayNameVi}` : characters[0].displayNameVi;
      movieTitle = `${characters[0].displayNameVi} và tiếng động trong ${NIGHT_RE.test(script) ? 'đêm' : 'bóng tối'}`;
      loglineVi = `${who} trốn trong ${envNameVi.toLowerCase()}; một tiếng động lạ buộc họ đối mặt nỗi sợ — để rồi nhận ra điều đáng sợ nhất chỉ là trí tưởng tượng, và sự can đảm đến từ việc ở bên nhau.`;
    } else {
      movieTitle = `${characters[0].displayNameVi} và ${act.titleVi.charAt(0).toLowerCase()}${act.titleVi.slice(1)}`;
      loglineVi = `${characters[0].displayNameVi} lần đầu ${act.verbVi} ở ${envNameVi.toLowerCase()}, vấp một cú ngã thật đau nhưng bật cười, đứng dậy và thử lại cho đến khi làm được.`;
    }
  }

  let envSafe = toSafeId(envNameVi, 'STAGE_MAIN');
  if (characters.some((c) => c.safeId === envSafe)) envSafe = `STAGE_${envSafe}`;
  const environment: PremiumEnvironment = {
    safeId: envSafe,
    displayNameVi: titleCaseVi(envNameVi),
    lookEn: envProfile.lookEn,
    timeOfDayEn: envProfile.timeOfDayEn,
    lightingEn: envProfile.lightingEn,
    paletteEn: envProfile.paletteEn,
  };

  const planned = planCoverage(buildTemplateShots({ characters, environment, script, shotCount, isDino }), { characters });
  const shots = applyRealRenderRules(planned, characters, environment);
  return { movieTitle, loglineVi, style, characters, environment, shots };
}

// ───────────────────────────── Normaliser (LLM -> PremiumStoryBible) ─────────────────────────────

function extractJsonText(text: string): string | null {
  const t = String(text || '')
    .replace(/```(?:json|JSON)?/g, '')
    .trim();
  const start = t.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return t.slice(start, i + 1);
    }
  }
  return null;
}

function parseJsonLoose(text: string): any {
  const body = extractJsonText(text);
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    try {
      return JSON.parse(body.replace(/,\s*([}\]])/g, '$1'));
    } catch {
      return null;
    }
  }
}

function coerceJsonObject(raw: any): any {
  if (!raw) return null;
  if (typeof raw === 'string') return parseJsonLoose(raw);
  if (typeof raw === 'object') {
    if (!raw.shots && !raw.characters && typeof raw.text === 'string') return parseJsonLoose(raw.text);
    return raw;
  }
  return null;
}

function unwrapBible(obj: any, depth = 0): any {
  if (!obj || typeof obj !== 'object' || depth > 3) return null;
  if (Array.isArray(obj.shots) || Array.isArray(obj.characters)) return obj;
  for (const k of ['bible', 'storyBible', 'premiumBible', 'data', 'result', 'output']) {
    const found = unwrapBible(obj[k], depth + 1);
    if (found) return found;
  }
  return null;
}

function coerceShotSize(v: any): PremiumShotSize | null {
  const s = asciiFold(str(v)).toUpperCase().replace(/[^A-Z]+/g, ' ').trim();
  if (!s) return null;
  const compact = s.replace(/ /g, '');
  if ((PREMIUM_SHOT_SIZES as string[]).includes(compact)) return compact as PremiumShotSize;
  if (/EXTREME (WIDE|LONG)|EXTREMELY WIDE|ESTABLISHING|VISTA/.test(s)) return 'EWS';
  if (/EXTREME CLOSE|MACRO EYE|ECU/.test(s)) return 'ECU';
  if (/OVER (THE )?SHOULDER|OTS|CONFRONTATION/.test(s)) return 'OTS';
  if (/MEDIUM CLOSE|MCU|CHEST/.test(s)) return 'MCU';
  if (/CLOSE|REACTION|KULESHOV|FACE/.test(s)) return 'CU';
  if (/INSERT|DETAIL|CUTAWAY/.test(s)) return 'INSERT';
  if (/POV|POINT OF VIEW|SUBJECTIVE/.test(s)) return 'POV';
  if (/WIDE|LONG|FULL|MASTER/.test(s)) return 'WS';
  if (/MEDIUM|MID|COWBOY|TWO SHOT|HERO|LOW ANGLE/.test(s)) return 'MS';
  return null;
}

function coerceBeat(v: any): PremiumBeat | null {
  const s = asciiFold(str(v)).toLowerCase();
  if (!s) return null;
  if ((PREMIUM_BEATS as string[]).includes(s)) return s as PremiumBeat;
  if (/setup|set up|intro|opening|exposition|establish/.test(s)) return 'setup';
  if (/incit|catalyst|trigger|call/.test(s)) return 'inciting';
  if (/escalat|rising|build|complication/.test(s)) return 'escalation';
  if (/revers|twist|midpoint|setback|low point|crisis/.test(s)) return 'reversal';
  if (/climax|showdown|confront|peak/.test(s)) return 'climax';
  if (/resol|ending|denouement|aftermath|epilog|outro/.test(s)) return 'resolution';
  return null;
}

function positionalBeat(i: number, n: number): PremiumBeat {
  if (n <= 1) return 'setup';
  if (i === 0) return 'setup';
  if (i === n - 1) return 'resolution';
  const f = i / (n - 1);
  if (f < 0.15) return 'setup';
  if (f < 0.27) return 'inciting';
  if (f < 0.55) return 'escalation';
  if (f < 0.7) return 'reversal';
  if (f < 0.9) return 'climax';
  return 'resolution';
}

function coerceDuration(v: any): 4 | 6 | 8 {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 8;
  if (n < 5) return 4;
  if (n < 7) return 6;
  return 8;
}

function coerceFxLevel(v: any): 0 | 1 | 2 {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n >= 2 ? 2 : 1;
}

export const ALLOWED_CAMERA_MOVES = ['static', 'slow push in', 'slow pull back', 'gentle pan left', 'gentle pan right', 'slow tilt up', 'handheld follow'];

/** Một chuyển động máy đơn giản trong danh sách cho phép; orbit / drone / crane / whip / 360 … -> static (gây trôi nhận diện). */
function cleanCameraMove(v: any): string {
  let m = cleanEn(v).toLowerCase();
  if (!m) return 'static';
  m = m.split(/\s*(?:,|;|\bthen\b|\band then\b|\bwhile\b)\s*/i)[0];
  m = m.replace(/^(the\s+)?camera\s+/i, '');
  if (/\b(?:orbit\w*|drone|crane|sweep\w*|whip\w*|360|spin\w*|aerial|fly\w*|swoop\w*|circl\w*|arc\w*|rotat\w*)\b/.test(m)) return 'static';
  if (/\b(?:static|locked|still|fixed|tripod)\b/.test(m)) return 'static';
  if (/\b(?:push(?:es|ing)?(?:\s+in)?|dolly(?:ing)?\s+in|zoom(?:s|ing)?\s+in|move(?:s)?\s+in|creep\w*\s+in)\b/.test(m)) return 'slow push in';
  if (/\b(?:pull(?:s|ing)?(?:\s+(?:back|out))?|dolly(?:ing)?\s+(?:out|back)|zoom(?:s|ing)?\s+out|back(?:s|ing)?\s+away)\b/.test(m)) return 'slow pull back';
  if (/\bpan\w*\b/.test(m)) return /\bleft\b/.test(m) ? 'gentle pan left' : 'gentle pan right';
  if (/\btilt\w*\b/.test(m)) return 'slow tilt up';
  if (/\b(?:handheld|hand-held|follow\w*|track\w*|steadicam|trailing)\b/.test(m)) return 'handheld follow';
  if (/\bdolly\b|\bzoom\b/.test(m)) return 'slow push in';
  return 'static';
}

function firstSentence(text: string): string {
  const s = squash(text);
  const m = s.match(/^(.+?[.!?])(\s|$)/);
  return m ? m[1] : s;
}

/** Chỉ giữ MỘT hiệu ứng lớn trong một đoạn văn. */
function limitEffects(text: string, max = 1): string {
  if (effectTerms(text).length <= max) return text;
  let seen = 0;
  return dropClauses(text, (c) => {
    const n = effectTerms(c).length;
    if (!n) return false;
    seen += n;
    return seen > max;
  });
}

const DEFAULT_SFX_EN = 'soft footsteps';
const NIGHT_TOD_RE = /\b(?:night|midnight|moonlit|moonlight|after dark|nighttime)\b/i;
const NIGHT_PALETTE_EN = 'deep blue-grey shadows with one warm candle-orange accent';

/** Một nguồn sáng hợp với giờ trong ngày (dùng khi mô tả ánh sáng của LLM bị loại vì chồng hiệu ứng / tím-cam-cyan). */
function lightingForTimeOfDay(tod: string, style: PremiumStyleKey): string {
  const t = String(tod || '').toLowerCase();
  if (NIGHT_TOD_RE.test(t)) return 'cool moonlight from one side';
  if (/dusk|sunset|golden|evening|twilight/.test(t)) return 'a low warm sun from one side';
  if (/dawn|sunrise|morning/.test(t)) return 'soft low morning sun from one side';
  return preset(style).defaultLightingEn;
}

function calmActionFor(s: PremiumShot, characters: PremiumCharacter[]): string {
  const name = characters.find((c) => c.id === s.characters[0])?.displayNameEn || 'The character';
  if (s.beat === 'setup') return `${name} takes in the scene with a slow, steady breath`;
  if (s.beat === 'resolution') return `${name} lets out a long breath and relaxes`;
  return `${name} braces and holds still, watching closely`;
}

/**
 * Ngân sách hiệu ứng theo nhịp áp cho MỌI trường văn bản của cảnh (không chỉ fxEn): setup/resolution 0 từ hiệu ứng trong
 * hành động / trạng thái đầu / SFX; các nhịp giữa tối đa 1 (fxEn đã giữ hiệu ứng thì các trường khác 0); climax giữ nguyên.
 */
function enforceEffectBudget(shots: PremiumShot[], characters: PremiumCharacter[]): PremiumShot[] {
  return shots.map((s0) => {
    const s = cloneShot(s0);
    if (s.beat === 'climax') return s;
    let budget = s.beat === 'setup' || s.beat === 'resolution' ? 0 : s.fxLevel > 0 && s.fxEn ? 0 : 1;
    const fit = (text: string, minWords: number, fallback: () => string): string => {
      const n = effectTerms(text).length;
      if (n <= budget) {
        budget -= n;
        return text;
      }
      const lim = squash(limitEffects(text, budget));
      if (usableDescription(lim, minWords) && effectTerms(lim).length <= budget) {
        budget -= effectTerms(lim).length;
        return lim;
      }
      return fallback();
    };
    const actionBefore = s.actionEn;
    s.actionEn = fit(s.actionEn, 3, () => calmActionFor(s, characters));
    // Hành động bị thay bằng hành động êm -> khung cuối cũ không còn khớp: để applyRealRenderRules suy ra lại.
    if (s.actionEn !== actionBefore && s.endStateEn) s.endStateEn = '';
    s.startStateEn = fit(s.startStateEn, 3, () => {
      const soft = softenEffects(s.startStateEn);
      return usableDescription(soft, 3) && !effectTerms(soft).length ? soft : s.actionEn;
    });
    s.sfxEn = fit(s.sfxEn, 1, () => DEFAULT_SFX_EN);
    return s;
  });
}

/**
 * Cổng chất lượng câu chuyện cho bible đã chuẩn hóa: chặn kiểu "montage hiệu ứng" (mọi cảnh cùng trạng thái đầu, diễn xuất
 * một từ, hiệu ứng khắp nơi, không có mở/kết). Pipeline dùng kết quả để hỏi lại Gemini một lần rồi mới dùng bản dự phòng.
 */
export function assessStoryBible(bible: PremiumStoryBible): { ok: boolean; issues: string[] } {
  const shots = Array.isArray(bible?.shots) ? bible.shots : [];
  const n = shots.length;
  const issues: string[] = [];
  if (!n) return { ok: false, issues: ['no shots'] };
  const norm = (t: string) => squash(String(t || '').toLowerCase()).replace(/[^a-z ]+/g, '');
  const distinctStarts = new Set(shots.map((s) => norm(s.startStateEn))).size / n;
  if (n >= 4 && distinctStarts < 0.7) {
    issues.push(`only ${Math.round(distinctStarts * 100)}% of shots have a distinct startStateEn (need at least 70%): every shot must begin from a different, specific first frame`);
  }
  const transitions = shots.filter((s) => countWords(s.actingBeatEn) >= 4 && ACTING_TRANSITION_RE.test(s.actingBeatEn)).length / n;
  if (transitions < 0.6) {
    issues.push(`only ${Math.round(transitions * 100)}% of actingBeatEn describe a visible change from one expression to another (need at least 60%), e.g. "worry melts into a proud grin"`);
  }
  const order = shots.map((s) => PREMIUM_BEATS.indexOf(s.beat));
  if (!order.every((v, i) => i === 0 || v >= order[i - 1])) issues.push('beats go backwards: keep setup -> inciting -> escalation -> reversal -> climax -> resolution order');
  const fxActions = shots.filter((s) => effectTerms(`${s.actionEn} ${s.startStateEn}`).length > 0).length / n;
  if (fxActions > 0.25) issues.push(`${Math.round(fxActions * 100)}% of shots put lava/lightning/explosions/sparks in the action or first frame (at most 25%): drive shots with character actions and reactions`);
  if (!shots.some((s) => s.beat === 'setup')) issues.push('no setup shot introducing the hero and what they want');
  if (!shots.some((s) => s.beat === 'resolution')) issues.push('no resolution shot showing how the hero changed');
  return { ok: issues.length === 0, issues };
}

/**
 * Kiểm tra / sửa toàn bộ bible do LLM trả về: ép kiểu enum, cắt số từ, mã safeId ASCII, bỏ ID/số đo/phủ định khỏi
 * trường tiếng Anh, ép luật phủ góc máy. Không bao giờ ném lỗi — hỏng nặng thì trả về buildFallbackStoryBible.
 */
export function normalizeStoryBible(
  raw: any,
  params: { script: string; shotCount: number; style: PremiumStyleKey }
): PremiumStoryBible {
  const script = String(params?.script || '');
  const style = coerceStyle(params?.style);
  const shotCount = Math.max(1, Math.min(40, Math.round(Number(params?.shotCount) || 12)));
  let fallback: PremiumStoryBible | null = null;
  const getFallback = (): PremiumStoryBible => (fallback ||= buildFallbackStoryBible({ script, shotCount, style }));

  try {
    const obj = unwrapBible(coerceJsonObject(raw));
    if (!obj) return getFallback();
    const rawChars: any[] = (
      Array.isArray(obj.characters) ? obj.characters : [obj.character, obj.secondaryCharacter]
    ).filter((c: any) => c && typeof c === 'object');
    if (!rawChars.length) return getFallback();
    const fb = getFallback();
    const isDino = DINO_RE.test(script) || rawChars.some((c) => DINO_RE.test(`${str(c.species)} ${str(c.lookEn)}`));

    // Bản đồ ID thô -> tên hiển thị để làm sạch văn bản tiếng Anh.
    const idMap = new Map<string, string>();
    const characters: PremiumCharacter[] = [];
    rawChars.slice(0, 2).forEach((rc, i) => {
      const id: PremiumCharId = i === 0 ? 'char1' : 'char2';
      const fbc = fb.characters[i] || fb.characters[0];
      const rawNameVi = str(rc.displayNameVi ?? rc.nameVi ?? rc.vietnameseName ?? rc.name);
      const rawNameEn = str(rc.displayNameEn ?? rc.nameEn ?? rc.englishName);
      const displayNameEn = cleanName(rawNameEn || rawNameVi) || fbc.displayNameEn;
      const displayNameVi = squash(rawNameVi.replace(/_/g, ' ')) || displayNameEn;
      let safeId = toSafeId(str(rc.safeId) || rawNameVi || displayNameEn, id === 'char1' ? 'CHARACTER_ONE' : 'CHARACTER_TWO');
      if (characters.some((c) => c.safeId === safeId)) safeId = `${safeId}_2`;
      for (const k of [str(rc.safeId), str(rc.name), rawNameVi, rawNameEn, safeId]) {
        const key = toSafeId(k, '');
        if (key) idMap.set(key, displayNameEn);
      }
      const species = clampWords(cleanEn(rc.species, idMap), 6) || fbc.species || 'character';
      let lookEn = clampWords(
        softenEffects(cleanEn(rc.lookEn ?? rc.look ?? rc.appearanceEn ?? rc.defaultVisualPromptEn ?? rc.visualEn, idMap)),
        40
      );
      lookEn = lcArticle(lookEn);
      const lookWords = new Set(lookEn.toLowerCase().split(/[^a-z-]+/).filter(Boolean));
      const speciesWords = species.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (!usableDescription(lookEn, 6)) {
        lookEn = `${withArticle(species)} with a friendly expressive face, big readable eyes and one bright signature colour accent`;
      } else if (speciesWords.length && !speciesWords.some((w) => lookWords.has(w) || lookWords.has(`${w}s`))) {
        lookEn = clampWords(`${withArticle(species)}, ${stripArticle(lookEn)}`, 40);
      }
      if (hasHueTrio(lookEn)) lookEn = stripPurple(lookEn);
      const canSpeak =
        typeof rc.canSpeak === 'boolean'
          ? rc.canSpeak
          : typeof rc.canSpeak === 'string'
          ? /^(true|yes|có|1)$/i.test(rc.canSpeak.trim())
          : !/saur|rex|dino|creature|beast|monster|kaiju|raptor|tops/i.test(species);
      const voiceEn =
        clampWords(cleanEn(rc.voiceEn ?? rc.voice, idMap), 14) ||
        (canSpeak ? 'a warm, expressive voice' : 'expressive growls and huffs');
      const personalityVi = ensurePersonalityVi(str(rc.personalityVi ?? rc.personality), {
        statsVi: `Tầm vóc và giải phẫu của ${displayNameVi} (${species}) theo bảng thiết kế 3 góc; ${lookEn}.`,
        temperVi: 'Giàu cảm xúc, biểu cảm rõ ràng, có một mong muốn mạnh mẽ dẫn dắt mọi hành động.',
        codes: [
          ['ACTION_SIGNATURE_MOVE', 'Động tác đặc trưng thể hiện tính cách.'],
          ['SKILL_1_POWER_MOVE', 'Đòn/kỹ năng mạnh nhất dùng ở cao trào.'],
          ['SKILL_2_EMOTION_BEAT', 'Phản ứng cảm xúc đặc trưng khi thất bại hoặc chiến thắng.'],
        ],
      });
      characters.push({ id, safeId, displayNameVi, displayNameEn, species, lookEn, voiceEn, canSpeak, personalityVi });
    });
    if (characters[1] && characters[1].displayNameEn === characters[0].displayNameEn) {
      characters[1].displayNameEn = `${characters[1].displayNameEn} Two`;
    }

    // Bối cảnh.
    const re = (obj.environment && typeof obj.environment === 'object' ? obj.environment : null) || obj.stage || {};
    const envNameVi = squash(str(re.displayNameVi ?? re.nameVi ?? re.name).replace(/_/g, ' ')) || fb.environment.displayNameVi;
    let envSafe = toSafeId(str(re.safeId) || envNameVi, 'STAGE_MAIN');
    if (characters.some((c) => c.safeId === envSafe)) envSafe = `STAGE_${envSafe}`;
    let envLook = clampWords(limitEffects(softenEffects(cleanEn(re.lookEn ?? re.look ?? re.cleanVisualPromptEn, idMap), true)), 35);
    if (!usableDescription(envLook, 5)) envLook = fb.environment.lookEn;
    // Giờ trong ngày của LLM quyết định ánh sáng dự phòng: không bao giờ ghép "night" với "mặt trời vàng thấp" của bản dự phòng.
    const llmTod = clampWords(stripEnd(cleanEn(re.timeOfDayEn ?? re.timeOfDay, idMap)), 6);
    const fallbackLight = () => (llmTod ? lightingForTimeOfDay(llmTod, style) : fb.environment.lightingEn);
    const fallbackPalette = () => (llmTod && NIGHT_TOD_RE.test(llmTod) ? NIGHT_PALETTE_EN : fb.environment.paletteEn);
    let lightingEn = clampWords(firstSentence(softenEffects(cleanEn(re.lightingEn ?? re.lighting, idMap))).replace(/[.!?]$/, ''), 16);
    if (countWords(lightingEn) < 3) lightingEn = fallbackLight();
    let paletteEn = clampWords(stripEnd(cleanEn(re.paletteEn ?? re.palette, idMap)), 14);
    if (countWords(paletteEn) < 2) paletteEn = fallbackPalette();
    if (hasHueTrio(`${envLook} ${lightingEn} ${paletteEn}`)) {
      envLook = stripPurple(envLook) || fb.environment.lookEn;
      lightingEn = stripPurple(lightingEn) || fallbackLight();
      paletteEn = stripPurple(paletteEn) || fallbackPalette();
    }
    if (countWords(lightingEn) < 3) lightingEn = fallbackLight();
    const environment: PremiumEnvironment = {
      safeId: envSafe,
      displayNameVi: envNameVi,
      lookEn: envLook,
      timeOfDayEn: llmTod || fb.environment.timeOfDayEn,
      lightingEn,
      paletteEn,
    };
    idMap.set(envSafe, `the ${stripArticle(envPhrase(environment, 4))}`);
    const envKey = toSafeId(str(re.safeId) || str(re.name), '');
    if (envKey) idMap.set(envKey, `the ${stripArticle(envPhrase(environment, 4))}`);

    // Cảnh quay.
    const alias = new Map<string, PremiumCharId>();
    for (const c of characters) {
      for (const k of [c.id, c.safeId, c.displayNameEn, c.displayNameVi]) {
        const key = toSafeId(k, '');
        if (key) alias.set(key, c.id);
      }
    }
    alias.set('CHAR1', 'char1');
    alias.set('CHAR_1', 'char1');
    alias.set('CHARACTER_1', 'char1');
    if (characters[1]) {
      alias.set('CHAR2', 'char2');
      alias.set('CHAR_2', 'char2');
      alias.set('CHARACTER_2', 'char2');
    }
    for (const [k, name] of idMap) {
      const c = characters.find((x) => x.displayNameEn === name);
      if (c && !alias.has(k)) alias.set(k, c.id);
    }
    const resolveId = (v: any): PremiumCharId | null => alias.get(toSafeId(str(v), '')) || null;

    const rawShots: any[] = Array.isArray(obj.shots) ? obj.shots.filter((s: any) => s && typeof s === 'object') : [];
    const charNames = characters.map((c) => c.displayNameEn);
    let shots: PremiumShot[] = rawShots.map((rs, i) => {
      const n = rawShots.length;
      const textBlob = `${str(rs.startStateEn)} ${str(rs.actionEn)} ${str(rs.actionPromptEn)}`;
      let charIds: PremiumCharId[] = [];
      const rawList = Array.isArray(rs.characters) ? rs.characters : typeof rs.characters === 'string' ? rs.characters.split(/,|&|\band\b/) : [];
      for (const r of rawList) {
        const id = resolveId(typeof r === 'object' && r ? r.id ?? r.name : r);
        if (id && !charIds.includes(id)) charIds.push(id);
      }
      if (!charIds.length && (rs.hasChar1 || rs.hasChar2)) {
        if (rs.hasChar1) charIds.push('char1');
        if (rs.hasChar2 && characters[1]) charIds.push('char2');
      }
      if (!charIds.length) {
        for (const c of characters) {
          const names = [c.displayNameEn, c.safeId].filter(Boolean).map(escapeRe).join('|');
          if (new RegExp(`\\b(?:${names})\\b`, 'i').test(textBlob)) charIds.push(c.id);
        }
      }

      const action = clampWords(firstSentence(limitEffects(cleanEn(rs.actionEn ?? rs.actionPromptEn ?? rs.mainActionBeatEn, idMap))), 20);
      let dialogue: PremiumDialogue | null = null;
      const rd = rs.dialogue && typeof rs.dialogue === 'object' ? rs.dialogue : null;
      const lineEnRaw = str(rd?.lineEn ?? rd?.line ?? rd?.textEn ?? rs.dialogueEn ?? rs.lineEn);
      const lineViRaw = str(rd?.lineVi ?? rd?.textVi ?? rs.dialogueVi ?? rs.lineVi ?? rs.subtitleVi);
      if (lineEnRaw.trim() || (rd && lineViRaw.trim())) {
        const speaker = resolveId(rd?.speaker ?? rs.speaker) || charIds[0] || 'char1';
        const sc = characters.find((c) => c.id === speaker);
        const lineEn = dialogueLine(lineEnRaw || lineViRaw, 8);
        const lineVi = dialogueLine(lineViRaw || lineEnRaw, 14);
        if (sc && sc.canSpeak && lineEn) dialogue = { speaker, lineEn, lineVi };
        // Người nói phải ở trong khung (Veo cần thấy miệng ai mở); khung đã đủ 2 người khác thì bỏ câu thoại.
        if (dialogue && !charIds.includes(speaker)) {
          if (charIds.length < 2) charIds.push(speaker);
          else dialogue = null;
        }
      }
      const fxEn = clampWords(limitEffects(cleanEn(rs.fxEn ?? rs.effectEn, idMap)), 12);
      const narrationVi = clampWords(
        squash(str(rs.narrationVi ?? rs.voiceoverVi ?? rs.narration).replace(/\[[^\]]*\]|@[\w:]+|\b[A-Z0-9]+(?:_[A-Z0-9]+)+\b|["“”]/g, ' ')),
        14
      );
      return {
        ...(narrationVi && !dialogue ? { narrationVi } : {}),
        shotNumber: i + 1,
        titleVi: clampWords(squash(str(rs.titleVi ?? rs.title)), 12) || `Cảnh ${i + 1}`,
        beat: coerceBeat(rs.beat) || positionalBeat(i, n),
        shotSize: coerceShotSize(rs.shotSize ?? rs.coverageType ?? rs.cameraAngle) || 'MS',
        cameraMoveEn: cleanCameraMove(rs.cameraMoveEn ?? rs.cameraMove),
        characters: charIds,
        startStateEn: clampField(limitEffects(cleanEn(rs.startStateEn ?? rs.startFrameEn ?? rs.entryStateEn, idMap)), 40, charNames) || action,
        endStateEn: clampField(limitEffects(cleanEn(rs.endStateEn ?? rs.endFrameEn ?? rs.exitStateEn ?? rs.endFramePromptEn, idMap)), 40, charNames),
        actionEn: action || 'a quiet moment as the scene settles',
        actingBeatEn: clampField(cleanEn(rs.actingBeatEn ?? rs.actingEn, idMap), 16, charNames),
        gazeEn: clampWords(cleanEn(rs.gazeEn ?? rs.gaze, idMap), 12),
        dialogue,
        vocalEn: clampWords(cleanEn(rs.vocalEn ?? rs.vocal, idMap), 12),
        sfxEn: clampWords(stripEnd(limitEffects(cleanEn(str(rs.sfxEn ?? rs.sfx).replace(/^\s*SFX:\s*/i, ''), idMap))), 14),
        ambientEn: clampWords(stripEnd(limitEffects(cleanEn(str(rs.ambientEn ?? rs.ambientNoiseEn ?? rs.ambient).replace(/^\s*Ambient(?: noise)?:\s*/i, ''), idMap), 0)), 12),
        fxLevel: coerceFxLevel(rs.fxLevel),
        fxEn,
        durationSeconds: coerceDuration(rs.durationSeconds ?? rs.duration),
      };
    });

    const minUsable = Math.max(3, Math.ceil(shotCount * 0.6));
    if (shots.length < minUsable) {
      shots = buildTemplateShots({ characters, environment, script, shotCount, isDino });
    } else if (shots.length > shotCount) {
      const idx = uniq(Array.from({ length: shotCount }, (_v, i) => Math.round((i * (shots.length - 1)) / Math.max(1, shotCount - 1))));
      shots = idx.map((i) => shots[i]);
    }
    const defaultAmbient = envProfileFromEnvironment(environment, script, isDino).ambientEn;
    shots = shots.map((s, i) => ({
      ...s,
      shotNumber: i + 1,
      ambientEn: s.ambientEn || defaultAmbient,
      sfxEn: s.sfxEn || DEFAULT_SFX_EN,
      actingBeatEn: actingWithTransition(s.actingBeatEn, s.beat),
    }));
    const budgeted = enforceEffectBudget(planCoverage(shots, { characters }), characters);
    for (const s of budgeted) s.cameraMoveEn = safeCameraMove(s);
    const planned = applyRealRenderRules(budgeted, characters, environment);

    return {
      movieTitle: clampWords(squash(str(obj.movieTitle ?? obj.title)), 16) || fb.movieTitle,
      loglineVi: squash(str(obj.loglineVi ?? obj.logline)) || fb.loglineVi,
      style,
      characters,
      environment,
      shots: planned,
    };
  } catch {
    return getFallback();
  }
}

// ───────────────────────────── Stage 2: sheets & environment plate ─────────────────────────────

/** Rút gọn danh sách âm thanh theo TỪNG MỤC ("low wind, bubbling hot springs and a distant rumble") — không cắt giữa cụm. */
function clampList(text: string, max: number): string {
  const t = stripEnd(text);
  if (countWords(t) <= max) return t;
  const items = t.split(/,\s*|\s+and\s+/).map((x) => x.trim()).filter(Boolean);
  const kept: string[] = [];
  for (const item of items) {
    if (countWords([...kept, item].join(' ')) > max) break;
    kept.push(item);
  }
  if (!kept.length) return clampPhrase(items[0] || t, max);
  return kept.length === 1 ? kept[0] : `${kept.slice(0, -1).join(', ')} and ${kept[kept.length - 1]}`;
}

/** Âm va chạm (L4): mục SFX này phải sống sót khi rút gọn danh sách âm thanh của cảnh va chạm. */
const IMPACT_SFX_RE = /\b(?:thud|thwack|thump|crack|slam|smack|whack|bang|crunch|clap|impact|hit|wham|crash|clonk|bonk)\w*/i;

/** clampList nhưng GIỮ mục khớp keep (đặt ở cuối danh sách, như âm đến sau cùng), bỏ bớt các mục khác cho vừa ngân sách. */
function clampListKeeping(text: string, max: number, keep: RegExp): string {
  const t = stripEnd(text);
  if (countWords(t) <= max) return t;
  const items = t
    .split(/,?\s+then\s+|,\s*|\s+and\s+/)
    .map((x) => x.trim().replace(/^then\s+/i, ''))
    .filter(Boolean);
  const keptIdx = [...items.keys()].reverse().find((i) => keep.test(items[i]));
  if (keptIdx === undefined) return clampList(text, max);
  // "a deep thud right at the very end" -> "a deep thud": cắt ngay sau từ va chạm.
  const hit = keep.exec(items[keptIdx]);
  const must = hit && countWords(items[keptIdx]) > 4 ? squash(items[keptIdx].slice(0, (hit.index ?? 0) + hit[0].length)) : clampPhrase(items[keptIdx], max);
  const kept: string[] = [];
  for (const [i, item] of items.entries()) {
    if (i === keptIdx) continue;
    if (countWords([...kept, item, must].join(' ')) > max) break;
    kept.push(item);
  }
  const all = [...kept, must];
  return all.length === 1 ? all[0] : `${all.slice(0, -1).join(', ')} and ${all[all.length - 1]}`;
}

function fitLevels(levels: Array<() => string>, max: number): string {
  let text = '';
  for (const build of levels) {
    text = squash(build());
    if (countWords(text) <= max) return text;
  }
  return text;
}

const NEUTRAL_BG = 'Flat neutral grey #808080 background';

/** Bộ 3 ảnh hồ sơ nhân vật kiểu Shayan: xoay 4 góc, 6 biểu cảm + 4 tư thế, chân dung. Nền xám #808080, không chữ. */
export const SHEET_REFERENCE_SENTENCE_EN = 'Same character as the reference image, with identical design, colours and markings.';

/**
 * withReferenceImage: bảng biểu cảm & chân dung vẽ theo bảng xoay đã duyệt → thêm câu khóa thiết kế vào cuối và tính nó
 * trong ngân sách 110 từ (không cộng thêm sau khi đã rút gọn).
 */
export function buildCharacterSheetPrompts(params: { style: PremiumStyleKey; character: PremiumCharacter; withReferenceImage?: boolean }): {
  turnaroundEn: string;
  expressionSheetEn: string;
  portraitEn: string;
} {
  const p = preset(coerceStyle(params.style));
  const c = params.character;
  const name = c?.displayNameEn || 'the character';
  const fullLook = softenEffects(cleanEn(c?.lookEn)) || withArticle(c?.species || 'character');
  const look = (n: number) => lcArticle(lookSummary(fullLook, n));
  const refTail = params.withReferenceImage ? ` ${SHEET_REFERENCE_SENTENCE_EN}` : '';
  const poses = 'walking mid-stride, running at full speed, crouched ready to spring, and a proud victory stance';

  const turnaroundEn = fitLevels(
    [40, 30, 22, 16].map(
      (n) => () =>
        `${p.sheetStyleEn} Character turnaround sheet of ${name}, ${look(n)}. The same character shown four times side by side at equal size: front view, three-quarter view, side view and back view, standing in a relaxed neutral pose with the full body visible. Identical proportions, colours and markings in every view. ${NEUTRAL_BG}, even soft studio lighting, clean unlabeled layout with generous spacing.`
    ),
    110
  );
  const expressionSheetEn = fitLevels(
    [30, 24, 18, 12].map(
      (n) => () =>
        `${p.sheetStyleEn} Expression and pose sheet of ${name}, ${look(n)}. Top row: six head-and-shoulders close-ups of the same face showing confident, happy, curious, serious, surprised and angry expressions with clear eye and brow acting. Bottom row: four full-body action poses: ${poses}. Identical design in every panel. ${NEUTRAL_BG}, soft even studio light, clean unlabeled grid.${refTail}`
    ),
    110
  );
  const portraitEn = fitLevels(
    [40, 30, 22, 16].map(
      (n) => () =>
        `${p.sheetStyleEn} Head-and-shoulders portrait of ${name}, ${look(n)}. Three-quarter view turned slightly toward camera, calm confident expression, eyes looking just past the lens with bright catchlights. Soft key light from the front left with a gentle rim light along the silhouette. ${NEUTRAL_BG}, centred composition, sharp focus on the eyes.${refTail}`
    ),
    110
  );
  return { turnaroundEn, expressionSheetEn, portraitEn };
}

/** Ảnh nền bối cảnh sạch (không nhân vật), một nguồn sáng chủ đạo, một họ màu. */
export function buildEnvironmentPlatePrompt(params: {
  style: PremiumStyleKey;
  environment: PremiumEnvironment;
  aspectRatio: string;
}): string {
  const p = preset(coerceStyle(params.style));
  const env = params.environment;
  const fullLook = limitEffects(cleanEn(env?.lookEn) || 'an open natural landscape');
  const tod = stripEnd(cleanEn(env?.timeOfDayEn)) || 'late afternoon';
  let light = stripEnd(cleanEn(env?.lightingEn)) || p.defaultLightingEn;
  let palette = stripEnd(cleanEn(env?.paletteEn)) || p.paletteRuleEn;
  if (hasHueTrio(`${fullLook} ${light} ${palette}`)) {
    light = stripPurple(light) || p.defaultLightingEn;
    palette = stripPurple(palette) || p.paletteRuleEn;
  }
  const aspect = aspectSentence(params.aspectRatio);
  const envStyle = styleSentenceFor(p, 'PLATE');
  const build = (n: number, lightN: number, palN: number) => () =>
    `${envStyle} An empty establishing view of ${lcFirst(clampPhrase(fullLook, n))}, ${lcFirst(tod)}. Lit by ${lcFirst(clampPhrase(light, lightN))}, in a palette of ${lcFirst(clampPhrase(palette, palN))}. Clear readable geography with distinct foreground, midground and background, and open ground in the centre of the set. ${aspect}`;
  let text = fitLevels([build(35, 14, 12), build(28, 12, 10), build(22, 10, 8), build(16, 8, 7)], 100);
  if (countWords(text) < 50) text = squash(`${text} Calm, still atmosphere with crisp natural detail.`);
  return text;
}

// ───────────────────────────── Stage 3: keyframe (START state) ─────────────────────────────

/** Trần số từ của từng loại prompt (keyframe 60-130, motion 40-100, sửa khung cuối 40-150). */
export const KEYFRAME_MAX_WORDS = 130;
export const MOTION_MAX_WORDS = 100;
export const END_FRAME_MAX_WORDS = 150;

/**
 * Prompt ảnh keyframe 60-120 từ, thứ tự cố định: phong cách; cỡ cảnh + góc + cảm giác ống kính; ai (tên + một cụm ngoại hình,
 * trỏ ảnh tham chiếu theo số); trạng thái đầu cảnh + ánh nhìn; bố cục theo cỡ cảnh; bối cảnh + giờ + một nguồn sáng + bảng màu; hiệu ứng nếu có.
 */
export function buildKeyframePrompt(params: {
  style: PremiumStyleKey;
  shot: PremiumShot;
  characters: PremiumCharacter[];
  environment: PremiumEnvironment;
  aspectRatio: string;
  referenceOrder?: string[];
}): string {
  const p = preset(coerceStyle(params.style));
  const shot = params.shot;
  const allChars = (params.characters || []).filter(Boolean);
  const env = params.environment;
  const idMap = buildIdMap(allChars, env);
  const cs = shotCharacters(shot, allChars);
  const names = allChars.map((c) => c.displayNameEn);
  const focus = focusCharacter(shot, cs);
  const envRef = envRefIndex(params.referenceOrder);
  const isFace = FACE_SIZES.has(shot.shotSize);
  // L6: hiệu ứng nước chỉ khi thân thể chạm nước có sẵn; bùn/nước thấp quanh chân. Cận mặt: bỏ hơi nước / sương.
  const fxRaw = shot.fxLevel > 0 ? stripEnd(cleanEn(physicalFx(shot, env?.lookEn), idMap)) : '';
  const startClean = waterPhrasing(cleanEn(shot.startStateEn, idMap) || cleanEn(shot.actionEn, idMap));
  const startRaw = isFace ? dropSteam(startClean) : startClean;
  const tod = stripEnd(cleanEn(env?.timeOfDayEn)) || 'late afternoon';
  // L5 (miệng khép ở nhịp không vui) + dáng đứng theo loài; hướng nhìn nằm trong câu bố cục.
  const exprText = expressionSentence(shot, cs, focus, 'start');
  const stanceText = stanceSentence(shot, cs, focus, shot.startStateEn || '', 'still');
  // Ánh nhìn: bỏ ở INSERT (chỉ có chân / vật thể trong khung) và khi nó mâu thuẫn tư thế đầu cảnh
  // ("looking up at the sky while falling" trong khi chân còn đứng trên bùn -> NBP vẽ nhân vật đang ngã cười).
  const gazeClean = cleanEn(shot.gazeEn, idMap);
  const gazeUsable = shot.shotSize !== 'INSERT' && !gazeContradictsStart(gazeClean, startRaw);

  const flags = { dropFx: false, softenEnv: false, softenLooks: false, noPurple: false };
  const compose = (lv: { look: number; env: number; light: number; palette: number; start: number; gaze: number; short?: boolean; stance?: boolean }): string => {
    const lookOf = (c: PremiumCharacter) => {
      // Cụm nhận diện giữ nguyên văn ở mọi cảnh; chỉ mức cuối cùng (cứu số từ) mới rút ngắn.
      let l = lv.look >= IDENTITY_WORDS ? identityPhrase(c) : lookPhrase(c, lv.look);
      if (flags.softenLooks) l = softenEffects(l);
      if (flags.noPurple) l = stripPurple(l) || withArticle(c.species);
      return l;
    };
    const who = cs
      .map((c) => {
        const idx = charRefIndex(params.referenceOrder, c);
        return `${c.displayNameEn}${idx ? ` (image ${idx})` : ''}, ${lookOf(c)}`;
      })
      .join(', and ');
    let envText = isFace ? dropSteamAdjectives(envPhrase(env, lv.env)) || envPhrase(env, lv.env) : envPhrase(env, lv.env);
    let light = lcFirst(clampPhrase(stripEnd(cleanEn(env?.lightingEn)) || p.defaultLightingEn, lv.light));
    let palette = lcFirst(clampPhrase(stripEnd(cleanEn(env?.paletteEn)) || p.paletteRuleEn, lv.palette));
    if (flags.softenEnv) {
      envText = softenEffects(envText);
      light = softenEffects(light);
      palette = softenEffects(palette);
    }
    if (flags.noPurple) {
      envText = stripPurple(envText) || 'the open landscape';
      light = stripPurple(light) || p.defaultLightingEn;
      palette = stripPurple(palette) || p.paletteRuleEn;
    }
    // Trạng thái đầu cảnh là lõi của keyframe (ai lao tới, đuôi, cú húc): chỉ rút theo MỆNH ĐỀ trọn vẹn, không để lại mảnh cụt.
    const start = clampClauses(flags.softenLooks ? softenEffects(startRaw) : startRaw, lv.start, names);
    const gazeText = gazeUsable ? clampWords(gazeClean, lv.gaze) : '';
    const gaze = lv.gaze && focus && gazeText ? gazeSentence(gazeOwner(gazeText, focus, cs)?.displayNameEn || '', gazeText, 'still', names) : '';
    const setting = `${cap(stripEnd(envText))}${envRef ? ` (image ${envRef})` : ''}, ${lcFirst(tod)}, lit by ${light}, in a palette of ${palette}.`;
    const fx = !flags.dropFx && fxRaw ? sentence(fxRaw) : '';
    return squash(
      [
        lv.short ? p.shortStyleEn : styleSentenceFor(p, shot.shotSize, cs.length > 0),
        framingSentence(shot, cs),
        who ? sentence(who) : '',
        sentence(start),
        exprText,
        lv.stance === false ? '' : stanceText,
        gaze,
        compositionSentence(shot, cs, params.aspectRatio),
        setting,
        fx,
      ]
        .filter(Boolean)
        .join(' ')
    );
  };
  // Thiếu chỗ (bản render dino_premium_v2: trạng thái đầu bị cắt còn "Side view along the mud shore, Ember."):
  // rút bối cảnh / ánh sáng / bảng màu trước, rồi ánh nhìn, rồi câu phong cách dài -> câu ngắn, rồi dáng đứng; trạng thái đầu cảnh
  // giữ TRỌN tới khi hết cách khác, sau đó chỉ rút theo mệnh đề. KHÔNG rút cụm nhận diện nhân vật hay câu biểu cảm (L5).
  const I = IDENTITY_WORDS;
  const FULL = 40;
  const levels = [
    { look: I, env: 16, light: 14, palette: 12, start: FULL, gaze: 10 },
    { look: I, env: 12, light: 10, palette: 10, start: FULL, gaze: 8 },
    { look: I, env: 9, light: 8, palette: 8, start: FULL, gaze: 8 },
    { look: I, env: 7, light: 6, palette: 6, start: FULL, gaze: 0 },
    { look: I, env: 9, light: 8, palette: 8, start: FULL, gaze: 8, short: true },
    { look: I, env: 6, light: 5, palette: 5, start: FULL, gaze: 0, short: true },
    { look: I, env: 5, light: 4, palette: 4, start: FULL, gaze: 0, short: true, stance: false },
    { look: I, env: 4, light: 3, palette: 3, start: FULL, gaze: 0, short: true, stance: false },
    { look: I, env: 4, light: 3, palette: 3, start: 28, gaze: 0, short: true, stance: false },
    { look: I, env: 4, light: 3, palette: 3, start: 22, gaze: 0, short: true, stance: false },
    { look: I, env: 4, light: 3, palette: 3, start: 16, gaze: 0, short: true, stance: false },
    { look: 7, env: 4, light: 3, palette: 3, start: 16, gaze: 0, short: true, stance: false },
    { look: 7, env: 4, light: 3, palette: 3, start: 12, gaze: 0, short: true, stance: false },
  ];
  // Trần = lint ảnh: câu biểu cảm (L5), dáng đứng và hướng nhìn là phần bắt buộc mới, không cắt trạng thái đầu cảnh để nhường chỗ.
  const fit = () => fitLevels(levels.map((lv) => () => compose(lv)), KEYFRAME_MAX_WORDS);

  let text = fit();
  for (let i = 0; i < 4; i++) {
    const tooManyFx = effectTerms(text).length > 1;
    const trio = hasHueTrio(text);
    if (!tooManyFx && !trio) break;
    if (tooManyFx) {
      if (!flags.dropFx && fxRaw) flags.dropFx = true;
      else if (!flags.softenEnv) flags.softenEnv = true;
      else flags.softenLooks = true;
    }
    if (trio) flags.noPurple = true;
    text = fit();
  }
  if (countWords(text) < 60) {
    const st = styleSentenceFor(p, shot.shotSize, cs.length > 0);
    text = squash(text.replace(st, `${st} Crisp clean detail and a clear readable silhouette.`));
  }
  return text;
}

// ───────────────────────────── Stage 4: motion (image-to-video) ─────────────────────────────

/**
 * Prompt video 40-90 từ cho image-to-video: CHỈ chuyển động (máy quay, một hành động, nhịp diễn xuất, ánh nhìn),
 * rồi âm thanh: thoại "<Tên> says: ..." (dấu hai chấm, không ngoặc kép) hoặc âm phản ứng, SFX:, Ambient noise:, đuôi phong cách ngắn.
 */
export function buildMotionPrompt(params: {
  style: PremiumStyleKey;
  shot: PremiumShot;
  characters: PremiumCharacter[];
  environment: PremiumEnvironment;
  dialogueLang: 'en' | 'vi';
  /** true khi Veo nhận cả khung đầu lẫn khung cuối (L1): câu khoá thiết kế nhắc cả hai khung. */
  withEndFrame?: boolean;
}): string {
  const p = preset(coerceStyle(params.style));
  const shot = params.shot;
  const allChars = (params.characters || []).filter(Boolean);
  const idMap = buildIdMap(allChars, params.environment);
  const cs = shotCharacters(shot, allChars);
  const names = allChars.map((c) => c.displayNameEn);
  const focus = focusCharacter(shot, cs);
  const focusName = focus?.displayNameEn || '';
  const lang = params.dialogueLang === 'vi' ? 'vi' : 'en';

  const isFace = FACE_SIZES.has(shot.shotSize);
  // L6: nước nhỏ giọt thay vì chảy thành dòng; hiệu ứng nước chỉ khi chạm nước; cận mặt bỏ hơi nước / sương.
  const faceClean = (t: string) => (isFace ? dropSteam(t) : t);
  let action = faceClean(waterPhrasing(cleanEn(shot.actionEn, idMap)));
  let acting = faceClean(cleanEn(shot.actingBeatEn, idMap));
  const gaze = cleanEn(shot.gazeEn, idMap);
  const fxRaw = shot.fxLevel > 0 ? faceClean(stripEnd(cleanEn(physicalFx(shot, params.environment?.lookEn), idMap))) : '';
  // L4: va chạm giữa hai nhân vật -> cắt trên hành động, dừng một bước trước khi chạm (khung cuối cũng vậy).
  const contactSuffix = isContactShot(shot, cs) ? ', ending one step before contact' : '';
  // L4 "cú va chạm bán bằng âm thanh": cảnh va chạm giữ mục SFX va chạm (thud / thwack / crack ...) khi rút gọn, đặt ở CUỐI.
  const keepImpactSfx = isContactShot(shot, cs) || hasContactAction(String(shot.actionEn || ''));
  // L5 + hướng nhìn + dáng đứng theo loài.
  const exprLine = expressionLine(shot, cs, focus, 'motion');
  const dirText = directionSentence(shot, cs, 'motion');
  const dirCompact = directionSentence(shot, cs, 'motion', true);
  const stanceFrame = `${shot.startStateEn || ''}. ${shot.actionEn || ''}. ${shot.endStateEn || ''}`;
  const stanceText = stanceSentence(shot, cs, focus, stanceFrame, 'motion');
  const stanceCompact = stanceSentence(shot, cs, focus, stanceFrame, 'motion', true);
  let sfx = stripEnd(cleanEn(shot.sfxEn, idMap).replace(/^SFX:\s*/i, ''));
  let ambient = stripEnd(cleanEn(shot.ambientEn, idMap).replace(/^Ambient(?: noise)?:\s*/i, ''));

  const audio = (): string => {
    const d = shot.dialogue;
    const speaker = d ? allChars.find((c) => c.id === d.speaker) : undefined;
    if (d && speaker && speaker.canSpeak !== false) {
      const line = lang === 'vi' ? dialogueLine(d.lineVi || d.lineEn, 14) : dialogueLine(d.lineEn || d.lineVi, 8);
      if (line) {
        const voice = voicePhrase(speaker.voiceEn);
        return `${voice ? `${voice}, ` : ''}${speaker.displayNameEn} says${lang === 'vi' ? ' in Vietnamese' : ''}: ${line}`;
      }
    }
    const vocal = cs.length ? cleanEn(shot.vocalEn, idMap) : '';
    if (vocal) {
      const owner = cs.find((c) => vocal.toLowerCase().startsWith(c.displayNameEn.toLowerCase())) || focus;
      return vocalSentence(owner?.displayNameEn || '', vocal, names);
    }
    return '';
  };

  let dropFx = false;
  const styleKey = coerceStyle(params.style);
  const d0 = shot.dialogue;
  const speakerChar = d0 ? cs.find((c) => c.id === d0.speaker && c.canSpeak !== false) : undefined;
  // Thay tên + câu khoá thiết kế được áp TRONG compose để fitLevels đo đúng số chữ cuối cùng.
  const finalize = (t: string, compact = false): string => {
    let out = anchorNamesForVeo(t, cs, allChars, styleKey, speakerChar ? [speakerChar] : [], compact);
    if (cs.length && styleKey !== 'photoreal') {
      // Veo Quality có xu hướng "nâng cấp" nhân vật hoạt hình thành sinh vật thật theo thời gian.
      const frames = params.withEndFrame ? 'the first and last frames' : 'the first frame';
      const lock =
        styleKey === 'graphic2d'
          ? `Same hand-drawn character design and scale as ${frames} throughout.`
          : `Same 3D animated character design and scale as ${frames} throughout.`;
      out = squash(out.replace(/^(.*?one continuous shot\.)\s*/i, `$1 ${lock} `));
    }
    return out;
  };
  // Nhịp diễn xuất gắn cho người được nhắc tên trong câu diễn, nếu không thì cho người thực hiện hành động (không mặc định người quay mặt về máy).
  const namedIn = (text: string) => cs.find((c) => new RegExp(`\\b${escapeRe(c.displayNameEn)}\\b`, 'i').test(text));
  const actorOf = (text: string) => cs.find((c) => startsWithName(text, [c.displayNameEn]) || text.trim().toLowerCase() === c.displayNameEn.toLowerCase());
  const actingOwner = (): PremiumCharacter | undefined => namedIn(acting) || actorOf(action) || speakerChar || focus;
  const fxSentence = (max: number): string => {
    const t = clampPhrase(fxRaw, max);
    return countWords(t) >= 2 && !DANGLING_TAIL_RE.test(` ${t}`) ? sentence(t) : '';
  };
  // Thiếu chỗ: mệnh đề miệng khép nối thẳng vào câu diễn xuất của cùng nhân vật (giữ L5, bớt lặp tên).
  const actingWithExpr = (lv: { acting: number; mergeExpr?: boolean }): string[] => {
    if (!cs.length) return [];
    const owner = actingOwner();
    const act = actingSentence(owner?.displayNameEn || focusName, clampPhrase(acting, lv.acting), names);
    const saysClosed = /\bmouth\s+(?:\w+\s+)?(?:closed|shut)\b|\blips?\s+(?:\w+\s+)?cover/i.test(act);
    if (lv.mergeExpr && act && exprLine.owner === owner && (saysClosed || !exprLine.clause)) return exprLine.clause ? [act] : [act, exprLine.full];
    if (lv.mergeExpr && act && exprLine.clause && exprLine.owner === owner) return [`${stripEnd(act)}, ${exprLine.clause}.`];
    return [act, exprLine.full];
  };
  type MotionLevel = { action: number; acting: number; gaze: number; sfx: number; ambient: number; fx: number; compact?: boolean; stance?: boolean | 'compact'; dir?: boolean | 'compact'; mergeExpr?: boolean };
  const compose = (lv: MotionLevel): string =>
    finalize(squash(
      [
        cameraSentence(safeCameraMove(shot)),
        sentence(`${clampPhrase(action, lv.action)}${contactSuffix}`),
        fxRaw && !dropFx && lv.fx ? fxSentence(lv.fx) : '',
        ...actingWithExpr(lv),
        lv.dir === false ? '' : lv.dir === 'compact' ? dirCompact : dirText,
        lv.stance === false ? '' : lv.stance === 'compact' ? stanceCompact : stanceText,
        lv.gaze && focus ? gazeSentence(gazeOwner(gaze, actingOwner() || focus, cs)?.displayNameEn || '', clampWords(gaze, lv.gaze), 'motion', names) : '',
        audio(),
        sfx ? `SFX: ${keepImpactSfx ? clampListKeeping(sfx, Math.max(lv.sfx, 5), IMPACT_SFX_RE) : clampList(sfx, lv.sfx)}.` : '',
        ambient ? `Ambient noise: ${clampList(ambient, lv.ambient)}.` : '',
        p.shortStyleEn,
      ]
        .filter(Boolean)
        .join(' ')
    ), !!lv.compact);
  // Hành động là lõi của prompt video: giữ trọn (<= 20 từ sau chuẩn hoá) tới gần mức cuối; rút âm thanh / ánh nhìn / dáng đứng trước.
  const levels: MotionLevel[] = [
    { action: 24, acting: 18, gaze: 12, sfx: 14, ambient: 12, fx: 12 },
    { action: 20, acting: 14, gaze: 8, sfx: 10, ambient: 8, fx: 10 },
    { action: 20, acting: 14, gaze: 0, sfx: 8, ambient: 6, fx: 8 },
    { action: 20, acting: 12, gaze: 0, sfx: 8, ambient: 6, fx: 8, mergeExpr: true },
    { action: 20, acting: 12, gaze: 0, sfx: 6, ambient: 5, fx: 6, mergeExpr: true, dir: 'compact', stance: 'compact' },
    { action: 18, acting: 12, gaze: 0, sfx: 6, ambient: 5, fx: 6, mergeExpr: true, dir: 'compact', stance: 'compact', compact: true },
    { action: 16, acting: 10, gaze: 0, sfx: 5, ambient: 4, fx: 5, mergeExpr: true, dir: 'compact', stance: false, compact: true },
    { action: 14, acting: 8, gaze: 0, sfx: 4, ambient: 3, fx: 5, mergeExpr: true, dir: 'compact', stance: false, compact: true },
    { action: 12, acting: 6, gaze: 0, sfx: 4, ambient: 3, fx: 0, mergeExpr: true, compact: true, stance: false, dir: false },
  ];
  const fit = () => fitLevels(levels.map((lv) => () => compose(lv)), MOTION_MAX_WORDS);
  let text = fit();
  // Tối đa MỘT hiệu ứng lớn: bỏ câu fx trước, rồi mệnh đề hiệu ứng trong SFX/ambient, cuối cùng giới hạn trong hành động.
  const hasFx = (c: string) => effectTerms(c).length > 0;
  for (let step = 0; step < 3 && effectTerms(text).length > 1; step++) {
    if (step === 0 && fxRaw) dropFx = true;
    else if (step <= 1) {
      sfx = dropClauses(sfx, hasFx);
      ambient = dropClauses(ambient, hasFx);
    } else {
      action = limitEffects(action, 1);
      acting = softenEffects(acting);
    }
    text = fit();
  }
  if (countWords(text) < 40) {
    text = squash(text.replace(p.shortStyleEn, `Natural weight and smooth follow-through in every movement. ${p.shortStyleEn}`));
  }
  return text;
}

// ───────────────────────────── Stage 3b: END keyframe by editing the start keyframe (L1) ─────────────────────────────

/** Nhãn phong cách ngắn cho prompt sửa ảnh: "Pixar-like 3D animation". */
function styleLabel(style: PremiumStyleKey): string {
  return stripEnd(preset(style).shortStyleEn.split(',')[0]);
}

const SET_ELEMENTS: Array<[RegExp, string]> = [
  [/\b(?:rocks?|rocky|boulders?|basalt|ridges?|stones?|pebbles?|cliffs?|outcrops?)\b/i, 'rocks'],
  [/\b(?:ferns?|trees?|reeds?|grass|bushes|shrubs?|hedges?|plants?|cacti|palms?|willows?|moss\w*|foliage|leaves|wildflowers)\b/i, 'plants'],
  [/\b(?:sand|dunes?)\b/i, 'sand'],
  [/\b(?:snow\w*|ice|frost\w*)\b/i, 'snow'],
  [/\b(?:walls?|wallpaper|floor\w*|doors?|windows?|furniture|armchair|sofa|rug|counters?|shelves)\b/i, 'walls and furniture'],
  [/\b(?:path|street|road|lane)\b/i, 'path'],
];

/**
 * Prompt Nano Banana Pro tạo khung CUỐI bằng cách SỬA khung đầu (L1): giữ nguyên nền / ánh sáng / góc máy / ống kính / phong cách,
 * chỉ đổi tư thế + biểu cảm sang endStateEn, mỗi nhân vật khoá thiết kế theo sheet của nó (thiếu sheet -> đổi màu).
 * Thứ tự ảnh tham chiếu mặc định: [khung đầu, sheet nhân vật thứ nhất, sheet nhân vật thứ hai] (tối đa 3).
 * referenceOrder (nếu có) là nhãn song song với ảnh tham chiếu, ví dụ ['start keyframe', 'char1 sheet', 'char2 sheet'].
 */
export function buildEndFrameEditPrompt(params: {
  style: PremiumStyleKey;
  shot: PremiumShot;
  characters: PremiumCharacter[];
  referenceOrder?: string[];
  environment?: PremiumEnvironment | null;
}): string {
  const style = coerceStyle(params.style);
  const shot0 = params.shot;
  const allChars = (params.characters || []).filter(Boolean);
  const env = params.environment || null;
  const idMap = buildIdMap(allChars, env);
  const shot: PremiumShot = {
    ...shot0,
    characters: Array.isArray(shot0?.characters) ? [...shot0.characters] : [],
    startStateEn: waterPhrasing(cleanEn(shot0?.startStateEn, idMap)),
    actionEn: waterPhrasing(cleanEn(shot0?.actionEn, idMap)),
    actingBeatEn: cleanEn(shot0?.actingBeatEn, idMap),
    endStateEn: cleanEn(shot0?.endStateEn, idMap),
  };
  const cs = shotCharacters(shot, allChars).slice(0, 2);
  const focus = focusCharacter(shot, cs);
  const isFace = FACE_SIZES.has(shot.shotSize);
  const order = Array.isArray(params.referenceOrder) && params.referenceOrder.length ? params.referenceOrder : null;
  const startIdx = order ? refIndex(order, (e) => /\b(?:start|first|keyframe|key frame|opening)\b/.test(e) && !/\b(?:end|last|final)\b/.test(e)) || 1 : 1;
  const imageOf = (c: PremiumCharacter, i: number): number => (order ? charRefIndex(order, c) || startIdx : i + 2);

  let end = settleEndState(shot, allChars);
  if (isFace) end = dropSteam(end);
  shot.endStateEn = end;
  const exprFirst = expressionSentence(shot, cs, focus, 'end');
  if (exprFirst) end = stripEnd(end.replace(/,?\s*(?:[A-Z][\w'-]*(?:\s[A-Z][\w'-]*)?\s+)?showing (?:a serious \w+ expression|a dazed expression with a slack jaw)\b/, '')) || end;

  const setText = `${env?.lookEn || ''} ${shot.startStateEn}`;
  const keep: string[] = ['background'];
  for (const [re, label] of SET_ELEMENTS) if (re.test(setText) && keep.length < 3) keep.push(label);
  if (WATER_SET_RE.test(setText)) keep.push('water');
  if (!isFace && /\bsteam\w*/i.test(setText)) keep.push('steam');
  keep.push('lighting', 'colours', 'camera angle', 'lens');
  const keepSentence = `Keep the ${keep.join(', ')} and ${styleLabel(style)} style of image ${startIdx} exactly the same.`;

  const exprText = expressionSentence(shot, cs, focus, 'end');
  const stanceText = stanceSentence(shot, cs, focus, end, 'still');
  const dirText = directionSentence(shot, cs, 'still');
  const contact = isContactShot(shot, cs);
  const actor = contact ? cs.find((c) => startsWithName(shot.actionEn, [c.displayNameEn])) || cs[0] : undefined;
  const target = actor ? cs.find((c) => c !== actor) : undefined;
  const endNames = allChars.map((c) => c.displayNameEn);
  const gapText = actor && target ? `A clear gap of open air stays between ${actor.displayNameEn} and ${target.displayNameEn}.` : '';
  // Khoá thiết kế: bỏ tư thế ("standing upright ...") và biểu cảm ("with a sly smile") khỏi mô tả — tư thế cuối do câu đổi tư thế quyết định.
  const fullLook = (c: PremiumCharacter) => softenEffects(lookWithoutStance(stripLookExpression(cleanEn(c.lookEn)))) || withArticle(c.species || 'character');

  const compose = (lv: { look: number; end: number; stance: boolean }): string => {
    const design = cs
      .map((c, i) => `${c.displayNameEn} keeps exactly the same design as image ${imageOf(c, i)}: ${lcArticle(lv.look >= IDENTITY_WORDS + 2 ? lookSummary(fullLook(c), lv.look) : identityPhrase(c))}.`)
      .join(' ');
    const change = cs.length
      ? `Change only the poses and expressions: ${stripEnd(clampClauses(end, lv.end, endNames))}.`
      : `Change only small natural movements: ${stripEnd(clampClauses(end, lv.end, endNames))}.`;
    return squash(
      [
        `Edit image ${startIdx}.`,
        keepSentence,
        change,
        exprText,
        lv.stance ? stanceText : '',
        dirText,
        gapText,
        design,
        `Same scale and same positions in the frame as image ${startIdx}.`,
      ]
        .filter(Boolean)
        .join(' ')
    );
  };
  const levels = [
    { look: 20, end: 30, stance: true },
    { look: 16, end: 26, stance: true },
    { look: 14, end: 22, stance: true },
    { look: IDENTITY_WORDS, end: 20, stance: true },
    { look: IDENTITY_WORDS, end: 16, stance: false },
  ];
  let text = fitLevels(levels.map((lv) => () => compose(lv)), END_FRAME_MAX_WORDS);
  if (hasHueTrio(text)) text = stripPurple(text);
  return text;
}

// ───────────────────────────── Stage 4: take judge ─────────────────────────────

/** Cổng cứng của giám khảo (L7): trượt một cổng -> pass=false, overall <= 55. */
export const PREMIUM_JUDGE_HARD_GATES = ['keyActionVisible', 'bodyIntact', 'expressionMatchesBeat', 'identityOnModel', 'facingCorrect', 'cleanFrame'] as const;
export type PremiumJudgeHardGate = (typeof PREMIUM_JUDGE_HARD_GATES)[number];
export const PREMIUM_JUDGE_GATE_FAIL_CAP = 55;

function describeReference(label: string): string {
  const l = String(label || '').trim();
  const lc = l.toLowerCase();
  if (/\b(?:end|last|final)\b/.test(lc)) return `${l} (the intended last pose of the shot)`;
  if (/\b(?:start|first|keyframe|opening)\b/.test(lc)) return `${l} (the intended first frame of the shot)`;
  if (/\b(?:sheet|turnaround|portrait|character|expression)\b/.test(lc)) return `${l} (the identity reference)`;
  return l;
}

/** Nhãn ảnh tham chiếu gọn cho prompt giám khảo rút gọn: "start keyframe = intended first frame". */
function describeReferenceShort(label: string): string {
  const l = String(label || '').trim();
  const lc = l.toLowerCase();
  if (/\b(?:end|last|final)\b/.test(lc)) return `${l} (intended last pose)`;
  if (/\b(?:start|first|keyframe|opening)\b/.test(lc)) return `${l} (intended first frame)`;
  if (/\b(?:sheet|turnaround|portrait|character|expression)\b/.test(lc)) return `${l} (identity reference)`;
  return l;
}

function fmtSec(t: number): string {
  return `${Math.round(Number(t) * 100) / 100}s`;
}

/**
 * Bỏ từ biểu cảm khỏi mô tả ngoại hình ("a long narrow snout with a sly smile" -> "a long narrow snout"): giám khảo không được
 * vừa đòi "giữ đúng thiết kế có nụ cười" vừa đòi "mọi nụ cười đều sai" ở nhịp không vui (shot 10 dino_premium_v2).
 */
const LOOK_EXPRESSION_RE =
  /\s*,?\s*(?:with\s+)?(?:an?\s+|the\s+|its\s+|his\s+|her\s+)?(?:(?:sly|smug|happy|angry|cheeky|friendly|gentle|warm|wide|big|toothy|knowing|confident|mischievous|cunning|fierce|kind|soft|playful|permanent|little|small|crooked|lopsided|slight|faint|sweet)\s+){0,2}(?:smile|grin|smirk|frown|scowl|sneer)s?\b|\s*,?\s*(?:with\s+)?(?:an?\s+)?(?:[\w-]+\s+){0,2}expression\b|\s*,?\s*(?:always\s+)?(?:smiling|grinning|smirking|frowning|scowling)\b/gi;
function stripLookExpression(lookEn: string): string {
  const out = tidyEn(String(lookEn || '').replace(LOOK_EXPRESSION_RE, ''));
  return out.replace(/^[,;\s]+|[,;\s]+$/g, '') || String(lookEn || '');
}

/**
 * Bỏ cụm tư thế khỏi mô tả ngoại hình ("standing upright on two hind legs", "with tiny arms tucked to the chest"): câu khoá thiết kế
 * của khung cuối từng nhắc lại "đứng thẳng" trong khi tư thế cuối là nằm ngửa / đang ngã / cận mắt (L1 tự mâu thuẫn).
 */
const LOOK_STANCE_RE =
  /\s*,?\s*\b(?:standing|sitting|crouching|perched|posed|walking)\b(?:\s+(?:upright|tall|proudly|firmly))?(?:\s+on\s+(?:its\s+|his\s+|her\s+)?(?:two|four|all)\s+(?:strong\s+|sturdy\s+)?(?:hind\s+|back\s+)?(?:legs|feet|fours))?|\s*,?\s*\bupright\s+on\s+(?:two|its|his|her)\s+(?:hind\s+|back\s+)?legs\b|\s*,?\s*(?:with\s+)?(?:its\s+|his\s+|her\s+)?(?:tiny|short|stubby|little|small)\s+(?:two-fingered\s+)?arms\s+(?:tucked|held|folded)(?:\s+(?:close\s+)?(?:to|against)\s+(?:the|its|his|her)\s+chest)?/gi;
function lookWithoutStance(lookEn: string): string {
  const out = tidyEn(String(lookEn || '').replace(LOOK_STANCE_RE, ''));
  return out.replace(/^[,;\s]+|[,;\s]+$/g, '') || String(lookEn || '');
}

/** Mô tả nhận diện cho giám khảo / khoá thiết kế: bỏ biểu cảm + tư thế, giữ loài + chi tiết + phụ kiện màu đặc trưng. */
function judgeLook(c: PremiumCharacter, maxWords: number): string {
  const look = lookWithoutStance(stripLookExpression(cleanEn(c.lookEn)));
  return look ? lcArticle(lookSummary(look, maxWords, true)) : withArticle(c.species || 'character');
}

/** Ngân sách ký tự của prompt giám khảo take gửi Flow (Flow từ chối prompt kèm ảnh dài hơn ~4.000 ký tự: "Dịch vụ tạo văn bản không hoạt động"). */
export const PREMIUM_JUDGE_PROMPT_MAX_CHARS = 3300;

/**
 * Rubric chấm từng take bằng ảnh (Gemini vision). Không gợi ý điểm mẫu cao để tránh neo điểm.
 * L7: nhận số khung tuỳ ý (nên >= 10 khung đều nhau + khung đầu/cuối), ảnh tham chiếu tuỳ chọn đứng TRƯỚC các khung của take
 * ('start keyframe', 'end keyframe', 'character sheet ...'), có CỔNG CỨNG và trả beat_in / beat_peak / beat_out (giây).
 * Văn bản cảnh được làm sạch như các prompt dựng hình (L6 nước nhỏ giọt, khung cuối một bước trước va chạm, hiệu ứng hợp lệ),
 * và nói "translucent" thay vì "see-through" (Flow từ chối từ này).
 * compact / maxChars (tuỳ chọn): bản gọn trong ngân sách ký tự (mặc định PREMIUM_JUDGE_PROMPT_MAX_CHARS) cho Flow;
 * không truyền -> bản đầy đủ như cũ (dùng cho log / test).
 */
export function buildTakeJudgePrompt(params: {
  shot: PremiumShot;
  characters: PremiumCharacter[];
  frameTimesSec: number[];
  referenceFrames?: string[];
  style?: PremiumStyleKey;
  durationSec?: number;
  /** Bối cảnh (hiệu ứng nước chỉ hợp lệ khi bối cảnh có nước). */
  environment?: PremiumEnvironment | null;
  /** Bản gọn cho Flow (ngân sách mặc định PREMIUM_JUDGE_PROMPT_MAX_CHARS). */
  compact?: boolean;
  /** Trần ký tự (bật bản gọn). */
  maxChars?: number;
}): string {
  const shot0 = params.shot;
  const allChars = (params.characters || []).filter(Boolean);
  const env = params.environment || null;
  const idMap = buildIdMap(allChars, null);
  const cs = shotCharacters(shot0, allChars);
  const focus = focusCharacter(shot0, cs);
  const isFace = FACE_SIZES.has(shot0.shotSize);
  const faceClean = (t: string) => (isFace ? dropSteam(t) : t);
  // Văn bản cảnh đã làm sạch giống builder keyframe / motion / sửa khung cuối (L4, L6).
  const shot: PremiumShot = {
    ...shot0,
    characters: Array.isArray(shot0?.characters) ? [...shot0.characters] : [],
    startStateEn: faceClean(waterPhrasing(cleanEn(shot0?.startStateEn, idMap))),
    actionEn: faceClean(waterPhrasing(cleanEn(shot0?.actionEn, idMap))),
    actingBeatEn: cleanEn(shot0?.actingBeatEn, idMap),
    endStateEn: cleanEn(shot0?.endStateEn, idMap),
  };
  shot.endStateEn = faceClean(settleEndState(shot, allChars));
  const times = (params.frameTimesSec || []).map(Number).filter((t) => Number.isFinite(t)).map(fmtSec);
  const refs = (params.referenceFrames || []).map((r) => squash(String(r || ''))).filter(Boolean);
  const k = refs.length;
  const n = times.length;
  const styled = params.style ? coerceStyle(params.style) !== 'photoreal' : true;
  const d = shot.dialogue;
  const speaker = d ? allChars.find((c) => c.id === d.speaker) : undefined;
  const action = shot.actionEn;
  const endState = shot.endStateEn;
  const startState = shot.startStateEn;
  const acting = shot.actingBeatEn;
  const fxAllowed = shot.fxLevel > 0 && shot.fxEn ? stripEnd(cleanEn(physicalFx(shot0, env?.lookEn), idMap)) : '';
  const owner = actingOwnerOf(shot, cs, focus);
  const ex = endExpression(shot, owner, cs, focus);
  const scripted = scriptedOpenMouth(shot, owner, cs, focus);
  const ownerName = owner?.displayNameEn || 'the character';
  const roarsOrSpeaks = clausesOf(`${shot.actionEn}. ${shot.vocalEn || ''}`, owner, cs, focus).some((c) => OPEN_MOUTH_RE.test(c)) || (speaker && speaker === owner);
  const exSpec =
    ex.kind === 'happy'
      ? 'a smile fits this beat'
      : ex.kind === 'dazed'
      ? `${ownerName} looks dazed: slack jaw, unfocused eyes; any smile, grin or laugh is wrong`
      : ex.kind === 'serious'
      ? `${ownerName} looks serious and ${ex.adj}${
          roarsOrSpeaks
            ? ' (an open roaring or speaking mouth is fine)'
            : scripted.start || scripted.end
            ? ` (an open ${/^(?:angry|fierce)$/.test(ex.adj) ? 'snarling' : ex.adj} mouth is fine)`
            : ' with the mouth closed over the teeth'
        }; any smile, grin or laugh is wrong`
      : 'match the acting beat; a broad grin or laugh is wrong unless the beat asks for one';
  const facing = cs.length && shot.shotSize !== 'POV' && shot.shotSize !== 'INSERT' ? cs.map((c) => `${c.displayNameEn} faces screen-${screenFacing(shot, c)}`).join('; ') : '';
  const contact = isContactShot(shot, cs);
  const lookOf = (c: PremiumCharacter) => stripLookExpression(cleanEn(c.lookEn));
  const durLine = Number(params.durationSec) > 0 ? `The take lasts ${fmtSec(Number(params.durationSec))}.` : '';
  const compactMode = !!params.compact || Number(params.maxChars) > 0;

  if (!compactMode) {
    const who = cs.length
      ? cs
          .map((c) => {
            const stance = stanceDescription(c);
            return `- ${c.displayNameEn} (${c.species}): ${lookOf(c)}${stance ? `. Body: ${stance}` : ''}.`;
          })
          .join('\n')
      : '- No named character; judge the environment and action only.';
    const intro =
      k > 0
        ? `You are given ${k} reference image${k > 1 ? 's' : ''} followed by ${n || 'several'} frames from the same take, in time order${n ? `, sampled at ${times.join(', ')}` : ''}.`
        : `You are given ${n || 'several'} frames from the same take, in time order${n ? `, sampled at ${times.join(', ')}` : ''}.`;
    const refLine =
      k > 0
        ? `Reference images (used only for comparison, never scored): ${refs.map((r, i) => `image ${i + 1} = ${describeReference(r)}`).join('; ')}. The frames of the take are ${n ? `images ${k + 1}-${k + n}` : `the images after image ${k}`}.`
        : '';
    return [
      'You are a strict animation supervisor reviewing ONE generated video take for a premium animated short.',
      intro,
      ...(refLine ? [refLine] : []),
      ...(durLine ? [durLine] : []),
      '',
      'INTENDED SHOT',
      `- Shot size: ${SIZE_NAME_EN[shot.shotSize] || shot.shotSize}; camera: ${cleanCameraMove(shot.cameraMoveEn)}.`,
      `- First frame: ${startState}`,
      ...(endState ? [`- Last frame: ${endState}`] : []),
      `- Action: ${action}`,
      `- Acting beat: ${acting || 'a clear, readable expression'}`,
      `- Intended expression: ${exSpec}.`,
      ...(facing ? [`- Screen direction: ${facing}.`] : []),
      ...(contact ? ['- Cut on action: the movement stops one step before the two bodies touch; contact itself is not required, and touching bodies must stay clearly separate.'] : []),
      `- Dialogue: ${d && speaker ? `${speaker.displayNameEn} speaks one short line (mouth movement expected)` : 'none'}`,
      `- Allowed effect: ${fxAllowed || 'none'}`,
      'Characters that must appear and stay on-model:',
      who,
      '',
      'SCORE EACH CRITERION 0-10 (10 = indistinguishable from a finished animated feature):',
      '- identityMatch: every character matches its design (shape, colours, signature accent) in every frame.',
      '- anatomyStable: limbs, digits, tails, eyes and proportions stay correct and consistent.',
      '- noMorphing: nothing melts, merges, or changes shape or size between frames.',
      `- faceReadable: ${isFace ? 'the face is sharp, well lit and its expression is clear.' : 'use null (this is not a close shot).'}`,
      '- actingVisible: the intended expression change is visible in the face or body.',
      '- compositionClear: one clear subject, readable silhouette, framing matches the intended shot size.',
      '- effectsRestraint: at most the allowed effect; clean, uncluttered frame.',
      '- motionQuality: plausible weight and motion between the frames, judged from the pose changes.',
      `- speakerCorrect: ${d && speaker ? `only ${speaker.displayNameEn}'s mouth moves as if speaking; every other character keeps the mouth still.` : 'use null (no dialogue in this shot).'}`,
      '',
      'HARD GATES (true = passed, false = failed). Check EVERY frame: a problem in a single frame fails the gate.',
      `- keyActionVisible: the scripted action (${action || 'the planned action'}) is clearly identifiable over several consecutive frames${contact ? ', up to the moment just before contact' : ''}.`,
      '- bodyIntact: no body turns translucent, melts, smears, or fuses with water, mud, steam, effects or another character.',
      `- expressionMatchesBeat: ${exSpec}.`,
      `- identityOnModel: each character matches its reference design: head shape, snout or face length relative to the head within about a fifth, markings, colours and signature accent${styled ? ', and it stays a stylised animated character instead of drifting toward a realistic animal' : ''}.`,
      `- facingCorrect: ${facing ? `${facing}, as planned` : 'screen direction stays consistent across the frames'}.`,
      '- cleanFrame: only the planned characters appear; no extra people, creatures, text, letters, logos or watermarks.',
      'BEAT TIMING: beat_in, beat_peak and beat_out are the times in seconds (read them from the frame times) where the scripted acting beat starts, is clearest and ends. Use null for all three if the beat never appears.',
      '',
      'artifacts: short tags for every visible problem, chosen from: plastic look, melting, translucent body, fused with effect, extra limbs, missing limbs, merged characters, text or subtitles, floating objects, wrong character, duplicated character, extra characters, flicker, blurry face, wrong species, realistic drift, wrong expression, wrong facing, wrong speaker. Use [] when the take is clean.',
      `overall: 0-100 holistic score. Calibrate strictly: a typical take with visible AI flaws scores 40-65; a usable take 66-79; 80-89 only for clean on-model takes with clear acting; 90 or more is rare. Text or subtitles in the frame, extra limbs, melting, merged or wrong characters cap overall at 50. Any failed hard gate caps overall at ${PREMIUM_JUDGE_GATE_FAIL_CAP}.`,
      `pass: true only if overall is at least ${PREMIUM_JUDGE_PASS_SCORE}, every hard gate is true and there is no severe artifact.`,
      '',
      'Reply with ONLY this JSON object (no markdown fences, no extra text), replacing every placeholder:',
      '{"identityMatch": <0-10>, "anatomyStable": <0-10>, "noMorphing": <0-10>, "faceReadable": <0-10 or null>, "actingVisible": <0-10>, "compositionClear": <0-10>, "effectsRestraint": <0-10>, "motionQuality": <0-10>, "speakerCorrect": <0-10 or null>, "hardGates": {"keyActionVisible": <true or false>, "bodyIntact": <true or false>, "expressionMatchesBeat": <true or false>, "identityOnModel": <true or false>, "facingCorrect": <true or false>, "cleanFrame": <true or false>}, "beat_in": <seconds or null>, "beat_peak": <seconds or null>, "beat_out": <seconds or null>, "artifacts": [<tags>], "overall": <0-100>, "pass": <true or false>, "note": "<one short sentence naming the biggest problem>"}',
    ].join('\n');
  }

  // ── Bản gọn cho Flow: cùng rubric, cổng cứng, beat_in/peak/out và JSON, trong ngân sách ký tự (rút văn bản cảnh theo mệnh đề).
  const budget = Number(params.maxChars) > 0 ? Math.max(1200, Math.round(Number(params.maxChars))) : PREMIUM_JUDGE_PROMPT_MAX_CHARS;
  const names = allChars.map((c) => c.displayNameEn);
  const styleName = styled ? `an animated short (${styleLabel(coerceStyle(params.style || 'pixar3d'))})` : 'a short film';
  const compose = (lv: { text: number; look: number; refsLong: boolean; tags: boolean; times: boolean; terse?: boolean }): string => {
    const clip = (t: string, max: number) => stripEnd(clampClauses(t, max, names));
    const refText =
      k > 0
        ? `Images 1-${k} are references, never scored (${refs.map((r, i) => `${i + 1} = ${lv.refsLong ? describeReferenceShort(r) : r}`).join('; ')}). Images ${k + 1}-${k + Math.max(1, n)} are frames of the take`
        : `The images are ${n || 'several'} frames of the take, in time order`;
    const timeText = n ? (lv.times ? ` at ${times.join(', ')}` : ` from ${times[0]} to ${times[n - 1]}`) : '';
    const who = cs.length
      ? cs
          .map((c) => {
            const stance = stanceDescription(c);
            return `${c.displayNameEn} (${c.species}): ${judgeLook(c, lv.look)}${stance ? `; ${stance}` : ''}.`;
          })
          .join(' ')
      : 'No named character; judge the setting and action only.';
    return [
      `You are a strict animation supervisor judging ONE AI video take of ${styleName}.`,
      `${refText}${timeText}.${durLine ? ` ${durLine}` : ''}`,
      `SHOT: ${SIZE_NAME_EN[shot.shotSize] || shot.shotSize}, camera ${cleanCameraMove(shot.cameraMoveEn)}. First frame: ${clip(startState, lv.text)}.${endState ? ` Last frame: ${clip(endState, lv.text)}.` : ''} Action: ${clip(action, lv.text)}. Acting beat: ${clip(acting, Math.min(lv.text, 16)) || 'a clear, readable expression'}. Expression: ${exSpec}.${facing ? ` Screen direction: ${facing}.` : ''}${contact ? ' Cut on action: it stops one step before the two bodies touch; touching bodies must stay separate.' : ''} Dialogue: ${d && speaker ? `${speaker.displayNameEn} speaks one short line` : 'none'}. Allowed effect: ${fxAllowed ? clip(fxAllowed, 10) : 'none'}.`,
      `CHARACTERS (must stay on-model): ${who}`,
      lv.terse
        ? `SCORE 0-10: identityMatch, anatomyStable, noMorphing, faceReadable (${isFace ? '0-10' : 'null'}), actingVisible, compositionClear, effectsRestraint, motionQuality, speakerCorrect (${d && speaker ? '0-10' : 'null'}).`
        : `SCORE 0-10: identityMatch, anatomyStable, noMorphing, faceReadable (${isFace ? 'face sharp and readable' : 'null, not a close shot'}), actingVisible, compositionClear, effectsRestraint, motionQuality, speakerCorrect (${d && speaker ? `only ${speaker.displayNameEn}'s mouth moves` : 'null, no dialogue'}).`,
      lv.terse
        ? `HARD GATES (true = passed; one bad frame fails it): keyActionVisible${contact ? ' (up to just before contact)' : ''}, bodyIntact (nothing translucent, melting or fused), expressionMatchesBeat, identityOnModel${styled ? ' (stays stylised)' : ''}, facingCorrect, cleanFrame (no extra people, text or logos).`
        : `HARD GATES (true = passed; one bad frame fails it): keyActionVisible = the action reads over several frames${contact ? ' up to just before contact' : ''}; bodyIntact = no body turns translucent, melts or fuses with water, mud, steam or another character; expressionMatchesBeat = the expression above; identityOnModel = head shape, snout length, markings and colours match the references${styled ? ', stylised, never a realistic animal' : ''}; facingCorrect = ${facing ? 'the screen direction above' : 'screen direction stays consistent'}; cleanFrame = only the planned characters, no people, text or logos.`,
      'beat_in, beat_peak, beat_out: seconds (from the frame times) where the acting beat starts, is clearest and ends; null if it never appears.',
      lv.tags
        ? 'artifacts: short tags such as melting, translucent body, fused with effect, extra limbs, merged characters, text, extra characters, realistic drift, wrong expression, wrong facing; [] if clean.'
        : 'artifacts: short problem tags, [] if clean.',
      lv.terse
        ? `overall 0-100, strict (usable 66-79); a failed gate caps it at ${PREMIUM_JUDGE_GATE_FAIL_CAP}. pass = overall >= ${PREMIUM_JUDGE_PASS_SCORE} and every gate true.`
        : `overall 0-100, strict (flawed 40-65, usable 66-79, 80+ only clean on-model takes with clear acting); text, melting or merged characters cap it at 50, a failed gate at ${PREMIUM_JUDGE_GATE_FAIL_CAP}. pass = overall >= ${PREMIUM_JUDGE_PASS_SCORE} and every gate true.`,
      'Reply with ONLY this JSON, no markdown: {"identityMatch":<0-10>,"anatomyStable":<0-10>,"noMorphing":<0-10>,"faceReadable":<0-10 or null>,"actingVisible":<0-10>,"compositionClear":<0-10>,"effectsRestraint":<0-10>,"motionQuality":<0-10>,"speakerCorrect":<0-10 or null>,"hardGates":{"keyActionVisible":<bool>,"bodyIntact":<bool>,"expressionMatchesBeat":<bool>,"identityOnModel":<bool>,"facingCorrect":<bool>,"cleanFrame":<bool>},"beat_in":<s or null>,"beat_peak":<s or null>,"beat_out":<s or null>,"artifacts":[<tags>],"overall":<0-100>,"pass":<bool>,"note":"<one short sentence>"}',
    ].join('\n');
  };
  const levels = [
    { text: 30, look: 34, refsLong: true, tags: true, times: true },
    { text: 26, look: 26, refsLong: true, tags: true, times: true },
    { text: 22, look: 20, refsLong: true, tags: true, times: true },
    { text: 18, look: 16, refsLong: true, tags: false, times: true },
    { text: 14, look: 12, refsLong: false, tags: false, times: true },
    { text: 10, look: 10, refsLong: false, tags: false, times: false },
    { text: 14, look: 12, refsLong: false, tags: false, times: true, terse: true },
    { text: 10, look: 10, refsLong: false, tags: false, times: false, terse: true },
    { text: 6, look: 8, refsLong: false, tags: false, times: false, terse: true },
  ];
  let text = '';
  for (const lv of levels) {
    text = compose(lv);
    if (text.length <= budget) return text;
  }
  return text;
}

const JUDGE_SCORE_KEYS = [
  'identityMatch',
  'anatomyStable',
  'noMorphing',
  'faceReadable',
  'actingVisible',
  'compositionClear',
  'effectsRestraint',
  'motionQuality',
  'speakerCorrect',
];
/** Tiêu chí bắt buộc: dưới 6/10 là hỏng take dù điểm tổng cao. */
const JUDGE_HARD_KEYS = ['identityMatch', 'anatomyStable', 'noMorphing', 'speakerCorrect'];
const JUDGE_HARD_MIN = 6;
const MIN_RUBRIC_SCORES = 5;
// Có ranh giới từ: "plastic texture" không phải "text".
const SEVERE_ARTIFACT_RE =
  /\b(?:text|subtitles?|captions?|letters|lettering|watermarks?)\b|\bextra (?:limbs?|legs?|arms?|heads?|characters?|creatures?|people|persons?)\b|\bmissing (?:limbs?|legs?|arms?)\b|\bmelt(?:ing|s|ed)?\b|\bmerg(?:ed|ing|es)\b|\bwrong (?:character|species|speaker)\b|\bduplicat\w*|\bsee-?through\b|\btranslucent body\b|\bfus(?:ed|ing|es)\b/i;
const FACE_SEVERE_ARTIFACT_RE = /\bblurr?y face\b|\bface (?:blur|smear)\w*/i;

const GATE_ALIASES: Record<PremiumJudgeHardGate, string[]> = {
  keyActionVisible: ['keyActionVisible', 'keyAction', 'actionVisible', 'key_action_visible', 'key_action', 'contactVisible'],
  bodyIntact: ['bodyIntact', 'bodyIntegrity', 'body_intact', 'noMelting', 'noSeeThrough'],
  expressionMatchesBeat: ['expressionMatchesBeat', 'expressionMatch', 'expression', 'expression_matches_beat'],
  identityOnModel: ['identityOnModel', 'identity', 'identityVsSheet', 'onModel', 'identity_on_model'],
  facingCorrect: ['facingCorrect', 'facing', 'facingDirection', 'screenDirection', 'facing_correct'],
  cleanFrame: ['cleanFrame', 'noExtras', 'noExtraCharactersOrText', 'clean_frame'],
};

/**
 * Ghi chú của chính giám khảo nói hành động chính bị thiếu / bị che ("tail sweep obscured") -> trượt cổng keyActionVisible.
 * Từ "thiếu / bị che" phải gắn THẲNG vào từ chỉ hành động (chỉ cho phép trợ động từ + trạng từ ở giữa): "the bite lands but the
 * splash is hidden" hay "the roar reads clearly but the steam is missing" là chê yếu tố phụ, không phải mất hành động.
 */
const NOTE_ACTION_WORDS = 'action|sweep|swipe|hit|headbutt|roar|lunge|bite|snap|charge|strike|kick|fall|tumble|stamp|beat';
const NOTE_MISSING_WORDS = '(?:missing|absent|obscured|hidden|unclear|unreadable|invisible|(?:not|barely|hardly) (?:visible|shown|readable|clear)|never (?:happens|shown|visible|reads|lands))';
const NOTE_ACTION_MISSING_RE = new RegExp(
  String.raw`\b(?:${NOTE_ACTION_WORDS})(?:e?s)?\b(?:\s+(?:itself|motion|move|movement|moment))?\s+(?:(?:is|was|are|were|gets|got|looks|seems|remains|stays|appears|reads as)\s+)?(?:(?:\w+ly|almost|mostly|completely|entirely|partly|largely|totally|still)\s+)?${NOTE_MISSING_WORDS}\b` +
    String.raw`|\b(?:missing|absent|no visible|lacks?(?: the| a| any)?|without (?:the |a |any )?)\s+(?:(?!(?:steam|splash\w*|spray|mud|water|mist|smoke|dust|fog|droplets?)\b)\w+\s+){0,2}?(?:${NOTE_ACTION_WORDS})\b`,
  'i'
);
/** "nothing hidden" / "none missing" là lời khen, không phải lời chê. */
function noteSaysActionMissing(note: string): boolean {
  const t = String(note || '').replace(/\b(?:nothing|none|no part)\s+(?:is\s+|was\s+)?(?:missing|absent|obscured|hidden|unclear)\b/gi, '');
  return NOTE_ACTION_MISSING_RE.test(t);
}

/** Đọc một cổng: true/false, "pass"/"fail", 0/1, điểm 0-10 (>= 6 là đạt) hoặc { pass: ... }. Không đọc được -> null. */
function toGate(v: any): boolean | null {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return v <= 1 ? v >= 1 : v >= JUDGE_HARD_MIN;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (/^(?:true|yes|pass(?:ed)?|ok|y)\b/.test(s)) return true;
    if (/^(?:false|no|fail(?:ed)?|n)\b/.test(s)) return false;
    const n = toScore(s);
    return n === null ? null : toGate(n);
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) return toGate(v.pass ?? v.passed ?? v.ok ?? v.value ?? v.result);
  return null;
}

function toSeconds(v: any): number | null {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null;
  const n = typeof v === 'number' ? v : toScore(v);
  return n !== null && Number.isFinite(n) && n >= 0 ? n : null;
}

function toScore(v: any): number | null {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null;
  // Lấy số ĐẦU TIÊN: "7 out of 10" -> 7, "85/100" -> 85; chuỗi không có số ("great") -> null, không phải 0.
  const m = typeof v === 'number' ? null : /[-+]?\d+(?:\.\d+)?/.exec(String(v));
  const n = typeof v === 'number' ? v : m ? Number(m[0]) : NaN;
  return Number.isFinite(n) ? n : null;
}

/**
 * Đọc phán quyết của giám khảo. Lỗi phân tích hoặc thiếu rubric (< 5 tiêu chí có điểm) -> null (fail closed, KHÔNG BAO GIỜ
 * mặc định điểm cao). Điểm tổng không được vượt trung bình rubric quá 10 điểm; tiêu chí bắt buộc < 6 hoặc lỗi nặng -> trượt.
 * opts.faceShot: cảnh cận mặt (faceReadable < 6 / "blurry face" là lỗi nặng); không truyền thì suy ra từ việc có điểm faceReadable.
 * L7: cổng cứng (hardGates) — khi giám khảo trả cổng (hoặc opts.requireHardGates), cổng thiếu / không đọc được tính là TRƯỢT;
 * trượt bất kỳ cổng nào -> pass=false, overall <= 55. Ghi chú nói hành động chính bị thiếu / bị che -> trượt keyActionVisible.
 * beat_in / beat_peak / beat_out -> beatInSec / beatPeakSec / beatOutSec (giây, sắp đúng thứ tự, kẹp trong opts.durationSec).
 */
export function parseJudgeVerdict(
  text: string,
  opts: { faceShot?: boolean; requireHardGates?: boolean; durationSec?: number } = {}
): PremiumJudgeVerdict | null {
  try {
    const obj = typeof text === 'object' && text ? (text as any) : parseJsonLoose(String(text ?? ''));
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
    const src = obj.verdict && typeof obj.verdict === 'object' ? obj.verdict : obj;
    const scoreSrc = src.scores && typeof src.scores === 'object' ? { ...src, ...src.scores } : src;

    const scores: Record<string, number> = {};
    for (const k of JUDGE_SCORE_KEYS) {
      const v = toScore(scoreSrc[k]);
      if (v !== null) scores[k] = Math.max(0, Math.min(10, v));
    }
    const rubric = Object.values(scores);
    if (rubric.length < MIN_RUBRIC_SCORES) return null;
    const mean = rubric.reduce((a, b) => a + b, 0) / rubric.length;
    let overall = toScore(src.overall ?? src.overallScore ?? src.score);
    if (overall === null) {
      overall = mean * 10;
    } else if (overall > 0 && overall <= 10 && Math.abs(overall - mean) <= 2) {
      overall *= 10;
    }
    // Điểm tổng mâu thuẫn với rubric (rubric 2-3/10 mà overall 88) -> tin rubric.
    overall = Math.min(overall, mean * 10 + 10);
    overall = Math.max(0, Math.min(100, Math.round(overall)));

    const rawArt = src.artifacts;
    const artifacts = (Array.isArray(rawArt) ? rawArt : typeof rawArt === 'string' ? rawArt.split(/[,;]/) : [])
      .map((a: any) => squash(str(a)).toLowerCase())
      .filter((a: string) => a && !/^(none|n\/a|na|clean|-)$/.test(a));
    const faceShot = typeof opts.faceShot === 'boolean' ? opts.faceShot : 'faceReadable' in scores;
    const severe = artifacts.some((a: string) => SEVERE_ARTIFACT_RE.test(a) || (faceShot && FACE_SEVERE_ARTIFACT_RE.test(a)));
    if (severe) overall = Math.min(overall, 50);
    const hardFail =
      JUDGE_HARD_KEYS.some((k) => k in scores && scores[k] < JUDGE_HARD_MIN) ||
      (faceShot && 'faceReadable' in scores && scores.faceReadable < JUDGE_HARD_MIN);
    const judgePass =
      typeof src.pass === 'boolean' ? src.pass : typeof src.pass === 'string' ? /^(?:true|yes)$/i.test(src.pass.trim()) : true;
    const note = clampWords(squash(str(src.note ?? src.reason ?? src.comment)), 40);

    // Cổng cứng (L7): object hardGates/gates hoặc khoá cổng ở cấp trên cùng.
    const gateObj = [src.hardGates, src.hard_gates, src.gates].find((g) => g && typeof g === 'object' && !Array.isArray(g)) || null;
    const lookup = (gate: PremiumJudgeHardGate): { found: boolean; value: any } => {
      for (const where of [gateObj, src]) {
        if (!where) continue;
        for (const key of GATE_ALIASES[gate]) {
          if (where === src && !/[A-Z_]/.test(key.slice(1))) continue; // khoá chung chung ("identity", "expression") chỉ đọc trong object cổng
          if (Object.prototype.hasOwnProperty.call(where, key)) return { found: true, value: where[key] };
        }
      }
      return { found: false, value: undefined };
    };
    const lookups = PREMIUM_JUDGE_HARD_GATES.map((g) => ({ g, ...lookup(g) }));
    const gatesPresent = !!gateObj || lookups.some((x) => x.found) || !!opts.requireHardGates;
    let hardGates: Record<string, boolean> | undefined;
    const failedGates: string[] = [];
    if (gatesPresent) {
      hardGates = {};
      for (const { g, value } of lookups) {
        const ok = toGate(value) === true; // thiếu / không đọc được -> trượt (fail closed)
        hardGates[g] = ok;
        if (!ok) failedGates.push(g);
      }
    }
    if (note && noteSaysActionMissing(note) && !failedGates.includes('keyActionVisible')) {
      failedGates.push('keyActionVisible');
      if (hardGates) hardGates.keyActionVisible = false;
      else hardGates = { keyActionVisible: false };
    }
    if (failedGates.length) overall = Math.min(overall, PREMIUM_JUDGE_GATE_FAIL_CAP);

    // Nhịp diễn (giây) cho bộ chọn cửa sổ dựng (L8).
    const dur = Number(opts.durationSec) > 0 ? Number(opts.durationSec) : null;
    const beatSrc = src.beat && typeof src.beat === 'object' ? src.beat : {};
    const clampT = (t: number | null) => (t === null ? null : Math.round(Math.max(0, dur ? Math.min(dur, t) : t) * 1000) / 1000);
    let bIn = clampT(toSeconds(src.beat_in ?? src.beatIn ?? src.beatInSec ?? beatSrc.in ?? beatSrc.inSec));
    let bPeak = clampT(toSeconds(src.beat_peak ?? src.beatPeak ?? src.beatPeakSec ?? beatSrc.peak ?? beatSrc.peakSec));
    let bOut = clampT(toSeconds(src.beat_out ?? src.beatOut ?? src.beatOutSec ?? beatSrc.out ?? beatSrc.outSec));
    if (bIn !== null && bOut !== null && bIn > bOut) [bIn, bOut] = [bOut, bIn];
    if (bPeak === null && bIn !== null && bOut !== null) bPeak = Math.round(((bIn + bOut) / 2) * 1000) / 1000;
    if (bPeak !== null && bIn !== null && bPeak < bIn) bPeak = bIn;
    if (bPeak !== null && bOut !== null && bPeak > bOut) bPeak = bOut;

    return {
      overall,
      scores,
      artifacts,
      pass: judgePass && !severe && !hardFail && !failedGates.length && overall >= PREMIUM_JUDGE_PASS_SCORE,
      note,
      ...(hardGates ? { hardGates } : {}),
      failedGates,
      beatInSec: bIn,
      beatPeakSec: bPeak,
      beatOutSec: bOut,
    };
  } catch {
    return null;
  }
}

/** Chọn take tốt nhất: điểm overall cao nhất; take không có phán quyết xếp cuối; hòa -> take sớm hơn. */
export function pickBestTake<T extends { verdict: ReturnType<typeof parseJudgeVerdict> }>(takes: T[]): { best: T; index: number } {
  const list = Array.isArray(takes) ? takes : [];
  if (!list.length) return { best: undefined as unknown as T, index: -1 };
  let bestIdx = 0;
  const rank = (t: T) => (t && t.verdict && Number.isFinite(t.verdict.overall) ? t.verdict.overall : -1);
  for (let i = 1; i < list.length; i++) {
    if (rank(list[i]) > rank(list[bestIdx])) bestIdx = i;
  }
  return { best: list[bestIdx], index: bestIdx };
}

// ───────────────────────────── Legacy bridge & credits ─────────────────────────────

const COVERAGE_BY_SIZE: Record<PremiumShotSize, string> = {
  EWS: 'MASTER_ESTABLISHING',
  WS: 'MASTER_ESTABLISHING',
  MS: 'LOW_ANGLE_HERO_APEX',
  MCU: 'KULESHOV_REACTION',
  CU: 'KULESHOV_REACTION',
  ECU: 'KULESHOV_REACTION',
  OTS: 'OTS_CONFRONTATION',
  INSERT: 'INSERT_DETAIL_CUTAWAY',
  POV: 'POV_SUBJECTIVE',
};

const TENSION_BY_BEAT: Record<PremiumBeat, string> = {
  setup: 'OMINOUS_SILENCE',
  inciting: 'RISING_PRESSURE',
  escalation: 'RISING_PRESSURE',
  reversal: 'VULNERABILITY_LOW_POINT',
  climax: 'VISCERAL_CLASH',
  resolution: 'RESONANT_AFTERMATH',
};

/** Ánh xạ sang các trường mà code cũ (Stage 3-7) đang đọc, kèm `premium: shot` cho đường mới. */
export function toLegacyShotFields(shot: PremiumShot, bible: PremiumStoryBible): Record<string, any> {
  const chars = bible?.characters || [];
  const idMap = buildIdMap(chars, bible?.environment);
  const speaker = shot.dialogue ? chars.find((c) => c.id === shot.dialogue!.speaker) : undefined;
  return {
    shotNumber: shot.shotNumber,
    titleVi: shot.titleVi,
    subtitleVi: shot.dialogue?.lineVi || '',
    actionPromptEn: sentence(cleanEn(shot.actionEn, idMap)),
    macroPhase:
      shot.beat === 'setup' || shot.beat === 'inciting'
        ? 'PRE_MAIN_BUILDUP'
        : shot.beat === 'resolution'
        ? 'POST_MAIN_AFTERMATH'
        : 'MAIN_CLIMAX_CONFLICT',
    coverageType: COVERAGE_BY_SIZE[shot.shotSize] || 'MASTER_ESTABLISHING',
    durationSeconds: shot.durationSeconds,
    hasChar1: shot.characters.includes('char1'),
    hasChar2: shot.characters.includes('char2'),
    beat: shot.beat,
    shotSize: shot.shotSize,
    cameraAngle: cap(SIZE_NAME_EN[shot.shotSize] || 'medium shot'),
    emotionalTensionMode: TENSION_BY_BEAT[shot.beat] || 'RISING_PRESSURE',
    entryStateEn: shot.startStateEn,
    mainActionBeatEn: shot.actionEn,
    dialogueEn: shot.dialogue?.lineEn || '',
    dialogueVi: shot.dialogue?.lineVi || '',
    dialogueSpeaker: speaker?.displayNameEn || '',
    narrationVi: shot.narrationVi || '',
    sfxEn: shot.sfxEn,
    ambientNoiseEn: shot.ambientEn,
    skillUsed: '',
    isDnaStateShift: false,
    premium: shot,
  };
}

export const PREMIUM_MODEL_CREDITS: Record<string, number> = {
  'Veo 3.1 - Lite': 5,
  'Veo 3.1 - Fast': 10,
  'Veo 3.1 - Quality': 100,
};

/** Credits Flow (gói Ultra) cho một lần tạo video theo tên model hiển thị; ảnh Nano Banana = 0. */
export function creditsPerGeneration(model: string): number {
  const m = String(model || '').toLowerCase();
  if (/lower priority/.test(m)) return 0;
  if (/quality/.test(m)) return 100;
  if (/fast/.test(m)) return 10;
  if (/lite/.test(m)) return 5;
  if (/omni/.test(m)) return 15;
  if (/veo/.test(m)) return 10;
  return 0;
}

export function estimateCredits(params: { shots: number; takes: number; model: string }): number {
  const shots = Math.max(0, Math.round(Number(params?.shots) || 0));
  const takes = Math.max(0, Math.round(Number(params?.takes) || 0));
  return shots * takes * creditsPerGeneration(params?.model);
}
