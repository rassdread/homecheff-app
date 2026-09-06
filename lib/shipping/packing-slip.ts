/**
 * HomeCheff packing slip — brand visibility without modifying carrier barcode/label.
 */

export type PackingSlipInput = {
  orderNumber: string;
  sellerName: string;
  buyerName: string;
  items: Array<{ title: string; quantity: number }>;
  trackingCode?: string;
};

export function buildHomecheffPackingSlipHtml(input: PackingSlipInput): string {
  const items = input.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${escapeHtml(i.title)}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${i.quantity}×</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8"/>
<title>HomeCheff pakbon ${escapeHtml(input.orderNumber)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; }
  .brand { font-size: 28px; letter-spacing: 0.04em; margin: 0; }
  .url { color: #c45c26; font-size: 14px; margin-top: 4px; }
  .qr { width: 96px; height: 96px; border: 1px solid #ddd; display:flex;align-items:center;justify-content:center;font-size:10px;text-align:center; }
  .note { margin-top: 24px; font-size: 13px; color: #444; }
  .carrier-note { margin-top: 32px; font-size: 11px; color: #777; border-top: 1px dashed #ccc; padding-top: 12px; }
</style>
</head>
<body>
  <table width="100%"><tr>
    <td>
      <h1 class="brand">HomeCheff</h1>
      <div class="url">homecheff.eu</div>
      <p>Bestelling <strong>${escapeHtml(input.orderNumber)}</strong></p>
    </td>
    <td align="right">
      <div class="qr">QR →<br/>homecheff.eu</div>
    </td>
  </tr></table>
  <p><strong>Verkoper:</strong> ${escapeHtml(input.sellerName)}<br/>
  <strong>Koper:</strong> ${escapeHtml(input.buyerName)}</p>
  <table width="100%" cellspacing="0">${items}</table>
  ${
    input.trackingCode
      ? `<p><strong>Tracking:</strong> ${escapeHtml(input.trackingCode)}</p>`
      : ''
  }
  <p class="note">Bedankt dat je lokaal koopt.<br/>Ontdek wat er bij jou in de buurt wordt gemaakt — homecheff.eu</p>
  <p class="carrier-note">Dit is een HomeCheff-pakbon. De officiële vervoerderslabel (barcode) blijft ongewijzigd en apart.</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
