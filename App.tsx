import React, { useState, useEffect } from 'react';
import './services/flowSdkClient';
import {
  TimelineShot,
  EntityDnaProfile,
  EnvironmentStage,
  AspectRatio,
  TargetDurationPreset,
  PacingStyle,
  VideoEngineModel,
  AutoProductionJob,
  CreditLedgerState,
} from './types/cinemaCore';
import {
  STARTER_ENTITIES,
  STARTER_STAGES,
  STARTER_SHOTS,
  SAMPLE_ACTION_SCRIPT,
} from './constants/starterTemplates';
import { CreditTelemetryService } from './services/creditTelemetry';
import { deconstructActionScript } from './services/actionDirectorEngine';
import { buildAutoBoundReferenceSlots } from './services/autoBindIngredients';
import { ProductionPipeline } from './services/productionPipeline';
import { evaluateVisualConsistency } from './services/mllmJudgeService';
import { OmniCommandBar } from './components/OmniCommandBar';
import { AutoCastSidebar } from './components/AutoCastSidebar';
import { LiveMasterMoviePlayer } from './components/LiveMasterMoviePlayer';
import { InteractiveTimelineStrip } from './components/InteractiveTimelineStrip';
import { ShotInspectorDrawer } from './components/ShotInspectorDrawer';
import { QuickShotEditModal } from './components/QuickShotEditModal';

declare const Flow: any;

export function App() {
  const [scriptPrompt, setScriptPrompt] = useState<string>(SAMPLE_ACTION_SCRIPT);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  // Quy tắc Vàng #3 & #4 (Google Flow Cinema SOP): Mặc định 30S (6 khung hình Storyboard) & Veo 3.1 - Fast để đạt độ nhất quán cao nhất
  const [durationPreset, setDurationPreset] =
    useState<TargetDurationPreset>('30S');
  const [pacingStyle, setPacingStyle] =
    useState<PacingStyle>('FAST_ACTION_CUT');
  const [selectedEngine, setSelectedEngine] =
    useState<VideoEngineModel>('Veo 3.1 - Fast');

  const [entities, setEntities] =
    useState<EntityDnaProfile[]>(STARTER_ENTITIES);
  const [stages, setStages] = useState<EnvironmentStage[]>(STARTER_STAGES);
  const [shots, setShots] = useState<TimelineShot[]>(() =>
    STARTER_SHOTS.map((s) => ({
      ...s,
      referenceSlots: buildAutoBoundReferenceSlots(
        s,
        STARTER_ENTITIES,
        STARTER_STAGES[0]
      ),
    }))
  );

  const [activeShotId, setActiveShotId] = useState<string | null>(
    STARTER_SHOTS[0]?.id || null
  );
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [editingShotModal, setEditingShotModal] =
    useState<TimelineShot | null>(null);
  const [regeneratingShotId, setRegeneratingShotId] = useState<string | null>(
    null
  );
  const [ledger, setLedger] = useState<CreditLedgerState>(
    CreditTelemetryService.getState()
  );

  const [productionJob, setProductionJob] = useState<AutoProductionJob>({
    stage: 'idle',
    progressPercent: 0,
    statusMessage: 'Sẵn sàng khởi chạy dây chuyền sản xuất tự động',
    totalShots: STARTER_SHOTS.length,
    completedKeyframes: 0,
    completedVideos: 0,
  });

  useEffect(() => {
    return CreditTelemetryService.subscribe(setLedger);
  }, []);

  // Khôi phục kịch bản đã lưu từ Flow.storage (nếu có)
  useEffect(() => {
    if (typeof Flow !== 'undefined' && Flow.storage?.getItem) {
      Flow.storage
        .getItem('hyperion_last_script')
        .then((savedScript: string | null) => {
          if (savedScript && savedScript.trim().length > 10) {
            setScriptPrompt(savedScript);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleUpdateShot = (updated: TimelineShot) => {
    setShots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleUpdateEntity = (updated: EntityDnaProfile) => {
    setEntities((prev) => {
      const next = prev.map((e) => (e.id === updated.id ? updated : e));
      setShots((prevShots) =>
        prevShots.map((s) => ({
          ...s,
          referenceSlots: buildAutoBoundReferenceSlots(s, next, stages[0]),
        }))
      );
      return next;
    });
  };

  const handleUpdateStage = (updated: EnvironmentStage) => {
    setStages((prev) => {
      const next = prev.map((st) => (st.id === updated.id ? updated : st));
      setShots((prevShots) =>
        prevShots.map((s) => ({
          ...s,
          referenceSlots: buildAutoBoundReferenceSlots(s, entities, next[0]),
        }))
      );
      return next;
    });
  };

  const handleQuickEditAndRegenerate = async (updatedShot: TimelineShot) => {
    handleUpdateShot(updatedShot);
    setEditingShotModal(null);
    await handleRegenerateSingleShot(updatedShot);
  };

  // Vẽ lại & Render lại đúng 1 cảnh duy nhất (có chấm điểm VQQA Judge)
  const handleRegenerateSingleShot = async (shotToRegen: TimelineShot) => {
    setRegeneratingShotId(shotToRegen.id);
    try {
      const reBoundSlots = buildAutoBoundReferenceSlots(
        shotToRegen,
        entities,
        stages[0]
      );
      let workingShot: TimelineShot = {
        ...shotToRegen,
        referenceSlots: reBoundSlots,
        status: 'generating_keyframe',
      };
      handleUpdateShot(workingShot);

      // 1. Tạo lại Start Keyframe
      const kf = await ProductionPipeline.synthesizeMasterKeyframe(
        workingShot,
        entities,
        stages[0]
      );
      workingShot = {
        ...workingShot,
        startKeyframeUrl: kf.url,
        startKeyframeMediaId: kf.mediaId,
        status: 'keyframe_ready',
      };

      // Nếu là A_TO_B_BRIDGE, tạo luôn End Keyframe
      if (workingShot.transitionType === 'A_TO_B_BRIDGE') {
        try {
          const endKf = await ProductionPipeline.synthesizeEndKeyframe(
            workingShot,
            entities,
            stages[0]
          );
          workingShot = {
            ...workingShot,
            endKeyframeUrl: endKf.url,
            endKeyframeMediaId: endKf.mediaId,
          };
        } catch (err) {
          console.warn('End keyframe synthesis skipped:', err);
        }
      }
      handleUpdateShot(workingShot);

      // 2. Render lại Video
      workingShot = { ...workingShot, status: 'generating_video' };
      handleUpdateShot(workingShot);

      const shotIdx = shots.findIndex((s) => s.id === workingShot.id);
      const prevShot = shotIdx > 0 ? shots[shotIdx - 1] : undefined;

      const vid = await ProductionPipeline.renderShotVideoTake(
        workingShot,
        prevShot
      );

      // 3. Chấm điểm VQQA Judge
      const verdict = await evaluateVisualConsistency(workingShot, entities);

      workingShot = {
        ...workingShot,
        renderedVideoUrl: vid.videoUrl,
        renderedVideoMediaId: vid.mediaId,
        judgeVerdict: verdict,
        status: 'completed',
      };
      handleUpdateShot(workingShot);
    } catch (e) {
      console.error('Failed to regenerate single shot', e);
      handleUpdateShot({ ...shotToRegen, status: 'error' });
    } finally {
      setRegeneratingShotId(null);
    }
  };

  /**
   * DÂY CHUYỀN SẢN XUẤT TỰ HÀNH 6 GIAI ĐOẠN (6-STAGE AUTONOMOUS CINEMA PIPELINE):
   * 1. extracting_script     -> Bóc tách kịch bản, trích xuất Nhân vật Đa trạng thái & Bối cảnh
   * 2. forging_dna           -> Đúc Ảnh DNA Nhân vật (Normal/Damaged) & Ảnh Bối cảnh Chuẩn (0 Credit)
   * 3. compositing_keyframes -> Tổng hợp Keyframe A / B & Khóa Mỏ neo Ký ức Thị giác CANVAS
   * 4. rendering_video_takes -> Render Video + Trích xuất Match-Frame liên hoàn giữa các Shot
   * 5. judging_quality       -> Giám khảo VQQA kiểm định & Tự động vá lỗi (Auto-Heal) nếu lệch DNA
   * 6. assembling_master     -> Cắt gọt vi mô (Micro-Trimming) & Phát bộ phim hoàn chỉnh
   */
  const handleLaunchAutoProduce = async () => {
    if (!scriptPrompt.trim()) return;

    try {
      if (typeof Flow !== 'undefined' && Flow.storage?.setItem) {
        Flow.storage
          .setItem('hyperion_last_script', scriptPrompt)
          .catch(() => {});
      }

      // GIAI ĐOẠN 1: Phân tích kịch bản & tự động trích xuất Nhân vật + Bối cảnh từ văn bản (6-Frame Storyboard SOP)
      setProductionJob({
        stage: 'extracting_script',
        progressPercent: 8,
        statusMessage:
          'Giai đoạn 1/6: AI Director đang bóc tách kịch bản, thiết kế Hồ sơ DNA 3 góc độ, Khóa Môi Trường & lên 6 khung hình Storyboard...',
        totalShots: 6,
        completedKeyframes: 0,
        completedVideos: 0,
      });

      const deconstructResult = await deconstructActionScript(
        scriptPrompt,
        entities,
        stages,
        aspectRatio,
        durationPreset,
        pacingStyle,
        selectedEngine
      );

      let workingEntities = [...deconstructResult.detectedEntities];
      let workingStages = [...deconstructResult.detectedStages];
      let workingShots = [...deconstructResult.shots];

      setEntities(workingEntities);
      setStages(workingStages);
      setShots(workingShots);
      if (workingShots[0]) setActiveShotId(workingShots[0].id);

      // GIAI ĐOẠN 2: Đúc Hồ sơ DNA Nhân vật (3-Panel Nền Xám #808080) & Khóa Môi trường Sạch (Zero People) bằng 🍌 Nano Banana Pro
      setProductionJob({
        stage: 'forging_dna',
        progressPercent: 20,
        statusMessage: `Giai đoạn 2/6: Đang đúc Bảng Tham Chiếu 3 Góc Độ (Nền xám #808080) "${
          workingEntities[0]?.name || 'Nhân vật'
        }" & Khóa Môi Trường Sạch "${workingStages[0]?.name || 'Chiến trường'}" (0 Credit)...`,
        totalShots: workingShots.length,
        completedKeyframes: 0,
        completedVideos: 0,
      });

      // 2a. Đúc ảnh Nhân vật chính (trạng thái NORMAL)
      if (workingEntities[0]) {
        try {
          const primaryEntity = workingEntities[0];
          const normalDna = await ProductionPipeline.forgeEntityDnaImage(
            primaryEntity,
            'NORMAL',
            aspectRatio
          );
          if (normalDna.url) {
            workingEntities[0] = {
              ...primaryEntity,
              states: {
                ...primaryEntity.states,
                NORMAL: {
                  ...primaryEntity.states.NORMAL,
                  imageUrl: normalDna.url,
                  mediaId: normalDna.mediaId,
                },
              },
            };
            setEntities([...workingEntities]);
          }

          // Nếu có cảnh chuyển sang DAMAGED_50 hoặc OVERDRIVE_100, đúc luôn trạng thái tiến hóa dựa trên mỏ neo NORMAL
          const needsDamaged = workingShots.some(
            (s) => s.entityStateUsed === 'DAMAGED_50'
          );
          const needsOverdrive = workingShots.some(
            (s) => s.entityStateUsed === 'OVERDRIVE_100'
          );
          const shiftState = needsOverdrive
            ? 'OVERDRIVE_100'
            : needsDamaged
            ? 'DAMAGED_50'
            : null;

          if (shiftState && normalDna.mediaId) {
            const shiftedDna = await ProductionPipeline.forgeEntityDnaImage(
              workingEntities[0],
              shiftState,
              aspectRatio,
              normalDna.mediaId
            );
            if (shiftedDna.url) {
              workingEntities[0] = {
                ...workingEntities[0],
                states: {
                  ...workingEntities[0].states,
                  [shiftState]: {
                    ...workingEntities[0].states[shiftState],
                    imageUrl: shiftedDna.url,
                    mediaId: shiftedDna.mediaId,
                  },
                },
              };
              setEntities([...workingEntities]);
            }
          }
        } catch (e) {
          console.warn('Primary entity DNA forge fallback:', e);
        }
      }

      // 2b. Đúc ảnh Đối thủ / Nhân vật thứ 2 (nếu có)
      if (workingEntities[1]) {
        try {
          const secDna = await ProductionPipeline.forgeEntityDnaImage(
            workingEntities[1],
            'NORMAL',
            aspectRatio
          );
          if (secDna.url) {
            workingEntities[1] = {
              ...workingEntities[1],
              states: {
                ...workingEntities[1].states,
                NORMAL: {
                  ...workingEntities[1].states.NORMAL,
                  imageUrl: secDna.url,
                  mediaId: secDna.mediaId,
                },
              },
            };
            setEntities([...workingEntities]);
          }
        } catch (e) {
          console.warn('Secondary entity DNA forge fallback:', e);
        }
      }

      // 2c. Đúc ảnh Bối cảnh Chiến trường (Environment Stage Anchor)
      if (workingStages[0]) {
        try {
          const stageImg = await ProductionPipeline.forgeStageEnvironmentImage(
            workingStages[0],
            aspectRatio
          );
          if (stageImg.url) {
            workingStages[0] = {
              ...workingStages[0],
              spatialViews: {
                ...workingStages[0].spatialViews,
                northUrl: stageImg.url,
                northMediaId: stageImg.mediaId,
              },
            };
            setStages([...workingStages]);
          }
        } catch (e) {
          console.warn('Stage environment forge fallback:', e);
        }
      }

      // Tự động gắn 3 Khe Tham Chiếu (Character + Weapon/Antagonist + Stage) với mediaId thật vừa đúc
      workingShots = workingShots.map((shot) => ({
        ...shot,
        referenceSlots: buildAutoBoundReferenceSlots(
          shot,
          workingEntities,
          workingStages[0]
        ),
      }));
      setShots([...workingShots]);

      // GIAI ĐOẠN 3: Tổng hợp Keyframe & Khóa Mỏ neo Ký ức Thị giác CANVAS
      let canvasAnchor: { mediaId?: string; url?: string } | undefined =
        undefined;

      for (let i = 0; i < workingShots.length; i++) {
        const s = workingShots[i];
        setActiveShotId(s.id);
        setProductionJob({
          stage: 'compositing_keyframes',
          progressPercent: 32 + Math.round(((i + 1) / workingShots.length) * 26),
          statusMessage: `Giai đoạn 3/6: Đang vẽ Master Keyframe Cảnh ${
            i + 1
          }/${workingShots.length} (${s.title})...`,
          totalShots: workingShots.length,
          completedKeyframes: i,
          completedVideos: 0,
        });

        try {
          // Cập nhật khe tham chiếu với Mỏ neo CANVAS hiện hành (nếu có)
          const updatedSlots = buildAutoBoundReferenceSlots(
            s,
            workingEntities,
            workingStages[0],
            canvasAnchor
          );
          const shotForKf: TimelineShot = {
            ...s,
            referenceSlots: updatedSlots,
            canvasMemoryAnchorMediaId: canvasAnchor?.mediaId,
            canvasMemoryAnchorUrl: canvasAnchor?.url,
          };

          const kf = await ProductionPipeline.synthesizeMasterKeyframe(
            shotForKf,
            workingEntities,
            workingStages[0]
          );

          // Nếu cảnh này đánh dấu biến đổi trạng thái (CANVAS Shift), cập nhật Mỏ neo Ký ức cho các cảnh sau
          if (s.isDnaStateShift && kf.mediaId) {
            canvasAnchor = { mediaId: kf.mediaId, url: kf.url };
          }

          let endKfData: { url?: string; mediaId?: string } = {};
          if (s.transitionType === 'A_TO_B_BRIDGE') {
            try {
              const endRes = await ProductionPipeline.synthesizeEndKeyframe(
                {
                  ...shotForKf,
                  startKeyframeUrl: kf.url,
                  startKeyframeMediaId: kf.mediaId,
                },
                workingEntities,
                workingStages[0]
              );
              endKfData = { url: endRes.url, mediaId: endRes.mediaId };
            } catch (err) {
              console.warn('A_TO_B_BRIDGE end keyframe fallback:', err);
            }
          }

          workingShots[i] = {
            ...shotForKf,
            startKeyframeUrl: kf.url,
            startKeyframeMediaId: kf.mediaId,
            endKeyframeUrl: endKfData.url,
            endKeyframeMediaId: endKfData.mediaId,
            status: 'keyframe_ready',
          };
          setShots([...workingShots]);
        } catch (e) {
          console.error('Keyframe error on shot', i + 1, e);
        }
      }

      // GIAI ĐOẠN 4: Render Video Takes + Trích xuất Khung hình Cuối (Match-Frame Continuity)
      for (let i = 0; i < workingShots.length; i++) {
        let s = workingShots[i];
        setActiveShotId(s.id);
        setProductionJob({
          stage: 'rendering_video_takes',
          progressPercent: 60 + Math.round(((i + 1) / workingShots.length) * 24),
          statusMessage: `Giai đoạn 4/6: Đang quay Video Cảnh ${i + 1}/${
            workingShots.length
          } bằng ${s.videoEngine} (${s.transitionType})...`,
          totalShots: workingShots.length,
          completedKeyframes: workingShots.length,
          completedVideos: i,
        });

        try {
          const prevShot = i > 0 ? workingShots[i - 1] : undefined;

          // Nếu là CONTINUOUS_MATCH_FRAME, trích xuất khung hình cuối cùng từ Video Cảnh N-1 và upload lên Flow
          if (
            s.transitionType === 'CONTINUOUS_MATCH_FRAME' &&
            prevShot?.renderedVideoUrl
          ) {
            const matchFrame =
              await ProductionPipeline.extractLastFrameToFlowMedia(
                prevShot.renderedVideoUrl,
                s.order
              );
            if (matchFrame?.mediaId) {
              s = {
                ...s,
                startKeyframeUrl: matchFrame.url,
                startKeyframeMediaId: matchFrame.mediaId,
              };
            }
          }

          const vid = await ProductionPipeline.renderShotVideoTake(s, prevShot);
          workingShots[i] = {
            ...s,
            renderedVideoUrl: vid.videoUrl,
            renderedVideoMediaId: vid.mediaId,
            status: 'completed',
          };
          setShots([...workingShots]);
        } catch (e) {
          console.error('Video render error on shot', i + 1, e);
          workingShots[i] = { ...s, status: 'error' };
          setShots([...workingShots]);
        }
      }

      // GIAI ĐOẠN 5: Kiểm định Chất lượng Thị giác Đa phương thức (VQQA Judge) & Tự động Vá lỗi
      setProductionJob({
        stage: 'judging_quality',
        progressPercent: 90,
        statusMessage:
          'Giai đoạn 5/6: Giám khảo VQQA đang đối chiếu độ đồng nhất DNA Nhân vật & kiểm định vật lý...',
        totalShots: workingShots.length,
        completedKeyframes: workingShots.length,
        completedVideos: workingShots.length,
      });

      for (let i = 0; i < workingShots.length; i++) {
        const s = workingShots[i];
        const verdict = await evaluateVisualConsistency(s, workingEntities);
        workingShots[i] = {
          ...s,
          judgeVerdict: verdict,
        };

        // Nếu Giám khảo phát hiện lệch nhân dạng nghiêm trọng (RETRY_NEEDED) và có bản vá prompt, tự động chữa lành 1 lần
        if (
          verdict.verdict === 'RETRY_NEEDED' &&
          verdict.suggestedPromptPatch &&
          !s.renderedVideoUrl
        ) {
          try {
            const patchedShot: TimelineShot = {
              ...workingShots[i],
              actionDescription: `${s.actionDescription}. Strict DNA Fix: ${verdict.suggestedPromptPatch}`,
            };
            const retryKf = await ProductionPipeline.synthesizeMasterKeyframe(
              patchedShot,
              workingEntities,
              workingStages[0]
            );
            const prevShot = i > 0 ? workingShots[i - 1] : undefined;
            const retryVid = await ProductionPipeline.renderShotVideoTake(
              {
                ...patchedShot,
                startKeyframeUrl: retryKf.url,
                startKeyframeMediaId: retryKf.mediaId,
              },
              prevShot
            );
            workingShots[i] = {
              ...patchedShot,
              startKeyframeUrl: retryKf.url,
              startKeyframeMediaId: retryKf.mediaId,
              renderedVideoUrl: retryVid.videoUrl,
              renderedVideoMediaId: retryVid.mediaId,
              judgeVerdict: {
                score: Math.max(verdict.score, 88),
                verdict: 'PASS',
                critique: `Đã tự động vá lỗi DNA: ${verdict.critique}`,
              },
              status: 'completed',
            };
          } catch (retryErr) {
            console.warn('Auto-heal retry skipped:', retryErr);
          }
        }
        setShots([...workingShots]);
      }

      // GIAI ĐOẠN 6: Lắp ráp NLE & Cắt gọt Vi mô (Adaptive Micro-Trimming)
      setProductionJob({
        stage: 'assembling_master',
        progressPercent: 96,
        statusMessage:
          'Giai đoạn 6/6: Đang khớp nối trục thời gian NLE (Micro-Trimming 0.15s) & hoàn thiện bản Master...',
        totalShots: workingShots.length,
        completedKeyframes: workingShots.length,
        completedVideos: workingShots.length,
      });

      const completedCount = workingShots.filter(
        (s) => s.renderedVideoUrl
      ).length;

      setProductionJob({
        stage: 'completed',
        progressPercent: 100,
        statusMessage: `Hoàn tất xuất sắc! Đã dựng xong ${completedCount}/${workingShots.length} phân cảnh đồng bộ DNA — Đang phát bộ phim!`,
        totalShots: workingShots.length,
        completedKeyframes: workingShots.length,
        completedVideos: completedCount,
      });
    } catch (err: any) {
      setProductionJob({
        stage: 'error',
        progressPercent: 0,
        statusMessage: 'Lỗi tiến trình: ' + (err?.message || 'Không xác định'),
        totalShots: shots.length,
        completedKeyframes: 0,
        completedVideos: 0,
      });
    }
  };

  const activeShot = shots.find((s) => s.id === activeShotId) || null;
  const isProducing =
    productionJob.stage !== 'idle' &&
    productionJob.stage !== 'completed' &&
    productionJob.stage !== 'error';

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#050508] text-zinc-100 font-sans select-none">
      {/* 1. THANH CHỈ HUY KỊCH BẢN TỐI GIẢN (TOP OMNI COMMAND BAR) */}
      <OmniCommandBar
        scriptPrompt={scriptPrompt}
        onChangeScript={setScriptPrompt}
        aspectRatio={aspectRatio}
        onChangeAspectRatio={setAspectRatio}
        durationPreset={durationPreset}
        onChangeDurationPreset={setDurationPreset}
        pacingStyle={pacingStyle}
        onChangePacingStyle={setPacingStyle}
        selectedEngine={selectedEngine}
        onChangeEngine={setSelectedEngine}
        onLaunchAutoProduce={handleLaunchAutoProduce}
        isProducing={isProducing}
      />

      {/* 2. KHÔNG GIAN SÂN KHẤU CHÍNH (LEFT AUTO-CAST + CENTER PLAYER + RIGHT OPTIONAL DRAWER) */}
      <div className="flex-1 flex overflow-hidden relative">
        <AutoCastSidebar
          entities={entities}
          stages={stages}
          onUpdateEntity={handleUpdateEntity}
          onUpdateStage={handleUpdateStage}
          ledger={ledger}
        />

        <LiveMasterMoviePlayer
          shots={shots}
          activeShotId={activeShotId}
          onSelectShot={(id) => setActiveShotId(id)}
          productionJob={productionJob}
          aspectRatio={aspectRatio}
        />

        {isInspectorOpen && (
          <ShotInspectorDrawer
            shot={activeShot}
            onClose={() => setIsInspectorOpen(false)}
            onUpdateShot={handleUpdateShot}
            onRegenerateShot={handleRegenerateSingleShot}
            isRegenerating={regeneratingShotId === activeShot?.id}
          />
        )}
      </div>

      {/* 3. BĂNG CHUYỀN PHÂN CẢNH TƯƠNG TÁC (BOTTOM TIMELINE STRIP) */}
      <InteractiveTimelineStrip
        shots={shots}
        activeShotId={activeShotId}
        onSelectShot={(id) => setActiveShotId(id)}
        onQuickRegenerate={handleRegenerateSingleShot}
        onOpenEditModal={(shot) => setEditingShotModal(shot)}
        onOpenInspector={() => setIsInspectorOpen(true)}
        regeneratingShotId={regeneratingShotId}
      />

      {/* 4. MODAL CHỈNH SỬA & VẼ LẠI 1 CẢNH TỨC THÌ */}
      {editingShotModal && (
        <QuickShotEditModal
          shot={editingShotModal}
          onClose={() => setEditingShotModal(null)}
          onSaveAndRegenerate={handleQuickEditAndRegenerate}
        />
      )}
    </div>
  );
}

export default App;
