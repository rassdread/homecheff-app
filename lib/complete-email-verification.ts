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
  | { ok: true; message: string; user: VerifiedUserPayload }
  | { ok: false; error: string; status: number };

/**
 * Valideert token/code, zet emailVerified, wist tokens, stuurt welkomstmail (best-effort).
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
    });

    if (!user) {
      return {
        ok: false,
        error: "Ongeldige of verlopen verificatie token",
        status: 400,
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });

    try {
      await sendWelcomeEmail({
        email: user.email,
        name: user.name || user.username || "Gebruiker",
      });
    } catch (emailError) {
      logEmailSendFailure("welcome_after_verify", emailError, {
        recipientEmail: user.email,
      });
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
