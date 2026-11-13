export type PublicUrlCopyResult = 'copied' | 'manual';

/**
 * Writes only the public link.
 * A refused clipboard stays manual so the caller can show that same link for selection.
 */
export async function copyPublicUrl(
  url: string,
  writeText: (value: string) => Promise<void>,
): Promise<PublicUrlCopyResult> {
  const link = url.trim();
  if (!link) return 'manual';
  try {
    await writeText(link);
    return 'copied';
  } catch {
    return 'manual';
  }
}
