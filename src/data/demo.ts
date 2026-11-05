import type { CatiGrup, GecmisKaydi, Kampanya, PortalDurumu } from '../types'
import { pairKey, toYmd } from '../utils'

/*
 * TEMSİLİ DEMO VERİSİ. Kodlar, adlar ve tarihler örnektir; üretim ortamındaki gerçek veri değildir.
 * Gerçek entegrasyonda bu dosya, KAMPANYAGRUP ve kampanya servislerinden gelen yanıtla değiştirilir.
 */

export const CATI_GRUPLAR: CatiGrup[] = [
  { KAMPANYAGRUP_ID: 101, KAMPANYAGRUP_ADI: 'CRM Kampanyaları' },
  { KAMPANYAGRUP_ID: 102, KAMPANYAGRUP_ADI: 'Firma/Marka Kampanyaları' },
  { KAMPANYAGRUP_ID: 103, KAMPANYAGRUP_ADI: 'Kurumsal Firma İndirimi' },
  { KAMPANYAGRUP_ID: 104, KAMPANYAGRUP_ADI: 'Çatı Kampanyaları' },
  { KAMPANYAGRUP_ID: 105, KAMPANYAGRUP_ADI: 'Kart Ortaklığı Kampanyaları' },
  { KAMPANYAGRUP_ID: 106, KAMPANYAGRUP_ADI: 'Mobil Uygulama Kampanyaları' },
  { KAMPANYAGRUP_ID: 107, KAMPANYAGRUP_ADI: 'Sezon Sonu Kampanyaları' },
  { KAMPANYAGRUP_ID: 108, KAMPANYAGRUP_ADI: 'Mağaza Açılış Kampanyaları' },
  { KAMPANYAGRUP_ID: 109, KAMPANYAGRUP_ADI: 'Online Özel Kampanyalar' },
  { KAMPANYAGRUP_ID: 110, KAMPANYAGRUP_ADI: 'Hediye Çeki Kampanyaları' },
  { KAMPANYAGRUP_ID: 111, KAMPANYAGRUP_ADI: 'Sadakat Programı Kampanyaları' },
  { KAMPANYAGRUP_ID: 112, KAMPANYAGRUP_ADI: 'Öğrenci Avantaj Kampanyaları' },
  // Bu grubun altında uygun kampanya yok: portalda hiçbir listede görünmez.
  { KAMPANYAGRUP_ID: 113, KAMPANYAGRUP_ADI: 'Arşiv Dönem Kampanyaları' },
]

const KATEGORI = ['Kadın Giyim', 'Erkek Giyim', 'Ayakkabı', 'Çanta & Aksesuar', 'Kozmetik', 'Ev & Yaşam', 'Çocuk', 'Spor', 'İç Giyim', 'Saat & Gözlük']

const SABLON: Record<number, { adet: number; adlar: string[] }> = {
  101: { adet: 14, adlar: ['CRM Özel Kampanya', 'CRM Doğum Günü İndirimi', 'CRM Geri Kazanım Kampanyası', 'CRM Segment Avantajı'] },
  102: { adet: 23, adlar: ['Mavi %20 İndirim', 'Marka 3 Al 2 Öde', 'Marka Sepette %15', 'Marka 2. Ürüne %40', 'Marka Haftası Fırsatı'] },
  103: { adet: 6, adlar: ['Kurumsal Firma Avantajı', 'Kurumsal Çalışan İndirimi', 'Anlaşmalı Firma Kampanyası'] },
  104: { adet: 9, adlar: ['Çatı Genel İndirim', 'Hafta Sonu Çatı Kampanyası', 'Çatı Sepet Fırsatı'] },
  105: { adet: 11, adlar: ['Kart Ortaklığı Puan Fırsatı', 'Kart Ortaklığı Ek İndirim', 'Taksit Avantajı'] },
  106: { adet: 7, adlar: ['Uygulamaya Özel İndirim', 'İlk Uygulama Siparişi', 'Uygulama Bildirim Fırsatı'] },
  107: { adet: 18, adlar: ['Sezon Sonu %30', 'Sezon Sonu Ek İndirim', 'Sezon Sonu 2 Al 1 Öde'] },
  108: { adet: 3, adlar: ['Yeni Mağaza Açılış İndirimi'] },
  109: { adet: 12, adlar: ['Online Özel Kampanya', 'Online Sepette İndirim', 'Online Ücretsiz Kargo Fırsatı'] },
  110: { adet: 4, adlar: ['Hediye Çeki Kampanyası', 'Hediye Çeki Ek Bakiye'] },
  111: { adet: 8, adlar: ['Sadakat Seviye Avantajı', 'Sadakat Puan Katlama'] },
  112: { adet: 5, adlar: ['Öğrenci Avantajı', 'Okula Dönüş Öğrenci İndirimi'] },
  113: { adet: 4, adlar: ['Geçmiş Dönem Kampanyası'] },
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const gunEkle = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

/** Tarihler bugüne göre üretilir; böylece demo her açılışta güncel görünür. */
export function kampanyalariUret(bugun = new Date()): Kampanya[] {
  const rnd = mulberry32(20261105)
  const sonuc: Kampanya[] = []
  let id = 50000
  let kodNo = 1840
  const yil = bugun.getFullYear()
  // Bazı gruplarda tüm kampanyalar aynı tarihte biter (çatı seviyesinde tek tarih gösterilebilir).
  const ortakBitis: Record<number, number> = { 108: 45, 110: 58 }
  for (const g of CATI_GRUPLAR) {
    const s = SABLON[g.KAMPANYAGRUP_ID]
    const uygunsuzAdet = 1 + Math.floor(rnd() * 3)
    const toplam = s.adet + uygunsuzAdet
    for (let i = 0; i < toplam; i++) {
      const ad = `${s.adlar[i % s.adlar.length]} – ${KATEGORI[(i + g.KAMPANYAGRUP_ID) % KATEGORI.length]}`
      const bas = gunEkle(bugun, -Math.floor(5 + rnd() * 50))
      const bit = gunEkle(bugun, ortakBitis[g.KAMPANYAGRUP_ID] ?? Math.floor(4 + rnd() * 140))
      let aktif = true, sifreli = true, birlesebilir = true
      if (g.KAMPANYAGRUP_ID === 113) aktif = false
      else if (i >= s.adet) {
        // Filtreyi göstermek için her grupta uygun olmayan birkaç kayıt bulunur.
        const k = (i - s.adet) % 3
        if (k === 0) aktif = false; else if (k === 1) sifreli = false; else birlesebilir = false
      }
      kodNo += 1 + Math.floor(rnd() * 37)
      sonuc.push({
        kampanyaId: id++,
        KAMPANYAGRUP_ID: g.KAMPANYAGRUP_ID,
        kampanyaKodu: `EMK-${yil}-${String(kodNo).padStart(5, '0')}`,
        kampanyaAdi: ad,
        baslangicTarihi: toYmd(bas),
        bitisTarihi: toYmd(bit),
        aktif, sifreli, birlesebilir,
      })
    }
  }
  return sonuc
}

/** Portal kuralı: yalnızca aktif + şifreli + birleşebilir kampanyalar. */
export const uygunMu = (k: Kampanya) => k.aktif && k.sifreli && k.birlesebilir

const BASLANGIC_ILISKILER: [number, number][] = [
  [101, 102], [101, 105], [101, 106], [101, 104], [101, 111],
  [102, 107], [102, 109], [103, 109], [105, 107], [106, 111], [109, 106],
]

const KULLANICILAR = ['Derya Güven', 'Derya Güven', 'Derya Güven', 'Derya Güven']

export function baslangicDurumu(sayilar: Record<number, number>, bugun = new Date()): PortalDurumu {
  const gecmis: GecmisKaydi[] = []
  let sayac = 410
  const kayit = (gunOnce: number, saat: number, kaynak: number, iliskili: number, verildi: boolean, kullanici: string, islemNo?: string) => {
    const t = gunEkle(bugun, -gunOnce); t.setHours(saat, (gunOnce * 7 + kaynak) % 60, 0, 0)
    const no = islemNo ?? `İŞL-${String(++sayac).padStart(6, '0')}`
    gecmis.push({
      id: `${no}-${kaynak}-${iliskili}`,
      islemNo: no,
      tarih: t.toISOString(),
      kullanici,
      kaynakGrupId: kaynak,
      iliskiliGrupId: iliskili,
      tur: verildi ? 'IZIN_VERILDI' : 'IZIN_KALDIRILDI',
      oncekiDurum: verildi ? 'IZIN_YOK' : 'IZIN_VAR',
      yeniDurum: verildi ? 'IZIN_VAR' : 'IZIN_YOK',
      kaynakKampanyaSayisi: sayilar[kaynak] ?? 0,
      iliskiliKampanyaSayisi: sayilar[iliskili] ?? 0,
    })
    return no
  }
  // İlk kurulum: CRM grubunun ilişkileri tek işlemde tanımlanmış.
  const ilk = kayit(62, 10, 101, 102, true, KULLANICILAR[0])
  kayit(62, 10, 101, 105, true, KULLANICILAR[0], ilk)
  kayit(62, 10, 101, 106, true, KULLANICILAR[0], ilk)
  kayit(48, 14, 102, 107, true, KULLANICILAR[1])
  kayit(41, 11, 103, 110, true, KULLANICILAR[2])
  kayit(37, 9, 102, 109, true, KULLANICILAR[1])
  kayit(30, 16, 103, 109, true, KULLANICILAR[2])
  const ikinci = kayit(22, 15, 111, 106, true, KULLANICILAR[3])
  kayit(22, 15, 111, 101, true, KULLANICILAR[3], ikinci)
  kayit(15, 10, 105, 107, true, KULLANICILAR[0])
  kayit(12, 17, 103, 110, false, KULLANICILAR[2])
  kayit(6, 13, 104, 101, true, KULLANICILAR[1])
  kayit(3, 11, 109, 106, true, KULLANICILAR[3])
  gecmis.sort((a, b) => b.tarih.localeCompare(a.tarih))
  return {
    surum: 1,
    iliskiler: BASLANGIC_ILISKILER.map(([a, b]) => pairKey(a, b)),
    gecmis,
    kullanici: 'Derya Güven',
    islemSayaci: sayac,
  }
}
