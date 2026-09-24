/**
 * Commercial copy for the partner invitation email.
 * Does not calculate commission. The acceptance page carries the longer explanation.
 */

export type PartnerInviteLocale = 'nl' | 'en';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function partnerInviteEmailCopy(input: {
  locale: PartnerInviteLocale;
  inviterName: string;
  url: string;
  expiresLabel: string;
}): { subject: string; text: string; html: string } {
  const who = input.inviterName.trim() || (input.locale === 'en' ? 'A HomeCheff partner' : 'Een HomeCheff-partner');
  const safeWho = escapeHtml(who);
  const safeUrl = escapeHtml(input.url);

  if (input.locale === 'en') {
    const subject = 'You are invited to become a HomeCheff Affiliate Partner';
    const text = [
      `${who} has invited you to become an Affiliate Partner of HomeCheff.`,
      '',
      'As a partner you promote HomeCheff with your own affiliate link.',
      'You earn 40% of the applicable HomeCheff platform fee on qualifying transactions attributed through you.',
      'Your commission is calculated on HomeCheff’s platform fee, not on the full purchase amount.',
      '',
      `View your invitation: ${input.url}`,
      '',
      `This link is personal and valid until ${input.expiresLabel}.`,
      'HomeCheff will never ask for your password by email.',
    ].join('\n');
    const html = `
      <p><strong>${safeWho}</strong> has invited you to become an Affiliate Partner of HomeCheff.</p>
      <p>As a partner you promote HomeCheff with your own affiliate link.</p>
      <p>You earn <strong>40% of the applicable HomeCheff platform fee</strong> on qualifying transactions attributed through you.</p>
      <p>Your commission is calculated on HomeCheff’s platform fee, not on the full purchase amount.</p>
      <p><a href="${safeUrl}">View your invitation</a></p>
      <p>This link is personal and valid until ${escapeHtml(input.expiresLabel)}. HomeCheff will never ask for your password by email.</p>
    `;
    return { subject, text, html };
  }

  const subject = 'Je bent uitgenodigd als HomeCheff Affiliate Partner';
  const text = [
    `${who} heeft je uitgenodigd om Affiliate Partner van HomeCheff te worden.`,
    '',
    'Als partner kun je HomeCheff promoten met je persoonlijke affiliatelink.',
    'Je verdient 40% van de toepasselijke HomeCheff-platformfee op kwalificerende transacties die via jou worden toegeschreven.',
    'Je commissie wordt berekend over de platformfee van HomeCheff, niet over het volledige aankoopbedrag.',
    '',
    `Bekijk je uitnodiging: ${input.url}`,
    '',
    `Deze link is persoonlijk en geldig tot ${input.expiresLabel}.`,
    'HomeCheff vraagt nooit om je wachtwoord per e-mail.',
  ].join('\n');
  const html = `
    <p><strong>${safeWho}</strong> heeft je uitgenodigd om Affiliate Partner van HomeCheff te worden.</p>
    <p>Als partner kun je HomeCheff promoten met je persoonlijke affiliatelink.</p>
    <p>Je verdient <strong>40% van de toepasselijke HomeCheff-platformfee</strong> op kwalificerende transacties die via jou worden toegeschreven.</p>
    <p>Je commissie wordt berekend over de platformfee van HomeCheff, niet over het volledige aankoopbedrag.</p>
    <p><a href="${safeUrl}">Bekijk je uitnodiging</a></p>
    <p>Deze link is persoonlijk en geldig tot ${escapeHtml(input.expiresLabel)}. HomeCheff vraagt nooit om je wachtwoord per e-mail.</p>
  `;
  return { subject, text, html };
}
