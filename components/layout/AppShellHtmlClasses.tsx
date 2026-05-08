'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isNativeApp } from '@/lib/native/capacitor';
import { isCompactMobileFooterPath } from '@/lib/layout/compactFooterRoutes';

const NATIVE_CLASS = 'hc-native-capacitor';
const PWA_STANDALONE_CLASS = 'hc-pwa-standalone';
const SUPPRESS_SITE_FOOTER_CLASS = 'hc-suppress-site-footer';

/**
 * Zet `document.documentElement`-classes voor:
 * - Capacitor native (`hc-native-capacitor`, bestaand gedrag)
 * - PWA / “Toevoegen aan beginscherm” (`hc-pwa-standalone`)
 * - Smalle viewport + app-achtige routes (`hc-suppress-site-footer`) → globals.css verbergt SEO-footer
 */
export default function AppShellHtmlClasses() {
  const pathname = usePathname() ?? '';

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const native = isNativeApp();
      let standalone = false;
      try {
        standalone =
          window.matchMedia('(display-mode: standalone)').matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone ===
            true;
      } catch {
        standalone = false;
      }

      let wideLg = true;
      try {
        wideLg = window.matchMedia('(min-width: 1024px)').matches;
      } catch {
        wideLg = true;
      }

      const compactShell = isCompactMobileFooterPath(pathname);
      const suppressFooter =
        !native && !standalone && !wideLg && compactShell;

      root.classList.toggle(NATIVE_CLASS, native);
      root.classList.toggle(PWA_STANDALONE_CLASS, standalone);
      root.classList.toggle(SUPPRESS_SITE_FOOTER_CLASS, suppressFooter);
    };

    apply();

    const onMq = () => apply();
    let mqWide: MediaQueryList | null = null;
    let mqDm: MediaQueryList | null = null;
    try {
      mqWide = window.matchMedia('(min-width: 1024px)');
      mqWide.addEventListener('change', onMq);
    } catch {
      /* ignore */
    }
    try {
      mqDm = window.matchMedia('(display-mode: standalone)');
      mqDm.addEventListener('change', onMq);
    } catch {
      /* ignore */
    }

    return () => {
      mqWide?.removeEventListener('change', onMq);
      mqDm?.removeEventListener('change', onMq);
      root.classList.remove(NATIVE_CLASS, PWA_STANDALONE_CLASS, SUPPRESS_SITE_FOOTER_CLASS);
    };
  }, [pathname]);

  return null;
}
