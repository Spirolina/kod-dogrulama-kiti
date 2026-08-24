# Analiz — Fatura Ödeme Hatırlatıcısı

## Gereksinimler

**R-01** Kullanıcı fatura listesini açtığında, ödenmemiş faturalar üstte listelenecektir.

**R-02** Ödeme ekranında tutar alanı boş bırakılırsa "Tutar giriniz" uyarısı görünecektir.

**R-03** Ödeme sırasında servis yanıt vermezse kullanıcıya "İşleminiz tamamlanamadı,
lütfen tekrar deneyiniz" mesajı gösterilecek ve tutar alanı korunacaktır.

**R-04** Son ödeme tarihi geçmiş faturalar kırmızı renkte gösterilecektir.

**R-05** Kullanıcı ödeme yaptıktan sonra fatura listesine döndüğünde, ödenen fatura
listeden kalkacaktır.

**R-06** Gece 00:00'dan sonra, o gün vadesi dolan faturalar "bugün son gün" etiketi
alacaktır.

**R-07** Toplam ödenmemiş tutar ekranın üstünde gösterilecektir. Tutarların toplamı
kuruş farkı oluşturmadan hesaplanacaktır.
