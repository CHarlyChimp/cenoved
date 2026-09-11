import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseFeedCsv, rejectFutureObservations, type MerchantConfig } from '../lib/feed-import/contract';
import { matchFeedRecord, type ProductMatchCandidate } from '../lib/feed-import/matching';
import { createImportPlan } from '../lib/feed-import/planning';

const merchant: MerchantConfig = {
  id: 'synthetic-shop',
  name: 'Синтетический магазин (только тест)',
  allowedDomains: ['shop.example.test'],
};

async function fixture() {
  return new Uint8Array(await readFile(new URL('../fixtures/merchant-feed-v1.csv', import.meta.url)));
}

async function candidate(): Promise<ProductMatchCandidate> {
  const raw = JSON.parse(await readFile(new URL('../fixtures/product-catalog-v1.json', import.meta.url), 'utf8')) as ProductMatchCandidate[];
  return raw[0];
}

test('contract v1 preserves identifiers and parses quoted variant JSON', async () => {
  const parsed = parseFeedCsv(await fixture(), merchant);
  assert.equal(parsed.totalRows, 1);
  assert.equal(parsed.rejected.length, 0);
  assert.equal(parsed.accepted[0].gtin, '05901234123457');
  assert.equal(parsed.accepted[0].manufacturerPartNumber, 'ET-L14-16-512');
  assert.deepEqual(parsed.accepted[0].variant, { screen_inches: 14, ram_gb: 16, storage_gb: 512, region: 'RU' });
});

test('exact GTIN plus compatible variant matches one product', async () => {
  const parsed = parseFeedCsv(await fixture(), merchant);
  assert.deepEqual(matchFeedRecord(parsed.accepted[0], [await candidate()]), {
    status: 'matched',
    productId: 'synthetic-examplebook-14-16-512-ru',
    rule: 'GTIN',
  });
});

test('wrong RAM is sent to review even when GTIN matches', async () => {
  const parsed = parseFeedCsv(await fixture(), merchant);
  parsed.accepted[0].variant.ram_gb = 32;
  assert.deepEqual(matchFeedRecord(parsed.accepted[0], [await candidate()]), {
    status: 'review',
    reason: 'gtin_variant_or_brand_conflict',
  });
});

test('malformed price, currency and unapproved URL are rejected before planning', async () => {
  const input = new TextDecoder().decode(await fixture())
    .replace(',79990,RUB,true,https://shop.example.test/', ',-1,USD,true,http://evil.test/');
  const parsed = parseFeedCsv(new TextEncoder().encode(input), merchant);
  assert.equal(parsed.accepted.length, 0);
  assert.equal(parsed.rejected.length, 1);
  assert.match(parsed.rejected[0].reasons.join(' '), /price_rub/);
  assert.match(parsed.rejected[0].reasons.join(' '), /currency/);
  assert.match(parsed.rejected[0].reasons.join(' '), /product_url/);
});

test('observation from the future is rejected before writes', async () => {
  const parsed = rejectFutureObservations(parseFeedCsv(await fixture(), merchant), new Date('2026-09-11T08:00:00Z'));
  assert.equal(parsed.accepted.length, 0);
  assert.match(parsed.rejected[0].reasons.join(' '), /observed_at/);
});

test('full feed marks missing identities while incremental feed leaves them active', async () => {
  const parsed = parseFeedCsv(await fixture(), merchant);
  const products = [await candidate()];
  const full = createImportPlan(parsed, products, 'full', ['offer-001', 'offer-missing']);
  const incremental = createImportPlan(parsed, products, 'incremental', ['offer-001', 'offer-missing']);
  assert.deepEqual(full.missingMerchantOfferIds, ['offer-missing']);
  assert.deepEqual(incremental.missingMerchantOfferIds, []);
  assert.deepEqual(createImportPlan(parsed, products, 'full', ['offer-001']).counts, createImportPlan(parsed, products, 'full', ['offer-001']).counts);
});
