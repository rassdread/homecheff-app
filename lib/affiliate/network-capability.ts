/**
 * What the affiliate network can do today.
 * Early affiliates can invite direct SUBs. One hierarchy layer only.
 * A SUB cannot invite another layer.
 */
export const MAIN_SUB_HIERARCHY = 'LIVE' as const;
export const SELF_SERVICE_SUB_CREATION = 'LIVE' as const;
export const SUB_INVITE_FLOW = 'LIVE' as const;
export const NETWORK_DASHBOARD = 'LIVE' as const;

const PUBLIC_PARAGRAPHS_NL = [
  'Tijdens onze eerste groeifase bouwen we aan de dekking van HomeCheff. Affiliates binnen Vroege instap kunnen daarom ook een eigen netwerk van directe partners opbouwen.',
  'Je kunt directe SUB-affiliates uitnodigen. Zij bouwen ieder hun eigen klantenportefeuille op. Over kwalificerende omzet van jouw SUB ontvang jij het MAIN-aandeel. Een SUB kan zelf geen volgende laag partners uitnodigen.',
  'Deze brede mogelijkheid hoort bij de eerste groeifase van HomeCheff. Zodra er voldoende dekking is, hoeft het partnernetwerk niet meer standaard open te staan voor nieuwe affiliates. HomeCheff kan dan geselecteerde partners MAIN-rechten geven. Bestaande rechten binnen Vroege instap blijven gelden.',
] as const;

const PUBLIC_PARAGRAPHS_EN = [
  'During our first growth phase we are building HomeCheff’s coverage. Affiliates in Early access can therefore also build their own network of direct partners.',
  'You can invite direct SUB affiliates. Each of them builds their own customer portfolio. On qualifying revenue from your SUB, you receive the MAIN share. A SUB cannot invite another layer of partners.',
  'This broader option belongs to HomeCheff’s first growth phase. Once there is enough coverage, the partner network does not have to stay open by default for new affiliates. HomeCheff can then give selected partners MAIN rights. Existing rights within Early access continue to apply.',
] as const;

export const NETWORK_CAPABILITY = {
  hierarchy: MAIN_SUB_HIERARCHY,
  selfServiceSubCreation: SELF_SERVICE_SUB_CREATION,
  subInviteFlow: SUB_INVITE_FLOW,
  networkDashboard: NETWORK_DASHBOARD,
  publicParagraphsNl: PUBLIC_PARAGRAPHS_NL,
  publicParagraphsEn: PUBLIC_PARAGRAPHS_EN,
  publicNoteNl: PUBLIC_PARAGRAPHS_NL.join(' '),
  publicNoteEn: PUBLIC_PARAGRAPHS_EN.join(' '),
} as const;
