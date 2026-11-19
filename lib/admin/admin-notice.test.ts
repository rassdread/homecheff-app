import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  adminNoticePath,
  isAdminNoticeCampaignId,
  noticeEmailAction,
  resolveAdminNoticeButton,
  resolveAdminNoticeButtons,
} from '@/lib/admin/admin-notice';
import { previewCanonicalPayload, emptySelection } from '@/lib/admin/notification-audience';

describe('admin notice destination', () => {
  it('opens the message itself and only accepts a complete internal button', () => {
    assert.equal(adminNoticePath('campaign-1'), '/notifications/admin/campaign-1');
    assert.equal(isAdminNoticeCampaignId('campaign-1'), true);
    assert.equal(isAdminNoticeCampaignId('../admin'), false);
    assert.equal(resolveAdminNoticeButton('', '').ok, true);
    assert.equal(resolveAdminNoticeButton('Open', '').ok, false);
    assert.equal(resolveAdminNoticeButton('', '/delivery/dashboard').ok, false);
    const button = resolveAdminNoticeButton('Stripe openen', '/delivery/dashboard');
    assert.equal(button.ok, true);
    if (button.ok) {
      assert.equal(button.action?.label, 'Stripe openen');
      assert.equal(button.action?.path, '/delivery/dashboard/');
      assert.equal(button.action?.url, 'https://homecheff.eu/delivery/dashboard/');
    }
    assert.equal(resolveAdminNoticeButton('Weg', 'https://stripe.com/setup').ok, false);
    assert.equal(resolveAdminNoticeButton('Lijst', '/notifications').ok, false);
    const email = noticeEmailAction('campaign-1', 'nl');
    assert.equal(email?.label, 'Open bericht');
    assert.equal(email?.url, 'https://homecheff.eu/notifications/admin/campaign-1');
    assert.equal(noticeEmailAction('campaign-1', 'en')?.label, 'Open message');
    assert.equal(noticeEmailAction('../admin', 'nl'), null);
    const affiliate = resolveAdminNoticeButton('Verdien mee als affiliate', '/affiliate');
    assert.equal(affiliate.ok, true);
    if (affiliate.ok) assert.equal(affiliate.action?.path, '/affiliate/');
    const none = resolveAdminNoticeButtons('', '', '', '');
    assert.equal(none.ok && none.primary === null && none.secondary === null, true);
    const one = resolveAdminNoticeButtons('Plaats jouw aanbod', '/sell/new', '', '');
    assert.equal(one.ok && one.primary?.path === '/sell/new/' && one.secondary === null, true);
    const two = resolveAdminNoticeButtons('Plaats jouw aanbod', '/sell/new', 'Verdien mee als affiliate', '/affiliate');
    assert.equal(two.ok && two.secondary?.path === '/affiliate/', true);
    assert.equal(resolveAdminNoticeButtons('Plaats jouw aanbod', '/sell/new', 'Alleen tekst', '').ok, false);
    assert.equal(resolveAdminNoticeButtons('Weg', 'https://evil.example', '', '').ok, false);
    const token = {
      selection: emptySelection('sellers'),
      message: 'Eén bericht',
      subject: 'Onderwerp',
      title: 'Onderwerp',
      route: '/sell/new/',
      actionLabel: 'Plaats jouw aanbod',
      sendNotification: true,
      sendEmail: true,
      confirmRepeat: false,
      recipientIds: ['seller'],
    };
    assert.notEqual(
      previewCanonicalPayload(token),
      previewCanonicalPayload({ ...token, secondaryRoute: '/affiliate/', secondaryActionLabel: 'Verdien mee als affiliate' }),
    );
    assert.notEqual(
      previewCanonicalPayload({ ...token, secondaryRoute: '/affiliate/', secondaryActionLabel: 'Verdien mee als affiliate' }),
      previewCanonicalPayload({ ...token, secondaryRoute: '/profile/', secondaryActionLabel: 'Verdien mee als affiliate' }),
    );
  });

  it('keeps the compose order and opens the app session with a document post', () => {
    const center = readFileSync(resolve(process.cwd(), 'components/admin/NotificationCenter.tsx'), 'utf8');
    const recipients = center.indexOf("copy('stepRecipients')");
    const admin = center.indexOf("copy('addAdmin')");
    const channels = center.indexOf("copy('stepChannels')");
    const message = center.indexOf("copy('stepMessage')");
    const subject = center.indexOf('id="notice-subject"');
    const action = center.indexOf("copy('stepAction')");
    const second = center.indexOf("copy('buttonSecond')");
    const preview = center.indexOf("copy('stepPreview')");
    assert.deepEqual(
      [recipients, admin, channels, message, subject, action, second, preview].every((n, i, all) => n > 0 && (i === 0 || n > all[i - 1])),
      true,
    );
    const button = readFileSync(resolve(process.cwd(), 'components/auth/NativeGoogleSignInButton.tsx'), 'utf8');
    assert.match(button, /form\.submit\(\)/);
    assert.match(button, /name = 'returnTo'/);
    const route = readFileSync(resolve(process.cwd(), 'app/api/auth/native/google/route.ts'), 'utf8');
    const body = route.slice(route.indexOf('export async function POST'));
    const guard = body.indexOf('nativeSessionPostAllowed');
    const verify = body.indexOf('createSessionFromNativeGoogleIdToken');
    const redirect = body.indexOf('nativeDocumentRedirectTarget');
    assert.equal(guard > 0 && verify > guard && redirect > verify, true);
    assert.doesNotMatch(route, /transferToken|handoffToken/);
  });

  it('does not let the service worker answer the session from cache', () => {
    const sw = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');
    const auth = sw.indexOf("url.pathname.startsWith('/api/auth/')");
    const apiCache = sw.indexOf("url.pathname.startsWith('/api/')");
    assert.equal(auth > 0 && auth < apiCache, true);
    const authBranch = sw.slice(auth, apiCache);
    assert.match(authBranch, /return;/);
    assert.doesNotMatch(authBranch, /cache\.put|caches\.match/);
  });
});
