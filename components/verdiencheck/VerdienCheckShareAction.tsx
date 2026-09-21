'use client';

import EcosystemShareAction from '@/components/share/EcosystemShareAction';
import {
  trackVerdienCheckFunnelEvent,
  VERDIENCHECK_FUNNEL_EVENTS,
} from '@/lib/analytics/verdiencheck-funnel';
import { OPPORTUNITY_DESTINATIONS } from '@/lib/share/ecosystem-opportunities';
import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';

function mapShareAnalytics(event: string, extra?: Record<string, unknown>) {
  if (event === 'opportunity_share_intent') {
    trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.share, {
      action: 'SHARE',
      cta_id: 'share',
      funnel_stage: 'result',
    });
  }
  if (event === 'opportunity_share_link_copied') {
    trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.shareCopy);
  }
  if (event === 'opportunity_share_native_opened') {
    trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.shareNative);
  }
  if (event === 'opportunity_share_destination' && extra?.destination === 'whatsapp') {
    trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.shareWhatsapp);
  }
}

export default function VerdienCheckShareAction(props: {
  copy: VerdienCheckCopy;
  variant?: 'icon' | 'button' | 'text';
  className?: string;
  label?: string;
  surface?: string;
}) {
  const dest = OPPORTUNITY_DESTINATIONS.verdiencheck;
  return (
    <div data-verdiencheck-share="">
      <EcosystemShareAction
        destinationHref={dest.href}
        title={props.copy.shareTitle}
        text={props.copy.shareMessage}
        surface={props.surface || 'verdiencheck'}
        product={dest.product}
        opportunityId={dest.id}
        variant={props.variant ?? 'text'}
        label={props.label || props.copy.shareAction}
        className={props.className}
        onAnalytics={mapShareAnalytics}
      />
    </div>
  );
}
