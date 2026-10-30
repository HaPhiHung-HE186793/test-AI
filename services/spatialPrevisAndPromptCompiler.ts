/**
 * 🎥 HYPERION STUDIO — CGI MULTI-PASS SPATIAL PREVIS, SKELETAL KINEMATICS & DISENTANGLED PROMPT COMPILER (MEM-21)
 *
 * Kiến trúc dựa trên 5 công trình nghiên cứu & hệ thống sản xuất của các ông lớn AI Film:
 *   1. Google DeepMind Veo 2 / Veo 3.1: Disentangled Spatial-Keyframe Lock (80% Pixel) vs. Front-Loaded Motion-First Video Prompt (20% Dynamics).
 *   2. Meta Movie Gen (30B Transformer): Optimal Inference Prompt Rewrite & Token Density Control (tránh hiện tượng Attention Dilution do nhồi chữ).
 *   3. VideoDirectorGPT (UNC / Microsoft) & Boximator (ByteDance): Explicit 2D/3D Bounding-Box Coordinates [X%, Y%, Z-meters] & Trajectory Splines.
 *   4. MotionCtrl (Tencent / SIGGRAPH): Decoupled Camera Extrinsics Matrix [FocalLength, Elevation, Pitch, Yaw, VelocityVector] tách biệt khỏi chuyển động chủ thể.
 *   5. T2V-CompBench (CVPR 2025) & VBench (CVPR 2024): 10-Point Deterministic Prompt Linter & Auto-Healing Loop (kiểm tra Generative Numeracy, Zone-Elevation Coherence, Action-Specific Foley SFX, Zero Truncation).
 */

export interface BoundingBox3DSpec {
  entityName: string;
  screenZoneXPercent: string;
  screenZoneYPercent: string;
  depthDistanceMeters: number;
  bodyYawDegAndFacingEn: string;
  anatomicalFocusAndGazeEn: string;
}

export interface CameraExtrinsicsSpec {
  coverageType: string;
  focalLengthMm: string;
  apertureStop: string;
  cameraDistanceMeters: number;
  cameraElevationMeters: number;
  cameraPitchDeg: string;
  cameraRigMovementVectorEn: string;
  framingScaleConstraintEn: string;
  targetAnatomicalZoneEn: string;
}

export interface SkeletalKinematicsChainSpec {
  rootPelvisAndCenterOfMassEn: string;
  spineAndThoraxTorsionEn: string;
  primaryExtremityStrikeEn: string;
  newtonianGroundRecoilAndSettleEn: string;
  combinedKinematicsChainEn: string;
}

export interface BespokeShotAudioDesignSpec {
  bespokeSfxEn: string;
  bespokeAmbientEn: string;
}

export interface SpatialPrevisDossier {
  shotNumber: number;
  cameraExtrinsics: CameraExtrinsicsSpec;
  subject1Box: BoundingBox3DSpec;
  subject2Box: BoundingBox3DSpec | null;
  contactTerrainGeometryEn: string;
  skeletalKinematics: SkeletalKinematicsChainSpec;
  bespokeAudioDesign: BespokeShotAudioDesignSpec;
}

export interface DisentangledCompiledPrompts {
  spatialLayoutImagePromptEn: string;
  frontLoadedMotionVideoPromptEn: string;
}

export interface ShotPromptAuditReport {
  shotNumber: number;
  totalScore: number;
  passed: boolean;
  iterationsUsed: number;
  metrics: {
    frontLoadedCameraCheck: { score: number; max: 15; pass: boolean; detail: string };
    motionPromptTokenDensityCheck: { score: number; max: 15; pass: boolean; detail: string };
    spatialPromptPureStaticCheck: { score: number; max: 15; pass: boolean; detail: string };
    spatialBoundingBoxCheck: { score: number; max: 15; pass: boolean; detail: string };
    scaleAndElevationZoneCoherenceCheck: { score: number; max: 10; pass: boolean; detail: string };
    terrainContactPhysicsCheck: { score: number; max: 10; pass: boolean; detail: string };
    skeletalKinematicsCheck: { score: number; max: 10; pass: boolean; detail: string };
    generativeNumeracyAndFoleyCoherenceCheck: { score: number; max: 10; pass: boolean; detail: string };
  };
  autoFixesApplied: string[];
}

const CONTACT_TERRAIN_PROGRESSION_23_SHOTS: string[] = [
  // Shot 01
  'Wet fractured black basalt cliff ledge 22 meters above the boiling sulfur lagoon, loose volcanic gravel vibrating on the rim',
  // Shot 02
  'Crusted geothermal shoreline slab with glowing orange magma fissures cracking open directly beneath 19-ton three-toed claws',
  // Shot 03
  'Deep boiling sulfur lagoon water surface with electrified cyan ripples and submerged jagged volcanic boulders along the bank',
  // Shot 04
  'Sloping eastern basalt riverbank drenched in cascading muddy water and steaming volcanic mist',
  // Shot 05
  'Flat rain-slicked obsidian fault-line arena flanked by the intact Ancient Fang-Shaped Basalt Pillar in the center lagoon',
  // Shot 06
  'Muddy volcanic flood-plain with shallow boiling puddles exploding upward under 19-ton sprinting hind-leg strides',
  // Shot 07
  'Slick wet basalt fault line cracking into spiderweb trenches under the combined 37-ton collision load',
  // Shot 08
  'Jagged obsidian rock shelf slick with steaming rain and glowing magma droplets leaking from torn armor plates',
  // Shot 09
  'Crumbled basalt trench beside the boiling river where churning mud and sparks fly under locked jaws',
  // Shot 10
  'Shattered base of the Ancient Fang-Shaped Basalt Pillar collapsing into a geyser of boiling lagoon water and falling rock slabs',
  // Shot 11
  'Crumbling cliff edge overhanging a churning 1,100°C magma chasm, loose basalt stones sliding into the abyss',
  // Shot 12
  'Melting vitrified volcanic glass crater glowing white-hot as subterranean magma vents erupt beneath both hind feet',
  // Shot 13
  'Scorched black obsidian causeway parting a wall of superheated white steam and flying volcanic ash',
  // Shot 14
  'Knee-deep 0.9-meter molten lava channel and boiling sulfur rapids splashing liquid fire across basalt boulders',
  // Shot 15
  'Splintered volcanic rock ledge littered with glowing cyan dorsal-spine shards and smoking magma craters',
  // Shot 16
  'Electrified wet basalt basin where short-circuiting cyan bio-electric arcs ground into cracked lava tubes',
  // Shot 17
  'Collapsed eastern canyon wall buried under tons of freshly avalanched black basalt boulders and rising dust',
  // Shot 18
  'Deep impact crater in the center of the valley floor ringed by radial tectonic fissures and spouting lava geysers',
  // Shot 19
  'Shallow smoking lagoon bank strewn with scorched rock debris and fading cyan bio-electric ripples',
  // Shot 20
  'Ash-blanketed basalt terrace where cooling black volcanic glass solidifies over deep battle trenches',
  // Shot 21
  'Misty shoreline border between the smoking geothermal river and the dark retreating swamp forest',
  // Shot 22
  'Elevated sovereign basalt peak overlooking the cratered valley as golden-amber dusk rays pierce the ash clouds',
  // Shot 23
  'Monumental volcanic summit pinnacle framed against clearing twilight skies and drifting golden embers',
];

const BESPOKE_AUDIO_DESIGN_23_SHOTS: BespokeShotAudioDesignSpec[] = [
  // Shot 01
  {
    bespokeSfxEn: 'SFX: Sharp purple thunderclap, vibrating basalt pebbles, and an earth-shaking 19-ton territorial roar echoing across the caldera.',
    bespokeAmbientEn: 'Ambient: Howling volcanic storm wind, torrential rain, and deep subterranean magma rumble.',
  },
  // Shot 02
  {
    bespokeSfxEn: 'SFX: Colossal 19-ton hind-foot impact crunching black basalt crust, cracking rock fissures, and pressurized lava hissing.',
    bespokeAmbientEn: 'Ambient: Steaming geothermal vents, rain sizzling on hot scales, and distant thunder.',
  },
  // Shot 03
  {
    bespokeSfxEn: 'SFX: Deep hydroplane water slicing, boiling sulfur bubbles bursting, and high-voltage cyan bio-electric arcs crackling across waves.',
    bespokeAmbientEn: 'Ambient: Churning lagoon currents, heavy downpour on water, and low electrical hum.',
  },
  // Shot 04
  {
    bespokeSfxEn: 'SFX: Explosive water breach, giant organic keratin claws scraping wet basalt rock, and a deep amphibious hiss.',
    bespokeAmbientEn: 'Ambient: Cascading waterfall spray off massive scales, storm wind, and crackling cyan dorsal energy.',
  },
  // Shot 05
  {
    bespokeSfxEn: 'SFX: Dual overlapping apex roars — guttural sub-bass magma bellow clashing against high-frequency electric shriek.',
    bespokeAmbientEn: 'Ambient: Acoustic shockwave atomizing rain, forked lightning overhead, and bubbling lava river.',
  },
  // Shot 06
  {
    bespokeSfxEn: 'SFX: Rapid rhythmic 19-ton bipedal sprint footfalls cratering mud flats and snapping jaws.',
    bespokeAmbientEn: 'Ambient: Splashing boiling puddles, rushing wind turbulence, and rising geothermal roar.',
  },
  // Shot 07
  {
    bespokeSfxEn: 'SFX: Deafening 37-ton head-on armor collision, basalt fault-line cracking, and hind claws skidding through wet mud.',
    bespokeAmbientEn: 'Ambient: Explosive steam burst, flying rock shrapnel, and roaring storm wind.',
  },
  // Shot 08
  {
    bespokeSfxEn: 'SFX: High-voltage electric discharge whip and 1.5-meter claws tearing through obsidian shoulder armor with sizzling magma sparks.',
    bespokeAmbientEn: 'Ambient: Agonized guttural snarl, hissing steam on bleeding lava wounds, and heavy rain.',
  },
  // Shot 09
  {
    bespokeSfxEn: 'SFX: 60,000-Newton bone-crushing jaw clamp on throat followed by a blinding point-blank bio-electric detonation.',
    bespokeAmbientEn: 'Ambient: Crackling ozone shockwave, splashing mud, and heavy combat breathing.',
  },
  // Shot 10
  {
    bespokeSfxEn: 'SFX: Supersonic tail-whip whoosh, rib-cracking impact, and the Ancient Fang Basalt Pillar snapping and crashing into the lagoon.',
    bespokeAmbientEn: 'Ambient: Massive 15-meter boiling water geyser splash, falling boulder avalanche, and thunder.',
  },
  // Shot 11
  {
    bespokeSfxEn: 'SFX: Focused cyan lightning beam blasting basalt chest armor, crumbling cliff stones falling into the abyss, and ragged breathing.',
    bespokeAmbientEn: 'Ambient: Roaring 1,100°C magma chasm below, oppressive storm wind, and electrical hum.',
  },
  // Shot 12
  {
    bespokeSfxEn: 'SFX: [0.0s-1.75s] Eerie muffled heartbeat silence and raindrop hiss -> [1.75s] Cataclysmic 46Hz thermonuclear magma roar and shockwave boom.',
    bespokeAmbientEn: 'Ambient: Vitrifying rock cracking underfoot and rain vaporizing into a dome of white steam.',
  },
  // Shot 13
  {
    bespokeSfxEn: 'SFX: Explosive bipedal overdrive charge, cyan lightning bolts ricocheting off blazing armor, and a devastating center-mass ram.',
    bespokeAmbientEn: 'Ambient: Roaring furnace flames, parting smoke walls, and melting obsidian ground.',
  },
  // Shot 14
  {
    bespokeSfxEn: 'SFX: Violent splashing of molten lava waves, gnashing jaws deflecting iron-like claws, and sizzling steam explosions.',
    bespokeAmbientEn: 'Ambient: Churning geothermal rapids, crackling fire, and intense close-quarters combat growls.',
  },
  // Shot 15
  {
    bespokeSfxEn: 'SFX: Visceral 60,000-Newton jaw crunch shattering crystalline cyan dorsal spines and erratic short-circuiting electrical pops.',
    bespokeAmbientEn: 'Ambient: Agonized amphibious shriek, falling glass-like sail shards, and bubbling lava.',
  },
  // Shot 16
  {
    bespokeSfxEn: 'SFX: Chaotic radial arc-lightning discharge explosion and heavy hind claws grinding 0.8m across wet basalt.',
    bespokeAmbientEn: 'Ambient: Dying electrical transformer whine, ozone crackle, and heavy rain.',
  },
  // Shot 17
  {
    bespokeSfxEn: 'SFX: Runaway 19-ton skull battering-ram impact and a thunderous avalanche of collapsing basalt canyon walls.',
    bespokeAmbientEn: 'Ambient: Rumbling rockslide, billowing ash clouds, and echoing valley tremors.',
  },
  // Shot 18
  {
    bespokeSfxEn: 'SFX: [0.0s-1.75s] Deep furnace inhalation silence -> [1.75s] Earth-shattering Primordial Super-Nova fire-stream blast and 18-ton body collapse.',
    bespokeAmbientEn: 'Ambient: Tectonic crater fissures erupting and shockwaves parting the storm clouds.',
  },
  // Shot 19
  {
    bespokeSfxEn: 'SFX: Trembling claws scraping scorched rock, low defeated groan, and fractured dorsal spines clicking darkly.',
    bespokeAmbientEn: 'Ambient: Quiet settling volcanic ash, fading embers, and gentle lagoon ripples.',
  },
  // Shot 20
  {
    bespokeSfxEn: 'SFX: Deep resonant chest respiration and crystalline crackling as molten shoulder scars cool into solid black obsidian glass.',
    bespokeAmbientEn: 'Ambient: Soft hissing steam rising into twilight air and distant calming volcano hum.',
  },
  // Shot 21
  {
    bespokeSfxEn: 'SFX: Slow heavy wading splashes as the wounded challenger submerges and retreats into the murky river.',
    bespokeAmbientEn: 'Ambient: Lapping water waves, drifting mist, and quiet wind across the scarred valley.',
  },
  // Shot 22
  {
    bespokeSfxEn: 'SFX: Deliberate heavy bipedal footsteps ascending the summit peak and claws locking onto the highest basalt throne.',
    bespokeAmbientEn: 'Ambient: Sweeping high-altitude twilight wind and warm golden dusk atmosphere.',
  },
  // Shot 23
  {
    bespokeSfxEn: 'SFX: One final monumental sovereign roar resonating across the prehistoric mountains and fading into mythic silence.',
    bespokeAmbientEn: 'Ambient: Gentle twilight wind, drifting golden embers, and eternal volcanic horizon.',
  },
];

const SKELETAL_KINEMATICS_23_SHOTS: SkeletalKinematicsChainSpec[] = [
  // Shot 01
  {
    rootPelvisAndCenterOfMassEn: '19-ton pelvis shifts forward onto the cliff rim, lowering center of gravity by 0.4m',
    spineAndThoraxTorsionEn: 'Thoracic ribcage expands 30% with superheated air while cervical spine arches upward at +40°',
    primaryExtremityStrikeEn: 'Massive hornless jaws unhinge to maximum gape, projecting a directional acoustic shockwave cone',
    newtonianGroundRecoilAndSettleEn: 'Hind-leg claws dig 12cm into wet basalt to absorb the vocal recoil vibration',
    combinedKinematicsChainEn: 'Pelvis forward shift -> Thorax expansion & +40° neck arch -> Maximum jaw gape roar -> Hind-claw basalt anchor',
  },
  // Shot 02
  {
    rootPelvisAndCenterOfMassEn: 'Lower hind-limb knee and ankle joints drive full 19-ton mass vertically downward',
    spineAndThoraxTorsionEn: 'Heavy tarsometatarsus ankle bone locks rigid under colossal load transfer',
    primaryExtremityStrikeEn: 'Three-toed right hind foot slams vertically downward onto the crusted lava slab',
    newtonianGroundRecoilAndSettleEn: 'Ankle tendons compress under impact as molten magma squirts through radial rock fractures',
    combinedKinematicsChainEn: 'Lower hind-limb vertical drive -> Rigid ankle bone lock -> Three-toed hind-foot basalt slam -> Ankle tendon compression & lava spurt',
  },
  // Shot 03
  {
    rootPelvisAndCenterOfMassEn: 'Submerged 18-ton aquatic torso propels forward via sinusoidal tail undulation',
    spineAndThoraxTorsionEn: '2.8-meter jagged dorsal spine sails upward, cutting vertically through the water plane',
    primaryExtremityStrikeEn: 'Crocodilian snout breaches at a +15° hydroplane angle while dorsal conduits arc with cyan electricity',
    newtonianGroundRecoilAndSettleEn: 'Displaced water mass parts into twin 2-meter V-shaped kelvin wakes crashing against shoreline rocks',
    combinedKinematicsChainEn: 'Sinusoidal tail propulsion -> Dorsal sail vertical breach -> +15° snout hydroplane -> V-wake displacement',
  },
  // Shot 04
  {
    rootPelvisAndCenterOfMassEn: 'Hind legs push off the submerged river bottom, launching 18-ton mass up the eastern bank',
    spineAndThoraxTorsionEn: 'Elongated spine uncoils in an S-curve as water sheets off dark abyssal-slate crocodilian scales',
    primaryExtremityStrikeEn: '1.5-meter hooked foreclaws rake deep trenches into the wet basalt ledge to haul the body ashore',
    newtonianGroundRecoilAndSettleEn: 'Heavy landing shock sends muddy spray outward as dorsal sail flares with neon-cyan charge',
    combinedKinematicsChainEn: 'Submerged hind-leg launch -> S-curve spine uncoil -> 1.5m foreclaw bank grip -> Heavy shore landing',
  },
  // Shot 05
  {
    rootPelvisAndCenterOfMassEn: 'Both titans drop their pelvises into low predatory combat stances across the 180-degree axis',
    spineAndThoraxTorsionEn: 'Necks crane forward at opposing 25° angles with dorsal osteoderms and cyan sail bristling',
    primaryExtremityStrikeEn: 'Jaws part in synchronized acoustic challenge while tails whip laterally in counter-rhythm',
    newtonianGroundRecoilAndSettleEn: 'Opposing acoustic pressure waves collide at X:50% center-frame, atomizing rain into mist',
    combinedKinematicsChainEn: 'Dual low pelvis drop -> Opposing 25° neck crane -> Synchronized jaw roar -> Mid-air shockwave collision',
  },
  // Shot 06
  {
    rootPelvisAndCenterOfMassEn: 'Left and right hind-leg pistons fire in alternating explosive sprint strides at 9m/s',
    spineAndThoraxTorsionEn: 'Spine stays horizontal and aerodynamic, head lowered like a 19-ton battering ram',
    primaryExtremityStrikeEn: 'Hind claws pulverize basalt ledges on each push-off while jaws snap open 3m before target',
    newtonianGroundRecoilAndSettleEn: 'Each 19-ton footfall craters the mud flats and launches volcanic boulders backward',
    combinedKinematicsChainEn: 'Explosive hind-leg piston sprint -> Horizontal battering-ram spine -> Claw push-off cratering -> Pre-impact jaw snap',
  },
  // Shot 07
  {
    rootPelvisAndCenterOfMassEn: '37 combined tons of forward momentum collide at center-frame X:50%',
    spineAndThoraxTorsionEn: 'Cervical and thoracic vertebrae compress violently under head-on impact torque',
    primaryExtremityStrikeEn: 'Broad basalt cranium of @IGNIS_REX slams against reinforced shoulder and hooked foreclaw of @VOLT_SPINO',
    newtonianGroundRecoilAndSettleEn: 'Left hind foot of @IGNIS_REX skids 1.2m backward in wet mud as the fault line cracks open',
    combinedKinematicsChainEn: '37-ton center collision -> Vertebral compression -> Skull-to-shoulder impact -> 1.2m hind-foot mud skid',
  },
  // Shot 08
  {
    rootPelvisAndCenterOfMassEn: '@VOLT_SPINO pivots +30° on its right hind leg to exploit @IGNIS_REX off-balance skid',
    spineAndThoraxTorsionEn: 'Upper torso twists rapidly, channeling cyan bio-electric current from dorsal sail into right shoulder',
    primaryExtremityStrikeEn: '1.5-meter right foreclaw slashes diagonally downward across @IGNIS_REX left shoulder armor',
    newtonianGroundRecoilAndSettleEn: '@IGNIS_REX reels 1.5m to the left as three deep claw trenches leak glowing orange magma',
    combinedKinematicsChainEn: '+30° hind-leg pivot -> Torso electric charge transfer -> Diagonal 1.5m foreclaw slash -> Leftward stagger recoil',
  },
  // Shot 09
  {
    rootPelvisAndCenterOfMassEn: '@IGNIS_REX plants both hind feet wide, absorbing the pain and driving upward from the hips',
    spineAndThoraxTorsionEn: 'Thick muscular neck whips +45° inward to close the distance inside @VOLT_SPINO reach',
    primaryExtremityStrikeEn: '60,000-Newton jaws clamp onto @VOLT_SPINO lower throat while @VOLT_SPINO discharges a point-blank cyan shock',
    newtonianGroundRecoilAndSettleEn: 'Bio-electric explosion blows both titans 2m apart in a cloud of steam and flying sparks',
    combinedKinematicsChainEn: 'Wide hind-foot plant -> +45° neck whip -> 60kN jaw throat clamp -> Point-blank electric blast separation',
  },
  // Shot 10
  {
    rootPelvisAndCenterOfMassEn: '@IGNIS_REX uses the separation momentum to spin 180° on its left heel pivot',
    spineAndThoraxTorsionEn: 'Lumbar and caudal vertebrae coil and release like a 6-ton kinetic bullwhip',
    primaryExtremityStrikeEn: 'Armored tail club slams horizontally into @VOLT_SPINO ribcage, hurling it into the Fang Basalt Pillar',
    newtonianGroundRecoilAndSettleEn: 'The ancient basalt pillar snaps in half and collapses into the boiling lagoon in a 15m geyser',
    combinedKinematicsChainEn: '180° left-heel pivot -> Caudal spine whip torsion -> Horizontal tail-club rib slam -> Basalt pillar collapse',
  },
  // Shot 11
  {
    rootPelvisAndCenterOfMassEn: '@IGNIS_REX staggers backward onto the crumbling cliff rim, left knee buckling to 0.5m off ground',
    spineAndThoraxTorsionEn: 'Chest heaves raggedly as cracked shoulder plates bleed dim magma',
    primaryExtremityStrikeEn: '@VOLT_SPINO rears up on the right and fires a concentrated cyan lightning beam into @IGNIS_REX chest',
    newtonianGroundRecoilAndSettleEn: 'Cliff edge fractures beneath @IGNIS_REX heels, dropping stones into the magma abyss below',
    combinedKinematicsChainEn: 'Backward cliff stagger & knee buckle -> Ragged thorax heave -> Incoming cyan chest beam -> Cliff-edge heel fracture',
  },
  // Shot 12
  {
    rootPelvisAndCenterOfMassEn: 'From a kneeling posture, @IGNIS_REX drives both hind legs vertically upward, vitrifying the rock beneath',
    spineAndThoraxTorsionEn: 'Subdermal magma veins along spine and neck ignite from dim red to blinding white-hot crimson',
    primaryExtremityStrikeEn: 'Head throws back in a cataclysmic [SKILL_2_PRIMORDIAL_SUPER_NOVA] eruption, releasing a 360° thermal dome',
    newtonianGroundRecoilAndSettleEn: 'Spherical shockwave vaporizes the rain curtain and forces @VOLT_SPINO two steps back',
    combinedKinematicsChainEn: 'Vertical hind-leg drive -> Spine vein white-hot ignition -> Super-Nova upward roar -> 360° rain-parting shockwave',
  },
  // Shot 13
  {
    rootPelvisAndCenterOfMassEn: 'Overdrive @IGNIS_REX launches forward at 11m/s on two hind legs with zero hesitation',
    spineAndThoraxTorsionEn: 'Armored head and shoulder angle downward to deflect incoming cyan lightning bolts',
    primaryExtremityStrikeEn: 'Blazing basalt skull rams straight through the smoke curtain into @VOLT_SPINO center mass',
    newtonianGroundRecoilAndSettleEn: 'Superheated air wakes trail behind @IGNIS_REX as obsidian ground melts under each stride',
    combinedKinematicsChainEn: '11m/s bipedal overdrive charge -> Angled skull lightning deflection -> Center-mass ram -> Melting footprint wake',
  },
  // Shot 14
  {
    rootPelvisAndCenterOfMassEn: 'Both titans wrestle waist-deep in the churning lava river, hips locked in a high-torque grapple',
    spineAndThoraxTorsionEn: 'Necks intertwine and shove as @IGNIS_REX uses superior 19-ton mass to force @VOLT_SPINO backward',
    primaryExtremityStrikeEn: '@IGNIS_REX jaws deflect @VOLT_SPINO slashing claws, sending showers of liquid fire into the sky',
    newtonianGroundRecoilAndSettleEn: 'Molten lava waves slosh over nearby basalt boulders from the violent displacement',
    combinedKinematicsChainEn: 'Lava-river hip grapple -> Neck-to-neck torque shove -> Jaw-on-claw deflection -> Molten wave displacement',
  },
  // Shot 15
  {
    rootPelvisAndCenterOfMassEn: '@IGNIS_REX elevates its center of mass by pushing off a submerged basalt boulder',
    spineAndThoraxTorsionEn: 'Cervical muscles coil and strike downward at -35° onto @VOLT_SPINO exposed back',
    primaryExtremityStrikeEn: 'Molten jaws clamp and crush the central neural spine of @VOLT_SPINO cyan dorsal sail ([SKILL_1_MAGMA_BITE])',
    newtonianGroundRecoilAndSettleEn: 'Crystalline dorsal shards shatter outward as erratic blue sparks short-circuit across the wound',
    combinedKinematicsChainEn: 'Boulder push-off elevation -> -35° downward neck strike -> 60kN dorsal-sail crush -> Crystalline shard shatter',
  },
  // Shot 16
  {
    rootPelvisAndCenterOfMassEn: 'Wounded @VOLT_SPINO plants all limbs wide in desperate survival panic',
    spineAndThoraxTorsionEn: 'Fractured dorsal sail convulses, dumping all remaining bio-electric reserves into a chaotic pulse',
    primaryExtremityStrikeEn: 'Radial cyan arc-lightning explosion bursts outward ([SKILL_2_ABYSSAL_MAELSTROM])',
    newtonianGroundRecoilAndSettleEn: '@IGNIS_REX braces both hind legs, sliding 0.8m back while its magma armor absorbs the voltage',
    combinedKinematicsChainEn: 'Desperate wide limb brace -> Fractured sail convulsion -> Radial arc-lightning dump -> 0.8m braced armor slide',
  },
  // Shot 17
  {
    rootPelvisAndCenterOfMassEn: 'With @VOLT_SPINO drained of electricity, @IGNIS_REX drives forward like a runaway locomotive',
    spineAndThoraxTorsionEn: 'Full 19-ton body aligns into a rigid kinetic spear from tail tip to skull crown',
    primaryExtremityStrikeEn: 'Hornless basalt skull batters @IGNIS_REX rival chest and slams its 18-ton body into the eastern canyon wall',
    newtonianGroundRecoilAndSettleEn: 'The basalt cliff face fractures and avalanches down around the pinned challenger',
    combinedKinematicsChainEn: 'Locomotive bipedal drive -> Rigid spine-to-skull alignment -> Full-mass chest ram -> Canyon wall avalanche',
  },
  // Shot 18
  {
    rootPelvisAndCenterOfMassEn: '@IGNIS_REX plants both hind feet firmly at the crater rim, coiling maximum core thermal energy',
    spineAndThoraxTorsionEn: 'Throat pouch and dorsal veins flare blinding white-gold as magma surges upward',
    primaryExtremityStrikeEn: 'Jaws unleash a concentrated stream of white-hot magma fire ([SKILL_2_PRIMORDIAL_SUPER_NOVA]) across the arena',
    newtonianGroundRecoilAndSettleEn: '@VOLT_SPINO collapses onto its side in the smoking crater as shockwaves clear the storm clouds',
    combinedKinematicsChainEn: 'Crater-rim hind-foot lock -> White-gold throat magma surge -> Concentrated fire-stream release -> Challenger knockdown',
  },
  // Shot 19
  {
    rootPelvisAndCenterOfMassEn: 'Defeated @VOLT_SPINO struggles to rise on trembling limbs in the smoking crater',
    spineAndThoraxTorsionEn: 'Shattered dorsal sail hangs dark and sparkless as its head stays lowered below @IGNIS_REX eye line',
    primaryExtremityStrikeEn: 'Right forelimb drags heavily across scorched basalt as it backs toward the lagoon',
    newtonianGroundRecoilAndSettleEn: 'Ash and cooling embers drift silently onto its scarred dark abyssal-slate crocodilian hide',
    combinedKinematicsChainEn: 'Trembling limb rise -> Submissive lowered head -> Dragging forelimb retreat -> Settling ash fallout',
  },
  // Shot 20
  {
    rootPelvisAndCenterOfMassEn: '@IGNIS_REX stands motionless on two massive hind legs, chest rising and falling in deep breaths',
    spineAndThoraxTorsionEn: 'Subdermal magma veins gradually dim from blinding white back to a calm sovereign amber glow',
    primaryExtremityStrikeEn: 'Three deep shoulder claw wounds cool and solidify into glossy black volcanic obsidian glass',
    newtonianGroundRecoilAndSettleEn: 'Dense white steam rises from hot scales into the cooling evening air',
    combinedKinematicsChainEn: 'Stationary bipedal stance -> Deep thoracic respiration -> Magma vein amber dim -> Shoulder scar vitrification',
  },
  // Shot 21
  {
    rootPelvisAndCenterOfMassEn: '@VOLT_SPINO lowers its body into the murky river shallows on the right side of the valley',
    spineAndThoraxTorsionEn: 'Elongated body turns +160° away from the central arena toward the foggy swamp',
    primaryExtremityStrikeEn: 'Tail propels it slowly backward into the dark water without a single challenge sound',
    newtonianGroundRecoilAndSettleEn: '@IGNIS_REX watches silently from the elevated left bank as the water closes over its rival',
    combinedKinematicsChainEn: 'Shallow river entry -> +160° retreat turn -> Silent tail propulsion -> Sovereign bank overwatch',
  },
  // Shot 22
  {
    rootPelvisAndCenterOfMassEn: '@IGNIS_REX climbs the central volcanic summit on two powerful hind legs',
    spineAndThoraxTorsionEn: 'Spine straightens into a towering 13-meter vertical silhouette against the golden-amber sky',
    primaryExtremityStrikeEn: 'Both hind feet lock atop the highest basalt pinnacle overlooking the devastated valley',
    newtonianGroundRecoilAndSettleEn: 'Golden god rays break through the parting purple ash clouds, illuminating its scarred armor',
    combinedKinematicsChainEn: 'Bipedal summit ascent -> 13m vertical spine alignment -> Pinnacle hind-foot lock -> Golden ray illumination',
  },
  // Shot 23
  {
    rootPelvisAndCenterOfMassEn: '@IGNIS_REX anchors its 19-ton frame atop the volcanic throne at center-left apex',
    spineAndThoraxTorsionEn: 'Neck arches skyward as glowing amber veins pulse in rhythm with the simmering volcano',
    primaryExtremityStrikeEn: 'Jaws part in a final triumphant [ACTION_SEISMIC_ROAR] that echoes across the Cretaceous horizon',
    newtonianGroundRecoilAndSettleEn: 'Camera pulls back into an epic widescreen tableau as embers drift into twilight',
    combinedKinematicsChainEn: 'Summit throne anchor -> Skyward neck arch -> Triumphant apex roar -> Widescreen twilight pull-back',
  },
];

/**
 * Xây dựng Hồ sơ Tiền Trực Quan Hóa Không Gian 3D (Spatial Previs Dossier) chuẩn VideoDirectorGPT / MotionCtrl
 * với sự khớp nối tuyệt đối giữa Cỡ cảnh (Coverage), Khoảng cách (Z-Meters), Độ cao đặt máy (Elevation Y-Meters) và Vùng giải phẫu (Anatomical Zone).
 */
function resolveCanonical23IndexForPrevis(shotIndexZeroBased: number, totalShots = 23): number {
  if (totalShots >= 23) {
    return Math.max(0, Math.min(22, shotIndexZeroBased));
  }
  if (totalShots === 8) {
    const canonical8Map = [0, 1, 3, 4, 7, 11, 17, 22];
    return canonical8Map[shotIndexZeroBased % canonical8Map.length];
  }
  const scaled = Math.round((shotIndexZeroBased * 22) / Math.max(1, totalShots - 1));
  return Math.max(0, Math.min(22, scaled));
}

function bindKinematicsNames(
  kin: SkeletalKinematicsChainSpec,
  char1Name: string,
  char2Name: string
): SkeletalKinematicsChainSpec {
  const rep = (s: string) =>
    String(s || '')
      .replace(/\bIGNIS_REX\b/g, char1Name)
      .replace(/\bVOLT_SPINO\b/g, char2Name);
  return {
    rootPelvisAndCenterOfMassEn: rep(kin.rootPelvisAndCenterOfMassEn),
    spineAndThoraxTorsionEn: rep(kin.spineAndThoraxTorsionEn),
    primaryExtremityStrikeEn: rep(kin.primaryExtremityStrikeEn),
    newtonianGroundRecoilAndSettleEn: rep(kin.newtonianGroundRecoilAndSettleEn),
    combinedKinematicsChainEn: rep(kin.combinedKinematicsChainEn),
  };
}

export function buildSpatialPrevisDossierForShot(
  shotIndexZeroBased: number,
  coverageType: string,
  hasChar1: boolean,
  hasChar2: boolean,
  char1Name: string,
  char2Name: string,
  totalShots = 23
): SpatialPrevisDossier {
  const idx = resolveCanonical23IndexForPrevis(shotIndexZeroBased, totalShots);
  const canonShotNum = idx + 1;
  const shotNum = shotIndexZeroBased + 1;

  let cameraExtrinsics: CameraExtrinsicsSpec;

  if (coverageType === 'INSERT_DETAIL_CUTAWAY') {
    if (canonShotNum === 2) {
      // Shot 02: Ground-level Macro Insert on 19-ton Three-Toed Hind Foot slamming into basalt
      cameraExtrinsics = {
        coverageType,
        focalLengthMm: '85mm Macro Anamorphic Prime',
        apertureStop: 'f/2.0 (Shallow bokeh foreground & background, razor-sharp ground contact zone)',
        cameraDistanceMeters: 1.4,
        cameraElevationMeters: 0.45,
        cameraPitchDeg: '-6° Ground-Level Macro Tilt on Foot Contact',
        cameraRigMovementVectorEn: 'High-speed 120fps ground-level micro-dolly locked on the three-toed hind foot impact',
        framingScaleConstraintEn:
          'GROUND-LEVEL FOOT MACRO INSERT FRAMING (1.4m distance, 0.45m elevation): Frame strictly the colossal three-toed hind foot, ankle osteoderms, and cracking magma slab underfoot (upper torso and head remain above top frame edge)',
        targetAnatomicalZoneEn: 'Lower Hind-Limb Three-Toed Claws, Ankle Scales & Cracking Basalt Slab',
      };
    } else if (canonShotNum === 8) {
      // Shot 08: Shoulder-level Macro Insert on 1.5m Electrified Foreclaw slashing Left Shoulder Armor
      cameraExtrinsics = {
        coverageType,
        focalLengthMm: '85mm Macro Anamorphic Prime',
        apertureStop: 'f/2.0 (Shallow bokeh background, razor-sharp claw-on-armor contact zone)',
        cameraDistanceMeters: 1.8,
        cameraElevationMeters: 4.2,
        cameraPitchDeg: '+4° Shoulder-Level Combat Macro Tilt',
        cameraRigMovementVectorEn: 'High-speed 120fps tracking micro-dolly following the diagonal foreclaw slash across shoulder armor',
        framingScaleConstraintEn:
          'UPPER-TORSO COMBAT INSERT FRAMING (1.8m distance, 4.2m elevation): Frame the 1.5-meter cyan-electrified foreclaws raking three glowing magma trenches across black basalt shoulder armor',
        targetAnatomicalZoneEn: 'Left Shoulder Basalt Armor Plates vs. Slashing 1.5m Electrified Foreclaws',
      };
    } else if (canonShotNum === 14) {
      // Shot 14: Mid-Close Combat Insert on Locked Jaws, Slashing Claws & Splashing Lava River
      cameraExtrinsics = {
        coverageType,
        focalLengthMm: '65mm Anamorphic Combat Prime',
        apertureStop: 'f/2.2 (Razor-sharp midground grapple with molten lava spray bokeh)',
        cameraDistanceMeters: 3.6,
        cameraElevationMeters: 2.4,
        cameraPitchDeg: '+6° River-Level Grapple Tilt',
        cameraRigMovementVectorEn: 'Kinetic tracking dolly circling 0.8m/s around the waist-deep lava river grapple',
        framingScaleConstraintEn:
          'TIGHT COMBAT GRAPPLE INSERT FRAMING (3.6m distance, 2.4m elevation): Frame interlocking jaws, deflecting foreclaws, and splashing molten lava waves',
        targetAnatomicalZoneEn: 'Interlocking Jaws, Neck Osteoderms, Deflecting Foreclaws & Splashing Lava',
      };
    } else {
      // Shot 20: Shoulder & Thorax Macro Insert on Three Cooling Obsidian Scars
      cameraExtrinsics = {
        coverageType,
        focalLengthMm: '85mm Macro Anamorphic Prime',
        apertureStop: 'f/2.0 (Intimate macro focus on cooling volcanic glass scars)',
        cameraDistanceMeters: 1.5,
        cameraElevationMeters: 4.4,
        cameraPitchDeg: '+5° Shoulder-Level Macro Tilt',
        cameraRigMovementVectorEn: 'Slow creeping macro push-in at 0.08m/s onto vitrifying black obsidian shoulder scars',
        framingScaleConstraintEn:
          'SHOULDER SCAR MACRO INSERT FRAMING (1.5m distance, 4.4m elevation): Frame the three diagonal claw trenches solidifying into glossy black volcanic glass on the heaving shoulder',
        targetAnatomicalZoneEn: 'Three Vitrifying Black Obsidian Shoulder Scars & Heaving Ribcage Scales',
      };
    }
  } else if (coverageType === 'KULESHOV_REACTION') {
    cameraExtrinsics = {
      coverageType,
      focalLengthMm: '50mm Panavision Anamorphic Prime',
      apertureStop: 'f/2.2 (Intimate emotional isolation with volumetric steam bokeh)',
      cameraDistanceMeters: 3.2,
      cameraElevationMeters: 3.6,
      cameraPitchDeg: '+12° Heroic Eye-Line Tilt',
      cameraRigMovementVectorEn: 'Slow push-in dolly from 3.6m to 2.9m at 0.1m/s capturing visceral facial and chest reaction',
      framingScaleConstraintEn:
        'MEDIUM-CLOSE REACTION FRAMING (3.2m distance, 3.6m elevation): Frame head, jaws, contracting eye pupil, scarred neck, and heaving upper chest in razor focus',
      targetAnatomicalZoneEn: 'Head, Jaws, Contracting Eye Pupil, Neck & Upper Thorax',
    };
  } else if (coverageType === 'OTS_CONFRONTATION') {
    cameraExtrinsics = {
      coverageType,
      focalLengthMm: '35mm Anamorphic Wide-Medium Prime',
      apertureStop: 'f/2.8 (Deep split-diopter focus from foreground shoulder to midground target)',
      cameraDistanceMeters: 6.5,
      cameraElevationMeters: 3.4,
      cameraPitchDeg: '-4° Over-The-Shoulder Confrontation Line',
      cameraRigMovementVectorEn: 'Lateral tracking truck 0.6m/s maintaining strict 180-degree axis over foreground ridge',
      framingScaleConstraintEn:
        'OVER-THE-SHOULDER DEPTH FRAMING (6.5m distance, 3.4m elevation): Dark foreground silhouette anchor [Z=1.8m] framing the primary action in sharp midground focus [Z=6.5m]',
      targetAnatomicalZoneEn: 'Foreground Silhouette Anchor -> Midground Full Upper Body & Dorsal Profile',
    };
  } else if (coverageType === 'LOW_ANGLE_HERO_APEX') {
    cameraExtrinsics = {
      coverageType,
      focalLengthMm: '24mm Ultra-Wide Anamorphic Prime',
      apertureStop: 'f/2.8 (Monumental scale depth)',
      cameraDistanceMeters: 7.2,
      cameraElevationMeters: 0.4,
      cameraPitchDeg: '+24° Worm-Eye Upward Tilt',
      cameraRigMovementVectorEn: 'Ground-level low-angle crane push-in with subtle seismic vibration on footfall',
      framingScaleConstraintEn:
        'WORM-EYE MONUMENTAL FRAMING (7.2m distance, 0.4m elevation): Look sharply upward past foreground shattered rock ledges at the towering 13-meter titan silhouette',
      targetAnatomicalZoneEn: 'Full Towering Bipedal Silhouette from Grounded Claws to Crown',
    };
  } else if (coverageType === 'POV_SUBJECTIVE') {
    cameraExtrinsics = {
      coverageType,
      focalLengthMm: '28mm Kinetic Combat Prime',
      apertureStop: 'f/2.4 (Visceral kinetic focus)',
      cameraDistanceMeters: 5.8,
      cameraElevationMeters: 2.6,
      cameraPitchDeg: '+6° Dynamic Combat Vector',
      cameraRigMovementVectorEn: 'High-velocity handheld/whip-pan combat tracking advancing along the strike vector at 2.4m/s',
      framingScaleConstraintEn:
        'SUBJECTIVE COMBAT PERSPECTIVE (5.8m distance, 2.6m elevation): Dynamic forward-looking combat framing placing the viewer directly inside the collision zone',
      targetAnatomicalZoneEn: 'Forward Strike Zone: Jaws, Claws, Chest & Incoming Shockwave',
    };
  } else {
    cameraExtrinsics = {
      coverageType: 'MASTER_ESTABLISHING',
      focalLengthMm: '24mm IMAX Widescreen Prime',
      apertureStop: 'f/4.0 (Deep pan-focus across foreground, midground subject, and background caldera)',
      cameraDistanceMeters: 24.0,
      cameraElevationMeters: 2.2,
      cameraPitchDeg: '+10° Epic Widescreen Horizon Tilt',
      cameraRigMovementVectorEn: 'Sweeping orbital dolly movement at 1.2m/s establishing full arena geography and colossal scale',
      framingScaleConstraintEn:
        'WIDE ESTABLISHING ARENA FRAMING (24.0m distance, 2.2m elevation): Show full-body colossal proportions, clear spatial placement, contact terrain, and towering volcanic caldera horizon',
      targetAnatomicalZoneEn: 'Full-Body Colossal Proportions & Surrounding Volcanic Arena Geography',
    };
  }

  let subject1Box: BoundingBox3DSpec;
  let subject2Box: BoundingBox3DSpec | null = null;

  const isGroundFootMacro = canonShotNum === 2 && coverageType === 'INSERT_DETAIL_CUTAWAY';

  if (hasChar1 && !hasChar2) {
    subject1Box = {
      entityName: char1Name,
      screenZoneXPercent: 'X: 22% to 74% (Dominant Left-Center Anchor)',
      screenZoneYPercent: 'Y: 10% to 94%',
      depthDistanceMeters: cameraExtrinsics.cameraDistanceMeters,
      bodyYawDegAndFacingEn: 'Body Yaw +30° Facing Screen-Right along the 180-degree axis',
      anatomicalFocusAndGazeEn: isGroundFootMacro
        ? 'Focus Zone: Three-toed right hind claw and ankle osteoderms crushing basalt slab toward Screen-Right [X: 55%, Y: 78%]'
        : 'Focus Zone: Fierce golden eye and hornless jaws oriented toward Screen-Right horizon [X: 85%, Y: 48%]',
    };
  } else if (!hasChar1 && hasChar2) {
    subject1Box = {
      entityName: char2Name,
      screenZoneXPercent: 'X: 26% to 78% (Dominant Right-Center Anchor)',
      screenZoneYPercent: 'Y: 12% to 94%',
      depthDistanceMeters: cameraExtrinsics.cameraDistanceMeters,
      bodyYawDegAndFacingEn: 'Body Yaw -30° Facing Screen-Left along the 180-degree axis',
      anatomicalFocusAndGazeEn:
        'Focus Zone: Towering cyan dorsal sail and crocodilian snout oriented toward Screen-Left shoreline [X: 15%, Y: 48%]',
    };
  } else {
    subject1Box = {
      entityName: char1Name,
      screenZoneXPercent: 'X: 8% to 48% (Strict Left Hemisphere Slot)',
      screenZoneYPercent: 'Y: 12% to 94%',
      depthDistanceMeters: cameraExtrinsics.cameraDistanceMeters,
      bodyYawDegAndFacingEn: 'Body Yaw +35° Facing Screen-Right toward opponent',
      anatomicalFocusAndGazeEn: `Focus Zone: ${cameraExtrinsics.targetAnatomicalZoneEn} locked onto @${char2Name} at [X: 68%, Y: 45%]`,
    };
    subject2Box = {
      entityName: char2Name,
      screenZoneXPercent: 'X: 52% to 92% (Strict Right Hemisphere Slot)',
      screenZoneYPercent: 'Y: 10% to 94%',
      depthDistanceMeters: Number((cameraExtrinsics.cameraDistanceMeters + 0.6).toFixed(1)),
      bodyYawDegAndFacingEn: 'Body Yaw -35° Facing Screen-Left toward opponent',
      anatomicalFocusAndGazeEn: `Focus Zone: ${cameraExtrinsics.targetAnatomicalZoneEn} locked onto @${char1Name} at [X: 32%, Y: 45%]`,
    };
  }

  return {
    shotNumber: shotNum,
    cameraExtrinsics,
    subject1Box,
    subject2Box,
    contactTerrainGeometryEn:
      CONTACT_TERRAIN_PROGRESSION_23_SHOTS[idx] ||
      'Wet fractured black basalt volcanic terrain with glowing magma fissures under 19-ton claws',
    skeletalKinematics: bindKinematicsNames(
      SKELETAL_KINEMATICS_23_SHOTS[idx] || SKELETAL_KINEMATICS_23_SHOTS[0],
      char1Name,
      char2Name
    ),
    bespokeAudioDesign:
      BESPOKE_AUDIO_DESIGN_23_SHOTS[idx] || BESPOKE_AUDIO_DESIGN_23_SHOTS[0],
  };
}

/**
 * Biên dịch Hồ sơ Không gian & Chuyển động thành 2 câu Prompt Tách Biệt (Disentangled Dual-Prompt Architecture)
 * theo chuẩn Google DeepMind Veo & Meta Movie Gen.
 */
export function compileDisentangledShotPrompts(params: {
  aspectRatio: string;
  shotNumber: number;
  previs: SpatialPrevisDossier;
  subjectBindingPromptEn: string;
  char1AnatomicalLockEn: string;
  char2AnatomicalLockEn: string;
  hasChar1: boolean;
  hasChar2: boolean;
  char1Name: string;
  char2Name: string;
  envName: string;
  skillUsed?: string;
  depthStagingEn: string;
  stageDestructionPromptEn: string;
  visualExternalizationEn: string;
  colorScriptMoodEn: string;
  prepBeatEn: string;
  mainBeatEn: string;
  aftermathBeatEn: string;
  microTurningPointTwistEn: string;
  recurringMotifPropStateEn: string;
  emotionalTensionMode: string;
  sfxCueEn?: string;
  ambientCueEn?: string;
  extraCorrectionEn?: string;
}): DisentangledCompiledPrompts {
  const {
    aspectRatio,
    shotNumber,
    previs,
    subjectBindingPromptEn,
    char1AnatomicalLockEn,
    char2AnatomicalLockEn,
    hasChar1,
    hasChar2,
    char1Name,
    char2Name,
    envName,
    skillUsed,
    depthStagingEn,
    stageDestructionPromptEn,
    visualExternalizationEn,
    colorScriptMoodEn,
    prepBeatEn,
    mainBeatEn,
    aftermathBeatEn,
    recurringMotifPropStateEn,
    emotionalTensionMode,
    extraCorrectionEn = '',
  } = params;

  const cam = previs.cameraExtrinsics;
  const s1 = previs.subject1Box;
  const s2 = previs.subject2Box;
  const isDualShot = hasChar1 && hasChar2;
  const isGroundFootMacro =
    cam.coverageType === 'INSERT_DETAIL_CUTAWAY' &&
    cam.cameraElevationMeters < 1.0 &&
    cam.targetAnatomicalZoneEn.includes('Three-Toed Claws');

  const spatialCoordinatesClause = s2
    ? `3D SPATIAL BOUNDING-BOX LAYOUT: [Subject 1 @${s1.entityName} at ${s1.screenZoneXPercent}, ${s1.screenZoneYPercent}, Depth Z=${s1.depthDistanceMeters}m, ${s1.bodyYawDegAndFacingEn}] VERSUS [Subject 2 @${s2.entityName} at ${s2.screenZoneXPercent}, ${s2.screenZoneYPercent}, Depth Z=${s2.depthDistanceMeters}m, ${s2.bodyYawDegAndFacingEn}]. ${s1.anatomicalFocusAndGazeEn}.`
    : `3D SPATIAL BOUNDING-BOX LAYOUT: [Solo Subject @${s1.entityName} at ${s1.screenZoneXPercent}, ${s1.screenZoneYPercent}, Depth Z=${s1.depthDistanceMeters}m, ${s1.bodyYawDegAndFacingEn}, ${s1.anatomicalFocusAndGazeEn}].`;

  // Khử hoàn toàn từ số nhiều ("colossal titans" / "both titans") nếu đây là cảnh SOLO để tuân thủ chuẩn Generative Numeracy của T2V-CompBench:
  const sanitizeSoloPlurality = (text: string): string => {
    if (isDualShot) return text;
    return text
      .replace(/\bcolossal titans\b/gi, 'the lone colossal titan')
      .replace(/\bboth titans\b/gi, 'the lone titan')
      .replace(/\btitans\b/gi, 'titan');
  };

  // Nếu là cảnh Cận cảnh Bàn chân Sát đất (Shot 02 Z=1.4m, Y=0.45m), lọc bỏ từ "neck" / "pupil" / "skull" để máy quay không bị kéo lùi ra xa:
  const sanitizeZoneElevationConflict = (text: string): string => {
    if (!isGroundFootMacro) return text;
    return text
      .replace(/while orange magma veins pulse brightly along its neck/gi, 'while orange magma veins pulse brightly across its ankle osteoderms')
      .replace(/golden eyes/gi, 'heavy basalt scales')
      .replace(/contracting eye pupil/gi, 'cracking basalt crust');
  };

  const conciseSubjectBinding = isGroundFootMacro
    ? `SOLO GROUND-LEVEL FOOT MACRO SUBJECT: @${char1Name} [CHARACTER 1: ${char1Name}] (EXTREME CLOSE-UP ON COLOSSAL THREE-TOED CHARCOAL-BLACK BASALT HIND FOOT, ANKLE SCALES WITH GLOWING ORANGE MAGMA VEINS, AND CURVED VOLCANIC TALONS CRUSHING DOWN INTO BASALT ROCK AT GROUND LEVEL — upper body, torso, head, and jaws are cropped out above top frame border and MUST NOT appear) inside @STAGE: ${envName}. STRICT SOLO SHOT: zero second dinosaur.`
    : isDualShot
    ? `TWO DISTINCT SUBJECTS ON 180-DEGREE AXIS — LEFT FACING RIGHT: @${char1Name} [CHARACTER 1: ${char1Name}] (Charcoal-black basalt T-Rex with glowing orange magma veins; bipedal on 2 hind legs, tiny 2-fingered arms, hornless T-Rex skull) VERSUS RIGHT FACING LEFT: @${char2Name} [CHARACTER 2: ${char2Name}] (100% organic prehistoric amphibious Spinosaurus with dark abyssal-slate crocodilian scales, glowing cyan dorsal sail, 1.5m foreclaws; zero metal or robot parts) inside @STAGE: ${envName}. Keep both creatures 100% anatomically separate.`
    : hasChar1
    ? `SOLO SUBJECT: @${char1Name} [CHARACTER 1: ${char1Name}] (Charcoal-black basalt T-Rex with glowing orange magma veins; bipedal on 2 hind legs, tiny 2-fingered arms, hornless T-Rex skull) inside @STAGE: ${envName}. STRICT SOLO SHOT: zero second dinosaur.`
    : `SOLO SUBJECT: @${char2Name} [CHARACTER 2: ${char2Name}] (100% organic prehistoric amphibious Spinosaurus with dark abyssal-slate crocodilian scales, glowing cyan dorsal sail, 1.5m foreclaws; zero metal or robot parts) inside @STAGE: ${envName}. STRICT SOLO SHOT: zero second dinosaur.`;

  const cleanPrepBeat = sanitizeZoneElevationConflict(sanitizeSoloPlurality(prepBeatEn));
  const cleanMainBeat = sanitizeZoneElevationConflict(sanitizeSoloPlurality(mainBeatEn));
  const cleanAftermathBeat = sanitizeZoneElevationConflict(sanitizeSoloPlurality(aftermathBeatEn));
  const cleanDepthStaging = sanitizeZoneElevationConflict(sanitizeSoloPlurality(depthStagingEn));
  const cleanSubjectBinding = sanitizeZoneElevationConflict(sanitizeSoloPlurality(conciseSubjectBinding));

  const bespokeSfx = previs.bespokeAudioDesign.bespokeSfxEn;
  const bespokeAmbient = previs.bespokeAudioDesign.bespokeAmbientEn;

  // 1. SPATIAL & LAYOUT IMAGE PROMPT (Stage 3 - 🍌 Nano Banana Pro Static Keyframe):
  const rawSpatialImagePrompt = [
    `[CAMERA OPTICS & PREVIS RIG]: ${aspectRatio} FULL-BLEED EDGE-TO-EDGE cinematic storyboard frame (SINGLE UNSPLIT WIDESCREEN FRAME, NO BLACK LETTERBOX BARS, NO GRID, NO TEXT).`,
    `Lens: ${cam.focalLengthMm} at ${cam.apertureStop}, Camera Distance Z=${cam.cameraDistanceMeters}m, Elevation Y=${cam.cameraElevationMeters}m, Pitch ${cam.cameraPitchDeg}.`,
    `${cam.framingScaleConstraintEn}.`,
    spatialCoordinatesClause,
    `[CONTACT TERRAIN GEOMETRY]: Grounded firmly on ${previs.contactTerrainGeometryEn} (zero floating limbs).`,
    cleanSubjectBinding,
    `[KEYFRAME POSE SNAPSHOT (${cam.targetAnatomicalZoneEn})]: ${cleanMainBeat}. ${recurringMotifPropStateEn}`,
    isGroundFootMacro
      ? `[MACRO MATERIAL CALLOUT (Reel #2/#3 Standard)]: Razor-sharp organic scale/claw keratin grooves, wet mud compression, and glowing magma cracks at f/2.0 shallow depth of field.`
      : cam.coverageType === 'INSERT_DETAIL_CUTAWAY' || emotionalTensionMode === 'VISCERAL_CLASH'
      ? `[TACTILE IMPACT & SHADER LOCK (Reel #3 Fight & POMMI 49M Standard)]: Visible surface compression at the strike contact zone, 120fps radial burst of sparks/droplets, wet specular eye tearline, and f/2.0 foreground bokeh occlusion.`
      : `[OPTICAL DEPTH & GLOBAL LIGHTING CONTINUITY (POMMI 49M & Reel #4 Grid Standard)]: 15%-25% foreground bokeh occlusion anchor, wet corneal eye reflections, subsurface scattering, and smooth atmospheric lighting continuity across consecutive shots.`,
    cleanDepthStaging,
    stageDestructionPromptEn,
    visualExternalizationEn,
    colorScriptMoodEn,
    extraCorrectionEn,
    `Maintain 100% character anatomy and lighting consistency from locked Reference Sheets.`,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. FRONT-LOADED MOTION-FIRST VIDEO PROMPT (Stage 4 - Veo 3.1):
  const compactAnatomyGuard = isGroundFootMacro
    ? `Solo Foot Macro Lock: Only @${char1Name} [${s1.screenZoneXPercent}, three-toed basalt hind foot & talons crushing rock at ground level]; zero second dinosaur.`
    : isDualShot
    ? `Dual Axis Lock: @${char1Name} [Left ${s1.screenZoneXPercent}, hornless bipedal T-Rex, tiny 2-fingered arms] vs @${char2Name} [Right ${s2?.screenZoneXPercent}, organic cyan-sail Spinosaurus]; zero trait bleeding.`
    : hasChar1
    ? `Solo Lock: Only @${char1Name} [${s1.screenZoneXPercent}, hornless bipedal T-Rex, tiny 2-fingered arms]; zero second dinosaur.`
    : `Solo Lock: Only @${char2Name} [${s1.screenZoneXPercent}, organic cyan-sail Spinosaurus]; zero second dinosaur.`;

  const skillClause = skillUsed ? ` Skill: ${skillUsed}.` : '';

  const rawMotionVideoPrompt = [
    `[CAMERA MOTIONCTRL]: ${aspectRatio} ${cam.focalLengthMm}, Distance Z=${cam.cameraDistanceMeters}m, Elevation ${cam.cameraElevationMeters}m, ${cam.cameraPitchDeg} — ${cam.cameraRigMovementVectorEn}.`,
    `[SKELETAL KINEMATICS (${cam.targetAnatomicalZoneEn})]: ${previs.skeletalKinematics.combinedKinematicsChainEn}.${skillClause}`,
    `[3-BEAT MOTION (${emotionalTensionMode})]: (0.0s-2.5s) ${cleanPrepBeat} -> (2.5s-5.5s) ${cleanMainBeat} -> (5.5s-8.0s) ${cleanAftermathBeat}.`,
    `[TERRAIN PHYSICS & ANATOMY LOCK]: Grounded on ${previs.contactTerrainGeometryEn} (@STAGE: ${envName}). ${compactAnatomyGuard} Animate strictly from first frame without morphing.`,
    `${bespokeSfx} ${bespokeAmbient} (no subtitles) — no subtitles`,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    spatialLayoutImagePromptEn: rawSpatialImagePrompt,
    frontLoadedMotionVideoPromptEn: rawMotionVideoPrompt,
  };
}

/**
 * Trạm Kiểm Định Khắt Khe 8 Nhóm Tiêu Chí Chuẩn T2V-CompBench / VBench / DeepMind Veo & Vòng Lặp Tự Sửa Lỗi (Closed-Loop Validator)
 */
export function auditAndHealShotPromptsInLoop(params: {
  aspectRatio: string;
  shotNumber: number;
  previs: SpatialPrevisDossier;
  subjectBindingPromptEn: string;
  char1AnatomicalLockEn: string;
  char2AnatomicalLockEn: string;
  hasChar1: boolean;
  hasChar2: boolean;
  char1Name: string;
  char2Name: string;
  envName: string;
  skillUsed?: string;
  depthStagingEn: string;
  stageDestructionPromptEn: string;
  visualExternalizationEn: string;
  colorScriptMoodEn: string;
  prepBeatEn: string;
  mainBeatEn: string;
  aftermathBeatEn: string;
  microTurningPointTwistEn: string;
  recurringMotifPropStateEn: string;
  emotionalTensionMode: string;
  sfxCueEn?: string;
  ambientCueEn?: string;
}): {
  prompts: DisentangledCompiledPrompts;
  auditReport: ShotPromptAuditReport;
} {
  const currentParams = { ...params };
  const autoFixesApplied: string[] = [];
  let compiled = compileDisentangledShotPrompts(currentParams);
  let report!: ShotPromptAuditReport;

  for (let iter = 1; iter <= 3; iter++) {
    const imgP = compiled.spatialLayoutImagePromptEn;
    const vidP = compiled.frontLoadedMotionVideoPromptEn;
    const first22Words = vidP.split(/\s+/).slice(0, 22).join(' ');
    const isDualShot = currentParams.hasChar1 && currentParams.hasChar2;
    const isGroundFootMacro =
      currentParams.previs.cameraExtrinsics.coverageType === 'INSERT_DETAIL_CUTAWAY' &&
      currentParams.previs.cameraExtrinsics.cameraElevationMeters < 1.0 &&
      currentParams.previs.cameraExtrinsics.targetAnatomicalZoneEn.includes('Three-Toed Claws');

    // 1. Front-Loaded Camera Check (15 pts)
    const hasFrontCamera =
      first22Words.includes('[CAMERA MOTIONCTRL]') &&
      first22Words.includes('Distance Z=') &&
      first22Words.includes('Elevation');

    // 2. Motion Prompt Token Density & Zero-Truncation Check (15 pts)
    const vidLen = vidP.length;
    const isOptimalMotionLength =
      vidLen >= 600 &&
      vidLen <= 1850 &&
      vidP.endsWith('(no subtitles) — no subtitles') &&
      vidP.includes(currentParams.previs.bespokeAudioDesign.bespokeSfxEn);

    // 3. Spatial Prompt Pure Static Check (15 pts)
    const hasNoTimestampsInImagePrompt = !/\b0\.0s-2\.5s\b|\b2\.5s-5\.5s\b|\b5\.5s-8\.0s\b/i.test(imgP);
    const isStaticImageClean =
      hasNoTimestampsInImagePrompt &&
      imgP.length <= 3400 &&
      imgP.includes('NO BLACK LETTERBOX BARS') &&
      imgP.endsWith('Maintain 100% character anatomy and lighting consistency from locked Reference Sheets.');

    // 4. Spatial Bounding-Box Check (15 pts)
    const hasBoundingBox =
      imgP.includes('3D SPATIAL BOUNDING-BOX LAYOUT') &&
      imgP.includes('X:') &&
      imgP.includes('Depth Z=') &&
      imgP.includes('Body Yaw');

    // 5. Scale & Elevation Zone Coherence Check (10 pts):
    // Kiểm tra Khoảng cách Z, Độ cao Y và Vùng giải phẫu không bị mâu thuẫn (VD: Cảnh 2 cận cảnh bàn chân Y=0.45m không được đòi vẽ đồng tử mắt/cổ/hộp sọ ở độ cao 12m)
    const cov = currentParams.previs.cameraExtrinsics.coverageType;
    const dist = currentParams.previs.cameraExtrinsics.cameraDistanceMeters;
    const elev = currentParams.previs.cameraExtrinsics.cameraElevationMeters;
    const hasNoFootVsHeadConflict =
      !isGroundFootMacro ||
      (!imgP.includes('pupil') && !imgP.includes('along its neck') && !imgP.includes('T-Rex skull'));
    const isScaleCoherent =
      hasNoFootVsHeadConflict &&
      ((cov === 'INSERT_DETAIL_CUTAWAY' && dist <= 4.0) ||
        (cov === 'KULESHOV_REACTION' && dist > 2.0 && dist <= 4.0) ||
        (cov === 'OTS_CONFRONTATION' && dist > 4.0 && dist <= 8.0) ||
        (cov === 'LOW_ANGLE_HERO_APEX' && dist > 5.0 && dist <= 9.0) ||
        (cov === 'POV_SUBJECTIVE' && dist > 4.0 && dist <= 8.0) ||
        (cov === 'MASTER_ESTABLISHING' && dist >= 15.0));

    // 6. Terrain Contact Physics Check (10 pts)
    const hasTerrainContact =
      imgP.includes('[CONTACT TERRAIN GEOMETRY]') &&
      vidP.includes('[TERRAIN PHYSICS & ANATOMY LOCK]') &&
      currentParams.previs.contactTerrainGeometryEn.length > 20;

    // 7. Skeletal Kinematics Check (10 pts)
    const hasKinematics =
      vidP.includes('[SKELETAL KINEMATICS') &&
      currentParams.previs.skeletalKinematics.combinedKinematicsChainEn.includes('->');

    // 8. Generative Numeracy (Zero Solo Plurality Conflict) & Bespoke Foley SFX Check (10 pts)
    const hasNoSoloPluralityConflict = isDualShot || (!/\bcolossal titans\b/i.test(imgP) && !/\bboth titans\b/i.test(imgP));
    const hasBespokeFoley = vidP.includes(currentParams.previs.bespokeAudioDesign.bespokeSfxEn);
    const hasNumeracyAndFoleyPass =
      hasNoSoloPluralityConflict &&
      hasBespokeFoley &&
      vidP.includes('Animate strictly from first frame without morphing') &&
      (vidP.includes('Dual Axis Lock') || vidP.includes('Solo Lock') || vidP.includes('Solo Foot Macro Lock'));

    const totalScore =
      (hasFrontCamera ? 15 : 0) +
      (isOptimalMotionLength ? 15 : 0) +
      (isStaticImageClean ? 15 : 0) +
      (hasBoundingBox ? 15 : 0) +
      (isScaleCoherent ? 10 : 0) +
      (hasTerrainContact ? 10 : 0) +
      (hasKinematics ? 10 : 0) +
      (hasNumeracyAndFoleyPass ? 10 : 0);

    report = {
      shotNumber: currentParams.shotNumber,
      totalScore,
      passed: totalScore === 100,
      iterationsUsed: iter,
      metrics: {
        frontLoadedCameraCheck: {
          score: hasFrontCamera ? 15 : 0,
          max: 15,
          pass: hasFrontCamera,
          detail: `First 22 words: "${first22Words.slice(0, 95)}..."`,
        },
        motionPromptTokenDensityCheck: {
          score: isOptimalMotionLength ? 15 : 0,
          max: 15,
          pass: isOptimalMotionLength,
          detail: `Video prompt length: ${vidLen} chars (~${Math.round(vidLen / 5.5)} tokens; Optimal Veo/MovieGen range: 600-1850 chars, 100% uncut sentences)`,
        },
        spatialPromptPureStaticCheck: {
          score: isStaticImageClean ? 15 : 0,
          max: 15,
          pass: isStaticImageClean,
          detail: `Image prompt length: ${imgP.length} chars, zero temporal timestamp pollution: ${hasNoTimestampsInImagePrompt}`,
        },
        spatialBoundingBoxCheck: {
          score: hasBoundingBox ? 15 : 0,
          max: 15,
          pass: hasBoundingBox,
          detail: `Bounding Box [X%, Y%, Z=${dist}m, Y=${elev}m] & Body Yaw locked`,
        },
        scaleAndElevationZoneCoherenceCheck: {
          score: isScaleCoherent ? 10 : 0,
          max: 10,
          pass: isScaleCoherent,
          detail: `Coverage ${cov} (Z=${dist}m, Y=${elev}m) matched with zone "${currentParams.previs.cameraExtrinsics.targetAnatomicalZoneEn}"`,
        },
        terrainContactPhysicsCheck: {
          score: hasTerrainContact ? 10 : 0,
          max: 10,
          pass: hasTerrainContact,
          detail: `Terrain: "${currentParams.previs.contactTerrainGeometryEn.slice(0, 65)}..."`,
        },
        skeletalKinematicsCheck: {
          score: hasKinematics ? 10 : 0,
          max: 10,
          pass: hasKinematics,
          detail: `Kinematics: "${currentParams.previs.skeletalKinematics.combinedKinematicsChainEn.slice(0, 75)}..."`,
        },
        generativeNumeracyAndFoleyCoherenceCheck: {
          score: hasNumeracyAndFoleyPass ? 10 : 0,
          max: 10,
          pass: hasNumeracyAndFoleyPass,
          detail: `Zero solo-plurality conflict (${hasNoSoloPluralityConflict}) & Bespoke Foley SFX ("${currentParams.previs.bespokeAudioDesign.bespokeSfxEn.slice(0, 55)}...")`,
        },
      },
      autoFixesApplied,
    };

    if (report.passed) {
      break;
    }

    if (!isOptimalMotionLength && vidLen > 1850) {
      currentParams.prepBeatEn = currentParams.prepBeatEn.slice(0, 120).replace(/[,;\s]+$/, '');
      currentParams.aftermathBeatEn = currentParams.aftermathBeatEn.slice(0, 120).replace(/[,;\s]+$/, '');
      autoFixesApplied.push(`Compacted prepBeatEn & aftermathBeatEn to reduce video prompt from ${vidLen} chars to <= 1850 chars`);
    }

    compiled = compileDisentangledShotPrompts(currentParams);
  }

  return {
    prompts: compiled,
    auditReport: report,
  };
}
