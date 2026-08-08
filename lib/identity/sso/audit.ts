/**
 * Phase I.2 — SSO audit (no raw codes / secrets / passwords).
 */

import { prisma } from "@/lib/prisma";
import type { SsoAuditAction } from "./constants";

export async function writeSsoAudit(input: {
  action: SsoAuditAction;
  product?: string | null;
  centralUserId?: string | null;
  codeId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await prisma.ssoAuditEvent.create({
      data: {
        action: input.action,
        product: input.product ?? null,
        centralUserId: input.centralUserId ?? null,
        codeId: input.codeId ?? null,
        metadata: (input.metadata ?? undefined) as object | undefined,
      },
    });
  } catch (err) {
    // Never fail the auth path solely because audit write failed
    console.error("[sso-audit] write failed", err instanceof Error ? err.message : "unknown");
  }
}
