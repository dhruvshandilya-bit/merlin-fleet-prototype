import { useMemo, useState } from 'react'
import {
  History, ChevronRight, ChevronLeft, ChevronDown, Plus, ClipboardCheck, ShieldCheck, ShieldAlert, Truck, Wrench,
  Check, X, Minus, Camera, PenLine, Gauge, HardHat, MapPin, Clock, Moon, FileText,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { Badge, type BadgeTone } from '@/components/ui'
import { PageHead } from '@/features/vehicles/VehiclesScreen'
import { InspectionForm } from '@/features/inspections/InspectionForm'
import { InspectionSheetOverlay } from '@/features/inspections/InspectionSheet'
import { Printer } from 'lucide-react'
import { inspectionTypeLabel, type InspectionType } from '@/lib/orgConfig'
import type { InspectionRecord, ItemStatus } from '@/lib/inspectionData'

type View = 'home' | 'inspect' | 'history' | 'detail'

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

export function DriverMobileScreen() {
  const { org, inspections, drivers, trucks, currentDriverId } = useStore()
  const [view, setView] = useState<View>('home')

  const driver = drivers.find((d) => d.id === currentDriverId) ?? drivers[0]
  const myTruck = trucks.find((t) => t.id === driver?.assignedTruckId)
  const myTruckLabel = myTruck ? `#${myTruck.unitNumber}` : undefined
  const mine = useMemo(() => inspections.filter((i) => i.orgId === org.id), [inspections, org.id])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inspectType, setInspectType] = useState<InspectionType>('PRE_TRIP')
  const selected = mine.find((i) => i.id === selectedId) || null

  const [sheetRecId, setSheetRecId] = useState<string | null>(null)
  const sheetRec = mine.find((i) => i.id === sheetRecId) || null
  const open = (rec: InspectionRecord) => { setSelectedId(rec.id); setView('detail') }
  const startInspection = (t: InspectionType) => { setInspectType(t); setView('inspect') }

  return (
    <div className="space-y-4">
      <PageHead title="Driver App" sub={`${org.name} · what a field driver sees on their phone (config-driven)`} />

      <div className="rounded-lg border border-stroke-soft-200 bg-state-information-lighter/40 px-4 py-3 text-[13px] text-text-sub-600">
        <span className="font-medium text-text-strong-950">Same app, both clients.</span> The driver's home, inspection form and history all render from the active client's template — switch client in the header to see it change.
      </div>

      {/* phone */}
      <div className="flex justify-center">
        <div className="w-[390px] rounded-[34px] border-[8px] border-neutral-900 bg-neutral-900 shadow-2xl">
          <div className="relative flex h-[720px] flex-col overflow-hidden rounded-[26px] bg-bg-weak-50">
            {/* notch */}
            <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-neutral-900" />
            {view === 'home' && <Home org={org} driver={driver} myTruckLabel={myTruckLabel} mine={mine} onNew={() => startInspection('PRE_TRIP')} onHistory={() => setView('history')} onOpen={open} />}
            {view === 'inspect' && <Inspect initialType={inspectType} onBack={() => setView('home')} />}
            {view === 'history' && <HistoryView mine={mine} onBack={() => setView('home')} onOpen={open} />}
            {view === 'detail' && selected && (
              <DetailView
                rec={selected}
                hasPostTrip={mine.some((i) => i.vehicleLabel === selected.vehicleLabel && i.type === 'POST_TRIP')}
                postTrip={mine.find((i) => i.vehicleLabel === selected.vehicleLabel && i.type === 'POST_TRIP') || null}
                onBack={() => setView('home')}
                onStartPostTrip={() => startInspection('POST_TRIP')}
                onExport={(r) => setSheetRecId(r.id)}
                mechanicEnabled={org.features.mechanicCertification}
              />
            )}
          </div>
        </div>
      </div>
      {sheetRec && <InspectionSheetOverlay record={sheetRec} onClose={() => setSheetRecId(null)} />}
    </div>
  )
}

/* -------------------------------- Home ---------------------------------- */
function Home({ org, driver, myTruckLabel, mine, onNew, onHistory, onOpen }: {
  org: ReturnType<typeof useStore>['org']; driver?: { id: string; name: string }; myTruckLabel?: string; mine: InspectionRecord[]; onNew: () => void; onHistory: () => void; onOpen: (r: InspectionRecord) => void
}) {
  const { trucks, drivers, trailers, setCurrentDriverId } = useStore()
  const [scope, setScope] = useState<'assigned' | 'all'>('assigned')
  const [personaOpen, setPersonaOpen] = useState(false)

  const assignedTrailer = trailers.find((t) => t.assignedTruckId && trucks.find((k) => `#${k.unitNumber}` === myTruckLabel)?.id === t.assignedTruckId)
  const scoped = scope === 'assigned' && myTruckLabel ? mine.filter((i) => i.vehicleLabel === myTruckLabel) : mine

  // group the driver's inspections by vehicle → pre/post/trailer status
  const byVehicle = useMemo(() => {
    const map = new Map<string, { pre?: InspectionRecord; post?: InspectionRecord; trailer?: InspectionRecord }>()
    for (const i of scoped) {
      const g = map.get(i.vehicleLabel) || {}
      if (i.type === 'PRE_TRIP') g.pre = i
      else if (i.type === 'POST_TRIP') g.post = i
      else g.trailer = i
      map.set(i.vehicleLabel, g)
    }
    return [...map.entries()]
  }, [scoped])

  const complete = byVehicle.filter(([, g]) => g.pre && (g.post || true) && g.pre.safeToOperate).length
  const active = byVehicle.length - complete
  const plateFor = (label: string) => trucks.find((t) => `#${t.unitNumber}` === label)?.plate

  return (
    <div className="flex h-full flex-col">
      {/* app bar */}
      <div className="flex items-center justify-between px-4 pb-3 pt-8">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-[12px] font-semibold text-white">{org.initials}</span>
          <span className="text-[17px] font-bold text-text-strong-950">Vehicle Inspection</span>
        </div>
        <button onClick={onHistory} className="flex h-9 w-9 items-center justify-center rounded-lg border border-stroke-soft-200 bg-bg-white-0 text-icon-sub-600"><History size={17} /></button>
      </div>

      {/* assigned vehicle banner */}
      {myTruckLabel && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-state-information-lighter px-3 py-2">
          <Truck size={16} className="text-brand-500" />
          <span className="text-[12.5px] font-semibold text-text-strong-950">Assigned: {myTruckLabel}</span>
          {assignedTrailer && <span className="text-[12px] text-text-sub-600">· Trailer #{assignedTrailer.unitNumber}</span>}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[16px] font-semibold text-text-strong-950">{scope === 'assigned' ? 'My Inspections' : "Today's Inspections"}</p>
            <p className="text-[12px] text-text-soft-400">Fri, Aug 07, 2026 · {driver?.name}</p>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-stroke-soft-200 text-[11px] font-semibold">
            <button onClick={() => setScope('assigned')} className={`px-2 py-1 ${scope === 'assigned' ? 'bg-brand-500 text-white' : 'text-text-sub-600'}`}>My truck</button>
            <button onClick={() => setScope('all')} className={`px-2 py-1 ${scope === 'all' ? 'bg-brand-500 text-white' : 'text-text-sub-600'}`}>All</button>
          </div>
        </div>

        <div className="mt-3 space-y-3 pb-4">
          {byVehicle.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stroke-soft-200 bg-bg-white-0 p-6 text-center">
              <ClipboardCheck size={26} className="mx-auto text-text-soft-400" />
              <p className="mt-2 text-[13px] font-medium text-text-strong-950">No inspections yet today</p>
              <p className="text-[12px] text-text-soft-400">Tap “New Inspection” to start your pre-trip.</p>
            </div>
          )}
          {byVehicle.map(([label, g]) => {
            const anchor = g.pre || g.post || g.trailer!
            const tone: BadgeTone = !anchor.safeToOperate ? 'red' : g.pre ? 'green' : 'blue'
            const statusText = !anchor.safeToOperate ? 'Defect' : g.pre ? 'Complete' : 'In progress'
            return (
              <button key={label} onClick={() => onOpen(anchor)} className="w-full rounded-2xl border border-stroke-soft-200 bg-bg-white-0 p-3.5 text-left shadow-sm transition-colors hover:border-brand-200 hover:bg-bg-weak-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[17px] font-bold text-text-strong-950">{label}</span>
                      {plateFor(label) && <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800">{plateFor(label)}</span>}
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-text-sub-600">{anchor.driverName}{anchor.trailerLabel ? ` · Trailer ${anchor.trailerLabel}` : ''}</p>
                  </div>
                  <Badge tone={tone}>{statusText}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 border-t border-stroke-soft-200 pt-2.5">
                  <Leg label={anchor.type === 'TRAILER_TOW' ? 'TRAILER TOW' : 'PRE-TRIP'} value={g.pre ? fmtTime(g.pre.dateTime) : g.trailer ? fmtTime(g.trailer.dateTime) : 'Pending'} done={!!(g.pre || g.trailer)} />
                  <Leg label="POST-TRIP" value={g.post ? fmtTime(g.post.dateTime) : 'Pending'} done={!!g.post} />
                  <ChevronRight size={18} className="ml-auto text-text-soft-400" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* bottom CTA */}
      <div className="border-t border-stroke-soft-200 bg-bg-white-0 p-3">
        <button onClick={onNew} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600">
          <Plus size={18} />New Inspection
        </button>
      </div>
    </div>
  )
}

function Leg({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-soft-400">{label}</p>
      <p className={`text-[13px] font-medium ${done ? 'text-text-strong-950' : 'italic text-text-soft-400'}`}>{value}</p>
    </div>
  )
}

/* ------------------------------- Inspect -------------------------------- */
function Inspect({ initialType, onBack }: { initialType: InspectionType; onBack: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 bg-bg-white-0 px-3 pb-3 pt-8">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-xl border border-stroke-soft-200 bg-bg-white-0 text-icon-sub-600 hover:bg-bg-weak-50"><ChevronLeft size={18} /></button>
        <span className="text-[18px] font-bold text-text-strong-950">{initialType === 'POST_TRIP' ? 'Post-Trip Inspection' : 'New Inspection'}</span>
      </div>
      <InspectionForm initialType={initialType} onDone={onBack} />
    </div>
  )
}

/* ------------------------------- History -------------------------------- */
function HistoryView({ mine, onBack, onOpen }: { mine: InspectionRecord[]; onBack: () => void; onOpen: (r: InspectionRecord) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-2 pb-3 pt-8">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke-soft-200 bg-bg-white-0 text-icon-sub-600"><ChevronLeft size={18} /></button>
        <span className="text-[16px] font-bold text-text-strong-950">Inspection History</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-2.5">
          {mine.map((i) => (
            <button key={i.id} onClick={() => onOpen(i)} className="w-full rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3 text-left shadow-sm transition-colors hover:border-brand-200 hover:bg-bg-weak-50">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-text-strong-950"><Truck size={14} className="text-brand-500" />{i.vehicleLabel}</span>
                {i.safeToOperate
                  ? <span className="flex items-center gap-1 text-[12px] font-medium text-state-success-base"><ShieldCheck size={13} />Safe</span>
                  : <span className="flex items-center gap-1 text-[12px] font-medium text-state-error-base"><ShieldAlert size={13} />{i.safeToDrive ? 'Defect' : 'Out of service'}</span>}
              </div>
              <div className="mt-1 flex items-center justify-between text-[12px] text-text-sub-600">
                <span>{inspectionTypeLabel[i.type]} · {new Date(i.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {fmtTime(i.dateTime)}</span>
                {i.defectCount > 0 && <span className="flex items-center gap-1 text-red-600"><Wrench size={12} />{i.defectCount} defect(s)</span>}
              </div>
              {i.projectJobsite && <p className="mt-1 text-[11.5px] text-text-soft-400">{i.projectJobsite}</p>}
            </button>
          ))}
          {mine.length === 0 && <p className="py-10 text-center text-[13px] text-text-soft-400">No inspections yet.</p>}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- Detail --------------------------------- */
function DetailView({ rec, hasPostTrip, postTrip, onBack, onStartPostTrip, onExport, mechanicEnabled }: {
  rec: InspectionRecord; hasPostTrip: boolean; postTrip: InspectionRecord | null; onBack: () => void; onStartPostTrip: () => void; onExport: (r: InspectionRecord) => void; mechanicEnabled: boolean
}) {
  // Which leg to show. The opened record is typically the pre-trip; post-trip may be pending.
  const preLeg = rec.type === 'POST_TRIP' ? postTrip : rec
  const [leg, setLeg] = useState<'PRE_TRIP' | 'POST_TRIP'>(rec.type === 'TRAILER_TOW' ? 'PRE_TRIP' : (rec.type === 'POST_TRIP' ? 'POST_TRIP' : 'PRE_TRIP'))
  const isTrailer = rec.type === 'TRAILER_TOW'

  const active = leg === 'POST_TRIP' ? postTrip : (preLeg || rec)
  const postDone = hasPostTrip

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 bg-bg-white-0 px-3 pb-3 pt-8">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-xl border border-stroke-soft-200 bg-bg-white-0 text-icon-sub-600 hover:bg-bg-weak-50"><ChevronLeft size={18} /></button>
        <span className="flex-1 text-[18px] font-bold text-text-strong-950">Inspection · {rec.vehicleLabel}</span>
        <button onClick={() => onExport(active ?? rec)} className="flex items-center gap-1.5 rounded-xl border border-stroke-soft-200 bg-bg-white-0 px-3 py-2 text-[12.5px] font-semibold text-brand-500 hover:bg-bg-weak-50"><Printer size={14} />PDF</button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-bg-weak-50 p-3">
        {/* leg status banner */}
        <div className="flex items-center gap-2 rounded-xl bg-state-blue-lighter px-3.5 py-2.5 text-[12.5px] font-semibold text-state-blue-base">
          <span className="h-2 w-2 rounded-full bg-state-blue-base" />
          {isTrailer ? 'Trailer-tow submitted' : `Pre-trip submitted · Post-trip ${postDone ? 'submitted' : 'pending'}`}
        </div>

        {/* Pre/Post tabs (hidden for trailer-tow) */}
        {!isTrailer && (
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-bg-white-0 p-1.5 shadow-sm">
            <button onClick={() => setLeg('PRE_TRIP')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold transition-colors ${leg === 'PRE_TRIP' ? 'bg-bg-white-0 text-text-strong-950 shadow-sm ring-1 ring-stroke-soft-200' : 'text-text-sub-600'}`}>
              <Clock size={15} />Pre-Trip
              {preLeg && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-state-success-base text-white"><Check size={11} /></span>}
            </button>
            <button onClick={() => setLeg('POST_TRIP')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold transition-colors ${leg === 'POST_TRIP' ? 'bg-bg-white-0 text-text-strong-950 shadow-sm ring-1 ring-stroke-soft-200' : 'text-text-sub-600'}`}>
              <Moon size={15} />Post-Trip
              {postDone && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-state-success-base text-white"><Check size={11} /></span>}
            </button>
          </div>
        )}

        {/* Body: submitted leg → collapsible sections; pending post-trip → start CTA */}
        {active
          ? <LegSections rec={active} mechanicEnabled={mechanicEnabled} />
          : (
            <div className="rounded-2xl border border-dashed border-stroke-sub-300 bg-bg-white-0 p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-state-information-lighter text-brand-500"><Moon size={22} /></span>
              <p className="mt-3 text-[14px] font-bold text-text-strong-950">Post-Trip not started</p>
              <p className="mt-1 text-[12.5px] text-text-soft-400">Complete the end-of-day post-trip inspection for {rec.vehicleLabel}.</p>
              <button onClick={onStartPostTrip} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-brand-600">
                <Plus size={16} />Start Post-Trip
              </button>
            </div>
          )}
      </div>
    </div>
  )
}

/* Collapsible read-only sections for one submitted inspection leg. */
function LegSections({ rec, mechanicEnabled }: { rec: InspectionRecord; mechanicEnabled: boolean }) {
  const bySection = rec.results.reduce<Record<string, typeof rec.results>>((acc, r) => {
    (acc[r.sectionId] ||= []).push(r); return acc
  }, {})
  const reviewed = rec.results.length
  const icon: Record<ItemStatus, React.ReactNode> = {
    PASS: <Check size={13} className="text-state-success-base" />,
    FAIL: <X size={13} className="text-state-error-base" />,
    NA: <Minus size={13} className="text-text-soft-400" />,
  }
  return (
    <>
      <Collapsible defaultOpen icon={<Truck size={17} />} iconTone="blue" title="Trip Info" subtitle="Carrier, driver, vehicle, location">
        <div className="grid grid-cols-2 gap-2">
          <Meta label="Driver" value={rec.driverName} />
          <Meta label="Vehicle" value={rec.vehicleLabel} />
          {rec.trailerLabel && <Meta label="Trailer" value={rec.trailerLabel} />}
          {rec.odometer != null && <Meta label="Odometer" value={<span className="inline-flex items-center gap-1"><Gauge size={11} />{rec.odometer.toLocaleString()}</span>} />}
          {rec.projectJobsite && <Meta label="Project / Jobsite" value={<span className="inline-flex items-center gap-1"><HardHat size={11} />{rec.projectJobsite}</span>} />}
          {rec.location && <Meta label="Location" value={<span className="inline-flex items-center gap-1"><MapPin size={11} />{rec.location}</span>} />}
          <Meta label="Time" value={fmtTime(rec.dateTime)} />
          <Meta label="Photos" value={<span className="inline-flex items-center gap-1"><Camera size={11} />{rec.photos}</span>} />
        </div>
      </Collapsible>

      <Collapsible defaultOpen icon={<ClipboardCheck size={17} />} iconTone="green" title="Inspection Checklist" subtitle={`${reviewed} items reviewed`}
        chip={<Badge tone={rec.defectCount ? 'red' : 'green'}>{rec.defectCount ? `${rec.defectCount} defect(s)` : 'All OK'}</Badge>}>
        <div className="space-y-2.5">
          {Object.entries(bySection).map(([sid, items]) => (
            <div key={sid}>
              {Object.keys(bySection).length > 1 && <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-text-soft-400">{sid.replace(/-/g, ' ')}</p>}
              <div className="divide-y divide-stroke-soft-200 rounded-lg border border-stroke-soft-200">
                {items.map((r) => (
                  <div key={r.itemId} className="flex items-start justify-between gap-2 px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-bg-weak-50">{icon[r.status]}</span>
                      <div>
                        <p className="text-[12.5px] text-text-strong-950">{r.label}</p>
                        {r.note && <p className="text-[11px] text-state-error-base">{r.note}</p>}
                      </div>
                    </div>
                    <Badge tone={r.status === 'PASS' ? 'green' : r.status === 'FAIL' ? 'red' : 'gray'}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Collapsible>

      <Collapsible icon={rec.safeToOperate ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />} iconTone={rec.safeToOperate ? 'green' : 'red'}
        title="Safe to Operate" subtitle="Driver confirmation"
        chip={<Badge tone={rec.safeToOperate ? 'green' : 'red'}>{rec.safeToOperate ? 'Yes — Safe' : rec.safeToDrive ? 'Drivable' : 'Out of service'}</Badge>}>
        <p className="text-[13px] text-text-strong-950">{rec.safeToOperate ? 'Vehicle confirmed safe to operate with no defects.' : `${rec.defectCount} defect(s) noted — ${rec.safeToDrive ? 'drivable to the yard only.' : 'flagged out of service.'}`}</p>
      </Collapsible>

      <Collapsible icon={<FileText size={17} />} iconTone="purple" title="Driver Remarks" subtitle="Defects noted, observations"
        chip={<Badge tone="gray">{rec.remarks ? 'Note' : 'Optional'}</Badge>}>
        <p className="text-[13px] text-text-strong-950">{rec.remarks || 'No remarks.'}</p>
      </Collapsible>

      {(mechanicEnabled || rec.mechanic) && (
        <Collapsible icon={<Wrench size={17} />} iconTone="red" title="Mechanic / Repair Certification" subtitle="Required when a defect is reported"
          chip={<Badge tone={rec.mechanic?.status === 'CERTIFIED' ? 'green' : rec.mechanic ? 'amber' : 'gray'}>{rec.mechanic?.status === 'CERTIFIED' ? 'Certified' : rec.mechanic ? 'Pending' : 'When needed'}</Badge>}>
          {rec.mechanic ? (
            <div>
              <div className="flex items-center justify-between">
                <Badge tone={rec.mechanic.status === 'CERTIFIED' ? 'green' : 'amber'}>{rec.mechanic.status === 'CERTIFIED' ? 'Repairs certified' : 'Pending repair'}</Badge>
                {rec.mechanic.by && <span className="text-[11.5px] text-text-sub-600">{rec.mechanic.by}</span>}
              </div>
              {rec.mechanic.note && <p className="mt-1.5 text-[12.5px] text-text-strong-950">{rec.mechanic.note}</p>}
            </div>
          ) : (
            <p className="rounded-lg bg-state-warning-lighter px-3 py-2 text-[12px] text-state-warning-dark">Shown automatically when a defect is reported. The mechanic must certify the repair before the next trip can be marked safe to operate.</p>
          )}
        </Collapsible>
      )}

      <Collapsible icon={<PenLine size={17} />} iconTone="purple" title="Driver Signature" subtitle={rec.signedBy ? `Signed at ${fmtTime(rec.dateTime)}` : 'Not signed'}
        chip={<Badge tone={rec.signedBy ? 'green' : 'gray'}>{rec.signedBy ? 'Signed' : '—'}</Badge>}>
        <div className="flex h-16 items-center justify-center rounded-lg border border-stroke-soft-200 bg-bg-weak-50 text-[13px] italic text-text-sub-600">{rec.signedBy ? `— ${rec.signedBy}` : 'Not signed'}</div>
      </Collapsible>
    </>
  )
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-soft-400">{label}</p>
      <p className="text-[12.5px] font-medium text-text-strong-950">{value}</p>
    </div>
  )
}

const ICON_TONE: Record<string, string> = {
  blue: 'bg-state-blue-lighter text-state-blue-base',
  green: 'bg-state-success-lighter text-state-success-base',
  red: 'bg-state-error-lighter text-state-error-base',
  purple: 'bg-state-information-lighter text-brand-500',
  amber: 'bg-state-warning-lighter text-state-warning-base',
}

function Collapsible({ icon, iconTone, title, subtitle, chip, defaultOpen, children }: {
  icon: React.ReactNode; iconTone: keyof typeof ICON_TONE; title: string; subtitle?: string; chip?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="rounded-2xl bg-bg-white-0 shadow-sm">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${ICON_TONE[iconTone]}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-text-strong-950">{title}</span>
          {subtitle && <span className="block text-[11.5px] text-text-soft-400">{subtitle}</span>}
        </span>
        {chip}
        <ChevronDown size={18} className={`text-text-soft-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-stroke-soft-200 p-3.5">{children}</div>}
    </div>
  )
}
