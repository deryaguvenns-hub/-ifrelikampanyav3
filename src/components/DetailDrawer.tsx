import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowDownUp, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Link2, X } from 'lucide-react'
import type { GrupOzeti } from '../store'
import type { GecmisKaydi, IliskiDurumu } from '../types'
import { cx, daysUntil, fmtDate, fmtDateTime, norm } from '../utils'
import { Badge, Button, SearchInput } from './ui'

type Sekme = 'alt' | 'gecmis'

export function DetailDrawer({ grup, ortaklar, gecmis, grupAdi, yonetilen, onKapat, onYonet }: {
  grup: GrupOzeti | null
  ortaklar: number[]
  gecmis: GecmisKaydi[]
  grupAdi: (id: number) => string
  yonetilen: boolean
  onKapat: () => void
  onYonet: (id: number) => void
}) {
  const [sekme, setSekme] = useState<Sekme>('alt')
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => { setSekme('alt') }, [grup?.KAMPANYAGRUP_ID])
  useEffect(() => {
    if (!grup) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onKapat()
    window.addEventListener('keydown', k)
    panel.current?.focus()
    return () => window.removeEventListener('keydown', k)
  }, [grup, onKapat])

  const ilgiliGecmis = useMemo(() => grup ? gecmis.filter((h) => h.kaynakGrupId === grup.KAMPANYAGRUP_ID || h.iliskiliGrupId === grup.KAMPANYAGRUP_ID) : [], [gecmis, grup])
  if (!grup) return null

  const tab = (v: Sekme, l: string, n: number) => (
    <button role="tab" aria-selected={sekme === v} onClick={() => setSekme(v)}
      className={cx('relative h-11 px-1 text-sm font-medium transition-colors', sekme === v ? 'text-navy' : 'text-muted hover:text-fg')}>
      {l} <span className="ml-1 rounded-full bg-surface2 px-1.5 py-0.5 text-xs text-muted tnum">{n}</span>
      {sekme === v && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-navy rounded" />}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${grup.KAMPANYAGRUP_ADI} detayı`}>
      <div className="absolute inset-0 bg-fg/30" onClick={onKapat} />
      <div ref={panel} tabIndex={-1}
        className="anim-drawer absolute right-0 top-0 bottom-0 w-full sm:w-[min(920px,92vw)] bg-surface shadow-2xl flex flex-col outline-none"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="label-caps text-muted">Kampanya detayı ve işlem geçmişi</div>
            <h2 className="text-lg font-semibold mt-0.5">{grup.KAMPANYAGRUP_ADI}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
              {ortaklar.length > 0 ? <Badge tone="ok" dot>Birleşti</Badge> : <Badge dot>Birleşmedi</Badge>}
              <span className="text-muted tnum">En yakın bitiş: {fmtDate(grup.enErkenBitis)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!yonetilen && <Button size="sm" variant="primary" onClick={() => onYonet(grup.KAMPANYAGRUP_ID)}><Link2 size={14} />Birleşimi Yönet</Button>}
            <button onClick={onKapat} className="rounded p-1.5 text-muted hover:bg-surface2 hover:text-fg" aria-label="Paneli kapat"><X size={20} /></button>
          </div>
        </div>
        {ortaklar.length > 0 && (
          <div className="px-5 py-2.5 border-b border-line bg-surface2/50 text-[13px] flex flex-wrap gap-1.5 items-center">
            <span className="text-muted mr-1">Birleşebildiği çatılar:</span>
            {ortaklar.map((o) => <Badge key={o} tone="ok">{grupAdi(o)}</Badge>)}
          </div>
        )}
        <div className="flex gap-6 border-b border-line px-5" role="tablist">
          {tab('alt', 'Alt Kampanyalar', grup.kampanyalar.length)}
          {tab('gecmis', 'İşlem Geçmişi', ilgiliGecmis.length)}
        </div>
        <div className="flex-1 overflow-y-auto">
          {sekme === 'alt' ? <AltKampanyalar grup={grup} />
            : <IslemGecmisi kayitlar={ilgiliGecmis} tumGecmis={gecmis} grupAdi={grupAdi} seciliGrupId={grup.KAMPANYAGRUP_ID} />}
        </div>
      </div>
    </div>
  )
}

function AltKampanyalar({ grup }: { grup: GrupOzeti }) {
  const [ara, setAra] = useState('')
  const [boyut, setBoyut] = useState(10)
  const [sayfa, setSayfa] = useState(1)
  const [artan, setArtan] = useState(true)
  const liste = useMemo(() => {
    const q = norm(ara.trim())
    const l = q ? grup.kampanyalar.filter((k) => norm(k.kampanyaAdi).includes(q) || norm(k.kampanyaKodu).includes(q)) : grup.kampanyalar
    return [...l].sort((a, b) => (artan ? 1 : -1) * a.bitisTarihi.localeCompare(b.bitisTarihi))
  }, [grup, ara, artan])
  useEffect(() => setSayfa(1), [ara, boyut, artan, grup.KAMPANYAGRUP_ID])
  const sayfaSayisi = Math.max(1, Math.ceil(liste.length / boyut))
  const gorunen = liste.slice((sayfa - 1) * boyut, sayfa * boyut)

  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput id="alt-ara" value={ara} onChange={setAra} placeholder="Kampanya kodu veya adı ara" className="flex-1 min-w-[220px]" />
      </div>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left min-w-[480px]">
          <thead>
            <tr className="text-muted bg-surface2/60 border-b border-line">
              <th className="label-caps px-3 py-2.5">Kampanya Kodu</th>
              <th className="label-caps px-3 py-2.5">Kampanya Adı</th>
              <th className="label-caps px-3 py-2" aria-sort={artan ? 'ascending' : 'descending'}>
                <button onClick={() => setArtan(!artan)} className="label-caps inline-flex items-center gap-1 hover:text-fg" title="Bitiş tarihine göre sırala">
                  Bitiş Tarihi {artan ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {gorunen.map((k) => {
              const g = daysUntil(k.bitisTarihi)
              return (
                <tr key={k.kampanyaId} className="border-b border-line last:border-0">
                  <td className="px-3 py-2.5 font-mono text-[12.5px] whitespace-nowrap">{k.kampanyaKodu}</td>
                  <td className="px-3 py-2.5">{k.kampanyaAdi}</td>
                  <td className="px-3 py-2.5 tnum whitespace-nowrap">
                    {fmtDate(k.bitisTarihi)}
                    {g <= 14 && <span className="ml-2 text-xs text-warn">{g <= 0 ? 'bugün bitiyor' : `${g} gün kaldı`}</span>}
                  </td>
                </tr>
              )
            })}
            {gorunen.length === 0 && <tr><td colSpan={3} className="px-3 py-8 text-center text-muted">Aramanıza uygun kampanya bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
        <span className="tnum">{liste.length === 0 ? '0 kayıt' : `${(sayfa - 1) * boyut + 1}–${Math.min(sayfa * boyut, liste.length)} / ${liste.length} kayıt`}</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">Sayfa başına
            <select id="alt-boyut" value={boyut} onChange={(e) => setBoyut(Number(e.target.value))} className="h-8 rounded-md border border-line bg-surface px-2 text-fg">
              {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" disabled={sayfa <= 1} onClick={() => setSayfa(sayfa - 1)} aria-label="Önceki sayfa"><ChevronLeft size={16} /></Button>
            <span className="tnum text-fg">{sayfa} / {sayfaSayisi}</span>
            <Button size="sm" variant="ghost" disabled={sayfa >= sayfaSayisi} onClick={() => setSayfa(sayfa + 1)} aria-label="Sonraki sayfa"><ChevronRight size={16} /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const durumMetni = (d: IliskiDurumu) => (d === 'IZIN_VAR' ? 'Birleşim izni var' : 'Birleşim izni yok')
const DurumRozet = ({ d }: { d: IliskiDurumu }) => <Badge tone={d === 'IZIN_VAR' ? 'ok' : 'neutral'} dot>{durumMetni(d)}</Badge>

function IslemGecmisi({ kayitlar, tumGecmis, grupAdi, seciliGrupId }: { kayitlar: GecmisKaydi[]; tumGecmis: GecmisKaydi[]; grupAdi: (id: number) => string; seciliGrupId: number }) {
  const [acik, setAcik] = useState<string | null>(null)
  const [yeniOnce, setYeniOnce] = useState(true)
  const [tur, setTur] = useState<'tumu' | 'IZIN_VERILDI' | 'IZIN_KALDIRILDI'>('tumu')
  const liste = useMemo(() => {
    const l = kayitlar.filter((k) => tur === 'tumu' || k.tur === tur)
    return [...l].sort((a, b) => (yeniOnce ? b.tarih.localeCompare(a.tarih) : a.tarih.localeCompare(b.tarih)))
  }, [kayitlar, yeniOnce, tur])

  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <select id="gecmis-tur" value={tur} onChange={(e) => setTur(e.target.value as typeof tur)} className="h-9 rounded-md border border-line bg-surface px-2.5 text-sm">
          <option value="tumu">Tüm işlem türleri</option>
          <option value="IZIN_VERILDI">Birleşim İzni Verildi</option>
          <option value="IZIN_KALDIRILDI">Birleşim İzni Kaldırıldı</option>
        </select>
        <Button size="sm" onClick={() => setYeniOnce(!yeniOnce)}><ArrowDownUp size={14} />{yeniOnce ? 'En yeni üstte' : 'En eski üstte'}</Button>
      </div>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left min-w-[560px]">
          <thead>
            <tr className="text-muted bg-surface2/60 border-b border-line">
              <th className="w-8" />
              <th className="label-caps px-2 py-2">Tarih / Saat</th>
              <th className="label-caps px-2 py-2">İlişkili Çatı</th>
              <th className="label-caps px-2 py-2">İşlem Türü</th>
              <th className="label-caps px-2 py-2">Kullanıcı</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((h) => {
              const ac = acik === h.id
              const ayniIslem = tumGecmis.filter((x) => x.islemNo === h.islemNo && x.id !== h.id)
              const verildi = h.tur === 'IZIN_VERILDI'
              return (
                <Fragment key={h.id}>
                  <tr onClick={() => setAcik(ac ? null : h.id)} className={cx('border-b border-line cursor-pointer hover:bg-surface2/60', ac && 'bg-surface2/60')}
                    aria-expanded={ac}>
                    <td className="pl-3"><ChevronDown size={15} className={cx('text-muted transition-transform', !ac && '-rotate-90')} /></td>
                    <td className="px-2 py-2 tnum whitespace-nowrap text-[13px]">{fmtDateTime(h.tarih)}</td>
                    <td className="px-2 py-2 text-[13px]">{grupAdi(h.iliskiliGrupId === seciliGrupId ? h.kaynakGrupId : h.iliskiliGrupId)}</td>
                    <td className="px-2 py-2"><Badge tone={verildi ? 'ok' : 'bad'}>{verildi ? 'Birleşim İzni Verildi' : 'Birleşim İzni Kaldırıldı'}</Badge></td>
                    <td className="px-2 py-2 text-[13px] whitespace-nowrap">{h.kullanici}</td>
                  </tr>
                  {ac && (
                    <tr className="border-b border-line bg-surface2/40">
                      <td />
                      <td colSpan={4} className="px-2 py-3">
                        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] text-[13px]">
                          <div className="flex flex-col gap-3">
                            <p>
                              <strong>{h.kullanici}</strong>, <strong>{grupAdi(h.kaynakGrupId)}</strong> ile <strong>{grupAdi(h.iliskiliGrupId)}</strong> arasındaki birleşim iznini
                              {verildi ? ' tanımladı.' : ' kaldırdı.'} {verildi
                                ? `Bu işlemle iki çatı altındaki ${h.kaynakKampanyaSayisi} ve ${h.iliskiliKampanyaSayisi} uygun kampanya birlikte kullanılabilir hale geldi.`
                                : `Bu işlemden sonra iki çatı altındaki kampanyalar birlikte kullanılamaz.`}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-muted">Önceki durum</span><DurumRozet d={h.oncekiDurum} />
                              <ChevronRight size={14} className="text-muted" />
                              <span className="text-muted">Yeni durum</span><DurumRozet d={h.yeniDurum} />
                            </div>
                          </div>
                          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                            <dt className="text-muted">Kaynak çatı</dt><dd>{grupAdi(h.kaynakGrupId)}</dd>
                            <dt className="text-muted">İşlem no</dt><dd className="font-mono text-[12.5px]">{h.islemNo}</dd>
                            <dt className="text-muted">Tarih</dt><dd className="tnum">{fmtDateTime(h.tarih)}</dd>
                            <dt className="text-muted">Kapsam</dt><dd>Çatı kampanya seviyesi (tüm uygun alt kampanyalar)</dd>
                            <dt className="text-muted">Aynı işlemde</dt>
                            <dd>{ayniIslem.length === 0 ? 'Başka değişiklik yok' : (
                              <ul className="flex flex-col gap-1">
                                {ayniIslem.map((x) => (
                                  <li key={x.id} className="flex flex-wrap items-center gap-1.5">
                                    <Badge tone={x.tur === 'IZIN_VERILDI' ? 'ok' : 'bad'}>{x.tur === 'IZIN_VERILDI' ? 'Verildi' : 'Kaldırıldı'}</Badge>
                                    {grupAdi(x.kaynakGrupId)} ↔ {grupAdi(x.iliskiliGrupId)}
                                  </li>
                                ))}
                              </ul>
                            )}</dd>
                          </dl>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {liste.length === 0 && <tr><td colSpan={5} className="px-3 py-10 text-center text-muted">Bu çatı için kayıtlı işlem bulunmuyor.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
