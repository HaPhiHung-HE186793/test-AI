import {
  TimelineShot,
  EntityDnaProfile,
  EnvironmentStage,
  AspectRatio,
  TargetDurationPreset,
  PacingStyle,
  VideoEngineModel,
  CameraTransitionType,
} from '../types/cinemaCore';
import { buildAutoBoundReferenceSlots } from './autoBindIngredients';

declare const Flow: any;

export interface ScriptDeconstructResult {
  shots: TimelineShot[];
  detectedEntities: EntityDnaProfile[];
  detectedStages: EnvironmentStage[];
}

/**
 * Trích xuất JSON Object an toàn từ phản hồi của LLM (chống lỗi khi Omni 1.1 Flash
 * thêm lời dẫn hoặc markdown fences xung quanh khối JSON).
 */
export function extractJsonObject<T = any>(rawText: string): T {
  const trimmed = (rawText || '').trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Không tìm thấy cấu trúc JSON hợp lệ từ AI Director.');
  }

  const jsonSlice = candidate.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonSlice) as T;
  } catch {
    // Khử dấu phẩy thừa cuối mảng/object nếu LLM sinh lỗi cú pháp nhẹ
    const sanitized = jsonSlice.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(sanitized) as T;
  }
}

function resolveDefaultShotDuration(
  videoEngine: VideoEngineModel,
  pacingStyle: PacingStyle
): number {
  if (videoEngine === 'Omni 1.1 Flash') {
    return pacingStyle === 'FAST_ACTION_CUT' ? 4 : 5;
  }
  // Veo 3.1 (Lite / Fast / Quality) hỗ trợ chuẩn 8s chất lượng điện ảnh
  return pacingStyle === 'FAST_ACTION_CUT' ? 4 : 8;
}

export async function deconstructActionScript(
  rawPlot: string,
  entities: EntityDnaProfile[],
  stages: EnvironmentStage[],
  aspectRatio: AspectRatio,
  durationPreset: TargetDurationPreset = '30S',
  pacingStyle: PacingStyle = 'FAST_ACTION_CUT',
  videoEngine: VideoEngineModel = 'Veo 3.1 - Fast'
): Promise<ScriptDeconstructResult> {
  const defaultClipDuration = resolveDefaultShotDuration(videoEngine, pacingStyle);
  // Quy tắc Vàng #3 (Google Flow Cinema SOP [03:43 - 04:56]): Luôn lập kế hoạch tối thiểu 6 khung hình Storyboard riêng biệt
  const shotCount =
    durationPreset === '15S' ? 6 : durationPreset === '30S' ? 6 : 8;

  const systemInstruction = `Bạn là Tổng Đạo Diễn Điện Ảnh AI chuẩn Công nghiệp Phim AI Quốc tế (Seedance / Kling Director / Google Flow Ultra).
Nhiệm vụ: Phân tích kịch bản của người dùng theo đúng 6 QUY TẮC VÀNG GOOGLE FLOW CINEMA:
1. THIẾT LẬP NHÂN VẬT NHẤT QUÁN (3-Panel Neutral Gray Reference Sheet [01:54 - 02:45]):
   - Tự động trích xuất Hồ sơ Nhân vật chính (Character/Mecha/Creature DNA) với 3 trạng thái (NORMAL, DAMAGED_50, OVERDRIVE_100).
   - Mô tả coreTraits cho bảng tham chiếu 3 góc độ (cận cảnh mặt, toàn thân trước, toàn thân sau 3/4) trên nền xám phẳng trung tính (#808080), không đổ bóng gắt.
2. KHÓA MÔI TRƯỜNG (Clean Environment Lock - ZERO PEOPLE [03:06 - 03:42]):
   - Trích xuất Bối cảnh (detectedStage) với quy tắc BẮT BUỘC: Bối cảnh trống hoàn toàn, TUYỆT ĐỐI KHÔNG CÓ NGƯỜI ("STRICTLY EMPTY ENVIRONMENT, zero people, no humans, no characters") để tránh xung đột nhân dạng với nhân vật chính.
3. LÊN KỊCH BẢN PHÂN CẢNH 6 KHUNG HÌNH ĐỘ PHÂN GIẢI ĐẦY ĐỦ (6-Frame Full-Resolution Storyboard [03:43 - 04:56]):
   - Chia kịch bản thành đúng ${shotCount} cảnh quay (Shots) riêng biệt. Mỗi Shot đóng vai trò là 1 "Start Frame" có chủ đích.
   - BẮT BUỘC gắn thẻ tên nhân vật "[CHARACTER: <Tên Nhân Vật>]" và "[ENVIRONMENT LOCK: <Tên Bối Cảnh>]" ở đầu mỗi visualPrompt để mô hình khóa chặt khuôn mặt và không gian.
4. KIỂM SOÁT ĐIỂM ĐẦU & ĐIỂM CUỐI (First Frame + Last Frame Interpolation [08:17 - 10:05]):
   - Shot 1 luôn dùng "HARD_CUT_NEW_ANGLE".
   - Các Shot nối tiếp chuyển động liền mạch dùng "CONTINUOUS_MATCH_FRAME".
   - Các Shot có chuyển động phức tạp cần kiểm soát chính xác điểm đầu và điểm cuối dùng "A_TO_B_BRIDGE" và bắt buộc điền "endKeyframePrompt" (Last Frame).
5. Đánh dấu "isDnaStateShift": true ở ngay Shot đầu tiên mà nhân vật chuyển trạng thái (từ NORMAL sang DAMAGED_50 hoặc OVERDRIVE_100) để khóa Mỏ neo Ký ức Thị giác CANVAS.

BẮT BUỘC TRẢ VỀ DUY NHẤT 1 JSON OBJECT HỢP LỆ THEO ĐÚNG CẤU TRÚC SAU (KHÔNG THÊM VĂN BẢN NGOÀI JSON):
{
  "detectedEntity": {
    "name": "Tên nhân vật / chiến thần / chủ thể chính",
    "role": "PROTAGONIST",
    "coreTraits": "Mô tả chi tiết ngoại hình, giáp trụ/trang phục, chất liệu bề mặt, màu sắc nhận diện bằng tiếng Anh chuẩn điện ảnh (Character Sheet reference, 8k photorealistic)",
    "damagedTraits": "Mô tả trạng thái bị thương / rách giáp / khói lửa bốc lên (DAMAGED_50) bằng tiếng Anh",
    "overdriveTraits": "Mô tả trạng thái bộc phát năng lượng / thức tỉnh tối đa (OVERDRIVE_100) bằng tiếng Anh",
    "signatureWeapon": "Tên vũ khí hoặc đạo cụ đặc trưng"
  },
  "secondaryEntity": {
    "name": "Tên đối thủ / quái vật / nhân vật phụ (nếu có, nếu không có thì để chuỗi rỗng)",
    "role": "ANTAGONIST",
    "coreTraits": "Mô tả ngoại hình đối thủ bằng tiếng Anh"
  },
  "detectedStage": {
    "name": "Tên bối cảnh / địa điểm diễn ra cảnh quay",
    "lightingMood": "Mô tả ánh sáng, màu sắc khí quyển bằng tiếng Anh",
    "weatherCondition": "Điều kiện thời tiết, hạt bụi/mưa/sương mù bằng tiếng Anh",
    "architectureStyle": "Mô tả kiến trúc, địa hình không gian rộng bằng tiếng Anh (Wide establishing environment)"
  },
  "shots": [
    {
      "title": "Tiêu đề ngắn gọn của Shot (Tiếng Việt)",
      "Beat": "OPENING | INCITING_ACTION | CLASH_ESCALATION | CLIMAX_IMPACT | AFTERMATH",
      "cameraAngle": "Góc máy & chuyển động (VD: Low-Angle Heroic Tracking / Whip-Pan Close-Up / 360 Orbit)",
      "transitionType": "HARD_CUT_NEW_ANGLE | CONTINUOUS_MATCH_FRAME | A_TO_B_BRIDGE",
      "entityState": "NORMAL | DAMAGED_50 | OVERDRIVE_100",
      "isDnaStateShift": false,
      "visualPrompt": "Prompt tạo ảnh Keyframe đầu bằng tiếng Anh (kết hợp Tầng 1 Subject DNA + Tầng 3 Lighting & Environment, bố cục rõ nét, không nhòe)",
      "endKeyframePrompt": "Prompt tạo ảnh Keyframe đích bằng tiếng Anh (chỉ cần khi transitionType là A_TO_B_BRIDGE)",
      "motionPrompt": "Prompt chuyển động Video bằng tiếng Anh (Tầng 2 Kinematic Camera + Vật lý va chạm chân thực, tốc độ khung hình ổn định, không biến dạng chi tiết)",
      "dialogueLine": "Câu thoại hoặc hiệu ứng âm thanh điểm nhấn của cảnh (Tiếng Việt)",
      "sfxCue": "Mô tả âm thanh SFX & nhạc nền cho cảnh"
    }
  ]
}`;

  try {
    if (typeof Flow !== 'undefined' && Flow.generate?.text) {
      const response = await Flow.generate.text({
        prompt: `Kịch bản gốc từ Đạo diễn: "${rawPlot.slice(0, 2800)}"\nTỷ lệ khung hình: ${aspectRatio}. Nhịp dựng: ${pacingStyle}. Hãy phân tích và xuất JSON chuẩn.`,
        systemInstruction,
        thinkingLevel: 'low',
      });

      const parsed = extractJsonObject<any>(response.text);

      // 1. Tạo danh sách Thực thể (Nhân vật chính + Đối thủ nếu có)
      const dynEntities: EntityDnaProfile[] = [];
      if (parsed.detectedEntity && parsed.detectedEntity.name) {
        const de = parsed.detectedEntity;
        dynEntities.push({
          id: `ent_${Date.now()}_1`,
          name: de.name,
          role: 'PROTAGONIST',
          coreTraitsPrompt:
            de.coreTraits ||
            `${de.name}, cinematic protagonist, ultra-detailed textures, 8k concept art`,
          signatureWeapon: de.signatureWeapon || 'Signature Gear',
          states: {
            NORMAL: {
              stateName: 'NORMAL',
              description: 'Trạng thái Nguyên bản (100% Giáp / Trang phục)',
              promptModifier:
                de.coreTraits ||
                `${de.name}, pristine condition, sharp cinematic lighting`,
            },
            DAMAGED_50: {
              stateName: 'DAMAGED_50',
              description: 'Trạng thái Chiến损 / Hư hại 50% (CANVAS Shift)',
              promptModifier:
                de.damagedTraits ||
                `${de.coreTraits || de.name}, battle-damaged, scorch marks, sparks and smoke, intense grit`,
            },
            OVERDRIVE_100: {
              stateName: 'OVERDRIVE_100',
              description: 'Trạng thái Bộc phát Năng lượng Tối đa (Overdrive)',
              promptModifier:
                de.overdriveTraits ||
                `${de.coreTraits || de.name}, overdrive mode, glowing energy conduits, volumetric aura`,
            },
          },
          activeState: 'NORMAL',
        });
      }

      if (
        parsed.secondaryEntity &&
        typeof parsed.secondaryEntity.name === 'string' &&
        parsed.secondaryEntity.name.trim() !== ''
      ) {
        const se = parsed.secondaryEntity;
        dynEntities.push({
          id: `ent_${Date.now()}_2`,
          name: se.name,
          role: 'ANTAGONIST',
          coreTraitsPrompt:
            se.coreTraits ||
            `${se.name}, imposing antagonist, intricate details, cinematic lighting`,
          signatureWeapon: 'Heavy Strike',
          states: {
            NORMAL: {
              stateName: 'NORMAL',
              description: 'Trạng thái Nguyên bản',
              promptModifier: se.coreTraits || `${se.name}, menacing stance`,
            },
            DAMAGED_50: {
              stateName: 'DAMAGED_50',
              description: 'Trạng thái Bị thương',
              promptModifier: `${se.coreTraits || se.name}, battle scarred, smoke and sparks`,
            },
            OVERDRIVE_100: {
              stateName: 'OVERDRIVE_100',
              description: 'Trạng thái Cuồng nộ',
              promptModifier: `${se.coreTraits || se.name}, berserk energy surge, glowing eyes`,
            },
          },
          activeState: 'NORMAL',
        });
      }

      const finalEntities = dynEntities.length > 0 ? dynEntities : entities;

      // 2. Tạo Bối cảnh (Environment Stage - Clean Environment Lock: ZERO PEOPLE [03:06 - 03:42]) từ Kịch bản
      let finalStages = stages;
      if (parsed.detectedStage && parsed.detectedStage.name) {
        const ds = parsed.detectedStage;
        const baseArch =
          ds.architectureStyle ||
          `${ds.name}, wide cinematic environment, photorealistic 8k`;
        finalStages = [
          {
            id: `stage_${Date.now()}`,
            name: ds.name,
            lightingMood: ds.lightingMood || 'High-contrast cinematic lighting',
            weatherCondition: ds.weatherCondition || 'Atmospheric volumetric fog',
            architectureStyle: `${baseArch}. STRICTLY EMPTY ENVIRONMENT: zero people, no humans, no characters, architectural and atmospheric background lock only`,
            spatialViews: {},
          },
        ];
      }

      // 3. Xây dựng chuỗi Shots (6-Frame Storyboard [03:43 - 04:56]) với kiểm tra chuyển trạng thái DNA (CANVAS Shift)
      const rawShots: any[] = Array.isArray(parsed.shots) ? parsed.shots : [];
      if (rawShots.length === 0) {
        throw new Error('Mảng shots từ AI Director rỗng.');
      }

      let previousState: 'NORMAL' | 'DAMAGED_50' | 'OVERDRIVE_100' = 'NORMAL';
      const generatedShots: TimelineShot[] = rawShots.map((item: any, idx: number) => {
        const entityState: 'NORMAL' | 'DAMAGED_50' | 'OVERDRIVE_100' =
          item.entityState === 'DAMAGED_50' || item.entityState === 'OVERDRIVE_100'
            ? item.entityState
            : 'NORMAL';

        const stateChanged = idx > 0 && entityState !== previousState;
        const isDnaStateShift = Boolean(item.isDnaStateShift || stateChanged);
        previousState = entityState;

        let transitionType: CameraTransitionType =
          item.transitionType === 'CONTINUOUS_MATCH_FRAME' ||
          item.transitionType === 'A_TO_B_BRIDGE' ||
          item.transitionType === 'HARD_CUT_NEW_ANGLE'
            ? item.transitionType
            : idx === 0
            ? 'HARD_CUT_NEW_ANGLE'
            : 'CONTINUOUS_MATCH_FRAME';

        if (idx === 0) {
          transitionType = 'HARD_CUT_NEW_ANGLE';
        }

        const primaryCharName = finalEntities[0]?.name || 'Protagonist';
        const stageLockName = finalStages[0]?.name || 'Locked Stage';
        const rawVisualPrompt =
          item.visualPrompt ||
          `${finalEntities[0]?.coreTraitsPrompt || 'Cinematic hero'} in ${stageLockName}, dramatic lighting, 8k`;
        const taggedVisualPrompt = rawVisualPrompt.includes('[CHARACTER:')
          ? rawVisualPrompt
          : `[CHARACTER: ${primaryCharName}] [ENVIRONMENT LOCK: ${stageLockName}] ${rawVisualPrompt}`;

        const textForCheck = `${rawVisualPrompt} ${item.title || ''}`.toUpperCase();
        const matchedEntities = finalEntities.filter((e) =>
          textForCheck.includes((e.name || '').toUpperCase())
        );
        const shotParticipantIds =
          matchedEntities.length > 0
            ? matchedEntities.map((e) => e.id)
            : finalEntities.map((e) => e.id);

        const shot: TimelineShot = {
          id: `shot_${Date.now()}_${idx + 1}`,
          order: idx + 1,
          title: item.title || `Cảnh ${idx + 1}`,
          narrativeBeat: item.Beat || 'CLASH_ESCALATION',
          actionDescription: taggedVisualPrompt,
          endKeyframePrompt:
            transitionType === 'A_TO_B_BRIDGE'
              ? item.endKeyframePrompt ||
                `[CHARACTER: ${primaryCharName}] [ENVIRONMENT LOCK: ${stageLockName}] ${rawVisualPrompt}, final impact pose, settled dust, dramatic framing`
              : undefined,
          cameraAngle: item.cameraAngle || 'Dynamic Tracking Shot',
          transitionType,
          targetDurationSeconds: defaultClipDuration,
          trimmedDurationSeconds: defaultClipDuration,
          aspectRatio,
          videoEngine,
          participatingEntityIds: shotParticipantIds,
          entityStateUsed: entityState,
          stageId: finalStages[0]?.id || 'stage_default',
          isDnaStateShift,
          referenceSlots: [],
          motionTrajectories: [
            {
              id: `traj_${idx + 1}`,
              label: item.cameraAngle || 'Camera Vector',
              startX: 20,
              startY: 60,
              endX: 80,
              endY: 40,
              motionPrompt:
                item.motionPrompt ||
                'Smooth cinematic camera movement, realistic physics inertia, zero morphing',
            },
          ],
          audioStems: {
            dialogueText: item.dialogueLine || '',
            dialogueVoiceProfile: 'Deep Cinematic Narrator',
            sfxPrompt:
              item.sfxCue || 'Cinematic impact, atmospheric wind, deep bass',
            bgmMood: `${finalStages[0]?.lightingMood || 'Epic'} Orchestral Hybrid`,
            duckingEnabled: true,
          },
          status: 'draft',
        };

        shot.referenceSlots = buildAutoBoundReferenceSlots(
          shot,
          finalEntities,
          finalStages[0]
        );
        return shot;
      });

      return {
        shots: generatedShots,
        detectedEntities: finalEntities,
        detectedStages: finalStages,
      };
    }
  } catch (err) {
    console.warn(
      'AI Script Deconstruct fallback activated (sử dụng kịch bản gốc của người dùng):',
      err
    );
  }

  // Fallback thông minh chuẩn 6 Khung hình Storyboard (6-Frame Storyboard SOP [03:43 - 04:56])
  const cleanText = rawPlot.trim() || 'Cảnh hành động điện ảnh kịch tính';
  const sentences = cleanText
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const fallbackEntity: EntityDnaProfile = {
    id: `ent_${Date.now()}_1`,
    name: sentences[0]?.slice(0, 28) || 'Nhân vật Chính',
    role: 'PROTAGONIST',
    coreTraitsPrompt: `${cleanText.slice(0, 220)}, 3-panel multi-angle character reference sheet (close-up face, front full-body, 3/4 back full-body) on flat neutral gray background (#808080, zero shadows), 8k photorealistic concept art`,
    signatureWeapon: 'Signature Gear',
    states: {
      NORMAL: {
        stateName: 'NORMAL',
        description: 'Trạng thái Nguyên bản (3-Panel Neutral Gray Reference)',
        promptModifier: `${cleanText.slice(0, 180)}, pristine condition, sharp focus`,
      },
      DAMAGED_50: {
        stateName: 'DAMAGED_50',
        description: 'Trạng thái Cao trào / Biến đổi (CANVAS Shift)',
        promptModifier: `${cleanText.slice(0, 180)}, intense battle wear, smoke and sparks, dramatic rim light`,
      },
      OVERDRIVE_100: {
        stateName: 'OVERDRIVE_100',
        description: 'Trạng thái Bộc phát Đỉnh điểm',
        promptModifier: `${cleanText.slice(0, 180)}, maximum energy aura, volumetric lighting`,
      },
    },
    activeState: 'NORMAL',
  };

  const fallbackStage: EnvironmentStage = {
    id: `stage_${Date.now()}`,
    name: 'Bối cảnh Khóa Môi Trường (Clean Environment Lock)',
    lightingMood: 'High-contrast dramatic anamorphic lighting',
    weatherCondition: 'Volumetric atmospheric particles',
    architectureStyle: `Wide establishing environment for: ${cleanText.slice(0, 200)}, STRICTLY EMPTY ENVIRONMENT: zero people, no humans, no characters, photorealistic 8k`,
    spatialViews: {},
  };

  const beatNames: TimelineShot['narrativeBeat'][] = [
    'OPENING',
    'INCITING_ACTION',
    'CLASH_ESCALATION',
    'CLASH_ESCALATION',
    'CLIMAX_IMPACT',
    'AFTERMATH',
  ];

  const cameraAngles = [
    'Wide Establishing Push-In (Start Frame #1)',
    'Low-Angle Dynamic Tracking (Start Frame #2)',
    'Medium Heroic Action Cut (Start Frame #3)',
    'Whip-Pan Close-Up Impact (Start Frame #4)',
    'First-to-Last Frame Interpolation (Start Frame #5)',
    'Heroic 360 Orbit Finale (Start Frame #6)',
  ];

  const fallbackShots: TimelineShot[] = Array.from({ length: shotCount }).map((_, idx) => {
    const segmentText =
      sentences[idx % Math.max(sentences.length, 1)] || cleanText;
    const isShift = idx === 2 || idx === 4;
    const stateUsed: 'NORMAL' | 'DAMAGED_50' | 'OVERDRIVE_100' =
      idx < 2 ? 'NORMAL' : idx < 4 ? 'DAMAGED_50' : 'OVERDRIVE_100';
    const transitionType: CameraTransitionType =
      idx === 0
        ? 'HARD_CUT_NEW_ANGLE'
        : idx === 4
        ? 'A_TO_B_BRIDGE'
        : 'CONTINUOUS_MATCH_FRAME';

    const shot: TimelineShot = {
      id: `shot_${Date.now()}_${idx + 1}`,
      order: idx + 1,
      title: `Cảnh ${idx + 1}: ${segmentText.slice(0, 32)}`,
      narrativeBeat: beatNames[idx] || 'CLIMAX_IMPACT',
      actionDescription: `[CHARACTER: ${fallbackEntity.name}] [ENVIRONMENT LOCK: ${fallbackStage.name}] ${segmentText}. ${fallbackEntity.states[stateUsed].promptModifier}, set in ${fallbackStage.architectureStyle}, full-resolution single-frame cinematic shot, 8k`,
      endKeyframePrompt:
        transitionType === 'A_TO_B_BRIDGE'
          ? `[CHARACTER: ${fallbackEntity.name}] [ENVIRONMENT LOCK: ${fallbackStage.name}] ${segmentText}, final iconic hero landing pose, settled sparks, dramatic lighting, 8k`
          : undefined,
      cameraAngle: cameraAngles[idx] || 'Dynamic Tracking Shot',
      transitionType,
      targetDurationSeconds: defaultClipDuration,
      trimmedDurationSeconds: defaultClipDuration,
      aspectRatio,
      videoEngine,
      participatingEntityIds: [fallbackEntity.id],
      entityStateUsed: stateUsed,
      stageId: fallbackStage.id,
      isDnaStateShift: isShift,
      referenceSlots: [],
      motionTrajectories: [
        {
          id: `traj_fb_${idx + 1}`,
          label: 'Cinematic Camera Vector',
          startX: 20,
          startY: 55,
          endX: 80,
          endY: 45,
          motionPrompt: `${segmentText}, fluid camera motion, realistic physical inertia, stable identity`,
        },
      ],
      audioStems: {
        dialogueText: segmentText,
        dialogueVoiceProfile: 'Cinematic Narrator',
        sfxPrompt: 'Cinematic whoosh, deep impact, atmospheric ambience',
        bgmMood: 'Epic Hybrid Orchestral',
        duckingEnabled: true,
      },
      status: 'draft',
    };

    shot.referenceSlots = buildAutoBoundReferenceSlots(
      shot,
      [fallbackEntity],
      fallbackStage
    );
    return shot;
  });

  return {
    shots: fallbackShots,
    detectedEntities: [fallbackEntity],
    detectedStages: [fallbackStage],
  };
}
