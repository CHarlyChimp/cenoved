import type { FeedRecord } from './contract';

export type ProductMatchCandidate = {
  id: string;
  categoryId: string;
  brand: string;
  manufacturerPartNumber: string | null;
  gtin: string | null;
  regionCode: string | null;
  specs: Record<string, unknown>;
};

export type MatchResult =
  | { status: 'matched'; productId: string; rule: 'GTIN' | 'BRAND_MPN_VARIANT' }
  | { status: 'review'; reason: string };

export function normalizeIdentifier(value: string) {
  return value.normalize('NFKC').toLocaleUpperCase('ru').replace(/[^\p{L}\p{N}]/gu, '');
}

function variantCompatible(record: FeedRecord, candidate: ProductMatchCandidate) {
  const expected = record.variant;
  const screen = Number(candidate.specs.screen ?? candidate.specs.screen_inches);
  const ram = Number(candidate.specs.ram ?? candidate.specs.ram_gb);
  const storage = Number(candidate.specs.storage ?? candidate.specs.storage_gb);
  const region = String(candidate.regionCode ?? candidate.specs.region ?? '');
  return Number.isFinite(screen)
    && Math.abs(screen - expected.screen_inches) < 0.01
    && ram === expected.ram_gb
    && storage === expected.storage_gb
    && normalizeIdentifier(region) === normalizeIdentifier(expected.region);
}

function identityCompatible(record: FeedRecord, candidate: ProductMatchCandidate) {
  return candidate.categoryId === record.category
    && normalizeIdentifier(candidate.brand) === normalizeIdentifier(record.brand)
    && variantCompatible(record, candidate);
}

export function matchFeedRecord(record: FeedRecord, candidates: ProductMatchCandidate[]): MatchResult {
  if (record.gtin) {
    const gtinMatches = candidates.filter(candidate => candidate.gtin === record.gtin);
    const compatible = gtinMatches.filter(candidate => identityCompatible(record, candidate));
    if (compatible.length === 1) return { status: 'matched', productId: compatible[0].id, rule: 'GTIN' };
    if (gtinMatches.length > 0) return { status: 'review', reason: compatible.length > 1 ? 'ambiguous_gtin' : 'gtin_variant_or_brand_conflict' };
  }

  const brand = normalizeIdentifier(record.brand);
  const mpn = normalizeIdentifier(record.manufacturerPartNumber);
  const mpnMatches = candidates.filter(candidate =>
    candidate.categoryId === record.category
    && normalizeIdentifier(candidate.brand) === brand
    && candidate.manufacturerPartNumber !== null
    && normalizeIdentifier(candidate.manufacturerPartNumber) === mpn,
  );
  const compatible = mpnMatches.filter(candidate => variantCompatible(record, candidate));
  if (compatible.length === 1) {
    if (record.gtin && compatible[0].gtin && compatible[0].gtin !== record.gtin) return { status: 'review', reason: 'gtin_conflict' };
    return { status: 'matched', productId: compatible[0].id, rule: 'BRAND_MPN_VARIANT' };
  }
  if (compatible.length > 1) return { status: 'review', reason: 'ambiguous_brand_mpn_variant' };
  if (mpnMatches.length > 0) return { status: 'review', reason: 'variant_conflict' };
  return { status: 'review', reason: 'no_exact_identifier_match' };
}
