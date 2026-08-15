/**
 * LEGAL-4A — persist DSA platform applicability assessment (singleton row).
 */

import { prisma } from '@/lib/prisma';
import {
  parseDsaApplicabilityState,
  type DsaApplicabilityAssessment,
  type DsaApplicabilityState,
} from '@/lib/compliance/dsa-applicability';

const PLATFORM_ID = 'platform';

export async function getDsaApplicabilityAssessment(): Promise<DsaApplicabilityAssessment> {
  const row = await prisma.compliancePlatformAssessment.findUnique({
    where: { id: PLATFORM_ID },
  });
  if (!row) {
    return {
      state: 'NOT_ASSESSED',
      assessedAt: null,
      assessmentNote: null,
      reviewDueAt: null,
      updatedByUserId: null,
    };
  }
  return {
    state: parseDsaApplicabilityState(row.dsaApplicabilityState),
    assessedAt: row.assessedAt?.toISOString() ?? null,
    assessmentNote: row.assessmentNote,
    reviewDueAt: row.reviewDueAt?.toISOString() ?? null,
    updatedByUserId: row.updatedByUserId,
  };
}

export async function setDsaApplicabilityAssessment(input: {
  state: DsaApplicabilityState;
  assessmentNote?: string | null;
  reviewDueAt?: Date | null;
  updatedByUserId: string;
}): Promise<DsaApplicabilityAssessment> {
  const now = new Date();
  const row = await prisma.compliancePlatformAssessment.upsert({
    where: { id: PLATFORM_ID },
    create: {
      id: PLATFORM_ID,
      dsaApplicabilityState: input.state,
      assessedAt: now,
      assessmentNote: input.assessmentNote?.trim() || null,
      reviewDueAt: input.reviewDueAt ?? null,
      updatedByUserId: input.updatedByUserId,
    },
    update: {
      dsaApplicabilityState: input.state,
      assessedAt: now,
      assessmentNote: input.assessmentNote?.trim() || null,
      reviewDueAt: input.reviewDueAt ?? null,
      updatedByUserId: input.updatedByUserId,
    },
  });
  return {
    state: parseDsaApplicabilityState(row.dsaApplicabilityState),
    assessedAt: row.assessedAt?.toISOString() ?? null,
    assessmentNote: row.assessmentNote,
    reviewDueAt: row.reviewDueAt?.toISOString() ?? null,
    updatedByUserId: row.updatedByUserId,
  };
}
