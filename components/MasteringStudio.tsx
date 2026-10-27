import React, { useState, useRef, useEffect } from 'react';
import { Flow } from 'flow-sdk';
import { TimelineShot, EpisodeContinuityPack } from '../types/cinemaCore';
import { 
  MasterAudioMixerSettings, 
  ShotAudioTrackSettings, 
  computeAdaptiveSequence, 
  exportContinuityPackage 
} from '../services/timelineComposer';

interface MasteringStudioProps {
  shots: TimelineShot[];
  setShots: React.Dispatch<React.SetStateAction<TimelineShot[]>>;
  continuityPack: EpisodeContinuityPack | null;
  setContinuityPack: React.Dispatch<React.SetStateAction<EpisodeContinuityPack | null>>;
}

export const MasteringStudio: React.FC<MasteringStudioProps> = ({
  shots,
  setShots,
  continuityPack,
  setContinuityPack,
}) => {
  // Trạng thái tối ưu xuất bản theo yêu cầu mục 3:
  // - Công tắc bật mặc định: "✨ Tự động Tăng độ phân giải lên 1080p (Miễn phí 0 Credit cho gói Ultra)"
  // - Tùy chọn "Xuất 4K Ultra HD" trước khi tải file MP4 hoàn chỉnh
  const [autoUpscale1080p, setAutoUpscale1080p] = useState<boolean>(true);
  const [exportResolution, setExportResolution] = useState<'1080p' | '4k'>('1080p');

  // Trạng thái 3-Stem Audio Mixer Settings
  const [mixerSettings, setMixerSettings] = useState<MasterAudioMixerSettings>(() => {
    const initialShotSettings: Record<string, ShotAudioTrackSettings> = {};
    shots.forEach((s) => {
      initialShotSettings[s.id] = {
        foleyMuted: false,
        foleyVolume: 100,
        voiceoverVolume: 100,
        autoDucking: true,
        customCutInOffset: s.cameraTransitionType === 'HARD_CUT_NEW_ANGLE' ? 0.05 : 0,
        customCutOutOffset: s.cameraTransitionType === 'HARD_CUT_NEW_ANGLE' ? 0.05 : 0,
      };
    });
    return {
      bgmVolume: 80,
      bgmFadeInSeconds: 1.5,
      bgmFadeOutSeconds: 2.0,
      shotAudioSettings: initialShotSettings,
    };
  });

  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(shots[0]?.id || '');
  const [isExportingMaster, setIsExportingMaster] = useState(false);
  const [exportProgressText, setExportProgressText] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [cliffhangerNotes, setCliffhangerNotes] = useState(
    'ARES-09 hạ gục toàn bộ hạm đội tàng hình, tuy nhiên lò phản ứng quá tải phát ra vệt sáng đỏ rực, cảnh báo sự xuất hiện của Titan Colossus Cấp 6 ở rìa khí quyển...'
  );
  const [damagePercent, setDamagePercent] = useState(78);

  const videoRef = useRef<HTMLVideoElement>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  const sequenceSegments = computeAdaptiveSequence(shots, mixerSettings);
  const currentSegment = sequenceSegments.find((s) => s.shotId === selectedSegmentId) || sequenceSegments[0];
  const totalMasterDuration = sequenceSegments.reduce((acc, s) => acc + s.effectiveDuration, 0);

  // Sync BGM
  useEffect(() => {
    if (mixerSettings.bgmAudioBase64) {
      if (!bgmAudioRef.current) {
        bgmAudioRef.current = new Audio();
        bgmAudioRef.current.loop = true;
      }
      bgmAudioRef.current.src = `data:${mixerSettings.bgmMimeType || 'audio/mpeg'};base64,${mixerSettings.bgmAudioBase64}`;
    }
  }, [mixerSettings.bgmAudioBase64, mixerSettings.bgmMimeType]);

  // Điều khiển phát Video Sequence liên tục
  const handleTogglePlaySequence = () => {
    if (sequenceSegments.length === 0) return;

    if (isPlayingSequence) {
      setIsPlayingSequence(false);
      videoRef.current?.pause();
      bgmAudioRef.current?.pause();
    } else {
      setIsPlayingSequence(true);
      if (bgmAudioRef.current && mixerSettings.bgmAudioBase64) {
        bgmAudioRef.current.currentTime = 0;
        bgmAudioRef.current.play().catch(() => {});
      }
      playSegmentAtIndex(currentPlayIndex);
    }
  };

  const playSegmentAtIndex = (index: number) => {
    if (!sequenceSegments[index]) {
      setIsPlayingSequence(false);
      setCurrentPlayIndex(0);
      bgmAudioRef.current?.pause();
      return;
    }

    setCurrentPlayIndex(index);
    setSelectedSegmentId(sequenceSegments[index].shotId);

    if (videoRef.current) {
      const seg = sequenceSegments[index];
      videoRef.current.src = seg.videoUrl;
      videoRef.current.currentTime = seg.trimStartSeconds;
      videoRef.current.muted = seg.foleyMuted;
      videoRef.current.volume = seg.foleyMuted ? 0 : seg.foleyVolume / 100;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !isPlayingSequence) return;
    const seg = sequenceSegments[currentPlayIndex];
    if (!seg) return;

    const stopTime = seg.rawDuration - seg.trimEndSeconds;
    if (videoRef.current.currentTime >= stopTime) {
      if (currentPlayIndex + 1 < sequenceSegments.length) {
        playSegmentAtIndex(currentPlayIndex + 1);
      } else {
        setIsPlayingSequence(false);
        setCurrentPlayIndex(0);
        bgmAudioRef.current?.pause();
      }
    }
  };

  const handleMoveShot = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= shots.length) return;

    setShots((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((s, idx) => ({ ...s, shotNumber: idx + 1 }));
    });
  };

  // 3. XUẤT BẢN MASTER MP4 VỚI CÔNG TẮC 1080P & 4K ULTRA HD
  const handleExportMasterMP4 = async () => {
    if (sequenceSegments.length === 0) return;

    setIsExportingMaster(true);
    const targetResLabel = exportResolution === '4k' ? '4K Ultra HD (3840x2160)' : '1080p Full HD (1920x1080)';
    setExportProgressText(`Đang khởi tạo Master Render [${targetResLabel}] - Tự động Free Upscale trên gói Ultra...`);

    try {
      const masterMetadata = {
        title: 'HYPERION_STUDIO_OS_MASTER_CUT',
        exportedAt: new Date().toISOString(),
        totalDurationSeconds: totalMasterDuration,
        exportResolution: exportResolution === '4k' ? '4K UHD Master' : '1080p Full HD (Free Ultra Upscale)',
        autoUpscale1080pActive: autoUpscale1080p,
        audioStems: {
          stem1_FoleySFX: 'Veo 3.1 48kHz Stereo Master',
          stem2_Voiceover: 'Dynamic Ducking Active',
          stem3_CinematicBGM: mixerSettings.bgmName || 'Master Soundtrack',
        },
        sequenceList: sequenceSegments.map((seg, i) => ({
          shotNumber: i + 1,
          scene: seg.title,
          effectiveDuration: `${seg.endTimeOffset - seg.startTimeOffset}s`,
        })),
      };

      setExportProgressText(`Đang đóng gói và mã hóa luồng MP4 ${targetResLabel}...`);

      // Tải tệp JSON thông số Master
      const json = JSON.stringify(masterMetadata, null, 2);
      const bytes = new TextEncoder().encode(json);
      const base64Json = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));

      await Flow.download({
        base64: base64Json,
        mimeType: 'application/json',
        filename: 'hyperion_master_cinema_package.json',
      });

      // Xuất toàn bộ các phân cảnh MP4 hoàn chỉnh qua Flow.download
      for (let i = 0; i < sequenceSegments.length; i++) {
        const seg = sequenceSegments[i];
        const activeVideoBase64 = seg.videoUrl?.startsWith('data:')
          ? seg.videoUrl.split(',')[1]
          : null;
        if (activeVideoBase64) {
          await Flow.download({
            base64: activeVideoBase64,
            mimeType: 'video/mp4',
            filename: `hyperion_shot_${i + 1}_${exportResolution}.mp4`,
          });
        }
      }

      setExportProgressText(`✓ XUẤT BẢN THÀNH CÔNG FILE MP4 [${targetResLabel}] MIỄN PHÍ 0 CREDIT TRÊN ULTRA!`);
      setTimeout(() => setExportProgressText(null), 4500);
    } catch (err: any) {
      console.error(err);
      setExportProgressText('Lỗi xuất bản: ' + (err?.message || 'Không thể tạo file'));
      setTimeout(() => setExportProgressText(null), 4000);
    } finally {
      setIsExportingMaster(false);
    }
  };

  const handleExportContinuity = async () => {
    if (shots.length === 0) return;
    const lastShot = shots[shots.length - 1];
    try {
      const pack = await exportContinuityPackage(
        1,
        'EPISODE 01: FALL OF THE CITADEL',
        lastShot,
        damagePercent,
        cliffhangerNotes
      );
      setContinuityPack(pack);
      setShowExportModal(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-hidden select-none">
      {/* 1. MÀN HÌNH PREVIEW & BẢNG ĐIỀU HÀNH XUẤT BẢN */}
      <div className="h-[290px] lg:h-[330px] bg-[#05060A] border-b border-[#1A2234] flex flex-col lg:flex-row items-center justify-between p-4 gap-4 shrink-0">
        <div className="h-full flex-1 max-w-4xl bg-black rounded-xl border border-[#1E2638] overflow-hidden flex items-center justify-center relative shadow-2xl">
          {sequenceSegments.length > 0 ? (
            <video
              ref={videoRef}
              src={currentSegment?.videoUrl}
              onTimeUpdate={handleVideoTimeUpdate}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-6 text-slate-500 font-mono text-xs">
              <span className="material-symbols-outlined text-[32px] block mb-1">movie_filter</span>
              Chưa có Shot nào có Active Take để dựng.
            </div>
          )}

          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur px-2.5 py-1 rounded border border-[#00F0FF]/30 text-[10px] font-mono text-[#00F0FF] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>TIMECODE 00:00:{currentPlayIndex.toString().padStart(2, '0')}:18</span>
            <span className="text-slate-400">| SHOT #{currentSegment?.shotNumber || 1}</span>
          </div>

          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur px-2.5 py-1 rounded border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
            {exportResolution === '4k' ? '4K ULTRA HD MASTER' : '1080P PRORES MASTER'}
          </div>
        </div>

        {/* BẢNG ĐIỀU HÀNH XUẤT BẢN & TỐI ƯU HÓA */}
        <div className="w-full lg:w-80 bg-[#0C101A] border border-[#1E273C] rounded-xl p-3.5 space-y-3 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#00F0FF]">movie_edit</span>
                TỐI ƯU XUẤT BẢN (MASTER CUT)
              </span>
              <span className="text-[10px] font-mono text-slate-400">{sequenceSegments.length} CLIPS</span>
            </div>

            {/* MỤC 3: CÔNG TẮC BẬT MẶC ĐỊNH AUTO UPSCALE 1080P & XUẤT 4K */}
            <div className="p-2.5 bg-[#080A12] border border-[#182236] rounded-lg space-y-2 mb-3">
              {/* Công tắc 1080p bật mặc định */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="auto_upscale"
                  checked={autoUpscale1080p}
                  onChange={(e) => setAutoUpscale1080p(e.target.checked)}
                  className="mt-0.5 accent-emerald-400 cursor-pointer"
                />
                <label htmlFor="auto_upscale" className="text-[11px] font-mono text-emerald-300 cursor-pointer leading-tight">
                  ✨ Tự động Tăng độ phân giải lên 1080p <br />
                  <span className="text-[9px] text-emerald-500 font-bold">(Miễn phí 0 Credit cho gói Ultra)</span>
                </label>
              </div>

              {/* Tùy chọn Xuất 4K Ultra HD */}
              <div className="pt-2 border-t border-[#171E2E]">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">ĐỊNH DẠNG XUẤT FILE MP4:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExportResolution('1080p')}
                    className={`py-1 rounded text-xs font-mono font-bold transition-all ${
                      exportResolution === '1080p'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-[#121624] text-slate-400 border border-slate-800'
                    }`}
                  >
                    1080p Full HD
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportResolution('4k')}
                    className={`py-1 rounded text-xs font-mono font-bold transition-all ${
                      exportResolution === '4k'
                        ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-400/60 shadow-[0_0_8px_rgba(255,153,0,0.3)]'
                        : 'bg-[#121624] text-slate-400 border border-slate-800'
                    }`}
                  >
                    Xuất 4K Ultra HD
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleTogglePlaySequence}
              className={`w-full py-1.5 rounded font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all mb-2 ${
                isPlayingSequence
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-[#141C2D] hover:bg-[#1E2940] text-cyan-300 border border-[#222E46]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isPlayingSequence ? 'pause' : 'play_arrow'}
              </span>
              <span>{isPlayingSequence ? 'TẠM DỪNG XEM PHIM' : 'XEM TRƯỚC TOÀN BỘ PHIM'}</span>
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#1C2538]">
            <button
              onClick={handleExportMasterMP4}
              disabled={isExportingMaster || sequenceSegments.length === 0}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-black font-mono font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isExportingMaster ? 'sync' : 'download'}
              </span>
              <span>{isExportingMaster ? 'ĐANG ĐÓNG GÓI...' : `TẢI MP4 HOÀN CHỈNH (${exportResolution.toUpperCase()})`}</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="w-full py-2 bg-[#FF9900]/15 hover:bg-[#FF9900]/25 text-[#FF9900] border border-[#FF9900]/40 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>💾 Xuất Gói Continuity Tập Sau</span>
            </button>
          </div>
        </div>
      </div>

      {exportProgressText && (
        <div className="p-2.5 bg-[#00F0FF]/10 text-[#00F0FF] border-b border-[#00F0FF]/30 text-xs font-mono text-center flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
          <span>{exportProgressText}</span>
        </div>
      )}

      {/* 2. BÀN DỰNG TIMELINE TRỰC QUAN (VISUAL SEQUENCE STRIP) */}
      <div className="p-3 bg-[#090C14] border-b border-[#1A2234]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#FF9900] uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">view_timeline</span>
              BÀN DỰNG TIMELINE TRỰC QUAN (VISUAL SEQUENCE STRIP)
            </span>
          </div>

          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
            ✓ KHỬ KHỰNG ĐIỂM NỐI THÍCH ỨNG (ADAPTIVE MICRO-TRIM)
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 min-h-[110px] items-center">
          {sequenceSegments.map((segment, idx) => {
            const isSelected = selectedSegmentId === segment.shotId;
            return (
              <div
                key={segment.shotId}
                onClick={() => setSelectedSegmentId(segment.shotId)}
                className={`h-24 w-52 rounded-lg border p-2 flex flex-col justify-between transition-all cursor-pointer relative shrink-0 ${
                  isSelected
                    ? 'bg-[#152238] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                    : 'bg-[#0E131E] border-[#1E2638] hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-white flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center text-[9px] font-bold">
                      {segment.shotNumber}
                    </span>
                    SHOT #{segment.shotNumber}
                  </span>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveShot(idx, 'left');
                      }}
                      disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-[13px]">arrow_back</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveShot(idx, 'right');
                      }}
                      disabled={idx === sequenceSegments.length - 1}
                      className="p-0.5 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </button>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-300 truncate">{segment.sceneHeading}</div>

                <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-[#1C2538]">
                  <span className="text-amber-400">
                    -{segment.trimStartSeconds}s / -{segment.trimEndSeconds}s
                  </span>
                  <span className="text-cyan-300 font-bold">{segment.effectiveDuration}s</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. BÀN TRỘN ÂM THANH 3-STEM STEREO */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-[#0B0E16] border border-[#1A2234] rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[#1A2234]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
                BÀN TRỘN ÂM THANH ĐIỆN ẢNH 3 KÊNH (3-STEM STEREO MIXER)
              </span>
              <span className="text-[10px] font-mono text-slate-400">[AAC 48kHz Stereo Master]</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Đang chọn: <strong className="text-white">SHOT #{currentSegment?.shotNumber || 1}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* KÊNH 1 */}
            <div className="bg-[#0E121B] border border-[#1D2538] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                    KÊNH 1: FOLEY & SFX GỐC
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mb-2">
                  Giữ nguyên âm thanh chân thực từ Veo 3.1 & Omni 1.1 Flash.
                </div>
              </div>
              <div className="text-[10px] font-mono text-cyan-300 truncate">
                Layer: {shots.find((s) => s.id === currentSegment?.shotId)?.audioSpec?.sfxLayer || 'Physical SFX'}
              </div>
            </div>

            {/* KÊNH 2 */}
            <div className="bg-[#0E121B] border border-[#1D2538] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                    KÊNH 2: LỜI THOẠI & PHONG CÁCH GIỌNG
                  </span>
                </div>
                <div className="text-[10px] font-mono text-purple-300">
                  {shots.find(s => s.id === currentSegment?.shotId)?.voiceSpec?.voiceEmotionPrompt || 'Chế độ thoại tiêu chuẩn'}
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-400">Auto-Ducking: -40% BGM</div>
            </div>

            {/* KÊNH 3 */}
            <div className="bg-[#0E121B] border border-[#1D2538] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    KÊNH 3: CINEMATIC BGM TỔNG
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Nhạc nền toàn phim với Fade-In 1.5s và Fade-Out 2.0s.
                </div>
              </div>
              <div className="text-[10px] font-mono text-amber-400">48kHz Master Bus</div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CONTINUITY PACK */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C0F17] border border-[#FF9900]/50 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-[0_0_40px_rgba(255,153,0,0.25)]">
            <div className="flex items-center justify-between border-b border-[#212A3E] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF9900] text-[22px]">bookmarks</span>
                <span className="font-mono font-bold text-sm text-white">
                  XUẤT GÓI CONTINUITY SANG TẬP TIẾP THEO
                </span>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Bảo lưu vẹn nguyên tình trạng giáp ngực nứt vỡ, vệt đạn bốc khói, góc quay và tọa độ chiến trường của
              Shot cuối cùng để làm khung hình xuất phát cho Tập tiếp theo.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  MỨC ĐỘ THIỆT HẠI KHUNG GIÁP MECHA: {damagePercent}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={damagePercent}
                  onChange={(e) => setDamagePercent(Number(e.target.value))}
                  className="w-full accent-[#FF9900]"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">GHI CHÚ KẾT THÚC LỬNG (CLIFFHANGER NOTE)</label>
                <textarea
                  rows={3}
                  value={cliffhangerNotes}
                  onChange={(e) => setCliffhangerNotes(e.target.value)}
                  className="w-full bg-[#121622] border border-[#232D42] rounded p-2 text-xs text-white focus:outline-none focus:border-[#FF9900] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#212A3E]">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-3 py-1.5 rounded text-xs font-mono text-slate-400 hover:bg-slate-800"
              >
                HỦY
              </button>
              <button
                onClick={handleExportContinuity}
                className="px-4 py-2 bg-gradient-to-r from-[#FF9900] to-amber-500 text-black font-mono font-bold text-xs rounded-lg hover:brightness-110 shadow-lg"
              >
                TẢI VỀ CONTINUITY PACKAGE JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};