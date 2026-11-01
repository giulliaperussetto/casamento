'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { GiftPromptModal } from './GiftPromptModal';

type Status = 'pending' | 'attending' | 'declined';
type Guest = { id: string; fullName: string; role: 'primary' | 'companion'; nameLocked: boolean; status: Status };
type Invitation = {
  type: 'individual' | 'couple';
  maxGuests: number;
  canAddCompanion: boolean;
  alreadyResponded: boolean;
  canSubmit: boolean;
  closedReason: string | null;
  email: string;
  message: string;
  guests: Guest[];
};
type GiftCopy = { title: string; text: string; yes: string; no: string };

type Props = {
  successTitle: string;
  giftListUrl: string;
  gift: { first: GiftCopy; second: GiftCopy };
  allowChanges: boolean;
};

async function post<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('Sem conexão no momento. Verifique sua internet e tente novamente.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'Não foi possível concluir agora. Tente novamente em instantes.');
  return data as T;
}

const STATUS_TEXT: Record<Status, string> = {
  pending: 'Aguardando resposta',
  attending: 'Presença confirmada',
  declined: 'Não poderá comparecer',
};

const LOCKED = 'Verifique seu código primeiro';

function StatusSelect({
  id,
  value,
  onChange,
  disabled,
  required = true,
}: {
  id: string;
  value: Status;
  onChange: (s: Status) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <span className="select">
      <select
        id={id}
        value={value === 'pending' ? '' : value}
        onChange={(e) => onChange((e.target.value || 'pending') as Status)}
        disabled={disabled}
        required={required}
      >
        <option value="">Selecione</option>
        <option value="attending">Sim, estarei lá</option>
        <option value="declined">Não poderei comparecer</option>
      </select>
    </span>
  );
}

export function RSVPForm({ successTitle, giftListUrl, gift, allowChanges }: Props) {
  const uid = useId();
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [code, setCode] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [answers, setAnswers] = useState<Record<string, Status>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [companionName, setCompanionName] = useState('');
  const [companionStatus, setCompanionStatus] = useState<Status>('pending');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState<'verify' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftPending, setGiftPending] = useState(false);
  const doneRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step !== 'done') return;
    doneRef.current?.focus();
    if (giftPending) {
      setGiftPending(false);
      setGiftOpen(true);
    }
  }, [step, giftPending]);

  // A mensagem de erro some assim que a pessoa corrige o formulário.
  useEffect(() => {
    setError(null);
  }, [answers, email, companionName, companionStatus, code]);

  function load(inv: Invitation) {
    setInvitation(inv);
    setAnswers(Object.fromEntries(inv.guests.map((g) => [g.id, g.status])));
    setNames(Object.fromEntries(inv.guests.filter((g) => !g.nameLocked).map((g) => [g.id, g.fullName])));
    setCompanionName('');
    setCompanionStatus('pending');
    setEmail((e) => inv.email || e);
    setMessage((m) => inv.message || m);
  }

  async function verify() {
    setError(null);
    if (!code.trim()) {
      setError('Digite o código recebido no seu convite.');
      return;
    }
    setLoading('verify');
    try {
      const data = await post<{ invitation: Invitation }>('/api/rsvp/verify', { code, website: honeypot });
      load(data.invitation);
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!invitation) return verify();
    setError(null);

    if (invitation.guests.some((g) => !answers[g.id] || answers[g.id] === 'pending')) {
      setError('Escolha uma resposta para cada pessoa do convite.');
      return;
    }
    const companion = companionName.trim();
    if (companion && companionStatus === 'pending') {
      setError('Escolha se o acompanhante estará conosco.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Informe um e-mail válido para que possamos falar com você.');
      return;
    }

    setLoading('submit');
    try {
      const data = await post<{ eventId: string; invitation: Invitation }>('/api/rsvp/submit', {
        code,
        website: honeypot,
        email: email.trim(),
        message: message.trim() || undefined,
        responses: invitation.guests.map((g) => ({
          guestId: g.id,
          status: answers[g.id],
          ...(g.nameLocked ? {} : { fullName: names[g.id]?.trim() || g.fullName }),
        })),
        companion: invitation.canAddCompanion && companion ? { fullName: companion, status: companionStatus } : null,
      });
      load(data.invitation);
      setStep('done');
      const key = `gift-prompt:${data.eventId}`;
      let seen = false;
      try {
        seen = localStorage.getItem(key) === '1';
        localStorage.setItem(key, '1');
      } catch {}
      if (!seen) setGiftPending(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  function reset() {
    setInvitation(null);
    setCode('');
    setError(null);
    setStep('form');
  }

  const verified = !!invitation;
  const editable = verified && invitation.canSubmit;
  const primary = invitation?.guests.find((g) => g.role === 'primary');
  const companionGuest = invitation?.guests.find((g) => g.role === 'companion');

  if (step === 'done' && invitation) {
    return (
      <div className="rsvp-done" tabIndex={-1} ref={doneRef} aria-live="polite">
        <h3 className="rsvp-done__title">{successTitle}</h3>
        <ul className="rsvp-done__list" role="list">
          {invitation.guests.map((g) => (
            <li key={g.id}>
              <span>{g.fullName}</span>
              <span className={`rsvp-done__status rsvp-done__status--${g.status}`}>{STATUS_TEXT[g.status]}</span>
            </li>
          ))}
        </ul>
        <div className="rsvp-done__actions">
          <button className="btn-solid" type="button" onClick={() => setGiftOpen(true)}>
            Ver lista de presentes
          </button>
          {allowChanges && (
            <button className="link-btn" type="button" onClick={() => setStep('form')}>
              Alterar resposta
            </button>
          )}
        </div>
        <GiftPromptModal open={giftOpen} giftListUrl={giftListUrl} first={gift.first} second={gift.second} onClose={() => setGiftOpen(false)} />
      </div>
    );
  }

  return (
    <form className="rsvp-form" onSubmit={onSubmit} noValidate aria-live="polite">
      <div className="field">
        <label className="field__label" htmlFor={`${uid}-code`}>
          Código do convite <span className="req">*</span>
        </label>
        <input
          id={`${uid}-code`}
          className="field__input field__input--code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Digite o código recebido"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          readOnly={verified}
        />
        {verified ? (
          <button type="button" className="link-btn" onClick={reset}>
            Usar outro código
          </button>
        ) : (
          <button type="button" className="link-btn link-btn--strong" onClick={verify} disabled={loading === 'verify'}>
            {loading === 'verify' ? 'Verificando…' : 'Verificar meu convite'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M2 8h12M9 3l5 5-5 5" />
            </svg>
          </button>
        )}
      </div>

      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

      {invitation?.alreadyResponded && invitation.canSubmit && (
        <p className="rsvp-notice">Você já respondeu a este convite. Se quiser, pode alterar sua resposta abaixo.</p>
      )}
      {invitation?.closedReason && <p className="rsvp-notice">{invitation.closedReason}</p>}

      <div className="field">
        <label className="field__label" htmlFor={`${uid}-name`}>
          Nome do convidado principal <span className="req">*</span>
        </label>
        <input
          id={`${uid}-name`}
          className="field__input"
          value={primary?.fullName ?? ''}
          placeholder={LOCKED}
          readOnly
          disabled={!verified}
          aria-readonly="true"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor={`${uid}-email`}>
          Seu e-mail <span className="req">*</span>
        </label>
        <input
          ref={firstFieldRef}
          id={`${uid}-email`}
          className="field__input"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={verified ? 'voce@email.com' : LOCKED}
          disabled={!editable}
          maxLength={200}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-primary`}>
            Você estará conosco? <span className="req">*</span>
          </label>
          <StatusSelect
            id={`${uid}-primary`}
            value={primary ? answers[primary.id] ?? 'pending' : 'pending'}
            onChange={(s) => primary && setAnswers((a) => ({ ...a, [primary.id]: s }))}
            disabled={!editable}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-type`}>
            Seu convite é
          </label>
          <input
            id={`${uid}-type`}
            className="field__input"
            readOnly
            disabled={!verified}
            value={invitation ? (invitation.type === 'couple' ? 'Casal · até 2 pessoas' : 'Individual · 1 pessoa') : ''}
            placeholder={LOCKED}
          />
        </div>
      </div>

      {verified && companionGuest && (
        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor={`${uid}-cname`}>
              Acompanhante
            </label>
            <input
              id={`${uid}-cname`}
              className="field__input"
              value={companionGuest.nameLocked ? companionGuest.fullName : names[companionGuest.id] ?? ''}
              onChange={(e) => setNames((n) => ({ ...n, [companionGuest.id]: e.target.value }))}
              readOnly={companionGuest.nameLocked}
              disabled={!editable}
              maxLength={120}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor={`${uid}-cstatus`}>
              Estará conosco? <span className="req">*</span>
            </label>
            <StatusSelect
              id={`${uid}-cstatus`}
              value={answers[companionGuest.id] ?? 'pending'}
              onChange={(s) => setAnswers((a) => ({ ...a, [companionGuest.id]: s }))}
              disabled={!editable}
            />
          </div>
        </div>
      )}

      {editable && invitation.canAddCompanion && (
        <div className="field-row">
          <div className="field">
            <label className="field__label" htmlFor={`${uid}-newc`}>
              Nome do acompanhante <span className="opt">(opcional)</span>
            </label>
            <input
              id={`${uid}-newc`}
              className="field__input"
              value={companionName}
              onChange={(e) => setCompanionName(e.target.value)}
              placeholder="Nome completo"
              maxLength={120}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor={`${uid}-newcs`}>
              Estará conosco?
            </label>
            <StatusSelect
              id={`${uid}-newcs`}
              value={companionStatus}
              onChange={setCompanionStatus}
              disabled={!companionName.trim()}
              required={false}
            />
          </div>
        </div>
      )}

      <div className="field">
        <label className="field__label" htmlFor={`${uid}-msg`}>
          Restrições alimentares ou recado <span className="opt">(opcional)</span>
        </label>
        <textarea
          id={`${uid}-msg`}
          className="field__input field__textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Conte para nós, se precisar"
          rows={3}
          maxLength={1000}
          disabled={!editable}
        />
      </div>

      <p className="rsvp-note">O código identifica o seu convite e mostra exatamente quem está incluído nele.</p>

      {error && (
        <p className="rsvp-error" role="alert">
          {error}
        </p>
      )}

      <button className="btn-solid btn-solid--block" type="submit" disabled={loading !== null || (verified && !editable)}>
        {loading === 'submit' ? 'Enviando…' : 'Enviar confirmação'}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M2 8h12M9 3l5 5-5 5" />
        </svg>
      </button>
    </form>
  );
}
