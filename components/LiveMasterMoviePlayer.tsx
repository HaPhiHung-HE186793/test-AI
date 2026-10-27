import React, { useState, useRef, useEffect } from 'react';
import {
  TimelineShot,
  AutoProductionJob,
  AspectRatio,
} from '../types/cinemaCore';
import { computeAdaptiveSequence } from '../services/timelineComposer';

declare const Flow: any;

interface LiveMasterMoviePlayerProps {
  shots: TimelineShot[];
  activeShotId: string | null;
  onSelectShot: (id: string) => void;
  productionJob: AutoProductionJob;
  aspectRatio: AspectRatio;
}

export const LiveMasterMoviePlayer: React.FC<LiveMasterMoviePlayerProps> = ({
  shots,
  activeShotId,
  onSelectShot,
  productionJob,
  aspectRatio,
}) => {
  const [isPlayingMaster, setIsPlayingMaster] = useState(false);
  const [currentSeqIdx, setCurrentSeqIdx] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatusMsg, setExportStatusMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const segments = computeAdaptiveSequence(shots);
  const activeShot =
    shots.find((s) => s.id === activeShotId) ||
    shots[currentSeqIdx] ||
    shots[0];
  const renderedCount = shots.filter((s) => s.renderedVideoUrl).length;

  // Tự động phát bộ phim ngay khi tiến trình tự hành hoàn tất
  useEffect(() => {
    if (productionJob.stage === 'completed' && segments.length > 0) {
      setCurrentSeqIdx(0);
      setIsPlayingMaster(true);
    }
  }, [productionJob.stage, segments.length]);

  useEffect(() => {
    if (!isPlayingMaster) return;
    const currentSeg = segments[currentSeqIdx];
    if (!currentSeg) {
      setIsPlayingMaster(false);
      return;
    }

    onSelectShot(currentSeg.shotId);
    const v = videoRef.current;
    if (v && currentSeg.videoUrl) {
      v.src = currentSeg.videoUrl;
      v.currentTime = currentSeg.startTimeOffset;
      v.play().catch(() => {});

      const checkTime = () => {
        if (v.currentTime >= currentSeg.endTimeOffset - 0.12) {
          if (currentSeqIdx + 1 < segments.length) {
            setCurrentSeqIdx((prev) => prev + 1);
          } else {
            setIsPlayingMaster(false);
            setCurrentSeqIdx(0);
          }
        }
      };

      v.addEventListener('timeupdate', checkTime);
      return () => v.removeEventListener('timeupdate', checkTime);
    }
  }, [isPlayingMaster, currentSeqIdx, segments.length]);

  const handleToggleMasterPlay = () => {
    if (segments.length === 0) return;
    if (isPlayingMaster) {
      videoRef.current?.pause();
      setIsPlayingMaster(false);
    } else {
      setCurrentSeqIdx(0);
      setIsPlayingMaster(true);
    }
  };

  const handleExportMaster = async () => {
    if (segments.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportStatusMsg('Đang xuất các phân cảnh MP4 & lưu vào Thư viện Flow...');
    try {
      let exportedCount = 0;
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (!seg.videoUrl || !seg.videoUrl.startsWith('data:')) continue;
        const commaIdx = seg.videoUrl.indexOf(',');
        const base64Data =
          commaIdx !== -1 ? seg.videoUrl.slice(commaIdx + 1) : seg.videoUrl;
        const safeTitle = seg.title
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 24);

        if (typeof Flow !== 'undefined' && Flow.save) {
          try {
            await Flow.save({
              base64: base64Data,
              mimeType: 'video/mp4',
              name: `Hyperion_Shot_${String(i + 1).padStart(2, '0')}_${safeTitle}.mp4`,
            });
          } catch {
            // Bỏ qua nếu đã lưu trước đó
          }
        }

        if (typeof Flow !== 'undefined' && Flow.download) {
          await Flow.download({
            base64: base64Data,
            mimeType: 'video/mp4',
            filename: `Hyperion_Shot_${String(i + 1).padStart(2, '0')}_${safeTitle}_${Date.now()}.mp4`,
          });
          exportedCount++;
        }
      }
      setExportStatusMsg(
        `Đã xuất thành công ${exportedCount}/${segments.length} phân cảnh MP4!`
      );
      setTimeout(() => setExportStatusMsg(null), 4000);
    } catch (e) {
      console.error('Export failed', e);
      setExportStatusMsg('Lỗi khi xuất file MP4.');
    } finally {
      setIsExporting(false);
    }
  };

  const isProcessing =
    productionJob.stage !== 'idle' &&
    productionJob.stage !== 'completed' &&
    productionJob.stage !== 'error';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden bg-radial from-zinc-900/40 via-[#050508] to-[#050508]">
      {/* Khung Màn Hình Điện Ảnh Chính */}
      <div
        className={`relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.85)] bg-zinc-950 flex items-center justify-center transition-all ${
          aspectRatio === '16:9'
            ? 'w-full max-w-4xl aspect-video'
            : 'h-full max-h-[540px] aspect-[9/16]'
        }`}
      >
        {/* Lớp HUD Tiến Trình Tự Hành */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 relative">
              <span className="material-symbols-outlined text-3xl text-amber-400 animate-spin">
                progress_activity
              </span>
            </div>
            <div className="text-xs font-mono uppercase tracking-widest text-amber-400 mb-1">
              DÂY CHUYỀN TỰ HÀNH HYPERION ({productionJob.progressPercent}%)
            </div>
            <h3 className="text-base font-bold text-white max-w-md mb-4">
              {productionJob.statusMessage}
            </h3>
            <div className="w-full max-w-md h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-300"
                style={{ width: `${productionJob.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono">
              <span>
                Keyframes: {productionJob.completedKeyframes}/
                {productionJob.totalShots}
              </span>
              <span>•</span>
              <span>
                Videos: {productionJob.completedVideos}/
                {productionJob.totalShots}
              </span>
            </div>
          </div>
        )}

        {/* Nội dung Video hoặc Ảnh Keyframe */}
        {isPlayingMaster && segments.length > 0 ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            controls={false}
            playsInline
          />
        ) : activeShot?.renderedVideoUrl ? (
          <video
            key={activeShot.renderedVideoUrl}
            src={activeShot.renderedVideoUrl}
            className="w-full h-full object-cover"
            controls
            autoPlay
            loop
            playsInline
          />
        ) : activeShot?.startKeyframeUrl ? (
          <div className="relative w-full h-full">
            <img
              src={activeShot.startKeyframeUrl}
              alt={activeShot.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-end p-6">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-1">
                KEYFRAME ĐÃ KHÓA MỎ NEO • CHỜ RENDER VIDEO ({activeShot.videoEngine})
              </span>
              <p className="text-sm text-zinc-200 line-clamp-2">
                {activeShot.actionDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-4 text-zinc-500">
              <span className="material-symbols-outlined text-3xl">
                movie_filter
              </span>
            </div>
            <h3 className="text-sm font-bold text-zinc-200 mb-1">
              Sân Khấu Điện Ảnh Tự Hành
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Nhập kịch bản của bạn ở thanh chỉ huy phía trên và nhấn{' '}
              <strong className="text-amber-400">TỰ ĐỘNG SẢN XUẤT PHIM</strong>.
              Hệ thống sẽ tự động tách cảnh, đúc nhân vật, vẽ Keyframe, kiểm định
              VQQA và dựng thành phim hoàn chỉnh.
            </p>
          </div>
        )}

        {/* HUD Góc Trên Trái: Thông tin Cảnh & Chế độ Chuyển cảnh */}
        {activeShot && (
          <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-white">
              CẢNH {activeShot.order}: {activeShot.title}
            </span>
            <span className="text-[10px] text-zinc-300 font-mono border-l border-white/15 pl-2">
              {activeShot.cameraAngle}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {activeShot.transitionType === 'CONTINUOUS_MATCH_FRAME'
                ? 'MATCH-FRAME'
                : activeShot.transitionType === 'A_TO_B_BRIDGE'
                ? 'A→B BRIDGE'
                : 'HARD CUT'}
            </span>
            {activeShot.isDnaStateShift && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                CANVAS SHIFT ({activeShot.entityStateUsed})
              </span>
            )}
            {activeShot.judgeVerdict && (
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                  activeShot.judgeVerdict.score >= 85
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                VQQA {activeShot.judgeVerdict.score}%
              </span>
            )}
          </div>
        )}

        {/* HUD Thông báo Xuất File */}
        {exportStatusMsg && (
          <div className="absolute top-3 right-3 z-20 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 px-3 py-1.5 rounded-xl text-[11px] font-medium shadow-lg">
            {exportStatusMsg}
          </div>
        )}

        {/* HUD Phụ đề Thoại Dưới Đáy */}
        {activeShot?.audioStems.dialogueText && (
          <div className="absolute bottom-4 inset-x-12 z-20 text-center pointer-events-none">
            <span className="inline-block bg-black/75 backdrop-blur-sm text-amber-100 text-xs font-medium px-4 py-1.5 rounded-lg border border-white/10 shadow-lg">
              “{activeShot.audioStems.dialogueText}”
            </span>
          </div>
        )}
      </div>

      {/* Thanh Điều Khiển Phát Phim Tổng & Xuất File */}
      <div className="mt-3 flex items-center gap-3 bg-zinc-900/90 border border-white/10 px-4 py-2 rounded-full shadow-xl">
        <button
          onClick={handleToggleMasterPlay}
          disabled={renderedCount === 0}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 disabled:opacity-40 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">
            {isPlayingMaster ? 'stop' : 'play_circle'}
          </span>
          {isPlayingMaster
            ? 'Dừng Phát Toàn Phim'
            : `Phát Toàn Bộ Phim (${renderedCount}/${shots.length} Cảnh)`}
        </button>

        <div className="h-4 w-[1px] bg-white/10" />

        <button
          onClick={handleExportMaster}
          disabled={renderedCount === 0 || isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-40 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          {isExporting
            ? 'Đang xuất MP4...'
            : `Tải Trọn Bộ (${renderedCount} MP4)`}
        </button>
      </div>
    </div>
  );
};
