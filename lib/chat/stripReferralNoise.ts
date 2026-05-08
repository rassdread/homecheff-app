/** Verwijdert referral/uitnodiging-ruis uit zichtbare chattekst (preview + bubbels). */
export function stripReferralNoise(text: string, emptyLabel = "···"): string {
  let s = text.replace(/\s+/g, " ").trim();
  s = s.replace(/\b(?:ref|referral|invite)[=:]\s*\S+/gi, "").trim();
  s = s.replace(
    /https?:\/\/[^\s]*(?:ref|referral|invite|uitnodiging)[^\s]*/gi,
    ""
  ).trim();
  return s.length > 0 ? s : emptyLabel;
}
