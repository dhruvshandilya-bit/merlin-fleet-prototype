import { useState } from 'react'
import { Container, Plus, Wrench, FileText, StickyNote } from 'lucide-react'
import { useStore } from '@/lib/store'
import {
  Card, Table, Th, Td, Tr, Button, Badge, Drawer, Modal, Tabs, KV, Field, Input, Select,
  SectionTitle, EmptyState, Metric, MetricRow, InfoTip,
} from '@/components/ui'
import { AssetStatusBadge, ExpiryBadge } from '@/lib/status'
import { num, formatDate } from '@/lib/utils'
import type { Trailer, EquipmentType } from '@/lib/types'
import { PageHead } from '@/features/vehicles/VehiclesScreen'

export function TrailersScreen() {
  const { trailers, maintenance, truckById, createTrailer, notify, setSection } = useStore()
  const [selected, setSelected] = useState<Trailer | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [tab, setTab] = useState('info')
  const [showAdd, setShowAdd] = useState(false)

  const rows = trailers.filter((t) => statusFilter === 'ALL' || t.status === statusFilter)
  const truckLabel = (id?: string | null) => {
    const t = truckById(id)
    return t ? `Truck #${t.unitNumber}` : null
  }

  return (
    <div className="space-y-4">
      <PageHead title="Trailers" count={trailers.length} sub="Trailing equipment — specs, compliance & assignments" />

      <MetricRow cols={5}>
        <Metric label="Total Trailers" value={trailers.length} />
        <Metric label="Active" value={trailers.filter((t) => t.status === 'ACTIVE').length} tone="green" />
        <Metric label="Idle" value={trailers.filter((t) => t.status === 'IDLE').length} />
        <Metric label="In Maintenance" value={trailers.filter((t) => t.status === 'IN_MAINTENANCE').length} tone="amber" />
        <Metric label="Reefer Units" value={trailers.filter((t) => t.equipmentType === 'Reefer').length} info="Temperature-controlled trailers — need reefer-qualified loads." />
      </MetricRow>

      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'ACTIVE', 'IDLE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${statusFilter === s ? 'border-primary bg-secondary text-primary' : 'border-border bg-white text-muted-foreground hover:bg-muted'}`}>
            {s === 'ALL' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={15} />Add Trailer</Button>
        </div>
      </div>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Unit</Th><Th>Make / Year</Th><Th>Equipment Type</Th><Th>Status</Th>
              <Th>Max Weight <InfoTip content="Maximum payload the trailer is rated to carry (lbs)." /></Th><Th>Assigned Truck</Th><Th>Registration</Th><Th>Inspection</Th><Th>Flags</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <Tr key={t.id} onClick={() => { setSelected(t); setTab('info') }}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary"><Container size={15} /></span>
                    <div><div className="font-semibold">#{t.unitNumber}</div><div className="text-[11px] text-muted-foreground">{t.equipmentType}</div></div>
                  </div>
                </Td>
                <Td><div>{t.make}</div><div className="text-[11px] text-muted-foreground">{t.year} · {t.vin.slice(-6)}</div></Td>
                <Td><Badge tone="purple">{t.equipmentType}</Badge></Td>
                <Td><AssetStatusBadge status={t.status} /></Td>
                <Td className="tabular-nums">{num(t.maxWeight)} lbs</Td>
                <Td>{truckLabel(t.assignedTruckId) ?? <span className="text-muted-foreground">Unassigned</span>}</Td>
                <Td><ExpiryBadge iso={t.registrationExp} /></Td>
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
        title={selected && <span className="flex items-center gap-2"><Container size={18} className="text-primary" />Trailer #{selected.unitNumber}</span>}
        subtitle={selected && `${selected.year} ${selected.make} ${selected.equipmentType}`}
        footer={selected && <div className="flex items-center justify-between"><div className="text-[12px] text-muted-foreground">{selected.equipmentType} · {num(selected.maxWeight)} lbs max</div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => notify(`Editing Trailer #${selected.unitNumber}`)}>Edit</Button><Button size="sm" onClick={() => { setSelected(null); setSection('dispatch') }}>Assign to Load</Button></div></div>}
      >
        {selected && (
          <div className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <AssetStatusBadge status={selected.status} />
              <ExpiryBadge iso={selected.registrationExp} label="Reg" />
              <ExpiryBadge iso={selected.inspectionExp} label="Insp" />
              {selected.maintenanceFlag && <Badge tone="amber"><Wrench size={11} />Maintenance open</Badge>}
            </div>

            <Tabs
              active={tab} onChange={setTab}
              tabs={[
                { key: 'info', label: 'Info' },
                { key: 'assign', label: 'Assignment' },
                { key: 'maint', label: 'Maintenance', count: maintenance.filter((m) => m.assetId === selected.id).length },
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
                      <KV label="Make" value={selected.make} />
                      <KV label="Equipment Type" value={selected.equipmentType} />
                      <KV label="Max Weight" value={`${num(selected.maxWeight)} lbs`} />
                    </div>
                  </div>
                </div>
              )}

              {tab === 'assign' && (
                <div className="space-y-3">
                  <SectionTitle>Current Assignment</SectionTitle>
                  {truckById(selected.assignedTruckId) ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white"><Container size={18} /></div>
                      <div><div className="font-medium">{truckLabel(selected.assignedTruckId)}</div><div className="text-[12px] text-muted-foreground">{truckById(selected.assignedTruckId)?.year} {truckById(selected.assignedTruckId)?.make} {truckById(selected.assignedTruckId)?.model}</div></div>
                    </div>
                  ) : <EmptyState icon={<Container size={28} />} title="No truck assigned" hint="Assign this trailer to a power unit from the Dispatch planner." />}
                </div>
              )}

              {tab === 'maint' && (
                <MaintList assetId={selected.id} />
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
                  {selected.docs.length === 0 && <EmptyState icon={<FileText size={28} />} title="No documents" hint="Upload registration, title, or inspection reports." />}
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

      <AddTrailerModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}

function AddTrailerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createTrailer } = useStore()
  const [f, setF] = useState({ unitNumber: '', year: '2024', equipmentType: 'Dry Van', make: 'Wabash', plate: '', maxWeight: '45000' })
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))
  const submit = () => {
    createTrailer({ unitNumber: f.unitNumber || undefined, year: Number(f.year) || 2024, equipmentType: f.equipmentType as EquipmentType, make: f.make, plate: f.plate || undefined, maxWeight: Number(f.maxWeight) || 45000, status: 'IDLE' })
    setF({ unitNumber: '', year: '2024', equipmentType: 'Dry Van', make: 'Wabash', plate: '', maxWeight: '45000' })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Add Trailer" subtitle="Register a new trailing unit"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>Add Trailer</Button></>}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Unit Number"><Input value={f.unitNumber} onChange={(e) => set('unitNumber', e.target.value)} placeholder="e.g. 5100" /></Field>
        <Field label="Year"><Input type="number" value={f.year} onChange={(e) => set('year', e.target.value)} /></Field>
        <Field label="Equipment Type">
          <Select value={f.equipmentType} onChange={(e) => set('equipmentType', e.target.value)}>
            {(['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Tanker'] as const).map((x) => <option key={x}>{x}</option>)}
          </Select>
        </Field>
        <Field label="Make"><Input value={f.make} onChange={(e) => set('make', e.target.value)} /></Field>
        <Field label="Plate"><Input value={f.plate} onChange={(e) => set('plate', e.target.value)} placeholder="TX 00-000" /></Field>
        <Field label="Max Weight"><Input type="number" value={f.maxWeight} onChange={(e) => set('maxWeight', e.target.value)} /></Field>
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
