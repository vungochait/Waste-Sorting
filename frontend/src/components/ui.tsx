import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { categoryMeta } from '../services/categories'

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="eyebrow mb-2 text-eco-700">{eyebrow}</p>}
        <h1 className="text-[28px] font-bold leading-tight sm:text-[32px]">{title}</h1>
        {description && <p className="mt-2 text-[15px] leading-relaxed text-slate-600 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-[44px] items-center gap-2.5 rounded-xl px-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
    >
      <span className={`relative h-6 w-10 rounded-full transition-colors ${checked ? 'bg-eco-700' : 'bg-slate-300'}`} aria-hidden="true">
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  )
}

export function Spinner({ size = 18, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />
}

export function CategoryBadge({ category, size = 'sm' }: { category: string | null | undefined; size?: 'sm' | 'md' }) {
  const meta = categoryMeta(category)
  const Icon = meta.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'}`}
      style={{ background: meta.soft, color: meta.ink }}
    >
      <Icon size={size === 'md' ? 16 : 14} aria-hidden="true" />
      {meta.name}
    </span>
  )
}

export function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <span className="block h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
      </span>
      <span className="w-14 text-right font-mono text-xs text-slate-700">{(value * 100).toFixed(1)}%</span>
    </span>
  )
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-eco-50 text-eco-700">{icon}</span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <div className="max-w-md text-[15px] leading-relaxed text-slate-600">{children}</div>}
      {action}
    </div>
  )
}

export function ConfirmDialog({
  open, title, children, confirmLabel = 'Xóa', onConfirm, onCancel, busy,
}: { open: boolean; title: string; children?: ReactNode; confirmLabel?: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="card w-full max-w-md p-6"
            initial={{ scale: 0.96, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
          >
            <h2 id="confirm-title" className="text-lg font-semibold">{title}</h2>
            {children && <div className="mt-2 text-[15px] leading-relaxed text-slate-600">{children}</div>}
            <div className="mt-6 flex justify-end gap-2">
              <button ref={cancelRef} type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>Hủy</button>
              <button type="button" className="btn bg-red-700 text-white hover:bg-red-800" onClick={onConfirm} disabled={busy}>
                {busy && <Spinner />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
