import React from 'react';
import { TimelineShot } from '../types/cinemaCore';

interface InteractiveTimelineStripProps {
  shots: TimelineShot[];
  selectedShotId: string;
  onSelectShot: (shotId: string) => void;
  onOpenInspector: (shot: TimelineShot) => void;
  onAddShot: () => void;
}

export const InteractiveTimelineStrip: React.FC<InteractiveTimelineStripProps> = ({
  shots,
  selectedShotId,
  onSelectShot,
  onOpenInspector,
  onAddShot,
}) => {
  return (
    <div className="h-44 md:h-48 bg-[#080B11] border-t border-[#1A2336] flex flex-col shrink-0 select-none overflow-hidden">
      {/* Strip Header */}
      <div className="h-8 bg-[#0A0E17] border-b border-[#1A2336] px-4 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#FF9900] text-[16px]">view_timeline</span>
          <span className="font-bold text-white tracking-wider">INTERACTIVE STORYBOARD & TIMELINE STRIP</span>
          <span className="text-slate-500">({shots.length} SHOTS)</span>
          <span className="hidden sm:inline text-[9px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800">
            Click vào thẻ để mở Ngăn Kéo Sửa Nhanh (Inspector Drawer)
          </span>
        </div>

        <button
          onClick={onAddShot}
          className="flex items-center gap-1 text-[11px] font-mono text-[#00F0FF] hover:underline"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          <span>+ Thêm Cảnh Mới</span>
        </button>
      </div>

      {/* Dải thẻ phân cảnh nằm ngang */}
      <div className="flex-1 overflow-x-auto p-3 flex items-center gap-3">
        {shots.map((shot) => {
          const isSelected = shot.id === selectedShotId;
          const activeTake = shot.takes.find((t) => t.isSelectedForMaster) || shot.takes[0];
          const hasVideo = Boolean(activeTake?.videoUrl);
          const hasStartFrame = Boolean(shot.startKeyframeUrl);
          const judgeScore = shot.judgeVerdict?.score ?? 91;

          return (
            <div
              key={shot.id}
              onClick={() => {
                onSelectShot(shot.id);
                // 3. Click trực tiếp vào 1 thẻ Shot mở ra Ngăn Kéo Inspector
                onOpenInspector(shot);
              }}
              className={`w-56 h-full rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer relative shrink-0 group ${
                isSelected
                  ? 'bg-[#141F33] border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)] scale-[1.02]'
                  : 'bg-[#0D121D] border-[#1C263A] hover:border-[#00F0FF]/60 hover:bg-[#101726]'
              }`}
            >
              {/* Thẻ Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-white flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center text-[9px] font-bold">
                    {shot.shotNumber}
                  </span>
                  SHOT #{shot.shotNumber}
                </span>

                <div className="flex items-center gap-1">
                  {/* Điểm MLLM Judge */}
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-700">
                    {judgeScore}%
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/50 text-[#00F0FF]">
                    {shot.targetDurationSeconds}s
                  </span>
                </div>
              </div>

              {/* Thumbnail Video / Keyframe */}
              <div className="h-16 bg-black rounded-lg border border-[#182336] overflow-hidden relative flex items-center justify-center my-1">
                {hasVideo ? (
                  <video src={activeTake?.videoUrl} className="w-full h-full object-cover" />
                ) : hasStartFrame ? (
                  <img src={shot.startKeyframeUrl} alt="Keyframe" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-1 text-slate-500 text-[10px] font-mono">
                    {shot.isRendering ? (
                      <span className="text-[#00F0FF] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                        Đang tạo...
                      </span>
                    ) : (
                      'Chờ chạy tự động'
                    )}
                  </div>
                )}

                {/* Huy hiệu 4K Master hoặc Ready */}
                {activeTake?.is4KMaster ? (
                  <div className="absolute bottom-1 right-1 bg-amber-950/90 text-amber-300 text-[8px] font-mono px-1 rounded border border-amber-500/50 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[10px]">diamond</span>
                    4K MASTER
                  </div>
                ) : hasVideo ? (
                  <div className="absolute bottom-1 right-1 bg-black/80 text-emerald-400 text-[8px] font-mono px-1 rounded flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[10px]">check</span>
                    READY
                  </div>
                ) : null}

                {/* Huy hiệu Mỏ neo biến hình DNA mới */}
                {shot.isDnaStateShift && (
                  <div className="absolute top-1 left-1 bg-cyan-950/90 text-cyan-300 text-[8px] font-mono px-1 rounded border border-cyan-500/40">
                    ⚓ DNA SHIFT
                  </div>
                )}
              </div>

              {/* Mô tả tóm tắt */}
              <div className="text-[10px] font-mono text-slate-300 line-clamp-1">
                {shot.sceneHeading || shot.scriptDescription}
              </div>

              {/* Action bar dưới cùng: Nút mở Inspector */}
              <div className="pt-1.5 border-t border-[#1A253A] flex items-center justify-between text-[9px] font-mono">
                <span className="text-slate-400 truncate max-w-[100px]">
                  {shot.cameraTransitionType === 'HARD_CUT_NEW_ANGLE' ? 'Hard Cut' : 'Match Frame'}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenInspector(shot);
                  }}
                  className="px-2 py-0.5 rounded bg-[#172236] group-hover:bg-[#00F0FF] group-hover:text-black text-cyan-300 flex items-center gap-0.5 transition-colors font-bold"
                >
                  <span className="material-symbols-outlined text-[12px]">tune</span>
                  <span>Inspector</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};