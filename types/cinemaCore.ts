export type ProductionGenre = 'action_scifi' | 'tvc_commercial' | 'short_entertainment';

export type PipelineRunningMode = 'draft_ultrafast' | 'master_cinematic';

export type ProductionStep = 
  | 'idle'
  | 'extracting_script'
  | 'forging_dna'
  | 'compositing_keyframes'
  | 'rendering_video_takes'
  | 'judging_quality'
  | 'assembling_master'
  | 'completed';

export type UserExperienceMode = 'easy_autopilot' | 'director_pro';

export type EntityCategory = 'hero' | 'mecha_robot' | 'kaiju_monster' | 'weapon_artifact' | 'vehicle';

export type EntityConditionState = 'pristine_normal' | 'combat_mode' | 'battle_damaged' | 'awakened_overdrive';

export type CameraTransitionType = 'HARD_CUT_NEW_ANGLE' | 'CONTINUOUS_MATCH_FRAME' | 'A_TO_B_BRIDGE';

export type ActionPacingStyle = 'slow_suspense' | 'martial_arts_fast' | 'epic_mecha_scale';

export type LensPreset = 
  | '16mm_UltraWide_Scale'
  | '24mm_Anamorphic_Action'
  | '50mm_Cinematic'
  | '85mm_Dramatic_CloseUp'
  | 'FPV_Dynamic_Chase';

export type FlowVideoModelName = 
  | 'Omni 1.1 Flash'
  | 'Veo 3.1 - Lite'
  | 'Veo 3.1 - Fast'
  | 'Veo 3.1 - Quality';

export type FlowImageModelName =
  | '🍌 Nano Banana Pro'
  | '🍌 Nano Banana 2.1'
  | '🍌 Nano Banana 2 Lite';

export interface TurnaroundAngles {
  front?: string;
  frontMediaId?: string;
  threeQuarter?: string;
  threeQuarterMediaId?: string;
  side?: string;
  sideMediaId?: string;
  back?: string;
  backMediaId?: string;
  sheetCompositeUrl?: string;
  sheetCompositeMediaId?: string;
}

export interface TurnaroundSheet {
  state: EntityConditionState;
  stateLabel: string;
  visualPromptAnchor: string;
  angles: TurnaroundAngles;
  energyFxPrompt?: string;
  energyFxMediaUrl?: string;
  weaponSpecSheetUrl?: string;
  updatedAt: number;
}

export interface WorldEntity {
  id: string;
  name: string;
  codeName: string;
  category: EntityCategory;
  scaleMeters: number;
  primaryColorPalette: string[];
  bioSummary: string;
  states: Record<EntityConditionState, TurnaroundSheet>;
  signatureSkills: {
    name: string;
    description: string;
    vfxStyle: string;
  }[];
  activePreviewState: EntityConditionState;
}

export interface EnvironmentStage {
  id: string;
  name: string;
  sceneType: 'cyberpunk_city' | 'orbital_dock' | 'alien_wasteland' | 'tokyo_neo_shinjuku' | 'underground_core';
  weather: 'acid_rain' | 'neon_smog' | 'plasma_aurora' | 'blizzard' | 'toxic_ash' | 'clear_starlight';
  keyLightDirection: 'top_left_45_cyan' | 'overhead_sun' | 'backlit_rim_amber' | 'underlit_volcanic' | 'dynamic_strobe';
  colorLUT: 'Blade_Runner_Teal_Orange' | 'Ghost_In_Shell_Emerald' | 'Akira_Crimson_Volt' | 'Matrix_Acid_Mono' | 'Interstellar_Tungsten';
  spatialViews: {
    northUrl?: string;
    northMediaId?: string;
    southUrl?: string;
    southMediaId?: string;
    eastUrl?: string;
    eastMediaId?: string;
    aerialUrl?: string;
    aerialMediaId?: string;
  };
  promptAnchor: string;
}

export interface VideoTake {
  takeId: string;
  shotId: string;
  takeNumber: number;
  modelUsed: FlowVideoModelName;
  videoUrl: string;
  mediaId?: string;
  duration: number; // in seconds: 4 | 6 | 8 | 10
  resolution: '360p' | '720p';
  creditCost: number;
  createdAt: number;
  isSelectedForMaster: boolean;
  directorNotes?: string;
  lastFrameUrl?: string;
  lastFrameMediaId?: string;
  isExtended?: boolean;
  conversationalEditsCount?: number;
  is4KMaster?: boolean;
}

export interface ShotReferenceSlot {
  id: string;
  tag: string; // e.g. '[IMAGE 1: Nhân vật]'
  role: 'character' | 'weapon' | 'environment' | 'custom';
  name: string;
  imageUrl?: string;
  mediaId?: string;
}

export interface VoiceStyleSpec {
  voicePreset: 'pilot_male_calm' | 'commander_female_authoritative' | 'ai_system_cold' | 'warrior_deep_grit';
  voiceEmotionPrompt: string;
  sampleAudioMediaId?: string;
  sampleAudioUrl?: string;
}

export interface MLLMJudgeVerdict {
  score: number; // 0 - 100
  verdict: 'PASS' | 'RETRY_NEEDED';
  critique: string;
  suggestedPromptPatch?: string;
  retried: boolean;
  verifiedAt: number;
}

export interface TimelineShot {
  id: string;
  shotNumber: number;
  sceneHeading: string;
  scriptDescription: string;
  targetDurationSeconds: number; // 4, 6, 8, 10
  selectedModel: FlowVideoModelName;
  lensPreset: LensPreset;
  cameraMovement: string;
  cameraTransitionType: CameraTransitionType;
  primaryEntityId?: string;
  entityStateUsed?: EntityConditionState;
  environmentStageId?: string;
  
  // Master Keyframe Compositor
  startKeyframeMediaId?: string;
  startKeyframeUrl?: string;
  endKeyframeMediaId?: string;
  endKeyframeUrl?: string;
  keyframePrompt: string;
  referenceSlots: ShotReferenceSlot[];
  
  activePrompt: string;
  takes: VideoTake[];
  masterTakeId?: string;
  audioSpec: {
    sfxLayer: string;
    dialogueLine?: string;
    audioReferenceMediaId?: string;
  };
  voiceSpec?: VoiceStyleSpec;
  isRendering?: boolean;

  // Google Research Core Upgrades:
  // 1. CANVAS Persistent Visual Memory Anchor
  canvasMemoryAnchorUrl?: string;
  canvasMemoryAnchorMediaId?: string;
  isDnaStateShift?: boolean; // Tự động đánh dấu Shot có biến hình/hư hại để làm mỏ neo mới

  // 2. VQQA MLLM Judge Status
  judgeVerdict?: MLLMJudgeVerdict;
}

export interface EpisodeContinuityPack {
  episodeNumber: number;
  episodeTitle: string;
  timestamp: number;
  finalShotId: string;
  finalEntityState: EntityConditionState;
  hullDamageLevel: number;
  lastFrameUrl?: string;
  lastFrameMediaId?: string;
  spatialPosition: string;
  cliffhangerSummary: string;
  directorNotes: string;
}