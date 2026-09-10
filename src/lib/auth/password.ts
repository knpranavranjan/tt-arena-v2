/**
 * Password hashing for DB-backed accounts — Node `crypto.scrypt`, no deps.
 *
 * This keeps the demo login UX (SPINID / password) but stops storing plaintext.
 * Format is `salt:hash`, both hex. `verifyPassword` is constant-time.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, KEYLEN);
  return { hash: derived.toString("hex"), salt };
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): Promise<boolean> {
  if (!hash || !salt) return false;
  const derived = await scrypt(password, salt, KEYLEN);
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
