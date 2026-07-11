import RouteLoadingBoundaryMarker from '@/components/navigation/RouteLoadingBoundaryMarker';
import { ProfileShellLoadingSkeleton } from '@/components/navigation/RouteLoadingSkeletons';

export default function PublicProfileLoading() {
  return (
    <>
      <RouteLoadingBoundaryMarker />
      <ProfileShellLoadingSkeleton />
    </>
  );
}
