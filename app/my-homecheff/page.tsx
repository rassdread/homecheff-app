import { redirect } from 'next/navigation';
import { MY_HOMECHEFF_HUB_PATH } from '@/lib/navigation/my-homecheff-hub';

export default function MyHomeCheffAliasPage() {
  redirect(MY_HOMECHEFF_HUB_PATH);
}
