import type { VerdienCheckCopy } from '@/lib/verdiencheck/i18n/copy';

export default function VerdienCheckDisclaimer(props: { copy: VerdienCheckCopy }) {
  return (
    <p className="text-xs leading-relaxed text-gray-500">{props.copy.disclaimer}</p>
  );
}
