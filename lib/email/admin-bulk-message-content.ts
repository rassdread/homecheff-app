import { canonicalLogoUrl } from "@/lib/brand/canonical-logo";

const LOGO_URL = canonicalLogoUrl("notification");
const SUPPORT_EMAIL = "support@homecheff.eu";
const SITE_URL = "https://homecheff.eu";

const LEADING_GREETING =
  /^(hoi|hallo|hey|hé|he|hi|haai|beste|dag|goedemorgen|goedemiddag|goedenavond|goedendag)\b/i;

export type AdminEmailAction = {
  label: string;
  url: string;
};

export type AdminBulkMessageContent = {
  html: string;
  text: string;
};

const BUTTON_LABEL_MAX = 80;

export function resolveAdminEmailAction(
  label: unknown,
  url: unknown
): { ok: true; action: AdminEmailAction | null } | { ok: false; error: string } {
  const text = typeof label === "string" ? label.trim() : "";
  const href = typeof url === "string" ? url.trim() : "";
  if (!text && !href) return { ok: true, action: null };
  if (!text || !href) {
    return {
      ok: false,
      error: "Vul knoptekst en link allebei in, of laat ze allebei leeg.",
    };
  }
  let parsed: URL;
  try {
    parsed = new URL(href);
  } catch {
    return { ok: false, error: "Gebruik een vaste HomeCheff-link, bijvoorbeeld https://homecheff.eu/delivery." };
  }
  const host = parsed.hostname.toLowerCase();
  const allowedHost = host === "homecheff.eu" || host === "www.homecheff.eu";
  if (parsed.protocol !== "https:" || !allowedHost || parsed.username || parsed.password) {
    return {
      ok: false,
      error: "Gebruik een vaste HomeCheff-link, bijvoorbeeld https://homecheff.eu/delivery. Tijdelijke Stripe-links worden niet meegestuurd.",
    };
  }
  return {
    ok: true,
    action: {
      label: text.slice(0, BUTTON_LABEL_MAX),
      url: parsed.toString(),
    },
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

/** The first written line is already a greeting, so the template must not add another. */
export function messageStartsWithGreeting(message: string): boolean {
  const firstLine = normalizeNewlines(message)
    .split("\n")
    .find((line) => line.trim().length > 0);
  return LEADING_GREETING.test((firstLine ?? "").trim());
}

function greetingLine(recipientName: string): string {
  const name = recipientName.trim();
  if (!name || name === "Gebruiker") return "Hallo,";
  return `Hallo ${name},`;
}

function messageParagraphs(message: string, recipientName: string): string[] {
  const body = normalizeNewlines(message);
  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
  if (messageStartsWithGreeting(body)) return paragraphs;
  return [greetingLine(recipientName), ...paragraphs];
}

function linkify(escaped: string): string {
  return escaped
    .replace(
      /https?:\/\/[^\s<]+/g,
      (url) =>
        `<a href="${url}" style="color:#059669;text-decoration:underline;">${url}</a>`
    )
    .replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      (email) =>
        `<a href="mailto:${email}" style="color:#059669;text-decoration:underline;">${email}</a>`
    );
}

function paragraphHtml(paragraph: string): string {
  const html = linkify(escapeHtml(paragraph)).replace(/\n/g, "<br>");
  return `<p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:#334155;">${html}</p>`;
}

/**
 * Letter for a hand-picked admin send. Uses the same green HomeCheff shell as
 * the verification mail: logo, calm card, and the support footer.
 */
function actionHtml(action: AdminEmailAction): string {
  const label = escapeHtml(action.label);
  const url = escapeHtml(action.url);
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 12px 0;">
    <tr>
      <td align="center" bgcolor="#059669" style="border-radius:12px;background-color:#059669;">
        <a href="${url}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:12px;background-color:#059669;">${label}</a>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#334155;">
    <a href="${url}" style="color:#047857;font-weight:600;text-decoration:underline;">${label}</a><br>
    <a href="${url}" style="color:#047857;text-decoration:underline;word-break:break-all;">${url}</a>
  </p>`;
}

export function renderAdminBulkMessage(input: {
  recipientName: string;
  message: string;
  action?: AdminEmailAction | null;
}): AdminBulkMessageContent {
  const paragraphs = messageParagraphs(input.message, input.recipientName);
  const bodyHtml = paragraphs.map(paragraphHtml).join("\n");
  const button = input.action ? actionHtml(input.action) : "";
  const bodyText = paragraphs.join("\n\n");
  const text = [
    bodyText,
    ...(input.action ? ["", input.action.label, input.action.url] : []),
    "",
    "—",
    "HomeCheff",
    SUPPORT_EMAIL,
    SITE_URL,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HomeCheff</title>
</head>
<body bgcolor="#ecfdf5" style="margin:0;padding:0;background-color:#ecfdf5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ecfdf5" style="background-color:#ecfdf5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width:560px;background-color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #d1fae5;">
          <tr>
            <td align="center" bgcolor="#047857" style="padding:32px 28px 24px 28px;text-align:center;background-color:#047857;">
              <img src="${LOGO_URL}" width="96" height="96" alt="HomeCheff" style="display:block;margin:0 auto;border:0;border-radius:16px;background:#ffffff;padding:8px;box-sizing:border-box;" />
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 18px 32px;">
              ${bodyHtml}
              ${button}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px 26px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.5;color:#64748b;">HomeCheff</p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">
                <a href="mailto:${SUPPORT_EMAIL}" style="color:#059669;text-decoration:none;">${SUPPORT_EMAIL}</a>
                &nbsp;·&nbsp;
                <a href="${SITE_URL}" style="color:#059669;text-decoration:none;">homecheff.eu</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}
