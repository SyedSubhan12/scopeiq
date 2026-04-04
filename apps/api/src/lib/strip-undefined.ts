/**
 * Removes keys with `undefined` values from an object.
 * Required because `exactOptionalPropertyTypes` treats `{ foo?: string }` as
 * "string or missing" (not "string | undefined"), but Zod outputs `| undefined`.
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}
