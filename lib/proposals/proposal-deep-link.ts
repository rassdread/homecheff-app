/** Query param to auto-open CreateProposalSheet after navigating to a conversation. */
export const PROPOSAL_OPEN_QUERY_PARAM = 'openProposal';

export function buildMessagesConversationUrl(conversationId: string): string {
  return `/messages?conversation=${encodeURIComponent(conversationId)}`;
}

export function buildMessagesWithProposalOpenUrl(conversationId: string): string {
  return `${buildMessagesConversationUrl(conversationId)}&${PROPOSAL_OPEN_QUERY_PARAM}=1`;
}

export function isOpenProposalQueryValue(value: string | null): boolean {
  return value === '1' || value === 'true';
}

export function parseOpenProposalFromSearchParams(
  searchParams: Pick<URLSearchParams, 'get'> | null,
): boolean {
  if (!searchParams) return false;
  return isOpenProposalQueryValue(searchParams.get(PROPOSAL_OPEN_QUERY_PARAM));
}

export function stripOpenProposalFromSearchParams(
  searchParams: URLSearchParams,
): string {
  const next = new URLSearchParams(searchParams);
  next.delete(PROPOSAL_OPEN_QUERY_PARAM);
  const qs = next.toString();
  return qs ? `?${qs}` : '';
}
