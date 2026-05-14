import { prisma } from "@/lib/prisma";
import { isDisallowedFinalUsername } from "@/lib/username-placeholder";

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,20}$/;

const RESERVED_WORDS = [
  "admin",
  "administrator",
  "homecheff",
  "api",
  "www",
  "mail",
  "support",
  "help",
  "info",
  "contact",
  "about",
  "terms",
  "privacy",
  "login",
  "register",
  "dashboard",
  "profile",
  "settings",
  "logout",
  "user",
  "users",
  "seller",
  "buyer",
  "delivery",
  "order",
  "orders",
  "product",
  "products",
  "message",
  "messages",
  "conversation",
  "conversations",
  "review",
  "reviews",
  "favorite",
  "favorites",
  "follow",
  "follows",
  "notification",
  "notifications",
];

export type ValidateUsernameOptions = {
  /** Bij hernoemen: bestaande gebruiker uitsluiten van uniciteits-check */
  excludeUserId?: string;
  /** Bij eenmalige overstap van temp-naam: nieuwe naam mag "temp" niet bevatten */
  forbidTempSubstring?: boolean;
};

/**
 * Zelfde regels als /api/auth/validate-username, met opties voor profielwijziging.
 */
export async function validateUsernameCandidate(
  username: string | undefined | null,
  options: ValidateUsernameOptions = {}
): Promise<{ available: boolean; message: string }> {
  const trimmed = typeof username === "string" ? username.trim() : "";
  if (!trimmed) {
    return { available: false, message: "Gebruikersnaam is verplicht" };
  }

  if (!USERNAME_REGEX.test(trimmed)) {
    return {
      available: false,
      message:
        "Gebruikersnaam moet 3-20 karakters lang zijn en alleen letters, cijfers, - . en _ bevatten",
    };
  }

  if (options.forbidTempSubstring && isDisallowedFinalUsername(trimmed)) {
    return {
      available: false,
      message:
        'Kies een definitieve gebruikersnaam zonder tijdelijk patroon (zoals temp_… of user_1234).',
    };
  }

  if (RESERVED_WORDS.includes(trimmed.toLowerCase())) {
    return { available: false, message: "Deze gebruikersnaam is gereserveerd" };
  }

  const taken = await prisma.user.findFirst({
    where: {
      ...(options.excludeUserId
        ? { NOT: { id: options.excludeUserId } }
        : {}),
      username: { equals: trimmed, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (taken) {
    return { available: false, message: "Deze gebruikersnaam is al in gebruik" };
  }

  return { available: true, message: "Gebruikersnaam is beschikbaar!" };
}
