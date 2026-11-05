import { useMemo, useState } from 'react'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { ArrowRight, GripVertical, Link2, Link2Off, MousePointerClick, RotateCcw, Save, X } from 'lucide-react'
import type { GrupOzeti } from '../store'
import { cx, norm } from '../utils'
import { Badge, Button, SearchInput } from './ui'

/** Kullanıcının çalışma alanında seçtiği işlem. null: henüz işlem seçilmedi. */
export type Eylem = 'ver' | 'kaldir' | null

/*
 * Çift bazlı birleşim çalışma alanı.
 * Kaynak çatı soldaki listeden seçilir; sağda bir seferde yalnızca bir eş çatı ile işlem yapılır.
 * İlişkiler zincirleme değildir: yalnızca açıkça izin verilen çatı çiftleri birleşir.
 */
export function MergePanel({ secili, gruplar, kayitli, aday, eylem, onAday, onEylem, onKaydet, onVazgec, onDetay }: {
  secili: GrupOzeti | null
  gruplar: GrupOzeti[]
  kayitli: Set<number> // kaynak çatının kayıtlı birleşim eşleri
  aday: number | null
  eylem: Eylem
  onAday: (id: number | null) => void
  onEylem: (e: Eylem) => void
  onKaydet: () => void
  onVazgec: () => void
  onDetay: (id: number) => void
}) {
  const [ara, setAra] = useState('')
  const [suruklenen, setSuruklenen] = useState<number | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const kaynakListe = useMemo(() => {
    if (!secili) return []
    const q = norm(ara.trim())
    return gruplar
      .filter((g) => g.KAMPANYAGRUP_ID !== secili.KAMPANYAGRUP_ID) // kendisiyle birleştirilemez
      .filter((g) => !q || norm(g.KAMPANYAGRUP_ADI).includes(q))
  }, [secili, gruplar, ara])

  if (!secili) {
    return (
      <section className="rounded-lg border border-line bg-surface p-10 text-center text-muted">
        Birleşim işlemi için soldaki listeden bir çatı kampanya seçin.
      </section>
    )
  }

  const ad = (id: number) => gruplar.find((g) => g.KAMPANYAGRUP_ID === id)?.KAMPANYAGRUP_ADI ?? ''
  const adayGrup = aday != null ? gruplar.find((g) => g.KAMPANYAGRUP_ID === aday) ?? null : null
  const birlesti = aday != null && kayitli.has(aday)

  const basla = (e: DragStartEvent) => setSuruklenen(parseInt(String(e.active.id), 10))
  const bitir = (e: DragEndEvent) => {
    setSuruklenen(null)
    const id = parseInt(String(e.active.id), 10)
    const kaynak = e.active.data.current?.alan as 'liste' | 'hedef' | undefined
    const hedef = e.over?.id as 'liste' | 'hedef' | undefined
    if (!hedef || kaynak === hedef) return
    if (hedef === 'hedef') onAday(id)
    else onAday(null)
  }

  return (
    <section className="rounded-lg border border-line bg-surface flex flex-col min-w-0" aria-labelledby="birlesim-baslik">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <div className="label-caps text-muted">Birleşim yönetimi · Kaynak çatı</div>
          <h2 id="birlesim-baslik" className="text-[16px] font-semibold mt-0.5">{secili.KAMPANYAGRUP_ADI}</h2>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onDetay(secili.KAMPANYAGRUP_ID)}>Alt kampanyalar ve geçmiş</Button>
      </div>

      <DndContext sensors={sensors} onDragStart={basla} onDragEnd={bitir} onDragCancel={() => setSuruklenen(null)}
        accessibility={{
          screenReaderInstructions: { draggable: 'Taşımak için boşluk tuşuna basın, ok tuşlarıyla işlem alanına gidin, bırakmak için tekrar boşluk tuşuna basın.' },
          announcements: {
            onDragStart: ({ active }) => `${ad(parseInt(String(active.id), 10))} taşınıyor.`,
            onDragOver: ({ over }) => over ? (over.id === 'hedef' ? 'Birleşim işlem alanı üzerinde.' : 'Çatı listesi üzerinde.') : 'Bir alanın üzerinde değil.',
            onDragEnd: ({ active, over }) => over ? `${ad(parseInt(String(active.id), 10))} bırakıldı.` : 'Taşıma iptal edildi.',
            onDragCancel: () => 'Taşıma iptal edildi.',
          },
        }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
          <KaynakListe liste={kaynakListe} ara={ara} setAra={setAra} aday={aday} kayitli={kayitli}
            onSec={(id) => onAday(id)} onDetay={onDetay} />
          <IslemAlani kaynakAdi={secili.KAMPANYAGRUP_ADI} aday={adayGrup} birlesti={birlesti} eylem={eylem}
            onEylem={onEylem} onCikar={() => onAday(null)} />
        </div>
        <DragOverlay dropAnimation={null}>
          {suruklenen != null && (
            <div className="flex items-center gap-2 rounded-md border border-navy bg-surface px-3 py-2 shadow-lg cursor-grabbing w-[280px] max-w-[80vw]">
              <GripVertical size={16} className="text-navy" />
              <span className="font-medium truncate">{ad(suruklenen)}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <div className={cx('border-t border-line px-4 py-3 flex flex-wrap items-center gap-3', eylem && 'bg-warn-soft/50')}>
        <div className="flex-1 min-w-[200px] text-[13px]">
          {!adayGrup ? <span className="text-muted">Kaydedilmemiş işlem yok.</span>
            : !eylem ? <span className="text-muted">İşlem seçin: {birlesti ? 'Birleşim İznini Kaldır' : 'Birleşim İzni Ver'}.</span>
            : (
              <span>
                <span className="font-semibold">Kaydedilmemiş işlem: </span>
                <span className={eylem === 'ver' ? 'text-ok font-medium' : 'text-bad font-medium'}>
                  {secili.KAMPANYAGRUP_ADI} ↔ {adayGrup.KAMPANYAGRUP_ADI} {eylem === 'ver' ? 'birleşim izni verilecek' : 'birleşim izni kaldırılacak'}
                </span>
              </span>
            )}
        </div>
        <div className="flex gap-2 ml-auto">
          <Button onClick={onVazgec} disabled={!adayGrup}><RotateCcw size={15} />Vazgeç</Button>
          <Button variant="primary" onClick={onKaydet} disabled={!eylem}><Save size={15} />Kaydet</Button>
        </div>
      </div>
    </section>
  )
}

function KaynakListe({ liste, ara, setAra, aday, kayitli, onSec, onDetay }: {
  liste: GrupOzeti[]; ara: string; setAra: (v: string) => void; aday: number | null; kayitli: Set<number>
  onSec: (id: number) => void; onDetay: (id: number) => void
}) {
  const { setNodeRef, isOver, active } = useDroppable({ id: 'liste' })
  const geriDonus = active?.data.current?.alan === 'hedef'
  return (
    <div ref={setNodeRef} aria-label="Birleşime Uygun Çatılar"
      className={cx('flex flex-col rounded-md border min-w-0 transition-colors',
        geriDonus && isOver ? 'border-dashed border-navy bg-navy-soft/40' : 'border-line bg-surface2/40')}>
      <div className="px-3 pt-2.5 pb-2 flex flex-col gap-1.5">
        <h3 className="font-semibold text-[14px] flex items-center justify-between gap-2">
          <span>Birleşime Uygun Çatılar</span><span className="text-xs text-muted font-normal tnum">{liste.length}</span>
        </h3>
        <p className="text-xs text-muted">Bir çatıyı işlem alanına sürükleyin veya ok butonunu kullanın.</p>
        <SearchInput id="havuz-ara-liste" value={ara} onChange={setAra} placeholder="Çatı ara" />
      </div>
      <ul className="flex flex-col gap-1 px-3 pb-3 min-h-[200px] max-h-[460px] overflow-y-auto">
        {liste.map((g) => (
          <ListeSatiri key={g.KAMPANYAGRUP_ID} g={g} secili={aday === g.KAMPANYAGRUP_ID} birlesti={kayitli.has(g.KAMPANYAGRUP_ID)}
            onSec={onSec} onDetay={onDetay} />
        ))}
        {liste.length === 0 && <li className="py-8 text-center text-[13px] text-muted">Aramaya uygun çatı yok.</li>}
      </ul>
    </div>
  )
}

function ListeSatiri({ g, secili, birlesti, onSec, onDetay }: {
  g: GrupOzeti; secili: boolean; birlesti: boolean; onSec: (id: number) => void; onDetay: (id: number) => void
}) {
  const id = g.KAMPANYAGRUP_ID
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: String(id), data: { alan: 'liste' }, disabled: secili })
  return (
    <li ref={setNodeRef}
      className={cx('flex items-stretch rounded-md border bg-surface transition-shadow',
        isDragging ? 'opacity-40' : 'hover:shadow-sm', secili ? 'border-navy/60 opacity-60' : 'border-line')}>
      <button {...listeners} {...attributes} disabled={secili}
        className="flex items-center px-1.5 text-muted hover:text-navy cursor-grab active:cursor-grabbing touch-none rounded-l-md hover:bg-surface2 disabled:cursor-default"
        aria-label={`${g.KAMPANYAGRUP_ADI} öğesini sürükle`} title="Sürükleyerek işlem alanına taşı">
        <GripVertical size={16} />
      </button>
      <button onClick={() => onDetay(id)} className="flex-1 min-w-0 flex items-center gap-2 text-left py-1.5 pr-2 pl-1" title="Detayı aç">
        <span className="font-medium text-[13.5px] truncate">{g.KAMPANYAGRUP_ADI}</span>
        {birlesti && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok" title="Kaynak çatı ile birleşim izni var" aria-label="Birleşim izni var" />}
        {secili && <span className="text-xs text-navy shrink-0">İşlem alanında</span>}
      </button>
      <div className="flex items-center pr-1.5">
        <button onClick={() => onSec(id)} disabled={secili}
          className="p-1.5 rounded border border-line text-navy hover:bg-navy-soft disabled:opacity-40"
          title="İşlem alanına taşı" aria-label={`${g.KAMPANYAGRUP_ADI} çatısını işlem alanına taşı`}>
          <ArrowRight size={15} />
        </button>
      </div>
    </li>
  )
}

function IslemAlani({ kaynakAdi, aday, birlesti, eylem, onEylem, onCikar }: {
  kaynakAdi: string; aday: GrupOzeti | null; birlesti: boolean; eylem: Eylem
  onEylem: (e: Eylem) => void; onCikar: () => void
}) {
  const { setNodeRef, isOver, active } = useDroppable({ id: 'hedef' })
  const gelen = active && active.data.current?.alan === 'liste'
  const drag = useDraggable({ id: aday ? String(aday.KAMPANYAGRUP_ID) + '-hedef' : 'bos', data: { alan: 'hedef' }, disabled: !aday })
  return (
    <div ref={setNodeRef} aria-label="Birleşim İşlem Alanı"
      className={cx('flex flex-col rounded-md border min-w-0 transition-colors',
        gelen && isOver ? 'border-dashed border-navy bg-navy-soft/50' : gelen ? 'border-dashed border-navy/50 bg-surface2/40' : 'border-line bg-surface2/40')}>
      <div className="px-3 pt-2.5 pb-2">
        <h3 className="font-semibold text-[14px]">Birleşim İşlem Alanı</h3>
        <p className="text-xs text-muted mt-1.5">Her seferinde tek bir çatı çifti için izin verin veya kaldırın.</p>
      </div>
      <div className="flex-1 flex flex-col gap-3 px-3 pb-3 min-h-[200px]">
        <div className="rounded-md border border-line bg-surface px-3 py-2">
          <div className="label-caps text-muted">Kaynak çatı</div>
          <div className="font-medium text-[13.5px] mt-0.5">{kaynakAdi}</div>
        </div>
        {!aday ? (
          <div className={cx('flex-1 flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 text-center text-[13px]',
            gelen && isOver ? 'border-navy text-navy' : 'border-line text-muted')}>
            <MousePointerClick size={22} />
            Eşleştirmek istediğiniz çatıyı buraya bırakın
          </div>
        ) : (
          <>
            <div ref={drag.setNodeRef} className={cx('rounded-md border bg-surface flex items-stretch', drag.isDragging && 'opacity-40',
              birlesti ? 'border-ok/60' : 'border-line')}>
              <button {...drag.listeners} {...drag.attributes} className="flex items-center px-1.5 text-muted hover:text-navy cursor-grab touch-none rounded-l-md hover:bg-surface2"
                aria-label={`${aday.KAMPANYAGRUP_ADI} öğesini listeye geri sürükle`} title="Listeye geri sürükle">
                <GripVertical size={16} />
              </button>
              <div className="flex-1 min-w-0 py-2 pr-2 pl-1">
                <div className="label-caps text-muted">Eşleştirilen çatı</div>
                <div className="font-medium text-[13.5px] mt-0.5 truncate">{aday.KAMPANYAGRUP_ADI}</div>
              </div>
              <button onClick={onCikar} className="px-2.5 text-muted hover:text-fg hover:bg-surface2 rounded-r-md" title="İşlem alanından çıkar" aria-label="İşlem alanından çıkar">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-muted">Mevcut durum:</span>
              {birlesti ? <Badge tone="ok" dot>Birleşti</Badge> : <Badge dot>Birleşmedi</Badge>}
              {eylem && <>
                <ArrowRight size={14} className="text-muted" />
                <span className="text-muted">Yeni durum:</span>
                {eylem === 'ver' ? <Badge tone="ok" dot>Birleşti</Badge> : <Badge dot>Birleşmedi</Badge>}
              </>}
            </div>
            {birlesti ? (
              <Button variant={eylem === 'kaldir' ? 'primary' : 'danger'} onClick={() => onEylem(eylem === 'kaldir' ? null : 'kaldir')}
                aria-pressed={eylem === 'kaldir'} className={eylem === 'kaldir' ? '!bg-bad hover:!opacity-90' : ''}>
                <Link2Off size={15} />{eylem === 'kaldir' ? 'Birleşim İzni Kaldırılacak' : 'Birleşim İznini Kaldır'}
              </Button>
            ) : (
              <Button variant={eylem === 'ver' ? 'success' : 'secondary'} onClick={() => onEylem(eylem === 'ver' ? null : 'ver')}
                aria-pressed={eylem === 'ver'} className={eylem === 'ver' ? '' : '!text-ok !border-ok/50 hover:!bg-ok-soft'}>
                <Link2 size={15} />{eylem === 'ver' ? 'Birleşim İzni Verilecek' : 'Birleşim İzni Ver'}
              </Button>
            )}
            {eylem && <p className="text-xs text-muted">Değişiklik Kaydet ile uygulanır. Diğer çatı çiftleri etkilenmez.</p>}
          </>
        )}
      </div>
    </div>
  )
}
