import React, { useState } from 'react';
import { Flow } from 'flow-sdk';
import { 
  WorldEntity, 
  EnvironmentStage, 
  EntityConditionState, 
  EntityCategory, 
  TurnaroundSheet,
  UserExperienceMode
} from '../types/cinemaCore';
import { telemetry } from '../services/creditTelemetry';
import { translateAndExpandPrompt } from '../services/promptCinematicTranslator';

interface WorldBibleVaultProps {
  entities: WorldEntity[];
  setEntities: React.Dispatch<React.SetStateAction<WorldEntity[]>>;
  stages: EnvironmentStage[];
  setStages: React.Dispatch<React.SetStateAction<EnvironmentStage[]>>;
  activeEntityId: string;
  setActiveEntityId: (id: string) => void;
  activeStageId: string;
  setActiveStageId: (id: string) => void;
  userMode: UserExperienceMode;
  onCreditDeducted: (amt: number) => void;
}

// 2. Việt hóa dễ hiểu các nhãn trạng thái ở Tab 1 kèm chú thích rõ ràng
const STATE_CONFIGS: { 
  state: EntityConditionState; 
  label: string; 
  subtitle: string;
  badgeColor: string; 
  promptModifier: string; 
  icon: string 
}[] = [
  {
    state: 'pristine_normal',
    label: '1. Bình thường / Nguyên vẹn',
    subtitle: 'Normal / Pristine: Giáp bóng loáng trong hangar, ánh sáng chuẩn 8K',
    badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/30',
    promptModifier: 'pristine condition, factory clean armor plating, glossy titanium alloy, neutral hangar studio lighting, sharp 8k details',
    icon: 'verified',
  },
  {
    state: 'combat_mode',
    label: '2. Sẵn sàng chiến đấu / Trưng bày',
    subtitle: 'Action / Showcase: Động cơ phát sáng, vũ khí mở sẵn sàng khai hỏa',
    badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-950/30',
    promptModifier: 'tactical combat deployment mode, thrusters glowing cyan energy, weapon hardpoints deployed, visor glowing neon, aggressive battle posture',
    icon: 'swords',
  },
  {
    state: 'battle_damaged',
    label: '3. Bị thương / Hư hại giáp',
    subtitle: 'Battle Damaged: Vết cháy xém đạn pháo, giáp vỡ toác tóe tia lửa điện',
    badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-950/30',
    promptModifier: 'severe heavy battle damage, scorched blast marks, exposed sparking high voltage fiber wiring, leaking hydraulic fluid, smoking armor ruptures',
    icon: 'destruction',
  },
  {
    state: 'awakened_overdrive',
    label: '4. Tung chiêu cuối / Biến hình',
    subtitle: 'Ultimate / Overdrive: Năng lượng cực hạn, cánh plasma bùng nổ toàn diện',
    badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-950/30',
    promptModifier: 'catastrophic awakened overdrive limit break, blinding plasma coronal aura, radiant particle wings, molten armor seams, quantum overdrive surge',
    icon: 'local_fire_department',
  },
];

export const WorldBibleVault: React.FC<WorldBibleVaultProps> = ({
  entities,
  setEntities,
  stages,
  setStages,
  activeEntityId,
  setActiveEntityId,
  activeStageId,
  setActiveStageId,
  userMode,
  onCreditDeducted,
}) => {
  const [vaultSubTab, setVaultSubTab] = useState<'entities' | 'stages'>('entities');
  const [selectedState, setSelectedState] = useState<EntityConditionState>('pristine_normal');
  const [isForgingDNA, setIsForgingDNA] = useState(false);
  const [forgeStatus, setForgeStatus] = useState<string>('');
  const [forgeError, setForgeError] = useState<string | null>(null);

  // New Entity Form State
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityCategory, setNewEntityCategory] = useState<EntityCategory>('mecha_robot');
  const [newEntityScale, setNewEntityScale] = useState<number>(18.5);
  const [newEntityPalette, setNewEntityPalette] = useState('#00F0FF, #1E293B, #FF9900');
  const [newEntityBio, setNewEntityBio] = useState('Chiến binh mecha hạng nặng trang bị súng từ trường kép.');
  const [isExpandingBio, setIsExpandingBio] = useState(false);

  // Current entity reference
  const currentEntity = entities.find((e) => e.id === activeEntityId) || entities[0];
  const currentStage = stages.find((s) => s.id === activeStageId) || stages[0];

  // AI Tự Viết Prompt Chuẩn cho Bio nhân vật
  const handleAIEnhanceBio = async () => {
    if (!newEntityBio.trim()) return;
    setIsExpandingBio(true);
    try {
      const translated = await translateAndExpandPrompt(newEntityBio, 'character_dna');
      setNewEntityBio(translated.cinematicEnglishPrompt);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExpandingBio(false);
    }
  };

  // Helper to trigger DNA generation via Nano Banana Pro
  const handleForgeTurnaroundSheet = async () => {
    if (!currentEntity) return;

    setIsForgingDNA(true);
    setForgeError(null);
    setForgeStatus('Đang kích hoạt Nano Banana Pro tạo bản Turnaround 4 góc theo DNA chuẩn...');

    const stateMeta = STATE_CONFIGS.find((s) => s.state === selectedState);
    const statePrompt = stateMeta?.promptModifier || '';

    const finalPrompt = `Full character design turnaround sheet for ${currentEntity.name} (${currentEntity.category}), scale: ${currentEntity.scaleMeters}m. 
Color accents: ${currentEntity.primaryColorPalette.join(', ')}. 
Condition: ${statePrompt}. 
Multi-view composite showing 4 orthogonal viewpoints: Front View, 3/4 Dynamic Angle, Left Profile Side View, Rear Back View. 
Clean orthographic studio character turnaround, neutral 18% gray studio backdrop, cinematic soft rim key lighting, hyper-detailed mechanical parts, unreal engine 5 render style, photorealistic sci-fi concept art.`;

    try {
      const result = await Flow.generate.image({
        prompt: finalPrompt,
        modelDisplayName: '🍌 Nano Banana Pro',
        aspectRatio: '16:9',
      });

      const fullDataUrl = `data:${result.mimeType};base64,${result.base64}`;

      setEntities((prev) =>
        prev.map((ent) => {
          if (ent.id !== currentEntity.id) return ent;

          const updatedStates = { ...ent.states };
          updatedStates[selectedState] = {
            state: selectedState,
            stateLabel: stateMeta?.label || selectedState,
            visualPromptAnchor: finalPrompt,
            angles: {
              sheetCompositeUrl: fullDataUrl,
              sheetCompositeMediaId: result.mediaId,
              front: fullDataUrl,
              frontMediaId: result.mediaId,
            },
            updatedAt: Date.now(),
          };

          return {
            ...ent,
            states: updatedStates,
            activePreviewState: selectedState,
          };
        })
      );

      telemetry.recordExpenditure(`Forge DNA [${currentEntity.name} - ${selectedState}]`, 0);
      onCreditDeducted(0);
      setForgeStatus('✓ Đúc DNA thành công! Đã tự động đồng bộ vào Bible Vault.');
    } catch (err: any) {
      console.error(err);
      setForgeError(err?.message || 'Không thể tạo bản vẽ Turnaround DNA.');
    } finally {
      setIsForgingDNA(false);
    }
  };

  const handleCreateEntity = () => {
    if (!newEntityName.trim()) return;

    const newId = 'ent_' + Math.random().toString(36).substring(2, 8);
    const colors = newEntityPalette.split(',').map((c) => c.trim()).filter(Boolean);

    const emptyStates: Record<EntityConditionState, TurnaroundSheet> = {
      pristine_normal: {
        state: 'pristine_normal',
        stateLabel: 'Bình thường / Nguyên vẹn',
        visualPromptAnchor: '',
        angles: {},
        updatedAt: Date.now(),
      },
      combat_mode: {
        state: 'combat_mode',
        stateLabel: 'Sẵn sàng chiến đấu / Trưng bày',
        visualPromptAnchor: '',
        angles: {},
        updatedAt: Date.now(),
      },
      battle_damaged: {
        state: 'battle_damaged',
        stateLabel: 'Bị thương / Hư hại giáp',
        visualPromptAnchor: '',
        angles: {},
        updatedAt: Date.now(),
      },
      awakened_overdrive: {
        state: 'awakened_overdrive',
        stateLabel: 'Tung chiêu cuối / Biến hình',
        visualPromptAnchor: '',
        angles: {},
        updatedAt: Date.now(),
      },
    };

    const newEnt: WorldEntity = {
      id: newId,
      name: newEntityName,
      codeName: newEntityName.toUpperCase().replace(/\s+/g, '_'),
      category: newEntityCategory,
      scaleMeters: newEntityScale,
      primaryColorPalette: colors.length > 0 ? colors : ['#00F0FF', '#1E293B'],
      bioSummary: newEntityBio,
      states: emptyStates,
      signatureSkills: [
        { name: 'Plasma Lance', description: 'Đại bác điện từ xuyên giáp', vfxStyle: 'Tia sáng năng lượng xanh lam' },
      ],
      activePreviewState: 'pristine_normal',
    };

    setEntities((prev) => [...prev, newEnt]);
    setActiveEntityId(newId);
    setNewEntityName('');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#0A0C10] text-slate-100">
      {/* CỘT TRÁI: DANH SÁCH NHÂN VẬT & CHIẾN TRƯỜNG */}
      <div className="w-full md:w-80 bg-[#0C0F17] border-r border-[#1B2232] flex flex-col shrink-0">
        <div className="p-3 border-b border-[#1B2232] flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#131826] p-0.5 rounded border border-[#212A40]">
            <button
              onClick={() => setVaultSubTab('entities')}
              className={`px-3 py-1 rounded text-xs font-mono tracking-wider transition-colors ${
                vaultSubTab === 'entities' ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              NHÂN VẬT ({entities.length})
            </button>
            <button
              onClick={() => setVaultSubTab('stages')}
              className={`px-3 py-1 rounded text-xs font-mono tracking-wider transition-colors ${
                vaultSubTab === 'stages' ? 'bg-[#FF9900]/20 text-[#FF9900] font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              BỐI CẢNH ({stages.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {vaultSubTab === 'entities' ? (
            <>
              {entities.map((entity) => {
                const isActive = entity.id === currentEntity?.id;
                const hasPristine = Boolean(entity.states.pristine_normal.angles.sheetCompositeUrl);
                return (
                  <div
                    key={entity.id}
                    onClick={() => setActiveEntityId(entity.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer select-none ${
                      isActive
                        ? 'bg-[#151B2B] border-[#00F0FF]/50 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                        : 'bg-[#0E121D] border-[#1D2536] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-sm text-white flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#00F0FF]">
                          {entity.category === 'mecha_robot' ? 'precision_manufacturing' : 'person'}
                        </span>
                        {entity.name}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/40 text-slate-400 border border-slate-700">
                        {entity.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>CAO: {entity.scaleMeters}m</span>
                      <span className={`text-[10px] flex items-center gap-1 ${hasPristine ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasPristine ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        {hasPristine ? 'DNA ĐÃ KHÓA' : 'CHƯA ĐÚC'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Tạo nhân vật nhanh có AI hỗ trợ dịch prompt */}
              <div className="p-3 bg-[#0B0E16] rounded-lg border border-dashed border-[#242E46] mt-4 space-y-2">
                <span className="text-[11px] font-mono text-[#00F0FF] uppercase tracking-wider block font-semibold">
                  + Thêm Nhân vật / Mecha Mới
                </span>
                <input
                  type="text"
                  placeholder="Tên nhân vật (ví dụ: ARES-09, Chiến binh Kaien)..."
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  className="w-full bg-[#121724] border border-[#232C42] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00F0FF]"
                />
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400">Mô tả bằng tiếng Việt tự nhiên:</span>
                    <button
                      onClick={handleAIEnhanceBio}
                      disabled={isExpandingBio || !newEntityBio.trim()}
                      className="text-[10px] font-mono text-[#00F0FF] hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[12px]">auto_fix_high</span>
                      <span>{isExpandingBio ? 'Đang dịch...' : '✨ AI Dịch Prompt'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={newEntityBio}
                    onChange={(e) => setNewEntityBio(e.target.value)}
                    placeholder="Gõ tiếng Việt: Robot màu đen viền xanh, gắn đại bác uy lực..."
                    className="w-full bg-[#121724] border border-[#232C42] rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#00F0FF] resize-none"
                  />
                </div>

                <button
                  onClick={handleCreateEntity}
                  disabled={!newEntityName.trim()}
                  className="w-full py-1.5 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] rounded text-xs font-mono font-bold tracking-wider transition-all disabled:opacity-40"
                >
                  TẠO PROTO-DNA
                </button>
              </div>
            </>
          ) : (
            stages.map((stage) => (
              <div
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer select-none ${
                  stage.id === currentStage?.id
                    ? 'bg-[#18151D] border-[#FF9900]/50 shadow-[0_0_12px_rgba(255,153,0,0.15)]'
                    : 'bg-[#0E121D] border-[#1D2536] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sm text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#FF9900]">landscape</span>
                    {stage.name}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  LUT Màu: <span className="text-amber-300">{stage.colorLUT}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CỘT PHẢI: CHI TIẾT DNA & 4 TRẠNG THÁI VIỆT HÓA */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 bg-[#0D111A] border-b border-[#1A2234] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono text-white tracking-wide">{currentEntity.name}</h1>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 font-semibold">
                MÃ: {currentEntity.codeName}
              </span>
              <span className="text-xs font-mono text-slate-400">QUY MÔ: {currentEntity.scaleMeters} METERS</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{currentEntity.bioSummary}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleForgeTurnaroundSheet}
              disabled={isForgingDNA}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00F0FF] to-[#0284C7] hover:brightness-110 text-black font-mono font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isForgingDNA ? 'progress_activity' : 'auto_fix_high'}
              </span>
              <span>{isForgingDNA ? 'ĐANG TẠO DNA...' : `ĐÚC BẢNG TURNAROUND 4 GÓC (0 CREDITS)`}</span>
            </button>
          </div>
        </div>

        {forgeStatus && (
          <div className="mx-4 mt-3 p-2.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-xs font-mono text-[#00F0FF] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
            <span>{forgeStatus}</span>
          </div>
        )}

        {/* 2. Bộ 4 trạng thái Việt hóa rõ ràng */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-[16px] text-[#00F0FF]">reorder</span>
              HỆ THỐNG ĐA TRẠNG THÁI (MULTI-STATE DNA) - ĐÃ VIỆT HÓA DỄ HIỂU
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Mô hình: <strong className="text-[#00F0FF]">🍌 Nano Banana Pro</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STATE_CONFIGS.map((st) => {
              const isSelected = selectedState === st.state;
              const stateData = currentEntity.states[st.state];
              const hasSheet = Boolean(stateData?.angles?.sheetCompositeUrl);

              return (
                <button
                  key={st.state}
                  onClick={() => setSelectedState(st.state)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#151D2E] border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)] scale-[1.02]'
                      : 'bg-[#0E121B] border-[#1C2436] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="material-symbols-outlined text-[20px] text-[#00F0FF]">{st.icon}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${st.badgeColor}`}>
                      {hasSheet ? '✓ ĐÃ CÓ ẢNH' : 'TRỐNG'}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white mb-0.5">{st.label}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {st.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Turnaround Sheet Preview Display */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="bg-[#0B0E14] border border-[#1A2234] rounded-xl p-4 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1A2234]">
              <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase">
                XEM BẢN VẼ: {STATE_CONFIGS.find((s) => s.state === selectedState)?.label}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Ảnh này sẽ tự động gắn làm mỏ neo [IMAGE 1] cho Tab 3
              </span>
            </div>

            <div className="flex-1 min-h-[280px] flex items-center justify-center bg-[#07080B] rounded-lg border border-[#141A28] overflow-hidden relative">
              {currentEntity.states[selectedState]?.angles?.sheetCompositeUrl ? (
                <img
                  src={currentEntity.states[selectedState].angles.sheetCompositeUrl}
                  alt="Turnaround Sheet"
                  className="max-h-[420px] w-auto object-contain rounded shadow-2xl"
                />
              ) : (
                <div className="text-center p-6 max-w-md">
                  <span className="material-symbols-outlined text-[32px] text-slate-600 block mb-2">schema</span>
                  <div className="font-mono text-xs font-bold text-white mb-1">
                    CHƯA CÓ BẢN VẼ DNA CHO TRẠNG THÁI NÀY
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Bấm nút "ĐÚC BẢNG TURNAROUND 4 GÓC" phía trên để Banana Pro tạo ảnh mẫu cho nhân vật.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};