-- Seller sales locations. Does not update existing products, orders, or subscriptions.
CREATE TABLE "SellerSalesLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "houseNumber" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'NL',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerSalesLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductSalesLocation" (
    "productId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSalesLocation_pkey" PRIMARY KEY ("productId","locationId")
);

CREATE INDEX "SellerSalesLocation_userId_isActive_idx" ON "SellerSalesLocation"("userId", "isActive");
CREATE INDEX "SellerSalesLocation_userId_isPrimary_idx" ON "SellerSalesLocation"("userId", "isPrimary");
CREATE INDEX "ProductSalesLocation_locationId_idx" ON "ProductSalesLocation"("locationId");

ALTER TABLE "SellerSalesLocation" ADD CONSTRAINT "SellerSalesLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSalesLocation" ADD CONSTRAINT "ProductSalesLocation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductSalesLocation" ADD CONSTRAINT "ProductSalesLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "SellerSalesLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
