import React, { useState } from 'react';
import {
  EntityDnaProfile,
  EnvironmentStage,
  CreditLedgerState,
} from '../types/cinemaCore';
import { CreditTelemetryService } from '../services/creditTelemetry';

declare const Flow: any;

interface AutoCastSidebarProps {
  entities: EntityDnaProfile[];
  stages: EnvironmentStage[];
  onUpdateEntity: (updated: EntityDnaProfile) => void;
  onUpdateStage: (updated: EnvironmentStage) => void;
  ledger: CreditLedgerState;
}

export const AutoCastSidebar: React.FC<AutoCastSidebarProps> = ({
  entities,
  stages,
  onUpdateEntity,
  onUpdateStage,
  ledger,
}) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleRegenEntityImage = async (
    entity: EntityDnaProfile,
    stateKey: 'NORMAL' | 'DAMAGED_50' | 'OVERDRIVE_100' = entity.activeState
  ) => {
    setGeneratingId(`${entity.id}_${stateKey}`);
    try {
      const statePrompt =
        entity.states[stateKey]?.promptModifier || entity.coreTraitsPrompt;
      const baseMediaId =
        stateKey !== 'NORMAL' ? entity.states.NORMAL.mediaId : undefined;
      const res = await Flow.generate.image({
        prompt: `Character Concept Sheet, ${entity.name} (${stateKey}): ${statePrompt}. Signature weapon: ${entity.signatureWeapon}. Photorealistic 8k cinema character reference.`,
        modelDisplayName: '🍌 Nano Banana Pro',
        referenceImageMediaIds: baseMediaId ? [baseMediaId] : undefined,
        aspectRatio: '16:9',
      });

      CreditTelemetryService.recordTransaction({
        category: 'IMAGE_KEYFRAME',
        modelName: '🍌 Nano Banana Pro',
        creditsUsed: 0,
        description: `Tạo ảnh DNA Nhân vật: ${entity.name} (${stateKey})`,
      });

      const dataUrl = res.base64
        ? `data:${res.mimeType || 'image/jpeg'};base64,${res.base64}`
        : undefined;
      if (dataUrl) {
        onUpdateEntity({
          ...entity,
          activeState: stateKey,
          states: {
            ...entity.states,
            [stateKey]: {
              ...entity.states[stateKey],
              imageUrl: dataUrl,
              mediaId: res.mediaId,
            },
          },
        });
      }
    } catch (e) {
      console.error('Failed to generate entity DNA image', e);
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePickFromLibrary = async (entity: EntityDnaProfile) => {
    if (typeof Flow === 'undefined' || !Flow.media?.select) return;
    try {
      const selected = await Flow.media.select({
        id: `pick_${entity.id}`,
        filter: 'image',
      });
      if (selected?.mediaId) {
        const b64 = await Flow.media.getBase64({ mediaId: selected.mediaId });
        const dataUrl = b64?.base64
          ? `data:${b64.mimeType || 'image/jpeg'};base64,${b64.base64}`
          : undefined;
        const st = entity.activeState;
        onUpdateEntity({
          ...entity,
          states: {
            ...entity.states,
            [st]: {
              ...entity.states[st],
              imageUrl: dataUrl || entity.states[st].imageUrl,
              mediaId: selected.mediaId,
            },
          },
        });
      }
    } catch (e) {
      console.warn('Library pick cancelled or failed:', e);
    }
  };

  const handleRegenStageImage = async (stage: EnvironmentStage) => {
    setGeneratingId(stage.id);
    try {
      const res = await Flow.generate.image({
        prompt: `Wide Cinematic Environment Establishing Shot, ${stage.name}: ${stage.architectureStyle}. Lighting: ${stage.lightingMood}. Weather: ${stage.weatherCondition}. 8k photorealistic movie set.`,
        modelDisplayName: '🍌 Nano Banana Pro',
        aspectRatio: '16:9',
      });
      const dataUrl = res.base64
        ? `data:${res.mimeType || 'image/jpeg'};base64,${res.base64}`
        : undefined;
      if (dataUrl) {
        onUpdateStage({
          ...stage,
          spatialViews: {
            ...stage.spatialViews,
            northUrl: dataUrl,
            northMediaId: res.mediaId,
          },
        });
      }
    } catch (e) {
      console.error('Failed to generate stage image', e);
    } finally {
      setGeneratingId(null);
    }
  };

  const activeStage = stages[0];

  return (
    <aside className="w-72 bg-zinc-950/90 border-r border-white/10 flex flex-col shrink-0 select-none overflow-hidden">
      {/* Header Hồ sơ DNA */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-lg">
            fingerprint
          </span>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
              Hồ Sơ DNA & Bối Cảnh
            </h2>
            <p className="text-[10px] text-zinc-400">
              Khóa Nhân Dạng Đa Trạng Thái (CANVAS)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          {entities.length} DNA
        </span>
      </div>

      {/* Danh sách Nhân vật & Bối cảnh */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {entities.map((entity) => {
          const activeStateObj =
            entity.states[entity.activeState] || entity.states.NORMAL;
          const isBusy =
            generatingId === `${entity.id}_${entity.activeState}`;

          return (
            <div
              key={entity.id}
              className="rounded-xl bg-zinc-900/80 border border-white/10 overflow-hidden shadow-md transition-all hover:border-amber-500/40"
            >
              {/* Khung ảnh Nhân vật */}
              <div className="relative h-32 bg-zinc-950 overflow-hidden group">
                {activeStateObj.imageUrl ? (
                  <img
                    src={activeStateObj.imageUrl}
                    alt={entity.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-1">
                    <span className="material-symbols-outlined text-2xl text-amber-400/60">
                      person_Alert
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Sẽ tự động đúc khi bấm Sản Xuất
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/70 text-amber-300 border border-amber-500/30">
                    {entity.role === 'PROTAGONIST' ? 'CHÍNH DIỆN' : 'ĐỐI THỦ'}
                  </span>
                  {activeStateObj.mediaId && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      LOCKED
                    </span>
                  )}
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={() => handlePickFromLibrary(entity)}
                    title="Chọn ảnh có sẵn từ Thư viện Flow"
                    className="p-1.5 rounded-lg bg-black/70 hover:bg-zinc-800 text-zinc-200 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">
                      photo_library
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      handleRegenEntityImage(entity, entity.activeState)
                    }
                    disabled={isBusy}
                    title="Vẽ lại ảnh mẫu DNA bằng Nano Banana Pro"
                    className="p-1.5 rounded-lg bg-black/70 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span
                      className={`material-symbols-outlined text-xs ${
                        isBusy ? 'animate-spin' : ''
                      }`}
                    >
                      {isBusy ? 'progress_activity' : 'auto_fix_high'}
                    </span>
                  </button>
                </div>

                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <div className="text-xs font-bold text-white truncate">
                    {entity.name}
                  </div>
                  <div className="text-[10px] text-zinc-300 truncate">
                    Vũ khí: {entity.signatureWeapon}
                  </div>
                </div>
              </div>

              {/* Bộ chuyển trạng thái Multi-State DNA */}
              <div className="p-2.5 space-y-2">
                <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-white/5">
                  {(['NORMAL', 'DAMAGED_50', 'OVERDRIVE_100'] as const).map(
                    (st) => {
                      const hasMedia = Boolean(entity.states[st]?.mediaId);
                      return (
                        <button
                          key={st}
                          onClick={() =>
                            onUpdateEntity({ ...entity, activeState: st })
                          }
                          className={`py-1 px-1 rounded text-[9px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                            entity.activeState === st
                              ? 'bg-amber-500 text-zinc-950 shadow'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <span>
                            {st === 'NORMAL'
                              ? '100% Zin'
                              : st === 'DAMAGED_50'
                              ? '50% Hư hại'
                              : 'Overdrive'}
                          </span>
                          {hasMedia && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>

                <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {activeStateObj.promptModifier}
                </p>
              </div>
            </div>
          );
        })}

        {/* Thẻ Bối cảnh Chiến trường (Environment Stage) */}
        {activeStage && (
          <div className="rounded-xl bg-zinc-900/60 border border-white/10 overflow-hidden space-y-2">
            <div className="relative h-24 bg-zinc-950 overflow-hidden">
              {activeStage.spatialViews?.northUrl ? (
                <img
                  src={activeStage.spatialViews.northUrl}
                  alt={activeStage.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 gap-1">
                  <span className="material-symbols-outlined text-xl text-indigo-400/70">
                    landscape
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Mỏ neo Bối cảnh Không gian
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
              <button
                onClick={() => handleRegenStageImage(activeStage)}
                disabled={generatingId === activeStage.id}
                title="Đúc lại ảnh Bối cảnh bằng Nano Banana Pro"
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-indigo-500 text-zinc-200 transition-colors cursor-pointer"
              >
                <span
                  className={`material-symbols-outlined text-xs ${
                    generatingId === activeStage.id ? 'animate-spin' : ''
                  }`}
                >
                  {generatingId === activeStage.id
                    ? 'progress_activity'
                    : 'refresh'}
                </span>
              </button>
              <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-100 truncate">
                  {activeStage.name}
                </span>
                {activeStage.spatialViews?.northMediaId && (
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    STAGE LOCKED
                  </span>
                )}
              </div>
            </div>
            <div className="px-3 pb-2.5 space-y-1 text-[10px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">Ánh sáng:</span>
                <span className="text-zinc-300 truncate">
                  {activeStage.lightingMood}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">Thời tiết:</span>
                <span className="text-zinc-300 truncate">
                  {activeStage.weatherCondition}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Telemetry Credits */}
      <div className="p-3 border-t border-white/10 bg-zinc-950">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-zinc-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-emerald-400">
              bolt
            </span>
            Chế độ Tiết Kiệm Credit
          </span>
          <span className="font-mono font-bold text-emerald-400">
            Ảnh 2K = 0đ
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span>Đã dùng phiên này:</span>
          <span className="font-mono text-zinc-300">
            {ledger.usedSessionCredits} Credits
          </span>
        </div>
      </div>
    </aside>
  );
};
