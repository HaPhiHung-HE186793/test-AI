import os
import subprocess

OUT_DIR = "/mnt/data/backup/project_personal/test-AI/outputs/dinosaur_colosseum_battle_v3_scenebuilder"
RAW_DIR = os.path.join(OUT_DIR, "clips_raw")
TRIM_DIR = os.path.join(OUT_DIR, "clips_trimmed")
SCRATCH_DIR = "/home/user/.gemini/antigravity/brain/e3d13205-8936-4f70-958e-d9b3d70b8138/scratch"
VO_V4_DIR = os.path.join(SCRATCH_DIR, "vo_phonetic_v4_62s")
VO_V3_DIR = os.path.join(SCRATCH_DIR, "vo_phonetic_v3_120s")

os.makedirs(TRIM_DIR, exist_ok=True)

CLIPS = {
    "C01": os.path.join(RAW_DIR, "C01_ACT1_IGNIS_REX_ARRIVAL_751df8e0-f3c9-4ea3-9d92-73271b5f9060.mp4"),
    "C02": os.path.join(RAW_DIR, "C02_ACT1_LEVIATHAN_SPINO_CHALLENGE_9d3988ab-d9d8-4733-8775-907d94b3a953.mp4"),
    "C03": os.path.join(RAW_DIR, "C03_ACT2A_20TON_COLLISION_JAWLOCK_a12d01da-50e2-46da-9512-8dc1dbe72bfa.mp4"),
    "C04": os.path.join(RAW_DIR, "C04_R2_EXT_d65ab02e-4d99-4a90-a33b-a1446ae0d167.mp4"),
    "C05": os.path.join(RAW_DIR, "C05_ACT2B_CRIMSON_OVERDRIVE_COUNTER_7e92ef11-84f4-46b8-98ed-019edcd703e1.mp4"),
    "C06": os.path.join(RAW_DIR, "C06_R3_EXT_140503e6-99de-4775-b92a-7f3793fa707d.mp4"),
    "SHOT01_FOOT": os.path.join(RAW_DIR, "SHOT01_FOOT_STOMP_ECU_0a8fadac-f8ee-4e0b-a402-05e6ad1268f4.mp4"),
    "SHOT04_CLAW": os.path.join(RAW_DIR, "SHOT04_CLAW_SLASH_85MM_CU_20547d70-3aef-4213-9654-74f9ffe186ff.mp4"),
    "SHOT06_EYE": os.path.join(RAW_DIR, "SHOT06_AMBER_EYE_IGNITE_85MM_ECU_2924c712-abe6-41fd-9936-6e527359bb8a.mp4"),
    "SHOT07_JAW": os.path.join(RAW_DIR, "SHOT07_JAW_LOCK_50MM_MCU_b8365235-dd88-4d5e-a734-71039a7772c9.mp4"),
    "SHOT08_KO": os.path.join(RAW_DIR, "SHOT08_SEISMIC_SLAM_MOTIONLESS_KO_f7787a4e-56ca-4115-bcfd-9f21dd144630.mp4"),
}

def render_seg(name, infile, ss, raw_dur, target_dur, vf_core, fade_out_black=False):
    out_path = os.path.join(TRIM_DIR, f"{name}.mp4")
    pts_factor = target_dur / raw_dur
    atempo_factor = raw_dur / target_dur
    fade_v = f",fade=t=out:st={target_dur - 0.85:.2f}:d=0.85" if fade_out_black else ""
    # Unify color grading + subtle 35mm film grain (De-AI-ifying per Gemini Expert Turn 1)
    vf_full = (
        f"setpts={pts_factor:.6f}*(PTS-STARTPTS),fps=24,"
        f"{vf_core},"
        f"eq=contrast=1.06:saturation=1.05:gamma=0.98,"
        f"unsharp=3:3:0.45:3:3:0.0,"
        f"noise=alls=3:allf=t+u{fade_v},format=yuv420p"
    )
    af_full = (
        f"aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,"
        f"atempo={atempo_factor:.5f},"
        f"equalizer=f=65:t=q:w=1.2:g=4.0,"
        f"afade=t=in:st=0:d=0.04,afade=t=out:st={max(0.01, target_dur - 0.04):.3f}:d=0.04,"
        f"asetpts=PTS-STARTPTS"
    )
    cmd = [
        "ffmpeg", "-y",
        "-ss", f"{ss:.3f}",
        "-t", f"{raw_dur:.3f}",
        "-i", infile,
        "-vf", vf_full,
        "-af", af_full,
        "-t", f"{target_dur:.2f}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "17",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        out_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("FFMPEG ERROR:", res.stderr[-600:])
        raise RuntimeError(f"Failed on {name}")
    print(f"Rendered {name}: {target_dur:.2f}s")
    return out_path

# ==============================================================================
# PART 1: BUILD 62.00s 9-SHOT DIRECTOR'S CUT V4 VIDEO STREAM
# ==============================================================================
def build_v4_62s_video():
    print("=== Building 62.00s 9-Shot Director's Cut V4 Video ===")
    segs = []
    # SHOT_01 (00:00 - 00:04, 4.00s): 85mm Extreme Close-Up Foot Stomp Cold Open
    segs.append(render_seg(
        "v4_01_foot_stomp_ecu", CLIPS["SHOT01_FOOT"], 0.00, 3.95, 4.00,
        "scale=2048:1152:flags=lanczos,crop=1920:1080:x='64+24*sin(t*14)*exp(-max(0,t-0.8)*2.5)':y='36+22*cos(t*18)*exp(-max(0,t-0.8)*2.5)',vignette=PI/7"
    ))
    # SHOT_02 (00:04 - 00:10, 6.00s): 24mm Wide Two-Shot Fast Dolly-In & 20-Ton Center Collision
    segs.append(render_seg(
        "v4_02_wide_charge_clash", CLIPS["C03"], 0.05, 6.00, 6.00,
        "scale=2240:1260:flags=lanczos,crop=1920:1080:x='160+20*sin(t*16)*exp(-max(0,t-2.2)*2.0)':y='90+18*cos(t*18)*exp(-max(0,t-2.2)*2.0)'"
    ))
    # SHOT_03 (00:10 - 00:16, 6.00s): 50mm Medium Two-Shot Close Shoulder-to-Shoulder Grapple (t=6.05s..12.05s of C03)
    segs.append(render_seg(
        "v4_03_medium_grapple", CLIPS["C03"], 6.05, 6.00, 6.00,
        "scale=2560:1440:flags=lanczos,crop=1920:1080:x='320+35*sin(t*4.0)':y='160+20*cos(t*5.0)'"
    ))
    # SHOT_04 (00:16 - 00:21, 5.00s): 85mm Tight Close-Up Spinosaurus 8,200 PSI Claw Slash with Sparks & Scales
    segs.append(render_seg(
        "v4_04_claw_slash_85mm_cu", CLIPS["SHOT04_CLAW"], 0.00, 4.95, 5.00,
        "scale=2048:1152:flags=lanczos,crop=1920:1080:x='64+20*sin(t*15)*exp(-max(0,t-1.8)*2.0)':y='36+16*cos(t*15)*exp(-max(0,t-1.8)*2.0)',vignette=PI/7"
    ))
    # SHOT_05 (00:21 - 00:27, 6.00s): 35mm Low-Angle Knockdown & Shoulder Pin in Volcanic Sand (C04 t=11.0s..17.0s)
    segs.append(render_seg(
        "v4_05_knockdown_pin", CLIPS["C04"], 11.00, 6.00, 6.00,
        "scale=2240:1260:flags=lanczos,crop=1920:1080:x='160+25*sin(t*3.0)':y='110+18*sin(t*14)*exp(-max(0,t-1.5)*2.0)'"
    ))
    # SHOT_06 (00:27 - 00:33, 6.00s): 85mm Extreme Close-Up Downed Head -> Glowing Amber Eye Ignition & Upward Surge
    segs.append(render_seg(
        "v4_06_amber_eye_85mm_ecu", CLIPS["SHOT06_EYE"], 0.00, 5.95, 6.00,
        "scale=2112:1188:flags=lanczos,crop=1920:1080:x='96-30*(t/6.0)':y='54-20*(t/6.0)',vignette=PI/6"
    ))
    # SHOT_07 (00:33 - 00:41, 8.00s): 50mm Dutch-Tilt Medium Close-Up 12,800 PSI Jaw-Lock & Downward Neck Wrench
    segs.append(render_seg(
        "v4_07_jaw_lock_50mm_mcu", CLIPS["SHOT07_JAW"], 0.00, 7.95, 8.00,
        "rotate=-1.8*PI/180:ow=rotw(-1.8*PI/180):oh=roth(-1.8*PI/180):c=black,scale=2144:1206:flags=lanczos,crop=1920:1080:x='112+22*sin(t*4.0)':y='63+25*(t/8.0)',vignette=PI/8"
    ))
    # SHOT_08 (00:41 - 00:50, 9.00s): 24mm Wide Low-Angle Seismic Body Slam -> Completely Motionless K.O. Spinosaurus
    segs.append(render_seg(
        "v4_08_seismic_slam_motionless_ko", CLIPS["SHOT08_KO"], 0.00, 8.95, 9.00,
        "scale=2112:1188:flags=lanczos,crop=1920:1080:x='96+24*sin(t*18)*exp(-max(0,t-1.5)*2.2)':y='54+28*cos(t*20)*exp(-max(0,t-1.5)*2.2)'"
    ))
    # SHOT_09 (00:50 - 01:02, 12.00s): 85mm Extreme Worm's-Eye Hero Close-Up Coronation Roar + Fade to Black at 62s
    segs.append(render_seg(
        "v4_09_champion_roar_closeup", CLIPS["C06"], 22.80, 9.00, 12.00,
        "scale=2688:1512:flags=lanczos,crop=1920:1080:x='150-50*(t/12.0)':y='24+16*(t/12.0)',vignette=PI/6",
        fade_out_black=True
    ))

    concat_v4 = os.path.join(OUT_DIR, "concat_v4_62s.txt")
    with open(concat_v4, "w", encoding="utf-8") as f:
        for s in segs:
            f.write(f"file '{s}'\n")
    raw_v4 = os.path.join(TRIM_DIR, "raw_v4_directors_cut_62s.mp4")
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_v4, "-c", "copy", raw_v4], check=True)
    print(f"Built {raw_v4}")
    return raw_v4

# ==============================================================================
# PART 2: BUILD UPGRADED 120.00s FULL BROADCAST MASTER VIDEO STREAM
# ==============================================================================
def build_v3_120s_video():
    print("=== Building Upgraded 120.00s Full Broadcast Master Video ===")
    segs = []
    # BEAT 1A (00:00 - 00:04, 4.00s): Cold Open Hook — 85mm Extreme Close-Up Foot Stomp on Volcanic Sand & Embers
    segs.append(render_seg(
        "v3_up_01a_cold_open_foot_ecu", CLIPS["SHOT01_FOOT"], 0.00, 3.95, 4.00,
        "scale=2048:1152:flags=lanczos,crop=1920:1080:x='64+24*sin(t*14)*exp(-max(0,t-0.8)*2.5)':y='36+22*cos(t*18)*exp(-max(0,t-0.8)*2.5)',vignette=PI/7"
    ))
    # BEAT 1B (00:04 - 00:16, 12.00s): 28mm Wide West Gate Arrival & Roar + Whip-Pan Right Out (T1)
    segs.append(render_seg(
        "v3_up_01b_west_gate_rex", CLIPS["C01"], 4.15, 12.00, 12.00,
        "scale=2400:1350:flags=lanczos,crop=1920:1080:x='if(lt(t,11.64),60+100*(t/11.64),160+320*pow((t-11.64)/0.36,2))':y='135+10*sin(t/2.0)',avgblur=sizeX=68:sizeY=4:enable='gte(t,11.70)'"
    ))
    # BEAT 2 (00:16 - 00:32, 16.00s): Incoming Whip-Pan Right + 28mm East Gate Spinosaurus + Whip-Pan Left Out (T2)
    segs.append(render_seg(
        "v3_up_02_east_gate_spino", CLIPS["C02"], 0.15, 16.00, 16.00,
        "scale=2400:1350:flags=lanczos,crop=1920:1080:x='if(lt(t,0.36),10+350*(1-pow(1-t/0.36,2)),if(lt(t,15.64),360-120*((t-0.36)/15.28),240-230*pow((t-15.64)/0.36,2)))':y='135+10*cos(t/2.0)',avgblur=sizeX=68:sizeY=4:enable='lte(t,0.24)+gte(t,15.70)'"
    ))
    # BEAT 3A (00:32 - 00:43.5, 11.50s): Incoming Whip-Pan Left into 24mm Wide 20-Ton Center Clash & Elastic Recoil
    segs.append(render_seg(
        "v3_up_03a_center_clash", CLIPS["C03"], 0.10, 11.50, 11.50,
        "scale=2208:1242:flags=lanczos,crop=1920:1080:x='if(lt(t,0.36),288-144*(1-pow(1-t/0.36,2)),144+35*sin(t/2.5))':y='81+16*sin(t*18)*exp(-mod(t,5.5))',avgblur=sizeX=68:sizeY=4:enable='lte(t,0.24)'"
    ))
    # BEAT 3B (00:43.5 - 00:54.5, 11.00s): 50mm Tight Medium Two-Shot Close Grapple (C04 t=0.15s..11.15s where they grapple & lunge closely!)
    segs.append(render_seg(
        "v3_up_03b_close_grapple", CLIPS["C04"], 0.15, 11.00, 11.00,
        "scale=2496:1404:flags=lanczos,crop=1920:1080:x='288+40*sin(t/2.0)':y='162+15*cos(t/2.0)'"
    ))
    # BEAT 4A (00:54.5 - 00:59.5, 5.00s): Angle-Change Cut into TRUE 85mm Tight Close-Up Spinosaurus 8,200 PSI Claw Slash!
    segs.append(render_seg(
        "v3_up_04a_claw_slash_85mm_cu", CLIPS["SHOT04_CLAW"], 0.00, 4.95, 5.00,
        "scale=2048:1152:flags=lanczos,crop=1920:1080:x='64+20*sin(t*15)*exp(-max(0,t-1.8)*2.0)':y='36+16*cos(t*15)*exp(-max(0,t-1.8)*2.0)',vignette=PI/7"
    ))
    # BEAT 4B (00:59.5 - 01:12.0, 12.50s): 35mm Low-Angle Knockdown & Shoulder Pin in Volcanic Sand (C04 t=7.80s..20.30s)
    segs.append(render_seg(
        "v3_up_04b_knockdown_pin", CLIPS["C04"], 7.80, 12.50, 12.50,
        "scale=2240:1260:flags=lanczos,crop=1920:1080:x='160+30*sin(t/2.5)':y='100+15*cos(t/2.5)'"
    ))
    # BEAT 5A (01:12.0 - 01:18.0, 6.00s): Angle-Change Cut into TRUE 85mm Extreme Close-Up Downed Head -> Glowing Amber Eye Ignition & Surge!
    segs.append(render_seg(
        "v3_up_05a_amber_eye_85mm_ecu", CLIPS["SHOT06_EYE"], 0.00, 5.95, 6.00,
        "scale=2112:1188:flags=lanczos,crop=1920:1080:x='96-30*(t/6.0)':y='54-20*(t/6.0)',vignette=PI/6"
    ))
    # BEAT 5B (01:18.0 - 01:26.0, 8.00s): Match-on-Action Cut into TRUE 50mm Dutch-Tilt Medium Close-Up 12,800 PSI Jaw-Lock (Equal 15.8m Scale!)
    segs.append(render_seg(
        "v3_up_05b_jaw_lock_50mm_mcu", CLIPS["SHOT07_JAW"], 0.00, 7.95, 8.00,
        "rotate=-1.8*PI/180:ow=rotw(-1.8*PI/180):oh=roth(-1.8*PI/180):c=black,scale=2144:1206:flags=lanczos,crop=1920:1080:x='112+22*sin(t*4.0)':y='63+25*(t/8.0)',vignette=PI/8"
    ))
    # BEAT 5C (01:26.0 - 01:32.0, 6.00s): 45-Deg Low-Angle Maximum Torque Downward Neck Wrench (C05 t=18.80s..24.80s)
    segs.append(render_seg(
        "v3_up_05c_neck_wrench_down", CLIPS["C05"], 18.80, 6.00, 6.00,
        "scale=2368:1332:flags=lanczos,crop=1920:1080:x='220+30*sin(t*3.0)':y='130+20*(t/6.0)'"
    ))
    # BEAT 6A (01:32.0 - 01:44.0, 12.00s): Match-on-Action Cut into 24mm Wide Seismic Body Slam & Completely Motionless K.O. Spinosaurus!
    segs.append(render_seg(
        "v3_up_06a_seismic_slam_motionless_ko", CLIPS["SHOT08_KO"], 0.00, 8.95, 12.00,
        "scale=2112:1188:flags=lanczos,crop=1920:1080:x='96+24*sin(t*18)*exp(-max(0,t-1.5)*2.2)':y='54+28*cos(t*20)*exp(-max(0,t-1.5)*2.2)'"
    ))
    # BEAT 6B (01:44.0 - 01:51.0, 7.00s): 50mm Medium-Tight Low-Angle Dominance Crop on Ignis Rex Upper Torso & Roar (Zero Zombie Spino Head)
    segs.append(render_seg(
        "v3_up_06b_beside_body_dominance", CLIPS["C06"], 14.00, 7.00, 7.00,
        "scale=2944:1656:flags=lanczos,crop=1920:1080:x='30+25*(t/7.0)':y='30',vignette=PI/7"
    ))
    # BEAT 7 (01:51.0 - 02:00.0, 9.00s): Angle-Change Cut into 85mm Extreme Low-Angle Worm's-Eye Hero Close-Up Dolly Push-In + Fade Out!
    segs.append(render_seg(
        "v3_up_07_wormseye_hero_roar", CLIPS["C06"], 22.80, 9.00, 9.00,
        "scale=2688:1512:flags=lanczos,crop=1920:1080:x='150-50*(t/9.0)':y='24+16*(t/9.0)',vignette=PI/6",
        fade_out_black=True
    ))

    concat_v3 = os.path.join(OUT_DIR, "concat_list.txt")
    with open(concat_v3, "w", encoding="utf-8") as f:
        for s in segs:
            f.write(f"file '{s}'\n")
    raw_v3 = os.path.join(TRIM_DIR, "raw_monolithic_concat_120s.mp4")
    subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_v3, "-c", "copy", raw_v3], check=True)
    print(f"Built {raw_v3}")
    return raw_v3

if __name__ == "__main__":
    build_v4_62s_video()
    build_v3_120s_video()
