import os
import subprocess
from generate_phonetic_vo_and_score import V4_VO_LINES, V3_VO_LINES

OUT_DIR = "/mnt/data/backup/project_personal/test-AI/outputs/dinosaur_colosseum_battle_v3_scenebuilder"
TRIM_DIR = os.path.join(OUT_DIR, "clips_trimmed")
SCRATCH_DIR = "/home/user/.gemini/antigravity/brain/e3d13205-8936-4f70-958e-d9b3d70b8138/scratch"
VO_V4_DIR = os.path.join(SCRATCH_DIR, "vo_phonetic_v4_62s")
VO_V3_DIR = os.path.join(SCRATCH_DIR, "vo_phonetic_v3_120s")

def build_scores_ffmpeg():
    base_120 = os.path.join(SCRATCH_DIR, "epic_3act_orchestral_bed_120s.wav")
    v3_score = os.path.join(SCRATCH_DIR, "v3_upgraded_score_120s.wav")
    v4_score = os.path.join(SCRATCH_DIR, "v4_orchestral_bed_62s.wav")

    # 1. Upgrade 120s score: boost 92s-120s Coronation Finale & sustain through 119.9s so 01:49-01:59 never drops out!
    subprocess.run([
        "ffmpeg", "-y", "-i", base_120,
        "-filter_complex",
        "[0:a]asplit=2[main][tail];"
        "[tail]atrim=start=93.0:end=105.0,asetpts=PTS-STARTPTS,volume=1.55,aecho=0.8:0.88:60:0.25,afade=t=in:st=0:d=1.0,afade=t=out:st=10.5:d=1.5,adelay=108000|108000[coronation_tail];"
        "[main]volume=enable='between(t,92,120)':volume=1.35[main_boost];"
        "[main_boost][coronation_tail]amix=inputs=2:normalize=0,alimiter=limit=0.92[out]",
        "-map", "[out]", "-t", "120.0", v3_score
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 2. Build 62s Director's Cut V4 score synced to exact 9-shot structure:
    # 0-4s (Cold Open), 4-27s (136 BPM Taiko/Brass Combat), 27-33s (Amber Eye Awakening Riser), 33-50s (148 BPM Jaw-Lock & 41s Seismic Slam Climax), 50-62s (Majestic Coronation Finale)
    subprocess.run([
        "ffmpeg", "-y", "-i", v3_score,
        "-filter_complex",
        "[0:a]atrim=start=32.0:end=59.0,asetpts=PTS-STARTPTS,afade=t=out:st=26.5:d=0.5[s1];"
        "[0:a]atrim=start=71.5:end=77.5,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.4,afade=t=out:st=5.5:d=0.5[s2];"
        "[0:a]atrim=start=84.0:end=101.0,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.4,afade=t=out:st=16.5:d=0.5[s3];"
        "[0:a]atrim=start=108.0:end=120.0,asetpts=PTS-STARTPTS,volume=1.35,afade=t=in:st=0:d=0.5,afade=t=out:st=11.0:d=1.0[s4];"
        "[s1][s2][s3][s4]concat=n=4:v=0:a=1,alimiter=limit=0.92[out]",
        "-map", "[out]", "-t", "62.0", v4_score
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Built {v4_score} (62s) and {v3_score} (120s)")
    return v4_score, v3_score

def build_vo_and_ducked_bgm(vo_lines, vo_dir, score_wav, dur_sec, impact_times, whoosh_times, prefix):
    inputs = ["-f", "lavfi", "-t", str(dur_sec), "-i", "anullsrc=r=48000:cl=stereo"]
    filter_parts = []
    mix_labels = ["[0:a]"]
    duck_exprs = []

    for idx, (name, start_s, end_s, _) in enumerate(vo_lines, start=1):
        wav_path = os.path.join(vo_dir, f"{name}.wav")
        actual_dur = float(subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", wav_path
        ]).decode().strip())
        ws = start_s
        we = start_s + actual_dur
        duck_exprs.append(f"between(t,{ws:.2f},{we:.2f})")
        inputs.extend(["-i", wav_path])
        delay_ms = int(start_s * 1000)
        filter_parts.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms},volume=1.95[vo{idx}]")
        mix_labels.append(f"[vo{idx}]")

    amix = f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:normalize=0,alimiter=limit=0.95[outa]"
    out_vo = os.path.join(SCRATCH_DIR, f"{prefix}_master_vo.wav")
    subprocess.run(
        ["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filter_parts + [amix]), "-map", "[outa]", "-t", str(dur_sec), out_vo],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )

    # Apply -9.4dB (volume=0.34) automatic Audio Ducking on BGM whenever announcer speaks, swelling to 1.00 between VO lines & during impacts!
    duck_cond = "+".join(duck_exprs)
    ducked_score = os.path.join(SCRATCH_DIR, f"{prefix}_ducked_score.wav")
    subprocess.run([
        "ffmpeg", "-y", "-i", score_wav,
        "-af", f"volume='if(gt({duck_cond},0),0.36,1.00)':eval=frame",
        "-t", str(dur_sec), ducked_score
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    whoosh_wav = os.path.join(SCRATCH_DIR, "whip_whoosh.wav")
    slam_wav = os.path.join(SCRATCH_DIR, "seismic_slam.wav")
    bgm_inputs = ["-i", ducked_score]
    sfx_filters = []
    sfx_labels = ["[0:a]"]
    in_idx = 1
    for wt in whoosh_times:
        bgm_inputs.extend(["-i", whoosh_wav])
        ms = int(wt * 1000)
        sfx_filters.append(f"[{in_idx}:a]adelay={ms}|{ms},volume=1.65[wh{in_idx}]")
        sfx_labels.append(f"[wh{in_idx}]")
        in_idx += 1
    for st, vol in impact_times:
        bgm_inputs.extend(["-i", slam_wav])
        ms = int(st * 1000)
        sfx_filters.append(f"[{in_idx}:a]adelay={ms}|{ms},volume={vol}[sl{in_idx}]")
        sfx_labels.append(f"[sl{in_idx}]")
        in_idx += 1

    bgm_amix = f"{''.join(sfx_labels)}amix=inputs={len(sfx_labels)}:normalize=0,alimiter=limit=0.95[out]"
    out_bgm = os.path.join(SCRATCH_DIR, f"{prefix}_master_bgm_sfx.wav")
    subprocess.run(
        ["ffmpeg", "-y", *bgm_inputs, "-filter_complex", ";".join(sfx_filters + [bgm_amix]), "-map", "[out]", "-t", str(dur_sec), out_bgm],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    print(f"Built VO + Sidechain-Ducked BGM for {prefix}")
    return out_vo, out_bgm

def sec_to_ass(s):
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = s % 60
    return f"{h}:{m:02d}:{sec:05.2f}"

def sec_to_srt(s):
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = int(s % 60)
    ms = int(round((s - int(s)) * 1000))
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"

def write_ass_and_srt(ass_path, srt_path, top_bars, extra_events, vo_lines):
    ass_header = """[Script Info]
Title: Colosseum Dinosaur Battle Clean Broadcast HUD & Subtitles
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: SubVN,DejaVu Sans,34,&H00FFFFFF,&H0000FFFF,&H00000000,&H8C000000,-1,0,0,0,100,100,0,0,3,2.5,1,2,60,60,28,1
Style: TopBar,DejaVu Sans Mono,24,&H00E8F4FF,&H0000FFFF,&H00000000,&HA8080C14,-1,0,0,0,100,100,1,0,3,2,0,8,40,40,14,1
Style: HudRex,DejaVu Sans Mono,22,&H0058A8FF,&H0000FFFF,&H00000000,&HB80A101E,-1,0,0,0,100,100,0,0,3,2,0,7,40,40,56,1
Style: HudSpino,DejaVu Sans Mono,22,&H00FFDF40,&H0000FFFF,&H00000000,&HB8181208,-1,0,0,0,100,100,0,0,3,2,0,9,40,40,56,1
Style: CenterBanner,DejaVu Sans,36,&H0000D4FF,&H00FFFFFF,&H00000000,&HA8000000,-1,0,0,0,100,100,2,0,3,3,1,8,40,40,54,1
Style: WinnerBanner,DejaVu Sans,38,&H0000EAFF,&H00FFFFFF,&H00001840,&HC0000818,-1,0,0,0,100,100,2,0,3,3,1,8,40,40,54,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for s, e, txt in top_bars:
        events.append((1, s, e, "TopBar", txt))
    for layer, s, e, style, txt in extra_events:
        events.append((layer, s, e, style, txt))
    for _, s, e, txt in vo_lines:
        events.append((2, s, e, "SubVN", txt))

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_header)
        for layer, s, e, style, txt in events:
            f.write(f"Dialogue: {layer},{sec_to_ass(s)},{sec_to_ass(e)},{style},,0,0,0,,{txt}\n")

    with open(srt_path, "w", encoding="utf-8") as f:
        for idx, (_, s, e, txt) in enumerate(vo_lines, start=1):
            f.write(f"{idx}\n{sec_to_srt(s)} --> {sec_to_srt(e)}\n{txt}\n\n")

def mux_mp4(raw_video, bgm_wav, vo_wav, ass_path, clean_out, master_out, dur_sec):
    subprocess.run([
        "ffmpeg", "-y", "-i", raw_video, "-i", bgm_wav,
        "-filter_complex", "[0:a]volume=0.88[sfx];[1:a]volume=0.75[bgm];[sfx][bgm]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=11[aout]",
        "-map", "0:v:0", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "4000k", "-bufsize", "8000k", "-pix_fmt", "yuv420p", "-r", "24",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{dur_sec:.2f}",
        clean_out
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    ass_escaped = ass_path.replace("\\", "/").replace(":", "\\:")
    fc = (
        f"[0:v]ass='{ass_escaped}'[vout];"
        f"[0:a]volume=0.72[sfx];"
        f"[1:a]volume=0.82[bgm];"
        f"[2:a]volume=1.42[vo];"
        f"[sfx][bgm][vo]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=11[aout]"
    )
    subprocess.run([
        "ffmpeg", "-y", "-i", raw_video, "-i", bgm_wav, "-i", vo_wav,
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "4000k", "-bufsize", "8000k", "-pix_fmt", "yuv420p", "-r", "24",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{dur_sec:.2f}",
        master_out
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Muxed Master -> {master_out} & Clean -> {clean_out}")

def main():
    v4_score, v3_score = build_scores_ffmpeg()

    # 1. V4 (62.00s Director's Cut)
    v4_impacts = [(0.95, 1.8), (6.20, 1.6), (17.80, 1.6), (22.50, 1.5), (35.50, 1.6), (41.20, 2.1), (51.00, 1.6)]
    v4_vo, v4_bgm = build_vo_and_ducked_bgm(V4_VO_LINES, VO_V4_DIR, v4_score, 62.0, v4_impacts, [], "v4_62s")

    v4_top_bars = [
        (0.0, 4.0, "ĐẤU TRƯỜNG HẮC NHAM: KHỞI TRANH"),
        (4.0, 10.0, "IGNIS REX [100%] VS [100%] LEVIATHAN SPINO"),
        (10.0, 16.0, "IGNIS REX [88%] VS [86%] LEVIATHAN SPINO"),
        (16.0, 21.0, "TUYỆT KỸ: TRẢM VUỐT 8.200 PSI"),
        (21.0, 27.0, "IGNIS REX [52% NGUY CẤP] VS [82%] SPINO"),
        (27.0, 33.0, "IGNIS REX: KÍCH HOẠT CUỒNG NỘ"),
        (33.0, 41.0, "PHẢN ĐÒN: KHÓA HÀM 12.800 PSI"),
        (41.0, 50.0, "IGNIS REX [52%] VS [0% K.O.] LEVIATHAN SPINO"),
        (50.0, 62.0, "NHÀ VÔ ĐỊCH TUYỆT ĐỐI: IGNIS REX"),
    ]
    v4_ass = os.path.join(OUT_DIR, "v4_directors_cut_hud_and_subs.ass")
    v4_srt = os.path.join(OUT_DIR, "dinosaur_colosseum_battle_v4_directors_cut_62s.vi.srt")
    write_ass_and_srt(v4_ass, v4_srt, v4_top_bars, [], V4_VO_LINES)

    raw_v4 = os.path.join(TRIM_DIR, "raw_v4_directors_cut_62s.mp4")
    v4_clean_out = os.path.join(OUT_DIR, "dinosaur_colosseum_battle_v4_directors_cut_clean_62s.mp4")
    v4_master_out = os.path.join(OUT_DIR, "dinosaur_colosseum_battle_v4_directors_cut_62s.mp4")
    mux_mp4(raw_v4, v4_bgm, v4_vo, v4_ass, v4_clean_out, v4_master_out, 62.0)

    # 2. V3 (120.00s Upgraded Full Broadcast Master)
    v3_impacts = [(0.95, 1.8), (35.50, 1.6), (56.50, 1.6), (62.50, 1.5), (80.00, 1.6), (92.20, 2.1), (110.00, 1.6)]
    v3_whooshes = [15.75, 31.75]
    v3_vo, v3_bgm = build_vo_and_ducked_bgm(V3_VO_LINES, VO_V3_DIR, v3_score, 120.0, v3_impacts, v3_whooshes, "v3_120s")

    v3_top_bars = [
        (0.0, 4.0, "ĐẤU TRƯỜNG HẮC NHAM: KHỞI TRANH"),
        (4.0, 32.0, "ĐẤU TRƯỜNG HẮC NHAM  |  IGNIS REX [100%] VS [100%] LEVIATHAN SPINO"),
        (32.0, 43.5, "IGNIS REX [88%] VS [86%] LEVIATHAN SPINO  |  XUNG ĐỘT TÂM VÕ ĐÀI"),
        (43.5, 54.5, "IGNIS REX [82%] VS [84%] LEVIATHAN SPINO  |  GIẰNG CO ÁP SÁT"),
        (54.5, 62.5, "TUYỆT KỸ: TRẢM VUỐT 8.200 PSI  |  IGNIS REX [64%] VS [82%] SPINO"),
        (62.5, 72.0, "IGNIS REX [52% NGUY CẤP] VS [80%] LEVIATHAN SPINO"),
        (72.0, 78.0, "IGNIS REX: KÍCH HOẠT CUỒNG NỘ [52% BÙNG NỔ]"),
        (78.0, 92.0, "PHẢN ĐÒN: KHÓA HÀM 12.800 PSI  |  IGNIS REX [52%] VS [15%] SPINO"),
        (92.0, 109.0, "IGNIS REX [52%] VS [0% K.O.] LEVIATHAN SPINO"),
        (109.0, 120.0, "NHÀ VÔ ĐỊCH TUYỆT ĐỐI: IGNIS REX"),
    ]
    rex_card = (
        ">> CHIẾN BINH #01: IGNIS REX (CỔNG TÂY)\\N"
        "• LOÀI: Tyrannosaurus Rex ('Bạo Chúa Hắc Nham')\\N"
        "• THÔNG SỐ: Dài 13,5m | Nặng 9,8 Tấn | Giáp 92/100\\N"
        "• LỰC CẮN: 12.800 PSI [██████████] • TUYỆT KỸ: Khóa Hàm Nghiền Xương"
    )
    spino_card = (
        ">> CHIẾN BINH #02: LEVIATHAN SPINO (CỔNG ĐÔNG)\\N"
        "• LOÀI: Spinosaurus Aegyptiacus ('Thủy Quái Gai Lưng')\\N"
        "• THÔNG SỐ: Dài 15,8m | Buồm 2,2m | Nặng 10,5 Tấn\\N"
        "• LỰC VUỐT: 8.200 PSI [██████████] • TUYỆT KỸ: Trảm Vuốt Thủy Triều"
    )
    v3_extra = [
        (2, 4.4, 15.4, "HudRex", rex_card),
        (2, 16.6, 31.2, "HudSpino", spino_card),
    ]
    v3_ass = os.path.join(OUT_DIR, "v3_colosseum_hud_and_subs.ass")
    v3_srt = os.path.join(OUT_DIR, "dinosaur_colosseum_battle_v3_scenebuilder.vi.srt")
    write_ass_and_srt(v3_ass, v3_srt, v3_top_bars, v3_extra, V3_VO_LINES)

    raw_v3 = os.path.join(TRIM_DIR, "raw_monolithic_concat_120s.mp4")
    v3_clean_out = os.path.join(OUT_DIR, "dinosaur_colosseum_battle_v3_clean_no_hud.mp4")
    v3_master_out = os.path.join(OUT_DIR, "dinosaur_colosseum_battle_v3_scenebuilder_master_2min.mp4")
    mux_mp4(raw_v3, v3_bgm, v3_vo, v3_ass, v3_clean_out, v3_master_out, 120.0)

if __name__ == "__main__":
    main()
