'use client';

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

type ContactVariant = 'profile' | 'product' | 'inspiration';

type Props = {
  makerId: string;
  makerName: string;
  channels: PublicContactChannel[];
  className?: string;
  variant?: ContactVariant;
  productId?: string;
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
}: Props) {
  const { t } = useTranslation();

  const externalChannels = channels.filter((c) => c.id !== 'chat');
  const hasChat = channels.some((c) => c.id === 'chat');
  const isCompact = variant !== 'profile';
  const labelKeys = isCompact ? COMPACT_LABEL_KEYS : PROFILE_LABEL_KEYS;
  const buttonSizeClass = isCompact ? 'px-4 py-2.5 text-sm' : 'px-6 py-3';

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
            showSuccessMessage
            className={`w-full sm:w-auto ${buttonSizeClass} bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2`}
          />
        ) : null}

        {externalChannels.map((channel) => {
          const Icon = CHANNEL_ICONS[channel.id];
          const label = t(labelKeys[channel.id]);
          return (
            <a
              key={channel.id}
              href={channel.href}
              target={channel.id === 'phone' ? undefined : '_blank'}
              rel={channel.id === 'phone' ? undefined : 'noopener noreferrer'}
              className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 ${buttonSizeClass} rounded-xl font-semibold border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50 shadow-sm transition-all`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              <span>{label}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
