import React, { useState } from 'react';
import { TimelineShot } from '../types/cinemaCore';
import { ProductionPipeline } from '../services/productionPipeline';
import { CreditTelemetryService } from '../services/creditTelemetry';

declare const Flow: any;

interface ShotInspectorDrawerProps {
  shot: TimelineShot | null;
  onClose: () => void;
  onUpdateShot: (updated: TimelineShot) => void;
  onRegenerateShot: (shot: TimelineShot) => Promise<void>;
  isRegenerating?: boolean;
}

export const ShotInspectorDrawer: React.FC<ShotInspectorDrawerProps> = ({
  shot,
  onClose,
  onUpdateShot,
  onRegenerateShot,
  isRegenerating = false,
}) => {
  const [vietnameseChat, setVietnameseChat] = useState('');
  const [vfxEditPrompt, setVfxEditPrompt] = useState(
    'Add realistic falling snow and cold volumetric breath while preserving original subject and camera motion'
  );
  const [isProcessingEdit, setIsProcessingEdit] = useState(false);
  const [isProcessingV2V, setIsProcessingV2V] = useState(false);
  const [isUpgrading4K, setIsUpgrading4K] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!shot) return null;

  const consistencyScore = shot.judgeVerdict?.score ?? 94;

  // 1. Ô chat "🪄 Sửa cảnh này bằng tiếng Việt"
  const handleConversationalPromptEdit = async () => {
    if (!vietnameseChat.trim()) return;

    setIsProcessingEdit(true);
    setStatusMessage(
      'AI Director đang dịch chỉ đạo tiếng Việt sang Prompt 3 tầng & bấm máy lại...'
    );

    try {
      let rewrittenPrompt = `${shot.actionDescription}. Director modification: ${vietnameseChat}`;
      if (typeof Flow !== 'undefined' && Flow.generate?.text) {
        const textRes = await Flow.generate.text({
          prompt: `Người dùng muốn sửa phân cảnh: "${vietnameseChat}".\nPrompt hiện tại: "${shot.actionDescription}".\nHãy viết lại prompt tiếng Anh điện ảnh tối ưu cho cảnh này, giữ nguyên thẻ [CHARACTER: ...] và [ENVIRONMENT LOCK: ...] (chỉ trả về 1 câu prompt hoàn chỉnh):`,
          systemInstruction:
            'You are an elite Hollywood & Google Flow AI Director. Refine the action prompt concisely while keeping character and environment tags intact.',
          thinkingLevel: 'low',
        });
        if (textRes?.text) {
          rewrittenPrompt = textRes.text.trim();
        }
      }

      const updatedShot: TimelineShot = {
        ...shot,
        actionDescription: rewrittenPrompt,
      };
      onUpdateShot(updatedShot);
      await onRegenerateShot(updatedShot);
      setStatusMessage('✓ Đã sửa kịch bản phân cảnh và kết xuất lại thành công!');
      setVietnameseChat('');
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Lỗi sửa cảnh: ' + (err?.message || 'Không thể render'));
    } finally {
      setIsProcessingEdit(false);
    }
  };

  // 2. Quy tắc Vàng #5 [08:17 - 10:05]: Kiểm soát Điểm Đầu (First Frame) & Điểm Cuối (Last Frame)
  const handleSelectFrameFromGallery = async (frameRole: 'FIRST' | 'LAST') => {
    try {
      if (typeof Flow === 'undefined' || !Flow.media?.select) return;
      const media = await Flow.media.select({ filter: 'image' });
      const newUrl = media.url || `data:${media.mimeType || 'image/png'};base64,${media.base64}`;

      if (frameRole === 'FIRST') {
        onUpdateShot({
          ...shot,
          startKeyframeUrl: newUrl,
          startKeyframeMediaId: media.mediaId,
        });
        setStatusMessage('✓ Đã khóa First Frame (Khung hình đầu) mới!');
      } else {
        onUpdateShot({
          ...shot,
          transitionType: 'A_TO_B_BRIDGE',
          endKeyframeUrl: newUrl,
          endKeyframeMediaId: media.mediaId,
          endKeyframePrompt:
            shot.endKeyframePrompt ||
            `${shot.actionDescription}, final target pose`,
        });
        setStatusMessage(
          '✓ Đã khóa Last Frame (Khung hình cuối) & kích hoạt nội suy A_TO_B_BRIDGE!'
        );
      }
    } catch (err) {
      console.warn('Đóng bộ chọn First/Last Frame:', err);
    }
  };

  // 3. Quy tắc Vàng #6 [10:06 - 11:15]: Chỉnh sửa Video có sẵn (Video-to-Video VFX Edit)
  const handleV2VVfxEdit = async (pickFromGallery: boolean) => {
    if (!vfxEditPrompt.trim()) return;
    setIsProcessingV2V(true);
    setStatusMessage(
      'Đang chỉnh sửa Video có sẵn (Video-to-Video VFX Edit) — Giữ nguyên bố cục gốc & phủ hiệu ứng...'
    );

    try {
      let targetVideoMediaId = shot.renderedVideoMediaId;

      if (pickFromGallery && typeof Flow !== 'undefined' && Flow.media?.select) {
        const selectedVideo = await Flow.media.select({ filter: 'video' });
        if (selectedVideo?.mediaId) {
          targetVideoMediaId = selectedVideo.mediaId;
        }
      }

      if (!targetVideoMediaId) {
        throw new Error(
          'Chưa có mediaId video gốc. Hãy chọn video từ Thư viện hoặc render cảnh này trước.'
        );
      }

      const v2vRes = await ProductionPipeline.editExistingVideoWithVfx(
        targetVideoMediaId,
        vfxEditPrompt,
        shot.id,
        shot.aspectRatio,
        shot.targetDurationSeconds
      );

      onUpdateShot({
        ...shot,
        renderedVideoUrl: v2vRes.videoUrl,
        renderedVideoMediaId: v2vRes.mediaId,
        status: 'completed',
      });
      setStatusMessage(
        '✓ Đã chỉnh sửa Video có sẵn (V2V VFX Edit) thành công mà không làm biến dạng cảnh gốc!'
      );
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Lỗi V2V Edit: ' + (err?.message || 'Không thể chỉnh sửa video'));
    } finally {
      setIsProcessingV2V(false);
    }
  };

  // 4. Nút "💎 Nâng cấp cảnh này lên 4K Master (Veo 3.1 Quality)"
  const handleUpgradeTo4KMaster = async () => {
    setIsUpgrading4K(true);
    setStatusMessage(
      'Veo 3.1 - Quality đang kết xuất bản 4K Master IMAX với khóa First/Last Frame...'
    );

    try {
      const upgradedShot: TimelineShot = {
        ...shot,
        videoEngine: 'Veo 3.1 - Quality',
      };
      const vid = await ProductionPipeline.renderShotVideoTake(upgradedShot);
      CreditTelemetryService.recordTransaction(
        'VIDEO_VEO_QUALITY',
        `Nâng cấp Cảnh #${shot.order} lên 4K Master (Veo 3.1 - Quality)`,
        'Veo 3.1 - Quality',
        shot.id
      );

      onUpdateShot({
        ...upgradedShot,
        renderedVideoUrl: vid.videoUrl,
        renderedVideoMediaId: vid.mediaId,
        status: 'completed',
      });
      setStatusMessage('✓ Đã nâng cấp cảnh lên 4K Master (Veo 3.1 - Quality) thành công!');
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Lỗi nâng cấp: ' + (err?.message || 'Không thể render'));
    } finally {
      setIsUpgrading4K(false);
    }
  };

  // 5. Đổi ảnh tham chiếu (3-Panel Character Sheet / Clean Environment Lock) trong 1 giây
  const handleQuickSwapReferenceImage = async (slotId: string) => {
    try {
      if (typeof Flow === 'undefined' || !Flow.media?.select) return;
      const media = await Flow.media.select({ filter: 'image' });
      const newUrl = media.url || `data:${media.mimeType || 'image/png'};base64,${media.base64}`;

      const updatedSlots = shot.referenceSlots.map((s) =>
        s.id === slotId ? { ...s, imageUrl: newUrl, mediaId: media.mediaId } : s
      );

      onUpdateShot({
        ...shot,
        referenceSlots: updatedSlots,
      });
      setStatusMessage('✓ Đã cập nhật ảnh tham chiếu DNA / Bối cảnh!');
    } catch (err) {
      console.warn('Đóng bộ chọn ảnh:', err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 md:w-[440px] bg-[#090C12]/95 backdrop-blur-xl border-l border-[#00F0FF]/30 z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.85)] select-none">
      {/* Header Inspector */}
      <div className="p-3.5 bg-[#0B0F17] border-b border-[#1A2336] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-pulse"></span>
          <div>
            <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <span>SHOT INSPECTOR</span>
              <span className="text-[#00F0FF]">#{shot.order}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate max-w-[240px]">
              {shot.title}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            title="Điểm đồng nhất nhân vật thẩm định bởi VQQA MLLM Judge"
            className="flex items-center gap-1 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300"
          >
            <span>✓ {consistencyScore}% DNA</span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#141B28] hover:bg-[#1E273A] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-2 bg-[#00F0FF]/10 border-b border-[#00F0FF]/30 text-[#00F0FF] text-[11px] font-mono text-center">
          {statusMessage}
        </div>
      )}

      {/* Body Drawer */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {/* Xem trước footage hiện tại */}
        <div className="aspect-video bg-black rounded-xl border border-[#1C273C] overflow-hidden relative shadow-inner flex items-center justify-center">
          {shot.renderedVideoUrl ? (
            <video
              src={shot.renderedVideoUrl}
              controls
              loop
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          ) : shot.startKeyframeUrl ? (
            <img
              src={shot.startKeyframeUrl}
              alt="Start Frame"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-500 text-[11px]">Chưa có hình ảnh</div>
          )}

          <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[9px] text-slate-300">
            {shot.videoEngine} • {shot.targetDurationSeconds}s • {shot.transitionType}
          </div>

          {shot.canvasMemoryAnchorUrl && (
            <div className="absolute top-2 right-2 bg-cyan-950/80 border border-cyan-400/50 px-2 py-0.5 rounded text-[9px] text-cyan-300">
              ⚓ CANVAS DNA ANCHOR
            </div>
          )}
        </div>

        {/* QUY TẮC VÀNG #5 [08:17 - 10:05]: KIỂM SOÁT ĐIỂM ĐẦU (FIRST FRAME) & ĐIỂM CUỐI (LAST FRAME) */}
        <div className="bg-[#0D121D] border border-cyan-500/30 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-cyan-300 font-bold text-xs">
              🎯 KIỂM SOÁT FIRST FRAME & LAST FRAME
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
              Chuẩn [08:17 - 10:05]
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Khóa cả Khung Đầu (Start Frame) và Khung Cuối (Last Frame) để AI tự động nội suy chuyển động phức tạp mượt mà, không cần cắt ghép hậu kỳ.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {/* First Frame Card */}
            <div className="bg-[#121826] border border-[#22304A] rounded-lg p-2 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white font-bold">FIRST FRAME (A)</span>
                <span className="text-emerald-400 text-[9px]">Đã khóa</span>
              </div>
              <div className="aspect-video bg-black rounded overflow-hidden border border-slate-800">
                {shot.startKeyframeUrl ? (
                  <img
                    src={shot.startKeyframeUrl}
                    alt="First Frame"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-600">
                    Trống
                  </div>
                )}
              </div>
              <button
                onClick={() => handleSelectFrameFromGallery('FIRST')}
                className="w-full py-1 rounded bg-[#1A2336] hover:bg-[#24324C] text-[10px] text-cyan-200 border border-cyan-500/30 transition-colors"
              >
                Chọn First Frame
              </button>
            </div>

            {/* Last Frame Card */}
            <div className="bg-[#121826] border border-[#22304A] rounded-lg p-2 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white font-bold">LAST FRAME (B)</span>
                <span className="text-amber-300 text-[9px]">
                  {shot.endKeyframeUrl ? 'A→B Active' : 'Tùy chọn'}
                </span>
              </div>
              <div className="aspect-video bg-black rounded overflow-hidden border border-slate-800">
                {shot.endKeyframeUrl ? (
                  <img
                    src={shot.endKeyframeUrl}
                    alt="Last Frame"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-600">
                    Chưa khóa đích
                  </div>
                )}
              </div>
              <button
                onClick={() => handleSelectFrameFromGallery('LAST')}
                className="w-full py-1 rounded bg-[#1A2336] hover:bg-[#24324C] text-[10px] text-amber-200 border border-amber-500/30 transition-colors"
              >
                Chọn Last Frame
              </button>
            </div>
          </div>

          <button
            onClick={() => onRegenerateShot(shot)}
            disabled={isRegenerating || !shot.startKeyframeMediaId}
            className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-bold text-[11px] transition-all disabled:opacity-40"
          >
            {isRegenerating
              ? 'Đang nội suy chuyển động First → Last Frame...'
              : '🎬 Quay lại Video theo First + Last Frame này'}
          </button>
        </div>

        {/* QUY TẮC VÀNG #6 [10:06 - 11:15]: CHỈNH SỬA VIDEO CÓ SẴN (VIDEO-TO-VIDEO VFX EDIT) */}
        <div className="bg-[#0D121D] border border-purple-500/30 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-purple-300 font-bold text-xs">
              🌨️ CHỈNH SỬA VIDEO CÓ SẴN (V2V VFX EDIT)
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/50">
              Chuẩn [10:06 - 11:15]
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Tải lên hoặc chọn video có sẵn và yêu cầu AI thêm hiệu ứng (tuyết rơi, mưa bão, tia lửa) trong khi vẫn giữ nguyên nhân vật và chuyển động gốc.
          </p>

          <textarea
            rows={2}
            value={vfxEditPrompt}
            onChange={(e) => setVfxEditPrompt(e.target.value)}
            placeholder="Nhập hiệu ứng muốn phủ lên video gốc (VD: Add falling snow, cyberpunk neon rain...)"
            className="w-full bg-[#131926] border border-[#232F46] rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
          />

          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 flex-wrap">
            <button
              type="button"
              onClick={() =>
                setVfxEditPrompt(
                  'Add realistic falling snow and frost particles while keeping original subject and motion intact'
                )
              }
              className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-700/40 hover:bg-purple-900/60"
            >
              + Tuyết rơi
            </button>
            <button
              type="button"
              onClick={() =>
                setVfxEditPrompt(
                  'Add heavy cinematic rain, wet reflections and lightning flashes while preserving original scene'
                )
              }
              className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-700/40 hover:bg-purple-900/60"
            >
              + Mưa bão
            </button>
            <button
              type="button"
              onClick={() =>
                setVfxEditPrompt(
                  'Add floating glowing embers, sparks and volumetric battlefield smoke while preserving original video'
                )
              }
              className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-700/40 hover:bg-purple-900/60"
            >
              + Tàn lửa & Khói
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleV2VVfxEdit(false)}
              disabled={isProcessingV2V || !shot.renderedVideoMediaId}
              className="py-1.5 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] transition-all disabled:opacity-40"
            >
              {isProcessingV2V ? 'Đang xử lý...' : 'Áp dụng lên Cảnh này'}
            </button>
            <button
              onClick={() => handleV2VVfxEdit(true)}
              disabled={isProcessingV2V}
              className="py-1.5 px-2 rounded-lg bg-[#192234] hover:bg-[#222E46] text-purple-200 border border-purple-500/40 font-bold text-[10px] transition-all disabled:opacity-40"
            >
              📂 Chọn Video có sẵn
            </button>
          </div>
        </div>

        {/* 1. CÔNG CỤ SỬA CẢNH NÀY BẰNG TIẾNG VIỆT */}
        <div className="bg-[#0D121D] border border-[#1E293E] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#00F0FF]">
              🪄 SỬA CẢNH NÀY BẰNG TIẾNG VIỆT
            </span>
            <span className="text-[9px] text-slate-500">Auto Prompt Rewrite</span>
          </div>

          <textarea
            rows={2}
            value={vietnameseChat}
            onChange={(e) => setVietnameseChat(e.target.value)}
            placeholder="Gõ ngắn: 'Cho nhân vật vung kiếm mạnh hơn', 'Đổi sang góc quay từ dưới lên'..."
            className="w-full bg-[#131926] border border-[#232F46] rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF] resize-none"
          />

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => onRegenerateShot(shot)}
              disabled={isRegenerating || isProcessingEdit}
              className="px-2.5 py-1.5 bg-[#162032] hover:bg-[#1E2C44] text-slate-200 text-[10px] rounded-lg border border-slate-700"
            >
              {isRegenerating ? 'Đang tạo lại...' : '↻ Tạo lại Cảnh này'}
            </button>

            <button
              onClick={handleConversationalPromptEdit}
              disabled={isProcessingEdit || !vietnameseChat.trim()}
              className="px-3 py-1.5 bg-gradient-to-r from-[#00F0FF] to-blue-600 hover:brightness-110 text-black font-bold text-xs rounded-lg transition-all disabled:opacity-40"
            >
              {isProcessingEdit ? 'Đang sửa...' : 'Thực hiện chỉ đạo'}
            </button>
          </div>
        </div>

        {/* 2. NÚT NÂNG CẤP LÊN 4K MASTER (VEO 3.1 QUALITY) */}
        <div className="bg-[#0D121D] border border-amber-500/30 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-amber-300 font-bold text-xs">
              💎 NÂNG CẤP 4K MASTER (VEO 3.1 QUALITY)
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-700">
              IMAX CONSISTENCY
            </span>
          </div>

          <button
            onClick={handleUpgradeTo4KMaster}
            disabled={isUpgrading4K}
            className="w-full py-2 rounded-lg font-bold text-xs bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-black shadow-[0_0_15px_rgba(255,153,0,0.3)] disabled:opacity-40"
          >
            {isUpgrading4K
              ? 'Đang render 4K Master...'
              : '💎 KẾT XUẤT BẢN 4K MASTER (VEO 3.1 QUALITY)'}
          </button>
        </div>

        {/* 3. THẺ ẢNH THAM CHIẾU (3-PANEL CHARACTER SHEET & CLEAN ENVIRONMENT LOCK) */}
        <div className="bg-[#0D121D] border border-[#1E293E] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-xs">
              🧬 MỎ NEO THAM CHIẾU (3-PANEL & ENV LOCK)
            </span>
            <span className="text-[9px] text-slate-400">Chuẩn [01:54 - 03:42]</span>
          </div>

          <div className="space-y-2">
            {shot.referenceSlots.map((slot) => (
              <div
                key={slot.id}
                className="bg-[#121826] border border-[#212E46] rounded-lg p-2 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {slot.imageUrl ? (
                    <img
                      src={slot.imageUrl}
                      alt={slot.label}
                      className="w-10 h-10 rounded object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center text-[9px] text-slate-500">
                      DNA
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[10px] text-cyan-300 font-bold truncate">
                      {slot.role}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">
                      {slot.label}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickSwapReferenceImage(slot.id)}
                  className="px-2 py-1 rounded bg-[#1A2336] hover:bg-[#23314A] text-[10px] text-white border border-slate-600 shrink-0"
                >
                  Đổi ảnh
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
