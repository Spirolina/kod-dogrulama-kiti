import { useEffect, useState } from 'react';

export function FaturaListesi() {
  const [faturalar, setFaturalar] = useState<Fatura[]>([]);

  useEffect(() => {
    fetch('/api/faturalar')
      .then(r => r.json())
      .then(setFaturalar);
  }, []);

  const odenmemis = faturalar.filter(f => !f.odendi);
  const toplam = odenmemis.reduce((a, f) => a + f.tutar, 0);

  return (
    <div>
      <h2>Toplam: {toplam.toFixed(2)} TL</h2>
      {odenmemis.map(f => (
        <div key={f.id} className={f.vade < Date.now() ? 'gecikmis' : ''}>
          {f.baslik} — {f.tutar} TL
        </div>
      ))}
    </div>
  );
}
