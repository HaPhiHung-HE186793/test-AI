import { Flow } from 'flow-sdk';

export interface PromptExpansionResult {
  cinematicEnglishPrompt: string;
  audioSfxPrompt?: string;
  cameraMovementSuggestion?: string;
}

/**
 * Tự động dịch Tiếng Việt Đời Thường sang Prompt Điện Ảnh Chuẩn quốc tế cho Nano Banana Pro và Veo 3.1
 */
export async function translateAndExpandPrompt(
  vietnameseText: string,
  contextType: 'general' | 'character_dna' | 'action_camera' | 'sfx_sound' | 'environment' = 'general'
): Promise<PromptExpansionResult> {
  if (!vietnameseText.trim()) {
    return { cinematicEnglishPrompt: '' };
  }

  const systemInstruction = `Bạn là Đạo diễn hình ảnh (Director of Photography) và Chuyên gia Prompt Hollywood của Hyperion Studio OS.
Nhiệm vụ: Chuyển thể văn phong tiếng Việt đời thường hoặc ý tưởng ngắn của người dùng thành Prompt điện ảnh tiếng Anh chuyên nghiệp (Cinematic English Prompt) tương thích hoàn hảo với Google Veo 3.1 và Nano Banana Pro.

Quy tắc dịch & chuẩn hóa:
1. Thêm các thuật ngữ điện ảnh chuẩn: 35mm / Anamorphic lens, volumetric lighting, photorealistic textures, dynamic blocking, cinematic color grading, Unreal Engine 5 render style.
2. Tuyệt đối không để prompt tiếng Việt lẫn vào đầu ra tiếng Anh.
3. Nếu người dùng mô tả hành động võ thuật hoặc robot, dùng từ ngữ chuyển động dứt khoát: whip pan, shockwave blast, mechanical hydraulics, neon embers, particle trails.
4. Trả về kết quả dưới định dạng JSON thuần túy (không bọc code block thừa):
{
  "cinematicEnglishPrompt": "Prompt tiếng Anh chuyên nghiệp đầy đủ chi tiết cho video/ảnh",
  "audioSfxPrompt": "Mô tả âm thanh vật lý SFX chi tiết bằng tiếng Việt hoặc Anh",
  "cameraMovementSuggestion": "Góc máy đề xuất (e.g. Low-angle tracking dolly)"
}`;

  const prompt = `Ý tưởng của người dùng bằng tiếng Việt: "${vietnameseText}"
Bối cảnh sử dụng: ${contextType}

Hãy dịch và phóng tác thành prompt điện ảnh đỉnh cao:`;

  try {
    const res = await Flow.generate.text(prompt, {
      systemInstruction,
    });

    let cleaned = res.text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(cleaned);
    return {
      cinematicEnglishPrompt: parsed.cinematicEnglishPrompt || cleaned,
      audioSfxPrompt: parsed.audioSfxPrompt || 'Cinematic heavy bass impact, plasma engine rumble',
      cameraMovementSuggestion: parsed.cameraMovementSuggestion || 'Dynamic tracking camera with cinematic bokeh',
    };
  } catch (error) {
    console.warn('Lỗi AI dịch prompt, dùng bộ fallback tự động:', error);
    // Fallback chuẩn điện ảnh
    return {
      cinematicEnglishPrompt: `Cinematic high-octane blockbuster scene: ${vietnameseText}. 35mm anamorphic action lens, volumetric lighting, photorealistic textures, 8k cinematic masterpiece.`,
      audioSfxPrompt: 'Heavy mechanical impact, roaring engine thrusters, electric sparks',
      cameraMovementSuggestion: 'Tracking dolly shot',
    };
  }
}