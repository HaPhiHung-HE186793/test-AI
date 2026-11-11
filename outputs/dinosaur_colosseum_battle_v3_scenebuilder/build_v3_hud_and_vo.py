import os
import subprocess

V3_OUT_DIR = "/mnt/data/backup/project_personal/test-AI/outputs/dinosaur_colosseum_battle_v3_scenebuilder"
SCRATCH_DIR = "/home/user/.gemini/antigravity/brain/e3d13205-8936-4f70-958e-d9b3d70b8138/scratch"
VO_DIR = os.path.join(SCRATCH_DIR, "vo_upgraded_v3")
os.makedirs(VO_DIR, exist_ok=True)

# 10 Action-Matched Baritone Commentary Lines (100% synced to the 7-Beat 1.00x choreography)
VO_LINES = [
    ("v3_vo_01", 0.4, 4.6, "Chào mừng tới Đấu Trường Hắc Nham! Trận tử chiến của hai siêu thực thể săn mồi!"),
    ("v3_vo_02", 4.9, 15.6, "Từ cổng Tây: IGNIS REX, Bạo Chúa Tyrannosaurus Rex! Nặng 9 phẩy 8 tấn, lực cắn nghiền xương 12 ngàn 800 P S I!"),
    ("v3_vo_03", 16.6, 31.6, "Ở cổng Đông: LEVIATHAN SPINO, Spinosaurus Aegyptiacus! Dài 15 phẩy 8 mét, nặng 10 phẩy 5 tấn với bộ vuốt sắc lẹm! Trận chiến... BẮT ĐẦU!"),
    ("v3_vo_04", 32.8, 43.5, "Hai cỗ máy 10 tấn lao thẳng vào tâm võ đài! Cú húc vai 20 tấn nổ tung bụi cát, đẩy cả hai bật lùi dữ dội!"),
    ("v3_vo_05", 44.2, 54.0, "Không một bước nhượng bộ! Hai gã khổng lồ gầm vang, liên tục tung những cú táp hàm uy lực giữa tâm đấu trường!"),
    ("v3_vo_06", 55.2, 72.5, "Đòn đánh hiểm hóc! Spinosaurus vung vuốt 8 ngàn 200 P S I quật ngã Ignis Rex xuống cát đen, rồi lao tới ghì chặt vai Bạo Chúa!"),
    ("v3_vo_07", 73.8, 82.8, "Giữa vòng vây nghẹt thở, đôi mắt hổ phách của Ignis Rex rực sáng! Bạo Chúa chồm tới, khóa chặt hàm răng vào thẳng cổ Spinosaurus!"),
    ("v3_vo_08", 83.2, 91.6, "PHẢN ĐÒN HỦY DIỆT! Với lực cắn 12 ngàn 800 P S I, Ignis Rex bẻ gập cổ đối thủ và ghì mạnh xuống mặt cát!"),
    ("v3_vo_09", 92.3, 104.2, "CÚ QUẬT NGÀN CÂN! Xác quái thú 10 phẩy 5 tấn đập xuống sàn đá nổ tung bụi mù, hoàn toàn gục ngã!"),
    ("v3_vo_10", 105.0, 119.5, "Đứng sừng sững bên cạnh kẻ bại trận, tiếng gầm chiến thắng vang dội khắp võ đài! Nhà vô địch tuyệt đối: IGNIS REX, BẠO CHÚA HẮC NHAM!"),
]

def build_full_vo_track():
    inputs = ["-f", "lavfi", "-t", "120", "-i", "anullsrc=r=48000:cl=stereo"]
    filter_parts = []
    mix_labels = ["[0:a]"]
    for idx, (name, start_s, end_s, _) in enumerate(VO_LINES, start=1):
        wav_path = os.path.join(VO_DIR, f"{name}.wav")
        inputs.extend(["-i", wav_path])
        delay_ms = int(start_s * 1000)
        filter_parts.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms},volume=1.9[vo{idx}]")
        mix_labels.append(f"[vo{idx}]")
    amix = f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:normalize=0,alimiter=limit=0.95[outa]"
    filter_complex = ";".join(filter_parts + [amix])
    out_vo = os.path.join(SCRATCH_DIR, "v3_master_vo_120s.wav")
    subprocess.run(
        ["ffmpeg", "-y", *inputs, "-filter_complex", filter_complex, "-map", "[outa]", "-t", "120", out_vo],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    print(f"Built Baritone Stadium VO Track -> {out_vo}")

def build_bgm_with_whip_whooshes():
    out_bgm = os.path.join(SCRATCH_DIR, "v3_master_bgm_sfx_120s.wav")
    whoosh_wav = os.path.join(SCRATCH_DIR, "whip_whoosh.wav")
    slam_wav = os.path.join(SCRATCH_DIR, "seismic_slam.wav")
    orchestral_bed = os.path.join(SCRATCH_DIR, "epic_3act_orchestral_bed_120s.wav")

    # Crisp 0.65s Cinema Whip-Pan Whoosh
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "anoisesrc=d=0.65:c=pink:r=48000:a=0.58",
        "-af", "bandpass=f=980:width_type=h:w=1450,afade=t=in:st=0:d=0.20,afade=t=out:st=0.32:d=0.33,apulsator=mode=sine:hz=1.5,aformat=channel_layouts=stereo",
        whoosh_wav
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 1.40s 20-Ton Seismic Sub-Bass Impact Boom
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "sine=f=46:d=1.40:r=48000",
        "-f", "lavfi", "-i", "anoisesrc=d=1.40:c=brown:r=48000:a=0.68",
        "-filter_complex", "[0:a]afade=t=out:st=0.1:d=1.3,volume=1.5[sub];[1:a]lowpass=f=210,afade=t=out:st=0.15:d=1.25,volume=1.3[thud];[sub][thud]amix=inputs=2:normalize=0,aformat=channel_layouts=stereo[out]",
        "-map", "[out]", slam_wav
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Mix 3-Act Gladiator Taiko/Brass Score + Whip-Pan Whooshes (15.75s, 31.75s, 73.25s) + Impact Booms (36.2s, 56.2s, 66.8s, 88.5s, 92.0s, 112.0s)
    subprocess.run([
        "ffmpeg", "-y",
        "-i", orchestral_bed,
        "-i", whoosh_wav,
        "-i", slam_wav,
        "-filter_complex",
        "[1:a]asplit=3[w1][w2][w3];"
        "[2:a]asplit=6[s1][s2][s3][s4][s5][s6];"
        "[w1]adelay=15750|15750,volume=1.8[wh1];"
        "[w2]adelay=31750|31750,volume=1.8[wh2];"
        "[w3]adelay=73250|73250,volume=1.7[wh3];"
        "[s1]adelay=36200|36200,volume=1.5[sl1];"
        "[s2]adelay=56200|56200,volume=1.5[sl2];"
        "[s3]adelay=66800|66800,volume=1.5[sl3];"
        "[s4]adelay=88500|88500,volume=1.6[sl4];"
        "[s5]adelay=92000|92000,volume=2.0[sl5];"
        "[s6]adelay=112000|112000,volume=1.6[sl6];"
        "[0:a][wh1][wh2][wh3][sl1][sl2][sl3][sl4][sl5][sl6]amix=inputs=10:normalize=0,alimiter=limit=0.95[out]",
        "-map", "[out]", "-t", "120", out_bgm
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Built 3-Act Taiko/Brass BGM + Impact SFX Track -> {out_bgm}")

def sec_to_ass(s):
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = s % 60
    return f"{h}:{m:02d}:{sec:05.2f}"

def build_ass_hud_and_srt():
    ass_path = os.path.join(V3_OUT_DIR, "v3_colosseum_hud_and_subs.ass")
    srt_path = os.path.join(V3_OUT_DIR, "dinosaur_colosseum_battle_v3_scenebuilder.vi.srt")
    ass_content = """[Script Info]
Title: Colosseum Dinosaur Battle V3 Upgraded Broadcast HUD & Subtitles
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
Style: CenterBanner,DejaVu Sans,38,&H0000D4FF,&H00FFFFFF,&H00000000,&HA8000000,-1,0,0,0,100,100,2,0,3,3,1,8,40,40,54,1
Style: WinnerBanner,DejaVu Sans,38,&H0000EAFF,&H00FFFFFF,&H00001840,&HC0000818,-1,0,0,0,100,100,2,0,3,3,1,8,40,40,54,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    # Dynamic Impact-Synced Top Broadcast Telemetry Bar (HP drops at exact moments of physical impact!)
    events.append((1, 0.0, 32.0, "TopBar", ">> COLOSSEUM BASALT ARENA  |  IGNIS_REX [HP: 100%]   VS   [HP: 100%] LEVIATHAN_SPINO  |  ACT I: CHALLENGER INTROS <<"))
    events.append((1, 32.0, 36.2, "TopBar", ">> IGNIS_REX [HP: ██████████ 100%]   VS   [HP: ██████████ 100%] LEVIATHAN_SPINO  |  24mm WIDE: CENTER CHARGE <<"))
    events.append((1, 36.2, 54.5, "TopBar", ">> IGNIS_REX [HP: █████████░ 88%]   VS   [HP: █████████░ 86%] LEVIATHAN_SPINO  |  20-TON SHOULDER RECOIL & CLASH <<"))
    events.append((1, 54.5, 56.5, "TopBar", "!! IGNIS_REX [HP: █████████░ 88%]   VS   [HP: █████████░ 86%] LEVIATHAN_SPINO  |  85mm CLOSE-UP: SPINO CLAW SLASH !!"))
    events.append((1, 56.5, 66.8, "TopBar", "!! IGNIS_REX [HP: ███████░░░ 68% KD!]   VS   [HP: ████████░░ 82%] LEVIATHAN_SPINO  |  8,200 PSI CLAW KNOCKDOWN !!"))
    events.append((1, 66.8, 73.5, "TopBar", "!! IGNIS_REX [HP: █████░░░░░ 52% BRACE!]   VS   [HP: ████████░░ 80%] LEVIATHAN_SPINO  |  CLOSE-UP SHOULDER PIN !!"))
    events.append((1, 73.5, 78.0, "TopBar", ">> IGNIS_REX [HP: █████░░░░░ 52% OVERDRIVE!]   VS   [HP: ██████░░░░ 60%] LEVIATHAN_SPINO  |  JAW-LOCK COUNTER <<"))
    events.append((1, 78.0, 88.5, "TopBar", ">> IGNIS_REX [HP: █████░░░░░ 52% RAGE!]   VS   [HP: ███░░░░░░░ 28% KNEELING] LEVIATHAN_SPINO  |  12,800 PSI NECK LOCK <<"))
    events.append((1, 88.5, 92.2, "TopBar", ">> IGNIS_REX [HP: █████░░░░░ 52% FINISHER!]   VS   [HP: █░░░░░░░░░ 10% CRIT!] LEVIATHAN_SPINO  |  DOWNWARD NECK WRENCH <<"))
    events.append((1, 92.2, 120.0, "TopBar", "** IGNIS_REX [HP: █████░░░░░ 52% CHAMPION!]   VS   [HP: ░░░░░░░░░░ 0% K.O.] LEVIATHAN_SPINO  |  VICTORY CORONATION **"))

    # Sleek Fighter #1 HUD Card (Top-Left, 2.0s - 15.4s)
    rex_card = (
        ">> FIGHTER #01: IGNIS_REX (CỔNG TÂY)\\N"
        "• LOÀI: Tyrannosaurus Rex ('Bạo Chúa Hắc Nham')\\N"
        "• THÔNG SỐ: Dài 13.5m | Nặng 9.8 Tấn | Giáp 92/100\\N"
        "• LỰC CẮN: 12,800 PSI [██████████] • TUYỆT KỸ: Quật Hàm Nghiền Xương"
    )
    events.append((2, 2.0, 15.4, "HudRex", rex_card))

    # Sleek Fighter #2 HUD Card (Top-Right, 16.6s - 31.4s)
    spino_card = (
        ">> FIGHTER #02: LEVIATHAN_SPINO (CỔNG ĐÔNG)\\N"
        "• LOÀI: Spinosaurus Aegyptiacus ('Thủy Quái Đại Dương')\\N"
        "• THÔNG SỐ: Dài 15.8m | Buồm 2.2m | Nặng 10.5 Tấn\\N"
        "• LỰC VUỐT: 8,200 PSI [██████████] • TUYỆT KỸ: Trảm Vuốt Thủy Triều"
    )
    events.append((2, 16.6, 31.4, "HudSpino", spino_card))

    # Concise Impact Banners synced to exact action frames
    events.append((3, 30.8, 33.5, "CenterBanner", ">> FIGHT! — TRẬN TỬ CHIẾN BẮT ĐẦU! <<"))
    events.append((3, 35.8, 40.5, "CenterBanner", ">> 20.3-TON SHOULDER CLASH & ELASTIC RECOIL! <<"))
    events.append((3, 55.8, 61.5, "CenterBanner", "!! 8,200 PSI CLAW KNOCKDOWN! !!"))
    events.append((3, 66.5, 72.0, "CenterBanner", "!! 85mm CLOSE-UP: SPINO SHOULDER PIN! !!"))
    events.append((3, 76.5, 83.0, "CenterBanner", ">> CRITICAL COUNTER: 12,800 PSI NECK LOCK! <<"))
    events.append((3, 88.0, 91.9, "CenterBanner", ">> MAXIMUM TORQUE: DOWNWARD NECK WRENCH! <<"))
    events.append((3, 92.1, 98.5, "CenterBanner", "!! MATCH-ON-ACTION: SEISMIC BODY SLAM (K.O.)! !!"))
    events.append((3, 111.5, 120.0, "WinnerBanner", "** NHÀ VÔ ĐỊCH TUYỆT ĐỐI: IGNIS_REX (TYRANNOSAURUS REX) **"))

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

    # 1. Clean No-HUD 1080p24 MP4 (Native Veo SFX + 3-Act Taiko/Brass Orchestral Score)
    subprocess.run([
        "ffmpeg", "-y",
        "-i", raw_concat,
        "-i", bgm_wav,
        "-filter_complex", "[0:a]volume=0.88[sfx];[1:a]volume=0.65[bgm];[sfx][bgm]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=11[aout]",
        "-map", "0:v:0", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-maxrate", "3500k", "-bufsize", "7000k", "-pix_fmt", "yuv420p", "-r", "24",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", "120.00",
        clean_out
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Exported Clean No-HUD -> {clean_out}")

    # 2. Master HUD + Baritone VO + Subs + 3-Act Taiko/Brass Score 1080p24 MP4
    ass_escaped = ass_path.replace("\\", "/").replace(":", "\\:")
    fc = (
        f"[0:v]ass='{ass_escaped}'[vout];"
        f"[0:a]volume=0.72[sfx];"
        f"[1:a]volume=0.52[bgm];"
        f"[2:a]volume=1.35[vo];"
        f"[sfx][bgm][vo]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=11[aout]"
    )
    subprocess.run([
        "ffmpeg", "-y",
        "-i", raw_concat,
        "-i", bgm_wav,
        "-i", vo_wav,
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-maxrate", "3500k", "-bufsize", "7000k", "-pix_fmt", "yuv420p", "-r", "24",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", "120.00",
        master_out
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Exported Master 2Min -> {master_out}")

if __name__ == "__main__":
    build_full_vo_track()
    build_bgm_with_whip_whooshes()
    build_ass_hud_and_srt()
    mux_final_masters()
