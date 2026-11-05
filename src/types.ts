/** Çatı kampanya grubu (mevcut sistemdeki KAMPANYAGRUP tablosu). ID ekranda gösterilmez. */
export interface CatiGrup {
  KAMPANYAGRUP_ID: number
  KAMPANYAGRUP_ADI: string
}

/** Alt kampanya. `kampanyaId` yalnızca veri modelinde tutulur, ekranda gösterilmez. */
export interface Kampanya {
  kampanyaId: number
  KAMPANYAGRUP_ID: number
  kampanyaKodu: string
  kampanyaAdi: string
  baslangicTarihi: string // YYYY-MM-DD
  bitisTarihi: string // YYYY-MM-DD
  aktif: boolean
  sifreli: boolean
  birlesebilir: boolean
}

export type IslemTuru = 'IZIN_VERILDI' | 'IZIN_KALDIRILDI'
export type IliskiDurumu = 'IZIN_YOK' | 'IZIN_VAR'

export interface GecmisKaydi {
  id: string
  islemNo: string
  tarih: string // ISO
  kullanici: string
  kaynakGrupId: number
  iliskiliGrupId: number
  tur: IslemTuru
  oncekiDurum: IliskiDurumu
  yeniDurum: IliskiDurumu
  kaynakKampanyaSayisi: number
  iliskiliKampanyaSayisi: number
}

export interface PortalDurumu {
  surum: 1
  iliskiler: string[] // "küçükId|büyükId"
  gecmis: GecmisKaydi[]
  kullanici: string
  islemSayaci: number
}
