import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  adminNoticePath,
  isAdminNoticeCampaignId,
  resolveAdminNoticeButton,
} from '@/lib/admin/admin-notice';

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
  });

  it('keeps the compose order and opens the app session with a document post', () => {
    const center = readFileSync(resolve(process.cwd(), 'components/admin/NotificationCenter.tsx'), 'utf8');
    const recipients = center.indexOf("copy('stepRecipients')");
    const admin = center.indexOf("copy('addAdmin')");
    const channels = center.indexOf("copy('stepChannels')");
    const titles = center.indexOf("copy('stepTitles')");
    const message = center.indexOf("copy('stepMessage')");
    const action = center.indexOf("copy('stepAction')");
    const preview = center.indexOf("copy('stepPreview')");
    assert.deepEqual(
      [recipients, admin, channels, titles, message, action, preview].every((n, i, all) => n > 0 && (i === 0 || n > all[i - 1])),
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
