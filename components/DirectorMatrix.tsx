import React, { useState } from 'react';
import { Flow } from 'flow-sdk';
import { 
  TimelineShot, 
  WorldEntity, 
  EnvironmentStage, 
  ActionPacingStyle, 
  CameraTransitionType, 
  LensPreset,
  VideoTake,
  EpisodeContinuityPack,
  UserExperienceMode
} from '../types/cinemaCore';
import { deconstructActionScript } from '../services/actionDirectorEngine';
import { telemetry } from '../services/creditTelemetry';
import { STARTER_TEMPLATES, instantiateTemplateShots } from '../constants/starterTemplates';
import { translateAndExpandPrompt } from '../services/promptCinematicTranslator';
import { buildAutoBoundReferenceSlots } from '../services/autoBindIngredients';

interface DirectorMatrixProps {
  shots: TimelineShot[];
  setShots: React.Dispatch<React.SetStateAction<TimelineShot[]>>;
  activeShotId: string;
  setActiveShotId: (id: string) => void;
  entities: WorldEntity[];
  stages: EnvironmentStage[];
  continuityPack: EpisodeContinuityPack | null;
  setContinuityPack: React.Dispatch<React.SetStateAction<EpisodeContinuityPack | null>>;
  userMode: UserExperienceMode;
  onCreditDeducted: (amt: number) => void;
  onNavigateTab: (tab: 'vault' | 'director' | 'production' | 'assembly') => void;
}

export const DirectorMatrix: React.FC<DirectorMatrixProps> = ({
  shots,
  setShots,
  activeShotId,
  setActiveShotId,
  entities,
  stages,
  continuityPack,
  setContinuityPack,
  userMode,
  onCreditDeducted,
  onNavigateTab,
}) => {
  // Script Input States
  const [scriptInput, setScriptInput] = useState<string>(
    'ARES-09 hạ cánh thẳng xuống bến cảng Orbital Dock. Vừa trúng tên lửa EMP tầm nhiệt, giáp ngực bị xé toạc tóe tia lửa điện. Đột ngột quay ngoắt đại bác Plasma bắn trả tiêu diệt phi đội tàng hình đối phương!'
  );
  const [pacingStyle, setPacingStyle] = useState<ActionPacingStyle>('martial_arts_fast');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isDeconstructing, setIsDeconstructing] = useState(false);
  const [isTranslatingPrompt, setIsTranslatingPrompt] = useState(false);
  const [directorLog, setDirectorLog] = useState<string>('');

  // 1-Click Auto Pipeline State (Cho chế độ người mới)
  const [isAutoPipelineRunning, setIsAutoPipelineRunning] = useState(false);
  const [autoPipelineStageText, setAutoPipelineStageText] = useState<string>('');

  // Current selected shot
  const currentShot = shots.find((s) => s.id === activeShotId) || shots[0] || null;
  const currentEntity = entities.find((e) => e.id === currentShot?.primaryEntityId) || entities[0];
  const currentStage = stages.find((s) => s.id === currentShot?.environmentStageId) || stages[0];

  // 4. Áp dụng Mẫu 1-Click Starter Template
  const handleApplyTemplate = (templateId: string) => {
    const tpl = STARTER_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;

    setScriptInput(tpl.rawScript);
    setPacingStyle(tpl.pacingStyle);
    setAspectRatio(tpl.aspectRatio);

    const generatedShots = instantiateTemplateShots(tpl, entities, stages);
    setShots(generatedShots);
    setActiveShotId(generatedShots[0].id);
    setDirectorLog(`✓ Đã kích hoạt kịch bản "${tpl.name}" với góc máy và nhịp độ tối ưu sẵn!`);
  };

  // 2. Tự động dịch Tiếng Việt Đời Thường sang Prompt Điện Ảnh Chuẩn Hollywood
  const handleAITranslatePrompt = async () => {
    if (!scriptInput.trim()) return;
    setIsTranslatingPrompt(true);
    setDirectorLog('Omni 1.1 Flash đang chuyển ý tưởng tiếng Việt sang Prompt điện ảnh Hollywood...');

    try {
      const result = await translateAndExpandPrompt(scriptInput, 'action_camera');
      setScriptInput(result.cinematicEnglishPrompt);
      if (currentShot && result.audioSfxPrompt) {
        setShots((prev) =>
          prev.map((s) =>
            s.id === currentShot.id
              ? {
                  ...s,
                  activePrompt: result.cinematicEnglishPrompt,
                  audioSpec: { ...s.audioSpec, sfxLayer: result.audioSfxPrompt || s.audioSpec.sfxLayer },
                }
              : s
          )
        );
      }
      setDirectorLog('✨ Đã viết Prompt điện ảnh chuẩn quốc tế thành công!');
    } catch (err: any) {
      console.error(err);
      setDirectorLog('Lỗi khi dịch prompt: ' + (err?.message || 'Không thể dịch'));
    } finally {
      setIsTranslatingPrompt(false);
    }
  };

  // Bóc tách kịch bản thông thường
  const handleAnalyzeScript = async () => {
    if (!scriptInput.trim()) return;

    setIsDeconstructing(true);
    setDirectorLog('Omni 1.1 Flash đang bóc tách phân cảnh điện ảnh...');

    try {
      const result = await deconstructActionScript(
        scriptInput,
        entities,
        stages,
        aspectRatio
      );
      const generatedShots = result.shots;

      if (generatedShots && generatedShots.length > 0) {
        const shotsWithIngredients = generatedShots.map((s) => ({
          ...s,
          referenceSlots: buildAutoBoundReferenceSlots(
            s,
            result.detectedEntities,
            result.detectedStages[0]
          ),
        }));

        setShots(shotsWithIngredients);
        setActiveShotId(shotsWithIngredients[0].id);
        setDirectorLog(`✓ Đã tạo ${shotsWithIngredients.length} cảnh quay với ảnh tham chiếu tự điền sẵn!`);
      }
    } catch (err: any) {
      console.error(err);
      setDirectorLog('Lỗi phân tích: ' + (err?.message || ''));
    } finally {
      setIsDeconstructing(false);
    }
  };

  // 1. NÚT LỚN "🚀 TỰ ĐỘNG LÀM PHIM A-Z (1-CLICK AUTO PIPELINE)" CHO NGƯỜI MỚI
  const handleRun1ClickAutoPipeline = async () => {
    if (!scriptInput.trim()) return;

    setIsAutoPipelineRunning(true);
    try {
      // Bước 1: Dịch và bóc tách kịch bản
      setAutoPipelineStageText('Bước 1/4: Omni 1.1 Flash đang phân tích cốt truyện và chia cảnh quay...');
      const result = await deconstructActionScript(
        scriptInput,
        entities,
        stages,
        aspectRatio
      );
      const rawShots = result.shots;

      // Bước 2: Tự động gắn nguyên liệu DNA (Auto-Bind Ingredients)
      setAutoPipelineStageText('Bước 2/4: Tự động liên kết thẻ ảnh DNA Nhân vật & Bối cảnh...');
      const readyShots = rawShots.map((shot) => ({
        ...shot,
        referenceSlots: buildAutoBoundReferenceSlots(
          shot,
          result.detectedEntities,
          result.detectedStages[0]
        ),
      }));
      setShots(readyShots);
      setActiveShotId(readyShots[0].id);

      // Bước 3: Tạo Master Keyframe cho Shot đầu tiên bằng Nano Banana Pro
      setAutoPipelineStageText('Bước 3/4: Banana Pro đang tổng hợp ảnh xuất phát (Start Frame)...');
      const targetShot = readyShots[0];
      const validRefIds = targetShot.referenceSlots
        .map((s) => s.mediaId)
        .filter((id): id is string => Boolean(id));

      const keyframeResult = await Flow.generate.image({
        prompt: `Master cinematic establishing keyframe for ${targetShot.sceneHeading}. Blockbuster sci-fi frame.`,
        modelDisplayName: '🍌 Nano Banana Pro',
        aspectRatio: '16:9',
        ...(validRefIds.length > 0 ? { referenceImageMediaIds: validRefIds } : {}),
      });

      const keyframeUrl = `data:${keyframeResult.mimeType};base64,${keyframeResult.base64}`;

      // Bước 4: Quay nháp Shot 1 bằng Omni 1.1 Flash
      setAutoPipelineStageText('Bước 4/4: Máy quay AI đang bấm máy cảnh đầu tiên...');
      const videoResult = await Flow.generate.video({
        prompt: `${targetShot.activePrompt}. Filmed on anamorphic lens. Cinematic lighting.`,
        modelDisplayName: 'Omni 1.1 Flash',
        firstFrameImageMediaId: keyframeResult.mediaId,
        aspectRatio: '16:9',
        durationSeconds: 4,
        resolution: '720p',
      });

      const videoDataUrl = `data:${videoResult.mimeType};base64,${videoResult.base64}`;

      const newTake: VideoTake = {
        takeId: 'take_auto_' + Math.random().toString(36).substring(2, 6),
        shotId: targetShot.id,
        takeNumber: 1,
        modelUsed: 'Omni 1.1 Flash',
        videoUrl: videoDataUrl,
        mediaId: videoResult.mediaId,
        duration: 4,
        resolution: '720p',
        creditCost: 7,
        createdAt: Date.now(),
        isSelectedForMaster: true,
      };

      setShots((prev) =>
        prev.map((s) =>
          s.id === targetShot.id
            ? {
                ...s,
                startKeyframeUrl: keyframeUrl,
                startKeyframeMediaId: keyframeResult.mediaId,
                takes: [newTake],
                masterTakeId: newTake.takeId,
              }
            : s
        )
      );

      telemetry.recordExpenditure('1-Click Auto Pipeline Roll', 7);
      onCreditDeducted(7);

      setAutoPipelineStageText('✓ Hoàn tất Auto-Pipeline! Đang chuyển bạn đến Production Deck...');
      setTimeout(() => {
        setIsAutoPipelineRunning(false);
        onNavigateTab('production');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setAutoPipelineStageText('Lỗi tự động hóa: ' + (err?.message || 'Không thể hoàn tất tự động'));
      setIsAutoPipelineRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#07090E] text-slate-100">
      {/* 4. BỘ THƯ VIỆN MẪU (1-CLICK STARTER TEMPLATES) */}
      <div className="bg-[#0B0E16] border-b border-[#1A2234] px-4 py-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase">
            <span className="material-symbols-outlined text-[16px]">auto_stories</span>
            BỘ THƯ VIỆN MẪU CÀI SẴN (1-CLICK STARTER TEMPLATES CHO NGƯỜI MỚI)
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Tối ưu sẵn góc quay, kịch bản và nhịp độ chỉ với 1 cú click
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {STARTER_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleApplyTemplate(tpl.id)}
              className="p-2.5 rounded-lg bg-[#111624] hover:bg-[#182033] border border-[#202B40] hover:border-amber-400/50 text-left transition-all flex items-start gap-2.5 group"
            >
              <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[18px]">{tpl.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-mono font-bold text-white truncate">{tpl.name}</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700">
                    {tpl.badge}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1">{tpl.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* TOP DIRECTING BAR: Ý TƯỞNG & TỰ ĐỘNG HÓA */}
      <div className="bg-[#0A0D15] border-b border-[#1A2234] p-3 shrink-0">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-[#00F0FF] uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              Ý TƯỞNG PHIM BẰNG TIẾNG VIỆT ĐỜI THƯỜNG
            </span>

            {/* 2. Nút AI Tự Viết Prompt Chuẩn */}
            <button
              onClick={handleAITranslatePrompt}
              disabled={isTranslatingPrompt || !scriptInput.trim()}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/40 text-xs font-mono font-bold transition-all disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isTranslatingPrompt ? 'sync' : 'auto_fix_high'}
              </span>
              <span>{isTranslatingPrompt ? 'Đang dịch...' : '✨ AI Tự Viết Prompt Chuẩn'}</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={scriptInput}
              onChange={(e) => setScriptInput(e.target.value)}
              placeholder="Gõ ý tưởng bằng tiếng Việt (ví dụ: Mecha đáp xuống cảng, bắn tên lửa tiêu diệt tàu địch)..."
              className="flex-1 bg-[#111624] border border-[#222E46] rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF] font-mono"
            />

            {/* 1. NÚT LỚN "🚀 TỰ ĐỘNG LÀM PHIM A-Z (1-CLICK AUTO PIPELINE)" */}
            {userMode === 'easy_autopilot' ? (
              <button
                onClick={handleRun1ClickAutoPipeline}
                disabled={isAutoPipelineRunning || !scriptInput.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-black font-mono font-bold text-xs rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isAutoPipelineRunning ? 'progress_activity' : 'rocket_launch'}
                </span>
                <span>
                  {isAutoPipelineRunning ? 'HỆ THỐNG ĐANG TỰ ĐỘNG CHẠY...' : '🚀 TỰ ĐỘNG LÀM PHIM A-Z (1-CLICK)'}
                </span>
              </button>
            ) : (
              <button
                onClick={handleAnalyzeScript}
                disabled={isDeconstructing || !scriptInput.trim()}
                className="px-4 py-2 bg-gradient-to-r from-[#00F0FF] to-[#0284C7] hover:brightness-110 text-black font-mono font-bold text-xs rounded shadow-[0_0_12px_rgba(0,240,255,0.35)] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isDeconstructing ? 'progress_activity' : 'psychology'}
                </span>
                <span>{isDeconstructing ? 'ĐANG CHIA CẢNH...' : 'PHÂN TÍCH KỊCH BẢN PRO'}</span>
              </button>
            )}
          </div>

          {/* Banner tiến độ Auto-Pipeline */}
          {isAutoPipelineRunning && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded text-xs font-mono text-emerald-300 flex items-center gap-2 animate-pulse">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <span>{autoPipelineStageText}</span>
            </div>
          )}
        </div>
      </div>

      {/* WORKSPACE CHÍNH */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* CỘT DANH SÁCH CẢNH QUAY */}
        <div className="w-full md:w-80 bg-[#0A0D15] border-r border-[#1B2334] flex flex-col shrink-0">
          <div className="p-2.5 border-b border-[#1B2334] flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#00F0FF]">dashboard</span>
              DANH SÁCH CẢNH ({shots.length} SHOTS)
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">✓ AUTO-BOUND READY</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            {shots.map((shot) => {
              const isActive = shot.id === currentShot?.id;
              const hasVideo = shot.takes.length > 0;
              return (
                <div
                  key={shot.id}
                  onClick={() => setActiveShotId(shot.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer relative select-none ${
                    isActive
                      ? 'bg-[#141C2D] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'bg-[#0E121B] border-[#1C2538] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-white">
                      CẢNH #{shot.shotNumber}: {shot.sceneHeading}
                    </span>
                    <span className="text-[9px] font-mono text-[#00F0FF]">{shot.targetDurationSeconds}s</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono line-clamp-2 leading-relaxed">
                    {shot.scriptDescription}
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-[#1C2538] flex items-center justify-between text-[10px] font-mono">
                    <span className="text-amber-400">
                      {shot.referenceSlots?.length || 3} Thẻ DNA gắn sẵn
                    </span>
                    <span className={hasVideo ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                      {hasVideo ? '✓ ĐÃ CÓ VIDEO' : 'CHỜ QUAY'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT CHỈ ĐẠO CẢNH */}
        {currentShot ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
            <div className="bg-[#0B0E16] border border-[#1A2234] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1A2234]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-white">
                    CHI TIẾT CẢNH #{currentShot.shotNumber}: {currentShot.sceneHeading}
                  </span>
                </div>
                <button
                  onClick={() => onNavigateTab('production')}
                  className="px-3 py-1 bg-[#FF9900]/20 hover:bg-[#FF9900]/30 text-[#FF9900] border border-[#FF9900]/40 rounded text-xs font-mono font-bold transition-all"
                >
                  SANG PRODUCTION DECK →
                </button>
              </div>

              {/* Mô tả & Prompt */}
              <div className="space-y-3 font-mono">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">MÔ TẢ HÀNH ĐỘNG CỦA CẢNH:</label>
                  <textarea
                    rows={2}
                    value={currentShot.scriptDescription}
                    onChange={(e) =>
                      setShots((prev) =>
                        prev.map((s) => (s.id === currentShot.id ? { ...s, scriptDescription: e.target.value } : s))
                      )
                    }
                    className="w-full bg-[#121624] border border-[#222E46] rounded p-2 text-xs text-white focus:outline-none focus:border-[#00F0FF] resize-none"
                  />
                </div>

                {/* 1. ẨN CÁC THÔNG SỐ KỸ THUẬT PHỨC TẠP KHI Ở CHẾ ĐỘ NGƯỜI MỚI */}
                {userMode === 'director_pro' && (
                  <div className="p-3 bg-[#0E121B] border border-[#1C2538] rounded-lg space-y-3">
                    <span className="text-[11px] font-bold text-cyan-400 block">
                      THÔNG SỐ KỸ THUẬT NÂNG CAO (PRO CONTROLS)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">ỐNG KÍNH ĐIỆN ẢNH (LENS MM):</label>
                        <select
                          value={currentShot.lensPreset}
                          onChange={(e) =>
                            setShots((prev) =>
                              prev.map((s) => (s.id === currentShot.id ? { ...s, lensPreset: e.target.value as LensPreset } : s))
                            )
                          }
                          className="w-full bg-[#141A28] border border-[#232F48] rounded p-1.5 text-xs text-cyan-300 focus:outline-none"
                        >
                          <option value="16mm_UltraWide_Scale">16mm Ultra-Wide Scale</option>
                          <option value="24mm_Anamorphic_Action">24mm Anamorphic Action</option>
                          <option value="50mm_Cinematic">50mm Cinematic Master</option>
                          <option value="85mm_Dramatic_CloseUp">85mm Dramatic CloseUp</option>
                          <option value="FPV_Dynamic_Chase">FPV Dynamic Chase Lens</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">CHUYỂN CẢNH (CAMERA TRANSITION):</label>
                        <select
                          value={currentShot.cameraTransitionType}
                          onChange={(e) =>
                            setShots((prev) =>
                              prev.map((s) => (s.id === currentShot.id ? { ...s, cameraTransitionType: e.target.value as CameraTransitionType } : s))
                            )
                          }
                          className="w-full bg-[#141A28] border border-[#232F48] rounded p-1.5 text-xs text-amber-300 focus:outline-none"
                        >
                          <option value="HARD_CUT_NEW_ANGLE">Đổi Góc Máy Mới (Hard Cut)</option>
                          <option value="CONTINUOUS_MATCH_FRAME">Nối Mượt Liên Hoàn (Match Cut)</option>
                          <option value="A_TO_B_BRIDGE">Kẹp Đầu - Đuôi (A-to-B Bridge)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Danh sách thẻ DNA đã tự động điền */}
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1.5">
                    ✓ 3 THẺ ẢNH THAM CHIẾU ĐÃ TỰ ĐỘNG ĐIỀN (AUTO-BOUND TỪ WORLD BIBLE):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {currentShot.referenceSlots.map((slot) => (
                      <div key={slot.id} className="p-2 rounded bg-[#0E131E] border border-[#1E273C] flex items-center gap-2">
                        <img
                          src={slot.imageUrl}
                          alt={slot.name}
                          className="w-10 h-10 rounded object-cover border border-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="text-[10px] text-cyan-400 font-bold truncate">{slot.tag}</div>
                          <div className="text-[9px] text-slate-300 truncate">{slot.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
            Chọn một cảnh quay để xem chi tiết
          </div>
        )}
      </div>
    </div>
  );
};