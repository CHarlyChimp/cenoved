import { PrismaClient } from '@prisma/client';
import { findIdentifierCandidates, parseMatchReviewOperatorCommand } from '../lib/match-review-operator';
import type { FeedIdentity, ProductMatchCandidate } from '../lib/feed-import/matching';

const prisma = new PrismaClient();
const MAX_INSPECT_PRODUCTS = 5000;

const identitySelect = {
  id: true,
  merchantOfferId: true,
  category: true,
  brand: true,
  manufacturerPartNumber: true,
  gtin: true,
  model: true,
  variant: true,
  matchStatus: true,
  reviewReason: true,
  lastObservedAt: true,
  active: true,
  stale: true,
  updatedAt: true,
  merchant: { select: { id: true, name: true } },
} as const;

type IdentityRow = NonNullable<Awaited<ReturnType<typeof findIdentity>>>;

function findIdentity(id: string) {
  return prisma.merchantOfferIdentity.findUnique({ where: { id }, select: identitySelect });
}

function printIdentity(identity: IdentityRow) {
  console.log([
    `${identity.id}  ${identity.reviewReason || 'review'}`,
    `  ${identity.merchant.name} · ${identity.merchantOfferId} · ${identity.model}`,
    `  ${identity.brand} · MPN ${identity.manufacturerPartNumber} · GTIN ${identity.gtin || 'нет'}`,
    `  наблюдение ${identity.lastObservedAt.toISOString()} · ${identity.active ? 'active' : 'inactive'}${identity.stale ? ' · stale' : ''}`,
  ].join('\n'));
}

async function main() {
  const command = parseMatchReviewOperatorCommand(process.argv.slice(2));
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

  if (command.action === 'list') {
    const identities = await prisma.merchantOfferIdentity.findMany({
      where: { matchStatus: 'REVIEW', merchantId: command.merchantId },
      orderBy: { updatedAt: 'asc' },
      take: command.limit,
      select: identitySelect,
    });
    if (command.json) console.log(JSON.stringify(identities, null, 2));
    else if (!identities.length) console.log('Записей REVIEW не найдено.');
    else identities.forEach(printIdentity);
    return;
  }

  const identity = await findIdentity(command.id);
  if (!identity) throw new Error(`MerchantOfferIdentity ${command.id} was not found`);
  if (identity.matchStatus !== 'REVIEW') throw new Error(`MerchantOfferIdentity ${command.id} is ${identity.matchStatus}, not REVIEW`);
  if (identity.category !== 'laptops') throw new Error(`Category ${identity.category} is not supported by feed contract v1`);
  const productCount = await prisma.product.count({ where: { categoryId: identity.category } });
  if (productCount > MAX_INSPECT_PRODUCTS) throw new Error(`Category ${identity.category} has ${productCount} products; inspection limit is ${MAX_INSPECT_PRODUCTS}`);
  const products = await prisma.product.findMany({
    where: { categoryId: identity.category },
    select: { id: true, categoryId: true, brand: true, manufacturerPartNumber: true, gtin: true, regionCode: true, specs: true },
  });
  const feedIdentity: FeedIdentity = {
    category: identity.category,
    brand: identity.brand,
    manufacturerPartNumber: identity.manufacturerPartNumber,
    gtin: identity.gtin,
    variant: identity.variant as FeedIdentity['variant'],
  };
  const candidates = findIdentifierCandidates(feedIdentity, products as ProductMatchCandidate[]);
  const result = { identity, candidates };
  if (command.json) console.log(JSON.stringify(result, null, 2));
  else {
    printIdentity(identity);
    if (!candidates.length) console.log('  Точных кандидатов по GTIN или brand + MPN нет.');
    else for (const candidate of candidates) {
      console.log(`  кандидат ${candidate.id} · ${candidate.identifierRule} · вариант ${candidate.variantCompatible ? 'совместим' : 'НЕ совместим'}`);
    }
  }
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
