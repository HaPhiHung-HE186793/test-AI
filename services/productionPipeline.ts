import {
  TimelineShot,
  EntityDnaProfile,
  EnvironmentStage,
  AspectRatio,
} from '../types/cinemaCore';
import { CreditTelemetryService } from './creditTelemetry';

declare const Flow: any;

function clampPrompt(prompt: string, maxChars = 3800): string {
  const cleaned = (prompt || '').trim();
  if (cleaned.length <= maxChars) return cleaned;
  return cleaned.slice(0, maxChars - 3) + '...';
}

export class ProductionPipeline {
  /**
   * Đúc Hồ sơ DNA Nhân vật (Multi-State Character Sheet) & Bối cảnh Chiến trường (Environment Stage)
   * bằng 🍌 Nano Banana Pro.
   */
  static async forgeEntityDnaImage(
    entity: EntityDnaProfile,
    stateKey: 'NORMAL' | 'DAMAGED_50' | 'OVERDRIVE_100' = 'NORMAL',
    aspectRatio: AspectRatio = '16:9',
    baseReferenceMediaId?: string
  ): Promise<{ url: string; mediaId: string }> {
    const stateObj = entity.states[stateKey] || entity.states.NORMAL;
    const prompt = clampPrompt(
      `${aspectRatio} three-panel character reference sheet of [CHARACTER: ${entity.name}] (${stateKey} state) split into 3 views: (1) close-up portrait of face and head details, (2) full-body front view standing straight, (3) full-body three-quarter back view. Details: ${stateObj.promptModifier}. Signature gear: ${entity.signatureWeapon}. Isolated on a flat neutral gray studio background (#808080) with even, shadowless studio lighting, zero cast shadows, identical facial features and proportions across all 3 panels, 8k photorealistic.`
    );

    const refIds: string[] = [];
    if (baseReferenceMediaId && !baseReferenceMediaId.startsWith('mock_')) {
      refIds.push(baseReferenceMediaId);
    }

    const res = await Flow.generate.image({
      prompt,
      modelDisplayName: '🍌 Nano Banana Pro',
      referenceImageMediaIds: refIds.length > 0 ? refIds : undefined,
      aspectRatio,
    });

    CreditTelemetryService.recordTransaction({
      category: 'IMAGE_KEYFRAME',
      modelName: '🍌 Nano Banana Pro',
      creditsUsed: CreditTelemetryService.estimateImageCost(),
      description: `Đúc Bảng DNA 3 Góc Độ (Nền Xám Phẳng): ${entity.name} (${stateKey})`,
    });

    const url = res.base64
      ? `data:${res.mimeType || 'image/jpeg'};base64,${res.base64}`
      : '';
    return { url, mediaId: res.mediaId };
  }

  /**
   * Đúc Ảnh Khóa Môi Trường Sạch (Clean Environment Lock — Tuyệt đối không có người) bằng 🍌 Nano Banana Pro.
   */
  static async forgeStageEnvironmentImage(
    stage: EnvironmentStage,
    aspectRatio: AspectRatio = '16:9'
  ): Promise<{ url: string; mediaId: string }> {
    const prompt = clampPrompt(
      `${aspectRatio} wide establishing environment lock reference of [ENVIRONMENT LOCK: ${stage.name}]: ${stage.architectureStyle}. Lighting: ${stage.lightingMood}. Weather: ${stage.weatherCondition}. STRICTLY EMPTY ENVIRONMENT: zero people, no humans, no characters, no crowds, no silhouettes in the scene. Clean uninhabited architectural and atmospheric space only, 8k photorealistic.`
    );

    const res = await Flow.generate.image({
      prompt,
      modelDisplayName: '🍌 Nano Banana Pro',
      aspectRatio,
    });

    CreditTelemetryService.recordTransaction({
      category: 'IMAGE_KEYFRAME',
      modelName: '🍌 Nano Banana Pro',
      creditsUsed: CreditTelemetryService.estimateImageCost(),
      description: `Khóa Bối cảnh Sạch (Environment Lock): ${stage.name}`,
    });

    const url = res.base64
      ? `data:${res.mimeType || 'image/jpeg'};base64,${res.base64}`
      : '';
    return { url, mediaId: res.mediaId };
  }

  /**
   * Chỉnh sửa Video có sẵn bằng AI (Video-to-Video VFX Edit — thêm tuyết rơi, mưa bão, hiệu ứng)
   * trong khi giữ nguyên chuyển động và bố cục gốc của video.
   */
  static async editExistingVideoWithVfx(
    sourceVideoMediaId: string,
    vfxPrompt: string,
    shotId?: string
  ): Promise<{ videoUrl: string; mediaId: string }> {
    const prompt = clampPrompt(
      `Apply cinematic VFX modification while preserving original camera motion, subject identity, and scene composition: ${vfxPrompt}`
    );

    const res = await Flow.generate.video({
      prompt,
      sourceVideoMediaId,
      sourceVideoMode: 'edit',
      modelDisplayName: 'Omni 1.1 Flash',
    });

    CreditTelemetryService.recordTransaction({
      category: 'VIDEO_RENDER',
      modelName: 'Omni 1.1 Flash',
      creditsUsed: 10,
      shotId,
      description: `Chỉnh sửa Video V2V VFX: ${vfxPrompt.slice(0, 40)}`,
    });

    const videoUrl = res.base64
      ? `data:${res.mimeType || 'video/mp4'};base64,${res.base64}`
      : '';
    return { videoUrl, mediaId: res.mediaId };
  }

  /**
   * Trích xuất Khung hình Cuối (Last Frame) từ Video của Shot N-1 bằng HTML5 Video + Canvas,
   * sau đó upload lên Google Flow qua Flow.upload() để lấy mediaId thực cho CONTINUOUS_MATCH_FRAME.
   */
  static async extractLastFrameToFlowMedia(
    videoDataUrl: string,
    shotOrder: number
  ): Promise<{ url: string; mediaId: string } | null> {
    if (
      typeof document === 'undefined' ||
      !videoDataUrl ||
      !videoDataUrl.startsWith('data:video')
    ) {
      return null;
    }

    try {
      const frameBase64 = await new Promise<string | null>((resolve) => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';

        const timeout = setTimeout(() => {
          resolve(null);
        }, 4500);

        video.onloadedmetadata = () => {
          const targetTime = Math.max(0, (video.duration || 1) - 0.08);
          video.currentTime = targetTime;
        };

        video.onseeked = () => {
          clearTimeout(timeout);
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(null);
              return;
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            resolve(dataUrl);
          } catch {
            resolve(null);
          }
        };

        video.onerror = () => {
          clearTimeout(timeout);
          resolve(null);
        };

        video.src = videoDataUrl;
        video.load();
      });

      if (!frameBase64) return null;

      const rawBase64 = frameBase64.includes(',')
        ? frameBase64.split(',')[1]
        : frameBase64;

      if (typeof Flow !== 'undefined' && Flow.upload) {
        const uploaded = await Flow.upload({
          base64: rawBase64,
          mimeType: 'image/jpeg',
          name: `match_frame_shot_${shotOrder}.jpg`,
        });
        if (uploaded?.mediaId) {
          return { url: frameBase64, mediaId: uploaded.mediaId };
        }
      }
      return null;
    } catch (err) {
      console.warn('Extract last frame fallback:', err);
      return null;
    }
  }

  /**
   * Tổng hợp Master Start Keyframe cho Shot bằng 🍌 Nano Banana Pro,
   * khóa chặt 3 Khe Tham Chiếu [IMAGE 1..3] và Mỏ neo Ký ức CANVAS (nếu có).
   */
  static async synthesizeMasterKeyframe(
    shot: TimelineShot,
    entities: EntityDnaProfile[],
    stage?: EnvironmentStage
  ): Promise<{ url: string; mediaId: string }> {
    const primaryEntity =
      entities.find((e) => shot.participatingEntityIds.includes(e.id)) ||
      entities[0];
    const stateDesc =
      primaryEntity?.states[shot.entityStateUsed]?.promptModifier ||
      primaryEntity?.coreTraitsPrompt ||
      '';

    const refTokens = shot.referenceSlots
      .map((s) => s.promptToken)
      .filter(Boolean)
      .join(' ');

    const compositePrompt = clampPrompt(
      `Master Cinematic Keyframe (${shot.cameraAngle}): ${shot.actionDescription}. ` +
        `Subject DNA (${shot.entityStateUsed}): ${stateDesc}. ` +
        `${
          stage
            ? `Environment: ${stage.architectureStyle}, ${stage.lightingMood}, ${stage.weatherCondition}. `
            : ''
        }` +
        `${refTokens}. Photorealistic 8k movie frame, sharp focus, zero motion blur, consistent character proportions.`
    );

    const refMediaIds = shot.referenceSlots
      .map((s) => s.mediaId)
      .filter((id): id is string => Boolean(id && !id.startsWith('mock_')));

    if (
      shot.canvasMemoryAnchorMediaId &&
      !shot.canvasMemoryAnchorMediaId.startsWith('mock_') &&
      !refMediaIds.includes(shot.canvasMemoryAnchorMediaId)
    ) {
      refMediaIds.unshift(shot.canvasMemoryAnchorMediaId);
    }

    const uniqueRefs = Array.from(new Set(refMediaIds)).slice(0, 3);

    const res = await Flow.generate.image({
      prompt: compositePrompt,
      modelDisplayName: '🍌 Nano Banana Pro',
      referenceImageMediaIds: uniqueRefs.length > 0 ? uniqueRefs : undefined,
      aspectRatio: shot.aspectRatio,
    });

    CreditTelemetryService.recordTransaction({
      category: 'IMAGE_KEYFRAME',
      modelName: '🍌 Nano Banana Pro',
      creditsUsed: CreditTelemetryService.estimateImageCost(),
      shotId: shot.id,
      description: `Tổng hợp Start Keyframe cho ${shot.title}`,
    });

    const url = res.base64
      ? `data:${res.mimeType || 'image/jpeg'};base64,${res.base64}`
      : '';
    return { url, mediaId: res.mediaId };
  }

  /**
   * Tổng hợp End Keyframe cho chế độ Cầu nối Không gian A -> B (A_TO_B_BRIDGE).
   */
  static async synthesizeEndKeyframe(
    shot: TimelineShot,
    entities: EntityDnaProfile[],
    stage?: EnvironmentStage
  ): Promise<{ url: string; mediaId: string }> {
    const primaryEntity =
      entities.find((e) => shot.participatingEntityIds.includes(e.id)) ||
      entities[0];
    const stateDesc =
      primaryEntity?.states[shot.entityStateUsed]?.promptModifier ||
      primaryEntity?.coreTraitsPrompt ||
      '';

    const endPrompt = clampPrompt(
      `Master Cinematic End Keyframe (${shot.cameraAngle} - Final Pose): ${
        shot.endKeyframePrompt || shot.actionDescription
      }. Subject DNA (${shot.entityStateUsed}): ${stateDesc}. ${
        stage
          ? `Environment: ${stage.architectureStyle}, ${stage.lightingMood}. `
          : ''
      }Photorealistic 8k movie frame, consistent identity with start frame.`
    );

    const refMediaIds: string[] = [];
    if (
      shot.startKeyframeMediaId &&
      !shot.startKeyframeMediaId.startsWith('mock_')
    ) {
      refMediaIds.push(shot.startKeyframeMediaId);
    }
    shot.referenceSlots.forEach((s) => {
      if (
        s.mediaId &&
        !s.mediaId.startsWith('mock_') &&
        !refMediaIds.includes(s.mediaId)
      ) {
        refMediaIds.push(s.mediaId);
      }
    });

    const res = await Flow.generate.image({
      prompt: endPrompt,
      modelDisplayName: '🍌 Nano Banana Pro',
      referenceImageMediaIds:
        refMediaIds.length > 0 ? refMediaIds.slice(0, 3) : undefined,
      aspectRatio: shot.aspectRatio,
    });

    CreditTelemetryService.recordTransaction({
      category: 'IMAGE_KEYFRAME',
      modelName: '🍌 Nano Banana Pro',
      creditsUsed: CreditTelemetryService.estimateImageCost(),
      shotId: shot.id,
      description: `Tổng hợp End Keyframe (A->B Bridge) cho ${shot.title}`,
    });

    const url = res.base64
      ? `data:${res.mimeType || 'image/jpeg'};base64,${res.base64}`
      : '';
    return { url, mediaId: res.mediaId };
  }

  /**
   * Render Video Take với cơ chế khóa Ký ức Thị giác, Match-Frame và Cầu nối A->B.
   */
  static async renderShotVideoTake(
    shot: TimelineShot,
    previousShot?: TimelineShot
  ): Promise<{ videoUrl: string; mediaId: string }> {
    const motionVectors = shot.motionTrajectories
      .map((m) => `[${m.label}: ${m.motionPrompt}]`)
      .join(' ');

    const fullVideoPrompt = clampPrompt(
      `Cinematic Action Shot (${shot.cameraAngle}, Transition: ${shot.transitionType}): ${shot.actionDescription}. ` +
        `Kinematic Camera & Physics: ${motionVectors}. ` +
        `Maintain strict anatomical & mechanical structure, realistic weight and inertia, smooth temporal coherence, 24fps film look.`
    );

    // Xác định First Frame (ưu tiên Match-Frame từ Shot N-1 nếu là CONTINUOUS_MATCH_FRAME)
    let firstFrameId = shot.startKeyframeMediaId;
    if (
      shot.transitionType === 'CONTINUOUS_MATCH_FRAME' &&
      previousShot &&
      !firstFrameId
    ) {
      firstFrameId =
        previousShot.endKeyframeMediaId || previousShot.startKeyframeMediaId;
    }

    const lastFrameId = shot.endKeyframeMediaId || undefined;

    const refMediaIds = shot.referenceSlots
      .map((s) => s.mediaId)
      .filter((id): id is string => Boolean(id && !id.startsWith('mock_')));

    if (
      shot.canvasMemoryAnchorMediaId &&
      !shot.canvasMemoryAnchorMediaId.startsWith('mock_') &&
      !refMediaIds.includes(shot.canvasMemoryAnchorMediaId)
    ) {
      refMediaIds.unshift(shot.canvasMemoryAnchorMediaId);
    }

    const videoOptions: Record<string, any> = {
      prompt: fullVideoPrompt,
      modelDisplayName: shot.videoEngine,
      aspectRatio: shot.aspectRatio,
    };

    const validFirstFrame =
      firstFrameId && !firstFrameId.startsWith('mock_')
        ? firstFrameId
        : undefined;
    const validLastFrame =
      lastFrameId && !lastFrameId.startsWith('mock_') ? lastFrameId : undefined;

    if (shot.videoEngine === 'Omni 1.1 Flash') {
      if (validFirstFrame && validLastFrame) {
        videoOptions.firstFrameImageMediaId = validFirstFrame;
        videoOptions.lastFrameImageMediaId = validLastFrame;
      } else {
        const omniRefs = [...refMediaIds];
        if (validFirstFrame && !omniRefs.includes(validFirstFrame)) {
          omniRefs.unshift(validFirstFrame);
        }
        if (omniRefs.length > 0) {
          videoOptions.referenceImageMediaIds = omniRefs.slice(0, 3);
        }
      }
    } else {
      // Dòng Veo 3.1 (Lite / Fast / Quality) ưu tiên First-Frame / Last-Frame Bridge
      if (validFirstFrame) {
        videoOptions.firstFrameImageMediaId = validFirstFrame;
      }
      if (validLastFrame) {
        videoOptions.lastFrameImageMediaId = validLastFrame;
      }
      if (!validFirstFrame && refMediaIds.length > 0) {
        videoOptions.referenceImageMediaIds = refMediaIds.slice(0, 3);
      }
    }

    let res: any;
    try {
      res = await Flow.generate.video(videoOptions);
    } catch (videoErr) {
      // Fallback an toàn cho chế độ Interpolation (First + Last Frame) trên Veo 3.1 khi yêu cầu khóa 8s
      if (validFirstFrame && validLastFrame) {
        res = await Flow.generate.video({
          ...videoOptions,
          durationSeconds: 8,
        });
      } else {
        throw videoErr;
      }
    }

    const cost = CreditTelemetryService.estimateVideoCost(
      shot.videoEngine,
      shot.targetDurationSeconds
    );
    CreditTelemetryService.recordTransaction({
      category: 'VIDEO_RENDER',
      modelName: shot.videoEngine,
      creditsUsed: cost,
      shotId: shot.id,
      description: `Render Video (${shot.videoEngine}) cho ${shot.title}`,
    });

    const videoUrl = res.base64
      ? `data:${res.mimeType || 'video/mp4'};base64,${res.base64}`
      : '';
    return { videoUrl, mediaId: res.mediaId };
  }
}
