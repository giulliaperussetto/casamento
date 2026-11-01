/** Renderiza trechos entre *asteriscos* em itálico de destaque. */
export function Emph({ text, className = 'emph' }: { text: string; className?: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((part, i) =>
        part.startsWith('*') && part.endsWith('*') ? (
          <em key={i} className={className}>
            {part.slice(1, -1)}
          </em>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function Eyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`kicker${light ? ' kicker--light' : ''}`}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M7 0v14M0 7h14M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1" />
      </svg>
      {children}
    </p>
  );
}

export function Arrow({ dir = 'right' }: { dir?: 'right' | 'down' | 'out' }) {
  const d = { right: 'M2 8h12M9 3l5 5-5 5', down: 'M8 2v12M3 9l5 5 5-5', out: 'M4 12 12 4M5 4h7v7' }[dir];
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
