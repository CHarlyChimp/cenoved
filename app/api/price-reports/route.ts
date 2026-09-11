import { validatePriceReportInput } from '@/lib/price-report';
import { createPriceReport } from '@/lib/repository';

const MAX_BODY_BYTES = 4096;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return Response.json({ error: 'Запрос слишком большой.' }, { status: 413 });

  let body: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return Response.json({ error: 'Запрос слишком большой.' }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: 'Некорректный JSON.' }, { status: 400 });
  }

  const validation = validatePriceReportInput(body);
  if (!validation.ok) return Response.json({ error: validation.errors.join(' ') }, { status: 400 });

  const result = await createPriceReport(validation.value);
  if (result.status === 'not_found') return Response.json({ error: 'Предложение не найдено.' }, { status: 404 });
  if (result.status === 'unavailable') return Response.json({ error: 'Сообщения принимаются только для фактических предложений магазинов.' }, { status: 409 });
  return Response.json({ id: result.id, repeated: result.repeated }, { status: result.repeated ? 200 : 201 });
}
