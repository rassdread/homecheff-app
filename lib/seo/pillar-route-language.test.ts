import assert from "node:assert/strict";
import test from "node:test";
import { lookupProgrammaticString } from "@/lib/i18n/translations";
import { pillarRouteAlternates } from "@/lib/seo/buildPillarMetadata";

test("what-is-homecheff copy is route-locked in both languages", () => {
  assert.equal(
    lookupProgrammaticString("platformDefinitionPage", "title", "nl"),
    "Wat is HomeCheff?",
  );
  assert.equal(
    lookupProgrammaticString("platformDefinitionPage", "title", "en"),
    "What is HomeCheff?",
  );
  assert.match(
    lookupProgrammaticString("platformDefinitionPage", "intro", "en") ?? "",
    /Not only a marketplace/,
  );
  assert.equal(
    lookupProgrammaticString("pillarSharedFaq", "faqBlockTitle", "en"),
    "Frequently asked questions",
  );
});

test("the English alias canonical and hreflang stay on their own URLs", () => {
  const nl = pillarRouteAlternates("/wat-is-homecheff", {
    alternateEnPath: "/en/what-is-homecheff",
  });
  assert.equal(nl.canonical, "https://homecheff.eu/wat-is-homecheff");
  assert.equal(nl.languages["nl-NL"], "https://homecheff.eu/wat-is-homecheff");
  assert.equal(nl.languages["en-US"], "https://homecheff.eu/en/what-is-homecheff");

  const en = pillarRouteAlternates("/wat-is-homecheff", {
    canonicalPath: "/en/what-is-homecheff",
    alternateEnPath: "/en/what-is-homecheff",
  });
  assert.equal(en.canonical, "https://homecheff.eu/en/what-is-homecheff");
  assert.equal(en.languages["nl-NL"], "https://homecheff.eu/wat-is-homecheff");
  assert.equal(en.languages["en-US"], "https://homecheff.eu/en/what-is-homecheff");
  assert.equal(en.languages["x-default"], "https://homecheff.eu/");
});
