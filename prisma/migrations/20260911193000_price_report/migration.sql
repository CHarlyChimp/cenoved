CREATE TYPE "PriceReportReason" AS ENUM ('PRICE_MISMATCH', 'NOT_AVAILABLE', 'WRONG_PRODUCT', 'OTHER');
CREATE TYPE "PriceReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

CREATE TABLE "PriceReport" (
  "id" TEXT NOT NULL,
  "clientRequestId" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "reason" "PriceReportReason" NOT NULL,
  "displayedPrice" INTEGER NOT NULL,
  "observedPrice" INTEGER,
  "offerObservedAt" TIMESTAMP(3),
  "status" "PriceReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolutionNote" TEXT,
  CONSTRAINT "PriceReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PriceReport_clientRequestId_key" ON "PriceReport"("clientRequestId");
CREATE INDEX "PriceReport_status_createdAt_idx" ON "PriceReport"("status", "createdAt");
CREATE INDEX "PriceReport_offerId_createdAt_idx" ON "PriceReport"("offerId", "createdAt");

ALTER TABLE "PriceReport" ADD CONSTRAINT "PriceReport_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceReport" ADD CONSTRAINT "PriceReport_displayedPrice_positive" CHECK ("displayedPrice" > 0);
ALTER TABLE "PriceReport" ADD CONSTRAINT "PriceReport_observedPrice_positive" CHECK ("observedPrice" IS NULL OR "observedPrice" > 0);
ALTER TABLE "PriceReport" ADD CONSTRAINT "PriceReport_resolutionNote_length" CHECK ("resolutionNote" IS NULL OR char_length("resolutionNote") <= 1000);
