// Email Encryption Library
// AES-256-GCM encryption for email content at rest
// Provides transparent encryption/decryption with authenticated encryption

/**
 * Encrypt text using AES-256-GCM
 * @param plaintext - Text to encrypt
 * @param masterKey - Base64-encoded 256-bit master key
 * @returns Base64-encoded encrypted data with format: iv:authTag:ciphertext
 */
export async function encryptContent(plaintext: string, masterKey: string): Promise<string> {
  try {
    // Decode master key from base64
    const keyBuffer = Uint8Array.from(atob(masterKey), c => c.charCodeAt(0));
    
    // Import key for AES-GCM
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt data
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      cryptoKey,
      data
    );
    
    // Extract ciphertext and auth tag
    const encryptedArray = new Uint8Array(encrypted);
    const ciphertext = encryptedArray.slice(0, -16); // All but last 16 bytes
    const authTag = encryptedArray.slice(-16); // Last 16 bytes
    
    // Encode to base64: iv:authTag:ciphertext
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const authTagBase64 = btoa(String.fromCharCode(...authTag));
    const ciphertextBase64 = btoa(String.fromCharCode(...ciphertext));
    
    return `${ivBase64}:${authTagBase64}:${ciphertextBase64}`;
  } catch (error) {
    console.error('🔒 Encryption error:', error);
    throw new Error('Failed to encrypt content');
  }
}

/**
 * Decrypt text using AES-256-GCM
 * @param encrypted - Encrypted data in format: iv:authTag:ciphertext
 * @param masterKey - Base64-encoded 256-bit master key
 * @returns Decrypted plaintext
 */
export async function decryptContent(encrypted: string, masterKey: string): Promise<string> {
  try {
    // Parse encrypted data
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format');
    }
    
    const [ivBase64, authTagBase64, ciphertextBase64] = parts;
    
    // Decode from base64
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const authTag = Uint8Array.from(atob(authTagBase64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
    
    // Combine ciphertext and auth tag
    const encryptedData = new Uint8Array(ciphertext.length + authTag.length);
    encryptedData.set(ciphertext);
    encryptedData.set(authTag, ciphertext.length);
    
    // Decode master key
    const keyBuffer = Uint8Array.from(atob(masterKey), c => c.charCodeAt(0));
    
    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      cryptoKey,
      encryptedData
    );
    
    // Decode to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('🔓 Decryption error:', error);
    throw new Error('Failed to decrypt content');
  }
}

/**
 * Generate a secure 256-bit encryption key
 * @returns Base64-encoded random key
 */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
  return btoa(String.fromCharCode(...key));
}

/**
 * Check if content is encrypted (has encryption format)
 * @param content - Content to check
 * @returns true if content appears to be encrypted
 */
export function isEncrypted(content: string | null): boolean {
  if (!content) return false;
  // Check for encryption format: iv:authTag:ciphertext
  return /^[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*:[A-Za-z0-9+/]+=*$/.test(content);
}

/**
 * Safely encrypt content (handles null/empty)
 * @param content - Content to encrypt
 * @param masterKey - Encryption key
 * @returns Encrypted content or null
 */
export async function safeEncrypt(content: string | null, masterKey: string): Promise<string | null> {
  if (!content || !content.trim()) return null;
  return await encryptContent(content, masterKey);
}

/**
 * Safely decrypt content (handles null/empty/unencrypted)
 * @param content - Content to decrypt
 * @param masterKey - Encryption key
 * @returns Decrypted content or original if not encrypted
 */
export async function safeDecrypt(content: string | null, masterKey: string): Promise<string | null> {
  if (!content) return null;
  if (!isEncrypted(content)) return content; // Already plaintext (legacy)
  try {
    return await decryptContent(content, masterKey);
  } catch (error) {
    console.error('⚠️  Failed to decrypt content, returning null');
    return null;
  }
}
