import React from 'react';
import { ProductionGenre, PipelineRunningMode, ProductionStep } from '../types/cinemaCore';

interface OmniCommandBarProps {
  promptInput: string;
  setPromptInput: (val: string) => void;
  genre: ProductionGenre;
  setGenre: (g: ProductionGenre) => void;
  aspectRatio: '16:9' | '9:16';
  setAspectRatio: (ar: '16:9' | '9:16') => void;
  runMode: PipelineRunningMode;
  setRunMode: (m: PipelineRunningMode) => void;
  pipelineStep: ProductionStep;
  pipelineProgressText: string;
  pipelineProgressPercent?: number;
  pipelineErrorDetail?: string | null;
  onLaunchAutoProduce: () => void;
  onSelectImageMedia: () => void;
  uploadedImageName?: string | null;
  usedCredits: number;
}

export const OmniCommandBar: React.FC<OmniCommandBarProps> = ({
  promptInput,
  setPromptInput,
  genre,
  setGenre,
  aspectRatio,
  setAspectRatio,
  runMode,
  setRunMode,
  pipelineStep,
  pipelineProgressText,
  pipelineProgressPercent = 0,
  pipelineErrorDetail = null,
  onLaunchAutoProduce,
  onSelectImageMedia,
  uploadedImageName,
  usedCredits,
}) => {
  const isRunning = pipelineStep !== 'idle' && pipelineStep !== 'completed';

  return (
    <div className="bg-[#08090D] border-b border-[#1A2234] p-3 md:px-5 shrink-0 z-30 select-none shadow-xl">
      {/* Hàng 1: Brand Header + Credit Indicator */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#00F0FF] via-[#0284C7] to-indigo-600 p-[1px] shadow-[0_0_12px_rgba(0,240,255,0.35)]">
            <div className="w-full h-full bg-[#0A0D15] rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00F0FF] text-[18px]">smart_toy</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs md:text-sm tracking-[0.2em] text-[#00F0FF]">HYPERION</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30">
                STUDIO OS
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                REAL API PIPELINE
              </span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono tracking-wider">
              DÂY CHUYỀN SẢN XUẤT ĐIỆN ẢNH THỰC TẾ • TỰ HÀNH KHÉP KÍN A-Z
            </div>
          </div>
        </div>

        {/* Credit + Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#0D121D] px-2.5 py-1 rounded-md border border-[#1E293B] text-[11px] font-mono">
            <span className="text-slate-400">CREDITS ĐÃ DÙNG:</span>
            <span className="text-[#00F0FF] font-bold">{usedCredits}</span>
            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded">ULTRA TIER</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>API TRỰC TIẾP</span>
          </div>
        </div>
      </div>

      {/* Hàng 2: Smart Command Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 bg-[#0D111A] p-2 rounded-xl border border-[#222C42] shadow-inner">
        {/* Input box */}
        <div className="flex-1 flex items-center bg-[#131826] rounded-lg border border-[#25324C] px-3 py-1.5 focus-within:border-[#00F0FF] transition-colors gap-2">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">terminal</span>
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            disabled={isRunning}
            placeholder="Nhập kịch bản bất kỳ (ví dụ: Hiệp sĩ rồng bay lượn trên sa mạc nham thạch, phóng sét tiêu diệt quái thú)..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
          />

          {/* Nút đính kèm ảnh có sẵn từ Media Gallery */}
          <button
            type="button"
            onClick={onSelectImageMedia}
            disabled={isRunning}
            title="Đổi ảnh hoặc nạp ảnh sản phẩm/nhân vật thật từ Media Gallery"
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border transition-all shrink-0 ${
              uploadedImageName
                ? 'bg-cyan-950/80 text-[#00F0FF] border-[#00F0FF]/50'
                : 'bg-[#182132] hover:bg-[#202C44] text-slate-300 border-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">add_photo_alternate</span>
            <span className="hidden sm:inline truncate max-w-[110px]">
              {uploadedImageName || 'Nạp ảnh thật'}
            </span>
          </button>
        </div>

        {/* Cấu hình nhanh: Thể loại + Tỷ lệ + Chế độ chạy */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 shrink-0">
          {/* Thể loại */}
          <div className="flex items-center bg-[#131826] rounded-lg border border-[#25324C] p-0.5 text-xs font-mono">
            <button
              onClick={() => setGenre('action_scifi')}
              disabled={isRunning}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                genre === 'action_scifi'
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">precision_manufacturing</span>
              <span>Mecha Sci-Fi</span>
            </button>
            <button
              onClick={() => setGenre('tvc_commercial')}
              disabled={isRunning}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                genre === 'tvc_commercial'
                  ? 'bg-amber-500/20 text-amber-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">shopping_bag</span>
              <span>TVC Bán Hàng</span>
            </button>
            <button
              onClick={() => setGenre('short_entertainment')}
              disabled={isRunning}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                genre === 'short_entertainment'
                  ? 'bg-purple-500/20 text-purple-300 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">movie</span>
              <span>Giải Trí Ngắn</span>
            </button>
          </div>

          {/* Tỷ lệ (16:9 | 9:16) */}
          <div className="flex items-center bg-[#131826] rounded-lg border border-[#25324C] p-0.5 text-xs font-mono">
            <button
              onClick={() => setAspectRatio('16:9')}
              disabled={isRunning}
              className={`px-2 py-1 rounded font-bold transition-all ${
                aspectRatio === '16:9' ? 'bg-[#00F0FF] text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              16:9
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              disabled={isRunning}
              className={`px-2 py-1 rounded font-bold transition-all ${
                aspectRatio === '9:16' ? 'bg-[#00F0FF] text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              9:16
            </button>
          </div>

          {/* Chế độ chạy: Nháp Siêu Tốc (Omni 1.1 Flash) vs Bản Đẹp (Veo 3.1 Fast) */}
          <div className="flex items-center bg-[#131826] rounded-lg border border-[#25324C] p-0.5 text-xs font-mono">
            <button
              onClick={() => setRunMode('draft_ultrafast')}
              disabled={isRunning}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                runMode === 'draft_ultrafast'
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Sử dụng Omni 1.1 Flash 360p (render nhanh)"
            >
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              <span>⚡ Omni Flash</span>
            </button>
            <button
              onClick={() => setRunMode('master_cinematic')}
              disabled={isRunning}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                runMode === 'master_cinematic'
                  ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 font-bold border border-amber-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Sử dụng Veo 3.1 - Fast 720p"
            >
              <span className="material-symbols-outlined text-[14px]">movie_filter</span>
              <span>🎬 Veo 3.1 Fast</span>
            </button>
          </div>

          {/* NÚT TỰ ĐỘNG CHẠY PIPELINE */}
          <button
            onClick={onLaunchAutoProduce}
            disabled={isRunning || !promptInput.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-[#00F0FF] via-[#0284C7] to-blue-600 hover:brightness-110 active:scale-[0.98] text-black font-mono font-black text-xs md:text-sm rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.45)] flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isRunning ? 'sync' : 'rocket_launch'}
            </span>
            <span className="tracking-wide">
              {isRunning ? 'ĐANG CHẠY PIPELINE...' : '🚀 SẢN XUẤT TỰ ĐỘNG TOÀN BỘ PHIM'}
            </span>
          </button>
        </div>
      </div>

      {/* Banner tiến độ tự hành thời gian thực kèm thanh % thực tế */}
      {isRunning && (
        <div className="mt-2.5 p-2.5 bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-purple-950/80 border border-[#00F0FF]/50 rounded-lg flex flex-col gap-1.5 text-xs font-mono text-[#00F0FF] shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-[16px] animate-spin text-[#00F0FF]">sync</span>
              <span className="font-bold truncate">{pipelineProgressText}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white font-black">{pipelineProgressPercent}%</span>
              <span className="text-[10px] text-slate-300 bg-black/60 px-2 py-0.5 rounded border border-slate-700 uppercase font-bold">
                {pipelineStep.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Thanh % thực tế */}
          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-cyan-800">
            <div 
              className="h-full bg-gradient-to-r from-[#00F0FF] to-blue-500 transition-all duration-300"
              style={{ width: `${pipelineProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Hiển thị lỗi chi tiết từ API nếu có */}
      {pipelineErrorDetail && (
        <div className="mt-2 p-2.5 bg-red-950/80 border border-red-500/60 rounded-lg text-xs font-mono text-red-200 flex items-start gap-2 shadow-lg">
          <span className="material-symbols-outlined text-red-400 text-[18px] shrink-0">error</span>
          <div className="flex-1">
            <div className="font-bold text-red-300 mb-0.5">LỖI THỰC THI PIPELINE:</div>
            <div className="break-all text-[11px] opacity-90">{pipelineErrorDetail}</div>
          </div>
        </div>
      )}
    </div>
  );
};