/**
 * Convert RSC/Prisma payloads into JSON-plain objects for Client Components.
 * Dates → ISO strings, BigInt → string, non-finite numbers → null.
 */
export function toClientPlain<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, current) => {
      if (typeof current === 'bigint') return current.toString();
      if (current instanceof Date) return current.toISOString();
      if (typeof current === 'number' && !Number.isFinite(current)) return null;
      return current;
    }),
  ) as T;
}
