import os
import subprocess

SCRATCH_DIR = "/home/user/.gemini/antigravity/brain/e3d13205-8936-4f70-958e-d9b3d70b8138/scratch"
V3_OUT_DIR = "/mnt/data/backup/project_personal/test-AI/outputs/dinosaur_colosseum_battle_v3_scenebuilder"
VO_DIR = os.path.join(SCRATCH_DIR, "vo_segments_v3")
os.makedirs(VO_DIR, exist_ok=True)
os.makedirs(V3_OUT_DIR, exist_ok=True)

# 7-Beat Camera-Angle & Whip-Pan Choreography Timeline (120.00s):
# Beat 1 (0.00s - 16.40s): C01 24mm Wide West Gate -> Whip-Pan Right at 16.40s
# Beat 2 (16.40s - 32.80s): C02 24mm Wide East Gate -> Whip-Pan Left at 32.80s
# Beat 3 (32.80s - 56.20s): C03 24mm Wide Center Arena Master Clash -> Cut to 85mm Close-Up at 56.20s
# Beat 4 (56.20s - 72.60s): C04 85mm Tight Telephoto Claw & Jaw Close-Up -> Whip-Pan Left/Down at 72.60s
# Beat 5 (72.60s - 92.00s): C05 Part A Worm's-Eye & 45° Flaming-Torch Wall Neck Lift -> Match-on-Action Cut at 92.00s
# Beat 6 (92.00s - 115.50s): C06 24mm Wide Center Arena Seismic Body-Slam & Foot-Stomp -> Cut to 85mm Hero Close-Up at 115.50s
# Beat 7 (115.50s - 120.00s): C05 Finale 85mm Extreme Worm's-Eye Close-Up Roar + Spielberg Dolly Push-In

VO_LINES = [
    ("v3_vo_01", 0.4, 4.8, "Chào mừng quý vị đến với Đấu Trường Hắc Nham! Trận tử chiến của hai siêu thực thể săn mồi tối thượng!"),
    ("v3_vo_02", 5.0, 15.8, "Ở góc đài bên trái: IGNIS REX, Khủng Long Bạo Chúa Tyrannosaurus Rex! Dài 13 phẩy 5 mét, nặng 9 phẩy 8 tấn, lực cắn nghiền xương 12 ngàn 800 P S I, giáp hắc nham 92 trên 100!"),
    ("v3_vo_03", 16.8, 32.2, "Ở góc đài bên phải: LEVIATHAN SPINO, Spinosaurus Aegyptiacus! Dài kỷ lục 15 phẩy 8 mét, nặng 10 phẩy 5 tấn, buồm lưng 2 phẩy 2 mét và bộ móng vuốt 8 ngàn 200 P S I! Trận chiến... BẮT ĐẦU!"),
    ("v3_vo_04", 33.2, 43.5, "Cả hai quái thú 10 tấn lao thẳng vào tâm võ đài! Cú va chạm 20 tấn làm mặt đất hắc nham rung chuyển dữ dội!"),
    ("v3_vo_05", 44.2, 55.4, "Ngay sau cú tông trực diện, hai gã khổng lồ khóa chặt hàm răng và vai, giằng co quyết liệt giữa tâm đấu trường!"),
    ("v3_vo_06", 56.6, 72.0, "Nguy hiểm cho Bạo Chúa! Spinosaurus tận dụng chiều cao, vung vuốt với lực tát 8 ngàn 200 P S I, ép Ignis Rex khuỵu gối và đè chặt xuống bùn!"),
    ("v3_vo_07", 73.0, 81.8, "Spinosaurus dồn toàn bộ 10 phẩy 5 tấn trọng lượng đè xuống! Nhưng đôi mắt hổ phách của Ignis Rex bỗng rực sáng dữ tợn!"),
    ("v3_vo_08", 82.2, 91.5, "PHẢN ĐÒN HỦY DIỆT! Ignis Rex bật dậy từ dưới bùn, khóa chặt hàm răng 12 ngàn 800 P S I vào thẳng cổ Spinosaurus và nhấc bổng!"),
    ("v3_vo_09", 92.4, 104.5, "MỘT CÚ QUẬT NGÀN CÂN! Bạo Chúa đập thẳng đối thủ 10 phẩy 5 tấn xuống sàn đá hắc nham nổ tung bụi mù!"),
    ("v3_vo_10", 105.2, 119.5, "Chân đặt lên kẻ bại trận, tiếng gầm vang vọng khắp võ đài! Người chiến thắng cuối cùng: IGNIS REX, BẠO CHÚA HẮC NHAM ĐĂNG QUANG TUYỆT ĐỐI!"),
]

def generate_vo():
    for name, start_s, end_s, text in VO_LINES:
        raw_mp3 = os.path.join(VO_DIR, f"{name}_raw.mp3")
        wav_out = os.path.join(VO_DIR, f"{name}.wav")
        if not os.path.exists(raw_mp3):
            from gtts import gTTS
            gTTS(text, lang="vi").save(raw_mp3)
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", raw_mp3],
            capture_output=True, text=True, check=True
        )
        dur = float(probe.stdout.strip())
        max_dur = end_s - start_s - 0.15
        tempo = max(1.18, dur / max_dur)
        tempo = min(1.58, tempo)
        af_chain = f"atempo={tempo:.3f},equalizer=f=140:width_type=o:width=2:g=4,equalizer=f=3500:width_type=o:width=2:g=3,acompressor=threshold=-16dB:ratio=3:makeup=4dB"
        subprocess.run(
            ["ffmpeg", "-y", "-i", raw_mp3, "-af", af_chain, "-ar", "48000", "-ac", "2", wav_out],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        print(f"Generated {name}: raw={dur:.2f}s, window={max_dur:.2f}s, tempo={tempo:.2f}")

def build_full_vo_track():
    inputs = ["-f", "lavfi", "-t", "120", "-i", "anullsrc=r=48000:cl=stereo"]
    filter_parts = []
    mix_labels = ["[0:a]"]
    for idx, (name, start_s, end_s, _) in enumerate(VO_LINES, start=1):
        wav_path = os.path.join(VO_DIR, f"{name}.wav")
        inputs.extend(["-i", wav_path])
        delay_ms = int(start_s * 1000)
        filter_parts.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms},volume=1.8[vo{idx}]")
        mix_labels.append(f"[vo{idx}]")
    amix = f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:normalize=0,alimiter=limit=0.95[outa]"
    filter_complex = ";".join(filter_parts + [amix])
    out_vo = os.path.join(SCRATCH_DIR, "v3_master_vo_120s.wav")
    subprocess.run(
        ["ffmpeg", "-y", *inputs, "-filter_complex", filter_complex, "-map", "[outa]", "-t", "120", out_vo],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    print(f"Built {out_vo}")

def build_bgm_with_whip_whooshes():
    # Base 120s storm & symphonic combat bed + directional Whip-Pan Whooshes at 16.40s, 32.80s, 72.60s + Seismic Slam Impacts at 36.5s, 56.2s, 92.0s, 115.5s
    out_bgm = os.path.join(SCRATCH_DIR, "v3_master_bgm_sfx_120s.wav")
    whoosh_wav = os.path.join(SCRATCH_DIR, "whip_whoosh.wav")
    slam_wav = os.path.join(SCRATCH_DIR, "seismic_slam.wav")

    # Generate a crisp 0.70s Cinema Whip-Pan Whoosh (filtered pink noise + Doppler pitch sweep)
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "anoisesrc=d=0.70:c=pink:r=48000:a=0.55",
        "-af", "bandpass=f=950:width_type=h:w=1400,afade=t=in:st=0:d=0.22,afade=t=out:st=0.35:d=0.35,apulsator=mode=sine:hz=1.4,aformat=channel_layouts=stereo",
        whoosh_wav
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Generate a 1.40s 20-Ton Seismic Sub-Bass Impact Boom
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "sine=f=48:d=1.40:r=48000",
        "-f", "lavfi", "-i", "anoisesrc=d=1.40:c=brown:r=48000:a=0.65",
        "-filter_complex", "[0:a]afade=t=out:st=0.1:d=1.3,volume=1.4[sub];[1:a]lowpass=f=220,afade=t=out:st=0.15:d=1.25,volume=1.2[thud];[sub][thud]amix=inputs=2:normalize=0,aformat=channel_layouts=stereo[out]",
        "-map", "[out]", slam_wav
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Generate continuous 120s Colosseum Storm + Dark Brass/Taiko Drone Bed
    base_bed = os.path.join(SCRATCH_DIR, "base_colosseum_bed_120s.wav")
    if not os.path.exists(base_bed):
        subprocess.run([
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", "anoisesrc=d=120:c=brown:r=48000:a=0.22",
            "-f", "lavfi", "-i", "sine=f=55:d=120:r=48000",
            "-f", "lavfi", "-i", "sine=f=82.41:d=120:r=48000",
            "-filter_complex",
            "[0:a]lowpass=f=380,highpass=f=35,volume=0.75[storm];"
            "[1:a]tremolo=f=2.0:d=0.6,lowpass=f=140,volume=0.22[drone1];"
            "[2:a]tremolo=f=4.0:d=0.45,lowpass=f=200,volume=0.15[drone2];"
            "[storm][drone1][drone2]amix=inputs=3:normalize=0,aformat=channel_layouts=stereo,afade=t=in:st=0:d=1.5,afade=t=out:st=118.0:d=2.0[bed]",
            "-map", "[bed]", base_bed
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Mix Base Bed + Whip-Pan Whooshes (16.05s, 32.45s, 72.25s) + Seismic Slam Booms (36.5s, 56.1s, 91.9s, 115.4s)
    subprocess.run([
        "ffmpeg", "-y",
        "-i", base_bed,
        "-i", whoosh_wav,
        "-i", slam_wav,
        "-filter_complex",
        "[1:a]asplit=3[w1][w2][w3];"
        "[2:a]asplit=4[s1][s2][s3][s4];"
        "[w1]adelay=16050|16050,volume=1.8[wh1];"
        "[w2]adelay=32450|32450,volume=1.8[wh2];"
        "[w3]adelay=72250|72250,volume=1.6[wh3];"
        "[s1]adelay=36500|36500,volume=1.5[sl1];"
        "[s2]adelay=56100|56100,volume=1.4[sl2];"
        "[s3]adelay=91950|91950,volume=1.9[sl3];"
        "[s4]adelay=115400|115400,volume=1.5[sl4];"
        "[0:a][wh1][wh2][wh3][sl1][sl2][sl3][sl4]amix=inputs=8:normalize=0,alimiter=limit=0.95[out]",
        "-map", "[out]", "-t", "120", out_bgm
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Built {out_bgm}")

def sec_to_ass(s):
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = s % 60
    return f"{h}:{m:02d}:{sec:05.2f}"

def build_ass_hud_and_srt():
    ass_path = os.path.join(V3_OUT_DIR, "v3_colosseum_hud_and_subs.ass")
    srt_path = os.path.join(V3_OUT_DIR, "dinosaur_colosseum_battle_v3_scenebuilder.vi.srt")
    ass_content = """[Script Info]
Title: Colosseum Dinosaur Battle V3 SceneBuilder-First HUD & Subtitles
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: SubVN,DejaVu Sans,36,&H00FFFFFF,&H0000FFFF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,3,3,1,2,60,60,34,1
Style: TopBar,DejaVu Sans Mono,26,&H00E0F0FF,&H0000FFFF,&H00000000,&HB4080C14,-1,0,0,0,100,100,1,0,3,2,0,8,40,40,18,1
Style: HudRex,DejaVu Sans Mono,25,&H0050A0FF,&H0000FFFF,&H00000000,&HC80A101E,-1,0,0,0,100,100,0,0,3,2.5,0,7,890,30,64,1
Style: HudSpino,DejaVu Sans Mono,25,&H00FFDF40,&H0000FFFF,&H00000000,&HC8181208,-1,0,0,0,100,100,0,0,3,2.5,0,7,45,40,64,1
Style: CenterBanner,DejaVu Sans,44,&H0000D4FF,&H00FFFFFF,&H00000000,&HB4000000,-1,0,0,0,100,100,2,0,3,4,2,8,40,40,62,1
Style: WinnerBanner,DejaVu Sans,42,&H0000EAFF,&H00FFFFFF,&H00001840,&HD0000818,-1,0,0,0,100,100,2,0,3,4,2,2,40,40,120,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    # Top Broadcast Header synced to the 7-Beat Camera Choreography
    events.append((1, 0.0, 32.8, "TopBar", ">> COLOSSEUM BASALT ARENA  |  INTRO & COMBAT STATS  |  IGNIS_REX (T-REX)  VS  LEVIATHAN_SPINO (SPINOSAURUS) <<"))
    events.append((1, 32.8, 56.2, "TopBar", ">> IGNIS_REX [HP: █████████░ 90%]   VS   [HP: █████████░ 92%] LEVIATHAN_SPINO  |  24mm WIDE: 20-TON ARENA CLASH <<"))
    events.append((1, 56.2, 72.6, "TopBar", "!! IGNIS_REX [HP: █████░░░░░ 52% PINNED!]   VS   [HP: ████████░░ 80%] LEVIATHAN_SPINO  |  85mm CLOSE-UP: CLAW DOMINANCE !!"))
    events.append((1, 72.6, 92.0, "TopBar", ">> IGNIS_REX [HP: █████░░░░░ 52% RAGE!]  VS  [HP: █░░░░░░░░░ 12% CRIT] LEVIATHAN_SPINO | 45-DEG JAW LIFT <<"))
    events.append((1, 92.0, 120.0, "TopBar", "** IGNIS_REX [HP: █████░░░░░ 52% WINNER!]   VS   [HP: ░░░░░░░░░░ 0% DEFEATED] LEVIATHAN_SPINO  |  CHAMPION CROWNED **"))

    # Fighter #1 HUD Card (0:02.0 - 0:15.9 — Beat 1 West Gate)
    rex_card = (
        ">> FIGHTER #01: IGNIS_REX (GÓC ĐÀI ĐÁ HẮC NHAM)\\N"
        "• LOÀI (SPECIES): Tyrannosaurus Rex ('Bạo Chúa Hắc Nham')\\N"
        "• KÍCH THƯỚC: Dài 13.5m  |  Cao 5.4m  |  Nặng 9.8 Tấn\\N"
        "• LỰC CẮN (BITE FORCE): 12,800 PSI  [██████████ 100/100]\\N"
        "• GIÁP CỔ (OSTEODERM ARMOR): Hắc Nham [█████████░ 92/100]\\N"
        "• TỐC ĐỘ HÚC (CHARGE): 32 km/h       [████████░░ 78/100]\\N"
        "• TUYỆT KỸ: Cú Quật Hàm Nghiền Xương (Bone-Crushing Slam)"
    )
    events.append((2, 2.0, 15.9, "HudRex", rex_card))

    # Fighter #2 HUD Card (0:16.8 - 0:32.2 — Beat 2 East Gate after Whip-Pan Right)
    spino_card = (
        ">> FIGHTER #02: LEVIATHAN_SPINO (GÓC ĐÀI THỦY NHIỆT)\\N"
        "• LOÀI (SPECIES): Spinosaurus Aegyptiacus ('Thủy Quái Đại Dương')\\N"
        "• KÍCH THƯỚC: Dài 15.8m  |  Buồm 2.2m |  Nặng 10.5 Tấn\\N"
        "• LỰC VỒ MÓNG VUỐT (CLAW STRIKE): 8,200 PSI [██████████ 98/100]\\N"
        "• LỰC CẮN (JAW SNAP): 6,500 PSI             [███████░░░ 68/100]\\N"
        "• TỐC ĐỘ ĐÒN (STRIKE AGILITY): Lưỡng Cư      [██████████ 95/100]\\N"
        "• TUYỆT KỸ: Liên Hoàn Trảm Vuốt Thủy Triều (Tidal Claw Barrage)"
    )
    events.append((2, 16.8, 32.2, "HudSpino", spino_card))

    # Key Battle Banners synced to C03, C04, C05, C06
    events.append((3, 31.0, 34.0, "CenterBanner", ">> FIGHT! — TRẬN TỬ CHIẾN BẮT ĐẦU! <<"))
    events.append((3, 34.5, 40.5, "CenterBanner", ">> 20.3-TON COLLISION IMPACT! <<"))
    events.append((3, 56.5, 66.5, "CenterBanner", "!! 85mm CLOSE-UP: SPINO 8,200 PSI CLAW PIN! !!"))
    events.append((3, 73.5, 91.5, "CenterBanner", ">> CRITICAL COUNTER: 12,800 PSI JAW-LOCK & LIFT! <<"))
    events.append((3, 92.2, 99.5, "CenterBanner", "!! MATCH-ON-ACTION: SEISMIC BODY SLAM! !!"))
    events.append((3, 105.5, 120.0, "WinnerBanner", "** CHIẾN THẮNG CUỐI CÙNG: IGNIS_REX (TYRANNOSAURUS REX) **"))

    # Voiceover Subtitles
    for _, start_s, end_s, text in VO_LINES:
        events.append((2, start_s, end_s, "SubVN", text))

    for layer, s, e, style, txt in events:
        ass_content += f"Dialogue: {layer},{sec_to_ass(s)},{sec_to_ass(e)},{style},,0,0,0,,{txt}\n"

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_content)
    print(f"Wrote {ass_path}")

    def sec_to_srt(s):
        h = int(s // 3600)
        m = int((s % 3600) // 60)
        sec = int(s % 60)
        ms = int(round((s - int(s)) * 1000))
        return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"

    srt_lines = []
    for idx, (_, s, e, txt) in enumerate(VO_LINES, start=1):
        srt_lines.append(f"{idx}\n{sec_to_srt(s)} --> {sec_to_srt(e)}\n{txt}\n\n")
    with open(srt_path, "w", encoding="utf-8") as f:
        f.writelines(srt_lines)
    print(f"Wrote {srt_path}")

def mux_final_masters():
    raw_concat = os.path.join(V3_OUT_DIR, "clips_trimmed", "raw_monolithic_concat_120s.mp4")
    vo_wav = os.path.join(SCRATCH_DIR, "v3_master_vo_120s.wav")
    bgm_wav = os.path.join(SCRATCH_DIR, "v3_master_bgm_sfx_120s.wav")
    ass_path = os.path.join(V3_OUT_DIR, "v3_colosseum_hud_and_subs.ass")
    clean_out = os.path.join(V3_OUT_DIR, "dinosaur_colosseum_battle_v3_clean_no_hud.mp4")
    master_out = os.path.join(V3_OUT_DIR, "dinosaur_colosseum_battle_v3_scenebuilder_master_2min.mp4")

    # 1. Clean No-HUD 1080p24 MP4 (under 75MB for GitHub)
    subprocess.run([
        "ffmpeg", "-y",
        "-i", raw_concat,
        "-i", bgm_wav,
        "-filter_complex", "[0:a]volume=0.85[sfx];[1:a]volume=0.55[bgm];[sfx][bgm]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=11[aout]",
        "-map", "0:v:0", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "4.5M", "-bufsize", "9M", "-pix_fmt", "yuv420p", "-r", "24",
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-t", "120.00",
        clean_out
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Exported Clean No-HUD -> {clean_out}")

    # 2. Master HUD + VO + Subs + 3-Layer Audio 1080p24 MP4 (under 85MB for GitHub)
    ass_escaped = ass_path.replace("\\", "/").replace(":", "\\:")
    fc = (
        f"[0:v]ass='{ass_escaped}'[vout];"
        f"[0:a]volume=0.72[veo_sfx];"
        f"[1:a]volume=1.65[vo];"
        f"[2:a]volume=0.52[bgm];"
        f"[veo_sfx][bgm]amix=inputs=2:normalize=0[bg_bed];"
        f"[bg_bed][vo]sidechaincompress=threshold=0.03:ratio=4:attack=20:release=300[ducked_bed];"
        f"[ducked_bed][vo]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=11[aout]"
    )
    subprocess.run([
        "ffmpeg", "-y",
        "-i", raw_concat,
        "-i", vo_wav,
        "-i", bgm_wav,
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-maxrate", "5.2M", "-bufsize", "10.4M", "-pix_fmt", "yuv420p", "-r", "24",
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-t", "120.00",
        master_out
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Exported Full Master -> {master_out}")

if __name__ == "__main__":
    generate_vo()
    build_full_vo_track()
    build_bgm_with_whip_whooshes()
    build_ass_hud_and_srt()
    mux_final_masters()
