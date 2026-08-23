export const transferApi = {
  gunlukToplam: () => http.get<number>('/transfer/gunluk-toplam'),
  baslat: (body: TransferIstek) => http.post('/transfer', body),
};
