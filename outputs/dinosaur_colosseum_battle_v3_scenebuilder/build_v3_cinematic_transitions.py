import os
import subprocess

OUT_DIR = "/mnt/data/backup/project_personal/test-AI/outputs/dinosaur_colosseum_battle_v3_scenebuilder"
RAW_DIR = os.path.join(OUT_DIR, "clips_raw")
TRIM_DIR = os.path.join(OUT_DIR, "clips_trimmed")
SCRATCH_DIR = "/home/user/.gemini/antigravity/brain/e3d13205-8936-4f70-958e-d9b3d70b8138/scratch"
os.makedirs(TRIM_DIR, exist_ok=True)
os.makedirs(SCRATCH_DIR, exist_ok=True)

CLIPS = {
    "C01": os.path.join(RAW_DIR, "C01_ACT1_IGNIS_REX_ARRIVAL_751df8e0-f3c9-4ea3-9d92-73271b5f9060.mp4"),
    "C02": os.path.join(RAW_DIR, "C02_ACT1_LEVIATHAN_SPINO_CHALLENGE_9d3988ab-d9d8-4733-8775-907d94b3a953.mp4"),
    "C03": os.path.join(RAW_DIR, "C03_ACT2A_20TON_COLLISION_JAWLOCK_a12d01da-50e2-46da-9512-8dc1dbe72bfa.mp4"),
    "C04": os.path.join(RAW_DIR, "C04_R2_EXT_d65ab02e-4d99-4a90-a33b-a1446ae0d167.mp4"),
    "C05": os.path.join(RAW_DIR, "C05_ACT2B_CRIMSON_OVERDRIVE_COUNTER_7e92ef11-84f4-46b8-98ed-019edcd703e1.mp4"),
    "C06": os.path.join(RAW_DIR, "C06_R3_EXT_140503e6-99de-4775-b92a-7f3793fa707d.mp4"),
}

def render_segment(name, infile, ss, raw_dur, target_dur, vf_core):
    out_path = os.path.join(TRIM_DIR, f"{name}.mp4")
    pts_factor = target_dur / raw_dur
    atempo_factor = raw_dur / target_dur
    vf_full = (
        f"setpts={pts_factor:.6f}*(PTS-STARTPTS),fps=24,"
        f"{vf_core},"
        f"eq=contrast=1.05:saturation=1.06,unsharp=3:3:0.50:3:3:0.0,format=yuv420p"
    )
    af_full = (
        f"aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,"
        f"atempo={atempo_factor:.5f},"
        f"equalizer=f=65:t=q:w=1.2:g=3.5,"
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
    print(f"Rendered {name}: target={target_dur:.2f}s (raw={raw_dur:.2f}s, speed=1.00x)")
    return out_path

def build_all_7_beats():
    segments = []

    # BEAT 1 (0.00s - 16.00s, 16.00s @ 1.00x): C01 — 28mm Wide West Gate Arrival + High-Velocity Whip-Pan Right Out (T1)
    vf_b1 = (
        "scale=2400:1350:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,15.64),40+120*(t/15.64),160+320*pow((t-15.64)/0.36,2))':y='135+10*sin(t/2.0)',"
        "avgblur=sizeX=68:sizeY=4:enable='gte(t,15.70)'"
    )
    segments.append(render_segment("01_C01_wide_west_whip_out", CLIPS["C01"], 0.15, 16.00, 16.00, vf_b1))

    # BEAT 2 (16.00s - 32.00s, 16.00s @ 1.00x): C02 — Incoming Whip-Pan Right + 28mm Wide East Gate Spino + Whip-Pan Left Out (T2)
    vf_b2 = (
        "scale=2400:1350:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,0.36),10+350*(1-pow(1-t/0.36,2)),if(lt(t,15.64),360-120*((t-0.36)/15.28),240-230*pow((t-15.64)/0.36,2)))':y='135+10*cos(t/2.0)',"
        "avgblur=sizeX=68:sizeY=4:enable='lte(t,0.24)+gte(t,15.70)'"
    )
    segments.append(render_segment("02_C02_wide_east_whip_in_out", CLIPS["C02"], 0.15, 16.00, 16.00, vf_b2))

    # BEAT 3 (32.00s - 54.50s, 22.50s @ 1.00x): C03 — Incoming Whip-Pan Left into 24mm Wide Center Arena 20-Ton Clash, Recoil & Jaw Snaps
    vf_b3 = (
        "scale=2208:1242:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,0.36),288-144*(1-pow(1-t/0.36,2)),144+40*sin(t/3.0))':y='81+14*sin(t*18)*exp(-mod(t,7.5))',"
        "avgblur=sizeX=68:sizeY=4:enable='lte(t,0.24)'"
    )
    segments.append(render_segment("03_C03_wide_master_clash", CLIPS["C03"], 0.15, 22.50, 22.50, vf_b3))

    # BEAT 4 (54.50s - 73.50s, 19.00s @ 1.00x): C04_R2_EXT — Angle-Change Cut (T3) into Native Camera Push-In Claw Knockdown & Mud Pin
    # Uses subtle -1.8 deg Dutch tilt + preserves Veo's native 85mm camera push-in at t=8s-19s without over-cropping the feet!
    vf_b4 = (
        "rotate=-1.8*PI/180:ow=rotw(-1.8*PI/180):oh=roth(-1.8*PI/180):c=black,"
        "scale=2240:1260:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,18.64),160+40*sin(t/3.0),160-150*pow((t-18.64)/0.36,2))':y='90+12*cos(t/2.5)',"
        "avgblur=sizeX=68:sizeY=4:enable='gte(t,18.70)',"
        "vignette=PI/8"
    )
    segments.append(render_segment("04_C04_85mm_tight_claw_closeup", CLIPS["C04"], 0.15, 19.00, 19.00, vf_b4))

    # BEAT 5 (73.50s - 92.00s, 18.50s @ 1.00x): C05 (ss=6.30s -> 24.80s) — Incoming Whip-Pan (T4) into Active Jaw-Lock & Downward Neck-Wrench!
    # Ends right at t=24.80s as T-Rex wrenches Spinosaurus violently downward into the sand for the Kurosawa Match-on-Action Cut (T5)!
    vf_b5 = (
        "scale=2368:1332:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,0.36),420-200*(1-pow(1-t/0.36,2)),220+50*sin(t/3.0))':y='160-35*(t/18.5)',"
        "avgblur=sizeX=68:sizeY=4:enable='lte(t,0.24)'"
    )
    segments.append(render_segment("05_C05_45deg_torchwall_lift", CLIPS["C05"], 6.30, 18.50, 18.50, vf_b5))

    # BEAT 6 (92.00s - 111.50s, 19.50s @ 1.00x): C06_R3_EXT (ss=1.20s -> 20.70s) — Kurosawa Match-on-Action Cut (T5) into 24mm Wide Seismic Slam & Beside-Body Victory Roar!
    vf_b6 = (
        "scale=2112:1188:flags=lanczos,"
        "crop=1920:1080:x='96+28*sin(t/4.0)':y='54+20*sin(t*22)*exp(-max(0,t-0.8)*2.5)'"
    )
    segments.append(render_segment("06_C06_wide_seismic_slam_stomp", CLIPS["C06"], 1.20, 19.50, 19.50, vf_b6))

    # BEAT 7 (111.50s - 120.00s, 8.50s @ 1.00x): C06_R3_EXT (ss=22.30s -> 30.80s) — Angle-Change Cut (T6) into Native 24fps Extreme Low-Angle Worm's-Eye Hero Close-Up Dolly Push-In!
    vf_b7 = (
        "scale=2240:1260:flags=lanczos,"
        "crop=1920:1080:x='120-50*(t/8.5)':y='70-30*(t/8.5)',"
        "vignette=PI/6"
    )
    segments.append(render_segment("07_C06_85mm_wormseye_hero_roar", CLIPS["C06"], 22.30, 8.50, 8.50, vf_b7))

    concat_txt = os.path.join(OUT_DIR, "concat_list.txt")
    with open(concat_txt, "w", encoding="utf-8") as f:
        for s in segments:
            f.write(f"file '{s}'\n")

    raw_concat = os.path.join(TRIM_DIR, "raw_monolithic_concat_120s.mp4")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt, "-c", "copy", raw_concat],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    print(f"Concatenated 7-beat 120.00s stream (100% native 1.00x 24fps) -> {raw_concat}")
    return raw_concat

if __name__ == "__main__":
    build_all_7_beats()
