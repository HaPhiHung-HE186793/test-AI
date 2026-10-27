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
  const primaryEntity =
    entities.find((e) => shot.participatingEntityIds?.includes(e.id)) ||
    entities[0];
  const secondaryEntity =
    entities.find(
      (e) =>
        e.id !== primaryEntity?.id &&
        shot.participatingEntityIds?.includes(e.id)
    ) || entities[1];

  const stateKey = shot.entityStateUsed || primaryEntity?.activeState || 'NORMAL';
  const activeStateObj =
    primaryEntity?.states?.[stateKey] || primaryEntity?.states?.NORMAL;

  // Nếu đã có Mỏ neo Ký ức CANVAS (sau khi nhân vật chuyển sang trạng thái bị thương/biến hình),
  // ưu tiên neo hình ảnh đó hoặc mediaId của trạng thái tương ứng
  const primaryMediaId =
    (stateKey !== 'NORMAL' && canvasMemoryAnchor?.mediaId) ||
    activeStateObj?.mediaId ||
    primaryEntity?.states?.NORMAL?.mediaId;

  const primaryImageUrl =
    (stateKey !== 'NORMAL' && canvasMemoryAnchor?.url) ||
    activeStateObj?.imageUrl ||
    primaryEntity?.states?.NORMAL?.imageUrl;

  const slots: ReferenceIngredientSlot[] = [
    {
      slotIndex: 1,
      role: 'CHARACTER',
      label: `[IMAGE 1: ${primaryEntity?.name || 'Nhân vật Chính'} (${stateKey})]`,
      mediaId: primaryMediaId,
      imageUrl: primaryImageUrl,
      promptToken: `[IMAGE 1: ${primaryEntity?.name || 'Protagonist'} - ${
        activeStateObj?.promptModifier || primaryEntity?.coreTraitsPrompt || ''
      }]`,
    },
    {
      slotIndex: 2,
      role: secondaryEntity ? 'CHARACTER' : 'PROP_WEAPON',
      label: secondaryEntity
        ? `[IMAGE 2: ${secondaryEntity.name} (Đối thủ)]`
        : `[IMAGE 2: ${primaryEntity?.signatureWeapon || 'Vũ khí / Đạo cụ'}]`,
      mediaId: secondaryEntity?.states?.NORMAL?.mediaId || primaryMediaId,
      imageUrl: secondaryEntity?.states?.NORMAL?.imageUrl || primaryImageUrl,
      promptToken: secondaryEntity
        ? `[IMAGE 2: ${secondaryEntity.name} - ${secondaryEntity.coreTraitsPrompt}]`
        : `[IMAGE 2: ${
            primaryEntity?.signatureWeapon || 'Signature Weapon'
          }, high-energy detail]`,
    },
    {
      slotIndex: 3,
      role: 'ENVIRONMENT',
      label: `[IMAGE 3: ${stage?.name || 'Bối cảnh Chính'}]`,
      mediaId: stage?.spatialViews?.northMediaId,
      imageUrl: stage?.spatialViews?.northUrl,
      promptToken: `[IMAGE 3: ${stage?.name || 'Environment'} - ${
        stage?.architectureStyle || ''
      }, ${stage?.lightingMood || ''}, ${stage?.weatherCondition || ''}]`,
    },
  ];

  return slots;
}
