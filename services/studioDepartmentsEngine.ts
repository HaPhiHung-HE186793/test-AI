/**
 * 🏛️ HYPERION STUDIO OS — 6 BỘ PHẬN CHUYÊN BIỆT CHUẨN MARVEL / DC / DISNEY (`MEM-19`)
 * Bổ sung 6 Phòng ban Chuyên nghiệp hoàn thiện dây chuyền 12/12 Bộ phận Điện ảnh Quốc tế:
 * 1. Stunt & Fight Choreography Department (Biên đạo Đối kháng Cơ học: Vector Lực -> Điểm Tiếp xúc -> Phản lực -> Thế chuyển)
 * 2. Progressive Battle-Damaged Set Department (Thiết kế Bối cảnh Phá hủy Cấp tiến theo 3 giai đoạn trận chiến)
 * 3. Original Film Score & Leitmotif Department (Nhạc phim Giao hưởng 3 Hồi kiểu Hans Zimmer & Sidechain Ducking)
 * 4. Skywalker Sound Foley & LFE Impact Department (Tiếng nổ Sub-Bass LFE 48Hz định điểm đúng giây va chạm + J-Cut)
 * 5. Multi-Tone ADR & Emotional Narrator Department (Biến điệu Giọng đọc Thuyết minh theo tâm lý 3 Hồi)
 * 6. Title Design, Location Lower-Thirds, End Credits & IMAX Key Art Department (Thẻ Địa danh, Danh đề Kết phim & Poster)
 */

export type StageDestructionLevel =
  | 'STAGE_1_PRISTINE_OMINOUS'
  | 'STAGE_2_CRATERED_BURNING_CLASH'
  | 'STAGE_3_SMOLDERING_RUINED_AFTERMATH';

export interface CombatChoreographySpec {
  attackVectorEn: string;
  mechanicalContactPointEn: string;
  newtonianCounterForceEn: string;
  guardTransitionEn: string;
  combinedChoreographyEn: string;
}

export interface StudioDepartmentShotEnrichment {
  stuntChoreography: CombatChoreographySpec;
  stageDestructionLevel: StageDestructionLevel;
  stageDestructionPromptEn: string;
  symphonicScoreAevalExpr: string;
  lfeImpactTimestampSec: number;
  adrVoiceFilterExpr: string;
  locationCardVi?: string;
  endCreditsRollVi?: string;
}

const STUNT_CHOREOGRAPHY_MATRIX: Array<{
  attackVectorEn: string;
  mechanicalContactPointEn: string;
  newtonianCounterForceEn: string;
  guardTransitionEn: string;
}> = [
  {
    attackVectorEn: 'Low-center-of-gravity forward kinetic lunge driven by 19-ton hind-leg torque',
    mechanicalContactPointEn: 'Upper serrated maxillary teeth and armored nasal boss colliding directly against rival dark abyssal-slate crocodilian shoulder osteoderms',
    newtonianCounterForceEn: 'Equal-and-opposite shockwave compresses neck vertebrae, skidding rival hind claws 4 meters backward across wet basalt',
    guardTransitionEn: 'Attacker pivots hip 35 degrees to guard exposed throat while preparing tail counter-sweep',
  },
  {
    attackVectorEn: 'Diagonal downward whip-slash of 1.5-meter bio-electric foreclaws at 18 m/s angular velocity',
    mechanicalContactPointEn: 'Three razor talons raking across dark obsidian pectoral scales, carving deep glowing trenches',
    newtonianCounterForceEn: 'High-voltage arc discharge blasts chipped basalt scale fragments tangentially while staggering defender left leg',
    guardTransitionEn: 'Attacker drops into low amphibious crouch to evade retaliatory jaw snap',
  },
  {
    attackVectorEn: 'Close-quarters crocodile-jaw clamp combined with upward neck wrenching leverage',
    mechanicalContactPointEn: 'Elongated interlocking teeth locking onto armored jugular ridge, pinning head angle downward',
    newtonianCounterForceEn: 'Defender plants massive hind claws deep into volcanic crust, arching dorsal spine to resist neck torque',
    guardTransitionEn: 'Defender shifts full 19-ton center of mass into rotational tail whip to break the jaw lock',
  },
  {
    attackVectorEn: '360-degree rotational hip-and-tail pendulum slam carrying maximum angular momentum',
    mechanicalContactPointEn: 'Heavy spiked basalt tail club striking squarely against rival ribcage beneath the dorsal sail',
    newtonianCounterForceEn: 'Brutal lateral impulse launches rival sideways into a towering basalt rock column, shattering the pillar on impact',
    guardTransitionEn: 'Attacker lowers head and widens stance to press the offensive advantage',
  },
];

/**
 * 1. Phòng Chỉ đạo Võ thuật & Biên đạo Đối kháng (`Stunt & Fight Choreography Dept`)
 */
export function buildCombatChoreographyForShot(
  shotIndex: number,
  macroPhase: 'PRE_MAIN_BUILDUP' | 'MAIN_CLIMAX_CONFLICT' | 'POST_MAIN_AFTERMATH'
): CombatChoreographySpec {
  if (macroPhase === 'PRE_MAIN_BUILDUP') {
    return {
      attackVectorEn: 'Predatory stalking stance with coiled hind-leg tendons and lowered center of gravity',
      mechanicalContactPointEn: 'Heavy claws gripping and fracturing wet volcanic basalt ledges under 19-ton static load',
      newtonianCounterForceEn: 'Seismic ground reaction force sending concentric shock rings through boiling water puddles',
      guardTransitionEn: 'Combat-ready guard posture locked on 180-degree confrontation axis',
      combinedChoreographyEn:
        'Stunt Choreography [Pre-Clash Stance]: Predatory coiled tendons, claws fracturing basalt under 19-ton load, seismic ground reaction ripples, locked combat guard.',
    };
  }
  if (macroPhase === 'POST_MAIN_AFTERMATH') {
    return {
      attackVectorEn: 'Decelerating post-combat momentum with heavy chest heaving and grounded weight distribution',
      mechanicalContactPointEn: 'Victor hind claws planted atop shattered obsidian rubble while defeated rival braces on wounded forelimbs',
      newtonianCounterForceEn: 'Residual tremors settling across cracked canyon floor as smoke rises from impact craters',
      guardTransitionEn: 'Dominant apex victory posture overlooking the surrendered territory',
      combinedChoreographyEn:
        'Stunt Choreography [Aftermath Posture]: Grounded 19-ton weight distribution atop shattered rubble, deep exhausted respiration, dominant apex stance.',
    };
  }
  const tpl = STUNT_CHOREOGRAPHY_MATRIX[shotIndex % STUNT_CHOREOGRAPHY_MATRIX.length];
  return {
    ...tpl,
    combinedChoreographyEn: `Stunt Choreography [87North/Marvel Mechanics]: Vector (${tpl.attackVectorEn}) -> Contact Point (${tpl.mechanicalContactPointEn}) -> Newtonian Recoil (${tpl.newtonianCounterForceEn}) -> Guard Transition (${tpl.guardTransitionEn}).`,
  };
}

/**
 * 2. Phòng Thiết kế Bối cảnh Phá hủy Cấp tiến (`Progressive Battle-Damaged Set Dept`)
 */
export function resolveStageDestructionForShot(
  shotNumber: number,
  totalShots: number
): {
  level: StageDestructionLevel;
  promptEn: string;
} {
  const ratio = shotNumber / Math.max(1, totalShots);
  if (ratio <= 0.42) {
    return {
      level: 'STAGE_1_PRISTINE_OMINOUS',
      promptEn:
        'Progressive Set State [Stage 1 - Intact Primordial Arena]: Towering intact black basalt columns, ominous storm clouds gathering overhead, undisturbed lava river channels.',
    };
  }
  if (ratio <= 0.78) {
    return {
      level: 'STAGE_2_CRATERED_BURNING_CLASH',
      promptEn:
        'Progressive Set State [Stage 2 - Battle-Damaged & Burning Arena]: Half-collapsed basalt rock pillars, deep impact craters radiating glowing magma fissures, overflowing lava streams, thick black battle smoke and flying embers.',
    };
  }
  return {
    level: 'STAGE_3_SMOLDERING_RUINED_AFTERMATH',
    promptEn:
      'Progressive Set State [Stage 3 - Devastated Aftermath Battlefield]: Completely shattered canyon floor covered in smoking rubble, cooling black glass lava pools, falling volcanic ash snow, and golden-amber dusk rays piercing the smoke.',
  };
}

/**
 * 3 & 4. Phòng Nhạc Phim Giao Hưởng 3 Hồi (`Original Film Score Dept`) & Phòng Tiếng Động Vật Lý Định Điểm (`Skywalker Sound LFE Foley Dept`)
 * Tạo biểu thức tổng hợp âm thanh `aevalsrc` kết hợp:
 * - Hòa âm Giao hưởng Trầm (D-Minor / Phrygian Orchestra Drone & Brass Braaam)
 * - Trống trận định nhịp (Taiko / Timpani Pulse)
 * - Cú nổ Siêu trầm Định điểm (Sub-Bass 48Hz LFE Impact Boom) khớp chính xác với khoảnh khắc Hard-Cut Impact Flash!
 */
export function buildSymphonicScoreAndLfeAeval(
  macroPhase: 'PRE_MAIN_BUILDUP' | 'MAIN_CLIMAX_CONFLICT' | 'POST_MAIN_AFTERMATH',
  emotionalTensionMode: string
): { aevalExpr: string; impactTimeSec: number } {
  const isSakuga = emotionalTensionMode === 'SAKUGA_DROP_SILENCE_TO_CATHARSIS';
  const impactTimeSec = isSakuga ? 1.75 : 2.25;

  if (macroPhase === 'PRE_MAIN_BUILDUP') {
    // Act I: Ominous Cello Drone (D1 36.71Hz + A1 55Hz + F2 87.31Hz) + Slow Heartbeat Timpani Pulse (0.9s cycle)
    const expr =
      "0.07*sin(2*PI*36.71*t)+0.05*sin(2*PI*55.0*t)+0.03*sin(2*PI*87.31*t)*(0.6+0.4*sin(2*PI*0.35*t))+0.09*exp(-9*mod(t,1.15))*sin(2*PI*46*t)";
    return { aevalExpr: expr, impactTimeSec: 2.4 };
  }

  if (macroPhase === 'POST_MAIN_AFTERMATH') {
    // Act III: Mythic Amber Resolution Chord (D2 73.42Hz + A2 110Hz + E3 164.81Hz + F#3 185Hz)
    const expr =
      "0.07*sin(2*PI*36.71*t)+0.06*sin(2*PI*73.42*t)+0.045*sin(2*PI*110.0*t)+0.03*sin(2*PI*164.81*t)+0.025*sin(2*PI*185.0*t)*(0.7+0.3*sin(2*PI*0.25*t))";
    return { aevalExpr: expr, impactTimeSec: 2.0 };
  }

  if (isSakuga) {
    // Sakuga Drop: [0 -> 1.75s] High-tension muffled heartbeat silence -> [1.75s] Massive Hans Zimmer Brass Braaam + 45Hz LFE Seismic Detonation!
    const expr =
      "if(lt(t,1.75),0.04*exp(-12*mod(t,0.75))*sin(2*PI*42*t),(0.13*sin(2*PI*36.71*t)+0.10*sin(2*PI*73.42*t)+0.07*sin(2*PI*110.0*t)+0.42*exp(-4.5*max(0,t-1.75))*sin(2*PI*45*t)+0.18*exp(-14*max(0,t-1.75))*sin(2*PI*135*t)))";
    return { aevalExpr: expr, impactTimeSec: 1.75 };
  }

  // Act II Clash: Driving Phrygian Brass Braaam (D1 + D2 + A2 + Bb2) + War Taiko Rhythm + Exact LFE Impact Boom at t=2.25s!
  const expr =
    "0.08*sin(2*PI*36.71*t)+0.06*sin(2*PI*73.42*t)+0.04*sin(2*PI*116.54*t)+0.08*exp(-10*mod(t,0.55))*sin(2*PI*52*t)+0.38*exp(-5.5*max(0,t-2.25))*sin(2*PI*46*t)*gte(t,2.25)+0.15*exp(-16*max(0,t-2.25))*sin(2*PI*140*t)*gte(t,2.25)";
  return { aevalExpr: expr, impactTimeSec: 2.25 };
}

/**
 * 5. Phòng Diễn xuất Lồng tiếng Đa Âm Sắc theo Hồi (`Multi-Tone ADR & Emotional Narrator Dept`)
 */
export function buildAdrVoiceFilterForPhase(
  macroPhase: 'PRE_MAIN_BUILDUP' | 'MAIN_CLIMAX_CONFLICT' | 'POST_MAIN_AFTERMATH',
  emotionalTensionMode: string,
  effDur: number
): string {
  if (macroPhase === 'PRE_MAIN_BUILDUP') {
    // Giọng trầm mặc, bí ẩn, có độ ngân không gian hẻm vực cổ đại
    return `aresample=48000,asetrate=48000*0.95,aresample=48000,atempo=1.04,aformat=sample_fmts=fltp:channel_layouts=stereo,equalizer=f=125:width_type=h:width=90:g=4.5,equalizer=f=3200:width_type=h:width=900:g=2.0,volume=1.65,adelay=180|180,apad=whole_dur=${effDur}`;
  }
  if (macroPhase === 'POST_MAIN_AFTERMATH') {
    // Giọng sử thi lắng đọng, ấm và sâu
    return `aresample=48000,asetrate=48000*0.96,aresample=48000,atempo=1.02,aformat=sample_fmts=fltp:channel_layouts=stereo,equalizer=f=135:width_type=h:width=100:g=4.0,equalizer=f=2800:width_type=h:width=800:g=2.2,volume=1.65,adelay=200|200,apad=whole_dur=${effDur}`;
  }
  if (emotionalTensionMode === 'SAKUGA_DROP_SILENCE_TO_CATHARSIS') {
    // Giọng bùng nổ uy lực ở cao trào thức tỉnh
    return `aresample=48000,atempo=1.06,aformat=sample_fmts=fltp:channel_layouts=stereo,equalizer=f=140:width_type=h:width=110:g=5.0,equalizer=f=2600:width_type=h:width=900:g=3.5,volume=1.78,adelay=150|150,apad=whole_dur=${effDur}`;
  }
  // Hồi II Giao chiến: Giọng đanh thép, nhịp độ nhanh, xuyên qua tiếng nổ chiến trường
  return `aresample=48000,atempo=1.07,aformat=sample_fmts=fltp:channel_layouts=stereo,equalizer=f=135:width_type=h:width=100:g=4.2,equalizer=f=2500:width_type=h:width=850:g=3.2,volume=1.70,adelay=160|160,apad=whole_dur=${effDur}`;
}

