import assert from 'node:assert/strict';
import test from 'node:test';
import { configuredCredential } from './configured-credential';

test('a real credential is kept and the disabled sentinel is empty', () => {
  assert.equal(configuredCredential('  live-value  '), 'live-value');
  assert.equal(configuredCredential('disabled'), '');
  assert.equal(configuredCredential(' DISABLED '), '');
  assert.equal(configuredCredential(''), '');
  assert.equal(configuredCredential(undefined), '');
});

test('disabled Firebase, vault, and cargo settings do not initialize', async () => {
  const previous = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN: process.env.RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN,
  };
  process.env.FIREBASE_PROJECT_ID = 'disabled';
  process.env.FIREBASE_CLIENT_EMAIL = 'disabled';
  process.env.FIREBASE_PRIVATE_KEY = 'disabled';
  process.env.RECEIPT_VAULT_BLOB_READ_WRITE_TOKEN = 'disabled';
  try {
    const firebase = await import('../firebase/admin.ts');
    assert.equal(firebase.isFirebaseAdminConfigured(), false);
    assert.equal(firebase.getFirebaseMessaging(), null);
    const vault = await import('../finance/evidence/vault-store.ts');
    assert.equal(vault.isVaultConfigured(), false);
    assert.throws(() => vault.vaultToken(), (error: unknown) => (error as Error).name === 'VaultNotConfiguredError');
    const cargo = await import('../delivery/cargo-photo-store.ts');
    assert.equal(cargo.cargoPhotoToken(), null);
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('a PEM-shaped Firebase key remains configured', async () => {
  const previous = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  };
  process.env.FIREBASE_PROJECT_ID = 'homecheff-test';
  process.env.FIREBASE_CLIENT_EMAIL = 'push@example.test';
  process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nexample\n-----END PRIVATE KEY-----';
  try {
    const firebase = await import('../firebase/admin.ts');
    assert.equal(firebase.isFirebaseAdminConfigured(), true);
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
