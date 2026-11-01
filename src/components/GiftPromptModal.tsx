'use client';

import { useEffect, useRef, useState } from 'react';

type Copy = { title: string; text: string; yes: string; no: string };

type Props = {
  open: boolean;
  giftListUrl: string;
  first: Copy;
  second: Copy;
  onClose: () => void;
};

/**
 * Fluxo opcional de presentes, exibido somente após o servidor confirmar o RSVP.
 * Usa <dialog> nativo: foco preso no modal, ESC fecha e o foco retorna ao elemento anterior.
 */
export function GiftPromptModal({ open, giftListUrl, first, second, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const primaryBtn = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      setStep(1);
      dialog.showModal();
      primaryBtn.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    primaryBtn.current?.focus();
  }, [step]);

  function close() {
    ref.current?.close();
  }

  function openList() {
    window.open(giftListUrl, '_blank', 'noopener,noreferrer');
    close();
  }

  const copy = step === 1 ? first : second;

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="gift-title"
      aria-describedby="gift-text"
      onClose={() => {
        onClose();
        returnFocus.current?.focus?.();
      }}
      onClick={(e) => {
        // Clique fora do conteúdo fecha o modal
        if (e.target === ref.current) close();
      }}
    >
      <div className="modal__body">
        <button type="button" className="modal__close" onClick={close} aria-label="Fechar">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <span className="ornament ornament--small" aria-hidden="true">
          <span className="ornament__line" />✦<span className="ornament__line" />
        </span>
        <h2 className="modal__title" id="gift-title">{copy.title}</h2>
        <p className="modal__text" id="gift-text">{copy.text}</p>
        <div className="modal__actions">
          <button ref={primaryBtn} type="button" className="btn btn--marsala" onClick={openList}>
            {copy.yes}
          </button>
          <button type="button" className="btn btn--text" onClick={() => (step === 1 ? setStep(2) : close())}>
            {copy.no}
          </button>
        </div>
      </div>
    </dialog>
  );
}
