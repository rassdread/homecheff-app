/** A branch can override a shared secret with this exact word. It is not a credential. */
export function configuredCredential(value: string | null | undefined): string {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'disabled') return '';
  return trimmed;
}
