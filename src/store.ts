import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATI_GRUPLAR, baslangicDurumu, kampanyalariUret, uygunMu } from './data/demo'
import type { CatiGrup, GecmisKaydi, Kampanya, PortalDurumu } from './types'
import { pairKey } from './utils'

const ANAHTAR = 'sifreli-kampanya-birlesim-portali:v2'

function oku(): PortalDurumu | null {
  try {
    const ham = localStorage.getItem(ANAHTAR)
    if (!ham) return null
    const d = JSON.parse(ham) as PortalDurumu
    return d && d.surum === 1 && Array.isArray(d.iliskiler) && Array.isArray(d.gecmis) ? d : null
  } catch { return null }
}
function yaz(d: PortalDurumu) {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(d)) } catch { /* depolama kapalı olabilir */ }
}

export interface GrupOzeti extends CatiGrup {
  kampanyalar: Kampanya[] // yalnızca uygun alt kampanyalar
  enErkenBitis: string
  enGecBitis: string
}

export function usePortal() {
  const tumKampanyalar = useMemo(() => kampanyalariUret(), [])
  const gruplar = useMemo<GrupOzeti[]>(() => {
    return CATI_GRUPLAR.map((g) => {
      const k = tumKampanyalar.filter((x) => x.KAMPANYAGRUP_ID === g.KAMPANYAGRUP_ID && uygunMu(x))
        .sort((a, b) => a.bitisTarihi.localeCompare(b.bitisTarihi))
      return { ...g, kampanyalar: k, enErkenBitis: k[0]?.bitisTarihi ?? '', enGecBitis: k[k.length - 1]?.bitisTarihi ?? '' }
    }).filter((g) => g.kampanyalar.length > 0) // uygun kampanyası olmayan çatı portalda yer almaz
  }, [tumKampanyalar])
  const sayilar = useMemo(() => Object.fromEntries(gruplar.map((g) => [g.KAMPANYAGRUP_ID, g.kampanyalar.length])), [gruplar])

  const [durum, setDurum] = useState<PortalDurumu>(() => oku() ?? baslangicDurumu(sayilar))
  useEffect(() => { yaz(durum) }, [durum])

  const gecerliIdler = useMemo(() => new Set(gruplar.map((g) => g.KAMPANYAGRUP_ID)), [gruplar])
  const iliskiSet = useMemo(() => new Set(durum.iliskiler), [durum.iliskiler])

  const ortaklar = useCallback((id: number) => {
    const s = new Set<number>()
    for (const g of gecerliIdler) if (g !== id && iliskiSet.has(pairKey(id, g))) s.add(g)
    return s
  }, [gecerliIdler, iliskiSet])

  const kaydet = useCallback((kaynak: number, eklenen: number[], kaldirilan: number[]) => {
    let islemNo = ''
    setDurum((d) => {
      const sayac = d.islemSayaci + 1
      islemNo = `İŞL-${String(sayac).padStart(6, '0')}`
      const tarih = new Date().toISOString()
      const iliskiler = new Set(d.iliskiler)
      const yeni: GecmisKaydi[] = []
      const ekle = (hedef: number, verildi: boolean) => {
        yeni.push({
          id: `${islemNo}-${kaynak}-${hedef}`, islemNo, tarih, kullanici: d.kullanici,
          kaynakGrupId: kaynak, iliskiliGrupId: hedef,
          tur: verildi ? 'IZIN_VERILDI' : 'IZIN_KALDIRILDI',
          oncekiDurum: verildi ? 'IZIN_YOK' : 'IZIN_VAR', yeniDurum: verildi ? 'IZIN_VAR' : 'IZIN_YOK',
          kaynakKampanyaSayisi: sayilar[kaynak] ?? 0, iliskiliKampanyaSayisi: sayilar[hedef] ?? 0,
        })
      }
      for (const h of eklenen.filter((x) => x !== kaynak)) { iliskiler.add(pairKey(kaynak, h)); ekle(h, true) }
      for (const h of kaldirilan.filter((x) => x !== kaynak)) { iliskiler.delete(pairKey(kaynak, h)); ekle(h, false) }
      // Geçmiş yalnızca büyür: yeni kayıtlar başa eklenir, eskiler hiç değiştirilmez.
      return { ...d, iliskiler: [...iliskiler], gecmis: [...yeni, ...d.gecmis], islemSayaci: sayac }
    })
    return islemNo
  }, [sayilar])

  const kullaniciDegistir = useCallback((ad: string) => setDurum((d) => ({ ...d, kullanici: ad })), [])
  const sifirla = useCallback(() => setDurum(baslangicDurumu(sayilar)), [sayilar])

  const grupAdi = useCallback((id: number) => CATI_GRUPLAR.find((g) => g.KAMPANYAGRUP_ID === id)?.KAMPANYAGRUP_ADI ?? '—', [])

  return { gruplar, durum, ortaklar, kaydet, kullaniciDegistir, sifirla, grupAdi }
}
export type Portal = ReturnType<typeof usePortal>
