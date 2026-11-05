import { useMemo, useState } from 'react'
import { ChevronRight, Link2, PanelRightOpen } from 'lucide-react'
import type { GrupOzeti } from '../store'
import { cx, daysUntil, norm } from '../utils'
import { Badge, Button, SearchInput } from './ui'
import { Gecerlilik } from './Gecerlilik'

type DurumFiltre = 'tumu' | 'izinli' | 'izinsiz'
type Siralama = 'ad' | 'sayi' | 'bitis'

export function GroupTable({ gruplar, ortakSayisi, seciliId, taslakSayisi, onYonet, onDetay }: {
  gruplar: GrupOzeti[]
  ortakSayisi: (id: number) => number
  seciliId: number | null
  taslakSayisi: number
  onYonet: (id: number) => void
  onDetay: (id: number) => void
}) {
  const [ara, setAra] = useState('')
  const [durum, setDurum] = useState<DurumFiltre>('tumu')
  const [yakinda, setYakinda] = useState(false)
  const [sira, setSira] = useState<Siralama>('ad')

  const liste = useMemo(() => {
    const q = norm(ara.trim())
    return gruplar
      .filter((g) => !q || norm(g.KAMPANYAGRUP_ADI).includes(q))
      .filter((g) => durum === 'tumu' || (durum === 'izinli' ? ortakSayisi(g.KAMPANYAGRUP_ID) > 0 : ortakSayisi(g.KAMPANYAGRUP_ID) === 0))
      .filter((g) => !yakinda || g.kampanyalar.some((k) => daysUntil(k.bitisTarihi) <= 14))
      .sort((a, b) => sira === 'ad' ? a.KAMPANYAGRUP_ADI.localeCompare(b.KAMPANYAGRUP_ADI, 'tr')
        : sira === 'sayi' ? b.kampanyalar.length - a.kampanyalar.length
        : a.enErkenBitis.localeCompare(b.enErkenBitis))
  }, [gruplar, ara, durum, yakinda, sira, ortakSayisi])

  const filtreVar = ara || durum !== 'tumu' || yakinda
  const segment = (v: DurumFiltre, l: string) => (
    <button onClick={() => setDurum(v)} aria-pressed={durum === v}
      className={cx('px-2.5 h-8 text-[13px] font-medium rounded-[5px] transition-colors', durum === v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg')}>{l}</button>
  )

  return (
    <section className="rounded-lg border border-line bg-surface flex flex-col min-w-0" aria-labelledby="cati-baslik">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="cati-baslik" className="text-[15px] font-semibold">Çatı Kampanyalar</h2>
          <span className="text-xs text-muted tnum">{liste.length} / {gruplar.length} çatı</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput id="cati-ara" value={ara} onChange={setAra} placeholder="Çatı kampanya ara" className="flex-1 min-w-[180px]" />
          <div className="inline-flex rounded-md bg-surface2 p-0.5" role="group" aria-label="Birleşim durumu filtresi">
            {segment('tumu', 'Tümü')}{segment('izinli', 'İzinli')}{segment('izinsiz', 'İzinsiz')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input id="yakinda-biten" type="checkbox" checked={yakinda} onChange={(e) => setYakinda(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--navy))]" />
            14 gün içinde biten kampanyası olanlar
          </label>
          <label className="inline-flex items-center gap-2 ml-auto text-muted">
            Sırala
            <select id="cati-sirala" value={sira} onChange={(e) => setSira(e.target.value as Siralama)}
              className="h-8 rounded-md border border-line bg-surface px-2 text-fg text-[13px]">
              <option value="ad">Ada göre</option>
              <option value="sayi">Kampanya sayısına göre</option>
              <option value="bitis">En yakın bitişe göre</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="text-muted border-b border-line bg-surface2/60">
              <th className="label-caps px-4 py-2.5">Çatı Kampanya Adı</th>
              <th className="label-caps px-3 py-2.5">Geçerlilik</th>
              <th className="label-caps px-3 py-2.5">Birleşim Durumu</th>
              <th className="label-caps px-4 py-2.5 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((g) => {
              const id = g.KAMPANYAGRUP_ID
              const n = ortakSayisi(id)
              const secili = id === seciliId
              return (
                <tr key={id} onClick={() => onDetay(id)}
                  className={cx('group border-b border-line last:border-0 cursor-pointer transition-colors',
                    secili ? 'bg-navy-soft/70' : 'hover:bg-surface2/70')}>
                  <td className={cx('px-4 py-3 align-top border-l-[3px]', secili ? 'border-l-navy' : 'border-l-transparent')}>
                    <div className="font-medium text-[14px] flex items-center gap-1.5">
                      {g.KAMPANYAGRUP_ADI}
                      <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-xs text-muted mt-0.5 tnum">{g.kampanyalar.length} uygun alt kampanya</div>
                  </td>
                  <td className="px-3 py-3 align-top"><Gecerlilik g={g} /></td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-col items-start gap-1">
                      {n > 0 ? <Badge tone="ok" dot>{n} çatı ile izinli</Badge> : <Badge dot>İzin tanımlı değil</Badge>}
                      {secili && taslakSayisi > 0 && <Badge tone="warn">{taslakSayisi} kaydedilmemiş değişiklik</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant={secili ? 'primary' : 'secondary'} onClick={() => onYonet(id)} aria-pressed={secili}
                        title="Bu çatının birleşim izinlerini yönet">
                        <Link2 size={14} />{secili ? 'Seçili' : 'Yönet'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDetay(id)} title="Alt kampanyalar ve işlem geçmişi" aria-label={`${g.KAMPANYAGRUP_ADI} detayını aç`}>
                        <PanelRightOpen size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {liste.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">
                Aramanıza uygun çatı kampanya bulunamadı.
                {filtreVar && <> <button className="text-navy font-medium hover:underline" onClick={() => { setAra(''); setDurum('tumu'); setYakinda(false) }}>Filtreleri temizle</button></>}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
        Listede yalnızca aktif, şifreli ve birleşebilir alt kampanyası bulunan çatılar yer alır. Satıra tıklayarak alt kampanyaları ve işlem geçmişini açabilirsiniz.
      </p>
    </section>
  )
}
