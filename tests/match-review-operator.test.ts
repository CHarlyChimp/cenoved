import test from 'node:test';
import assert from 'node:assert/strict';
import { findIdentifierCandidates, parseMatchReviewOperatorCommand } from '../lib/match-review-operator';
import type { FeedIdentity, ProductMatchCandidate } from '../lib/feed-import/matching';

const identity: FeedIdentity = {
  category: 'laptops',
  brand: 'Example Brand',
  manufacturerPartNumber: 'ABC-123',
  gtin: '12345670',
  variant: { screen_inches: 15.6, ram_gb: 16, storage_gb: 512, region: 'RU' },
};

const product: ProductMatchCandidate = {
  id: 'laptop-1',
  categoryId: 'laptops',
  brand: 'ExampleBrand',
  manufacturerPartNumber: 'ABC123',
  gtin: '12345670',
  regionCode: 'RU',
  specs: { screen: 15.6, ram: 16, storage: 512 },
};

test('review list has bounded defaults and optional merchant filter', () => {
  assert.deepEqual(parseMatchReviewOperatorCommand(['list']), { action: 'list', merchantId: undefined, limit: 20, json: false });
  assert.deepEqual(parseMatchReviewOperatorCommand(['list', '--merchant', 'synthetic-shop', '--limit', '100', '--json']), {
    action: 'list', merchantId: 'synthetic-shop', limit: 100, json: true,
  });
});

test('review inspect accepts only one safe identity id', () => {
  assert.deepEqual(parseMatchReviewOperatorCommand(['inspect', 'cm_identity-1', '--json']), { action: 'inspect', id: 'cm_identity-1', json: true });
  for (const argv of [['inspect'], ['inspect', '../bad'], ['inspect', 'one', 'two'], ['inspect', 'one', '--limit', '2']]) {
    assert.throws(() => parseMatchReviewOperatorCommand(argv));
  }
});

test('review parser rejects invalid limits and unknown flags', () => {
  for (const argv of [['list', '--limit', '0'], ['list', '--limit', '101'], ['list', '--limit', '1.5'], ['list', '--wat', 'x']]) {
    assert.throws(() => parseMatchReviewOperatorCommand(argv));
  }
});

test('candidate evidence never uses a similar title as an identifier', () => {
  const differentTitleOnly = { ...product, id: 'laptop-2', brand: 'Other', manufacturerPartNumber: 'OTHER', gtin: null };
  const candidates = findIdentifierCandidates(identity, [differentTitleOnly, product]);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].id, product.id);
  assert.equal(candidates[0].identifierRule, 'GTIN');
  assert.equal(candidates[0].variantCompatible, true);
});

test('candidate evidence exposes identifier matches with an incompatible variant', () => {
  const incompatible = { ...product, specs: { ...product.specs, ram: 32 } };
  const candidates = findIdentifierCandidates(identity, [incompatible]);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].variantCompatible, false);
});
