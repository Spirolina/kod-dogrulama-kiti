# Beklenen — AV-10

Test ettiği: `L15` çoklu WebView sınırı + `L6` token yeri + `L5` hata yönetimi.

Bağlam: her MFE **kendi bağlamında** başlıyor. Bulgu native tarafın depolamayı nasıl
paylaştığı hakkında değil — **bizim kodumuzun temelsiz bir varsayım yapması** hakkında:
`auth_token` anahtarını okuyoruz ama kodumuzda hiçbir yer onu yazmıyor.

## Üretilmesi gereken
1. **Oturum web tarafından okunuyor (P1)** — `oturumBootstrap.ts:2`
   ALINTI: `const token = localStorage.getItem('auth_token');`
   SENARYO: "Kredi MFE'si ayrı bir WebView'da açılıyor. `localStorage` o bağlama ve origin'e
   ait; ana uygulamanın yazdığı token burada bulunmayabilir. Müşteri 'Kredilerim'e
   tıkladığında login ekranına düşer — analiz açıkça 'yeniden giriş yapmak zorunda
   kalmayacaktır' diyor."
   Doğrusu: her WebView açılışında native'den köprüyle almak.
   **Güven 8-9 olmalı** ve kanıtı repoda aranabilir: `grep auth_token` — bu anahtarı
   **yazan** bir satır var mı? Yoksa varsayım temelsizdir ve bulgu kesindir.
   "Native paylaşıyor olabilir" gerekçesiyle güven düşürmek yanlıştır: düzeltme bizim
   repomuzda (köprüden al) ve varsayım kodumuzda.

2. **Hata yolu yok (P1)** — `oturumBootstrap.ts:4-7`
   SENARYO: "Token bulunamazsa doğrudan `/login`'e yönlendiriliyor. Analiz 'anlaşılır hata
   mesajı ve tekrar deneme' istiyor. Kullanıcı ne olduğunu anlamadan login ekranında buluyor
   kendini."

3. **Token web tarafında saklanıyor (P2, L6)**
   SENARYO: "Token `localStorage`'da tutuluyor; XSS ile okunabilir ve cihaz ele geçirilirse
   çıkarılabilir. Bu mimaride zaten çalışmayacağı için doğru yer native taraf."

## Manuel senaryo
Güven yüksek olduğu için köprüden geçmese de RTM'den doğal bir senaryo çıkmalı:
> "Uygulamaya giriş yapın, sonra Kredilerim sekmesine girin. Yeniden giriş yapmanız
> isteniyor mu?"

## Ayrıca
RTM: "oturum alınamazsa anlaşılır hata + tekrar deneme" gereksinimi `❌`.

## Başarısız sayılır
- `localStorage` bulgusu üretilmezse (vakanın ana amacı)
- Bulgu "native paylaşıyor olabilir" denip güven 4-5'e düşürülürse — varsayım bizim
  kodumuzda, düzeltme bizim repomuzda
- Native tarafın davranışı hakkında bulgu yazılırsa (kapsam dışı)
