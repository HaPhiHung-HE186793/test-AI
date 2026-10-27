import React, { useState, useEffect } from 'react';
import { Flow } from 'flow-sdk';
import { 
  TimelineShot, 
  WorldEntity, 
  EnvironmentStage, 
  VideoTake, 
  UserExperienceMode,
  FlowVideoModelName,
  VoiceStyleSpec
} from '../types/cinemaCore';
import { ProductionPipeline } from '../services/productionPipeline';
import { buildAutoBoundReferenceSlots } from '../services/autoBindIngredients';
import { telemetry } from '../services/creditTelemetry';

interface ProductionDeckProps {
  shots: TimelineShot[];
  setShots: React.Dispatch<React.SetStateAction<TimelineShot[]>>;
  activeShotId: string;
  setActiveShotId: (id: string) => void;
  entities: WorldEntity[];
  stages: EnvironmentStage[];
  userMode: UserExperienceMode;
  onCreditDeducted: (amt: number) => void;
}

export const ProductionDeck: React.FC<ProductionDeckProps> = ({
  shots,
  setShots,
  activeShotId,
  setActiveShotId,
  entities,
  stages,
  userMode,
  onCreditDeducted,
}) => {
  const currentShot = shots.find((s) => s.id === activeShotId) || shots[0];
  const currentEntity = entities.find((e) => e.id === currentShot?.primaryEntityId) || entities[0];
  const currentStage = stages.find((s) => s.id === currentShot?.environmentStageId) || stages[0];

  const [deckTab, setDeckTab] = useState<'keyframe' | 'camera_takes' | 'conversational_edit' | 'voice_styling'>('keyframe');
  const [selectedModel, setSelectedModel] = useState<FlowVideoModelName>(currentShot?.selectedModel || 'Veo 3.1 - Fast');
  const [durationSeconds, setDurationSeconds] = useState<number>(currentShot?.targetDurationSeconds || 8);
  const [resolution, setResolution] = useState<'360p' | '720p'>('360p');

  const [isSynthesizingStartFrame, setIsSynthesizingStartFrame] = useState(false);
  const [isRenderingTake, setIsRenderingTake] = useState(false);
  const [isConversationalEditing, setIsConversationalEditing] = useState(false);
  const [isExtending8s, setIsExtending8s] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Trạng thái Tính năng Độc quyền 1: Sửa Nhanh Bằng Lời Nói
  const [conversationalPrompt, setConversationalPrompt] = useState('');
  const [editTarget, setEditTarget] = useState<'keyframe_image' | 'video_take'>('video_take');

  // Trạng thái Tính năng Độc quyền 3: Giọng Nói Tùy Chỉnh (Custom Voice Styling)
  const [voicePreset, setVoicePreset] = useState<'pilot_male_calm' | 'commander_female_authoritative' | 'ai_system_cold' | 'warrior_deep_grit'>('pilot_male_calm');
  const [voiceEmotionPrompt, setVoiceEmotionPrompt] = useState('Giọng trầm, gấp gáp, thở dốc dưới áp lực gia tốc 9G khi động cơ phản lực gầm rú.');

  const [previewTakeUrl, setPreviewTakeUrl] = useState<string | null>(null);

  const activeMasterTake = currentShot?.takes.find((t) => t.isSelectedForMaster) || currentShot?.takes[0];

  // Auto-bind ingredients
  useEffect(() => {
    if (!currentShot) return;
    const hasEmptySlot = currentShot.referenceSlots.some((s) => !s.imageUrl);
    if (currentShot.referenceSlots.length === 0 || hasEmptySlot) {
      const boundSlots = buildAutoBoundReferenceSlots(
        currentShot.primaryEntityId,
        currentShot.entityStateUsed,
        currentShot.environmentStageId,
        entities,
        stages
      );
      setShots((prev) =>
        prev.map((s) => (s.id === currentShot.id ? { ...s, referenceSlots: boundSlots } : s))
      );
    }
  }, [currentShot?.id]);

  // Chi phí dự kiến cho Model và thời lượng được chọn trên Ultra
  const prospectiveCredits = telemetry.calculateCost({
    task: 'video_render',
    model: selectedModel,
    duration: durationSeconds,
    resolution: selectedModel === 'Omni 1.1 Flash' ? resolution : '720p',
  });

  // 1. Tổng hợp Start Keyframe
  const handleSynthesizeKeyframe = async (target: 'start' | 'end') => {
    if (!currentShot) return;
    setIsSynthesizingStartFrame(true);
    setErrorMessage(null);
    setRenderStatus('Nano Banana Pro đang tổng hợp Master Keyframe (0 Credits)...');

    try {
      const result = await ProductionPipeline.synthesizeMasterKeyframe({
        shot: currentShot,
        target,
        entity: currentEntity,
        stage: currentStage,
        customPrompt: currentShot.keyframePrompt,
      });

      setShots((prev) =>
        prev.map((s) =>
          s.id === currentShot.id
            ? { ...s, startKeyframeUrl: result.imageUrl, startKeyframeMediaId: result.mediaId }
            : s
        )
      );

      setRenderStatus('✓ Đã tổng hợp thành công Master Start Keyframe! Tự động chuyển qua khay bấm máy.');
      setDeckTab('camera_takes');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Lỗi khi tổng hợp Master Keyframe');
    } finally {
      setIsSynthesizingStartFrame(false);
    }
  };

  // 2. Bấm máy quay Video Take
  const handleRollTake = async () => {
    if (!currentShot) return;
    setIsRenderingTake(true);
    setErrorMessage(null);

    try {
      const newTake = await ProductionPipeline.renderTake({
        shot: currentShot,
        model: selectedModel,
        durationSeconds,
        resolution,
        onStatusUpdate: (st) => setRenderStatus(st),
      });

      setShots((prev) =>
        prev.map((s) =>
          s.id === currentShot.id
            ? {
                ...s,
                takes: [newTake, ...s.takes],
                masterTakeId: s.masterTakeId || newTake.takeId,
                targetDurationSeconds: durationSeconds,
                selectedModel,
              }
            : s
        )
      );

      setPreviewTakeUrl(newTake.videoUrl);
      onCreditDeducted(newTake.creditCost);
      setRenderStatus(`✓ Hoàn tất Take #${newTake.takeNumber} qua ${selectedModel}! Trừ ${newTake.creditCost} Credits.`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Lỗi render video');
    } finally {
      setIsRenderingTake(false);
    }
  };

  // 3. TÍNH NĂNG ĐỘC QUYỀN 1: Sửa nhanh bằng lời nói (Conversational Video/Image Edit)
  const handleExecuteConversationalEdit = async () => {
    if (!conversationalPrompt.trim() || !currentShot) return;
    setIsConversationalEditing(true);
    setErrorMessage(null);

    try {
      const result = await ProductionPipeline.executeConversationalEdit({
        shot: currentShot,
        editInstruction: conversationalPrompt,
        targetType: editTarget,
        activeVideoTake: activeMasterTake,
        onStatusUpdate: (st) => setRenderStatus(st),
      });

      if (editTarget === 'keyframe_image') {
        setShots((prev) =>
          prev.map((s) =>
            s.id === currentShot.id
              ? { ...s, startKeyframeUrl: result.editedMediaUrl, startKeyframeMediaId: result.editedMediaId }
              : s
          )
        );
        setRenderStatus(`✓ Đã sửa nhanh Keyframe theo yêu cầu: "${conversationalPrompt}" (0 Credits)`);
      } else {
        // Tạo một take mới kế thừa từ kết quả V2V Edit
        const cost = telemetry.calculateCost({
          task: 'conversational_edit_video',
          resolution: activeMasterTake?.resolution || '360p',
        });
        const editedTake: VideoTake = {
          takeId: 'take_v2v_' + Math.random().toString(36).substring(2, 7),
          shotId: currentShot.id,
          takeNumber: currentShot.takes.length + 1,
          modelUsed: 'Omni 1.1 Flash',
          videoUrl: result.editedMediaUrl,
          mediaId: result.editedMediaId,
          duration: activeMasterTake?.duration || 8,
          resolution: activeMasterTake?.resolution || '360p',
          creditCost: cost,
          createdAt: Date.now(),
          isSelectedForMaster: true,
          directorNotes: `Conversational Edit: "${conversationalPrompt}"`,
        };

        setShots((prev) =>
          prev.map((s) =>
            s.id === currentShot.id
              ? {
                  ...s,
                  takes: [editedTake, ...s.takes],
                  masterTakeId: editedTake.takeId,
                }
              : s
          )
        );
        setPreviewTakeUrl(editedTake.videoUrl);
        onCreditDeducted(cost);
        setRenderStatus(`✓ Đã sửa nhanh Video V2V thành công qua Omni 1.1 Flash! Trừ ${cost} Credits.`);
      }
      setConversationalPrompt('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Lỗi khi thực hiện sửa nhanh bằng lời nói.');
    } finally {
      setIsConversationalEditing(false);
    }
  };

  // 4. TÍNH NĂNG ĐỘC QUYỀN 2: Kéo Dài Cảnh (+8s Extend) bằng Veo 3.1 Lite (5 credits)
  const handleExtend8s = async () => {
    if (!currentShot || !activeMasterTake) return;
    setIsExtending8s(true);
    setErrorMessage(null);

    try {
      const extendedTake = await ProductionPipeline.extendShot8s({
        shot: currentShot,
        baseTake: activeMasterTake,
        onStatusUpdate: (st) => setRenderStatus(st),
      });

      setShots((prev) =>
        prev.map((s) =>
          s.id === currentShot.id
            ? {
                ...s,
                takes: [extendedTake, ...s.takes],
                masterTakeId: extendedTake.takeId,
                targetDurationSeconds: s.targetDurationSeconds + 8,
              }
            : s
        )
      );

      setPreviewTakeUrl(extendedTake.videoUrl);
      onCreditDeducted(5);
      setRenderStatus('✓ Đã nối thêm 8 giây thành công bằng Veo 3.1 Lite! Khấu trừ 5 Credits.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Lỗi kéo dài cảnh +8s.');
    } finally {
      setIsExtending8s(false);
    }
  };

  // 5. Cập nhật Giọng Nói Tùy Chỉnh (Custom Voice Styling)
  const handleSaveVoiceStyling = () => {
    if (!currentShot) return;
    const spec: VoiceStyleSpec = {
      voicePreset,
      voiceEmotionPrompt,
    };

    setShots((prev) =>
      prev.map((s) => (s.id === currentShot.id ? { ...s, voiceSpec: spec } : s))
    );
    setRenderStatus('✓ Đã đồng bộ phong cách giọng nói tùy chỉnh cho phân cảnh này!');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#07090E] text-slate-100">
      {/* SHOT ROSTER */}
      <div className="w-full md:w-80 bg-[#0A0D15] border-r border-[#1B2334] flex flex-col shrink-0">
        <div className="p-3 border-b border-[#1B2334] flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#FF9900]">camera_roll</span>
              PRODUCTION DECK
            </div>
            <div className="text-[10px] font-mono text-slate-400">{shots.length} CẢNH QUAY</div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/30 font-bold">
            ULTRA TIER
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {shots.map((shot) => {
            const isActive = shot.id === currentShot?.id;
            const hasStartKeyframe = Boolean(shot.startKeyframeUrl);
            const takesCount = shot.takes.length;

            return (
              <div
                key={shot.id}
                onClick={() => setActiveShotId(shot.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer relative select-none ${
                  isActive
                    ? 'bg-[#151E30] border-[#FF9900] shadow-[0_0_12px_rgba(255,153,0,0.2)]'
                    : 'bg-[#0E121B] border-[#1C2538] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs text-white">
                    CẢNH #{shot.shotNumber}: {shot.sceneHeading}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-black/40 text-[#00F0FF]">
                    {shot.targetDurationSeconds}s
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-[#1C2538]">
                  <span className={`flex items-center gap-1 ${hasStartKeyframe ? 'text-cyan-400' : 'text-slate-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasStartKeyframe ? 'bg-cyan-400' : 'bg-slate-600'}`}></span>
                    {hasStartKeyframe ? 'KEYFRAME SẴN' : 'CHỜ TỔNG HỢP'}
                  </span>
                  <span className={takesCount > 0 ? 'text-[#FF9900] font-bold' : 'text-slate-600'}>
                    {takesCount} TAKES
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WORKSPACE CHÍNH */}
      {currentShot ? (
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top Bar với 4 Chế độ Chức Năng */}
          <div className="p-3 bg-[#0B0E16] border-b border-[#1A2234] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-white">
                CẢNH #{currentShot.shotNumber}: {currentShot.sceneHeading}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-bold">
                ✓ AUTO-BIND READY
              </span>
            </div>

            {/* Chuyển đổi tính năng */}
            <div className="flex items-center bg-[#101420] p-1 rounded-lg border border-[#1E273C] gap-1 overflow-x-auto">
              <button
                onClick={() => setDeckTab('keyframe')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                  deckTab === 'keyframe'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-[#00F0FF] border border-[#00F0FF]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">palette</span>
                <span>1. BƯỚC ĐỆM VÀNG</span>
              </button>

              <button
                onClick={() => setDeckTab('camera_takes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                  deckTab === 'camera_takes'
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-[#FF9900] border border-[#FF9900]/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">movie</span>
                <span>2. BẤM MÁY VEO & OMNI</span>
              </button>

              {/* TÍNH NĂNG ĐỘC QUYỀN 1 */}
              <button
                onClick={() => setDeckTab('conversational_edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                  deckTab === 'conversational_edit'
                    ? 'bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 text-fuchsia-400 border border-fuchsia-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
                <span>🪄 SỬA BẰNG LỜI NÓI</span>
              </button>

              {/* TÍNH NĂNG ĐỘC QUYỀN 3 */}
              <button
                onClick={() => setDeckTab('voice_styling')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                  deckTab === 'voice_styling'
                    ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">mic</span>
                <span>🎙️ GIỌNG NÓI TÙY CHỈNH</span>
              </button>
            </div>
          </div>

          {renderStatus && (
            <div className="mx-4 mt-3 p-2.5 rounded bg-[#FF9900]/10 border border-[#FF9900]/30 text-xs font-mono text-[#FF9900] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <span>{renderStatus}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mx-4 mt-3 p-2.5 rounded bg-rose-950/40 border border-rose-500/30 text-xs font-mono text-rose-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: BƯỚC ĐỆM VÀNG (KEYFRAME SYNTHESIS) */}
          {deckTab === 'keyframe' && (
            <div className="p-4 space-y-4">
              <div className="bg-[#0B0E16] border border-[#1A2234] rounded-xl p-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1A2234]">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      BƯỚC ĐỆM VÀNG (MASTER START FRAME COMPOSITING)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hợp nhất ảnh DNA Nhân vật, Vũ khí và Bối cảnh thành 1 Start Frame hoàn chỉnh bằng Nano Banana Pro (0 Credits).
                    </p>
                  </div>

                  <button
                    onClick={() => handleSynthesizeKeyframe('start')}
                    disabled={isSynthesizingStartFrame}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#00F0FF] to-[#0284C7] hover:brightness-110 text-black font-mono font-bold text-xs rounded shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isSynthesizingStartFrame ? 'progress_activity' : 'palette'}
                    </span>
                    <span>{isSynthesizingStartFrame ? 'ĐANG TỔNG HỢP...' : '🎨 TỔNG HỢP START FRAME (0 CR)'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentShot.referenceSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="bg-[#0E121B] border border-[#1E2638] rounded-xl p-3 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-[#00F0FF] truncate">
                          {slot.tag}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600 font-bold">
                          ✓ ĐÃ ĐIỀN
                        </span>
                      </div>

                      <div className="h-36 bg-[#07090F] rounded-lg border border-[#161D2B] flex items-center justify-center overflow-hidden mb-2 relative">
                        <img src={slot.imageUrl} alt={slot.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-slate-300">
                          {slot.role.toUpperCase()}
                        </div>
                      </div>

                      <div className="text-xs font-mono text-white truncate mb-2">{slot.name}</div>
                    </div>
                  ))}
                </div>

                {/* Kết quả Start Keyframe */}
                <div className="mt-4 pt-4 border-t border-[#1A2234]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      MASTER START KEYFRAME (ĐÃ KHÓA BỐ CỤC CHO VEO / OMNI)
                    </span>
                    {currentShot.startKeyframeUrl && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">✓ SẴN SÀNG CHO MÁY QUAY</span>
                    )}
                  </div>

                  <div className="aspect-video max-h-72 bg-black rounded-lg border border-[#151C2A] flex items-center justify-center overflow-hidden">
                    {currentShot.startKeyframeUrl ? (
                      <img
                        src={currentShot.startKeyframeUrl}
                        alt="Master Keyframe Start"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-500 font-mono text-xs">
                        Bấm nút "🎨 TỔNG HỢP START FRAME" để tạo khung hình xuất phát cho phân cảnh này.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BẤM MÁY (CAMERA TAKES & +8s EXTEND) */}
          {deckTab === 'camera_takes' && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-[#05060A] rounded-xl border border-[#1A2234] overflow-hidden flex flex-col">
                    <div className="h-8 bg-[#090C12] px-3 border-b border-[#1A2234] flex items-center justify-between text-xs font-mono text-slate-400">
                      <span className="text-white font-bold">MONITOR FOOTAGE</span>
                      <span>{selectedModel} • {durationSeconds}s</span>
                    </div>

                    <div className="aspect-video bg-black flex items-center justify-center relative">
                      {previewTakeUrl || activeMasterTake?.videoUrl ? (
                        <video
                          src={previewTakeUrl || activeMasterTake?.videoUrl}
                          controls
                          autoPlay
                          loop
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-8 text-slate-500 font-mono text-xs">
                          Chưa có footage nào. Chọn Model và bấm máy bên phải!
                        </div>
                      )}
                    </div>

                    {/* TÍNH NĂNG ĐỘC QUYỀN 2: NÚT KÉO DÀI CẢNH (+8S EXTEND) */}
                    {activeMasterTake && (
                      <div className="p-3 bg-[#0E121B] border-t border-[#1A2234] flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">add_circle</span>
                            TÍNH NĂNG ĐỘC QUYỀN: KÉO DÀI CẢNH (+8S EXTEND)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Nối tiếp 8 giây mượt mà bằng Veo 3.1 Lite (chỉ tốn 5 credits)
                          </span>
                        </div>

                        <button
                          onClick={handleExtend8s}
                          disabled={isExtending8s}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-mono font-bold text-xs rounded-lg shadow-[0_0_12px_rgba(255,153,0,0.3)] transition-all disabled:opacity-40 flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isExtending8s ? 'hourglass_top' : 'fast_forward'}
                          </span>
                          <span>{isExtending8s ? 'ĐANG KÉO DÀI...' : '➕ KÉO DÀI +8S (5 CREDITS)'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bảng điều khiển Model, Thời lượng & Bấm máy */}
                <div className="bg-[#0C0F17] rounded-xl border border-[#1C2436] p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-xs font-mono font-bold text-white uppercase block border-b border-slate-800 pb-2">
                      MÔ HÌNH & THỜI LƯỢNG QUAY (ULTRA TIER)
                    </span>

                    {/* Model Picker */}
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">MÔ HÌNH VIDEO</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value as FlowVideoModelName)}
                        className="w-full bg-[#121624] border border-[#212A3E] rounded p-2 text-xs font-mono text-[#00F0FF] focus:outline-none"
                      >
                        <option value="Omni 1.1 Flash">Omni 1.1 Flash (360p Draft: 4-7 cr | Free Upscale 720p)</option>
                        <option value="Veo 3.1 - Lite">Veo 3.1 - Lite (5 cr / shot 720p)</option>
                        <option value="Veo 3.1 - Fast">Veo 3.1 - Fast (10 cr / shot 720p)</option>
                        <option value="Veo 3.1 - Quality">Veo 3.1 - Quality (100 cr / 4K Master)</option>
                      </select>
                    </div>

                    {/* Lựa chọn thời lượng (4s, 6s, 8s, 10s) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-mono text-slate-400">THỜI LƯỢNG SHOT</label>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">{durationSeconds} GIÂY</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[4, 6, 8, 10].map((sec) => {
                          const isOmniOnly = sec === 10 && selectedModel !== 'Omni 1.1 Flash';
                          return (
                            <button
                              key={sec}
                              type="button"
                              disabled={isOmniOnly}
                              onClick={() => setDurationSeconds(sec)}
                              className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                                durationSeconds === sec
                                  ? 'bg-[#FF9900] text-black shadow-[0_0_10px_rgba(255,153,0,0.4)]'
                                  : isOmniOnly
                                  ? 'bg-[#151822] text-slate-600 opacity-40 cursor-not-allowed'
                                  : 'bg-[#141A28] text-slate-300 hover:bg-[#1E2638]'
                              }`}
                            >
                              {sec}s
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bảng tính Credit tức thời */}
                    <div className="p-2.5 bg-[#080A10] rounded-lg border border-[#161D2C] text-[11px] font-mono space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Chi phí cảnh này:</span>
                        <span className="text-[#00F0FF] font-bold">{prospectiveCredits} Credits</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[10px]">
                        <span>Độ phân giải:</span>
                        <span className="text-slate-300">{selectedModel === 'Omni 1.1 Flash' ? '360p Draft (Auto 720p)' : '720p HD'}</span>
                      </div>
                    </div>

                    {/* Nút Bấm máy chính thức */}
                    <button
                      onClick={handleRollTake}
                      disabled={isRenderingTake}
                      className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:brightness-110 text-white rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.35)] transition-all disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isRenderingTake ? 'hourglass_top' : 'movie'}
                      </span>
                      <span>{isRenderingTake ? 'ĐANG BẤM MÁY...' : `BẤM MÁY ROLL (-${prospectiveCredits} CR)`}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TÍNH NĂNG ĐỘC QUYỀN 1 - SỬA NHANH BẰNG LỜI NÓI */}
          {deckTab === 'conversational_edit' && (
            <div className="p-4 space-y-4">
              <div className="bg-[#0B0E16] border border-[#1A2234] rounded-xl p-4 space-y-4">
                <div className="border-b border-[#1A2234] pb-3">
                  <span className="text-xs font-mono font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                    SỬA NHANH BẰNG LỜI NÓI (CONVERSATIONAL VIDEO / IMAGE EDIT)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nhập câu lệnh tiếng Việt tự nhiên (ví dụ: "Thêm khói lửa", "Đổi ánh sáng sang buổi tối", "Xóa vật thể thừa"). Hệ thống sẽ gọi Gemini Omni Flash (Video-to-Video Edit) hoặc Nano Banana Pro sửa trực tiếp mà không làm thay đổi bố cục gốc.
                  </p>
                </div>

                {/* Chọn đối tượng sửa */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditTarget('video_take')}
                    className={`flex-1 p-3 rounded-lg border text-left font-mono transition-all ${
                      editTarget === 'video_take'
                        ? 'bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-300 shadow-[0_0_10px_rgba(217,70,239,0.2)]'
                        : 'bg-[#101420] border-[#1E2638] text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold mb-0.5">🎬 Sửa trực tiếp trên Video Take đã tạo</div>
                    <div className="text-[10px] text-slate-400">Sử dụng Omni 1.1 Flash Video-to-Video Edit (10-20 Credits)</div>
                  </button>

                  <button
                    onClick={() => setEditTarget('keyframe_image')}
                    className={`flex-1 p-3 rounded-lg border text-left font-mono transition-all ${
                      editTarget === 'keyframe_image'
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-[#101420] border-[#1E2638] text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold mb-0.5">🎨 Sửa trên Master Keyframe</div>
                    <div className="text-[10px] text-slate-400">Sử dụng 🍌 Nano Banana Pro (0 Credits trên Ultra)</div>
                  </button>
                </div>

                {/* Ô nhập câu lệnh tiếng Việt */}
                <div>
                  <label className="text-[10px] font-mono text-slate-300 block mb-1">
                    CÂU LỆNH CHỈNH SỬA BẰNG TIẾNG VIỆT ĐỜI THƯỜNG:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={conversationalPrompt}
                      onChange={(e) => setConversationalPrompt(e.target.value)}
                      placeholder="Ví dụ: Thêm khói lửa bốc lên từ ngực giáp, đổi ánh sáng sang buổi tối neon..."
                      className="flex-1 bg-[#121624] border border-[#212A3E] rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-400 font-mono"
                    />

                    <button
                      onClick={handleExecuteConversationalEdit}
                      disabled={isConversationalEditing || !conversationalPrompt.trim()}
                      className="px-5 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:brightness-110 text-white font-mono font-bold text-xs rounded shadow-lg transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isConversationalEditing ? 'progress_activity' : 'magic_button'}
                      </span>
                      <span>{isConversationalEditing ? 'ĐANG SỬA...' : 'ÁP DỤNG CHỈNH SỬA'}</span>
                    </button>
                  </div>
                </div>

                {/* Gợi ý lệnh nhanh */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-500">Gợi ý nhanh:</span>
                  {[
                    'Thêm khói lửa bốc lên ngùn ngụt',
                    'Đổi ánh sáng sang buổi tối neon cyberpunk',
                    'Thêm tia sét điện từ xung quanh vũ khí',
                    'Làm mờ chuyển động phông nền tốc độ cao',
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setConversationalPrompt(preset)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131826] hover:bg-[#1E253A] text-slate-300 border border-slate-700"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TÍNH NĂNG ĐỘC QUYỀN 3 - GIỌNG NÓI TÙY CHỈNH (CUSTOM VOICE STYLING) */}
          {deckTab === 'voice_styling' && (
            <div className="p-4 space-y-4">
              <div className="bg-[#0B0E16] border border-[#1A2234] rounded-xl p-4 space-y-4">
                <div className="border-b border-[#1A2234] pb-3">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">record_voice_over</span>
                    GIỌNG NÓI TÙY CHỈNH (CUSTOM VOICE STYLING)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Chọn giọng đọc mẫu chuẩn Hollywood và nhập câu lệnh mô tả cảm xúc giọng nói cho từng cảnh để AI đồng bộ phong cách thoại.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Chọn Voice Preset */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-300 block mb-1">GIỌNG ĐỌC MẪU (VOICE PRESET)</label>
                    <div className="space-y-2">
                      {[
                        { id: 'pilot_male_calm', name: 'Kaien Val (Phi công nam - Điềm tĩnh & Dứt khoát)' },
                        { id: 'commander_female_authoritative', name: 'Chỉ Huy Trưởng Sarah (Nữ chỉ huy - Đanh thép)' },
                        { id: 'ai_system_cold', name: 'Hệ Thống AI Tàu Vũ Trụ (Giọng máy - Lạnh lùng 0 cảm xúc)' },
                        { id: 'warrior_deep_grit', name: 'Chiến Binh Cựu Binh (Giọng trầm khàn - Đầy sương gió)' },
                      ].map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setVoicePreset(item.id as any)}
                          className={`p-2.5 rounded-lg border cursor-pointer font-mono text-xs transition-all ${
                            voicePreset === item.id
                              ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                              : 'bg-[#101420] border-[#1E2638] text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Câu lệnh mô tả cảm xúc giọng nói */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-mono text-slate-300 block mb-1">
                        CÂU LỆNH MÔ TẢ CẢM XÚC GIỌNG NÓI CHO CẢNH NÀY:
                      </label>
                      <textarea
                        rows={4}
                        value={voiceEmotionPrompt}
                        onChange={(e) => setVoiceEmotionPrompt(e.target.value)}
                        placeholder="Mô tả cảm xúc: Giọng thở gấp dưới áp lực gia tốc 9G, giọng thét căm hờn khi trúng đạn..."
                        className="w-full bg-[#121624] border border-[#212A3E] rounded p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-mono resize-none"
                      />
                    </div>

                    <button
                      onClick={handleSaveVoiceStyling}
                      className="w-full py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-mono font-bold text-xs rounded transition-all"
                    >
                      LƯU CẤU HÌNH GIỌNG NÓI CHO SHOT NÀY
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};