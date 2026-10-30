/**
 * 🎬 HYPERION STUDIO — PREMIUM SHOT PRODUCTION (Giai đoạn 3-5 của đường premium)
 *
 * Logic thuần (không I/O, không gọi Flow) để pipeline dùng và để kiểm thử độc lập:
 *   - Giai đoạn 3: chọn ảnh tham chiếu cho từng cảnh (sheet nhân vật + bảng biểu cảm cho cận mặt + ảnh nền bối cảnh),
 *     giám khảo khung hình đầu theo cỡ cảnh / số nhân vật / phong cách, câu sửa lỗi dạng khẳng định, giữ bản điểm cao nhất.
 *   - Giai đoạn 4-5: yêu cầu Veo image-to-video, thời điểm trích khung để chấm, kế hoạch quay N bản khi resume,
 *     giám khảo có ảnh tham chiếu nhận diện, chọn bản tốt nhất (không bao giờ tự cho điểm khi thiếu phán quyết).
 *   - Báo cáo 00B: kết quả lintPremiumPrompt thật trên prompt cuối cùng.
 *   - Bài học render thật (dino_premium_v2, Veo 3.1 Quality):
 *     L1 khung CUỐI = SỬA khung đầu bằng Nano Banana Pro (ảnh tham chiếu [khung đầu, sheet từng nhân vật], tối đa 3) + giám khảo khung cuối;
 *     Veo nhận khung đầu + khung cuối, lỗi tạm thời vẫn GIỮ khung cuối (chỉ bỏ khi lỗi nhắc tới khung hình / ảnh / không hỗ trợ);
 *     L7 giám khảo xem khung dày (>= 10 + khung đầu/cuối) cùng khung đầu/cuối + sheet làm tham chiếu, cổng cứng, beat_in/peak/out;
 *     L9 nền ambience: một clip Veo không nhân vật từ ảnh nền bối cảnh, prompt chỉ có âm thanh môi trường.
 */
import {
  STYLE_PRESETS,
  PREMIUM_JUDGE_PASS_SCORE,
  isFaceShotSize,
  countWords,
  pickBestTake,
  buildTakeJudgePrompt,
} from './premiumPromptEngine.ts';
import type {
  PremiumCharId,
  PremiumCharacter,
  PremiumEnvironment,
  PremiumJudgeVerdict,
  PremiumLintReport,
  PremiumShot,
  PremiumShotSize,
  PremiumStyleKey,
} from './premiumPromptEngine.ts';

// ───────────────────────────── Stage 3: reference images ─────────────────────────────

export interface PremiumRefAsset {
  mediaId: string;
  base64?: string;
  mimeType?: string;
}

export interface PremiumCharacterRefs {
  character: PremiumCharacter;
  sheet?: PremiumRefAsset | null;
  expression?: PremiumRefAsset | null;
}

export interface PremiumShotReferencePlan {
  /** mediaId theo đúng thứ tự gửi cho Nano Banana Pro. */
  mediaIds: string[];
  /** Nhãn song song với mediaIds ('char1 sheet', 'char1 expressions', 'environment plate') → buildKeyframePrompt.referenceOrder. */
  order: string[];
  /** Ảnh thiết kế (sheet xoay) của nhân vật trong cảnh cho giám khảo — luôn đứng TRƯỚC ảnh cần chấm. */
  judgeImages: Array<{ label: string; base64: string; mimeType: string }>;
}

/** mediaId dùng được với Flow: 'cached_*' là mã giả của chế độ offline, '' là thiếu tài sản. */
export function isUsableMediaId(id: any): boolean {
  return typeof id === 'string' && id.trim() !== '' && !id.startsWith('cached_');
}

/** Nhân vật mà khung hình "kể": OTS -> người quay mặt về máy (nhân vật thứ hai), còn lại -> nhân vật đầu tiên. */
export function focusCharacterId(shot: PremiumShot): PremiumCharId | null {
  const ids = Array.isArray(shot?.characters) ? shot.characters : [];
  if (shot?.shotSize === 'OTS' && ids.length >= 2) return ids[1];
  return ids[0] || null;
}

/**
 * Ảnh tham chiếu cho khung đầu: sheet xoay của từng nhân vật có mặt, thêm bảng biểu cảm của nhân vật chính khi cảnh cận mặt
 * (CU/MCU/ECU), cuối cùng là ảnh nền bối cảnh. Tối đa maxReferences (mặc định 4; bỏ bảng biểu cảm trước khi bỏ ảnh nền).
 */
export function planShotReferences(params: {
  shot: PremiumShot;
  characters: PremiumCharacterRefs[];
  environment?: PremiumRefAsset | null;
  maxReferences?: number;
}): PremiumShotReferencePlan {
  const shot = params.shot;
  const max = Math.max(1, Math.round(params.maxReferences || 4));
  const inShot = charactersInShot(shot, params.characters);

  const sheets: Array<{ id: string; label: string }> = [];
  for (const r of inShot) {
    if (r.sheet && isUsableMediaId(r.sheet.mediaId)) sheets.push({ id: r.sheet.mediaId, label: `${r.character.id} sheet` });
  }
  let expression: { id: string; label: string } | null = null;
  if (isFaceShotSize(shot?.shotSize)) {
    const focusId = focusCharacterId(shot);
    const f = inShot.find((r) => r.character.id === focusId);
    if (f?.expression && isUsableMediaId(f.expression.mediaId)) expression = { id: f.expression.mediaId, label: `${f.character.id} expressions` };
  }
  const env = params.environment && isUsableMediaId(params.environment.mediaId) ? { id: params.environment.mediaId, label: 'environment plate' } : null;

  let picked = [...sheets, ...(expression ? [expression] : []), ...(env ? [env] : [])];
  if (picked.length > max && expression) picked = picked.filter((p) => p !== expression);
  if (picked.length > max) {
    const keepEnv = env && max >= 2;
    picked = [...sheets.slice(0, keepEnv ? max - 1 : max), ...(keepEnv ? [env] : [])];
  }

  return { mediaIds: picked.map((p) => p.id), order: picked.map((p) => p.label), judgeImages: sheetJudgeImages(inShot) };
}

/** Nhân vật có mặt trong cảnh theo đúng thứ tự shot.characters (bỏ trùng, bỏ id không có hồ sơ). */
function charactersInShot(shot: PremiumShot, characters: PremiumCharacterRefs[]): PremiumCharacterRefs[] {
  const refs = (characters || []).filter((r) => r && r.character);
  const inShot: PremiumCharacterRefs[] = [];
  for (const id of shot?.characters || []) {
    const r = refs.find((x) => x.character.id === id);
    if (r && !inShot.includes(r)) inShot.push(r);
  }
  return inShot;
}

function sheetLabel(c: PremiumCharacter): string {
  return `${c.displayNameEn} (${c.species}) turnaround sheet`;
}

/** Sheet thiết kế (base64) của tối đa 2 nhân vật trong cảnh — tham chiếu nhận diện cho giám khảo. */
function sheetJudgeImages(inShot: PremiumCharacterRefs[]): Array<{ label: string; base64: string; mimeType: string }> {
  const out: Array<{ label: string; base64: string; mimeType: string }> = [];
  for (const r of inShot.slice(0, 2)) {
    if (r.sheet?.base64) out.push({ label: sheetLabel(r.character), base64: r.sheet.base64, mimeType: r.sheet.mimeType || 'image/png' });
  }
  return out;
}

// ───────────────────────────── Stage 3: end keyframe = edit of the start keyframe (L1) ─────────────────────────────

/** Nano Banana Pro nhận tối đa 3 ảnh tham chiếu cho lệnh sửa khung cuối: [khung đầu, sheet nhân vật thứ nhất, sheet thứ hai]. */
export const END_FRAME_MAX_REFERENCES = 3;

export interface PremiumEndFrameReferencePlan {
  /** mediaId theo đúng thứ tự gửi cho Nano Banana Pro: khung đầu rồi sheet từng nhân vật trong cảnh (tối đa 3). */
  mediaIds: string[];
  /** Nhãn song song ('start keyframe', 'char1 sheet', 'char2 sheet') → buildEndFrameEditPrompt.referenceOrder. */
  order: string[];
  /** false khi khung đầu chưa có mediaId dùng được → không sửa được ảnh (không vẽ khung cuối). */
  usable: boolean;
  /** Nhân vật trong cảnh mà sheet không vào được ảnh tham chiếu (L1: thiếu sheet → nhân vật đổi màu) — để cảnh báo. */
  missingSheets: PremiumCharId[];
  /** Ảnh cho giám khảo khung cuối: sheet nhân vật (tối đa 2) rồi khung đầu; ảnh cần chấm luôn đứng SAU CÙNG. */
  judgeImages: Array<{ label: string; base64: string; mimeType: string }>;
}

/**
 * L1: khung cuối dựng bằng cách SỬA khung đầu. Ảnh tham chiếu = [khung đầu, sheet của TỪNG nhân vật trong cảnh], tối đa 3
 * (bỏ sheet nào thì nhân vật đó dễ đổi màu → ghi vào missingSheets). Khung đầu không có mediaId dùng được → usable=false.
 */
export function planEndFrameReferences(params: {
  shot: PremiumShot;
  characters: PremiumCharacterRefs[];
  startFrame: PremiumRefAsset | null | undefined;
  maxReferences?: number;
}): PremiumEndFrameReferencePlan {
  const max = Math.max(1, Math.min(END_FRAME_MAX_REFERENCES, Math.round(Number(params.maxReferences) || END_FRAME_MAX_REFERENCES)));
  const inShot = charactersInShot(params.shot, params.characters);
  const start = params.startFrame && isUsableMediaId(params.startFrame.mediaId) ? params.startFrame : null;
  const mediaIds: string[] = [];
  const order: string[] = [];
  const missingSheets: PremiumCharId[] = [];
  if (start) {
    mediaIds.push(start.mediaId);
    order.push('start keyframe');
  }
  for (const r of inShot) {
    if (r.sheet && isUsableMediaId(r.sheet.mediaId) && mediaIds.length < max) {
      mediaIds.push(r.sheet.mediaId);
      order.push(`${r.character.id} sheet`);
    } else {
      missingSheets.push(r.character.id);
    }
  }
  const judgeImages = sheetJudgeImages(inShot);
  if (params.startFrame?.base64) {
    judgeImages.push({ label: 'start keyframe of this shot', base64: params.startFrame.base64, mimeType: params.startFrame.mimeType || 'image/png' });
  }
  return { mediaIds, order, usable: Boolean(start), missingSheets, judgeImages };
}

// ───────────────────────────── Stage 3: keyframe gatekeeper ─────────────────────────────

export const KEYFRAME_GATE_FLAGS = [
  'hasTextOrBorders',
  'designMismatch',
  'anatomyDefect',
  'styleMismatch',
  'wrongFraming',
  'wrongCharacterCount',
  'effectsOverload',
  'faceUnreadable',
];

export interface PremiumGateVerdict {
  score: number;
  pass: boolean;
  failed: string[];
  critique: string;
  fixInstruction: string;
}

const SIZE_WORDS: Record<PremiumShotSize, string> = {
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

const FRAMING_EXPECTATION: Record<PremiumShotSize, string> = {
  EWS: 'the characters are small inside a vast, readable landscape',
  WS: 'full bodies are visible with clear surroundings and geography',
  MS: 'the character is framed from roughly mid-body up, filling about half the frame height',
  MCU: 'head and shoulders fill the frame',
  CU: 'the face fills most of the frame',
  ECU: 'one facial detail, such as the eyes, fills the frame',
  OTS: 'seen over one character\'s shoulder in the foreground toward the other character, who faces the camera',
  INSERT: 'a tight detail of a hand, paw, claw or prop fills the frame',
  POV: 'the view through a character\'s own eyes',
};

const FRAMING_FIX: Record<PremiumShotSize, string> = {
  EWS: 'A vast extreme wide view where the characters read as small figures in the landscape.',
  WS: 'A wide shot showing full bodies with clear surroundings.',
  MS: 'A medium shot framed from mid-body up.',
  MCU: 'A medium close-up where head and shoulders fill the frame.',
  CU: 'A tight close-up where the face fills most of the frame.',
  ECU: 'An extreme close-up where the eyes fill the frame.',
  OTS: 'Over the shoulder of the foreground character, looking toward the other character, who faces the camera.',
  INSERT: 'A tight insert detail that fills the frame.',
  POV: 'A first-person view through the character\'s own eyes.',
};

function sizeOf(shot: PremiumShot): PremiumShotSize {
  return (shot?.shotSize && shot.shotSize in SIZE_WORDS ? shot.shotSize : 'MS') as PremiumShotSize;
}

function shotCast(shot: PremiumShot, characters: PremiumCharacter[]): PremiumCharacter[] {
  const out: PremiumCharacter[] = [];
  for (const id of shot?.characters || []) {
    const c = (characters || []).find((x) => x && x.id === id);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

function oneLine(text: any): string {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Trần ký tự cho prompt giám khảo khung đầu / khung cuối gửi Flow kèm ảnh (Flow từ chối prompt có ảnh dài hơn ~4.000 ký tự).
 * Bản đầy đủ của giám khảo khung cuối từng dài 3.340-3.971 ký tự với 3-4 ảnh PNG -> sát ngưỡng.
 */
export const PREMIUM_GATE_PROMPT_MAX_CHARS = 3300;

/** Rút gọn mô tả cho giám khảo: tối đa n chữ, ưu tiên cắt ở dấu phẩy cuối cùng trong ngân sách. */
function clipWords(text: string, n: number): string {
  const t = oneLine(text);
  const w = t.split(' ').filter(Boolean);
  if (!n || w.length <= n) return t;
  const head = w.slice(0, n).join(' ');
  const comma = head.lastIndexOf(',');
  const cut = comma > head.length * 0.5 ? head.slice(0, comma) : head;
  return cut.replace(/[\s,;:—–-]+$/, '').replace(/\s+(?:and|or|with|of|the|a|an|to|in|on|at|its|his|her|their)$/i, '');
}

interface GateLevel {
  shortStyle: boolean;
  look: number;
  text: number;
  /** Mô tả cờ rút gọn (cùng tên cờ, cùng JSON). */
  terse?: boolean;
}
const GATE_LEVELS: GateLevel[] = [
  { shortStyle: false, look: 0, text: 0 },
  { shortStyle: true, look: 28, text: 30 },
  { shortStyle: true, look: 18, text: 22 },
  { shortStyle: true, look: 18, text: 22, terse: true },
  { shortStyle: true, look: 12, text: 16, terse: true },
];

/** Mô tả cờ gọn cho giám khảo khung đầu / khung cuối khi prompt vượt ngân sách ký tự (cùng tên cờ, cùng JSON). */
function terseFlagLines(size: PremiumShotSize, castCount: number, allowedFx: string, isFace: boolean, focusName: string, firstFrame: string, endGate: boolean): string[] {
  return [
    '- hasTextOrBorders: letters, captions, logos, watermarks, borders, split panels or letterbox bars.',
    "- designMismatch: species, shape, proportions, snout or face length, colours or markings differ from the reference.",
    '- anatomyDefect: extra, missing, fused or melted limbs, digits, eyes or tails.',
    '- styleMismatch: misses the target style (photo-like, plastic or realistic animal).',
    `- wrongFraming: clearly not a ${SIZE_WORDS[size]}${endGate ? `, or different from ${firstFrame}` : ''}.`,
    `- wrongCharacterCount: a required character missing or duplicated, or any extra creature or person${castCount ? '' : ' (frame must be empty)'}.`,
    `- effectsOverload: ${allowedFx === 'none' ? 'any big effect (fire, lava, lightning, sparks, water jets) or clutter' : 'more than the allowed effect, water jets or clutter'}.`,
    isFace ? `- faceUnreadable: ${focusName ? `${focusName}'s` : 'the'} face is blurred, hidden or unreadable.` : '- faceUnreadable: always false for this framing.',
    ...(endGate
      ? [
          `- sceneDrift: set, light, colours, camera, lens, scale or positions differ from ${firstFrame} beyond the pose.`,
          '- wrongExpression: the face misses the intended expression (a grin in a serious, fearful, dazed or merciful beat).',
        ]
      : []),
  ];
}

function refPreamble(labels: string[], subject: string): string {
  if (!labels.length) return '';
  if (labels.length === 1) return `Image 1 is the approved design reference (${labels[0]}). ${subject}`;
  const list = labels.map((l, i) => `image ${i + 1}: ${l}`).join('; ');
  return `Images 1-${labels.length} are approved design references (${list}). ${subject}`;
}

/** Giám khảo khung đầu (Gemini vision): ảnh tham chiếu (nếu có) đứng trước, ảnh cần chấm đứng CUỐI. JSON nghiêm ngặt, không neo điểm mẫu. */
export function buildKeyframeGatePrompt(params: {
  style: PremiumStyleKey;
  shot: PremiumShot;
  characters: PremiumCharacter[];
  referenceLabels?: string[];
  /** Trần ký tự (tuỳ chọn, ví dụ PREMIUM_GATE_PROMPT_MAX_CHARS): vượt -> câu phong cách ngắn + rút mô tả nhân vật / trạng thái. */
  maxChars?: number;
}): string {
  const max = Number(params.maxChars) > 0 ? Number(params.maxChars) : 0;
  let text = '';
  for (const lv of max ? GATE_LEVELS : GATE_LEVELS.slice(0, 1)) {
    text = composeKeyframeGate(params, lv);
    if (!max || text.length <= max) return text;
  }
  return text;
}

function composeKeyframeGate(
  params: { style: PremiumStyleKey; shot: PremiumShot; characters: PremiumCharacter[]; referenceLabels?: string[] },
  lv: GateLevel
): string {
  const p = STYLE_PRESETS[params.style] || STYLE_PRESETS.pixar3d;
  const shot = params.shot;
  const size = sizeOf(shot);
  const cast = shotCast(shot, params.characters);
  const labels = (params.referenceLabels || []).filter(Boolean);
  const isFace = isFaceShotSize(size);
  const focusId = focusCharacterId(shot);
  const focus = cast.find((c) => c.id === focusId) || cast[0];
  const allowedFx = shot?.fxLevel > 0 && oneLine(shot.fxEn) ? oneLine(shot.fxEn) : 'none';
  const who = cast.length
    ? cast.map((c) => `- ${c.displayNameEn}, a ${oneLine(c.species)}: ${clipWords(c.lookEn, lv.look)}`).join('\n')
    : '- No character: the frame shows the setting or a prop only.';
  const lines = [
    'You are a strict animation layout supervisor approving the FIRST FRAME of one shot before it is animated.',
    `Target style: ${lv.shortStyle ? p.shortStyleEn : p.styleSentenceEn}`,
    `Intended framing: ${SIZE_WORDS[size]} — ${FRAMING_EXPECTATION[size]}.`,
    `Start of the shot: ${clipWords(oneLine(shot?.startStateEn) || oneLine(shot?.actionEn), lv.text)}`,
    `Allowed effect: ${allowedFx}`,
    `Characters that must appear (exactly ${cast.length}):`,
    who,
  ];
  const pre = refPreamble(labels, 'Judge the LAST image, the generated frame, and compare every character in it against its reference.');
  if (pre) lines.push(pre);
  lines.push(
    `Inspect ${labels.length ? 'the last image' : 'the image'} and set a flag to true when that problem is present:`,
    '- hasTextOrBorders: any letters, words, numbers, captions, logos, watermarks, frame borders, split panels or letterbox bars.',
    '- designMismatch: a character\'s species, shape, proportions, colours, markings or signature accent differ from its description or reference.',
    '- anatomyDefect: extra, missing, fused or melted limbs, digits, eyes or tails, or broken anatomy.',
    `- styleMismatch: the rendering misses the target style${params.style === 'photoreal' ? '' : ' (for example it looks like a photograph or a plastic toy)'}.`,
    `- wrongFraming: the framing is clearly not a ${SIZE_WORDS[size]}.`,
    `- wrongCharacterCount: a required character is missing or duplicated, or any other character, creature or person appears${cast.length ? '' : ' (the frame must be uninhabited)'}.`,
    `- effectsOverload: ${allowedFx === 'none' ? 'any big effect such as fire, lava, lightning, explosions or sparks, or a cluttered frame' : 'effects beyond the allowed one, or a cluttered frame'}.`,
    isFace
      ? `- faceUnreadable: ${focus ? `${focus.displayNameEn}'s` : 'the'} face is blurred, hidden, turned away or its expression cannot be read.`
      : '- faceUnreadable: always false for this framing.',
    'Score production readiness from 0 to 100. Reserve 90 and above for flawless on-model frames; go below 60 for any clear defect.',
    'Reply with ONLY one JSON object and no other text: {"score": <0-100>, "hasTextOrBorders": <true|false>, "designMismatch": <true|false>, "anatomyDefect": <true|false>, "styleMismatch": <true|false>, "wrongFraming": <true|false>, "wrongCharacterCount": <true|false>, "effectsOverload": <true|false>, "faceUnreadable": <true|false>, "critique": "<one short sentence>", "fixInstruction": "<one positive sentence describing what the frame should show>"}'
  );
  if (lv.terse) {
    // Vượt ngân sách ký tự: thay mô tả cờ bằng bản gọn (cùng tên cờ, cùng JSON).
    const a = lines.findIndex((l) => l.startsWith('Inspect '));
    const b = lines.findIndex((l) => l.startsWith('Score production readiness'));
    if (a >= 0 && b > a) lines.splice(a + 1, b - a - 1, ...terseFlagLines(size, cast.length, allowedFx, isFace, focus?.displayNameEn || '', 'the first frame', false));
  }
  return lines.join('\n');
}

/** Cờ của giám khảo khung CUỐI (L1/L5): cờ khung đầu + nền/góc máy bị trôi so với khung đầu + biểu cảm sai nhịp (cười ở nhịp không vui). */
export const END_FRAME_GATE_FLAGS = [...KEYFRAME_GATE_FLAGS, 'sceneDrift', 'wrongExpression'];

const HAPPY_BEAT_RE = /\b(?:smil\w*|grin\w*|laugh\w*|happ\w*|joy\w*|delight\w*|cheer\w*|proud|pride|playful|giggl\w*|beam(?:s|ing)?|triumph\w*|glee\w*|content(?:ed|ment)?)\b/i;
const DAZED_BEAT_RE = /\b(?:daz\w*|groggy|stunn\w*|woozy|dizz\w*|unfocused|reel(?:s|ing)?)\b/i;
const SERIOUS_BEAT_RE =
  /\b(?:fear\w*|afraid|scar\w*|suspic\w*|wary|warily|wariness|shock\w*|surpris\w*|alarm\w*|startl\w*|ang(?:er|ry|rily)|furious|fury|rage|glar\w*|stern\w*|serious\w*|tens(?:e|ion)|threat\w*|menac\w*|growl\w*|snarl\w*|merc\w*|respect\w*|sad\w*|sorrow\w*|grief|hurt|pain\w*|worr\w*|tired|wear(?:y|ily)|exhaust\w*|defian\w*|determin\w*|focus\w*|caution\w*|guard\w*|protect\w*|warn\w*|hostil\w*|nervous\w*|anxious\w*)\b/i;

/** Nhịp diễn của khung cuối: 'happy' (cho cười), 'dazed' (hàm trễ, mắt lờ đờ), 'serious' (ngậm miệng), 'neutral' (không rõ). */
export function endFrameExpressionKind(shot: PremiumShot): 'happy' | 'dazed' | 'serious' | 'neutral' {
  const acting = oneLine(shot?.actingBeatEn);
  const to = acting.split(/\s*(?:->|→)\s*|\s+(?:turns? into|melts? into|gives? way to|into|becomes?|then)\s+/i).pop() || acting;
  const text = `${to} ${oneLine(shot?.endStateEn)}`;
  if (DAZED_BEAT_RE.test(text)) return 'dazed';
  if (HAPPY_BEAT_RE.test(to)) return 'happy';
  if (SERIOUS_BEAT_RE.test(text)) return 'serious';
  if (HAPPY_BEAT_RE.test(text)) return 'happy';
  return 'neutral';
}

/**
 * Giám khảo khung CUỐI (L1): khung cuối là bản SỬA của khung đầu → chỉ được đổi tư thế + biểu cảm.
 * Ảnh tham chiếu (sheet nhân vật, rồi khung đầu) đứng trước, ảnh cần chấm đứng CUỐI. Cùng JSON với khung đầu + 2 cờ:
 * sceneDrift (nền / ánh sáng / góc máy / cỡ cảnh / vị trí trôi khỏi khung đầu) và wrongExpression (L5: cười ở nhịp không vui).
 */
export function buildEndFrameGatePrompt(params: {
  style: PremiumStyleKey;
  shot: PremiumShot;
  characters: PremiumCharacter[];
  referenceLabels?: string[];
  /** Trần ký tự (tuỳ chọn, ví dụ PREMIUM_GATE_PROMPT_MAX_CHARS): vượt -> câu phong cách ngắn + rút mô tả nhân vật / trạng thái. */
  maxChars?: number;
}): string {
  const max = Number(params.maxChars) > 0 ? Number(params.maxChars) : 0;
  let text = '';
  for (const lv of max ? GATE_LEVELS : GATE_LEVELS.slice(0, 1)) {
    text = composeEndFrameGate(params, lv);
    if (!max || text.length <= max) return text;
  }
  return text;
}

function composeEndFrameGate(
  params: { style: PremiumStyleKey; shot: PremiumShot; characters: PremiumCharacter[]; referenceLabels?: string[] },
  lv: GateLevel
): string {
  const p = STYLE_PRESETS[params.style] || STYLE_PRESETS.pixar3d;
  const shot = params.shot;
  const size = sizeOf(shot);
  const cast = shotCast(shot, params.characters);
  const labels = (params.referenceLabels || []).filter(Boolean);
  const startRef = labels.findIndex((l) => /\b(?:start|first)\b/i.test(l)) + 1;
  const firstFrame = startRef > 0 ? `the first frame (image ${startRef})` : 'the first frame of the shot';
  const isFace = isFaceShotSize(size);
  const focus = cast.find((c) => c.id === focusCharacterId(shot)) || cast[0];
  const allowedFx = shot?.fxLevel > 0 && oneLine(shot.fxEn) ? oneLine(shot.fxEn) : 'none';
  const kind = endFrameExpressionKind(shot);
  const expression =
    kind === 'happy'
      ? 'a warm smile fits this beat'
      : kind === 'dazed'
      ? 'dazed: slack jaw and unfocused eyes; any smile, grin or laugh is wrong'
      : kind === 'serious'
      ? 'serious and fitting the beat, mouths closed over the teeth unless a character is roaring, speaking, gasping or snarling as scripted; any smile, grin or laugh is wrong'
      : 'it matches the acting beat; a broad grin or laugh is wrong unless the beat is happy';
  const contact = cast.length >= 2 && /\b(?:headbutt\w*|lung\w*|charg\w*|tackl\w*|bit(?:e|es|ing)|snap\w*|swip\w*|slam\w*|strik\w*|ram(?:s|ming)?|push\w*|shov\w*|collid\w*|clash\w*)\b/i.test(oneLine(shot?.actionEn));
  const who = cast.length
    ? cast.map((c) => `- ${c.displayNameEn}, a ${oneLine(c.species)}: ${clipWords(c.lookEn, lv.look)}`).join('\n')
    : '- No character: the frame shows the setting or a prop only.';
  const lines = [
    'You are a strict animation layout supervisor approving the LAST FRAME of one shot before it is animated.',
    `The last frame was made by editing ${firstFrame}: only the poses and expressions may change; set, light, colours, camera, shot size and the characters' scale and positions stay the same.`,
    `Target style: ${lv.shortStyle ? p.shortStyleEn : p.styleSentenceEn}`,
    `Intended framing: ${SIZE_WORDS[size]} — ${FRAMING_EXPECTATION[size]}.`,
    `End of the shot: ${clipWords(oneLine(shot?.endStateEn) || oneLine(shot?.actionEn), lv.text)}`,
    `Acting beat: ${clipWords(oneLine(shot?.actingBeatEn), lv.text ? Math.min(lv.text, 18) : 0) || 'a clear, readable expression'}`,
    `Intended expression: ${expression}.`,
    ...(contact ? ['Cut on action: the bodies stay one step apart with open air between them; touching or merged bodies are wrong.'] : []),
    `Allowed effect: ${allowedFx}`,
    `Characters that must appear (exactly ${cast.length}):`,
    who,
  ];
  const pre = refPreamble(labels, 'Judge the LAST image, the edited last frame: compare every character with its design reference and the whole frame with the first frame.');
  if (pre) lines.push(pre);
  lines.push(
    `Inspect ${labels.length ? 'the last image' : 'the image'} and set a flag to true when that problem is present:`,
    '- hasTextOrBorders: any letters, words, numbers, captions, logos, watermarks, frame borders, split panels or letterbox bars.',
    '- designMismatch: a character\'s species, shape, proportions, snout or face length, colours, markings or signature accent differ from its reference.',
    '- anatomyDefect: extra, missing, fused or melted limbs, digits, eyes or tails, or broken anatomy.',
    `- styleMismatch: the rendering misses the target style${params.style === 'photoreal' ? '' : ' (for example it looks like a photograph or a realistic animal)'}.`,
    `- wrongFraming: the framing is clearly not a ${SIZE_WORDS[size]}, or it differs from ${firstFrame}.`,
    `- wrongCharacterCount: a required character is missing or duplicated, or any other character, creature or person appears${cast.length ? '' : ' (the frame must be uninhabited)'}.`,
    `- effectsOverload: ${allowedFx === 'none' ? 'any big effect such as fire, lava, lightning, explosions, sparks, water jets or streams, or a cluttered frame' : 'effects beyond the allowed one, water jets or streams, or a cluttered frame'}.`,
    isFace
      ? `- faceUnreadable: ${focus ? `${focus.displayNameEn}'s` : 'the'} face is blurred, hidden, turned away or its expression cannot be read.`
      : '- faceUnreadable: always false for this framing.',
    `- sceneDrift: the background, set, lighting, colours, camera angle, lens or the characters' scale and positions differ clearly from ${firstFrame}, beyond the change of pose.`,
    '- wrongExpression: a face does not show the intended expression (for example a smile, grin or laugh in a serious, fearful, dazed or merciful beat).',
    'Score production readiness from 0 to 100. Reserve 90 and above for flawless on-model frames; go below 60 for any clear defect.',
    'Reply with ONLY one JSON object and no other text: {"score": <0-100>, "hasTextOrBorders": <true|false>, "designMismatch": <true|false>, "anatomyDefect": <true|false>, "styleMismatch": <true|false>, "wrongFraming": <true|false>, "wrongCharacterCount": <true|false>, "effectsOverload": <true|false>, "faceUnreadable": <true|false>, "sceneDrift": <true|false>, "wrongExpression": <true|false>, "critique": "<one short sentence>", "fixInstruction": "<one positive sentence describing what the frame should show>"}'
  );
  if (lv.terse) {
    // Vượt ngân sách ký tự: thay mô tả cờ bằng bản gọn (cùng tên cờ, cùng JSON).
    const a = lines.findIndex((l) => l.startsWith('Inspect '));
    const b = lines.findIndex((l) => l.startsWith('Score production readiness'));
    if (a >= 0 && b > a) lines.splice(a + 1, b - a - 1, ...terseFlagLines(size, cast.length, allowedFx, isFace, focus?.displayNameEn || '', firstFrame, true));
  }
  return lines.join('\n');
}

/** Bóc JSON từ phản hồi LLM (có thể kèm ```json, câu dẫn, dấu phẩy thừa). Lỗi -> null. */
export function parseJsonFromLlm(text: any): any {
  if (text && typeof text === 'object') return text;
  const cleaned = String(text ?? '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last <= first) return null;
  try {
    return JSON.parse(cleaned.slice(first, last + 1).replace(/,\s*([}\]])/g, '$1'));
  } catch {
    return null;
  }
}

function isTrue(v: any): boolean {
  return v === true || (typeof v === 'string' && /^(true|yes)$/i.test(v.trim()));
}

/**
 * Fail closed: thiếu điểm số / JSON hỏng -> null (không bao giờ tự cho điểm cao).
 * opts.flags: bộ cờ cần đọc (mặc định KEYFRAME_GATE_FLAGS; khung cuối dùng END_FRAME_GATE_FLAGS).
 */
export function parseKeyframeGateVerdict(text: any, opts: { faceShot?: boolean; flags?: readonly string[] } = {}): PremiumGateVerdict | null {
  const j = parseJsonFromLlm(text);
  if (!j || typeof j !== 'object' || Array.isArray(j)) return null;
  const raw = typeof j.score === 'number' ? j.score : typeof j.score === 'string' && j.score.trim() !== '' ? Number(j.score) : NaN;
  if (!Number.isFinite(raw)) return null;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const flags = Array.isArray(opts.flags) && opts.flags.length ? opts.flags : KEYFRAME_GATE_FLAGS;
  const failed = flags.filter((f) => isTrue(j[f]) && (f !== 'faceUnreadable' || opts.faceShot !== false));
  return {
    score,
    pass: failed.length === 0 && score >= PREMIUM_JUDGE_PASS_SCORE && !(j.pass === false || j.pass === 'false'),
    failed,
    critique: oneLine(j.critique).slice(0, 300),
    fixInstruction: oneLine(j.fixInstruction).slice(0, 300),
  };
}

const CORRECTION_BLOCK_RE = /\b(no|not|never|without|don'?t|avoid|zero|remove|none|nothing)\b|["“”\[\]@]|\d/i;

/**
 * Câu sửa lỗi KHẲNG ĐỊNH cho lần vẽ lại (không phủ định, không số, không ID) để không kéo mô hình về đúng thứ cần tránh.
 * params.frame = 'end': câu sửa cho lệnh SỬA khung cuối (giữ khung hình theo ảnh khung đầu, sửa sceneDrift / wrongExpression);
 * params.startImageIndex: số thứ tự ảnh khung đầu trong lệnh sửa (mặc định 1 → "the first image").
 */
export function buildKeyframeCorrection(
  verdict: PremiumGateVerdict,
  params: { style: PremiumStyleKey; shot: PremiumShot; characters: PremiumCharacter[]; frame?: 'start' | 'end'; startImageIndex?: number }
): string {
  const p = STYLE_PRESETS[params.style] || STYLE_PRESETS.pixar3d;
  const shot = params.shot;
  const cast = shotCast(shot, params.characters);
  const handles = cast.map((c) => `the ${oneLine(c.species).toLowerCase() || 'character'}`);
  const failed = new Set(verdict?.failed || []);
  const parts: string[] = [];
  const isEnd = params.frame === 'end';
  const startIdx = Math.max(1, Math.round(Number(params.startImageIndex) || 1));
  const startImage = startIdx === 1 ? 'the first image' : `image ${startIdx}`;
  if (failed.has('hasTextOrBorders')) parts.push('One clean full-bleed picture from edge to edge.');
  if (failed.has('designMismatch')) {
    parts.push(
      cast.length
        ? `${capFirst(joinAnd(handles))} exactly as on the reference ${cast.length > 1 ? 'sheets' : 'sheet'}, with the same colours, markings and proportions.`
        : 'Match the described setting closely.'
    );
  }
  if (failed.has('anatomyDefect')) {
    parts.push(cast.length ? `Clean, correct anatomy for ${joinAnd(handles)}, with clearly separated limbs.` : 'Solid, believable shapes.');
  }
  if (failed.has('styleMismatch')) parts.push(p.shortStyleEn);
  if (failed.has('wrongFraming')) parts.push(isEnd ? `Same shot size, camera angle and framing as ${startImage}.` : FRAMING_FIX[sizeOf(shot)]);
  if (isEnd && failed.has('sceneDrift')) {
    parts.push(`The background, lighting, colours, camera angle and every character's scale and position in the frame stay exactly as in ${startImage}.`);
  }
  if (isEnd && failed.has('wrongExpression') && cast.length) {
    const kind = endFrameExpressionKind(shot);
    const who = capFirst(joinAnd(handles));
    if (kind === 'happy') parts.push(`${who} ${cast.length > 1 ? 'show' : 'shows'} a warm, gentle smile that fits the moment.`);
    else if (kind === 'dazed') parts.push(`${who}: jaw hangs slack, eyes unfocused, a dazed expression.`);
    else parts.push(`${who}: mouth firmly closed, lips covering the teeth, a serious expression that fits the beat.`);
  }
  if (failed.has('wrongCharacterCount')) {
    if (!cast.length) parts.push('An empty, uninhabited setting.');
    else if (cast.length === 1) parts.push(`${capFirst(handles[0])} is the only character in the frame.`);
    else parts.push(`Exactly two characters, ${joinAnd(handles)}, both clearly visible.`);
  }
  if (failed.has('effectsOverload')) {
    const fx = shot?.fxLevel > 0 ? oneLine(shot.fxEn).replace(/[.!?]+$/, '') : '';
    parts.push(fx && !CORRECTION_BLOCK_RE.test(fx) ? `A clean, calm frame where ${lowerFirst(fx)} is the single effect.` : 'A clean, calm, uncluttered frame.');
  }
  if (failed.has('faceUnreadable') && isFaceShotSize(sizeOf(shot))) {
    const focus = cast.find((c) => c.id === focusCharacterId(shot)) || cast[0];
    const who = focus ? `The ${oneLine(focus.species).toLowerCase() || 'character'}'s` : 'The';
    parts.push(`${who} face is sharp, well lit and turned toward the camera, with eyes in clear focus.`);
  }
  const fix = oneLine(verdict?.fixInstruction);
  if (fix && countWords(fix) <= 35 && !CORRECTION_BLOCK_RE.test(fix)) parts.push(/[.!?]$/.test(fix) ? fix : `${fix}.`);
  if (!parts.length) parts.push('A polished, on-model, production-ready frame.');
  return parts.join(' ');
}

function capFirst(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function lowerFirst(s: string): string {
  return s && !/^[A-Z]{2}/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] || '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Bản vẽ tốt nhất: điểm cao nhất; bản không chấm được xếp sau bản có điểm; hòa -> bản sớm hơn. */
export function pickBestGatedAttempt<T extends { verdict: { score: number } | null }>(attempts: T[]): number {
  const list = Array.isArray(attempts) ? attempts : [];
  if (!list.length) return -1;
  let best = 0;
  for (let i = 1; i < list.length; i++) {
    const cand = list[i]?.verdict;
    const cur = list[best]?.verdict;
    if (cand && Number.isFinite(cand.score) && (!cur || !Number.isFinite(cur.score) || cand.score > cur.score)) best = i;
  }
  return best;
}

// ───────────────────────────── Stage 4: video request & takes ─────────────────────────────

const VEO_DURATIONS = [4, 6, 8];

/** Veo 3.1 nhận 4/6/8 giây → làm tròn lên mức gần nhất (tối đa 8). */
export function normalizeVeoDuration(sec: any): number {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return 8;
  return VEO_DURATIONS.find((d) => n <= d) || 8;
}

/**
 * Yêu cầu image-to-video: khung đầu là mỏ neo nhân vật (Veo 3.1 Quality không nhận Ingredients nên ảnh tham chiếu chỉ gửi
 * cho model không phải Veo, như code cũ). Độ phân giải 720p cho Veo, 360p cho model khác (MEM-02).
 */
export function buildPremiumVideoRequest(params: {
  prompt: string;
  model: string;
  aspectRatio: string;
  durationSeconds: number;
  firstFrameMediaId: string;
  lastFrameMediaId?: string;
  referenceMediaIds?: string[];
}): Record<string, any> {
  const isVeo = /veo/i.test(String(params.model || ''));
  const req: Record<string, any> = {
    prompt: params.prompt,
    modelDisplayName: params.model,
    aspectRatio: params.aspectRatio,
    durationSeconds: normalizeVeoDuration(params.durationSeconds),
    resolution: isVeo ? '720p' : '360p',
    firstFrameImageMediaId: params.firstFrameMediaId,
  };
  const refs = (params.referenceMediaIds || []).filter(isUsableMediaId);
  if (!isVeo && refs.length) req.referenceImageMediaIds = refs;
  if (isUsableMediaId(params.lastFrameMediaId)) req.lastFrameImageMediaId = params.lastFrameMediaId;
  return req;
}

/**
 * Lỗi Veo có liên quan tới khung đầu/cuối hoặc ảnh tham chiếu (bị từ chối / không hỗ trợ)? Chỉ khi đó mới bỏ khung cuối khi thử lại;
 * lỗi tạm thời (timeout, quá tải, mạng) GIỮ khung cuối (L1 — bỏ khung cuối làm nhân vật trôi về loài thật).
 */
export const VIDEO_FRAME_ERROR_RE = /frame|image|unsupported|not supported|ảnh|khung|không hỗ trợ/i;

export function isFrameRejectionError(err: any): boolean {
  const msg = typeof err === 'string' ? err : String(err?.message ?? err ?? '');
  return VIDEO_FRAME_ERROR_RE.test(msg);
}

export interface PremiumVideoRetryPlan {
  /** Yêu cầu dùng cho lần thử kế tiếp. */
  request: Record<string, any>;
  reason: 'frame' | 'transient';
  droppedLastFrame: boolean;
  droppedReferences: boolean;
}

/**
 * Lần thử lại sau một lỗi Veo: lỗi tạm thời → giữ nguyên yêu cầu (kể cả khung cuối); lỗi khung hình / ảnh / không hỗ trợ →
 * bỏ khung cuối + ảnh tham chiếu, về 8 giây (cấu hình khung đầu thuần, như đường cũ).
 */
export function planVideoRetry(request: Record<string, any>, err: any): PremiumVideoRetryPlan {
  const req = { ...(request || {}) };
  if (!isFrameRejectionError(err)) return { request: req, reason: 'transient', droppedLastFrame: false, droppedReferences: false };
  const droppedLastFrame = 'lastFrameImageMediaId' in req;
  const droppedReferences = 'referenceImageMediaIds' in req;
  delete req.lastFrameImageMediaId;
  delete req.referenceImageMediaIds;
  req.durationSeconds = 8;
  return { request: req, reason: 'frame', droppedLastFrame, droppedReferences };
}

/** Ba thời điểm chấm một bản quay: 0,5s, giữa clip, cuối clip trừ 0,5s (clip quá ngắn: 20% / 50% / 80%). */
export function takeFrameTimes(durationSec: number): number[] {
  const d = Number(durationSec) > 0 ? Number(durationSec) : 8;
  const r = (t: number) => Math.round(t * 100) / 100;
  if (d < 1.6) return [r(d * 0.2), r(d * 0.5), r(d * 0.8)];
  return [0.5, r(d / 2), r(d - 0.5)];
}

export type PremiumTakeAction = 'reuse' | 'generate' | 'unavailable';

/**
 * Kế hoạch cho N bản của một cảnh: dùng lại file bản quay có sẵn khi resume (0 credit), quay mới khi thiếu,
 * và 'unavailable' khi chạy offline (--master-only) mà thiếu file — offline không bao giờ gọi Flow.
 */
export function planTakeActions(params: { takes: number; existing: boolean[]; reuseExisting: boolean; offline: boolean }): PremiumTakeAction[] {
  const n = Math.max(1, Math.min(4, Math.round(Number(params.takes) || 1)));
  const out: PremiumTakeAction[] = [];
  for (let k = 0; k < n; k++) {
    const has = Boolean(params.existing?.[k]);
    if (has && (params.reuseExisting || params.offline)) out.push('reuse');
    else if (params.offline) out.push('unavailable');
    else out.push('generate');
  }
  return out;
}

/**
 * Prompt giám khảo cho một bản quay, kèm ảnh tham chiếu (khung đầu / khung cuối / sheet thiết kế) đứng TRƯỚC các khung trích từ video.
 * L7: buildTakeJudgePrompt tự đánh số ảnh tham chiếu + khung của take, có cổng cứng và beat_in/beat_peak/beat_out.
 * style / durationSec (tuỳ chọn) chuyển thẳng cho buildTakeJudgePrompt.
 */
export function buildTakeJudgePromptWithReferences(params: {
  shot: PremiumShot;
  characters: PremiumCharacter[];
  frameTimesSec: number[];
  referenceLabels?: string[];
  style?: PremiumStyleKey;
  durationSec?: number;
  /** Bối cảnh: hiệu ứng nước chỉ hợp lệ khi bối cảnh có nước (L6). */
  environment?: PremiumEnvironment | null;
  /** Bản gọn trong ngân sách ký tự cho Flow (PREMIUM_JUDGE_PROMPT_MAX_CHARS). */
  compact?: boolean;
  maxChars?: number;
}): string {
  const labels = (params.referenceLabels || []).filter(Boolean);
  return buildTakeJudgePrompt({
    shot: params.shot,
    characters: params.characters,
    frameTimesSec: params.frameTimesSec,
    ...(labels.length ? { referenceFrames: labels } : {}),
    ...(params.style ? { style: params.style } : {}),
    ...(Number(params.durationSec) > 0 ? { durationSec: Number(params.durationSec) } : {}),
    ...(params.environment ? { environment: params.environment } : {}),
    ...(params.compact ? { compact: true } : {}),
    ...(Number(params.maxChars) > 0 ? { maxChars: Number(params.maxChars) } : {}),
  });
}

/**
 * Gói gửi giám khảo take qua Flow (bản render dino_premium_v2: prompt 5.000-5.800 ký tự + 14 khung + 4 PNG đầy đủ bị dịch vụ văn bản
 * từ chối "Dịch vụ tạo văn bản không hoạt động" ở mọi lần thử → không có phán quyết, L7/L8 tắt âm thầm). Bản proto chạy được:
 * prompt <= ~3.400 ký tự, 8 khung + 2 tham chiếu JPEG 480px.
 *   - Lần 1 ("full"): prompt gọn <= PREMIUM_JUDGE_PROMPT_MAX_CHARS, đủ khung dày L7 (>= 10 + đầu/cuối), tham chiếu 480px JPEG.
 *   - Lần 2 ("lite", chỉ khi lần 1 lỗi): 8 khung + khung đầu/cuối làm tham chiếu, prompt <= PREMIUM_JUDGE_LITE_MAX_CHARS.
 */
export const PREMIUM_JUDGE_REF_WIDTH = 480;
export const PREMIUM_JUDGE_LITE_FRAMES = 8;
export const PREMIUM_JUDGE_LITE_MAX_CHARS = 2800;

/** keep chỉ số rải đều trên count khung (luôn gồm khung đầu và khung cuối). */
export function pickJudgeFrameSubset(count: number, keep: number): number[] {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const k = Math.max(1, Math.floor(Number(keep) || 1));
  if (n <= k) return Array.from({ length: n }, (_, i) => i);
  if (k === 1) return [0];
  const out = new Set<number>();
  for (let i = 0; i < k; i++) out.add(Math.round((i * (n - 1)) / (k - 1)));
  return [...out].sort((a, b) => a - b);
}

/**
 * Câu khoá thiết kế của prompt Veo theo khung thực gửi đi (L1): "as the first and last frames" khi có khung cuối, "as the first frame"
 * khi không (kể cả khi planVideoRetry bỏ khung cuối). Giữ nguyên mọi chỗ khác của prompt (kể cả prompt người dùng sửa tay).
 */
export function setEndFrameLock(prompt: string, withEndFrame: boolean): string {
  const p = String(prompt || '');
  return withEndFrame
    ? p.replace(/\bas the first frame throughout\b/, 'as the first and last frames throughout')
    : p.replace(/\bas the first and last frames throughout\b/, 'as the first frame throughout');
}

/**
 * Ảnh tham chiếu cho giám khảo take (L7): khung đầu, khung cuối (nơi hành động phải kết thúc), rồi sheet thiết kế của tối đa
 * maxSheets nhân vật trong cảnh. Nhãn song song với ảnh, đúng cách buildTakeJudgePrompt mô tả ('start keyframe', 'end keyframe', '... sheet').
 */
export function planTakeJudgeReferences(params: {
  shot: PremiumShot;
  characters: PremiumCharacterRefs[];
  startKeyframe?: { base64?: string; mimeType?: string } | null;
  endKeyframe?: { base64?: string; mimeType?: string } | null;
  maxSheets?: number;
}): { labels: string[]; images: Array<{ base64: string; mimeType: string }> } {
  const labels: string[] = [];
  const images: Array<{ base64: string; mimeType: string }> = [];
  const add = (label: string, img: { base64?: string; mimeType?: string } | null | undefined) => {
    if (!img?.base64) return;
    labels.push(label);
    images.push({ base64: img.base64, mimeType: img.mimeType || 'image/png' });
  };
  add('start keyframe', params.startKeyframe);
  add('end keyframe', params.endKeyframe);
  const maxSheets = Math.max(0, Math.min(2, Math.round(Number(params.maxSheets ?? 2))));
  for (const j of sheetJudgeImages(charactersInShot(params.shot, params.characters)).slice(0, maxSheets)) add(j.label, j);
  return { labels, images };
}

/** Nhịp diễn rõ nhất trong take (giây theo clip nguồn) — masterFilm.beatWindow (L8). */
export interface PremiumBeatWindow {
  inSec: number;
  peakSec: number;
  outSec: number;
}

/**
 * beat_in / beat_peak / beat_out của giám khảo → cửa sổ nhịp cho dựng phim. Đọc trường mới (beatInSec/beatPeakSec/beatOutSec)
 * và trường cũ của bản thử nghiệm (verdict.beat = { inSec, peakSec, outSec }). Không có beat_peak (và không suy được) → null.
 */
export function beatWindowFromVerdict(verdict: any, durationSec?: number): PremiumBeatWindow | null {
  if (!verdict || typeof verdict !== 'object') return null;
  const num = (v: any): number | null => (v === null || v === undefined || v === '' || typeof v === 'boolean' || !Number.isFinite(Number(v)) ? null : Number(v));
  const legacy = verdict.beat && typeof verdict.beat === 'object' ? verdict.beat : {};
  let bIn = num(verdict.beatInSec ?? legacy.inSec ?? legacy.in);
  let bOut = num(verdict.beatOutSec ?? legacy.outSec ?? legacy.out);
  let peak = num(verdict.beatPeakSec ?? legacy.peakSec ?? legacy.peak);
  if (peak === null && bIn !== null && bOut !== null) peak = (bIn + bOut) / 2;
  if (peak === null) return null;
  const dur = Number(durationSec) > 0 ? Number(durationSec) : null;
  const clamp = (t: number) => Math.round(Math.max(0, dur ? Math.min(dur, t) : t) * 1000) / 1000;
  peak = clamp(peak);
  bIn = clamp(bIn ?? peak);
  bOut = clamp(bOut ?? peak);
  if (bIn > bOut) [bIn, bOut] = [bOut, bIn];
  peak = Math.min(Math.max(peak, bIn), bOut);
  return { inSec: bIn, peakSec: peak, outSec: bOut };
}

export interface PremiumTakeSelection<T> {
  index: number;
  best: T | null;
  /** Điểm overall của bản thắng, null khi không bản nào chấm được (KHÔNG mặc định 95). */
  vqqaScore: number | null;
  pass: boolean | null;
  note: string;
  /** Cổng cứng (L7) bản thắng bị trượt ([] khi qua hết / phán quyết kiểu cũ không có cổng). */
  failedGates?: string[];
  /** Nhịp diễn rõ nhất của bản thắng (L8) — null khi giám khảo không trả beat. */
  beatWindow?: PremiumBeatWindow | null;
}

function gatesPassed(v: PremiumJudgeVerdict | null | undefined): boolean {
  return Boolean(v) && !(Array.isArray(v!.failedGates) && v!.failedGates.length > 0);
}

/**
 * Chọn bản tốt nhất: bản qua hết cổng cứng (L7) đứng trước bản trượt cổng, rồi điểm overall cao nhất (pickBestTake);
 * bản không có phán quyết xếp cuối; hòa -> bản sớm hơn. Phán quyết kiểu cũ (không có cổng) coi như qua cổng.
 */
export function selectBestTake<T extends { verdict: PremiumJudgeVerdict | null }>(records: T[]): PremiumTakeSelection<T> {
  const list = (Array.isArray(records) ? records : []).filter(Boolean);
  if (!list.length) return { index: -1, best: null, vqqaScore: null, pass: null, note: '', failedGates: [], beatWindow: null };
  const gated = list.filter((r) => gatesPassed(r.verdict));
  const pool = gated.length ? gated : list;
  const pick = pickBestTake(pool).best;
  const index = list.indexOf(pick);
  const best = pick;
  const v = best?.verdict || null;
  return {
    index,
    best,
    vqqaScore: v && Number.isFinite(v.overall) ? v.overall : null,
    pass: v ? v.pass : null,
    note: v ? v.note || (v.artifacts.length ? v.artifacts.join(', ') : '') : '',
    failedGates: v && Array.isArray(v.failedGates) ? [...v.failedGates] : [],
    beatWindow: beatWindowFromVerdict(v),
  };
}

// ───────────────────────────── Stage 7: ambience bed from Flow (L9) ─────────────────────────────

/** Model rẻ nhất cho nền ambience: 1 lần tạo, chỉ lấy âm thanh. */
export const AMBIENCE_BED_MODEL = 'Veo 3.1 - Lite';
export const AMBIENCE_BED_DURATION_SEC = 8;

/** Âm do nhân vật / nhạc tạo ra — không thuộc nền môi trường. */
const NON_AMBIENT_SOUND_RE =
  /\b(?:breath\w*|growl\w*|roar\w*|hiss\w*|footstep\w*|chuff\w*|huff\w*|sniff\w*|snort\w*|grunt\w*|voice\w*|speech|speak\w*|dialogue|music\w*|score|songs?|sing\w*|laugh\w*|cr(?:y|ies|ying)|scream\w*|splash\w*|thud\w*|crash\w*|impact\w*|hit\w*|claw\w*|bite\w*|snap\w*|whoosh\w*)\b/i;

function escapeRegExp(s: string): string {
  return String(s).replace(/[.*+?^$|()[\]{}\\]/g, '\\$&');
}

function ambientClauses(text: string, names: string[]): string[] {
  const nameRes = names.filter(Boolean).map((n) => new RegExp('\\b' + escapeRegExp(n) + '\\b', 'i'));
  return oneLine(text)
    .replace(/[.!?]+$/, '')
    .split(/\s*[,;]\s*|\s+and\s+/i)
    .map((c) => c.trim().replace(/^(?:and|with)\s+/i, ''))
    .filter((c) => c && !NON_AMBIENT_SOUND_RE.test(c) && !nameRes.some((re) => re.test(c)));
}

/** Gợi ý chuyển động nhẹ theo bối cảnh (để Veo không bịa hành động / nhân vật). */
function ambienceMotion(env: PremiumEnvironment | null | undefined): string {
  const t = `${env?.lookEn || ''} ${env?.timeOfDayEn || ''}`.toLowerCase();
  const cues: string[] = [];
  if (/steam|hot spring|geyser|vent/.test(t)) cues.push('slowly drifting steam');
  if (/water|pool|river|lake|sea|ocean|pond|stream|swamp|marsh/.test(t)) cues.push('softly rippling water');
  if (/fern|grass|tree|leaf|leaves|reed|bush|forest|jungle|flower/.test(t)) cues.push('gently swaying leaves');
  if (!cues.length) cues.push('slowly drifting clouds and soft shifting light');
  return cues.slice(0, 2).join(' and ');
}

/**
 * L9: prompt Veo cho MỘT clip không nhân vật dựng từ ảnh nền bối cảnh, chỉ để lấy âm thanh môi trường làm nền ambience
 * (masterFilm đặt nền này ~16 LU dưới stem). Văn xuôi khẳng định (lint 'video'), không tên nhân vật, không ID thô.
 */
export function buildAmbienceBedPrompt(params: {
  style: PremiumStyleKey;
  environment: PremiumEnvironment;
  shots?: PremiumShot[];
  characters?: PremiumCharacter[];
}): string {
  const p = STYLE_PRESETS[params.style] || STYLE_PRESETS.pixar3d;
  const env = params.environment;
  const names = (params.characters || []).map((c) => c?.displayNameEn).filter(Boolean) as string[];
  const counts = new Map<string, number>();
  for (const s of params.shots || []) {
    for (const c of ambientClauses(s?.ambientEn || '', names)) counts.set(c.toLowerCase(), (counts.get(c.toLowerCase()) || 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const ambient = (ranked.length ? ranked.slice(0, 3) : ['soft wind', 'quiet natural room tone']).join(', ');
  const lookWords = (oneLine(env?.lookEn).replace(/[.!?]+$/, '') || 'a quiet natural landscape').split(' ');
  const time = oneLine(env?.timeOfDayEn).replace(/[.!?]+$/, '');
  const compose = (n: number) =>
    [
      p.shortStyleEn,
      `A locked-off static wide shot of the empty setting: ${lookWords.slice(0, n).join(' ').replace(/[,;:]+$/, '')}${time ? `, at ${time}` : ''}.`,
      `The place stays empty and calm for the whole shot, with only ${ambienceMotion(env)}.`,
      `Ambient noise: ${ambient}.`,
      'Sound: one steady natural ambience of this place, even in level from start to end, with soft wind and quiet room tone.',
    ].join(' ');
  // Lint 'video' tối đa 100 từ: rút gọn phần mô tả bối cảnh trước, giữ nguyên câu âm thanh.
  let n = lookWords.length;
  let text = compose(n);
  while (countWords(text) > 95 && n > 8) text = compose(--n);
  return text;
}

/** Yêu cầu Veo cho nền ambience: khung đầu = ảnh nền bối cảnh sạch, model rẻ nhất, 8 giây. */
export function buildAmbienceBedRequest(params: {
  prompt: string;
  environmentMediaId: string;
  aspectRatio: string;
  model?: string;
}): Record<string, any> {
  return buildPremiumVideoRequest({
    prompt: params.prompt,
    model: params.model || AMBIENCE_BED_MODEL,
    aspectRatio: params.aspectRatio,
    durationSeconds: AMBIENCE_BED_DURATION_SEC,
    firstFrameMediaId: params.environmentMediaId,
  });
}

// ───────────────────────────── 00B: real prompt lint report ─────────────────────────────

export interface PremiumShotLintEntry {
  shotNumber: number;
  shotSize: string;
  beat: string;
  keyframePrompt: string;
  motionPrompt: string;
  keyframe: PremiumLintReport;
  motion: PremiumLintReport;
  /** L1: prompt SỬA khung cuối (lint 'edit') — tuỳ chọn, chỉ có khi cảnh có khung cuối. */
  endFramePrompt?: string;
  endFrame?: PremiumLintReport;
}

function issueKey(issue: string): string {
  return String(issue || '')
    .split(/[:(]/)[0]
    .replace(/\s+\d.*$/, '')
    .trim();
}

function wordStats(values: number[]) {
  if (!values.length) return { min: 0, max: 0, avg: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
  };
}

/**
 * Báo cáo 00B = kết quả lintPremiumPrompt THẬT trên prompt keyframe & motion cuối cùng (không còn tự chấm 100 điểm),
 * cộng prompt sửa khung cuối (lint 'edit') khi cảnh có — cảnh chỉ "sạch" khi mọi prompt của nó sạch.
 */
export function buildPromptLintReport(entries: PremiumShotLintEntry[]) {
  const list = (Array.isArray(entries) ? entries : []).filter(Boolean);
  const reports = list.flatMap((e) => [e.keyframe, e.motion, ...(e.endFrame ? [e.endFrame] : [])]).filter(Boolean);
  const cleanPrompts = reports.filter((r) => r.ok).length;
  const cleanShots = list.filter((e) => e.keyframe?.ok && e.motion?.ok && (!e.endFrame || e.endFrame.ok)).length;
  const endEntries = list.filter((e) => e.endFrame);
  const issueCounts: Record<string, number> = {};
  for (const r of reports) {
    for (const issue of r.issues || []) {
      const k = issueKey(issue);
      issueCounts[k] = (issueCounts[k] || 0) + 1;
    }
  }
  return {
    standard:
      'lintPremiumPrompt — kiểm tra thật trên văn bản prompt cuối cùng: số từ theo loại, số đo, ID thô, ngoặc vuông, từ phủ định, ngoặc kép quanh thoại, từ ẩn dụ gây ảo giác, chồng hiệu ứng, bộ ba màu tím + cam + cyan, yêu cầu chữ/nhãn, từ ngữ ảnh chụp sai phong cách.',
    mode: 'premium',
    totalShotsAudited: list.length,
    passedShotsCount: cleanShots,
    allShotsPassed100Percent: list.length > 0 && cleanShots === list.length,
    totalPrompts: reports.length,
    cleanPrompts,
    issueCounts,
    wordCounts: {
      keyframe: wordStats(list.map((e) => e.keyframe?.words || 0)),
      motion: wordStats(list.map((e) => e.motion?.words || 0)),
      ...(endEntries.length ? { endFrame: wordStats(endEntries.map((e) => e.endFrame?.words || 0)) } : {}),
    },
    shots: list.map((e) => ({
      shotNumber: e.shotNumber,
      shotSize: e.shotSize,
      beat: e.beat,
      keyframe: { ok: e.keyframe?.ok, words: e.keyframe?.words, issues: e.keyframe?.issues || [], prompt: e.keyframePrompt },
      motion: { ok: e.motion?.ok, words: e.motion?.words, issues: e.motion?.issues || [], prompt: e.motionPrompt },
      ...(e.endFrame
        ? { endFrame: { ok: e.endFrame.ok, words: e.endFrame.words, issues: e.endFrame.issues || [], prompt: e.endFramePrompt || '' } }
        : {}),
    })),
  };
}
