'use client';

import { useState } from 'react';

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
          Nome completo do acompanhante {i + 1}
          <input name="companions" required minLength={2} maxLength={120} autoComplete="off" />
        </label>
      ))}
      {count > 0 && (
        <span className="adm-muted adm-small">O convidado verá esses nomes e só vai escolher se cada um vai ou não.</span>
      )}
    </>
  );
}
