'use client';

import HomepageInfoChrome from '@/components/home/HomepageInfoChrome';

type MobileProps = {
  variant: 'mobile';
  mobileNavRowClass: string;
  onNavigate?: () => void;
};

type DropdownProps = {
  variant: 'dropdown';
  onNavigate?: () => void;
};

export type NavbarLegalContactLinksProps = MobileProps | DropdownProps;

/**
 * Mobile menu + profile dropdown legal/info surface.
 * Homepage desktop uses HomepageInfoChrome in the start rail; this keeps
 * Privacy / Terms / Contact / Over HomeCheff / Help reachable on mobile
 * without a document footer above the bottom navigation.
 */
export function NavbarLegalContactLinks(props: NavbarLegalContactLinksProps) {
  return (
    <div data-hc-legal-surface={props.variant}>
      <HomepageInfoChrome variant="nav" onNavigate={props.onNavigate} />
    </div>
  );
}
