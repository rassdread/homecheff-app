/**
 * What the affiliate network can do today.
 * Invite code is live for an active affiliate who has no parent.
 * A SUB cannot invite another layer.
 */
export const MAIN_SUB_HIERARCHY = 'LIVE' as const;
export const SELF_SERVICE_SUB_CREATION = 'LIVE' as const;
export const SUB_INVITE_FLOW = 'LIVE' as const;
export const NETWORK_DASHBOARD = 'LIVE' as const;

export const NETWORK_CAPABILITY = {
  hierarchy: MAIN_SUB_HIERARCHY,
  selfServiceSubCreation: SELF_SERVICE_SUB_CREATION,
  subInviteFlow: SUB_INVITE_FLOW,
  networkDashboard: NETWORK_DASHBOARD,
  publicNoteNl:
    'Een actieve affiliate zonder parent kan vanuit het dashboard één sub-affiliate uitnodigen. Die sub bouwt een eigen klantenportefeuille. Jij ontvangt het main-aandeel op kwalificerende omzet van die sub. Een sub kan zelf geen laag daaronder uitnodigen.',
  publicNoteEn:
    'An active affiliate without a parent can invite one sub-affiliate from the dashboard. That sub builds their own customer portfolio. You receive the main share on that sub’s qualifying revenue. A sub cannot invite another layer underneath.',
} as const;
