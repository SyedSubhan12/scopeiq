import { randomBytes } from "crypto";

export function generatePortalToken(): string {
  return randomBytes(32).toString("hex");
}

export function generateUlid(): string {
  const timestamp = Date.now().toString(36).padStart(10, "0");
  const random = randomBytes(10).toString("hex").slice(0, 16);
  return `${timestamp}${random}`;
}
