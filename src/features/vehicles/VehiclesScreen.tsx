import { useState } from 'react'
import { Truck as TruckIcon, Plus, FileText, Wrench, ClipboardCheck, StickyNote, Fuel, Gauge, AlertTriangle } from 'lucide-react'
import { useStore } from '@/lib/store'
import {
  Card, Table, Th, Td, Tr, Button, Badge, Drawer, Modal, Tabs, KV, Field, Input, Select,
  SectionTitle, EmptyState, Metric, MetricRow, InfoTip,
} from '@/components/ui'
import { AssetStatusBadge, assetStatusLabel, ExpiryBadge } from '@/lib/status'
import { num, formatDate } from '@/lib/utils'
import type { Truck } from '@/lib/types'
import { Printer } from 'lucide-react'
import { inspectionTypeLabel } from '@/lib/orgConfig'
import { InspectionSheetOverlay } from '@/features/inspections/InspectionSheet'

export function VehiclesScreen() {
  const { trucks, drivers, maintenance, safety, org, inspections, serviceLogs, createTruck, setSection, notify } = useStore()
  const [selected, setSelected] = useState<Truck | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [tab, setTab] = useState('info')
  const [showAdd, setShowAdd] = useState(false)
  const [sheetRecId, setSheetRecId] = useState<string | null>(null)
  const vehicleInspections = (t: Truck) => inspections.filter((i) => i.orgId === org.id && i.vehicleLabel === `#${t.unitNumber}`)
  const vehicleServices = (t: Truck) => serviceLogs.filter((s) => s.orgId === org.id && s.vehicleLabel === `#${t.unitNumber}`)
  const sheetRec = inspections.find((i) => i.id === sheetRecId) || null

  const rows = trucks.filter((t) => statusFilter === 'ALL' || t.status === statusFilter)
  const driverName = (id?: string | null) => drivers.find((d) => d.id === id)?.name

  const total = trucks.length
  const activeCount = trucks.filter((t) => t.status === 'ACTIVE').length
  const maintCount = trucks.filter((t) => t.status === 'IN_MAINTENANCE').length
  const utilization = total ? Math.round((activeCount / total) * 100) : 0
  const avgOdometer = total ? Math.round(trucks.reduce((sum, t) => sum + t.odometer, 0) / total) : 0

  return (
    <div className="space-y-4">
      <PageHead title="Trucks" count={trucks.length} sub="Power units — specs, compliance & assignments" />

      <MetricRow cols={5}>
        <Metric label="Total Trucks" value={total} />
        <Metric label="Active" value={activeCount} tone="green" />
        <Metric label="Utilization" value={`${utilization}%`} info="Active trucks ÷ total fleet." />
        <Metric label="In Maintenance" value={maintCount} tone="amber" />
        <Metric label="Avg Odometer" value={`${num(avgOdometer)} mi`} info="Fleet-average miles." />
      </MetricRow>

      <div className="flex flex-wrap items-center gap-2">
        {(['ALL', 'ACTIVE', 'IDLE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE'] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${statusFilter === s ? 'border-primary bg-secondary text-primary' : 'border-border bg-white text-muted-foreground hover:bg-muted'}`}>
            {s === 'ALL' ? 'All' : assetStatusLabel[s]}
          </button>
        ))}
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={15} />Add Truck</Button>
        </div>
      </div>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Unit</Th><Th>Make / Model</Th><Th>Status</Th><Th>Assigned Driver</Th>
              <Th>Odometer</Th><Th>Registration</Th><Th>Insurance</Th><Th>Inspection</Th><Th>Flags <InfoTip content="Open maintenance work order on this truck." /></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <Tr key={t.id} onClick={() => { setSelected(t); setTab('info') }}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary"><TruckIcon size={15} /></span>
                    <div><div className="font-semibold">#{t.unitNumber}</div><div className="text-[11px] text-muted-foreground">{t.fleet}</div></div>
                  </div>
                </Td>
                <Td><div>{t.year} {t.make}</div><div className="text-[11px] text-muted-foreground">{t.model} · {t.vin.slice(-6)}</div></Td>
                <Td><AssetStatusBadge status={t.status} /></Td>
                <Td>{driverName(t.assignedDriverId) ?? <span className="text-muted-foreground">Unassigned</span>}</Td>
                <Td className="tabular-nums">{num(t.odometer)} mi</Td>
                <Td><ExpiryBadge iso={t.registrationExp} /></Td>
                <Td><ExpiryBadge iso={t.insuranceExp} /></Td>
                <Td><ExpiryBadge iso={t.inspectionExp} /></Td>
                <Td>{t.maintenanceFlag ? <Badge tone="amber"><Wrench size={11} />Maint</Badge> : <span className="text-muted-foreground">—</span>}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected && <span className="flex items-center gap-2"><TruckIcon size={18} className="text-primary" />Truck #{selected.unitNumber}</span>}
        subtitle={selected && `${selected.year} ${selected.make} ${selected.model} · VIN ${selected.vin}`}
        footer={selected && <div className="flex items-center justify-between"><div className="text-[12px] text-muted-foreground">Fleet: {selected.fleet}{selected.ownerOperator && ' · Owner-Operator'}</div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => notify(`Editing Truck #${selected.unitNumber}`)}>Edit</Button><Button size="sm" onClick={() => { setSelected(null); setSection('dispatch') }}>Assign to Load</Button></div></div>}
      >
        {selected && (
          <div className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <AssetStatusBadge status={selected.status} />
              <ExpiryBadge iso={selected.registrationExp} label="Reg" />
              <ExpiryBadge iso={selected.insuranceExp} label="Ins" />
              <ExpiryBadge iso={selected.inspectionExp} label="Insp" />
              {selected.maintenanceFlag && <Badge tone="amber"><Wrench size={11} />Maintenance open</Badge>}
            </div>

            <Tabs
              active={tab} onChange={setTab}
              tabs={[
                { key: 'info', label: 'Info' },
                { key: 'assign', label: 'Assignment' },
                { key: 'inspections', label: 'Inspections', count: vehicleInspections(selected).length },
                { key: 'maint', label: 'Maintenance', count: maintenance.filter((m) => m.assetId === selected.id).length },
                { key: 'safety', label: 'Safety', count: safety.filter((s) => s.truckId === selected.id).length },
                { key: 'docs', label: 'Documents', count: selected.docs.length },
                { key: 'notes', label: 'Notes' },
              ]}
            />

            <div className="pt-4">
              {tab === 'info' && (
                <div className="space-y-5">
                  <div>
                    <SectionTitle>Specifications</SectionTitle>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-border p-4 sm:grid-cols-3">
                      <KV label="Unit Number" value={`#${selected.unitNumber}`} />
                      <KV label="VIN" value={selected.vin} />
                      <KV label="Plate" value={selected.plate} />
                      <KV label="Year" value={selected.year} />
                      <KV label="Make / Model" value={`${selected.make} ${selected.model}`} />
                      <KV label="Fuel Type" value={selected.fuelType} />
                      <KV label="Odometer" value={`${num(selected.odometer)} mi`} />
                      <KV label="Fleet" value={selected.fleet} />
                      <KV label="Owner-Operator" value={selected.ownerOperator ? 'Yes' : 'No'} />
                    </div>
                  </div>
                  <div>
                    <SectionTitle info="ELD provider streams HOS + GPS; fuel card tracks diesel purchases.">Telematics & Cards</SectionTitle>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-border p-4 sm:grid-cols-3">
                      <KV label="ELD Provider" value={<span className="flex items-center gap-1.5"><Gauge size={13} className="text-primary" />{selected.eldProvider}</span>} />
                      <KV label="Fuel Card" value={<span className="flex items-center gap-1.5"><Fuel size={13} className="text-primary" />{selected.fuelCard}</span>} />
                    </div>
                  </div>
                </div>
              )}

              {tab === 'assign' && (
                <div className="space-y-3">
                  <SectionTitle>Current Assignment</SectionTitle>
                  {selected.assignedDriverId ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 font-semibold text-white">{driverName(selected.assignedDriverId)?.split(' ').map((n) => n[0]).join('')}</div>
                      <div><div className="font-medium">{driverName(selected.assignedDriverId)}</div><div className="text-[12px] text-muted-foreground">Active driver</div></div>
                    </div>
                  ) : <EmptyState icon={<TruckIcon size={28} />} title="No driver assigned" hint="Assign a driver from the Dispatch planner." />}
                </div>
              )}

              {tab === 'inspections' && (
                <div className="space-y-4">
                  <div>
                    <SectionTitle info="Every DVIR / inspection submitted against this vehicle. Export any as a PDF.">Inspection history</SectionTitle>
                    <div className="space-y-2">
                      {vehicleInspections(selected).map((i) => (
                        <div key={i.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold">{i.id}</span>
                              <Badge tone="slate">{inspectionTypeLabel[i.type]}</Badge>
                              {i.safeToOperate ? <Badge tone="green">Safe</Badge> : <Badge tone="red">{i.safeToDrive ? 'Defect' : 'OOS'}</Badge>}
                            </div>
                            <div className="mt-0.5 text-[12px] text-muted-foreground">{i.driverName} · {formatDate(i.dateTime)}{i.defectCount ? ` · ${i.defectCount} defect(s)` : ''}</div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setSheetRecId(i.id)}><Printer size={13} />PDF</Button>
                        </div>
                      ))}
                      {vehicleInspections(selected).length === 0 && <EmptyState icon={<ClipboardCheck size={28} />} title="No inspections" hint="No DVIRs recorded for this vehicle yet." />}
                    </div>
                  </div>
                  {vehicleServices(selected).length > 0 && (
                    <div>
                      <SectionTitle>Service history</SectionTitle>
                      <div className="space-y-2">
                        {vehicleServices(selected).map((s) => (
                          <div key={s.id} className="rounded-lg border border-border p-3">
                            <div className="flex items-center justify-between"><span className="text-[13px] font-medium">{s.serviceType}</span><span className="text-[12px] text-muted-foreground">{formatDate(s.date)}</span></div>
                            <div className="mt-0.5 text-[12px] text-muted-foreground">{num(s.odometer)} mi · {s.vendor}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'maint' && (
                <MaintList assetId={selected.id} />
              )}

              {tab === 'safety' && (
                <div className="space-y-2">
                  {safety.filter((s) => s.truckId === selected.id).map((s) => (
                    <div key={s.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between"><span className="text-[13px] font-medium">{s.type === 'ACCIDENT' ? 'Accident' : 'Roadside Inspection'} · {s.level}</span><Badge tone={s.status === 'CLOSED' ? 'green' : s.status === 'OPEN' ? 'red' : 'amber'}>{s.status}</Badge></div>
                      <div className="mt-1 text-[12px] text-muted-foreground">{formatDate(s.date)} · {s.location}</div>
                      <div className="mt-1 text-[12px]">{s.comments}</div>
                    </div>
                  ))}
                  {safety.filter((s) => s.truckId === selected.id).length === 0 && <EmptyState icon={<ClipboardCheck size={28} />} title="No safety events" hint="Clean record." />}
                </div>
              )}

              {tab === 'docs' && (
                <div className="space-y-2">
                  {selected.docs.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <FileText size={16} className="text-primary" />
                      <div className="flex-1"><div className="text-[13px] font-medium">{d.name}</div><div className="text-[11px] text-muted-foreground">{d.type} · uploaded {formatDate(d.uploadedAt)}</div></div>
                      <Button variant="ghost" size="sm" onClick={() => notify('Opening document…')}>View</Button>
                    </div>
                  ))}
                  {selected.docs.length === 0 && <EmptyState icon={<FileText size={28} />} title="No documents" hint="Upload registration, insurance COI, title, or inspection reports." />}
                  <Button variant="outline" size="sm" className="mt-1" onClick={() => notify('Document uploaded')}><Plus size={14} />Upload document</Button>
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

      <AddTruckModal open={showAdd} onClose={() => setShowAdd(false)} />
      {sheetRec && <InspectionSheetOverlay record={sheetRec} onClose={() => setSheetRecId(null)} />}
    </div>
  )
}

function AddTruckModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createTruck } = useStore()
  const [f, setF] = useState({ unitNumber: '', year: '2024', make: 'Freightliner', model: 'Cascadia', vin: '', plate: '', fleet: 'Dry Van Fleet' })
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))
  const submit = () => {
    createTruck({ unitNumber: f.unitNumber || undefined, year: Number(f.year) || 2024, make: f.make, model: f.model, vin: f.vin || undefined, plate: f.plate || undefined, fleet: f.fleet, status: 'IDLE' })
    setF({ unitNumber: '', year: '2024', make: 'Freightliner', model: 'Cascadia', vin: '', plate: '', fleet: 'Dry Van Fleet' })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Add Truck" subtitle="Register a new power unit"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add Truck</Button></>}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Unit Number"><Input value={f.unitNumber} onChange={(e) => set('unitNumber', e.target.value)} placeholder="e.g. 110" /></Field>
        <Field label="Year"><Input type="number" value={f.year} onChange={(e) => set('year', e.target.value)} /></Field>
        <Field label="Fleet">
          <Select value={f.fleet} onChange={(e) => set('fleet', e.target.value)}>
            {['Dry Van Fleet', 'Reefer Fleet', 'Flatbed Fleet'].map((x) => <option key={x}>{x}</option>)}
          </Select>
        </Field>
        <Field label="Make"><Input value={f.make} onChange={(e) => set('make', e.target.value)} /></Field>
        <Field label="Model"><Input value={f.model} onChange={(e) => set('model', e.target.value)} /></Field>
        <Field label="Plate"><Input value={f.plate} onChange={(e) => set('plate', e.target.value)} placeholder="TX 0000-XX" /></Field>
        <Field label="VIN"><Input value={f.vin} onChange={(e) => set('vin', e.target.value)} placeholder="17-char VIN" /></Field>
      </div>
    </Modal>
  )
}

function MaintList({ assetId }: { assetId: string }) {
  const { maintenance } = useStore()
  const rows = maintenance.filter((m) => m.assetId === assetId)
  if (rows.length === 0) return <EmptyState icon={<Wrench size={28} />} title="No maintenance records" hint="Work orders for this asset will appear here." />
  return (
    <div className="space-y-2">
      {rows.map((m) => (
        <div key={m.id} className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium">{m.category} · {m.poNumber}</span>
            <Badge tone={m.status === 'COMPLETED' ? 'green' : m.status === 'OPEN' ? 'amber' : 'blue'}>{m.status.replace('_', ' ')}</Badge>
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground">{m.description}</div>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
            {m.dateDue && <span>Due {formatDate(m.dateDue)}</span>}
            {m.datePerformed && <span>Done {formatDate(m.datePerformed)}</span>}
            <span>{m.vendor}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PageHead({ title, count, sub, action }: { title: string; count?: number; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">{title}{count !== undefined && <span className="rounded-full bg-secondary px-2 py-0.5 text-[13px] font-semibold text-primary">{count}</span>}</h1>
        {sub && <p className="text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  )
}
