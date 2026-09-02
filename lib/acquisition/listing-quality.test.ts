import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LISTING_QUALITY_THRESHOLD,
  scoreListingQuality,
  isQualityListing,
} from "./listing-quality";

describe("listing quality score", () => {
  it("scores a strong listing as quality", () => {
    const result = scoreListingQuality({
      title: "Verse tomatensoep van biologische tomaten",
      description:
        "Huisgemaakte tomatensoep met verse kruiden uit de tuin. Geschikt voor 2 personen. Op te halen in Vlaardingen.",
      priceCents: 850,
      priceModel: "FIXED",
      category: "CHEFF",
      marketplaceCategory: "CREATE",
      placeName: "Vlaardingen",
      pickupAddress: "Hoofdstraat 1, Vlaardingen",
      pickupLat: 51.91,
      pickupLng: 4.34,
      delivery: "PICKUP",
      stock: 5,
      isActive: true,
      imageCount: 3,
      sellerDisplayName: "Sergio",
      sellerBio: "Thuisbakker met passie voor seizoensgroenten en soepen.",
      sellerHasCoords: true,
      userCity: "Vlaardingen",
    });
    assert.ok(result.score >= LISTING_QUALITY_THRESHOLD);
    assert.equal(result.isQuality, true);
    assert.equal(isQualityListing({
      title: "Verse tomatensoep van biologische tomaten",
      description:
        "Huisgemaakte tomatensoep met verse kruiden uit de tuin. Geschikt voor 2 personen. Op te halen in Vlaardingen.",
      priceCents: 850,
      category: "CHEFF",
      imageCount: 3,
      delivery: "PICKUP",
      pickupLat: 51.91,
      pickupLng: 4.34,
      stock: 5,
      isActive: true,
      sellerDisplayName: "Sergio",
      sellerBio: "Thuisbakker met passie voor seizoensgroenten en soepen.",
    }), true);
  });

  it("scores a sparse draft below threshold", () => {
    const result = scoreListingQuality({
      title: "x",
      description: "",
      priceCents: 0,
      category: null,
      imageCount: 0,
      isActive: false,
    });
    assert.ok(result.score < LISTING_QUALITY_THRESHOLD);
    assert.equal(result.isQuality, false);
  });

  it("sums dimension weights to at most 100", () => {
    const result = scoreListingQuality({
      title: "Perfecte lange titel hier",
      description: "x".repeat(100),
      priceCents: 1200,
      category: "DESIGNER",
      marketplaceCategory: "DESIGN",
      pickupLat: 1,
      pickupLng: 2,
      delivery: "BOTH",
      sellerCanDeliver: true,
      stock: 10,
      isActive: true,
      imageCount: 4,
      hasVideo: true,
      sellerDisplayName: "Maker",
      sellerBio: "x".repeat(40),
      sellerHasCoords: true,
      userCity: "Rotterdam",
    });
    assert.ok(result.score <= 100);
    assert.ok(result.score >= 90);
  });
});
