'use client';

import { useUserValidation } from '@/hooks/useUserValidation';

export default function UserValidation() {
  useUserValidation();
  return null; // This component doesn't render anything
}
