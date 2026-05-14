import type { AccountRequirementsSnapshot } from '@/lib/account-requirements';
import { getAccountRequirements } from '@/lib/account-requirements';

type ProfileMeRow = {
  Business: { kvkNumber: string | null } | null;
  SellerProfile: { kvk: string | null } | null;
  DeliveryProfile: { id: string } | null;
  affiliate: {
    id: string;
    status: string;
    parentAffiliateId: string | null;
  } | null;
  passwordHash: string | null;
  Account: { provider: string }[] | null;
  emailVerified: Date | null;
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  profileImage: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingCompleted: boolean;
  role: string;
  sellerRoles: string[];
  buyerRoles: string[];
  privacyPolicyAccepted: boolean;
  termsAccepted: boolean;
  hideHomeHero: boolean;
  hideHowItWorks: boolean;
};

export function buildProfileMePayload(user: ProfileMeRow): {
  user: Record<string, unknown> & {
    accountRequirements: AccountRequirementsSnapshot;
    emailVerified: boolean;
  };
} {
  const {
    Business,
    SellerProfile,
    DeliveryProfile,
    affiliate,
    passwordHash,
    Account,
    emailVerified,
    ...rest
  } = user;
  const kvkNumber = Business?.kvkNumber ?? SellerProfile?.kvk ?? null;

  const accountRequirements = getAccountRequirements({
    emailVerified,
    username: rest.username,
    termsAccepted: rest.termsAccepted,
    stripeConnectAccountId: rest.stripeConnectAccountId,
    stripeConnectOnboardingCompleted: rest.stripeConnectOnboardingCompleted,
    passwordHash,
    Account,
  });

  const processedUser = {
    ...rest,
    emailVerified: emailVerified != null,
    accountRequirements,
    kvkNumber,
    address: rest.address,
    city: rest.city,
    postalCode: rest.postalCode,
    country: rest.country,
    lat: rest.lat,
    lng: rest.lng,
    businessKvkNumber: Business?.kvkNumber ?? null,
    sellerKvk: SellerProfile?.kvk ?? null,
    DeliveryProfile: DeliveryProfile || null,
    affiliate: affiliate || null,
    profileImage: rest.profileImage?.startsWith('data:')
      ? rest.profileImage
      : rest.profileImage || rest.image,
    image: rest.profileImage?.startsWith('data:')
      ? rest.profileImage
      : rest.image || rest.profileImage,
  };

  return { user: processedUser };
}
