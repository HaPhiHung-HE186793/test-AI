/**
 * Kiểm thử offline (không gọi Flow, không tốn credit) cho phần nối dây Giai đoạn 3-4-7 của đường premium
 * (services/premiumShotProduction.ts): khung cuối sửa từ khung đầu (L1), thử lại Veo giữ khung cuối, giám khảo khung dày có
 * tham chiếu + cổng cứng (L7), cửa sổ nhịp cho dựng phim (L8), nền ambience từ Flow (L9), báo cáo lint 00B có prompt 'edit'.
 *
 *   node --experimental-strip-types scripts/test-premium-shot-production.ts [--verbose] [--premium-run <runDir>]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildFallbackStoryBible,
  buildEndFrameEditPrompt,
  buildTakeJudgePrompt,
  denseJudgeFrameTimes,
  lintPremiumPrompt,
  parseJudgeVerdict,
  countWords,
  PREMIUM_JUDGE_GATE_FAIL_CAP,
  PREMIUM_JUDGE_PROMPT_MAX_CHARS,
  buildMotionPrompt,
  type PremiumCharacter,
  type PremiumShot,
  type PremiumStoryBible,
  type PremiumStyleKey,
} from '../services/premiumPromptEngine.ts';
import {
  planShotReferences,
  planEndFrameReferences,
  buildEndFrameGatePrompt,
  buildKeyframeGatePrompt,
  parseKeyframeGateVerdict,
  buildKeyframeCorrection,
  endFrameExpressionKind,
  END_FRAME_GATE_FLAGS,
  KEYFRAME_GATE_FLAGS,
  END_FRAME_MAX_REFERENCES,
  isFrameRejectionError,
  planVideoRetry,
  buildPremiumVideoRequest,
  planTakeJudgeReferences,
  buildTakeJudgePromptWithReferences,
  beatWindowFromVerdict,
  selectBestTake,
  buildAmbienceBedPrompt,
  buildAmbienceBedRequest,
  AMBIENCE_BED_MODEL,
  buildPromptLintReport,
  setEndFrameLock,
  pickJudgeFrameSubset,
  PREMIUM_GATE_PROMPT_MAX_CHARS,
  PREMIUM_JUDGE_LITE_FRAMES,
  PREMIUM_JUDGE_LITE_MAX_CHARS,
  type PremiumCharacterRefs,
  type PremiumShotLintEntry,
} from '../services/premiumShotProduction.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const VERBOSE = argv.includes('--verbose');
const runIdx = argv.indexOf('--premium-run');
const PREMIUM_RUN = runIdx >= 0 && argv[runIdx + 1] ? path.resolve(argv[runIdx + 1]) : path.join(ROOT, 'output', 'vscode_runs', 'dino_premium_v2');

let checks = 0;
const failures: string[] = [];
function check(cond: unknown, msg: string) {
  checks++;
  if (!cond) {
    failures.push(msg);
    console.log(`  FAIL ${msg}`);
  }
}
function section(name: string) {
  console.log(`\n=== ${name} ===`);
}

const NEGATION_RE = /\b(?:no|not|zero|never|without|avoid|avoids|avoiding|nor|cannot|none|nothing|nobody|\w+n['’]t)\b/i;
const STYLES: PremiumStyleKey[] = ['pixar3d', 'graphic2d', 'photoreal'];
const SCRIPTS = [
  'Đại chiến sinh tồn tiền sử tại Thung lũng Nham thạch Kreta giữa hai đại quái thú khủng long tranh giành nguồn nước cuối cùng.',
  'Một chú mèo con lạc trong thư viện cổ phải tìm đường về nhà trước khi đèn tắt, được một con cú già giúp đỡ.',
  'Hai robot dọn rác trên sao Hỏa cãi nhau vì một bông hoa duy nhất mọc lên giữa bãi phế liệu.',
];

function refsFor(bible: PremiumStoryBible, opts: { missingSheet?: string } = {}): PremiumCharacterRefs[] {
  return bible.characters.map((c, i) => ({
    character: c,
    sheet: opts.missingSheet === c.id ? null : { mediaId: `sheet-${c.id}`, base64: `U0hFRVQ${i}`, mimeType: 'image/png' },
    expression: { mediaId: `expr-${c.id}`, base64: `RVhQUg${i}` },
  }));
}

function loadDinoBible(): PremiumStoryBible | null {
  const p = path.join(PREMIUM_RUN, 'bible.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as PremiumStoryBible;
  } catch {
    return null;
  }
}

const fallbacks: PremiumStoryBible[] = [];
for (const style of STYLES) for (const script of SCRIPTS) fallbacks.push(buildFallbackStoryBible({ script, shotCount: 12, style }));
// Kiểm tra theo số cảnh cố định (shot 5 / 11) dùng bible ĐÓNG BĂNG (03:52): bible của run thật đang được sửa trong lúc render
// (04:30 tách shot 5 thành 14/15). Bible thật vẫn chạy các kiểm tra chung (không phụ thuộc số cảnh).
const FIXTURE_BIBLE = path.join(ROOT, 'output', 'regression_fixtures', 'dino_premium_v2_r3', 'bible_0352.json');
function loadFixtureBible(): PremiumStoryBible | null {
  if (runIdx >= 0 || !fs.existsSync(FIXTURE_BIBLE)) return null;
  try {
    return JSON.parse(fs.readFileSync(FIXTURE_BIBLE, 'utf8')) as PremiumStoryBible;
  } catch {
    return null;
  }
}
const live = loadDinoBible();
const dino = loadFixtureBible() || live;
const bibles: Array<{ tag: string; bible: PremiumStoryBible }> = [
  ...fallbacks.map((b, i) => ({ tag: `fallback ${b.style} #${i % SCRIPTS.length}`, bible: b })),
  ...(dino ? [{ tag: dino === live ? 'dino_premium_v2' : 'dino_premium_v2 (frozen 03:52)', bible: dino }] : []),
  ...(live && live !== dino ? [{ tag: 'dino_premium_v2 (live)', bible: live }] : []),
];
if (!dino) console.log(`  (dino_premium_v2 bible not found at ${PREMIUM_RUN} — real-render shots skipped)`);

// ───────────────────────────── L1: end keyframe references + edit prompt ─────────────────────────────
section('L1: end keyframe = edit of the start keyframe (references, prompt, lint "edit")');
let endPrompts = 0;
for (const { tag, bible } of bibles) {
  const refs = refsFor(bible);
  for (const shot of bible.shots) {
    const t = `${tag} shot ${shot.shotNumber} ${shot.shotSize}`;
    const plan = planEndFrameReferences({ shot, characters: refs, startFrame: { mediaId: 'start-media', base64: 'U1RBUlQ=' } });
    const cast = [...new Set(shot.characters)];
    check(plan.usable, `${t}: usable with a real start mediaId`);
    check(plan.mediaIds[0] === 'start-media' && plan.order[0] === 'start keyframe', `${t}: start keyframe first: ${plan.order.join(',')}`);
    check(plan.mediaIds.length <= END_FRAME_MAX_REFERENCES && plan.mediaIds.length === Math.min(3, 1 + cast.length), `${t}: [start + one sheet per character] max 3: ${plan.mediaIds.join(',')}`);
    for (const id of cast) check(plan.mediaIds.includes(`sheet-${id}`) && plan.order.includes(`${id} sheet`), `${t}: sheet of ${id} must be a reference (L1 colour drift)`);
    check(!plan.mediaIds.some((m) => m.startsWith('expr-')), `${t}: expression sheets are never end-frame references`);
    check(plan.missingSheets.length === 0, `${t}: no missing sheets`);
    check(plan.judgeImages.length === Math.min(2, cast.length) + 1 && plan.judgeImages[plan.judgeImages.length - 1].label === 'start keyframe of this shot', `${t}: gate images = sheets then start keyframe`);
    const prompt = buildEndFrameEditPrompt({ style: bible.style, shot, characters: bible.characters, referenceOrder: plan.order, environment: bible.environment });
    endPrompts++;
    if (VERBOSE && shot.shotNumber <= 2) console.log(`  ${t}: ${prompt}`);
    const lint = lintPremiumPrompt(prompt, 'edit', { style: bible.style });
    check(lint.ok, `${t}: edit prompt lint: ${lint.issues.join('; ')} — ${prompt}`);
    check(/^Edit image 1\./.test(prompt) && /Same scale and same positions in the frame as image 1\./.test(prompt), `${t}: edits image 1 and keeps scale/positions`);
    cast.forEach((id, n) => {
      const c = bible.characters.find((x) => x.id === id)!;
      check(prompt.includes(`${c.displayNameEn} keeps exactly the same design as image ${n + 2}`), `${t}: ${c.displayNameEn} locked to image ${n + 2}`);
    });
  }
}
check(endPrompts > 100, `edit prompts rendered: ${endPrompts}`);

{
  const b = fallbacks[0];
  const two = b.shots.find((s) => new Set(s.characters).size === 2)!;
  const one = b.shots.find((s) => new Set(s.characters).size === 1)!;
  const noStart = planEndFrameReferences({ shot: two, characters: refsFor(b), startFrame: { mediaId: 'cached_shot_01', base64: 'QQ==' } });
  check(!noStart.usable && !noStart.mediaIds.includes('cached_shot_01'), 'cached_* start mediaId is unusable (offline) → no edit');
  check(!planEndFrameReferences({ shot: two, characters: refsFor(b), startFrame: null }).usable, 'missing start frame → unusable');
  const missing = planEndFrameReferences({ shot: two, characters: refsFor(b, { missingSheet: two.characters[1] }), startFrame: { mediaId: 's' } });
  check(missing.usable && missing.missingSheets.length === 1 && missing.missingSheets[0] === two.characters[1], `missing sheet reported: ${JSON.stringify(missing.missingSheets)}`);
  const capped = planEndFrameReferences({ shot: two, characters: refsFor(b), startFrame: { mediaId: 's' }, maxReferences: 2 });
  check(capped.mediaIds.length === 2 && capped.missingSheets.length === 1, `maxReferences 2 drops the second sheet and reports it: ${JSON.stringify(capped)}`);
  const over = planEndFrameReferences({ shot: two, characters: refsFor(b), startFrame: { mediaId: 's' }, maxReferences: 9 });
  check(over.mediaIds.length === 3, 'maxReferences is capped at 3');
  const solo = planEndFrameReferences({ shot: one, characters: refsFor(b), startFrame: { mediaId: 's' } });
  check(solo.order.length === 2 && solo.order[1] === `${one.characters[0]} sheet`, `one-character shot: ${solo.order.join(',')}`);
  // Start-frame planner untouched (regression).
  const sp = planShotReferences({ shot: two, characters: refsFor(b), environment: { mediaId: 'env' } });
  check(sp.order[sp.order.length - 1] === 'environment plate' && sp.judgeImages.length === 2, `planShotReferences unchanged: ${sp.order.join(',')}`);
}

// ───────────────────────────── L1/L5: end-frame gate ─────────────────────────────
section('L1/L5: end-frame gate prompt, flags, corrections');
for (const { tag, bible } of bibles) {
  for (const shot of bible.shots) {
    const t = `${tag} shot ${shot.shotNumber}`;
    const plan = planEndFrameReferences({ shot, characters: refsFor(bible), startFrame: { mediaId: 's', base64: 'U1RBUlQ=' } });
    const g = buildEndFrameGatePrompt({ style: bible.style, shot, characters: bible.characters, referenceLabels: plan.judgeImages.map((j) => j.label) });
    check(/LAST FRAME/.test(g) && /"sceneDrift"/.test(g) && /"wrongExpression"/.test(g), `${t}: end gate asks for sceneDrift + wrongExpression`);
    check(g.includes(`the first frame (image ${plan.judgeImages.length})`), `${t}: end gate names the start keyframe image index ${plan.judgeImages.length}`);
    const kind = endFrameExpressionKind(shot);
    if (kind === 'serious' || kind === 'dazed') check(/any smile, grin or laugh is wrong/.test(g), `${t}: non-happy beat forbids a grin`);
    if (kind === 'happy') check(/a warm smile fits this beat/.test(g), `${t}: happy beat allows a smile`);
  }
}
if (dino) {
  const kinds = Object.fromEntries(dino.shots.map((s) => [s.shotNumber, endFrameExpressionKind(s)]));
  check(kinds[10] === 'dazed', `dino shot 10 (daze) → dazed: ${kinds[10]}`);
  check(kinds[12] === 'happy', `dino shot 12 (victory sip smile) → happy: ${kinds[12]}`);
  check(kinds[5] === 'serious' && kinds[11] === 'serious', `dino shots 5 (shock) / 11 (mercy) → serious: ${kinds[5]} ${kinds[11]}`);
  const s5 = dino.shots.find((s) => s.shotNumber === 5)!;
  check(/Cut on action: the bodies stay one step apart/.test(buildEndFrameGatePrompt({ style: 'pixar3d', shot: s5, characters: dino.characters })), 'dino shot 5 (lunge) gate checks the air gap');
}
{
  const b = fallbacks[0];
  const shot = b.shots.find((s) => new Set(s.characters).size === 2)!;
  const raw = (o: Record<string, unknown>) => JSON.stringify({ score: 84, critique: 'x', fixInstruction: 'Keep the pose.', ...o });
  const endV = parseKeyframeGateVerdict(raw({ sceneDrift: true }), { faceShot: false, flags: END_FRAME_GATE_FLAGS });
  check(endV && endV.pass === false && endV.failed.includes('sceneDrift'), `end flags: sceneDrift fails the frame: ${JSON.stringify(endV)}`);
  const startV = parseKeyframeGateVerdict(raw({ sceneDrift: true }), { faceShot: false });
  check(startV && startV.pass === true && startV.failed.length === 0, 'default (start-frame) flags ignore sceneDrift — backward compatible');
  check(END_FRAME_GATE_FLAGS.length === KEYFRAME_GATE_FLAGS.length + 2, 'END_FRAME_GATE_FLAGS = keyframe flags + 2');
  const expr = parseKeyframeGateVerdict(raw({ wrongExpression: 'true', score: '91' }), { faceShot: true, flags: END_FRAME_GATE_FLAGS });
  check(expr && expr.pass === false && expr.failed.includes('wrongExpression'), 'end flags: wrongExpression fails the frame');
  check(parseKeyframeGateVerdict('not json', { flags: END_FRAME_GATE_FLAGS }) === null, 'unreadable end gate → null (fail closed)');

  const v = { score: 50, pass: false, failed: ['sceneDrift', 'wrongExpression', 'wrongFraming'], critique: '', fixInstruction: '' };
  const fix = buildKeyframeCorrection(v, { style: b.style, shot, characters: b.characters, frame: 'end', startImageIndex: 1 });
  check(/stay exactly as in the first image/.test(fix) && /Same shot size, camera angle and framing as the first image/.test(fix), `end correction keeps the start framing: ${fix}`);
  check(!NEGATION_RE.test(fix) && !/\d/.test(fix), `end correction is positive and digit-free: ${fix}`);
  const startFix = buildKeyframeCorrection(v, { style: b.style, shot, characters: b.characters });
  check(!/first image/.test(startFix), `start-frame correction unchanged (no end-frame sentences): ${startFix}`);
  if (dino) {
    const s11 = dino.shots.find((s) => s.shotNumber === 11)!;
    const s10 = dino.shots.find((s) => s.shotNumber === 10)!;
    const s12 = dino.shots.find((s) => s.shotNumber === 12)!;
    const ev = { score: 50, pass: false, failed: ['wrongExpression'], critique: '', fixInstruction: '' };
    check(/mouth firmly closed, lips covering the teeth/.test(buildKeyframeCorrection(ev, { style: 'pixar3d', shot: s11, characters: dino.characters, frame: 'end' })), 'L5: mercy beat correction closes the mouth');
    check(/jaw hangs slack, eyes unfocused/.test(buildKeyframeCorrection(ev, { style: 'pixar3d', shot: s10, characters: dino.characters, frame: 'end' })), 'L5: dazed beat correction');
    check(/warm, gentle smile/.test(buildKeyframeCorrection(ev, { style: 'pixar3d', shot: s12, characters: dino.characters, frame: 'end' })), 'happy beat correction smiles');
  }
}

// ───────────────────────────── L1: Veo first + last frame, retry policy ─────────────────────────────
section('L1: Veo request keeps the last frame on transient retries');
{
  const req = buildPremiumVideoRequest({ prompt: 'p', model: 'Veo 3.1 - Quality', aspectRatio: '16:9', durationSeconds: 6, firstFrameMediaId: 'start', lastFrameMediaId: 'end', referenceMediaIds: ['r'] });
  check(req.firstFrameImageMediaId === 'start' && req.lastFrameImageMediaId === 'end' && !req.referenceImageMediaIds, `Veo: first + last frame, no ingredients: ${JSON.stringify(req)}`);
  check(!buildPremiumVideoRequest({ prompt: 'p', model: 'Veo 3.1 - Lite', aspectRatio: '16:9', durationSeconds: 8, firstFrameMediaId: 's', lastFrameMediaId: 'cached_end' }).lastFrameImageMediaId, 'cached_* last frame is never sent');
  for (const msg of ['Request timed out after 900s', 'HTTP 503 Service Unavailable', 'quota exceeded, try again later', 'socket hang up', 'Lỗi gọi Flow.generate.video qua Cầu nối VS Code']) {
    const r = planVideoRetry(req, new Error(msg));
    check(r.reason === 'transient' && r.request.lastFrameImageMediaId === 'end' && r.request.durationSeconds === 6 && !r.droppedLastFrame, `transient "${msg}" keeps the last frame: ${JSON.stringify(r)}`);
  }
  for (const msg of ['Unsupported last frame image', 'The image could not be processed', 'lastFrame not supported for this model', 'Ảnh khung cuối không hợp lệ', 'Model không hỗ trợ khung cuối', 'Invalid frame']) {
    const r = planVideoRetry(req, msg);
    check(r.reason === 'frame' && !('lastFrameImageMediaId' in r.request) && r.request.durationSeconds === 8 && r.droppedLastFrame && r.request.firstFrameImageMediaId === 'start', `frame error "${msg}" drops the last frame: ${JSON.stringify(r)}`);
  }
  check(req.lastFrameImageMediaId === 'end' && req.durationSeconds === 6, 'planVideoRetry never mutates the request');
  check(isFrameRejectionError({ message: 'unsupported' }) && !isFrameRejectionError(null) && !isFrameRejectionError('timeout'), 'isFrameRejectionError on objects / null / strings');
  const plain = planVideoRetry({ prompt: 'p', firstFrameImageMediaId: 's', durationSeconds: 4 }, 'image rejected');
  check(plain.reason === 'frame' && !plain.droppedLastFrame && plain.request.durationSeconds === 8, 'frame error without a last frame → plain first-frame 8 s');
}

// ───────────────────────────── L7: dense judge with references ─────────────────────────────
section('L7: dense judge frames, reference images, hard gates');
{
  const b = dino || fallbacks[0];
  const shot = b.shots.find((s) => new Set(s.characters).size === 2) || b.shots[0];
  const times = denseJudgeFrameTimes(8, { count: 12, fps: 24 });
  check(times.length === 14 && times[0] === 0 && times[13] > 7.9, `14 frames incl. first/last: ${times.join(',')}`);
  const jr = planTakeJudgeReferences({ shot, characters: refsFor(b), startKeyframe: { base64: 'U1Q=' }, endKeyframe: { base64: 'RU5E' } });
  check(jr.labels[0] === 'start keyframe' && jr.labels[1] === 'end keyframe' && jr.labels.length === 2 + Math.min(2, new Set(shot.characters).size) && jr.images.length === jr.labels.length, `judge refs: ${jr.labels.join(' | ')}`);
  check(jr.labels.slice(2).every((l) => /turnaround sheet$/.test(l)), 'judge refs end with the turnaround sheets');
  const noEnd = planTakeJudgeReferences({ shot, characters: refsFor(b), startKeyframe: { base64: 'U1Q=' }, endKeyframe: null, maxSheets: 1 });
  check(noEnd.labels.length === 2 && noEnd.labels[0] === 'start keyframe' && !noEnd.labels.includes('end keyframe'), `missing end keyframe skipped, maxSheets 1: ${noEnd.labels.join(' | ')}`);
  const jp = buildTakeJudgePromptWithReferences({ shot, characters: b.characters, frameTimesSec: times, referenceLabels: jr.labels, style: b.style, durationSec: 8 });
  const k = jr.labels.length;
  check(jp.includes(`You are given ${k} reference images followed by 14 frames`) && jp.includes(`images ${k + 1}-${k + 14}`), `judge numbering: ${jp.split('\n')[1]}`);
  check(/image 1 = start keyframe \(the intended first frame of the shot\); image 2 = end keyframe \(the intended last pose of the shot\)/.test(jp), 'judge explains start/end references');
  check(/HARD GATES/.test(jp) && /beat_in, beat_peak and beat_out/.test(jp) && /The take lasts 8s/.test(jp), 'judge asks for gates, beat timing, duration');
  check((jp.match(/reference/gi) || []).length < 12 && !/Use them only as the identity reference/.test(jp), 'reference note is not duplicated');
  const base = buildTakeJudgePromptWithReferences({ shot, characters: b.characters, frameTimesSec: [0.5, 4, 7.5] });
  check(base === buildTakeJudgePrompt({ shot, characters: b.characters, frameTimesSec: [0.5, 4, 7.5] }), 'no references → identical to buildTakeJudgePrompt (backward compatible)');

  const R = '"identityMatch": 8, "anatomyStable": 8, "noMorphing": 8, "actingVisible": 8, "compositionClear": 8, "effectsRestraint": 8, "motionQuality": 8';
  const G = (o: Record<string, unknown> = {}) => JSON.stringify({ keyActionVisible: true, bodyIntact: true, expressionMatchesBeat: true, identityOnModel: true, facingCorrect: true, cleanFrame: true, ...o });
  const melt = parseJudgeVerdict(`{${R}, "hardGates": ${G({ bodyIntact: false })}, "beat_in": 1, "beat_peak": 1.5, "beat_out": 2, "overall": 88, "pass": true}`, { requireHardGates: true, durationSec: 8 });
  const clean = parseJudgeVerdict(`{${R}, "hardGates": ${G()}, "beat_in": 3.6, "beat_peak": 4.2, "beat_out": 5.6, "overall": 62, "pass": false}`, { requireHardGates: true, durationSec: 8 });
  const noGates = parseJudgeVerdict(`{${R}, "overall": 90, "pass": true}`, { requireHardGates: true, durationSec: 8 });
  check(melt && melt.overall <= PREMIUM_JUDGE_GATE_FAIL_CAP && clean && noGates && noGates.failedGates!.length === 6, 'judge verdict fixtures');
  const sel = selectBestTake([{ take: 1, verdict: melt }, { take: 2, verdict: clean }, { take: 3, verdict: null }]);
  check(sel.index === 1 && sel.best?.take === 2 && sel.failedGates?.length === 0, `gate-passing take beats a higher-scoring gate failure: ${JSON.stringify({ i: sel.index, s: sel.vqqaScore })}`);
  check(sel.beatWindow?.inSec === 3.6 && sel.beatWindow?.peakSec === 4.2 && sel.beatWindow?.outSec === 5.6, `selection carries the beat window: ${JSON.stringify(sel.beatWindow)}`);
  const allFail = selectBestTake([{ take: 1, verdict: noGates }, { take: 2, verdict: melt }]);
  check(allFail.best?.take === 1 && (allFail.failedGates || []).length === 6, `all gate failures → highest overall, gates reported: ${JSON.stringify(allFail.failedGates)}`);
  const old = (o: number) => parseJudgeVerdict(`{${R}, "overall": ${o}, "pass": true}`);
  const legacy = selectBestTake([{ take: 1, verdict: old(70) }, { take: 2, verdict: old(78) }, { take: 3, verdict: old(78) }]);
  check(legacy.best?.take === 2 && legacy.beatWindow === null, 'old verdicts (no gates): highest overall, tie → earlier take');
  const none = selectBestTake([{ take: 1, verdict: null }, { take: 2, verdict: null }]);
  check(none.index === 0 && none.vqqaScore === null && none.pass === null, 'no verdicts → first take, score null (never a default 95)');
  check(selectBestTake([]).index === -1, 'empty list');
}

// ───────────────────────────── L8: beat window from verdict ─────────────────────────────
section('L8: beat window for mastering');
{
  check(JSON.stringify(beatWindowFromVerdict({ beatInSec: 3.6, beatPeakSec: 4.2, beatOutSec: 5.6 })) === '{"inSec":3.6,"peakSec":4.2,"outSec":5.6}', 'new verdict fields');
  check(JSON.stringify(beatWindowFromVerdict({ beat: { inSec: 4.5, peakSec: 6.6, outSec: 7.7 } }, 8)) === '{"inSec":4.5,"peakSec":6.6,"outSec":7.7}', 'prototype verdict.beat');
  check(JSON.stringify(beatWindowFromVerdict({ beatInSec: null, beatPeakSec: 4, beatOutSec: null })) === '{"inSec":4,"peakSec":4,"outSec":4}', 'peak only → zero-width window at the peak');
  check(JSON.stringify(beatWindowFromVerdict({ beatInSec: 2, beatPeakSec: null, beatOutSec: 3 })) === '{"inSec":2,"peakSec":2.5,"outSec":3}', 'in/out only → peak in the middle');
  check(JSON.stringify(beatWindowFromVerdict({ beatInSec: 7, beatPeakSec: 12, beatOutSec: 3 }, 8)) === '{"inSec":3,"peakSec":7,"outSec":7}', 'swapped and clamped into the take');
  check(beatWindowFromVerdict({ beatInSec: null, beatPeakSec: null, beatOutSec: null }) === null && beatWindowFromVerdict(null) === null && beatWindowFromVerdict({ beatPeakSec: 'soon' }) === null, 'no beat → null');
}

// ───────────────────────────── L9: ambience bed from Flow ─────────────────────────────
section('L9: ambience bed prompt + request (Veo 3.1 Lite, 1 clip, no characters)');
for (const { tag, bible } of bibles) {
  const p = buildAmbienceBedPrompt({ style: bible.style, environment: bible.environment, shots: bible.shots, characters: bible.characters });
  const lint = lintPremiumPrompt(p, 'video', { style: bible.style });
  check(lint.ok && countWords(p) <= 100, `${tag}: ambience prompt lint: ${lint.issues.join('; ')} — ${p}`);
  check(/Ambient noise: /.test(p) && /empty/.test(p), `${tag}: ambience prompt is an empty set with ambient noise`);
  for (const c of bible.characters) check(!new RegExp(`\\b${c.displayNameEn}\\b`, 'i').test(p), `${tag}: ambience prompt names ${c.displayNameEn}`);
  check(!/\b(?:growl|roar|hiss|footstep|music|dialogue|says)\w*/i.test(p.split('Ambient noise:')[1] || ''), `${tag}: ambience sounds are environment-only: ${p}`);
  if (VERBOSE && tag === 'dino_premium_v2') console.log(`  ${p}`);
}
{
  const env = fallbacks[0].environment;
  const bare = buildAmbienceBedPrompt({ style: 'graphic2d', environment: env });
  check(/soft wind/.test(bare) && lintPremiumPrompt(bare, 'video', { style: 'graphic2d' }).ok, `no shots → default wind/room tone: ${bare}`);
  const req = buildAmbienceBedRequest({ prompt: bare, environmentMediaId: 'env-media', aspectRatio: '16:9' });
  check(req.modelDisplayName === AMBIENCE_BED_MODEL && AMBIENCE_BED_MODEL === 'Veo 3.1 - Lite' && req.durationSeconds === 8 && req.firstFrameImageMediaId === 'env-media' && !req.lastFrameImageMediaId && req.resolution === '720p', `ambience request: ${JSON.stringify({ ...req, prompt: '…' })}`);
}

// ───────────────────────────── 00B lint report with end-frame prompts ─────────────────────────────
section('00B: lint report includes edit prompts');
{
  const ok = { ok: true, words: 90, issues: [] as string[] };
  const bad = { ok: false, words: 170, issues: ['word count 170 outside 40-160 for edit'] };
  const base: PremiumShotLintEntry = { shotNumber: 1, shotSize: 'MS', beat: 'setup', keyframePrompt: 'k', motionPrompt: 'm', keyframe: ok, motion: ok };
  const legacy = buildPromptLintReport([base, { ...base, shotNumber: 2 }]);
  check(legacy.totalPrompts === 4 && legacy.passedShotsCount === 2 && !('endFrame' in legacy.wordCounts) && !('endFrame' in legacy.shots[0]), 'without end frames the report is unchanged');
  const withEnd = buildPromptLintReport([
    { ...base, endFramePrompt: 'e1', endFrame: ok },
    { ...base, shotNumber: 2, endFramePrompt: 'e2', endFrame: bad },
  ]);
  check(withEnd.totalPrompts === 6 && withEnd.cleanPrompts === 5 && withEnd.passedShotsCount === 1 && !withEnd.allShotsPassed100Percent, `end-frame prompts counted: ${JSON.stringify({ t: withEnd.totalPrompts, c: withEnd.cleanPrompts, p: withEnd.passedShotsCount })}`);
  check((withEnd.wordCounts as any).endFrame?.max === 170 && (withEnd.shots[1] as any).endFrame?.prompt === 'e2' && withEnd.issueCounts['word count'] === 1, 'end-frame word stats / per-shot entry / issue counts');
}

// ───────────────────────────── Start-frame gate unchanged ─────────────────────────────
section('Regression: start-frame gate prompt unchanged in shape');
{
  const b = fallbacks[0];
  const g = buildKeyframeGatePrompt({ style: b.style, shot: b.shots[0], characters: b.characters, referenceLabels: ['a sheet'] });
  check(/approving the FIRST FRAME/.test(g) && !/sceneDrift/.test(g), 'start gate has no end-frame flags');
}

// ───────────────────────────── Review r3: Flow judge budget, lite payload, end-frame lock ─────────────────────────────
section('Review r3: judge char budget pass-through, lite frame subset, motion lock follows the frames sent');
{
  const b = dino || fallbacks[0];
  const s = b.shots.find((x) => x.characters.length === 2) || b.shots[0];
  const times = denseJudgeFrameTimes(8, { count: 10 });
  const labels = ['start keyframe', 'end keyframe', 'Ember (tyrannosaurus) turnaround sheet', 'Tide (spinosaurus) turnaround sheet'];
  const compact = buildTakeJudgePromptWithReferences({ shot: s, characters: b.characters, frameTimesSec: times, referenceLabels: labels, style: b.style, durationSec: 8, environment: b.environment, maxChars: PREMIUM_JUDGE_PROMPT_MAX_CHARS });
  check(compact.length <= PREMIUM_JUDGE_PROMPT_MAX_CHARS && compact === buildTakeJudgePrompt({ shot: s, characters: b.characters, frameTimesSec: times, referenceFrames: labels, style: b.style, durationSec: 8, environment: b.environment, maxChars: PREMIUM_JUDGE_PROMPT_MAX_CHARS }), `maxChars / environment pass through (${compact.length} chars)`);
  check(/Images 1-4 are references/.test(compact) && /Images 5-16 are frames of the take/.test(compact), `compact judge numbers references and frames: ${compact.split('\n')[1]}`);
  check(times.length === 12, `L7: 10 evenly spaced + first/last = 12 judge frames (got ${times.length})`);
  const idx = pickJudgeFrameSubset(times.length, PREMIUM_JUDGE_LITE_FRAMES);
  check(idx.length === PREMIUM_JUDGE_LITE_FRAMES && idx[0] === 0 && idx[idx.length - 1] === times.length - 1 && idx.every((v, i) => i === 0 || v > idx[i - 1]), `lite subset keeps first + last frame, evenly spaced: ${idx.join(',')}`);
  check(pickJudgeFrameSubset(5, 8).length === 5 && pickJudgeFrameSubset(0, 8).length === 0 && pickJudgeFrameSubset(12, 1).join() === '0', 'lite subset edge cases');
  const lite = buildTakeJudgePromptWithReferences({ shot: s, characters: b.characters, frameTimesSec: idx.map((n) => times[n]), referenceLabels: labels.slice(0, 2), style: b.style, durationSec: 8, environment: b.environment, maxChars: PREMIUM_JUDGE_LITE_MAX_CHARS });
  check(lite.length <= PREMIUM_JUDGE_LITE_MAX_CHARS && /Images 3-10 are frames of the take/.test(lite), `lite judge: ${lite.length} chars, ${lite.split('\n')[1]}`);
  for (const sh of b.shots) {
    const eg = buildEndFrameGatePrompt({ style: b.style, shot: sh, characters: b.characters, referenceLabels: ['Ember sheet', 'Tide sheet', 'start keyframe'], maxChars: PREMIUM_GATE_PROMPT_MAX_CHARS });
    check(eg.length <= PREMIUM_GATE_PROMPT_MAX_CHARS && /"sceneDrift"/.test(eg) && /the first frame \(image 3\)/.test(eg), `end gate within budget, start keyframe still image 3 (shot ${sh.shotNumber}, ${eg.length} chars)`);
  }
  // Without maxChars the gate prompts are exactly the old full prompts (backward compatible).
  const full = buildEndFrameGatePrompt({ style: b.style, shot: s, characters: b.characters, referenceLabels: ['a sheet', 'start keyframe'] });
  check(full === buildEndFrameGatePrompt({ style: b.style, shot: s, characters: b.characters, referenceLabels: ['a sheet', 'start keyframe'], maxChars: 100000 }) && full.includes(b.characters[0].lookEn.slice(0, 40)), 'gate prompt without budget is unchanged');

  // L1 (finding: Stage 4 never told Veo about the last frame): the design lock follows the frames actually sent.
  const mv = buildMotionPrompt({ style: b.style, shot: s, characters: b.characters, environment: b.environment, dialogueLang: 'en', withEndFrame: true });
  check(/as the first and last frames throughout/.test(mv), 'motion prompt built with withEndFrame names both frames');
  const dropped = setEndFrameLock(mv, false);
  check(/as the first frame throughout/.test(dropped) && !/first and last frames/.test(dropped), 'dropping the last frame rewrites the lock to the first frame only');
  check(setEndFrameLock(dropped, true) === mv && setEndFrameLock(mv, true) === mv && setEndFrameLock('custom prompt', true) === 'custom prompt', 'setEndFrameLock is idempotent and leaves other prompts alone');
  const req = buildPremiumVideoRequest({ prompt: setEndFrameLock(mv, true), model: 'Veo 3.1 - Quality', aspectRatio: '16:9', durationSeconds: 8, firstFrameMediaId: 'first-1', lastFrameMediaId: 'last-1' });
  const retry = planVideoRetry(req, new Error('Unsupported last frame image for this model'));
  check(!retry.request.lastFrameImageMediaId && /as the first frame throughout/.test(setEndFrameLock(retry.request.prompt, Boolean(retry.request.lastFrameImageMediaId))), 'after planVideoRetry drops the last frame the prompt lock is rewritten');
}

console.log(`\n${failures.length ? '❌' : '✅'} premium shot production: ${checks - failures.length}/${checks} checks passed${failures.length ? ` — ${failures.length} failed` : ''}`);
process.exit(failures.length ? 1 : 0);
