<!--
  Bu dosya ÜRÜN REPOSUNUN köküne konur (CLAUDE.md olarak).
  Repoda zaten CLAUDE.md varsa: silme, aşağıdaki bloğu sonuna EKLE.

  Neden var: task tabanlı ortamda notun skill'i tetiklemesi garanti değil.
  CLAUDE.md her task'ta otomatik yüklenir — güvenlik ağı.

  Neden bu kadar kısa: bu dosya KODLAMA task'larında da yüklenir. Kodlama akışına
  dokunmuyoruz. Bu yüzden tamamı koşullu ve kısa tutulmuştur.
-->

## Doğrulama görevleri

Görev notunda **doğrulama** isteniyorsa (`/dv-dogrula`, "doğrula", "RTM çıkar",
"analize göre kontrol et"), aşağıdakiler geçerlidir. Kodlama görevlerinde bu bölüm
uygulanmaz, yok say.

1. `.claude/skills/dv-dogrula/SKILL.md` dosyasını oku ve oradaki kapıları sırayla uygula.
   Kendi doğrulama yöntemini uydurma.

2. **Ürün kodunda tek satır değişiklik yapma.** Bulgu bulsan bile düzeltme; test yazma;
   format/lint/import düzenlemesi yapma. Yazma izni olan tek yer:
   `dogrulama/<tarih>-<konu>/` klasörü — çıktını oraya yazıp commit'leyeceksin,
   teslim yolun bu.

   Sebep: düzelten taraf doğrulayamaz. Bulguyu düzeltirsen sonraki kapılar senin yazdığın
   kodu kontrol eder ve bağımsızlık zinciri kırılır.

3. Plan aşamasında **kapsamı** göster ve onaylat: hangi dosyalar dahil, hangileri değil,
   hangilerinden emin değilsin. Kapsam yanlışsa sistem yanlış kod üzerinde kusursuz
   çalışır ve tertemiz bir rapor üretir.

4. Doğrulama ile kodlama **aynı task'ta olmaz.** Not ikisini birden istiyorsa dur ve
   söyle; ayrı task'lar iste.

5. Sonucu `dogrulama/<tarih>-<konu>/` altına yaz ve **commit'le.** Commit'lenmeyen dosya
   task bitince kaybolur.
