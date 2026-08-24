import { useState } from 'react';

export function OdemeEkrani({ faturaId }: { faturaId: string }) {
  const [tutar, setTutar] = useState('');
  const [hata, setHata] = useState('');

  async function ode() {
    if (!tutar) { setHata('Tutar giriniz'); return; }
    try {
      await fetch('/api/odeme', {
        method: 'POST',
        body: JSON.stringify({ faturaId, tutar }),
      });
    } catch {
      setHata('İşleminiz tamamlanamadı, lütfen tekrar deneyiniz');
      setTutar('');
    }
  }

  return (
    <>
      <input aria-label="Tutar" value={tutar} onChange={e => setTutar(e.target.value)} />
      {hata && <p role="alert">{hata}</p>}
      <button onClick={ode}>Öde</button>
    </>
  );
}
