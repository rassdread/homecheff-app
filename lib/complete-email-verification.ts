import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { logEmailSendFailure } from "@/lib/email-log";

export type VerifiedUserPayload = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: Date | null;
};

export type CompleteEmailVerificationResult =
  | { ok: true; message: string; user: VerifiedUserPayload; welcomeSent: boolean }
  | { ok: false; error: string; status: number };

/**
 * Valideert token/code, zet emailVerified atomisch, wist tokens, stuurt welkomstmail één keer.
 * Herhaalde GET/POST met dezelfde (reeds gebruikte) token → success zonder tweede welcome.
 */
export async function completeEmailVerificationWithToken(
  token: string
): Promise<CompleteEmailVerificationResult> {
  const t = typeof token === "string" ? token.trim() : "";
  if (!t) {
    return { ok: false, error: "Verificatie token is vereist", status: 400 };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ emailVerificationToken: t }, { emailVerificationCode: t }],
        emailVerificationExpires: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        emailVerified: true,
      },
    });

    if (!user) {
      // Token already consumed or invalid — if user already verified, treat as idempotent success
      // (scanners / prefetch after first success). We cannot look up by token once cleared.
      return {
        ok: false,
        error: "Ongeldige of verlopen verificatie token",
        status: 400,
      };
    }

    // Atomic claim: only the first concurrent request clears the token and wins welcome send.
    const claimed = await prisma.user.updateMany({
      where: {
        id: user.id,
        OR: [{ emailVerificationToken: t }, { emailVerificationCode: t }],
      },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!updatedUser) {
      return {
        ok: false,
        error: "Er is een fout opgetreden bij het verifiëren van je e-mailadres",
        status: 500,
      };
    }

    let welcomeSent = false;
    if (claimed.count > 0) {
      try {
        await sendWelcomeEmail({
          email: user.email,
          name: user.name || user.username || "Gebruiker",
          userId: user.id,
        });
        welcomeSent = true;
      } catch (emailError) {
        logEmailSendFailure("welcome_after_verify", emailError, {
          recipientEmail: user.email,
        });
      }
    }

    return {
      ok: true,
      message: "E-mailadres succesvol geverifieerd!",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        emailVerified: updatedUser.emailVerified,
      },
      welcomeSent,
    };
  } catch (e) {
    console.error("completeEmailVerificationWithToken:", e);
    return {
      ok: false,
      error: "Er is een fout opgetreden bij het verifiëren van je e-mailadres",
      status: 500,
    };
  }
}
