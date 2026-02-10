import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Generate encryption key from password
export function generateKeyFromPassword(password: string, salt: string): Buffer {
  return crypto.scryptSync(password, salt, KEY_LENGTH);
}

// Generate random salt
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Encrypt text
export function encryptText(text: string, key: Buffer): { encrypted: string; iv: string; tag: string } {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from('homecheff-messages', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt message');
  }
}

// Decrypt text
export function decryptText(encryptedData: { encrypted: string; iv: string; tag: string }, key: Buffer): string {
  try {
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAAD(Buffer.from('homecheff-messages', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt message');
  }
}

// Hash sensitive data (one-way)
export function hashSensitiveData(data: string): string {
  const salt = process.env.ENCRYPTION_SALT || 'default-salt-change-in-production';
  return crypto.createHmac('sha256', salt).update(data).digest('hex');
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Validate encryption key strength
export function validateKeyStrength(key: string): boolean {
  return key.length >= 32 && /[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(key);
}
