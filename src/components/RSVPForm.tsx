'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ConfirmationModal } from './ConfirmationModal';

type Status = 'pending' | 'attending' | 'declined';
type Companion = { fullName: string; phone: string };
type Invitation = {
  primaryName: string;
  maxCompanions: number;
  status: Status;
  phone: string;
  email: string;
  message: string;
  companionsDeclined: boolean;
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

type Props = { successTitle: string; giftListUrl: string; popup: Popup; allowChanges: boolean };

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
const validName = (v: string) => v.trim().length >= 5 && v.trim().includes(' ');

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

const emptyRows = (n: number, filled: Companion[]): Companion[] =>
  Array.from({ length: n }, (_, i) => ({ fullName: filled[i]?.fullName ?? '', phone: maskPhone(filled[i]?.phone ?? '') }));

export function RSVPForm({ successTitle, giftListUrl, popup, allowChanges }: Props) {
  const uid = useId();
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [code, setCode] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [inv, setInv] = useState<Invitation | null>(null);
  const [status, setStatus] = useState<Status>('pending');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState<Companion[]>([]);
  const [noCompanions, setNoCompanions] = useState(false);
  const [loading, setLoading] = useState<'verify' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPending, setPopupPending] = useState(false);
  const doneRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);

  // Mensagem de erro some assim que a pessoa corrige o formulário.
  useEffect(() => setError(null), [code, status, phone, email, rows, noCompanions]);

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
    setRows(emptyRows(i.maxCompanions, i.companions));
    setNoCompanions(i.companionsDeclined);
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
      setTimeout(() => statusRef.current?.focus(), 0);
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
    if (status === 'attending' && inv.maxCompanions > 0 && !noCompanions) {
      const used = rows.filter((r) => r.fullName.trim() || digits(r.phone));
      if (used.length === 0) return 'Informe seus acompanhantes ou marque "Não vou levar acompanhante".';
      for (const [i, r] of rows.entries()) {
        if (!r.fullName.trim() && !digits(r.phone)) continue;
        if (!validName(r.fullName)) return `Informe nome e sobrenome do acompanhante ${i + 1}.`;
        if (!validPhone(r.phone)) return `Informe o telefone com DDD do acompanhante ${i + 1}.`;
      }
      const names = used.map((r) => r.fullName.trim().toLowerCase());
      if (new Set([...names, inv.primaryName.trim().toLowerCase()]).size !== names.length + 1) {
        return 'Cada acompanhante deve ter um nome diferente.';
      }
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
        noCompanions: attending && inv.maxCompanions > 0 && noCompanions,
        companions:
          attending && !noCompanions
            ? rows.filter((r) => r.fullName.trim()).map((r) => ({ fullName: r.fullName.trim(), phone: digits(r.phone) }))
            : [],
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
    setRows([]);
    setNoCompanions(false);
    setStep('form');
  }

  const verified = !!inv;
  const editable = verified && inv.canSubmit;
  const showCompanions = editable && status === 'attending' && inv.maxCompanions > 0;
  const slotsLabel = !inv
    ? ''
    : inv.maxCompanions === 0
      ? 'Convite individual'
      : `Até ${inv.maxCompanions} acompanhante${inv.maxCompanions > 1 ? 's' : ''}`;

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
            <li key={c.fullName}>
              <span>{c.fullName}</span>
              <span className="rsvp-done__status rsvp-done__status--attending">Acompanhante</span>
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
          <button type="button" className="link-btn" onClick={verify} disabled={loading === 'verify'}>
            {loading === 'verify' ? 'Verificando…' : 'Verificar meu convite'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M2 8h12M9 3l5 5-5 5" />
            </svg>
          </button>
        )}
      </div>

      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

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
            Vagas de acompanhante
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
            <span>
              Seu convite permite levar até {inv.maxCompanions} acompanhante{inv.maxCompanions > 1 ? 's' : ''}. Informe nome completo e
              telefone de cada um — vamos usar para validar a lista de convidados. Crianças e bebês também contam como
              acompanhantes.
            </span>
          </legend>

          {rows.map((r, i) => (
            <div className="companion" key={i}>
              <p className="companion__n" aria-hidden="true">
                {i + 1}
              </p>
              <div className="field">
                <label className="field__label" htmlFor={`${uid}-c${i}-name`}>
                  Nome completo do acompanhante {i + 1}
                </label>
                <input
                  id={`${uid}-c${i}-name`}
                  className="field__input"
                  value={r.fullName}
                  onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, fullName: e.target.value } : x)))}
                  disabled={noCompanions}
                  maxLength={120}
                  autoComplete="off"
                  placeholder="Nome e sobrenome"
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor={`${uid}-c${i}-phone`}>
                  Telefone do acompanhante {i + 1}
                </label>
                <input
                  id={`${uid}-c${i}-phone`}
                  className="field__input"
                  type="tel"
                  inputMode="tel"
                  value={r.phone}
                  onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, phone: maskPhone(e.target.value) } : x)))}
                  disabled={noCompanions}
                  autoComplete="off"
                  placeholder="(11) 98765-4321"
                />
              </div>
            </div>
          ))}

          <label className="check">
            <input type="checkbox" checked={noCompanions} onChange={(e) => setNoCompanions(e.target.checked)} />
            <span className="check__box" aria-hidden="true" />
            <span>Não vou levar acompanhante</span>
          </label>
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

      <p className="rsvp-note">O código identifica o seu convite e mostra quantos acompanhantes você pode levar.</p>

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
