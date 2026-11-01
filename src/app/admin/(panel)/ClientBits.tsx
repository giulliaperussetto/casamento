'use client';

import { useState } from 'react';

export function CopyButton({ value }: { value: string }) {
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
      {copied ? 'Copiado!' : 'Copiar'}
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

export function TypeFields() {
  const [type, setType] = useState<'individual' | 'couple'>('individual');
  const [companion, setCompanion] = useState('');
  return (
    <>
      <fieldset className="adm-radio">
        <legend>Tipo de convite</legend>
        <label>
          <input type="radio" name="type" value="individual" checked={type === 'individual'} onChange={() => setType('individual')} />
          Individual (1 pessoa)
        </label>
        <label>
          <input type="radio" name="type" value="couple" checked={type === 'couple'} onChange={() => setType('couple')} />
          Casal (até 2 pessoas)
        </label>
      </fieldset>
      {type === 'couple' && (
        <>
          <label>
            Nome do acompanhante (opcional)
            <input name="companionName" maxLength={120} value={companion} onChange={(e) => setCompanion(e.target.value)} />
          </label>
          {!companion.trim() && (
            <label className="adm-check">
              <input type="checkbox" name="allowUnnamedCompanion" defaultChecked />
              Permitir que o convidado informe o nome do acompanhante
            </label>
          )}
        </>
      )}
    </>
  );
}
