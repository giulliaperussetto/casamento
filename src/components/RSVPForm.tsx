'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ConfirmationModal } from './ConfirmationModal';

type Status = 'pending' | 'attending' | 'declined';
type Companion = { id: string; fullName: string; status: Status };
type Invitation = {
  primaryName: string;
  status: Status;
  phone: string;
  email: string;
  message: string;
  companions: Companion[];
  alreadyResponded: boolean;
  canSubmit: boolean;
  closedReason: string | null;
};
type Popup = {
  titleAttending: string;
  titleDeclined: string;
  text: string;
  giftText: string;
  giftButton: string;
  closeButton: string;
};

type Props = { successTitle: string; giftListUrl: string; popup: Popup; allowChanges: boolean; initialCode?: string };

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

const LOCKED = 'Verifique seu código primeiro';
const digits = (v: string) => v.replace(/\D/g, '');
const validPhone = (v: string) => /^[0-9]{10,13}$/.test(digits(v));

/** Máscara simples: (11) 98765-4321 */
function maskPhone(v: string): string {
  let d = digits(v);
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}


export function RSVPForm({ successTitle, giftListUrl, popup, allowChanges, initialCode }: Props) {
  const uid = useId();
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [code, setCode] = useState(initialCode ?? '');
  const [honeypot, setHoneypot] = useState('');
  const [inv, setInv] = useState<Invitation | null>(null);
  const [status, setStatus] = useState<Status>('pending');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [compAnswers, setCompAnswers] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState<'verify' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPending, setPopupPending] = useState(false);
  const doneRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);

  // Mensagem de erro some assim que a pessoa corrige o formulário.
  useEffect(() => setError(null), [code, status, phone, email, compAnswers]);

  useEffect(() => {
    if (step !== 'done') return;
    doneRef.current?.focus();
    if (popupPending) {
      setPopupPending(false);
      setPopupOpen(true);
    }
  }, [step, popupPending]);

  function load(i: Invitation) {
    setInv(i);
    setStatus(i.status);
    setPhone(maskPhone(i.phone));
    setEmail((e) => i.email || e);
    setMessage((m) => i.message || m);
    setCompAnswers(Object.fromEntries(i.companions.map((c) => [c.id, c.status])));
  }

  // Link personalizado: verifica o código automaticamente ao abrir a página.
  const autoVerified = useRef(false);
  useEffect(() => {
    if (initialCode && !autoVerified.current) {
      autoVerified.current = true;
      verify(initialCode, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  async function verify(value: string = code, focus = true) {
    setError(null);
    if (!value.trim()) {
      setError('Digite o código recebido no seu convite.');
      return;
    }
    setLoading('verify');
    try {
      const data = await post<{ invitation: Invitation }>('/api/rsvp/verify', { code: value, website: honeypot });
      load(data.invitation);
      if (focus) setTimeout(() => statusRef.current?.focus(), 0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  function validate(): string | null {
    if (!inv) return null;
    if (status === 'pending') return 'Conte para nós se você estará conosco.';
    if (!validPhone(phone)) return 'Informe seu telefone com DDD, por exemplo (11) 98765-4321.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Informe um e-mail válido para que possamos falar com você.';
    if (status === 'attending' && inv.companions.some((c) => !compAnswers[c.id] || compAnswers[c.id] === 'pending')) {
      return 'Escolha se cada acompanhante vai ou não.';
    }
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inv) return verify();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setLoading('submit');
    try {
      const attending = status === 'attending';
      const data = await post<{ eventId: string; invitation: Invitation }>('/api/rsvp/submit', {
        code,
        website: honeypot,
        status,
        phone: digits(phone),
        email: email.trim(),
        message: message.trim() || undefined,
        // Se o convidado principal não vai, os acompanhantes também não vão.
        companions: inv.companions.map((c) => ({
          guestId: c.id,
          status: attending ? compAnswers[c.id] : 'declined',
        })),
      });
      load(data.invitation);
      setStep('done');
      // O popup aparece uma única vez para cada resposta salva.
      const key = `rsvp-popup:${data.eventId}`;
      let seen = false;
      try {
        seen = localStorage.getItem(key) === '1';
        localStorage.setItem(key, '1');
      } catch {}
      if (!seen) setPopupPending(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  function reset() {
    setInv(null);
    setCode('');
    setStatus('pending');
    setCompAnswers({});
    setStep('form');
  }

  const verified = !!inv;
  const editable = verified && inv.canSubmit;
  const showCompanions = editable && status === 'attending' && inv.companions.length > 0;
  const slotsLabel = !inv
    ? ''
    : inv.companions.length === 0
      ? 'Convite individual'
      : `Você + ${inv.companions.length} acompanhante${inv.companions.length > 1 ? 's' : ''}`;

  const modal = inv && (
    <ConfirmationModal
      open={popupOpen}
      title={inv.status === 'declined' ? popup.titleDeclined : popup.titleAttending}
      text={popup.text}
      giftText={popup.giftText}
      giftButton={popup.giftButton}
      closeButton={popup.closeButton}
      giftListUrl={giftListUrl}
      onClose={() => setPopupOpen(false)}
    />
  );

  if (step === 'done' && inv) {
    return (
      <div className="rsvp-done" tabIndex={-1} ref={doneRef} aria-live="polite">
        <h3 className="rsvp-done__title">{successTitle}</h3>
        <ul className="rsvp-done__list" role="list">
          <li>
            <span>{inv.primaryName}</span>
            <span className={`rsvp-done__status rsvp-done__status--${inv.status}`}>
              {inv.status === 'attending' ? 'Presença confirmada' : 'Não poderá comparecer'}
            </span>
          </li>
          {inv.companions.map((c) => (
            <li key={c.id}>
              <span>{c.fullName}</span>
              <span className={`rsvp-done__status rsvp-done__status--${c.status}`}>
                {c.status === 'attending' ? 'Vai comparecer' : 'Não vai comparecer'}
              </span>
            </li>
          ))}
        </ul>
        <div className="rsvp-done__actions">
          <a className="btn-solid" href={giftListUrl} target="_blank" rel="noopener noreferrer">
            {popup.giftButton}
            <span className="sr-only"> (abre a lista de presentes em nova aba)</span>
          </a>
          {allowChanges && (
            <button className="link-btn" type="button" onClick={() => setStep('form')}>
              Alterar resposta
            </button>
          )}
        </div>
        {modal}
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
          <button type="button" className="link-btn" onClick={() => verify()} disabled={loading === 'verify'}>
            {loading === 'verify' ? 'Verificando…' : 'Verificar meu convite'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M2 8h12M9 3l5 5-5 5" />
            </svg>
          </button>
        )}
      </div>

      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

      {inv && initialCode && code === initialCode && !inv.alreadyResponded && inv.canSubmit && (
        <p className="rsvp-notice">
          Olá, {inv.primaryName.split(' ')[0]}! Seu convite já está aqui. É só preencher os dados abaixo e enviar.
        </p>
      )}
      {inv?.alreadyResponded && inv.canSubmit && (
        <p className="rsvp-notice">Você já respondeu a este convite. Se quiser, pode alterar sua resposta abaixo.</p>
      )}
      {inv?.closedReason && <p className="rsvp-notice">{inv.closedReason}</p>}

      <div className="field">
        <label className="field__label" htmlFor={`${uid}-name`}>
          Nome do convidado principal <span className="req">*</span>
        </label>
        <input id={`${uid}-name`} className="field__input" value={inv?.primaryName ?? ''} placeholder={LOCKED} readOnly disabled={!verified} />
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-status`}>
            Você estará conosco? <span className="req">*</span>
          </label>
          <span className="select">
            <select
              ref={statusRef}
              id={`${uid}-status`}
              value={status === 'pending' ? '' : status}
              onChange={(e) => setStatus((e.target.value || 'pending') as Status)}
              disabled={!editable}
            >
              <option value="">Selecione</option>
              <option value="attending">Sim, estarei lá</option>
              <option value="declined">Não poderei comparecer</option>
            </select>
          </span>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-slots`}>
            Seu convite inclui
          </label>
          <input id={`${uid}-slots`} className="field__input" readOnly disabled={!verified} value={slotsLabel} placeholder={LOCKED} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-phone`}>
            Seu telefone (WhatsApp) <span className="req">*</span>
          </label>
          <input
            id={`${uid}-phone`}
            className="field__input"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => setPhone(maskPhone(e.target.value))}
            placeholder={verified ? '(11) 98765-4321' : LOCKED}
            disabled={!editable}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-email`}>
            Seu e-mail <span className="req">*</span>
          </label>
          <input
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
      </div>

      {showCompanions && (
        <fieldset className="companions">
          <legend className="companions__title">
            Seus acompanhantes
            <span>Estas pessoas estão incluídas no seu convite. Conte pra gente se cada uma vai ou não.</span>
          </legend>

          {inv.companions.map((c, i) => (
            <div className="companion companion--fixed" key={c.id}>
              <p className="companion__n" aria-hidden="true">
                {i + 1}
              </p>
              <div className="field">
                <span className="field__label" id={`${uid}-c${i}-label`}>
                  Acompanhante {i + 1}
                </span>
                <p className="companion__name">{c.fullName}</p>
              </div>
              <div className="field">
                <label className="field__label" htmlFor={`${uid}-c${i}`}>
                  Vai comparecer? <span className="req">*</span>
                </label>
                <span className="select">
                  <select
                    id={`${uid}-c${i}`}
                    aria-describedby={`${uid}-c${i}-label`}
                    value={!compAnswers[c.id] || compAnswers[c.id] === 'pending' ? '' : compAnswers[c.id]}
                    onChange={(e) => setCompAnswers((a) => ({ ...a, [c.id]: (e.target.value || 'pending') as Status }))}
                  >
                    <option value="">Selecione</option>
                    <option value="attending">Sim, vai</option>
                    <option value="declined">Não vai</option>
                  </select>
                </span>
              </div>
            </div>
          ))}
        </fieldset>
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
        {loading === 'submit' ? 'Enviando…' : verified ? 'Enviar confirmação' : 'Verificar e continuar'}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M2 8h12M9 3l5 5-5 5" />
        </svg>
      </button>
      {modal}
    </form>
  );
}
