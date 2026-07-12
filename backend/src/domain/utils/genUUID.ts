/**
 * @file genUUID.ts
 * @module domain/utils
 */

/**
 * Generates a prefixed UUID string.
 * @param prefix - The prefix for the ID (e.g., 'user', 'casting').
 * @returns A string in the format '<prefix>-<uuid>'.
 */
export default function genUUID(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
