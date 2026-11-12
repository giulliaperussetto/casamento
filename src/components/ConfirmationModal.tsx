'use client';

import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  title: string;
  text: string;
  giftText: string;
  giftButton: string;
  closeButton: string;
  giftListUrl: string;
  onClose: () => void;
};

/**
 * Popup exibido apenas depois que o servidor confirma que a resposta foi salva.
 * <dialog> nativo: foco preso no modal, ESC fecha e o foco volta ao elemento anterior.
 */
export function ConfirmationModal({ open, title, text, giftText, giftButton, closeButton, giftListUrl, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      closeBtn.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-text"
      onClose={() => {
        onClose();
        returnFocus.current?.focus?.();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="modal__body">
        <span className="modal__check" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="m6 13.5 4.5 4.5L20 8" />
          </svg>
        </span>
        <h2 className="modal__title" id="confirm-title">{title}</h2>
        <div id="confirm-text" className="modal__text">
          <p>{text}</p>
          <p>{giftText}</p>
        </div>
        <div className="modal__actions">
          <a
            className="btn-solid btn-solid--block"
            href={giftListUrl}
            onClick={() => close()}
          >
            {giftButton}
          </a>
          <button ref={closeBtn} type="button" className="btn-outline btn-solid--block" onClick={close}>
            {closeButton}
          </button>
        </div>
      </div>
    </dialog>
  );
}
