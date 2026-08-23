export function TransferSihirbazi() {
  const [adim, setAdim] = useState(1);
  const [alici, setAlici] = useState<Alici | null>(null);
  const [tutar, setTutar] = useState('');

  const ileri = () => setAdim((a) => a + 1);
  const geri = () => setAdim((a) => a - 1);

  return (
    <View>
      {adim === 1 && <AliciSecimi onSelect={(a) => { setAlici(a); ileri(); }} />}
      {adim === 2 && <TutarGirisi value={tutar} onChange={setTutar} onNext={ileri} />}
      {adim === 3 && <Onay alici={alici} tutar={tutar} onBack={geri} />}
    </View>
  );
}
