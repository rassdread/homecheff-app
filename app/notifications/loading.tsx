import RouteLoadingBoundaryMarker from '@/components/navigation/RouteLoadingBoundaryMarker';
import { NotificationsLoadingSkeleton } from '@/components/navigation/RouteLoadingSkeletons';

export default function NotificationsLoading() {
  return (
    <>
      <RouteLoadingBoundaryMarker />
      <NotificationsLoadingSkeleton />
    </>
  );
}
