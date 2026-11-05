# Şifreli Kampanya Birleşim Yönetim Portalı (Prototip)

Çatı kampanyalar arasında birleşim izni verme, izni kaldırma ve işlem geçmişini izleme prototipi.
React 18 + TypeScript + Tailwind CSS + @dnd-kit. Veriler temsilidir (`src/data/demo.ts`); gerçek servislere bağlanmaz.
Değişiklikler tarayıcının localStorage alanında saklanır; her kullanıcı kendi tarayıcısında ayrı bir demo durumu görür.

## Yerelde çalıştırma
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ klasörü (yayın için)
npm run build:single  # dist-single/index.html (tek dosya, Artifact için)
```
Node 18 veya üstü gerekir.

## Vercel ile yayınlama
**Seçenek A, GitHub üzerinden (önerilen):**
1. Bu klasörü yeni bir GitHub deposuna yükleyin.
2. vercel.com → *Add New… → Project* → depoyu seçin.
3. Ayarlar `vercel.json` içinden otomatik gelir (Framework: Vite, Build: `npm run build`, Output: `dist`). *Deploy*'a basın.
4. Vercel size `https://<proje-adı>.vercel.app` adresini verir.

**Seçenek B, komut satırı:**
```bash
npm i -g vercel
vercel          # ilk seferde hesap ve proje sorulur
vercel --prod   # kalıcı üretim adresi
```

## Netlify ile yayınlama
**Seçenek A, sürükle-bırak (en hızlısı):** `npm install && npm run build` çalıştırın, ardından
app.netlify.com/drop sayfasına `dist` klasörünü sürükleyin. Netlify anında bir adres verir.

**Seçenek B, GitHub üzerinden:** app.netlify.com → *Add new site → Import an existing project* → depoyu seçin.
Ayarlar `netlify.toml` içinden gelir (Build: `npm run build`, Publish: `dist`).

**Seçenek C, komut satırı:**
```bash
npm i -g netlify-cli
netlify deploy --build          # önizleme adresi
netlify deploy --build --prod   # kalıcı adres
```

## Erişimi kısıtlama
Yayınlanan adres varsayılan olarak herkese açıktır. Yalnızca ekibin erişmesi için Vercel'de
*Settings → Deployment Protection*, Netlify'da *Site configuration → Access control (Password protection)* kullanılabilir
(bazı planlarda ücretlidir).

## Gerçek veriye geçiş
`src/data/demo.ts` yerine kampanya servisinden `KAMPANYAGRUP_ID`, `KAMPANYAGRUP_ADI` ve alt kampanya listesini getiren
bir katman, `src/store.ts` içindeki `kaydet` fonksiyonu yerine de birleşim izni API çağrısı konulmalıdır.
Uygunluk kuralı (aktif + şifreli + birleşebilir) `uygunMu` fonksiyonundadır.
