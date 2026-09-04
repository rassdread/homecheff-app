import { prisma } from '@/lib/prisma';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';
import { isListingPubliclyDiscoverable } from '@/lib/marketplace/product-visibility';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firstSegmentAfter(pathname: string, prefix: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== prefix) return null;
  return parts[1] ? decodeURIComponent(parts[1]) : null;
}

/**
 * Entity existence for LEGAL-0 HTTP 404 rewrites.
 * Middleware cannot rely on App Router `notFound()` because streaming
 * layouts often commit HTTP 200 before the page throws.
 */
export async function entityExistsForHttp404(pathname: string): Promise<boolean | null> {
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0];
  if (!first) return true;

  if (first === 'product' || first === 'listing') {
    const raw = firstSegmentAfter(pathname, first);
    if (!raw) return false;
    const id = resolveProductIdFromParam(raw);
    if (!id) return false;

    // Owner edit routes stay addressable; API/auth enforce access.
    const isEditRoute = parts[2] === 'edit';

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, isActive: true, integrityStatus: true },
    });
    if (product) {
      if (isEditRoute) return true;
      return isListingPubliclyDiscoverable(product);
    }
    if (first === 'listing') {
      const legacy = await prisma.listing.findUnique({
        where: { id },
        select: { id: true, status: true },
      });
      if (!legacy) return false;
      if (isEditRoute) return true;
      return legacy.status === 'ACTIVE';
    }
    return false;
  }

  if (first === 'recipe' || first === 'inspiratie') {
    const id = firstSegmentAfter(pathname, first);
    if (!id) return false;
    const dish = await prisma.dish.findUnique({
      where: { id },
      select: { id: true },
    });
    return Boolean(dish);
  }

  if (first === 'user') {
    const raw = firstSegmentAfter(pathname, first);
    if (!raw || raw === 'undefined' || raw === 'null') return false;
    if (UUID_RE.test(raw)) {
      const user = await prisma.user.findUnique({
        where: { id: raw },
        select: { id: true, showProfileToEveryone: true, accountDeletedAt: true },
      });
      return Boolean(user && !user.accountDeletedAt && user.showProfileToEveryone);
    }
    const user = await prisma.user.findFirst({
      where: { username: { equals: raw, mode: 'insensitive' } },
      select: { id: true, showProfileToEveryone: true, accountDeletedAt: true },
    });
    return Boolean(user && !user.accountDeletedAt && user.showProfileToEveryone);
  }

  if (first === 'profile' && parts.length >= 2) {
    const raw = firstSegmentAfter(pathname, 'profile');
    if (!raw || raw === 'undefined' || raw === 'null') return false;
    if (raw === 'deals' || raw === 'privacy') return true;
    if (UUID_RE.test(raw)) {
      const user = await prisma.user.findUnique({
        where: { id: raw },
        select: { id: true, showProfileToEveryone: true, accountDeletedAt: true },
      });
      return Boolean(user && !user.accountDeletedAt && user.showProfileToEveryone);
    }
    const user = await prisma.user.findFirst({
      where: { username: { equals: raw, mode: 'insensitive' } },
      select: { id: true, showProfileToEveryone: true, accountDeletedAt: true },
    });
    return Boolean(user && !user.accountDeletedAt && user.showProfileToEveryone);
  }

  if (first === 'seller') {
    const id = firstSegmentAfter(pathname, 'seller');
    if (!id || id === 'undefined' || id === 'null') return false;
    const seller = await prisma.sellerProfile.findUnique({
      where: { id },
      select: { id: true },
    });
    if (seller) return true;
    if (UUID_RE.test(id)) {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });
      return Boolean(user);
    }
    return false;
  }

  return null;
}
