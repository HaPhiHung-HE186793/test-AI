import {
  TimelineShot,
  EntityDnaProfile,
  EnvironmentStage,
  ReferenceIngredientSlot,
} from '../types/cinemaCore';

/**
 * Tự động gán 3 Khe Tham Chiếu (Auto-Bind 3 Reference Slots) cho mỗi Shot:
 * - Slot 1: Nhân vật chính theo đúng trạng thái (NORMAL / DAMAGED_50 / OVERDRIVE_100) hoặc Mỏ neo Ký ức CANVAS
 * - Slot 2: Nhân vật phụ / Đối thủ (nếu có) hoặc Vũ khí Đặc trưng
 * - Slot 3: Bối cảnh Không gian (Environment Stage)
 */
export function buildAutoBoundReferenceSlots(
  shot: Partial<TimelineShot>,
  entities: EntityDnaProfile[],
  stage?: EnvironmentStage,
  canvasMemoryAnchor?: { mediaId?: string; url?: string }
): ReferenceIngredientSlot[] {
  const hasExplicitParticipants =
    Array.isArray(shot.participatingEntityIds) &&
    shot.participatingEntityIds.length > 0;

  const primaryEntity =
    entities.find((e) => shot.participatingEntityIds?.includes(e.id)) ||
    entities[0];
  const secondaryEntity = hasExplicitParticipants
    ? entities.find(
        (e) =>
          e.id !== primaryEntity?.id &&
          shot.participatingEntityIds?.includes(e.id)
      )
    : entities[1];

  const stateKey = shot.entityStateUsed || primaryEntity?.activeState || 'NORMAL';
  const activeStateObj =
    primaryEntity?.states?.[stateKey] || primaryEntity?.states?.NORMAL;

  // Nếu đã có Mỏ neo Ký ức CANVAS (bảng 3-Panel Overdrive sạch trên nền #808080), ưu tiên neo mediaId của trạng thái tương ứng
  const primaryMediaId =
    activeStateObj?.mediaId ||
    (stateKey !== 'NORMAL' && canvasMemoryAnchor?.mediaId) ||
    primaryEntity?.states?.NORMAL?.mediaId;

  const primaryImageUrl =
    activeStateObj?.imageUrl ||
    (stateKey !== 'NORMAL' && canvasMemoryAnchor?.url) ||
    primaryEntity?.states?.NORMAL?.imageUrl;

  const slots: ReferenceIngredientSlot[] = [
    {
      slotIndex: 1,
      role: 'CHARACTER',
      label: `[IMAGE 1 (LEFT/PRIMARY): ${primaryEntity?.name || 'Nhân vật Chính'} (${stateKey})]`,
      mediaId: primaryMediaId,
      imageUrl: primaryImageUrl,
      promptToken: secondaryEntity
        ? `[ON THE LEFT FROM REFERENCE IMAGE 1: ${primaryEntity?.name || 'Protagonist'} - ${
            activeStateObj?.promptModifier || primaryEntity?.coreTraitsPrompt || ''
          }]`
        : `[SOLO SUBJECT FROM REFERENCE IMAGE 1: ${primaryEntity?.name || 'Protagonist'} - ${
            activeStateObj?.promptModifier || primaryEntity?.coreTraitsPrompt || ''
          }. STRICT SOLO SHOT: zero second character]`,
    },
    {
      slotIndex: 2,
      role: secondaryEntity ? 'CHARACTER' : 'PROP_WEAPON',
      label: secondaryEntity
        ? `[IMAGE 2 (RIGHT/RIVAL): ${secondaryEntity.name} (Đối thủ)]`
        : `[IMAGE 2: ${primaryEntity?.signatureWeapon || 'Vũ khí / Đạo cụ (Chỉ khóa Text)'}]`,
      mediaId: secondaryEntity ? secondaryEntity.states?.NORMAL?.mediaId : undefined,
      imageUrl: secondaryEntity ? secondaryEntity.states?.NORMAL?.imageUrl : undefined,
      promptToken: secondaryEntity
        ? `[ON THE RIGHT FROM REFERENCE IMAGE 2: ${secondaryEntity.name} - ${secondaryEntity.coreTraitsPrompt}. STRICT ANTI-BLEEDING LOCK: never merge traits between Image 1 and Image 2]`
        : `[SIGNATURE GEAR: ${
            primaryEntity?.signatureWeapon || 'Signature Weapon'
          }, high-energy detail]`,
    },
    {
      slotIndex: 3,
      role: 'ENVIRONMENT',
      label: `[IMAGE 3 (STAGE): ${stage?.name || 'Bối cảnh Chính'}]`,
      mediaId: stage?.spatialViews?.northMediaId,
      imageUrl: stage?.spatialViews?.northUrl,
      promptToken: `[BACKGROUND ENVIRONMENT FROM REFERENCE IMAGE ${secondaryEntity ? '3' : '2'}: ${stage?.name || 'Environment'} - ${
        stage?.architectureStyle || ''
      }, ${stage?.lightingMood || ''}, ${stage?.weatherCondition || ''}]`,
    },
  ];

  return slots;
}
