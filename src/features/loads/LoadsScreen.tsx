import { useMemo, useState } from 'react'
import {
  Package, Plus, MapPin, ArrowRight, Truck, Container, User, Sparkles, Upload,
  CircleDot, CheckCircle2, PlayCircle, FileCheck2, Radio,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import {
  Card, Table, Th, Td, Tr, Button, Badge, Drawer, Modal, Field, Input, Select, KV,
  SectionTitle, Progress, EmptyState, Metric, MetricRow, InfoTip,
} from '@/components/ui'
import { LoadStatusBadge, loadStatusLabel, flagTone, flagLabel } from '@/lib/status'
import { currency, num, formatDate, perMile } from '@/lib/utils'
import type { Load, LoadStatus, EquipmentType } from '@/lib/types'
import { PageHead } from '@/features/vehicles/VehiclesScreen'

const STATUS_TABS: { key: LoadStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'NOT_COVERED', label: 'Not Covered' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' },
]

export function LoadsScreen() {
  const { loads, driverById, truckById, trailerById, advanceLoad, deliverLoad, setSection } = useStore()
  const [tab, setTab] = useState<LoadStatus | 'ALL'>('ALL')
  const [selected, setSelected] = useState<Load | null>(null)
  const [showNew, setShowNew] = useState(false)

  const rows = loads.filter((l) => tab === 'ALL' || l.status === tab)
  const current = selected ? loads.find((l) => l.id === selected.id) ?? null : null

  const roll = useMemo(() => {
    const miles = rows.reduce((s, l) => s + l.miles, 0)
    const revenue = rows.reduce((s, l) => s + l.customerRate, 0)
    const carrier = rows.reduce((s, l) => s + l.carrierRate, 0)
    const margin = revenue - carrier
    return {
      miles, revenue, carrier, margin,
      marginPct: revenue ? (margin / revenue) * 100 : 0,
      rpm: miles ? revenue / miles : 0,
    }
  }, [rows])

  // Board-wide totals (across ALL loads, not the filtered rows) for the top metric row.
  const totalRevenue = loads.reduce((s, l) => s + l.customerRate, 0)
  const totalMiles = loads.reduce((s, l) => s + l.miles, 0)
  const uncovered = loads.filter((l) => l.status === 'NOT_COVERED').length
  const delivered = loads.filter((l) => l.status === 'DELIVERED').length

  return (
    <div className="space-y-4">
      <PageHead title="Loads" count={loads.length} sub="Every load & trip — coverage, margin and rate-per-mile"
        action={<Button onClick={() => setShowNew(true)}><Plus size={16} />New Load</Button>} />

      <MetricRow cols={4}>
        <Metric label="Booked Revenue" value={currency(totalRevenue)} info="Total customer revenue across all loads on the board." />
        <Metric label="Avg RPM" value={perMile(totalRevenue, totalMiles)} info="Revenue ÷ total miles — average rate per mile." />
        <Metric label="Uncovered" value={uncovered} tone="red" info="Loads with no driver assigned yet." />
        <Metric label="Delivered" value={delivered} tone="green" />
      </MetricRow>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((s) => {
          const n = s.key === 'ALL' ? loads.length : loads.filter((l) => l.status === s.key).length
          return (
            <button key={s.key} onClick={() => setTab(s.key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${tab === s.key ? 'border-primary bg-secondary text-primary' : 'border-border bg-white text-muted-foreground hover:bg-muted'}`}>
              {s.label}<span className={`rounded-full px-1.5 text-[10px] ${tab === s.key ? 'bg-brand-100 text-brand-600' : 'bg-zinc-100 text-zinc-500'}`}>{n}</span>
            </button>
          )
        })}
      </div>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Load #</Th><Th>Customer</Th><Th>Lane</Th><Th>Equip</Th><Th>Status</Th>
              <Th>Driver</Th><Th className="text-right">Miles</Th><Th className="text-right">Revenue</Th>
              <Th className="text-right">RPM</Th><Th>Pickup</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <Tr key={l.id} onClick={() => setSelected(l)}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{l.loadNumber}</span>
                    {l.flag !== 'NONE' && <Badge tone={flagTone[l.flag]}>{flagLabel[l.flag]}</Badge>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{l.commodity} · {l.poNumber}</div>
                </Td>
                <Td>{l.customer}</Td>
                <Td>
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <span className="font-medium">{l.originCity}, {l.originState}</span>
                    <ArrowRight size={13} className="text-muted-foreground" />
                    <span className="font-medium">{l.destCity}, {l.destState}</span>
                  </div>
                </Td>
                <Td><Badge tone="purple">{l.equipmentType}</Badge></Td>
                <Td>
                  <div className="flex flex-col gap-1">
                    <LoadStatusBadge status={l.status} />
                    {l.status === 'IN_TRANSIT' && <div className="w-24"><Progress value={l.progress} tone="blue" /></div>}
                  </div>
                </Td>
                <Td>{driverById(l.driverId)?.name ?? <span className="text-muted-foreground">—</span>}</Td>
                <Td className="text-right tabular-nums">{num(l.miles)}</Td>
                <Td className="text-right font-medium tabular-nums">{currency(l.customerRate)}</Td>
                <Td className="text-right tabular-nums">{perMile(l.customerRate, l.miles)}</Td>
                <Td className="text-muted-foreground">{formatDate(l.pickupDate)}</Td>
              </Tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/60 text-[12px] font-semibold">
              <Td className="text-muted-foreground">{rows.length} loads</Td>
              <Td /><Td /><Td /><Td /><Td className="text-right text-muted-foreground">Totals</Td>
              <Td className="text-right tabular-nums">{num(roll.miles)} mi</Td>
              <Td className="text-right tabular-nums">{currency(roll.revenue)}</Td>
              <Td className="text-right tabular-nums">{perMile(roll.revenue, roll.miles)}/mi</Td>
              <Td />
            </tr>
          </tfoot>
        </Table>
      </Card>

      {/* Load detail drawer */}
      <Drawer
        open={!!current}
        onClose={() => setSelected(null)}
        width="max-w-3xl"
        title={current && <span className="flex items-center gap-2"><Package size={18} className="text-primary" />{current.loadNumber}</span>}
        subtitle={current && `${current.customer} · ${current.commodity}`}
        footer={current && (
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-muted-foreground">Margin <span className="font-semibold text-foreground">{currency(current.customerRate - current.carrierRate)}</span> · RPM {perMile(current.customerRate, current.miles)}/mi</div>
            <div className="flex gap-2">
              {current.status === 'NOT_COVERED' && <Button size="sm" onClick={() => { setSelected(null); setSection('dispatch') }}><Radio size={15} />Dispatch</Button>}
              {current.status === 'DISPATCHED' && <Button size="sm" onClick={() => advanceLoad(current.id, 15)}><PlayCircle size={15} />Mark In Transit</Button>}
              {current.status === 'IN_TRANSIT' && <>
                <Button size="sm" variant="outline" onClick={() => advanceLoad(current.id, Math.min(95, current.progress + 20))}>Advance</Button>
                <Button size="sm" onClick={() => deliverLoad(current.id)}><FileCheck2 size={15} />Deliver + POD</Button>
              </>}
            </div>
          </div>
        )}
      >
        {current && (
          <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <LoadStatusBadge status={current.status} />
              {current.flag !== 'NONE' && <Badge tone={flagTone[current.flag]}>{flagLabel[current.flag]}</Badge>}
              <Badge tone="purple">{current.equipmentType}</Badge>
              {current.podUploaded && <Badge tone="green"><FileCheck2 size={11} />POD on file</Badge>}
            </div>

            {/* Financials */}
            <div>
              <SectionTitle info="Customer rate is what you bill; carrier rate applies only to brokered loads. Margin = customer − carrier.">Financials</SectionTitle>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-border p-4 sm:grid-cols-4">
                <KV label="Customer Rate" value={currency(current.customerRate)} />
                <KV label="Carrier Rate" value={current.carrierRate ? currency(current.carrierRate) : 'In-house'} />
                <KV label="Miles" value={`${num(current.miles)} mi`} />
                <KV label="Rate / Mile" value={current.miles ? `${perMile(current.customerRate, current.miles)}/mi` : '—'} />
              </div>
            </div>

            {/* Assigned assets */}
            <div>
              <SectionTitle>Assigned</SectionTitle>
              {current.driverId ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <AssetCard icon={<User size={15} />} label="Driver" value={driverById(current.driverId)?.name} sub={driverById(current.driverId)?.phone} />
                  <AssetCard icon={<Truck size={15} />} label="Truck" value={`#${truckById(current.truckId)?.unitNumber ?? '—'}`} sub={`${truckById(current.truckId)?.make ?? ''} ${truckById(current.truckId)?.model ?? ''}`} />
                  <AssetCard icon={<Container size={15} />} label="Trailer" value={`#${trailerById(current.trailerId)?.unitNumber ?? '—'}`} sub={trailerById(current.trailerId)?.equipmentType} />
                </div>
              ) : (
                <EmptyState icon={<Radio size={26} />} title="Not covered yet" hint="Open the Dispatch planner to assign a driver, truck and trailer." />
              )}
            </div>

            {/* Stops */}
            <div>
              <SectionTitle>Stops · {current.stops.length}</SectionTitle>
              <div className="relative space-y-0 rounded-lg border border-border p-4">
                {current.stops.map((s, i) => (
                  <div key={s.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < current.stops.length - 1 && <span className="absolute left-[11px] top-6 h-full w-px bg-border" />}
                    <span className={`z-10 mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full ${s.completed ? 'bg-emerald-100 text-emerald-600' : s.type === 'PICKUP' ? 'bg-brand-50 text-brand-500' : 'bg-blue-50 text-blue-600'}`}>
                      {s.completed ? <CheckCircle2 size={14} /> : <CircleDot size={14} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge tone={s.type === 'PICKUP' ? 'purple' : 'blue'}>{s.type === 'PICKUP' ? 'Pickup' : 'Delivery'}</Badge>
                        <span className="text-[13px] font-medium">{s.location}</span>
                        {s.completed && <Badge tone="green">Done</Badge>}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
                        <MapPin size={12} />{s.city}, {s.state} · {s.window} · {s.scheduleType === 'APPOINTMENT' ? 'Appt' : 'FCFS'} · {s.loadingType}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <NewLoadModal open={showNew} onClose={() => setShowNew(false)} />
    </div>
  )
}

function AssetCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground"><span className="text-primary">{icon}</span>{label}</div>
      <div className="mt-1 text-sm font-semibold">{value ?? '—'}</div>
      {sub && <div className="text-[12px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

function NewLoadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createLoad } = useStore()
  const [f, setF] = useState({
    customer: '', poNumber: '', commodity: '', equipmentType: 'Dry Van' as EquipmentType, weight: '40000',
    originCity: '', originState: 'TX', destCity: '', destState: 'TX', miles: '', customerRate: '', pickupDate: '2026-07-10',
  })
  const [parsed, setParsed] = useState(false)
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))

  const parseRateCon = () => {
    // Mock AI rate-confirmation parse — auto-fills the form (mirrors Merlin's Sales PDF parser)
    setF({
      customer: 'TQL Logistics', poNumber: 'PO-73312', commodity: 'Packaged foods', equipmentType: 'Dry Van',
      weight: '42000', originCity: 'Dallas', originState: 'TX', destCity: 'Memphis', destState: 'TN',
      miles: '452', customerRate: '1950', pickupDate: '2026-07-11',
    })
    setParsed(true)
  }

  const submit = () => {
    createLoad({
      customer: f.customer || 'New Customer', poNumber: f.poNumber, commodity: f.commodity,
      equipmentType: f.equipmentType, weight: Number(f.weight) || 40000,
      originCity: f.originCity, originState: f.originState, destCity: f.destCity, destState: f.destState,
      miles: Number(f.miles) || 0, customerRate: Number(f.customerRate) || 0, pickupDate: f.pickupDate, deliveryDate: f.pickupDate,
      stops: [
        { id: 's-a', type: 'PICKUP', location: `${f.customer} Origin`, city: f.originCity, state: f.originState, scheduleType: 'APPOINTMENT', window: `${formatDate(f.pickupDate)}, 08:00`, loadingType: 'Live', commodity: f.commodity, completed: false },
        { id: 's-b', type: 'DELIVERY', location: `${f.customer} Dest`, city: f.destCity, state: f.destState, scheduleType: 'APPOINTMENT', window: `${formatDate(f.pickupDate)}, 17:00`, loadingType: 'Live', commodity: f.commodity, completed: false },
      ],
    })
    setF((p) => ({ ...p, customer: '', poNumber: '', commodity: '', originCity: '', destCity: '', miles: '', customerRate: '' }))
    setParsed(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} width="max-w-3xl" title="New Load" subtitle="Create a load & trip"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Create Load</Button></>}>
      <div className="space-y-5">
        {/* AI rate-con parse */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-brand-200 bg-secondary/60 p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary"><Sparkles size={17} /></span>
            <div>
              <div className="text-[13px] font-semibold">AI Rate-Confirmation Parsing</div>
              <div className="text-[12px] text-muted-foreground">{parsed ? 'Parsed rate-con → form auto-filled below.' : 'Upload a rate-con PDF/JPEG to auto-populate this load.'}</div>
            </div>
          </div>
          <Button variant={parsed ? 'outline' : 'secondary'} size="sm" onClick={parseRateCon}><Upload size={14} />{parsed ? 'Re-parse' : 'Upload PDF'}</Button>
        </div>

        <div>
          <SectionTitle>General</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Customer"><Input value={f.customer} onChange={(e) => set('customer', e.target.value)} placeholder="e.g. Sysco Foods" /></Field>
            <Field label="PO Number"><Input value={f.poNumber} onChange={(e) => set('poNumber', e.target.value)} placeholder="PO-000" /></Field>
            <Field label="Commodity"><Input value={f.commodity} onChange={(e) => set('commodity', e.target.value)} placeholder="Frozen goods" /></Field>
            <Field label="Equipment">
              <Select value={f.equipmentType} onChange={(e) => set('equipmentType', e.target.value)}>
                {(['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Tanker'] as EquipmentType[]).map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Weight (lbs)"><Input type="number" value={f.weight} onChange={(e) => set('weight', e.target.value)} /></Field>
            <Field label="Pickup Date"><Input type="date" value={f.pickupDate} onChange={(e) => set('pickupDate', e.target.value)} /></Field>
          </div>
        </div>

        <div>
          <SectionTitle>Lane</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Origin City"><Input value={f.originCity} onChange={(e) => set('originCity', e.target.value)} placeholder="Dallas" /></Field>
            <Field label="Origin State"><Input value={f.originState} onChange={(e) => set('originState', e.target.value)} /></Field>
            <Field label="Dest City"><Input value={f.destCity} onChange={(e) => set('destCity', e.target.value)} placeholder="Houston" /></Field>
            <Field label="Dest State"><Input value={f.destState} onChange={(e) => set('destState', e.target.value)} /></Field>
            <Field label="Miles"><Input type="number" value={f.miles} onChange={(e) => set('miles', e.target.value)} /></Field>
            <Field label="Customer Rate ($)"><Input type="number" value={f.customerRate} onChange={(e) => set('customerRate', e.target.value)} /></Field>
          </div>
        </div>
      </div>
    </Modal>
  )
}
