import { useMemo, useState } from 'react'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { ArrowLeft, ArrowRight, GripVertical, Inbox, RotateCcw, Save, Undo2 } from 'lucide-react'
import type { GrupOzeti } from '../store'
import { cx, norm } from '../utils'
import { Badge, Button, SearchInput } from './ui'

type Havuz = 'sol' | 'sag'

export function MergePanel({ secili, gruplar, kayitli, eklenen, kaldirilan, onTasi, onGeriAl, onKaydet, onVazgec, onDetay }: {
  secili: GrupOzeti | null
  gruplar: GrupOzeti[]
  kayitli: Set<number>
  eklenen: Set<number>
  kaldirilan: Set<number>
  onTasi: (id: number, hedef: Havuz) => void
  onGeriAl: (id: number) => void
  onKaydet: () => void
  onVazgec: () => void
  onDetay: (id: number) => void
}) {
  const [araSol, setAraSol] = useState('')
  const [araSag, setAraSag] = useState('')
  const [aktif, setAktif] = useState<number | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const { sol, sag } = useMemo(() => {
    if (!secili) return { sol: [], sag: [] }
    const digerleri = gruplar.filter((g) => g.KAMPANYAGRUP_ID !== secili.KAMPANYAGRUP_ID)
    const izinli = (id: number) => (kayitli.has(id) || eklenen.has(id)) && !kaldirilan.has(id)
    return {
      sol: digerleri.filter((g) => !izinli(g.KAMPANYAGRUP_ID)),
      sag: digerleri.filter((g) => izinli(g.KAMPANYAGRUP_ID)),
    }
  }, [secili, gruplar, kayitli, eklenen, kaldirilan])

  if (!secili) {
    return (
      <section className="rounded-lg border border-line bg-surface p-10 text-center text-muted">
        Birleşim izinlerini yönetmek için soldaki listeden bir çatı kampanya seçin.
      </section>
    )
  }

  const filtre = (l: GrupOzeti[], q: string) => { const n = norm(q.trim()); return n ? l.filter((g) => norm(g.KAMPANYAGRUP_ADI).includes(n)) : l }
  const degisiklik = eklenen.size + kaldirilan.size
  const ad = (id: number) => gruplar.find((g) => g.KAMPANYAGRUP_ID === id)?.KAMPANYAGRUP_ADI ?? ''

  const basla = (e: DragStartEvent) => setAktif(Number(e.active.id))
  const bitir = (e: DragEndEvent) => {
    setAktif(null)
    const kaynak = e.active.data.current?.havuz as Havuz | undefined
    const hedef = e.over?.id as Havuz | undefined
    if (kaynak && hedef && kaynak !== hedef) onTasi(Number(e.active.id), hedef)
  }
  const aktifGrup = aktif != null ? gruplar.find((g) => g.KAMPANYAGRUP_ID === aktif) : null

  return (
    <section className="rounded-lg border border-line bg-surface flex flex-col min-w-0" aria-labelledby="birlesim-baslik">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <div className="label-caps text-muted">Birleşim yönetimi</div>
          <h2 id="birlesim-baslik" className="text-[16px] font-semibold mt-0.5">{secili.KAMPANYAGRUP_ADI}</h2>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onDetay(secili.KAMPANYAGRUP_ID)}>Alt kampanyalar ve geçmiş</Button>
      </div>

      <DndContext sensors={sensors} onDragStart={basla} onDragEnd={bitir} onDragCancel={() => setAktif(null)}
        accessibility={{
          screenReaderInstructions: { draggable: 'Taşımak için boşluk tuşuna basın, ok tuşlarıyla hedef havuza gidin, bırakmak için tekrar boşluk tuşuna basın.' },
          announcements: {
            onDragStart: ({ active }) => `${ad(Number(active.id))} taşınıyor.`,
            onDragOver: ({ over }) => over ? `${over.id === 'sag' ? 'Birleşim İzni Verilenler' : 'Birleşime Uygun Çatılar'} havuzu üzerinde.` : 'Bir havuzun üzerinde değil.',
            onDragEnd: ({ active, over }) => over ? `${ad(Number(active.id))} bırakıldı.` : 'Taşıma iptal edildi.',
            onDragCancel: () => 'Taşıma iptal edildi.',
          },
        }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
          <HavuzKolonu id="sol" baslik="Birleşime Uygun Çatılar" aciklama="Sağa taşıyarak izin verin."
            ara={araSol} setAra={setAraSol} liste={filtre(sol, araSol)} toplam={sol.length}
            durum={(id) => (kaldirilan.has(id) ? 'kaldirilacak' : null)}
            onTasi={(id) => onTasi(id, 'sag')} onGeriAl={onGeriAl} onDetay={onDetay} />
          <HavuzKolonu id="sag" baslik="Birleşim İzni Verilenler" aciklama="Sola taşıyarak izni kaldırın."
            ara={araSag} setAra={setAraSag} liste={filtre(sag, araSag)} toplam={sag.length}
            durum={(id) => (eklenen.has(id) ? 'eklenecek' : null)}
            onTasi={(id) => onTasi(id, 'sol')} onGeriAl={onGeriAl} onDetay={onDetay} />
        </div>
        <DragOverlay dropAnimation={null}>
          {aktifGrup && (
            <div className="flex items-center gap-2 rounded-md border border-navy bg-surface px-3 py-2.5 shadow-lg cursor-grabbing w-[300px] max-w-[80vw]">
              <GripVertical size={16} className="text-navy" />
              <span className="font-medium truncate">{aktifGrup.KAMPANYAGRUP_ADI}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <div className={cx('border-t border-line px-4 py-3 flex flex-wrap items-center gap-3', degisiklik > 0 && 'bg-warn-soft/50')}>
        <div className="flex-1 min-w-[220px] text-[13px]">
          {degisiklik === 0 ? (
            <span className="text-muted">Kaydedilmemiş değişiklik yok.</span>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold">Taslak:</span>
              {eklenen.size > 0 && <span className="text-ok font-medium">{eklenen.size} izin verilecek</span>}
              {kaldirilan.size > 0 && <span className="text-bad font-medium">{kaldirilan.size} izin kaldırılacak</span>}
              <span className="text-muted">Kaydedene kadar sisteme yansımaz.</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-auto">
          <Button onClick={onVazgec} disabled={degisiklik === 0}><RotateCcw size={15} />Vazgeç</Button>
          <Button variant="primary" onClick={onKaydet} disabled={degisiklik === 0}><Save size={15} />Kaydet{degisiklik > 0 && ` (${degisiklik})`}</Button>
        </div>
      </div>
    </section>
  )
}

type SatirDurumu = 'eklenecek' | 'kaldirilacak' | null

function HavuzKolonu({ id, baslik, aciklama, ara, setAra, liste, toplam, durum, onTasi, onGeriAl, onDetay }: {
  id: Havuz; baslik: string; aciklama: string; ara: string; setAra: (v: string) => void
  liste: GrupOzeti[]; toplam: number; durum: (id: number) => SatirDurumu
  onTasi: (id: number) => void; onGeriAl: (id: number) => void; onDetay: (id: number) => void
}) {
  const { setNodeRef, isOver, active } = useDroppable({ id })
  const kaynakBu = active?.data.current?.havuz === id
  const hedefOlabilir = active && !kaynakBu
  return (
    <div ref={setNodeRef}
      className={cx('flex flex-col rounded-md border min-w-0 transition-colors',
        isOver && hedefOlabilir ? (id === 'sag' ? 'border-ok bg-ok-soft/40 border-dashed' : 'border-bad bg-bad-soft/40 border-dashed')
          : hedefOlabilir ? 'border-dashed border-navy/50 bg-surface2/40' : 'border-line bg-surface2/40')}
      aria-label={baslik}>
      <div className="px-3 pt-2.5 pb-2 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-[14px] flex items-center gap-2">
            <span className={cx('h-2 w-2 rounded-full', id === 'sag' ? 'bg-ok' : 'bg-muted')} />{baslik}
          </h3>
          <span className="text-xs text-muted tnum">{toplam}</span>
        </div>
        <p className="text-xs text-muted">{aciklama}</p>
        <SearchInput id={`havuz-ara-${id}`} value={ara} onChange={setAra} placeholder="Havuzda ara" />
      </div>
      <ul className="flex flex-col gap-1 px-3 pb-3 min-h-[200px] max-h-[460px] overflow-y-auto">
        {liste.map((g) => (
          <HavuzSatiri key={g.KAMPANYAGRUP_ID} g={g} havuz={id} durum={durum(g.KAMPANYAGRUP_ID)}
            onTasi={onTasi} onGeriAl={onGeriAl} onDetay={onDetay} />
        ))}
        {liste.length === 0 && (
          <li className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-[13px] text-muted">
            <Inbox size={22} />
            {ara ? 'Aramaya uygun çatı yok.' : id === 'sag' ? 'Henüz birleşim izni verilen çatı yok. Soldan sürükleyip buraya bırakın.' : 'Birleşime uygun başka çatı kalmadı.'}
          </li>
        )}
      </ul>
    </div>
  )
}

function HavuzSatiri({ g, havuz, durum, onTasi, onGeriAl, onDetay }: {
  g: GrupOzeti; havuz: Havuz; durum: SatirDurumu
  onTasi: (id: number) => void; onGeriAl: (id: number) => void; onDetay: (id: number) => void
}) {
  const id = g.KAMPANYAGRUP_ID
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: String(id), data: { havuz } })
  return (
    <li ref={setNodeRef}
      className={cx('flex items-stretch rounded-md border bg-surface transition-shadow',
        isDragging ? 'opacity-40' : 'hover:shadow-sm',
        durum === 'eklenecek' ? 'border-ok/60' : durum === 'kaldirilacak' ? 'border-bad/50' : 'border-line')}>
      <button {...listeners} {...attributes}
        className="flex items-center px-1.5 text-muted hover:text-navy cursor-grab active:cursor-grabbing touch-none rounded-l-md hover:bg-surface2"
        aria-label={`${g.KAMPANYAGRUP_ADI} öğesini sürükle`} title="Sürükleyerek taşı">
        <GripVertical size={16} />
      </button>
      <button onClick={() => onDetay(id)} className="flex-1 min-w-0 overflow-hidden text-left py-1.5 pr-2 pl-1" title="Detayı aç">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[13.5px] truncate">{g.KAMPANYAGRUP_ADI}</span>
          {durum === 'eklenecek' && <Badge tone="ok">Eklenecek</Badge>}
          {durum === 'kaldirilacak' && <Badge tone="bad">Kaldırılacak</Badge>}
        </div>
              </button>
      <div className="flex items-center gap-0.5 pr-1.5">
        {durum && (
          <button onClick={() => onGeriAl(id)} className="p-1.5 rounded text-muted hover:text-fg hover:bg-surface2" title="Bu değişikliği geri al" aria-label={`${g.KAMPANYAGRUP_ADI} değişikliğini geri al`}>
            <Undo2 size={15} />
          </button>
        )}
        <button onClick={() => onTasi(id)}
          className={cx('p-1.5 rounded border border-line', havuz === 'sol' ? 'text-ok hover:bg-ok-soft' : 'text-bad hover:bg-bad-soft')}
          title={havuz === 'sol' ? 'Birleşim izni ver' : 'Birleşim iznini kaldır'}
          aria-label={havuz === 'sol' ? `${g.KAMPANYAGRUP_ADI} için birleşim izni ver` : `${g.KAMPANYAGRUP_ADI} birleşim iznini kaldır`}>
          {havuz === 'sol' ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
        </button>
      </div>
    </li>
  )
}
