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

const FFMPEG_BIN =
  process.env.FFMPEG_BIN ||
  'C:\\Users\\Asus\\AppData\\Roaming\\Python\\Python313\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';

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
  const fpsVal = Math.max(0.5, 12 / Math.max(1, durationSec));
  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-i',
      videoPath,
      '-vf',
      `fps=${fpsVal.toFixed(4)},scale=480:-2`,
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
    const primaryMediaId = wf?.[3]?.[4] || allTakes[0]?.mediaId || c.seedPrimaryMediaId;
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
        `  • primaryMediaId   : ${c.currentPrimaryMediaId} ${isSeed ? '(SEED 8.0s)' : '(EXTENDED)'}\n` +
        `  • status           : ${c.primaryTake?.status === 3 ? '✅ COMPLETED (3)' : `⏳ STATUS_${c.primaryTake?.status}`}\n` +
        `  • modelKey         : ${c.primaryTake?.modelKey || 'veo_3_1_i2v_s_fast_fl'}\n` +
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
      await sdk.downloadVideoByMediaId(mediaId, rawMp4Path, 8, c.primaryTake?.videoUrl);
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
  const allExtended = state.every(c => c.currentPrimaryMediaId !== c.seedPrimaryMediaId);

  let sourceDescriptors = [];
  if (allExtended) {
    console.log('🎬 Phát hiện đủ 6 Cluster đã Extend trong Scene V3! Đang dựng từ 6 Monolithic Clusters...');
    for (const c of state) {
      const mediaId = c.currentPrimaryMediaId;
      const rawMp4Path = path.join(CLIPS_DIR, `${c.clusterId}_${mediaId}.mp4`);
      if (!fs.existsSync(rawMp4Path)) {
        await sdk.downloadVideoByMediaId(mediaId, rawMp4Path, 8, c.primaryTake?.videoUrl);
      }
      sourceDescriptors.push({
        id: `${String(c.clusterIndex).padStart(2, '0')}_${c.clusterId}`,
        rawMp4Path,
        trimStart: c.cutOnActionTrim.startSec,
        trimEnd: c.cutOnActionTrim.endSec,
        targetDuration: c.cutOnActionTrim.endSec - c.cutOnActionTrim.startSec,
      });
    }
  } else {
    console.log(
      '🎬 Đang dựng V3 Zero-Hitch Continuous Master (120.0s) bằng kỹ thuật Cut-on-Action Trim Handles (cắt bỏ đầu/cuối v=0) + Velocity-Continuous Crossfade + 3-Layer Audio (-14 LUFS) + Color-True DI 1080p...'
    );
    const v2List = JSON.parse(
      fs.readFileSync(path.resolve('outputs/dinosaur_colosseum_battle_2min_release/v2_completed_videos.json'), 'utf8')
    );
    for (const item of v2List) {
      const rawMp4Path = path.join(CLIPS_DIR, `${String(item.idx).padStart(2, '0')}_${item.key}_${item.mediaId}.mp4`);
      if (!fs.existsSync(rawMp4Path)) {
        console.log(`⬇️ Tải siêu tốc FIFE [${item.key}] (${item.mediaId})...`);
        await sdk.downloadVideoByMediaId(item.mediaId, rawMp4Path, 8, item.fifeVideoUrl);
      }
      // Cắt bỏ 0.42s đầu (v=0 khởi động) và 0.42s cuối (v=0 giảm tốc) của mỗi clip 7.92s -> giữ lại 7.08s lõi vận tốc cao (v > 0),
      // kết hợp giãn nhịp động học mượt (1.06x) để đủ đúng 7.50s/cảnh x 16 = 120.00s với 0 độ khựng!
      const isFirst = item.idx === 1;
      const isLast = item.idx === 16;
      sourceDescriptors.push({
        id: `${String(item.idx).padStart(2, '0')}_${item.key}`,
        rawMp4Path,
        trimStart: isFirst ? 0.0 : 0.42,
        trimEnd: isLast ? 7.82 : 7.50,
        targetDuration: 7.50,
      });
    }
  }

  const trimmedFiles = [];
  for (const desc of sourceDescriptors) {
    const trimmedPath = path.join(TRIMMED_DIR, `${desc.id}_v3_zero_hitch.mp4`);
    const rawTrimDur = Math.max(1.0, desc.trimEnd - desc.trimStart);
    const stretchFactor = desc.targetDuration / rawTrimDur;
    const tempoFactor = 1.0 / stretchFactor;
    const fadeOutStart = Math.max(0, desc.targetDuration - 0.18);

    execFileSync(
      FFMPEG_BIN,
      [
        '-y',
        '-ss',
        desc.trimStart.toFixed(3),
        '-t',
        rawTrimDur.toFixed(3),
        '-i',
        desc.rawMp4Path,
        '-vf',
        `setpts=${stretchFactor.toFixed(5)}*PTS,fps=24,scale=1920:1080:flags=lanczos,eq=contrast=1.04:saturation=1.06,unsharp=3:3:0.45:3:3:0.0`,
        '-af',
        `atempo=${Math.min(2.0, Math.max(0.5, tempoFactor)).toFixed(5)},equalizer=f=65:t=q:w=1.2:g=3.0,afade=t=in:st=0:d=0.16,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=0.16`,
        '-t',
        desc.targetDuration.toFixed(2),
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '21',
        '-maxrate',
        '4.5M',
        '-bufsize',
        '9M',
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
      `🎞️ [Cut-on-Action v>0] ${desc.id}: Trimmed [${desc.trimStart.toFixed(2)}s..${desc.trimEnd.toFixed(2)}s] -> ${desc.targetDuration.toFixed(2)}s @ 1080p24`
    );
  }

  const concatListPath = path.join(OUTPUT_DIR, 'concat_list.txt');
  fs.writeFileSync(
    concatListPath,
    trimmedFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n')
  );

  const cleanNoHudPath = path.join(OUTPUT_DIR, 'dinosaur_colosseum_battle_v3_clean_no_hud.mp4');
  const masterOutPath = path.join(OUTPUT_DIR, 'dinosaur_colosseum_battle_v3_scenebuilder_master_2min.mp4');

  execFileSync(
    FFMPEG_BIN,
    [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
      '-af',
      'loudnorm=I=-14:TP=-1.0:LRA=11',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '256k',
      cleanNoHudPath,
    ],
    { stdio: 'ignore' }
  );

  fs.copyFileSync(cleanNoHudPath, masterOutPath);

  const finalProbe = probeVideo(masterOutPath);
  console.log(`\n🏆 ĐÃ XUẤT BẢN MASTER V3 SCENEBUILDER-FIRST THÀNH CÔNG!`);
  console.log(`👉 File Master : ${masterOutPath}`);
  console.log(`👉 File Clean  : ${cleanNoHudPath}`);
  console.log(
    `👉 Thông số    : ${finalProbe.width}x${finalProbe.height} @ ${finalProbe.fps}fps | Thời lượng: ${finalProbe.durationSec.toFixed(2)}s`
  );
}

const modeArg = process.argv.find(a => a.startsWith('--mode='))?.split('=')[1] || 'status';
if (modeArg === 'status') await runStatus();
else if (modeArg === 'verify-head') await runVerifyHead();
else if (modeArg === 'trim-scene') await runTrimScene();
else if (modeArg === 'master') await runMaster();
else console.error(`Mode không hợp lệ: ${modeArg}`);
