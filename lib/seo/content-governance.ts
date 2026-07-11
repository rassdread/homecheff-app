/**
 * Phase 13Q — Content governance rules preventing SEO drift.
 * Referenced by validator and future editorial workflow.
 */

export const CONTENT_GOVERNANCE_RULES = [
  'No thin pages — minimum useful content + product connection',
  'No keyword doorway pages — one intent per pillar',
  'No auto-generated city spam — threshold gate + noindex when sparse',
  'No unsupported claims — Phase 13O truth boundary required',
  'Human review before publishing new public SEO pages',
  'Quarterly review of pillar and city pages',
  'Canonical on homecheff.eu only',
  'NL/EN translation parity for strategic pages',
  'No bulk AI-generated copy without human fact-check',
  'Maker/community language required on craft-facing pages',
] as const;

export const CONTENT_QUALITY_CHECKLIST = [
  'User intent satisfied without leaving site?',
  'Every claim mapped to code/policy evidence?',
  'Phase 13O P0 claims absent?',
  'Maker/community language present?',
  'Internal links to 2+ related pillars?',
  'Structured data matches visible content?',
  'NL + EN parity (or intentional pilot-only)?',
  'City page meets activity thresholds?',
  'No duplicate intent with existing URL?',
] as const;

/** Claims that must not appear in public copy until product evidence exists (Phase 13O). */
export const BLOCKED_PUBLIC_CLAIM_PATTERNS = [
  /discovery[- ]?boost/i,
  /visibility multiplier/i,
  /premium analytics/i,
  /geavanceerde analytics/i,
  /GDPR export (?:is )?available/i,
  /download (?:your|je) (?:full )?data/i,
  /waste reduction (?:proven|measured)/i,
  /social impact (?:proven|measured)/i,
] as const;
