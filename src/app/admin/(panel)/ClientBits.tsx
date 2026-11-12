'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { markSentQuickAction, setGuestStatusAction } from '../actions';

export function CopyButton({ value, label = 'Copiar' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="adm-btn adm-btn--small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
    >
      {copied ? 'Copiado!' : label}
    </button>
  );
}

/** Botão de envio que pede confirmação antes de ações sensíveis. */
export function ConfirmSubmit({
  message,
  children,
  className,
  formAction,
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <button
      className={className ?? 'adm-btn adm-btn--small'}
      formAction={formAction}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

/** Abre o WhatsApp com a mensagem pronta e marca o convite como enviado. */
export function WhatsAppButton({ href, invitationId, compact }: { href: string; invitationId: string; compact?: boolean }) {
  const [, start] = useTransition();
  return (
    <a
      className={`adm-btn adm-btn--small adm-btn--whats${compact ? ' adm-btn--icon' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation();
        start(() => markSentQuickAction(invitationId));
      }}
      title="Enviar convite no WhatsApp"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
      </svg>
      {!compact && <span>WhatsApp</span>}
    </a>
  );
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'attending', label: 'Confirmado' },
  { value: 'declined', label: 'Recusou' },
] as const;

/** Troca de status em um clique (lista geral). */
export function QuickStatus({ guestId, status }: { guestId: string; status: string }) {
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  return (
    <span className={`adm-quick adm-quick--${value}${pending ? ' is-saving' : ''}`}>
      <select
        aria-label="Status"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          const fd = new FormData();
          fd.set('guestId', guestId);
          fd.set('status', next);
          start(() => setGuestStatusAction(fd));
        }}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

/** Número de acompanhantes → um campo de nome para cada um. */
export function CompanionFields() {
  const [count, setCount] = useState(0);
  return (
    <>
      <label>
        Quantos acompanhantes?
        <input
          type="number"
          min={0}
          max={20}
          value={count}
          inputMode="numeric"
          onChange={(e) => setCount(Math.max(0, Math.min(20, Math.floor(Number(e.target.value) || 0))))}
        />
        <span className="adm-muted adm-small">0 = convite individual.</span>
      </label>
      {Array.from({ length: count }, (_, i) => (
        <label key={i}>
          Nome do acompanhante {i + 1}
          <input name="companions" required minLength={2} maxLength={120} autoComplete="off" />
        </label>
      ))}
      {count > 0 && (
        <span className="adm-muted adm-small">
          O convidado verá esses nomes, dirá se cada um vai e, para quem vai, confirmará nome completo e telefone.
        </span>
      )}
    </>
  );
}

export function NavLinks() {
  const path = usePathname();
  const items = [
    { href: '/admin', label: 'Início' },
    { href: '/admin/convites', label: 'Convites' },
    { href: '/admin/lista', label: 'Lista geral' },
    { href: '/admin/presentes', label: 'Presentes' },
    { href: '/admin/tags', label: 'Tags' },
  ];
  return (
    <nav className="adm-nav" aria-label="Seções do painel">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={path === i.href ? 'page' : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

/** Envia o formulário de filtros ao mudar um seletor. */
export function AutoSubmitSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const ref = useRef<HTMLSelectElement>(null);
  return <select ref={ref} {...props} onChange={() => ref.current?.form?.requestSubmit()} />;
}
