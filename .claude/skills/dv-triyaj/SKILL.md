---
name: dv-triyaj
description: Koşum sonucu triyajı. Kırmızı yanan her testin sebebini kod / test / gereksinim / ortam olarak ayırır, şüpheli yeşilleri işaretler, kaçan defectleri kaydeder. Varsayılan yargı KOD BOZUK; değiştirmek kanıt ister. Ürün koduna ve test dosyalarına dokunmaz. YENİ bir task'ta koşulmalıdır.
---

# /dv-triyaj — Koşum Triyajı (Faz C)

Testler koştu. Bazıları geçti, bazıları kaldı. Bu skill **kaldıların sebebini ayırır** —
ve hiçbir şeyi düzeltmez.

Girdin Playwright'ın koşum raporu. Yargıyı sen vermezsin, `dv-triyajci` verir; senin işin
kanıt paketini **mekanik olarak** toplamak ve çıktıları birleştirmek.

## Neden ayrı task

Testi yazan bağlam kendi testini yargılayamaz: "kaymış olabilir" ile "benim yazdığım
doğruydu" arasındaki farkı göremez. `dv-curutucu`'nun `dv-celiskici`'den ayrı olmasıyla
aynı gerekçe.

Aynı sebeple: **düzelten taraf yargılayamaz.** Bu skill yargı üretir, düzeltmeyi bir
sonraki task yapar.

## Ürün koduna ve teste dokunma yasağı

Ne kaynak dosya ne test dosyası değişir. Kırmızıyı susturmak — `skip`, `fixme`, seçici
güncelleme, timeout artırma — triyaj değildir, kanıt imhasıdır.

Bitirmeden önce:

```bash
git status --porcelain | awk '{print $NF}' | grep -vE '^dogrulama/'
```

Bir satır bile dönerse **dur ve bildir.**

---

## KAPI 0 — Girdi

| Girdi | Nereden | Yoksa |
|---|---|---|
| Playwright JSON raporu | developer koşumundan | **DUR** — komutu ver, aşağıda |
| `dogrulama/<tarih>-<konu>/` | faz A çıktısı | **DUR.** Önce `/dv-dogrula` |
| `ANALISTE-GIDECEK.md` | aynı klasör | **DUR** — senaryo metinleri ve `(*)` işaretleri orada |
| `ic/otomasyon-yargisi.md` | aynı klasör | **DUR** — hangi test arıza enjeksiyonlu, oradan okunur |
| `dogrulama/kosum-gecmisi.jsonl` | önceki triyajlar | Devam et — **taban yok**, KAPI 2'ye bak |
| Test dizini | `playwright.config.*` → `testDir`, yoksa `otomasyon-testleri/` | DUR |

JSON raporu yoksa developer'a tam komutu ver:

```
PLAYWRIGHT_JSON_OUTPUT_NAME=kosum.json npx playwright test --reporter=json,html
```

**Sen koşturma.** Container ve child app'in ayakta olduğu tek yer developer'ın makinesi;
task ortamında koşum denemesi zaman kaybı ve yanıltıcı kırmızı üretir.

---

## KAPI 1 — Koşum bütünlüğü (BLOKLAYICI)

Rapordan üç şeye bak:

1. **Sağlık kontrolü geçti mi?** Geçmediyse hiçbir senaryo koşulmamıştır. Triyaj yapma:

   ```
   TRİYAJ YAPILMADI — ortam sağlık kontrolü düştü. Senaryolar hiç koşmadı.
   Kırmızıların hiçbiri bulgu değil. Ortamı kaldır, yeniden koş.
   ```

2. **Kaç test hiç koşmadı?** `ATLANDI` olanlar hesap eksikliğindendir — bulgu değildir,
   yargıya girmez, ama sayılır ve raporda durur.

3. **Rapor bu kapsama mı ait?** JSON'daki test dosyaları ile `ic/otomasyon-yargisi.md`
   içindeki `MT-xx` listesi örtüşüyor mu. Örtüşmüyorsa yanlış koşumun raporu elinde:
   dur ve söyle.

KAPI 2'nin ürettiği pakette iki satır ayrıca kontrol edilir:

| Satır | Ne demek | Ne yap |
|---|---|---|
| `Odak: ?` | Bu `MT` analist paketinde bulunamadı | Test paketteki bir senaryoya bağlanmıyor. `KACAN_MI` hesaplanamaz — yargıya gönder ama kaçan defect sayımına **alma**, bildir. |
| `O günden beri değişen: (git okunamadı)` | Taban commit'i çözülemedi | Ayırmanın en güçlü sinyali yok. Kullanıcıya söyle; commit hâlâ erişilebilir mi kontrol ettir (sığ klon / silinmiş dal). |

Bu kapı `otomasyon-sozlesmesi.md` §4'teki ağacın üst iki dalıdır. `dv-triyajci`'ye
**yalnız o ağacın alt dalına düşenler** gider — ortam ve hesap filtresini geçmiş kırmızılar.
Filtre burada uygulanmazsa her ortam arızası "bulgu" olarak yargıya girer ve rapor
yalancı çobana döner.

---

## KAPI 2 — Taban ve girdi paketi

### Taban neden zorunlu

"Kod mu bozuldu, test mi" sorusu **son yeşil bilinmeden cevaplanamaz.** Test dün yeşildi
ve kapsamdaki dosya bugün değiştiyse cevap ortadadır; test hiç yeşil olmadıysa bu bir
regresyon değil, hiç çalışmamış bir testtir. İkisi farklı aksiyona gider.

Playwright bu bilgiyi tutmaz. `dogrulama/kosum-gecmisi.jsonl` tutar — koşum başına tek
satır, append-only, **commit'lenir** (makineye özel değil, ekip ortak tabanı):

```json
{"commit":"a3f9c21","tarih":"2026-08-24","dal":"main","testler":{"MT-01":"gecti","MT-07":"kaldi"}}
```

Çakışma çözümü basit: iki taraf da satırlarını korur.

Dosya yoksa bu ilk triyajdır. **Uydurma.** Girdi paketine `Son yeşil: bilinmiyor` yaz;
`dv-triyajci` bunu görünce `TABAN-YOK` yargısı verir ve ne yapılması gerektiğini söyler.

### Paketi üret

Mekanik iş — yorum yok, tek geçiş:

```bash
node -e '
const fs=require("fs"),cp=require("child_process");
const [rap,gec,paket,cikti]=process.argv.slice(1);
const mt=s=>((s||"").match(/MT-\d+/)||[""])[0];
const j=JSON.parse(fs.readFileSync(rap,"utf8"));
const t=[];
(function w(ss){for(const s of ss||[]){
  for(const sp of s.specs||[]){for(const tt of sp.tests||[]){
    const rs=tt.results||[],son=rs[rs.length-1]||{};
    /* flaky: son deneme geçti ama önceki düştü. Playwright bunu tests[].status
       alanında verir; son sonuca bakarsak temiz yeşil görünür ve yargıya hiç
       gitmez. FLAKY yargısının tek kanıtı budur — üstünü örtme. */
    const durum = tt.status==="flaky" ? "flaky" : (son.status||tt.status||"?");
    const ilkHata=(rs.find(r=>r.error)||{}).error;
    t.push({mt:mt(s.file)||mt(sp.title),dosya:s.file||"",baslik:sp.title,
      durum,denemeler:rs.map(r=>r.status),
      hata:((ilkHata||{}).message||"").split("\n").slice(0,12).join("\n"),
      ekler:(son.attachments||[]).map(a=>a.path).filter(Boolean)});
  }}
  w(s.suites);
}})(j.suites);
let g=[];try{g=fs.readFileSync(gec,"utf8").trim().split("\n").filter(Boolean).map(JSON.parse)}catch(e){}
const sonYesil=id=>{for(let i=g.length-1;i>=0;i--)if(g[i].testler&&g[i].testler[id]==="gecti")return g[i];return null};
const dc={},degisen=c=>{if(!(c in dc)){try{dc[c]=cp.execSync(`git diff --name-only ${c}..HEAD`,{stdio:["ignore","pipe","ignore"]}).toString().trim()||"(değişiklik yok)"}catch(e){dc[c]="(git okunamadı)"}}return dc[c]};
const P=fs.existsSync(paket)?fs.readFileSync(paket,"utf8"):"";
/* (*) yalnız kendi hücresinde sayılır. Satırın herhangi bir yerinde arayan bir
   regex, Not kolonundaki bir (*) yüzünden KAÇAN defecti YAKALANAN gösterir —
   kitin kendini ölçtüğü metrik tam olarak o ayrım. */
const odak=id=>{
  const sat=P.split("\n").find(l=>new RegExp(`^\\s*\\|\\s*${id}\\s*\\|`).test(l));
  if(!sat)return "?";
  return sat.split("|").map(c=>c.trim()).includes("(*)")?"(*)":"—";
};
const say=d=>t.filter(x=>x.durum===d).length;
let o=`# Triyaj Girdisi\n\nToplam: ${t.length} · kaldı: ${say("failed")} · flaky: ${say("flaky")} · geçti: ${say("passed")} · atlandı: ${t.filter(x=>["skipped","interrupted"].includes(x.durum)).length}\n\n`;
for(const x of t){
  const sy=sonYesil(x.mt);
  o+=`---\n\n## ${x.mt||"(MT yok)"} · ${x.durum.toUpperCase()}\n\n`;
  o+=`Dosya: \`${x.dosya}\`\nBaşlık: ${x.baslik}\nOdak: ${odak(x.mt)}\n`;
  o+=`Denemeler: ${x.denemeler.join(" -> ")||"—"}\n`;
  o+=`Son yeşil: ${sy?`commit ${sy.commit} · ${sy.tarih} · dal ${sy.dal}`:"bilinmiyor"}\n`;
  o+=`O günden beri değişen:\n${sy?degisen(sy.commit).split("\n").map(l=>"  "+l).join("\n"):"  —"}\n`;
  o+=`Kanıt: ${x.ekler.join(", ")||"yok"}\n`;
  if(x.hata)o+=`\nHata (birebir):\n\`\`\`\n${x.hata}\n\`\`\`\n`;
  o+="\n";
}
fs.writeFileSync(cikti,o);
/* KAPI 5 tabanı bu yan dosyadan yazar — durum eşlemesi iki yerde türetilmez */
const H={failed:"kaldi",passed:"gecti",flaky:"flaky",skipped:"atlandi",interrupted:"atlandi"};
const durumlar={};for(const x of t)if(x.mt)durumlar[x.mt]=H[x.durum]||x.durum;
const yan=cikti.replace(/\.md$/,"-durumlar.json");
fs.writeFileSync(yan,JSON.stringify(durumlar));
console.log(`YAZILDI ${cikti} · ${t.length} test · taban eşlemesi ${yan}`);
' kosum.json dogrulama/kosum-gecmisi.jsonl \
  "dogrulama/<tarih>-<konu>/ANALISTE-GIDECEK.md" \
  "dogrulama/<tarih>-<konu>/ic/triyaj-girdisi.md"
```

**Hata metni kısaltılmaz, özetlenmez.** Playwright'ın attığı satır yargının birincil
kanıtıdır; senin özetin değil.

Paketi kullanıcıya göster. Kırmızı sayısı ve `Son yeşil: bilinmiyor` satırlarının sayısı
bir satırda:

```
Girdi paketi: 16 test · 3 kaldı · 1 atlandı · taban 2 testte yok
```

---

## KAPI 3 — Yargı

`dv-triyajci` agent'ını **test başına ayrı ayrı** çağır. Hepsini **tek mesajda, paralel.**

Kime çağrı yapılır:

| Durum | Yargılanır mı |
|---|---|
| `KALDI` (ortam ve hesap filtresini geçmiş) | **evet** |
| `FLAKY` (bir deneme düştü, sonraki geçti) | **evet** — suite yeşil raporlar, gerçek sinyal budur |
| `GEÇTİ` **ve** `ic/otomasyon-yargisi.md`'de `EVET-ARIZA` | **evet** — şüpheli yeşil kontrolü |
| `GEÇTİ` ve arıza enjeksiyonsuz | hayır |
| `ATLANDI` | hayır — hesap eksikliği, bulgu değil |

**İkinci ve üçüncü satır atlanmaz** — ikisi de yeşil raporlanan ama yeşil olmayan durumlar.

`FLAKY`: Playwright retry ile geçen testi suite özetinde başarılı sayar. Sebebi ya gerçek
bir yarış durumu (kod), ya kırılgan bekleme (test). İkisi farklı yere gider ve ikisi de
yeşil ekranın arkasında kalır.

Arıza enjeksiyonlu yeşil: test hedeflediği yola hiç girmeden geçmiş olabilir; kimse
bakmadığı için de öyle kalır. Faz A'da aynı hatayı manuel tarafta gördük — ön koşul
üretilemeyince senaryo happy path'ten geçip GEÇTİ görünüyordu.

Her dönüşte sağlık işaretini kontrol et:

- `KANITSIZ_YARGI: 1` → agent `KOD` dışına çıkıp kanıt gösterememiş. **Yargıyı `KOD`'a
  geri al** ve listeye `KANITSIZ_YARGI_DUZELTILDI` yaz.
- `DOSYA_DEGISTI: evet` ya da `TEST_KOSTURULDU: evet` → yasak ihlali. O yargıyı iptal et,
  bildir, yeniden çağır.
- `TABAN_VAR: hayır` + `YARGI: KOD` → agent tabansız kesin yargı vermiş. Kabul etme;
  `TABAN-YOK`'a çevir.

---

## KAPI 4 — Birleştirme

`ic/triyaj.md` yaz. **Mekanik** — yargı metnini değiştirme, dayanağı kısaltma, "bu zaten
belliydi" diye eleme.

```markdown
# Triyaj — <konu> · <tarih>

Koşum: <commit> · <dal> · rapor `<yol>`
16 test · 11 geçti · 3 kaldı · 1 flaky · 1 atlandı

| MT | Gereksinim | Odak | Sonuç | Yargı | Güven | Kime gider |
|---|---|---|---|---|---|---|
| MT-07 | R-02 | — | KALDI | KOD | 8 | developer |
| MT-11 | R-04 | (*) | KALDI | TEST | 9 | otomasyon |
| MT-13 | R-01 | — | FLAKY | FLAKY | 7 | sahipsiz — atanmalı |
| MT-04 | R-03 | (*) | GEÇTİ | YESIL-KANITSIZ | 7 | developer |

## Yargı dağılımı
KOD 1 · TEST 1 · GEREKSINIM 0 · ORTAM 0 · FLAKY 1 · TABAN-YOK 1
YESIL-SAGLAM 4 · YESIL-KANITSIZ 1

## Yeşil raporlanan ama yeşil olmayanlar
FLAKY 1 · YESIL-KANITSIZ 1 — suite özeti bu ikisini başarılı sayar.

## Tam yargılar
<agent bloklarının tamamı, olduğu gibi>
```

### Kendi kendini denetle

| Desen | Ne demek | Ne yap |
|---|---|---|
| `TEST` oranı > %50 | Ya suite çürümüş ya yargı gevşek | Kullanıcıya uyar; bir `TEST` yargısını elle doğrulat |
| `KOD` oranı %100 ve kırmızı > 3 | Ayırma yapılmamış olabilir | `AYIRMA_DENEMESI` alanlarını kontrol et |
| `TABAN-YOK` > 0 | Taban eksik, ayırma yapılamadı | Hangi commit'te koşulması gerektiğini yaz |
| `YESIL-KANITSIZ` > 0 | Yeşil suite yanıltıcı olabilir | Devir bloğunda öne çıkar |

---

## KAPI 5 — Deftere işleme

Üç yere yazılır:

**1. Ölçüm defteri** — `ic/analist-sonuclari.md`, `Koşan: OTOMAT` satırları güncellenir
(`otomasyon-sozlesmesi.md` §8 formatı korunur).

**2. Taban** — koşumu `dogrulama/kosum-gecmisi.jsonl`'a ekle. Durum eşlemesi KAPI 2'nin
yazdığı yan dosyadan gelir; ikinci kez türetilmez:

```bash
node -e '
const fs=require("fs"),c=require("child_process");
const [yan,gecmis]=process.argv.slice(1);
const g=s=>{try{return c.execSync(s,{stdio:["ignore","pipe","ignore"]}).toString().trim()}catch(e){return "bilinmiyor"}};
const satir={commit:g("git rev-parse --short HEAD"),
             tarih:new Date().toISOString().slice(0,10),
             dal:g("git rev-parse --abbrev-ref HEAD"),
             testler:JSON.parse(fs.readFileSync(yan,"utf8"))};
fs.appendFileSync(gecmis,JSON.stringify(satir)+"\n");
console.log(`TABAN YAZILDI ${satir.commit} · ${Object.keys(satir.testler).length} test`);
' "dogrulama/<tarih>-<konu>/ic/triyaj-girdisi-durumlar.json" \
  dogrulama/kosum-gecmisi.jsonl
```

`commit: bilinmiyor` çıkarsa satırı **yazma** — tabansız bir taban satırı, sonraki
triyajda yanlış commit'e diff çektirir. Git'in neden okunamadığını bildir.

Kırmızı koşum da yazılır. Geçmiş yalnız yeşilleri tutarsa "hiç yeşil olmadı" ile "hiç
koşmadı" ayrımı kaybolur.

**3. Kaçan defect** — `KACAN_MI: evet` olan her yargı için `dogrulama/kacan-defectler.md`'ye
tek satır: hangi `MT`, hangi `R-xx`, hangi mercek kaçırdı, neden. `(*)` işaretliler
buraya **girmez** — onlar yakalanan defecttir, sistem çalışmıştır.

---

## KAPI 6 — Devir

```
TRİYAJ TAMAMLANDI · 16 test · <n> dk

Koşum     11 geçti · 3 kaldı · 1 flaky · 1 atlandı
Yargı     KOD 1 · TEST 1 · FLAKY 1 · TABAN-YOK 1
Yeşil     4 sağlam · 1 KANITSIZ
Yanıltan  2 test yeşil raporlandı ama yeşil değil (1 flaky · 1 kanıtsız)
Kaçan     1 defect (MT-07 / R-02) — kacan-defectler.md'ye yazıldı

Sırada:
1. MT-07 (KOD) — developer düzeltir; oturumBootstrap.ts:4-9
2. MT-11 (TEST) — otomasyon düzeltir, ayrı task; seçici kaymış
3. MT-13 (FLAKY) — sahibi yok, ata; atanmazsa üç koşum sonra görmezden gelinir
4. MT-09 (TABAN-YOK) — commit <x>'te bir kez koş, taban kur
5. MT-04 (YESIL-KANITSIZ) — trace ile enjeksiyonun tuttuğunu doğrula
```

Sağlık işareti eksikse ya da KAPI 1 düştüyse **kapanış yerine:**

```
TRİYAJ TAMAMLANMADI
Sebep: <hangi kapı, hangi işaret>
Yargılar güvenilmez. Yeniden koş.
```

---

## Bu skill'in yasakları

1. **Yargı üretme.** Kırmızının sebebini gördüğünü sansan bile yazma. Orkestrasyon senin işin.
2. **Testi koşturma.** Ne triyaj için ne "bir daha deneyelim" için.
3. **Ürün kodu ya da test dosyası değiştirme.** Tek satır bile.
4. **Kırmızıyı susturma.** `skip`, `fixme`, timeout artırma — hiçbiri.
5. **Ortam arızasını bulgu sayma.** KAPI 1 filtresi atlanmaz.
6. **Yeşili sorgusuz kabul etme.** Arıza enjeksiyonlu her yeşil yargıya gider.
7. **Tabansız kesin yargı.** `Son yeşil: bilinmiyor` ise cevap `TABAN-YOK`'tur, `KOD` değil.
