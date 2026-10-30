"""Score + ambience + impact mix on top of a mastered picture's Veo stem, then static-gain loudness to -14 LUFS.
Usage: python proto_music_mix.py <runDir> <masterMp4> <outMp4> <cutTimesCsv>
cutTimes = cumulative start times of each shot in the master (13 values) + end time."""
import json, os, re, subprocess, sys

run, master, out, cuts_csv = sys.argv[1:5]
# ffmpeg-static của dự án, đường dẫn tương đối (chạy được trên mọi máy)
_ff_static = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
FF = _ff_static if os.path.exists(_ff_static) else 'ffmpeg'
A = os.path.join(run, 'audio_r3')
cuts = [float(x) for x in cuts_csv.split(',')]
T = cuts[-1]
# shot order in the film: 1 2 3 4 5 6 7 13 8 9 10 11 12 -> index of first fight shot (5) = 4, impact cut (9->10) = 10, mercy (11) = 11
FI, II, RI = (int(x) for x in (sys.argv[5:8] if len(sys.argv) >= 8 else (4, 10, 11)))
SPLAT = int(sys.argv[8]) if len(sys.argv) >= 9 else -1  # điểm cắt lược cú ngã (đuôi -> nằm bùn)
t_splat = cuts[SPLAT] if SPLAT >= 0 else -1
t_fight = cuts[FI] - 0.5
t_impact = cuts[II]
t_resolve = cuts[RI] - 0.3
work = os.path.join(run, 'audio_r3', 'mix_work')
os.makedirs(work, exist_ok=True)


def ff(args, **kw):
    r = subprocess.run([FF, '-hide_banner', '-y', *args], capture_output=True, text=True, encoding='utf-8', errors='replace', **kw)
    if r.returncode != 0:
        raise SystemExit(r.stderr[-1500:])
    return r.stderr


def lufs(path):
    e = subprocess.run([FF, '-hide_banner', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='replace').stderr
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', e)
    LRA = re.findall(r'LRA:\s+([\d.]+) LU', e)
    TP = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', e)
    return float(I[-1]), float(LRA[-1]), float(TP[-1]) if TP else None


stem = os.path.join(work, 'stem.wav')
ff(['-i', master, '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_f32le', stem])
stem_i, _, _ = lufs(stem)
# Music levels relative to the stem: score ~9 LU under, ambience ~16 LU under.
cue_i = {k: lufs(os.path.join(A, f'{k}.wav'))[0] for k in ['music_setup', 'music_fight', 'music_resolve', 'ambience']}
g = lambda k, under: (stem_i - under) - cue_i[k]

fight_len = t_impact - 0.2 - t_fight
splat_duck_pre = f",volume='if(between(t,{t_splat-0.25:.3f},{t_splat-0.02:.3f}),0.12,1)':eval=frame,volume='if(between(t,{t_splat-0.02:.3f},{t_splat+0.35:.3f}),0.40,1)':eval=frame" if t_splat > 0 else ""
graph = f"""
[1:a]atrim=0:8.0,asetpts=PTS-STARTPTS,volume={g('music_setup', 9):.2f}dB,afade=t=in:d=0.4,afade=t=out:st={t_fight + 0.1:.3f}:d=0.8,apad=whole_dur={T:.3f}[setup];
[2:a]atrim=0:8.0,asetpts=PTS-STARTPTS[f1];[2:a]atrim=1.5:8.0,asetpts=PTS-STARTPTS[f2];[f1][f2]acrossfade=d=0.6:c1=qsin:c2=qsin,atrim=0:{fight_len:.3f},volume={g('music_fight', 6):.2f}dB,afade=t=in:d=0.5,afade=t=out:st={fight_len - 0.15:.3f}:d=0.15,adelay={int(t_fight * 1000)}:all=1,apad=whole_dur={T:.3f}{splat_duck_pre}[fight];
[3:a]atrim=0:{T - t_resolve + 0.2:.3f},asetpts=PTS-STARTPTS,volume={g('music_resolve', 9):.2f}dB,afade=t=in:d=0.7,afade=t=out:st={max(0.5, T - t_resolve - 1.4):.3f}:d=1.4,adelay={int(t_resolve * 1000)}:all=1,apad=whole_dur={T:.3f}[resolve];
[4:a]aloop=loop=-1:size=2147483647,atrim=0:{T:.3f},highpass=f=60,volume={g('ambience', 16):.2f}dB,volume='if(between(t,{t_impact-0.21:.3f},{t_impact:.3f}),0.1,1)':eval=frame{splat_duck_pre},afade=t=in:d=0.5,afade=t=out:st={T - 1.2:.3f}:d=1.2[amb];
aevalsrc='0.9*sin(2*PI*(30+50*exp(-5*t))*t)*exp(-4*t)|0.9*sin(2*PI*(30+50*exp(-5*t))*t)*exp(-4*t)':s=48000:d=0.6,volume={(stem_i + 1) - (-12):.2f}dB[sub];
anoisesrc=c=brown:r=48000:d=0.18:a=0.9,lowpass=f=420,afade=t=out:st=0.02:d=0.16,volume=-6dB,aformat=channel_layouts=stereo[body];
anoisesrc=c=white:r=48000:d=0.04:a=0.8,bandpass=f=2500:width_type=q:w=1.2,afade=t=out:st=0.005:d=0.035,volume=-4dB,aformat=channel_layouts=stereo[crack];
[5:a]aformat=sample_fmts=fltp:channel_layouts=stereo,volume=12dB,equalizer=f=2500:t=q:w=1.2:g=5,asplit=2[foley][foley_splat];
[sub][body][crack][foley]amix=inputs=4:normalize=0,adelay={int(t_impact * 1000) - 10}:all=1,apad=whole_dur={T:.3f}[hit0];
anoisesrc=c=brown:r=48000:d=0.22:a=0.9,lowpass=f=900,afade=t=out:st=0.02:d=0.2,volume=-5dB,aformat=channel_layouts=stereo[splat_low];
anoisesrc=c=white:r=48000:d=0.09:a=0.85,bandpass=f=1850:width_type=q:w=1.1,afade=t=out:st=0.01:d=0.08,volume=-2dB,aformat=channel_layouts=stereo[splat_mid];
[foley_splat]volume=-2dB[splat_f];
[splat_low][splat_mid][splat_f]amix=inputs=3:normalize=0,adelay={max(0,int(t_splat * 1000) - 10)}:all=1,apad=whole_dur={T:.3f}[splat];
[hit0][splat]amix=inputs=2:normalize=0,aresample=192000,alimiter=limit=0.6:attack=0.5:release=40:level=0,aresample=48000[hit];
[setup][fight][resolve]amix=inputs=3:normalize=0[score];
[0:a]volume='if(between(t,{t_impact-0.21:.3f},{t_impact:.3f}),0.1+0.9*min(1,max(0,({t_impact-0.21:.3f}+0.025-t)/0.025)+max(0,(t-{t_impact:.3f}+0.025)/0.025)),1)':eval=frame,volume='if(between(t,{t_impact:.3f},{t_impact+0.6:.3f}),0.4,1)':eval=frame{splat_duck_pre},asplit=2[st][key];
[score][key]sidechaincompress=threshold=0.2:ratio=2:attack=20:release=120[scoreduck];
[st][scoreduck][amb][hit]amix=inputs=4:normalize=0,atrim=0:{T:.3f}[mix]
"""
gfile = os.path.join(work, 'mix_graph.txt')
open(gfile, 'w', encoding='utf-8').write(graph.strip())
mixwav = os.path.join(work, 'mix.wav')
ff(['-i', stem, '-i', os.path.join(A, 'music_setup.wav'), '-i', os.path.join(A, 'music_fight.wav'), '-i', os.path.join(A, 'music_resolve.wav'), '-i', os.path.join(A, 'ambience.wav'), '-i', os.path.join(A, 'hit_foley.wav'),
    '-filter_complex_script', gfile, '-map', '[mix]', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_f32le', mixwav])
mi, mlra, mtp = lufs(mixwav)
# Static gain to -14 with a gentle true-peak limiter; accept up to 3 dB limiting, else settle at a lower integrated level.
gain = -14.0 - mi
headroom = -1.5 - (mtp + gain)
lim_gr = max(0.0, -headroom)
if lim_gr > 6.0:
    gain -= (lim_gr - 6.0)
final_wav = os.path.join(work, 'final.wav')
ff(['-i', mixwav, '-af', f'volume={gain:.2f}dB,aresample=192000,alimiter=limit={10 ** (-1.5 / 20):.4f}:attack=3:release=60:level=0,aresample=48000', '-c:a', 'pcm_f32le', final_wav])
fi, flra, ftp = lufs(final_wav)
ff(['-i', master, '-i', final_wav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out])
print(json.dumps({'stem_lufs': stem_i, 'cues': cue_i, 'mix_pre': [mi, mlra, mtp], 'gain_db': round(gain, 2), 'limiter_needed_db': round(lim_gr, 2),
                  'final': {'I': fi, 'LRA': flra, 'TP': ftp}, 't_fight': t_fight, 't_impact': t_impact, 't_resolve': t_resolve, 'out': out}, indent=1))
