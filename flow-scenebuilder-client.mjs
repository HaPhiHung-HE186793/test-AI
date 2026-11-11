import http from 'node:http';
import crypto from 'node:crypto';

async function getPages() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/list', res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

export async function evalInFlowPage(expression, wantCookies = false) {
  const pages = await getPages();
  const page = pages.find(p => p.type === 'page' && p.url.includes('flow.google.com'));
  if (!page) throw new Error('No flow.google.com page found on port 9222');
  const wsUrl = new URL(page.webSocketDebuggerUrl);

  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({
      hostname: wsUrl.hostname,
      port: wsUrl.port,
      path: wsUrl.pathname + wsUrl.search,
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13',
      },
    });
    req.on('upgrade', (res, socket) => {
      const sendFrame = obj => {
        const payload = Buffer.from(JSON.stringify(obj), 'utf8');
        const mask = crypto.randomBytes(4);
        let header;
        if (payload.length < 126) {
          header = Buffer.alloc(2);
          header[0] = 0x81;
          header[1] = 0x80 | payload.length;
        } else if (payload.length < 65536) {
          header = Buffer.alloc(4);
          header[0] = 0x81;
          header[1] = 0x80 | 126;
          header.writeUInt16BE(payload.length, 2);
        } else {
          header = Buffer.alloc(10);
          header[0] = 0x81;
          header[1] = 0x80 | 127;
          header.writeBigUInt64BE(BigInt(payload.length), 2);
        }
        const masked = Buffer.alloc(payload.length);
        for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
        socket.write(Buffer.concat([header, mask, masked]));
      };

      let nextId = 1;
      const pending = new Map();
      const callCdp = (method, params) =>
        new Promise((resCdp, rejCdp) => {
          const id = nextId++;
          pending.set(id, { resCdp, rejCdp });
          sendFrame({ id, method, params });
        });

      let recvBuf = Buffer.alloc(0);
      socket.on('data', chunk => {
        recvBuf = Buffer.concat([recvBuf, chunk]);
        while (recvBuf.length >= 2) {
          let len = recvBuf[1] & 0x7f;
          let offset = 2;
          if (len === 126) {
            if (recvBuf.length < 4) return;
            len = recvBuf.readUInt16BE(2);
            offset = 4;
          } else if (len === 127) {
            if (recvBuf.length < 10) return;
            len = Number(recvBuf.readBigUInt64BE(2));
            offset = 10;
          }
          if (recvBuf.length < offset + len) return;
          const body = recvBuf.subarray(offset, offset + len).toString('utf8');
          recvBuf = recvBuf.subarray(offset + len);
          try {
            const msg = JSON.parse(body);
            if (pending.has(msg.id)) {
              const { resCdp, rejCdp } = pending.get(msg.id);
              pending.delete(msg.id);
              if (msg.error) rejCdp(msg.error);
              else resCdp(msg.result);
            }
          } catch {}
        }
      });

      (async () => {
        let cookieHeader = '';
        if (wantCookies) {
          const cRes = await callCdp('Network.getCookies', {
            urls: ['https://flow.google.com/', 'https://google.com/', 'https://googleusercontent.com/'],
          });
          cookieHeader = cRes.cookies.map(c => `${c.name}=${c.value}`).join('; ');
        }
        try {
          const protoRes = await callCdp('Runtime.evaluate', {
            expression: 'window.default_AiSandboxAngularFrontend?.ZQ?.prototype',
          });
          if (protoRes?.result?.objectId) {
            const objs = await callCdp('Runtime.queryObjects', {
              prototypeObjectId: protoRes.result.objectId,
            });
            if (objs?.objects?.objectId) {
              await callCdp('Runtime.callFunctionOn', {
                objectId: objs.objects.objectId,
                functionDeclaration: 'function() { if (this && this.length) window.__flowZQ = Array.from(this).find(x => !x?.Ca?.Va) || this[this.length - 1]; }',
              });
            }
          }
          const sbProtoRes = await callCdp('Runtime.evaluate', {
            expression: 'window.default_AiSandboxAngularFrontend?.Dy?.prototype',
          });
          if (sbProtoRes?.result?.objectId) {
            const sbObjs = await callCdp('Runtime.queryObjects', {
              prototypeObjectId: sbProtoRes.result.objectId,
            });
            if (sbObjs?.objects?.objectId) {
              await callCdp('Runtime.callFunctionOn', {
                objectId: sbObjs.objects.objectId,
                functionDeclaration: 'function() { if (this && this.length) window.__flowSB = Array.from(this).find(x => !x?.Ca?.Va) || this[this.length - 1]; }',
              });
            }
          }
        } catch {}
        const evalRes = await callCdp('Runtime.evaluate', {
          expression,
          awaitPromise: true,
          returnByValue: true,
        });
        socket.end();
        if (evalRes.exceptionDetails) {
          resolve({ error: evalRes.exceptionDetails.text, desc: evalRes.result?.description });
        } else {
          resolve(wantCookies ? { cookieHeader, val: evalRes.result?.value } : evalRes.result?.value);
        }
      })().catch(err => {
        socket.end();
        reject(err);
      });
    });
    req.on('error', reject);
    req.end();
  });
}
