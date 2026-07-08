export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function currency(n: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && Math.abs(n) >= 1000) {
    return '$' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function num(n: number): string {
  return n.toLocaleString('en-US')
}

/** Rate-per-mile with cents, e.g. "$2.62". */
export function perMile(rate: number, miles: number): string {
  if (!miles) return '—'
  return '$' + (rate / miles).toFixed(2)
}

/** Today is pinned so the prototype's expiry math is deterministic. */
export const TODAY = new Date('2026-07-08T09:00:00')

export function daysUntil(iso: string): number {
  const d = new Date(iso)
  return Math.round((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export type ExpiryStatus = 'expired' | 'soon' | 'ok'

export function expiryStatus(iso?: string | null): ExpiryStatus {
  if (!iso) return 'ok'
  const d = daysUntil(iso)
  if (d < 0) return 'expired'
  if (d <= 30) return 'soon'
  return 'ok'
}

let idc = 1000
export function uid(prefix: string): string {
  idc += 1
  return `${prefix}-${idc}`
}
