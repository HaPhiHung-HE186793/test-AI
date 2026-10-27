import React, { useState } from 'react';
import { Flow } from 'flow-sdk';
import { 
  TimelineShot, 
  WorldEntity, 
  EnvironmentStage, 
  LensPreset, 
  VideoTake,
  FlowVideoModelName
} from '../types/cinemaCore';
import { telemetry } from '../services/creditTelemetry';

interface DirectorStageProps {
  shots: TimelineShot[];
  setShots: React.Dispatch<React.SetStateAction<TimelineShot[]>>;
  activeShotId: string;
  setActiveShotId: (id: string) => void;
  entities: WorldEntity[];
  stages: EnvironmentStage[];
  onCreditDeducted: (amt: number) => void;
}

const LENS_PRESETS: { id: LensPreset; label: string; focal: string; notes: string }[] = [
  { id: '16mm_UltraWide_Scale', label: '16mm Ultra-Wide Scale', focal: '16mm f/2.8', notes: 'Góc siêu rộng nhấn mạnh quy mô khổng lồ của Mecha và Kaiju' },
  { id: '24mm_Anamorphic_Action', label: '24mm Anamorphic Action', focal: '24mm 2.0x Anamorphic', notes: 'Vệt sáng xanh horizontal flare, góc nhìn hành động Hollywood' },
  { id: '50mm_Cinematic', label: '50mm Cinematic Master', focal: '50mm f/1.4', notes: 'Góc nhìn tự nhiên của mắt người, cân bằng độ sâu trường ảnh' },
  { id: '85mm_Dramatic_CloseUp', label: '85mm Dramatic CloseUp', focal: '85mm f/1.2', notes: 'Bắt trọn biểu cảm mắt phi công, chi tiết cockpit chật hẹp' },
  { id: 'FPV_Dynamic_Chase', label: 'FPV Dynamic Chase Lens', focal: '9mm Hyper-Motion', notes: 'Góc máy rượt đuổi tốc độ cao, rung chấn giật giũa đường bay' },
];

export const DirectorStage: React.FC<DirectorStageProps> = ({
  shots,
  setShots,
  activeShotId,
  setActiveShotId,
  entities,
  stages,
  onCreditDeducted,
}) => {
  const currentShot = shots.find((s) => s.id === activeShotId) || shots[0];

  const [selectedModel, setSelectedModel] = useState<FlowVideoModelName>(currentShot?.selectedModel || 'Veo 3.1 - Fast');
  const [resolution, setResolution] = useState<'720p' | '360p'>('360p');
  const [duration, setDuration] = useState<number>(currentShot?.targetDurationSeconds || 4);
  const [isDirectR2V, setIsDirectR2V] = useState(false); // Trực tiếp Ingredients-to-Video không qua Bước Đệm Vàng
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [directorLog, setDirectorLog] = useState<string>('');
  const [activeTakePlayer, setActiveTakePlayer] = useState<string | null>(null);

  const selectedEntity = entities.find((e) => e.id === currentShot?.primaryEntityId) || entities[0];
  const selectedStage = stages.find((s) => s.id === currentShot?.environmentStageId) || stages[0];

  // Tính thời lượng hợp lệ theo quy định Google Flow
  // Veo 3.1 (Lite / Fast / Quality): 4s, 6s, 8s.
  // ĐẶC BIỆT: Nếu dùng trực tiếp Ingredients-to-Video (R2V) không qua Bước Đệm Vàng thì tự động khóa ở mức 8s.
  const isVeoSeries = selectedModel.startsWith('Veo 3.1');
  const isOmni = selectedModel === 'Omni 1.1 Flash';

  const effectiveDuration = (isVeoSeries && isDirectR2V) ? 8 : duration;

  // Tính toán chi phí chuẩn Google AI Ultra
  const prospectiveCredits = telemetry.calculateCost({
    task: 'video_render',
    model: selectedModel,
    duration: effectiveDuration,
    resolution: isVeoSeries ? '720p' : resolution,
    isDirectR2VWithoutKeyframe: isDirectR2V,
  });

  const handleRollCamera = async () => {
    if (!currentShot) return;

    setIsGeneratingVideo(true);
    setDirectorLog(`Đang khởi động Camera Rig: Model ${selectedModel} | Thời lượng: ${effectiveDuration}s | Lens: ${currentShot.lensPreset}...`);

    const state = currentShot.entityStateUsed || 'combat_mode';
    const entityRefId = selectedEntity?.states[state]?.angles?.sheetCompositeMediaId;

    const fullPrompt = `${currentShot.activePrompt}. 
Subject: ${selectedEntity.name} in ${state} mode.
Environment: ${selectedStage.name}, ${selectedStage.sceneType}, Weather: ${selectedStage.weather}.
Cinematography: Filmed on ${currentShot.lensPreset}, ${selectedStage.colorLUT} LUT color grading. 
Ultra-smooth action choreography, cinematic anamorphic bokeh, hyper-detailed mecha physics, photorealistic blockbuster VFX.`;

    try {
      setDirectorLog(`Flow AI đang dựng video ${effectiveDuration}s bằng ${selectedModel}...`);

      let videoResult;
      if (selectedModel === 'Omni 1.1 Flash') {
        videoResult = await Flow.generate.video({
          prompt: fullPrompt,
          modelDisplayName: 'Omni 1.1 Flash',
          aspectRatio: '16:9',
          resolution: resolution,
          durationSeconds: effectiveDuration,
          ...(entityRefId ? { referenceImageMediaIds: [entityRefId] } : {}),
        });
      } else {
        // Veo 3.1 Lite / Fast / Quality
        videoResult = await Flow.generate.video({
          prompt: fullPrompt,
          modelDisplayName: selectedModel,
          aspectRatio: '16:9',
          durationSeconds: effectiveDuration,
          ...(entityRefId ? { referenceImageMediaIds: [entityRefId] } : {}),
        });
      }

      const videoDataUrl = `data:${videoResult.mimeType};base64,${videoResult.base64}`;

      const newTake: VideoTake = {
        takeId: 'take_' + Math.random().toString(36).substring(2, 7),
        shotId: currentShot.id,
        takeNumber: currentShot.takes.length + 1,
        modelUsed: selectedModel,
        videoUrl: videoDataUrl,
        mediaId: videoResult.mediaId,
        duration: effectiveDuration,
        resolution: isVeoSeries ? '720p' : resolution,
        creditCost: prospectiveCredits,
        createdAt: Date.now(),
        isSelectedForMaster: currentShot.takes.length === 0,
      };

      setShots((prev) =>
        prev.map((s) => {
          if (s.id !== currentShot.id) return s;
          const updatedTakes = [newTake, ...s.takes];
          return {
            ...s,
            takes: updatedTakes,
            masterTakeId: s.masterTakeId || newTake.takeId,
            targetDurationSeconds: effectiveDuration,
            selectedModel: selectedModel,
          };
        })
      );

      setActiveTakePlayer(videoDataUrl);
      telemetry.recordExpenditure(`Shot #${currentShot.shotNumber} Roll (${selectedModel} ${effectiveDuration}s)`, prospectiveCredits);
      onCreditDeducted(prospectiveCredits);
      setDirectorLog(`✓ Đã quay xong Take #${newTake.takeNumber}! Khấu trừ ${prospectiveCredits} Credits.`);
    } catch (err: any) {
      console.error(err);
      setDirectorLog('Lỗi quay phim: ' + (err?.message || 'Không thể render video.'));
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleSelectMasterTake = (takeId: string) => {
    setShots((prev) =>
      prev.map((s) => {
        if (s.id !== currentShot.id) return s;
        return {
          ...s,
          masterTakeId: takeId,
          takes: s.takes.map((t) => ({ ...t, isSelectedForMaster: t.takeId === takeId })),
        };
      })
    );
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0A0C10] text-slate-100">
      {/* SHOT LIST SELECTOR (Left panel) */}
      <div className="w-full md:w-72 bg-[#0C0F17] border-r border-[#1B2232] flex flex-col shrink-0">
        <div className="p-3 border-b border-[#1B2232] flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#00F0FF]">movie</span>
            DANH SÁCH PHÂN CẢNH
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00F0FF]/10 text-[#00F0FF]">
            {shots.length} SHOTS
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {shots.map((shot) => {
            const isActive = shot.id === currentShot?.id;
            const hasTakes = shot.takes.length > 0;
            return (
              <div
                key={shot.id}
                onClick={() => setActiveShotId(shot.id)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#151D2F] border-[#00F0FF]/60 shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                    : 'bg-[#0E121B] border-[#1D2536] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs text-white">
                    SHOT #{shot.shotNumber.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-mono text-[#00F0FF]">
                    {shot.targetDurationSeconds}s • {shot.selectedModel.replace('Veo 3.1 - ', '')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono line-clamp-2">{shot.scriptDescription}</div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                  <span>TAKES: {shot.takes.length}</span>
                  <span className={hasTakes ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                    {hasTakes ? '✓ MASTER READY' : 'NO FOOTAGE'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MONITOR & CAMERA CONTROL (Center & Right) */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-3 bg-[#0D1017] border-b border-[#1A2234] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold text-white">
              PHÂN CẢNH #{currentShot.shotNumber}: {currentShot.sceneHeading}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/30">
              GÓI: ULTRA TIER
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              Chi phí dự kiến: <strong className="text-[#00F0FF]">{prospectiveCredits} Credits</strong>
            </span>
          </div>
        </div>

        {/* Video Monitor Stage */}
        <div className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-[#07080B] rounded-xl border border-[#1E2536] overflow-hidden flex flex-col">
            <div className="h-9 bg-[#0B0E14] px-3 border-b border-[#1A2234] flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-white font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                PREVIEW MONITOR [16:9 MASTER]
              </span>
              <span>{isVeoSeries ? '720p HD' : resolution} • ULTRA DRAFT</span>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center relative">
              {activeTakePlayer || currentShot.takes[0]?.videoUrl ? (
                <video
                  src={activeTakePlayer || currentShot.takes[0]?.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-14 h-14 rounded-full bg-[#111622] border border-[#232F46] flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-[28px] text-slate-500">videocam</span>
                  </div>
                  <div className="font-mono text-xs text-slate-400">CHƯA CÓ BẢN QUAY (TAKE) NÀO ĐƯỢC THỰC HIỆN</div>
                  <p className="text-[11px] text-slate-600 mt-1 max-w-sm">
                    Tùy chỉnh góc Lens, thời lượng (4s/6s/8s/10s) và Model rồi nhấn "ROLL CAMERA".
                  </p>
                </div>
              )}
            </div>

            {directorLog && (
              <div className="p-2.5 bg-[#090C12] border-t border-[#182030] text-[11px] font-mono text-[#00F0FF] flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">terminal</span>
                <span>{directorLog}</span>
              </div>
            )}
          </div>

          {/* Camera & Lens Configuration Rig */}
          <div className="w-full md:w-84 bg-[#0C0F17] rounded-xl border border-[#1E2536] p-3 space-y-3 shrink-0">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block border-b border-slate-800 pb-2">
              HỆ THỐNG MÔ HÌNH QUAY & THỜI LƯỢNG CHUẨN
            </span>

            {/* AI Video Model Picker */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">MÔ HÌNH CHÍNH THỨC (FLOW SDK)</label>
              <div className="space-y-1.5">
                {/* Omni 1.1 Flash */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel('Omni 1.1 Flash');
                    setResolution('360p');
                  }}
                  className={`w-full p-2 rounded text-left text-xs font-mono border transition-all ${
                    selectedModel === 'Omni 1.1 Flash'
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] font-bold'
                      : 'bg-[#101420] border-[#1E2638] text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>Omni 1.1 Flash</span>
                    <span className="text-[10px] text-emerald-400 font-bold">4 - 7 Credits (360p)</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    360p Draft + Free Auto Upscale 720p (Mở khóa thời lượng 10s)
                  </div>
                </button>

                {/* Veo 3.1 - Lite */}
                <button
                  type="button"
                  onClick={() => setSelectedModel('Veo 3.1 - Lite')}
                  className={`w-full p-2 rounded text-left text-xs font-mono border transition-all ${
                    selectedModel === 'Veo 3.1 - Lite'
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] font-bold'
                      : 'bg-[#101420] border-[#1E2638] text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>Veo 3.1 - Lite</span>
                    <span className="text-[10px] text-amber-400 font-bold">5 Credits (Ultra)</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Tiết kiệm, cinematic 720p, hỗ trợ +8s Extend</div>
                </button>

                {/* Veo 3.1 - Fast */}
                <button
                  type="button"
                  onClick={() => setSelectedModel('Veo 3.1 - Fast')}
                  className={`w-full p-2 rounded text-left text-xs font-mono border transition-all ${
                    selectedModel === 'Veo 3.1 - Fast'
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] font-bold'
                      : 'bg-[#101420] border-[#1E2638] text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>Veo 3.1 - Fast</span>
                    <span className="text-[10px] text-amber-400 font-bold">10 Credits (Ultra)</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Hành động nhanh chuẩn điện ảnh</div>
                </button>

                {/* Veo 3.1 - Quality */}
                <button
                  type="button"
                  onClick={() => setSelectedModel('Veo 3.1 - Quality')}
                  className={`w-full p-2 rounded text-left text-xs font-mono border transition-all ${
                    selectedModel === 'Veo 3.1 - Quality'
                      ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-[#00F0FF] font-bold'
                      : 'bg-[#101420] border-[#1E2638] text-slate-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>Veo 3.1 - Quality</span>
                    <span className="text-[10px] text-rose-400 font-bold">100 Credits (4K Master)</span>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Độ chân thực quang học rạp chiếu IMAX</div>
                </button>
              </div>
            </div>

            {/* BỔ SUNG LỰA CHỌN THỜI LƯỢNG CHO TỪNG SHOT */}
            <div className="bg-[#101420] p-2.5 rounded-lg border border-[#1E2638] space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-slate-300 font-bold">THỜI LƯỢNG SHOT (DURATION)</label>
                <span className="text-[10px] font-mono text-[#00F0FF] font-bold">{effectiveDuration} GIÂY</span>
              </div>

              {/* Tùy chọn chuyển đổi nếu dùng trực tiếp Ingredients R2V không qua Bước Đệm Vàng */}
              {isVeoSeries && (
                <div className="flex items-center gap-2 p-1.5 bg-black/40 rounded border border-slate-800 text-[10px] font-mono">
                  <input
                    type="checkbox"
                    id="direct_r2v"
                    checked={isDirectR2V}
                    onChange={(e) => setIsDirectR2V(e.target.checked)}
                    className="accent-[#00F0FF]"
                  />
                  <label htmlFor="direct_r2v" className="text-slate-300 cursor-pointer">
                    Dùng trực tiếp Ingredients-to-Video (khóa 8s)
                  </label>
                </div>
              )}

              {/* Các nút bấm chọn thời lượng */}
              <div className="grid grid-cols-4 gap-1.5">
                {[4, 6, 8, 10].map((sec) => {
                  const isSecDisabled = isVeoSeries ? (isDirectR2V ? sec !== 8 : sec === 10) : false;
                  return (
                    <button
                      key={sec}
                      type="button"
                      disabled={isSecDisabled}
                      onClick={() => setDuration(sec)}
                      className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                        effectiveDuration === sec
                          ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                          : isSecDisabled
                          ? 'bg-[#151822] text-slate-600 opacity-40 cursor-not-allowed'
                          : 'bg-[#171D2C] text-slate-300 hover:bg-[#20293D]'
                      }`}
                    >
                      {sec}s
                      {sec === 10 && <span className="block text-[8px] font-normal text-emerald-400">Omni</span>}
                    </button>
                  );
                })}
              </div>

              {isVeoSeries && isDirectR2V && (
                <div className="text-[9px] text-amber-400/90 font-mono">
                  ⚠️ Veo 3.1 khi dùng trực tiếp Ingredients-to-Video không qua Bước Đệm Vàng tự động cố định ở mức 8s theo tài liệu Google Flow.
                </div>
              )}
            </div>

            {/* Lens selection */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">ỐNG KÍNH ĐIỆN ẢNH (LENS PRESET)</label>
              <select
                value={currentShot.lensPreset}
                onChange={(e) =>
                  setShots((prev) =>
                    prev.map((s) => (s.id === currentShot.id ? { ...s, lensPreset: e.target.value as LensPreset } : s))
                  )
                }
                className="w-full bg-[#131724] border border-[#212A3E] rounded p-2 text-xs font-mono text-[#00F0FF] focus:outline-none"
              >
                {LENS_PRESETS.map((lens) => (
                  <option key={lens.id} value={lens.id}>
                    {lens.label} ({lens.focal})
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt override */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">CHỈ ĐẠO DIỄN XUẤT (ACTION PROMPT)</label>
              <textarea
                rows={2}
                value={currentShot.activePrompt}
                onChange={(e) =>
                  setShots((prev) =>
                    prev.map((s) => (s.id === currentShot.id ? { ...s, activePrompt: e.target.value } : s))
                  )
                }
                className="w-full bg-[#111522] border border-[#20293E] rounded p-2 text-xs text-white focus:outline-none focus:border-[#00F0FF] font-mono resize-none"
              />
            </div>

            {/* Roll Camera Button */}
            <button
              onClick={handleRollCamera}
              disabled={isGeneratingVideo}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:brightness-110 text-white font-mono font-bold text-xs rounded-lg shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isGeneratingVideo ? 'hourglass_top' : 'fiber_manual_record'}
              </span>
              <span>{isGeneratingVideo ? 'ĐANG GHI HÌNH...' : `ROLL CAMERA (-${prospectiveCredits} CR)`}</span>
            </button>
          </div>
        </div>

        {/* Takes History Gallery for this Shot */}
        <div className="p-4 pt-0">
          <div className="bg-[#0C0F17] rounded-xl border border-[#1A2234] p-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-2">
              LỊCH SỬ BẤM MÁY (TAKES LOG: {currentShot.takes.length})
            </span>

            {currentShot.takes.length === 0 ? (
              <div className="text-center py-4 text-xs font-mono text-slate-600">
                Chưa có take nào. Nhấn "ROLL CAMERA" để quay thử bản đầu tiên.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {currentShot.takes.map((take, idx) => {
                  const isMaster = currentShot.masterTakeId === take.takeId;
                  return (
                    <div
                      key={take.takeId}
                      className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between ${
                        isMaster ? 'bg-[#152033] border-[#00F0FF]' : 'bg-[#0E121B] border-[#1D2536]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold text-white">
                            TAKE #{currentShot.takes.length - idx}
                          </span>
                          {isMaster && (
                            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 font-bold">
                              MASTER
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {take.modelUsed} • {take.duration}s • {take.creditCost}cr
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => setActiveTakePlayer(take.videoUrl)}
                          className="flex-1 py-1 rounded bg-[#181F2E] hover:bg-[#202B40] text-[10px] font-mono text-cyan-300"
                        >
                          XEM LẠI
                        </button>
                        <button
                          onClick={() => handleSelectMasterTake(take.takeId)}
                          disabled={isMaster}
                          className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                            isMaster
                              ? 'text-slate-600 cursor-default'
                              : 'bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF]'
                          }`}
                        >
                          CHỌN MASTER
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};