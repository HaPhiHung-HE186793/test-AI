/**
 * 🛠️ CROSS-PLATFORM SKILL & ENVIRONMENT INSTALLER (UBUNTU LINUX / WINDOWS / MACOS)
 * Tự động chạy sau `npm install` hoặc `npm run setup` để:
 * 1. Đồng bộ bộ Skill `ai-film-studio` từ `.agents/skills/ai-film-studio` vào thư mục Global (`~/.gemini/config/skills/ai-film-studio` và `~/.gemini/antigravity/skills/ai-film-studio`)
 * 2. Cấp quyền thực thi (`chmod +x`) cho `ffmpeg-static` trên Ubuntu Linux / macOS
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '..');

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const homeDir = os.homedir();
  const srcSkillDir = path.join(WORKSPACE_ROOT, '.agents', 'skills', 'ai-film-studio');

  const globalSkillTargets = [
    path.join(homeDir, '.gemini', 'config', 'skills', 'ai-film-studio'),
    path.join(homeDir, '.gemini', 'antigravity', 'skills', 'ai-film-studio'),
  ];

  for (const targetDir of globalSkillTargets) {
    try {
      copyDirRecursive(srcSkillDir, targetDir);
      console.log(`✅ [Setup] Đã đồng bộ Global Skill [ai-film-studio] -> ${targetDir}`);
    } catch (err) {
      console.warn(`⚠️ Không thể ghi vào ${targetDir}: ${err.message}`);
    }
  }

  // Đảm bảo thư mục output/vscode_runs tồn tại
  const outDir = path.join(WORKSPACE_ROOT, 'output', 'vscode_runs');
  fs.mkdirSync(outDir, { recursive: true });

  // Cấp quyền +x cho ffmpeg trên Ubuntu Linux / macOS
  if (process.platform !== 'win32') {
    const linuxFfmpeg = path.join(WORKSPACE_ROOT, 'node_modules', 'ffmpeg-static', 'ffmpeg');
    if (fs.existsSync(linuxFfmpeg)) {
      try {
        fs.chmodSync(linuxFfmpeg, 0o755);
        console.log(`✅ [Setup] Đã cấp quyền thực thi (chmod +x) cho ffmpeg trên ${process.platform}`);
      } catch {}
    }
  }

  console.log('🎬 [Hyperion Studio OS] Hoàn tất thiết lập môi trường đa nền tảng (Ubuntu Linux & Windows)!');
}

main();
