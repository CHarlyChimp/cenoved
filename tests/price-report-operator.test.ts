import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePriceReportOperatorCommand } from '../lib/price-report-operator';

test('operator list defaults to the oldest 20 open reports', () => {
  assert.deepEqual(parsePriceReportOperatorCommand(['list']), {
    action: 'list',
    status: 'OPEN',
    limit: 20,
    json: false,
  });
});

test('operator list accepts bounded filters and JSON output', () => {
  assert.deepEqual(parsePriceReportOperatorCommand(['--', 'list', '--status', 'all', '--limit', '100', '--json']), {
    action: 'list',
    status: 'ALL',
    limit: 100,
    json: true,
  });
});

test('operator close commands require a safe id and one-line note', () => {
  assert.deepEqual(parsePriceReportOperatorCommand(['resolve', 'cm123_report', '--note', 'Подтверждено следующим фидом']), {
    action: 'resolve',
    id: 'cm123_report',
    note: 'Подтверждено следующим фидом',
    json: false,
  });
  for (const argv of [
    ['dismiss', '../report', '--note', 'Нет'],
    ['resolve', 'cm123'],
    ['resolve', 'cm123', '--note', 'line one\nline two'],
  ]) assert.throws(() => parsePriceReportOperatorCommand(argv));
});

test('operator parser rejects unknown, duplicate, and out-of-range flags', () => {
  for (const argv of [
    ['list', '--status', 'pending'],
    ['list', '--limit', '0'],
    ['list', '--limit', '101'],
    ['list', '--limit', '2.5'],
    ['list', '--unknown', 'value'],
    ['list', '--json', '--json'],
  ]) assert.throws(() => parsePriceReportOperatorCommand(argv));
});
