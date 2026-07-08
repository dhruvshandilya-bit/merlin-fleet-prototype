import { useState } from 'react'
import { Plus, User, CreditCard, Phone, Mail, StickyNote, Clock } from 'lucide-react'
import { useStore } from '@/lib/store'
import {
  Card, Table, Th, Td, Tr, Button, Badge, Drawer, Modal, Tabs, KV, Field, Input,
  Progress, SectionTitle, EmptyState, Metric, MetricRow, InfoTip, type BadgeTone,
} from '@/components/ui'
import { DriverStatusBadge, ExpiryBadge } from '@/lib/status'
import { formatDate, currency, daysUntil, expiryStatus } from '@/lib/utils'
import { PageHead } from '@/features/vehicles/VehiclesScreen'
import type { Driver } from '@/lib/types'

const ENDORSEMENT_NOTE = 'H = Hazmat · N = Tanker · T = Doubles/Triples · X = Tanker + Hazmat'

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

function hosTone(hosRemaining: number): BadgeTone {
  if (hosRemaining >= 6) return 'green'
  if (hosRemaining >= 2) return 'amber'
  return 'red'
}

function isExpired(iso?: string | null): boolean {
  if (!iso) return false
  return daysUntil(iso) < 0
}

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'DRIVING', label: 'Driving' },
  { key: 'ON_DUTY', label: 'On Duty' },
  { key: 'OFF_DUTY', label: 'Off Duty' },
]

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-[12px] font-semibold text-white">
      {initials(name)}
    </span>
  )
}

function Endorsements({ codes }: { codes: string[] }) {
  if (codes.length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {codes.map((c) => (
        <Badge key={c} tone="gray">{c}</Badge>
      ))}
    </div>
  )
}

export function DriversScreen() {
  const { drivers, loads, truckById, createDriver, notify, setSection } = useStore()
  const [selected, setSelected] = useState<Driver | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [tab, setTab] = useState('info')
  const [showAdd, setShowAdd] = useState(false)

  const rows = drivers.filter((d) => statusFilter === 'ALL' || d.status === statusFilter)

  const availableCount = drivers.filter((d) => d.status === 'AVAILABLE').length
  const drivingCount = drivers.filter((d) => d.status === 'DRIVING').length
  const complianceRiskCount = drivers.filter(
    (d) => expiryStatus(d.cdlExp) === 'expired' || expiryStatus(d.medicalCardExp) === 'expired',
  ).length
  const avgHos = drivers.length
    ? drivers.reduce((sum, d) => sum + d.hosRemaining, 0) / drivers.length
    : 0

  const selectedTruck = selected ? truckById(selected.assignedTruckId) : undefined
  const selectedLoads = selected
    ? loads.filter((l) => l.driverId === selected.id && l.status !== 'DELIVERED')
    : []

  return (
    <div className="space-y-4">
      <PageHead title="Drivers" count={drivers.length} sub="Roster — hours of service, qualifications & compliance" />

      <MetricRow cols={5}>
        <Metric label="Total Drivers" value={drivers.length} />
        <Metric label="Available" value={availableCount} tone="green" />
        <Metric label="Driving" value={drivingCount} />
        <Metric
          label="Compliance Risk"
          value={complianceRiskCount}
          tone="red"
          info="Drivers with an expired CDL or medical card — blocked from dispatch."
        />
        <Metric
          label="Avg HOS"
          value={`${avgHos.toFixed(1)}h`}
          info="Average hours-of-service remaining today across the roster."
        />
      </MetricRow>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <button key={s.key} onClick={() => setStatusFilter(s.key)}
            className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${statusFilter === s.key ? 'border-primary bg-secondary text-primary' : 'border-border bg-white text-muted-foreground hover:bg-muted'}`}>
            {s.label}
          </button>
        ))}
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={15} />Add Driver</Button>
        </div>
      </div>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Driver</Th><Th>Status</Th><Th>HOS <InfoTip content="Hours of Service remaining today under the 11-hour driving limit." /></Th><Th>CDL</Th><Th>Medical Card</Th>
              <Th>Endorsements</Th><Th>Assigned Truck</Th><Th>Pay</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const truck = truckById(d.assignedTruckId)
              const riskRow = isExpired(d.cdlExp) || isExpired(d.medicalCardExp)
              return (
                <Tr key={d.id} onClick={() => { setSelected(d); setTab('info') }}
                  className={riskRow ? 'border-l-2 border-l-red-400' : undefined}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={d.name} />
                      <div>
                        <div className="font-semibold">{d.name}</div>
                        <div className="text-[11px] text-muted-foreground">{d.homeCity}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><DriverStatusBadge status={d.status} /></Td>
                  <Td>
                    <div className="w-24">
                      <div className="mb-1 text-[12px] tabular-nums text-foreground">{d.hosRemaining}h</div>
                      <Progress value={(d.hosRemaining / 11) * 100} tone={hosTone(d.hosRemaining)} />
                    </div>
                  </Td>
                  <Td><ExpiryBadge iso={d.cdlExp} /></Td>
                  <Td><ExpiryBadge iso={d.medicalCardExp} /></Td>
                  <Td><Endorsements codes={d.endorsements} /></Td>
                  <Td>{truck ? `Truck #${truck.unitNumber}` : <span className="text-muted-foreground">Unassigned</span>}</Td>
                  <Td className="tabular-nums">${d.payRatePerMile.toFixed(2)}/mi</Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected && <span className="flex items-center gap-2"><User size={18} className="text-primary" />{selected.name}</span>}
        subtitle={selected && `${selected.homeCity} · Hired ${formatDate(selected.hireDate)}`}
        footer={selected && (
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-muted-foreground">{selectedTruck ? `Truck #${selectedTruck.unitNumber}` : 'Unassigned'} · {selectedLoads.length} active load{selectedLoads.length === 1 ? '' : 's'}</div>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => notify(`Editing ${selected.name}`)}>Edit</Button><Button size="sm" onClick={() => { setSelected(null); setSection('dispatch') }}>Assign to Load</Button></div>
          </div>
        )}
      >
        {selected && (
          <div className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <DriverStatusBadge status={selected.status} />
              <ExpiryBadge iso={selected.cdlExp} label="CDL" />
              <ExpiryBadge iso={selected.medicalCardExp} label="Medical" />
            </div>

            <Tabs
              active={tab} onChange={setTab}
              tabs={[
                { key: 'info', label: 'Info' },
                { key: 'quals', label: 'Qualifications' },
                { key: 'assign', label: 'Assignment', count: selectedLoads.length },
                { key: 'pay', label: 'Pay' },
                { key: 'notes', label: 'Notes' },
              ]}
            />

            <div className="pt-4">
              {tab === 'info' && (
                <div className="space-y-5">
                  <div>
                    <SectionTitle>Contact & Employment</SectionTitle>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-border p-4 sm:grid-cols-3">
                      <KV label="Phone" value={<span className="flex items-center gap-1.5"><Phone size={13} className="text-primary" />{selected.phone}</span>} />
                      <KV label="Email" value={<span className="flex items-center gap-1.5"><Mail size={13} className="text-primary" />{selected.email}</span>} />
                      <KV label="Home City" value={selected.homeCity} />
                      <KV label="Hire Date" value={formatDate(selected.hireDate)} />
                      <KV label="CDL Number" value={selected.cdlNumber} />
                      <KV label="Status" value={<DriverStatusBadge status={selected.status} />} />
                    </div>
                  </div>
                </div>
              )}

              {tab === 'quals' && (
                <div className="space-y-3">
                  <SectionTitle>Licensing & Certifications</SectionTitle>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-border p-4 sm:grid-cols-3">
                    <KV label="CDL Number" value={<span className="flex items-center gap-1.5"><CreditCard size={13} className="text-primary" />{selected.cdlNumber}</span>} />
                    <KV label="CDL Expiry" value={<ExpiryBadge iso={selected.cdlExp} />} />
                    <KV label="Medical Card Expiry" value={<ExpiryBadge iso={selected.medicalCardExp} />} />
                    <KV label="Endorsements" value={<Endorsements codes={selected.endorsements} />} />
                  </div>
                  <p className="text-[12px] text-muted-foreground">{ENDORSEMENT_NOTE}</p>
                </div>
              )}

              {tab === 'assign' && (
                <div className="space-y-5">
                  <div>
                    <SectionTitle>Assigned Truck</SectionTitle>
                    {selectedTruck ? (
                      <div className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Truck #{selectedTruck.unitNumber}</div>
                          <Badge tone="gray">{selectedTruck.fleet}</Badge>
                        </div>
                        <div className="mt-1 text-[12px] text-muted-foreground">{selectedTruck.year} {selectedTruck.make} {selectedTruck.model} · VIN {selectedTruck.vin.slice(-6)}</div>
                      </div>
                    ) : <EmptyState icon={<User size={28} />} title="No truck assigned" hint="Assign a power unit from the Dispatch planner." />}
                  </div>

                  <div>
                    <SectionTitle>Current Loads</SectionTitle>
                    {selectedLoads.length > 0 ? (
                      <div className="space-y-2">
                        {selectedLoads.map((l) => (
                          <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                            <span className="text-[13px] font-medium">{l.loadNumber}</span>
                            <span className="text-[12px] text-muted-foreground">{l.originCity}, {l.originState} → {l.destCity}, {l.destState}</span>
                          </div>
                        ))}
                      </div>
                    ) : <EmptyState icon={<User size={28} />} title="No active loads" hint="Dispatched and in-transit loads will appear here." />}
                  </div>
                </div>
              )}

              {tab === 'pay' && (
                <div className="space-y-3">
                  <SectionTitle>Compensation</SectionTitle>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-border p-4">
                    <KV label="Pay Rate" value={`$${selected.payRatePerMile.toFixed(2)} / loaded mile`} />
                    <KV label="Est. Weekly (2,500 mi)" value={<span className="flex items-center gap-1.5"><Clock size={13} className="text-primary" />{currency(selected.payRatePerMile * 2500)}</span>} />
                  </div>
                </div>
              )}

              {tab === 'notes' && (
                <div className="rounded-lg border border-border p-4 text-[13px] text-muted-foreground">
                  <StickyNote size={16} className="mb-2 text-primary" />
                  {selected.notes || 'No notes yet.'}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <AddDriverModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}

function AddDriverModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createDriver } = useStore()
  const [f, setF] = useState({ name: '', phone: '', email: '', homeCity: '', cdlNumber: '', payRate: '0.58' })
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))
  const submit = () => {
    createDriver({
      name: f.name || undefined,
      phone: f.phone || undefined,
      email: f.email || undefined,
      homeCity: f.homeCity || undefined,
      cdlNumber: f.cdlNumber || undefined,
      payRatePerMile: Number(f.payRate) || 0.58,
    })
    setF({ name: '', phone: '', email: '', homeCity: '', cdlNumber: '', payRate: '0.58' })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Add Driver" subtitle="Add a new driver to the roster"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add Driver</Button></>}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Full Name"><Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. John Smith" /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(214) 555-0000" /></Field>
        <Field label="Email"><Input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="driver@example.com" /></Field>
        <Field label="Home City"><Input value={f.homeCity} onChange={(e) => set('homeCity', e.target.value)} placeholder="Dallas, TX" /></Field>
        <Field label="CDL Number"><Input value={f.cdlNumber} onChange={(e) => set('cdlNumber', e.target.value)} placeholder="e.g. TX1234567" /></Field>
        <Field label="Pay Rate ($/mi)"><Input type="number" value={f.payRate} onChange={(e) => set('payRate', e.target.value)} /></Field>
      </div>
    </Modal>
  )
}
