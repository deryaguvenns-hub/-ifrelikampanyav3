import type { GrupOzeti } from '../store'
import { daysUntil, fmtDate } from '../utils'

/** Çatı seviyesinde tek bir tarih yoksa uydurmaz; alt kampanyaların bitiş aralığını gösterir. */
export function Gecerlilik({ g, compact }: { g: GrupOzeti; compact?: boolean }) {
  const tek = g.enErkenBitis === g.enGecBitis
  const yakin = g.kampanyalar.filter((k) => daysUntil(k.bitisTarihi) <= 14).length
  return (
    <div className="tnum leading-tight">
      {tek ? (
        <>
          <div className="text-[13px]">Bitiş: {fmtDate(g.enGecBitis)}</div>
          {!compact && <div className="text-xs text-muted mt-0.5">Tüm kampanyalarda aynı</div>}
        </>
      ) : (
        <>
          <div className="text-[13px] whitespace-nowrap">{fmtDate(g.enErkenBitis)} – {fmtDate(g.enGecBitis)}</div>
          {!compact && <div className="text-xs text-muted mt-0.5">Kampanyaya göre değişir</div>}
        </>
      )}
      {yakin > 0 && !compact && <div className="text-xs text-warn mt-0.5">{yakin} kampanya 14 günde bitiyor</div>}
    </div>
  )
}
