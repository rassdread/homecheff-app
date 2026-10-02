'use client';

import AffiliatePersonalShareSheet from '@/components/affiliate/AffiliatePersonalShareSheet';

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Sidebar and quick-link entry. Same sheet as the dashboard share action. */
export default function AffiliateQuickShareModal({ open, onClose }: Props) {
  return <AffiliatePersonalShareSheet open={open} onClose={onClose} />;
}
