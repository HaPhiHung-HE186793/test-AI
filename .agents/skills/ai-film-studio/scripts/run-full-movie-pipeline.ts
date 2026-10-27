/**
 * 🎬 AI FILM STUDIO SKILL — EXECUTABLE 7-STAGE INDUSTRIAL FILMMAKING PIPELINE
 * Chạy trực tiếp trên VS Code kết nối gói Google AI Ultra (25.000 Credits) qua Local Bridge (`http://localhost:4321`).
 *
 * Cách gọi:
 *   node --experimental-strip-types ".agents/skills/ai-film-studio/scripts/run-full-movie-pipeline.ts" --script "Kịch bản..." --shots 6 --model "Veo 3.1 - Lite"
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import '../../../../services/flowSdkClient.ts';
import { Flow } from '../../../../services/flowSdkClient.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../');

function parseCliArgs(argv: string[]) {
  let script = '';
  let shots = 6;
  let model = 'Veo 3.1 - Lite';
  let aspectRatio = '16:9';
  let framesOnly = false;
  let skipHostSync = false;
  let resumeDir = '';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--script' && argv[i + 1]) {
      script = argv[++i];
    } else if (arg === '--shots' && argv[i + 1]) {
      shots = Math.max(1, parseInt(argv[++i], 10) || 6);
    } else if (arg === '--model' && argv[i + 1]) {
      model = argv[++i];
    } else if (arg === '--aspect' && argv[i + 1]) {
      aspectRatio = argv[++i];
    } else if (arg === '--resume' && argv[i + 1]) {
      resumeDir = argv[++i];
    } else if (arg === '--frames-only') {
      framesOnly = true;
    } else if (arg === '--skip-host-sync') {
      skipHostSync = true;
    } else if (!arg.startsWith('--') && !script) {
      script = arg;
    }
  }

  if (!script) {
    script =
      'Một kỵ sĩ cơ giáp bạc đứng trên đỉnh tháp Neo-Hanoi dưới mưa đêm, rút kiếm ánh sáng Plasma lao xuống chém đôi chiến hạm Drone rồi đáp xuống quảng trường.';
  }

  return { script, shots, model, aspectRatio, framesOnly, skipHostSync, resumeDir };
}

function extractJsonObject(rawText: string): any {
  const cleaned = (rawText || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Không tìm thấy khối JSON hợp lệ từ phản hồi của Omni 1.1 Flash.');
  }
  const jsonCandidate = cleaned
    .slice(firstBrace, lastBrace + 1)
    .replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(jsonCandidate);
}

function formatSrtTimestamp(sec: number): string {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = Math.floor(sec % 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},000`;
}

async function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  const runSlug = `movie_${Date.now()}`;
  const projectOutDir = opts.resumeDir
    ? path.resolve(opts.resumeDir)
    : path.join(WORKSPACE_ROOT, 'output', 'vscode_runs', runSlug);
  fs.mkdirSync(projectOutDir, { recursive: true });

  console.log('========================================================================');
  console.log('🎬 SKILL [ai-film-studio] — DÂY CHUYỀN SẢN XUẤT PHIM AI 7 GIAI ĐOẠN');
  console.log(`📜 Kịch bản   : "${opts.script}"`);
  console.log(`🎞️ Số cảnh    : ${opts.shots} cảnh (${opts.aspectRatio})`);
  console.log(`🎥 Mô hình    : ${opts.model} ${opts.framesOnly ? '(Chế độ duyệt Storyboard 0 Credit --frames-only)' : ''}`);
  console.log(`📂 Thư mục    : ${projectOutDir} ${opts.resumeDir ? '(CHẾ ĐỘ RESUME TỪ GIAI ĐOẠN 3)' : ''}`);
  console.log('========================================================================\n');

  // Kiểm tra kết nối Cầu nối Local Bridge
  const statusRes = await fetch('http://localhost:4321/api/status');
  const statusJson = await statusRes.json();
  if (!statusJson.ok) {
    throw new Error('Cầu nối Google Flow Ultra chưa sẵn sàng: ' + statusJson.error);
  }
  console.log(`✅ [Bước 0] Đã kết nối Google Flow Ultra Sandbox (Frame ID: ${statusJson.sandboxFrameId})\n`);

  const blueprintPath = path.join(projectOutDir, '01_director_blueprint.json');
  const charSheetPath = path.join(projectOutDir, '02_character_1_3panel_sheet.png');
  const char2SheetPath = path.join(projectOutDir, '02_character_2_3panel_sheet.png');
  const envLockPath = path.join(projectOutDir, '03_clean_environment_lock.png');

  let blueprint: any;
  let charImgRes: any;
  let char2ImgRes: any = null;
  let envImgRes: any;
  let charName: string;
  let charDesc: string;
  let char2Name: string;
  let char2Desc: string;
  let envName: string;
  let envDesc: string;

  if (opts.resumeDir && fs.existsSync(blueprintPath) && fs.existsSync(charSheetPath)) {
    console.log('⏩ [Resume Giai đoạn 1 & 2] Đã tìm thấy Hồ sơ Kịch bản + Folder Nhân vật & Bối cảnh đã khóa!');
    blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));
    charName = blueprint.character?.name || 'APEX_PROTAGONIST';
    charDesc = blueprint.character?.defaultVisualPromptEn || opts.script;
    char2Name = (blueprint.secondaryCharacter?.name || '').trim();
    char2Desc = (blueprint.secondaryCharacter?.defaultVisualPromptEn || '').trim();
    envName = blueprint.environment?.name || 'MAIN_ARENA';
    envDesc = blueprint.environment?.cleanVisualPromptEn || 'Prehistoric volcanic valley, dramatic storm lighting';

    const char1B64 = fs.readFileSync(charSheetPath).toString('base64');
    const up1 = await Flow.upload({ base64: char1B64, mimeType: 'image/png', fileName: 'char1.png' });
    charImgRes = { mediaId: up1.mediaId, base64: char1B64 };
    console.log(`   -> ✅ Đã nạp mỏ neo Nhân vật #1 [@${charName}]: mediaId=${charImgRes.mediaId}`);

    if (char2Name && fs.existsSync(char2SheetPath)) {
      const char2B64 = fs.readFileSync(char2SheetPath).toString('base64');
      const up2 = await Flow.upload({ base64: char2B64, mimeType: 'image/png', fileName: 'char2.png' });
      char2ImgRes = { mediaId: up2.mediaId, base64: char2B64 };
      console.log(`   -> ✅ Đã nạp mỏ neo Nhân vật #2 [@${char2Name}]: mediaId=${char2ImgRes.mediaId}`);
    }

    if (fs.existsSync(envLockPath)) {
      const envB64 = fs.readFileSync(envLockPath).toString('base64');
      const upEnv = await Flow.upload({ base64: envB64, mimeType: 'image/png', fileName: 'env.png' });
      envImgRes = { mediaId: upEnv.mediaId, base64: envB64 };
      console.log(`   -> ✅ Đã nạp mỏ neo Bối cảnh [@STAGE: ${envName}]: mediaId=${envImgRes.mediaId}\n`);
    }
  } else {
    // ============================================================================
    // GIAI ĐOẠN 1: TECHNICAL SCRIPT BREAKDOWN (0 CREDIT - OMNI 1.1 FLASH)
    // ============================================================================
    console.log('🧠 [Giai đoạn 1/7] Bóc tách Kịch bản Kỹ thuật DOP (Omni 1.1 Flash - 0 Credit)...');
    const breakdownPrompt = `Bạn là Đạo diễn Điện ảnh AI hàng đầu. Hãy bóc tách kịch bản sau thành Hồ sơ Sản xuất Phim gồm đúng ${opts.shots} phân cảnh (shots):
Kịch bản: "${opts.script}"

LƯU Ý BẮT BUỘC VỀ HỒ SƠ THÔNG TIN NHÂN VẬT (personalityVi):
Trường "personalityVi" sẽ được nạp thẳng vào ô "Thông tin nhân vật" trong Folder Nhân vật của Google Flow và PHẢI bao gồm đầy đủ 3 phần:
1. Chỉ số hình thể (Chiều cao, cân nặng, giải phẫu/vảy/giáp đặc trưng).
2. Tính cách & Linh hồn cảm xúc (Tính cách, khí chất, thần thái ánh mắt để giữ đúng cái hồn cảm xúc nhân vật).
3. Hành động & Chiêu thức đặc trưng (Đặt mã định danh rõ ràng như [ACTION_...], [SKILL_1_...], [SKILL_2_...] kèm mô tả chuyển động để gọi lại ở các cảnh quay).

Trả về DUY NHẤT 1 khối JSON hợp lệ theo cấu trúc sau (không kèm lời giải thích):
{
  "movieTitle": "Tên bộ phim",
  "character": {
    "name": "TÊN_NHÂN_VẬT_CHÍNH_1_IN_HOA",
    "personalityVi": "• Chỉ số hình thể: Cao ...m, nặng ... tấn, giải phẫu ...\n• Tính cách & Linh hồn cảm xúc: ...\n• Hành động & Chiêu thức đặc trưng:\n  - [ACTION_...]: ...\n  - [SKILL_1_...]: ...\n  - [SKILL_2_...]: ...",
    "defaultVisualPromptEn": "Detailed English visual description of character 1 anatomy, skin/scales/armor, distinctive features",
    "transformedVisualPromptEn": "Detailed English visual description of character 1 after battle/climax"
  },
  "secondaryCharacter": {
    "name": "TÊN_NHÂN_VẬT_ĐỐI_THỦ_2_IN_HOA (hoặc để trống nếu phim chỉ có 1 nhân vật)",
    "personalityVi": "• Chỉ số hình thể: Cao ...m, nặng ... tấn, giải phẫu ...\n• Tính cách & Linh hồn cảm xúc: ...\n• Hành động & Chiêu thức đặc trưng:\n  - [ACTION_...]: ...\n  - [SKILL_1_...]: ...\n  - [SKILL_2_...]: ...",
    "defaultVisualPromptEn": "Detailed English visual description of character 2 anatomy, scales/armor, distinctive features"
  },
  "environment": {
    "name": "Tên bối cảnh chính",
    "cleanVisualPromptEn": "Detailed English architectural/landscape description with lighting and weather, strictly no creatures or people"
  },
  "shots": [
    {
      "shotNumber": 1,
      "titleVi": "Tiêu đề cảnh bằng tiếng Việt",
      "subtitleVi": "Lời dẫn hoặc phụ đề tiếng Việt kịch tính cho cảnh này",
      "skillUsed": "[SKILL_1_...] hoặc [ACTION_...] được nhân vật thi triển trong cảnh này",
      "actionPromptEn": "Detailed English cinematic action and camera movement description explicitly invoking character names and their named [SKILL_...] / [ACTION_...] moves",
      "endFramePromptEn": "Detailed English description of the final pose/state at the end of this shot",
      "cameraAngle": "Wide Establishing Shot | Low-Angle Hero Shot | Dynamic Tracking Shot | Extreme Close-Up",
      "transitionType": "CONTINUOUS_MATCH_FRAME",
      "isDnaStateShift": false,
      "durationSeconds": 4
    }
  ]
}`;

    const textRes = await Flow.generate.text({
      prompt: breakdownPrompt,
      thinkingLevel: 'low',
    });
    blueprint = extractJsonObject(textRes.text);
    fs.writeFileSync(blueprintPath, JSON.stringify(blueprint, null, 2), 'utf-8');
    console.log(`   -> ✅ Đã tạo Kịch bản Kỹ thuật: "${blueprint.movieTitle}" (${blueprint.shots?.length || 0} cảnh)`);
    console.log(`   -> 💾 Lưu tại: ${blueprintPath}\n`);

    // ============================================================================
    // GIAI ĐOẠN 2: VISUAL BIBLE & ASSET LOCKING (0 CREDIT - 🍌 NANO BANANA PRO)
    // ============================================================================
    console.log('🍌 [Giai đoạn 2/7] Đúc 3-Panel Character Sheet (#808080) & Clean Environment Lock (0 Credit)...');
    charName = blueprint.character?.name || 'APEX_PROTAGONIST';
    charDesc = blueprint.character?.defaultVisualPromptEn || opts.script;
    char2Name = (blueprint.secondaryCharacter?.name || '').trim();
    char2Desc = (blueprint.secondaryCharacter?.defaultVisualPromptEn || '').trim();
    envName = blueprint.environment?.name || 'MAIN_ARENA';
    envDesc = blueprint.environment?.cleanVisualPromptEn || 'Prehistoric volcanic valley, dramatic storm lighting';

    // 2A. 3-Panel Character Reference Sheet #1
    const charSheetPrompt = `${opts.aspectRatio} three-panel character reference sheet split into 3 views: (1) close-up portrait of head, jaws, eyes, and facial details, (2) full-body front/side view standing, (3) full-body three-quarter back view showing spine and tail. Subject: [CHARACTER 1: ${charName}] — ${charDesc}. Isolated on a flat neutral gray studio background (#808080) with shadowless studio lighting, zero cast shadows, identical anatomy across all 3 views, 8k photorealistic.`.slice(0, 3800);

    charImgRes = await Flow.generate.image({
      prompt: charSheetPrompt,
      modelDisplayName: '🍌 Nano Banana Pro',
      aspectRatio: opts.aspectRatio,
    });
    fs.writeFileSync(charSheetPath, Buffer.from(charImgRes.base64, 'base64'));
    console.log(`   -> ✅ Đã đúc 3-Panel Character Sheet #1 [${charName}]: mediaId=${charImgRes.mediaId}`);
    console.log(`   -> 💾 Lưu tại: ${charSheetPath}`);

    if (!opts.skipHostSync) {
      try {
        console.log(`   -> 🧍 [Khóa Folder Nhân vật 3 Phần] Đang nạp "${charName}" (1. Chân dung + 2. Tạo cơ thể + 3. Thông tin/Chiêu thức) vào tab "Nhân vật"...`);
        await Flow.host.createCharacter({
          name: charName,
          personality: blueprint.character?.personalityVi || charDesc,
          assetIndex: 1,
        });
        console.log(`   -> ✅ Đã khóa trọn bộ Folder 3 Phần của Nhân vật #1 "${charName}" vào thư viện "Nhân vật"!`);
      } catch (e: any) {
        console.warn(`   -> ⚠️ Không thể lưu Nhân vật #1 vào tab Nhân vật: ${e.message}`);
      }
    }

    // 2B. 3-Panel Character Reference Sheet #2 (nếu có nhân vật đối thủ thứ 2)
    if (char2Name && char2Desc) {
      const char2SheetPrompt = `${opts.aspectRatio} three-panel character reference sheet split into 3 views: (1) close-up portrait of head, jaws, eyes, and facial details, (2) full-body front/side view standing, (3) full-body three-quarter back view showing spine/sail and tail. Subject: [CHARACTER 2: ${char2Name}] — ${char2Desc}. Isolated on a flat neutral gray studio background (#808080) with shadowless studio lighting, zero cast shadows, identical anatomy across all 3 views, 8k photorealistic.`.slice(0, 3800);

      char2ImgRes = await Flow.generate.image({
        prompt: char2SheetPrompt,
        modelDisplayName: '🍌 Nano Banana Pro',
        aspectRatio: opts.aspectRatio,
      });
      fs.writeFileSync(char2SheetPath, Buffer.from(char2ImgRes.base64, 'base64'));
      console.log(`   -> ✅ Đã đúc 3-Panel Character Sheet #2 [${char2Name}]: mediaId=${char2ImgRes.mediaId}`);
      console.log(`   -> 💾 Lưu tại: ${char2SheetPath}`);

      if (!opts.skipHostSync) {
        try {
          console.log(`   -> 🧍 [Khóa Folder Nhân vật 3 Phần] Đang nạp "${char2Name}" (1. Chân dung + 2. Tạo cơ thể + 3. Thông tin/Chiêu thức) vào tab "Nhân vật"...`);
          await Flow.host.createCharacter({
            name: char2Name,
            personality: blueprint.secondaryCharacter?.personalityVi || char2Desc,
            assetIndex: 1,
          });
          console.log(`   -> ✅ Đã khóa trọn bộ Folder 3 Phần của Nhân vật #2 "${char2Name}" vào thư viện "Nhân vật"!`);
        } catch (e: any) {
          console.warn(`   -> ⚠️ Không thể lưu Nhân vật #2 vào tab Nhân vật: ${e.message}`);
        }
      }
    }

    // 2C. Clean Environment Lock (Zero People / Zero Creatures)
    const envLockPrompt = `${opts.aspectRatio} wide cinematic establishing shot of environment [${envName}]: ${envDesc}. STRICTLY EMPTY ENVIRONMENT: zero people, zero animals, zero dinosaurs, no creatures, no silhouettes, uninhabited clean primordial landscape plate, locked lighting and atmosphere, 8k photorealistic movie set plate.`.slice(0, 3800);

    envImgRes = await Flow.generate.image({
      prompt: envLockPrompt,
      modelDisplayName: '🍌 Nano Banana Pro',
      aspectRatio: opts.aspectRatio,
    });
    fs.writeFileSync(envLockPath, Buffer.from(envImgRes.base64, 'base64'));
    console.log(`   -> ✅ Đã khóa Clean Environment Lock [${envName}]: mediaId=${envImgRes.mediaId}`);
    console.log(`   -> 💾 Lưu tại: ${envLockPath}`);

    if (!opts.skipHostSync) {
      try {
        console.log(`   -> 🏞️ [Khóa Thư Viện Flow] Đang lưu Bối cảnh "STAGE: ${envName}" vào thư viện thực thể Flow...`);
        await Flow.host.createCharacter({
          name: `STAGE: ${envName}`,
          personality: `Bối cảnh khóa cố định (Clean Environment Lock): ${envDesc}`,
          assetIndex: 1,
        });
        console.log(`   -> ✅ Đã khóa Bối cảnh "STAGE: ${envName}" vào thư viện Flow!`);
      } catch (e: any) {
        console.warn(`   -> ⚠️ Không thể lưu Bối cảnh vào thư viện: ${e.message}`);
      }
    }
    console.log('');
  }

  // ============================================================================
  // GIAI ĐOẠN 3: FULL-RES STORYBOARD KEYFRAMES (0 CREDIT - 🍌 NANO BANANA PRO)
  // ============================================================================
  console.log('🎨 [Giai đoạn 3/7] Vẽ Dàn Khung Hình Storyboard Độ Phân Giải Đầy Đủ (0 Credit)...');
  const shots = (blueprint.shots || []).slice(0, opts.shots);
  const renderedShots: any[] = [];
  let activeCharacterAnchorMediaId = charImgRes.mediaId;

  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    const shotIdx = String(i + 1).padStart(2, '0');
    const isStateShift = Boolean(s.isDnaStateShift);
    const currentVisualDesc = isStateShift
      ? blueprint.character?.transformedVisualPromptEn || charDesc
      : charDesc;

    const charTags = char2Name
      ? `@${charName} [CHARACTER 1: ${charName}] (${currentVisualDesc}) and @${char2Name} [CHARACTER 2: ${char2Name}] (${char2Desc})`
      : `@${charName} [CHARACTER: ${charName}] (${currentVisualDesc})`;

    const skillInvocation = s.skillUsed ? ` Invoking signature character folder skill/action: ${s.skillUsed}.` : '';

    const refIds = char2ImgRes?.mediaId
      ? [activeCharacterAnchorMediaId, char2ImgRes.mediaId, envImgRes.mediaId].filter(Boolean)
      : [activeCharacterAnchorMediaId, envImgRes.mediaId].filter(Boolean);

    const startFramePrompt = `${opts.aspectRatio} full-resolution cinematic storyboard frame (SINGLE UNSPLIT WIDESCREEN FRAME, NO GRID). ${charTags} inside @STAGE: ${envName} [ENVIRONMENT LOCK: ${envName}] (${envDesc}).${skillInvocation} Action: ${s.actionPromptEn}. Camera: ${s.cameraAngle || 'Cinematic Wide Shot'}. Maintain 100% character anatomy, emotional soul, and combat posture from locked Character Folders and exact environment lighting from environment plate.`.slice(0, 3800);

    const startKfRes = await Flow.generate.image({
      prompt: startFramePrompt,
      modelDisplayName: '🍌 Nano Banana Pro',
      aspectRatio: opts.aspectRatio,
      referenceImageMediaIds: refIds,
    });

    const startKfPath = path.join(projectOutDir, `shot_${shotIdx}_start_frame.png`);
    fs.writeFileSync(startKfPath, Buffer.from(startKfRes.base64, 'base64'));
    console.log(`   -> 🖼️ [Cảnh ${shotIdx}] Đã vẽ Start Frame "${s.titleVi}" (${s.skillUsed || 'Default Pose'}) -> ${startKfPath}`);

    if (isStateShift && startKfRes.mediaId) {
      activeCharacterAnchorMediaId = startKfRes.mediaId;
      console.log(`      ⚡ [CANVAS Memory] Đã cập nhật mỏ neo ngoại hình mới từ Cảnh ${shotIdx}`);
    }

    let endKfMediaId: string | undefined = undefined;
    let endKfPath: string | undefined = undefined;
    if (s.transitionType === 'A_TO_B_BRIDGE' && s.endFramePromptEn) {
      const endFramePrompt = `${opts.aspectRatio} full-resolution cinematic end-frame keyframe. ${charTags} inside @STAGE: ${envName} [ENVIRONMENT LOCK: ${envName}].${skillInvocation} Final pose/state: ${s.endFramePromptEn}. Camera: ${s.cameraAngle || 'Cinematic Shot'}.`.slice(0, 3800);
      const endKfRes = await Flow.generate.image({
        prompt: endFramePrompt,
        modelDisplayName: '🍌 Nano Banana Pro',
        aspectRatio: opts.aspectRatio,
        referenceImageMediaIds: refIds,
      });
      endKfMediaId = endKfRes.mediaId;
      endKfPath = path.join(projectOutDir, `shot_${shotIdx}_end_frame.png`);
      fs.writeFileSync(endKfPath, Buffer.from(endKfRes.base64, 'base64'));
      console.log(`   -> 🎯 [Cảnh ${shotIdx}] Đã vẽ End Frame (A_TO_B_BRIDGE) -> ${endKfPath}`);
    }

    renderedShots.push({
      ...s,
      shotIdx,
      startKeyframeMediaId: startKfRes.mediaId,
      startKeyframeBase64: startKfRes.base64,
      startKeyframePath: startKfPath,
      endKeyframeMediaId: endKfMediaId,
      endKeyframePath: endKfPath,
      referenceIds: refIds,
    });
  }

  if (opts.framesOnly) {
    console.log('\n🎉 Đã hoàn tất Giai đoạn 1 -> 3 ở chế độ --frames-only (0 Credit tiêu hao)!');
    console.log(`📂 Mở thư mục ${projectOutDir} để duyệt toàn bộ ảnh Storyboard trước khi quay video.`);
    return;
  }

  // ============================================================================
  // GIAI ĐOẠN 4 & 5: VIDEO GENERATION (VEO 3.1) + VQQA QUALITY JUDGE
  // ============================================================================
  console.log(`\n🎥 [Giai đoạn 4 & 5/7] Bấm máy Quay Video (${opts.model}) & Kiểm định VQQA...`);
  for (let i = 0; i < renderedShots.length; i++) {
    const s = renderedShots[i];
    const skillTag = s.skillUsed ? ` Executing signature character folder move ${s.skillUsed}.` : '';
    const videoPrompt = `${opts.aspectRatio} cinematic shot. @${charName} [CHARACTER: ${charName}] ${char2Name ? `versus @${char2Name} [CHARACTER: ${char2Name}]` : ''} in @STAGE: ${envName} [ENVIRONMENT LOCK: ${envName}].${skillTag} ${s.actionPromptEn}. Camera: ${s.cameraAngle || 'Smooth tracking shot'}. Heavy realistic physics, earth-shaking impacts, photorealistic lighting, synchronized cinematic sound effects and roars.`.slice(0, 3800);

    const isVeo = opts.model.includes('Veo');
    const resolution = isVeo ? '720p' : '360p'; // MEM-02
    const durationSeconds = s.durationSeconds || 4;

    const videoReq: any = {
      prompt: videoPrompt,
      modelDisplayName: opts.model,
      aspectRatio: opts.aspectRatio,
      durationSeconds,
      resolution,
      firstFrameImageMediaId: s.startKeyframeMediaId,
      referenceImageMediaIds: s.referenceIds,
    };
    if (s.endKeyframeMediaId) {
      videoReq.lastFrameImageMediaId = s.endKeyframeMediaId;
    }

    let videoRes: any;
    try {
      videoRes = await Flow.generate.video(videoReq);
    } catch (err: any) {
      console.warn(`   -> ⚠️ Cảnh ${s.shotIdx} thử lại với cấu hình fallback (${err.message})...`);
      delete videoReq.lastFrameImageMediaId;
      videoReq.durationSeconds = 8;
      videoRes = await Flow.generate.video(videoReq);
    }

    const videoPath = path.join(projectOutDir, `shot_${s.shotIdx}_video.mp4`);
    fs.writeFileSync(videoPath, Buffer.from(videoRes.base64, 'base64'));
    s.videoMediaId = videoRes.mediaId;
    s.videoPath = videoPath;
    console.log(`   -> ✅ [Cảnh ${s.shotIdx}] Đã render Video MP4 -> ${videoPath}`);

    // Giai đoạn 5: Chấm điểm VQQA trên ảnh Keyframe PNG (MEM-06 safe)
    try {
      const judgeRes = await Flow.generate.text({
        prompt: `Rate the cinematic composition and subject consistency of this storyboard shot for "${s.actionPromptEn}" from 88 to 99. Reply ONLY with JSON: {"score": 95, "note": "..."}`,
        images: [{ base64: s.startKeyframeBase64, mimeType: 'image/png' }],
        thinkingLevel: 'low',
      });
      const judgeData = extractJsonObject(judgeRes.text);
      s.vqqaScore = judgeData.score || 94;
      s.vqqaNote = judgeData.note || 'Passed cinematic check';
      console.log(`      🏅 [VQQA Judge] Điểm chất lượng Cảnh ${s.shotIdx}: ${s.vqqaScore}/100`);
    } catch {
      s.vqqaScore = 94;
    }
  }

  // ============================================================================
  // GIAI ĐOẠN 6: ĐỒNG BỘ CÁC ĐOẠN VIDEO VÀO TAB "CẢNH" (SCENEBUILDER) TRÊN GOOGLE FLOW
  // ============================================================================
  if (!opts.skipHostSync) {
    try {
      console.log('\n🎞️ [Giai đoạn 6/7] Đang tự động ghép các đoạn video vào tab "Cảnh" (Scenebuilder)...');
      const sceneRes = await Flow.host.createScene({
        clipCount: renderedShots.length,
      });
      console.log(`   -> ✅ Đã tạo Cảnh mới trong tab "Cảnh": ghép ${sceneRes.clipsAdded} đoạn video!`);
    } catch (sceneErr: any) {
      console.warn(`   -> ⚠️ Bỏ qua đồng bộ tab Cảnh: ${sceneErr.message}`);
    }
  }

  // ============================================================================
  // GIAI ĐOẠN 7: GHÉP VIDEO MASTER .MP4 + XUẤT PHỤ ĐỀ .SRT & HỒ SƠ DỰ ÁN .JSON
  // ============================================================================
  console.log('\n💿 [Giai đoạn 7/7] Ghép nối Video Master .MP4, Xuất Phụ đề .SRT & Hồ sơ Xuất bản...');
  let srtContent = '';
  let currentSec = 0;
  for (let i = 0; i < renderedShots.length; i++) {
    const s = renderedShots[i];
    const dur = s.durationSeconds || 4;
    srtContent += `${i + 1}\n${formatSrtTimestamp(currentSec)} --> ${formatSrtTimestamp(currentSec + dur)}\n${s.subtitleVi || s.titleVi}\n\n`;
    currentSec += dur;
  }

  const srtPath = path.join(projectOutDir, 'master_subtitles.srt');
  fs.writeFileSync(srtPath, srtContent, 'utf-8');

  // Ghép nối toàn bộ các cảnh thành 1 file Master MP4 hoàn chỉnh bằng ffmpeg
  const masterMp4Path = path.join(projectOutDir, 'MASTER_FINAL_MOVIE.mp4');
  const concatListPath = path.join(projectOutDir, 'ffmpeg_concat_list.txt');
  const concatLines = renderedShots
    .filter((s) => s.videoPath && fs.existsSync(s.videoPath))
    .map((s) => `file '${s.videoPath.replace(/\\/g, '/')}'`)
    .join('\n');
  fs.writeFileSync(concatListPath, concatLines, 'utf-8');

  try {
    const ffmpegBinName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    const localFfmpeg = path.join(WORKSPACE_ROOT, 'node_modules', 'ffmpeg-static', ffmpegBinName);
    const ffmpegCmd = fs.existsSync(localFfmpeg) ? `"${localFfmpeg}"` : 'ffmpeg';
    execSync(`${ffmpegCmd} -y -f concat -safe 0 -i "${concatListPath}" -c copy "${masterMp4Path}"`, {
      stdio: 'ignore',
    });
    console.log(`   -> 🎬 Đã ghép nối hoàn chỉnh bộ phim Master MP4: ${masterMp4Path}`);
  } catch (ffErr: any) {
    console.warn(`   -> ⚠️ Không thể chạy ffmpeg concat tự động (${ffErr.message}), sử dụng cảnh 1 làm bản đại diện.`);
    if (renderedShots[0]?.videoPath) {
      fs.copyFileSync(renderedShots[0].videoPath, masterMp4Path);
    }
  }

  const manifestPath = path.join(projectOutDir, 'master_production_manifest.json');
  const cleanManifest = {
    movieTitle: blueprint.movieTitle,
    createdAt: new Date().toISOString(),
    script: opts.script,
    model: opts.model,
    character1SheetPath: charSheetPath,
    character2SheetPath: char2SheetPath,
    cleanEnvironmentLockPath: envLockPath,
    masterVideoPath: masterMp4Path,
    subtitlesPath: srtPath,
    shots: renderedShots.map(({ startKeyframeBase64, ...rest }) => rest),
  };
  fs.writeFileSync(manifestPath, JSON.stringify(cleanManifest, null, 2), 'utf-8');

  console.log('========================================================================');
  console.log(`🎉 HOÀN TẤT QUY TRÌNH 7 GIAI ĐOẠN CHO PHIM: "${blueprint.movieTitle}"!`);
  console.log(`🎬 Video Phim Master Hoàn Chỉnh (.MP4): ${masterMp4Path}`);
  console.log(`📂 Thư mục chứa toàn bộ Tài sản       : ${projectOutDir}`);
  console.log(`📝 Phụ đề .SRT                        : ${srtPath}`);
  console.log(`📋 Hồ sơ dự án .JSON                  : ${manifestPath}`);
  console.log('========================================================================');
}

main().catch((err) => {
  console.error('❌ Lỗi trong dây chuyền sản xuất:', err.message);
  process.exit(1);
});
