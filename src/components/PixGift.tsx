import QRCode from 'qrcode';
import { wedding } from '@/config/wedding';
import { PixCopy } from './PixCopy';

/** Bloco de Pix: QR Code gerado no servidor + botão de copiar o código. */
export async function PixGift() {
  const { pix } = wedding.gifts;
  const svg = await QRCode.toString(pix.code, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#2E141B', light: '#FFFFFF' },
  });
  return (
    <aside className="pix" id="pix" aria-labelledby="pix-titulo">
      <div className="pix__qr" role="img" aria-label="QR Code do Pix" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="pix__body">
        <h3 className="pix__title" id="pix-titulo">{pix.title}</h3>
        <p className="pix__text">{pix.text}</p>
        <PixCopy code={pix.code} />
        <p className="pix__meta">
          Chave Pix: <strong>{pix.key}</strong>
          <br />
          {pix.holder}
        </p>
      </div>
    </aside>
  );
}
