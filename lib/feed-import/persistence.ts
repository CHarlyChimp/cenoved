import { createHash } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { MerchantConfig, ParsedFeed } from './contract';
import type { ImportPlan } from './planning';

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

function stableOfferId(merchantId: string, merchantOfferId: string) {
  return `feed_${createHash('sha256').update(`${merchantId}\0${merchantOfferId}`).digest('hex').slice(0, 32)}`;
}

export type PersistImportInput = {
  prisma: PrismaClient;
  merchant: MerchantConfig;
  parsed: ParsedFeed;
  plan: ImportPlan;
  mode: 'full' | 'incremental';
  fileHash: string;
  fetchedAt: Date;
};

export async function persistImport(input: PersistImportInput) {
  const { prisma, merchant, parsed, plan, mode, fileHash, fetchedAt } = input;
  const dbMode = mode === 'full' ? 'FULL' : 'INCREMENTAL';
  return prisma.$transaction(async tx => {
    const prior = await tx.feedImport.findUnique({
      where: { merchantId_fileHash_mode: { merchantId: merchant.id, fileHash, mode: dbMode } },
    });
    if (prior?.status === 'SUCCEEDED') return { importId: prior.id, repeated: true };

    await tx.merchant.upsert({
      where: { id: merchant.id },
      create: { id: merchant.id, name: merchant.name, allowedDomains: merchant.allowedDomains },
      update: { name: merchant.name, allowedDomains: merchant.allowedDomains },
    });

    const affectedProducts = new Set<string>();
    const staleCutoff = new Date(fetchedAt.getTime() - STALE_AFTER_MS);
    for (const row of plan.rows) {
      const { record, match } = row;
      const existing = await tx.merchantOfferIdentity.findUnique({
        where: { merchantId_merchantOfferId: { merchantId: merchant.id, merchantOfferId: record.merchantOfferId } },
      });
      if (existing?.productId) affectedProducts.add(existing.productId);
      const stale = record.observedAt < staleCutoff;
      const identityData = {
        category: record.category,
        brand: record.brand,
        manufacturerPartNumber: record.manufacturerPartNumber,
        gtin: record.gtin,
        model: record.model,
        variant: record.variant as Prisma.InputJsonValue,
        lastObservedAt: record.observedAt,
        active: true,
        stale,
      };

      if (match.status === 'review') {
        if (existing?.offerId) {
          await tx.offer.update({ where: { id: existing.offerId }, data: { inStock: false, isStale: true } });
        }
        await tx.merchantOfferIdentity.upsert({
          where: { merchantId_merchantOfferId: { merchantId: merchant.id, merchantOfferId: record.merchantOfferId } },
          create: {
            merchantId: merchant.id,
            merchantOfferId: record.merchantOfferId,
            ...identityData,
            matchStatus: 'REVIEW',
            reviewReason: match.reason,
          },
          update: {
            ...identityData,
            productId: null,
            offerId: null,
            matchStatus: 'REVIEW',
            reviewReason: match.reason,
          },
        });
        continue;
      }

      affectedProducts.add(match.productId);
      const offerId = stableOfferId(merchant.id, record.merchantOfferId);
      await tx.offer.upsert({
        where: { id: offerId },
        create: {
          id: offerId,
          productId: match.productId,
          shopName: merchant.name,
          shopUrl: record.productUrl,
          price: record.priceRub,
          currency: 'RUB',
          inStock: record.inStock,
          isStale: stale,
          sourceKind: 'MERCHANT_FEED',
          observedAt: record.observedAt,
          delivery: 'Условия доставки не указаны',
          merchantId: merchant.id,
        },
        update: {
          productId: match.productId,
          shopName: merchant.name,
          shopUrl: record.productUrl,
          price: record.priceRub,
          inStock: record.inStock,
          isStale: stale,
          observedAt: record.observedAt,
          merchantId: merchant.id,
        },
      });
      await tx.merchantOfferIdentity.upsert({
        where: { merchantId_merchantOfferId: { merchantId: merchant.id, merchantOfferId: record.merchantOfferId } },
        create: {
          merchantId: merchant.id,
          merchantOfferId: record.merchantOfferId,
          ...identityData,
          productId: match.productId,
          offerId,
          matchStatus: 'MATCHED',
        },
        update: {
          ...identityData,
          productId: match.productId,
          offerId,
          matchStatus: 'MATCHED',
          reviewReason: null,
        },
      });
    }

    if (plan.missingMerchantOfferIds.length) {
      const missing = await tx.merchantOfferIdentity.findMany({
        where: { merchantId: merchant.id, merchantOfferId: { in: plan.missingMerchantOfferIds } },
        select: { id: true, offerId: true, productId: true },
      });
      for (const identity of missing) {
        if (identity.productId) affectedProducts.add(identity.productId);
        await tx.merchantOfferIdentity.update({ where: { id: identity.id }, data: { active: false, stale: true } });
        if (identity.offerId) await tx.offer.update({ where: { id: identity.offerId }, data: { inStock: false, isStale: true } });
      }
    }

    const oldIdentities = await tx.merchantOfferIdentity.findMany({
      where: { merchantId: merchant.id, lastObservedAt: { lt: staleCutoff }, stale: false },
      select: { id: true, offerId: true, productId: true },
    });
    for (const identity of oldIdentities) {
      if (identity.productId) affectedProducts.add(identity.productId);
      await tx.merchantOfferIdentity.update({ where: { id: identity.id }, data: { stale: true } });
      if (identity.offerId) await tx.offer.update({ where: { id: identity.offerId }, data: { isStale: true } });
    }

    const historyDate = new Date(Date.UTC(fetchedAt.getUTCFullYear(), fetchedAt.getUTCMonth(), fetchedAt.getUTCDate()));
    for (const productId of affectedProducts) {
      const best = await tx.offer.findFirst({
        where: { productId, sourceKind: 'MERCHANT_FEED', inStock: true, isStale: false },
        orderBy: { price: 'asc' },
        select: { price: true },
      });
      if (best) {
        await tx.priceHistory.upsert({
          where: { productId_date_sourceKind: { productId, date: historyDate, sourceKind: 'MERCHANT_FEED' } },
          create: { productId, date: historyDate, sourceKind: 'MERCHANT_FEED', price: best.price },
          update: { price: best.price },
        });
      } else {
        await tx.priceHistory.deleteMany({ where: { productId, date: historyDate, sourceKind: 'MERCHANT_FEED' } });
      }
    }

    const errorLog = {
      rejected: parsed.rejected.slice(0, 500),
      truncated: parsed.rejected.length > 500,
    } as Prisma.InputJsonValue;
    const created = await tx.feedImport.create({
      data: {
        merchantId: merchant.id,
        contractVersion: 1,
        mode: dbMode,
        fileHash,
        fetchedAt,
        status: 'SUCCEEDED',
        totalRows: plan.counts.total,
        acceptedRows: plan.counts.accepted,
        rejectedRows: plan.counts.rejected,
        matchedRows: plan.counts.matched,
        reviewRows: plan.counts.review,
        errorLog,
      },
    });
    return { importId: created.id, repeated: false };
  }, { maxWait: 10_000, timeout: 60_000 });
}
