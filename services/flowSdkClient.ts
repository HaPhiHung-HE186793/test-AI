/**
 * HYPERION STUDIO OS — BỘ KẾT NỐI `Flow` SDK CHO VS CODE (DÙNG GÓI GOOGLE AI ULTRA 25.000 CREDITS)
 * Tự động chuyển tiếp mọi lệnh:
 * - `Flow.generate.text`, `Flow.generate.image`, `Flow.generate.video`
 * - `Flow.upload`, `Flow.save`, `Flow.media.select`, `Flow.storage`
 * - `Flow.host.createCharacter` (Tab "Nhân vật" — Ảnh 1)
 * - `Flow.host.createScene` (Tab "Cảnh" / Scenebuilder — Ảnh 2)
 * từ VS Code qua Cầu nối Local (`http://localhost:4321/api/flow`) sang phiên Google Flow Ultra ở cổng 9222.
 */

const BRIDGE_API_URL = 'http://localhost:4321/api/flow';

async function callFlowBridge(method: string, args: any[]): Promise<any> {
  const response = await fetch(BRIDGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, args }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(
      payload.error ||
        `Lỗi gọi Flow.${method} qua Cầu nối VS Code (Hãy đảm bảo đã chạy "npm run bridge")`
    );
  }
  return payload.data;
}

export const Flow = {
  generate: {
    text: async (
      promptOrOpts:
        | string
        | {
            prompt: string;
            systemInstruction?: string;
            thinkingLevel?: 'low' | 'medium' | 'high';
            images?: Array<{ base64: string; mimeType: string }>;
            videos?: Array<{ base64: string; mimeType: string }>;
            audios?: Array<{ base64: string; mimeType: string }>;
          },
      maybeOpts?: any
    ) => {
      if (typeof promptOrOpts === 'string') {
        return await callFlowBridge('generate.text', [promptOrOpts, maybeOpts || {}]);
      }
      return await callFlowBridge('generate.text', [
        promptOrOpts?.prompt || '',
        promptOrOpts || {},
      ]);
    },
    image: async (options: {
      prompt: string;
      modelDisplayName?: string;
      aspectRatio?: string;
      referenceImageMediaIds?: string[];
    }) => {
      return await callFlowBridge('generate.image', [options]);
    },
    video: async (options: {
      prompt: string;
      modelDisplayName?: string;
      aspectRatio?: string;
      durationSeconds?: number;
      resolution?: string;
      firstFrameImageMediaId?: string;
      lastFrameImageMediaId?: string;
      referenceImageMediaIds?: string[];
      sourceVideoMediaId?: string;
      sourceVideoMode?: 'edit';
      audioReferenceMediaIds?: string[];
    }) => {
      return await callFlowBridge('generate.video', [options]);
    },
    videoExperimental: async (options: {
      prompt: string;
      modelDisplayName?: string;
      aspectRatio?: string;
      firstFrameImageMediaId?: string;
      lastFrameImageMediaId?: string;
      referenceImageMediaIds?: string[];
      sourceVideoMediaId?: string;
      audioReferenceMediaIds?: string[];
      experimentalSettings?: Record<string, any>;
      experimentalMediaInputs?: Record<string, any>;
    }) => {
      return await callFlowBridge('generate.videoExperimental', [options]);
    },
  },
  upload: async (options: { base64: string; mimeType: string; name?: string; fileName?: string }) => {
    return await callFlowBridge('upload', [
      {
        base64: options.base64,
        mimeType: options.mimeType,
        name: options.name || options.fileName || 'Hyperion_Studio_Asset',
      },
    ]);
  },
  save: async (options: { base64: string; mimeType: string; name?: string; prompt?: string }) => {
    return await callFlowBridge('save', [
      {
        base64: options.base64,
        mimeType: options.mimeType,
        name: options.name || options.prompt || 'Hyperion_Studio_Output',
      },
    ]);
  },
  host: {
    /**
     * Điều khiển tính năng gốc "Tạo nhân vật" (Tab Nhân vật - Ảnh 1) trên trang mẹ Google Flow (Đủ 3 phần MEM-10)
     */
    createCharacter: async (options: {
      name: string;
      personality?: string;
      assetQuery?: string;
      portraitAssetQuery?: string;
      bodyAssetQuery?: string;
      assetIndex?: number;
    }) => {
      return await callFlowBridge('host.createCharacter', [options]);
    },
    /**
     * Tạo ảnh Storyboard trực tiếp trên Host Prompt Box của Google Flow bằng cách đính kèm
     * THỰC THỂ NHÂN VẬT (`<flow-character-ingredient-chip>`) từ tab "Nhân vật"
     */
    generateImageWithCharacters: async (options: {
      prompt: string;
      characterNames: string[];
      aspectRatio?: string;
    }) => {
      return await callFlowBridge('host.generateImageWithCharacters', [options]);
    },
    /**
     * Điều khiển tính năng gốc "Cảnh mới" (Tab Cảnh / Scenebuilder - Ảnh 2) trên trang mẹ Google Flow
     */
    createScene: async (options?: {
      clipCount?: number;
      keyword?: string;
    }) => {
      return await callFlowBridge('host.createScene', [options || {}]);
    },
    /**
     * Điều khiển Trình tạo công cụ (Applet Builder) trên Google Flow để nâng cấp/tạo công cụ trực tiếp
     */
    upgradeFlowApplet: async (options: { prompt: string }) => {
      return await callFlowBridge('host.upgradeFlowApplet', [options]);
    },
  },
  media: {
    select: async (options?: { id?: string; filter?: 'image' | 'video' | 'audio' | 'all' }) => {
      return await callFlowBridge('media.select', [options || {}]);
    },
    selectMultiple: async (options?: {
      maxCount?: number;
      filter?: 'image' | 'video' | 'audio' | 'all';
      preSelectedIds?: string[];
    }) => {
      return await callFlowBridge('media.selectMultiple', [options || {}]);
    },
    getBase64: async (options: { mediaId: string }) => {
      return await callFlowBridge('media.getBase64', [options]);
    },
  },
  storage: {
    getItem: async (key: string) => {
      try {
        return await callFlowBridge('storage.getItem', [key]);
      } catch {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      }
    },
    setItem: async (key: string, value: any) => {
      try {
        return await callFlowBridge('storage.setItem', [key, value]);
      } catch {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, String(value));
        }
      }
    },
  },
  download: async (options: { url?: string; base64?: string; filename?: string }) => {
    if (typeof document !== 'undefined' && (options.url || options.base64)) {
      const a = document.createElement('a');
      a.href = options.url || `data:video/mp4;base64,${options.base64}`;
      a.download = options.filename || `Hyperion_Master_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  },
};

// Tự động gắn vào globalThis.Flow để toàn bộ các file khai báo `declare const Flow: any` trong dự án VS Code chạy ngay lập tức
if (typeof globalThis !== 'undefined' && !(globalThis as any).Flow) {
  (globalThis as any).Flow = Flow;
}

export default Flow;
