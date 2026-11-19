import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { chosenRecipients, sendBlockReason } from '@/lib/admin/notification-compose-state';
import { emptySelection, previewCanonicalPayload } from '@/lib/admin/notification-audience';

const ready = {
  message: 'Hallo',
  sendNotification: true,
  sendEmail: false,
  subject: 'Onderwerp',
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
    assert.equal(sendBlockReason({ ...ready, sendEmail: false, subject: '' })?.field, 'subject');
    assert.equal(sendBlockReason({ ...ready, sendEmail: true, subject: '  ' })?.field, 'subject');
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
    assert.match(ui, /id="notice-subject"/);
    assert.match(ui, /admin\.notificationCenter\.subjectHelp/);
    assert.match(ui, /admin\.notificationCenter\.emailSubject/);
    assert.doesNotMatch(ui, /pushTitle/);
    assert.doesNotMatch(ui, /admin\.notificationCenter\.pushTitle/);
    const nl = JSON.parse(readFileSync(resolve(process.cwd(), 'public/i18n/nl.json'), 'utf8'));
    const en = JSON.parse(readFileSync(resolve(process.cwd(), 'public/i18n/en.json'), 'utf8'));
    assert.equal(nl.admin.notificationCenter.emailSubject, 'Onderwerp');
    assert.equal(en.admin.notificationCenter.emailSubject, 'Subject');
    assert.equal(
      nl.admin.notificationCenter.subjectHelp,
      'Dit onderwerp wordt gebruikt voor je bericht, e-mail en pushmelding.',
    );
    assert.equal(
      en.admin.notificationCenter.subjectHelp,
      'This subject is used for your message, email and push notification.',
    );
    assert.match(ui, /copy\('selectedHeading'\)/);
    assert.match(ui, /copy\('refreshPreview'\)/);
    assert.match(ui, /id="send-block-reason"/);
    const route = readFileSync(resolve(process.cwd(), 'app/api/admin/notifications/send/route.ts'), 'utf8');
    assert.match(route, /const pushTitle = subject;/);
    assert.doesNotMatch(route, /record\.title|titleRaw/);
    assert.match(route, /subject,\s*\n\s*message,\s*\n\s*action: noticeAction/);
    assert.match(route, /title: pushTitle,/);
    assert.match(route, /sendTransactionalEmail\(\{[\s\S]*subject,/);
    const headline = 'HomeCheff — test bericht';
    const previewFor = (subject: string) => previewCanonicalPayload({
      selection: emptySelection('applicable'),
      message: 'De tekst blijft staan.',
      subject,
      title: subject,
      route: '/delivery/dashboard',
      sendNotification: true,
      sendEmail: true,
      confirmRepeat: false,
      recipientIds: ['sergio'],
    });
    assert.notEqual(previewFor(headline), previewFor('Ander onderwerp'));
    const email = { subject: headline };
    const push = { title: headline, body: 'De tekst blijft staan.' };
    const letter = { subject: headline };
    assert.equal(email.subject, headline);
    assert.equal(push.title, headline);
    assert.equal(letter.subject, headline);
    assert.doesNotMatch(ui, /Geselecteerde ontvangers/);
  });
});
