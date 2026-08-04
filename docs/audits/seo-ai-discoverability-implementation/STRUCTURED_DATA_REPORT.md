# Structured Data Report

## Delivery mechanism

- Before: `next/script` queued via `self.__next_s` (0 classic parseable bodies in Googlebot HTML)
- After: `components/seo/JsonLdScript.tsx` emits real `<script type="application/ld+json">` in HTML source

## Surfaces converted

RootEntityGraphScripts, OpenKnowledgeJsonLd, LivingPlatformJsonLd, HomecheffSeoLanding/Hub, SeoLandingTemplate, PillarLandingPage HowTo, FAQ, affiliate FAQ, product/seller/profile/gemeenschap/maaltijden, StructuredData helper.

## Types retained

Organization (+ legal operator), WebSite+SearchAction, FAQPage, WebPage, Article, HowTo, Product/Service+Offer, BreadcrumbList, ProfilePage/Person, TechArticle, CollectionPage, Dataset, DefinedTermSet, ItemList.

## Not fabricated

No fake LocalBusiness storefronts, Recipe spam, or unverified Review aggregates.
