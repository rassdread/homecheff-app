import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { encode } from 'next-auth/jwt';
import { isBrowserSessionRevoked } from '@/lib/auth/session-revocation';
import { NEXTAUTH_SESSION_COOKIE_NAME } from '@/lib/auth/session-cookie-name';
import { readNativeSession } from '@/lib/auth/native-session-read';

const secret = 'test-secret-test-secret-test-secret-32';

describe('native session recognition', () => {
  it('gives the app login its own session key, like the website', () => {
    const mint = readFileSync(resolve(process.cwd(), 'lib/auth/native-google-session.ts'), 'utf8');
    const web = readFileSync(resolve(process.cwd(), 'lib/auth.ts'), 'utf8');
    assert.match(mint, /sid: randomUUID\(\)/);
    assert.match(web, /minimalToken\.sid/);
    assert.equal(isBrowserSessionRevoked('fresh-browser', ['*']), false);
    assert.equal(isBrowserSessionRevoked('*', ['*']), true);
  });

  it('recognizes a minted cookie and rejects an empty, revoked, or unreadable one', async () => {
    const sid = 'fresh-browser';
    const encoded = await encode({
      secret,
      token: {
        email: 'user@example.com',
        sub: 'user-1',
        id: 'user-1',
        sid,
        role: 'ADMIN',
      },
      maxAge: 60,
    });
    const header = `${NEXTAUTH_SESSION_COOKIE_NAME}=${encoded}`;
    assert.equal(await readNativeSession(header, secret), 'recognized');
    assert.equal(await readNativeSession(null, secret), 'missing');
    assert.equal(
      await readNativeSession(`${NEXTAUTH_SESSION_COOKIE_NAME}=`, secret),
      'empty',
    );
    assert.equal(
      await readNativeSession(`${NEXTAUTH_SESSION_COOKIE_NAME}=not-a-token`, secret),
      'undecodable',
    );
    const revoked = await encode({
      secret,
      token: { revoked: true },
      maxAge: 60,
    });
    assert.equal(
      await readNativeSession(`${NEXTAUTH_SESSION_COOKIE_NAME}=${revoked}`, secret),
      'revoked',
    );
    const noEmail = await encode({
      secret,
      token: { sub: 'user-1', sid: 'fresh-browser' },
      maxAge: 60,
    });
    assert.equal(
      await readNativeSession(`${NEXTAUTH_SESSION_COOKIE_NAME}=${noEmail}`, secret),
      'no-email',
    );
  });
});
