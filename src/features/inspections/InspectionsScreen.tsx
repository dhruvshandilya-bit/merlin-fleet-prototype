import { useState } from 'react'
import {
  ClipboardCheck, ShieldAlert, ShieldCheck, Camera, PenLine, Wrench, Plus, Check, X, Minus, MapPin, Gauge, HardHat,
  FileText, Printer, Ban, CircleCheck, CircleX,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import {
  Card, CardHeader, Stat, Table, Th, Td, Tr, Button, Badge, Drawer, KV, EmptyState, InfoTip, Tabs, type BadgeTone,
} from '@/components/ui'
import { PageHead } from '@/features/vehicles/VehiclesScreen'
import { formatDate } from '@/lib/utils'
import { inspectionTypeLabel } from '@/lib/orgConfig'
import type { InspectionRecord, InspectionStatus, ItemStatus } from '@/lib/inspectionData'
import { openDefects, outOfServiceVehicles, driverComplianceForDay, latestDay } from '@/lib/dvir'
import { CaptureFlow } from './CaptureFlow'
import { InspectionSheetOverlay } from './InspectionSheet'

const statusTone: Record<InspectionStatus, BadgeTone> = { SUBMITTED: 'blue', NEEDS_REVIEW: 'red', CLOSED: 'green' }
const statusLabel: Record<InspectionStatus, string> = { SUBMITTED: 'Submitted', NEEDS_REVIEW: 'Needs Review', CLOSED: 'Closed' }
const itemTone: Record<ItemStatus, BadgeTone> = { PASS: 'green', FAIL: 'red', NA: 'gray' }

type Pill = 'all' | 'defects' | 'review'

export function InspectionsScreen() {
  const { org, inspections, certifyInspection } = useStore()
  const [tab, setTab] = useState('log')
  const [pill, setPill] = useState<Pill>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [capture, setCapture] = useState(false)
  const [sheetId, setSheetId] = useState<string | null>(null)
  const [assetFilter, setAssetFilter] = useState<string | null>(null) // vehicle/trailer label

  const openAsset = (label: string) => { setAssetFilter(label); setTab('log') }

  const mine = inspections.filter((i) => i.orgId === org.id)
  const defects = mine.filter((i) => i.defectCount > 0)
  const needsReview = mine.filter((i) => i.status === 'NEEDS_REVIEW')
  const rows = mine
    .filter((i) => !assetFilter || i.vehicleLabel === assetFilter || i.trailerLabel === assetFilter)
    .filter((i) => pill === 'all' || (pill === 'defects' ? i.defectCount > 0 : i.status === 'NEEDS_REVIEW'))

  const oos = outOfServiceVehicles(mine)
  const rate = mine.length ? Math.round((mine.filter((i) => i.safeToOperate).length / mine.length) * 100) : 100
  const current = mine.find((i) => i.id === openId) || null
  const sheetRec = mine.find((i) => i.id === sheetId) || null

  const pills: { key: Pill; label: string; n: number }[] = [
    { key: 'all', label: 'All', n: mine.length },
    { key: 'defects', label: 'With defects', n: defects.length },
    { key: 'review', label: 'Needs review', n: needsReview.length },
  ]

  return (
    <div className="space-y-4">
      <PageHead
        title="Vehicle Inspections"
        sub={`${org.name} · DVIR / field inspection records`}
        action={<Button size="sm" onClick={() => setCapture(true)}><Plus size={14} />New inspection</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total inspections" value={mine.length} icon={<ClipboardCheck size={18} className="text-brand-500" />} info="Submitted inspection reports for this client." />
        <Stat label="Open defects" value={openDefects(mine).filter((d) => !d.certified).length} tone="red" sub="Unresolved" icon={<ShieldAlert size={18} className="text-red-500" />} />
        <Stat label="Out of service" value={oos.length} tone="amber" icon={<Ban size={18} className="text-amber-500" />} info="Vehicles with an uncertified unsafe defect." />
        <Stat label="Safe-to-operate rate" value={`${rate}%`} tone="green" icon={<ShieldCheck size={18} className="text-emerald-500" />} info="Share of inspections passed with no blocking defect." />
      </div>

      <Tabs active={tab} onChange={(k) => { setTab(k); if (k !== 'log') setAssetFilter(null) }} tabs={[
        { key: 'log', label: 'Inspection Log', count: mine.length },
        { key: 'vehicles', label: 'Vehicles' },
        { key: 'trailers', label: 'Trailers' },
        { key: 'defects', label: 'Defects & Out-of-Service', count: openDefects(mine).filter((d) => !d.certified).length },
        { key: 'compliance', label: 'Driver Compliance' },
      ]} />

      {tab === 'vehicles' && <VehiclesTab onOpen={openAsset} />}
      {tab === 'trailers' && <TrailersTab onOpen={openAsset} />}
      {tab === 'defects' && <DefectsTab />}
      {tab === 'compliance' && <ComplianceTab />}

      {tab === 'log' && (
      <Card>
        <CardHeader title="Inspection log" subtitle="Every field submission — filter by defect or review status" />
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          {assetFilter && (
            <button onClick={() => setAssetFilter(null)} className="flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-[12px] font-semibold text-white">
              {assetFilter} <X size={12} />
            </button>
          )}
          {pills.map((p) => (
            <button key={p.key} onClick={() => setPill(p.key)}
              className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${pill === p.key ? 'border-primary bg-secondary text-primary' : 'border-border bg-white text-muted-foreground hover:bg-muted'}`}>
              {p.label} <span className="opacity-60">{p.n}</span>
            </button>
          ))}
        </div>
        <Table>
          <thead>
            <tr>
              <Th>ID</Th><Th>Type</Th><Th>Driver</Th><Th>Vehicle</Th>
              {org.features.projectJobsite && <Th>Project / Jobsite</Th>}
              <Th>Date</Th><Th>Defects</Th><Th>Result</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <Tr key={i.id} onClick={() => setOpenId(i.id)}>
                <Td className="font-medium">{i.id}</Td>
                <Td><Badge tone="slate">{inspectionTypeLabel[i.type]}</Badge></Td>
                <Td>{i.driverName}</Td>
                <Td>{i.vehicleLabel}{i.trailerLabel ? ` · ${i.trailerLabel}` : ''}</Td>
                {org.features.projectJobsite && <Td className="text-muted-foreground">{i.projectJobsite || '—'}</Td>}
                <Td>{formatDate(i.dateTime)}</Td>
                <Td>{i.defectCount > 0 ? <span className="font-medium text-red-600">{i.defectCount}</span> : <span className="text-muted-foreground">0</span>}</Td>
                <Td>{i.safeToOperate ? <Badge tone="green">Safe</Badge> : <Badge tone="red">{i.safeToDrive ? 'Defect · drivable' : 'Out of service'}</Badge>}</Td>
                <Td><Badge tone={statusTone[i.status]}>{statusLabel[i.status]}</Badge></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {rows.length === 0 && <EmptyState icon={<ClipboardCheck size={28} />} title="No inspections" hint="Submit one from the mobile capture flow." />}
      </Card>
      )}

      <Drawer
        open={!!current}
        onClose={() => setOpenId(null)}
        title={current ? `${current.id} · ${inspectionTypeLabel[current.type]}` : ''}
        subtitle={current ? `${current.driverName} · ${current.vehicleLabel}` : ''}
        footer={current ? (
          <div className="flex w-full items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setSheetId(current.id)}><Printer size={14} />Export PDF</Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpenId(null)}>Close</Button>
              {current.status === 'NEEDS_REVIEW' && org.features.mechanicCertification && (
                <Button size="sm" onClick={() => { certifyInspection(current.id, 'J. Ortiz (Mechanic)', 'Repaired & tested OK.'); setOpenId(null) }}>
                  <Wrench size={14} />Certify repair
                </Button>
              )}
            </div>
          </div>
        ) : undefined}
      >
        {current && <InspectionDetail rec={current} projectEnabled={org.features.projectJobsite} />}
      </Drawer>

      <CaptureFlow open={capture} onClose={() => setCapture(false)} />
      {sheetRec && <InspectionSheetOverlay record={sheetRec} onClose={() => setSheetId(null)} />}
    </div>
  )
}

/* ------------------------------ Vehicles tab ----------------------------- */
function VehiclesTab({ onOpen }: { onOpen: (label: string) => void }) {
  const { org, inspections, trucks } = useStore()
  const mine = inspections.filter((i) => i.orgId === org.id)
  const oos = outOfServiceVehicles(mine)

  const summary = (label: string) => {
    const recs = mine.filter((i) => i.vehicleLabel === label).sort((a, b) => (a.dateTime < b.dateTime ? 1 : -1))
    const last = recs[0]
    const openDef = recs.reduce((n, r) => n + (r.mechanic?.status === 'CERTIFIED' ? 0 : r.defectCount), 0)
    return { count: recs.length, last, openDef }
  }

  return (
    <Card>
      <CardHeader title="Vehicles" subtitle="Every vehicle with its latest inspection status — click to see its inspection history" />
      <Table>
        <thead><tr><Th>Unit</Th><Th>Make / Model</Th><Th>Last inspection</Th><Th>Status</Th><Th>Inspections</Th><Th>Open defects</Th></tr></thead>
        <tbody>
          {trucks.map((t) => {
            const label = `#${t.unitNumber}`
            const s = summary(label)
            const isOos = oos.includes(label)
            return (
              <Tr key={t.id} onClick={() => onOpen(label)}>
                <Td className="font-medium">{label}</Td>
                <Td className="text-muted-foreground">{t.year} {t.make} {t.model}</Td>
                <Td>{s.last ? formatDate(s.last.dateTime) : <span className="text-muted-foreground">—</span>}</Td>
                <Td>{isOos ? <Badge tone="red"><Ban size={11} />Out of service</Badge> : s.last ? <Badge tone="green">Safe</Badge> : <Badge tone="gray">No data</Badge>}</Td>
                <Td>{s.count}</Td>
                <Td>{s.openDef > 0 ? <span className="font-medium text-red-600">{s.openDef}</span> : <span className="text-muted-foreground">0</span>}</Td>
              </Tr>
            )
          })}
        </tbody>
      </Table>
    </Card>
  )
}

/* ------------------------------ Trailers tab ----------------------------- */
function TrailersTab({ onOpen }: { onOpen: (label: string) => void }) {
  const { org, inspections, trailers } = useStore()
  if (!org.features.trailerTowInspection) {
    return <Card><EmptyState icon={<ClipboardCheck size={28} />} title="Trailers not enabled" hint="Turn on Trailer-tow inspection in Configuration to track trailers." /></Card>
  }
  const mine = inspections.filter((i) => i.orgId === org.id)
  const summary = (label: string) => {
    const recs = mine.filter((i) => i.trailerLabel === label).sort((a, b) => (a.dateTime < b.dateTime ? 1 : -1))
    return { count: recs.length, last: recs[0] }
  }
  return (
    <Card>
      <CardHeader title="Trailers" subtitle="Trailer-tow inspection status per trailer — click to see its history" />
      <Table>
        <thead><tr><Th>Unit</Th><Th>Type</Th><Th>Last tow inspection</Th><Th>Status</Th><Th>Inspections</Th></tr></thead>
        <tbody>
          {trailers.map((t) => {
            const label = `#${t.unitNumber}`
            const s = summary(label)
            return (
              <Tr key={t.id} onClick={() => onOpen(label)}>
                <Td className="font-medium">{label}</Td>
                <Td className="text-muted-foreground">{t.equipmentType}</Td>
                <Td>{s.last ? formatDate(s.last.dateTime) : <span className="text-muted-foreground">—</span>}</Td>
                <Td>{s.last ? (s.last.safeToOperate ? <Badge tone="green">Safe</Badge> : <Badge tone="red">Defect</Badge>) : <Badge tone="gray">No data</Badge>}</Td>
                <Td>{s.count}</Td>
              </Tr>
            )
          })}
        </tbody>
      </Table>
    </Card>
  )
}

/* --------------------------- Defects & OOS tab --------------------------- */
function DefectsTab() {
  const { org, inspections, trucks, createMaintenance, certifyInspection, notify } = useStore()
  const mine = inspections.filter((i) => i.orgId === org.id)
  const defects = openDefects(mine)
  const open = defects.filter((d) => !d.certified)
  const oos = outOfServiceVehicles(mine)
  const truckByLabel = (label: string) => trucks.find((t) => `#${t.unitNumber}` === label)

  const makeWorkOrder = (d: ReturnType<typeof openDefects>[number]) => {
    const t = truckByLabel(d.vehicleLabel)
    createMaintenance({
      assetType: 'Truck', assetId: t?.id || '', assetLabel: d.vehicleLabel,
      category: 'DOT Repair', description: `${d.itemLabel}${d.note ? ` — ${d.note}` : ''} (from ${d.recordId})`,
      status: 'OPEN',
    })
  }

  return (
    <div className="space-y-4">
      {oos.length > 0 && (
        <Card>
          <CardHeader title="Out of service" subtitle="Vehicles with an uncertified unsafe defect" />
          <div className="flex flex-wrap gap-2 p-4">
            {oos.map((v) => <Badge key={v} tone="red"><Ban size={11} />{v}</Badge>)}
          </div>
        </Card>
      )}
      <Card>
        <CardHeader title="Open defects" subtitle="Reported defects awaiting repair — create a work order or certify" />
        <Table>
          <thead><tr><Th>Vehicle</Th><Th>Item</Th><Th>Reported by</Th><Th>Date</Th><Th>Detail</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {open.map((d, idx) => (
              <Tr key={`${d.recordId}-${idx}`}>
                <Td className="font-medium">{d.vehicleLabel}</Td>
                <Td><Badge tone="red">{d.itemLabel}</Badge></Td>
                <Td>{d.driverName}</Td>
                <Td>{formatDate(d.dateTime)}</Td>
                <Td className="max-w-[220px] text-[12px] text-muted-foreground">{d.note || '—'}</Td>
                <Td>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => makeWorkOrder(d)}><Wrench size={13} />Work order</Button>
                    {org.features.mechanicCertification && <Button variant="ghost" size="sm" onClick={() => { certifyInspection(d.recordId, 'J. Ortiz (Mechanic)', 'Repaired & tested OK.'); notify('Defect certified') }}><CircleCheck size={13} />Certify</Button>}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {open.length === 0 && <EmptyState icon={<CircleCheck size={28} />} title="No open defects" hint="Every reported defect is resolved." />}
      </Card>
    </div>
  )
}

/* -------------------------- Driver compliance tab ------------------------ */
function ComplianceTab() {
  const { org, inspections } = useStore()
  const mine = inspections.filter((i) => i.orgId === org.id)
  const day = latestDay(mine)
  const rows = driverComplianceForDay(mine, day)
  const done = rows.filter((r) => r.pre && r.post).length
  const preOnly = rows.filter((r) => r.pre && !r.post).length

  return (
    <Card>
      <CardHeader title="Driver compliance" subtitle={`Pre-trip / post-trip completion · ${formatDate(day)}`} />
      <div className="grid grid-cols-3 gap-3 border-b border-border p-4">
        <Stat label="Fully complete" value={done} tone="green" />
        <Stat label="Post-trip pending" value={preOnly} tone="amber" />
        <Stat label="Vehicles active" value={rows.length} />
      </div>
      <Table>
        <thead><tr><Th>Vehicle</Th><Th>Driver</Th><Th>Pre-Trip</Th><Th>Post-Trip</Th><Th>Defect</Th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <Tr key={r.vehicleLabel}>
              <Td className="font-medium">{r.vehicleLabel}</Td>
              <Td>{r.driverName}</Td>
              <Td>{r.pre ? <Badge tone="green"><Check size={11} />Done</Badge> : <Badge tone="red"><X size={11} />Missing</Badge>}</Td>
              <Td>{r.post ? <Badge tone="green"><Check size={11} />Done</Badge> : <Badge tone="amber">Pending</Badge>}</Td>
              <Td>{r.hasDefect ? <Badge tone="red">Yes</Badge> : <span className="text-muted-foreground">—</span>}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      {rows.length === 0 && <EmptyState icon={<ClipboardCheck size={28} />} title="No activity" hint="No inspections recorded for this day." />}
    </Card>
  )
}

function InspectionDetail({ rec, projectEnabled }: { rec: InspectionRecord; projectEnabled: boolean }) {
  const bySection = rec.results.reduce<Record<string, typeof rec.results>>((acc, r) => {
    (acc[r.sectionId] ||= []).push(r); return acc
  }, {})
  const icon: Record<ItemStatus, React.ReactNode> = {
    PASS: <Check size={13} className="text-emerald-600" />, FAIL: <X size={13} className="text-red-600" />, NA: <Minus size={13} className="text-neutral-400" />,
  }
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 rounded-lg p-3 ${rec.safeToOperate ? 'bg-state-success-lighter/50' : 'bg-state-error-lighter/50'}`}>
        {rec.safeToOperate ? <ShieldCheck size={18} className="text-state-success-base" /> : <ShieldAlert size={18} className="text-state-error-base" />}
        <div>
          <p className="text-[13px] font-semibold text-text-strong-950">{rec.safeToOperate ? 'Safe to operate' : rec.safeToDrive ? 'Defect present — drivable to yard' : 'Out of service'}</p>
          <p className="text-[12px] text-text-sub-600">{rec.defectCount} defect(s) · {formatDate(rec.dateTime)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <KV label="Driver" value={rec.driverName} />
        <KV label="Vehicle" value={rec.vehicleLabel} />
        {rec.trailerLabel && <KV label="Trailer" value={rec.trailerLabel} />}
        {rec.odometer != null && <KV label="Odometer" value={<span className="inline-flex items-center gap-1"><Gauge size={12} />{rec.odometer.toLocaleString()}</span>} />}
        {projectEnabled && <KV label="Project / Jobsite" value={<span className="inline-flex items-center gap-1"><HardHat size={12} />{rec.projectJobsite || '—'}</span>} />}
        {rec.location && <KV label="Location" value={<span className="inline-flex items-center gap-1"><MapPin size={12} />{rec.location}</span>} />}
        <KV label="Photos" value={<span className="inline-flex items-center gap-1"><Camera size={12} />{rec.photos}</span>} />
        <KV label="Signed by" value={rec.signedBy ? <span className="inline-flex items-center gap-1"><PenLine size={12} />{rec.signedBy}</span> : '—'} />
      </div>

      {Object.entries(bySection).map(([sid, items]) => (
        <div key={sid}>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-soft-400">{sid.replace(/-/g, ' ')}</p>
          <div className="divide-y divide-border rounded-lg border border-border">
            {items.map((r) => (
              <div key={r.itemId} className="flex items-start justify-between gap-3 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bg-weak-50">{icon[r.status]}</span>
                  <div>
                    <p className="text-[13px] text-text-strong-950">{r.label}</p>
                    {r.note && <p className="text-[11.5px] text-red-600">{r.note}</p>}
                  </div>
                </div>
                <Badge tone={itemTone[r.status]}>{r.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      ))}

      {rec.remarks && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-soft-400">Driver remarks <InfoTip content="Free-text notes captured with the inspection." /></p>
          <p className="rounded-lg bg-bg-weak-50 p-3 text-[13px] text-text-strong-950">{rec.remarks}</p>
        </div>
      )}

      {rec.mechanic && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-soft-400">Mechanic / repair certification</p>
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <Badge tone={rec.mechanic.status === 'CERTIFIED' ? 'green' : 'amber'}>{rec.mechanic.status === 'CERTIFIED' ? 'Certified' : 'Pending repair'}</Badge>
              {rec.mechanic.by && <span className="text-[12px] text-text-sub-600">{rec.mechanic.by}</span>}
            </div>
            {rec.mechanic.note && <p className="mt-2 text-[13px] text-text-strong-950">{rec.mechanic.note}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
