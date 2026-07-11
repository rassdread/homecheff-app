import { ProductDetailLoadingSkeleton } from '@/components/navigation/RouteLoadingSkeletons';
import RouteLoadingBoundaryMarker from '@/components/navigation/RouteLoadingBoundaryMarker';

export default function ProductDetailLoading() {
  return (
    <>
      <RouteLoadingBoundaryMarker />
      <ProductDetailLoadingSkeleton />
    </>
  );
}
