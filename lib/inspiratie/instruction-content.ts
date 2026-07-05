/**
 * Normalizes inspiration dish data into unified instruction steps and extra media.
 */

export type InspirationCategory = 'CHEFF' | 'GROWN' | 'DESIGNER';

export type StepPhotoInput = {
  id: string;
  url: string;
  stepNumber: number;
  description?: string | null;
};

export type GrowthPhotoInput = {
  id: string;
  url: string;
  phaseNumber: number;
  description?: string | null;
};

export type InstructionStep = {
  number: number;
  title?: string | null;
  text: string;
  photos: Array<{ id: string; url: string; caption?: string | null }>;
};

export type InstructionMeta = {
  prepTime?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  subcategory?: string | null;
  location?: string | null;
  plantType?: string | null;
  sunlight?: string | null;
  waterNeeds?: string | null;
  soilType?: string | null;
  growthDuration?: number | null;
  harvestDate?: string | null;
  plantDate?: string | null;
  plantDistance?: string | null;
  dimensions?: string | null;
};

export type ExtraMediaItem = {
  id: string;
  url: string;
  caption?: string | null;
  kind: 'step' | 'growth' | 'photo';
};

export type InstructionContentInput = {
  category: InspirationCategory;
  instructions: string[];
  ingredients: string[];
  materials: string[];
  stepPhotos: StepPhotoInput[];
  growthPhotos: GrowthPhotoInput[];
  notes?: string | null;
  meta?: InstructionMeta;
};

export type InstructionContentResult = {
  steps: InstructionStep[];
  supplies: string[];
  usedPhotoIds: Set<string>;
  usedPhotoUrls: Set<string>;
  extraMedia: ExtraMediaItem[];
  hasInstructionContent: boolean;
};

export const INSTRUCTION_TYPE_LABEL_KEY: Record<InspirationCategory, string> = {
  CHEFF: 'inspiratie.instructions.recipe',
  GROWN: 'inspiratie.instructions.growingGuide',
  DESIGNER: 'inspiratie.instructions.designWork',
};

export const INSTRUCTION_SUPPLIES_LABEL_KEY: Record<InspirationCategory, string> = {
  CHEFF: 'inspiratie.instructions.ingredients',
  GROWN: 'inspiratie.instructions.supplies',
  DESIGNER: 'inspiratie.instructions.materials',
};

export const INSTRUCTION_STEPS_LABEL_KEY: Record<InspirationCategory, string> = {
  CHEFF: 'inspiratie.instructions.steps',
  GROWN: 'inspiratie.instructions.growthPhases',
  DESIGNER: 'inspiratie.instructions.makingSteps',
};

export const EXTRA_MEDIA_LABEL_KEY: Record<InspirationCategory, string> = {
  CHEFF: 'inspiratie.instructions.extraPhotosCheff',
  GROWN: 'inspiratie.instructions.extraPhotosGrown',
  DESIGNER: 'inspiratie.instructions.extraPhotosDesigner',
};

function nonEmptyStrings(items: string[]): string[] {
  return items.filter((s) => typeof s === 'string' && s.trim().length > 0);
}

/** Split designer notes into steps when no formal instructions exist. */
export function splitNotesIntoSteps(notes: string): string[] {
  const trimmed = notes.trim();
  if (!trimmed) return [];

  const numbered = trimmed.split(/\n(?=\d+[\.\):]\s)/);
  if (numbered.length > 1) {
    return numbered
      .map((part) => part.replace(/^\d+[\.\):]\s*/, '').trim())
      .filter(Boolean);
  }

  const paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) return paragraphs;

  return [trimmed];
}

function resolveInstructionTexts(
  category: InspirationCategory,
  instructions: string[],
  notes?: string | null,
): string[] {
  const fromInstructions = nonEmptyStrings(instructions);
  if (fromInstructions.length > 0) return fromInstructions;

  if (category === 'DESIGNER' && notes?.trim()) {
    return splitNotesIntoSteps(notes);
  }

  return [];
}

function photosForStep(
  stepNumber: number,
  stepPhotos: StepPhotoInput[],
  growthPhotos: GrowthPhotoInput[],
  category: InspirationCategory,
): Array<{ id: string; url: string; caption?: string | null }> {
  if (stepNumber < 1) return [];

  const fromSteps = stepPhotos
    .filter((p) => p.stepNumber === stepNumber)
    .map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.description ?? null,
    }));

  if (fromSteps.length > 0) return fromSteps;

  if (category === 'GROWN') {
    return growthPhotos
      .filter((p) => p.phaseNumber === stepNumber)
      .map((p) => ({
        id: p.id,
        url: p.url,
        caption: p.description ?? null,
      }));
  }

  return [];
}

function buildStepsFromTexts(
  texts: string[],
  stepPhotos: StepPhotoInput[],
  growthPhotos: GrowthPhotoInput[],
  category: InspirationCategory,
  usedPhotoIds: Set<string>,
  usedPhotoUrls: Set<string>,
): InstructionStep[] {
  return texts.map((text, index) => {
    const number = index + 1;
    const photos = photosForStep(number, stepPhotos, growthPhotos, category);
    photos.forEach((p) => {
      usedPhotoIds.add(p.id);
      usedPhotoUrls.add(p.url);
    });
    return { number, text, photos };
  });
}

export function buildInstructionContent(input: InstructionContentInput): InstructionContentResult {
  const {
    category,
    instructions: rawInstructions,
    ingredients,
    materials,
    stepPhotos,
    growthPhotos,
    notes,
  } = input;

  const instructionTexts = resolveInstructionTexts(category, rawInstructions, notes);
  const usedPhotoIds = new Set<string>();
  const usedPhotoUrls = new Set<string>();
  let steps: InstructionStep[] = [];

  const supplies =
    category === 'CHEFF'
      ? nonEmptyStrings(ingredients)
      : nonEmptyStrings(materials);

  if (instructionTexts.length > 0) {
    steps = buildStepsFromTexts(
      instructionTexts,
      stepPhotos,
      growthPhotos,
      category,
      usedPhotoIds,
      usedPhotoUrls,
    );
  } else if (category === 'GROWN' && growthPhotos.length > 0) {
    const sorted = [...growthPhotos].sort((a, b) => a.phaseNumber - b.phaseNumber);
    sorted.forEach((photo) => {
      if (photo.phaseNumber < 1) return;
      usedPhotoIds.add(photo.id);
      usedPhotoUrls.add(photo.url);
      steps.push({
        number: photo.phaseNumber,
        text: photo.description?.trim() || '',
        photos: [{ id: photo.id, url: photo.url, caption: photo.description ?? null }],
      });
    });
  }

  const extraMedia: ExtraMediaItem[] = [
    ...stepPhotos
      .filter((p) => !usedPhotoIds.has(p.id) && !usedPhotoUrls.has(p.url))
      .map((p) => ({
        id: p.id,
        url: p.url,
        caption: p.description ?? null,
        kind: 'step' as const,
      })),
    ...growthPhotos
      .filter((p) => !usedPhotoIds.has(p.id) && !usedPhotoUrls.has(p.url))
      .map((p) => ({
        id: p.id,
        url: p.url,
        caption: p.description ?? null,
        kind: 'growth' as const,
      })),
  ];

  const hasInstructionContent =
    steps.length > 0 || supplies.length > 0 || extraMedia.length > 0;

  return { steps, supplies, usedPhotoIds, usedPhotoUrls, extraMedia, hasInstructionContent };
}

export type LightboxMediaItem = {
  id: string;
  url: string;
  kind: 'image' | 'video';
  thumbnail?: string | null;
  caption?: string | null;
  isMain?: boolean;
};

export function buildHeroMediaItems(
  photos: Array<{ id: string; url: string; idx?: number | null; isMain?: boolean }>,
  videos: Array<{ id: string; url: string; thumbnail?: string | null }>,
): LightboxMediaItem[] {
  const sortedPhotos = [...photos].sort((a, b) => {
    const aIdx = typeof a.idx === 'number' ? a.idx : 0;
    const bIdx = typeof b.idx === 'number' ? b.idx : 0;
    return aIdx - bIdx;
  });

  if (sortedPhotos.length > 0) {
    const mainIndex = sortedPhotos.findIndex((p) => p.isMain);
    if (mainIndex > 0) {
      const [main] = sortedPhotos.splice(mainIndex, 1);
      sortedPhotos.unshift(main);
    }
  }

  const items: LightboxMediaItem[] = [
    ...sortedPhotos.map((p) => ({
      id: p.id,
      url: p.url,
      kind: 'image' as const,
      thumbnail: p.url,
      isMain: p.isMain,
    })),
    ...videos.map((v) => ({
      id: v.id,
      url: v.url,
      kind: 'video' as const,
      thumbnail: v.thumbnail ?? null,
    })),
  ];

  const seen = new Set<string>();
  return items.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

export function buildFullLightboxItems(
  heroItems: LightboxMediaItem[],
  steps: InstructionStep[],
  extraMedia: ExtraMediaItem[],
): LightboxMediaItem[] {
  const stepMedia: LightboxMediaItem[] = steps.flatMap((step) =>
    step.photos.map((p) => ({
      id: p.id,
      url: p.url,
      kind: 'image' as const,
      thumbnail: p.url,
      caption: p.caption || step.text.slice(0, 120) || null,
    })),
  );

  const extra: LightboxMediaItem[] = extraMedia.map((m) => ({
    id: m.id,
    url: m.url,
    kind: 'image' as const,
    thumbnail: m.url,
    caption: m.caption ?? null,
  }));

  const combined = [...heroItems, ...stepMedia, ...extra];
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  return combined.filter((m) => {
    if (seenIds.has(m.id)) return false;
    if (m.kind === 'image' && seenUrls.has(m.url)) return false;
    seenIds.add(m.id);
    if (m.kind === 'image') seenUrls.add(m.url);
    return true;
  });
}

export function getInspiratieCategoryPath(category: InspirationCategory, id: string): string {
  const paths: Record<InspirationCategory, string> = {
    CHEFF: `/recipe/${id}`,
    GROWN: `/garden/${id}`,
    DESIGNER: `/design/${id}`,
  };
  return paths[category];
}

/** Central rich detail (preferred for cross-links from product pages). */
export function getInspiratieDetailHref(_category: InspirationCategory, id: string): string {
  return `/inspiratie/${id}`;
}

export function getInspiratiePrintUrl(category: InspirationCategory, id: string): string {
  return `${getInspiratieCategoryPath(category, id)}?print=true`;
}
