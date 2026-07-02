#!/usr/bin/env node
/**
 * Validates android/app/google-services.json for native Google Sign-In / FCM.
 * Fails when oauth_client is empty for eu.homecheff.mobile (no SHA fingerprints in Firebase).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const PACKAGE = 'eu.homecheff.mobile';
const servicesPath = path.join(root, 'android', 'app', 'google-services.json');

function fail(msg) {
  console.error(`\n✗ google-services: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.info(`✓ ${msg}`);
}

if (!fs.existsSync(servicesPath)) {
  fail(
    `missing ${path.relative(root, servicesPath)} — download from Firebase (Project homecheff-cbb05 → Android app ${PACKAGE})`,
  );
}

let json;
try {
  json = JSON.parse(fs.readFileSync(servicesPath, 'utf8'));
} catch (e) {
  fail(`invalid JSON: ${e instanceof Error ? e.message : e}`);
}

const clients = Array.isArray(json.client) ? json.client : [];
const appClient = clients.find(
  (c) => c?.client_info?.android_client_info?.package_name === PACKAGE,
);

if (!appClient) {
  fail(`no client entry for package ${PACKAGE}`);
}

const oauth = Array.isArray(appClient.oauth_client) ? appClient.oauth_client : [];
const androidOAuth = oauth.filter((o) => o.client_type === 1 || o.client_type === '1');
const webOAuth = oauth.filter((o) => o.client_type === 3 || o.client_type === '3');

ok(`package ${PACKAGE} found (project ${json.project_info?.project_id ?? '?'})`);

if (oauth.length === 0) {
  fail(
    `oauth_client is empty for ${PACKAGE} — add SHA-1/SHA-256 in Firebase Project Settings → Your apps → ${PACKAGE}, then re-download google-services.json. ` +
      'Required: debug keystore, upload/release keystore, and Google Play App Signing certificate.',
  );
}

ok(`${oauth.length} oauth_client entries (${androidOAuth.length} Android, ${webOAuth.length} Web)`);

if (androidOAuth.length < 1) {
  fail(
    'no Android OAuth client (type 1) — register at least one SHA-1 fingerprint in Firebase for this app',
  );
}

console.info('\nGoogle Sign-In config looks present. For Play Open Testing, ensure Play App Signing SHA is in Firebase.\n');
