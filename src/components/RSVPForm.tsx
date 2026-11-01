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
  guests: Guest[];
};

type Copy = {
  title: string;
  text: string;
  codeLabel: string;
  codePlaceholder: string;
  verifyButton: string;
  attendLabel: string;
  declineLabel: string;
  submitButton: string;
  successTitle: string;
};

type GiftCopy = { title: string; text: string; yes: string; no: string };

type Props = {
  copy: Copy;
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

function Choice({
  name,
  value,
  onChange,
  copy,
  disabled,
  legend,
}: {
  name: string;
  value: Status;
  onChange: (s: Status) => void;
  copy: Copy;
  disabled?: boolean;
  legend: React.ReactNode;
}) {
  return (
    <fieldset className="rsvp__guest" disabled={disabled}>
      <legend className="rsvp__guest-name">{legend}</legend>
      <div className="choice">
        {(['attending', 'declined'] as const).map((opt) => (
          <label key={opt} className={`choice__option${value === opt ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              required
            />
            <span>{opt === 'attending' ? copy.attendLabel : copy.declineLabel}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function RSVPForm({ copy, giftListUrl, gift, allowChanges }: Props) {
  const uid = useId();
  const [step, setStep] = useState<'code' | 'form' | 'done'>('code');
  const [code, setCode] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [answers, setAnswers] = useState<Record<string, Status>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [companionName, setCompanionName] = useState('');
  const [companionStatus, setCompanionStatus] = useState<Status>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftPending, setGiftPending] = useState(false);
  const doneRef = useRef<HTMLDivElement>(null);

  // Ao concluir: move o foco para a mensagem de sucesso e, em seguida, abre o popup de presentes.
  useEffect(() => {
    if (step !== 'done') return;
    doneRef.current?.focus();
    if (giftPending) {
      setGiftPending(false);
      setGiftOpen(true);
    }
  }, [step, giftPending]);

  function load(inv: Invitation) {
    setInvitation(inv);
    setAnswers(Object.fromEntries(inv.guests.map((g) => [g.id, g.status])));
    setNames(Object.fromEntries(inv.guests.filter((g) => !g.nameLocked).map((g) => [g.id, g.fullName])));
    setCompanionName('');
    setCompanionStatus('pending');
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError('Digite o código recebido no seu convite.');
      return;
    }
    setLoading(true);
    try {
      const data = await post<{ invitation: Invitation }>('/api/rsvp/verify', { code, website: honeypot });
      load(data.invitation);
      setStep('form');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!invitation) return;
    setError(null);

    if (invitation.guests.some((g) => answers[g.id] === 'pending' || !answers[g.id])) {
      setError('Escolha uma resposta para cada participante antes de enviar.');
      return;
    }
    const trimmedCompanion = companionName.trim();
    if (trimmedCompanion && companionStatus === 'pending') {
      setError('Escolha se o acompanhante poderá comparecer.');
      return;
    }
    if (!trimmedCompanion && companionStatus !== 'pending') {
      setError('Informe o nome completo do acompanhante.');
      return;
    }

    setLoading(true);
    try {
      const data = await post<{ eventId: string; invitation: Invitation }>('/api/rsvp/submit', {
        code,
        website: honeypot,
        responses: invitation.guests.map((g) => ({
          guestId: g.id,
          status: answers[g.id],
          ...(g.nameLocked ? {} : { fullName: names[g.id]?.trim() || g.fullName }),
        })),
        companion: invitation.canAddCompanion && trimmedCompanion ? { fullName: trimmedCompanion, status: companionStatus } : null,
      });
      load(data.invitation);
      setStep('done');

      // O popup aparece uma única vez para cada confirmação salva.
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
      setLoading(false);
    }
  }

  function reset() {
    setStep('code');
    setInvitation(null);
    setCode('');
    setError(null);
  }

  const errorBox = error ? (
    <p className="rsvp__error" role="alert">
      {error}
    </p>
  ) : null;

  return (
    <div className="rsvp" aria-live="polite">
      {step === 'code' && (
        <form className="rsvp__code" onSubmit={verify} noValidate>
          <label className="field">
            <span className="field__label">{copy.codeLabel}</span>
            <input
              className="field__input field__input--code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={copy.codePlaceholder}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={32}
              inputMode="text"
              aria-invalid={!!error}
              aria-describedby={error ? `${uid}-err` : undefined}
            />
          </label>
          {/* Campo invisível para robôs (honeypot) */}
          <input
            className="hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
          <div id={`${uid}-err`}>{errorBox}</div>
          <button className="btn btn--gold btn--block" type="submit" disabled={loading}>
            {loading ? 'Verificando…' : copy.verifyButton}
          </button>
        </form>
      )}

      {step === 'form' && invitation && (
        <form className="rsvp__form" onSubmit={submit} noValidate>
          <p className="rsvp__intro">
            {invitation.type === 'couple'
              ? 'Este convite é válido para até duas pessoas. Responda individualmente para cada participante.'
              : 'Este convite é individual e válido para uma pessoa.'}
          </p>

          {invitation.alreadyResponded && invitation.canSubmit && (
            <p className="rsvp__notice">Você já respondeu a este convite. Se quiser, pode alterar sua resposta abaixo.</p>
          )}
          {invitation.closedReason && <p className="rsvp__notice">{invitation.closedReason}</p>}

          {invitation.guests.map((g) =>
            invitation.canSubmit ? (
              <div key={g.id}>
                <Choice
                  name={`${uid}-${g.id}`}
                  value={answers[g.id]}
                  onChange={(s) => setAnswers((a) => ({ ...a, [g.id]: s }))}
                  copy={copy}
                  legend={
                    <>
                      <span className="rsvp__role">{g.role === 'primary' ? 'Convidado(a)' : 'Acompanhante'}</span>
                      {g.nameLocked ? g.fullName : names[g.id] || g.fullName}
                    </>
                  }
                />
                {!g.nameLocked && (
                  <label className="field field--compact">
                    <span className="field__label">Nome do acompanhante</span>
                    <input
                      className="field__input"
                      value={names[g.id] ?? ''}
                      onChange={(e) => setNames((n) => ({ ...n, [g.id]: e.target.value }))}
                      maxLength={120}
                      autoComplete="name"
                    />
                  </label>
                )}
              </div>
            ) : (
              <div className="rsvp__guest" key={g.id}>
                <p className="rsvp__guest-name">
                  <span className="rsvp__role">{g.role === 'primary' ? 'Convidado(a)' : 'Acompanhante'}</span>
                  {g.fullName}
                </p>
                <p className="rsvp__status">{STATUS_TEXT[g.status]}</p>
              </div>
            ),
          )}

          {invitation.canSubmit && invitation.canAddCompanion && (
            <div className="rsvp__companion">
              <p className="rsvp__role">Acompanhante (opcional)</p>
              <p className="rsvp__hint">Seu convite permite um acompanhante. Informe o nome completo se ele(a) for com você.</p>
              <label className="field field--compact">
                <span className="field__label">Nome completo do acompanhante</span>
                <input
                  className="field__input"
                  value={companionName}
                  onChange={(e) => setCompanionName(e.target.value)}
                  maxLength={120}
                  autoComplete="off"
                />
              </label>
              {companionName.trim().length > 0 && (
                <Choice
                  name={`${uid}-companion`}
                  value={companionStatus}
                  onChange={setCompanionStatus}
                  copy={copy}
                  legend={<span className="rsvp__role">Resposta do acompanhante</span>}
                />
              )}
            </div>
          )}

          {errorBox}

          <div className="rsvp__actions">
            {invitation.canSubmit && (
              <button className="btn btn--gold btn--block" type="submit" disabled={loading}>
                {loading ? 'Enviando…' : copy.submitButton}
              </button>
            )}
            <button className="btn btn--text btn--light" type="button" onClick={reset}>
              Usar outro código
            </button>
          </div>
        </form>
      )}

      {step === 'done' && invitation && (
        <div className="rsvp__done" tabIndex={-1} ref={doneRef}>
          <h3 className="rsvp__done-title">{copy.successTitle}</h3>
          <ul className="rsvp__summary" role="list">
            {invitation.guests.map((g) => (
              <li key={g.id}>
                <span>{g.fullName}</span>
                <span className="rsvp__status">{STATUS_TEXT[g.status]}</span>
              </li>
            ))}
          </ul>
          <div className="rsvp__actions">
            <button className="btn btn--outline-light" type="button" onClick={() => setGiftOpen(true)}>
              Ver lista de presentes
            </button>
            {allowChanges && (
              <button className="btn btn--text btn--light" type="button" onClick={() => setStep('form')}>
                Alterar resposta
              </button>
            )}
          </div>
        </div>
      )}

      <GiftPromptModal
        open={giftOpen}
        giftListUrl={giftListUrl}
        first={gift.first}
        second={gift.second}
        onClose={() => setGiftOpen(false)}
      />
    </div>
  );
}
