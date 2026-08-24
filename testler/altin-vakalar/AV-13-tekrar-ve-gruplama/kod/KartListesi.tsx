import React, { useEffect, useState } from 'react';

type Kart = {
  id: string;
  son4: string;
  tip: string;
  bloke: boolean;
  firmaAdi?: string;
};

export function KartListesi({ musteriTipi }: { musteriTipi: string }) {
  const [kartlar, setKartlar] = useState<Kart[]>([]);
  const [hata, setHata] = useState('');

  useEffect(() => {
    fetch('/api/kartlar')
      .then((r) => r.json())
      .then(setKartlar)
      .catch(() => setKartlar([]));
  }, []);

  return (
    <div>
      {hata && <div role="alert">{hata}</div>}
      <ul>
        {kartlar.map((k) => (
          <li key={k.id} className={k.bloke ? 'gri' : ''}>
            <span aria-label="Kart tipi">{k.tip}</span>
            <span aria-label="Son dört hane">{k.son4}</span>
            {k.bloke && <span>Bloke</span>}
            <span aria-label="Firma">{k.firmaAdi}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
