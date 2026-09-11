'use client';

import { useState, type FormEvent } from 'react';
import { Flag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { PriceReportReason } from '@/lib/price-report';

const REASONS: { value: PriceReportReason; label: string }[] = [
  { value: 'PRICE_MISMATCH', label: 'Цена отличается' },
  { value: 'NOT_AVAILABLE', label: 'Товара нет в наличии' },
  { value: 'WRONG_PRODUCT', label: 'Открывается другой товар' },
  { value: 'OTHER', label: 'Другая неточность' },
];

export function PriceReportButton({ offerId, enabled }: { offerId: string; enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<PriceReportReason>('PRICE_MISMATCH');
  const [observedPrice, setObservedPrice] = useState('');
  const [requestId, setRequestId] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!enabled) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setMessage('');
    const currentRequestId = requestId || crypto.randomUUID();
    if (!requestId) setRequestId(currentRequestId);
    const price = observedPrice.trim() ? Number(observedPrice) : null;
    try {
      const response = await fetch('/api/price-reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clientRequestId: currentRequestId, offerId, reason, observedPrice: price }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Не удалось сохранить сообщение.');
      setState('success');
      setMessage('Спасибо. Неточность сохранена для проверки.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Не удалось сохранить сообщение.');
    }
  }

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next && state === 'success') {
      setReason('PRICE_MISMATCH');
      setObservedPrice('');
      setRequestId('');
      setState('idle');
      setMessage('');
    }
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild><button className="report-price-button" type="button"><Flag size={13}/>Сообщить о неточности</button></DialogTrigger>
    <DialogContent className="price-report-dialog">
      <DialogHeader>
        <DialogTitle>Что не совпало?</DialogTitle>
        <DialogDescription>Сообщение относится к конкретному предложению. Контактные данные не требуются и не сохраняются.</DialogDescription>
      </DialogHeader>
      {state === 'success' ? <p className="price-report-success" role="status">{message}</p> : <form className="price-report-form" onSubmit={submit}>
        <label>Причина
          <select value={reason} onChange={event => setReason(event.target.value as PriceReportReason)}>
            {REASONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        {reason === 'PRICE_MISMATCH' && <label>Цена у магазина, ₽
          <input inputMode="numeric" min="1" max="2147483647" step="1" required value={observedPrice} onChange={event => setObservedPrice(event.target.value)} placeholder="Например, 84 990"/>
        </label>}
        <p className="price-report-privacy">Мы сохраняем причину, цену и снимок предложения. Не указывайте личные данные.</p>
        {message && <p className="price-report-error" role="alert">{message}</p>}
        <DialogFooter><button className="primary-button" disabled={state === 'sending'} type="submit">{state === 'sending' ? 'Отправляем…' : 'Отправить на проверку'}</button></DialogFooter>
      </form>}
    </DialogContent>
  </Dialog>;
}
