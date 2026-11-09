/**
 * Fixed destinations for a courier email button.
 * Every path is a HomeCheff page. Login keeps it via callbackUrl.
 * Stripe uses the dashboard section, never a one-time Account Link.
 */

export const COURIER_EMAIL_SITE = "https://homecheff.eu";

export type CourierEmailActionId =
  | "dashboard"
  | "stripe"
  | "details"
  | "agreement"
  | "none"
  | "custom";

export type CourierEmailAction = {
  id: CourierEmailActionId;
  /** Label in the admin choice list. */
  choiceLabel: string;
  /** Button text written into the mail. Empty when there is no button. */
  buttonLabel: string;
  /** Path on homecheff.eu. Empty when there is no button. */
  path: string;
};

export const COURIER_EMAIL_ACTIONS: readonly CourierEmailAction[] = [
  {
    id: "dashboard",
    choiceLabel: "Naar mijn bezorgomgeving",
    buttonLabel: "Naar mijn bezorgomgeving",
    path: "/delivery",
  },
  {
    id: "stripe",
    choiceLabel: "Stripe Connect instellen of hervatten",
    buttonLabel: "Stripe Connect instellen of hervatten",
    path: "/delivery/dashboard?onderdeel=stripe",
  },
  {
    id: "details",
    choiceLabel: "Bezorggegevens aanvullen",
    buttonLabel: "Bezorggegevens aanvullen",
    path: "/delivery/settings",
  },
  {
    id: "agreement",
    choiceLabel: "Bezorgovereenkomst bekijken",
    buttonLabel: "Bezorgovereenkomst bekijken",
    path: "/delivery/overeenkomst",
  },
  {
    id: "none",
    choiceLabel: "Geen knop",
    buttonLabel: "",
    path: "",
  },
  {
    id: "custom",
    choiceLabel: "Eigen knop",
    buttonLabel: "",
    path: "",
  },
] as const;

export function courierEmailActionById(id: string): CourierEmailAction {
  return COURIER_EMAIL_ACTIONS.find((action) => action.id === id) ?? COURIER_EMAIL_ACTIONS[4];
}

export function courierEmailActionUrl(path: string): string {
  if (!path) return "";
  return `${COURIER_EMAIL_SITE}${path}`;
}

/** Keep only the Stripe section query through the login redirect. */
export function deliveryDashboardLoginPath(onderdeel: string | string[] | undefined): string {
  const value = Array.isArray(onderdeel) ? onderdeel[0] : onderdeel;
  if (value === "stripe") return "/delivery/dashboard?onderdeel=stripe";
  return "/delivery/dashboard";
}
