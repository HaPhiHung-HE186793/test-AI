import { StarterTemplatePreset, TimelineShot, WorldEntity, EnvironmentStage } from '../types/cinemaCore';
import { buildAutoBoundReferenceSlots } from '../services/autoBindIngredients';

export const STARTER_TEMPLATES: StarterTemplatePreset[] = [
  {
    id: 'template_mecha_scifi',
    name: '🤖 Mẫu 1: Phim Hành Động Mecha/Sci-Fi',
    icon: 'smart_toy',
    badge: 'BOM TẤN HÀNH ĐỘNG',
    description: 'Nhịp độ dồn dập, góc máy đại cảnh 16mm kết hợp cú lia cận cảnh vỡ giáp và phóng tên lửa liên hoàn.',
    rawScript: 'ARES-09 hạ cánh thẳng xuống bến cảng Orbital Dock. Vừa trúng tên lửa EMP tầm nhiệt, giáp ngực bị xé toạc tóe tia lửa điện. Đột ngột quay ngoắt đại bác Plasma bắn trả tiêu diệt phi đội tàng hình đối phương!',
    pacingStyle: 'martial_arts_fast',
    aspectRatio: '16:9',
    defaultLens: '24mm_Anamorphic_Action',
    suggestedEntityName: 'ARES-09 EXODUS',
    suggestedStageName: 'ORBITAL DOCK SIGMA-9',
  },
  {
    id: 'template_tvc_ads',
    name: '🛍️ Mẫu 2: Video Quảng Cáo Bán Hàng (TVC/TikTok)',
    icon: 'shopping_bag',
    badge: 'VIRAL COMMERCE 9:16',
    description: 'Tỷ lệ dọc 9:16, 3 giây đầu giật gân thu hút sự chú ý, trình diễn góc quay 360 độ siêu nét sản phẩm cao cấp.',
    rawScript: 'Ống kính Macro 85mm trượt chậm trên bề mặt hợp kim sang trọng, ánh sáng studio lướt qua logo phát sáng. Ngay lập tức người mẫu kích hoạt tính năng với hiệu ứng holographic 3D mãn nhãn, thôi thúc mua ngay.',
    pacingStyle: 'slow_suspense',
    aspectRatio: '9:16',
    defaultLens: '85mm_Dramatic_CloseUp',
    suggestedEntityName: 'COMMANDER KAIEN VAL',
    suggestedStageName: 'ORBITAL DOCK SIGMA-9',
  },
  {
    id: 'template_storytelling',
    name: '🎬 Mẫu 3: Video Kể Chuyện / Giải Trí Ngắn',
    icon: 'local_movies',
    badge: 'CINEMATIC STORY',
    description: 'Góc máy điện ảnh 50mm tự nhiên, chuyển cảnh mượt mà theo cảm xúc nhân vật và cao trào cốt truyện.',
    rawScript: 'Người phi công đứng cô độc nhìn qua ô kính buồng lái xuống thành phố Neo Shinjuku chìm trong mưa axit. Tiếng còi báo động réo rắt báo hiệu cuộc xâm lăng sắp bắt đầu, anh siết chặt tay lái quyết tử.',
    pacingStyle: 'slow_suspense',
    aspectRatio: '16:9',
    defaultLens: '50mm_Cinematic',
    suggestedEntityName: 'COMMANDER KAIEN VAL',
    suggestedStageName: 'SHINJUKU SECTOR 04 CATACLYSM',
  },
];

export function instantiateTemplateShots(
  template: StarterTemplatePreset,
  entities: WorldEntity[],
  stages: EnvironmentStage[]
): TimelineShot[] {
  const chosenEntity = entities.find((e) => e.name.includes(template.suggestedEntityName)) || entities[0];
  const chosenStage = stages.find((s) => s.name.includes(template.suggestedStageName)) || stages[0];

  if (template.id === 'template_tvc_ads') {
    return [
      {
        id: 'shot_tvc_01',
        shotNumber: 1,
        sceneHeading: 'HOOK 3S: BẬT MỞ SẢN PHẨM HOÀNG GIA',
        scriptDescription: 'Camera macro cận cảnh lướt nhanh qua chi tiết hợp kim và đèn LED neon phát sáng cực ngầu.',
        targetDurationSeconds: 4,
        lensPreset: '85mm_Dramatic_CloseUp',
        cameraMovement: 'Fast macro push-in with anamorphic flare',
        cameraTransitionType: 'HARD_CUT_NEW_ANGLE',
        primaryEntityId: chosenEntity?.id,
        entityStateUsed: 'pristine_normal',
        environmentStageId: chosenStage?.id,
        keyframePrompt: 'High-end luxury commercial establishing shot, glossy finish, cinematic studio lighting.',
        referenceSlots: buildAutoBoundReferenceSlots(chosenEntity?.id, 'pristine_normal', chosenStage?.id, entities, stages),
        activePrompt: 'Ultra-luxurious commercial macro shot of advanced tech product, smooth studio lighting, 9:16 vertical video.',
        takes: [],
        audioSpec: { sfxLayer: 'Modern electronic chime, crisp swoosh impact' },
      },
      {
        id: 'shot_tvc_02',
        shotNumber: 2,
        sceneHeading: 'SHOWCASE: TRÌNH DIỄN ĐA GÓC NHÌN',
        scriptDescription: 'Xoay 360 độ thể hiện khả năng hoạt động đỉnh cao, giải quyết trọn vẹn nhu cầu người xem.',
        targetDurationSeconds: 4,
        lensPreset: '50mm_Cinematic',
        cameraMovement: 'Orbital 360 rotation',
        cameraTransitionType: 'CONTINUOUS_MATCH_FRAME',
        primaryEntityId: chosenEntity?.id,
        entityStateUsed: 'combat_mode',
        environmentStageId: chosenStage?.id,
        keyframePrompt: 'Product showcase in dynamic action display, vibrant neon reflections.',
        referenceSlots: buildAutoBoundReferenceSlots(chosenEntity?.id, 'combat_mode', chosenStage?.id, entities, stages),
        activePrompt: '360 degree showcase video with holographic user interface floating in mid-air.',
        takes: [],
        audioSpec: { sfxLayer: 'Futuristic hum, high energy upbeat rhythm' },
      },
    ];
  }

  if (template.id === 'template_storytelling') {
    return [
      {
        id: 'shot_story_01',
        shotNumber: 1,
        sceneHeading: 'MỞ ĐẦU: SỰ TĨNH LẶNG TRƯỚC CƠN BÃO',
        scriptDescription: 'Phi công quan sát qua kính chắn buồng lái, mưa axit rơi tí tách gợi cảm giác cô độc và kiên cường.',
        targetDurationSeconds: 4,
        lensPreset: '50mm_Cinematic',
        cameraMovement: 'Slow forward dolly',
        cameraTransitionType: 'HARD_CUT_NEW_ANGLE',
        primaryEntityId: chosenEntity?.id,
        entityStateUsed: 'pristine_normal',
        environmentStageId: chosenStage?.id,
        keyframePrompt: 'Moody cinematic portrait of futuristic pilot inside rain-streaked cockpit looking over cyberpunk city.',
        referenceSlots: buildAutoBoundReferenceSlots(chosenEntity?.id, 'pristine_normal', chosenStage?.id, entities, stages),
        activePrompt: 'Atmospheric slow dolly inside high-tech cockpit, rain droplets reflecting neon streetlights outside.',
        takes: [],
        audioSpec: { sfxLayer: 'Rain on glass, subtle melancholic synth drone' },
      },
      {
        id: 'shot_story_02',
        shotNumber: 2,
        sceneHeading: 'CAO TRÀO: HIỆU LỆNH XUẤT TRẬN',
        scriptDescription: 'Bàn tay kéo cần khởi động, mắt visor bừng sáng năng lượng chiến đấu.',
        targetDurationSeconds: 4,
        lensPreset: '85mm_Dramatic_CloseUp',
        cameraMovement: 'Whip tilt to helmet visor',
        cameraTransitionType: 'CONTINUOUS_MATCH_FRAME',
        primaryEntityId: chosenEntity?.id,
        entityStateUsed: 'combat_mode',
        environmentStageId: chosenStage?.id,
        keyframePrompt: 'Extreme close up of cybernetic visor igniting with intense cyan glow, pilot ready for war.',
        referenceSlots: buildAutoBoundReferenceSlots(chosenEntity?.id, 'combat_mode', chosenStage?.id, entities, stages),
        activePrompt: 'Sudden rush of adrenaline, cockpit monitors flashing combat mode, helmet visor blazing neon blue.',
        takes: [],
        audioSpec: { sfxLayer: 'Deep reactor surge, alarm buzzer sounding battle stations' },
      },
    ];
  }

  // Mặc định: Phim Mecha Action
  return [
    {
      id: 'shot_scifi_01',
      shotNumber: 1,
      sceneHeading: 'EXT. CẢNG ORBITAL - XUẤT KÍCH',
      scriptDescription: 'Cửa hangar mở toang, ARES-09 lao ra đường phóng với phản lực màu xanh lam rực rỡ.',
      targetDurationSeconds: 4,
      lensPreset: '16mm_UltraWide_Scale',
      cameraMovement: 'Low-angle hero tilt',
      cameraTransitionType: 'HARD_CUT_NEW_ANGLE',
      primaryEntityId: chosenEntity?.id,
      entityStateUsed: 'combat_mode',
      environmentStageId: chosenStage?.id,
      keyframePrompt: 'Low angle ultra-wide cinematic shot of giant mecha launching from orbital dock into space.',
      referenceSlots: buildAutoBoundReferenceSlots(chosenEntity?.id, 'combat_mode', chosenStage?.id, entities, stages),
      activePrompt: 'Epic launch sequence of ARES-09 mecha, thrusters firing huge blue flames into space.',
      takes: [],
      audioSpec: { sfxLayer: 'Hangar sirens, massive rocket thrust, hydraulic hiss' },
    },
    {
      id: 'shot_scifi_02',
      shotNumber: 2,
      sceneHeading: 'EXT. CẢNG ORBITAL - TRÚNG ĐẠN & PHẢN KÍCH',
      scriptDescription: 'Tên lửa EMP phát nổ trên giáp ngực làm bắn tung tia lửa, robot lập tức xoay đại bác bắn phá tan tành địch.',
      targetDurationSeconds: 4,
      lensPreset: '24mm_Anamorphic_Action',
      cameraMovement: 'Whip pan & impact camera shake',
      cameraTransitionType: 'CONTINUOUS_MATCH_FRAME',
      primaryEntityId: chosenEntity?.id,
      entityStateUsed: 'battle_damaged',
      environmentStageId: chosenStage?.id,
      keyframePrompt: 'Battle damaged mecha torso sparking with electrical arcs while aiming massive plasma cannon.',
      referenceSlots: buildAutoBoundReferenceSlots(chosenEntity?.id, 'battle_damaged', chosenStage?.id, entities, stages),
      activePrompt: 'Mecha absorbing EMP missile explosion, sparking metal armor, retaliating with devastating plasma beam.',
      takes: [],
      audioSpec: { sfxLayer: 'Heavy metal crunch, electric crackle, seismic beam blast' },
    },
  ];
}