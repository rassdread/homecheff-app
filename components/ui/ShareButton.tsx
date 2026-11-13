'use client';

import { useCallback, useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { useMarketplaceShareContext } from '@/hooks/useMarketplaceShareContext';
import { useTranslation } from '@/hooks/useTranslation';
import AffiliatePromoteChooser from '@/components/share/AffiliatePromoteChooser';
import HomecheffVisibleShareSheet from '@/components/share/HomecheffVisibleShareSheet';
import { useOverlayHistoryBack } from '@/hooks/useOverlayHistoryBack';
import { createPortal } from 'react-dom';
import { invokeNativeShareOnce } from '@/lib/share/exactly-once-share';
import { toAbsolutePublicUrl } from '@/lib/share/listing-share';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  surface?: 'detail' | 'feed' | 'search' | 'profile' | 'category' | 'tile';
  imageUrl?: string | null;
}

export default function ShareButton({
  url,
  title,
  description: _description,
  className,
  surface = 'detail',
  imageUrl = null,
}: ShareButtonProps) {
  const { t, isReady } = useTranslation();
  const [chooserOpen, setChooserOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inFlightRef = useRef(false);

  const {
    memberships,
    setSharePreference,
    resolveShareUrl,
  } = useMarketplaceShareContext();

  useOverlayHistoryBack('detail-share-chooser', chooserOpen, () => setChooserOpen(false));

  const openResolvedSheet = useCallback(
    async (force?: { mode: 'personal' | 'company'; organizationId?: string }) => {
      setBusy(true);
      try {
        const resolved = await resolveShareUrl({
          listingAbsoluteUrl: url,
          surface,
          forceMode: force?.mode,
          forceOrganizationId: force?.organizationId,
        });
        setSheetUrl(resolved.url);
        setSheetOpen(true);
      } finally {
        setBusy(false);
      }
    },
    [resolveShareUrl, surface, url],
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (busy || inFlightRef.current) return;
          const absolute = toAbsolutePublicUrl(url);
          inFlightRef.current = true;
          setBusy(true);
          void invokeNativeShareOnce({ title, text: title, url: absolute })
            .then((native) => {
              if (native.ok || native.method === 'cancelled' || native.method === 'busy') return;
              setSheetUrl(absolute);
              setSheetOpen(true);
            })
            .finally(() => {
              inFlightRef.current = false;
              setBusy(false);
            });
        }}
        aria-label={isReady ? t('share.via') : 'Delen'}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200
          transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg
          bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700/30
          disabled:opacity-60
          ${className ?? ''}
        `}
      >
        <Share2 className="w-5 h-5 shrink-0" aria-hidden />
        <span>{isReady ? t('share.button') : 'Delen'}</span>
      </button>
      {memberships.length > 0 ? (
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-emerald-800 underline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setChooserOpen(true);
          }}
        >
          Promoot
        </button>
      ) : null}

      {chooserOpen && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-black/45"
                aria-label={isReady ? t('common.close') : 'Sluiten'}
                onClick={() => setChooserOpen(false)}
              />
              <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
                <AffiliatePromoteChooser
                  memberships={memberships}
                  busy={busy}
                  onChoosePersonal={() => {
                    setSharePreference('personal');
                    setChooserOpen(false);
                    void openResolvedSheet({ mode: 'personal' });
                  }}
                  onChooseCompany={(organizationId) => {
                    setSharePreference('company', organizationId);
                    setChooserOpen(false);
                    void openResolvedSheet({ mode: 'company', organizationId });
                  }}
                />
              </div>
            </div>,
            document.body,
          )
        : null}

      <HomecheffVisibleShareSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          window.setTimeout(() => triggerRef.current?.focus(), 0);
        }}
        url={sheetUrl}
        shareTitle={title}
        itemImageUrl={imageUrl}
      />
    </div>
  );
}
