import crypto from 'crypto';

// Use a strong encryption key from environment or generate one
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!'; // Must be 32 characters
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt text using AES-256-CBC
 */
export function encrypt(text: string): string {
    // Ensure key is 32 bytes
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt text using AES-256-CBC
 */
export function decrypt(encryptedText: string): string {
    try {
        const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt API key');
    }
}
