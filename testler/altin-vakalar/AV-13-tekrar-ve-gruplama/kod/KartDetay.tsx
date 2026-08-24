import React, { useState } from 'react';

export function KartDetay({ kalanLimit }: { kalanLimit: number }) {
  const [tutar, setTutar] = useState('');
  const [mesaj, setMesaj] = useState('');

  function harca() {
    const t = Number(tutar);
    if (t > kalanLimit) {
      setMesaj('Limit yetersiz');
      setTutar('');
      return;
    }
    setMesaj('İşlem tamam');
  }

  return (
    <div>
      <span aria-label="Kalan limit">{kalanLimit}</span>
      {kalanLimit === 0 && <div role="status">Limitiniz doldu</div>}
      <input aria-label="Tutar" value={tutar} onChange={(e) => setTutar(e.target.value)} />
      <button onClick={harca}>Harca</button>
      {mesaj && <div role="alert">{mesaj}</div>}
    </div>
  );
}
