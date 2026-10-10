import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { tryNormalizeEmail } from '@/lib/auth/normalize-email';
import { jsonRegisterDuplicate } from '@/lib/auth/register-duplicate-response';
import { trySendSignupVerificationEmail } from '@/lib/auth/send-signup-verification-email';
import {
  runResendVerificationCore,
  type ResendVerificationDeps,
} from '@/lib/auth-resend-verification-core';
import {
  completeEmailVerificationAgainstStore,
  type VerificationStore,
  type VerificationUserRecord,
} from '@/lib/complete-email-verification';
import { EmailSendFailure } from '@/lib/email-send-failure';
import {
  buildVerificationHtml,
  buildVerificationPlainText,
} from '@/lib/verification-email-content';
import { _resetVerificationAttemptLimitForTests } from '@/lib/verification-attempt-limit';
import { _resetVerificationResendRateLimitForTests } from '@/lib/verification-resend-rate-limit';
import { verificationUserMessage } from '@/lib/verification-user-messages';
import {
  canonicalizeVerificationCredential,
  generateVerificationCode,
  generateVerificationToken,
  getVerificationExpires,
  normalizeVerificationCodeInput,
  VERIFICATION_CODE_TTL_HOURS,
} from '@/lib/verification';

const root = resolve(process.cwd());
function read(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

function future(hours = 24): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function user(partial: Partial<VerificationUserRecord> & Pick<VerificationUserRecord, 'id' | 'email'>): VerificationUserRecord {
  return {
    name: 'Test',
    username: 'tester',
    emailVerified: null,
    emailVerificationToken: 'token-a',
    emailVerificationCode: '111111',
    emailVerificationExpires: future(),
    accountDeletedAt: null,
    ...partial,
  };
}

function memoryStore(seed: VerificationUserRecord[]): VerificationStore & { snapshot: (id: string) => VerificationUserRecord | undefined } {
  const rows = new Map(seed.map((row) => [row.id, { ...row }]));
  return {
    snapshot(id) {
      const row = rows.get(id);
      return row ? { ...row } : undefined;
    },
    async findByEmail(email) {
      const needle = email.toLowerCase();
      return [...rows.values()].find((row) => row.email.toLowerCase() === needle) ?? null;
    },
    async findByToken(token) {
      return [...rows.values()].find((row) => row.emailVerificationToken === token) ?? null;
    },
    async claim(id, credential, now) {
      const row = rows.get(id);
      if (!row?.emailVerificationExpires || row.emailVerificationExpires.getTime() <= now.getTime()) return 0;
      const matches = row.emailVerificationToken === credential || row.emailVerificationCode === credential;
      if (!matches) return 0;
      row.emailVerified = now;
      row.emailVerificationToken = null;
      row.emailVerificationCode = null;
      row.emailVerificationExpires = null;
      return 1;
    },
    async reload(id) {
      const row = rows.get(id);
      return row ? { ...row } : null;
    },
  };
}

beforeEach(() => {
  _resetVerificationAttemptLimitForTests();
  _resetVerificationResendRateLimitForTests();
});

describe('REGISTRATION_VALID', () => {
  it('accepts a normal email and the register route sends a verification mail', () => {
    assert.equal(tryNormalizeEmail('  Ada@Example.com '), 'ada@example.com');
    const src = read('app/api/auth/register/route.ts');
    assert.match(src, /trySendSignupVerificationEmail\(/);
    assert.match(src, /needsVerification: true/);
    assert.match(src, /verificationEmailSent/);
  });
});

describe('REGISTRATION_INVALID_EMAIL', () => {
  it('rejects an address without a domain', () => {
    assert.equal(tryNormalizeEmail('not-an-email'), null);
    assert.equal(tryNormalizeEmail(''), null);
    assert.match(read('app/api/auth/register/route.ts'), /Voer een geldig e-mailadres in/);
  });
});

describe('REGISTRATION_DUPLICATE_EMAIL', () => {
  it('returns 409 without creating a second account', async () => {
    const res = jsonRegisterDuplicate('password_only');
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.error, 'ALREADY_REGISTERED');
    assert.equal(body.duplicateKind, 'password_only');
  });
});

describe('REGISTRATION_EMAIL_SEND_FAILURE', () => {
  it('keeps registration usable when the provider rejects the mail', async () => {
    const result = await trySendSignupVerificationEmail(
      {
        email: 'new@example.com',
        name: 'Nieuw',
        verificationToken: 'tok',
        verificationCode: '123456',
        locale: 'nl',
      },
      {
        hasApiKey: true,
        send: async () => {
          throw new EmailSendFailure('down', 'provider_unknown', 'EMAIL_UNAVAILABLE');
        },
      },
    );
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, 'EMAIL_UNAVAILABLE');
  });

  it('reports a missing provider key instead of pretending the mail was sent', async () => {
    const result = await trySendSignupVerificationEmail(
      {
        email: 'new@example.com',
        name: 'Nieuw',
        verificationToken: 'tok',
        verificationCode: '123456',
      },
      { hasApiKey: false },
    );
    assert.equal(result.sent, false);
    assert.equal(result.skippedReason, 'EMAIL_NOT_CONFIGURED');
  });
});

describe('VERIFICATION_EMAIL_GENERATED', () => {
  it('puts the code and the 24 hour lifetime in Dutch and English mail', () => {
    const code = '482913';
    const nl = buildVerificationPlainText({
      locale: 'nl',
      name: 'Sam',
      verificationUrl: 'https://homecheff.eu/verify-email?token=abc',
      verificationCode: code,
    });
    const en = buildVerificationHtml({
      locale: 'en',
      name: 'Sam',
      verificationUrl: 'https://homecheff.eu/verify-email?token=abc',
      verificationCode: code,
    });
    assert.match(nl, new RegExp(code));
    assert.match(nl, new RegExp(`${VERIFICATION_CODE_TTL_HOURS} uur`));
    assert.doesNotMatch(nl, /enkele minuten/);
    assert.match(en.replace(/<[^>]+>/g, ''), new RegExp(code));
    assert.match(en, new RegExp(`${VERIFICATION_CODE_TTL_HOURS} hours`));
    assert.match(en, /name="viewport"/);
    assert.equal(getVerificationExpires(new Date('2026-01-01T00:00:00Z')).toISOString(), '2026-01-02T00:00:00.000Z');
  });
});

describe('VERIFICATION_CODE_GENERATION', () => {
  it('uses a cryptographic generator and always returns six digits', () => {
    const src = read('lib/verification.ts');
    assert.match(src, /randomInt\(0, 1_000_000\)/);
    assert.doesNotMatch(src, /Math\.random/);
    for (let i = 0; i < 40; i += 1) {
      assert.match(generateVerificationCode(), /^\d{6}$/);
    }
    assert.equal(generateVerificationToken().length, 64);
  });
});

describe('VERIFICATION_CODE_VALID', () => {
  it('activates only the account that owns the code', async () => {
    const store = memoryStore([
      user({ id: 'a', email: 'a@example.com', emailVerificationCode: '123456' }),
    ]);
    let welcomes = 0;
    const result = await completeEmailVerificationAgainstStore(store, '123456', {
      email: 'a@example.com',
      onClaimed: async () => {
        welcomes += 1;
      },
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.code, 'VERIFIED');
    assert.equal(welcomes, 1);
    assert.ok(store.snapshot('a')?.emailVerified);
    assert.equal(store.snapshot('a')?.emailVerificationCode, null);
  });
});

describe('VERIFICATION_CODE_INVALID', () => {
  it('does not activate the account', async () => {
    const store = memoryStore([user({ id: 'a', email: 'a@example.com', emailVerificationCode: '123456' })]);
    const result = await completeEmailVerificationAgainstStore(store, '000000', { email: 'a@example.com' });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, 'INVALID');
    assert.equal(store.snapshot('a')?.emailVerified, null);
  });
});

describe('VERIFICATION_CODE_EXPIRED', () => {
  it('rejects a matching code after its lifetime', async () => {
    const store = memoryStore([
      user({
        id: 'a',
        email: 'a@example.com',
        emailVerificationCode: '123456',
        emailVerificationExpires: new Date(Date.now() - 1000),
      }),
    ]);
    const result = await completeEmailVerificationAgainstStore(store, '123456', { email: 'a@example.com' });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, 'EXPIRED');
    assert.equal(store.snapshot('a')?.emailVerified, null);
    assert.equal(store.snapshot('a')?.emailVerificationCode, '123456');
  });
});

describe('VERIFICATION_CODE_SINGLE_USE', () => {
  it('accepts the code once and treats a replay as already confirmed', async () => {
    const store = memoryStore([user({ id: 'a', email: 'a@example.com', emailVerificationCode: '123456' })]);
    let welcomes = 0;
    const first = await completeEmailVerificationAgainstStore(store, '123456', {
      email: 'a@example.com',
      onClaimed: async () => {
        welcomes += 1;
      },
    });
    const second = await completeEmailVerificationAgainstStore(store, '123456', {
      email: 'a@example.com',
      onClaimed: async () => {
        welcomes += 1;
      },
    });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (second.ok) assert.equal(second.code, 'ALREADY_VERIFIED');
    assert.equal(welcomes, 1);
  });
});

describe('VERIFICATION_CODE_WRONG_ACCOUNT', () => {
  it('never activates a different account that happens to hold that code', async () => {
    const store = memoryStore([
      user({ id: 'a', email: 'a@example.com', emailVerificationCode: '123456', emailVerificationToken: 'tok-a' }),
      user({ id: 'b', email: 'b@example.com', emailVerificationCode: '654321', emailVerificationToken: 'tok-b' }),
    ]);
    const result = await completeEmailVerificationAgainstStore(store, '123456', { email: 'b@example.com' });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, 'INVALID');
    assert.equal(store.snapshot('a')?.emailVerified, null);
    assert.equal(store.snapshot('b')?.emailVerified, null);
  });
});

describe('VERIFICATION_CODE_BRUTE_FORCE_PROTECTION', () => {
  it('stops accepting guesses after repeated failures for the same address', async () => {
    const store = memoryStore([user({ id: 'a', email: 'a@example.com', emailVerificationCode: '123456' })]);
    for (let i = 0; i < 8; i += 1) {
      const miss = await completeEmailVerificationAgainstStore(store, '000000', { email: 'a@example.com' });
      assert.equal(miss.ok, false);
      if (!miss.ok) assert.equal(miss.code, 'INVALID');
    }
    const blocked = await completeEmailVerificationAgainstStore(store, '123456', { email: 'a@example.com' });
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.equal(blocked.code, 'RATE_LIMITED');
      assert.ok((blocked.retryAfterSec ?? 0) > 0);
    }
    assert.equal(store.snapshot('a')?.emailVerified, null);
  });
});

describe('VERIFICATION_CODE_CONCURRENT_SUBMISSIONS', () => {
  it('claims the code once when two requests arrive together', async () => {
    const store = memoryStore([user({ id: 'a', email: 'a@example.com', emailVerificationCode: '123456' })]);
    let welcomes = 0;
    const [left, right] = await Promise.all([
      completeEmailVerificationAgainstStore(store, '123456', {
        email: 'a@example.com',
        onClaimed: async () => {
          welcomes += 1;
        },
      }),
      completeEmailVerificationAgainstStore(store, '123456', {
        email: 'a@example.com',
        onClaimed: async () => {
          welcomes += 1;
        },
      }),
    ]);
    assert.equal(left.ok, true);
    assert.equal(right.ok, true);
    assert.equal(welcomes, 1);
    assert.ok(store.snapshot('a')?.emailVerified);
  });
});

describe('VERIFICATION_CODE_PASTE', () => {
  it('keeps six digits when the pasted text contains spaces or a label', () => {
    assert.equal(normalizeVerificationCodeInput('123 456'), '123456');
    assert.equal(normalizeVerificationCodeInput('code: 12-34-56'), '123456');
    assert.equal(normalizeVerificationCodeInput('123456789'), '123456');
    assert.equal(canonicalizeVerificationCredential(' 123 456 '), '123456');
  });
});

describe('VERIFICATION_CODE_AUTOFILL', () => {
  it('accepts a one-time-code value and the field is built for autofill', () => {
    assert.equal(normalizeVerificationCodeInput('482913'), '482913');
    const field = read('components/auth/VerificationCodeField.tsx');
    assert.match(field, /autoComplete="one-time-code"/);
    assert.match(field, /inputMode="numeric"/);
    assert.match(field, /onPaste/);
    assert.doesNotMatch(field, /maxLength/);
  });
});

describe('VERIFICATION_RESEND', () => {
  it('replaces the previous code only after the new mail is accepted', async () => {
    const row = user({ id: 'a', email: 'a@example.com', emailVerificationCode: '111111' });
    const deps: ResendVerificationDeps = {
      findUser: async () => ({ ...row }),
      updateCredentials: async (_id, data) => {
        Object.assign(row, data);
      },
      restoreCredentials: async () => false,
      send: async () => undefined,
    };
    const result = await runResendVerificationCore('a@example.com', { locale: 'nl', deps });
    assert.equal(result.status, 'sent');
    assert.notEqual(row.emailVerificationCode, '111111');
    const store = memoryStore([row]);
    const stale = await completeEmailVerificationAgainstStore(store, '111111', { email: 'a@example.com' });
    assert.equal(stale.ok, false);
    const fresh = await completeEmailVerificationAgainstStore(store, row.emailVerificationCode || '', {
      email: 'a@example.com',
    });
    assert.equal(fresh.ok, true);
  });
});

describe('VERIFICATION_RESEND_COOLDOWN', () => {
  it('does not mint a second code during the cooldown', async () => {
    const row = user({ id: 'a', email: 'a@example.com' });
    let updates = 0;
    const deps: ResendVerificationDeps = {
      findUser: async () => ({ ...row }),
      updateCredentials: async (_id, data) => {
        updates += 1;
        Object.assign(row, data);
      },
      restoreCredentials: async () => false,
      send: async () => undefined,
    };
    const first = await runResendVerificationCore('a@example.com', { deps });
    const second = await runResendVerificationCore('a@example.com', { deps });
    assert.equal(first.status, 'sent');
    assert.equal(second.status, 'rate_limited');
    assert.equal(updates, 1);
  });
});

describe('VERIFICATION_RESEND_SEND_FAILURE', () => {
  it('restores the previous code when the provider does not accept the mail', async () => {
    const row = user({ id: 'a', email: 'a@example.com', emailVerificationCode: '111111', emailVerificationToken: 'keep-me' });
    const deps: ResendVerificationDeps = {
      findUser: async () => ({ ...row }),
      updateCredentials: async (_id, data) => {
        Object.assign(row, data);
      },
      restoreCredentials: async (_id, data) => {
        Object.assign(row, data);
        return true;
      },
      send: async () => {
        throw new EmailSendFailure('down', 'provider_unknown', 'EMAIL_UNAVAILABLE');
      },
    };
    const result = await runResendVerificationCore('a@example.com', { deps });
    assert.equal(result.status, 'email_service_unavailable');
    if (result.status === 'email_service_unavailable') assert.equal(result.previousCodeRestored, true);
    assert.equal(row.emailVerificationCode, '111111');
    assert.equal(row.emailVerificationToken, 'keep-me');
    const store = memoryStore([row]);
    const stillValid = await completeEmailVerificationAgainstStore(store, '111111', { email: 'a@example.com' });
    assert.equal(stillValid.ok, true);
  });
});

describe('VERIFICATION_RESEND_ROLLBACK_RACE', () => {
  it('does not put an older code back over a newer one', async () => {
    const row = user({
      id: 'a',
      email: 'a@example.com',
      emailVerificationCode: '111111',
      emailVerificationToken: 'old-token',
    });
    const deps: ResendVerificationDeps = {
      findUser: async () => ({ ...row }),
      updateCredentials: async (_id, data) => {
        Object.assign(row, data);
      },
      restoreCredentials: async (_id, previous, issued) => {
        if (
          issued &&
          (row.emailVerificationToken !== issued.emailVerificationToken ||
            row.emailVerificationCode !== issued.emailVerificationCode)
        ) {
          return false;
        }
        Object.assign(row, previous);
        return true;
      },
      send: async () => {
        row.emailVerificationCode = '222222';
        row.emailVerificationToken = 'newer-token';
        throw new EmailSendFailure('down', 'provider_unknown', 'EMAIL_UNAVAILABLE');
      },
    };
    const result = await runResendVerificationCore('a@example.com', { deps });
    assert.equal(result.status, 'email_service_unavailable');
    if (result.status === 'email_service_unavailable') assert.equal(result.previousCodeRestored, false);
    assert.equal(row.emailVerificationCode, '222222');
    assert.equal(row.emailVerificationToken, 'newer-token');
    const source = read('lib/auth-resend-verification-core.ts');
    assert.match(source, /emailVerificationToken: issued\.emailVerificationToken/);
    assert.match(source, /emailVerificationCode: issued\.emailVerificationCode/);
  });
});

describe('VERIFICATION_ACCOUNT_ACTIVATED', () => {
  it('stores a verification timestamp and clears the credentials', async () => {
    const store = memoryStore([user({ id: 'a', email: 'a@example.com' })]);
    await completeEmailVerificationAgainstStore(store, '111111', { email: 'A@Example.com' });
    const saved = store.snapshot('a');
    assert.ok(saved?.emailVerified instanceof Date);
    assert.equal(saved?.emailVerificationToken, null);
    assert.equal(saved?.emailVerificationCode, null);
  });
});

describe('VERIFICATION_LOGIN_AFTER_ACTIVATION', () => {
  it('lets a verified account sign in and blocks protected actions before verification', () => {
    const auth = read('lib/auth.ts');
    assert.match(auth, /emailVerified:\s*true/);
    assert.match(auth, /dbUser\.emailVerified/);
    const authorize = auth.slice(auth.indexOf('async authorize'), auth.indexOf('callbacks:'));
    assert.doesNotMatch(authorize, /if\s*\(!user\.emailVerified\)/);
    const api = read('lib/api-auth.ts');
    assert.match(api, /if\s*\(!user\.emailVerified\)/);
  });
});

describe('VERIFICATION_BROWSER_RESTART', () => {
  it('keeps activation on the account so a later session reads it from the database', async () => {
    const store = memoryStore([user({ id: 'a', email: 'a@example.com', emailVerificationToken: 'link-token', emailVerificationCode: '222333' })]);
    await completeEmailVerificationAgainstStore(store, 'link-token');
    const saved = store.snapshot('a');
    assert.ok(saved?.emailVerified);
    assert.match(read('lib/auth.ts'), /emailVerified: true/);
    assert.match(read('components/auth/EmailVerificationPromptHost.tsx'), /await update\(\)/);
  });
});

describe('VERIFICATION_MOBILE', () => {
  it('uses one numeric field that accepts a full paste on a phone keyboard', () => {
    const field = read('components/auth/VerificationCodeField.tsx');
    assert.match(field, /inputMode="numeric"/);
    assert.match(field, /autoComplete="one-time-code"/);
    assert.match(field, /enterKeyHint="done"/);
    assert.match(read('components/auth/EmailVerificationModal.tsx'), /VerificationCodeField/);
    assert.match(read('app/verify-email/page.tsx'), /VerificationCodeField/);
  });
});

describe('VERIFICATION_DESKTOP', () => {
  it('submits from the same field and does not use separate boxes', () => {
    const modal = read('components/auth/EmailVerificationModal.tsx');
    assert.match(modal, /token: code, email/);
    assert.doesNotMatch(modal, /maxLength=\{6\}/);
    assert.match(modal, /code\.length < 6/);
  });
});

describe('VERIFICATION_NL', () => {
  it('uses the Dutch confirmation, invalid and expired sentences', () => {
    assert.equal(
      verificationUserMessage('INVALID', 'nl'),
      'De code is niet correct. Controleer de cijfers en probeer het opnieuw.',
    );
    assert.equal(
      verificationUserMessage('EXPIRED', 'nl'),
      'Deze code is verlopen. Vraag een nieuwe code aan.',
    );
    assert.equal(
      verificationUserMessage('VERIFIED', 'nl'),
      'Je e-mailadres is bevestigd. Je kunt nu verder.',
    );
    const nl = JSON.parse(read('public/i18n/nl.json')) as { emailVerification: Record<string, string> };
    assert.equal(nl.emailVerification.verifyInvalidCode, verificationUserMessage('INVALID', 'nl'));
    assert.match(nl.emailVerification.codeHint, /24 uur/);
  });
});

describe('VERIFICATION_EN', () => {
  it('uses the English confirmation, invalid and expired sentences', () => {
    assert.equal(
      verificationUserMessage('INVALID', 'en'),
      'The code is not correct. Check the digits and try again.',
    );
    assert.equal(
      verificationUserMessage('EXPIRED', 'en'),
      'This code has expired. Request a new code.',
    );
    assert.equal(
      verificationUserMessage('VERIFIED', 'en'),
      'Your email address is confirmed. You can continue.',
    );
    const en = JSON.parse(read('public/i18n/en.json')) as { emailVerification: Record<string, string> };
    assert.equal(en.emailVerification.verifyExpired, verificationUserMessage('EXPIRED', 'en'));
    assert.match(en.emailVerification.codeHint, /24 hours/);
  });
});

describe('GOOGLE_AUTH_REGRESSION', () => {
  it('still marks a Google account verified without the six-digit code', () => {
    const sync = read('lib/auth/google-account-sync.ts');
    assert.match(sync, /emailVerified: new Date\(\)/);
    assert.doesNotMatch(sync, /generateVerificationCode/);
    assert.match(read('lib/auth.ts'), /syncGoogleProfileToDatabase/);
    assert.match(read('lib/auth.ts'), /provider === "google"/);
  });
});

describe('GROWTH_AUTH_REGRESSION', () => {
  it('keeps Growth on the shared HomeCheff account instead of a second registration system', () => {
    const page = read('app/growth/page.tsx');
    assert.match(page, /EcosystemParticipationLanding/);
    assert.doesNotMatch(page, /\/api\/auth\/register/);
    assert.match(read('lib/ecosystem-navigation/contract.ts'), /never mint studio_session \/ growth_session/);
  });
});

describe('STUDIO_AUTH_REGRESSION', () => {
  it('keeps Studio on the shared HomeCheff account', () => {
    const page = read('app/studio/page.tsx');
    assert.match(page, /EcosystemParticipationLanding/);
    assert.doesNotMatch(page, /\/api\/auth\/register/);
    assert.match(read('lib/auth.ts'), /Credentials/);
  });
});

describe('AFFILIATE_REGISTRATION_REGRESSION', () => {
  it('still sends new affiliates through the same email verification', () => {
    assert.match(read('app/api/affiliate/signup/route.ts'), /needsEmailVerification/);
    const verify = read('app/verify-email/page.tsx');
    assert.match(verify, /sanitizePostAuthRelativeUrl/);
    assert.match(verify, /VerificationCodeField/);
    assert.match(read('lib/affiliate/signup-flow.ts'), /\/verify-email\?/);
  });
});
