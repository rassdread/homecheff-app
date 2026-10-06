'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import StartChatButton from '@/components/chat/StartChatButton';
import {
  MessageCircle,
  Phone,
  Instagram,
  Facebook,
  Globe,
  Send,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { PublicContactChannel } from '@/lib/profile/maker-contact-preferences';
import type {
  ExchangeFunnelListingInput,
  ExchangeFunnelSurface,
} from '@/lib/marketplace/exchange/exchange-funnel-analytics';

type ContactVariant = 'profile' | 'product' | 'inspiration';

type Props = {
  makerId: string;
  makerName: string;
  channels: PublicContactChannel[];
  className?: string;
  variant?: ContactVariant;
  productId?: string;
  /** Custom label for the chat / proposal button. */
  chatButtonLabel?: string;
  /** Navigate to chat with proposal sheet open (product flows). */
  openProposalAfterStart?: boolean;
  funnelListing?: ExchangeFunnelListingInput;
  funnelSurface?: ExchangeFunnelSurface;
  funnelEntrypoint?: string;
};

const HEADING_KEYS: Record<ContactVariant, string> = {
  profile: 'makerContact.public.heading',
  product: 'makerContact.strip.product.heading',
  inspiration: 'makerContact.strip.inspiration.heading',
};

const INTRO_KEYS: Record<ContactVariant, string> = {
  profile: 'publicProfile.contactIntro',
  product: 'makerContact.strip.product.intro',
  inspiration: 'makerContact.strip.inspiration.intro',
};

const CHANNEL_ICONS: Record<
  PublicContactChannel['id'],
  React.ComponentType<{ className?: string }>
> = {
  chat: MessageCircle,
  phone: Phone,
  whatsapp: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Globe,
  website: Globe,
  telegram: Send,
};

const PROFILE_LABEL_KEYS: Record<PublicContactChannel['id'], string> = {
  chat: 'makerContact.public.chat',
  phone: 'makerContact.public.phone',
  whatsapp: 'makerContact.public.whatsapp',
  instagram: 'makerContact.public.instagram',
  facebook: 'makerContact.public.facebook',
  tiktok: 'makerContact.public.tiktok',
  website: 'makerContact.public.website',
  telegram: 'makerContact.public.telegram',
};

const COMPACT_LABEL_KEYS: Record<PublicContactChannel['id'], string> = {
  chat: 'makerContact.compact.chat',
  phone: 'makerContact.compact.phone',
  whatsapp: 'makerContact.compact.whatsapp',
  instagram: 'makerContact.compact.instagram',
  facebook: 'makerContact.compact.facebook',
  tiktok: 'makerContact.compact.tiktok',
  website: 'makerContact.compact.website',
  telegram: 'makerContact.compact.telegram',
};

export default function MakerContactSection({
  makerId,
  makerName,
  channels,
  className = '',
  variant = 'profile',
  productId,
  chatButtonLabel,
  openProposalAfterStart = false,
  funnelListing,
  funnelSurface,
  funnelEntrypoint,
}: Props) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [fallback, setFallback] = useState<'whatsapp' | 'phone' | null>(null);

  const externalChannels = channels.filter((c) => c.id !== 'chat');
  const hasChat = channels.some((c) => c.id === 'chat');
  const isCompact = variant !== 'profile';
  const labelKeys = isCompact ? COMPACT_LABEL_KEYS : PROFILE_LABEL_KEYS;
  const buttonSizeClass = isCompact ? 'px-4 py-2.5 text-sm' : 'px-6 py-3';
  const loggedIn = Boolean(session?.user);

  useEffect(() => {
    if (!loggedIn || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const intent = params.get('contact');
    if (intent !== 'whatsapp' && intent !== 'phone') return;
    const channel = channels.find((entry) => entry.id === intent);
    params.delete('contact');
    const next = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`,
    );
    if (!channel?.href) {
      setFallback(intent);
      return;
    }
    if (intent === 'whatsapp') {
      window.open(channel.href, '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.href = channel.href;
  }, [loggedIn, channels]);

  const loginFor = (channelId: 'phone' | 'whatsapp') => {
    const returnTo = new URL(window.location.href);
    returnTo.searchParams.set('contact', channelId);
    window.location.href = `/login?callbackUrl=${encodeURIComponent(`${returnTo.pathname}${returnTo.search}`)}`;
  };

  const openPrivateChannel = (channel: PublicContactChannel) => {
    if (channel.id !== 'phone' && channel.id !== 'whatsapp') return;
    if (!loggedIn) {
      loginFor(channel.id);
      return;
    }
    if (!channel.href) {
      setFallback(channel.id);
      return;
    }
    const desktop = window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 1024;
    if (channel.id === 'phone' && desktop) {
      setFallback('phone');
      return;
    }
    if (channel.id === 'whatsapp') {
      const opened = window.open(channel.href, '_blank', 'noopener,noreferrer');
      if (!opened) setFallback('whatsapp');
      return;
    }
    window.location.href = channel.href;
  };

  return (
    <section
      className={`rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 p-4 sm:p-5 ${className}`}
      aria-labelledby="maker-contact-heading"
    >
      <h2
        id="maker-contact-heading"
        className="text-base sm:text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2"
      >
        <MessageCircle className="w-5 h-5 text-emerald-600" aria-hidden />
        {t(HEADING_KEYS[variant])}
      </h2>
      <p className="text-sm text-gray-600 mb-4">{t(INTRO_KEYS[variant])}</p>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
        {hasChat ? (
          <StartChatButton
            productId={productId}
            sellerId={makerId}
            sellerName={makerName}
            showSuccessMessage={!openProposalAfterStart}
            openProposalAfterStart={openProposalAfterStart}
            skipModal={openProposalAfterStart}
            funnelListing={funnelListing}
            funnelSurface={funnelSurface}
            funnelEntrypoint={funnelEntrypoint}
            label={chatButtonLabel}
            className={`w-full sm:w-auto ${buttonSizeClass} bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2`}
          />
        ) : null}

        {externalChannels.map((channel) => {
          const Icon = CHANNEL_ICONS[channel.id];
          const label = t(labelKeys[channel.id]);
          const gated = channel.id === 'phone' || channel.id === 'whatsapp';
          const className = `inline-flex w-full sm:w-auto items-center justify-center gap-2 ${buttonSizeClass} rounded-xl font-semibold border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50 shadow-sm transition-all`;
          if (gated) {
            return (
              <button
                key={channel.id}
                type="button"
                className={className}
                onClick={() => openPrivateChannel(channel)}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden />
                <span>{label}</span>
              </button>
            );
          }
          return (
            <a
              key={channel.id}
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              <span>{label}</span>
            </a>
          );
        })}
      </div>
      {fallback ? (
        <div
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
          role="status"
        >
          <p>
            {fallback === 'whatsapp'
              ? t('makerContact.whatsappFailed')
              : t('makerContact.callDesktop')}
          </p>
          {!loggedIn ? <p className="mt-1">{t('makerContact.authRequired')}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {fallback === 'whatsapp' && loggedIn ? (
              <button
                type="button"
                className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold"
                onClick={() => {
                  const channel = channels.find((entry) => entry.id === 'whatsapp');
                  if (channel?.href) window.open(channel.href, '_blank', 'noopener,noreferrer');
                }}
              >
                {t('makerContact.retry')}
              </button>
            ) : null}
            {fallback === 'phone' && loggedIn ? (
              <button
                type="button"
                className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold"
                onClick={() => {
                  const channel = channels.find((entry) => entry.id === 'phone');
                  if (channel?.href) window.location.href = channel.href;
                }}
              >
                {t('makerContact.retry')}
              </button>
            ) : null}
            {hasChat ? (
              <StartChatButton
                productId={productId}
                sellerId={makerId}
                sellerName={makerName}
                label={t('makerContact.chatFallback')}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
