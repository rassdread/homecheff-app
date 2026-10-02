/**
 * Listing defaults initialize a proposal form once.
 * A later header refresh must not overwrite the buyer's settlement choice.
 */
export function proposalFormInitKey(
  scopeId: string,
  productId: string | null | undefined,
): string {
  return `${scopeId}|${productId?.trim() || ''}`;
}

export function shouldApplyProposalFormInit(
  previousKey: string | null,
  nextKey: string,
): boolean {
  if (!nextKey || previousKey === nextKey) return false;
  if (!previousKey) return true;
  const prevSep = previousKey.indexOf('|');
  const nextSep = nextKey.indexOf('|');
  if (prevSep < 0 || nextSep < 0) return false;
  const prevScope = previousKey.slice(0, prevSep);
  const nextScope = nextKey.slice(0, nextSep);
  const prevProduct = previousKey.slice(prevSep + 1);
  const nextProduct = nextKey.slice(nextSep + 1);
  return prevScope === nextScope && prevProduct === '' && nextProduct !== '';
}
