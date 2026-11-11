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
    "C04": os.path.join(RAW_DIR, "C04_ACT2A_SPINO_HYDRO_CLAW_DOMINANCE_eaba8b81-e019-4aea-a58c-81c24b9c3120.mp4"),
    "C05": os.path.join(RAW_DIR, "C05_ACT2B_CRIMSON_OVERDRIVE_COUNTER_7e92ef11-84f4-46b8-98ed-019edcd703e1.mp4"),
    "C06": os.path.join(RAW_DIR, "C06_ACT3_SEISMIC_FINISHER_VICTORY_51199a27-e34e-44ca-a29d-d88edb038a47.mp4"),
    "C05_HERO_CU": os.path.join(RAW_DIR, "C05_ACT2B_CRIMSON_OVERDRIVE_COUNTER_010930d6-50cc-4c74-9fb4-e9941ac41d45.mp4"),
}

def render_segment(name, infile, ss, raw_dur, target_dur, vf_core):
    out_path = os.path.join(TRIM_DIR, f"{name}.mp4")
    pts_factor = target_dur / raw_dur
    atempo_factor = raw_dur / target_dur
    vf_full = (
        f"setpts={pts_factor:.6f}*(PTS-STARTPTS),fps=24,"
        f"{vf_core},"
        f"eq=contrast=1.04:saturation=1.05,unsharp=3:3:0.45:3:3:0.0,format=yuv420p"
    )
    af_full = (
        f"aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,"
        f"atempo={atempo_factor:.5f},"
        f"equalizer=f=65:t=q:w=1.2:g=3.0,"
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
    print(f"Rendered {name}: target={target_dur:.2f}s (raw={raw_dur:.2f}s)")
    return out_path

def build_all_7_beats():
    segments = []

    # BEAT 1 (0.00s - 16.20s, 16.20s): C01 — 28mm Wide West Gate Arrival (Zero Fire Breathing) + Outgoing Whip-Pan Right (T1)
    vf_b1 = (
        "scale=2304:1296:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,15.76),40+140*(t/15.76),180+204*(pow((t-15.76)/0.44,2)))':y='108+10*sin(t/2.0)',"
        "avgblur=sizeX=56:sizeY=6:enable='gte(t,15.82)'"
    )
    segments.append(render_segment("01_C01_wide_west_whip_out", CLIPS["C01"], 0.15, 16.20, 16.20, vf_b1))

    # BEAT 2 (16.20s - 32.40s, 16.20s): C02 — Incoming Whip-Pan Right + 28mm Wide East Gate Spinosaurus + Outgoing Whip-Pan Left (T2)
    vf_b2 = (
        "scale=2304:1296:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,0.44),20+320*(1-pow(1-t/0.44,2)),if(lt(t,15.76),340-120*((t-0.44)/15.32),220-200*pow((t-15.76)/0.44,2)))':y='108+10*cos(t/2.0)',"
        "avgblur=sizeX=56:sizeY=6:enable='lte(t,0.28)+gte(t,15.82)'"
    )
    segments.append(render_segment("02_C02_wide_east_whip_in_out", CLIPS["C02"], 0.15, 16.20, 16.20, vf_b2))

    # BEAT 3 (32.40s - 56.20s, 23.80s): C03 — Incoming Whip-Pan Left into 24mm Wide Center Arena 20-Ton Clash & Recoil (Zero Clipping!)
    vf_b3 = (
        "scale=2208:1242:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,0.44),288-144*(1-pow(1-t/0.44,2)),144+40*sin(t/3.0))':y='81+12*sin(t*18)*exp(-mod(t,7.5))',"
        "avgblur=sizeX=56:sizeY=6:enable='lte(t,0.28)'"
    )
    segments.append(render_segment("03_C03_wide_master_clash", CLIPS["C03"], 0.15, 23.80, 23.80, vf_b3))

    # BEAT 4 (56.20s - 72.60s, 16.40s): C04 — Angle-Change Cut (T3) into 1.55x (65mm-85mm) Medium-Close Telephoto Combat Shot
    # Keeps BOTH dinosaurs 100% inside the frame on solid sand while cutting out the sky/upper wall, then Whip-Pan at t >= 15.96s (T4)
    vf_b4 = (
        "scale=2976:1674:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,15.96),528+70*sin(t/3.5),528-380*pow((t-15.96)/0.44,2))':y='340+25*cos(t/3.0)',"
        "avgblur=sizeX=56:sizeY=6:enable='gte(t,16.02)',"
        "vignette=PI/7"
    )
    segments.append(render_segment("04_C04_85mm_tight_claw_closeup", CLIPS["C04"], 0.15, 16.40, 16.40, vf_b4))

    # BEAT 5 (72.60s - 92.00s, 19.40s): C05 — Incoming Whip-Pan (T4) into Low-Angle Center-Arena Neck Grapple & Wrench (30m from walls, Zero Wall Clipping!)
    vf_b5 = (
        "scale=2496:1404:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,0.44),480-200*(1-pow(1-t/0.44,2)),280+60*sin(t/3.2))':y='210-30*(t/19.4)',"
        "avgblur=sizeX=56:sizeY=6:enable='lte(t,0.28)'"
    )
    segments.append(render_segment("05_C05_45deg_torchwall_lift", CLIPS["C05"], 0.15, 19.40, 19.40, vf_b5))

    # BEAT 6 (92.00s - 113.80s, 21.80s): C06 — Kurosawa Match-on-Action Cut (T5) into 24mm Wide Seismic Slam & Victory Roar Beside Fallen Spino (Zero Leg Clipping!)
    vf_b6 = (
        "scale=2112:1188:flags=lanczos,"
        "crop=1920:1080:x='96+30*sin(t/4.0)':y='54+18*sin(t*22)*exp(-max(0,t-1.2)*2.5)'"
    )
    segments.append(render_segment("06_C06_wide_seismic_slam_stomp", CLIPS["C06"], 1.00, 21.80, 21.80, vf_b6))

    # BEAT 7 (113.80s - 120.00s, 6.20s): Angle-Change Cut (T6) into 85mm Extreme Worm's-Eye Hero Close-Up + Spielberg Slow Dolly Push-In
    vf_b7 = (
        "scale=2304:1296:flags=lanczos,"
        "crop=1920:1080:x='192-60*(t/6.2)':y='108-40*(t/6.2)',"
        "vignette=PI/6"
    )
    segments.append(render_segment("07_C05_85mm_wormseye_hero_roar", CLIPS["C05_HERO_CU"], 21.50, 3.96, 6.20, vf_b7))

    concat_txt = os.path.join(OUT_DIR, "concat_list.txt")
    with open(concat_txt, "w", encoding="utf-8") as f:
        for s in segments:
            f.write(f"file '{s}'\n")

    raw_concat = os.path.join(TRIM_DIR, "raw_monolithic_concat_120s.mp4")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_txt, "-c", "copy", raw_concat],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    print(f"Concatenated 7-beat 120.00s stream -> {raw_concat}")
    return raw_concat

if __name__ == "__main__":
    build_all_7_beats()
