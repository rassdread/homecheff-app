/**
 * Optionele uitbreidingen voor badge-detail (toekomst: HCP-bonus, campagne, limited-time).
 * Sheet rendert alleen ingevulde velden.
 */
export type BadgeDetailExtras = {
  /** Korte regel, bijv. “Beloning: gratis vermelding” */
  rewardSummary?: string;
  /** Extra HCP gekoppeld aan deze badge (weergave-only) */
  hcpBonus?: number;
  campagneLabel?: string;
  /** Voor event-/campagnebadges met einddatum */
  expiresAtIso?: string | null;
};
