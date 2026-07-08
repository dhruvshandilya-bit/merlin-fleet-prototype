import { useState } from 'react'
import {
  Radio, User, Truck, Container, ArrowRight, MapPin, Phone, Home, Clock, ShieldCheck,
  Search, Zap, AlertTriangle, CheckCircle2, Package, Wrench,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card, CardHeader, Button, Badge, Progress, KV, EmptyState, SectionTitle, InfoTip } from '@/components/ui'
import { DriverStatusBadge, LoadStatusBadge, ExpiryBadge, flagTone, flagLabel } from '@/lib/status'
import { currency, num, expiryStatus } from '@/lib/utils'
import type { Driver, Load, Truck as TruckT, Trailer } from '@/lib/types'

type Mode = 'trips' | 'drivers'

function driverEligible(d: Driver): { ok: boolean; reason?: string } {
  if (expiryStatus(d.cdlExp) === 'expired') return { ok: false, reason: 'CDL expired' }
  if (expiryStatus(d.medicalCardExp) === 'expired') return { ok: false, reason: 'Medical card expired' }
  if (d.status === 'OFF_DUTY' || d.status === 'SLEEPER') return { ok: false, reason: 'Off duty' }
  if (d.hosRemaining < 2) return { ok: false, reason: 'Insufficient HOS' }
  return { ok: true }
}

export function DispatchScreen() {
  const store = useStore()
  const { loads, drivers, trucks, trailers, truckById, dispatchLoad } = store
  const [mode, setMode] = useState<Mode>('trips')
  const [selLoad, setSelLoad] = useState<string | null>(loads.find((l) => l.status === 'NOT_COVERED')?.id ?? null)
  const [selDriver, setSelDriver] = useState<string | null>(drivers.find((d) => d.status === 'AVAILABLE')?.id ?? null)

  const uncovered = loads.filter((l) => l.status === 'NOT_COVERED')

  // Suggest a truck + trailer for a driver given a load
  const rig = (d: Driver, load?: Load): { truck?: TruckT; trailer?: Trailer } => {
    const truck = truckById(d.assignedTruckId) ?? trucks.find((t) => t.status === 'IDLE')
    let trailer = truck ? trailers.find((r) => r.assignedTruckId === truck.id) : undefined
    if (load && (!trailer || trailer.equipmentType !== load.equipmentType)) {
      trailer = trailers.find((r) => r.equipmentType === load.equipmentType && (r.status === 'IDLE' || r.status === 'ACTIVE')) ?? trailer
    }
    return { truck, trailer }
  }

  const doDispatch = (loadId: string, d: Driver) => {
    const load = loads.find((l) => l.id === loadId)
    const { truck, trailer } = rig(d, load)
    if (!truck || !trailer) return
    dispatchLoad(loadId, d.id, truck.id, trailer.id)
    setSelLoad(loads.filter((l) => l.status === 'NOT_COVERED' && l.id !== loadId)[0]?.id ?? null)
  }

  const load = loads.find((l) => l.id === selLoad) ?? null
  const driver = drivers.find((d) => d.id === selDriver) ?? null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Radio size={20} className="text-primary" />Dispatch Planner</h1>
          <p className="text-[13px] text-muted-foreground">{uncovered.length} loads to cover · {drivers.filter((d) => driverEligible(d).ok && d.status === 'AVAILABLE').length} drivers available</p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-white p-0.5">
          {(['trips', 'drivers'] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${mode === m ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {m === 'trips' ? 'Plan by Trips' : 'Plan by Drivers'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,1fr)_1.4fr]">
        {/* LEFT list */}
        <Card className="overflow-hidden">
          {mode === 'trips' ? (
            <>
              <CardHeader title="Uncovered Loads" subtitle="Select a load to assign" action={<Badge tone={uncovered.length ? 'red' : 'green'}>{uncovered.length}</Badge>} />
              <div className="max-h-[62vh] divide-y divide-border overflow-y-auto">
                {uncovered.length === 0 && <EmptyState icon={<CheckCircle2 size={28} />} title="All loads covered" hint="Every load has a driver assigned." />}
                {uncovered.map((l) => (
                  <button key={l.id} onClick={() => setSelLoad(l.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${selLoad === l.id ? 'bg-secondary/70' : ''}`}>
                    <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white text-primary ring-1 ring-border"><Package size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold">{l.loadNumber}</span>
                        {l.flag !== 'NONE' && <Badge tone={flagTone[l.flag]}>{flagLabel[l.flag]}</Badge>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground"><span>{l.originCity}</span><ArrowRight size={11} /><span>{l.destCity}</span></div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground"><Badge tone="purple">{l.equipmentType}</Badge>{num(l.miles)} mi · {currency(l.customerRate)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <CardHeader title="Drivers" subtitle="Select a driver to plan" />
              <div className="max-h-[62vh] divide-y divide-border overflow-y-auto">
                {drivers.map((d) => {
                  const el = driverEligible(d)
                  return (
                    <button key={d.id} onClick={() => setSelDriver(d.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${selDriver === d.id ? 'bg-secondary/70' : ''}`}>
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-500 text-[12px] font-semibold text-white">{d.name.split(' ').map((n) => n[0]).join('')}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold">{d.name}</div>
                        <div className="text-[11px] text-muted-foreground">{d.homeCity}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <DriverStatusBadge status={d.status} />
                        {!el.ok && <span className="text-[10px] font-medium text-red-500">{el.reason}</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </Card>

        {/* RIGHT detail */}
        {mode === 'trips'
          ? <TripAssignPanel load={load} rig={rig} doDispatch={doDispatch} />
          : <DriverPlanPanel driver={driver} uncovered={uncovered} rig={rig} doDispatch={doDispatch} />}
      </div>
    </div>
  )
}

/* ---------- Plan by Trips: pick a driver for the selected load ---------- */
function TripAssignPanel({ load, rig, doDispatch }: {
  load: Load | null
  rig: (d: Driver, load?: Load) => { truck?: TruckT; trailer?: Trailer }
  doDispatch: (loadId: string, d: Driver) => void
}) {
  const { drivers } = useStore()
  if (!load) return <Card className="flex items-center justify-center"><EmptyState icon={<Radio size={30} />} title="Select a load" hint="Pick an uncovered load on the left to see matching drivers." /></Card>

  const ranked = [...drivers].map((d) => {
    const el = driverEligible(d)
    const { truck, trailer } = rig(d, load)
    const equipMatch = trailer?.equipmentType === load.equipmentType
    const score = (el.ok ? 2 : 0) + (equipMatch ? 2 : 0) + (d.status === 'AVAILABLE' ? 1 : 0) + Math.min(1, d.hosRemaining / 11)
    return { d, el, truck, trailer, equipMatch, score }
  }).sort((a, b) => b.score - a.score)

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={<span className="flex items-center gap-2">Assign <span className="text-primary">{load.loadNumber}</span></span>}
        info="Drivers ranked by eligibility, equipment match, availability & hours of service."
        subtitle={`${load.originCity}, ${load.originState} → ${load.destCity}, ${load.destState} · ${num(load.miles)} mi`}
        action={<Badge tone="purple">{load.equipmentType}</Badge>}
      />
      <div className="border-b border-border bg-muted/40 px-4 py-2.5 text-[12px] text-muted-foreground">
        Best-match drivers first — checked for eligibility, equipment fit, availability & HOS.
      </div>
      <div className="max-h-[54vh] divide-y divide-border overflow-y-auto">
        {ranked.map(({ d, el, truck, trailer, equipMatch }) => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-500 text-[12px] font-semibold text-white">{d.name.split(' ').map((n) => n[0]).join('')}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold">{d.name}</span>
                <DriverStatusBadge status={d.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Truck size={11} />{truck ? `#${truck.unitNumber}` : 'no truck'}</span>
                <span className="flex items-center gap-1"><Container size={11} />{trailer ? `${trailer.equipmentType} #${trailer.unitNumber}` : 'no trailer'}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{d.hosRemaining}h HOS</span>
                {equipMatch ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={11} />Equip match</span> : <span className="flex items-center gap-1 text-amber-600"><AlertTriangle size={11} />No {load.equipmentType}</span>}
              </div>
            </div>
            {el.ok
              ? <Button size="sm" disabled={!truck || !trailer} onClick={() => doDispatch(load.id, d)}><Zap size={14} />Dispatch</Button>
              : <div className="text-right"><Badge tone="red">Ineligible</Badge><div className="mt-0.5 text-[10px] text-red-500">{el.reason}</div></div>}
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ---------- Plan by Drivers: rich driver side panel + find trips ---------- */
function DriverPlanPanel({ driver, uncovered, rig, doDispatch }: {
  driver: Driver | null
  uncovered: Load[]
  rig: (d: Driver, load?: Load) => { truck?: TruckT; trailer?: Trailer }
  doDispatch: (loadId: string, d: Driver) => void
}) {
  const { loads, trailers } = useStore()
  if (!driver) return <Card className="flex items-center justify-center"><EmptyState icon={<User size={30} />} title="Select a driver" hint="Pick a driver on the left to see their status and find trips." /></Card>

  const el = driverEligible(driver)
  const { truck } = rig(driver)
  const activeTrailer = truck ? trailers.find((r) => r.assignedTruckId === truck.id) : undefined
  const currentLoads = loads.filter((l) => l.driverId === driver.id && l.status !== 'DELIVERED')
  const matches = uncovered
    .map((l) => ({ l, fit: rig(driver, l).trailer?.equipmentType === l.equipmentType }))
    .sort((a, b) => Number(b.fit) - Number(a.fit))

  const hosTone = driver.hosRemaining >= 6 ? 'green' : driver.hosRemaining >= 2 ? 'amber' : 'red'

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border p-4">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-500 text-base font-semibold text-white">{driver.name.split(' ').map((n) => n[0]).join('')}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><span className="text-[15px] font-semibold">{driver.name}</span><DriverStatusBadge status={driver.status} /></div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1"><Phone size={12} />{driver.phone}</span>
            <span className="flex items-center gap-1"><Home size={12} />{driver.homeCity}</span>
          </div>
        </div>
        <div className="text-right"><div className="text-[11px] text-muted-foreground">Dispatcher</div><div className="text-[12px] font-medium">You · Rapid Carrier</div></div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
        {/* HOS + quals */}
        <div className="space-y-3 rounded-lg border border-border p-3">
          <SectionTitle info="Driving hours left today under the federal 11-hour limit. Under 2h left blocks new dispatch.">Hours of Service</SectionTitle>
          <div className="flex items-center justify-between text-[12px]"><span className="text-muted-foreground">Remaining today</span><span className="font-semibold">{driver.hosRemaining} / 11 h</span></div>
          <Progress value={(driver.hosRemaining / 11) * 100} tone={hosTone} />
          <div className="pt-1"><SectionTitle info="CDL & medical-card validity plus endorsements (H=Hazmat, N=Tanker, T=Doubles/Triples, X=Tanker+Hazmat).">Qualifications</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              <ExpiryBadge iso={driver.cdlExp} label="CDL" />
              <ExpiryBadge iso={driver.medicalCardExp} label="Med" />
              {driver.endorsements.map((e) => <Badge key={e} tone="slate">{e}</Badge>)}
            </div>
          </div>
          {!el.ok && <div className="flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1.5 text-[12px] font-medium text-red-600"><AlertTriangle size={13} />{el.reason} — cannot dispatch</div>}
        </div>

        {/* Rig snapshot */}
        <div className="space-y-3 rounded-lg border border-border p-3">
          <SectionTitle>Assigned Rig</SectionTitle>
          {truck ? (
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary"><Truck size={15} /></span>
              <div className="flex-1"><div className="text-[13px] font-medium">Truck #{truck.unitNumber}</div><div className="text-[11px] text-muted-foreground">{truck.year} {truck.make} {truck.model}</div></div>
              {truck.maintenanceFlag && <Badge tone="amber"><Wrench size={11} />Maint</Badge>}
            </div>
          ) : <div className="text-[12px] text-muted-foreground">No truck assigned.</div>}
          {activeTrailer ? (
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary"><Container size={15} /></span>
              <div className="flex-1"><div className="text-[13px] font-medium">Trailer #{activeTrailer.unitNumber}</div><div className="text-[11px] text-muted-foreground">{activeTrailer.equipmentType} · {num(activeTrailer.maxWeight)} lbs</div></div>
            </div>
          ) : <div className="text-[12px] text-muted-foreground">No trailer hooked.</div>}
        </div>
      </div>

      {/* Current + find trips */}
      <div className="border-t border-border p-4">
        {currentLoads.length > 0 && (
          <div className="mb-4">
            <SectionTitle>Current Loads</SectionTitle>
            <div className="space-y-2">
              {currentLoads.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2 text-[13px]"><span className="font-semibold">{l.loadNumber}</span><span className="text-muted-foreground">{l.originCity} → {l.destCity}</span></div>
                  <LoadStatusBadge status={l.status} />
                </div>
              ))}
            </div>
          </div>
        )}
        <SectionTitle info="Uncovered loads this driver's rig can haul — a matching trailer shows 'Fit'." action={<span className="text-[11px] text-muted-foreground">{matches.length} available</span>}><span className="flex items-center gap-1.5"><Search size={13} />Find Trips</span></SectionTitle>
        <div className="space-y-2">
          {matches.length === 0 && <div className="text-[12px] text-muted-foreground">No uncovered loads right now.</div>}
          {matches.map(({ l, fit }) => (
            <div key={l.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[13px]"><span className="font-semibold">{l.loadNumber}</span><Badge tone="purple">{l.equipmentType}</Badge>{fit ? <Badge tone="green"><CheckCircle2 size={10} />Fit</Badge> : <Badge tone="amber">Swap trailer</Badge>}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin size={10} />{l.originCity} → {l.destCity} · {num(l.miles)} mi · {currency(l.customerRate)}</div>
              </div>
              <Button size="sm" variant={el.ok ? 'primary' : 'outline'} disabled={!el.ok} onClick={() => doDispatch(l.id, driver)}><Zap size={13} />Assign</Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
