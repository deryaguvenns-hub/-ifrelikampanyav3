import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'
import { cx } from '../utils'

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export function Button({ variant = 'secondary', size = 'md', className, ...p }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-navy text-navy-on hover:bg-navy-hover border border-transparent',
    secondary: 'bg-surface text-fg border border-line hover:bg-surface2',
    ghost: 'text-muted hover:text-fg hover:bg-surface2 border border-transparent',
    danger: 'bg-surface text-bad border border-bad/40 hover:bg-bad-soft',
    success: 'bg-ok text-navy-on border border-transparent hover:opacity-90',
  }
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap',
        size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3.5 text-sm', v[variant], className)}
    />
  )
}

type Tone = 'ok' | 'bad' | 'warn' | 'navy' | 'neutral'
export function Badge({ tone = 'neutral', children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  const t: Record<Tone, string> = {
    ok: 'bg-ok-soft text-ok', bad: 'bg-bad-soft text-bad', warn: 'bg-warn-soft text-warn',
    navy: 'bg-navy-soft text-navy', neutral: 'bg-surface2 text-muted',
  }
  const d: Record<Tone, string> = { ok: 'bg-ok', bad: 'bg-bad', warn: 'bg-warn', navy: 'bg-navy', neutral: 'bg-muted' }
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', t[tone], className)}>
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', d[tone])} />}
      {children}
    </span>
  )
}

export function Modal({ open, onClose, title, children, footer, width = 'max-w-lg' }:
  { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; width?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    ref.current?.focus()
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-fg/40" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className={cx('relative w-full rounded-lg bg-surface shadow-xl border border-line outline-none', width)}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-muted hover:bg-surface2 hover:text-fg" aria-label="Kapat"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 max-h-[65vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

type Toast = { id: number; tone: 'ok' | 'info' | 'warn'; title: string; text?: string }
const ToastCtx = createContext<(t: Omit<Toast, 'id'>) => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x, { ...t, id }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 5000)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed z-[70] bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-2 sm:w-[380px]" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="anim-toast flex gap-3 rounded-lg border border-line bg-surface p-3.5 shadow-lg">
            {t.tone === 'ok' ? <CheckCircle2 className="text-ok shrink-0" size={20} /> : t.tone === 'warn'
              ? <AlertTriangle className="text-warn shrink-0" size={20} /> : <Info className="text-navy shrink-0" size={20} />}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">{t.title}</div>
              {t.text && <div className="text-[13px] text-muted mt-0.5">{t.text}</div>}
            </div>
            <button onClick={() => setItems((x) => x.filter((i) => i.id !== t.id))} className="text-muted hover:text-fg self-start" aria-label="Bildirimi kapat"><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function SearchInput({ value, onChange, placeholder, id, className }:
  { value: string; onChange: (v: string) => void; placeholder: string; id: string; className?: string }) {
  return (
    <div className={cx('relative', className)}>
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-9 w-full rounded-md border border-line bg-surface pl-8 pr-8 text-sm placeholder:text-muted/80 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20" />
      {value && <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-fg" aria-label="Aramayı temizle"><X size={14} /></button>}
    </div>
  )
}
