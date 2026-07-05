'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package, ShoppingBag, MessageCircle, Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import type { ResolvedConversationHeader } from '@/lib/communication/resolveConversationHeader';

type Props = {
  header: ResolvedConversationHeader | null;
  className?: string;
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function formatOrderTotal(cents: number): string {
  return formatPrice(cents);
}

export default function ConversationContextHeader({ header, className }: Props) {
  const { t, tOr, language } = useTranslation();

  if (!header) return null;

  if (header.kind === 'PRODUCT') {
    const { product } = header;
    return (
      <div
        className={cn(
          'shrink-0 border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/60 px-3 py-2 sm:px-4',
          className,
        )}
        role="region"
        aria-label={tOr('chat.context.aboutOffer', 'About this offer', 'Waar gaat dit gesprek over?')}
      >
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700/80">
          {tOr('chat.context.aboutOffer', 'About this offer', 'Waar gaat dit gesprek over?')}
        </p>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-emerald-100">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="44px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-emerald-600">
                <Package className="h-5 w-5" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{product.title}</p>
            <p className="text-xs text-gray-600">
              {formatPrice(product.priceCents)}
              {product.delivery ? (
                <span className="text-gray-400"> · {String(product.delivery).toLowerCase()}</span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
            <Link
              href={product.href}
              className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
            >
              {tOr('chat.context.viewOffer', 'View offer', 'Bekijk aanbod')}
            </Link>
            {product.canCheckout ? (
              <Link
                href={`${product.href}?checkout=1`}
                className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                {tOr('chat.context.checkout', 'Checkout', 'Afrekenen')}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (header.kind === 'ORDER') {
    const { order } = header;
    return (
      <div
        className={cn(
          'shrink-0 border-b border-blue-100/80 bg-gradient-to-r from-blue-50/90 to-indigo-50/50 px-3 py-2 sm:px-4',
          className,
        )}
        role="region"
        aria-label={tOr('chat.context.aboutOrder', 'About this order', 'Ordergesprek')}
      >
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700/80">
          {tOr('chat.context.aboutOrder', 'About this order', 'Waar gaat dit gesprek over?')}
        </p>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {order.orderNumber
                ? `#${order.orderNumber}`
                : tOr('chat.context.order', 'Order', 'Bestelling')}
            </p>
            <p className="text-xs text-gray-600">
              {formatOrderTotal(order.totalAmount)} · {order.status}
            </p>
          </div>
          <Link
            href={order.href}
            className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-800 ring-1 ring-blue-200 hover:bg-blue-50"
          >
            {tOr('chat.context.viewOrder', 'View order', 'Order bekijken')}
          </Link>
        </div>
      </div>
    );
  }

  if (header.kind === 'FUTURE') {
    const { future } = header;
    return (
      <div
        className={cn(
          'shrink-0 border-b border-gray-100 bg-gray-50/90 px-3 py-2 sm:px-4',
          className,
        )}
        role="region"
        aria-label={future.title}
      >
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-800">{future.title}</p>
            <p className="text-xs text-gray-500">{future.subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  const { general } = header;
  return (
    <div
      className={cn(
        'shrink-0 border-b border-gray-100 bg-gray-50/80 px-3 py-2 sm:px-4',
        className,
      )}
      role="region"
      aria-label={tOr('chat.context.general', 'Conversation', 'Gesprek')}
    >
      <div className="flex min-w-0 items-center gap-2">
        <MessageCircle className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <p className="min-w-0 truncate text-xs text-gray-600">
          {language === 'en'
            ? `Chat with ${general.peerName}`
            : `Gesprek met ${general.peerName}`}
        </p>
        {general.peerHref ? (
          <Link
            href={general.peerHref}
            className="ml-auto shrink-0 text-xs font-medium text-emerald-700 hover:underline"
          >
            {tOr('chat.context.viewProfile', 'Profile', 'Profiel')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
