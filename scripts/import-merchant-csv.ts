import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { MAX_FEED_BYTES, parseFeedCsv, rejectFutureObservations, type MerchantConfig } from '../lib/feed-import/contract';
import { createImportPlan } from '../lib/feed-import/planning';
import { persistImport } from '../lib/feed-import/persistence';
import type { ProductMatchCandidate } from '../lib/feed-import/matching';

type Arguments = {
  file: string;
  mode: 'full' | 'incremental';
  dryRun: boolean;
  catalog?: string;
  config: string;
  fetchedAt: Date;
};

function usage(): never {
  throw new Error('Usage: pnpm feed:import -- --file <feed.csv> --mode <full|incremental> [--dry-run] [--catalog <products.json>] [--config <merchants.json>] [--fetched-at <ISO>]');
}

function parseArguments(argv: string[]): Arguments {
  const values = new Map<string, string>();
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--') continue;
    if (argv[i] === '--dry-run') dryRun = true;
    else if (argv[i].startsWith('--')) {
      const next = argv[++i];
      if (!next || next.startsWith('--')) usage();
      values.set(argv[i - 1], next);
    } else usage();
  }
  const file = values.get('--file');
  const mode = values.get('--mode');
  if (!file || !['full', 'incremental'].includes(mode || '')) usage();
  const fetchedText = values.get('--fetched-at');
  const fetchedAt = fetchedText ? new Date(fetchedText) : new Date();
  if (Number.isNaN(fetchedAt.valueOf())) throw new Error('--fetched-at must be a valid ISO date');
  return {
    file: path.resolve(file),
    mode: mode as 'full' | 'incremental',
    dryRun,
    catalog: values.get('--catalog') ? path.resolve(values.get('--catalog')!) : undefined,
    config: path.resolve(values.get('--config') || 'config/merchants.json'),
    fetchedAt,
  };
}

async function loadMerchantConfig(configPath: string, merchantId: string): Promise<MerchantConfig> {
  const raw = JSON.parse(await readFile(configPath, 'utf8')) as { version?: unknown; merchants?: unknown };
  if (raw.version !== 1 || !Array.isArray(raw.merchants)) throw new Error('Merchant config must use version 1');
  const merchant = raw.merchants.find(item => typeof item === 'object' && item !== null && (item as MerchantConfig).id === merchantId) as MerchantConfig | undefined;
  if (!merchant || typeof merchant.name !== 'string' || !Array.isArray(merchant.allowedDomains) || !merchant.allowedDomains.every(domain => typeof domain === 'string')) {
    throw new Error(`Merchant ${merchantId} is not configured correctly`);
  }
  return merchant;
}

function merchantIdFromHeader(bytes: Uint8Array) {
  const preview = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const lines = preview.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines.length < 2) throw new Error('Feed has no data rows');
  const match = lines[1].match(/^([^,]+)/);
  if (!match) throw new Error('Cannot read merchant_id from first data row');
  return match[1].replace(/^"|"$/g, '');
}

function assertCandidate(value: unknown): asserts value is ProductMatchCandidate[] {
  if (!Array.isArray(value) || value.some(item => !item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.categoryId !== 'string' || typeof item.brand !== 'string' || !item.specs || typeof item.specs !== 'object')) {
    throw new Error('Catalog JSON is not a ProductMatchCandidate array');
  }
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const info = await stat(args.file);
  if (!info.isFile()) throw new Error('Feed path is not a file');
  if (info.size > MAX_FEED_BYTES) throw new Error(`Feed exceeds ${MAX_FEED_BYTES} byte limit`);
  const bytes = await readFile(args.file);
  const merchantId = merchantIdFromHeader(bytes);
  const merchant = await loadMerchantConfig(args.config, merchantId);
  const parsed = rejectFutureObservations(parseFeedCsv(bytes, merchant), args.fetchedAt);
  if (!parsed.accepted.length) throw new Error('Feed has no accepted rows; nothing will be written');

  let prisma: PrismaClient | undefined;
  try {
    let candidates: ProductMatchCandidate[];
    let existingIds: string[] = [];
    if (args.catalog) {
      const raw: unknown = JSON.parse(await readFile(args.catalog, 'utf8'));
      assertCandidate(raw);
      candidates = raw;
    } else {
      if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required unless --catalog is provided for dry-run');
      prisma = new PrismaClient();
      const products = await prisma.product.findMany({
        select: { id: true, categoryId: true, brand: true, manufacturerPartNumber: true, gtin: true, regionCode: true, specs: true },
      });
      candidates = products.map(product => ({ ...product, specs: product.specs as Record<string, unknown> }));
      existingIds = (await prisma.merchantOfferIdentity.findMany({ where: { merchantId }, select: { merchantOfferId: true } })).map(item => item.merchantOfferId);
    }

    const plan = createImportPlan(parsed, candidates, args.mode, existingIds);
    const report = { contractVersion: 1, merchantId, mode: args.mode, dryRun: args.dryRun, ...plan.counts, rejections: parsed.rejected };
    if (args.dryRun) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }
    if (args.catalog) throw new Error('--catalog may only be used together with --dry-run');
    const fileHash = createHash('sha256').update(bytes).digest('hex');
    const result = await persistImport({ prisma: prisma!, merchant, parsed, plan, mode: args.mode, fileHash, fetchedAt: args.fetchedAt });
    console.log(JSON.stringify({ ...report, ...result }, null, 2));
  } finally {
    await prisma?.$disconnect();
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
