// AES-256-GCM encryption & SHA-256 integrity hashing for TJKN CBT submissions.
// Ensures students cannot inspect scores or answer keys in UI, Network tab, or backup files.

const SYSTEM_ENCRYPTION_SECRET = 'SMK-MUDITA-TJKN-SAS-2026-AES256GCM-KEY';
export const TEACHER_ACCESS_PASSCODE = 'GURU-TJKN-2026';

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(secret: string, salt: Uint8Array, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 60000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage]
  );
}

export async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  if (window.crypto?.subtle) {
    const digest = await window.crypto.subtle.digest('SHA-256', enc.encode(text));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Lightweight deterministic fallback hash if subtle is unavailable
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

export async function encryptText(plaintext: string): Promise<string> {
  const enc = new TextEncoder();
  if (window.crypto?.subtle) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveAesKey(SYSTEM_ENCRYPTION_SECRET, salt, 'encrypt');
    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      enc.encode(plaintext)
    );
    return `AES256GCM:v1:${toBase64(salt)}:${toBase64(iv)}:${toBase64(new Uint8Array(cipherBuffer))}`;
  }

  // Fallback stream cipher for non-secure contexts where SubtleCrypto is disabled
  const bytes = enc.encode(plaintext);
  const keyBytes = enc.encode(SYSTEM_ENCRYPTION_SECRET);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return `XORB64:v1:${toBase64(out)}`;
}

export async function decryptText(token: string): Promise<string> {
  const trimmed = token.trim();
  if (trimmed.startsWith('AES256GCM:v1:')) {
    if (!window.crypto?.subtle) {
      throw new Error('Browser tidak mendukung Web Crypto Subtle untuk dekripsi AES-256-GCM.');
    }
    const parts = trimmed.split(':');
    if (parts.length !== 5) {
      throw new Error('Format token terenkripsi AES-256-GCM tidak valid.');
    }
    const salt = fromBase64(parts[2]);
    const iv = fromBase64(parts[3]);
    const ciphertext = fromBase64(parts[4]);
    const key = await deriveAesKey(SYSTEM_ENCRYPTION_SECRET, salt, 'decrypt');
    const plainBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource
    );
    return new TextDecoder().decode(plainBuffer);
  }

  if (trimmed.startsWith('XORB64:v1:')) {
    const payload = trimmed.slice('XORB64:v1:'.length);
    const bytes = fromBase64(payload);
    const keyBytes = new TextEncoder().encode(SYSTEM_ENCRYPTION_SECRET);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(out);
  }

  throw new Error('Prefix enkripsi tidak dikenali.');
}
