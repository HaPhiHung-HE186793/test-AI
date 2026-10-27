import { Flow } from 'flow-sdk';
import { TimelineShot, VideoTake, CameraTransitionType, EpisodeContinuityPack } from '../types/cinemaCore';

export interface ShotAudioTrackSettings {
  foleyMuted: boolean;
  foleyVolume: number; // 0 - 100
  voiceoverAudioBase64?: string;
  voiceoverMimeType?: string;
  voiceoverName?: string;
  voiceoverVolume: number; // 0 - 100
  autoDucking: boolean; // Hạ BGM 40% khi có tiếng thoại
  customCutInOffset?: number; // Cắt đầu (giây), mặc định tự tính
  customCutOutOffset?: number; // Cắt cuối (giây), mặc định tự tính
}

export interface MasterAudioMixerSettings {
  bgmAudioBase64?: string;
  bgmMimeType?: string;
  bgmName?: string;
  bgmVolume: number; // 0 - 100
  bgmFadeInSeconds: number; // e.g. 1.5s
  bgmFadeOutSeconds: number; // e.g. 2.5s
  shotAudioSettings: Record<string, ShotAudioTrackSettings>;
}

export interface TrimmedSequenceSegment {
  shotId: string;
  shotNumber: number;
  sceneHeading: string;
  takeId: string;
  videoUrl: string;
  mediaId?: string;
  rawDuration: number;
  effectiveDuration: number;
  trimStartSeconds: number;
  trimEndSeconds: number;
  transitionType: CameraTransitionType;
  foleyVolume: number;
  foleyMuted: boolean;
  hasVoiceover: boolean;
  voiceoverVolume: number;
  autoDucking: boolean;
}

/**
 * 1. Thuật Toán Khử Khựng Điểm Nối Thích Ứng (Adaptive Micro-Trimming)
 * - CONTINUOUS_MATCH_FRAME: Tự động cắt 0.12s ở cuối Shot trước và 0.08s ở đầu Shot sau để khử sạch freeze-frame artifact.
 * - HARD_CUT_NEW_ANGLE: Giữ 100% thời lượng hoặc cho phép tùy chỉnh (0.0s - 0.2s) để nhịp cắt sắc dứt khoát.
 * - A_TO_B_BRIDGE: Cắt nhẹ 0.05s ở hai đầu để làm mượt chuyển pha nội suy.
 */
export function computeAdaptiveSequence(
  shots: TimelineShot[],
  audioSettings: MasterAudioMixerSettings
): TrimmedSequenceSegment[] {
  // Lọc chỉ các shot có Active Take (được chọn cho Master)
  const activeShots = shots
    .map((shot) => {
      const activeTake = shot.takes.find((t) => t.isSelectedForMaster) || shot.takes[0];
      return { shot, activeTake };
    })
    .filter((item): item is { shot: TimelineShot; activeTake: VideoTake } => Boolean(item.activeTake));

  const total = activeShots.length;

  return activeShots.map((item, index) => {
    const { shot, activeTake } = item;
    const shotAudio = audioSettings.shotAudioSettings[shot.id] || {
      foleyMuted: false,
      foleyVolume: 100,
      voiceoverVolume: 100,
      autoDucking: true,
      customCutInOffset: 0,
      customCutOutOffset: 0,
    };

    let trimStart = 0;
    let trimEnd = 0;

    // Phân tích chuyển cảnh thích ứng
    if (shot.cameraTransitionType === 'CONTINUOUS_MATCH_FRAME') {
      // Đầu shot này cắt 0.08s để loại bỏ artifact tĩnh
      trimStart = 0.08;
      // Nếu shot tiếp theo cũng nối mượt thì đuôi shot này cắt 0.12s
      const nextShot = activeShots[index + 1]?.shot;
      if (nextShot && nextShot.cameraTransitionType === 'CONTINUOUS_MATCH_FRAME') {
        trimEnd = 0.12;
      }
    } else if (shot.cameraTransitionType === 'A_TO_B_BRIDGE') {
      trimStart = 0.05;
      trimEnd = 0.05;
    } else {
      // HARD_CUT_NEW_ANGLE: Nhịp cắt sắc dứt khoát, dùng offset tùy chỉnh nếu có
      trimStart = shotAudio.customCutInOffset || 0;
      trimEnd = shotAudio.customCutOutOffset || 0;
    }

    // Đảm bảo không cắt lẹm quá thời lượng take
    const rawDur = activeTake.duration || shot.targetDurationSeconds || 4;
    const clampedTrimStart = Math.min(trimStart, rawDur * 0.2);
    const clampedTrimEnd = Math.min(trimEnd, rawDur * 0.2);
    const effectiveDur = Math.max(0.5, rawDur - clampedTrimStart - clampedTrimEnd);

    return {
      shotId: shot.id,
      shotNumber: shot.shotNumber,
      sceneHeading: shot.sceneHeading,
      takeId: activeTake.takeId,
      videoUrl: activeTake.videoUrl,
      mediaId: activeTake.mediaId,
      rawDuration: rawDur,
      effectiveDuration: Number(effectiveDur.toFixed(3)),
      trimStartSeconds: Number(clampedTrimStart.toFixed(3)),
      trimEndSeconds: Number(clampedTrimEnd.toFixed(3)),
      transitionType: shot.cameraTransitionType,
      foleyVolume: shotAudio.foleyVolume,
      foleyMuted: shotAudio.foleyMuted,
      hasVoiceover: Boolean(shotAudio.voiceoverAudioBase64),
      voiceoverVolume: shotAudio.voiceoverVolume,
      autoDucking: shotAudio.autoDucking,
    };
  });
}

/**
 * 2. Xuất gói Continuity Pack sang tập tiếp theo
 */
export async function exportContinuityPackage(
  episodeNumber: number,
  title: string,
  lastShot: TimelineShot,
  damageLevel: number,
  notes: string
): Promise<EpisodeContinuityPack> {
  const pack: EpisodeContinuityPack = {
    episodeNumber,
    episodeTitle: title,
    timestamp: Date.now(),
    finalShotId: lastShot.id,
    finalEntityState: lastShot.entityStateUsed || 'battle_damaged',
    hullDamageLevel: damageLevel,
    spatialPosition: lastShot.sceneHeading,
    cliffhangerSummary: notes,
    directorNotes: 'Gói Continuity Pack sẵn sàng nạp trực tiếp cho Season/Tập kế tiếp để bảo toàn 100% logic trang phục, vũ khí và chấn thương của Mecha.',
  };

  const jsonStr = JSON.stringify(pack, null, 2);
  const bytes = new TextEncoder().encode(jsonStr);
  const base64 = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));

  await Flow.download({
    base64,
    mimeType: 'application/json',
    filename: `hyperion_continuity_ep${episodeNumber}.json`,
  });

  return pack;
}