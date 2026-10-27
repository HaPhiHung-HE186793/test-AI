import React, { useState } from 'react';
import { Flow } from 'flow-sdk';
import { TimelineShot } from '../types/cinemaCore';

interface MasterTimelineProps {
  shots: TimelineShot[];
}

export const MasterTimeline: React.FC<MasterTimelineProps> = ({ shots }) => {
  const [activeShotPreview, setActiveShotPreview] = useState<TimelineShot | null>(shots[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const totalDuration = shots.reduce((acc, s) => acc + s.targetDurationSeconds, 0);

  const handleDownloadMasterCut = async () => {
    // Generate script/EDL export file
    const edlData = {
      project: 'HYPERION_STUDIO_OS_MASTER_CUT',
      exportedAt: new Date().toISOString(),
      totalDurationSeconds: totalDuration,
      shots: shots.map((s) => ({
        shotNumber: s.shotNumber,
        scene: s.sceneHeading,
        lens: s.lensPreset,
        transition: s.cameraTransitionType,
        hasMasterFootage: Boolean(s.takes.find((t) => t.isSelectedForMaster)),
      })),
    };

    setExportStatus('Đang xuất tệp kịch bản dựng EDL JSON...');
    try {
      const json = JSON.stringify(edlData, null, 2);
      const bytes = new TextEncoder().encode(json);
      const base64 = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));

      await Flow.download({
        base64,
        mimeType: 'application/json',
        filename: 'hyperion_master_timeline.json',
      });

      setExportStatus('✓ Đã tải xuống file Master Timeline EDL thành công!');
      setTimeout(() => setExportStatus(null), 3500);
    } catch (err: any) {
      setExportStatus('Lỗi xuất tệp: ' + (err?.message || 'Không thể download'));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-hidden">
      {/* Top Preview Cinema Scope */}
      <div className="h-64 bg-[#05060A] border-b border-[#1A2234] flex items-center justify-center relative p-4">
        {activeShotPreview?.takes.find((t) => t.isSelectedForMaster)?.videoUrl ? (
          <video
            src={activeShotPreview.takes.find((t) => t.isSelectedForMaster)?.videoUrl}
            controls
            autoPlay
            loop
            className="h-full max-w-full rounded border border-[#1F293D] shadow-2xl"
          />
        ) : (
          <div className="text-center">
            <span className="material-symbols-outlined text-[36px] text-slate-600 block mb-2">cinematic_blur</span>
            <div className="text-xs font-mono text-slate-400">
              {activeShotPreview ? `SHOT #${activeShotPreview.shotNumber} CHƯA CÓ MASTER FOOTAGE` : 'CHỌN SHOT TRÊN TIMELINE'}
            </div>
            <div className="text-[10px] font-mono text-slate-600 mt-1">
              Quay video trong Tab 2 (Director Stage) để đưa footage vào Master Cut
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 bg-black/80 px-2.5 py-1 rounded border border-[#1D2538] text-[10px] font-mono text-cyan-400">
          TIMECODE: 00:00:{activeShotPreview ? activeShotPreview.shotNumber * 4 : '00'}:00
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={handleDownloadMasterCut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] rounded text-xs font-mono font-bold transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>XUẤT MASTER EDL</span>
          </button>
        </div>
      </div>

      {exportStatus && (
        <div className="p-2 bg-[#00F0FF]/10 text-[#00F0FF] text-xs font-mono text-center border-b border-[#00F0FF]/20">
          {exportStatus}
        </div>
      )}

      {/* Timeline Controls Bar */}
      <div className="h-10 bg-[#0B0E16] border-b border-[#1A2234] flex items-center justify-between px-4 text-xs font-mono text-slate-400 select-none">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-[#00F0FF]">auto_videocam</span>
            SEQUENCE 01 [ACT I: HANGAR LAUNCH]
          </span>
          <span>TỔNG THỜI LƯỢNG: {totalDuration}s</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#151D2E] hover:bg-[#1E2940] text-cyan-300 border border-[#232F48]"
          >
            <span className="material-symbols-outlined text-[16px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Track Timeline Canvas */}
      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 space-y-3 bg-[#080B12]">
        {/* Track V1: Video Master Track */}
        <div className="bg-[#0C101A] border border-[#192236] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800 text-[11px] font-mono">
            <span className="text-white font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-[#00F0FF]"></span>
              VIDEO TRACK 1 (V1: MASTER MASTER CUT)
            </span>
            <span className="text-slate-500">{shots.length} CLIPS</span>
          </div>

          <div className="flex gap-2 min-w-max pb-2">
            {shots.map((shot) => {
              const masterTake = shot.takes.find((t) => t.isSelectedForMaster);
              const isSelected = activeShotPreview?.id === shot.id;

              return (
                <div
                  key={shot.id}
                  onClick={() => setActiveShotPreview(shot)}
                  className={`h-24 w-44 rounded border p-2 flex flex-col justify-between transition-all cursor-pointer relative select-none ${
                    isSelected
                      ? 'bg-[#15233A] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                      : 'bg-[#0E1422] border-[#1D273C] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-white">SHOT #{shot.shotNumber}</span>
                    <span className="text-[9px] font-mono text-[#00F0FF]">{shot.targetDurationSeconds}s</span>
                  </div>

                  <div className="text-[10px] font-mono text-slate-300 line-clamp-1">{shot.sceneHeading}</div>

                  <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-slate-800">
                    <span className="text-slate-400">{shot.lensPreset.split('_')[0]}</span>
                    <span className={masterTake ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      {masterTake ? '✓ MASTER' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Track A1: Audio FX / SFX Track */}
        <div className="bg-[#0C101A] border border-[#192236] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800 text-[11px] font-mono">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-amber-400"></span>
              AUDIO TRACK 1 (A1: MECHA SFX & HYPER-PULSE)
            </span>
            <span className="text-slate-500">96 kHz / 24-bit</span>
          </div>

          <div className="flex gap-2 min-w-max">
            {shots.map((shot) => (
              <div
                key={shot.id}
                className="h-12 w-44 rounded bg-[#10141E] border border-[#1D2536] p-1.5 flex flex-col justify-between"
              >
                <span className="text-[9px] font-mono text-amber-300 truncate">{shot.audioSpec.sfxLayer}</span>
                <div className="w-full h-2 bg-[#171D2B] rounded-sm overflow-hidden flex items-center gap-0.5 px-0.5">
                  <div className="w-1 h-full bg-amber-400/80 rounded-full animate-pulse"></div>
                  <div className="w-2 h-3/4 bg-amber-400/50 rounded-full"></div>
                  <div className="w-1.5 h-1/2 bg-amber-400/40 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};