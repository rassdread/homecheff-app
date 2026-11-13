/**
 * Local-only membership rows for the share screen.
 * Active only when HC_LOCAL_SHARE_MEMBERSHIP_FIXTURE=1 on the test server.
 * Roles do not add organizations. Inactive rows stay in the payload so the
 * existing client filter can reject them.
 */

export type LocalShareMembership = {
  role: string;
  status: string;
  organization: {
    id: string;
    companyName: string;
    displayName: string;
    status: string;
  };
};

const ONE_KITCHEN: LocalShareMembership = {
  role: "MEMBER",
  status: "ACTIVE",
  organization: {
    id: "local-org-one-kitchen",
    companyName: "Eén Keuken",
    displayName: "Eén Keuken",
    status: "ACTIVE",
  },
};

const SAME_NAME_A: LocalShareMembership = {
  role: "MEMBER",
  status: "ACTIVE",
  organization: {
    id: "local-org-same-a",
    companyName: "Dezelfde Organisatie",
    displayName: "Dezelfde Organisatie",
    status: "ACTIVE",
  },
};

const SAME_NAME_B: LocalShareMembership = {
  role: "MEMBER",
  status: "ACTIVE",
  organization: {
    id: "local-org-same-b",
    companyName: "Dezelfde Organisatie",
    displayName: "Dezelfde Organisatie",
    status: "ACTIVE",
  },
};

const INACTIVE: LocalShareMembership = {
  role: "MEMBER",
  status: "REMOVED",
  organization: {
    id: "local-org-inactive",
    companyName: "Gesloten Keuken",
    displayName: "Gesloten Keuken",
    status: "ACTIVE",
  },
};

const SUSPENDED_ORG: LocalShareMembership = {
  role: "MEMBER",
  status: "ACTIVE",
  organization: {
    id: "local-org-suspended",
    companyName: "Slapende Keuken",
    displayName: "Slapende Keuken",
    status: "SUSPENDED",
  },
};

const ADMIN_KITCHEN: LocalShareMembership = {
  role: "MEMBER",
  status: "ACTIVE",
  organization: {
    id: "local-org-admin",
    companyName: "Admin Keuken",
    displayName: "Admin Keuken",
    status: "ACTIVE",
  },
};

const SUPER_KITCHEN: LocalShareMembership = {
  role: "MEMBER",
  status: "ACTIVE",
  organization: {
    id: "local-org-super",
    companyName: "Super Keuken",
    displayName: "Super Keuken",
    status: "ACTIVE",
  },
};

const BY_USERNAME: Record<string, LocalShareMembership[]> = {
  hcflowklant: [ONE_KITCHEN],
  isoseller3199: [SAME_NAME_A, SAME_NAME_A, SAME_NAME_B, INACTIVE, SUSPENDED_ORG],
  hcflowadmin: [ADMIN_KITCHEN, INACTIVE],
  hcsharesuper: [SUPER_KITCHEN, INACTIVE, SUSPENDED_ORG],
  hcflowkoerier: [INACTIVE, SUSPENDED_ORG],
};

export function localShareMembershipFixtureEnabled(): boolean {
  return process.env.HC_LOCAL_SHARE_MEMBERSHIP_FIXTURE === "1";
}

export function localShareMembershipsForUsername(
  username: string | null | undefined,
): LocalShareMembership[] | null {
  if (!localShareMembershipFixtureEnabled()) return null;
  const key = username?.trim().toLowerCase();
  if (!key || !BY_USERNAME[key]) return null;
  return BY_USERNAME[key];
}

export function localListingShareUrl(input: {
  origin: string;
  organizationId: string;
  destinationPath: string;
  allowedOrganizationIds: readonly string[];
}): string | null {
  if (!localShareMembershipFixtureEnabled()) return null;
  if (!input.allowedOrganizationIds.includes(input.organizationId)) return null;
  const origin = input.origin.replace(/\/+$/, "");
  const path = input.destinationPath.startsWith("/")
    ? input.destinationPath
    : `/${input.destinationPath}`;
  return `${origin}/a/${encodeURIComponent(input.organizationId)}?item=${encodeURIComponent(path)}`;
}
