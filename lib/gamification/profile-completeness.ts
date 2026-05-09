import { usernameContainsTempPlaceholder } from '@/lib/username-placeholder';

export type ProfileFieldsForHcp = {
  name: string | null;
  username: string | null;
  city: string | null;
  place: string | null;
  profileImage: string | null;
  image: string | null;
};

export function isProfileCompleteForHcp(u: ProfileFieldsForHcp): boolean {
  if (!u.name?.trim() || !u.username?.trim()) return false;
  if (usernameContainsTempPlaceholder(u.username)) return false;
  if (!(u.city?.trim() || u.place?.trim())) return false;
  if (!(u.profileImage?.trim() || u.image?.trim())) return false;
  return true;
}
