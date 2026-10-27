/**
 * HYPERION STUDIO OS — VS CODE <-> GOOGLE FLOW ULTRA (25,000 CREDITS) LOCAL BRIDGE SERVER
 * Chạy tại: http://localhost:4321
 * Nhiệm vụ:
 * 1. Cho phép code TypeScript trên VS Code gọi trực tiếp `Flow.generate.text`,
 *    `Flow.generate.image` (🍌 Nano Banana Pro - 0 Credit), `Flow.generate.video` (Veo 3.1 & Omni 1.1 Flash),
 *    `Flow.upload`, `Flow.save`, `Flow.media.select` thông qua Iframe Sandbox của Google Flow Ultra ở cổng 9222.
 * 2. Điều khiển trực tiếp 2 tính năng gốc (Host Native UI) ngoài trang mẹ `flow.google.com`:
 *    - `Flow.host.createCharacter(...)`: Tạo & lưu nhân vật mới vào tab "Nhân vật" (Ảnh 1)
 *    - `Flow.host.createScene(...)`: Tạo & ghép các đoạn video vào tab "Cảnh" / Scenebuilder (Ảnh 2)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BRIDGE_PORT = 4321;
const CDP_HOST = 'http://127.0.0.1:9222';
const OUTPUT_DIR = path.join(__dirname, 'output', 'vscode_runs');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Đánh giá biểu thức bất đồng bộ bên trong Target CDP qua WebSocket gốc của Node 22+
 */
function evaluateInTarget(wsUrl, expression, timeoutMs = 360000) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error(`CDP evaluation timeout after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: {
            expression,
            awaitPromise: true,
            returnByValue: true,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id === 1) {
          clearTimeout(timer);
          ws.close();
          if (msg.error) {
            return reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          }
          if (msg.result?.exceptionDetails) {
            const exText =
              msg.result.exceptionDetails.exception?.description ||
              msg.result.exceptionDetails.text ||
              'Lỗi thực thi trong Flow Target';
            return reject(new Error(exText));
          }
          resolve(msg.result?.result?.value);
        }
      } catch (err) {
        clearTimeout(timer);
        ws.close();
        reject(err);
      }
    };

    ws.onerror = (err) => {
      clearTimeout(timer);
      reject(new Error('Lỗi kết nối WebSocket tới Chrome cổng 9222: ' + (err?.message || '')));
    };
  });
}

/**
 * Lấy tab trang mẹ `flow.google.com/project/...`
 */
async function findHostFlowPage() {
  const listRes = await fetch(`${CDP_HOST}/json/list`);
  const targets = await listRes.json();
  const flowPage = targets.find((t) => t.type === 'page' && t.url && t.url.includes('flow.google.com/project'));
  if (!flowPage) {
    throw new Error(
      'Không tìm thấy tab Google Flow trên Chrome cổng 9222. Hãy đảm bảo Chrome đang mở trang dự án Google Flow.'
    );
  }
  return flowPage;
}

/**
 * Tìm Iframe `.scf.usercontent.goog` đang nạp sẵn `flow-sdk` trên Google Flow.
 */
async function findActiveFlowSdkIframe() {
  const flowPage = await findHostFlowPage();

  const checkFrames = async () => {
    const res = await fetch(`${CDP_HOST}/json/list`);
    const allTargets = await res.json();
    const scfFrames = allTargets.filter(
      (t) => t.type === 'iframe' && t.url && t.url.includes('scf.usercontent.goog')
    );

    for (const frame of scfFrames) {
      try {
        const hasSdk = await evaluateInTarget(
          frame.webSocketDebuggerUrl,
          `(async () => {
            try {
              const mod = await import('flow-sdk');
              return Boolean(mod && mod.Flow);
            } catch {
              return false;
            }
          })()`,
          8000
        );
        if (hasSdk) return frame;
      } catch {
        // Thử frame tiếp theo
      }
    }
    return null;
  };

  let activeFrame = await checkFrames();
  if (activeFrame) return activeFrame;

  // Nếu chưa thấy Iframe có flow-sdk (do đang ở màn hình chi tiết Nhân vật / Cảnh hoặc tab khác), tự động thoát về trang dự án và mở lại công cụ Hyperion Studio
  await evaluateInTarget(
    flowPage.webSocketDebuggerUrl,
    `(async () => {
      if (location.href.includes('/character/') || location.href.includes('/scene/')) {
        const doneBtn = Array.from(document.querySelectorAll('button')).find(
          b => b.offsetParent !== null && (b.innerText || '').trim() === 'Xong'
        );
        if (doneBtn) {
          doneBtn.click();
          await new Promise(r => setTimeout(r, 1500));
        } else {
          const m = location.href.match(/https:\\/\\/flow\\.google\\.com\\/project\\/[a-f0-9-]+/);
          if (m) {
            location.href = m[0];
            await new Promise(r => setTimeout(r, 2500));
          }
        }
      }
      if (!location.href.includes('/tool/')) {
        const findToolLeaf = () =>
          Array.from(document.querySelectorAll('a, button, [role="menuitem"], [role="treeitem"], span, div'))
            .filter(el => el.offsetParent !== null && el.children.length === 0)
            .find(el => (el.textContent || '').includes('Hyperion Studio') || (el.textContent || '').includes('CineFlow Studio'));

        let toolItem = findToolLeaf();
        if (!toolItem) {
          const congCuBtn = Array.from(document.querySelectorAll('button, a, [role="menuitem"], [role="treeitem"]'))
            .find(el => el.offsetParent !== null && (el.innerText || '').trim().includes('Công cụ'));
          if (congCuBtn) {
            congCuBtn.click();
            await new Promise(r => setTimeout(r, 1200));
            toolItem = findToolLeaf();
          }
        }
        if (toolItem) {
          const clickable = toolItem.closest('a, button, [role="button"], [tabindex]') || toolItem.parentElement || toolItem;
          clickable.click();
          await new Promise(r => setTimeout(r, 1800));
        }
      }
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const previewTab = tabs.find(el => {
        const txt = (el.textContent || '').trim();
        return txt === 'Xem trước' || txt === 'Preview';
      });
      if (previewTab) previewTab.click();
      return true;
    })()`,
    12000
  );

  for (let retry = 0; retry < 6; retry++) {
    await new Promise((r) => setTimeout(r, 1500));
    activeFrame = await checkFrames();
    if (activeFrame) return activeFrame;
  }
  throw new Error('Không thể khởi tạo Iframe chứa flow-sdk trên Google Flow.');
}

/**
 * Điều khiển tính năng gốc "Tạo nhân vật" (Tab Nhân vật - Ảnh 1) trên trang mẹ flow.google.com
 */
async function executeHostCreateCharacter(options = {}) {
  const {
    name = 'THIEN VUONG 09',
    personality = 'Nhân vật điện ảnh AI chuẩn 3-Panel Reference Sheet.',
    assetQuery = '',
    assetIndex = 1,
  } = options;

  const flowPage = await findHostFlowPage();
  const wsUrl = flowPage.webSocketDebuggerUrl;

  // Bước 1: Nếu đang ở trong màn hình /tool/, chuyển sang tab "Nhân vật" để hiện nút (+) "Trình đơn thêm nội dung nghe nhìn" -> Click "Tạo nhân vật"
  await evaluateInTarget(
    wsUrl,
    `(async () => {
      if (!document.querySelector('button[aria-label="Trình đơn thêm nội dung nghe nhìn"]')) {
        const navCharBtn = Array.from(document.querySelectorAll('button, a, [role="menuitem"], [role="treeitem"]'))
          .find(el => el.offsetParent !== null && (el.innerText || '').includes('Nhân vật'));
        if (navCharBtn) {
          navCharBtn.click();
          await new Promise(r => setTimeout(r, 1200));
        }
      }
      const plusBtn = document.querySelector('button[aria-label="Trình đơn thêm nội dung nghe nhìn"]');
      if (plusBtn) {
        plusBtn.click();
        await new Promise(r => setTimeout(r, 600));
      }
      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"], button, a'));
      const charItem = menuItems.find(el => (el.textContent || '').includes('Tạo nhân vật'));
      if (charItem) charItem.click();
      return true;
    })()`,
    15000
  );

  await new Promise((r) => setTimeout(r, 2000));

  // Bước 2: Chọn "Thêm từ dự án" để gán tấm ảnh 3-Panel Reference Sheet vừa tạo vào Nhân vật
  await evaluateInTarget(
    wsUrl,
    `(async () => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Thêm từ dự án'));
      if (addBtn) addBtn.click();
      await new Promise(r => setTimeout(r, 1200));
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { ok: false, reason: 'Không tìm thấy hộp thoại chọn ảnh dự án' };
      const btns = Array.from(dialog.querySelectorAll('button'));
      const q = ${JSON.stringify(assetQuery)}.toLowerCase().trim();
      let targetAsset = null;
      if (q) {
        targetAsset = btns.find(b => (b.innerText || '').toLowerCase().includes(q));
      }
      if (!targetAsset) {
        targetAsset = btns[${Number(assetIndex) || 1}] || btns[1];
      }
      if (targetAsset) targetAsset.click();
      await new Promise(r => setTimeout(r, 500));
      const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(b => (b.innerText || '').includes('Thêm nội dung nghe nhìn'));
      if (confirmBtn) confirmBtn.click();
      return { ok: true };
    })()`,
    20000
  );

  // Bước 3: Chờ trang thực thể /character/<uuid> khởi tạo xong rồi điền Tên + Tính cách và bấm "Xong"
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const url = await evaluateInTarget(wsUrl, `location.href`, 5000);
    if (/\/character\/[a-f0-9-]+/.test(url)) break;
  }
  await new Promise((r) => setTimeout(r, 1000));

  const charResult = await evaluateInTarget(
    wsUrl,
    `(async () => {
      const setReactInputValue = (el, value) => {
        const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) nativeSetter.call(el, value);
        else el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      };

      const editBtn = document.querySelector('button[aria-label="Chỉnh sửa tên"]');
      if (editBtn) {
        editBtn.click();
        await new Promise(r => setTimeout(r, 300));
      }

      const nameInputs = Array.from(document.querySelectorAll('input[aria-label="Tên nhân vật"], input[placeholder="Nhân vật chưa có tên"]')).filter(el => el.offsetParent !== null);
      nameInputs.forEach(inp => setReactInputValue(inp, ${JSON.stringify(name)}));

      const bioInput = document.querySelector('textarea[aria-label="Tính cách của nhân vật"]');
      if (bioInput) {
        setReactInputValue(bioInput, ${JSON.stringify(personality)});
      }

      // Bước 3B: Tự động mở tab "Tạo cơ thể" (Ảnh 2) và gắn luôn mô hình Full-Body 3 góc độ + Tư thế hành động/chiêu thức vào tab "Cơ thể"
      const bodyBtn = Array.from(document.querySelectorAll('button'))
        .filter(b => b.offsetParent !== null)
        .find(b => (b.innerText || '').includes('Tạo cơ thể'));
      if (bodyBtn) {
        bodyBtn.click();
        await new Promise(r => setTimeout(r, 800));
        const addBodyProjBtn = Array.from(document.querySelectorAll('button'))
          .filter(b => b.offsetParent !== null)
          .find(b => (b.innerText || '').includes('Thêm từ dự án'));
        if (addBodyProjBtn) {
          addBodyProjBtn.click();
          await new Promise(r => setTimeout(r, 1200));
          const dialog = document.querySelector('[role="dialog"]');
          if (dialog) {
            const dBtns = Array.from(dialog.querySelectorAll('button'));
            const q = ${JSON.stringify(assetQuery)}.toLowerCase().trim();
            let target = q ? dBtns.find(b => (b.innerText || '').toLowerCase().includes(q)) : null;
            if (!target) target = dBtns[${Number(assetIndex) || 1}] || dBtns[1];
            if (target) target.click();
            await new Promise(r => setTimeout(r, 500));
            const confirmBtn = dBtns.find(b => (b.innerText || '').includes('Thêm nội dung nghe nhìn'));
            if (confirmBtn) confirmBtn.click();
            await new Promise(r => setTimeout(r, 3000));
          }
        }
      }

      const characterUrl = location.href;
      await new Promise(r => setTimeout(r, 800));

      const doneBtns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetParent !== null && (b.innerText || '').trim() === 'Xong');
      if (doneBtns.length > 0) doneBtns[0].click();

      return { ok: true, name: ${JSON.stringify(name)}, personality: ${JSON.stringify(personality)}, characterUrl };
    })()`,
    20000
  );

  return charResult;
}

/**
 * Điều khiển tính năng gốc "Cảnh mới" (Tab Cảnh / Scenebuilder - Ảnh 2) trên trang mẹ flow.google.com
 */
async function executeHostCreateScene(options = {}) {
  const { clipCount = 6, keyword = '' } = options;

  const flowPage = await findHostFlowPage();
  const wsUrl = flowPage.webSocketDebuggerUrl;

  // Bước 1: Nếu đang ở trong màn hình /tool/, chuyển sang tab "Cảnh" để hiện nút (+) "Trình đơn thêm nội dung nghe nhìn" -> Click "Cảnh mới"
  await evaluateInTarget(
    wsUrl,
    `(async () => {
      if (!document.querySelector('button[aria-label="Trình đơn thêm nội dung nghe nhìn"]')) {
        const navSceneBtn = Array.from(document.querySelectorAll('button, a, [role="menuitem"], [role="treeitem"]'))
          .find(el => el.offsetParent !== null && (el.innerText || '').includes('Cảnh'));
        if (navSceneBtn) {
          navSceneBtn.click();
          await new Promise(r => setTimeout(r, 1200));
        }
      }
      const plusBtn = document.querySelector('button[aria-label="Trình đơn thêm nội dung nghe nhìn"]');
      if (plusBtn) {
        plusBtn.click();
        await new Promise(r => setTimeout(r, 600));
      }
      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"], button, a'));
      const sceneItem = menuItems.find(el => (el.textContent || '').includes('Cảnh mới'));
      if (sceneItem) sceneItem.click();
      return true;
    })()`,
    15000
  );

  await new Promise((r) => setTimeout(r, 2200));

  // Bước 2: Bấm "Thêm đoạn video", chọn các clip video trong dự án và bấm "Thêm nội dung nghe nhìn" + "Xong"
  const sceneResult = await evaluateInTarget(
    wsUrl,
    `(async () => {
      const sceneUrl = location.href;
      const addClipBtn = document.querySelector('button[aria-label="Thêm đoạn video"]');
      if (addClipBtn) addClipBtn.click();
      await new Promise(r => setTimeout(r, 1000));

      const dialog = document.querySelector('[role="dialog"]');
      const selectedClips = [];
      if (dialog) {
        const clipBtns = Array.from(dialog.querySelectorAll('button')).filter(b => {
          const t = (b.innerText || '').trim();
          if (!t || t === 'Thêm nội dung nghe nhìn') return false;
          if (${JSON.stringify(keyword)}) {
            return t.toLowerCase().includes(${JSON.stringify(keyword)}.toLowerCase());
          }
          return true;
        });

        const toSelect = clipBtns.slice(0, ${Number(clipCount) || 6});
        for (const btn of toSelect) {
          btn.click();
          selectedClips.push((btn.innerText || '').trim());
          await new Promise(r => setTimeout(r, 200));
        }

        const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(b => (b.innerText || '').includes('Thêm nội dung nghe nhìn'));
        if (confirmBtn) confirmBtn.click();
      }

      await new Promise(r => setTimeout(r, 1500));
      const doneBtn = document.querySelector('button[aria-label="Đã chỉnh sửa xong cảnh"]');
      if (doneBtn) doneBtn.click();

      return { ok: true, sceneUrl, clipsAdded: selectedClips.length, selectedClips };
    })()`,
    25000
  );

  return sceneResult;
}

/**
 * Thực thi bất kỳ lệnh `Flow.*` nào từ VS Code thông qua Iframe hoặc Host của Google Flow Ultra
 */
async function executeFlowSdkCall(methodPath, args = []) {
  // Hỗ trợ 2 tính năng Native trên trang mẹ (Host UI): Tạo nhân vật (Ảnh 1) & Cảnh mới (Ảnh 2)
  if (methodPath === 'host.createCharacter') {
    return await executeHostCreateCharacter(args[0] || {});
  }
  if (methodPath === 'host.createScene') {
    return await executeHostCreateScene(args[0] || {});
  }

  const frame = await findActiveFlowSdkIframe();
  const serializedArgs = JSON.stringify(args);

  const expression = `(async () => {
    const { Flow } = await import('flow-sdk');
    const args = ${serializedArgs};
    switch (${JSON.stringify(methodPath)}) {
      case 'generate.text':
        if (typeof args[0] === 'string') {
          return await Flow.generate.text(args[0], args[1] || {});
        }
        return await Flow.generate.text(args[0]?.prompt || '', args[0] || {});
      case 'generate.image':
        return await Flow.generate.image(args[0]);
      case 'generate.video':
        return await Flow.generate.video(args[0]);
      case 'upload':
        return await Flow.upload(args[0]);
      case 'save':
        return await Flow.save(args[0]);
      case 'media.select':
        return await Flow.media.select(args[0] || {});
      case 'storage.getItem':
        return await Flow.storage.getItem(args[0]);
      case 'storage.setItem':
        return await Flow.storage.setItem(args[0], args[1]);
      default:
        throw new Error('Phương thức Flow SDK không hỗ trợ: ' + ${JSON.stringify(methodPath)});
    }
  })()`;

  const result = await evaluateInTarget(frame.webSocketDebuggerUrl, expression, 360000);

  // Tự động lưu bản sao file ảnh/video ra ổ cứng VS Code (`d:\myProject\test-AI\output\vscode_runs`)
  if (result && result.base64) {
    try {
      const ext =
        methodPath === 'generate.video' || (result.mimeType && result.mimeType.includes('video'))
          ? 'mp4'
          : 'png';
      const prefix = methodPath.replace('.', '_');
      const fileName = `${prefix}_${Date.now()}_${(result.mediaId || 'asset').slice(0, 8)}.${ext}`;
      const filePath = path.join(OUTPUT_DIR, fileName);
      fs.writeFileSync(filePath, Buffer.from(result.base64, 'base64'));
      result.savedLocalPath = filePath;
      console.log(`[💾 Đã lưu tự động về VS Code]: ${filePath}`);
    } catch (saveErr) {
      console.warn('Không thể lưu bản sao cục bộ:', saveErr);
    }
  }

  return result;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/status') {
    try {
      const frame = await findActiveFlowSdkIframe();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          bridge: 'VS Code <-> Google Flow Ultra (25,000 Credits)',
          sandboxFrameId: frame.id,
          capabilities: [
            'Flow.generate.text',
            'Flow.generate.image',
            'Flow.generate.video',
            'Flow.upload',
            'Flow.save',
            'Flow.host.createCharacter (Tab Nhân vật - Ảnh 1)',
            'Flow.host.createScene (Tab Cảnh - Ảnh 2)',
          ],
          outputDir: OUTPUT_DIR,
        })
      );
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/flow') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { method, args } = payload;
        console.log(`⚡ [VS Code -> Google Flow Ultra] Gọi Flow.${method}...`);
        const startTime = Date.now();
        const data = await executeFlowSdkCall(method, args || []);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ [Hoàn tất Flow.${method} trong ${elapsed}s]`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, data }));
      } catch (err) {
        console.error(`❌ [Lỗi Flow Bridge]:`, err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Endpoint not found' }));
});

server.listen(BRIDGE_PORT, '127.0.0.1', () => {
  console.log('==================================================================');
  console.log(`🚀 CẦU NỐI VS CODE <-> GOOGLE FLOW ULTRA (25.000 CREDITS) ĐÃ BẬT!`);
  console.log(`🔗 Địa chỉ RPC Bridge : http://localhost:${BRIDGE_PORT}/api/flow`);
  console.log(`📂 Thư mục lưu tự động: ${OUTPUT_DIR}`);
  console.log('==================================================================');
});
