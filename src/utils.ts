export const pairKey = (a: number, b: number) => (a < b ? `${a}|${b}` : `${b}|${a}`)

const trDate = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const trDateTime = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

export const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const fmtDate = (s: string) => trDate.format(parseYmd(s))
export const fmtDateTime = (iso: string) => trDateTime.format(new Date(iso))
export const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const daysUntil = (s: string) => {
  const t = new Date(); t.setHours(0, 0, 0, 0)
  return Math.round((parseYmd(s).getTime() - t.getTime()) / 86400000)
}

/** Türkçe duyarlı arama normalizasyonu (İ/ı, ş, ğ vb.). */
export const norm = (s: string) =>
  s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
