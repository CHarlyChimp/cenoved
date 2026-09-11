-- The importer keeps merchant identities separate from catalogue products and
-- labels real observations so they cannot overwrite demonstration history.
CREATE TYPE "OfferSource" AS ENUM ('DEMO', 'MERCHANT_FEED');
CREATE TYPE "PriceHistorySource" AS ENUM ('DEMO', 'MERCHANT_FEED');
CREATE TYPE "FeedMode" AS ENUM ('FULL', 'INCREMENTAL');
CREATE TYPE "FeedImportStatus" AS ENUM ('SUCCEEDED', 'FAILED');
CREATE TYPE "MerchantOfferMatchStatus" AS ENUM ('MATCHED', 'REVIEW');

ALTER TABLE "Product"
  ADD COLUMN "manufacturerPartNumber" TEXT,
  ADD COLUMN "gtin" TEXT,
  ADD COLUMN "regionCode" TEXT;

ALTER TABLE "Offer"
  ADD COLUMN "isStale" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sourceKind" "OfferSource" NOT NULL DEFAULT 'DEMO',
  ADD COLUMN "observedAt" TIMESTAMP(3),
  ADD COLUMN "merchantId" TEXT;

ALTER TABLE "PriceHistory"
  ADD COLUMN "sourceKind" "PriceHistorySource" NOT NULL DEFAULT 'DEMO';

DROP INDEX "Offer_productId_shopName_key";
DROP INDEX "PriceHistory_productId_date_key";
CREATE INDEX "Product_gtin_idx" ON "Product"("gtin");
CREATE INDEX "Product_brand_manufacturerPartNumber_idx" ON "Product"("brand", "manufacturerPartNumber");
CREATE INDEX "Offer_productId_shopName_idx" ON "Offer"("productId", "shopName");
CREATE INDEX "Offer_merchantId_isStale_idx" ON "Offer"("merchantId", "isStale");
CREATE UNIQUE INDEX "PriceHistory_productId_date_sourceKind_key" ON "PriceHistory"("productId", "date", "sourceKind");

CREATE TABLE "Merchant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "allowedDomains" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeedImport" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "contractVersion" INTEGER NOT NULL,
  "mode" "FeedMode" NOT NULL,
  "fileHash" TEXT NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "FeedImportStatus" NOT NULL,
  "totalRows" INTEGER NOT NULL,
  "acceptedRows" INTEGER NOT NULL,
  "rejectedRows" INTEGER NOT NULL,
  "matchedRows" INTEGER NOT NULL,
  "reviewRows" INTEGER NOT NULL,
  "errorLog" JSONB NOT NULL,
  CONSTRAINT "FeedImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MerchantOfferIdentity" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "merchantOfferId" TEXT NOT NULL,
  "productId" TEXT,
  "offerId" TEXT,
  "category" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "manufacturerPartNumber" TEXT NOT NULL,
  "gtin" TEXT,
  "model" TEXT NOT NULL,
  "variant" JSONB NOT NULL,
  "matchStatus" "MerchantOfferMatchStatus" NOT NULL,
  "reviewReason" TEXT,
  "lastObservedAt" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "stale" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MerchantOfferIdentity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeedImport_merchantId_fileHash_mode_key" ON "FeedImport"("merchantId", "fileHash", "mode");
CREATE INDEX "FeedImport_merchantId_completedAt_idx" ON "FeedImport"("merchantId", "completedAt");
CREATE UNIQUE INDEX "MerchantOfferIdentity_offerId_key" ON "MerchantOfferIdentity"("offerId");
CREATE UNIQUE INDEX "MerchantOfferIdentity_merchantId_merchantOfferId_key" ON "MerchantOfferIdentity"("merchantId", "merchantOfferId");
CREATE INDEX "MerchantOfferIdentity_productId_matchStatus_idx" ON "MerchantOfferIdentity"("productId", "matchStatus");
CREATE INDEX "MerchantOfferIdentity_merchantId_active_stale_idx" ON "MerchantOfferIdentity"("merchantId", "active", "stale");

ALTER TABLE "Offer" ADD CONSTRAINT "Offer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FeedImport" ADD CONSTRAINT "FeedImport_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchantOfferIdentity" ADD CONSTRAINT "MerchantOfferIdentity_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchantOfferIdentity" ADD CONSTRAINT "MerchantOfferIdentity_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MerchantOfferIdentity" ADD CONSTRAINT "MerchantOfferIdentity_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MerchantOfferIdentity" ADD CONSTRAINT "MerchantOfferIdentity_gtin_digits" CHECK ("gtin" IS NULL OR "gtin" ~ '^[0-9]{8,14}$');
