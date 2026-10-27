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
import crypto from 'node:crypto';
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
 * Gửi 1 khung văn bản WebSocket (RFC 6455 Masked Client Frame) qua raw socket (Hỗ trợ Node 18/20/22+ không cần thư viện ngoài)
 */
function sendWsTextFrame(socket, text) {
  const payload = Buffer.from(text, 'utf8');
  const len = payload.length;
  let headerLen = 2;
  if (len >= 126 && len <= 65535) headerLen = 4;
  else if (len > 65535) headerLen = 10;

  const frame = Buffer.alloc(headerLen + 4 + len);
  frame[0] = 0x81; // FIN + Text frame
  if (len < 126) {
    frame[1] = 0x80 | len;
  } else if (len <= 65535) {
    frame[1] = 0x80 | 126;
    frame.writeUInt16BE(len, 2);
  } else {
    frame[1] = 0x80 | 127;
    frame.writeBigUInt64BE(BigInt(len), 2);
  }

  const mask = crypto.randomBytes(4);
  mask.copy(frame, headerLen);
  for (let i = 0; i < len; i++) {
    frame[headerLen + 4 + i] = payload[i] ^ mask[i & 3];
  }
  socket.write(frame);
}

/**
 * Đánh giá biểu thức bất đồng bộ bên trong Target CDP qua WebSocket gốc của Node 22+ hoặc HTTP Upgrade (Node 18/20)
 */
function evaluateInTarget(wsUrl, expression, timeoutMs = 360000) {
  if (typeof WebSocket !== 'undefined') {
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

  // Fallback RFC 6455 thuần Node.js (dành cho Node 18/20 khi chạy không có cờ --experimental-websocket)
  return new Promise((resolve, reject) => {
    const parsed = new URL(wsUrl);
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 9222,
      path: parsed.pathname + parsed.search,
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13',
      },
    });

    const timer = setTimeout(() => {
      try { req.destroy(); } catch {}
      reject(new Error(`CDP evaluation timeout after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    req.on('upgrade', (_res, socket) => {
      let recvBuf = Buffer.alloc(0);
      let msgFragments = [];

      sendWsTextFrame(
        socket,
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

      socket.on('data', (chunk) => {
        recvBuf = Buffer.concat([recvBuf, chunk]);
        while (recvBuf.length >= 2) {
          const byte0 = recvBuf[0];
          const byte1 = recvBuf[1];
          const fin = (byte0 & 0x80) !== 0;
          const opcode = byte0 & 0x0f;
          const masked = (byte1 & 0x80) !== 0;
          let payloadLen = byte1 & 0x7f;
          let offset = 2;

          if (payloadLen === 126) {
            if (recvBuf.length < 4) return;
            payloadLen = recvBuf.readUInt16BE(2);
            offset = 4;
          } else if (payloadLen === 127) {
            if (recvBuf.length < 10) return;
            payloadLen = Number(recvBuf.readBigUInt64BE(2));
            offset = 10;
          }

          if (masked) offset += 4;
          if (recvBuf.length < offset + payloadLen) return;

          let frameData = recvBuf.subarray(offset, offset + payloadLen);
          if (masked) {
            const maskKey = recvBuf.subarray(offset - 4, offset);
            frameData = Buffer.from(frameData);
            for (let i = 0; i < frameData.length; i++) {
              frameData[i] ^= maskKey[i & 3];
            }
          }
          recvBuf = recvBuf.subarray(offset + payloadLen);

          if (opcode === 0x01 || opcode === 0x00) {
            msgFragments.push(frameData);
            if (fin) {
              const fullText = Buffer.concat(msgFragments).toString('utf8');
              msgFragments = [];
              try {
                const msg = JSON.parse(fullText);
                if (msg.id === 1) {
                  clearTimeout(timer);
                  socket.destroy();
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
                  return resolve(msg.result?.result?.value);
                }
              } catch (err) {
                clearTimeout(timer);
                socket.destroy();
                return reject(err);
              }
            }
          } else if (opcode === 0x08) {
            clearTimeout(timer);
            socket.destroy();
            return reject(new Error('WebSocket đóng sớm bởi Chrome'));
          }
        }
      });

      socket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error('Lỗi kết nối WebSocket tới Chrome cổng 9222: ' + (err?.message || '')));
    });

    req.end();
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
      // Tự động mở rộng thanh Sidebar bên trái nếu đang bị thu gọn (left_panel_open)
      const openPanelBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.offsetParent !== null && (b.innerText || '').trim() === 'left_panel_open'
      );
      if (openPanelBtn) {
        openPanelBtn.click();
        await new Promise(r => setTimeout(r, 800));
      }

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
            .find(el => el.offsetParent !== null && ((el.innerText || '').trim().includes('Công cụ') || (el.innerText || '').trim() === 'apps_spark_2'));
          if (congCuBtn) {
            congCuBtn.click();
            await new Promise(r => setTimeout(r, 1500));
            toolItem = findToolLeaf();
          }
        }
        if (toolItem) {
          const clickable = toolItem.closest('a, button, [role="button"], [tabindex]') || toolItem.parentElement || toolItem;
          clickable.click();
          await new Promise(r => setTimeout(r, 2200));
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
    15000
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
    portraitAssetQuery = '',
    bodyAssetQuery = '',
    assetIndex = 1,
  } = options;
  const effectivePortraitQuery = portraitAssetQuery || assetQuery;
  const effectiveBodyQuery = bodyAssetQuery || assetQuery;

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

  // Bước 2: Chọn "Thêm từ dự án" để gán ảnh Chân dung (Portrait) vào tab "Chân dung" của Nhân vật
  await evaluateInTarget(
    wsUrl,
    `(async () => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Thêm từ dự án'));
      if (addBtn) addBtn.click();
      await new Promise(r => setTimeout(r, 1200));
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { ok: false, reason: 'Không tìm thấy hộp thoại chọn ảnh dự án' };
      const btns = Array.from(dialog.querySelectorAll('button'));
      const q = ${JSON.stringify(effectivePortraitQuery)}.toLowerCase().trim();
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

      // Bước 3B: Tự động mở tab "Tạo cơ thể" (Ảnh 2) và gắn mô hình Full-Body 3 góc độ vào tab "Cơ thể"
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
            const q = ${JSON.stringify(effectiveBodyQuery)}.toLowerCase().trim();
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
 * Gửi sự kiện click chuột phần cứng (Trusted Hardware Mouse Click) qua CDP Input.dispatchMouseEvent
 */
async function dispatchHardwareMouseClick(wsUrl, x, y) {
  return new Promise((resolve) => {
    const u = new URL(wsUrl);
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13',
      },
    });
    req.on('upgrade', (_res, socket) => {
      sendWsTextFrame(socket, JSON.stringify({
        id: 1,
        method: 'Input.dispatchMouseEvent',
        params: { type: 'mousePressed', x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 },
      }));
      setTimeout(() => {
        sendWsTextFrame(socket, JSON.stringify({
          id: 2,
          method: 'Input.dispatchMouseEvent',
          params: { type: 'mouseReleased', x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 },
        }));
        setTimeout(() => {
          try { socket.destroy(); } catch {}
          resolve(true);
        }, 150);
      }, 80);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

/**
 * Điều khiển Trình tạo công cụ (Applet Builder) trên trang mẹ Google Flow để nâng cấp hoặc tạo Tool mới
 */
async function executeHostUpgradeFlowApplet(options = {}) {
  const { prompt = '' } = options;
  if (!prompt.trim()) {
    throw new Error('Cần truyền nội dung prompt nâng cấp công cụ.');
  }

  const flowPage = await findHostFlowPage();
  const wsUrl = flowPage.webSocketDebuggerUrl;

  const res = await evaluateInTarget(
    wsUrl,
    `(async () => {
      // Nếu đang ở trang ngoài /tool/, tự động bấm vào "Hyperion Studio" trên thanh bên trước
      if (!location.href.includes('/tool/')) {
        const hypBtn = Array.from(document.querySelectorAll('button, a, [role="menuitem"], [role="treeitem"]'))
          .find(el => el.offsetParent !== null && (el.innerText || '').includes('Hyperion Studio'));
        if (hypBtn) {
          hypBtn.click();
          await new Promise(r => setTimeout(r, 1500));
        }
      }
      // Đảm bảo đang ở màn hình Chỉnh sửa (mode=EDIT) của công cụ
      const editBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.offsetParent !== null && (b.innerText || '').trim() === 'Chỉnh sửa'
      );
      if (editBtn && !location.href.includes('mode=EDIT')) {
        editBtn.click();
        await new Promise(r => setTimeout(r, 1500));
      }

      const pm = document.querySelector('div.ProseMirror[aria-label="Bạn muốn tạo gì?"], div.ProseMirror[contenteditable="true"]');
      if (!pm) {
        return { ok: false, error: 'Không tìm thấy ô nhập lệnh Trình tạo công cụ (ProseMirror)' };
      }

      pm.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, ${JSON.stringify(prompt)});
      pm.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 500));

      const box = pm.closest('.base-prompt-box') || document;
      const sendBtn = box.querySelector('button.generate-icon-button, button[aria-label="Bắt đầu tạo"], flow-generate-icon-button button');
      if (sendBtn && !sendBtn.disabled) {
        const r = sendBtn.getBoundingClientRect();
        return {
          ok: true,
          btnX: Math.round(r.left + r.width / 2),
          btnY: Math.round(r.top + r.height / 2),
          url: location.href,
        };
      }
      return { ok: false, error: 'Không tìm thấy nút Bắt đầu tạo (arrow_forward)' };
    })()`,
    20000
  );

  if (res && res.ok && res.btnX && res.btnY) {
    await dispatchHardwareMouseClick(wsUrl, res.btnX, res.btnY);
    return { ok: true, submittedViaHardwareClick: true, btnX: res.btnX, btnY: res.btnY, url: res.url };
  }

  return res;
}

/**
 * Tạo ảnh Storyboard trực tiếp trên Host Prompt Box của Google Flow bằng cách đính kèm
 * THỰC THỂ NHÂN VẬT (`<flow-character-ingredient-chip>`) từ tab "Nhân vật" (thay vì chỉ truyền ảnh tĩnh).
 */
async function executeHostGenerateImageWithCharacters(options = {}) {
  const {
    prompt = '',
    characterNames = [],
    aspectRatio = '16:9',
  } = options;
  if (!prompt.trim()) {
    throw new Error('Cần truyền nội dung prompt cho host.generateImageWithCharacters.');
  }

  const flowPage = await findHostFlowPage();
  const wsUrl = flowPage.webSocketDebuggerUrl;

  // Bước 1: Đưa về màn hình lưới dự án chính ("Tất cả nội dung nghe nhìn"), bật chế độ Hình ảnh (🍌 Nano Banana Pro), xóa chip cũ và đính kèm các thẻ <flow-character-ingredient-chip>
  const prepRes = await evaluateInTarget(
    wsUrl,
    `(async () => {
      // Mở rộng sidebar bên trái nếu đang thu gọn
      const openPanelBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.offsetParent !== null && (b.innerText || '').trim() === 'left_panel_open'
      );
      if (openPanelBtn) {
        openPanelBtn.click();
        await new Promise(r => setTimeout(r, 600));
      }

      // Thoát khỏi trang chi tiết Nhân vật / Cảnh nếu đang mở
      if (location.href.includes('/character/') || location.href.includes('/scene/')) {
        const doneBtn = Array.from(document.querySelectorAll('button')).find(
          b => b.offsetParent !== null && (b.innerText || '').trim() === 'Xong'
        );
        if (doneBtn) {
          doneBtn.click();
          await new Promise(r => setTimeout(r, 1200));
        }
      }

      // Chuyển thẳng về tab "Tất cả nội dung nghe nhìn" qua SPA Router (tuyệt đối không gán location.href gây hủy ngữ cảnh CDP)
      const allTab = Array.from(document.querySelectorAll('a, button, [role="menuitem"], [role="treeitem"], span, div'))
        .find(el => el.offsetParent !== null && el.children.length === 0 && (el.textContent || '').trim().includes('Tất cả nội dung'));
      if (allTab) {
        (allTab.closest('a, button, [role="menuitem"], [role="treeitem"]') || allTab).click();
        await new Promise(r => setTimeout(r, 1200));
      } else if (location.href.includes('/tool/')) {
        const backEl = Array.from(document.querySelectorAll('a, button')).find(
          b => b.offsetParent !== null && ((b.getAttribute('aria-label') || '').includes('Quay lại') || (b.innerText || '').trim() === 'arrow_back')
        );
        if (backEl) {
          backEl.click();
          await new Promise(r => setTimeout(r, 1200));
        }
      }

      // Đóng bất kỳ menu overlay nào đang mở
      const oldBackdrop = document.querySelector('.cdk-overlay-backdrop');
      if (oldBackdrop) {
        oldBackdrop.click();
        await new Promise(r => setTimeout(r, 300));
      }

      const box = document.querySelector('.base-prompt-box');
      if (!box) {
        return { ok: false, error: 'Không tìm thấy thanh câu lệnh gốc (.base-prompt-box) trên trang chủ Google Flow.' };
      }

      // Tắt chế độ "Tác nhân" (Agent mode) nếu đang bật để hiện nút cài đặt Hình ảnh / Video trực tiếp
      const settingsBtn = box.querySelector('button.settings-trigger-button');
      const agentChipBtn = box.querySelector('button.agent-mode-chip');
      if (settingsBtn && settingsBtn.offsetParent === null && agentChipBtn) {
        agentChipBtn.click();
        await new Promise(r => setTimeout(r, 600));
      }

      // Đảm bảo đang chọn chế độ "Hình ảnh" (🍌 Nano Banana Pro, 0 tín dụng), đúng tỷ lệ khung hình & x1
      const curSettingsText = (settingsBtn?.innerText || '').trim();
      const targetRatio = ${JSON.stringify(aspectRatio)};
      if (settingsBtn && (!curSettingsText.includes('Nano Banana') || !curSettingsText.includes('x1'))) {
        settingsBtn.click();
        await new Promise(r => setTimeout(r, 500));
        const imgModeBtn = Array.from(document.querySelectorAll('.cdk-overlay-container button, .cdk-overlay-container *'))
          .find(el => el.children.length === 0 && (el.textContent || '').trim() === 'Hình ảnh');
        if (imgModeBtn) {
          (imgModeBtn.closest('button') || imgModeBtn).click();
          await new Promise(r => setTimeout(r, 400));
        }
        const ratioBtn = Array.from(document.querySelectorAll('.cdk-overlay-container button, .cdk-overlay-container *'))
          .find(el => el.children.length === 0 && (el.textContent || '').trim() === targetRatio);
        if (ratioBtn) {
          (ratioBtn.closest('button') || ratioBtn).click();
          await new Promise(r => setTimeout(r, 300));
        }
        const x1Btn = Array.from(document.querySelectorAll('.cdk-overlay-container button, .cdk-overlay-container *'))
          .find(el => el.children.length === 0 && (el.textContent || '').trim() === 'x1');
        if (x1Btn) {
          (x1Btn.closest('button') || x1Btn).click();
          await new Promise(r => setTimeout(r, 300));
        }
        document.querySelector('.cdk-overlay-backdrop')?.click();
        await new Promise(r => setTimeout(r, 350));
      }

      // Xóa toàn bộ các chip nguyên liệu cũ đang nằm trong .base-prompt-box
      for (const chipBtn of Array.from(box.querySelectorAll('flow-ingredient-chip button.chip-container'))) {
        chipBtn.click();
        await new Promise(r => setTimeout(r, 150));
      }

      // Đính kèm tuần tự từng Thực thể Nhân vật (<flow-character-ingredient-chip>) từ tab "Nhân vật"
      const attachedCharacters = [];
      const charList = ${JSON.stringify(characterNames)};
      for (const rawName of charList) {
        const cleanName = String(rawName || '').trim();
        if (!cleanName) continue;
        const addBtn = box.querySelector('button[aria-label="Thêm thành phần vào ô nhập câu lệnh"]');
        if (!addBtn) continue;
        addBtn.click();
        await new Promise(r => setTimeout(r, 550));

        const charTab = Array.from(document.querySelectorAll('.cdk-overlay-container *'))
          .find(el => el.children.length === 0 && (el.textContent || '').trim() === 'Nhân vật');
        if (charTab) {
          (charTab.closest('button, [role="tab"], [role="menuitem"], [role="option"]') || charTab).click();
          await new Promise(r => setTimeout(r, 550));
        }

        const options = Array.from(document.querySelectorAll('flow-add-menu-asset-list button[role="option"]'));
        const exactMatch = options.find(b => (b.innerText || '').trim().toLowerCase() === cleanName.toLowerCase());
        const subMatch = options.find(b => (b.innerText || '').toLowerCase().includes(cleanName.toLowerCase()));
        const targetOpt = exactMatch || subMatch;
        if (targetOpt) {
          targetOpt.click();
          attachedCharacters.push(cleanName);
          await new Promise(r => setTimeout(r, 500));
          const confirmBtn = Array.from(document.querySelectorAll('.cdk-overlay-container button'))
            .find(b => b.offsetParent !== null && (b.innerText || '').includes('Thêm vào câu lệnh'));
          if (confirmBtn) {
            confirmBtn.click();
            await new Promise(r => setTimeout(r, 450));
          }
        } else {
          document.querySelector('.cdk-overlay-backdrop')?.click();
          await new Promise(r => setTimeout(r, 300));
        }
      }

      // Ghi nhận danh sách mediaId hiện có ở hàng đầu tiên trước khi bấm tạo
      const existingMediaIds = Array.from(document.querySelectorAll('flow-grid-tile-container img'))
        .map(img => {
          const m = (img.src || '').match(/\\/image\\/([a-f0-9-]{36})/);
          return m ? m[1] : null;
        })
        .filter(Boolean);

      // Nhập câu lệnh vào ProseMirror
      const pm = box.querySelector('div.ProseMirror[contenteditable="true"]');
      if (!pm) {
        return { ok: false, error: 'Không tìm thấy ô nhập ProseMirror trong .base-prompt-box.' };
      }
      pm.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, ${JSON.stringify(prompt)});
      pm.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 450));

      const genBtn = box.querySelector('button.generate-icon-button');
      if (!genBtn || genBtn.disabled) {
        return { ok: false, error: 'Nút Bắt đầu tạo trong .base-prompt-box đang bị khóa hoặc không tồn tại.' };
      }
      const r = genBtn.getBoundingClientRect();
      return {
        ok: true,
        btnX: Math.round(r.left + r.width / 2),
        btnY: Math.round(r.top + r.height / 2),
        attachedCharacters,
        chipCount: box.querySelectorAll('flow-character-ingredient-chip').length,
        existingMediaIds: existingMediaIds.slice(0, 8),
      };
    })()`,
    35000
  );

  if (!prepRes || !prepRes.ok) {
    throw new Error(prepRes?.error || 'Không thể chuẩn bị câu lệnh với Thực thể Nhân vật trên Host UI.');
  }

  console.log(
    `   -> 🎭 [Host Character Chips] Đã đính kèm ${prepRes.chipCount} thẻ Nhân vật (${prepRes.attachedCharacters.join(', ')}) vào ô câu lệnh!`
  );

  await dispatchHardwareMouseClick(wsUrl, prepRes.btnX, prepRes.btnY);

  // Bước 2: Chờ ô ảnh mới xuất hiện trên lưới dự án và trích xuất mediaId + base64
  const startWait = Date.now();
  const knownIds = new Set(prepRes.existingMediaIds || []);
  while (Date.now() - startWait < 120000) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await evaluateInTarget(
      wsUrl,
      `(async () => {
        const tiles = Array.from(document.querySelectorAll('flow-grid-tile-container')).slice(0, 4);
        for (const t of tiles) {
          const img = t.querySelector('img');
          if (!img || !img.src) continue;
          const m = img.src.match(/\\/image\\/([a-f0-9-]{36})/);
          if (!m) continue;
          const mediaId = m[1];
          return {
            mediaId,
            src: img.src,
            aria: t.getAttribute('aria-label') || '',
          };
        }
        return null;
      })()`,
      10000
    );

    if (pollRes && pollRes.mediaId && !knownIds.has(pollRes.mediaId)) {
      const dlRes = await evaluateInTarget(
        wsUrl,
        `(async () => {
          const resp = await fetch(${JSON.stringify(pollRes.src)});
          const blob = await resp.blob();
          const b64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
          });
          return {
            base64: b64,
            mimeType: blob.type || 'image/jpeg',
          };
        })()`,
        20000
      );

      if (dlRes && dlRes.base64) {
        return {
          mediaId: pollRes.mediaId,
          base64: dlRes.base64,
          mimeType: dlRes.mimeType,
          attachedCharacters: prepRes.attachedCharacters,
          chipCount: prepRes.chipCount,
        };
      }
    }
  }

  throw new Error('Hết thời gian chờ (120s) tạo ảnh từ Thực thể Nhân vật trên Host UI.');
}

/**
 * Thực thi bất kỳ lệnh `Flow.*` nào từ VS Code thông qua Iframe hoặc Host của Google Flow Ultra
 */
async function executeFlowSdkCall(methodPath, args = []) {
  // Hỗ trợ các tính năng Native trên trang mẹ (Host UI): Tạo nhân vật (Ảnh 1), Cảnh mới (Ảnh 2), Tạo ảnh với Nhân vật & Nâng cấp Tool
  if (methodPath === 'host.createCharacter') {
    return await executeHostCreateCharacter(args[0] || {});
  }
  if (methodPath === 'host.createScene') {
    return await executeHostCreateScene(args[0] || {});
  }
  if (methodPath === 'host.upgradeFlowApplet') {
    return await executeHostUpgradeFlowApplet(args[0] || {});
  }
  if (methodPath === 'host.generateImageWithCharacters') {
    return await executeHostGenerateImageWithCharacters(args[0] || {});
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
      case 'generate.videoExperimental':
        return await Flow.generate.videoExperimental(args[0]);
      case 'upload':
        return await Flow.upload(args[0]);
      case 'save':
        return await Flow.save(args[0]);
      case 'download':
        return await Flow.download(args[0]);
      case 'media.select':
        return await Flow.media.select(args[0] || {});
      case 'media.selectMultiple':
        return await Flow.media.selectMultiple(args[0] || {});
      case 'media.getBase64':
        return await Flow.media.getBase64(args[0]);
      case 'storage.getItem':
        return await Flow.storage.getItem(args[0]);
      case 'storage.setItem':
        return await Flow.storage.setItem(args[0], args[1]);
      case 'storage.removeItem':
        return await Flow.storage.removeItem(args[0]);
      case 'storage.clear':
        return await Flow.storage.clear();
      case 'storage.keys':
        return await Flow.storage.keys(args[0] || {});
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
