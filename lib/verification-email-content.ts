export type VerificationEmailLocale = "nl" | "en";

const LOGO_URL = "https://homecheff.eu/icon.png";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function digitsMarkup(code: string): string {
  const chars = escapeHtml(code).split("");
  return chars
    .map(
      (ch) =>
        `<span style="display:inline-block;min-width:0.55em;text-align:center;font-size:34px;font-weight:700;letter-spacing:0.08em;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#047857;">${ch}</span>`,
    )
    .join("");
}

export function getVerificationEmailSubject(locale: VerificationEmailLocale): string {
  return locale === "en"
    ? "Verify your email address — HomeCheff"
    : "Verifieer je e-mailadres — HomeCheff";
}

export function buildVerificationPlainText(params: {
  locale: VerificationEmailLocale;
  name: string;
  verificationUrl: string;
  verificationCode?: string;
}): string {
  const { locale, verificationUrl, verificationCode } = params;

  if (locale === "en") {
    const lines = [
      "Welcome to HomeCheff 👋",
      "",
      "Use the verification code below to confirm your account.",
      "",
      ...(verificationCode ? [`Your verification code: ${verificationCode}`, ""] : []),
      "This code expires automatically after a short time.",
      "",
      `You can also confirm using this link: ${verificationUrl}`,
      "",
      "Did not request this? You can safely ignore this email.",
      "",
      "— HomeCheff",
    ];
    return lines.join("\n");
  }

  const lines = [
    "Welkom bij HomeCheff 👋",
    "",
    "Gebruik onderstaande verificatiecode om je account te bevestigen.",
    "",
    ...(verificationCode ? [`Je verificatiecode: ${verificationCode}`, ""] : []),
    "Deze code verloopt automatisch na enkele minuten.",
    "",
    `Je kunt je adres ook bevestigen via deze link: ${verificationUrl}`,
    "",
    "Heb je deze aanvraag niet gedaan? Dan kun je deze e-mail veilig negeren.",
    "",
    "— HomeCheff",
  ];
  return lines.join("\n");
}

export function buildVerificationHtml(params: {
  locale: VerificationEmailLocale;
  name: string;
  verificationUrl: string;
  verificationCode?: string;
}): string {
  const { locale, name, verificationUrl, verificationCode } = params;
  const safeName = escapeHtml(name.trim());
  const greeting =
    locale === "en"
      ? safeName
        ? `Hi ${safeName},`
        : "Hi there,"
      : safeName
        ? `Hallo ${safeName},`
        : "Hallo,";

  const headline =
    locale === "en" ? "Welcome to HomeCheff 👋" : "Welkom bij HomeCheff 👋";
  const lead =
    locale === "en"
      ? "Use the verification code below to confirm your account."
      : "Gebruik onderstaande verificatiecode om je account te bevestigen.";
  const codeLabel =
    locale === "en" ? "Your verification code" : "Je verificatiecode";
  const expiryNote =
    locale === "en"
      ? "This code expires automatically after a short time."
      : "Deze code verloopt automatisch na enkele minuten.";
  const ctaLabel =
    locale === "en" ? "Confirm in browser" : "Bevestig in browser";
  const ignoreNote =
    locale === "en"
      ? "Did not request this? You can safely ignore this email."
      : "Heb je deze aanvraag niet gedaan? Dan kun je deze e-mail veilig negeren.";

  const codeBlock = verificationCode
    ? `
      <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#065f46;letter-spacing:0.02em;text-transform:uppercase;">${codeLabel}</p>
      <div role="presentation" style="margin:12px 0 20px 0;padding:20px 16px;background:linear-gradient(180deg,#ecfdf5 0%,#d1fae5 100%);border:1px solid #6ee7b7;border-radius:14px;text-align:center;">
        <div style="line-height:1.2;">${digitsMarkup(verificationCode)}</div>
      </div>`
    : "";

  const safeUrl = escapeHtml(verificationUrl);

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(getVerificationEmailSubject(locale))}</title>
</head>
<body style="margin:0;padding:0;background:#ecfdf5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#ecfdf5 0%,#f8fafc 45%,#f1f5f9 100%);padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,118,110,0.12);border:1px solid #d1fae5;">
          <tr>
            <td style="padding:28px 28px 20px 28px;text-align:center;background:linear-gradient(135deg,#059669 0%,#047857 55%,#065f46 100%);">
              <img src="${LOGO_URL}" width="112" height="112" alt="HomeCheff" style="display:block;margin:0 auto 12px auto;border:0;border-radius:16px;background:#fff;padding:8px;box-sizing:border-box;" />
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.25;letter-spacing:-0.02em;">${headline}</p>
              <p style="margin:10px 0 0 0;font-size:15px;font-weight:500;color:rgba(255,255,255,0.92);">${greeting}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <p style="margin:0 0 16px 0;font-size:17px;line-height:1.55;color:#334155;">${lead}</p>
              ${codeBlock}
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.55;color:#64748b;">${expiryNote}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px auto;">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);">
                    <a href="${safeUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">${locale === "en" ? "Or open this link:" : "Of open deze link:"}</p>
              <p style="margin:0;padding:12px 14px;background:#f1f5f9;border-radius:10px;font-size:13px;word-break:break-all;color:#475569;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${safeUrl}</p>
              <p style="margin:24px 0 0 0;font-size:14px;line-height:1.55;color:#64748b;">${ignoreNote}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:13px;color:#94a3b8;">HomeCheff · <a href="mailto:support@homecheff.eu" style="color:#059669;text-decoration:none;">support@homecheff.eu</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
