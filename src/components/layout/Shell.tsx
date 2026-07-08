import React from 'react'
import {
  Truck, Container, Users, Package, Radio, Map, Wrench, ShieldCheck, LayoutDashboard,
  Search, Bell, ChevronDown, DollarSign, FolderKanban, ShoppingCart, Boxes,
  FileText, Wallet, Fuel, Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore, type Section } from '@/lib/store'

/* Merlin light module rail — Fleet is active */
const MODULES: { key: string; label: string; icon: LucideIcon; active?: boolean }[] = [
  { key: 'sales', label: 'Sales', icon: DollarSign },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'catalog', label: 'Catalog', icon: Boxes },
  { key: 'fleet', label: 'Fleet', icon: Truck, active: true },
]

type Group = 'ops' | 'billing'
const BRANCHES: { key: Section; label: string; icon: LucideIcon; group: Group }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'ops' },
  { key: 'dispatch', label: 'Dispatch', icon: Radio, group: 'ops' },
  { key: 'loads', label: 'Loads', icon: Package, group: 'ops' },
  { key: 'vehicles', label: 'Trucks', icon: Truck, group: 'ops' },
  { key: 'trailers', label: 'Trailers', icon: Container, group: 'ops' },
  { key: 'drivers', label: 'Drivers', icon: Users, group: 'ops' },
  { key: 'map', label: 'Live Map', icon: Map, group: 'ops' },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench, group: 'ops' },
  { key: 'compliance', label: 'Compliance', icon: ShieldCheck, group: 'ops' },
  { key: 'invoicing', label: 'Invoicing', icon: FileText, group: 'billing' },
  { key: 'settlements', label: 'Settlements', icon: Wallet, group: 'billing' },
  { key: 'fuel', label: 'Fuel & Tolls', icon: Fuel, group: 'billing' },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const { section, setSection, toasts } = useStore()
  const activeBranch = BRANCHES.find((b) => b.key === section)

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-weak-50">
      {/* Light module sidebar */}
      <aside className="flex w-[232px] flex-none flex-col border-r border-stroke-soft-200 bg-bg-white-0">
        <div className="flex h-16 items-center gap-2 border-b border-stroke-soft-200 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-semibold text-white">MI</div>
          <span className="text-base font-medium tracking-tight text-text-strong-950">Merlin AI</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 pt-4">
          <p className="px-1 text-[11px] font-medium uppercase tracking-wider text-text-soft-400">Main</p>
          <ul className="mt-2 space-y-1">
            {MODULES.map((m) => {
              const Icon = m.icon
              return (
                <li key={m.key} className="relative">
                  {m.active && <span className="absolute -left-4 top-2 h-5 w-1 rounded-r bg-brand-400" />}
                  <button className={cn('flex w-full items-center rounded-lg text-sm font-medium transition-colors',
                    m.active ? 'text-text-strong-950' : 'text-text-sub-600 hover:text-text-strong-950')}>
                    <span className={cn('flex h-9 w-9 flex-none items-center justify-center rounded-lg transition-colors',
                      m.active ? 'bg-bg-weak-50 text-brand-500' : 'hover:bg-bg-soft-50')}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="ml-2">{m.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="border-t border-stroke-soft-200 p-2.5">
          <button className="flex w-full items-center gap-2 rounded px-1 py-1 hover:bg-bg-weak-50">
            <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-500 text-xs font-medium text-white">RC</div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-text-strong-950">Dispatcher</p>
              <p className="truncate text-xs text-text-soft-400">Rapid Carrier Co.</p>
            </div>
            <ChevronDown className="h-4 w-4 flex-none text-icon-sub-600" />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="flex h-16 flex-none items-center justify-between gap-4 border-b border-stroke-soft-200 bg-bg-white-0 px-6">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-brand-500" />
            <span className="text-[15px] font-semibold text-text-strong-950">Fleet</span>
            <span className="text-text-soft-400">/</span>
            <span className="text-[13px] text-text-sub-600">{activeBranch?.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-3 py-1.5 text-sm text-text-sub-600 shadow-sm transition-colors hover:bg-bg-weak-50">
              <Search size={15} className="text-text-sub-600" />
              <span className="hidden text-text-soft-400 md:inline">Search...</span>
              <kbd className="hidden items-center rounded border border-stroke-soft-200 bg-bg-weak-50 px-1.5 py-0.5 text-[11px] font-medium text-text-soft-400 md:inline-flex">⌘K</kbd>
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md border-2 border-state-information-base bg-brand-500 px-3 text-sm font-medium text-white transition-colors hover:opacity-90">
              <Sparkles size={14} />Ask AI
            </button>
            <button className="relative rounded-full p-2 text-icon-sub-600 hover:bg-bg-weak-50">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-state-error-base ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Branch sub-nav (grouped Operations | Billing) */}
        <nav className="flex flex-none items-center gap-1 overflow-x-auto border-b border-stroke-soft-200 bg-bg-white-0 px-4">
          {BRANCHES.map((b, i) => {
            const Icon = b.icon
            const active = section === b.key
            const showDivider = i > 0 && BRANCHES[i - 1].group !== b.group
            return (
              <React.Fragment key={b.key}>
                {showDivider && (
                  <span className="mx-2 flex items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-text-soft-400">
                    <span className="h-4 w-px bg-stroke-soft-200" />Billing
                  </span>
                )}
                <button
                  onClick={() => setSection(b.key)}
                  className={cn('relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[13px] font-medium transition-colors',
                    active ? 'text-brand-500' : 'text-text-sub-600 hover:text-text-strong-950')}
                >
                  <Icon size={15} />
                  {b.label}
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />}
                </button>
              </React.Fragment>
            )
          })}
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] p-5">{children}</div>
        </main>
      </div>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="animate-in pointer-events-auto flex items-center gap-2 rounded-lg border border-stroke-soft-200 bg-bg-white-0 px-4 py-2.5 text-[13px] font-medium text-text-strong-950 shadow-lg">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-state-success-lighter text-state-success-base"><ShieldCheck size={13} /></span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
