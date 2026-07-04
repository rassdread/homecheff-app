'use client';

import UserActionCenter from '@/components/home/UserActionCenter';
import type { UserActionCenterVariant } from '@/lib/user/user-action-center';

type Props = {
  variant?: UserActionCenterVariant;
  className?: string;
};

/** Seller dashboard subset — blijft seller API gebruiken. */
export default function SellerActionCenter({ variant = 'dashboard', className }: Props) {
  return (
    <UserActionCenter
      variant={variant}
      className={className}
      apiEndpoint="/api/seller/action-center"
      viewAllHref="/verkoper/dashboard"
    />
  );
}

export type { UserActionCenterVariant as SellerActionCenterVariant };
