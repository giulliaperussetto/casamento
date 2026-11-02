'use client';

import { useState } from 'react';

/** Copia o código "Pix Copia e Cola" para a área de transferência. */
export function PixCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-solid pix__copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
        } catch {
          // Navegadores antigos: seleciona um campo temporário e copia.
          const t = document.createElement('textarea');
          t.value = code;
          document.body.appendChild(t);
          t.select();
          document.execCommand('copy');
          t.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }}
    >
      {copied ? 'Código copiado!' : 'Copiar código Pix'}
    </button>
  );
}
