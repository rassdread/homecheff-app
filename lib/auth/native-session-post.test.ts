import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { decode, encode } from 'next-auth/jwt';
import { NEXTAUTH_SESSION_COOKIE_NAME } from '@/lib/auth/session-cookie-name';
import {
  nativeDocumentRedirectTarget,
  nativeSessionDocument,
  nativeSessionPostAllowed,
  sawNativeSessionCookie,
} from '@/lib/auth/native-session-post';

const requestUrl = 'https://homecheff.eu/api/auth/native/google';

describe('native session post', () => {
  it('accepts the site and the installed app, and refuses a foreign login form', () => {
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: 'https://homecheff.eu',
        fetchSite: 'same-origin',
      }),
      true,
    );
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: 'https://www.homecheff.eu',
        fetchSite: 'same-site',
      }),
      true,
    );
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: 'capacitor://localhost',
        fetchSite: 'cross-site',
      }),
      true,
    );
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: 'https://evil.example',
        fetchSite: 'cross-site',
      }),
      false,
    );
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: 'https://homecheff.nl',
        fetchSite: 'cross-site',
      }),
      false,
    );
    assert.equal(
      nativeSessionPostAllowed({
        requestUrl,
        origin: null,
        fetchSite: null,
      }),
      false,
    );
  });

  it('keeps only a safe internal next destination', () => {
    const notice = nativeDocumentRedirectTarget(
      '/auth/social-success?next=%2Fnotifications%2Fadmin%2Fcampaign-1',
      requestUrl,
    );
    assert.equal(
      notice,
      'https://homecheff.eu/auth/social-success?next=%2Fnotifications%2Fadmin%2Fcampaign-1',
    );
    assert.equal(
      nativeDocumentRedirectTarget('/auth/social-success?next=https%3A%2F%2Fevil.example', requestUrl),
      'https://homecheff.eu/auth/social-success',
    );
    assert.equal(
      nativeDocumentRedirectTarget('/auth/social-success?next=%2Flogin', requestUrl),
      'https://homecheff.eu/auth/social-success',
    );
    assert.equal(
      nativeDocumentRedirectTarget('https://evil.example/phish', requestUrl),
      'https://homecheff.eu/',
    );
    assert.equal(nativeDocumentRedirectTarget('//evil.example', requestUrl), 'https://homecheff.eu/');
    assert.equal(nativeDocumentRedirectTarget('', requestUrl), null);
  });

  it('stores the session on a document and opens the same message afterwards', () => {
    const target = nativeDocumentRedirectTarget(
      '/auth/social-success?next=%2Fnotifications%2Fadmin%2Fcampaign-1',
      requestUrl,
    );
    assert.ok(target);
    const landing = new URL(target);
    landing.searchParams.set('authRef', 'ab12cd34');
    const cookie = `${NEXTAUTH_SESSION_COOKIE_NAME}=session-value; Path=/; HttpOnly; Secure; SameSite=Lax`;
    const doc = nativeSessionDocument(cookie, landing.toString(), 'ab12cd34');
    assert.ok(doc);
    assert.match(doc.body, /location\.replace\(/);
    assert.match(doc.body, /notifications%2Fadmin%2Fcampaign-1/);
    assert.equal(doc.body.includes('session-value'), false);
    assert.equal(nativeSessionDocument(cookie, 'https://evil.example/auth', 'ab12cd34'), null);
    assert.equal(nativeSessionDocument(cookie, 'javascript:alert(1)', 'ab12cd34'), null);
    assert.equal(sawNativeSessionCookie(null), false);
    assert.equal(sawNativeSessionCookie(`${NEXTAUTH_SESSION_COOKIE_NAME}=secret`), true);
    assert.equal(sawNativeSessionCookie('other=1'), false);

    const route = readFileSync(
      resolve(process.cwd(), 'app/api/auth/native/google/route.ts'),
      'utf8',
    );
    assert.match(route, /nativeSessionDocument\(/);
    assert.doesNotMatch(route, /NextResponse\.redirect/);
    const client = readFileSync(
      resolve(process.cwd(), 'app/auth/social-success/SocialSuccessClient.tsx'),
      'utf8',
    );
    assert.doesNotMatch(client, /externe browser/);
  });

  it('recognizes a minted session cookie with the same decoder as NextAuth', async () => {
    const secret = 'test-secret-test-secret-test-secret-32';
    const encoded = await encode({
      secret,
      token: { email: 'user@example.com', sub: 'user-1', id: 'user-1' },
      maxAge: 60,
    });
    const header = `${NEXTAUTH_SESSION_COOKIE_NAME}=${encoded}`;
    assert.equal(sawNativeSessionCookie(header), true);
    const decoded = await decode({ token: encoded, secret });
    assert.equal(decoded?.email, 'user@example.com');
    assert.equal(decoded?.id, 'user-1');
    await assert.rejects(() => decode({ token: `${encoded}x`, secret }));
  });
});
