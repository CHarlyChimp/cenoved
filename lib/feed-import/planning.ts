import type { FeedRecord, ParsedFeed } from './contract';
import { matchFeedRecord, type MatchResult, type ProductMatchCandidate } from './matching';

export type PlannedFeedRow = { record: FeedRecord; match: MatchResult };

export type ImportPlan = {
  rows: PlannedFeedRow[];
  missingMerchantOfferIds: string[];
  counts: {
    total: number;
    accepted: number;
    rejected: number;
    matched: number;
    review: number;
    missing: number;
  };
};

export function createImportPlan(
  parsed: ParsedFeed,
  candidates: ProductMatchCandidate[],
  mode: 'full' | 'incremental',
  existingMerchantOfferIds: string[] = [],
): ImportPlan {
  const rows = parsed.accepted.map(record => ({ record, match: matchFeedRecord(record, candidates) }));
  const incomingIds = new Set(rows.map(row => row.record.merchantOfferId));
  const missingMerchantOfferIds = mode === 'full'
    ? existingMerchantOfferIds.filter(id => !incomingIds.has(id))
    : [];
  const matched = rows.filter(row => row.match.status === 'matched').length;
  return {
    rows,
    missingMerchantOfferIds,
    counts: {
      total: parsed.totalRows,
      accepted: parsed.accepted.length,
      rejected: parsed.rejected.length,
      matched,
      review: rows.length - matched,
      missing: missingMerchantOfferIds.length,
    },
  };
}
