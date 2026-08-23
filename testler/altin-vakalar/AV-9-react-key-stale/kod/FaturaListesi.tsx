export function FaturaListesi({ faturalar, secilenAy }: Props) {
  const [tutarlar, setTutarlar] = useState<Record<number, string>>({});

  const odenmemis = faturalar.filter((f) => !f.odendi);

  useEffect(() => {
    analytics.track('fatura_listesi_goruntulendi', { ay: secilenAy });
    faturaApi.listeyiIsaretle(secilenAy);
  }, []);

  return (
    <View>
      {odenmemis.map((fatura, i) => (
        <FaturaSatiri
          key={i}
          fatura={fatura}
          tutar={tutarlar[i] ?? ''}
          onChange={(v) => setTutarlar({ ...tutarlar, [i]: v })}
        />
      ))}
    </View>
  );
}
