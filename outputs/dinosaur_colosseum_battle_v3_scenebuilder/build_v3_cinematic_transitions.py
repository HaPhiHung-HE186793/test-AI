import os
import subprocess

OUT_DIR = "/mnt/data/backup/project_personal/test-AI/outputs/dinosaur_colosseum_battle_v3_scenebuilder"
RAW_DIR = os.path.join(OUT_DIR, "clips_raw")
TRIM_DIR = os.path.join(OUT_DIR, "clips_trimmed")
SCRATCH_DIR = "/home/user/.gemini/antigravity/brain/e3d13205-8936-4f70-958e-d9b3d70b8138/scratch"
os.makedirs(TRIM_DIR, exist_ok=True)
os.makedirs(SCRATCH_DIR, exist_ok=True)

CLIPS = {
    "C01": os.path.join(RAW_DIR, "C01_ACT1_IGNIS_REX_ARRIVAL_5cdd24bc-1540-4e9e-afb7-f383d84ff4cc.mp4"),
    "C02": os.path.join(RAW_DIR, "C02_ACT1_LEVIATHAN_SPINO_CHALLENGE_9d3988ab-d9d8-4733-8775-907d94b3a953.mp4"),
    "C03": os.path.join(RAW_DIR, "C03_ACT2A_20TON_COLLISION_JAWLOCK_679be88e-b2d2-4a76-b6e8-df93e073de98.mp4"),
    "C04": os.path.join(RAW_DIR, "C04_ACT2A_SPINO_HYDRO_CLAW_DOMINANCE_99d10853-5246-42af-8c16-baba169d5b69.mp4"),
    "C05": os.path.join(RAW_DIR, "C05_ACT2B_CRIMSON_OVERDRIVE_COUNTER_010930d6-50cc-4c74-9fb4-e9941ac41d45.mp4"),
    "C06": os.path.join(RAW_DIR, "C06_ACT3_SEISMIC_FINISHER_VICTORY_5ce1d083-2ce0-4b7f-8e68-d527fbbf8bf5.mp4"),
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
    segments = [
        os.path.join(TRIM_DIR, "01_C01_wide_west_whip_out.mp4"),
        os.path.join(TRIM_DIR, "02_C02_wide_east_whip_in_out.mp4"),
        os.path.join(TRIM_DIR, "03_C03_wide_master_clash.mp4"),
    ]

    # BEAT 4 (56.20s - 72.60s, 16.40s): C04 — 2.0x (85mm) Tight Telephoto Close-Up on Spinosaurus Claws & Jaws (No Sky / No Upper Wall)
    # Outgoing Whip-Pan Left/Down at t >= 15.96s into T-Rex's counter-surge!
    vf_b4 = (
        "scale=3840:2160:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,15.96),1040+120*sin(t/4.0),1040-520*pow((t-15.96)/0.44,2))':y='490+40*cos(t/3.5)',"
        "avgblur=sizeX=56:sizeY=6:enable='gte(t,16.02)',"
        "vignette=PI/6"
    )
    segments.append(render_segment("04_C04_85mm_tight_claw_closeup", CLIPS["C04"], 0.10, 16.40, 16.40, vf_b4))

    # BEAT 5 (72.60s - 92.00s, 19.40s): C05 Part A — Starts on Tight Close-Up of T-Rex's Roaring Head in Mud (Whip-Pan In) & Pulls Back into 45° Flaming-Torch Wall Lift
    vf_b5 = (
        "scale=3072:1728:flags=lanczos,"
        "crop=1920:1080:x='if(lt(t,0.44),720-440*pow(t/0.44,0.6),280+580*(t/19.4))':y='340-160*(t/19.4)',"
        "avgblur=sizeX=56:sizeY=6:enable='lte(t,0.28)'"
    )
    segments.append(render_segment("05_C05_45deg_torchwall_lift", CLIPS["C05"], 0.10, 18.40, 19.40, vf_b5))

    segments.append(os.path.join(TRIM_DIR, "06_C06_wide_seismic_slam_stomp.mp4"))
    segments.append(os.path.join(TRIM_DIR, "07_C05_85mm_wormseye_hero_roar.mp4"))

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
