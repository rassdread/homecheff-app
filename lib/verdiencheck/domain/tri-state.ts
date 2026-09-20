export const TRI_STATES = ['YES', 'NO', 'UNKNOWN'] as const;

export type TriState = (typeof TRI_STATES)[number];
