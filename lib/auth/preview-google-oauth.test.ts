import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  ALLOWED_PREVIEW_GOOGLE_BRANCH,
  ALLOWED_PREVIEW_GOOGLE_HOST,
  isExactPreviewGoogleHost,
  resolvePreviewGoogleOAuthClient,
} from './preview-google-oauth';

const previewId = 'preview-client-abc.apps.googleusercontent.com';
const previewSecret = 'preview-secret-value-not-production';

function allowedEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    VERCEL_ENV: 'preview',
    VERCEL_GIT_COMMIT_REF: ALLOWED_PREVIEW_GOOGLE_BRANCH,
    VERCEL_BRANCH_URL: ALLOWED_PREVIEW_GOOGLE_HOST,
    GOOGLE_PREVIEW_WEB_CLIENT_ID: previewId,
    GOOGLE_PREVIEW_WEB_CLIENT_SECRET: previewSecret,
    GOOGLE_CLIENT_ID: 'legacy-preview-id',
    GOOGLE_CLIENT_SECRET: 'shared-production-secret-value',
    ...overrides,
  };
}

test('the allowlisted preview host can use a separate Google client', () => {
  const client = resolvePreviewGoogleOAuthClient(allowedEnv());
  assert.equal(client?.clientId, previewId);
  assert.equal(client?.source, 'GOOGLE_PREVIEW_WEB_CLIENT_ID');
});

test('production and other previews stay without the preview client', () => {
  assert.equal(resolvePreviewGoogleOAuthClient(allowedEnv({ VERCEL_ENV: 'production' })), null);
  assert.equal(resolvePreviewGoogleOAuthClient(allowedEnv({ VERCEL_ENV: 'development' })), null);
  assert.equal(resolvePreviewGoogleOAuthClient(allowedEnv({ VERCEL_GIT_COMMIT_REF: 'main' })), null);
  assert.equal(
    resolvePreviewGoogleOAuthClient(allowedEnv({ VERCEL_BRANCH_URL: 'another-preview.vercel.app' })),
    null,
  );
  assert.equal(resolvePreviewGoogleOAuthClient(allowedEnv({ VERCEL_BRANCH_URL: '' })), null);
});

test('missing or production credentials fail closed', () => {
  assert.equal(resolvePreviewGoogleOAuthClient(allowedEnv({ GOOGLE_PREVIEW_WEB_CLIENT_ID: '' })), null);
  assert.equal(resolvePreviewGoogleOAuthClient(allowedEnv({ GOOGLE_PREVIEW_WEB_CLIENT_SECRET: '' })), null);
  assert.equal(
    resolvePreviewGoogleOAuthClient(allowedEnv({ GOOGLE_PREVIEW_WEB_CLIENT_ID: 'not-a-google-client' })),
    null,
  );
  assert.equal(
    resolvePreviewGoogleOAuthClient(allowedEnv({ GOOGLE_PREVIEW_WEB_CLIENT_ID: 'legacy-preview-id' })),
    null,
  );
  assert.equal(
    resolvePreviewGoogleOAuthClient(
      allowedEnv({ GOOGLE_PREVIEW_WEB_CLIENT_SECRET: 'shared-production-secret-value' }),
    ),
    null,
  );
  assert.equal(
    resolvePreviewGoogleOAuthClient(
      allowedEnv({
        GOOGLE_WEB_CLIENT_ID: previewId,
        GOOGLE_PREVIEW_WEB_CLIENT_ID: previewId,
      }),
    ),
    null,
  );
});

test('the auth route hides Google outside the exact preview host', () => {
  const route = readFileSync(
    new URL('../../app/api/auth/[...nextauth]/route.ts', import.meta.url),
    'utf8',
  );
  assert.match(route, /isExactPreviewGoogleHost/);
  assert.match(route, /delete data\.google/);
  assert.match(route, /signin\/google/);
});

test('only the exact preview host is allowed', () => {
  assert.equal(isExactPreviewGoogleHost(ALLOWED_PREVIEW_GOOGLE_HOST), true);
  assert.equal(isExactPreviewGoogleHost(`https://${ALLOWED_PREVIEW_GOOGLE_HOST}`), false);
  assert.equal(isExactPreviewGoogleHost(`${ALLOWED_PREVIEW_GOOGLE_HOST}.evil.com`), false);
  assert.equal(isExactPreviewGoogleHost('homecheff.eu'), false);
  assert.equal(isExactPreviewGoogleHost('another-preview.vercel.app'), false);
  assert.equal(isExactPreviewGoogleHost(''), false);
});
