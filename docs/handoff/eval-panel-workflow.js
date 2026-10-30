export const meta = {
  name: 'premium-film-evaluation-panel',
  description: 'Independent 4-lens panel judges the new dino master against the reference reels; consolidated prioritized fix list',
  phases: [
    { title: 'Evaluate', detail: '4 independent lenses: audience/AI-tells, story+edit, sound, image finishing' },
    { title: 'Synthesize', detail: 'dedupe, rank, verify claims, concrete fix plan' },
  ],
}

const A = args
const CTX = `
You are evaluating an AI-made animated short to decide whether it now reaches the quality of the reference reels the user admires. Today: ${A.today}. Work read-only on the project; put scratch files in ${A.S}/${A.evalTag || 'eval_r2'}/<your-lens>/.
FILM UNDER TEST: ${A.master}. ${A.filmNote || ''}
Story bible (shots, beats, intended acting; film order is the array order): ${A.run}/bible.json. Mastering report with chosen windows: ${A.report || `${A.run}/master_final/MASTER_FINAL_MOVIE_report.json`}. Per-take judge verdicts: ${A.run}/state.json (field video). Character sheets: ${A.run}/02_char*_*.png. Keyframes: ${A.run}/shot_XX_start_frame.png / shot_XX_end_frame.png.
${A.previous ? `PREVIOUS ROUND (for comparison, do not just repeat it — check what is fixed and what is still wrong): ${A.previous}` : ''}
REFERENCE REELS (local): POMMI ${A.S}/reels/video/1481938247140087.mp4 (12.5 min, Zootopia-grade, ASL 2.33s, music bed + short dialogue, -14.7 LUFS LRA 9.6); otter ${A.S}/reels/video/923875293990577.mp4 and orangutan-vs-alligator fight ${A.S}/reels/video/2163192597600790.mp4 (9:16 split screen: top = finished 3D animation, bottom = character sheet); horror ${A.S}/reels/video/1553224452628037.mp4 (2D). Pre-extracted keyframes: ${A.S}/frames/R5_pommi/*.jpg, ${A.S}/frames/R2_otter/dense/*.jpg, ${A.S}/frames/R3_fight/dense/*.jpg.
OLD FILM for contrast: ${A.repo}/output/vscode_runs/dino_clash_closed_loop_v1/MASTER_FINAL_MOVIE.mp4.
Tools: ffmpeg at ${A.FF} (no ffprobe). Extract frames/crops/spectrograms as needed and LOOK at them with Read. Be concrete: every issue needs a timestamp (s) or shot number plus visual/measured evidence. Be honest and strict — the user wants to stop only when it truly matches the reels; do not flatter. Also state what is already at reel level.`

const ISSUE_SCHEMA = {
  type: 'object',
  properties: {
    verdict_vs_reels: { type: 'string', description: 'one paragraph: how close to the reference reels on your lens' },
    score_0_10: { type: 'number', description: 'your lens score; 10 = indistinguishable from the reference reels' },
    already_at_reel_level: { type: 'array', items: { type: 'string' } },
    issues: { type: 'array', items: { type: 'object', properties: {
      title: { type: 'string' }, where: { type: 'string', description: 'timestamp(s) or shot numbers' },
      evidence: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
      fix: { type: 'string', description: 'concrete action: re-render shot N with change X / edit change / audio change / prompt-engine rule' },
      fix_type: { type: 'string', enum: ['rerender', 'keyframe', 'edit', 'audio', 'finishing', 'story', 'engine-rule', 'needs-user'] } },
      required: ['title', 'where', 'evidence', 'severity', 'fix', 'fix_type'] } },
  },
  required: ['verdict_vs_reels', 'score_0_10', 'already_at_reel_level', 'issues'],
}

const LENSES = [
  { key: 'audience', prompt: 'LENS: AUDIENCE / "DOES IT LOOK AI?". Watch it like a Facebook viewer and like a Pixar animation supervisor. Extract frames every 0.25s around each cut and every 0.5s elsewhere. List every AI tell (morphing, identity/scale drift, extra limbs or characters, melting, floaty physics, plastic look, unnatural mouth, flicker, texture swimming), every moment that reads as genuinely premium, and whether a casual viewer would ask "movie name?" like POMMI viewers did. Compare side by side with POMMI and otter frames.' },
  { key: 'story_edit', prompt: 'LENS: STORY + EDITING. Without reading the bible first, describe what story you understand from the film alone; then read the bible and list every beat that does not read on screen. Judge cut points (cut on action, eyelines, screen direction / 180-degree rule continuity, matching), shot order, shot length rhythm vs POMMI, whether action beats (snap, tail sweep, headbutt) are readable, whether reactions land, whether the ending pays off. Check the mastering windows chosen (report json) — would different in/out points in the same takes read better? Give exact in/out suggestions.' },
  { key: 'sound', prompt: 'LENS: SOUND. Measure loudness/LRA/true peak, spectrograms, energy at each cut (dips/clicks), and listen-by-analysis (astats per 0.1s) for abrupt cuts. Compare against POMMI/otter/fight audio (music bed presence, vocal reactions, foley density, ambience continuity across cuts, silence-before-impact dynamics). Identify what Veo native audio gives per shot (any garbled speech? any music? any artifacts?). Propose a concrete sound design plan doable with local ffmpeg plus what needs the user (e.g., a licensed music track) — note: no paid external APIs allowed; Google Flow only.' },
  { key: 'image', prompt: 'LENS: IMAGE FINISHING. Check sharpness vs reels (Veo 720p upscaled to 1080p), grain, compression/blocking, colour and exposure consistency between consecutive shots (measure signalstats YAVG/SATAVG/HUE per shot), white clipping, flicker, letterbox/aspect, frame-rate cadence (duplicate frames, judder) at each cut. Compare crops of characters at 100% with POMMI at 100%. Propose finishing fixes (Flow 1080p/4K upscale availability, sharpening, grade matching, grain amount) with exact ffmpeg filters.' },
]

phase('Evaluate')
const results = await parallel(LENSES.map((l) => () =>
  agent(`${CTX}\n\n${l.prompt}`, { label: `eval:${l.key}`, phase: 'Evaluate', schema: ISSUE_SCHEMA }).then((r) => r ? { lens: l.key, ...r } : null)))
const ok = results.filter(Boolean)
log(`Lens scores: ${ok.map((r) => `${r.lens}=${r.score_0_10}`).join(', ')}`)

phase('Synthesize')
const synthesis = await agent(`${CTX}\n\nYou are the panel chair. Below are 4 independent lens reports. 1) Spot-check the 6 most severe claims yourself (open the frames / re-measure) and drop any that do not hold. 2) Deduplicate and rank all remaining issues into ONE prioritized action plan grouped by: (a) re-render or keyframe fixes per shot (be specific about the change), (b) edit fixes (exact in/out), (c) audio plan, (d) finishing, (e) engine/pipeline rules to adopt permanently, (f) items needing the user. 3) Give an overall honest score 0-10 vs the reference reels and say precisely what remains between this film and "reel level". Reports:\n${JSON.stringify(ok).slice(0, 60000)}`, {
  label: 'eval:chair', phase: 'Synthesize',
  schema: {
    type: 'object',
    properties: {
      overall_score_0_10: { type: 'number' },
      gap_summary: { type: 'string' },
      dropped_claims: { type: 'array', items: { type: 'string' } },
      plan: { type: 'array', items: { type: 'object', properties: {
        group: { type: 'string', enum: ['rerender', 'edit', 'audio', 'finishing', 'engine-rule', 'needs-user'] },
        priority: { type: 'number' }, action: { type: 'string' }, why: { type: 'string' }, where: { type: 'string' } },
        required: ['group', 'priority', 'action', 'why', 'where'] } },
    },
    required: ['overall_score_0_10', 'gap_summary', 'dropped_claims', 'plan'],
  },
})
return { lenses: ok, synthesis }
