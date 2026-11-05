import { useMemo, useState } from 'react'
import { ChevronRight, Link2, PanelRightOpen } from 'lucide-react'
import type { GrupOzeti } from '../store'
import { cx, fmtDate, norm } from '../utils'
import { Badge, Button, SearchInput } from './ui'

type DurumFiltre = 'tumu' | 'birlesti' | 'birlesmedi'
type Siralama = 'ad' | 'bitis' | 'sayi'

export function GroupTable({ gruplar, ortakSayisi, seciliId, onYonet, onDetay }: {
  gruplar: GrupOzeti[]
  ortakSayisi: (id: number) => number
  seciliId: number | null
  onYonet: (id: number) => void
  onDetay: (id: number) => void
}) {
  const [ara, setAra] = useState('')
  const [durum, setDurum] = useState<DurumFiltre>('tumu')
  const [sira, setSira] = useState<Siralama>('ad')

  const liste = useMemo(() => {
    const q = norm(ara.trim())
    return gruplar
      .filter((g) => !q || norm(g.KAMPANYAGRUP_ADI).includes(q))
      .filter((g) => durum === 'tumu' || (durum === 'birlesti') === (ortakSayisi(g.KAMPANYAGRUP_ID) > 0))
      .sort((a, b) => sira === 'ad' ? a.KAMPANYAGRUP_ADI.localeCompare(b.KAMPANYAGRUP_ADI, 'tr')
        : sira === 'sayi' ? b.kampanyalar.length - a.kampanyalar.length
        : a.enErkenBitis.localeCompare(b.enErkenBitis))
  }, [gruplar, ara, durum, sira, ortakSayisi])

  const segment = (v: DurumFiltre, l: string) => (
    <button onClick={() => setDurum(v)} aria-pressed={durum === v}
      className={cx('px-2.5 h-8 text-[13px] font-medium rounded-[5px] transition-colors', durum === v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg')}>{l}</button>
  )

  return (
    <section className="rounded-lg border border-line bg-surface flex flex-col min-w-0" aria-labelledby="cati-baslik">
      <div className="flex flex-col gap-2.5 border-b border-line px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="cati-baslik" className="text-[15px] font-semibold">Çatı Kampanyalar</h2>
          <span className="text-xs text-muted tnum">{liste.length} / {gruplar.length} çatı</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput id="cati-ara" value={ara} onChange={setAra} placeholder="Çatı kampanya ara" className="flex-1 min-w-[180px]" />
          <div className="inline-flex rounded-md bg-surface2 p-0.5" role="group" aria-label="Birleşim durumu filtresi">
            {segment('tumu', 'Tümü')}{segment('birlesti', 'Birleşti')}{segment('birlesmedi', 'Birleşmedi')}
          </div>
          <select id="cati-sirala" value={sira} onChange={(e) => setSira(e.target.value as Siralama)} aria-label="Sıralama"
            className="h-9 rounded-md border border-line bg-surface px-2 text-fg text-[13px]">
            <option value="ad">Ada göre</option>
            <option value="bitis">En yakın bitişe göre</option>
            <option value="sayi">Kampanya sayısına göre</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[560px]">
          <thead>
            <tr className="text-muted border-b border-line bg-surface2/60">
              <th className="label-caps px-4 py-2">Çatı Kampanya Adı</th>
              <th className="label-caps px-3 py-2">En Yakın Bitiş Tarihi</th>
              <th className="label-caps px-3 py-2">Birleşim Durumu</th>
              <th className="label-caps px-4 py-2 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((g) => {
              const id = g.KAMPANYAGRUP_ID
              const birlesti = ortakSayisi(id) > 0
              const secili = id === seciliId
              return (
                <tr key={id} onClick={() => onDetay(id)}
                  className={cx('group border-b border-line last:border-0 cursor-pointer transition-colors',
                    secili ? 'bg-navy-soft/70' : 'hover:bg-surface2/70')}>
                  <td className={cx('px-4 py-2 border-l-[3px]', secili ? 'border-l-navy' : 'border-l-transparent')}>
                    <div className="font-medium flex items-center gap-1.5">
                      {g.KAMPANYAGRUP_ADI}
                      <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                  <td className="px-3 py-2 tnum text-[13px] whitespace-nowrap">{fmtDate(g.enErkenBitis)}</td>
                  <td className="px-3 py-2">
                    {birlesti ? <Badge tone="ok" dot>Birleşti</Badge> : <Badge dot>Birleşmedi</Badge>}
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
                Aramanıza uygun çatı kampanya bulunamadı.{' '}
                <button className="text-navy font-medium hover:underline" onClick={() => { setAra(''); setDurum('tumu') }}>Filtreleri temizle</button>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
