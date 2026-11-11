import os
import subprocess
from gtts import gTTS

SCRATCH_DIR = "/home/user/.gemini/antigravity/brain/e3d13205-8936-4f70-958e-d9b3d70b8138/scratch"
VO_V4_DIR = os.path.join(SCRATCH_DIR, "vo_phonetic_v4_62s")
VO_V3_DIR = os.path.join(SCRATCH_DIR, "vo_phonetic_v3_120s")
os.makedirs(VO_V4_DIR, exist_ok=True)
os.makedirs(VO_V3_DIR, exist_ok=True)

PHONETIC_MAP = {
    "IGNIS REX": "Ích-nít Rếch",
    "IGNIS_REX": "Ích-nít Rếch",
    "Ignis Rex": "Ích-nít Rếch",
    "Igna Rex": "Ích-nít Rếch",
    "LEVIATHAN SPINO": "Lê-vai-a-than Spai-nô",
    "LEVIATHAN_SPINO": "Lê-vai-a-than Spai-nô",
    "Leviathan Spino": "Lê-vai-a-than Spai-nô",
    "Spinosaurus Aegyptiacus": "Spai-nô-sô-rớt Ê-gíp-ti-a-cớt",
    "Spinosaurus": "Spai-nô-sô-rớt",
    "SPINO": "Spai-nô",
    "Spino": "Spai-nô",
    "Tyrannosaurus Rex": "Ti-ra-nô-sô-rớt Rếch",
    "12,800 PSI": "mười hai ngàn tám trăm pi-ét-ai",
    "12.800 PSI": "mười hai ngàn tám trăm pi-ét-ai",
    "8,200 PSI": "tám ngàn hai trăm pi-ét-ai",
    "8.200 PSI": "tám ngàn hai trăm pi-ét-ai",
    "20,3 tấn": "hai mươi phẩy ba tấn",
    "10,5 tấn": "mười phẩy năm tấn",
    "9,8 tấn": "chín phẩy tám tấn",
    "15,8 mét": "mười lăm phẩy tám mét",
    "13,5 mét": "mười ba phẩy năm mét",
    "20 tấn": "hai mươi tấn",
    "10 tấn": "mười tấn",
    "K.O.": "nốc ao",
}

def normalize_phonetic(text: str) -> str:
    out = text
    # Sort keys by length descending so longer phrases match first
    for k in sorted(PHONETIC_MAP.keys(), key=len, reverse=True):
        out = out.replace(k, PHONETIC_MAP[k])
    return out

# 1. 9-Shot Director's Cut V4 (62.00s) — Exact Master Shot List from Gemini Web Expert Turn 5
V4_VO_LINES = [
    ("v4_vo_01", 0.25, 3.85, "Mười tấn sát khí nghiền nát cát đen Đấu Trường Hắc Nham!"),
    ("v4_vo_02", 4.15, 9.80, "IGNIS REX và LEVIATHAN SPINO lao thẳng vào tâm võ đài!"),
    ("v4_vo_03", 10.15, 15.80, "20 tấn thịt thép ghì chặt, không một bước nhượng bộ!"),
    ("v4_vo_04", 16.10, 20.85, "SPINO vung vuốt 8.200 PSI xé toạc sườn đối thủ!"),
    ("v4_vo_05", 21.15, 26.80, "Cú tát hiểm hóc quật ngã Bạo Chúa xuống lớp cát núi lửa!"),
    ("v4_vo_06", 27.10, 32.85, "Giữa vòng vây nghẹt thở, đôi mắt hổ phách của IGNIS REX rực sáng!"),
    ("v4_vo_07", 33.15, 40.80, "Bạo Chúa vùng dậy, khóa chặt hàm 12.800 PSI vào thẳng cổ SPINO!"),
    ("v4_vo_08", 41.15, 49.80, "Cú quật ngàn cân! Thủy quái 10,5 tấn đập sấp sàn đá, hoàn toàn gục ngã!"),
    ("v4_vo_09", 50.40, 60.50, "Nhà vô địch tuyệt đối của Đấu Trường Hắc Nham: IGNIS REX!"),
]

# 2. 10-Beat Upgraded 120.00s Full Broadcast Master — With Cold Open Hook & Close-Up Coverage
V3_VO_LINES = [
    ("v3_vo_01", 0.30, 3.90, "Mười tấn sát khí nghiền nát cát đen Đấu Trường Hắc Nham!"),
    ("v3_vo_02", 4.40, 15.60, "Từ cổng Tây: IGNIS REX, Bạo Chúa Tyrannosaurus Rex! Nặng 9,8 tấn, lực cắn 12.800 PSI!"),
    ("v3_vo_03", 16.50, 31.40, "Ở cổng Đông: LEVIATHAN SPINO, Spinosaurus Aegyptiacus! Dài 15,8 mét, nặng 10,5 tấn! Trận chiến bắt đầu!"),
    ("v3_vo_04", 32.50, 42.50, "Hai cỗ máy 10 tấn lao thẳng vào tâm võ đài! Cú húc vai 20 tấn nổ tung bụi cát, đẩy cả hai bật lùi!"),
    ("v3_vo_05", 43.50, 53.50, "Hai mươi tấn thịt thép ghì chặt, liên tục tung những cú táp hàm uy lực giữa tâm đấu trường!"),
    ("v3_vo_06", 54.80, 62.50, "Đòn đánh hiểm hóc! SPINO vung vuốt 8.200 PSI xé toạc sườn đối thủ!"),
    ("v3_vo_07", 63.20, 71.50, "Cú tát 8.200 PSI quật ngã IGNIS REX xuống cát đen, SPINO lao tới đè chặt vai Bạo Chúa!"),
    ("v3_vo_08", 72.30, 78.20, "Giữa vòng vây nghẹt thở, đôi mắt hổ phách của IGNIS REX rực sáng!"),
    ("v3_vo_09", 78.80, 91.20, "PHẢN ĐÒN HỦY DIỆT! Bạo Chúa vùng dậy, khóa chặt hàm 12.800 PSI bẻ gập cổ SPINO!"),
    ("v3_vo_10", 92.20, 104.00, "Cú quật ngàn cân! Thủy quái 10,5 tấn đập sấp sàn đá nổ tung bụi mù, hoàn toàn gục ngã!"),
    ("v3_vo_11", 108.00, 119.20, "Đứng sừng sững bên kẻ bại trận, tiếng gầm vang dội khắp võ đài! Nhà vô địch tuyệt đối: IGNIS REX!"),
]

def synth_vo_set(lines, out_dir):
    print(f"=== Synthesizing VO set in {out_dir} ===")
    for name, start_s, end_s, disp_text in lines:
        window = end_s - start_s
        tts_text = normalize_phonetic(disp_text)
        raw_mp3 = os.path.join(out_dir, f"{name}_raw.mp3")
        wav_out = os.path.join(out_dir, f"{name}.wav")
        tts = gTTS(text=tts_text, lang="vi", slow=False)
        tts.save(raw_mp3)

        # First convert and trim silence, pitching down to a deep resonant Baritone Stadium Announcer
        # Wait: let's measure raw duration first so we set exact atempo to guarantee 0% truncation!
        temp_wav = os.path.join(out_dir, f"{name}_temp.wav")
        subprocess.run([
            "ffmpeg", "-y", "-i", raw_mp3,
            "-af", "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-45dB:stop_periods=-1:stop_silence=0.06:stop_threshold=-45dB,asetrate=24000*0.88,aresample=48000,atempo=1.22",
            temp_wav
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        dur = float(subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", temp_wav
        ]).decode().strip())

        # Ensure it fits comfortably inside (window - 0.25s) WITHOUT ever truncating a single syllable!
        max_allowed = window - 0.25
        extra_tempo = 1.0
        if dur > max_allowed:
            extra_tempo = min(1.35, (dur / max_allowed) * 1.03)

        af_chain = (
            f"atempo={extra_tempo:.4f},"
            "equalizer=f=115:t=q:w=1.1:g=5.0,"
            "equalizer=f=3200:t=q:w=1.4:g=3.5,"
            "acompressor=threshold=-16dB:ratio=3.5:attack=5:release=60:makeup=4dB,"
            "aecho=0.85:0.88:45:0.16,"
            "aformat=sample_fmts=s16:channel_layouts=stereo"
        )
        subprocess.run([
            "ffmpeg", "-y", "-i", temp_wav,
            "-af", af_chain,
            "-ar", "48000",
            wav_out
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        final_dur = float(subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", wav_out
        ]).decode().strip())
        print(f"  {name}: [{start_s:.2f}s - {end_s:.2f}s] (win={window:.2f}s, actual={final_dur:.2f}s) | TTS='{tts_text}'")
        assert final_dur <= window + 0.05, f"VO {name} exceeds window!"

if __name__ == "__main__":
    synth_vo_set(V4_VO_LINES, VO_V4_DIR)
    synth_vo_set(V3_VO_LINES, VO_V3_DIR)
