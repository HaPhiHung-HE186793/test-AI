// Prototype Stage 1-3 (0 credit): story room -> character bible sheets -> env plate -> keyframes, using the new premium engine.
// Usage: node --experimental-strip-types proto_stage123.ts <outDir> [--shots 12] [--style pixar3d] [--only-keyframes 1,2,3] [--redo-story]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { Flow } from '../../services/flowSdkClient.ts';
import * as E from '../../services/premiumPromptEngine.ts';

const argv = process.argv.slice(2);
const outDir = path.resolve(argv[0]);
const flag = (name: string, def = '') => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : def; };
const shotCount = parseInt(flag('--shots', '12'), 10);
const style = flag('--style', 'pixar3d') as any;
const aspectRatio = flag('--aspect', '16:9');
const onlyKf = flag('--only-keyframes', '').split(',').map((n) => parseInt(n, 10)).filter((n) => n > 0);
const redoStory = argv.includes('--redo-story');
const script = flag('--script', 'Đại chiến sinh tồn tiền sử tại Thung lũng Nham thạch Kreta giữa hai đại quái thú khủng long: Bạo chúa dung nham BAO_CHUA_IGNIS_REX và Thủy quái lôi đình THUY_QUAI_VOLT_SPINO.');
// ffmpeg-static của dự án (Windows: ffmpeg.exe, Linux/macOS: ffmpeg) — đường dẫn tương đối, chạy được trên mọi máy.
const _ffStatic = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
const FF = fs.existsSync(_ffStatic) ? _ffStatic : 'ffmpeg';
fs.mkdirSync(outDir, { recursive: true });

const stateP = path.join(outDir, 'state.json');
const state: any = fs.existsSync(stateP) ? JSON.parse(fs.readFileSync(stateP, 'utf-8')) : { media: {}, prompts: {}, lint: {} };
const save = () => fs.writeFileSync(stateP, JSON.stringify(state, null, 2), 'utf-8');

const extractJson = (t: string) => { const a = t.indexOf('{'); const b = t.lastIndexOf('}'); return JSON.parse(t.slice(a, b + 1)); };

async function img(key: string, prompt: string, refs: string[] = [], kind: 'image' | 'sheet' = 'image', force = false) {
  const file = path.join(outDir, `${key}.png`);
  state.prompts[key] = prompt;
  state.lint[key] = (E as any).lintPremiumPrompt ? (E as any).lintPremiumPrompt(prompt, kind) : null;
  if (!force && fs.existsSync(file) && state.media[key]) { save(); return state.media[key]; }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const t0 = Date.now();
      // Lệnh tạo ảnh có thể treo vô hạn nếu tab Flow bị chuyển trang -> giới hạn 180s rồi thử lại
      const res: any = await Promise.race([
        Flow.generate.image({ prompt, modelDisplayName: '🍌 Nano Banana Pro', aspectRatio, ...(refs.length ? { referenceImageMediaIds: refs } : {}) }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 180s (tab Flow bị chuyển trang?)')), 180_000)),
      ]);
      fs.writeFileSync(file, Buffer.from(res.base64, 'base64'));
      state.media[key] = res.mediaId;
      save();
      console.log(`   ✅ ${key} (${((Date.now() - t0) / 1000).toFixed(0)}s, refs=${refs.length}, lint=${state.lint[key]?.ok ?? '-'} ${state.lint[key]?.words ?? ''}w)`);
      return res.mediaId;
    } catch (e: any) {
      console.warn(`   ⚠️ ${key} lần ${attempt}: ${e.message}`);
    }
  }
  throw new Error(`Không tạo được ${key}`);
}

(async () => {
  // Stage 1 — Story room
  let bible: any;
  const bibleP = path.join(outDir, 'bible.json');
  if (fs.existsSync(bibleP) && !redoStory) {
    bible = JSON.parse(fs.readFileSync(bibleP, 'utf-8'));
  } else {
    const prompt = E.buildStoryRoomPrompt({ script, shotCount, style, aspectRatio, dialogueLang: 'en' } as any);
    fs.writeFileSync(path.join(outDir, 'story_room_prompt.txt'), prompt, 'utf-8');
    try {
      const res = await Flow.generate.text({ prompt });
      fs.writeFileSync(path.join(outDir, 'story_room_raw.txt'), res.text, 'utf-8');
      bible = E.normalizeStoryBible(extractJson(res.text), { script, shotCount, style } as any);
      console.log('🧠 Story room (LLM) OK');
    } catch (e: any) {
      console.warn('⚠️ Story room LLM lỗi, dùng fallback:', e.message);
      bible = E.buildFallbackStoryBible({ script, shotCount, style } as any);
    }
    fs.writeFileSync(bibleP, JSON.stringify(bible, null, 2), 'utf-8');
  }
  console.log(`🎬 ${bible.movieTitle} — ${bible.shots.length} cảnh, nhân vật: ${bible.characters.map((c: any) => c.displayNameEn).join(' / ')}`);

  // Stage 2 — bible sheets + all-in-one master sheet + 2-character cast lineup + env plate
  const sheetIds: Record<string, { turnaround: string; expression: string; portrait: string; master: string }> = {};
  for (const ch of bible.characters) {
    const p = E.buildCharacterSheetPrompts({ style, character: ch } as any);
    const pRef = E.buildCharacterSheetPrompts({ style, character: ch, withReferenceImage: true } as any);
    sheetIds[ch.id] = {
      turnaround: await img(`02_${ch.id}_turnaround`, p.turnaroundEn, [], 'sheet'),
      expression: '', portrait: '', master: '',
    };
    sheetIds[ch.id].expression = await img(`02_${ch.id}_expression_sheet`, pRef.expressionSheetEn, [sheetIds[ch.id].turnaround], 'sheet');
    sheetIds[ch.id].portrait = await img(`02_${ch.id}_portrait`, pRef.portraitEn, [sheetIds[ch.id].turnaround], 'sheet');
    sheetIds[ch.id].master = await img(`02_${ch.id}_master_sheet`, pRef.masterSheetEn, [sheetIds[ch.id].turnaround], 'sheet');
  }
  let castLineupId = '';
  if (bible.characters.length >= 2 && (E as any).buildCastLineupSheetPrompt) {
    const lineupPrompt = (E as any).buildCastLineupSheetPrompt({ style, characters: bible.characters, withReferenceImages: true });
    const lineupRefs = bible.characters.slice(0, 2).map((c: any) => sheetIds[c.id]?.turnaround).filter(Boolean);
    castLineupId = await img('02_cast_lineup_sheet', lineupPrompt, lineupRefs, 'sheet');
  }
  const envId = await img('03_environment_plate', E.buildEnvironmentPlatePrompt({ style, environment: bible.environment, aspectRatio } as any), [], 'image');

  // Stage 3 — keyframes (start state)
  for (const shot of bible.shots) {
    if (onlyKf.length && !onlyKf.includes(shot.shotNumber)) continue;
    const isFace = ['CU', 'MCU', 'ECU'].includes(shot.shotSize);
    const refs: string[] = []; const order: string[] = [];
    for (const cid of shot.characters) {
      const ch = bible.characters.find((c: any) => c.id === cid);
      if (!ch) continue;
      refs.push(sheetIds[cid].turnaround); order.push(`${ch.displayNameEn} character turnaround sheet`);
      if (isFace && shot.characters.length === 1) { refs.push(sheetIds[cid].portrait); order.push(`${ch.displayNameEn} face portrait`); }
    }
    // Cảnh hành động dùng bối cảnh "Hồ đấu" khoá cố định (hội đồng: 5 bối cảnh khác nhau làm mất mạch truyện)
    const stageId = shot.useStage && state.media['03S_stage_fight_pool'] ? state.media['03S_stage_fight_pool'] : envId;
    refs.push(stageId); order.push('environment');
    const kp = E.buildKeyframePrompt({ style, shot, characters: bible.characters, environment: bible.environment, aspectRatio, referenceOrder: order } as any);
    const mp = E.buildMotionPrompt({ style, shot, characters: bible.characters, environment: bible.environment, dialogueLang: 'en' } as any);
    state.prompts[`shot_${String(shot.shotNumber).padStart(2, '0')}_motion`] = mp;
    state.lint[`shot_${String(shot.shotNumber).padStart(2, '0')}_motion`] = (E as any).lintPremiumPrompt ? (E as any).lintPremiumPrompt(mp, 'video') : null;
    const sid = String(shot.shotNumber).padStart(2, '0');
    const startId = await img(`shot_${sid}_start_frame`, kp, refs.slice(0, 3), 'image', false);
    // Cảnh tiếp xúc giữa hai nhân vật: khung KẾT THÚC khoá danh tính + buộc hành động xảy ra (Veo first+last frame)
    // Nếu shot.singleFrame === true (MEM-24.4 Hybrid I2V cho cảnh thoại CU hoặc cú cắt ngắn), bỏ qua end_frame.
    if (shot.endStateEn && !shot.singleFrame) {
      // Khung kết thúc = CHỈNH SỬA khung đầu (Nano Banana giữ nền/ánh sáng/góc máy), chỉ đổi tư thế -> Veo nội suy không bị trôi nền.
      const inShot = shot.characters.map((cid: string) => bible.characters.find((c: any) => c.id === cid)).filter(Boolean);
      const keepLooks = inShot.map((c: any, i: number) => `${c.displayNameEn} keeps the exact same character design, proportions and markings as image ${i + 2}: ${c.lookEn}`).join('. ');
      const ep = `Edit image 1. Keep the background, rocks, steam, water, lighting, colours, camera angle, lens and Pixar-like 3D animation style of image 1 exactly the same. Change only the poses and expressions: ${shot.endStateEn}. ${keepLooks}. Same character scale and camera framing as image 1.`;
      const endRefs = [startId, ...shot.characters.map((cid: string) => sheetIds[cid]?.turnaround)].filter(Boolean).slice(0, 3) as string[];
      await img(`shot_${sid}_end_frame`, ep, endRefs, 'image', false);
    }
  }

  // Contact sheet for review
  const kfs = bible.shots.map((s: any) => path.join(outDir, `shot_${String(s.shotNumber).padStart(2, '0')}_start_frame.png`)).filter((f: string) => fs.existsSync(f));
  if (kfs.length) {
    const list = path.join(outDir, 'kf_list.txt');
    fs.writeFileSync(list, kfs.map((f: string) => `file '${f.replace(/\\/g, '/')}'`).join('\n'), 'utf-8');
    const cols = kfs.length > 9 ? 4 : 3;
    execSync(`"${FF}" -hide_banner -loglevel error -y -f concat -safe 0 -i "${list}" -vf "scale=640:-2,tile=${cols}x${Math.ceil(kfs.length / cols)}:padding=6" -frames:v 1 -q:v 3 "${path.join(outDir, 'keyframes_contact_sheet.jpg')}"`);
  }
  console.log('🏁 Xong Stage 1-3 prototype ->', outDir);
})().catch((e) => { console.error('❌', e); process.exit(1); });
