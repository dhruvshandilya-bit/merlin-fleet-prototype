import { useMemo, useRef, useState } from 'react'
import {
  Clock, Moon, Truck as TruckIcon, ChevronDown, Camera, Mic, MapPin, LocateFixed, Check, X,
  PenLine, ShieldCheck, ShieldAlert, CircleCheck, Search, Gauge,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { inspectionTypeLabel, templateFor, type InspectionType, type HeaderField } from '@/lib/orgConfig'
import type { ItemResult, ItemStatus } from '@/lib/inspectionData'

/* The full template-driven inspection form, styled to match the field DVIR
   reference. Renders the *inner* content only (status banner → type tabs →
   Trip Info → checklist → gate → sign → submit); the caller supplies the
   scroll container + app bar. Shared by the admin capture modal and the driver
   mobile app so there is a single source of truth.

   Field upgrades: Start Location (device GPS + Places search), Odometer photo,
   and per-defect photo + voice-to-text. */

const MOCK_PLACES = [
  'Dallas Yard — 1200 Industrial Blvd, Dallas, TX',
  'Fort Worth Terminal — 4500 Meacham Blvd, Fort Worth, TX',
  'Riverside Plant Expansion — 900 River Rd, Irving, TX',
  'Downtown Substation — 210 Commerce St, Dallas, TX',
  'Highway 9 Culvert Site — FM-9 & County Rd 210',
  'Home Office — 55 Congress Ave, Austin, TX',
]

export function InspectionForm({ initialType = 'PRE_TRIP', onDone }: { initialType?: InspectionType; onDone?: () => void }) {
  const { org, drivers, trucks, trailers, currentDriverId, createInspection } = useStore()

  const types: InspectionType[] = [
    'PRE_TRIP',
    ...(org.features.postTrip ? ['POST_TRIP' as const] : []),
    ...(org.features.trailerTowInspection ? ['TRAILER_TOW' as const] : []),
  ]
  const [type, setType] = useState<InspectionType>(initialType)
  const template = templateFor(org, type)

  // Everything auto-populates from the signed-in driver's assignment.
  const driver = drivers.find((d) => d.id === currentDriverId) ?? drivers[0]
  const truck = trucks.find((t) => t.id === driver?.assignedTruckId) ?? trucks[0]
  const assignedTrailer = trailers.find((t) => t.assignedTruckId === truck?.id)

  const [trailerId, setTrailerId] = useState<string>('') // '' = use assigned
  const selectedTrailer = trailers.find((t) => t.id === trailerId) ?? assignedTrailer

  const autoValue = (f: Pick<HeaderField, 'id'>): string => {
    switch (f.id) {
      case 'carrier': return org.legalName
      case 'driver': return driver?.name ?? 'Driver'
      case 'datetime': return 'Aug 7, 2026 · 7:02 AM'
      case 'vehicle': return truck ? `#${truck.unitNumber}` : '#101'
      case 'truck': return truck ? `#${truck.unitNumber}` : '#101'
      case 'trailer': return selectedTrailer ? `#${selectedTrailer.unitNumber}` : '—'
      case 'plate': return truck?.plate ?? 'TX 0000-XX'
      default: return ''
    }
  }

  const [manual, setManual] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, ItemStatus>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [itemPhotos, setItemPhotos] = useState<Record<string, string[]>>({})
  const [odoPhoto, setOdoPhoto] = useState<string | undefined>()
  const [tripOpen, setTripOpen] = useState(true)
  const [safeToDrive, setSafeToDrive] = useState<boolean | null>(null)
  const [signed, setSigned] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [locOpen, setLocOpen] = useState(false)
  const [locating, setLocating] = useState(false)
  const [listening, setListening] = useState<string | null>(null)
  const recRef = useRef<any>(null)

  const sections = useMemo(() => (template ? template.sections.filter((s) => s.enabled) : []), [template])
  const allItems = sections.flatMap((s) => s.items)
  const defects = allItems.filter((i) => results[i.id] === 'FAIL')
  const safeToOperate = defects.length === 0
  const reviewed = allItems.filter((i) => results[i.id]).length
  const totalPhotos = (odoPhoto ? 1 : 0) + Object.values(itemPhotos).reduce((a, v) => a + v.length, 0)

  const reset = () => {
    setManual({}); setResults({}); setNotes({}); setItemPhotos({}); setOdoPhoto(undefined)
    setSafeToDrive(null); setSigned(false); setRemarks(''); setLocOpen(false)
  }
  const set = (id: string, status: ItemStatus) =>
    setResults((r) => ({ ...r, [id]: r[id] === status ? (undefined as unknown as ItemStatus) : status }))
  const markAllOk = () => setResults(Object.fromEntries(allItems.map((i) => [i.id, 'PASS' as ItemStatus])))

  const useDevice = () => {
    setLocOpen(false)
    if (!('geolocation' in navigator)) { setManual((m) => ({ ...m, location: 'Current location (GPS unavailable)' })); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); setManual((m) => ({ ...m, location: `📍 Current location · ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` })) },
      () => { setLocating(false); setManual((m) => ({ ...m, location: '📍 Current location (permission denied)' })) },
      { timeout: 8000 },
    )
  }

  const onPhoto = (files: FileList | null, cb: (url: string) => void) => {
    const f = files?.[0]
    if (f) cb(URL.createObjectURL(f))
    else cb(`mock://photo-${Math.round(performance.now())}`) // prototype fallback if camera cancelled
  }

  const toggleMic = (itemId: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (listening === itemId) { recRef.current?.stop?.(); setListening(null); return }
    if (!SR) { // graceful fallback so the flow still demos
      setNotes((n) => ({ ...n, [itemId]: `${(n[itemId] || '')} sidewall crack driver-side front, low tread`.trim() }))
      return
    }
    const rec = new SR(); rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setNotes((n) => ({ ...n, [itemId]: `${(n[itemId] || '')} ${t}`.trim() })) }
    rec.onend = () => setListening(null)
    rec.onerror = () => setListening(null)
    recRef.current = rec; setListening(itemId); rec.start()
  }

  const photosOk = !template?.requirePhotos || safeToOperate || totalPhotos > 0
  const gateOk = safeToOperate || safeToDrive !== null
  const requiredMissing = !!template && template.headerFields.filter((f) => f.enabled && !f.auto && f.required).some((f) => !(manual[f.id] || '').trim())
  const canSubmit = !!template && reviewed === allItems.length && signed && photosOk && gateOk && !requiredMissing

  const submit = () => {
    if (!template || !canSubmit) return
    const built: ItemResult[] = []
    for (const s of sections) for (const it of s.items) {
      built.push({ sectionId: s.id, itemId: it.id, label: it.label, status: results[it.id] || 'PASS', note: notes[it.id] })
    }
    const hasTrailer = template.headerFields.some((f) => f.id === 'trailer' && f.enabled)
    createInspection({
      orgId: org.id, type, driverId: driver?.id, driverName: driver?.name || 'Driver',
      vehicleLabel: autoValue({ id: 'vehicle' }),
      trailerLabel: (type === 'TRAILER_TOW' || hasTrailer) && selectedTrailer ? `#${selectedTrailer.unitNumber}` : undefined,
      odometer: manual.odometer ? Number(manual.odometer.replace(/[^0-9]/g, '')) : null,
      projectJobsite: manual.project, location: manual.location,
      results: built, defectCount: defects.length,
      safeToOperate, safeToDrive: safeToOperate ? undefined : safeToDrive ?? false,
      photos: totalPhotos, signedBy: driver?.name, remarks,
      status: defects.length ? 'NEEDS_REVIEW' : 'CLOSED',
      mechanic: defects.length && org.features.mechanicCertification ? { status: 'PENDING' } : undefined,
    })
    reset()
    onDone?.()
  }

  if (!template) return null
  const typeIcon: Record<InspectionType, React.ReactNode> = {
    PRE_TRIP: <Clock size={15} />, POST_TRIP: <Moon size={15} />, TRAILER_TOW: <TruckIcon size={15} />,
  }
  const hint = requiredMissing ? 'Fill required trip fields'
    : reviewed < allItems.length ? `Review all ${allItems.length} items`
    : !signed ? 'Signature required'
    : !photosOk ? 'Attach a photo for the defect'
    : !gateOk ? 'Confirm safe to operate'
    : 'Ready to submit'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-bg-weak-50 p-3">
        {/* status banner */}
        <div className="flex items-center gap-2 rounded-xl bg-bg-white-0 px-3.5 py-2.5 text-[12.5px] text-text-sub-600 shadow-sm">
          <span className={`h-2 w-2 rounded-full ${safeToOperate ? 'bg-state-success-base' : 'bg-state-error-base'}`} />
          {type === 'TRAILER_TOW' ? 'Trailer tow inspection' : type === 'POST_TRIP' ? 'End of day — Post-Trip' : 'New trip — start with Pre-Trip'}
        </div>

        {/* type tabs */}
        <div className="grid gap-1.5 rounded-xl bg-bg-white-0 p-1.5 shadow-sm" style={{ gridTemplateColumns: `repeat(${types.length}, minmax(0,1fr))` }}>
          {types.map((t) => {
            const on = type === t
            return (
              <button key={t} onClick={() => { setType(t); reset() }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-semibold transition-colors ${on ? 'bg-brand-500 text-white shadow-sm' : 'text-text-sub-600 hover:bg-bg-weak-50'}`}>
                {typeIcon[t]}{inspectionTypeLabel[t]}
              </button>
            )
          })}
        </div>

        {/* Trip Info */}
        <div className="rounded-2xl bg-bg-white-0 shadow-sm">
          <button onClick={() => setTripOpen((o) => !o)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-state-blue-lighter text-state-blue-base"><TruckIcon size={17} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-text-strong-950">Trip Info</span>
              <span className="block text-[12px] text-text-soft-400">Carrier, driver, vehicle, location</span>
            </span>
            <ChevronDown size={18} className={`text-text-soft-400 transition-transform ${tripOpen ? 'rotate-180' : ''}`} />
          </button>
          {tripOpen && (
            <div className="space-y-3.5 border-t border-stroke-soft-200 px-3.5 pb-4 pt-3.5">
              {template.headerFields.filter((f) => f.enabled).map((f) => {
                if (f.id === 'location') return <LocationField key={f.id} required={!!f.required} value={manual.location || ''} onChange={(v) => setManual((m) => ({ ...m, location: v }))} open={locOpen} setOpen={setLocOpen} locating={locating} onDevice={useDevice} />
                if (f.id === 'odometer') return <OdometerField key={f.id} required={!!f.required} value={manual.odometer || ''} onChange={(v) => setManual((m) => ({ ...m, odometer: v }))} photo={odoPhoto} onPhoto={(files) => onPhoto(files, setOdoPhoto)} onClearPhoto={() => setOdoPhoto(undefined)} />
                if (f.id === 'trailer') return (
                  <Labeled key={f.id} label={f.label}>
                    <div className="relative">
                      <select value={selectedTrailer?.id || ''} onChange={(e) => setTrailerId(e.target.value)}
                        className="h-11 w-full appearance-none rounded-xl border border-stroke-soft-200 bg-bg-white-0 px-3 pr-8 text-[14px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100">
                        {!selectedTrailer && <option value="">No trailer</option>}
                        {trailers.map((t) => <option key={t.id} value={t.id}>#{t.unitNumber} · {t.equipmentType}{t.id === assignedTrailer?.id ? ' (assigned)' : ''}</option>)}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-soft-400" />
                    </div>
                  </Labeled>
                )
                return (
                  <Labeled key={f.id} label={f.label} required={!f.auto && !!f.required}>
                    {f.auto ? (
                      <div className="flex h-11 items-center justify-between rounded-xl border border-stroke-soft-200 bg-bg-weak-50 px-3">
                        <span className="text-[14px] font-medium text-text-strong-950">{autoValue(f)}</span>
                        <span className="rounded bg-state-success-lighter px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-state-success-base">{f.id === 'vehicle' || f.id === 'truck' ? 'ASSIGNED' : 'AUTO'}</span>
                      </div>
                    ) : (
                      <input value={manual[f.id] || ''} onChange={(e) => setManual((m) => ({ ...m, [f.id]: e.target.value }))}
                        placeholder={f.id === 'project' ? 'e.g. Riverside Plant Expansion' : 'Enter'}
                        className="h-11 w-full rounded-xl border border-stroke-soft-200 bg-bg-white-0 px-3 text-[14px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
                    )}
                  </Labeled>
                )
              })}
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="rounded-2xl bg-bg-white-0 p-3.5 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[15px] font-bold text-text-strong-950">Inspection Checklist</span>
            <button onClick={markAllOk} className="flex items-center gap-1 rounded-lg bg-state-success-lighter px-2.5 py-1 text-[12px] font-semibold text-state-success-base">
              <CircleCheck size={13} />Mark all as OK
            </button>
          </div>
          <p className="text-[12px] text-text-soft-400">{allItems.length} items · all must be reviewed</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[12px] font-semibold text-text-sub-600 tabular-nums">{reviewed} / {allItems.length}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-weak-50">
              <div className="h-full rounded-full bg-state-success-base transition-all" style={{ width: `${(reviewed / allItems.length) * 100}%` }} />
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {sections.map((s) => (
              <div key={s.id} className="space-y-2.5">
                {sections.length > 1 && <p className="pt-1 text-[11px] font-bold uppercase tracking-wide text-text-soft-400">{s.title}</p>}
                {s.items.map((it) => {
                  const st = results[it.id]
                  const isDefect = st === 'FAIL'
                  const photos = itemPhotos[it.id] || []
                  return (
                    <div key={it.id} className={`rounded-xl border transition-colors ${isDefect ? 'border-state-error-base/40 bg-state-error-lighter/40' : 'border-stroke-soft-200 bg-bg-white-0'}`}>
                      <div className="flex items-center justify-between gap-2 p-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-text-strong-950">{it.label}</p>
                          {it.hint && <p className="text-[11px] text-text-soft-400">{it.hint}</p>}
                        </div>
                        <div className="flex flex-none items-center gap-1.5">
                          <label className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-stroke-soft-200 bg-bg-white-0 text-text-sub-600 hover:bg-bg-weak-50" title="Add photo">
                            <Camera size={15} />
                            {photos.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold text-white">{photos.length}</span>}
                            <input type="file" accept="image/*" capture="environment" className="hidden"
                              onChange={(e) => onPhoto(e.target.files, (u) => setItemPhotos((d) => ({ ...d, [it.id]: [...(d[it.id] || []), u] })))} />
                          </label>
                          <div className="flex overflow-hidden rounded-lg bg-bg-weak-50 p-0.5">
                            <button onClick={() => set(it.id, 'PASS')}
                              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors ${st === 'PASS' ? 'bg-state-success-base text-white shadow-sm' : 'text-text-soft-400'}`}>
                              <Check size={13} />OK
                            </button>
                            <button onClick={() => set(it.id, 'FAIL')}
                              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors ${st === 'FAIL' ? 'bg-state-error-base text-white shadow-sm' : 'text-text-soft-400'}`}>
                              <X size={13} />Defect
                            </button>
                          </div>
                        </div>
                      </div>
                      {(isDefect || photos.length > 0) && (
                        <div className={`p-3 ${isDefect ? 'border-t border-dashed border-state-error-base/30' : 'border-t border-stroke-soft-200'}`}>
                          {isDefect && (
                            <div className="relative mb-2">
                              <textarea value={notes[it.id] || ''} onChange={(e) => setNotes((n) => ({ ...n, [it.id]: e.target.value }))}
                                placeholder="Describe the defect (location, severity, notes)…"
                                className="min-h-[64px] w-full rounded-lg border border-state-error-base/30 bg-bg-white-0 p-2.5 pr-10 text-[13px] focus:border-state-error-base/60 focus:outline-none" />
                              <button onClick={() => toggleMic(it.id)} title="Speak the defect"
                                className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors ${listening === it.id ? 'animate-pulse bg-state-error-base text-white' : 'bg-bg-weak-50 text-text-sub-600 hover:bg-brand-100'}`}>
                                <Mic size={14} />
                              </button>
                            </div>
                          )}
                          {photos.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              {photos.map((u, idx) => (
                                <span key={idx} className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-stroke-soft-200 bg-bg-weak-50">
                                  {u.startsWith('blob:') ? <img src={u} alt="" className="h-full w-full object-cover" /> : <Camera size={14} className="text-text-soft-400" />}
                                </span>
                              ))}
                            </div>
                          )}
                          {listening === it.id && <span className="mt-1 block text-[11.5px] font-medium text-state-error-base">Listening… speak now</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Safe to operate */}
        {template.safeToOperateGate && (
          <div className="rounded-2xl bg-bg-white-0 p-3.5 shadow-sm">
            <p className="text-[15px] font-bold text-text-strong-950">{type === 'TRAILER_TOW' ? 'Trailer' : 'Vehicle'} safe to operate?</p>
            <p className="text-[12px] text-text-soft-400">Confirm before submitting</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-3 text-[13.5px] font-semibold ${safeToOperate ? 'border-state-success-base bg-state-success-lighter text-state-success-base' : 'border-stroke-soft-200 text-text-soft-400'}`}>
                <ShieldCheck size={16} />Yes — Safe
              </div>
              <div className={`flex items-center justify-center gap-1.5 rounded-xl border-2 py-3 text-[13.5px] font-semibold ${!safeToOperate ? 'border-state-error-base bg-state-error-lighter text-state-error-base' : 'border-stroke-soft-200 text-text-soft-400'}`}>
                <ShieldAlert size={16} />No — Unsafe
              </div>
            </div>
            {!safeToOperate && (
              <div className="mt-3 rounded-xl bg-state-error-lighter/50 p-3">
                <p className="text-[12.5px] font-medium text-text-strong-950">{defects.length} defect(s) noted. Safe to drive to the yard?</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setSafeToDrive(true)} className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ${safeToDrive === true ? 'bg-state-warning-base text-white' : 'border border-stroke-soft-200 bg-bg-white-0 text-text-sub-600'}`}>Yes — to yard</button>
                  <button onClick={() => setSafeToDrive(false)} className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ${safeToDrive === false ? 'bg-state-error-base text-white' : 'border border-stroke-soft-200 bg-bg-white-0 text-text-sub-600'}`}>No — out of service</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Remarks + signature */}
        <div className="rounded-2xl bg-bg-white-0 p-3.5 shadow-sm">
          <p className="text-[15px] font-bold text-text-strong-950">Driver Remarks</p>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Defects noted, observations… (optional)"
            className="mt-2 min-h-[60px] w-full rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-3 text-[13px] focus:border-brand-400 focus:outline-none" />
          {org.features.mechanicCertification && (
            <p className="mt-2 rounded-lg bg-bg-weak-50 px-3 py-2 text-[12px] text-text-sub-600">Mechanic / repair certification is required when a defect is reported — routed automatically after submit.</p>
          )}
          <button onClick={() => setSigned((s) => !s)}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-3.5 text-[13.5px] font-semibold transition-colors ${signed ? 'border-brand-400 bg-state-information-lighter text-brand-500' : 'border-dashed border-stroke-sub-300 text-text-sub-600'}`}>
            <PenLine size={15} />{signed ? `Signed — ${driver?.name}` : 'Tap to sign'}
          </button>
        </div>
      </div>

      {/* sticky submit */}
      <div className="border-t border-stroke-soft-200 bg-bg-white-0 px-3 py-2.5">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-text-soft-400">
          <span>{hint}</span>
          <span className="tabular-nums">{reviewed}/{allItems.length} · {defects.length} defect(s)</span>
        </div>
        <button disabled={!canSubmit} onClick={submit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:bg-bg-weak-50 disabled:text-text-soft-400 disabled:shadow-none">
          Submit {inspectionTypeLabel[type]}
        </button>
      </div>
    </div>
  )
}

/* -------------------------------- fields -------------------------------- */
function Labeled({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-text-strong-950">{label}{required && <span className="text-brand-500"> *</span>}</span>
      {children}
    </label>
  )
}

function OdometerField({ value, onChange, photo, onPhoto, onClearPhoto, required }: {
  value: string; onChange: (v: string) => void; photo?: string; onPhoto: (files: FileList | null) => void; onClearPhoto: () => void; required?: boolean
}) {
  return (
    <Labeled label="Odometer (mi)" required={required}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Gauge size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft-400" />
          <input value={value} onChange={(e) => onChange(e.target.value)} inputMode="numeric" placeholder="124,580"
            className="h-11 w-full rounded-xl border border-stroke-soft-200 bg-bg-white-0 pl-9 pr-3 text-[14px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
        </div>
        <label className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-stroke-soft-200 bg-bg-white-0 px-3 text-[12.5px] font-semibold text-text-sub-600 hover:bg-bg-weak-50">
          <Camera size={16} />Photo
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onPhoto(e.target.files)} />
        </label>
      </div>
      {photo && (
        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-lg border border-stroke-soft-200 bg-bg-weak-50">
            {photo.startsWith('blob:') ? <img src={photo} alt="odometer" className="h-full w-full object-cover" /> : <Camera size={16} className="text-text-soft-400" />}
          </span>
          <span className="text-[12px] font-medium text-state-success-base">Odometer photo attached</span>
          <button onClick={onClearPhoto} className="text-[12px] text-text-soft-400 underline">Remove</button>
        </div>
      )}
    </Labeled>
  )
}

function LocationField({ value, onChange, open, setOpen, locating, onDevice, required }: {
  value: string; onChange: (v: string) => void; open: boolean; setOpen: (b: boolean) => void; locating: boolean; onDevice: () => void; required?: boolean
}) {
  const q = value.trim().toLowerCase()
  const matches = q ? MOCK_PLACES.filter((p) => p.toLowerCase().includes(q)) : MOCK_PLACES
  return (
    <Labeled label="Start Location" required={required}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft-400" />
          <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
            placeholder="Search address or place…"
            className="h-11 w-full rounded-xl border border-stroke-soft-200 bg-bg-white-0 pl-9 pr-3 text-[14px] focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          {open && matches.length > 0 && (
            <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-stroke-soft-200 bg-bg-white-0 shadow-lg">
              {matches.slice(0, 5).map((p) => (
                <button key={p} onClick={() => { onChange(p); setOpen(false) }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-bg-weak-50">
                  <MapPin size={14} className="mt-0.5 flex-none text-state-error-base" />
                  <span className="text-[12.5px] text-text-strong-950">{p}</span>
                </button>
              ))}
              <div className="border-t border-stroke-soft-200 px-3 py-1 text-[10px] text-text-soft-400">Places search (Google Maps API)</div>
            </div>
          )}
        </div>
        <button onClick={onDevice} title="Use my current location"
          className="flex h-11 items-center gap-1.5 rounded-xl border border-stroke-soft-200 bg-bg-white-0 px-3 text-[12.5px] font-semibold text-brand-500 hover:bg-bg-weak-50">
          <LocateFixed size={16} className={locating ? 'animate-spin' : ''} />{locating ? '…' : 'GPS'}
        </button>
      </div>
    </Labeled>
  )
}
