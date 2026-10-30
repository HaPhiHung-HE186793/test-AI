/**
 * TEST PREMIUM ENGINE — kiểm tra offline (không gọi Flow, không mạng, không tốn credit).
 *
 *   node --experimental-strip-types scripts/test-premium-engine.ts [--run <runDir>] [--skip-media] [--verbose]
 *   npm run test:premium
 *
 * 1) Fallback bible cho 3 kịch bản x 3 phong cách -> planCoverage + quota góc máy + lint mọi loại prompt + khoảng số từ.
 * 2) parseJudgeVerdict / pickBestTake: các trường hợp biên (fail closed, không bao giờ mặc định điểm cao).
 * 3) normalizeStoryBible trên JSON LLM lỗi (thiếu trường, enum sai, ID/số trong mô tả, thoại 30 từ) -> bible hợp lệ.
 * 3c) Bài học render thật L1-L7: khung cuối sửa từ khung đầu, va chạm cắt trước một bước, miệng khép ở nhịp không vui,
 *     hướng nhìn trục 180°, dáng đứng theo loài, nước nhỏ giọt, giám khảo nhiều khung + cổng cứng + beat_in/peak/out.
 * 4) Nếu có run khủng long + ffmpeg: selectBestWindow trên 2 clip -> cửa sổ nằm trong [0.25, dur-0.4] và đúng độ dài theo nhịp;
 *    beatWindow luôn chứa beat_peak, forceWindow đúng từng khung, đo bước nhảy mức tại điểm cắt.
 * 4b) Hậu kỳ r3 (thuần tính toán): cổng FX khung giữa, trọng số âm thanh theo nhịp, BS.1770 / LRA / bước nhảy tại điểm cắt,
 *     bản đồ gain (độ lệch, trần, Huber), kế hoạch hỗn âm (sửa đỉnh nhọn, ngân sách limiter), đường cong + phơi sáng + chặn cháy đỏ.
 * Chỉ đọc file trong output/, không ghi gì.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  STYLE_PRESETS,
  PREMIUM_BEATS,
  PREMIUM_SHOT_SIZES,
  PREMIUM_JUDGE_PASS_SCORE,
  buildStoryRoomPrompt,
  normalizeStoryBible,
  buildFallbackStoryBible,
  planCoverage,
  buildCharacterSheetPrompts,
  buildEnvironmentPlatePrompt,
  buildKeyframePrompt,
  buildMotionPrompt,
  lintPremiumPrompt,
  buildTakeJudgePrompt,
  parseJudgeVerdict,
  pickBestTake,
  toLegacyShotFields,
  estimateCredits,
  assessStoryBible,
  hasContactAction,
  ALLOWED_CAMERA_MOVES,
  countWords,
  isFaceShotSize,
  isWideShotSize,
  buildEndFrameEditPrompt,
  denseJudgeFrameTimes,
  PREMIUM_JUDGE_HARD_GATES,
  PREMIUM_JUDGE_GATE_FAIL_CAP,
  KEYFRAME_MAX_WORDS,
  MOTION_MAX_WORDS,
  END_FRAME_MAX_WORDS,
  PREMIUM_JUDGE_PROMPT_MAX_CHARS,
  type PremiumCharacter,
  type PremiumShot,
  type PremiumStoryBible,
  type PremiumStyleKey,
} from '../services/premiumPromptEngine.ts';
import {
  selectBestWindow,
  probeMedia,
  resolveFfmpegPath,
  categorizeShot,
  chooseWindowFromAnalysis,
  audioEnergyWeight,
  beatGainOffsetDb,
  kWeightedTrack,
  gatedLoudness,
  loudnessRange,
  cutJumpsFromTrack,
  measureCutJumps,
  solveGainMap,
  planAudioMix,
  planExposure,
  toneCurveLut,
  DEFAULT_TONE_CURVE,
  type ClipAnalysis,
  type MasterPacing,
} from '../services/premiumMasteringEngine.ts';
import {
  buildEndFrameGatePrompt,
  buildKeyframeGatePrompt,
  PREMIUM_GATE_PROMPT_MAX_CHARS,
  PREMIUM_JUDGE_LITE_MAX_CHARS,
} from '../services/premiumShotProduction.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const VERBOSE = argv.includes('--verbose');
const SKIP_MEDIA = argv.includes('--skip-media');
const runArgIdx = argv.indexOf('--run');
const DINO_RUN = runArgIdx >= 0 && argv[runArgIdx + 1] ? path.resolve(argv[runArgIdx + 1]) : path.join(ROOT, 'output', 'vscode_runs', 'dino_clash_closed_loop_v1');
const premiumRunIdx = argv.indexOf('--premium-run');
const PREMIUM_RUN = premiumRunIdx >= 0 && argv[premiumRunIdx + 1] ? path.resolve(argv[premiumRunIdx + 1]) : path.join(ROOT, 'output', 'vscode_runs', 'dino_premium_v2');

// ───────────────────────────── Mini harness ─────────────────────────────

interface SectionResult {
  name: string;
  checks: number;
  failures: string[];
  skipped?: string;
}
const sections: SectionResult[] = [];
let current: SectionResult = { name: '(none)', checks: 0, failures: [] };

function section(name: string) {
  current = { name, checks: 0, failures: [] };
  sections.push(current);
  console.log(`\n=== ${name} ===`);
}

function check(cond: unknown, msg: string): boolean {
  current.checks++;
  if (!cond) {
    current.failures.push(msg);
    console.log(`  FAIL ${msg}`);
    return false;
  }
  return true;
}

function info(msg: string) {
  console.log(`  ${msg}`);
}

const SAFE_ID_RE = /^[A-Z0-9_]+$/;
const DIRTY_EN_RE = /@|\[|\]|\d|\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/;
const WORDS = {
  sheet: [50, 110],
  plate: [50, 100],
  keyframe: [60, KEYFRAME_MAX_WORDS],
  motion: [40, MOTION_MAX_WORDS],
  endframe: [40, END_FRAME_MAX_WORDS],
} as const;
const wordStats: Record<keyof typeof WORDS, number[]> = { sheet: [], plate: [], keyframe: [], motion: [], endframe: [] };

// ───────────────────────────── Shared assertions ─────────────────────────────

/** Quota phủ góc máy theo spec: không lặp cỡ cảnh liền kề, >=35% cận mặt, <=25% toàn cảnh (cảnh mở màn được miễn), ngân sách hiệu ứng. */
function assertCoverage(label: string, shots: PremiumShot[]) {
  const n = shots.length;
  if (!check(n > 0, `${label}: no shots`)) return;
  const face = shots.filter((s) => isFaceShotSize(s.shotSize)).length;
  const wide = shots.filter((s) => isWideShotSize(s.shotSize)).length;
  const wideAllowance = Math.max(Math.floor(n * 0.25), isWideShotSize(shots[0].shotSize) ? 1 : 0);
  check(face >= Math.ceil(n * 0.35), `${label}: face shots ${face}/${n} < 35%`);
  check(wide <= wideAllowance, `${label}: wide shots ${wide}/${n} > 25%`);
  for (let i = 1; i < n; i++) {
    check(shots[i].shotSize !== shots[i - 1].shotSize, `${label}: shots ${i} and ${i + 1} are both ${shots[i].shotSize}`);
  }
  let big = 0;
  for (const s of shots) {
    const tag = `${label} shot ${s.shotNumber} (${s.beat})`;
    if (s.beat === 'setup' || s.beat === 'resolution') check(s.fxLevel === 0, `${tag}: fxLevel ${s.fxLevel}, expected 0`);
    else if (s.beat !== 'climax') check(s.fxLevel <= 1, `${tag}: fxLevel ${s.fxLevel}, expected <= 1`);
    if (s.fxLevel === 2) {
      big++;
      check(s.beat === 'climax', `${tag}: fxLevel 2 outside climax`);
    }
    if (s.fxLevel === 0) check(!s.fxEn, `${tag}: fxEn "${s.fxEn}" with fxLevel 0`);
    if (s.shotSize === 'OTS') check(s.characters.length >= 2, `${tag}: OTS with ${s.characters.length} character(s)`);
    if (isFaceShotSize(s.shotSize)) check(s.characters.length >= 1, `${tag}: face shot without a character`);
  }
  check(big <= 2, `${label}: ${big} fxLevel-2 shots (max 2)`);
  if (VERBOSE) info(`${label}: n=${n} face=${face} wide=${wide} sizes=${shots.map((s) => s.shotSize).join(',')} fx=${shots.map((s) => s.fxLevel).join('')}`);
}

/** Bible hợp lệ về cấu trúc: enum, ID ASCII, MEM-10 personality, thoại <=8 từ, văn bản tiếng Anh sạch ID/số/ngoặc. */
function assertValidBible(label: string, b: PremiumStoryBible, expect: { shotCount: number; style: PremiumStyleKey }) {
  if (!check(b && typeof b === 'object', `${label}: bible is not an object`)) return;
  check(typeof b.movieTitle === 'string' && b.movieTitle.trim().length > 0, `${label}: empty movieTitle`);
  check(typeof b.loglineVi === 'string' && b.loglineVi.trim().length > 0, `${label}: empty loglineVi`);
  check(b.style === expect.style, `${label}: style ${b.style} != ${expect.style}`);
  check(Array.isArray(b.characters) && b.characters.length >= 1 && b.characters.length <= 2, `${label}: ${b.characters?.length} characters (1-2)`);
  const ids = (b.characters || []).map((c) => c.id);
  check(new Set(ids).size === ids.length && ids.every((id) => id === 'char1' || id === 'char2'), `${label}: character ids ${ids.join(',')}`);
  check(ids[0] === 'char1', `${label}: first character is ${ids[0]}`);
  const safeIds = (b.characters || []).map((c) => c.safeId);
  check(new Set(safeIds).size === safeIds.length, `${label}: duplicate safeIds ${safeIds.join(',')}`);
  for (const c of b.characters || []) {
    const tag = `${label} ${c.id}`;
    check(SAFE_ID_RE.test(c.safeId || ''), `${tag}: safeId "${c.safeId}" not ASCII UPPER_SNAKE`);
    check(!!c.displayNameVi && !!c.displayNameEn && !!c.species, `${tag}: missing display names/species`);
    check(!DIRTY_EN_RE.test(c.displayNameEn), `${tag}: displayNameEn "${c.displayNameEn}" looks like an ID`);
    check(countWords(c.lookEn) >= 3 && countWords(c.lookEn) <= 40, `${tag}: lookEn ${countWords(c.lookEn)} words (3-40)`);
    check(!DIRTY_EN_RE.test(c.lookEn), `${tag}: lookEn has IDs/numbers/brackets: ${c.lookEn}`);
    check(lintPremiumPrompt(c.lookEn, 'image').issues.every((i) => i.startsWith('word count')), `${tag}: lookEn lint ${lintPremiumPrompt(c.lookEn, 'image').issues.join(' | ')}`);
    check(typeof c.canSpeak === 'boolean', `${tag}: canSpeak not boolean`);
    check(!!c.voiceEn, `${tag}: empty voiceEn`);
    check(/\[ACTION_/.test(c.personalityVi) && /\[SKILL_1_/.test(c.personalityVi) && /\[SKILL_2_/.test(c.personalityVi), `${tag}: personalityVi lacks MEM-10 codes`);
  }
  const env = b.environment;
  if (check(env && typeof env === 'object', `${label}: missing environment`)) {
    check(SAFE_ID_RE.test(env.safeId || ''), `${label}: env safeId "${env.safeId}" not ASCII`);
    for (const k of ['displayNameVi', 'lookEn', 'timeOfDayEn', 'lightingEn', 'paletteEn'] as const) check(!!env[k], `${label}: env.${k} empty`);
    for (const k of ['lookEn', 'lightingEn', 'paletteEn'] as const) check(!DIRTY_EN_RE.test(env[k]), `${label}: env.${k} dirty: ${env[k]}`);
    const envLint = lintPremiumPrompt(`${env.lookEn}. ${env.lightingEn}. ${env.paletteEn}.`, 'image');
    check(envLint.issues.every((i) => i.startsWith('word count')), `${label}: env text lint ${envLint.issues.join(' | ')}`);
  }
  check(Array.isArray(b.shots) && b.shots.length === expect.shotCount, `${label}: ${b.shots?.length} shots, expected ${expect.shotCount}`);
  (b.shots || []).forEach((s, i) => {
    const tag = `${label} shot ${i + 1}`;
    check(s.shotNumber === i + 1, `${tag}: shotNumber ${s.shotNumber}`);
    check(!!s.titleVi, `${tag}: empty titleVi`);
    check(PREMIUM_BEATS.includes(s.beat), `${tag}: beat ${s.beat}`);
    check(PREMIUM_SHOT_SIZES.includes(s.shotSize), `${tag}: shotSize ${s.shotSize}`);
    check([4, 6, 8].includes(s.durationSeconds), `${tag}: durationSeconds ${s.durationSeconds}`);
    check([0, 1, 2].includes(s.fxLevel), `${tag}: fxLevel ${s.fxLevel}`);
    check(Array.isArray(s.characters) && s.characters.every((id) => ids.includes(id)), `${tag}: characters ${JSON.stringify(s.characters)}`);
    check(!!s.cameraMoveEn && !!s.actionEn && !!s.startStateEn, `${tag}: empty camera/action/start`);
    check(countWords(s.actionEn) <= 30, `${tag}: actionEn ${countWords(s.actionEn)} words`);
    check(typeof s.endStateEn === 'string' && countWords(s.endStateEn) >= 3, `${tag}: endStateEn missing (L1 needs an end keyframe for every shot): ${s.endStateEn}`);
    for (const k of ['cameraMoveEn', 'startStateEn', 'endStateEn', 'actionEn', 'actingBeatEn', 'gazeEn', 'vocalEn', 'sfxEn', 'ambientEn', 'fxEn'] as const) {
      check(typeof s[k] === 'string', `${tag}: ${k} not a string`);
      check(!DIRTY_EN_RE.test(s[k] || ''), `${tag}: ${k} has IDs/numbers/brackets: ${s[k]}`);
    }
    if (s.dialogue) {
      const speaker = b.characters.find((c) => c.id === s.dialogue!.speaker);
      check(!!speaker, `${tag}: dialogue speaker ${s.dialogue.speaker} missing`);
      check(!!speaker && speaker.canSpeak, `${tag}: dialogue for non-speaking ${speaker?.displayNameEn}`);
      check(countWords(s.dialogue.lineEn) >= 1 && countWords(s.dialogue.lineEn) <= 8, `${tag}: dialogue ${countWords(s.dialogue.lineEn)} words`);
      check(!/["“”]/.test(s.dialogue.lineEn + s.dialogue.lineVi), `${tag}: quotes in dialogue`);
      check(typeof s.dialogue.lineVi === 'string' && s.dialogue.lineVi.trim().length > 0, `${tag}: empty lineVi`);
    }
  });
}

/** Dựng mọi loại prompt cho một bible, lint thật và kiểm tra khoảng số từ. */
function assertPrompts(label: string, b: PremiumStoryBible, aspectRatio: string, withRefs: boolean) {
  const style = b.style;
  for (const c of b.characters) {
    const sheets = buildCharacterSheetPrompts({ style, character: c });
    for (const [kind, text] of Object.entries(sheets)) {
      const r = lintPremiumPrompt(text, 'sheet', { style });
      wordStats.sheet.push(r.words);
      check(r.words >= WORDS.sheet[0] && r.words <= WORDS.sheet[1], `${label} ${c.id} ${kind}: ${r.words} words outside ${WORDS.sheet.join('-')}`);
      check(r.ok, `${label} ${c.id} ${kind}: ${r.issues.join(' | ')}\n      ${text}`);
      check(/#808080/.test(text), `${label} ${c.id} ${kind}: missing #808080 grey`);
      check(text.includes(STYLE_PRESETS[style].sheetStyleEn.split(',')[0]), `${label} ${c.id} ${kind}: missing sheet style`);
    }
    check(/front|three-quarter/i.test(sheets.turnaroundEn) && /back/i.test(sheets.turnaroundEn), `${label} ${c.id}: turnaround lacks views`);
    check(/six/i.test(sheets.expressionSheetEn) && /surprised/i.test(sheets.expressionSheetEn), `${label} ${c.id}: expression sheet lacks six expressions`);
  }
  const plate = buildEnvironmentPlatePrompt({ style, environment: b.environment, aspectRatio });
  const pr = lintPremiumPrompt(plate, 'image', { style });
  wordStats.plate.push(pr.words);
  check(pr.words >= WORDS.plate[0] && pr.words <= WORDS.plate[1], `${label} plate: ${pr.words} words outside ${WORDS.plate.join('-')}`);
  check(pr.ok, `${label} plate: ${pr.issues.join(' | ')}\n      ${plate}`);

  for (const s of b.shots) {
    const tag = `${label} shot ${s.shotNumber} ${s.shotSize}`;
    const referenceOrder = withRefs
      ? [...s.characters.map((id) => `${id} sheet`), ...(isFaceShotSize(s.shotSize) && s.characters[0] ? [`${s.characters[0]} expressions`] : []), 'environment plate']
      : undefined;
    const kf = buildKeyframePrompt({ style, shot: s, characters: b.characters, environment: b.environment, aspectRatio, referenceOrder });
    const kr = lintPremiumPrompt(kf, 'image', { style });
    wordStats.keyframe.push(kr.words);
    check(kr.words >= WORDS.keyframe[0] && kr.words <= WORDS.keyframe[1], `${tag} keyframe: ${kr.words} words outside ${WORDS.keyframe.join('-')}\n      ${kf}`);
    check(kr.ok, `${tag} keyframe: ${kr.issues.join(' | ')}\n      ${kf}`);
    // Trạng thái đầu cảnh dài: câu phong cách được rút thành câu ngắn TRƯỚC khi cắt trạng thái đầu (bản render dino_premium_v2).
    check(
      kf.startsWith(STYLE_PRESETS[style].styleSentenceEn.split(',')[0]) || kf.startsWith(STYLE_PRESETS[style].shortStyleEn.split(',')[0]),
      `${tag} keyframe: does not open with the style sentence`
    );
    for (const c of b.characters.filter((ch) => s.characters.includes(ch.id))) {
      check(kf.includes(c.displayNameEn), `${tag} keyframe: missing ${c.displayNameEn}`);
    }
    if (withRefs) check(/\(image 1\)|image 1\b/.test(kf), `${tag} keyframe: reference images not cited`);
    for (const lang of ['en', 'vi'] as const) {
      const mv = buildMotionPrompt({ style, shot: s, characters: b.characters, environment: b.environment, dialogueLang: lang });
      const mr = lintPremiumPrompt(mv, 'video', { style });
      if (lang === 'en') wordStats.motion.push(mr.words);
      check(mr.words >= WORDS.motion[0] && mr.words <= WORDS.motion[1], `${tag} motion(${lang}): ${mr.words} words outside ${WORDS.motion.join('-')}\n      ${mv}`);
      check(mr.ok, `${tag} motion(${lang}): ${mr.issues.join(' | ')}\n      ${mv}`);
      check(/\bSFX:/.test(mv) && /Ambient noise:/.test(mv), `${tag} motion(${lang}): missing SFX:/Ambient noise: labels`);
      check(!/["“”]/.test(mv), `${tag} motion(${lang}): quotation marks`);
      if (s.dialogue && lang === 'en') {
        const name = b.characters.find((c) => c.id === s.dialogue!.speaker)?.displayNameEn;
        check(new RegExp(`${name} says: \\S`).test(mv), `${tag} motion: dialogue not as "<Name> says: line"\n      ${mv}`);
      }
    }
    const jp = buildTakeJudgePrompt({ shot: s, characters: b.characters, frameTimesSec: [0.5, 4, 7.5] });
    check(jp.includes('"overall"') && jp.includes('"artifacts"'), `${tag} judge prompt: missing rubric keys`);
    check(!/"overall":\s*\d/.test(jp), `${tag} judge prompt: example JSON carries a filled-in (anchoring) overall score`);
    // L1: khung cuối = SỬA khung đầu (ảnh 1) + sheet từng nhân vật trong cảnh (tối đa 3 ảnh).
    const ef = buildEndFrameEditPrompt({ style, shot: s, characters: b.characters, environment: b.environment });
    const er = lintPremiumPrompt(ef, 'edit', { style });
    wordStats.endframe.push(er.words);
    check(er.words >= WORDS.endframe[0] && er.words <= WORDS.endframe[1], `${tag} end frame: ${er.words} words outside ${WORDS.endframe.join('-')}\n      ${ef}`);
    check(er.ok, `${tag} end frame: ${er.issues.join(' | ')}\n      ${ef}`);
    check(ef.startsWith('Edit image 1. Keep the background') && /Change only (?:the poses and expressions|small natural movements): \S/.test(ef), `${tag} end frame: not an edit of image 1\n      ${ef}`);
    check(ef.includes('Same scale and same positions in the frame as image 1.'), `${tag} end frame: framing lock missing\n      ${ef}`);
    check(!/\bimage [4-9]\b/.test(ef), `${tag} end frame: more than 3 reference images\n      ${ef}`);
    for (const c of b.characters.filter((ch) => s.characters.includes(ch.id)).slice(0, 2)) {
      check(new RegExp(`${c.displayNameEn} keeps exactly the same design as image [23]: \\S`).test(ef), `${tag} end frame: ${c.displayNameEn} not locked to its sheet\n      ${ef}`);
    }
    // L7: nhiều khung + cổng cứng + beat timing.
    const dense = denseJudgeFrameTimes(s.durationSeconds);
    const jd = buildTakeJudgePrompt({ shot: s, characters: b.characters, frameTimesSec: dense, referenceFrames: ['start keyframe', 'end keyframe', 'character sheet'] });
    check(dense.length >= 12 && jd.includes(`images 4-${3 + dense.length}`), `${tag} dense judge: ${dense.length} frames / numbering`);
    check(PREMIUM_JUDGE_HARD_GATES.every((g) => jd.includes(`"${g}"`)) && /"beat_peak": <seconds or null>/.test(jd), `${tag} dense judge: hard gates / beat timing missing`);
    check(!/"overall":\s*\d/.test(jd), `${tag} dense judge: anchoring overall score`);
    const legacy = toLegacyShotFields(s, b);
    check(legacy.premium === s && legacy.shotNumber === s.shotNumber, `${tag}: toLegacyShotFields premium/shotNumber`);
    check(['PRE_MAIN_BUILDUP', 'MAIN_CLIMAX_CONFLICT', 'POST_MAIN_AFTERMATH'].includes(legacy.macroPhase), `${tag}: macroPhase ${legacy.macroPhase}`);
    check(
      ['MASTER_ESTABLISHING', 'OTS_CONFRONTATION', 'KULESHOV_REACTION', 'INSERT_DETAIL_CUTAWAY', 'POV_SUBJECTIVE', 'LOW_ANGLE_HERO_APEX'].includes(legacy.coverageType),
      `${tag}: coverageType ${legacy.coverageType}`
    );
    check(legacy.subtitleVi === (s.dialogue ? s.dialogue.lineVi : ''), `${tag}: subtitleVi mapping`);
  }
}

// ───────────────────────────── 1) Fallback bibles x styles ─────────────────────────────

const SCRIPTS = [
  {
    key: 'dino',
    script: 'Đại chiến sinh tồn tiền sử tại Thung lũng Nham thạch Kreta giữa hai đại quái thú khủng long: Bạo chúa dung nham và Thủy quái lôi đình.',
  },
  {
    key: 'otter',
    script: 'Phim hài ngắn: chú rái cá nhỏ Kiki lần đầu học trượt ván trên con dốc công viên, loạng choạng, ngã nhào vào bụi cây rồi bật cười và thử lại.',
  },
  {
    key: 'horror',
    script: 'Phim kinh dị ngắn: cô bé Mai và bà ngoại trốn trong căn nhà hoang lúc nửa đêm; tiếng gõ cửa vang lên ở cuối hành lang tối.',
  },
];
const STYLES: PremiumStyleKey[] = ['pixar3d', 'graphic2d', 'photoreal'];
const SHOT_COUNT = 12;

section('1) Fallback bibles: coverage quotas + prompt lint (3 scripts x 3 styles)');
const fallbackBibles: Record<string, PremiumStoryBible> = {};
for (const { key, script } of SCRIPTS) {
  for (const style of STYLES) {
    const label = `${key}/${style}`;
    let bible: PremiumStoryBible;
    try {
      bible = buildFallbackStoryBible({ script, shotCount: SHOT_COUNT, style });
    } catch (e: any) {
      check(false, `${label}: buildFallbackStoryBible threw ${e?.message || e}`);
      continue;
    }
    fallbackBibles[label] = bible;
    if (style === 'pixar3d') {
      info(`${key}: "${bible.movieTitle}" — ${bible.characters.map((c) => `${c.displayNameEn} (${c.species}, speaks=${c.canSpeak})`).join(' + ')} @ ${bible.environment.displayNameVi}`);
    }
    const again = buildFallbackStoryBible({ script, shotCount: SHOT_COUNT, style });
    check(JSON.stringify(again) === JSON.stringify(bible), `${label}: fallback is not deterministic`);
    assertValidBible(label, bible, { shotCount: SHOT_COUNT, style });
    const planned = planCoverage(bible.shots);
    check(JSON.stringify(planned) === JSON.stringify(bible.shots), `${label}: planCoverage changed an already planned bible (not idempotent)`);
    assertCoverage(label, planned);
    check(planned[0].beat === 'setup' && planned[planned.length - 1].beat === 'resolution', `${label}: beats do not run setup -> resolution`);
    const order = planned.map((s) => PREMIUM_BEATS.indexOf(s.beat));
    check(order.every((v, i) => i === 0 || v >= order[i - 1]), `${label}: beats out of order ${planned.map((s) => s.beat).join(',')}`);
    // Ảnh tham chiếu có thứ tự ở 16:9 cho pixar3d, không tham chiếu + 9:16 cho các phong cách khác.
    assertPrompts(label, bible, style === 'pixar3d' ? '16:9' : '9:16', style === 'pixar3d');
    const room = buildStoryRoomPrompt({ script, shotCount: SHOT_COUNT, style, aspectRatio: '16:9', dialogueLang: 'en' });
    check(room.includes(script) && room.includes(String(SHOT_COUNT)) && room.includes('"shots"'), `${label}: story room prompt lacks script/shot count/schema`);
  }
}
{
  const dino = fallbackBibles['dino/pixar3d'];
  if (dino) {
    check(dino.characters.length === 2 && dino.characters.every((c) => /saur|rex|dino|tops/i.test(c.species)), `dino: expected two dinosaurs, got ${dino.characters.map((c) => c.species).join(', ')}`);
    check(dino.characters.every((c) => !c.canSpeak) && dino.shots.every((s) => !s.dialogue), 'dino: creatures should be non-speaking (vocal reactions only)');
    check(dino.shots.some((s) => !!s.vocalEn), 'dino: no vocal reactions at all');
  }
  const otter = fallbackBibles['otter/pixar3d'];
  if (otter) check(/otter/i.test(otter.characters[0].species) && /kiki/i.test(otter.characters[0].displayNameEn), `otter: char1 is ${otter.characters[0].displayNameEn}/${otter.characters[0].species}`);
  const horror = fallbackBibles['horror/pixar3d'];
  if (horror) {
    check(horror.characters.length === 2, `horror: expected 2 characters, got ${horror.characters.length}`);
    check(!horror.characters.some((c) => /saur|rex|dino/i.test(c.species)), 'horror: dinosaurs forced into a non-dino script');
  }
  // Giới hạn đã biết của fallback heuristic (chỉ dùng khi LLM lỗi): vai không có trong thư viện loài -> 1 nhân vật mặc định.
  const sisters = buildFallbackStoryBible({
    script: 'Horror short: two sisters, Mai and Lan, explore an abandoned house at midnight. A door creaks open and something whispers their names.',
    shotCount: SHOT_COUNT,
    style: 'pixar3d',
  });
  assertValidBible('horror-sisters', sisters, { shotCount: SHOT_COUNT, style: 'pixar3d' });
  assertCoverage('horror-sisters', sisters.shots);
  if (sisters.characters.length < 2) {
    info(`NOTE (known limitation): "two sisters, Mai and Lan" -> fallback cast ${sisters.characters.map((c) => `${c.displayNameEn}/${c.species}`).join(' + ')} @ ${sisters.environment.displayNameVi}`);
  }
}

// planCoverage phải SỬA được một danh sách cảnh tệ (toàn WS lặp lại, fx 2 khắp nơi, OTS một nhân vật).
{
  const base = fallbackBibles['otter/pixar3d'] || buildFallbackStoryBible({ script: SCRIPTS[1].script, shotCount: SHOT_COUNT, style: 'pixar3d' });
  for (const [label, mutate] of [
    ['all-WS + fx2', (s: PremiumShot) => ({ ...s, shotSize: 'WS', fxLevel: 2, fxEn: 'a burst of warm dust' })],
    ['all-MS', (s: PremiumShot) => ({ ...s, shotSize: 'MS' })],
    ['all-OTS one char', (s: PremiumShot) => ({ ...s, shotSize: 'OTS', characters: ['char1'] })],
    ['all-CU', (s: PremiumShot) => ({ ...s, shotSize: 'CU' })],
    ['invalid size', (s: PremiumShot) => ({ ...s, shotSize: 'SUPER_WIDE' })],
  ] as Array<[string, (s: PremiumShot) => any]>) {
    const fixed = planCoverage(base.shots.map(mutate));
    check(fixed.length === base.shots.length, `planCoverage(${label}): length changed`);
    check(fixed.every((s) => PREMIUM_SHOT_SIZES.includes(s.shotSize)), `planCoverage(${label}): invalid shot size survived`);
    assertCoverage(`planCoverage(${label})`, fixed);
  }
  for (const n of [1, 2, 3, 5, 8, 16, 24]) {
    const b = buildFallbackStoryBible({ script: SCRIPTS[2].script, shotCount: n, style: 'graphic2d' });
    check(b.shots.length === n, `horror n=${n}: got ${b.shots.length} shots`);
    assertCoverage(`horror n=${n}`, b.shots);
  }
  check(Array.isArray(planCoverage([])) && planCoverage([]).length === 0, 'planCoverage([]) should return []');
}

// Lint phải bắt được prompt kiểu cũ (nếu manifest run cũ tồn tại).
{
  const bad = lintPremiumPrompt(
    'Kiki rolls down the dune with no fear, never stops, 2.4m/s, 35°, 50% of frame, Z=5m, @KIKI and BAO_CHUA_IGNIS_REX [x] "hi" inside a dome, lava lightning, purple orange cyan.',
    'video'
  );
  for (const needle of ['negation', 'measurement', 'raw IDs', 'square brackets', 'quotation', 'artifact', 'effect terms', 'three competing hues']) {
    check(bad.issues.some((i) => i.includes(needle)), `lint missed: ${needle}`);
  }
  const short = lintPremiumPrompt('A small otter.', 'image');
  check(!short.ok && short.issues.some((i) => i.startsWith('word count')), 'lint should flag a too-short image prompt');
  const dlg = lintPremiumPrompt(
    'Static camera. Kiki shakes her head and grins. In a bright squeaky voice, Kiki says: No, not today! SFX: wheels rattle. Ambient noise: distant birds. Pixar-like 3D animation, soft global illumination, expressive faces.',
    'video'
  );
  check(!dlg.issues.some((i) => i.startsWith('negation')), `lint should ignore negations inside dialogue: ${dlg.issues.join(' | ')}`);
  const manifestPath = path.join(DINO_RUN, 'master_production_manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const legacy = (manifest.shots || []).find((s: any) => s.frontLoadedMotionVideoPromptEn || s.spatialLayoutImagePromptEn);
      if (legacy) {
        const lv = lintPremiumPrompt(String(legacy.frontLoadedMotionVideoPromptEn || ''), 'video');
        const li = lintPremiumPrompt(String(legacy.spatialLayoutImagePromptEn || ''), 'image');
        info(`legacy dino prompts: video ${lv.words} words / ${lv.issues.length} issues, image ${li.words} words / ${li.issues.length} issues`);
        check(!lv.ok && !li.ok, 'lint should reject the legacy dino prompts');
      }
    } catch (e: any) {
      check(false, `legacy manifest unreadable: ${e?.message || e}`);
    }
  }
}

// ───────────────────────────── 2) Judge parsing / best take ─────────────────────────────

section('2) parseJudgeVerdict / pickBestTake edge cases');
{
  const valid = parseJudgeVerdict(
    '{"identityMatch": 8, "anatomyStable": 7, "noMorphing": 7, "faceReadable": null, "actingVisible": 6, "compositionClear": 8, "effectsRestraint": 9, "motionQuality": 7, "artifacts": [], "overall": 74, "pass": true, "note": "Slight tail drift."}'
  );
  check(valid && valid.overall === 74 && valid.pass === true && valid.scores.identityMatch === 8, `valid JSON parsed wrong: ${JSON.stringify(valid)}`);
  check(valid && !('faceReadable' in valid.scores), 'null rubric entry should be dropped, not scored');

  const fenced = parseJudgeVerdict(
    'Sure! Here is my review:\n```json\n{"identityMatch": 5, "anatomyStable": 4, "noMorphing": 3, "faceReadable": 5, "actingVisible": 4, "compositionClear": 6, "effectsRestraint": 7, "motionQuality": 4, "artifacts": ["melting", "extra limbs"], "overall": 68, "pass": true, "note": "Legs melt."}\n```\nThanks'
  );
  check(fenced && fenced.artifacts.length === 2, `fenced JSON not parsed: ${JSON.stringify(fenced)}`);
  check(fenced && fenced.overall <= 50 && fenced.pass === false, `severe artifacts must cap the score and fail the take: ${JSON.stringify(fenced)}`);

  for (const [label, text] of [
    ['empty string', ''],
    ['prose only', 'The take looks great, overall 95/100.'],
    ['truncated JSON', '{"identityMatch": 8, "overall": 9'],
    ['placeholder echo', '{"identityMatch": <0-10>, "overall": <0-100>}'],
    ['no scores', '{"note": "looks fine", "artifacts": []}'],
    ['non-numeric overall', '{"overall": "great"}'],
  ] as Array<[string, string]>) {
    let v: any = 'threw';
    try {
      v = parseJudgeVerdict(text);
    } catch {
      v = 'threw';
    }
    check(v === null, `parseJudgeVerdict(${label}) should be null (fail closed), got ${JSON.stringify(v)}`);
  }
  for (const bad of [null, undefined, 42] as any[]) {
    let v: any = 'threw';
    try {
      v = parseJudgeVerdict(bad);
    } catch {
      v = 'threw';
    }
    check(v === null, `parseJudgeVerdict(${String(bad)}) should be null, got ${JSON.stringify(v)}`);
  }

  const derived = parseJudgeVerdict('{"identityMatch": 6, "anatomyStable": 6, "noMorphing": 6, "actingVisible": 6, "compositionClear": 6, "effectsRestraint": 6, "motionQuality": 6}');
  check(derived && derived.overall === 60 && derived.pass === (60 >= PREMIUM_JUDGE_PASS_SCORE), `overall derived from rubric: ${JSON.stringify(derived)}`);
  const tenScale = parseJudgeVerdict('{"identityMatch": 8, "anatomyStable": 8, "noMorphing": 8, "actingVisible": 8, "motionQuality": 8, "overall": 8.2, "artifacts": "none"}');
  check(tenScale && tenScale.overall === 82 && tenScale.artifacts.length === 0, `0-10 overall should rescale to 0-100: ${JSON.stringify(tenScale)}`);
  // Điểm dạng chuỗi: lấy số đầu tiên ("7 out of 10" -> 7, không phải 710 -> 10); chuỗi không có số -> bỏ qua, không thành 0.
  const strScores = parseJudgeVerdict(
    '{"identityMatch": "7 out of 10", "anatomyStable": "6/10", "noMorphing": "good", "actingVisible": 5, "compositionClear": true, "effectsRestraint": "7", "motionQuality": 6, "overall": "64/100"}'
  );
  check(strScores && strScores.scores.identityMatch === 7 && strScores.scores.anatomyStable === 6, `string rubric scores parsed wrong: ${JSON.stringify(strScores)}`);
  check(strScores && !('noMorphing' in strScores.scores) && !('compositionClear' in strScores.scores), `non-numeric rubric values must be dropped: ${JSON.stringify(strScores)}`);
  check(strScores && strScores.overall === 64, `"64/100" overall parsed as ${strScores?.overall}`);
  check(parseJudgeVerdict('{"overall": true}') === null, 'boolean overall should be null');
  const clamped = parseJudgeVerdict('{"identityMatch": 14, "overall": 140}');
  check(!clamped || (clamped.overall <= 100 && Object.values(clamped.scores).every((x) => x <= 10)), `scores must be clamped: ${JSON.stringify(clamped)}`);
  const lowPass = parseJudgeVerdict('{"identityMatch": 2, "anatomyStable": 4, "noMorphing": 3, "actingVisible": 3, "motionQuality": 3, "overall": 30, "pass": true}');
  check(lowPass && lowPass.pass === false, `pass must follow the score, not the model's claim: ${JSON.stringify(lowPass)}`);
  // Thiếu rubric / điểm tổng mâu thuẫn / lỗi nặng / tiêu chí bắt buộc thấp -> fail closed.
  const R5 = '"identityMatch": 8, "anatomyStable": 8, "noMorphing": 8, "actingVisible": 8, "compositionClear": 8';
  check(parseJudgeVerdict('{"overall": 85}') === null, 'overall without rubric must be null');
  check(parseJudgeVerdict('{"overall": 85, "identityMatch": 9, "anatomyStable": 9}') === null, 'fewer than 5 rubric scores must be null');
  for (const tag of ['extra characters', 'missing limbs', 'text on screen', 'wrong speaker']) {
    const v = parseJudgeVerdict(`{${R5}, "overall": 82, "pass": true, "artifacts": ["${tag}"]}`);
    check(v && v.pass === false && v.overall <= 50, `severe artifact "${tag}" must fail: ${JSON.stringify(v)}`);
  }
  const texture = parseJudgeVerdict(`{${R5}, "overall": 82, "pass": true, "artifacts": ["plastic texture on skin"]}`);
  check(texture && texture.overall === 82 && texture.pass === true, `"texture" must not count as on-screen text: ${JSON.stringify(texture)}`);
  const contradict = parseJudgeVerdict('{"identityMatch": 2, "anatomyStable": 3, "noMorphing": 2, "actingVisible": 3, "compositionClear": 3, "effectsRestraint": 3, "motionQuality": 3, "overall": 88, "pass": true, "artifacts": []}');
  check(contradict && contradict.overall <= 40 && contradict.pass === false, `overall contradicting the rubric must be capped: ${JSON.stringify(contradict)}`);
  const blurryFace = parseJudgeVerdict(`{${R5}, "faceReadable": 2, "overall": 82, "pass": true, "artifacts": ["blurry face"]}`, { faceShot: true });
  check(blurryFace && blurryFace.pass === false, `blurry face on a face shot must fail: ${JSON.stringify(blurryFace)}`);
  const hardKey = parseJudgeVerdict('{"identityMatch": 5, "anatomyStable": 9, "noMorphing": 9, "actingVisible": 9, "compositionClear": 9, "overall": 80, "pass": true}');
  check(hardKey && hardKey.pass === false, `identityMatch below 6 must fail: ${JSON.stringify(hardKey)}`);
  const notYes = parseJudgeVerdict(`{${R5}, "overall": 75, "pass": "not yes"}`);
  check(notYes && notYes.pass === false, `pass "not yes" must not count as yes: ${JSON.stringify(notYes)}`);
  const speakerBad = parseJudgeVerdict(`{${R5}, "speakerCorrect": 3, "overall": 80, "pass": true}`);
  check(speakerBad && speakerBad.pass === false, `wrong speaker (speakerCorrect 3) must fail: ${JSON.stringify(speakerBad)}`);

  for (const v of [valid, fenced, derived, tenScale]) check(!v || (v.overall >= 0 && v.overall <= 100 && typeof v.note === 'string'), `verdict shape: ${JSON.stringify(v)}`);

  const V = (overall: number) =>
    parseJudgeVerdict(
      `{"overall": ${overall}, "identityMatch": 8, "anatomyStable": 8, "noMorphing": 8, "actingVisible": 8, "compositionClear": 8, "artifacts": []}`
    );
  const takes = [
    { path: 't1', verdict: V(61) },
    { path: 't2', verdict: null },
    { path: 't3', verdict: V(77) },
    { path: 't4', verdict: V(77) },
  ];
  const best = pickBestTake(takes);
  check(best.index === 2 && best.best.path === 't3', `pickBestTake: highest wins, tie -> earlier take (got index ${best.index})`);
  check(pickBestTake([{ verdict: null }, { verdict: null }]).index === 0, 'pickBestTake: all null -> first take');
  check(pickBestTake([{ verdict: null }, { verdict: V(10) }]).index === 1, 'pickBestTake: null verdict ranks below any score');
  check(pickBestTake([{ verdict: V(90) }]).index === 0, 'pickBestTake: single take');
  const empty = pickBestTake([] as Array<{ verdict: null }>);
  check(empty.index === -1 && empty.best === undefined, `pickBestTake([]) should be index -1, got ${empty.index}`);

  check(estimateCredits({ shots: 12, takes: 2, model: 'Veo 3.1 - Quality' }) === 2400, 'credits: 12 x 2 x Quality(100)');
  check(estimateCredits({ shots: 12, takes: 1, model: 'Veo 3.1 - Lite' }) === 60, 'credits: 12 x 1 x Lite(5)');
  check(estimateCredits({ shots: 8, takes: 3, model: 'Veo 3.1 - Fast' }) === 240, 'credits: 8 x 3 x Fast(10)');
}

// ───────────────────────────── 3) normalizeStoryBible on malformed LLM JSON ─────────────────────────────

section('3) normalizeStoryBible on malformed LLM JSON');
{
  const THIRTY_WORDS =
    'Listen to me carefully because I am only going to say this once before the sun goes down and the whole valley starts shaking under our feet again tonight, friend';
  check(countWords(THIRTY_WORDS) === 30, `fixture dialogue should be 30 words, is ${countWords(THIRTY_WORDS)}`);
  const otterScript = SCRIPTS[1].script;
  const messy = {
    movieTitle: 'Kiki Trượt Ván',
    characters: [
      {
        safeId: 'kiki rái cá',
        displayNameVi: 'Kiki',
        displayNameEn: 'KIKI_OTTER',
        species: 'otter',
        lookEn: '"A 60cm otter" with brown fur, 3 whiskers, [SKILL_1_SPIN] glowing lava stripes, lightning tail and a purple scarf, height 1.2m, @KIKI_OTTER, never sad',
        canSpeak: 'true',
        voiceEn: 'squeaky voice',
        personalityVi: 'Vui vẻ, tò mò.',
      },
      { name: 'BAO_CHUA_IGNIS_REX', species: 'tyrannosaurus', lookEn: 'charcoal T-rex with orange stripes and cyan eyes, 12m tall, Z=5.8m', canSpeak: false },
      { name: 'Third', species: 'cat', lookEn: 'a cat' },
    ],
    environment: {
      safeId: 'SA_MAC',
      lookEn: 'Desert dunes under a dome of purple lightning, Z=5.8m, no people, with lava rivers and explosions',
      lightingEn: 'orange sun, cyan rim and violet fill',
      paletteEn: 'purple, orange and cyan',
      timeOfDayEn: 'dusk',
    },
    shots: Array.from({ length: 14 }, (_v, i) => ({
      shotNumber: i + 1,
      titleVi: `Cảnh ${i + 1}`,
      beat: ['intro', 'catalyst', 'rising action', 'twist', 'Climax!', 'ending', 'weird'][i % 7],
      shotSize: ['Wide', 'close-up', 'CLOSE UP', 'KULESHOV_REACTION', 'extreme wide', 'over the shoulder', 'insert', 'POV', 'medium'][i % 9],
      cameraMoveEn: 'slow push in then whip pan and crane up at 2.4m/s',
      characters: i % 3 === 0 ? ['KIKI_OTTER', 'BAO_CHUA_IGNIS_REX'] : ['Kiki'],
      startStateEn: '@KIKI_OTTER stands at X=22% (0.0s-2.5s) on the dune, not moving, Z=3m',
      actionEn: '@KIKI_OTTER kicks off [SKILL_1_SPIN] and rolls 3 meters. Then a second action happens.',
      actingBeatEn: 'Her frown turns into a grin, never looking away',
      gazeEn: 'looking at @BAO_CHUA_IGNIS_REX',
      dialogue: i % 2 === 0 ? { speaker: 'KIKI_OTTER', lineEn: `"${THIRTY_WORDS}"`, lineVi: '"Nghe này!"' } : null,
      sfxEn: 'SFX: wheels on sand, 120fps sparks, explosions',
      ambientEn: 'Ambient: wind',
      fxLevel: 2,
      fxEn: 'lava explosion with lightning and sparks inside a dome',
      durationSeconds: 7,
    })),
  };

  const samples: Array<[string, unknown, { script: string; shotCount: number; style: PremiumStyleKey }]> = [
    ['messy object (wrong enums, IDs/numbers, 30-word dialogue)', messy, { script: otterScript, shotCount: 12, style: 'pixar3d' }],
    ['messy JSON string', JSON.stringify(messy), { script: otterScript, shotCount: 12, style: 'graphic2d' }],
    ['fenced JSON with prose', 'Here you go:\n```json\n' + JSON.stringify(messy) + '\n```\nEnjoy!', { script: otterScript, shotCount: 8, style: 'photoreal' }],
    ['wrapped {text}', { text: JSON.stringify(messy) }, { script: otterScript, shotCount: 12, style: 'pixar3d' }],
    [
      'missing fields (no environment, shots without sizes/beats)',
      { characters: [{ displayNameEn: 'Kiki', species: 'otter' }], shots: Array.from({ length: 12 }, () => ({ actionEn: 'Kiki pushes off down the slope' })) },
      { script: otterScript, shotCount: 12, style: 'pixar3d' },
    ],
    ['too few shots', { ...messy, shots: messy.shots.slice(0, 2) }, { script: otterScript, shotCount: 12, style: 'pixar3d' }],
    ['too many shots', { ...messy, shots: [...messy.shots, ...messy.shots, ...messy.shots] }, { script: otterScript, shotCount: 10, style: 'pixar3d' }],
    [
      'non-speaking speaker + numeric strings',
      {
        ...messy,
        characters: [{ ...messy.characters[0], canSpeak: false }, messy.characters[1]],
        shots: messy.shots.map((s) => ({ ...s, fxLevel: '2', durationSeconds: '8', characters: 'KIKI_OTTER' })),
      },
      { script: otterScript, shotCount: 12, style: 'pixar3d' },
    ],
    ['garbage text', 'this is not json at all', { script: SCRIPTS[0].script, shotCount: 8, style: 'graphic2d' }],
    ['truncated JSON', JSON.stringify(messy).slice(0, 700), { script: otterScript, shotCount: 6, style: 'pixar3d' }],
    ['null', null, { script: '', shotCount: 6, style: 'pixar3d' }],
    ['number', 42, { script: SCRIPTS[2].script, shotCount: 6, style: 'photoreal' }],
    ['empty array', [], { script: SCRIPTS[2].script, shotCount: 6, style: 'pixar3d' }],
    ['shots not an array', { shots: 'x', characters: [null] }, { script: SCRIPTS[2].script, shotCount: 6, style: 'pixar3d' }],
  ];
  for (const [label, raw, params] of samples) {
    let nb: PremiumStoryBible | null = null;
    try {
      nb = normalizeStoryBible(raw, params);
    } catch (e: any) {
      check(false, `normalize(${label}) threw: ${e?.message || e}`);
      continue;
    }
    assertValidBible(`normalize(${label})`, nb, params);
    assertCoverage(`normalize(${label})`, nb.shots);
    assertPrompts(`normalize(${label})`, nb, params.style === 'graphic2d' ? '9:16' : '16:9', true);
  }

  const nb = normalizeStoryBible(messy, { script: otterScript, shotCount: 12, style: 'pixar3d' });
  info(`messy -> chars: ${nb.characters.map((c) => `${c.id}:${c.safeId}:${c.displayNameEn}:speaks=${c.canSpeak}`).join(' | ')}`);
  info(`messy -> look1: ${nb.characters[0].lookEn}`);
  info(`messy -> env: ${nb.environment.lookEn} | ${nb.environment.lightingEn} | ${nb.environment.paletteEn}`);
  check(nb.characters.length === 2, `messy: third character should be dropped (got ${nb.characters.length})`);
  check(nb.characters[0].canSpeak === true && nb.characters[1].canSpeak === false, 'messy: canSpeak "true"/false not coerced');
  check(nb.characters[0].displayNameEn !== 'KIKI_OTTER' && /kiki/i.test(nb.characters[0].displayNameEn), `messy: displayNameEn ID not cleaned (${nb.characters[0].displayNameEn})`);
  check(!/purple|violet/i.test(`${nb.environment.lightingEn} ${nb.environment.paletteEn}`) || !/cyan/i.test(`${nb.environment.lightingEn} ${nb.environment.paletteEn}`), 'messy: purple + cyan both survived in env lighting/palette');
  const dlgShots = nb.shots.filter((s) => s.dialogue);
  check(dlgShots.length > 0, 'messy: all dialogue was lost (Kiki can speak)');
  for (const s of dlgShots) check(countWords(s.dialogue!.lineEn) <= 8, `messy: dialogue not clamped (${countWords(s.dialogue!.lineEn)} words)`);
  check(nb.shots.every((s) => s.durationSeconds === 8 || s.durationSeconds === 6 || s.durationSeconds === 4), 'messy: durationSeconds 7 not coerced');
  const ns = normalizeStoryBible(samples[7][1], samples[7][2]);
  check(ns.shots.every((s) => !s.dialogue), 'non-speaking speaker: dialogue should be removed');
  check(ns.shots.every((s) => typeof s.fxLevel === 'number' && typeof s.durationSeconds === 'number'), 'numeric strings not coerced to numbers');
}

// ───────────────────────────── 3b) Review regressions (meaning, not just shape) ─────────────────────────────

section('3b) Review regressions: fallback meaning, montage repair, speaker framing');
{
  const PREMIUM_DEFAULT_SCRIPT =
    'Đại chiến sinh tồn tiền sử tại Thung lũng Nham thạch Kreta giữa hai đại quái thú khủng long: Bạo chúa dung nham và Thủy quái lôi đình tranh giành nguồn nước cuối cùng.';
  const def = buildFallbackStoryBible({ script: PREMIUM_DEFAULT_SCRIPT, shotCount: 12, style: 'pixar3d' });
  check(def.characters[1]?.safeId === 'THUY_QUAI_LOI_DINH', `default script: char2 safeId ${def.characters[1]?.safeId} (expected THUY_QUAI_LOI_DINH)`);
  check(def.characters[0]?.safeId === 'BAO_CHUA_DUNG_NHAM', `default script: char1 safeId ${def.characters[0]?.safeId}`);
  const horror = buildFallbackStoryBible({ script: SCRIPTS[2].script, shotCount: 12, style: 'pixar3d' });
  check(/house|hallway/i.test(horror.environment.lookEn), `horror env should be a house/hallway: ${horror.environment.lookEn}`);
  check(/night|midnight/i.test(horror.environment.timeOfDayEn), `horror timeOfDay should be night: ${horror.environment.timeOfDayEn}`);
  check(/moon/i.test(horror.environment.lightingEn), `horror lighting should be moonlight: ${horror.environment.lightingEn}`);
  const horrorLines = horror.shots.filter((x) => x.dialogue).map((x) => x.dialogue!.lineEn).join(' | ');
  check(!/best day ever|again! one more time|okay\. i can do this/i.test(horrorLines), `horror uses comedy lines: ${horrorLines}`);
  check(/hear|hide|stay|cat/i.test(horrorLines), `horror lines lack tension beats: ${horrorLines}`);
  const otter = buildFallbackStoryBible({ script: SCRIPTS[1].script, shotCount: 12, style: 'pixar3d' });
  check(/park|path|hill/i.test(otter.environment.lookEn), `otter env should be the park slope: ${otter.environment.lookEn}`);
  check(!/meadow/i.test(otter.environment.lookEn), `otter env fell back to the meadow: ${otter.environment.lookEn}`);

  // OTS: người nói quay mặt về máy (characters[1]); tên người nói gắn với thân hình trong prompt video.
  for (const b of [horror, otter, ...Object.values(fallbackBibles)]) {
    for (const x of b.shots) {
      if (x.shotSize === 'OTS' && x.dialogue) {
        check(x.characters[1] === x.dialogue.speaker, `${b.movieTitle} shot ${x.shotNumber}: OTS speaker ${x.dialogue.speaker} has the back to camera (${x.characters})`);
      }
      if (x.dialogue) {
        const mv = buildMotionPrompt({ style: b.style, shot: x, characters: b.characters, environment: b.environment, dialogueLang: 'en' });
        const name = b.characters.find((c) => c.id === x.dialogue!.speaker)!.displayNameEn;
        check(new RegExp(`${name}(?:'s|, the )`).test(mv.split(' says')[0]), `${b.movieTitle} shot ${x.shotNumber}: speaker ${name} is never bound to a body\n      ${mv}`);
      }
    }
  }

  // Montage hiệu ứng kiểu "LLM bỏ qua luật" -> chuẩn hóa phải sửa được nội dung, và cổng chất lượng phải chặn.
  const actions = [
    'Ignis Rex and Volt Spino charge at each other across the burning valley',
    'Ignis Rex breathes a torrent of lava at Volt Spino',
    'Volt Spino blasts a bolt of lightning from its sail at Ignis Rex',
    'The two titans collide in a massive shockwave of lava and lightning',
    'Ignis Rex slams its tail into Volt Spino sending it flying',
    'Volt Spino rises from the river crackling with lightning',
    'Both monsters roar as the volcano erupts behind them',
    "Ignis Rex bites down on Volt Spino's neck",
    'Volt Spino throws Ignis Rex into a lava lake',
    'Ignis Rex emerges from the lava glowing brighter',
    'The final clash of fire and lightning lights up the sky',
    'Ignis Rex stands victorious over the smoking valley',
  ];
  const montage = {
    movieTitle: 'Đại Chiến Kreta',
    characters: [
      { id: 'char1', safeId: 'IGNIS_REX', displayNameVi: 'Bạo chúa dung nham', displayNameEn: 'Ignis Rex', species: 'tyrannosaurus rex', lookEn: 'A massive armored tyrannosaurus with obsidian scales, glowing lava cracks across its body, fiery orange eyes and molten lava dripping from its jaws as a signature accent', voiceEn: 'thunderous roars', canSpeak: false },
      { id: 'char2', safeId: 'VOLT_SPINO', displayNameVi: 'Thủy quái lôi đình', displayNameEn: 'Volt Spino', species: 'spinosaurus', lookEn: 'A huge spinosaurus with deep blue scales and a tall sail crackling with purple lightning as a signature accent, glowing cyan eyes', voiceEn: 'electric shrieks', canSpeak: false },
    ],
    environment: { safeId: 'KRETA', displayNameVi: 'Thung lũng Kreta', lookEn: 'A volcanic valley with rivers of lava, erupting volcanoes, lightning storms in a purple sky and a last shrinking lake', timeOfDayEn: 'night', lightingEn: 'orange lava glow from below and purple lightning flashes from above', paletteEn: 'orange, purple and cyan' },
    shots: actions.map((a, i) => ({
      titleVi: `Cảnh ${i + 1}`, beat: i < 2 ? 'setup' : i < 4 ? 'escalation' : i < 10 ? 'climax' : 'resolution', shotSize: i % 2 ? 'EWS' : 'WS',
      cameraMoveEn: 'epic sweeping drone orbit around both titans', characters: ['char1', 'char2'], startStateEn: 'Both titans face each other across the lava river',
      actionEn: a, actingBeatEn: 'rage', gazeEn: 'locked on the enemy', dialogue: null, vocalEn: 'a thunderous roar', sfxEn: 'massive explosions and thunder',
      ambientEn: 'roaring lava and thunderstorm', fxLevel: 2, fxEn: 'lava explosions and lightning strikes', durationSeconds: 8,
    })),
  };
  const mb = normalizeStoryBible(montage, { script: PREMIUM_DEFAULT_SCRIPT, shotCount: 12, style: 'pixar3d' });
  const looks = mb.characters.map((c) => c.lookEn).join(' | ');
  info(`montage looks: ${looks}`);
  info(`montage env: ${mb.environment.timeOfDayEn} | ${mb.environment.lightingEn} | ${mb.environment.paletteEn}`);
  check(!/\b(\w+) \1\b/i.test(looks), `montage looks have doubled words: ${looks}`);
  check(!/^a tyrannosaurus rex, /i.test(mb.characters[0].lookEn), `montage: species prefixed although the look names it: ${mb.characters[0].lookEn}`);
  check(!/^[A-Z]/.test(mb.characters[1].lookEn), `montage: look starts with a capital article: ${mb.characters[1].lookEn}`);
  check(!/golden sun|low sun/i.test(mb.environment.lightingEn), `montage: night scene lit by the sun: ${mb.environment.lightingEn}`);
  check(
    mb.shots.every((x) => ALLOWED_CAMERA_MOVES.includes(x.cameraMoveEn)),
    `montage: camera moves outside the allowed list: ${[...new Set(mb.shots.map((x) => x.cameraMoveEn))].join(', ')}`
  );
  const sheets = buildCharacterSheetPrompts({ style: 'pixar3d', character: mb.characters[1], withReferenceImage: true });
  for (const [k, t] of Object.entries(sheets)) {
    const r = lintPremiumPrompt(t, 'sheet', { style: 'pixar3d' });
    check(r.ok, `montage sheet ${k} (with reference sentence): ${r.issues.join(' | ')}\n      ${t}`);
  }
  for (const x of mb.shots) {
    const tag = `montage shot ${x.shotNumber} ${x.shotSize}/${x.beat}`;
    if (isFaceShotSize(x.shotSize)) {
      check(!hasContactAction(x.actionEn), `${tag}: face shot keeps a contact action: ${x.actionEn}`);
      check(['static', 'slow push in'].includes(x.cameraMoveEn) || x.shotSize === 'MCU', `${tag}: face shot camera ${x.cameraMoveEn}`);
      const mv = buildMotionPrompt({ style: 'pixar3d', shot: x, characters: mb.characters, environment: mb.environment, dialogueLang: 'en' });
      const lr = lintPremiumPrompt(mv, 'video', { style: 'pixar3d', shotSize: x.shotSize });
      check(lr.ok, `${tag}: motion lint ${lr.issues.join(' | ')}\n      ${mv}`);
      if (VERBOSE) info(`${tag}: ${mv}`);
    }
    if (x.beat === 'setup' || x.beat === 'resolution') {
      for (const k of ['actionEn', 'startStateEn', 'sfxEn'] as const) {
        check(!/\b(?:lava|lightning|explosions?|sparks?|fireballs?|shockwaves?)\b/i.test(x[k]), `${tag}: ${k} keeps an effect in a ${x.beat} shot: ${x[k]}`);
      }
    }
    check(countWords(x.actingBeatEn) >= 3, `${tag}: one-word acting beat survived: ${x.actingBeatEn}`);
  }
  const gate = assessStoryBible(mb);
  check(!gate.ok, 'quality gate should reject the spectacle montage');
  info(`montage gate: ${gate.issues.join(' | ')}`);
  for (const [label, b] of Object.entries(fallbackBibles)) {
    const g = assessStoryBible(b);
    check(g.ok, `${label}: fallback bible fails the quality gate: ${g.issues.join(' | ')}`);
  }
  check(hasContactAction('Ember slams its tail') && !hasContactAction('Kiki bites a lip and grins'), 'hasContactAction vocabulary');
  check(
    lintPremiumPrompt(
      'Static camera. The animated tyrannosaurus slams its tail into the spinosaurus. SFX: a thud. Ambient noise: wind. Pixar-like 3D animation, soft global illumination, expressive faces, with a close look.',
      'video',
      { shotSize: 'CU' }
    ).issues.some((i) => i.startsWith('face-size shot')),
    'lint should flag a contact action in a face-size shot'
  );
}

// ───────────────────────────── 3c) Real-render lessons L1-L7 (dino_premium_v2, Veo 3.1 Quality) ─────────────────────────────

section('3c) Real-render lessons: end frames, cut-on-action, closed mouths, screen direction, stance, water, dense judge');
{
  const DINO_SCRIPT = SCRIPTS[0].script;
  const dino = buildFallbackStoryBible({ script: DINO_SCRIPT, shotCount: 16, style: 'pixar3d' });
  const byTitle = (t: string) => dino.shots.find((s) => s.titleVi === t);
  const kfOf = (b: PremiumStoryBible, s: PremiumShot, referenceOrder?: string[]) =>
    buildKeyframePrompt({ style: b.style, shot: s, characters: b.characters, environment: b.environment, aspectRatio: '16:9', referenceOrder });
  const mvOf = (b: PremiumStoryBible, s: PremiumShot, withEndFrame = true) =>
    buildMotionPrompt({ style: b.style, shot: s, characters: b.characters, environment: b.environment, dialogueLang: 'en', withEndFrame });
  const efOf = (b: PremiumStoryBible, s: PremiumShot, referenceOrder?: string[]) =>
    buildEndFrameEditPrompt({ style: b.style, shot: s, characters: b.characters, environment: b.environment, referenceOrder });
  const lintAll = (tag: string, b: PremiumStoryBible, s: PremiumShot) => {
    for (const [kind, text] of [['image', kfOf(b, s)], ['video', mvOf(b, s)], ['edit', efOf(b, s)]] as const) {
      const r = lintPremiumPrompt(text, kind, { style: b.style, shotSize: s.shotSize });
      check(r.ok, `${tag} ${kind}: ${r.issues.join(' | ')}\n      ${text}`);
    }
  };
  check(dino.shots.length === 16 && dino.shots.every((s) => countWords(s.endStateEn || '') >= 3), 'dino16: every shot needs an endStateEn');

  // ── L1: end keyframe = edit of the start keyframe; same framing; sheet of each character in the shot.
  const sip = byTitle('Ngụm nước bị cắt ngang');
  const ots = byTitle('Kẻ lạ trong lau sậy');
  if (check(sip && ots, 'dino16: template shots missing')) {
    const ef = efOf(dino, sip!);
    info(`L1 end frame (shot ${sip!.shotNumber} ${sip!.shotSize}): ${ef}`);
    check(/^Edit image 1\. Keep the background, [^.]*lighting, colours, camera angle, lens and Pixar-like 3D animation style of image 1 exactly the same\./.test(ef), `L1: edit sentence shape\n      ${ef}`);
    check(ef.includes('Change only the poses and expressions: Ember frozen mid-sip'), `L1: end state not used\n      ${ef}`);
    check(/Ember keeps exactly the same design as image 2: a stocky young tyrannosaurus/.test(ef), `L1: Ember sheet lock\n      ${ef}`);
    const ef2 = efOf(dino, ots!);
    check(/Ember keeps exactly the same design as image 2/.test(ef2) && /Tide keeps exactly the same design as image 3/.test(ef2), `L1: both sheets locked in a two-character shot\n      ${ef2}`);
    const efOrder = efOf(dino, ots!, ['start keyframe', 'char2 sheet', 'char1 sheet']);
    check(efOrder.startsWith('Edit image 1.') && /Tide keeps exactly the same design as image 2/.test(efOrder) && /Ember keeps exactly the same design as image 3/.test(efOrder), `L1: referenceOrder mapping\n      ${efOrder}`);
    const efStart2 = efOf(dino, sip!, ['char1 sheet', 'start keyframe']);
    check(efStart2.startsWith('Edit image 2.') && /as image 1:/.test(efStart2) && /frame as image 2\.$/.test(efStart2), `L1: start keyframe at a different index\n      ${efStart2}`);
    check(mvOf(dino, sip!, true).includes('as the first and last frames throughout') && mvOf(dino, sip!, false).includes('as the first frame throughout'), 'L1: motion lock sentence must mention the end frame only when it is used');
  }
  // L1 via normalize: missing endStateEn -> derived; camera words dropped (same shot size); water phrasing.
  const chars2 = [
    { id: 'char1', safeId: 'EMBER', displayNameVi: 'Ember', displayNameEn: 'Ember', species: 'tyrannosaurus', lookEn: 'a stocky young tyrannosaurus with charcoal-grey skin, big amber eyes and bright orange stripes down the back as a signature accent', voiceEn: 'deep growls', canSpeak: false },
    { id: 'char2', safeId: 'TIDE', displayNameVi: 'Tide', displayNameEn: 'Tide', species: 'spinosaurus', lookEn: 'a lanky spinosaurus with slate-blue skin, a long narrow snout and a tall teal-striped sail as a signature accent', voiceEn: 'raspy hisses', canSpeak: false },
  ];
  const llmShot = (o: Record<string, unknown>) => ({ titleVi: 'Cảnh', beat: 'escalation', shotSize: 'MS', cameraMoveEn: 'static', characters: ['char1', 'char2'], startStateEn: 'Ember and Tide face each other at the edge of the pool', actionEn: 'Ember stamps a foot', actingBeatEn: 'calm turns into tense focus', gazeEn: 'locked on Tide', dialogue: null, vocalEn: '', sfxEn: 'a heavy stamp', ambientEn: 'wind', fxLevel: 0, fxEn: '', durationSeconds: 8, ...o });
  const llm = {
    movieTitle: 'Test',
    characters: chars2,
    environment: { safeId: 'VALLEY', displayNameVi: 'Thung lũng', lookEn: 'a prehistoric river valley of giant ferns, mossy boulders and a wide shallow pool', timeOfDayEn: 'golden hour', lightingEn: 'a low golden sun from the right', paletteEn: 'mossy greens with a teal accent' },
    shots: [
      llmShot({ beat: 'setup', shotSize: 'WS', characters: ['char1'], startStateEn: 'Ember stands on the rocks above the pool', actionEn: 'Ember looks down at the pool', actingBeatEn: 'tired eyes brighten with hope' }),
      llmShot({ beat: 'setup', shotSize: 'CU', characters: ['char1'], startStateEn: 'Ember with water dripping from the jaw, eyes half closed', actionEn: 'Ember freezes mid-sip', actingBeatEn: 'relief turns into sharp suspicion', endStateEn: 'the camera pulls back to a wide shot, Ember frozen with narrowed suspicious eyes' }),
      llmShot({ beat: 'inciting', shotSize: 'OTS', startStateEn: 'Tide in the tall reeds across the pool', actionEn: 'Tide steps out of the reeds onto the far bank', actingBeatEn: 'a sly grin widens' }),
      llmShot({ beat: 'escalation', shotSize: 'WS', actionEn: 'Ember and Tide circle on the dry rocks', fxLevel: 1, fxEn: 'a towering wall of water spray' }),
      llmShot({ beat: 'climax', shotSize: 'MS', actionEn: 'Ember charges and headbutts Tide square in the chest', actingBeatEn: 'focus hardens into fierce resolve', endStateEn: "Ember's head slams into Tide's chest", fxLevel: 2, fxEn: 'a wall of water spray erupting around them' }),
      llmShot({ beat: 'climax', shotSize: 'MS', startStateEn: 'Ember and Tide wade knee-deep in the shallows of the pool', actionEn: 'Tide stumbles back through the shallows', actingBeatEn: 'shock melts into wary respect', fxLevel: 1, fxEn: 'a huge geyser of water spray' }),
      llmShot({ beat: 'resolution', shotSize: 'MCU', characters: ['char1'], actionEn: 'Ember lowers the snout and drinks at last', actingBeatEn: 'exhaustion eases into a small proud smile' }),
    ],
  };
  const nb = normalizeStoryBible(llm, { script: DINO_SCRIPT, shotCount: 7, style: 'pixar3d' });
  assertValidBible('L1 normalize', nb, { shotCount: 7, style: 'pixar3d' });
  const nShot = (needle: RegExp) => nb.shots.find((s) => needle.test(`${s.startStateEn} ${s.actionEn}`));
  const cam = nShot(/mid-sip/);
  if (check(cam, 'L1 normalize: mid-sip shot lost')) {
    check(!/camera|wide shot|pulls back/i.test(cam!.endStateEn || '') && /suspicious/.test(cam!.endStateEn || ''), `L1: camera words must be dropped from endStateEn (same shot size): ${cam!.endStateEn}`);
    check(/a few droplets on the jaw/.test(cam!.startStateEn) && !/dripping/.test(cam!.startStateEn), `L6: "water dripping from the jaw" -> "a few droplets": ${cam!.startStateEn}`);
  }
  const derived = nShot(/looks down at the pool/);
  if (derived) check(/^Ember\b/.test(derived.endStateEn || '') && countWords(derived.endStateEn || '') <= 26, `L1: derived endStateEn: ${derived.endStateEn}`);

  // ── L4: no body reveals; contact ends one step before contact; impact lands on the cut.
  const reveal = nb.shots.find((s) => /reeds/.test(s.actionEn));
  if (check(reveal, 'L4: reeds shot lost')) check(!/steps? out of|emerges?|out of the reeds/i.test(reveal!.actionEn) && /leans forward at the edge of/.test(reveal!.actionEn), `L4: body reveal must become an in-place action: ${reveal!.actionEn}`);
  const charge = nb.shots.find((s) => /headbutt/.test(s.actionEn));
  if (check(charge, 'L4: headbutt shot lost')) {
    check(/one step/.test(charge!.endStateEn || '') && !/slams into/.test(charge!.endStateEn || ''), `L4: contact end state must stop one step before contact: ${charge!.endStateEn}`);
    check(charge!.fxLevel === 0 && !charge!.fxEn, `L6: water wall on dry rocks must be dropped: ${charge!.fxLevel} ${charge!.fxEn}`);
    const mv = mvOf(nb, charge!);
    check(/ending one step before contact\./.test(mv), `L4: motion must cut on action\n      ${mv}`);
    const ef = efOf(nb, charge!);
    check(/A clear gap of open air stays between Ember and Tide\./.test(ef), `L4: end frame keeps an air gap\n      ${ef}`);
    const jp = buildTakeJudgePrompt({ shot: charge!, characters: nb.characters, frameTimesSec: denseJudgeFrameTimes(8) });
    check(/Cut on action/.test(jp), 'L4: judge must know the shot cuts before contact');
  }
  const dry = nb.shots.find((s) => /circle on the dry rocks/.test(s.actionEn));
  if (dry) check(dry.fxLevel === 0 && !dry.fxEn, `L6: water spray on dry ground must be dropped: ${dry.fxEn}`);
  const wet = nb.shots.find((s) => /knee-deep/.test(s.startStateEn));
  if (check(wet, 'L6: shallows shot lost')) check(wet!.fxLevel === 1 && wet!.fxEn === 'a low splash of water around the feet', `L6: splash where bodies touch water stays low around the feet: ${wet!.fxLevel} ${wet!.fxEn}`);
  for (const t of ['Cú đớp hụt', 'Cú quật đuôi', 'Cú húc trời giáng']) {
    const s = byTitle(t);
    if (!check(s, `L4: dino shot ${t} missing`)) continue;
    check(/one step|a hand's width|a head's width|empty air/.test(s!.endStateEn || ''), `L4 ${t}: end state must stop before contact: ${s!.endStateEn}`);
    check(/ending one step before contact/.test(mvOf(dino, s!)), `L4 ${t}: motion must cut on action\n      ${mvOf(dino, s!)}`);
  }
  const mercy = byTitle('Lòng khoan dung');
  if (check(mercy, 'dino: mercy shot missing')) check(!/ending one step before contact/.test(mvOf(dino, mercy!)), `L4: "pauses mid-strike" is not a contact action\n      ${mvOf(dino, mercy!)}`);
  check(!dino.shots.some((s) => /steps? out of|slips into|plods|toward the camera/i.test(s.actionEn)), 'L4: dino template still has reveals / locomotion toward camera');

  // ── L5: closed mouth, positive phrasing, for every non-happy beat; open mouth only when roaring/speaking; dazed = slack jaw.
  const CLOSED = 'mouth is firmly closed, lips covering the teeth, serious';
  if (sip) {
    check(efOf(dino, sip).includes(`Ember's ${CLOSED} suspicious expression.`), `L5: suspicion end frame\n      ${efOf(dino, sip)}`);
    // Đủ chỗ: câu riêng "ends with the mouth firmly closed ..."; thiếu chỗ: mệnh đề nối vào câu diễn xuất ", ending with the mouth ...".
    check(/suspicion/.test(mvOf(dino, sip)) && /\b(?:ends|ending) with the mouth firmly closed, lips covering the teeth/.test(mvOf(dino, sip)), `L5: suspicion motion\n      ${mvOf(dino, sip)}`);
  }
  const daze = byTitle('Choáng váng');
  if (check(daze, 'dino: daze shot missing')) {
    check(/Tide's jaw hangs slack, eyes unfocused\./.test(kfOf(dino, daze!)), `L5: dazed start keyframe\n      ${kfOf(dino, daze!)}`);
    check(new RegExp(`Tide's ${CLOSED} (?:wary|respectful) expression.`).test(efOf(dino, daze!)), `L5: wary end frame\n      ${efOf(dino, daze!)}`);
  }
  if (mercy) {
    check(efOf(dino, mercy).includes(`Ember's ${CLOSED} merciful expression.`), `L5: mercy end frame\n      ${efOf(dino, mercy)}`);
    check(/mercy|merciful/.test(mvOf(dino, mercy)) && /\b(?:ends|ending) with the mouth firmly closed, lips covering the teeth/.test(mvOf(dino, mercy)), `L5: mercy motion\n      ${mvOf(dino, mercy)}`);
  }
  const roar = byTitle('Lời cảnh cáo');
  if (check(roar, 'dino: roar shot missing')) {
    check(/fierce[^.]*lowered brows/.test(mvOf(dino, roar!)) && !/lips covering/.test(mvOf(dino, roar!)),`L5: a roaring mouth stays open, serious\n      ${mvOf(dino, roar!)}`);
    check(/Ember has a serious fierce expression with lowered brows\./.test(efOf(dino, roar!)), `L5: roar end frame\n      ${efOf(dino, roar!)}`);
  }
  const happy = byTitle('Ngụm nước chiến thắng');
  if (check(happy, 'dino: happy shot missing')) check(!/lips covering|serious/.test(efOf(dino, happy!) + mvOf(dino, happy!)), 'L5: a happy (smile) beat must not be forced into a closed mouth');
  const eye = byTitle('Ánh mắt không khuất phục');
  if (check(eye, 'dino: ECU shot missing')) check(/eyes and brows show a serious determined look/.test(efOf(dino, eye!)) && !/mouth/.test(efOf(dino, eye!)), `L5: an extreme close-up talks about eyes, not the mouth\n      ${efOf(dino, eye!)}`);

  // ── Screen direction (180-degree rule) + species stance.
  const tideCu = dino.shots.find((s) => s.shotSize === 'CU' && s.characters[0] === 'char2');
  const emberCu = dino.shots.find((s) => s.shotSize === 'CU' && s.characters[0] === 'char1');
  if (check(tideCu && emberCu, 'dino: single close-ups missing')) {
    check(/facing screen-left/.test(kfOf(dino, tideCu!)) && /keeps facing screen-left/.test(mvOf(dino, tideCu!)) && /Tide faces screen-left\./.test(efOf(dino, tideCu!)), 'direction: char2 faces screen-left in keyframe/motion/end frame');
    check(/facing screen-right/.test(kfOf(dino, emberCu!)) && /keeps facing screen-right/.test(mvOf(dino, emberCu!)), 'direction: char1 faces screen-right');
    const flipped: PremiumShot = { ...emberCu!, facing: { char1: 'left' } };
    check(/facing screen-left/.test(kfOf(dino, flipped)) && /keeps facing screen-left/.test(mvOf(dino, flipped)), 'direction: per-shot facing override');
    const said: PremiumShot = { ...emberCu!, startStateEn: `${emberCu!.startStateEn}, Ember facing screen-left` };
    check(/facing screen-left/.test(kfOf(dino, said)), 'direction: "Ember facing screen-left" in the shot text overrides the default');
  }
  const swapped: PremiumShot = { ...(byTitle('Cú đớp hụt') as PremiumShot), characters: ['char2', 'char1'] };
  check(/Ember on the left facing right, Tide on the right facing left/.test(kfOf(dino, swapped)), `direction: two-shot keeps char1 left even when listed second\n      ${kfOf(dino, swapped)}`);
  if (mercy) check(/Over Tide's shoulder in soft foreground blur on the right, Ember on the left faces camera/.test(kfOf(dino, mercy)), `direction: OTS over char2 puts the shoulder on the right\n      ${kfOf(dino, mercy)}`);
  const wideTwo = byTitle('Cú quật đuôi');
  if (wideTwo) check(/Both stand on two strong hind legs/.test(kfOf(dino, wideTwo)) && /Both stay upright on two hind legs/.test(mvOf(dino, wideTwo)), `stance: two bipeds\n      ${kfOf(dino, wideTwo)}\n      ${mvOf(dino, wideTwo)}`);
  const ridge = byTitle('Hồ nước cuối cùng');
  if (ridge) check(/Ember stands on two strong hind legs, tiny arms tucked to the chest\./.test(kfOf(dino, ridge)), `stance: T-rex on two legs with tiny arms\n      ${kfOf(dino, ridge)}`);
  if (happy) check(/tiny arms stay tucked to the chest/.test(kfOf(dino, happy)) && !/hind legs/.test(kfOf(dino, happy)), 'stance: medium close-up shows arms only');
  if (eye) check(!/hind legs|arms/.test(kfOf(dino, eye)), 'stance: extreme close-up has no stance');
  const sunset = byTitle('Hoàng hôn trên thung lũng');
  if (sunset) check(!/hind legs/.test(efOf(dino, sunset)), `stance: a character settling down keeps no standing stance\n      ${efOf(dino, sunset)}`);
  const trikeChar: PremiumCharacter = { ...dino.characters[1], species: 'triceratops', lookEn: 'a sturdy triceratops with olive-green skin, a wide frill and a frill edged in bright yellow as a signature accent' };
  const trikeShot: PremiumShot = { ...(byTitle('Rút lui') as PremiumShot) };
  check(/Tide stands on four sturdy legs\./.test(buildKeyframePrompt({ style: 'pixar3d', shot: trikeShot, characters: [dino.characters[0], trikeChar], environment: dino.environment, aspectRatio: '16:9' })), 'stance: quadruped from species');
  const otterB = buildFallbackStoryBible({ script: SCRIPTS[1].script, shotCount: 12, style: 'pixar3d' });
  check(otterB.shots.every((s) => !/hind legs|four sturdy legs/.test(kfOf(otterB, s))), 'stance: no stance text for species without a known stance');

  // ── L6: water phrasing everywhere in the final prompts.
  for (const b of [dino, nb, otterB]) {
    for (const s of b.shots) {
      const all = `${kfOf(b, s)} ${mvOf(b, s)} ${efOf(b, s)}`;
      check(!/water (?:streaming|dripping|pouring|gushing)|dripping from the (?:jaw|chin|snout)|streaming off/i.test(all), `L6 ${b.movieTitle} shot ${s.shotNumber}: streaming/dripping water in a prompt`);
      if (isFaceShotSize(s.shotSize)) check(!/\bsteam(?:ing|y)?\b|\bmist\b/i.test(`${kfOf(b, s)} ${efOf(b, s)}`), `L6 ${b.movieTitle} shot ${s.shotNumber}: steam/mist words in a close-up`);
      lintAll(`L1-L6 ${b.movieTitle} shot ${s.shotNumber} ${s.shotSize}`, b, s);
    }
  }

  // ── Story room asks for all of it.
  const room = buildStoryRoomPrompt({ script: DINO_SCRIPT, shotCount: 12, style: 'pixar3d', aspectRatio: '16:9', dialogueLang: 'en' });
  for (const needle of ['endStateEn', 'ONE STEP BEFORE contact', 'Cut on action', 'no body reveals', 'screen-right', 'screen-left', 'lips covering the teeth', 'a few droplets', 'same shot size', 'in-place or sideways', 'two hind legs']) {
    check(room.includes(needle), `story room prompt lacks "${needle}"`);
  }

  // ── L7: dense frames, reference images, hard gates, beat timing.
  const times = denseJudgeFrameTimes(8);
  check(times.length >= 12 && times[0] === 0 && Math.abs(times[times.length - 1] - (8 - 1 / 24)) < 1e-3 && times.every((t, i) => i === 0 || t > times[i - 1]), `denseJudgeFrameTimes(8): ${times.join(', ')}`);
  check(denseJudgeFrameTimes(6, { count: 20, fps: 30 }).length === 22 && denseJudgeFrameTimes(0).every((t) => t === 0), 'denseJudgeFrameTimes options / zero duration');
  if (sip) {
    const jp = buildTakeJudgePrompt({ shot: sip, characters: dino.characters, frameTimesSec: times, referenceFrames: ['start keyframe', 'end keyframe', 'character sheet: Ember'], style: 'pixar3d', durationSec: 8 });
    if (VERBOSE) info(jp);
    check(jp.includes('You are given 3 reference images followed by 14 frames') && jp.includes('image 1 = start keyframe') && jp.includes('images 4-17'), 'L7: reference numbering');
    check(jp.includes(`sampled at ${times.map((t) => `${Math.round(t * 100) / 100}s`).join(', ')}`), 'L7: every frame time listed');
    check(/any smile, grin or laugh is wrong/.test(jp) && /mouth closed over the teeth/.test(jp), 'L7: expression gate for a non-happy beat');
    check(/Ember faces screen-right/.test(jp) && /Last frame: Ember frozen mid-sip/.test(jp) && /two hind legs/.test(jp), 'L7: facing / end state / stance in the brief');
    check(/beat_in, beat_peak and beat_out/.test(jp) && /caps overall at 55/.test(jp), 'L7: beat timing + gate cap explained');
  }
  if (happy) check(/a smile fits this beat/.test(buildTakeJudgePrompt({ shot: happy, characters: dino.characters, frameTimesSec: times })), 'L7: happy beat allows a smile');
  const legacyJudge = buildTakeJudgePrompt({ shot: dino.shots[0], characters: dino.characters, frameTimesSec: [0.5, 4, 7.5] });
  check(legacyJudge.split('\n')[1].startsWith('You are given 3 frames from the same take'), 'L7: prompt without references keeps the old second line (premiumShotProduction inserts its note there)');

  const R = '"identityMatch": 8, "anatomyStable": 8, "noMorphing": 8, "actingVisible": 8, "compositionClear": 8, "effectsRestraint": 8, "motionQuality": 8';
  const G = (o: Record<string, unknown> = {}) => JSON.stringify({ keyActionVisible: true, bodyIntact: true, expressionMatchesBeat: true, identityOnModel: true, facingCorrect: true, cleanFrame: true, ...o });
  const good = parseJudgeVerdict(`{${R}, "hardGates": ${G()}, "beat_in": 3.6, "beat_peak": "4.2s", "beat_out": 5.6, "overall": 82, "pass": true, "artifacts": [], "note": "Clean."}`, { durationSec: 8 });
  check(good && good.pass === true && good.overall === 82 && good.failedGates?.length === 0 && good.beatInSec === 3.6 && good.beatPeakSec === 4.2 && good.beatOutSec === 5.6, `L7: all gates pass: ${JSON.stringify(good)}`);
  for (const gate of PREMIUM_JUDGE_HARD_GATES) {
    const v = parseJudgeVerdict(`{${R}, "hardGates": ${G({ [gate]: false })}, "overall": 88, "pass": true}`);
    check(v && v.pass === false && v.overall <= PREMIUM_JUDGE_GATE_FAIL_CAP && v.failedGates?.includes(gate) && v.hardGates?.[gate] === false, `L7: failed gate ${gate} must fail the take and cap overall: ${JSON.stringify(v)}`);
  }
  const missingGate = parseJudgeVerdict(`{${R}, "hardGates": {"keyActionVisible": true, "bodyIntact": true}, "overall": 85, "pass": true}`);
  check(missingGate && missingGate.pass === false && missingGate.failedGates?.includes('cleanFrame'), `L7: a gate missing from the gates object fails closed: ${JSON.stringify(missingGate)}`);
  const vague = parseJudgeVerdict(`{${R}, "hardGates": ${G({ facingCorrect: 'maybe' })}, "overall": 85, "pass": true}`);
  check(vague && vague.pass === false && vague.failedGates?.includes('facingCorrect'), `L7: unreadable gate fails closed: ${JSON.stringify(vague)}`);
  const words = parseJudgeVerdict(`{${R}, "gates": {"keyActionVisible": "pass", "bodyIntact": "yes", "expressionMatchesBeat": 9, "identityOnModel": {"pass": true}, "facingCorrect": 1, "cleanFrame": "true"}, "overall": 80, "pass": true}`);
  check(words && words.pass === true && words.failedGates?.length === 0, `L7: gate values as words/numbers/objects: ${JSON.stringify(words)}`);
  const words2 = parseJudgeVerdict(`{${R}, "gates": {"keyActionVisible": "fail", "bodyIntact": 3, "expressionMatchesBeat": 0, "identityOnModel": true, "facingCorrect": true, "cleanFrame": true}, "overall": 80, "pass": true}`);
  check(words2 && words2.pass === false && ['keyActionVisible', 'bodyIntact', 'expressionMatchesBeat'].every((g) => words2.failedGates?.includes(g)), `L7: "fail" / 3 / 0 are failed gates: ${JSON.stringify(words2)}`);
  const topLevel = parseJudgeVerdict(`{${R}, "keyActionVisible": false, "overall": 80, "pass": true}`);
  check(topLevel && topLevel.pass === false && topLevel.failedGates?.includes('keyActionVisible') && topLevel.failedGates?.includes('cleanFrame'), `L7: top-level gate keys count as a gates answer (rest fail closed): ${JSON.stringify(topLevel)}`);
  const required = parseJudgeVerdict(`{${R}, "overall": 80, "pass": true}`, { requireHardGates: true });
  check(required && required.pass === false && required.overall <= PREMIUM_JUDGE_GATE_FAIL_CAP && required.failedGates?.length === PREMIUM_JUDGE_HARD_GATES.length, `L7: requireHardGates without gates fails closed: ${JSON.stringify(required)}`);
  const oldStyle = parseJudgeVerdict(`{${R}, "overall": 80, "pass": true, "note": "Slight tail drift."}`);
  check(oldStyle && oldStyle.pass === true && oldStyle.overall === 80 && !oldStyle.hardGates && oldStyle.failedGates?.length === 0 && oldStyle.beatPeakSec === null, `L7: old verdicts without gates parse as before: ${JSON.stringify(oldStyle)}`);
  for (const note of ['Tail sweep obscured by the mud splash.', 'The headbutt is missing.', 'Lacks the roar entirely.', 'The tail sweep never happens on screen.']) {
    const v = parseJudgeVerdict(`{${R}, "overall": 78, "pass": true, "note": "${note}"}`);
    check(v && v.pass === false && v.failedGates?.includes('keyActionVisible') && v.overall <= PREMIUM_JUDGE_GATE_FAIL_CAP, `L7: note "${note}" means the key action is missing: ${JSON.stringify(v)}`);
  }
  for (const note of ['Acting beat clear, nothing hidden.', 'Ember stops one step short without any contact, as planned.', 'Slight tail drift.']) {
    const v = parseJudgeVerdict(`{${R}, "hardGates": ${G()}, "overall": 78, "pass": true, "note": "${note}"}`);
    check(v && v.pass === true && v.failedGates?.length === 0, `L7: note "${note}" is not a missing-action complaint: ${JSON.stringify(v)}`);
  }
  const seeThrough = parseJudgeVerdict(`{${R}, "hardGates": ${G()}, "overall": 80, "pass": true, "artifacts": ["see-through body"]}`);
  check(seeThrough && seeThrough.pass === false && seeThrough.overall <= 50, `L7: see-through body is severe: ${JSON.stringify(seeThrough)}`);
  const swappedBeats = parseJudgeVerdict(`{${R}, "hardGates": ${G()}, "beat_in": 6.2, "beat_peak": 9.5, "beat_out": 4.1, "overall": 80}`, { durationSec: 8 });
  check(swappedBeats && swappedBeats.beatInSec === 4.1 && swappedBeats.beatOutSec === 6.2 && swappedBeats.beatPeakSec === 6.2, `L7: beat times are ordered and clamped: ${JSON.stringify(swappedBeats)}`);
  const midPeak = parseJudgeVerdict(`{${R}, "hardGates": ${G()}, "beat": {"in": 2, "out": 3}, "overall": 80}`);
  check(midPeak && midPeak.beatPeakSec === 2.5, `L7: missing beat_peak -> middle of [in, out]: ${JSON.stringify(midPeak)}`);
  const nullBeats = parseJudgeVerdict(`{${R}, "hardGates": ${G({ keyActionVisible: false })}, "beat_in": null, "beat_peak": null, "beat_out": null, "overall": 60}`);
  check(nullBeats && nullBeats.beatInSec === null && nullBeats.beatPeakSec === null && nullBeats.beatOutSec === null, `L7: null beats stay null: ${JSON.stringify(nullBeats)}`);

  // ── Real render regression (read-only): the dino_premium_v2 bible renders clean prompts with the new rules.
  const premiumBible = path.join(PREMIUM_RUN, 'bible.json');
  if (fs.existsSync(premiumBible)) {
    try {
      const rb = JSON.parse(fs.readFileSync(premiumBible, 'utf8')) as PremiumStoryBible;
      for (const s of rb.shots || []) {
        const tag = `dino_premium_v2 shot ${s.shotNumber} ${s.shotSize}`;
        lintAll(tag, rb, s);
        const all = `${kfOf(rb, s)} ${mvOf(rb, s)} ${efOf(rb, s)}`;
        check(!/water (?:streaming|dripping)|dripping from the jaw|streaming off/i.test(all), `${tag}: streaming/dripping water survived`);
        check(!(s.fxLevel > 0 && /water spray/i.test(s.fxEn) && /water spray/i.test(kfOf(rb, s)) && !/shallows|in the pool|wade|knee-deep/i.test(`${s.startStateEn} ${s.actionEn} ${s.endStateEn || ''}`)), `${tag}: water spray without water contact`);
      }
      const r5 = (rb.shots || []).find((s) => s.shotNumber === 5);
      if (r5) check(!/water spray/i.test(kfOf(rb, r5)), 'dino_premium_v2 shot 5: "a burst of water spray" on the dry ridge must be dropped');
      const r11 = (rb.shots || []).find((s) => s.shotNumber === 11);
      // Bible đang được sửa trực tiếp: shot 11 có lúc là cận mặt (miệng khép), có lúc là cận MẮT (chỉ mắt + chân mày).
      if (r11) check(/serious merciful (?:expression|look)/.test(efOf(rb, r11)), 'dino_premium_v2 shot 11: mercy end frame must keep a serious merciful expression');
      info(`dino_premium_v2: ${rb.shots?.length || 0} shots re-prompted with the L1-L7 rules`);
    } catch (e: any) {
      check(false, `dino_premium_v2 bible unreadable: ${e?.message || e}`);
    }
  } else {
    info(`SKIP dino_premium_v2 regression: ${premiumBible} not found`);
  }
}

// ───────────────────────────── 4) selectBestWindow on real clips ─────────────────────────────

// ───────────────────────────── 3d) Review r3 findings (evaluation panel, 2026-10-30) ─────────────────────────────

section('3d) Review r3: judge budget, start-state truncation, owner expression, open mouth, judge cleaning, notes, bible fields, impact SFX, design lock');
{
  const FIX = path.join(ROOT, 'output', 'regression_fixtures', 'dino_premium_v2_r3');
  const loadJson = (p: string): any => {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      return null;
    }
  };
  const fixtures: Array<{ tag: string; b: PremiumStoryBible }> = ['bible_0149.json', 'bible_0352.json', 'bible_0430.json']
    .map((f) => ({ tag: `fixture ${f}`, b: loadJson(path.join(FIX, f)) as PremiumStoryBible }))
    .filter((x) => x.b && Array.isArray(x.b.shots));
  if (!fixtures.length) info(`SKIP frozen dino_premium_v2 fixtures: ${FIX} not found`);
  const live = loadJson(path.join(PREMIUM_RUN, 'bible.json')) as PremiumStoryBible | null;
  const byNum = (b: PremiumStoryBible, n: number) => b.shots.find((s) => s.shotNumber === n);
  const f0149 = fixtures.find((x) => x.tag.includes('0149'))?.b;
  const f0352 = fixtures.find((x) => x.tag.includes('0352'))?.b;
  const kfOf = (b: PremiumStoryBible, s: PremiumShot) => buildKeyframePrompt({ style: b.style, shot: s, characters: b.characters, environment: b.environment, aspectRatio: '16:9' });
  const mvOf = (b: PremiumStoryBible, s: PremiumShot) => buildMotionPrompt({ style: b.style, shot: s, characters: b.characters, environment: b.environment, dialogueLang: 'en', withEndFrame: true });
  const efOf = (b: PremiumStoryBible, s: PremiumShot) => buildEndFrameEditPrompt({ style: b.style, shot: s, characters: b.characters, environment: b.environment });
  const sheetLabels = (b: PremiumStoryBible, s: PremiumShot) =>
    (s.characters || []).map((id) => b.characters.find((c) => c.id === id)).filter(Boolean).map((c) => `${c!.displayNameEn} (${c!.species}) turnaround sheet`);
  const jgOf = (b: PremiumStoryBible, s: PremiumShot, compact = false) =>
    buildTakeJudgePrompt({
      shot: s,
      characters: b.characters,
      frameTimesSec: denseJudgeFrameTimes(8, { count: 10 }),
      referenceFrames: ['start keyframe', 'end keyframe', ...sheetLabels(b, s)],
      style: b.style,
      durationSec: 8,
      environment: b.environment,
      ...(compact ? { maxChars: PREMIUM_JUDGE_PROMPT_MAX_CHARS } : {}),
    });

  // ── BLOCKER 1: the Flow judge / gate prompts fit the char budget (Flow rejected ~4,000+ chars with images) and avoid "see-through".
  const budgetBibles: Array<{ tag: string; b: PremiumStoryBible }> = [];
  for (const sc of SCRIPTS) for (const style of STYLES) budgetBibles.push({ tag: `${sc.key}/${style}`, b: buildFallbackStoryBible({ script: sc.script, shotCount: 12, style }) });
  budgetBibles.push(...fixtures);
  if (live) budgetBibles.push({ tag: 'dino_premium_v2 (live)', b: live });
  let judgeMax = 0;
  let gateMax = 0;
  for (const { tag, b } of budgetBibles) {
    for (const s of b.shots) {
      const t = `${tag} shot ${s.shotNumber} ${s.shotSize}`;
      const jp = jgOf(b, s, true);
      judgeMax = Math.max(judgeMax, jp.length);
      check(jp.length <= PREMIUM_JUDGE_PROMPT_MAX_CHARS, `${t}: compact judge prompt ${jp.length} chars > ${PREMIUM_JUDGE_PROMPT_MAX_CHARS}`);
      check(!/see-through/i.test(jp) && /translucent/.test(jp), `${t}: judge must say "translucent", never "see-through"`);
      check(/"hardGates"/.test(jp) && /beat_peak/.test(jp) && /"overall"/.test(jp) && !/"overall":\s*\d/.test(jp), `${t}: compact judge keeps gates, beat timing and an unanchored JSON template`);
      check(!/see-through/i.test(jgOf(b, s)), `${t}: verbose judge must not say "see-through"`);
      const lite = buildTakeJudgePrompt({
        shot: s,
        characters: b.characters,
        frameTimesSec: denseJudgeFrameTimes(8, { count: 10 }).slice(0, 8),
        referenceFrames: ['start keyframe', 'end keyframe'],
        style: b.style,
        durationSec: 8,
        environment: b.environment,
        maxChars: PREMIUM_JUDGE_LITE_MAX_CHARS,
      });
      check(lite.length <= PREMIUM_JUDGE_LITE_MAX_CHARS, `${t}: lite judge prompt ${lite.length} chars > ${PREMIUM_JUDGE_LITE_MAX_CHARS}`);
      const sheets = sheetLabels(b, s);
      const eg = buildEndFrameGatePrompt({ style: b.style, shot: s, characters: b.characters, referenceLabels: [...sheets, 'start keyframe'], maxChars: PREMIUM_GATE_PROMPT_MAX_CHARS });
      const kg = buildKeyframeGatePrompt({ style: b.style, shot: s, characters: b.characters, referenceLabels: sheets, maxChars: PREMIUM_GATE_PROMPT_MAX_CHARS });
      gateMax = Math.max(gateMax, eg.length, kg.length);
      check(eg.length <= PREMIUM_GATE_PROMPT_MAX_CHARS && kg.length <= PREMIUM_GATE_PROMPT_MAX_CHARS, `${t}: gate prompts ${kg.length}/${eg.length} chars > ${PREMIUM_GATE_PROMPT_MAX_CHARS}`);
      check(/"sceneDrift"/.test(eg) && /"wrongExpression"/.test(eg) && /"score"/.test(kg), `${t}: compact gates keep their JSON flags`);
    }
  }
  info(`judge prompt max ${judgeMax} chars (budget ${PREMIUM_JUDGE_PROMPT_MAX_CHARS}) · gate prompt max ${gateMax} chars (budget ${PREMIUM_GATE_PROMPT_MAX_CHARS}) over ${budgetBibles.length} bibles`);
  // A reply that follows the compact template parses with gates and beats.
  const compactReply =
    '{"identityMatch":8,"anatomyStable":8,"noMorphing":8,"faceReadable":null,"actingVisible":8,"compositionClear":8,"effectsRestraint":8,"motionQuality":8,"speakerCorrect":null,"hardGates":{"keyActionVisible":true,"bodyIntact":true,"expressionMatchesBeat":true,"identityOnModel":true,"facingCorrect":true,"cleanFrame":true},"beat_in":2.1,"beat_peak":3,"beat_out":4.2,"artifacts":[],"overall":78,"pass":true,"note":"Clean take."}';
  const cv = parseJudgeVerdict(compactReply, { requireHardGates: true, durationSec: 8 });
  check(cv && cv.pass === true && cv.beatPeakSec === 3 && cv.failedGates?.length === 0, `compact template reply parses: ${JSON.stringify(cv)}`);
  check(parseJudgeVerdict('{"identityMatch":8,"anatomyStable":8,"noMorphing":8,"actingVisible":8,"compositionClear":8,"overall":80,"artifacts":["translucent body"]}')?.overall! <= 50, 'translucent body is a severe artifact');

  // ── BLOCKER 2: start state is never cut into fragments; lint flags dangling fragments.
  for (const { tag, b } of fixtures) {
    for (const s of b.shots) {
      const t = `${tag} shot ${s.shotNumber} ${s.shotSize}`;
      for (const [kind, text] of [['image', kfOf(b, s)], ['video', mvOf(b, s)], ['edit', efOf(b, s)]] as const) {
        const r = lintPremiumPrompt(text, kind, { style: b.style, shotSize: s.shotSize });
        check(r.ok, `${t} ${kind}: ${r.issues.join(' | ')}\n      ${text}`);
      }
      const first = String(s.startStateEn || '').split(',')[0].trim().toLowerCase();
      if (first && !/water|drip|stream|steam|mist/i.test(first)) check(kfOf(b, s).toLowerCase().includes(first), `${t}: keyframe lost the first clause of the start state "${first}"\n      ${kfOf(b, s)}`);
    }
  }
  if (f0352) {
    const k9 = kfOf(f0352, byNum(f0352, 9)!);
    check(/head lowered, charging toward Tide/.test(k9), `B2 0352 shot 9: the lowered-head charge must survive\n      ${k9}`);
    const k5 = kfOf(f0352, byNum(f0352, 5)!);
    check(/crouched/.test(k5) && /ready to snap/.test(k5), `B2 0352 shot 5: crouch + snap set-up must survive\n      ${k5}`);
    const k7 = kfOf(f0352, byNum(f0352, 7)!);
    check(/the tip of Tide's long blue-grey tail entering low/.test(k7) && !/falling/.test(k7), `B2 0352 shot 7 INSERT: tail kept, contradicting "falling" gaze dropped\n      ${k7}`);
    const k11 = kfOf(f0352, byNum(f0352, 11)!);
    check(/the brow pulled down hard\./.test(k11), `B2 0352 shot 11: full start state\n      ${k11}`);
  }
  if (f0149) {
    const k3 = kfOf(f0149, byNum(f0149, 3)!);
    check(!/whose single rounded striped head\./.test(k3) && /crocodile snout rise out of the tall reeds/.test(k3), `B2 0149 shot 3: no dangling relative clause\n      ${k3}`);
    const k5 = kfOf(f0149, byNum(f0149, 5)!);
    check(/lunging forward with jaws wide open/.test(k5), `B2 0149 shot 5: Tide's lunge must survive\n      ${k5}`);
    const k7 = kfOf(f0149, byNum(f0149, 7)!);
    check(/long tail swinging low/.test(k7) && /^\S[^.]*\. Low-angle medium shot/.test(k7), `B2 0149 shot 7: tail swing kept, framing angle matches "low angle" in the start state\n      ${k7}`);
  }
  for (const frag of ['Side view along the mud shore, Ember.', 'Feet planted in the wet mud, the tip.', 'Over the shoulder of Ember, whose single rounded striped head.', 'Ember crouched with the mouth firmly.', 'Tide watching with a smug closed-mouth.']) {
    const r = lintPremiumPrompt(`Pixar-like 3D animation, soft global illumination, expressive faces. ${frag} A wide volcanic valley at golden hour, lit by a low golden sun, in a palette of warm amber and dusty rust tones with a small teal accent, crisp clean detail and a readable silhouette for every character in the frame.`, 'image', { style: 'pixar3d' });
    check(r.issues.some((i) => i.startsWith('dangling fragment')), `lint must flag the dangling fragment in "${frag}": ${r.issues.join(' | ')}`);
  }

  // ── MAJOR: expression is classified from the acting-beat owner's clauses only (shot 13: Tide's smug look ≠ Ember's beat).
  for (const b of [f0149, f0352].filter(Boolean) as PremiumStoryBible[]) {
    const s13 = byNum(b, 13);
    if (!s13) continue;
    const jp = jgOf(b, s13);
    check(!/a smile fits this beat/.test(jp) && /Ember looks serious and shocked/.test(jp), `owner expression (shot 13): judge must not accept a smile\n      ${jp.split('\n').filter((l) => /expression/i.test(l)).join(' | ')}`);
    check(!/smile/i.test(mvOf(b, s13)), `owner expression (shot 13): motion prompt must not ask for a smile\n      ${mvOf(b, s13)}`);
  }
  {
    const base = buildFallbackStoryBible({ script: SCRIPTS[0].script, shotCount: 12, style: 'pixar3d' });
    const two = base.shots.find((s) => s.characters.length === 2)!;
    const [a, bName] = two.characters.map((id) => base.characters.find((c) => c.id === id)!.displayNameEn);
    const s: PremiumShot = { ...two, shotSize: 'WS', actionEn: `${a} lands flat on the back in the mud`, actingBeatEn: `${a}'s face stays frozen in shock`, startStateEn: `${a} falling backward on the left, ${bName} on the right watching`, endStateEn: `${a} lying on the back in the mud with a frozen shocked face, ${bName} standing over with a smug grin`, dialogue: null };
    const jp = buildTakeJudgePrompt({ shot: s, characters: base.characters, frameTimesSec: [0, 4, 7.9] });
    check(new RegExp(`${a} looks serious and shocked`).test(jp) && !/a smile fits this beat/.test(jp), `owner expression (synthetic): the other character's smug grin must not turn ${a}'s shock into a happy beat`);
  }

  // ── MAJOR: scripted open mouths (round O of shock, snarl, bared teeth) are not overridden by "mouth firmly closed".
  if (f0149) {
    const s7 = byNum(f0149, 7)!;
    const m7 = mvOf(f0149, s7);
    check(!/O of shock, mouth firmly closed/.test(m7) && !/ending with the mouth firmly closed/.test(m7), `open mouth (0149 shot 7 motion): round O of shock contradicted\n      ${m7}`);
    const j7 = jgOf(f0149, s7);
    check(/open shocked mouth is fine/.test(j7) && !/Ember looks serious and shocked with the mouth closed over the teeth/.test(j7), `open mouth (0149 shot 7 judge)`);
    const k11 = kfOf(f0149, byNum(f0149, 11)!);
    check(/snarl/.test(k11) && !/mouth is firmly closed/.test(k11), `open mouth (0149 shot 11 keyframe): snarl contradicted\n      ${k11}`);
    const k13 = kfOf(f0149, byNum(f0149, 13)!);
    check(/round open mouth/.test(k13) && !/mouth is firmly closed/.test(k13), `open mouth (0149 shot 13 keyframe)\n      ${k13}`);
  }

  // ── MAJOR: the judge sees the same cleaned text as the builders (L6 water, L4 pre-contact last frame, physical FX).
  if (f0352) {
    for (const n of [2, 4, 6]) {
      const jp = jgOf(f0352, byNum(f0352, n)!);
      check(!/water (?:dripping|streaming)|dripping from the (?:jaw|chin)|streaming off/i.test(jp), `judge cleaning (0352 shot ${n}): L6 water streams must read as droplets`);
    }
    const j10 = jgOf(f0352, byNum(f0352, 10)!);
    check(!/sly smile/.test(j10) && /long narrow snout/.test(j10), `judge identity (0352 shot 10): lookEn smile stripped, snout kept`);
  }
  if (f0149) {
    const j9 = jgOf(f0149, byNum(f0149, 9)!);
    check(!/towering wall of water spray/.test(j9), 'judge cleaning (0149 shot 9): banned towering spray is not an allowed effect');
    const j7 = jgOf(f0149, byNum(f0149, 7)!);
    check(!/Last frame: Tide's tail has just struck/.test(j7) && /Last frame: [^\n]*before contact/.test(j7), `judge cleaning (0149 shot 7): last frame is the pre-contact edit`);
  }

  // ── minor: note-based keyActionVisible only fires when the missing word applies to the action itself.
  const R8 = '"identityMatch": 8, "anatomyStable": 8, "noMorphing": 8, "actingVisible": 8, "compositionClear": 8, "effectsRestraint": 8, "motionQuality": 8';
  for (const note of ['The roar reads clearly but the steam is missing in the last frames.', 'Clean take; the bite lands but the splash is hidden behind a rock.']) {
    const v = parseJudgeVerdict(`{${R8}, "overall": 80, "pass": true, "note": "${note}"}`);
    check(v && v.pass === true && v.failedGates?.length === 0 && v.overall === 80, `note "${note}" is about a secondary element: ${JSON.stringify(v)}`);
  }
  for (const note of ['The tail sweep is obscured by spray.', 'The headbutt itself is hidden by mud.', 'Charge is barely visible.']) {
    const v = parseJudgeVerdict(`{${R8}, "overall": 78, "pass": true, "note": "${note}"}`);
    check(v && v.pass === false && v.failedGates?.includes('keyActionVisible'), `note "${note}" means the key action is missing: ${JSON.stringify(v)}`);
  }

  // ── minor: normalised bible fields end on whole phrases; "about to" survives.
  // Bible thật 01:49 qua normalizeStoryBible (đường tạo mới): trường không bao giờ dừng giữa cụm ("the mouth firmly"), "about to" giữ nguyên,
  // và mệnh đề hành động không bị cắt mất (shot 3 Tide nhô khỏi lau sậy, shot 5 Tide lao tới).
  if (f0149) {
    const nb = normalizeStoryBible(JSON.parse(JSON.stringify(f0149)), { script: 'dino', shotCount: f0149.shots.length, style: f0149.style });
    for (const s of nb.shots) {
      for (const k of ['startStateEn', 'endStateEn', 'actingBeatEn'] as const) {
        const v = String(s[k] || '');
        check(!/\b(?:firmly|tightly|slowly|the|a|an|its|his|her|their|with|and)$/i.test(v) && !/\b[a-z]+-(?:mouth|quarter|eyed)$/i.test(v), `normalised shot ${s.shotNumber} ${k} ends mid-phrase: "${v}"`);
      }
    }
    const ms = nb.shots.find((s) => /charges/.test(s.actionEn));
    if (check(ms, 'normalised 0149: charge shot missing')) check(/about to hit/.test(ms!.endStateEn || ''), `"about to hit" must survive normalisation: ${ms!.endStateEn}`);
    const n3 = nb.shots.find((s) => s.shotSize === 'OTS');
    if (n3) check(/rise out of the tall reeds/.test(n3.startStateEn), `normalised 0149 OTS: Tide rising out of the reeds lost: ${n3.startStateEn}`);
    const n5 = nb.shots.find((s) => /snaps at Ember/.test(s.actionEn));
    if (n5) check(/lunging forward/.test(n5.startStateEn) && /mouth firmly closed/.test(n5.endStateEn || ''), `normalised 0149 shot 5: lunge / closed mouth lost: ${n5.startStateEn} | ${n5.endStateEn}`);
  }

  // ── minor: impact SFX survives compression in contact shots (L4 "sold by sound").
  if (f0149) {
    check(/SFX:[^.]*thwack/.test(mvOf(f0149, byNum(f0149, 7)!)), `impact SFX (0149 shot 7): thwack kept\n      ${mvOf(f0149, byNum(f0149, 7)!)}`);
    check(/SFX:[^.]*\bthud\b/.test(mvOf(f0149, byNum(f0149, 9)!)) && !/SFX: then/.test(mvOf(f0149, byNum(f0149, 9)!)), `impact SFX (0149 shot 9): thud kept\n      ${mvOf(f0149, byNum(f0149, 9)!)}`);
  }

  // ── minor: the end-frame design lock never re-imposes "standing upright" on a lying / falling / eye-only pose.
  for (const b of [f0149, f0352].filter(Boolean) as PremiumStoryBible[]) {
    for (const n of [7, 8, 11, 13]) {
      const s = byNum(b, n);
      if (!s) continue;
      const ef = efOf(b, s);
      const lock = ef.slice(ef.indexOf('keeps exactly the same design'));
      check(!/standing upright|upright on two hind legs/.test(lock), `design lock (shot ${n}) re-imposes the stance:\n      ${ef}`);
    }
  }
}

section('4) selectBestWindow on dino run clips (ffmpeg)');
{
  // Khoảng độ dài theo spec (giây). Engine có thể chia nhỏ hơn theo nhóm cảnh nhưng phải nằm trong khoảng này.
  const SPEC_RANGES: Record<MasterPacing, Record<string, [number, number]>> = {
    'viral-reel': { action: [1.2, 2.2], insert: [1.2, 2.2], acting: [2.0, 3.2], establishing: [2.2, 3.0] },
    cinema: { action: [2.5, 5.5], insert: [2.5, 5.5], acting: [2.5, 5.5], establishing: [2.5, 5.5] },
    fast: { action: [0.8, 1.8], insert: [0.8, 1.8], acting: [0.8, 1.8], establishing: [0.8, 1.8] },
  };
  const DIALOGUE_CAP: Record<MasterPacing, number> = { 'viral-reel': 5.0, cinema: 5.5, fast: 5.0 };
  const ffmpeg = resolveFfmpegPath(ROOT);
  const ffmpegOk = !SKIP_MEDIA && (fs.existsSync(ffmpeg) || spawnSync(ffmpeg, ['-version'], { windowsHide: true }).status === 0);
  const clips = ['shot_01_video.mp4', 'shot_04_video.mp4'].map((f) => path.join(DINO_RUN, f));
  const missing = clips.filter((c) => !fs.existsSync(c));
  if (SKIP_MEDIA) current.skipped = '--skip-media';
  else if (!ffmpegOk) current.skipped = `ffmpeg not found (${ffmpeg})`;
  else if (!fs.existsSync(DINO_RUN)) current.skipped = `run folder not found (${DINO_RUN})`;
  else if (missing.length) current.skipped = `clips missing: ${missing.map((m) => path.basename(m)).join(', ')}`;
  if (current.skipped) {
    info(`SKIP: ${current.skipped}`);
  } else {
    const fps = 24;
    const cases: Array<{ clip: string; pacing: MasterPacing; shotSize: string; beat?: string; hasDialogue?: boolean }> = [
      { clip: clips[0], pacing: 'viral-reel', shotSize: 'WS', beat: 'setup' },
      { clip: clips[1], pacing: 'viral-reel', shotSize: 'CU', beat: 'climax' },
      { clip: clips[0], pacing: 'fast', shotSize: 'INSERT', beat: 'escalation' },
      { clip: clips[1], pacing: 'cinema', shotSize: 'MS', beat: 'reversal' },
      { clip: clips[1], pacing: 'viral-reel', shotSize: 'MCU', beat: 'climax', hasDialogue: true },
    ];
    const durations = new Map<string, number>();
    for (const c of cases) {
      const name = `${path.basename(c.clip)} ${c.pacing}/${c.shotSize}${c.hasDialogue ? '/dialogue' : ''}`;
      if (!durations.has(c.clip)) durations.set(c.clip, probeMedia(ffmpeg, c.clip).durationSec);
      const dur = durations.get(c.clip)!;
      if (!check(dur > 1, `${name}: could not probe duration (${dur})`)) continue;
      const t0 = Date.now();
      let w: ReturnType<typeof selectBestWindow>;
      try {
        w = selectBestWindow(ffmpeg, c.clip, { pacing: c.pacing, shotSize: c.shotSize, beat: c.beat, hasDialogue: c.hasDialogue, fps });
      } catch (e: any) {
        check(false, `${name}: selectBestWindow threw ${e?.message || e}`);
        continue;
      }
      const len = w.outSec - w.inSec;
      const half = 0.5 / fps + 1e-6;
      info(`${name}: dur ${dur.toFixed(3)}s -> [${w.inSec.toFixed(3)}, ${w.outSec.toFixed(3)}] = ${len.toFixed(3)}s (${Date.now() - t0} ms) — ${w.reason}`);
      check(Number.isInteger(w.inFrame) && Number.isInteger(w.outFrame), `${name}: in/out not whole frames`);
      check(Math.abs(w.inSec - w.inFrame / fps) < 1e-3 && Math.abs(w.outSec - w.outFrame / fps) < 1e-3, `${name}: seconds do not match frame quantisation`);
      check(w.inSec >= 0.25 - 1e-6, `${name}: starts at ${w.inSec}s, before 0.25s`);
      check(w.outSec <= dur - 0.4 + half, `${name}: ends at ${w.outSec}s, inside the last 0.4s of ${dur.toFixed(3)}s`);
      check(w.outSec > w.inSec, `${name}: empty window`);
      if (c.hasDialogue) {
        check(len <= DIALOGUE_CAP[c.pacing] + half, `${name}: dialogue window ${len.toFixed(3)}s > cap ${DIALOGUE_CAP[c.pacing]}s`);
      } else {
        const cat = categorizeShot(c.shotSize);
        check(w.category === cat, `${name}: category ${w.category}, expected ${cat}`);
        const [lo, hi] = SPEC_RANGES[c.pacing][cat];
        check(len >= lo - half && len <= hi + half, `${name}: length ${len.toFixed(3)}s outside ${c.pacing} ${cat} range ${lo}-${hi}s`);
      }
    }
    // L8: nhịp diễn của giám khảo — cửa sổ BẮT BUỘC chứa beat_peak; L11: forceWindow dùng đúng từng khung.
    const dur1 = durations.get(clips[1]) || probeMedia(ffmpeg, clips[1]).durationSec;
    for (const frac of [0.08, 0.5, 0.88]) {
      const peakSec = Number((dur1 * frac).toFixed(3));
      const bw = { inSec: Math.max(0, peakSec - 0.5), peakSec, outSec: Math.min(dur1, peakSec + 0.6) };
      const w = selectBestWindow(ffmpeg, clips[1], { pacing: 'viral-reel', shotSize: 'MS', beat: 'climax', beatWindow: bw, fps });
      const pk = Math.round(peakSec * fps);
      info(`beatWindow peak ${peakSec}s -> [${w.inSec}, ${w.outSec}] — ${w.reason}`);
      check(w.beatPeakInWindow === true && w.inFrame <= pk && w.outFrame > pk, `beatWindow: peak ${peakSec}s outside window [${w.inSec}, ${w.outSec}]`);
      check(w.inFrame >= 0 && w.outFrame <= Math.round(dur1 * fps) + 1 && w.outFrame > w.inFrame, `beatWindow: window [${w.inSec}, ${w.outSec}] outside clip ${dur1}s`);
    }
    const wf = selectBestWindow(ffmpeg, clips[0], { pacing: 'viral-reel', shotSize: 'WS', forceWindow: { inSec: 1.0, outSec: 2.5 }, fps });
    check(wf.forced === true && wf.inFrame === 24 && wf.outFrame === 60, `forceWindow: got frames ${wf.inFrame}-${wf.outFrame}, expected 24-60`);
    const cj = measureCutJumps(ffmpeg, clips[0], [2.0, 3.0]);
    check(!!cj && cj.jumpsDb.length === 2 && cj.jumpsDb.every((v) => Number.isFinite(v)) && cj.medianAbsDb != null, `measureCutJumps: ${JSON.stringify(cj)}`);
  }
}

// ───────────────────────────── 4b) Mastering r3 (pure) ─────────────────────────────

// ───────────────────────────── 4c) FX regression clips (dino_premium_v2 r3 shots 9 & 13, frozen) ─────────────────────────────

section('4c) Window picker on r3 FX clips: mud burst (shot 9) and mud crown (shot 13) stay out of the window');
{
  const FIX = path.join(ROOT, 'output', 'regression_fixtures', 'dino_premium_v2_r3');
  const ff = resolveFfmpegPath(ROOT);
  const c9 = path.join(FIX, 'shot_09_r3_take.mp4');
  const c13 = path.join(FIX, 'shot_13_r3_take.mp4');
  if (SKIP_MEDIA) current.skipped = '--skip-media';
  else if (!fs.existsSync(c9) || !fs.existsSync(c13)) current.skipped = `fixtures not found (${FIX})`;
  else if (spawnSync(ff, ['-version'], { encoding: 'utf8' }).status !== 0) current.skipped = `ffmpeg not runnable (${ff})`;
  else {
    // Không có nhịp của giám khảo (đường dự phòng): cửa sổ trước đây rơi đúng vào cú nổ bùn (5.96-7.58 s, fxMid 0.38) / vương miện bùn (1.04-3.50 s, fxMid 0.39).
    const w9 = selectBestWindow(ff, c9, { pacing: 'viral-reel', beat: 'climax', shotSize: 'MS', fps: 24, seed: '09', action: 'Ember charges at Tide with the head lowered', actingBeat: "Ember's face sets into fierce, total focus" });
    info(`shot 9 r3 window ${w9.inSec}-${w9.outSec}s fxMid ${w9.fxMid} — ${w9.reason}`);
    check(w9.outSec <= 6.25 && (w9.fxMid ?? 1) < 0.25, `shot 9 r3: window ${w9.inSec}-${w9.outSec}s (fxMid ${w9.fxMid}) reaches the mud burst at 6.25-7.0 s`);
    const w13 = selectBestWindow(ff, c13, { pacing: 'viral-reel', beat: 'reversal', shotSize: 'WS', fps: 24, seed: '13', action: 'Ember lands flat on the back in the mud', actingBeat: "Ember's face stays frozen in shock" });
    info(`shot 13 r3 window ${w13.inSec}-${w13.outSec}s fxMid ${w13.fxMid} — ${w13.reason}`);
    check((w13.inSec >= 2.75 || w13.outSec <= 2.0) && (w13.fxMid ?? 1) < 0.25, `shot 13 r3: window ${w13.inSec}-${w13.outSec}s (fxMid ${w13.fxMid}) overlaps the mud crown at 2.0-2.75 s`);
    // Có nhịp của giám khảo (state.json r3: shot 13 bản 1 beat 3.4 / 4.5 / 5.0): cửa sổ chứa beat_peak, sau vương miện bùn.
    const b13 = selectBestWindow(ff, c13, { pacing: 'viral-reel', beat: 'reversal', shotSize: 'WS', fps: 24, seed: '13', beatWindow: { inSec: 3.4, peakSec: 4.5, outSec: 5.0 }, action: 'Ember lands flat on the back in the mud' });
    check(b13.beatPeakInWindow === true && b13.inSec >= 2.75, `shot 13 r3 with judge beat: ${b13.inSec}-${b13.outSec}s`);
  }
}

section('4b) Mastering r3: beat window, FX gate, gain map, loudness math, exposure (pure)');
{
  const fps = 24;
  const F = 192;
  const motion = new Array<number>(F).fill(3);
  const energy = new Array<number>(F).fill(-30);
  const fx = new Array<number>(F).fill(0.05);
  for (let k = 30; k < 60; k++) {
    motion[k] = 25; // vụ nổ FX: chuyển động + năng lượng âm cao nhất clip (cái bẫy của L8)
    energy[k] = -12;
    fx[k] = 0.8;
  }
  const mk = (over: Partial<ClipAnalysis> = {}): ClipAnalysis => ({
    probe: { durationSec: 8, width: 1280, height: 720, fps: 24, hasAudio: true },
    fps,
    frameCount: F,
    motion,
    energyDb: energy,
    voiceDb: new Array<number>(F).fill(-60),
    lowDb: new Array<number>(F).fill(-40),
    highDb: new Array<number>(F).fill(-40),
    ...over,
  });
  const mid = (w: { inFrame: number; outFrame: number }) => w.inFrame + Math.floor((w.outFrame - w.inFrame) / 2);
  const noFx = chooseWindowFromAnalysis(mk(), { pacing: 'viral-reel', shotSize: 'MS', beat: 'escalation' });
  check(mid(noFx) >= 30 && mid(noFx) < 60, `control: without FX info the picker should take the burst (mid ${mid(noFx)})`);
  const gated = chooseWindowFromAnalysis(mk({ fx }), { pacing: 'viral-reel', shotSize: 'MS', beat: 'escalation' });
  check(fx[mid(gated)] <= 0.4, `FX gate: middle frame ${mid(gated)} is ${fx[mid(gated)]} FX in [${gated.inSec}, ${gated.outSec}]`);
  const spans = chooseWindowFromAnalysis(mk(), { pacing: 'viral-reel', shotSize: 'MS', beat: 'escalation', fxSpans: [{ inSec: 30 / fps, outSec: 60 / fps, frac: 0.9 }] });
  check(mid(spans) < 30 || mid(spans) >= 60, `fxSpans from the judge: middle frame ${mid(spans)} still inside the FX burst`);
  const beat = chooseWindowFromAnalysis(mk({ fx }), { pacing: 'viral-reel', shotSize: 'MS', beat: 'escalation', beatWindow: { inSec: 4.0, peakSec: 4.6, outSec: 5.4 } });
  const pk = Math.round(4.6 * fps);
  check(beat.beatPeakInWindow === true && beat.inFrame <= pk && beat.outFrame > pk, `beatWindow: peak 4.6s outside [${beat.inSec}, ${beat.outSec}]`);
  check(beat.inFrame <= pk - Math.round(0.3 * fps), `beatWindow: window starts ${((pk - beat.inFrame) / fps).toFixed(2)}s before the peak (< 0.3s lead-in)`);
  check(beat.inFrame >= Math.round(4.0 * fps) - 1, `beatWindow: window ${beat.inSec}s leaves the judge's beat for the FX burst`);
  const early = chooseWindowFromAnalysis(mk({ fx }), { pacing: 'viral-reel', shotSize: 'MS', beatWindow: { inSec: 0, peakSec: 0.1, outSec: 0.6 } });
  check(early.beatPeakInWindow === true && early.inFrame === 0, `beatWindow near clip start: head guard must relax (got [${early.inSec}, ${early.outSec}])`);
  const forced = chooseWindowFromAnalysis(mk({ fx }), { pacing: 'viral-reel', shotSize: 'MS', forceWindow: { inSec: 3.6, outSec: 5.6 }, beatWindow: { inSec: 3.6, peakSec: 4.6, outSec: 5.6 } });
  check(forced.forced === true && forced.inFrame === 86 && forced.outFrame === 134 && forced.beatPeakInWindow === true, `forceWindow: ${JSON.stringify(forced)}`);
  // Trọng số âm thanh theo nhịp + độ lệch kịch tính của bản đồ gain.
  check(audioEnergyWeight('acting', 'climax', 'the fierce snarl slowly melts into soft merciful eyes') < 0, 'audio weight: mercy beat must prefer the quieter part');
  check(audioEnergyWeight('establishing', 'setup', 'tired drooping shoulders lift') < 0, 'audio weight: setup beat must be negative');
  check(audioEnergyWeight('action', 'climax', '', 'Ember charges at Tide with the head lowered') > 0, 'audio weight: impact beat must be positive');
  check(beatGainOffsetDb('setup') === -2.5 && beatGainOffsetDb('escalation') === 0 && beatGainOffsetDb('climax') === 2, 'gain offsets: setup -2.5 / escalation 0 / climax +2');
  check(beatGainOffsetDb('climax', 'the fierce snarl slowly melts into soft merciful eyes') === -3, 'gain offsets: mercy -3');
  // BS.1770: 997 Hz, -20 dBFS, cả hai kênh = -20 LUFS; bước nhảy -10 dB tại điểm cắt.
  const sr = 48000;
  const n = sr * 3;
  const tone = new Float32Array(n * 2);
  const step = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const v = Math.sin((2 * Math.PI * 997 * i) / sr);
    tone[2 * i] = tone[2 * i + 1] = 0.1 * v;
    step[2 * i] = step[2 * i + 1] = (i < n / 2 ? 0.1 : 0.1 / Math.sqrt(10)) * v;
  }
  const toneTrack = kWeightedTrack(tone, 2);
  const L = gatedLoudness(toneTrack, sr * 0.5, n);
  check(Math.abs(L + 20) < 0.15, `K-weighting: 997 Hz -20 dBFS reads ${L.toFixed(2)} LUFS`);
  const lraTone = loudnessRange(toneTrack);
  check(lraTone == null || lraTone < 0.5, `LRA of a steady tone: ${lraTone}`);
  const jump = cutJumpsFromTrack(kWeightedTrack(step, 2), [1.5]);
  check(Math.abs(jump.jumpsDb[0] + 10) < 0.3, `cut jump of a -10 dB step: ${jump.jumpsDb[0]}`);
  // Bản đồ gain: cân mức, giữ độ lệch kịch tính, độ trải bất đối xứng, trần gain.
  const gm = [-30, -20, -25].map((v) => ({ winLufs: v, headLufs: v, tailLufs: v, offsetDb: 0 }));
  const lv = (g: number[], shots: typeof gm) => shots.map((s, i) => s.winLufs + g[i]);
  const l0 = lv(solveGainMap(gm, { cutWeight: 0 }), gm);
  check(Math.max(...l0) - Math.min(...l0) < 0.6, `gain map: levels not equalised ${l0.join(', ')}`);
  const gmOff = gm.map((s, i) => ({ ...s, offsetDb: [-3, 0, 2][i] }));
  const l1 = lv(solveGainMap(gmOff, { cutWeight: 0 }), gmOff);
  check(Math.abs(l1[0] - l1[1] + 3) < 0.6 && Math.abs(l1[2] - l1[1] - 2) < 0.6, `gain map: offsets -3/0/+2 not kept ${l1.join(', ')}`);
  const l2 = lv(solveGainMap(gmOff, { cutWeight: 0, spreadNeg: 2, spreadPos: 0 }), gmOff);
  check(Math.abs(l2[0] - l2[1] + 6) < 0.6 && Math.abs(l2[2] - l2[1]) < 0.6, `gain map: asymmetric spread ${l2.join(', ')}`);
  const capped = solveGainMap(gm, { cutWeight: 0, maxGainDb: [0, Infinity, Infinity] });
  check(capped[0] <= 1e-6, `gain map: cap ignored (${capped[0]})`);
  // Kế hoạch hỗn âm: đỉnh nhọn cô lập được sửa, limiter không vượt ngân sách "~3 dB".
  const bps = 120;
  const synth = [-30, -18, -22, -15, -28].map((lufs, i) => {
    const nb = 4 * bps;
    const pw = new Float64Array(nb).fill(Math.pow(10, (lufs + 0.691) / 10));
    const pkDb = new Float32Array(nb).fill(lufs + [10, 12, 11, 13, 10][i]);
    if (i === 2) pkDb[200] = lufs + 28; // tiếng tách 8 ms
    return { pw, pkDb, lufs };
  });
  const plan = planAudioMix({
    winPow: synth.map((s) => s.pw),
    winPeakDb: synth.map((s) => s.pkDb),
    gm: synth.map((s, i) => ({ winLufs: s.lufs, headLufs: s.lufs, tailLufs: s.lufs, offsetDb: [-2.5, 0, 0, 2, -2.5][i] })),
    bps,
    ambPow: null,
    ambBelowLu: 16,
    targetLufs: -14,
    minLufs: -16,
    ceilDb: -1.75,
    maxGrDb: 3,
    lraRange: [8, 11],
    useGainMap: true,
  });
  info(`planAudioMix synthetic: goal ${plan.goalLufs} LUFS, ${JSON.stringify(plan.predicted)}`);
  check(plan.gains.length === 5 && plan.cuts.length === 4, 'planAudioMix: gains / cuts length');
  check(plan.goalLufs <= -14 && plan.goalLufs >= -16, `planAudioMix: goal ${plan.goalLufs} outside [-16, -14]`);
  check(plan.repairs[2].some((r) => r.b0 <= 200 && r.b1 > 200 && r.attDb > 0), `planAudioMix: isolated click not repaired ${JSON.stringify(plan.repairs[2])}`);
  check(plan.predicted.maxGainReductionDb <= 3 + 1 + 0.2, `planAudioMix: limiter ${plan.predicted.maxGainReductionDb} dB over the ~3 dB budget`);
  // Đường cong toe/shoulder + phơi sáng từng cảnh + chặn cháy đỏ.
  const lut = toneCurveLut(DEFAULT_TONE_CURVE);
  let mono = true;
  for (let i = 1; i < 256; i++) if (lut[i] < lut[i - 1] - 1e-9) mono = false;
  check(mono && lut[0] < 0.5 && Math.abs(lut[255] - 242.25) < 1 && lut[128] < 128, `tone curve: mono ${mono}, 0->${lut[0]}, 128->${lut[128]}, 255->${lut[255]}`);
  const milky = new Uint8Array(3 * 20000);
  for (let i = 0; i < 20000; i++) {
    const v = 30 + Math.floor((i / 20000) * 170);
    milky[3 * i] = Math.min(255, v + 10);
    milky[3 * i + 1] = v;
    milky[3 * i + 2] = Math.max(0, v - 10);
  }
  const em = planExposure(milky);
  check(em.p50Src > 100 && em.p50Out < em.p50Src - 20 && em.gamma >= 0.75 && em.gamma <= 1.35 && em.p50Out <= 84 && em.p1Out <= 10, `exposure (milky shot): ${JSON.stringify(em)}`);
  const dark = new Uint8Array(3 * 20000);
  for (let i = 0; i < 20000; i++) dark[3 * i] = dark[3 * i + 1] = dark[3 * i + 2] = 5 + Math.floor((i / 20000) * 120);
  const ed = planExposure(dark);
  check(ed.gamma > 1 && ed.p50Out > ed.p50Src && ed.gamma <= 1.35, `exposure (dark shot): ${JSON.stringify(ed)}`);
  const sun = new Uint8Array(3 * 10000);
  for (let i = 0; i < 10000; i++) {
    const hot = i < 2000;
    sun[3 * i] = hot ? 255 : 120;
    sun[3 * i + 1] = hot ? 230 : 100;
    sun[3 * i + 2] = hot ? 120 : 80;
  }
  const es = planExposure(sun);
  const esNoCurve = planExposure(sun, { curve: false });
  check(es.redClipSrc > 10 && es.redClipOut <= 0.3, `red clipping guard (curve): ${JSON.stringify(es)}`);
  check(esNoCurve.redClipOut <= 0.3 && esNoCurve.white < 1, `red clipping guard (no curve -> white point): ${JSON.stringify(esNoCurve)}`);
}

// ───────────────────────────── Summary ─────────────────────────────

const stat = (a: number[]) => (a.length ? `min ${Math.min(...a)} / avg ${Math.round(a.reduce((x, y) => x + y, 0) / a.length)} / max ${Math.max(...a)} (n=${a.length})` : 'n/a');
console.log('\n=== prompt word counts ===');
for (const [k, v] of Object.entries(wordStats)) console.log(`  ${k.padEnd(9)} ${stat(v)}   target ${WORDS[k as keyof typeof WORDS].join('-')}`);

console.log('\n=== SUMMARY ===');
let totalChecks = 0;
let totalFail = 0;
for (const s of sections) {
  totalChecks += s.checks;
  totalFail += s.failures.length;
  const status = s.skipped ? 'SKIP' : s.failures.length ? 'FAIL' : 'PASS';
  console.log(`  ${status.padEnd(4)}  ${s.name}  (${s.checks} checks${s.failures.length ? `, ${s.failures.length} failed` : ''}${s.skipped ? `; ${s.skipped}` : ''})`);
}
console.log(`\n${totalFail ? `FAIL: ${totalFail} of ${totalChecks} checks failed` : `PASS: all ${totalChecks} checks passed`}`);
process.exit(totalFail ? 1 : 0);
