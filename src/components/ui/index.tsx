import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ---------------- Button ---------------- */
type BtnVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'warning'
type BtnSize = 'sm' | 'md' | 'icon'
export function Button({
  variant = 'primary', size = 'md', className, children, ...props
}: { variant?: BtnVariant; size?: BtnSize } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-brand-100',
    outline: 'border border-stroke-soft-200 bg-bg-white-0 text-text-strong-950 hover:bg-bg-weak-50',
    ghost: 'text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
    warning: 'bg-state-warning-base text-white hover:bg-state-warning-base/90 shadow-sm',
  }
  const sizes: Record<BtnSize, string> = {
    sm: 'h-8 px-3 text-[13px] gap-1.5',
    md: 'h-9 px-4 text-sm gap-2',
    icon: 'h-9 w-9 justify-center',
  }
  return (
    <button
      className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 [&_svg]:shrink-0', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

/* ---------------- Badge (Merlin StatusBadge look) ---------------- */
export type BadgeTone = 'gray' | 'purple' | 'green' | 'amber' | 'red' | 'blue' | 'slate'
const tones: Record<BadgeTone, string> = {
  gray: 'bg-bg-weak-50 text-text-sub-600 border-stroke-soft-200',
  purple: 'bg-state-information-lighter text-brand-500 border-state-information-light',
  green: 'bg-state-success-lighter text-state-success-dark border-state-success-light',
  amber: 'bg-state-warning-lighter text-state-warning-dark border-state-warning-light',
  red: 'bg-state-error-lighter text-state-error-dark border-state-error-light',
  blue: 'bg-state-blue-lighter text-state-blue-dark border-state-blue-light',
  slate: 'bg-bg-weak-50 text-text-sub-600 border-stroke-sub-300',
}
export function Badge({ tone = 'gray', className, children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', tones[tone], className)}>
      {children}
    </span>
  )
}
export function Dot({ tone = 'gray' }: { tone?: BadgeTone }) {
  const c: Record<BadgeTone, string> = { gray: 'bg-text-soft-400', purple: 'bg-brand-400', green: 'bg-state-success-base', amber: 'bg-state-warning-base', red: 'bg-state-error-base', blue: 'bg-state-blue-base', slate: 'bg-text-soft-400' }
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', c[tone])} />
}

/* ---------------- Info tooltip (portal, matches ether-web-v1 Tooltip + Info idiom) ---------------- */
export function InfoTip({ content, side = 'top', className }: { content: React.ReactNode; side?: 'top' | 'bottom'; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const open = () => {
    const r = ref.current?.getBoundingClientRect()
    if (r) setPos({ x: r.left + r.width / 2, y: side === 'top' ? r.top : r.bottom })
    setShow(true)
  }
  return (
    <span
      ref={ref}
      tabIndex={0}
      onMouseEnter={open}
      onFocus={open}
      onMouseLeave={() => setShow(false)}
      onBlur={() => setShow(false)}
      className={cn('inline-flex cursor-help items-center align-middle text-icon-soft-400 transition-colors hover:text-icon-sub-600 focus:outline-none', className)}
    >
      <Info size={13} />
      {show && createPortal(
        <div
          style={{ position: 'fixed', left: pos.x, top: side === 'top' ? pos.y - 8 : pos.y + 8, transform: side === 'top' ? 'translate(-50%,-100%)' : 'translate(-50%,0)' }}
          className="pointer-events-none z-[100] max-w-[248px] rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg ring-1 ring-black/10"
        >
          {content}
        </div>, document.body)}
    </span>
  )
}

/* ---------------- Card ---------------- */
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-lg border border-stroke-soft-200 bg-bg-white-0 text-card-foreground shadow-sm', className)}>{children}</div>
}
export function CardHeader({ title, subtitle, action, info }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; info?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-stroke-soft-200 px-4 py-3">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text-strong-950">{title}{info && <InfoTip content={info} />}</h3>
        {subtitle && <p className="mt-0.5 text-[12px] text-text-sub-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ---------------- Stat card (dashboard) ---------------- */
export function Stat({ label, value, sub, tone, icon, info }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: BadgeTone; icon?: React.ReactNode; info?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[12px] font-medium text-text-sub-600">{label}{info && <InfoTip content={info} />}</span>
        {icon && <span className="text-icon-soft-400">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-text-strong-950">{value}</span>
        {sub && <span className={cn('text-[12px]', tone === 'red' ? 'text-state-error-base' : tone === 'green' ? 'text-state-success-base' : tone === 'amber' ? 'text-state-warning-base' : 'text-text-soft-400')}>{sub}</span>}
      </div>
    </Card>
  )
}

/* ---------------- Metric tile (compact, for metric rows) ---------------- */
export function Metric({ label, value, sub, tone, info }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: BadgeTone; info?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-3.5 py-3">
      <div className="flex items-center gap-1 text-[11px] font-medium text-text-soft-400">{label}{info && <InfoTip content={info} />}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-lg font-semibold tracking-tight text-text-strong-950">{value}</span>
        {sub && <span className={cn('text-[11px]', tone === 'red' ? 'text-state-error-base' : tone === 'green' ? 'text-state-success-base' : tone === 'amber' ? 'text-state-warning-base' : 'text-text-soft-400')}>{sub}</span>}
      </div>
    </div>
  )
}
export function MetricRow({ children, cols = 4 }: { children: React.ReactNode; cols?: number }) {
  const map: Record<number, string> = { 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6' }
  return <div className={cn('grid grid-cols-2 gap-3', map[cols] ?? 'sm:grid-cols-4')}>{children}</div>
}

/* ---------------- Table ---------------- */
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('w-full overflow-x-auto', className)}><table className="w-full border-collapse text-sm">{children}</table></div>
}
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('sticky top-0 z-10 whitespace-nowrap bg-bg-weak-50 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text-soft-400', className)}>{children}</th>
}
export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('whitespace-nowrap border-b border-stroke-soft-200 px-3 py-2.5 text-text-strong-950', className)}>{children}</td>
}
export function Tr({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <tr onClick={onClick} className={cn(onClick && 'cursor-pointer', 'transition-colors hover:bg-bg-weak-50', className)}>{children}</tr>
}

/* ---------------- Drawer (right sheet) ---------------- */
export function Drawer({ open, onClose, title, subtitle, width = 'max-w-2xl', children, footer }: { open: boolean; onClose: () => void; title?: React.ReactNode; subtitle?: React.ReactNode; width?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className={cn('animate-drawer relative flex h-full w-full flex-col bg-bg-white-0 shadow-2xl', width)}>
        <div className="flex items-start justify-between gap-3 border-b border-stroke-soft-200 px-5 py-4">
          <div className="min-w-0">
            {title && <div className="truncate text-base font-semibold text-text-strong-950">{title}</div>}
            {subtitle && <div className="mt-0.5 text-[13px] text-text-sub-600">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-icon-sub-600 hover:bg-bg-weak-50"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-stroke-soft-200 bg-bg-weak-50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, subtitle, children, footer, width = 'max-w-2xl' }: { open: boolean; onClose: () => void; title?: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; width?: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn('animate-in relative flex max-h-[88vh] w-full flex-col rounded-xl border border-stroke-soft-200 bg-bg-white-0 shadow-2xl', width)}>
        <div className="flex items-start justify-between gap-3 border-b border-stroke-soft-200 px-5 py-4">
          <div>
            {title && <div className="text-base font-semibold text-text-strong-950">{title}</div>}
            {subtitle && <div className="mt-0.5 text-[13px] text-text-sub-600">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-icon-sub-600 hover:bg-bg-weak-50"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-stroke-soft-200 bg-bg-weak-50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------------- Tabs ---------------- */
export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string; count?: number }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-stroke-soft-200">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn('relative -mb-px flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors',
            active === t.key ? 'text-brand-500' : 'text-text-sub-600 hover:text-text-strong-950')}
        >
          {t.label}
          {t.count !== undefined && <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]', active === t.key ? 'bg-state-information-lighter text-brand-500' : 'bg-bg-weak-50 text-text-soft-400')}>{t.count}</span>}
          {active === t.key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500" />}
        </button>
      ))}
    </div>
  )
}

/* ---------------- Form fields ---------------- */
export function Field({ label, children, hint, info }: { label: string; children: React.ReactNode; hint?: string; info?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[12px] font-medium text-text-strong-950">{label}{info && <InfoTip content={info} />}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-text-soft-400">{hint}</span>}
    </label>
  )
}
const fieldBase = 'h-9 w-full rounded-md border border-stroke-soft-200 bg-bg-white-0 px-3 text-sm text-text-strong-950 placeholder:text-text-soft-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-ring/25'
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldBase, props.className)} />
}
export function Select({ children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldBase, 'cursor-pointer', className)}>{children}</select>
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn('min-h-[72px] w-full rounded-md border border-stroke-soft-200 bg-bg-white-0 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-ring/25', props.className)} />
}

/* ---------------- Misc ---------------- */
export function Progress({ value, tone = 'purple' }: { value: number; tone?: BadgeTone }) {
  const c: Record<string, string> = { purple: 'bg-brand-400', green: 'bg-state-success-base', amber: 'bg-state-warning-base', red: 'bg-state-error-base', blue: 'bg-state-blue-base' }
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-soft-200">
      <div className={cn('h-full rounded-full transition-all', c[tone] || c.purple)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}
export function KV({ label, value, info }: { label: string; value: React.ReactNode; info?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-text-soft-400">{label}{info && <InfoTip content={info} />}</div>
      <div className="mt-0.5 text-sm font-medium text-text-strong-950">{value ?? '—'}</div>
    </div>
  )
}
export function SectionTitle({ children, action, info }: { children: React.ReactNode; action?: React.ReactNode; info?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h4 className="flex items-center gap-1.5 text-[13px] font-semibold text-text-strong-950">{children}{info && <InfoTip content={info} />}</h4>
      {action}
    </div>
  )
}
export function EmptyState({ icon, title, hint }: { icon?: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon && <div className="text-stroke-sub-300">{icon}</div>}
      <div className="text-sm font-medium text-text-strong-950">{title}</div>
      {hint && <div className="max-w-sm text-[13px] text-text-sub-600">{hint}</div>}
    </div>
  )
}
