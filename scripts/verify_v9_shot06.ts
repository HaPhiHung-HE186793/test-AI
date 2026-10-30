import * as fs from 'fs';
import * as path from 'path';
import { Flow } from '../services/flowSdkClient.ts';

const RUN_DIR = path.resolve('output/vscode_runs/dino_premium_v2');
const STATE_PATH = path.join(RUN_DIR, 'state.json');

async function main() {
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const shot06Start = state.media['shot_06_start_frame'];
  const outPath = path.join(RUN_DIR, 'verify_v9_shot06_ocean_gag.mp4');

  console.log('=== Generating Shot 06 (Tide MCU) with Shayan Time-Coded Prompt + Ocean Gag (10 credits) ===');
  const prompt06 =
    'Visual Style: 3D Pixar-style family cartoon animation, warm golden-hour sunlight, expressive facial animation.\n' +
    'Characters (keep design identical in every shot): Tide (image 1), sleek juvenile Spinosaurus with slate-blue crocodile snout, cream underjaw, and tall fan-shaped dorsal sail with glowing cyan-teal stripes.\n' +
    'Environment: Shallow turquoise oasis pool in a cracked-mud basin.\n' +
    'Timeline:\n' +
    '[0–1.5s] Medium close-up of Tide standing still in the pool facing screen-left, flaring his glowing cyan dorsal sail proudly.\n' +
    '[1.5–4s] Tide glares down with a bossy smirk and speaks clearly with accurate lip-sync. Tide (deep, bossy rival voice): "Back off, short-arms! This ocean is mine."\n' +
    'Audio: Clear English dialogue, low water ripple, no background music.';

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res: any = await Flow.generate.video({
        prompt: prompt06,
        modelDisplayName: 'Veo 3.1 - Fast',
        aspectRatio: '16:9',
        durationSeconds: 4,
        resolution: '720p',
        firstFrameImageMediaId: shot06Start,
      });
      fs.writeFileSync(outPath, Buffer.from(res.base64, 'base64'));
      state.media['verify_v9_shot06_ocean_gag'] = res.mediaId;
      fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
      console.log('Saved:', outPath);
      return;
    } catch (e: any) {
      console.warn(`Attempt ${attempt}/4 failed: ${e?.message || e}`);
      if (attempt === 4) throw e;
      await new Promise((r) => setTimeout(r, 8000 * attempt));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

