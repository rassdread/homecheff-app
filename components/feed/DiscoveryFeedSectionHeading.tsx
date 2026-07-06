"use client";

import type { DiscoverySectionId } from "@/lib/discovery/sections";

type DiscoveryFeedSectionHeadingProps = {
  titleKey: string;
  sectionId: DiscoverySectionId;
  t: (key: string) => string;
};

/**
 * Minimal section band — no carousel redesign; spans full grid width.
 */
export default function DiscoveryFeedSectionHeading({
  titleKey,
  sectionId,
  t,
}: DiscoveryFeedSectionHeadingProps) {
  const label = t(titleKey);
  return (
    <div
      className="col-span-full mb-2 mt-4 first:mt-0"
      data-discovery-section={sectionId}
    >
      <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
        {label}
      </h2>
    </div>
  );
}
