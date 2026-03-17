import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-cbc";

function getEncryptionKey(): Buffer {
  const key = process.env.SPOTIFY_TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("SPOTIFY_TOKEN_ENCRYPTION_KEY is not set");
  }
  return Buffer.from(key, "hex");
}

export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();
  const [ivHex, encrypted] = encryptedToken.split(":");
  
  if (!ivHex || !encrypted) {
    throw new Error("Invalid encrypted token format");
  }
  
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
