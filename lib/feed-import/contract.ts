export const FEED_CONTRACT_VERSION = 1;
export const MAX_FEED_BYTES = 5 * 1024 * 1024;
export const MAX_FEED_ROWS = 50_000;

export const FEED_HEADERS = [
  'merchant_id',
  'merchant_offer_id',
  'category',
  'brand',
  'manufacturer_part_number',
  'gtin',
  'model',
  'variant',
  'price_rub',
  'currency',
  'in_stock',
  'product_url',
  'observed_at',
] as const;

export type LaptopVariant = {
  screen_inches: number;
  ram_gb: number;
  storage_gb: number;
  region: string;
  [key: string]: string | number | boolean;
};

export type FeedRecord = {
  merchantId: string;
  merchantOfferId: string;
  category: 'laptops';
  brand: string;
  manufacturerPartNumber: string;
  gtin: string | null;
  model: string;
  variant: LaptopVariant;
  priceRub: number;
  currency: 'RUB';
  inStock: boolean;
  productUrl: string;
  observedAt: Date;
  line: number;
};

export type RejectedFeedRow = {
  line: number;
  merchantOfferId?: string;
  reasons: string[];
};

export type MerchantConfig = {
  id: string;
  name: string;
  allowedDomains: string[];
};

export type ParsedFeed = {
  totalRows: number;
  accepted: FeedRecord[];
  rejected: RejectedFeedRow[];
};

type CsvRow = { line: number; values: string[] };

function parseCsvRows(input: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let closedQuote = false;
  let line = 1;
  let rowLine = 1;

  const finishRow = () => {
    row.push(field);
    if (!(row.length === 1 && row[0] === '')) rows.push({ line: rowLine, values: row });
    row = [];
    field = '';
    closedQuote = false;
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
          closedQuote = true;
        }
      } else {
        field += char;
        if (char === '\n') line++;
      }
      continue;
    }

    if (char === '"') {
      if (field.length > 0 || closedQuote) throw new Error(`CSV syntax error at line ${line}: unexpected quote`);
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
      closedQuote = false;
    } else if (char === '\n' || char === '\r') {
      finishRow();
      if (char === '\r' && input[i + 1] === '\n') i++;
      line++;
      rowLine = line;
    } else {
      if (closedQuote) throw new Error(`CSV syntax error at line ${line}: text after closing quote`);
      field += char;
    }
  }

  if (inQuotes) throw new Error(`CSV syntax error at line ${rowLine}: unterminated quoted field`);
  if (field.length > 0 || row.length > 0) finishRow();
  return rows;
}

function isValidGtin(value: string) {
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value) || /^0+$/.test(value)) return false;
  const body = value.slice(0, -1);
  let sum = 0;
  for (let i = body.length - 1, weight = 3; i >= 0; i--, weight = weight === 3 ? 1 : 3) {
    sum += Number(body[i]) * weight;
  }
  return (10 - (sum % 10)) % 10 === Number(value.at(-1));
}

function boundedText(value: string, label: string, reasons: string[], max = 200) {
  const trimmed = value.trim();
  if (!trimmed) reasons.push(`${label}: обязательное поле`);
  else if (trimmed.length > max) reasons.push(`${label}: длиннее ${max} символов`);
  return trimmed;
}

function parseVariant(value: string, reasons: string[]): LaptopVariant | null {
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    reasons.push('variant: некорректный JSON');
    return null;
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    reasons.push('variant: ожидается JSON-объект');
    return null;
  }
  const variant = raw as Record<string, unknown>;
  const screen = variant.screen_inches;
  const ram = variant.ram_gb;
  const storage = variant.storage_gb;
  const region = variant.region;
  if (typeof screen !== 'number' || !Number.isFinite(screen) || screen < 10 || screen > 25) reasons.push('variant.screen_inches: число от 10 до 25');
  if (!Number.isInteger(ram) || Number(ram) <= 0 || Number(ram) > 256) reasons.push('variant.ram_gb: положительное целое до 256');
  if (!Number.isInteger(storage) || Number(storage) <= 0 || Number(storage) > 16384) reasons.push('variant.storage_gb: положительное целое до 16384');
  if (typeof region !== 'string' || !region.trim() || region.length > 32) reasons.push('variant.region: непустая строка до 32 символов');
  for (const [key, item] of Object.entries(variant)) {
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(key) || !['string', 'number', 'boolean'].includes(typeof item)) {
      reasons.push(`variant.${key}: разрешены только простые значения и безопасные имена ключей`);
    }
  }
  return reasons.some(reason => reason.startsWith('variant')) ? null : variant as LaptopVariant;
}

function validateRow(row: CsvRow, merchant: MerchantConfig): { record?: FeedRecord; rejected?: RejectedFeedRow } {
  const reasons: string[] = [];
  if (row.values.length !== FEED_HEADERS.length) {
    return { rejected: { line: row.line, reasons: [`ожидалось ${FEED_HEADERS.length} колонок, получено ${row.values.length}`] } };
  }
  const value = Object.fromEntries(FEED_HEADERS.map((header, index) => [header, row.values[index]])) as Record<(typeof FEED_HEADERS)[number], string>;
  const merchantId = boundedText(value.merchant_id, 'merchant_id', reasons, 80);
  const merchantOfferId = boundedText(value.merchant_offer_id, 'merchant_offer_id', reasons, 160);
  const brand = boundedText(value.brand, 'brand', reasons, 100);
  const manufacturerPartNumber = boundedText(value.manufacturer_part_number, 'manufacturer_part_number', reasons, 160);
  const model = boundedText(value.model, 'model', reasons, 200);
  if (merchantId !== merchant.id) reasons.push('merchant_id: не совпадает с выбранной серверной конфигурацией');
  if (value.category !== 'laptops') reasons.push('category: в контракте v1 поддерживается только laptops');
  if (!/^[A-Za-z0-9._:-]+$/.test(merchantOfferId)) reasons.push('merchant_offer_id: недопустимые символы');

  const gtin = value.gtin.trim();
  if (gtin && !isValidGtin(gtin)) reasons.push('gtin: некорректная контрольная цифра или длина');
  const variant = parseVariant(value.variant, reasons);

  const priceText = value.price_rub.trim();
  const priceRub = /^\d+$/.test(priceText) ? Number(priceText) : NaN;
  if (!Number.isSafeInteger(priceRub) || priceRub <= 0 || priceRub > 2_147_483_647) reasons.push('price_rub: ожидается положительное целое число рублей');
  if (value.currency !== 'RUB') reasons.push('currency: поддерживается только RUB');
  if (!['true', 'false'].includes(value.in_stock)) reasons.push('in_stock: ожидается true или false');

  let productUrl = '';
  try {
    const url = new URL(value.product_url);
    const allowed = new Set(merchant.allowedDomains.map(domain => domain.toLowerCase()));
    if (url.protocol !== 'https:' || url.username || url.password || !allowed.has(url.hostname.toLowerCase())) throw new Error();
    productUrl = url.toString();
  } catch {
    reasons.push('product_url: нужен HTTPS URL без учётных данных на разрешённом домене');
  }

  const dateText = value.observed_at.trim();
  const isoWithZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
  const observedAt = new Date(dateText);
  if (!isoWithZone.test(dateText) || Number.isNaN(observedAt.valueOf())) reasons.push('observed_at: нужна корректная ISO 8601 дата с часовым поясом');

  if (reasons.length || !variant) return { rejected: { line: row.line, merchantOfferId: merchantOfferId || undefined, reasons } };
  return {
    record: {
      merchantId,
      merchantOfferId,
      category: 'laptops',
      brand,
      manufacturerPartNumber,
      gtin: gtin || null,
      model,
      variant,
      priceRub,
      currency: 'RUB',
      inStock: value.in_stock === 'true',
      productUrl,
      observedAt,
      line: row.line,
    },
  };
}

export function parseFeedCsv(bytes: Uint8Array, merchant: MerchantConfig): ParsedFeed {
  if (bytes.byteLength > MAX_FEED_BYTES) throw new Error(`Feed exceeds ${MAX_FEED_BYTES} byte limit`);
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('Feed must be valid UTF-8');
  }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = parseCsvRows(text);
  if (!rows.length) throw new Error('Feed is empty');
  if (rows.length - 1 > MAX_FEED_ROWS) throw new Error(`Feed exceeds ${MAX_FEED_ROWS} data row limit`);
  if (rows[0].values.join('\u0000') !== FEED_HEADERS.join('\u0000')) {
    throw new Error(`CSV header must exactly match contract v${FEED_CONTRACT_VERSION}`);
  }

  const accepted: FeedRecord[] = [];
  const rejected: RejectedFeedRow[] = [];
  const seenOfferIds = new Set<string>();
  for (const row of rows.slice(1)) {
    const result = validateRow(row, merchant);
    if (result.rejected) {
      rejected.push(result.rejected);
      continue;
    }
    const record = result.record!;
    if (seenOfferIds.has(record.merchantOfferId)) {
      rejected.push({ line: record.line, merchantOfferId: record.merchantOfferId, reasons: ['merchant_offer_id: дубликат в файле'] });
    } else {
      seenOfferIds.add(record.merchantOfferId);
      accepted.push(record);
    }
  }
  return { totalRows: rows.length - 1, accepted, rejected };
}

export function rejectFutureObservations(parsed: ParsedFeed, fetchedAt: Date, toleranceMs = 5 * 60 * 1000) {
  const latestAllowed = fetchedAt.getTime() + toleranceMs;
  const accepted: FeedRecord[] = [];
  for (const record of parsed.accepted) {
    if (record.observedAt.getTime() > latestAllowed) {
      parsed.rejected.push({
        line: record.line,
        merchantOfferId: record.merchantOfferId,
        reasons: ['observed_at: более чем на 5 минут позже времени получения файла'],
      });
    } else {
      accepted.push(record);
    }
  }
  parsed.accepted = accepted;
  return parsed;
}
