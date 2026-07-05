/** Publieke HCP-weergave op profiel (geen eventgeschiedenis). */
export type PublicProfileHcpPayload = {
  totalHcp: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  /** HCP verdiend sinds maandag (UTC), zelfde week als ranglijsten. */
  weeklyHcpEarned?: number;
  /** Recent ledger-activiteit (ruwe proxy voor “actief”). */
  activeThisWeek?: boolean;
  badges: Array<{ key: string; name: string; icon: string }>;
};
