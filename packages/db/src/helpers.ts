import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

export interface PortalTokenResult {
  raw: string;
  hash: string;
}

export function generatePortalToken(): PortalTokenResult {
  const raw = randomBytes(32).toString("hex");
  const hash = hashPortalToken(raw);
  return { raw, hash };
}

export function hashPortalToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function constantTimeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function generateUlid(): string {
  const timestamp = Date.now().toString(36).padStart(10, "0");
  const random = randomBytes(10).toString("hex").slice(0, 16);
  return `${timestamp}${random}`;
}
