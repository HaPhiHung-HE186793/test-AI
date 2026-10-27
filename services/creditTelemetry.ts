import { FlowVideoModelName } from '../types/cinemaCore';

export interface CreditEstimateConfig {
  task: 'image_dna' | 'video_render' | 'conversational_edit_image' | 'conversational_edit_video' | 'extend_8s' | 'text_script';
  model?: FlowVideoModelName;
  duration?: number; // 4, 6, 8, 10
  resolution?: '360p' | '720p';
  isDirectR2VWithoutKeyframe?: boolean; // Nếu dùng trực tiếp R2V trên Veo 3.1 không qua Bước Đệm Vàng
}

export const ULTRA_TIER_TOTAL_BUDGET = 25000;

export class CreditTelemetryService {
  private static instance: CreditTelemetryService;
  private totalUsedCredits: number = 3420;
  private logs: Array<{ id: string; timestamp: number; task: string; credits: number }> = [];

  private constructor() {}

  public static getInstance(): CreditTelemetryService {
    if (!CreditTelemetryService.instance) {
      CreditTelemetryService.instance = new CreditTelemetryService();
    }
    return CreditTelemetryService.instance;
  }

  /**
   * Tính toán Credit chuẩn xác 100% cho gói Google AI Ultra:
   * - Gemini Omni Flash 1.1 (360p Draft + Tự động Free Upscale lên 720p cho gói Ultra):
   *     4s = 4 credits, 6s = 5 credits, 8s = 6 credits, 10s = 7 credits.
   *     (Nếu chọn 720p trực tiếp: 4s=7cr, 6s=10cr, 8s=12cr, 10s=15cr)
   * - Veo 3.1 Lite: 5 credits/shot (4s, 6s hoặc 8s trên Ultra)
   * - Veo 3.1 Fast: 10 credits/shot (4s, 6s hoặc 8s trên Ultra)
   * - Veo 3.1 Quality: 100 credits/shot (4s, 6s hoặc 8s trên Ultra)
   * - +8s Extend: Sử dụng Veo 3.1 Lite = 5 credits
   * - Sửa nhanh bằng lời nói (Video V2V Edit): Omni 1.1 Flash (360p Draft = 10 credits, 720p = 20 credits)
   * - Sửa nhanh bằng lời nói (Image Inpainting): 🍌 Nano Banana Pro = 0 credits (Miễn phí trên Ultra)
   * - Tăng độ phân giải lên 1080p (Master Cut): 0 credits (Miễn phí gói Ultra)
   */
  public calculateCost(config: CreditEstimateConfig): number {
    switch (config.task) {
      case 'image_dna':
      case 'conversational_edit_image':
      case 'text_script':
        return 0; // Miễn phí trên gói Ultra

      case 'extend_8s':
        // Kéo dài +8s dùng Veo 3.1 Lite trên Ultra
        return 5;

      case 'conversational_edit_video':
        // Video-to-Video Edit bằng Omni 1.1 Flash
        return config.resolution === '720p' ? 20 : 10;

      case 'video_render': {
        const model = config.model || 'Veo 3.1 - Fast';
        const dur = config.duration || 8;
        const res = config.resolution || '360p';

        if (model === 'Omni 1.1 Flash') {
          if (res === '360p') {
            // 360p Draft kèm Free Auto Upscale 720p trên Ultra
            if (dur <= 4) return 4;
            if (dur <= 6) return 5;
            if (dur <= 8) return 6;
            return 7; // 10s
          } else {
            // Native 720p render
            if (dur <= 4) return 7;
            if (dur <= 6) return 10;
            if (dur <= 8) return 12;
            return 15; // 10s
          }
        }

        if (model === 'Veo 3.1 - Lite') {
          return 5;
        }

        if (model === 'Veo 3.1 - Fast') {
          return 10;
        }

        if (model === 'Veo 3.1 - Quality') {
          return 100;
        }

        return 10;
      }

      default:
        return 0;
    }
  }

  public getBudgetStatus() {
    const remaining = Math.max(0, ULTRA_TIER_TOTAL_BUDGET - this.totalUsedCredits);
    const percentageUsed = ((this.totalUsedCredits / ULTRA_TIER_TOTAL_BUDGET) * 100).toFixed(1);

    return {
      totalBudget: ULTRA_TIER_TOTAL_BUDGET,
      usedCredits: this.totalUsedCredits,
      remainingCredits: remaining,
      percentageUsed: Number(percentageUsed),
      isLowWarning: remaining < 2000,
      isExhausted: remaining <= 0,
    };
  }

  public recordExpenditure(taskLabel: string, credits: number) {
    this.totalUsedCredits += credits;
    this.logs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      task: taskLabel,
      credits,
    });
  }

  public getRecentLogs() {
    return this.logs.slice(0, 5);
  }
}

export const telemetry = CreditTelemetryService.getInstance();