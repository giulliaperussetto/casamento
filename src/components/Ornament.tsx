/** Pequeno detalhe dourado estático usado como divisória. */
export function Ornament({ className }: { className?: string }) {
  return (
    <span className={['ornament', className].filter(Boolean).join(' ')} aria-hidden="true">
      <span className="ornament__line" />
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 0.8 L8.4 5.6 L13.2 7 L8.4 8.4 L7 13.2 L5.6 8.4 L0.8 7 L5.6 5.6 Z" fill="currentColor" />
      </svg>
      <span className="ornament__line" />
    </span>
  );
}
