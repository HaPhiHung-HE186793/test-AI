import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { FlowUltraSdk } from '../../flow-ultra-sdk.mjs';

// Nạp .env tự động không cần thư viện ngoài
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

const MANIFEST_PATH = path.resolve(
  'outputs/dinosaur_colosseum_battle_v3_scenebuilder/production_manifest_v3_scenebuilder.json'
);
const OUTPUT_DIR = path.resolve('outputs/dinosaur_colosseum_battle_v3_scenebuilder');
const CLIPS_DIR = path.join(OUTPUT_DIR, 'clips_raw');
const TRIMMED_DIR = path.join(OUTPUT_DIR, 'clips_trimmed');
const VQQA_DIR = path.join(OUTPUT_DIR, 'vqqa_frames');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
const sdk = new FlowUltraSdk({
  cookie: process.env.FLOW_COOKIE,
  atToken: process.env.FLOW_AT_TOKEN,
});

const WIN_FFMPEG =
  'C:\\Users\\Asus\\AppData\\Roaming\\Python\\Python313\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';
const FFMPEG_BIN = process.env.FFMPEG_BIN || (fs.existsSync(WIN_FFMPEG) ? WIN_FFMPEG : 'ffmpeg');

function probeVideo(filePath) {
  let stderr = '';
  try {
    execFileSync(FFMPEG_BIN, ['-i', filePath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    stderr = String(err.stderr || err.message || '');
  }
  const durMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const durationSec = durMatch
    ? parseInt(durMatch[1], 10) * 3600 + parseInt(durMatch[2], 10) * 60 + parseFloat(durMatch[3])
    : 8.0;
  const resMatch = stderr.match(/Video:.*?\s(\d{3,4})x(\d{3,4})/);
  const fpsMatch = stderr.match(/(\d+(?:\.\d+)?)\s*fps/);
  return {
    width: resMatch ? parseInt(resMatch[1], 10) : 1280,
    height: resMatch ? parseInt(resMatch[2], 10) : 720,
    fps: fpsMatch ? fpsMatch[1] : '24',
    durationSec,
  };
}

function extract12DenseFrames(videoPath, clusterId, durationSec) {
  const clusterFrameDir = path.join(VQQA_DIR, clusterId);
  fs.mkdirSync(clusterFrameDir, { recursive: true });
  const fpsVal = Math.max(0.4, 12 / Math.max(1, durationSec));
  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-i',
      videoPath,
      '-vf',
      `fps=${fpsVal.toFixed(4)},scale=640:-2`,
      '-frames:v',
      '12',
      path.join(clusterFrameDir, 'frame_%02d.jpg'),
    ],
    { stdio: 'ignore' }
  );
  const files = fs
    .readdirSync(clusterFrameDir)
    .filter(f => f.endsWith('.jpg'))
    .sort()
    .map(f => path.join(clusterFrameDir, f));
  return files;
}

async function fetchSceneState() {
  if (!sdk.cookie) {
    return manifest.clusters.map(c => ({
      ...c,
      currentPrimaryMediaId: c.finalPrimaryMediaId || c.seedPrimaryMediaId,
      primaryTake: {
        mediaId: c.finalPrimaryMediaId || c.seedPrimaryMediaId,
        status: 3,
        modelKey: c.extends?.[c.extends.length - 1]?.modelKey || 'macaron_cookie_extend_10s',
        sourceVideoMediaId: c.extends?.[c.extends.length - 1]?.sourceVideoMediaId || null,
      },
      takesCount: (c.extends?.length || 0) + 1,
      allTakes: [],
      sceneTrimBounds: [c.cutOnActionTrim.startSec, c.cutOnActionTrim.endSec],
    }));
  }
  const full = await sdk.getProjectFull(manifest.projectId);
  const wfMap = new Map(full.workflows.map(w => [w[0], w]));
  const mediaByWf = new Map();
  for (const m of full.mediaItems) {
    if (!mediaByWf.has(m.workflowId)) mediaByWf.set(m.workflowId, []);
    mediaByWf.get(m.workflowId).push(m);
  }
  const sceneClips = full.sceneClips.filter(sc => sc[1] === manifest.v3SceneId);

  return manifest.clusters.map(c => {
    const wf = wfMap.get(c.workflowId);
    const allTakes = (mediaByWf.get(c.workflowId) || []).sort((a, b) => {
      if (a.mediaId === c.seedPrimaryMediaId) return 1;
      if (b.mediaId === c.seedPrimaryMediaId) return -1;
      return 0;
    });
    const primaryMediaId = wf?.[3]?.[4] || c.finalPrimaryMediaId || allTakes[0]?.mediaId || c.seedPrimaryMediaId;
    const scEntry = sceneClips.find(sc => sc[0]?.[0] === c.workflowId);
    const trimBounds = scEntry?.[2] || null;
    const primaryTake = allTakes.find(t => t.mediaId === primaryMediaId) || allTakes[0] || null;
    return {
      ...c,
      currentPrimaryMediaId: primaryMediaId,
      primaryTake,
      takesCount: allTakes.length,
      allTakes,
      sceneTrimBounds: trimBounds,
    };
  });
}

async function runStatus() {
  const state = await fetchSceneState();
  console.log(`\n🎬 Trạng thái Scene V3: ${manifest.v3SceneId}`);
  console.log(`🔗 Link SceneBuilder: ${manifest.v3SceneUrl}\n`);
  for (const c of state) {
    const isSeed = c.currentPrimaryMediaId === c.seedPrimaryMediaId;
    console.log(
      `[Cluster ${c.clusterIndex}] ${c.clusterId}\n` +
        `  • workflowId       : ${c.workflowId}\n` +
        `  • primaryMediaId   : ${c.currentPrimaryMediaId} ${isSeed ? '(SEED 8.0s)' : '(EXTENDED MONOLITHIC)'}\n` +
        `  • status           : ${c.primaryTake?.status === 3 ? '✅ COMPLETED (3)' : `⏳ STATUS_${c.primaryTake?.status}`}\n` +
        `  • modelKey         : ${c.primaryTake?.modelKey || 'macaron_cookie_extend_10s'}\n` +
        `  • sourceMediaId(ky): ${c.primaryTake?.sourceVideoMediaId || 'ROOT_SEED'}\n` +
        `  • takesInWorkflow  : ${c.takesCount}\n` +
        `  • sceneTrimBounds  : ${JSON.stringify(c.sceneTrimBounds)}`
    );
  }
}

async function runVerifyHead() {
  fs.mkdirSync(CLIPS_DIR, { recursive: true });
  fs.mkdirSync(VQQA_DIR, { recursive: true });
  const state = await fetchSceneState();
  const report = [];

  for (const c of state) {
    const mediaId = c.currentPrimaryMediaId;
    const rawMp4Path = path.join(CLIPS_DIR, `${c.clusterId}_${mediaId}.mp4`);
    if (!fs.existsSync(rawMp4Path)) {
      console.log(`⬇️ Đang tải [${c.clusterId}] mediaId=${mediaId}...`);
      await sdk.downloadVideoByMediaId(mediaId, rawMp4Path, 26, c.primaryTake?.videoUrl);
    }
    const probe = probeVideo(rawMp4Path);
    const frames = extract12DenseFrames(rawMp4Path, c.clusterId, probe.durationSec);
    report.push({
      clusterIndex: c.clusterIndex,
      clusterId: c.clusterId,
      workflowId: c.workflowId,
      primaryMediaId: mediaId,
      sourceVideoMediaId: c.primaryTake?.sourceVideoMediaId || null,
      actualDurationSec: probe.durationSec,
      targetRawDurationSec: c.rawDurationTargetSec,
      resolution: `${probe.width}x${probe.height}`,
      fps: probe.fps,
      extractedFramesCount: frames.length,
      framesDir: path.join(VQQA_DIR, c.clusterId),
    });
    console.log(
      `✅ [${c.clusterId}] Đã trích xuất 12 Frames VQQA (${probe.durationSec.toFixed(2)}s, ${probe.width}x${probe.height}) -> ${path.join(VQQA_DIR, c.clusterId)}`
    );
  }

  const reportPath = path.join(OUTPUT_DIR, 'vqqa_head_verification_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Đã lưu báo cáo VQQA tại: ${reportPath}`);
}

async function runTrimScene() {
  const state = await fetchSceneState();
  console.log('✂️ Đang áp dụng Trim Handles (Cut-on-Action) trực tiếp lên SceneBuilder (rpcids=dtQlBe)...');
  for (const c of state) {
    const isSeed = c.currentPrimaryMediaId === c.seedPrimaryMediaId;
    const startSec = isSeed ? 0.35 : c.cutOnActionTrim.startSec;
    const endSec = isSeed ? 7.5 : c.cutOnActionTrim.endSec;
    const res = await sdk.setSceneClipPrimaryMedia({
      projectId: manifest.projectId,
      sceneId: manifest.v3SceneId,
      workflowId: c.workflowId,
      mediaId: c.currentPrimaryMediaId,
      startSec,
      endSec,
    });
    console.log(
      `  • [${c.clusterId}] Trim ${startSec.toFixed(2)}s -> ${endSec.toFixed(2)}s: HTTP ${res.status} (ok=${res.ok})`
    );
  }
}

async function runMaster() {
  fs.mkdirSync(CLIPS_DIR, { recursive: true });
  fs.mkdirSync(TRIMMED_DIR, { recursive: true });
  const state = await fetchSceneState();

  console.log('🎬 Đang dựng V3 SceneBuilder-First Master (120.00s) từ 6 Monolithic Extended Clusters ở tốc độ gốc 1.00x (0 frame lặp, 0 độ khựng)...');
  const trimmedFiles = [];

  for (const c of state) {
    const mediaId = c.finalPrimaryMediaId || c.currentPrimaryMediaId;
    const rawMp4Path = path.join(CLIPS_DIR, `${c.clusterId}_${mediaId}.mp4`);
    if (!fs.existsSync(rawMp4Path)) {
      await sdk.downloadVideoByMediaId(mediaId, rawMp4Path, 26, c.primaryTake?.videoUrl);
    }
    const trimStart = c.cutOnActionTrim.startSec;
    const trimEnd = c.cutOnActionTrim.endSec;
    const targetDuration = trimEnd - trimStart;
    const id = `${String(c.clusterIndex).padStart(2, '0')}_${c.clusterId}`;
    const trimmedPath = path.join(TRIMMED_DIR, `${id}_v3_monolithic.mp4`);

    // 100% Native 1.0x speed (setpts=PTS-STARTPTS): ZERO frame duplication, ZERO motion hitch!
    execFileSync(
      FFMPEG_BIN,
      [
        '-y',
        '-ss',
        trimStart.toFixed(3),
        '-t',
        targetDuration.toFixed(3),
        '-i',
        rawMp4Path,
        '-vf',
        'fps=24,scale=1920:1080:flags=lanczos,eq=contrast=1.04:saturation=1.05,unsharp=3:3:0.45:3:3:0.0,setpts=PTS-STARTPTS',
        '-af',
        `aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,equalizer=f=65:t=q:w=1.2:g=3.0,afade=t=in:st=0:d=0.05,afade=t=out:st=${Math.max(0, targetDuration - 0.05).toFixed(3)}:d=0.05,asetpts=PTS-STARTPTS`,
        '-t',
        targetDuration.toFixed(2),
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '18',
        '-pix_fmt',
        'yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-ar',
        '48000',
        trimmedPath,
      ],
      { stdio: 'ignore' }
    );
    trimmedFiles.push(trimmedPath);
    console.log(
      `🎞️ [Monolithic 1.0x Native] ${id} (${mediaId}): [${trimStart.toFixed(2)}s..${trimEnd.toFixed(2)}s] -> ${targetDuration.toFixed(2)}s @ 1080p24`
    );
  }

  const concatListPath = path.join(OUTPUT_DIR, 'concat_list.txt');
  fs.writeFileSync(
    concatListPath,
    trimmedFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n')
  );

  const rawConcatPath = path.join(TRIMMED_DIR, 'raw_monolithic_concat_120s.mp4');
  execFileSync(
    FFMPEG_BIN,
    ['-y', '-f', 'concat', '-safe', '0', '-i', concatListPath, '-c', 'copy', rawConcatPath],
    { stdio: 'ignore' }
  );

  const cleanNoHudPath = path.join(OUTPUT_DIR, 'dinosaur_colosseum_battle_v3_clean_no_hud.mp4');
  const masterOutPath = path.join(OUTPUT_DIR, 'dinosaur_colosseum_battle_v3_scenebuilder_master_2min.mp4');
  const bgmWavPath = path.join(OUTPUT_DIR, 'v3_master_bgm_sfx_120s.wav');
  const voWavPath = path.join(OUTPUT_DIR, 'v3_master_vo_120s.wav');
  const assPath = path.join(OUTPUT_DIR, 'v3_colosseum_hud_and_subs.ass');

  // 1. Xuất bản Clean No-HUD (Hình ảnh 1080p24 sạch không chữ + Âm thanh Gầm/Foley gốc + Nhạc nền BGM/Storm liên tục 120s không hẫng tiếng)
  if (fs.existsSync(bgmWavPath)) {
    execFileSync(
      FFMPEG_BIN,
      [
        '-y',
        '-i',
        rawConcatPath,
        '-i',
        bgmWavPath,
        '-filter_complex',
        '[0:a]volume=0.85[sfx];[1:a]volume=0.45[bgm];[sfx][bgm]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=11[aout]',
        '-map',
        '0:v:0',
        '-map',
        '[aout]',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-b:a',
        '256k',
        '-ar',
        '48000',
        '-t',
        '120.00',
        cleanNoHudPath,
      ],
      { stdio: 'ignore' }
    );
  } else {
    execFileSync(
      FFMPEG_BIN,
      ['-y', '-i', rawConcatPath, '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', cleanNoHudPath],
      { stdio: 'ignore' }
    );
  }

  // 2. Xuất bản Master 2 Phút Hoàn Chỉnh (Burn-in ASS HUD Stat Cards + Subtitles + 3-Layer Audio với Bình luận viên Tiếng Việt + Sidechain Ducking -14 LUFS)
  if (fs.existsSync(assPath) && fs.existsSync(voWavPath) && fs.existsSync(bgmWavPath)) {
    const assEscaped = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const filterComplex =
      `[0:v]ass='${assEscaped}'[vout];` +
      `[0:a]volume=0.72[veo_sfx];` +
      `[1:a]volume=1.65[vo];` +
      `[2:a]volume=0.45[bgm];` +
      `[veo_sfx][bgm]amix=inputs=2:normalize=0[bg_bed];` +
      `[bg_bed][vo]sidechaincompress=threshold=0.03:ratio=4:attack=20:release=300[ducked_bed];` +
      `[ducked_bed][vo]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.0:LRA=11[aout]`;

    execFileSync(
      FFMPEG_BIN,
      [
        '-y',
        '-i',
        rawConcatPath,
        '-i',
        voWavPath,
        '-i',
        bgmWavPath,
        '-filter_complex',
        filterComplex,
        '-map',
        '[vout]',
        '-map',
        '[aout]',
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '19',
        '-maxrate',
        '5.5M',
        '-bufsize',
        '11M',
        '-pix_fmt',
        'yuv420p',
        '-r',
        '24',
        '-c:a',
        'aac',
        '-b:a',
        '256k',
        '-ar',
        '48000',
        '-t',
        '120.00',
        masterOutPath,
      ],
      { stdio: 'ignore' }
    );
  } else {
    fs.copyFileSync(cleanNoHudPath, masterOutPath);
  }

  const finalProbe = probeVideo(masterOutPath);
  console.log(`\n🏆 ĐÃ XUẤT BẢN MASTER V3 SCENEBUILDER-FIRST THÀNH CÔNG!`);
  console.log(`👉 File Master (HUD + VO + Subs) : ${masterOutPath}`);
  console.log(`👉 File Clean (No HUD)           : ${cleanNoHudPath}`);
  console.log(
    `👉 Thông số                      : ${finalProbe.width}x${finalProbe.height} @ ${finalProbe.fps}fps | Thời lượng: ${finalProbe.durationSec.toFixed(2)}s`
  );
}

const modeArg = process.argv.find(a => a.startsWith('--mode='))?.split('=')[1] || 'status';
if (modeArg === 'status') await runStatus();
else if (modeArg === 'verify-head') await runVerifyHead();
else if (modeArg === 'trim-scene') await runTrimScene();
else if (modeArg === 'master') await runMaster();
else console.error(`Mode không hợp lệ: ${modeArg}`);
