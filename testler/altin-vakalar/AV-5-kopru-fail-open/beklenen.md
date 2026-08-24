# Beklenen — AV-5

Test ettiği: `L14` köprü + `L11` fallback yönü + `L5` hata yönetimi. Üç ayrı bulgu.

## Üretilmesi gereken
1. **Fail-open (P1)** — `cihazGuvenlik.ts:10` `return true;`
   SENARYO: "Köprü çağrısı hata verirse `true` döner, işlem devam eder. Analiz 'kontrol
   yapılamazsa işlem başlatılmaz' diyor. Root'lu cihazda transfer açılır."
   Para akışında fail-open her zaman P1.

2. **Platform kontrolü yok (P1)** — `window.webkit.messageHandlers` doğrudan kullanılıyor
   SENARYO: "Android'de `window.webkit` yoktur. `catch` bloğu yakalar ve `true` döner —
   yani **Android'in tamamında güvenlik kontrolü hiç çalışmaz ve sessizce geçer.**
   Ayrıca normal tarayıcıda ve eski native sürümde aynı sonuç."

3. **Cevap gelmezse (P2)** — `postMessage` sonucu beklenmiyor/zaman aşımı yok
   SENARYO: "Native cevap vermezse promise hiç çözülmez, kullanıcı sonsuz bekler."

4. **Yutulan hata (P2)** — `console.log` ile yutma, izleme yok, prod'da görünmez

## Ayrıca
RTM: "kontrol yapılamazsa işlem başlatılmaz" gereksinimi `❌` — kod tersini yapıyor.

## Başarısız sayılır
- Fail-open bulgusu üretilmezse (vakanın ana amacı)
- **Android'de hiç çalışmadığı** bulgusu üretilmezse (ikinci amacı)
- `return true` "makul varsayılan" diye normal karşılanırsa

---

## Otomasyon yargısı beklentisi  (KAPI 5.6, v0.8.0)

Bu vaka köprü çağrısının `catch` içinde `true` dönmesiyle ilgili — yani **native köprünün
kendi davranışı.**

Beklenen: köprüden doğan `(*)` senaryosu için `HAYIR-CIHAZ` ya da yapısal-elle bir değer.

Gerekçede **köprünün gerçek davranışının lokalde üretilemediği** geçmeli: container app
native kabuğun yerine geçiyor, kabuğun kendisi yok.

**`EVET` çıkarsa vaka kalır.** Container app üzerinden koşan bir test, native köprünün
gerçekten fail-open olup olmadığını söyleyemez; yeşil test sahte güven üretir.

**Not:** servis hatası senaryolarıyla karıştırma. Servisin 500 dönmesi `EVET-ARIZA`'dır
(arıza enjeksiyonuyla üretilebilir). Native köprünün kendi davranışı değildir.
