/**
 * 🌐 CROSS-PLATFORM CHROME REMOTE DEBUGGING LAUNCHER (UBUNTU LINUX / WINDOWS / MACOS)
 * Mở trình duyệt Google Chrome ở cổng 9222 (`--remote-debugging-port=9222`) trỏ thẳng vào https://flow.google.com
 * Cách chạy: `npm run chrome`
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function findChromeBinary() {
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return 'chrome.exe';
  }

  if (process.platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }

  // Ubuntu / Debian / Linux
  const linuxCandidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ];
  for (const c of linuxCandidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'google-chrome';
}

const chromeBin = findChromeBinary();
const userDataDir = path.join(os.homedir(), '.chrome-flow-ultra-profile');
fs.mkdirSync(userDataDir, { recursive: true });

const args = [
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  'https://flow.google.com',
];

console.log(`🚀 Đang mở Google Chrome (${chromeBin}) ở cổng Debug 9222...`);
console.log(`📂 Thư mục lưu phiên đăng nhập Google AI Ultra: ${userDataDir}`);

const child = spawn(chromeBin, args, {
  detached: true,
  stdio: 'ignore',
});
child.unref();

console.log('✅ Đã mở Chrome! Hãy đăng nhập tài khoản Google AI Ultra (25.000 Credits) và mở dự án chứa công cụ Hyperion Studio.');
