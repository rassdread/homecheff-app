import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { chosenRecipients, sendBlockReason } from '@/lib/admin/notification-compose-state';

const ready = {
  message: 'Hallo',
  sendNotification: true,
  sendEmail: false,
  subject: '',
  recipientCount: 1,
  listable: false,
  hasPreview: true,
  previewTotal: 1,
  previewStale: false,
  emailConfirmRequired: false,
  emailConfirmed: false,
};

describe('chosen recipients stay visible and unique', () => {
  it('shows a checked person and a manual admin once, with both origins', () => {
    const rows = chosenRecipients({
      selectedIds: ['buyer', 'admin'],
      directory: [
        { id: 'buyer', name: 'Koper', email: 'koper@example.com' },
        { id: 'admin', name: 'Beheer', email: 'beheer@example.com' },
      ],
      manual: [{ id: 'admin', name: 'Beheer', email: 'beheer@example.com' }],
    });
    assert.deepEqual(rows.map((row) => row.id), ['buyer', 'admin']);
    assert.equal(rows[0]?.fromAudience, true);
    assert.equal(rows[0]?.manual, false);
    assert.equal(rows[1]?.fromAudience, true);
    assert.equal(rows[1]?.manual, true);
    assert.equal(rows[1]?.email, 'beheer@example.com');
  });

  it('keeps a manual admin who is outside the filter results', () => {
    const rows = chosenRecipients({
      selectedIds: [],
      directory: [{ id: 'buyer', name: 'Koper', email: 'koper@example.com' }],
      manual: [{ id: 'admin', name: 'Beheer', email: 'beheer@example.com' }],
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.fromAudience, false);
    assert.equal(rows[0]?.manual, true);
  });
});

describe('send stays closed until the preview matches the form', () => {
  it('names the missing preview when every other field is filled', () => {
    const block = sendBlockReason({ ...ready, hasPreview: false });
    assert.equal(block?.field, 'preview');
    assert.equal(block?.action, 'admin.notificationCenter.ui.blockNeedPreview');
    assert.equal(sendBlockReason(ready), null);
  });

  it('asks for a fresh preview after the selection or message changes', () => {
    const block = sendBlockReason({ ...ready, hasPreview: false, previewTotal: 0, previewStale: true });
    assert.equal(block?.refreshPreview, true);
    assert.equal(block?.action, 'admin.notificationCenter.ui.blockStale');
  });

  it('points at the empty field instead of a silent disabled button', () => {
    assert.equal(sendBlockReason({ ...ready, message: '  ' })?.field, 'message');
    assert.equal(sendBlockReason({ ...ready, sendNotification: false })?.field, 'channel');
    assert.equal(sendBlockReason({ ...ready, sendEmail: true, subject: '' })?.field, 'subject');
    assert.equal(sendBlockReason({ ...ready, recipientCount: 0 })?.field, 'recipients');
    assert.equal(sendBlockReason({ ...ready, emailConfirmRequired: true })?.field, 'email-confirm');
  });
});

describe('typing does not reload the recipient list', () => {
  it('keeps message, subject and title out of the list effect', () => {
    const ui = readFileSync(resolve(process.cwd(), 'components/admin/NotificationCenter.tsx'), 'utf8');
    const start = ui.indexOf('const listable = selectionCanList');
    const end = ui.indexOf('setAddedAdmins((current)');
    const effect = ui.slice(start, end);
    assert.equal(start > 0 && end > start, true);
    assert.doesNotMatch(effect, /message,/);
    assert.doesNotMatch(effect, /subject,/);
    assert.doesNotMatch(effect, /pushTitle,/);
    assert.doesNotMatch(effect, /setDirectory\(\[\]\)/);
    assert.match(ui, /copy\('selectedHeading'\)/);
    assert.match(ui, /copy\('refreshPreview'\)/);
    assert.match(ui, /id="send-block-reason"/);
    assert.doesNotMatch(ui, /Geselecteerde ontvangers/);
  });
});
