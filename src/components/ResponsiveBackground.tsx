import { getImageProps } from 'next/image';
import type { CSSProperties } from 'react';
import type { ResponsiveImage } from '@/config/wedding';

type Props = {
  image: ResponsiveImage;
  /** true apenas para a primeira dobra (hero). Demais imagens usam lazy loading. */
  priority?: boolean;
  sizes?: string;
  className?: string;
  decorative?: boolean;
};

/**
 * Imagem estática com comportamento de `background-size: cover`.
 * Usa <picture> para servir uma versão diferente em celular e desktop,
 * com otimização automática (AVIF/WebP) e enquadramento configurável.
 */
export function ResponsiveBackground({ image, priority = false, sizes = '100vw', className, decorative }: Props) {
  const common = { alt: decorative ? '' : image.alt, fill: true, sizes, quality: 78, priority } as const;
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...common, src: image.desktop });
  const { props: mobile } = getImageProps({ ...common, src: image.mobile ?? image.desktop });

  const style = {
    ...mobile.style,
    '--pos-m': image.positionMobile ?? 'center',
    '--pos-d': image.positionDesktop ?? 'center',
  } as CSSProperties;

  return (
    <picture className={['media', className].filter(Boolean).join(' ')}>
      <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img {...mobile} className="media__img" style={style} aria-hidden={decorative || undefined} />
    </picture>
  );
}
