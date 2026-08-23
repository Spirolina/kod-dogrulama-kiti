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
