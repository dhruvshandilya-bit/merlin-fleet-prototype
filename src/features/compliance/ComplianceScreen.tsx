import { useState } from 'react'
import {
  ShieldCheck, ShieldAlert, AlertTriangle, ClipboardCheck, Clock, Bell, CheckCircle2,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card, CardHeader, Stat, Table, Th, Td, Tr, Button, Badge, Tabs, EmptyState, InfoTip, type BadgeTone } from '@/components/ui'
import { ExpiryBadge } from '@/lib/status'
import { expiryStatus, daysUntil, formatDate, type ExpiryStatus } from '@/lib/utils'
import { PageHead } from '@/features/vehicles/VehiclesScreen'

type Entity = 'Driver' | 'Truck' | 'Trailer'

interface ComplianceItem {
  key: string
  entity: Entity
  name: string
  item: string
  date: string
  status: ExpiryStatus
}

const entityTone: Record<Entity, BadgeTone> = {
  Driver: 'blue',
  Truck: 'purple',
  Trailer: 'slate',
}

type Pill = 'all' | 'expired' | 'soon'

export function ComplianceScreen() {
  const { drivers, trucks, trailers, safety, notify } = useStore()
  const [tab, setTab] = useState('expirations')
  const [pill, setPill] = useState<Pill>('all')

  const items: ComplianceItem[] = []
  for (const d of drivers) {
    items.push({ key: `${d.id}-cdl`, entity: 'Driver', name: d.name, item: 'CDL License', date: d.cdlExp, status: expiryStatus(d.cdlExp) })
    items.push({ key: `${d.id}-med`, entity: 'Driver', name: d.name, item: 'Medical Card', date: d.medicalCardExp, status: expiryStatus(d.medicalCardExp) })
  }
  for (const t of trucks) {
    const name = `#${t.unitNumber}`
    items.push({ key: `${t.id}-reg`, entity: 'Truck', name, item: 'Registration', date: t.registrationExp, status: expiryStatus(t.registrationExp) })
    items.push({ key: `${t.id}-ins`, entity: 'Truck', name, item: 'Insurance', date: t.insuranceExp, status: expiryStatus(t.insuranceExp) })
    items.push({ key: `${t.id}-insp`, entity: 'Truck', name, item: 'Annual Inspection', date: t.inspectionExp, status: expiryStatus(t.inspectionExp) })
  }
  for (const r of trailers) {
    const name = `#${r.unitNumber}`
    items.push({ key: `${r.id}-reg`, entity: 'Trailer', name, item: 'Registration', date: r.registrationExp, status: expiryStatus(r.registrationExp) })
    items.push({ key: `${r.id}-insp`, entity: 'Trailer', name, item: 'Annual Inspection', date: r.inspectionExp, status: expiryStatus(r.inspectionExp) })
  }

  const expiredCount = items.filter((i) => i.status === 'expired').length
  const soonCount = items.filter((i) => i.status === 'soon').length
  const okCount = items.filter((i) => i.status === 'ok').length

  const sorted = [...items].sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
  const rows = sorted.filter((i) => pill === 'all' || i.status === pill)

  const pills: { key: Pill; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'expired', label: 'Expired' },
    { key: 'soon', label: 'Expiring soon' },
  ]

  const driverName = (id?: string | null) => drivers.find((d) => d.id === id)?.name
  const truckLabel = (id?: string | null) => {
    const t = trucks.find((x) => x.id === id)
    return t ? `#${t.unitNumber}` : undefined
  }

  return (
    <div className="space-y-4">
      <PageHead title="Safety & Compliance" sub="Expiration tracking & DOT safety events" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Expired" value={expiredCount} tone="red" sub="Action required" icon={<ShieldAlert size={18} className="text-red-500" />} info="Credentials past their expiration date — action required." />
        <Stat label="Expiring ≤30 days" value={soonCount} tone="amber" sub="Renew soon" icon={<Clock size={18} className="text-amber-500" />} info="Credentials expiring within 30 days — renew soon." />
        <Stat label="Compliant" value={okCount} tone="green" sub="Valid" icon={<ShieldCheck size={18} className="text-emerald-500" />} info="Credentials currently valid." />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'expirations', label: 'Expirations', count: expiredCount + soonCount },
          { key: 'safety', label: 'Safety Events', count: safety.length },
        ]}
      />

      {tab === 'expirations' && (
        <Card>
          <CardHeader
            title="Credential & document expirations"
            subtitle="Licenses, medical cards, registrations, insurance & inspections"
            action={<Button variant="outline" size="sm" onClick={() => notify('Renewal reminders sent')}><Bell size={14} />Send reminders</Button>}
          />
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            {pills.map((p) => (
              <button
                key={p.key}
                onClick={() => setPill(p.key)}
                className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${pill === p.key ? 'border-primary bg-secondary text-primary' : 'border-border bg-white text-muted-foreground hover:bg-muted'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Entity</Th><Th>Name / Unit</Th><Th>Item</Th><Th>Expiry Date</Th><Th>Days <InfoTip content="Days until expiry — negative means already expired." /></Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => {
                const d = daysUntil(i.date)
                const daysCell =
                  d < 0
                    ? <span className="font-medium text-red-600">Expired {Math.abs(d)}d ago</span>
                    : d <= 30
                      ? <span className="font-medium text-amber-600">{d} days</span>
                      : <span className="text-muted-foreground">{d} days</span>
                return (
                  <Tr key={i.key}>
                    <Td><Badge tone={entityTone[i.entity]}>{i.entity}</Badge></Td>
                    <Td className="font-medium">{i.name}</Td>
                    <Td>{i.item}</Td>
                    <Td>{formatDate(i.date)}</Td>
                    <Td className="tabular-nums">{daysCell}</Td>
                    <Td><ExpiryBadge iso={i.date} /></Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
          {rows.length === 0 && <EmptyState icon={<CheckCircle2 size={28} />} title="Nothing here" hint="No items match this filter." />}
        </Card>
      )}

      {tab === 'safety' && (
        <Card>
          <CardHeader title="DOT safety events" subtitle="Accidents & roadside inspections" />
          <div className="divide-y divide-border">
            {safety.map((s) => {
              const isAccident = s.type === 'ACCIDENT'
              const statusTone: BadgeTone = s.status === 'CLOSED' ? 'green' : s.status === 'OPEN' ? 'red' : 'amber'
              const involved: string[] = []
              const dn = driverName(s.driverId)
              const tn = truckLabel(s.truckId)
              if (dn) involved.push(dn)
              if (tn) involved.push(`Truck ${tn}`)
              return (
                <div key={s.id} className="flex gap-3 p-4">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isAccident ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {isAccident ? <AlertTriangle size={17} /> : <ClipboardCheck size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[13px] font-semibold text-foreground">
                          {isAccident ? 'Accident' : 'Roadside Inspection'} · {s.level}
                        </div>
                        <div className="mt-0.5 text-[12px] text-muted-foreground">{formatDate(s.date)} · {s.location}</div>
                      </div>
                      <Badge tone={statusTone}>{s.status.replace('_', ' ')}</Badge>
                    </div>
                    {involved.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {involved.map((v) => <Badge key={v} tone="gray">{v}</Badge>)}
                      </div>
                    )}
                    <div className="mt-2 text-[12px] text-foreground">{s.comments}</div>
                  </div>
                </div>
              )
            })}
          </div>
          {safety.length === 0 && <EmptyState icon={<ClipboardCheck size={28} />} title="No safety events" hint="Clean record across the fleet." />}
        </Card>
      )}
    </div>
  )
}
