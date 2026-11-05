import { useCallback, useMemo, useState } from 'react'
import { History, RefreshCcw, UserRound } from 'lucide-react'
import { usePortal } from './store'
import { GroupTable } from './components/GroupTable'
import { MergePanel, type Eylem } from './components/MergePanel'
import { DetailDrawer } from './components/DetailDrawer'
import { Button, Modal, useToast } from './components/ui'

export default function App() {
  const p = usePortal()
  const toast = useToast()
  const [seciliId, setSeciliId] = useState<number | null>(() => p.gruplar[0]?.KAMPANYAGRUP_ID ?? null)
  const [aday, setAday] = useState<number | null>(null)
  const [eylem, setEylem] = useState<Eylem>(null)
  const [detayId, setDetayId] = useState<number | null>(null)
  const [bekleyenSecim, setBekleyenSecim] = useState<number | null>(null)
  const [sifirlaAcik, setSifirlaAcik] = useState(false)
  const [kullaniciAcik, setKullaniciAcik] = useState(false)
  const [kullaniciTaslak, setKullaniciTaslak] = useState('')

  const secili = p.gruplar.find((g) => g.KAMPANYAGRUP_ID === seciliId) ?? null
  const kayitli = useMemo(() => (seciliId != null ? p.ortaklar(seciliId) : new Set<number>()), [p, seciliId])
  const taslakVar = aday != null
  const ortakSayisi = useCallback((id: number) => p.ortaklar(id).size, [p])
  const ad = p.grupAdi

  const taslakTemizle = () => { setAday(null); setEylem(null) }

  const yonet = (id: number) => {
    setDetayId(null)
    if (id === seciliId) return
    if (taslakVar) { setBekleyenSecim(id); return }
    setSeciliId(id); taslakTemizle()
  }

  const adaySec = (id: number | null) => {
    if (id === seciliId) return // bir çatı kendisiyle birleştirilemez
    setAday(id); setEylem(null) // her yeni eşleştirme temiz bir işlemle başlar
  }
  const vazgec = () => {
    taslakTemizle()
    toast({ tone: 'info', title: 'İşlem temizlendi', text: 'Kaydedilmemiş işlem iptal edildi.' })
  }
  const kaydet = () => {
    if (!secili || aday == null || !eylem) return
    const verildi = eylem === 'ver'
    const no = p.kaydet(secili.KAMPANYAGRUP_ID, verildi ? [aday] : [], verildi ? [] : [aday])
    toast({ tone: 'ok', title: verildi ? 'Birleşim izni verildi' : 'Birleşim izni kaldırıldı',
      text: `${secili.KAMPANYAGRUP_ADI} ↔ ${ad(aday)}. İşlem geçmişine eklendi${no ? ` (${no})` : ''}.` })
    taslakTemizle() // kayıttan sonra yalnızca çalışma alanı temizlenir
  }

  const detay = p.gruplar.find((g) => g.KAMPANYAGRUP_ID === detayId) ?? null
  const kapat = useCallback(() => setDetayId(null), [])

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-header text-header-on sticky z-30" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="gutter mx-auto max-w-[1600px] flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-md bg-ok grid place-items-center" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-header-on"><circle cx="8" cy="12" r="5" /><circle cx="16" cy="12" r="5" /></svg>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[.08em] text-header-muted">Kampanya Operasyon</div>
              <div className="font-semibold text-[15px] leading-tight truncate">Şifreli Kampanya Birleşim Portalı</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[13px]">
            <span className="hidden sm:inline-flex rounded-full border border-header-muted/40 px-2.5 py-0.5 text-xs text-header-muted">Prototip · Temsili demo verisi</span>
            <button onClick={() => { setKullaniciTaslak(p.durum.kullanici); setKullaniciAcik(true) }}
              className="inline-flex items-center gap-2 rounded-md px-2.5 h-8 hover:bg-header-on/10" title="İşlem geçmişinde görünecek adı değiştir">
              <UserRound size={16} /><span className="max-w-[160px] truncate">{p.durum.kullanici}</span>
            </button>
            <button onClick={() => setSifirlaAcik(true)} className="inline-flex items-center gap-1.5 rounded-md px-2.5 h-8 hover:bg-header-on/10 text-header-muted hover:text-header-on" title="Demo verilerini başlangıç durumuna döndür">
              <RefreshCcw size={15} /><span className="hidden md:inline">Demoyu sıfırla</span>
            </button>
          </div>
        </div>
      </header>

      <main className="gutter mx-auto w-full max-w-[1600px] py-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Şifreli Kampanya Birleşim Yönetimi</h1>
            <p className="text-muted text-[13px] mt-1 max-w-[72ch]">
              Yalnızca aktif, şifreli ve birleşebilir kampanyalar listelenir. Birleşim izni çatı seviyesinde tanımlanır.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <History size={15} />Son işlem: {p.durum.gecmis[0] ? `${ad(p.durum.gecmis[0].kaynakGrupId)} · ${p.durum.gecmis[0].kullanici}` : '—'}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
          <GroupTable gruplar={p.gruplar} ortakSayisi={ortakSayisi} seciliId={seciliId}
            onYonet={yonet} onDetay={setDetayId} />
          <div className="xl:sticky xl:top-[76px]">
            <MergePanel secili={secili} gruplar={p.gruplar} kayitli={kayitli} aday={aday} eylem={eylem}
              onAday={adaySec} onEylem={setEylem} onKaydet={kaydet} onVazgec={vazgec} onDetay={setDetayId} />
          </div>
        </div>
      </main>

      <DetailDrawer grup={detay} ortaklar={detay ? [...p.ortaklar(detay.KAMPANYAGRUP_ID)] : []} gecmis={p.durum.gecmis}
        grupAdi={ad} yonetilen={detayId === seciliId} onKapat={kapat} onYonet={yonet} />

      <Modal open={bekleyenSecim != null} onClose={() => setBekleyenSecim(null)} title="Kaydedilmemiş işlem var"
        footer={<>
          <Button onClick={() => setBekleyenSecim(null)}>Bu çatıda kal</Button>
          <Button variant="danger" onClick={() => { taslakTemizle(); setSeciliId(bekleyenSecim); setBekleyenSecim(null) }}>İşlemi iptal et ve geç</Button>
        </>}>
        <p className="text-sm"><strong>{secili?.KAMPANYAGRUP_ADI}</strong> için kaydedilmemiş bir birleşim işlemi var. Kaynak çatıyı değiştirirseniz bu işlem iptal edilir.</p>
      </Modal>

      <Modal open={sifirlaAcik} onClose={() => setSifirlaAcik(false)} title="Demo verileri sıfırlansın mı?"
        footer={<><Button onClick={() => setSifirlaAcik(false)}>Vazgeç</Button>
          <Button variant="danger" onClick={() => { p.sifirla(); taslakTemizle(); setSifirlaAcik(false); toast({ tone: 'info', title: 'Demo sıfırlandı', text: 'Birleşim izinleri ve işlem geçmişi başlangıç durumuna döndü.' }) }}>Sıfırla</Button></>}>
        <p className="text-sm">Bu tarayıcıda yaptığınız tüm birleşim değişiklikleri ve işlem geçmişi kayıtları silinir, başlangıçtaki demo verisi geri yüklenir. Bu işlem yalnızca sizin tarayıcınızı etkiler.</p>
      </Modal>

      <Modal open={kullaniciAcik} onClose={() => setKullaniciAcik(false)} title="Kullanıcı adı" width="max-w-md"
        footer={<><Button onClick={() => setKullaniciAcik(false)}>Vazgeç</Button>
          <Button variant="primary" disabled={!kullaniciTaslak.trim()} onClick={() => { p.kullaniciDegistir(kullaniciTaslak.trim()); setKullaniciAcik(false) }}>Kaydet</Button></>}>
        <form onSubmit={(e) => { e.preventDefault(); if (kullaniciTaslak.trim()) { p.kullaniciDegistir(kullaniciTaslak.trim()); setKullaniciAcik(false) } }} className="flex flex-col gap-2">
          <label htmlFor="kullanici-adi" className="text-sm">İşlem geçmişinde görünecek adınız</label>
          <input id="kullanici-adi" value={kullaniciTaslak} onChange={(e) => setKullaniciTaslak(e.target.value)} maxLength={60} autoFocus
            className="h-9 rounded-md border border-line bg-surface px-3 text-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20" />
          <span className="text-xs text-muted">Prototipte oturum açma yoktur; bu ad yalnızca demo amaçlıdır.</span>
        </form>
      </Modal>

      <footer className="gutter mx-auto w-full max-w-[1600px] pb-6 text-xs text-muted flex flex-wrap gap-x-4 gap-y-1">
        <span>Prototip sürüm 1.1 · Hazırlayan: <strong className="font-semibold text-fg">Derya Güven</strong></span>
        <span>Veriler temsilidir, gerçek kampanya servislerine bağlı değildir.</span>
        <span>Değişiklikler bu tarayıcıda saklanır.</span>
      </footer>
    </div>
  )
}
