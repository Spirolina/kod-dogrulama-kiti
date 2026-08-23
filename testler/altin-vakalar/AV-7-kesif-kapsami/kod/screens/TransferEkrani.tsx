export function TransferEkrani() {
  const { kontrolEt } = useLimitKontrol();
  const [tutar, setTutar] = useState('');

  const onayla = async () => {
    const sonuc = kontrolEt(Number(tutar));
    if (!sonuc.izinVar) return setHata(sonuc.mesaj);
    await transferApi.baslat({ tutar: Number(tutar) });
  };

  return <TutarGirisi value={tutar} onChange={setTutar} onSubmit={onayla} />;
}
