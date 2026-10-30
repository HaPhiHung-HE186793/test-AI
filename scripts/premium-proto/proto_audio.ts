// Ambience bed + music cues rendered with Veo from the empty environment plate (audio is what we keep).
// Usage: node --experimental-strip-types proto_audio.ts <runDir>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { Flow } from '../../services/flowSdkClient.ts';

const runDir = path.resolve(process.argv[2]);
// ffmpeg-static của dự án (Windows: ffmpeg.exe, Linux/macOS: ffmpeg) — đường dẫn tương đối, chạy được trên mọi máy.
const FF = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
const state = JSON.parse(fs.readFileSync(path.join(runDir, 'state.json'), 'utf-8'));
const plate = state.media['03_environment_plate'];
const outDir = path.join(runDir, 'audio_r3');
fs.mkdirSync(outDir, { recursive: true });
const STYLE = 'Pixar-like 3D animation, soft global illumination.';
const SCENE = 'Static camera, one continuous shot. The empty volcanic valley at golden hour, steam drifting slowly from the warm pools.';
const JOBS = [
  { key: 'ambience', model: 'Veo 3.1 - Lite', prompt: `${SCENE} Ambient noise: steady low wind, gentle bubbling hot springs, a distant volcanic rumble. ${STYLE}` },
  { key: 'music_setup', model: 'Veo 3.1 - Fast', prompt: `${SCENE} Music: a gentle, curious orchestral cartoon score with soft pizzicato strings and a light playful woodwind melody. ${STYLE}` },
  { key: 'music_fight', model: 'Veo 3.1 - Fast', prompt: `${SCENE} Music: a tense, energetic orchestral cartoon action score with pounding taiko drums, low staccato strings and short brass hits. ${STYLE}` },
  { key: 'music_resolve', model: 'Veo 3.1 - Fast', prompt: `${SCENE} Music: a warm, tender orchestral resolution with soft sustained strings and a gentle french horn melody, ending on a calm major chord. ${STYLE}` },
];
const withTimeout = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms / 1000}s`)), ms))]);

(async () => {
  for (const j of JOBS) {
    const mp4 = path.join(outDir, `${j.key}.mp4`);
    if (!fs.existsSync(mp4)) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const t0 = Date.now();
          const res: any = await withTimeout(Flow.generate.video({ prompt: j.prompt, modelDisplayName: j.model, aspectRatio: '16:9', durationSeconds: 8, resolution: '720p', firstFrameImageMediaId: plate }), 900_000);
          fs.writeFileSync(mp4, Buffer.from(res.base64, 'base64'));
          console.log(`   ✅ ${j.key} (${((Date.now() - t0) / 1000).toFixed(0)}s, ${j.model})`);
          break;
        } catch (e: any) { console.warn(`   ⚠️ ${j.key} lần ${attempt}: ${e.message}`); }
      }
    }
    if (fs.existsSync(mp4)) {
      const wav = path.join(outDir, `${j.key}.wav`);
      execSync(`"${FF}" -hide_banner -loglevel error -y -i "${mp4}" -vn -ac 2 -ar 48000 "${wav}"`);
      let lufs = '';
      try { execSync(`"${FF}" -hide_banner -i "${wav}" -af ebur128 -f null -`, { stdio: 'pipe' }); } catch {}
      try { const r = execSync(`"${FF}" -hide_banner -i "${wav}" -af ebur128 -f null - 2>&1`, { encoding: 'utf-8', shell: true } as any); lufs = (String(r).match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop() || ''; } catch (e: any) { lufs = (String(e.stdout || '').match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop() || ''; }
      console.log(`   🎵 ${j.key}.wav ${lufs}`);
    }
  }
  console.log('🏁 audio done');
})().catch((e) => { console.error('❌', e); process.exit(1); });
