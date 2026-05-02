// Chiffrement AES-256-GCM pour les tokens sensibles (Strava, etc.)
// Requiert env STRAVA_ENCRYPT_KEY (64 hex chars = 32 bytes).
// Si absent, retourne le texte en clair (rétrocompatibilité).

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALG = "aes-256-gcm";

function getKey() {
  const hex = process.env.STRAVA_ENCRYPT_KEY || "";
  if (hex.length !== 64) return null;
  try { return Buffer.from(hex, "hex"); } catch { return null; }
}

// Retourne "iv.encrypted.tag" ou le texte brut si pas de clé
export function encrypt(text) {
  const key = getKey();
  if (!key) return text;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), enc.toString("hex"), tag.toString("hex")].join(".");
}

// Déchiffre "iv.encrypted.tag" ou retourne la valeur brute (tokens anciens)
export function decrypt(data) {
  if (!data) return data;
  const parts = data.split(".");
  if (parts.length !== 3) return data; // ancien token non chiffré
  const key = getKey();
  if (!key) return data;
  try {
    const [ivHex, encHex, tagHex] = parts;
    const decipher = createDecipheriv(ALG, key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]).toString("utf8");
  } catch {
    return data; // déchiffrement échoué → retourne brut
  }
}
