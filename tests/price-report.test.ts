import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePriceReportInput } from '../lib/price-report';
import { POST } from '../app/api/price-reports/route';

const valid = {
  clientRequestId: '123e4567-e89b-42d3-a456-426614174000',
  offerId: 'feed_0123456789abcdef',
  reason: 'PRICE_MISMATCH',
  observedPrice: 84990,
};

test('valid anonymous price report contains no personal data', () => {
  assert.deepEqual(validatePriceReportInput(valid), { ok: true, value: valid });
});

test('price mismatch requires a positive integer observed price', () => {
  for (const observedPrice of [null, 0, -1, 84990.5, '84990']) {
    const result = validatePriceReportInput({ ...valid, observedPrice });
    assert.equal(result.ok, false);
  }
});

test('unknown fields and invalid identifiers are rejected', () => {
  const result = validatePriceReportInput({ ...valid, clientRequestId: 'not-a-uuid', offerId: '../offer', email: 'person@example.test' });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.errors.join(' '), /clientRequestId/);
    assert.match(result.errors.join(' '), /offerId/);
    assert.match(result.errors.join(' '), /неизвестные поля/);
  }
});

test('API rejects malformed and oversized bodies', async () => {
  const malformed = await POST(new Request('https://cenoved.test/api/price-reports', { method: 'POST', body: '{' }));
  assert.equal(malformed.status, 400);
  const oversized = await POST(new Request('https://cenoved.test/api/price-reports', {
    method: 'POST',
    headers: { 'content-length': '4097' },
    body: '{}',
  }));
  assert.equal(oversized.status, 413);
});

test('demo mode never pretends that a report was persisted', async () => {
  const previous = process.env.DATA_SOURCE;
  process.env.DATA_SOURCE = 'demo';
  try {
    const response = await POST(new Request('https://cenoved.test/api/price-reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(valid),
    }));
    assert.equal(response.status, 409);
    assert.match(await response.text(), /фактических предложений/);
  } finally {
    if (previous === undefined) delete process.env.DATA_SOURCE;
    else process.env.DATA_SOURCE = previous;
  }
});
