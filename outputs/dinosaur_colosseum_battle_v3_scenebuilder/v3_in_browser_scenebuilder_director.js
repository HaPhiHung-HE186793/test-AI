/**
 * ============================================================================
 * 🎬 GOOGLE FLOW V3 SCENEBUILDER-FIRST ZERO-HITCH DIRECTOR (BROWSER CONSOLE)
 * ============================================================================
 * Tại sao phải dán đoạn mã này vào Console trên trình duyệt Chrome của bạn?
 * 👉 Vì RPC `fZytfe` (Kéo dài video / VIDEO_EXTEND) của Google Flow bắt buộc phải có
 *    mã bảo mật `grecaptcha.enterprise.execute` sinh ra trực tiếp từ tab Chrome
 *    đang đăng nhập của người dùng (AI Agent bị chặn không được tự giải CAPTCHA).
 *
 * CÁCH CHẠY TRONG 10 GIÂY:
 * 1. Mở link Scene V3 trên trình duyệt Chrome bạn đang đăng nhập:
 *    https://flow.google.com/project/425eb708-ac40-4d8f-aa42-17f1a94e8898/scene/a82b7082-db46-4398-be05-bf08b2336212
 * 2. Nhấn F12 -> chọn tab Console -> Dán toàn bộ nội dung file này vào và nhấn Enter.
 * 3. Gõ lệnh sau để tự động Kéo dài Vòng 1 -> Đợi render xong -> Tự động Auto-Merge Kéo dài Vòng 2:
 *    await FlowV3Director.runAllExtendsAuto()
 * ============================================================================
 */

window.FlowV3Director = (() => {
  const PROJECT_ID = '425eb708-ac40-4d8f-aa42-17f1a94e8898';
  const SCENE_ID = 'a82b7082-db46-4398-be05-bf08b2336212';
  const SITE_KEY = '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV';

  // Chuẩn kiến trúc Monolithic Extend (đã giải mã từ workflow 0fa405ca):
  // - Round 1 cắt bỏ 10 frame đầu (0.42s, v=0) và 24 frame cuối (7.00s..8.00s, nơi khủng long giảm tốc về End Frame),
  //   tức truyền [startFrame = 10, endFrame = 168] để Omni 1.2 Flash Extend (macaron_cookie_extend_10s) nối tiếp
  //   ngay tại đỉnh vận tốc (v > 0) và gộp (Auto-Merge) thành 1 video nguyên khối ~16.6s!
  // - Round 2 truyền [startFrame = 0, endFrame = 372] (15.5s) để nối tiếp ngay trên đà đánh của Vòng 1,
  //   gộp thành 1 video nguyên khối ~25.5s không có bất kỳ điểm dừng nào!
  const CLUSTERS = [
    {
      clusterIndex: 1,
      clusterId: 'C01_ACT1_IGNIS_REX_ARRIVAL',
      workflowId: '8312d69d-d36f-4893-b2a0-7b39d16ec725',
      seedPrimaryMediaId: 'a66c330d-835e-4671-8d84-ceb0b0d31dd6',
      cutOnActionTrim: [0, 16],
      round1: {
        extendId: 'EXT_1_1',
        modelKey: 'macaron_cookie_extend_10s',
        startFrame: 10,
        endFrame: 168,
        prompt:
          'Continuing seamlessly from the previous frame with zero velocity drop inside the 3-tier Roman Basalt Colosseum at fiery crimson-orange sunset, the charcoal-black Tyrannosaurus Rex with burnt-orange dorsal stripes on the left finishes its earth-shattering roar, lowers its massive head into an aggressive combat crouch facing right, and stomps powerfully forward across the flat dark volcanic sand and shallow water puddle as pressurized white steam vents from its nostrils. The 35mm eye-level camera tracks smoothly with heavy footstep tremor as torch braziers blaze in the stone archways behind it. Deep seismic footstep impacts, hissing nostril steam, and guttural T-Rex growl, no music, no human voices, no text or HUD.',
      },
      round2: null,
    },
    {
      clusterIndex: 2,
      clusterId: 'C02_ACT1_LEVIATHAN_SPINO_CHALLENGE',
      workflowId: '6dc06dca-55ca-420b-9b50-f519aa0e5082',
      seedPrimaryMediaId: 'd6cc96f6-eb86-4987-9377-5eb2585cad0c',
      cutOnActionTrim: [0, 16],
      round1: {
        extendId: 'EXT_2_1',
        modelKey: 'macaron_cookie_extend_10s',
        startFrame: 10,
        endFrame: 168,
        prompt:
          'Continuing seamlessly from the previous frame with zero velocity drop inside the 3-tier Roman Basalt Colosseum at fiery crimson-orange sunset, the towering slate-teal Spinosaurus with its 2.2-meter orange-and-bronze dorsal sail and crocodile-like snout on the right facing left steps aggressively forward into the shallow water puddle, flexes its muscular three-fingered reptilian forelimbs, and unleashes a ferocious crocodilian bellow toward the left. Pure biological dinosaur anatomy, zero metal blades or weapons. The 35mm eye-level camera performs a tense lateral dolly movement capturing water ripples and blazing stadium braziers. Deep guttural amphibious roar, heavy splashing footsteps, and snapping jaws, no music, no human voices, no text or HUD.',
      },
      round2: null,
    },
    {
      clusterIndex: 3,
      clusterId: 'C03_ACT2A_20TON_COLLISION_JAWLOCK',
      workflowId: '5aa8dd0c-ac89-4c83-8f77-06160e25c870',
      seedPrimaryMediaId: 'b665f2e4-f3b9-4285-b577-5e3a57c14cbb',
      cutOnActionTrim: [0, 22],
      round1: {
        extendId: 'EXT_3_1',
        modelKey: 'macaron_cookie_extend_10s',
        startFrame: 10,
        endFrame: 168,
        prompt:
          'Continuing seamlessly from the full-momentum 20-ton collision in the previous frame inside the 3-tier Roman Basalt Colosseum at fiery sunset, the charcoal-black Tyrannosaurus Rex on the left and the slate-teal crocodile-snouted Spinosaurus with its orange-bronze dorsal sail on the right lock jaws and shoulders at the center of the dark volcanic sand arena, shoving violently against each other as clouds of dust and mud spray outward. Pure biological dinosaur anatomy, zero weapons. The 35mm eye-level camera pushes in with kinetic impact shake as the T-Rex snaps its jaws at the Spinosaurus neck while the Spinosaurus parries with its natural three-fingered forelimb. Crushing bone impact, grinding scales, and twin apex roars, no music, no human voices, no text or HUD.',
      },
      round2: {
        extendId: 'EXT_3_2',
        modelKey: 'macaron_cookie_extend_8s',
        startFrame: 0,
        endFrame: 372,
        prompt:
          'Continuing seamlessly from the jaw-lock grapple with zero velocity drop inside the 3-tier Roman Basalt Colosseum at fiery sunset, the towering slate-teal crocodile-snouted Spinosaurus with its orange-bronze dorsal sail on the right violently wrenches its head free and drives its massive muscular shoulder forward, shoving the charcoal-black Tyrannosaurus Rex backward across the wet dark volcanic sand floor so its hind claws gouge deep tracks through the mud puddles. Strictly one Tyrannosaurus Rex on the left and one Spinosaurus on the right, pure biological anatomy. The 35mm eye-level camera tracks laterally alongside the sliding titans. Heavy skidding mud friction, guttural snarls, and stadium fire roar, no music, no human voices, no text or HUD.',
      },
    },
    {
      clusterIndex: 4,
      clusterId: 'C04_ACT2A_SPINO_HYDRO_CLAW_DOMINANCE',
      workflowId: 'f388dbda-867b-4cbb-b7fa-81325d1ac043',
      seedPrimaryMediaId: '49729867-c146-4c28-8386-f590161a7bfb',
      cutOnActionTrim: [0, 18],
      round1: {
        extendId: 'EXT_4_1',
        modelKey: 'macaron_cookie_extend_10s',
        startFrame: 10,
        endFrame: 168,
        prompt:
          'Continuing seamlessly from the previous frame inside the 3-tier Roman Basalt Colosseum at fiery sunset, the towering slate-teal crocodile-snouted Spinosaurus with its orange-bronze dorsal sail on the right lunges forward and slashes its natural three-fingered reptilian foreclaws across the snout and shoulder of the single charcoal-black Tyrannosaurus Rex kneeling on the left, shoving the T-Rex backward through the shallow mud puddle as both dinosaurs roar fiercely at each other. Strictly one Tyrannosaurus Rex on the left and one Spinosaurus on the right, pure biological dinosaur anatomy, zero extra heads, zero duplicate limbs. The 35mm eye-level camera tracks the brutal close-quarters exchange. Heavy claw impact, splashing mud, and ferocious dinosaur roars, no music, no human voices, no text or HUD.',
      },
      round2: null,
    },
    {
      clusterIndex: 5,
      clusterId: 'C05_ACT2B_CRIMSON_OVERDRIVE_COUNTER',
      workflowId: 'b723ec82-6a18-4840-92b5-75c2dcf5946e',
      seedPrimaryMediaId: '8c34df19-b9cb-4d8d-84a3-1356b9e57c68',
      cutOnActionTrim: [0, 24],
      round1: {
        extendId: 'EXT_5_1',
        modelKey: 'macaron_cookie_extend_10s',
        startFrame: 10,
        endFrame: 168,
        prompt:
          'Continuing seamlessly from the counter-surge in the previous frame inside the 3-tier Roman Basalt Colosseum at fiery sunset, the charcoal-black Tyrannosaurus Rex on the left drives forward with explosive power and clamps its massive 12,800 PSI jaws tightly around the throat of the slate-teal crocodile-snouted Spinosaurus with the orange-bronze dorsal sail on the right, violently wrenching its muscular neck to push the Spinosaurus backward across the dark volcanic sand floor. Pure biological dinosaur anatomy. The 35mm eye-level camera tracks the brutal jaw-lock grapple as dust swirls around their feet. Bone-crushing jaw snap, shocked crocodilian screech, and heavy thrashing footsteps, no music, no human voices, no text or HUD.',
      },
      round2: {
        extendId: 'EXT_5_2',
        modelKey: 'macaron_cookie_extend_10s',
        startFrame: 0,
        endFrame: 372,
        prompt:
          'Continuing seamlessly from the throat-clamp grapple with zero velocity drop inside the 3-tier Roman Basalt Colosseum at fiery sunset, the charcoal-black Tyrannosaurus Rex on the left keeps its massive 12,800 PSI jaws locked onto the neck of the slate-teal crocodile-snouted Spinosaurus with the orange-bronze dorsal sail on the right, wrenching its muscular neck to lift and violently slam the Spinosaurus down onto the dark volcanic sand arena floor in a massive shockwave of dust and mud. Strictly one Tyrannosaurus Rex on the left and one Spinosaurus on the right. Tight 35mm kinetic tracking shot following the brutal takedown slam. Earth-shattering body slam impact, bone-crushing jaw pressure, and agonizing reptilian roar, no music, no human voices, no text or HUD.',
      },
    },
    {
      clusterIndex: 6,
      clusterId: 'C06_ACT3_SEISMIC_FINISHER_VICTORY',
      workflowId: '6284056f-0b2a-4b50-b4d1-fe3ac47852ab',
      seedPrimaryMediaId: '604f264b-9d52-4046-88c5-8c7219435681',
      cutOnActionTrim: [0, 24],
      round1: {
        extendId: 'EXT_6_1',
        modelKey: 'macaron_cookie_extend_10s',
        startFrame: 10,
        endFrame: 168,
        prompt:
          'Continuing seamlessly from the body slam in the previous frame inside the 3-tier Roman Basalt Colosseum at fiery sunset, the defeated slate-teal Spinosaurus collapses motionless onto its side on the dark volcanic sand floor on the right, while the victorious charcoal-black Tyrannosaurus Rex on the left steps forward and plants its massive three-toed hind foot firmly onto the fallen Spinosaurus flank amidst swirling dust. The 35mm eye-level camera cranes slightly upward toward the towering T-Rex silhouette against the blazing torchlit stone archways. Heavy body collapse impact, decisive foot stomp, and deep victorious breathing, no music, no human voices, no text or HUD.',
      },
      round2: {
        extendId: 'EXT_6_2',
        modelKey: 'macaron_cookie_extend_10s',
        startFrame: 0,
        endFrame: 372,
        prompt:
          'Continuing seamlessly from the previous frame inside the 3-tier Roman Basalt Colosseum at fiery crimson-orange sunset, the victorious charcoal-black Tyrannosaurus Rex stands tall with its massive hind foot planted firmly atop the motionless defeated slate-teal Spinosaurus lying flat on the dark volcanic sand floor, throws its scarred head skyward, and unleashes a prolonged, earth-shaking championship alpha roar as torch braziers blaze across the three tiers of stone archways behind them and the 28mm wide camera executes a majestic slow pull-back. Prolonged earth-shaking Tyrannosaurus victory roar echoing across the stone amphitheater, deep sub-bass rumble, and crackling fire, no music, no human voices, no text or HUD.',
      },
    },
  ];

  function getAtToken() {
    if (window.WIZ_global_data && window.WIZ_global_data.SNlM0e) {
      return window.WIZ_global_data.SNlM0e;
    }
    const scripts = Array.from(document.querySelectorAll('script'));
    for (const s of scripts) {
      const m = (s.textContent || '').match(/"SNlM0e":"([^"]+)"/);
      if (m) return m[1];
    }
    throw new Error('Không tìm thấy XSRF token SNlM0e. Hãy chắc chắn bạn đang mở tab https://flow.google.com');
  }

  async function callRpc(rpcId, payloadArray) {
    const at = getAtToken();
    const body = new URLSearchParams({
      'f.req': JSON.stringify([[[rpcId, JSON.stringify(payloadArray), null, 'generic']]]),
      at,
    });
    const res = await fetch(
      `/_/AiSandboxAngularFrontend/data/batchexecute?rpcids=${encodeURIComponent(rpcId)}&hl=vi&rt=c`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: body.toString(),
        credentials: 'include',
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

  async function getRecaptchaToken() {
    if (!window.grecaptcha || !window.grecaptcha.enterprise) {
      throw new Error('grecaptcha.enterprise chưa sẵn sàng trên trang này.');
    }
    return await window.grecaptcha.enterprise.execute(SITE_KEY, { action: 'VIDEO_GENERATION' });
  }

  async function getSceneWorkflowState() {
    const res = await callRpc('Zzl0ze', [`projects/${PROJECT_ID}`, null, null, null, [1]]);
    if (!res.ok || !Array.isArray(res.data)) {
      throw new Error('Không đọc được dữ liệu Project qua Zzl0ze');
    }
    const workflows = res.data[1] || [];
    const mediaList = res.data[2] || [];
    const wfMap = new Map(workflows.map(w => [w[0], w]));
    const mediaByWf = new Map();
    for (const m of mediaList) {
      const wfId = m[2];
      if (!mediaByWf.has(wfId)) mediaByWf.set(wfId, []);
      mediaByWf.get(wfId).push({
        mediaId: m[0],
        workflowId: m[2],
        createdAt: m[5]?.[0]?.[0] ?? 0,
        prompt: m[5]?.[1] ?? '',
        status: m[5]?.[8]?.[0] ?? null, // 3 = COMPLETED, 6 = GENERATING
        durationSec: m[7]?.[1]?.[2]?.[0] ?? 8,
        sourceVideoMediaId: m[5]?.[6]?.[1]?.[2]?.[0]?.[3] ?? null,
      });
    }
    return CLUSTERS.map(c => {
      const wf = wfMap.get(c.workflowId);
      const primaryMediaId = wf?.[3]?.[4] ?? c.seedPrimaryMediaId;
      const items = (mediaByWf.get(c.workflowId) || []).sort((a, b) => b.createdAt - a.createdAt);
      return {
        ...c,
        currentPrimaryMediaId: primaryMediaId,
        latestMedia: items[0] || null,
        allMedia: items,
      };
    });
  }

  /**
   * Hàm lõi Pkc (In-SceneBuilder Monolithic Extend into existing workflowId)
   * aspectRatio = 2 (16:9 Landscape), startFrame..endFrame cắt bỏ đoạn v=0 để gộp nguyên khối 0 độ khựng!
   */
  async function extendInSceneWorkflow({
    workflowId,
    sourceVideoMediaId,
    startFrame = 0,
    endFrame = 168,
    modelKey = 'macaron_cookie_extend_10s',
    prompt,
    scenePosition,
  }) {
    const recaptchaToken = await getRecaptchaToken();
    const mediaSeed = crypto.randomUUID();
    const batchId = crypto.randomUUID();
    const destinationMeta = [SCENE_ID, workflowId, null, null, mediaSeed];
    const item = [
      [null, sourceVideoMediaId, startFrame, endFrame],
      [null, null, [[[prompt]]]],
      modelKey,
      2, // 2 = 16:9 Landscape chuẩn của Omni 1.2 Flash Extend!
      null,
      destinationMeta,
      null,
      null,
      [],
      [],
      [],
      [],
      null,
    ];
    const k = [null, 22, null, null, null, PROJECT_ID, null, null, null, null, [recaptchaToken, 1]];
    const x = [batchId, 1, null, [SCENE_ID, scenePosition]];
    return await callRpc('fZytfe', [[item], k, x]);
  }

  async function updateSceneClipPrimaryAndTrim({ workflowId, primaryMediaId = null, startSec = null, endSec = null }) {
    const toDurationTuple = sec => {
      if (sec == null) return null;
      const whole = Math.floor(sec);
      const nanos = Math.round((sec - whole) * 1e9);
      return [whole === 0 ? null : whole, nanos === 0 ? null : nanos];
    };
    const mask = [];
    if (primaryMediaId) mask.push('workflow.metadata.primary_media_id');
    if (startSec != null) mask.push('scene_workflow_metadata.start_time');
    if (endSec != null) mask.push('scene_workflow_metadata.end_time');
    const wfObj = [
      workflowId,
      null,
      null,
      primaryMediaId ? [null, null, null, null, primaryMediaId] : null,
      PROJECT_ID,
    ];
    const sceneWfMeta =
      startSec != null || endSec != null
        ? [null, null, toDurationTuple(startSec), toDurationTuple(endSec)]
        : null;
    const payload = [[wfObj, SCENE_ID, sceneWfMeta], [mask]];
    return await callRpc('dtQlBe', payload);
  }

  async function runRound1Extends() {
    console.log('🎬 [FlowV3Director] Bắt đầu Vòng 1: Kéo dài 6 Cluster ngay trong SceneBuilder (EXT_1_1 -> EXT_6_1)...');
    const results = [];
    for (let i = 0; i < CLUSTERS.length; i++) {
      const c = CLUSTERS[i];
      console.log(`⏳ [${c.clusterId}] Đang gửi lệnh ${c.round1.extendId} (${c.round1.modelKey}, frames ${c.round1.startFrame}..${c.round1.endFrame})...`);
      const res = await extendInSceneWorkflow({
        workflowId: c.workflowId,
        sourceVideoMediaId: c.seedPrimaryMediaId,
        startFrame: c.round1.startFrame,
        endFrame: c.round1.endFrame,
        modelKey: c.round1.modelKey,
        prompt: c.round1.prompt,
        scenePosition: i,
      });
      const newMediaId = res.data?.[0]?.[0]?.[0]?.[0] || null;
      console.log(`✅ [${c.clusterId}] Đã khởi tạo ${c.round1.extendId} -> newMediaId: ${newMediaId}`, res);
      if (newMediaId) {
        await updateSceneClipPrimaryAndTrim({
          workflowId: c.workflowId,
          primaryMediaId: newMediaId,
        });
      }
      results.push({ clusterId: c.clusterId, extendId: c.round1.extendId, newMediaId, ok: res.ok });
      await new Promise(r => setTimeout(r, 1500));
    }
    console.table(results);
    return results;
  }

  async function waitForAllCompleted(label = 'Round') {
    while (true) {
      const state = await getSceneWorkflowState();
      const pending = state.filter(c => c.latestMedia && c.latestMedia.status !== 3);
      console.log(
        `⏳ [${label}] Đang đợi render: ${6 - pending.length}/6 hoàn tất (${state.map(c => `${c.clusterIndex}:${c.latestMedia?.durationSec || 8}s[st=${c.latestMedia?.status}]`).join(', ')})`
      );
      if (pending.length === 0) {
        for (const c of state) {
          if (c.latestMedia && c.currentPrimaryMediaId !== c.latestMedia.mediaId) {
            await updateSceneClipPrimaryAndTrim({
              workflowId: c.workflowId,
              primaryMediaId: c.latestMedia.mediaId,
            });
          }
        }
        console.log(`🎉 [${label}] Cả 6 Cluster đã render COMPLETED (status=3)!`);
        return state;
      }
      await new Promise(r => setTimeout(r, 6000));
    }
  }

  async function runRound2AutoMergeExtends() {
    console.log('🎬 [FlowV3Director] Bắt đầu Vòng 2 (Auto-Merge Vòng 1 + Kéo dài EXT_3_2, EXT_5_2, EXT_6_2)...');
    const state = await getSceneWorkflowState();
    const results = [];
    for (const c of state) {
      if (!c.round2) continue;
      const r1MediaId = c.latestMedia?.mediaId || c.currentPrimaryMediaId;
      if (r1MediaId === c.seedPrimaryMediaId) {
        console.warn(`⚠️ [${c.clusterId}] Chưa có clip Vòng 1, bỏ qua!`);
        continue;
      }
      const actualFrames = Math.floor((c.latestMedia?.durationSec || 16) * 24);
      const endFrameToUse = Math.min(c.round2.endFrame, Math.max(192, actualFrames - 20));
      console.log(`⏳ [${c.clusterId}] Auto-Merge ${r1MediaId} & gửi lệnh ${c.round2.extendId} (frames 0..${endFrameToUse})...`);
      const res = await extendInSceneWorkflow({
        workflowId: c.workflowId,
        sourceVideoMediaId: r1MediaId,
        startFrame: 0,
        endFrame: endFrameToUse,
        modelKey: c.round2.modelKey,
        prompt: c.round2.prompt,
        scenePosition: c.clusterIndex - 1,
      });
      const newMediaId = res.data?.[0]?.[0]?.[0]?.[0] || null;
      if (newMediaId) {
        await updateSceneClipPrimaryAndTrim({
          workflowId: c.workflowId,
          primaryMediaId: newMediaId,
        });
      }
      console.log(`✅ [${c.clusterId}] Đã khởi tạo ${c.round2.extendId} -> newMediaId: ${newMediaId}`);
      results.push({ clusterId: c.clusterId, extendId: c.round2.extendId, sourceR1MediaId: r1MediaId, newMediaId });
      await new Promise(r => setTimeout(r, 1500));
    }
    console.table(results);
    return results;
  }

  async function runAllExtendsAuto() {
    await runRound1Extends();
    await waitForAllCompleted('Vòng 1 Extend');
    await runRound2AutoMergeExtends();
    await waitForAllCompleted('Vòng 2 Auto-Merge Extend');
    console.log('🏆 HOÀN TẤT TOÀN BỘ 9 LỆNH KÉO DÀI (EXTEND) TRONG SCENEBUILDER! Hãy báo cho AI Agent để tải & xuất file MP4 Master!');
  }

  async function checkStatus() {
    const state = await getSceneWorkflowState();
    const rows = state.map(c => ({
      idx: c.clusterIndex,
      clusterId: c.clusterId,
      primaryMediaId: c.currentPrimaryMediaId,
      latestMediaId: c.latestMedia?.mediaId || null,
      status: c.latestMedia?.status === 3 ? '✅ COMPLETED (3)' : `⏳ STATUS_${c.latestMedia?.status}`,
      durationSec: c.latestMedia?.durationSec || 8,
      takesCount: c.allMedia.length,
    }));
    console.table(rows);
    return rows;
  }

  console.log('✅ Đã nạp thành công FlowV3Director (Monolithic Extend v>0) cho Scene a82b7082-db46-4398-be05-bf08b2336212!');
  console.log('👉 Chạy tự động trọn gói Vòng 1 + Vòng 2: await FlowV3Director.runAllExtendsAuto()');
  return {
    CLUSTERS,
    getSceneWorkflowState,
    runRound1Extends,
    runRound2AutoMergeExtends,
    runAllExtendsAuto,
    checkStatus,
  };
})();
