'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { buildWorkspaceStartChoices } from '@/lib/home/workspace-rail-model';

const FALLBACKS: Record<string, { en: string; nl: string }> = {
  'home.presentation.startQuestion': {
    en: 'What do you want to do with HomeCheff?',
    nl: 'Wat wil je doen met HomeCheff?',
  },
  'home.presentation.startSell': {
    en: 'Sell or share something',
    nl: 'Iets verkopen of delen',
  },
  'home.presentation.startService': {
    en: 'Offer a service',
    nl: 'Een dienst aanbieden',
  },
  'home.presentation.startAffiliate': {
    en: 'Earn as an affiliate',
    nl: 'Verdienen als affiliate',
  },
  'home.presentation.startDelivery': {
    en: 'Deliver',
    nl: 'Bezorgen',
  },
};

/**
 * Authenticated workspace with no work role yet.
 * Cards open existing flows. They do not assign a role.
 */
export default function WorkspaceStartState() {
  const { tOr } = useTranslation();
  const choices = buildWorkspaceStartChoices();
  const labelFor = (key: string) => {
    const fallback = FALLBACKS[key];
    return tOr(key, fallback?.en ?? key, fallback?.nl ?? key);
  };

  return (
    <section
      data-hc-workspace-start=""
      className="border-b border-gray-200 bg-white px-3 py-3 sm:px-4"
    >
      <h2 className="text-sm font-semibold text-gray-900">
        {labelFor('home.presentation.startQuestion')}
      </h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {choices.map((choice) => (
          <Link
            key={choice.id}
            href={choice.href}
            data-hc-workspace-start-choice={choice.id}
            className="hc-nav-item inline-flex min-h-[40px] max-w-full items-center rounded-lg border border-[var(--hc-border-quiet)] bg-[var(--hc-surface-subtle)] px-3 py-1.5 text-sm font-medium"
          >
            {labelFor(choice.labelKey)}
          </Link>
        ))}
      </div>
    </section>
  );
}
