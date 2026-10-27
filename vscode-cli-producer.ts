/**
 * HYPERION STUDIO OS — TRÌNH CHẠY SẢN XUẤT PHIM TRỰC TIẾP TRÊN TERMINAL VS CODE (TYPESCRIPT)
 * Cách dùng trong VS Code Terminal:
 *   1. Bật cầu nối: npm run bridge
 *   2. Chạy kịch bản: npm run produce -- "Kịch bản phim của bạn..."
 *   3. Tạo nhân vật vào tab "Nhân vật" (Ảnh 1) & ghép cảnh vào tab "Cảnh" (Ảnh 2):
 *      await Flow.host.createCharacter({ name: 'THIEN VUONG 09', personality: '...', assetQuery: 'reference sheet' });
 *      await Flow.host.createScene({ clipCount: 6 });
 * Sử dụng 100% gói Google AI Ultra (25.000 Credits) hiện có của bạn (0đ phát sinh bên ngoài).
 */

import './services/flowSdkClient.ts';
import { Flow } from './services/flowSdkClient.ts';

async function main() {
  const rawArgs = process.argv.slice(2);
  const runHostCharacter = rawArgs.includes('--create-character');
  const runHostScene = rawArgs.includes('--create-scene');
  const userScript =
    rawArgs.filter((a) => !a.startsWith('--')).join(' ').trim() ||
    'Một chiến binh cơ giáp bạc đứng trên đỉnh tòa tháp Neo-Hanoi dưới cơn mưa đêm, rút kiếm ánh sáng phóng vọt lên bầu trời.';

  console.log('==================================================================');
  console.log('🎬 HYPERION STUDIO OS — VS CODE TYPESCRIPT DIRECT RUNNER');
  console.log('💳 Chế độ: Kết nối trực tiếp gói Google AI Ultra (25.000 Credits)');
  console.log(`📜 Kịch bản: "${userScript}"`);
  console.log('==================================================================\n');

  // Bước 1: Kiểm tra kết nối Cầu nối Local Bridge -> Google Flow Ultra
  const statusRes = await fetch('http://localhost:4321/api/status');
  const statusJson = await statusRes.json();
  if (!statusJson.ok) {
    throw new Error('Cầu nối chưa sẵn sàng: ' + statusJson.error);
  }
  console.log(`✅ Đã kết nối Sandbox Google Flow Ultra (Frame ID: ${statusJson.sandboxFrameId})`);

  if (runHostCharacter) {
    console.log('\n[Host UI - Ảnh 1] 🧍 Đang gọi Flow.host.createCharacter(...) tạo nhân vật vào tab "Nhân vật"...');
    const charRes = await Flow.host.createCharacter({
      name: 'THIEN VUONG 09',
      personality: 'Kỵ sĩ cơ khí bạc bảo vệ bầu trời Neo-Hanoi 2099, giáp hợp kim bạc phát quang xanh cyan, song kiếm ánh sáng Plasma.',
      assetQuery: 'reference sheet',
    });
    console.log('   -> ✅ Đã tạo & lưu nhân vật vào tab "Nhân vật":', charRes);
  }

  if (runHostScene) {
    console.log('\n[Host UI - Ảnh 2] 🎞️ Đang gọi Flow.host.createScene(...) ghép cảnh vào tab "Cảnh"...');
    const sceneRes = await Flow.host.createScene({
      clipCount: 6,
    });
    console.log('   -> ✅ Đã ghép & lưu Cảnh vào tab "Cảnh":', sceneRes);
  }

  if (!runHostCharacter && !runHostScene) {
    // Bước 2: Gọi Omni 1.1 Flash phân tích kịch bản trực tiếp từ VS Code TypeScript
    console.log('\n[1/3] 🧠 Đang gọi Flow.generate.text (Omni 1.1 Flash) từ VS Code...');
    const textRes = await Flow.generate.text({
      prompt: `Hãy tóm tắt 1 câu mô tả nhân vật chính (tiếng Anh) và 1 câu mô tả bối cảnh trống không người (tiếng Anh) cho kịch bản: "${userScript}". Trả về JSON: {"character": "...", "environment": "..."}`,
      thinkingLevel: 'low',
    });
    console.log('   -> Kết quả từ Omni 1.1 Flash:', textRes.text.trim());

    // Bước 3: Gọi 🍌 Nano Banana Pro (0 Credit) tạo Bảng Tham Chiếu Nhân Vật 3 Góc Độ trên Nền Xám #808080
    console.log('\n[2/3] 🍌 Đang gọi Flow.generate.image (Nano Banana Pro - 0 Credit) tạo 3-Panel Reference Sheet...');
    const imgRes = await Flow.generate.image({
      prompt: `16:9 three-panel character reference sheet split into 3 views: (1) close-up portrait of face and head details, (2) full-body front view standing straight, (3) full-body three-quarter back view. Subject: ${userScript}. Isolated on a flat neutral gray studio background (#808080) with shadowless studio lighting, zero cast shadows, 8k photorealistic.`,
      modelDisplayName: '🍌 Nano Banana Pro',
      aspectRatio: '16:9',
    });
    console.log(`   -> ✅ Tạo ảnh thành công! MediaId: ${imgRes.mediaId}`);
    console.log(`   -> 💾 Đã lưu file ảnh trực tiếp vào ổ cứng VS Code: ${imgRes.savedLocalPath}`);
  }

  console.log('\n🎉 Hoàn tất thực thi TypeScript từ VS Code sang Google Flow Ultra!');
}

main().catch((err) => {
  console.error('❌ Lỗi thực thi:', err.message);
  process.exit(1);
});
