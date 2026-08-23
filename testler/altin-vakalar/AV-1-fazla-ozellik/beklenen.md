# Beklenen — AV-1

Test ettiği: RTM `➕` (gereksinimsiz kod), `dv-iz-denetci`.

## Üretilmesi gereken
- `R-01` (tutar ve alıcı gösterimi) → `✅`
- `R-02` (ana sayfaya dön butonu) → `✅`
- **`➕` — `TransferBasari.tsx:3` analytics olayı, hiçbir gereksinime bağlı değil**
- **`➕` — `TransferBasari.tsx:15` dekont paylaşma butonu**
- **`➕` — `TransferBasari.tsx:19` push izni isteme butonu**
- Her `➕` yanında "bu neden var?" sorusu

## Ayrıca beklenen (lens tarafı)
`L6` bulgusu: analytics olayına `aliciIban` ve `musteriNo` gönderiliyor — PII üçüncü
taraf izleme aracına çıkıyor.

## Başarısız sayılır
- `➕` satırları üretilmezse
- Push izni / paylaşma "muhtemelen istenmiştir" diye gereksinim sayılırsa
- Fiş `➕` gerekçesiz olduğu halde kapanabilir gösterilirse

## Neden önemli
İstenmeyen push izni istemek ve IBAN'ı analytics'e göndermek, eksik bir butondan
çok daha pahalı (KVKK + kullanıcı güveni).
