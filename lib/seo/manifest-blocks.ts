import type { SeoLandingBlock } from '@/components/seo/SeoLandingTemplate';
import { MANIFEST_NAMESPACE, MANIFEST_PATH } from '@/lib/seo/homecheff-manifest';

export { MANIFEST_PATH, MANIFEST_NAMESPACE };

export const MANIFEST_BLOCKS: SeoLandingBlock[] = [
  { type: 'section', titleKey: 'sectionWhyTitle', bodyKey: 'sectionWhyBody' },
  { type: 'section', titleKey: 'sectionOriginTitle', bodyKey: 'sectionOriginBody' },
  { type: 'section', titleKey: 'sectionPhilosophyTitle', bodyKey: 'sectionPhilosophyBody' },
  { type: 'section', titleKey: 'sectionVisionTitle', bodyKey: 'sectionVisionBody' },
  { type: 'section', titleKey: 'sectionMissionTitle', bodyKey: 'sectionMissionBody' },
  { type: 'section', titleKey: 'valueHumanTitle', bodyKey: 'valueHumanBody' },
  { type: 'section', titleKey: 'valueCraftTitle', bodyKey: 'valueCraftBody' },
  { type: 'section', titleKey: 'valueLocalTitle', bodyKey: 'valueLocalBody' },
  { type: 'section', titleKey: 'valueCoopTitle', bodyKey: 'valueCoopBody' },
  { type: 'section', titleKey: 'valueHonestTitle', bodyKey: 'valueHonestBody' },
  { type: 'section', titleKey: 'valueConscienceTitle', bodyKey: 'valueConscienceBody' },
  { type: 'section', titleKey: 'sectionNotTitle', bodyKey: 'sectionNotBody' },
  { type: 'section', titleKey: 'sectionIsTitle', bodyKey: 'sectionIsBody' },
  { type: 'section', titleKey: 'sectionAiTitle', bodyKey: 'sectionAiBody' },
  { type: 'section', titleKey: 'sectionSocietyTitle', bodyKey: 'sectionSocietyBody' },
  { type: 'section', titleKey: 'sectionFutureTitle', bodyKey: 'sectionFutureBody' },
  {
    type: 'linkRow',
    links: [
      { href: '/manifest', labelKey: 'linkManifest' },
      { href: '/constitution', labelKey: 'linkConstitution' },
      { href: '/over-ons', labelKey: 'linkAbout' },
      { href: '/wat-is-homecheff', labelKey: 'linkPlatform' },
      { href: '/hoe-homecheff-werkt', labelKey: 'linkEcosystem' },
      { href: '/persoonlijk-vakmanschap', labelKey: 'linkCraft' },
      { href: '/wat-we-niet-zijn', labelKey: 'linkNot' },
      { href: '/faq', labelKey: 'linkFaq' },
    ],
  },
  {
    type: 'faq',
    faqNs: MANIFEST_NAMESPACE,
    items: [
      { qKey: 'faq1Q', aKey: 'faq1A' },
      { qKey: 'faq2Q', aKey: 'faq2A' },
      { qKey: 'faq3Q', aKey: 'faq3A' },
    ],
  },
  { type: 'lastReviewed', sharedNs: MANIFEST_NAMESPACE },
];
