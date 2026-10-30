/**
 * 🔥 HYPERION STUDIO OS — BỘ ĐỘNG CƠ TINH HOA 5 REELS TRIỆU VIEW (`MEM-23`)
 * (`Viral AI Reel & 3D Animation Mastery Engine`)
 *
 * Được giải mã ngược (Reverse-Engineered) trực tiếp từ 5 mẫu Facebook Reels AI công nghiệp:
 * 1. Reel #1 (`1553224452628037` - Dark 2D Graphic-Novel Horror):
 *    - "TWO CHARACTERS · ONE STORY · SAME WORLD" Unified World & Dual-Character Bible Sheet:
 *      Khóa đồng thời 2 nhân vật + 4 biểu cảm (2x2) + 4 góc xoay (Front/Side/Back/3-4) + 4 ô cận cảnh chất liệu trang phục/mắt + Bối cảnh + 5 đạo cụ tách rời (Isolated Props) + Bảng màu LUT 8 nốt.
 * 2. Reel #2 (`923875293990577` - Pixar/Zootopia 3D Otter in Action):
 *    - 3D Hero Character Bible với 6 Biểu cảm Khuôn mặt (`CONFIDENT, HAPPY, CURIOUS, SERIOUS, SURPRISED, ANGRY`),
 *      5 Tư thế Hành động (`ACTION POSES`: Gesturing, Sprinting, Jumping, Quadruped Stance, Seated Look-back),
 *      và 6 Ô Macro Chất liệu (`EYE DETAIL, NOSE DETAIL, WHISKERS, PAW DETAIL, FUR TEXTURE, TAIL DETAIL`).
 * 3. Reel #3 (`2163192597600790` - Orangutan vs Alligator 1v1 Boxing Fight):
 *    - Symmetric Dual-Fighter Versus Sheet + Cú cắt "Extreme Macro Contact Compression" (Găng tay/móng vuốt ép lún biến dạng cơ mặt đối thủ ở 120fps, tia nước bọt/mồ hôi/mảnh vảy bắn văng hướng tâm) + Phản ứng của Trọng tài/Đám đông hậu cảnh mờ bokeh.
 * 4. Reel #4 (`1145232734859855` - Little Bird & Donkey 3D Forest Adventure):
 *    - 12-Panel Master Storyboard Contact Grid (`3x4` / `4x2` Widescreen Sheet) kèm công thức "MASTER STORYBOARD PROMPT" khóa ánh sáng, bóng đổ, tỷ lệ nhân vật xuyên suốt toàn bộ các cảnh trước khi render video.
 * 5. Reel #5 (`1481938247140087` - POMMI: Growing Up — 49M Views, 1.4M Likes):
 *    - Nhịp dựng điện ảnh tốc độ cao (`avgShotDuration = 1.29s – 3.5s`, cắt bỏ phần đuôi lê thê của clip AI),
 *    - Bố cục Vật cản Tiền cảnh (`15%–35% Foreground Stone Wall / Cliff Occlusion`) + Tiêu cự xóa phông `f/1.8`,
 *    - Khung hình Sạch Tuyệt Đối (`Zero Top-HUD Clutter` — không dán nhãn kỹ thuật che đầu nhân vật, chỉ để phụ đề tối giản ở đáy khung hình).
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';

export type ViralArchetypeKind =
  | 'PREHISTORIC_TITAN_CLASH'
  | 'PIXAR_3D_ANIMAL_ADVENTURE'
  | 'COMBAT_ARENA_1V1_FIGHT'
  | 'DARK_GRAPHIC_NOVEL_2D'
  | 'CINEMATIC_CUSTOM_STORY';

export interface ViralArchetypeSpec {
  kind: ViralArchetypeKind;
  labelVi: string;
  surfaceShaderLockEn: string;
  opticalLensAndDepthLockEn: string;
  tactileImpactPhysicsLockEn: string;
  globalLightingContinuityRuleEn: string;
}

export const VIRAL_ARCHETYPE_LIBRARY: Record<ViralArchetypeKind, ViralArchetypeSpec> = {
  PREHISTORIC_TITAN_CLASH: {
    kind: 'PREHISTORIC_TITAN_CLASH',
    labelVi: 'Đại Chiến Quái Thú Tiền Sử / Kaiju Hữu Cơ 100%',
    surfaceShaderLockEn:
      'Micro-Surface Shader Lock [Reel #2/#3 Macro Callout Standard]: Razor-sharp individual organic reptile osteoderms, wet specular tearline along the amber/cyan eye rim, subsurface scattering through bioluminescent dorsal membrane, weathered keratin claw grooves, and sizzling rain droplets evaporating on hot basalt scales (zero plastic or metallic sheen).',
    opticalLensAndDepthLockEn:
      'Optical Depth & Foreground Occlusion [POMMI 49M-View Standard]: Anamorphic prime lens with f/2.0 shallow depth-of-field isolation; frame 15% to 25% of one lateral edge with an out-of-focus foreground basalt rock ledge or rising steam plume to create instant 3D parallax depth.',
    tactileImpactPhysicsLockEn:
      'Extreme Macro Contact Physics [Reel #3 Fight Money-Shot Standard]: At the exact frame of physical strike, show visible elastic tissue/scale compression at the contact zone, radial 120fps slow-motion burst of molten sparks, rain spittle, and chipped scale fragments, with kinetic motion blur on the striking limb.',
    globalLightingContinuityRuleEn:
      'Global Lighting Continuity Lock [Reel #4 Storyboard Grid Standard]: Maintain a continuous, physically linked atmospheric progression across consecutive shots (gradual transition from deep violet storm -> fiery orange-cyan clash -> clearing amber twilight through ash clouds, with zero abrupt daytime jumps).',
  },
  PIXAR_3D_ANIMAL_ADVENTURE: {
    kind: 'PIXAR_3D_ANIMAL_ADVENTURE',
    labelVi: 'Hoạt Hình 3D Thú Cưng Chuẩn Pixar / Zootopia / POMMI (49M Views)',
    surfaceShaderLockEn:
      'Pixar/Zootopia Groom & Micro-Detail Lock [Reel #2 Otter & Reel #5 POMMI Standard]: Multi-layered clumped undercoat and guard-hair fur groom reacting to wind, wet leathery nose rhinarium texture, translucent stiff whiskers, expressive wet corneal eye reflections, and tactile woven fabric/leather prop stitching.',
    opticalLensAndDepthLockEn:
      'POMMI 49M-View Camera Grammar: 50mm/85mm f/1.8 cinema lens with creamy background bokeh; use foreground wall/foliage occlusion on the left or right 20% of the frame for over-the-shoulder and peeking reaction shots.',
    tactileImpactPhysicsLockEn:
      'Expressive Squash-and-Stretch & Dust Burst: Snappy kinetic follow-through on jumps and crashes, volumetric sand/dust/leaf particles bursting around paws, and nuanced facial micro-expressions (ear flattening, brow furrow, pupil dilation).',
    globalLightingContinuityRuleEn:
      'Warm Natural Global Illumination: Consistent golden-hour rim light separating fur silhouettes from the background, natural bounce light from terrain, and smooth shadow continuity across all panels.',
  },
  COMBAT_ARENA_1V1_FIGHT: {
    kind: 'COMBAT_ARENA_1V1_FIGHT',
    labelVi: 'Đối Kháng 1v1 Võ Đài / Quyền Anh Siêu Cận Cảnh (Reel #3 Fight Standard)',
    surfaceShaderLockEn:
      'Dual-Fighter Contrast Shader Lock [Reel #3 Orangutan vs Alligator Standard]: High-contrast warm vs. cool fighter palettes, macro leather/scale/fur pore textures, glossy specular highlights on boxing gloves/claws, and glistening sweat/water droplets.',
    opticalLensAndDepthLockEn:
      '3-Layer Arena Depth Staging: Foreground ring ropes or corner post in soft blur, razor-sharp fighters in the midground center, and reactive bokeh crowd/referee cheering or gasping in the background.',
    tactileImpactPhysicsLockEn:
      'Sub-Second Contact Compression [Reel #3 Frame 2 Money-Shot]: Extreme close-up on impact where the striking fist/claw visibly indents the opponent cheek/snout, sending a 120fps radial spray of sweat droplets and shockwave ripples through the skin.',
    globalLightingContinuityRuleEn:
      'Volumetric Arena Spotlight Lock: Consistent overhead stadium/arena volumetric beams cutting through atmospheric haze from intro stance to knockout victory pose.',
  },
  DARK_GRAPHIC_NOVEL_2D: {
    kind: 'DARK_GRAPHIC_NOVEL_2D',
    labelVi: 'Hoạt Hình 2D Truyện Tranh U Ám / Kinh Dị (Reel #1 Horror Standard)',
    surfaceShaderLockEn:
      'Dark Graphic-Novel Ink & Cel-Shader Lock [Reel #1 Standard]: Hand-inked expressive contour linework, cross-hatched facial wrinkles and under-eye shadows, tactile weathered fabric grain, and muted atmospheric shading.',
    opticalLensAndDepthLockEn:
      'Moody Cinematic 2D Staging: Two-character profile and 3/4 psychological staging with dilapidated architectural framing (cracked stone walls, broken wooden fences) and atmospheric dusk depth.',
    tactileImpactPhysicsLockEn:
      'Psychological Micro-Acting: Subtle trembling hands, widened bloodshot eyes, heavy chest sighs, and creeping shadow movement across weathered faces.',
    globalLightingContinuityRuleEn:
      '8-Swatch Moody Twilight Palette Lock [Reel #1 Sheet]: Desaturated slate-grey, olive moss, charcoal brown, and warm fading sunset amber maintained strictly across every shot.',
  },
  CINEMATIC_CUSTOM_STORY: {
    kind: 'CINEMATIC_CUSTOM_STORY',
    labelVi: 'Điện Ảnh Tùy Biến Đa Thể Loại (Custom Story)',
    surfaceShaderLockEn:
      'High-Fidelity Macro Material & Anatomy Lock: Realistic skin/surface micro-textures, wet specular eye reflections, subsurface scattering, and physically accurate cloth/armor/prop detailing.',
    opticalLensAndDepthLockEn:
      '3-Plane Optical Depth Staging: Foreground bokeh occlusion anchor (15%-25% frame), razor-sharp midground subject at f/2.0, and atmospheric background depth.',
    tactileImpactPhysicsLockEn:
      'Visceral Physical Interaction: Authentic weight transfer, visible surface compression on contact, and realistic environmental particle response.',
    globalLightingContinuityRuleEn:
      'Master Storyboard Lighting Continuity: Cohesive color palette and smooth directional key/rim light progression across all consecutive scenes.',
  },
};

/**
 * Tự động nhận diện kịch bản của người dùng thuộc nhóm Khủng Long hay Kịch bản mới (Thú 3D, Võ đài, Kinh dị, Tùy biến)
 * để KHÔNG BAO GIỜ ép cứng nhân vật khủng long nếu người dùng viết kịch bản chủ đề khác!
 */
export function detectViralScriptArchetype(scriptText: string): {
  isPrehistoricDinoScript: boolean;
  archetype: ViralArchetypeSpec;
} {
  const s = String(scriptText || '').toLowerCase();
  const isDino =
    /khủng long|dinosaur|t-rex|tyrannosaur|spinosaurus|ignis_rex|volt_spino|kreta|tiền sử|prehistoric/i.test(s);
  if (isDino) {
    return {
      isPrehistoricDinoScript: true,
      archetype: VIRAL_ARCHETYPE_LIBRARY.PREHISTORIC_TITAN_CLASH,
    };
  }
  if (/horror|kinh dị|ma ám|bà lão|ngôi nhà hoang|2d|truyện tranh|graphic novel/i.test(s)) {
    return {
      isPrehistoricDinoScript: false,
      archetype: VIRAL_ARCHETYPE_LIBRARY.DARK_GRAPHIC_NOVEL_2D,
    };
  }
  if (/boxing|đấm bốc|võ đài|đấu trường|orangutan|alligator|quyền anh|1v1|fight/i.test(s)) {
    return {
      isPrehistoricDinoScript: false,
      archetype: VIRAL_ARCHETYPE_LIBRARY.COMBAT_ARENA_1V1_FIGHT,
    };
  }
  if (/otter|rái cá|pommi|lửng mật|donkey|chú chim|hoạt hình 3d|pixar|zootopia|thú cưng|animal/i.test(s)) {
    return {
      isPrehistoricDinoScript: false,
      archetype: VIRAL_ARCHETYPE_LIBRARY.PIXAR_3D_ANIMAL_ADVENTURE,
    };
  }
  return {
    isPrehistoricDinoScript: false,
    archetype: VIRAL_ARCHETYPE_LIBRARY.CINEMATIC_CUSTOM_STORY,
  };
}

/**
 * Công thức "MASTER STORYBOARD PROMPT" nguyên bản được trích xuất từ Reel #4 (`1145232734859855`)
 * dùng để khóa tính nhất quán toàn cục của toàn bộ chuỗi cảnh.
 */
export function buildMasterStoryboardSheetPromptFromReel4(params: {
  movieTitle: string;
  char1Name: string;
  char1Desc: string;
  char2Name?: string;
  char2Desc?: string;
  envName: string;
  envDesc: string;
  shots: Array<{ shotNumber: number; titleVi: string; actionPromptEn: string }>;
}): string {
  const panelSummaries = params.shots
    .slice(0, 12)
    .map((s) => `Panel ${s.shotNumber}: ${s.actionPromptEn}`)
    .join(' | ');
  return `Master Storyboard Reference Sheet (${params.movieTitle}): Follow a clean widescreen storyboard grid layout in chronological order. Preserve the exact original characters (${params.char1Name}: ${params.char1Desc}${params.char2Name ? `; ${params.char2Name}: ${params.char2Desc}` : ''}), facial features, body proportions, colors, surface textures, environment (${params.envName}: ${params.envDesc}), and visual style throughout all scenes. Use cinematic camera framing including establishing wide shots, extreme close-up macro inserts, over-the-shoulder shots, low-angle hero shots, and emotional reaction shots. Maintain consistent global lighting progression, realistic shadows, detailed textures, and cohesive color grading across: ${panelSummaries}.`;
}

/**
 * Tự động ghép các khung hình Storyboard đã vẽ ở Giai đoạn 3 thành Tấm Bảng Master Storyboard Contact Grid (`03D_master_storyboard_contact_grid.png`)
 * theo đúng chuẩn Reel #4 (`1145232734859855`), giúp Đạo diễn kiểm tra trực quan mạch ánh sáng từ Cảnh 1 -> Cảnh N chỉ trong 1 bức ảnh!
 */
export function buildMasterStoryboardContactGridImage(
  ffmpegCmd: string,
  framePaths: string[],
  outGridPath: string
): boolean {
  const validPaths = framePaths.filter((p) => p && fs.existsSync(p));
  if (validPaths.length === 0) return false;
  try {
    const count = validPaths.length;
    const cols = count <= 4 ? 2 : count === 8 ? 4 : count <= 9 ? 3 : 4;
    const rows = Math.ceil(count / cols);
    const inputsArg = validPaths.map((p) => `-i "${p}"`).join(' ');
    const filterInputs = validPaths.map((_, idx) => `[${idx}:v]scale=480:270:force_original_aspect_ratio=decrease,pad=480:270:(ow-iw)/2:(oh-ih)/2[v${idx}]`).join(';');
    const streamLabels = validPaths.map((_, idx) => `[v${idx}]`).join('');
    const filterComplex = `${filterInputs};${streamLabels}xstack=inputs=${count}:layout=${buildXstackLayout(count, cols, 480, 270)}[out]`;
    execSync(
      `${ffmpegCmd} -y ${inputsArg} -filter_complex "${filterComplex}" -map "[out]" -frames:v 1 "${outGridPath}"`,
      { stdio: 'ignore', timeout: 25000 }
    );
    return fs.existsSync(outGridPath);
  } catch {
    return false;
  }
}

function buildXstackLayout(count: number, cols: number, tileW: number, tileH: number): string {
  const coords: string[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    coords.push(`${c * tileW}_${r * tileH}`);
  }
  return coords.join('|');
}

/**
 * Ghép Bảng Đối Xứng 2 Nhân Vật ("TWO CHARACTERS · ONE STORY · SAME WORLD" — Chuẩn Reel #1 & Reel #3)
 * Đặt Character Sheet #1 và Character Sheet #2 cạnh nhau hoặc trên-dưới thành `02C_dual_character_versus_bible_sheet.png`
 * để khóa tương quan màu sắc và tỷ lệ đối kháng.
 */
export function buildDualCharacterVersusBibleSheet(
  ffmpegCmd: string,
  char1SheetPath: string,
  char2SheetPath: string,
  outVersusPath: string
): boolean {
  if (!fs.existsSync(char1SheetPath) || !fs.existsSync(char2SheetPath)) return false;
  try {
    execSync(
      `${ffmpegCmd} -y -i "${char1SheetPath}" -i "${char2SheetPath}" -filter_complex "[0:v]scale=1280:720[v0];[1:v]scale=1280:720[v1];[v0][v1]vstack=inputs=2[out]" -map "[out]" -frames:v 1 "${outVersusPath}"`,
      { stdio: 'ignore', timeout: 20000 }
    );
    return fs.existsSync(outVersusPath);
  } catch {
    return false;
  }
}

/**
 * Tính toán độ phân giải đầu ra (`width x height`) và nhịp cắt (`effectiveDurationSec`) ở Giai đoạn 7
 * theo chuẩn Reel #5 (`1481938247140087` - POMMI 49M Views) & Reel #1-#4 (9:16 Vertical Reels).
 */
export function resolveOutputCanvasAndViralPacing(params: {
  aspectRatio: string;
  pacingMode: 'cinema' | 'viral-reel' | 'fast';
  shotIndex: number;
  rawDurationSec: number;
  macroPhase: 'PRE_MAIN_BUILDUP' | 'MAIN_CLIMAX_CONFLICT' | 'POST_MAIN_AFTERMATH';
  coverageType: string;
}): {
  outWidth: number;
  outHeight: number;
  trimStartSec: number;
  effectiveDurationSec: number;
} {
  const isVertical = String(params.aspectRatio || '').includes('9:16');
  const outWidth = isVertical ? 720 : 1280;
  const outHeight = isVertical ? 1280 : 720;

  const trimStartSec = params.shotIndex > 0 ? 0.18 : 0.0;
  const maxAvailable = Math.max(2.0, Number((params.rawDurationSec - trimStartSec).toFixed(2)));

  if (params.pacingMode === 'viral-reel' || params.pacingMode === 'fast') {
    // Chuẩn POMMI (49M Views): Cảnh hành động/cận cảnh cắt gọn ở "Khung Vàng Động Lực" (2.8s - 3.6s) trước khi chuyển động AI bị trôi;
    // Cảnh mở màn/kết thúc giữ 4.2s - 4.8s để đủ nhịp ngân cảm xúc.
    let targetDur = 3.6;
    if (params.coverageType === 'INSERT_DETAIL_CUTAWAY' || params.coverageType === 'POV_SUBJECTIVE') {
      targetDur = 2.8;
    } else if (params.macroPhase === 'MAIN_CLIMAX_CONFLICT') {
      targetDur = 3.4;
    } else {
      targetDur = 4.4;
    }
    return {
      outWidth,
      outHeight,
      trimStartSec,
      effectiveDurationSec: Math.min(maxAvailable, targetDur),
    };
  }

  return {
    outWidth,
    outHeight,
    trimStartSec,
    effectiveDurationSec: maxAvailable,
  };
}
