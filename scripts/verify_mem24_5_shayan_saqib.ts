import * as fs from 'fs';
import * as path from 'path';
import { Flow } from '../services/flowSdkClient.ts';

const RUN_DIR = path.resolve('output/vscode_runs/dino_premium_v2');
const STATE_PATH = path.join(RUN_DIR, 'state.json');

async function callWithRetry<T>(label: string, fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      console.warn(`[${label}] Attempt ${attempt}/${maxRetries} failed: ${err?.message || err}`);
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 8000 * attempt));
    }
  }
  throw new Error(`Unreachable: ${label}`);
}

async function main() {
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const char1Turn = state.media['02_char1_turnaround'];
  const char2Turn = state.media['02_char2_turnaround'];
  const stageMedia = state.media['02_stage_mud_arena'];
  const shot02Start = state.media['shot_02_start_frame'];
  const shot04Start = state.media['shot_04_start_frame'];
  const shot09Start = state.media['verify_L25_action_pose_charge'] || state.media['shot_09_start_frame'];
  const shot09End = state.media['shot_09_end_frame'];
  const shot12Start = state.media['shot_12_start_frame'];

  // 1. Test Muhammad Saqib's Verbatim 16:9 Storyboard Grid Sheet Prompt (0 credits)
  const storyboardPath = path.join(RUN_DIR, '03_storyboard_grid_sheet_saqib.png');
  if (!fs.existsSync(storyboardPath)) {
    console.log('=== [1/5] Generating Muhammad Saqib 16:9 Storyboard Grid Sheet (0 credits) ===');
    const saqibStoryboardPrompt =
      'Create a professional cinematic 3D animated storyboard sheet in a clean 3x3 16:9 widescreen grid layout with numbered panels (SCENE 1 to SCENE 9) and short scene titles below each frame. ' +
      'Preserve the exact characters from image 1 (Ember, chubby baby Tyrannosaurus Rex with warm mossy-green skin, orange-amber back stripes, cream belly, tiny two-fingered arms) and image 2 (Tide, sleek juvenile Spinosaurus with slate-blue crocodile snout and tall fan-shaped dorsal sail with glowing cyan-teal stripes) inside the dried mud oasis basin from image 3: ' +
      'Scene 1: Oasis Discovery. Scene 2: Ember Flexes Tiny Arms. Scene 3: Tide Emerges From Pool. Scene 4: Roaring Standoff. Scene 5: Ember Dodges Snap. Scene 6: Tail Sweep Knockdown. Scene 7: Ember Awakens Determined. Scene 8: Battering-Ram Headbutt Charge. Scene 9: Forgiveness & Sharing Water. ' +
      'Maintain consistent Pixar-style 3D lighting, vibrant natural colors, detailed scaly textures, and readable numbering.';
    const res: any = await callWithRetry('saqib_storyboard', () =>
      Flow.generate.image({
        prompt: saqibStoryboardPrompt,
        modelDisplayName: '🍌 Nano Banana Pro',
        aspectRatio: '16:9',
        referenceImageMediaIds: [char1Turn, char2Turn, stageMedia],
      })
    );
    fs.writeFileSync(storyboardPath, Buffer.from(res.base64, 'base64'));
    state.media['03_storyboard_grid_sheet_saqib'] = res.mediaId;
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    console.log('Saved:', storyboardPath);
  }

  // 2. Test Shayan Sadiq Verbatim Time-Coded Prompt + D.Pommikox Comment-Bait Gag #1 on Shot 02 (10 credits)
  const v9Shot02Path = path.join(RUN_DIR, 'verify_v9_shot02_sleeves_gag.mp4');
  if (!fs.existsSync(v9Shot02Path)) {
    console.log('=== [2/5] Generating Shot 02 with Shayan Time-Coded Prompt + Sleeves Comment-Bait Gag (10 credits) ===');
    const prompt02 =
      'Visual Style: 3D Pixar-style family cartoon animation, warm golden-hour sunlight, expressive facial animation and lighthearted comedy.\n' +
      'Characters (keep design identical in every shot): Ember (image 1), chubby baby Tyrannosaurus Rex standing upright on two hind legs, warm mossy-green scaly skin, bright orange-amber stripes along the back ridge only, cream belly, big amber eyes, tiny two-fingered stubby arms.\n' +
      'Environment: Turquoise oasis pool edge in a cracked-mud basin.\n' +
      'Timeline:\n' +
      '[0–1.5s] Close-up on Ember standing still beside the turquoise pool, looking across the water with narrowed eyes and wiggling both tiny stubby two-fingered arms.\n' +
      '[1.5–4s] Ember puffs out his chest with a cocky grin and speaks clearly with accurate lip-sync. Ember (confident, playful young voice): "Don\'t make me roll up my sleeves!"\n' +
      'Audio: Clear English dialogue, soft water lap, no background music.';
    const res: any = await callWithRetry('v9_shot02', () =>
      Flow.generate.video({
        prompt: prompt02,
        modelDisplayName: 'Veo 3.1 - Fast',
        aspectRatio: '16:9',
        durationSeconds: 4,
        resolution: '720p',
        firstFrameImageMediaId: shot02Start,
      })
    );
    fs.writeFileSync(v9Shot02Path, Buffer.from(res.base64, 'base64'));
    state.media['verify_v9_shot02_sleeves_gag'] = res.mediaId;
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    console.log('Saved:', v9Shot02Path);
  }

  // 3. Test Shayan Sadiq Verbatim Time-Coded Prompt + Ocean Comment-Bait Gag #2 on Shot 04 (10 credits)
  const v9Shot04Path = path.join(RUN_DIR, 'verify_v9_shot04_ocean_gag.mp4');
  if (!fs.existsSync(v9Shot04Path)) {
    console.log('=== [3/5] Generating Shot 04 with Shayan Time-Coded Prompt + Ocean Comment-Bait Gag (10 credits) ===');
    const prompt04 =
      'Visual Style: 3D Pixar-style family cartoon animation, warm golden-hour sunlight, expressive facial animation.\n' +
      'Characters (keep design identical in every shot): Tide (image 1), sleek juvenile Spinosaurus with slate-blue crocodile snout, cream underjaw, and tall fan-shaped dorsal sail with glowing cyan-teal stripes.\n' +
      'Environment: Shallow turquoise oasis puddle in a cracked-mud basin.\n' +
      'Timeline:\n' +
      '[0–1.5s] Medium close-up of Tide standing in the shallow pool facing screen-left, flaring his glowing cyan dorsal sail proudly.\n' +
      '[1.5–4s] Tide glares down with a bossy smirk and speaks clearly with accurate lip-sync. Tide (deep, bossy rival voice): "Back off, short-arms! This ocean is mine."\n' +
      'Audio: Clear English dialogue, low water ripple, no background music.';
    const res: any = await callWithRetry('v9_shot04', () =>
      Flow.generate.video({
        prompt: prompt04,
        modelDisplayName: 'Veo 3.1 - Fast',
        aspectRatio: '16:9',
        durationSeconds: 4,
        resolution: '720p',
        firstFrameImageMediaId: shot04Start,
      })
    );
    fs.writeFileSync(v9Shot04Path, Buffer.from(res.base64, 'base64'));
    state.media['verify_v9_shot04_ocean_gag'] = res.mediaId;
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    console.log('Saved:', v9Shot04Path);
  }

  // 4. Test Shayan Sadiq Verbatim Time-Coded Prompt with "brief silence" on Shot 09 (10 credits)
  const v9Shot09Path = path.join(RUN_DIR, 'verify_v9_shot09_shayan_timeline.mp4');
  if (!fs.existsSync(v9Shot09Path)) {
    console.log('=== [4/5] Generating Shot 09 with Shayan Time-Coded Timeline + brief silence SFX (10 credits) ===');
    const prompt09 =
      'Visual Style: 3D Pixar-style family cartoon animation, warm golden-hour sunlight, dynamic physical comedy.\n' +
      'Characters (keep design identical in every shot): Ember (image 1), chubby baby Tyrannosaurus Rex on two hind legs, warm mossy-green scaly skin, bright orange-amber stripes on the back ridge only, cream belly.\n' +
      'Environment: Cracked-mud basin floor under warm golden sunlight.\n' +
      'Timeline:\n' +
      '[0–1.5s] Medium shot tracking right. Ember crouches low on two hind legs facing screen-right with fierce amber eyes, digging claws into the mud.\n' +
      '[1.5–4s] Ember rockets forward screen-right like a battering ram with his rounded head lowered, kicking up bursts of dry mud clots behind his feet. Sound: brief silence, then rapid heavy footsteps and powerful whoosh.\n' +
      'Audio: No spoken dialogue, only exaggerated physical sound effects.';
    const res: any = await callWithRetry('v9_shot09', () =>
      Flow.generate.video({
        prompt: prompt09,
        modelDisplayName: 'Veo 3.1 - Fast',
        aspectRatio: '16:9',
        durationSeconds: 4,
        resolution: '720p',
        firstFrameImageMediaId: shot09Start,
        lastFrameImageMediaId: shot09End,
      })
    );
    fs.writeFileSync(v9Shot09Path, Buffer.from(res.base64, 'base64'));
    state.media['verify_v9_shot09_shayan_timeline'] = res.mediaId;
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    console.log('Saved:', v9Shot09Path);
  }

  // 5. Test Shayan Sadiq Verbatim Time-Coded Prompt + D.Pommikox Deadpan "High five" Gag #3 on Shot 12 (10 credits)
  const v9Shot12Path = path.join(RUN_DIR, 'verify_v9_shot12_highfive_gag.mp4');
  if (!fs.existsSync(v9Shot12Path)) {
    console.log('=== [5/5] Generating Shot 12 with Shayan Time-Coded Prompt + High-Five Deadpan Gag (10 credits) ===');
    const prompt12 =
      'Visual Style: 3D Pixar-style family cartoon animation, warm golden-hour sunlight, expressive deadpan comedy.\n' +
      'Characters (keep design identical in every shot): Ember (image 1), chubby baby Tyrannosaurus Rex standing upright on two hind legs, warm mossy-green scaly skin, bright orange-amber back stripes, cream belly, tiny two-fingered stubby arms.\n' +
      'Environment: Beside the clear turquoise oasis pool at sunset.\n' +
      'Timeline:\n' +
      '[0–1.5s] Medium close-up of Ember standing still beside the turquoise pool with head held high and a warm, deadpan half-smile, giving a tiny wave with one short two-fingered arm.\n' +
      '[1.5–4s] Ember speaks clearly with natural lip-sync and gives a friendly nod toward the water. Ember (deadpan, warm young voice): "High five... oh wait. Just drink the water."\n' +
      'Audio: Clear English dialogue, gentle evening breeze, no background music.';
    const res: any = await callWithRetry('v9_shot12', () =>
      Flow.generate.video({
        prompt: prompt12,
        modelDisplayName: 'Veo 3.1 - Fast',
        aspectRatio: '16:9',
        durationSeconds: 4,
        resolution: '720p',
        firstFrameImageMediaId: shot12Start,
      })
    );
    fs.writeFileSync(v9Shot12Path, Buffer.from(res.base64, 'base64'));
    state.media['verify_v9_shot12_highfive_gag'] = res.mediaId;
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    console.log('Saved:', v9Shot12Path);
  }

  console.log('ALL 5 MEM-24.5 VERIFICATION ASSETS COMPLETED!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

