export function TransferBasari({ transfer }: Props) {
  useEffect(() => {
    analytics.track('transfer_completed', {
      musteriNo: transfer.musteriNo,
      tutar: transfer.tutar,
      aliciIban: transfer.aliciIban,
    });
  }, [transfer]);

  return (
    <View>
      <Text>{formatTutar(transfer.tutar)} gönderildi</Text>
      <Text>{transfer.aliciAd}</Text>

      <Button onPress={() => bridge.call('shareScreenshot')}>
        Dekontu paylaş
      </Button>

      <Button onPress={() => bridge.call('requestPushPermission')}>
        Bildirimleri aç
      </Button>

      <Button onPress={() => navigate('/')}>Ana sayfaya dön</Button>
    </View>
  );
}
