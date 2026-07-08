import { AlertTriangle, TruckIcon, Package, ShieldAlert, DollarSign, ArrowRight, Thermometer, Clock } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts'
import { useStore } from '@/lib/store'
import { Card, CardHeader, Stat, Badge, Progress, Button, type BadgeTone } from '@/components/ui'
import { LoadStatusBadge, flagTone, flagLabel } from '@/lib/status'
import { currency, expiryStatus } from '@/lib/utils'

const revenue8w = [
  { w: 'W1', v: 38200 }, { w: 'W2', v: 41500 }, { w: 'W3', v: 36900 }, { w: 'W4', v: 44100 },
  { w: 'W5', v: 47800 }, { w: 'W6', v: 43200 }, { w: 'W7', v: 51200 }, { w: 'W8', v: 49400 },
]

export function DashboardScreen() {
  const { loads, trucks, trailers, drivers, setSection } = useStore()

  const byStatus = {
    NOT_COVERED: loads.filter((l) => l.status === 'NOT_COVERED').length,
    DISPATCHED: loads.filter((l) => l.status === 'DISPATCHED').length,
    IN_TRANSIT: loads.filter((l) => l.status === 'IN_TRANSIT').length,
    DELIVERED: loads.filter((l) => l.status === 'DELIVERED').length,
  }
  const attention = loads.filter((l) => l.flag !== 'NONE')

  // Safety summary: expired + expiring-soon across assets
  const expCount = (arr: (string | undefined | null)[]) => {
    let expired = 0, soon = 0
    arr.forEach((d) => { const s = expiryStatus(d); if (s === 'expired') expired++; else if (s === 'soon') soon++ })
    return { expired, soon }
  }
  const driverSafety = expCount(drivers.flatMap((d) => [d.cdlExp, d.medicalCardExp]))
  const truckSafety = expCount(trucks.flatMap((t) => [t.registrationExp, t.insuranceExp, t.inspectionExp]))
  const trailerSafety = expCount(trailers.flatMap((t) => [t.registrationExp, t.inspectionExp]))
  const totalExpired = driverSafety.expired + truckSafety.expired + trailerSafety.expired
  const totalSoon = driverSafety.soon + truckSafety.soon + trailerSafety.soon

  const revenue = loads.reduce((s, l) => s + l.customerRate, 0)
  const activeTrucks = trucks.filter((t) => t.status === 'ACTIVE').length

  const topCustomers = Object.entries(
    loads.reduce<Record<string, number>>((acc, l) => { acc[l.customer] = (acc[l.customer] || 0) + l.customerRate; return acc }, {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Fleet Dashboard</h1>
          <p className="text-[13px] text-muted-foreground">Company-wide operational pulse · Wed, Jul 8, 2026</p>
        </div>
        <Button onClick={() => setSection('dispatch')}>Open Dispatch<ArrowRight size={16} /></Button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active Loads" value={byStatus.DISPATCHED + byStatus.IN_TRANSIT} sub={`${byStatus.NOT_COVERED} uncovered`} tone={byStatus.NOT_COVERED ? 'red' : 'green'} icon={<Package size={16} />} info="Loads currently dispatched or in transit. Uncovered = still need a driver." />
        <Stat label="Fleet Utilization" value={`${Math.round((activeTrucks / trucks.length) * 100)}%`} sub={`${activeTrucks}/${trucks.length} trucks active`} icon={<TruckIcon size={16} />} info="Active trucks ÷ total fleet." />
        <Stat label="Revenue (open board)" value={currency(revenue, { compact: true })} sub="+12% vs last wk" tone="green" icon={<DollarSign size={16} />} info="Total customer revenue booked on the current load board." />
        <Stat label="Safety Alerts" value={totalExpired + totalSoon} sub={`${totalExpired} expired · ${totalSoon} soon`} tone={totalExpired ? 'red' : 'amber'} icon={<ShieldAlert size={16} />} info="Expired + expiring-soon compliance items across drivers, trucks & trailers." />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Ship Summary */}
        <Card className="lg:col-span-2">
          <CardHeader title="Ship Summary" subtitle="All trips today" action={<Badge tone="purple">{loads.length} loads</Badge>} info="Every load today grouped by coverage & transit status." />
          <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
            {([
              ['Not Covered', byStatus.NOT_COVERED, 'slate'],
              ['Dispatched', byStatus.DISPATCHED, 'purple'],
              ['In Transit', byStatus.IN_TRANSIT, 'blue'],
              ['Delivered', byStatus.DELIVERED, 'green'],
            ] as [string, number, BadgeTone][]).map(([label, n, tone]) => (
              <button key={label} onClick={() => setSection('loads')} className="p-4 text-left transition-colors hover:bg-muted/50">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground"><span className={`h-2 w-2 rounded-full ${tone === 'slate' ? 'bg-slate-400' : tone === 'purple' ? 'bg-brand-400' : tone === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'}`} />{label}</div>
                <div className="mt-1.5 text-2xl font-semibold">{n}</div>
              </button>
            ))}
          </div>
          <div className="border-t border-border p-4">
            <div className="mb-2 text-[12px] font-medium text-muted-foreground">8-Week Revenue</div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue8w} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="w" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8b8b8b' }} />
                  <Tooltip cursor={{ fill: 'rgba(93,47,112,0.06)' }} contentStyle={{ borderRadius: 8, border: '1px solid #ebebeb', fontSize: 12 }} formatter={(v: number) => [currency(v), 'Revenue']} />
                  <Bar dataKey="v" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={44}>
                    {revenue8w.map((_, i) => <Cell key={i} fill={i === revenue8w.length - 1 ? '#6e3785' : '#d9c7e4'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Requires Attention */}
        <Card>
          <CardHeader title="Requires Attention" subtitle={`${attention.length} loads flagged`} action={<AlertTriangle size={16} className="text-amber-500" />} info="Active loads flagged by severity — running late, temperature discrepancy, etc." />
          <div className="divide-y divide-border">
            {attention.length === 0 && <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">All clear ✓</div>}
            {attention.map((l) => (
              <button key={l.id} onClick={() => setSection('loads')} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
                <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${flagTone[l.flag] === 'red' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                  {l.flag === 'TEMP_DISCREPANCY' ? <Thermometer size={15} /> : l.flag === 'RUNNING_LATE' ? <Clock size={15} /> : <AlertTriangle size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold">{l.loadNumber}</span>
                    <Badge tone={flagTone[l.flag]}>{flagLabel[l.flag]}</Badge>
                  </div>
                  <div className="truncate text-[12px] text-muted-foreground">{l.customer} · {l.originCity} → {l.destCity}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Safety Summary */}
        <Card className="lg:col-span-2">
          <CardHeader title="Safety Summary" subtitle="Expiring & expired compliance items" action={<Button variant="outline" size="sm" onClick={() => setSection('compliance')}>View all</Button>} info="Expired vs. expiring-within-30-days credentials by asset type." />
          <div className="grid grid-cols-3 divide-x divide-border">
            {([
              ['Drivers', driverSafety, 'Licenses & medical cards'],
              ['Trucks', truckSafety, 'Reg · Insurance · Inspection'],
              ['Trailers', trailerSafety, 'Reg · Inspection'],
            ] as [string, { expired: number; soon: number }, string][]).map(([label, s, hint]) => (
              <div key={label} className="p-4">
                <div className="text-[13px] font-semibold">{label}</div>
                <div className="mt-2 flex gap-4">
                  <div><div className="text-xl font-semibold text-red-600">{s.expired}</div><div className="text-[11px] text-muted-foreground">Expired</div></div>
                  <div><div className="text-xl font-semibold text-amber-600">{s.soon}</div><div className="text-[11px] text-muted-foreground">≤ 30 days</div></div>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">{hint}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader title="Top Customers" subtitle="By booked revenue" />
          <div className="space-y-3 p-4">
            {topCustomers.map(([name, rev], i) => {
              const max = topCustomers[0][1]
              return (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium">{i + 1}. {name}</span>
                    <span className="text-muted-foreground">{currency(rev, { compact: true })}</span>
                  </div>
                  <Progress value={(rev / max) * 100} />
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
