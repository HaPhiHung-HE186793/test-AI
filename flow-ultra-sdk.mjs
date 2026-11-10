import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const RECAPTCHA_SITE_KEY = '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV';

/**
 * Bảng mã RPC chính thức của Google Flow (trích xuất từ module m=wO1vlb & m=m38dl)
 */
export const FLOW_RPC_IDS = {
  GET_CREDITS: 'nzlxg',          // Kiểm tra 25.000 Credits (Google AI Ultra)
  GET_MODEL_CATALOG: 'HTrJv',    // Lấy toàn bộ danh sách Model Keys (Omni 1.2 Flash, Veo 3.1, Nano Banana)
  GET_PROJECT_FULL: 'Zzl0ze',    // Lấy toàn bộ Media, Workflows, Scenes, Clips trong Project
  GET_PROJECT_INFO: 'ngNC2',     // Lấy metadata của Project
  GET_MEDIA_BY_ID: 'as29s',      // Lấy chi tiết 1 Media theo ID
  POLL_MEDIA_STATUS: 'jwpduf',   // Polling % tiến độ render Video/Ảnh (mỗi 5s)
  TEXT_TO_VIDEO: 'YhhmEf',       // Tạo video từ Text
  REFERENCES_TO_VIDEO: 'MZZa6b', // Tạo video từ Ảnh/Nhân vật tham chiếu (Ingredients / R2V)
  START_FRAME_VIDEO: 'eb1hJf',   // Tạo video từ Khung hình đầu (First Frame)
  START_END_VIDEO: 'nprQif',     // Tạo video từ Khung hình đầu & cuối (Start + End Keyframes)
  EDIT_VIDEO: 'jIps6',           // Chỉnh sửa video ("Mô tả cách chỉnh sửa video này...")
  EXTEND_VIDEO: 'fZytfe',        // Kéo dài video ("Kéo dài: trận chiến tiếp tục" - Omni 1.2 Flash)
  UPSAMPLE_VIDEO: 'p0UkFb',      // Nâng cấp độ phân giải Video (1080p / 4K)
  EXPORT_VIDEO_START: 'GjQLTd',  // Khởi tạo Job xuất file MP4 gốc (Tsb)
  EXPORT_VIDEO_POLL: 'IxdSwd',   // Lấy dữ liệu nhị phân MP4 Base64 (Usb -> field 5)
  GENERATE_IMAGE: 'Z9cAtf',      // Tạo ảnh Nano Banana Pro (0 Credit)
  SCENE_GET: 'no0P6',            // Đọc SceneBuilder
  SCENE_UPDATE: 'lt8g5',         // Cập nhật Timeline SceneBuilder
};

export class FlowUltraSdk {
  constructor({ cookie, atToken, cdpPort = 9222 } = {}) {
    this.cookie = cookie || '';
    this.atToken = atToken || '';
    this.cdpPort = cdpPort;
    this.userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  }

  /**
   * Gọi bất kỳ RPC nào của Google Flow qua giao thức batchexecute
   */
  async callBatchExecute(rpcId, payloadArray) {
    const params = new URLSearchParams({
      'f.req': JSON.stringify([[[rpcId, JSON.stringify(payloadArray), null, 'generic']]]),
    });
    if (this.atToken) {
      params.set('at', this.atToken);
    }

    const res = await fetch(
      `https://flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute?rpcids=${encodeURIComponent(rpcId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Cookie: this.cookie,
          'User-Agent': this.userAgent,
        },
        body: params.toString(),
      }
    );

    const text = await res.text();
    const match = text.match(new RegExp(`\\["wrb\\.fr","${rpcId}","((?:\\\\.|[^"\\\\])*)"`));
    if (match) {
      const innerJson = JSON.parse(`"${match[1]}"`);
      return { ok: true, status: res.status, data: JSON.parse(innerJson), raw: text };
    }
    return { ok: false, status: res.status, data: null, raw: text };
  }

  /**
   * 1. Kiểm tra số dư 25.000 Credits (rpcids=nzlxg) - KHÔNG cần mở trình duyệt, KHÔNG cần reCAPTCHA
   */
  async getCredits() {
    const res = await this.callBatchExecute(FLOW_RPC_IDS.GET_CREDITS, []);
    if (!res.ok || !Array.isArray(res.data)) {
      throw new Error(`Không lấy được Credits: ${res.raw.slice(0, 200)}`);
    }
    return {
      subscriptionCredits: res.data[0] ?? 0,
      paygateTier: res.data[1] ?? null,
      topUpCredits: res.data[4] ?? 0,
      totalCredits: res.data[5] ?? res.data[0] ?? 0,
      resetTimestamp: res.data[6]?.[0] ?? null,
    };
  }

  /**
   * 2. Đọc toàn bộ dữ liệu Project & Scene (rpcids=Zzl0ze) - KHÔNG cần mở trình duyệt, KHÔNG cần reCAPTCHA
   */
  async getProjectFull(projectId) {
    const res = await this.callBatchExecute(FLOW_RPC_IDS.GET_PROJECT_FULL, [
      `projects/${projectId}`,
      null,
      null,
      null,
      [1],
    ]);
    if (!res.ok || !Array.isArray(res.data)) {
      throw new Error(`Không đọc được Project ${projectId}: ${res.raw.slice(0, 200)}`);
    }
    const workflows = res.data[1] || [];
    const mediaItems = (res.data[2] || []).map(item => ({
      mediaId: item[0],
      projectId: item[1],
      workflowId: item[2],
      prompt: item[5]?.[1] ?? '',
      videoUrl: item[5]?.[5] ?? item[5]?.[10] ?? null,
      status: item[5]?.[8]?.[0] ?? null, // 3 = COMPLETED, 6 = GENERATING
      modelFamily: item[5]?.[6]?.[1]?.[0]?.[0] ?? null,
      modelKey: item[7]?.[0]?.[12] ?? null,
      sourceVideoMediaId: item[5]?.[6]?.[1]?.[2]?.[0]?.[3] ?? null,
    }));
    const scenes = (res.data[4] || []).map(s => ({
      sceneId: s[0],
      title: s[1],
      aspectRatio: s[5],
    }));
    const sceneClips = res.data[6] || [];
    return { workflows, mediaItems, scenes, sceneClips };
  }

  /**
   * 3. Polling tiến độ render của danh sách mediaIds (rpcids=jwpduf) - KHÔNG cần reCAPTCHA
   */
  async pollMediaStatus(mediaIds) {
    const items = mediaIds.map(id => [id]);
    return this.callBatchExecute(FLOW_RPC_IDS.POLL_MEDIA_STATUS, [null, null, items]);
  }

  /**
   * 4. Xuất & Tải file Video MP4 gốc (ftypisom / avc1mp41) qua 2 RPC chính thức GjQLTd & IxdSwd
   */
  async downloadVideoByMediaId(mediaId, outputPath, durationSec = 4) {
    const startRes = await this.callBatchExecute(FLOW_RPC_IDS.EXPORT_VIDEO_START, [
      [[mediaId, null, [0], [durationSec]]],
    ]);
    const job = startRes.data?.[1];
    if (!job) {
      throw new Error(`Không khởi tạo được Job xuất MP4 cho mediaId ${mediaId}: ${startRes.raw.slice(0, 200)}`);
    }

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await this.callBatchExecute(FLOW_RPC_IDS.EXPORT_VIDEO_POLL, [job]);
      const base64Mp4 = pollRes.data?.[4];
      if (typeof base64Mp4 === 'string' && base64Mp4.length > 100) {
        const buffer = Buffer.from(base64Mp4, 'base64');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, buffer);
        return {
          outputPath,
          bytes: buffer.length,
          headerAscii: buffer.subarray(4, 12).toString('ascii'),
        };
      }
    }
    throw new Error(`Hết thời gian chờ xuất file MP4 cho mediaId ${mediaId}`);
  }

  /**
   * 5. Tạo Video từ Text bằng Omni 1.2 Flash / Veo 3.1 (rpcids=YhhmEf)
   *    Đã kiểm chứng chạy thực tế thành công 100%!
   */
  async generateTextToVideo({
    projectId,
    workflowId = null,
    sceneId = null,
    prompt,
    modelKey = 'macaron_cookie_t2v_4s', // hoặc macaron_cookie_t2v_6s, macaron_cookie_t2v_8s, macaron_cookie_t2v_4s_360p
    aspectRatio = 1, // 1 = 16:9, 2 = 9:16
    resolution = 1,  // 1 = 720p (default), 4 = 360p
    recaptchaToken,
  }) {
    if (!recaptchaToken) {
      throw new Error('Cần truyền recaptchaToken (grecaptcha.enterprise.execute với action VIDEO_GENERATION)');
    }
    const mediaSeed = crypto.randomUUID();
    const wfSeed = workflowId ? null : crypto.randomUUID();
    const batchId = crypto.randomUUID();

    const destinationMeta = [sceneId, workflowId, null, null, mediaSeed, ...(wfSeed ? [wfSeed] : [])];
    const resolutionField = resolution && resolution !== 1 ? [resolution] : null;
    const item = [
      [null, null, [[[prompt]]]],
      modelKey,
      aspectRatio,
      null,
      destinationMeta,
      null,
      null,
      resolutionField,
    ];
    const k = [null, 22, null, null, null, projectId, null, null, null, null, [recaptchaToken, 1]];
    const x = [batchId, 1];

    return this.callBatchExecute(FLOW_RPC_IDS.TEXT_TO_VIDEO, [[item], k, x]);
  }

  /**
   * 6. Kéo dài Video (EXTEND_VIDEO - rpcids=fZytfe) bằng Omni 1.2 Flash ("macaron_cookie_extend_4s")
   *    Lưu ý: Kf và og là cửa sổ 24 frames cuối của clip gốc (ví dụ clip 5s @ 24fps => endFrame=120, Kf=97, og=120)
   */
  async extendVideo({
    projectId,
    workflowId = null,
    sceneId = null,
    sourceVideoMediaId,
    prompt,
    endFrame = 120,
    modelKey = 'macaron_cookie_extend_4s',
    aspectRatio = 1,
    resolution = 1,
    scenePosition = null,
    recaptchaToken,
  }) {
    if (!recaptchaToken) {
      throw new Error('Cần truyền recaptchaToken (grecaptcha.enterprise.execute với action VIDEO_GENERATION)');
    }
    const mediaSeed = crypto.randomUUID();
    const wfSeed = workflowId ? null : crypto.randomUUID();
    const batchId = crypto.randomUUID();
    const startFrame = Math.max(0, endFrame - 23);

    const destinationMeta = [sceneId, workflowId, null, null, mediaSeed, ...(wfSeed ? [wfSeed] : [])];
    const resolutionField = resolution && resolution !== 1 ? [resolution] : null;
    const item = [
      [null, sourceVideoMediaId, startFrame, endFrame],
      [null, null, [[[prompt]]]],
      modelKey,
      aspectRatio,
      null,
      destinationMeta,
      null,
      null,
      [],
      [],
      [],
      [],
      resolutionField,
    ];
    const k = [null, 22, null, null, null, projectId, null, null, null, null, [recaptchaToken, 1]];
    const x = sceneId && scenePosition != null ? [batchId, 1, null, [sceneId, scenePosition]] : [batchId, 1];

    return this.callBatchExecute(FLOW_RPC_IDS.EXTEND_VIDEO, [[item], k, x]);
  }
}
