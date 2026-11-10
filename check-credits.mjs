import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

// Đọc file .env thủ công (không cần cài thêm thư viện ngoài)
function loadEnv() {
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const GEMINI_API_KEY = process.argv[2] || env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const FLOW_COOKIE = env.FLOW_COOKIE || process.env.FLOW_COOKIE || '';
const FLOW_AT_TOKEN = env.FLOW_AT_TOKEN || process.env.FLOW_AT_TOKEN || '';

console.log('====================================================================');
console.log('🔍 BÀI TEST KIỂM CHỨNG: GEMINI API KEY vs GOOGLE AI ULTRA 25.000 CREDITS');
console.log('====================================================================\n');

async function testGeminiApiKey(apiKey) {
  console.log(`▶️ [TEST 1] Kiểm tra GEMINI_API_KEY (${apiKey.slice(0, 10)}...):`);

  // 1.1: Liệt kê các Model mà API Key này nhìn thấy trên Google AI Studio (generativelanguage.googleapis.com)
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    const data = await res.json();
    if (!res.ok) {
      console.log('  ❌ Lỗi khi gọi danh sách Models:', JSON.stringify(data, null, 2));
    } else {
      const models = (data.models || []).map(m => m.name.replace('models/', ''));
      const videoModels = models.filter(m => /veo|omni|video|imagen/i.test(m));
      console.log(`  ✅ Kết nối API Key hợp lệ! Tổng số model mở khóa: ${models.length}`);
      console.log(`  🎬 Các Model Video / Ảnh tìm thấy trong API Key này:`, videoModels);
    }
  } catch (err) {
    console.log('  ❌ Lỗi kết nối generativelanguage.googleapis.com:', err.message);
  }

  // 1.2: Thử dùng GEMINI_API_KEY gọi thẳng vào RPC kiểm tra 25.000 Credits của Google Flow (rpcids=nzlxg)
  console.log('\n▶️ [TEST 2] Thử dùng GEMINI_API_KEY để lấy số dư 25.000 Credits tại flow.google.com (rpcids=nzlxg):');
  try {
    const body = new URLSearchParams({
      'f.req': JSON.stringify([[['nzlxg', '[]', null, 'generic']]])
    });
    const res = await fetch(`https://flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute?rpcids=nzlxg&key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'x-goog-api-key': apiKey
      },
      body: body.toString()
    });
    const text = await res.text();
    console.log(`  📡 HTTP Status từ flow.google.com: ${res.status} ${res.statusText}`);
    console.log(`  📄 Raw Response (300 ký tự đầu):\n  ${text.slice(0, 300).replace(/\n/g, ' ')}`);
    if (text.includes('wrb.fr') && text.includes('nzlxg')) {
      console.log('  ✅ Đọc được dữ liệu từ nzlxg!');
    } else {
      console.log('  ⚠️ flow.google.com KHÔNG nhận API Key (AIzaSy...) để đọc ví 25.000 Credits (vì yêu cầu Cookie phiên đăng nhập Google One AI Ultra).');
    }
  } catch (err) {
    console.log('  ❌ Lỗi khi gọi flow.google.com:', err.message);
  }

  // 1.3: Thử gọi tạo video bằng API Key trên endpoint chính thức (v1beta/interactions) xem có được dùng 25.000 Credits hay bị chặn Free Tier
  console.log('\n▶️ [TEST 3] Thử gọi tạo Video [gemini-omni-1.2-flash] bằng GEMINI_API_KEY qua v1beta/interactions:');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/interactions?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-omni-1.2-flash',
          input: 'A tiny cube spinning',
          response_modalities: ['video']
        })
      }
    );
    const data = await res.json();
    console.log(`  🔹 Kết quả gọi [gemini-omni-1.2-flash] (HTTP ${res.status}):`);
    console.log(`     ${JSON.stringify(data, null, 2)}`);
  } catch (err) {
    console.log(`  ❌ Lỗi gọi [gemini-omni-1.2-flash]:`, err.message);
  }
}

async function testFlowSessionCookie(cookie, atToken) {
  console.log('\n▶️ [TEST 4] Kiểm tra lấy số dư 25.000 Credits qua FLOW_COOKIE (rpcids=nzlxg):');
  try {
    let finalAtToken = atToken;
    if (!finalAtToken) {
      // Tự động lấy mã XSRF "SNlM0e" (at token) từ trang chủ flow.google.com bằng Cookie
      const pageRes = await fetch('https://flow.google.com/', {
        headers: {
          Cookie: cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        }
      });
      const html = await pageRes.text();
      const match = html.match(/"SNlM0e":"([^"]+)"/);
      if (match) {
        finalAtToken = match[1];
        console.log(`  🔑 Tự động trích xuất được mã XSRF (at token): ${finalAtToken.slice(0, 15)}...`);
      } else {
        console.log('  ⚠️ Không tìm thấy mã SNlM0e trong HTML (Cookie có thể đã hết hạn hoặc thiếu).');
      }
    }

    const params = new URLSearchParams({
      'f.req': JSON.stringify([[['nzlxg', '[]', null, 'generic']]])
    });
    if (finalAtToken) params.set('at', finalAtToken);

    const res = await fetch('https://flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute?rpcids=nzlxg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Cookie: cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      },
      body: params.toString()
    });
    const text = await res.text();
    console.log(`  📡 HTTP Status: ${res.status}`);
    const match = text.match(/\["wrb\.fr","nzlxg","((?:\\.|[^"\\])*)"/);
    if (match) {
      const innerJson = JSON.parse(`"${match[1]}"`);
      const parsed = JSON.parse(innerJson);
      console.log('  🎉 KẾT QUẢ SỐ DƯ CREDITS TRẢ VỀ TỪ GOOGLE FLOW (rpcids=nzlxg):');
      console.log('     Raw Protobuf Array:', JSON.stringify(parsed));
      console.log(`     💰 Subscription Credits (Gói AI Ultra): ${parsed[0] ?? 0}`);
      console.log(`     ➕ Top-Up Credits (Mua thêm): ${parsed[4] ?? 0}`);
    } else {
      console.log('  📄 Raw Response:', text.slice(0, 500));
    }

    // TEST 5: Đọc trực tiếp Project & Scene bffcf211-5bd7-4483-a04a-a42a6e2d5e8b bằng Cookie (rpcids=Zzl0ze)
    console.log('\n▶️ [TEST 5] Đọc dữ liệu Project 425eb708-ac40-4d8f-aa42-17f1a94e8898 & Scene bffcf211-5bd7-4483-a04a-a42a6e2d5e8b (rpcids=Zzl0ze):');
    const projParams = new URLSearchParams({
      'f.req': JSON.stringify([[['Zzl0ze', JSON.stringify(['projects/425eb708-ac40-4d8f-aa42-17f1a94e8898', null, null, null, [1]]), null, 'generic']]])
    });
    if (finalAtToken) projParams.set('at', finalAtToken);
    const projRes = await fetch('https://flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute?rpcids=Zzl0ze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Cookie: cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      },
      body: projParams.toString()
    });
    const projText = await projRes.text();
    const projMatch = projText.match(/\["wrb\.fr","Zzl0ze","((?:\\.|[^"\\])*)"/);
    if (projMatch) {
      const projData = JSON.parse(JSON.parse(`"${projMatch[1]}"`));
      const workflows = projData[1] || [];
      const mediaItems = projData[2] || [];
      const scenes = projData[4] || [];
      const sceneClips = projData[6] || [];
      console.log(`  ✅ Tải thành công Project! Tổng số Workflows: ${workflows.length}, Media Items: ${mediaItems.length}, Scenes: ${scenes.length}, Scene Clips: ${sceneClips.length}`);
      console.log('  🎬 Thông tin Scene (bffcf211-5bd7-4483-a04a-a42a6e2d5e8b):', JSON.stringify(scenes));
      console.log('  🎞️ Các Clip gắn trong Scene Timeline:', JSON.stringify(sceneClips, null, 2));
      const extendItems = mediaItems.filter(m => JSON.stringify(m).includes('trận chiến tiếp tục'));
      if (extendItems.length > 0) {
        console.log('  🔥 Tìm thấy Clip vừa Kéo dài ("trận chiến tiếp tục" - Omni 1.2 Flash):');
        console.log(`     - Media ID: ${extendItems[0][0]}`);
        console.log(`     - Model nội bộ: ${extendItems[0][5]?.[6]?.[1]?.[0]?.[0]} / ${extendItems[0][7]?.[0]?.[12]}`);
        console.log(`     - Source Video ID gốc: ${extendItems[0][5]?.[6]?.[1]?.[2]?.[0]?.[3]}`);
        console.log(`     - Link tải MP4: ${extendItems[0][5]?.[5]}`);
      }
    }

    // TEST 6: Thử gọi trực tiếp API Kéo dài Video (rpcids=fZytfe) chỉ bằng Cookie (không có reCAPTCHA Enterprise token)
    console.log('\n▶️ [TEST 6] Thử gọi trực tiếp rpcids=fZytfe (EXTEND_VIDEO) không kèm token reCAPTCHA Enterprise:');
    const extPayload = [
      [[[null, '7a348299-ca02-492d-afca-2df8b8f84666'], [null, null, [['trận chiến tiếp tục']]], 'macaron_cookie_extend_4s', 1, null, ['bffcf211-5bd7-4483-a04a-a42a6e2d5e8b', '96bf93ce-d3d0-467e-b60c-6d3849019792', null, null, '11111111-2222-4333-8444-555555555555']]],
      [null, 22, null, null, null, '425eb708-ac40-4d8f-aa42-17f1a94e8898'],
      ['99999999-1111-4222-8333-444444444444', 1, null, ['bffcf211-5bd7-4483-a04a-a42a6e2d5e8b', 2]]
    ];
    const extParams = new URLSearchParams({
      'f.req': JSON.stringify([[['fZytfe', JSON.stringify(extPayload), null, 'generic']]])
    });
    if (finalAtToken) extParams.set('at', finalAtToken);
    const extRes = await fetch('https://flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute?rpcids=fZytfe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Cookie: cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      },
      body: extParams.toString()
    });
    const extText = await extRes.text();
    console.log(`  📡 HTTP Status: ${extRes.status}`);
    console.log(`  📄 Raw Response: ${extText.trim().replace(/\n+/g, ' ')}`);
    console.log('  💡 Giải thích: Mã [3] (INVALID_ARGUMENT) xuất hiện vì hàm _.YL.prototype.Qr("VIDEO_GENERATION") bắt buộc đính kèm token grecaptcha.enterprise.execute("6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV", {action: "VIDEO_GENERATION"}) vào trường k[10] của payload!');
  } catch (err) {
    console.log('  ❌ Lỗi khi gọi nzlxg bằng Cookie:', err.message);
  }
}

async function main() {
  if (!GEMINI_API_KEY && !FLOW_COOKIE) {
    console.log('⚠️ Chưa có GEMINI_API_KEY hoặc FLOW_COOKIE trong file .env hoặc tham số dòng lệnh.');
    console.log('👉 Hãy dán key vào file .env hoặc gửi trực tiếp vào khung chat để chạy kiểm chứng!');
    return;
  }
  if (GEMINI_API_KEY) {
    await testGeminiApiKey(GEMINI_API_KEY);
  }
  if (FLOW_COOKIE) {
    await testFlowSessionCookie(FLOW_COOKIE, FLOW_AT_TOKEN);
  }
}

main();
