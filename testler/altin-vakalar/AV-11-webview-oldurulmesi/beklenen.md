# Beklenen — AV-11

Test ettiği: `L15` WebView öldürülmesi + `L3` yarım kalan işlem + `L16` geri tuşu.

Bağlam: bu MFE kendi bağlamında çalışıyor ve **sayfa her an sıfırdan yüklenebilir.**
Bunu denetlemiyoruz, varsayıyoruz. Denetlediğimiz şey: kodumuz buna hazır mı?

## Üretilmesi gereken
1. **Durum yalnız bellekte (P1)** — `TransferSihirbazi.tsx:2-4`
   ALINTI: `const [adim, setAdim] = useState(1);`
   SENARYO: "Adım, alıcı ve tutar sadece React state'inde. Sayfa sıfırdan yüklenirse
   (uygulamadan çıkıp dönme, tazeleme, bağlamın yeniden yaratılması) akış 1. adıma döner.
   Analiz 'kaldığı adımdan devam edebilecektir' diyor."
   Kurtarma mekanizması (kalıcı taslak, URL'de adım, native'e emanet) yok — kodda hiçbir
   yerde kalıcılaştırma çağrısı bulunmuyor.

2. **Geri tuşu uyarısı yok (P2)** — `TransferSihirbazi.tsx:7`
   SENARYO: "Geri tuşu doğrudan bir önceki adıma gidiyor; donanım geri tuşu ise WebView'ı
   kapatabilir. İki durumda da girilen tutar ve seçilen alıcı kaybolur, uyarı çıkmıyor.
   Analiz uyarı istiyor."

3. **Yarım işlem durumu (P2, L3)**
   SENARYO: "Onay adımında uygulama arka plana atılırsa işlem hangi durumda kalıyor?
   Kullanıcı geri döndüğünde işlemin gerçekleşip gerçekleşmediğini nereden anlıyor?"

## Ayrıca
RTM: "kaldığı adımdan devam" ve "geri tuşunda uyarı" gereksinimleri `❌`.

## Başarısız sayılır
- Durum kaybı bulgusu üretilmezse (vakanın ana amacı)
- "React state normaldir" diye geçilirse — bu bağlamda sıfırdan yükleme olağan durumdur
- Native'in belleği nasıl yönettiği hakkında bulgu yazılırsa (kapsam dışı)
- Geri tuşu bulgusu üretilmezse

---

## Otomasyon yargısı beklentisi  (KAPI 5.7, v1.0.0'da 5.6'dan taşındı)

Bu vakadaki senaryolar cihaz durumuna bağlı: uygulamadan çıkıp dönme, sayfanın sıfırdan
yüklenmesi, donanım geri tuşu.

Beklenen:

| Senaryo türü | Beklenen değer |
|---|---|
| "Uygulamadan çıkıp geri dönün" | `HAYIR-CIHAZ` |
| "Donanım geri tuşuna basın" | `HAYIR-CIHAZ` |
| "Sayfayı tazeleyin / yeniden yükleyin" | `EVET` — tarayıcıda `page.reload()` ile üretilebilir |

Son satır ayrımı önemli: **sayfanın yeniden yüklenmesi** lokalde üretilebilir, **cihazın
uygulamayı arka planda öldürmesi** üretilemez. İkisini aynı kefeye koyan yargı yanlıştır —
biri otomatikleşebilir bir regresyon testi, diğeri kalıcı manuel yük.

**Üçünü de `HAYIR-CIHAZ` yaparsa vaka kalır:** yargı fazla temkinli, otomatikleşebilecek
bir senaryoyu elde bırakıyor.
