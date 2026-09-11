export const PRICE_REPORT_REASONS = [
  'PRICE_MISMATCH',
  'NOT_AVAILABLE',
  'WRONG_PRODUCT',
  'OTHER',
] as const;

export type PriceReportReason = (typeof PRICE_REPORT_REASONS)[number];

export type PriceReportInput = {
  clientRequestId: string;
  offerId: string;
  reason: PriceReportReason;
  observedPrice: number | null;
};

export type PriceReportValidation =
  | { ok: true; value: PriceReportInput }
  | { ok: false; errors: string[] };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OFFER_ID_PATTERN = /^[A-Za-z0-9_:-]{1,200}$/;

export function validatePriceReportInput(input: unknown): PriceReportValidation {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['Ожидается JSON-объект.'] };
  }
  const raw = input as Record<string, unknown>;
  const errors: string[] = [];
  const clientRequestId = typeof raw.clientRequestId === 'string' ? raw.clientRequestId : '';
  const offerId = typeof raw.offerId === 'string' ? raw.offerId : '';
  const reason = raw.reason;
  const observedPrice = raw.observedPrice === null || raw.observedPrice === undefined ? null : raw.observedPrice;

  if (!UUID_PATTERN.test(clientRequestId)) errors.push('clientRequestId должен быть UUID.');
  if (!OFFER_ID_PATTERN.test(offerId)) errors.push('Некорректный offerId.');
  if (typeof reason !== 'string' || !(PRICE_REPORT_REASONS as readonly string[]).includes(reason)) errors.push('Неизвестная причина сообщения.');
  if (observedPrice !== null && (!Number.isSafeInteger(observedPrice) || Number(observedPrice) <= 0 || Number(observedPrice) > 2_147_483_647)) {
    errors.push('Цена у магазина должна быть положительным целым числом рублей.');
  }
  if (reason === 'PRICE_MISMATCH' && observedPrice === null) errors.push('Укажите цену, которую вы увидели у магазина.');
  if (Object.keys(raw).some(key => !['clientRequestId', 'offerId', 'reason', 'observedPrice'].includes(key))) errors.push('Запрос содержит неизвестные поля.');

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      clientRequestId,
      offerId,
      reason: reason as PriceReportReason,
      observedPrice: observedPrice as number | null,
    },
  };
}
