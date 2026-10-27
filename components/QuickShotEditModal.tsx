import React, { useState } from 'react';
import { Flow } from 'flow-sdk';
import { TimelineShot, LensPreset, FlowVideoModelName, VideoTake } from '../types/cinemaCore';
import { telemetry } from '../services/creditTelemetry';

interface QuickShotEditModalProps {
  shot: TimelineShot | null;
  onClose: () => void;
  onSaveShot: (updated: TimelineShot) => void;
  onCreditDeducted: (amt: number) => void;
}

export const QuickShotEditModal: React.FC<QuickShotEditModalProps> = ({
  shot,
  onClose,
  onSaveShot,
  onCreditDeducted,
}) => {
  if (!shot) return null;

  const [activePrompt, setActivePrompt] = useState(shot.activePrompt);
  const [lensPreset, setLensPreset] = useState<LensPreset>(shot.lensPreset);
  const [selectedModel, setSelectedModel] = useState<FlowVideoModelName>(shot.selectedModel || 'Omni 1.1 Flash');
  const [duration, setDuration] = useState<number>(shot.targetDurationSeconds || 4);
  const [isRerolling, setIsRerolling] = useState(false);
  const [conversationalCmd, setConversationalCmd] = useState('');
  const [editStatus, setEditStatus] = useState<string | null>(null);

  const prospectiveCost = telemetry.calculateCost({
    task: 'video_render',
    model: selectedModel,
    duration,
    resolution: selectedModel === 'Omni 1.1 Flash' ? '360p' : '720p',
  });

  const handleReroll = async () => {
    setIsRerolling(true);
    setEditStatus(`Đang kết xuất lại Shot #${shot.shotNumber} bằng ${selectedModel}...`);

    try {
      let res;
      if (selectedModel === 'Omni 1.1 Flash') {
        res = await Flow.generate.video({
          prompt: `${activePrompt}. Filmed on ${lensPreset}.`,
          modelDisplayName: 'Omni 1.1 Flash',
          aspectRatio: '16:9',
          durationSeconds: duration,
          resolution: '360p',
          ...(shot.startKeyframeMediaId ? { firstFrameImageMediaId: shot.startKeyframeMediaId } : {}),
        });
      } else {
        res = await Flow.generate.video({
          prompt: `${activePrompt}. Filmed on ${lensPreset}.`,
          modelDisplayName: selectedModel,
          aspectRatio: '16:9',
          durationSeconds: duration,
          ...(shot.startKeyframeMediaId ? { firstFrameImageMediaId: shot.startKeyframeMediaId } : {}),
        });
      }

      const newTake: VideoTake = {
        takeId: 'take_quick_' + Math.random().toString(36).substring(2, 7),
        shotId: shot.id,
        takeNumber: shot.takes.length + 1,
        modelUsed: selectedModel,
        videoUrl: `data:${res.mimeType};base64,${res.base64}`,
        mediaId: res.mediaId,
        duration,
        resolution: selectedModel === 'Omni 1.1 Flash' ? '360p' : '720p',
        creditCost: prospectiveCost,
        createdAt: Date.now(),
        isSelectedForMaster: true,
      };

      const updated: TimelineShot = {
        ...shot,
        activePrompt,
        lensPreset,
        targetDurationSeconds: duration,
        selectedModel,
        takes: [newTake, ...shot.takes.map((t) => ({ ...t, isSelectedForMaster: false }))],
        masterTakeId: newTake.takeId,
      };

      onSaveShot(updated);
      telemetry.recordExpenditure(`Quick Edit Shot #${shot.shotNumber}`, prospectiveCost);
      onCreditDeducted(prospectiveCost);
      setEditStatus('✓ Đã cập nhật cảnh quay thành công!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setEditStatus('Lỗi: ' + (err?.message || 'Không thể render'));
    } finally {
      setIsRerolling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B0E17] border border-[#00F0FF]/40 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-[0_0_40px_rgba(0,240,255,0.25)] select-none">
        <div className="flex items-center justify-between border-b border-[#1E293F] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00F0FF] text-[20px]">edit</span>
            <span className="font-mono font-bold text-sm text-white">
              CHỈNH SỬA NHANH: SHOT #{shot.shotNumber} ({shot.sceneHeading})
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">CHỈ ĐẠO HÀNH ĐỘNG (ACTION PROMPT):</label>
            <textarea
              rows={3}
              value={activePrompt}
              onChange={(e) => setActivePrompt(e.target.value)}
              className="w-full bg-[#121826] border border-[#233148] rounded p-2 text-xs text-white focus:outline-none focus:border-[#00F0FF] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">ỐNG KÍNH (LENS):</label>
              <select
                value={lensPreset}
                onChange={(e) => setLensPreset(e.target.value as LensPreset)}
                className="w-full bg-[#121826] border border-[#233148] rounded p-1.5 text-xs text-[#00F0FF]"
              >
                <option value="16mm_UltraWide_Scale">16mm Ultra-Wide</option>
                <option value="24mm_Anamorphic_Action">24mm Anamorphic</option>
                <option value="50mm_Cinematic">50mm Master</option>
                <option value="85mm_Dramatic_CloseUp">85mm CloseUp</option>
                <option value="FPV_Dynamic_Chase">FPV Dynamic Chase</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">MÔ HÌNH RENDER:</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as FlowVideoModelName)}
                className="w-full bg-[#121826] border border-[#233148] rounded p-1.5 text-xs text-amber-400"
              >
                <option value="Omni 1.1 Flash">Omni 1.1 Flash (360p Draft)</option>
                <option value="Veo 3.1 - Fast">Veo 3.1 - Fast (720p HD)</option>
                <option value="Veo 3.1 - Lite">Veo 3.1 - Lite (720p Tiết kiệm)</option>
              </select>
            </div>
          </div>
        </div>

        {editStatus && (
          <div className="p-2 rounded bg-[#00F0FF]/10 text-[#00F0FF] text-xs font-mono text-center border border-[#00F0FF]/30">
            {editStatus}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E293F]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-xs font-mono text-slate-400 hover:bg-slate-800"
          >
            HỦY
          </button>
          <button
            onClick={handleReroll}
            disabled={isRerolling}
            className="px-4 py-2 bg-gradient-to-r from-[#00F0FF] to-blue-600 hover:brightness-110 text-black font-mono font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isRerolling ? 'progress_activity' : 'movie'}
            </span>
            <span>{isRerolling ? 'ĐANG BẤM MÁY LẠI...' : `RENDER LẠI (-${prospectiveCost} CR)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};