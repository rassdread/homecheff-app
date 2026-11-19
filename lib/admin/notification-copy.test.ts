import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { describeSelection, emptySelection, stripeChoiceLabel } from '@/lib/admin/notification-audience';
import { previewCanonicalPayload } from '@/lib/admin/notification-audience';
import { uiCopy } from '@/lib/admin/notification-copy';
import { sendBlockReason } from '@/lib/admin/notification-compose-state';

const nl = JSON.parse(readFileSync(resolve(process.cwd(), 'public/i18n/nl.json'), 'utf8'));
const en = JSON.parse(readFileSync(resolve(process.cwd(), 'public/i18n/en.json'), 'utf8'));

function leaves(value: unknown, prefix: string, out: string[] = []): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = `${prefix}.${key}`;
    if (typeof child === 'string') out.push(path);
    else leaves(child, path, out);
  }
  return out;
}

describe('message center copy follows the selected language', () => {
  it('has an English sentence for every Dutch system key, and does not show the key', () => {
    const dutch = leaves(nl.admin.notificationCenter.ui, 'admin.notificationCenter.ui');
    const english = new Set(leaves(en.admin.notificationCenter.ui, 'admin.notificationCenter.ui'));
    const missing = dutch.filter((key) => !english.has(key) || !uiCopy('en', key) || uiCopy('en', key) === key);
    assert.deepEqual(missing, []);
    assert.equal(uiCopy('en', 'admin.notificationCenter.ui.selectedHeading'), 'Selected recipients');
    assert.equal(uiCopy('nl', 'admin.notificationCenter.ui.selectedHeading'), 'Geselecteerde ontvangers');
    assert.notEqual(
      uiCopy('en', 'admin.notificationCenter.ui.selectedHeading'),
      uiCopy('nl', 'admin.notificationCenter.ui.selectedHeading'),
    );
  });

  it('keeps the Dutch labels when no language is passed and translates the same selection in English', () => {
    assert.equal(stripeChoiceLabel('none'), 'Stripe niet gekoppeld');
    assert.equal(stripeChoiceLabel('none', 'en'), 'Stripe not connected');
    const dutch = describeSelection(emptySelection('applicable')).join(' ');
    const english = describeSelection(emptySelection('applicable'), 'en').join(' ');
    assert.match(dutch, /selecteert niemand/);
    assert.match(english, /selects nobody/);
    assert.equal(english.includes('selecteert niemand'), false);
  });

  it('does not put the interface language in the preview token', () => {
    const payload = previewCanonicalPayload({
      selection: emptySelection('buyers'),
      message: 'Hello from the admin',
      subject: 'Subject',
      title: 'Title',
      route: '/notifications',
      sendNotification: true,
      sendEmail: false,
      confirmRepeat: false,
      recipientIds: ['person'],
    });
    assert.equal(payload.includes('language'), false);
    assert.equal(payload.includes('Hello from the admin'), true);
    assert.equal(sendBlockReason({
      message: 'Hello from the admin',
      sendNotification: true,
      sendEmail: false,
      subject: 'Subject',
      recipientCount: 1,
      listable: true,
      hasPreview: false,
      previewTotal: 0,
      previewStale: false,
      emailConfirmRequired: false,
      emailConfirmed: false,
    })?.action, 'admin.notificationCenter.ui.blockNeedPreview');
  });
});
