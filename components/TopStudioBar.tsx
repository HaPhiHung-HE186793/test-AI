import React from 'react';
import { UserExperienceMode } from '../types/cinemaCore';
import { ULTRA_TIER_TOTAL_BUDGET } from '../services/creditTelemetry';

interface TopStudioBarProps {
  activeTab: 'vault' | 'director' | 'production' | 'assembly';
  setActiveTab: (tab: 'vault' | 'director' | 'production' | 'assembly') => void;
  userMode: UserExperienceMode;
  setUserMode: (mode: UserExperienceMode) => void;
  usedCredits: number;
  pendingEstimate?: number;
}

export const TopStudioBar: React.FC<TopStudioBarProps> = ({
  activeTab,
  setActiveTab,
  userMode,
  setUserMode,
  usedCredits,
  pendingEstimate = 0,
}) => {
  const remaining = Math.max(0, ULTRA_TIER_TOTAL_BUDGET - usedCredits);
  const percentage = Math.min(100, (usedCredits / ULTRA_TIER_TOTAL_BUDGET) * 100);

  return (
    <header className="h-16 bg-[#08090D] border-b border-[#1E2330] flex items-center justify-between px-3 md:px-5 select-none shrink-0 z-20 gap-3">
      {/* Brand & Workspace Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-gradient-to-br from-[#00F0FF] via-[#0284C7] to-[#0D47A1] p-[1px] flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
          <div className="w-full h-full bg-[#0B0D12] rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-[#00F0FF] text-[22px]">smart_toy</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs md:text-sm tracking-[0.2em] text-[#00F0FF]">HYPERION</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 hidden sm:inline">
              STUDIO OS
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/30 font-semibold tracking-wider">
              ULTRA
            </span>
          </div>
          <div className="text-[9px] text-slate-400 font-mono tracking-wider">
            {userMode === 'easy_autopilot' ? 'CHẾ ĐỘ TỰ ĐỘNG LÀM PHIM A-Z' : 'HỆ ĐIỀU HÀNH ĐẠO DIỄN CHUYÊN NGHIỆP'}
          </div>
        </div>
      </div>

      {/* 1. CÔNG TẮC CHUYỂN ĐỔI CHẾ ĐỘ: NGƯỜI MỚI vs ĐẠO DIỄN */}
      <div className="flex items-center bg-[#0B0E16] p-1 rounded-xl border border-[#212A3E] shadow-inner">
        <button
          onClick={() => setUserMode('easy_autopilot')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            userMode === 'easy_autopilot'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_14px_rgba(16,185,129,0.4)] scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">flight_takeoff</span>
          <span>Chế Độ Người Mới (Auto-Pilot)</span>
        </button>

        <button
          onClick={() => setUserMode('director_pro')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
            userMode === 'director_pro'
              ? 'bg-gradient-to-r from-[#00F0FF] to-blue-600 text-black shadow-[0_0_14px_rgba(0,240,255,0.4)] scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">tune</span>
          <span>Chế Độ Đạo Diễn (Pro Mode)</span>
        </button>
      </div>

      {/* Tabs navigation: 4 Tab Studio */}
      <div className="hidden lg:flex items-center bg-[#0F121A] p-1 rounded-lg border border-[#1A2030] gap-1">
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono tracking-wider transition-all ${
            activeTab === 'vault'
              ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)] font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151926]'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">fingerprint</span>
          <span>1. BIBLE VAULT</span>
        </button>

        <button
          onClick={() => setActiveTab('director')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono tracking-wider transition-all ${
            activeTab === 'director'
              ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)] font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151926]'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">movie_filter</span>
          <span>2. DIRECTOR</span>
        </button>

        <button
          onClick={() => setActiveTab('production')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono tracking-wider transition-all ${
            activeTab === 'production'
              ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-[#FF9900] border border-[#FF9900]/50 shadow-[0_0_12px_rgba(255,153,0,0.25)] font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151926]'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">videocam</span>
          <span>3. PRODUCTION DECK</span>
        </button>

        <button
          onClick={() => setActiveTab('assembly')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono tracking-wider transition-all ${
            activeTab === 'assembly'
              ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_10px_rgba(0,240,255,0.2)] font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151926]'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">movie_edit</span>
          <span>4. MASTER CUT</span>
        </button>
      </div>

      {/* Credit Telemetry Bar */}
      <div className="flex items-center gap-3 bg-[#0D1017] px-3 py-1.5 rounded-lg border border-[#1A2234]">
        <div className="flex flex-col items-end min-w-[110px]">
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="text-slate-400">CREDITS:</span>
            <span className="text-[#00F0FF] font-bold">{remaining.toLocaleString()}</span>
          </div>

          <div className="w-full bg-[#171B26] h-1.5 rounded-full mt-1 overflow-hidden relative border border-[#232B3E]">
            <div
              className={`h-full transition-all duration-500 ${
                remaining < 2500 ? 'bg-red-500' : remaining < 6000 ? 'bg-[#FF9900]' : 'bg-gradient-to-r from-[#00F0FF] to-[#38BDF8]'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>SẴN SÀNG</span>
        </div>
      </div>
    </header>
  );
};