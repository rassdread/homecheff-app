import { redirect } from 'next/navigation';

/** Dorpsplein-feed op de homepage (GeoFeed, chip sale). */
export default function DorpspleinRedirectPage() {
  redirect('/?chip=sale');
}
