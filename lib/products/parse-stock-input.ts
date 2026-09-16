/** Parse listing stock from form strings without treating "0" as empty. */
export function parseStockInput(
  value: string | number | null | undefined,
): number | undefined {
  if (value === '' || value == null) return undefined;
  const n = typeof value === 'number' ? value : Number.parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

export function parseStockInputOrZero(
  value: string | number | null | undefined,
): number {
  return parseStockInput(value) ?? 0;
}

export {
  parseStockPatchInput,
  type StockPatchResult,
} from './listing-inventory';
