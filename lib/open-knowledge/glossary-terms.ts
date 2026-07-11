/**
 * Phase 13V — Glossary term registry (SSOT for UI + DefinedTermSet schema).
 */

export type GlossaryTermDef = {
  termKey: string;
  shortKey: string;
  longKey: string;
  relatedPaths?: string[];
};

export const GLOSSARY_TERMS: GlossaryTermDef[] = [
  { termKey: 'termDorpsplein', shortKey: 'defDorpspleinShort', longKey: 'defDorpsplein', relatedPaths: ['/docs/marketplace'] },
  { termKey: 'termHcp', shortKey: 'defHcpShort', longKey: 'defHcp', relatedPaths: ['/docs/hcp'] },
  { termKey: 'termBusinessDna', shortKey: 'defBusinessDnaShort', longKey: 'defBusinessDna', relatedPaths: ['/docs/business-dna'] },
  { termKey: 'termCommunityOrder', shortKey: 'defCommunityOrderShort', longKey: 'defCommunityOrder', relatedPaths: ['/docs/community-orders'] },
  { termKey: 'termProps', shortKey: 'defPropsShort', longKey: 'defProps' },
  { termKey: 'termFans', shortKey: 'defFansShort', longKey: 'defFans' },
  { termKey: 'termMarketplace', shortKey: 'defMarketplaceShort', longKey: 'defMarketplace', relatedPaths: ['/docs/marketplace'] },
  { termKey: 'termAffiliate', shortKey: 'defAffiliateShort', longKey: 'defAffiliate', relatedPaths: ['/docs/affiliate'] },
  { termKey: 'termDelivery', shortKey: 'defDeliveryShort', longKey: 'defDelivery', relatedPaths: ['/docs/delivery'] },
  { termKey: 'termBarter', shortKey: 'defBarterShort', longKey: 'defBarter', relatedPaths: ['/docs/barter'] },
  { termKey: 'termStudio', shortKey: 'defStudioShort', longKey: 'defStudio' },
  { termKey: 'termChef', shortKey: 'defChefShort', longKey: 'defChef' },
  { termKey: 'termGarden', shortKey: 'defGardenShort', longKey: 'defGarden' },
  { termKey: 'termDesigner', shortKey: 'defDesignerShort', longKey: 'defDesigner' },
  { termKey: 'termGezocht', shortKey: 'defGezochtShort', longKey: 'defGezocht', relatedPaths: ['/docs/community-orders'] },
];

export const OPEN_KNOWLEDGE_GLOSSARY_NAMESPACE = 'openKnowledgeGlossary';
