import { REMINDERS, fmtDay, type ReminderSummary } from '@/lib/server/reminders';

/** Frase curta sobre quando disparar o lembrete. */
export function whenText(s: Pick<ReminderSummary, 'days' | 'date' | 'open' | 'toSend'>) {
  if (!s.open) return 'Encerrado';
  if (s.days > 1) return `Disparar em ${s.days} dias (${fmtDay(s.date)})`;
  if (s.days === 1) return `Disparar amanhã (${fmtDay(s.date)})`;
  if (s.days === 0) return 'Disparar hoje';
  return s.toSend > 0 ? `Atrasado desde ${fmtDay(s.date)}` : `Disparado (${fmtDay(s.date)})`;
}

export function tone(s: Pick<ReminderSummary, 'days' | 'open' | 'toSend'>) {
  if (!s.open || s.toSend === 0) return 'done';
  if (s.days <= 0) return 'now';
  if (s.days <= 7) return 'soon';
  return 'later';
}

export { REMINDERS };
