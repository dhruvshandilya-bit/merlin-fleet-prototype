import { useState } from 'react'
import { Truck, MapPin, Navigation, Circle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card, CardHeader, Button, Badge, Progress } from '@/components/ui'
import { LoadStatusBadge, flagTone, flagLabel } from '@/lib/status'
import { mapPositions } from '@/lib/data'
import { formatDateShort } from '@/lib/utils'
import type { Load } from '@/lib/types'
import { PageHead } from '@/features/vehicles/VehiclesScreen'

/** Deterministic fallback position for loads without an explicit mapPositions entry. */
function posFor(load: Load, i: number): { x: number; y: number } {
  const p = mapPositions[load.id]
  if (p) return p
  return { x: 0.3 + 0.15 * i, y: 0.35 + 0.12 * i }
}

/** Fabricate a stable ETA time string from the load's remaining progress. */
function etaFor(load: Load): string {
  // Base 12:00, add minutes derived from the remaining distance — deterministic per load.
  const remaining = Math.max(0, 100 - load.progress)
  const totalMinutes = 12 * 60 + Math.round(remaining * 3.4)
  const hh24 = Math.floor(totalMinutes / 60) % 24
  const mm = totalMinutes % 60
  const period = hh24 >= 12 ? 'PM' : 'AM'
  const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12
  return `${hh12}:${mm.toString().padStart(2, '0')} ${period}`
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function MapScreen() {
  const { loads, driverById, truckById, notify } = useStore()
  const inTransit = loads.filter((l) => l.status === 'IN_TRANSIT')
  const [selectedId, setSelectedId] = useState<string | null>(inTransit[0]?.id ?? null)

  return (
    <div className="space-y-4">
      <PageHead
        title="Live Map"
        count={inTransit.length}
        sub="Real-time GPS tracking of in-transit loads"
      />

      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        style={{ minHeight: 560, height: 'calc(100vh - 220px)' }}
      >
        {/* -------------------- Map (left, ~2/3) -------------------- */}
        <Card className="relative overflow-hidden p-0 lg:col-span-2">
          <div
            className="relative h-full w-full"
            style={{
              background:
                'radial-gradient(120% 120% at 15% 10%, #f4f5ff 0%, #eef0fb 45%, #e9edf7 100%)',
            }}
          >
            {/* Soft geographic blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="absolute rounded-full"
                style={{
                  left: '8%', top: '18%', width: 260, height: 200,
                  background: 'rgba(124, 92, 246, 0.10)', filter: 'blur(2px)',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  left: '48%', top: '6%', width: 320, height: 240,
                  background: 'rgba(96, 165, 250, 0.12)', filter: 'blur(2px)',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  left: '30%', top: '48%', width: 380, height: 260,
                  background: 'rgba(124, 92, 246, 0.08)', filter: 'blur(2px)',
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  left: '62%', top: '52%', width: 240, height: 220,
                  background: 'rgba(52, 211, 153, 0.10)', filter: 'blur(2px)',
                }}
              />
            </div>

            {/* Grid lines */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(99,102,180,0.09) 0px, rgba(99,102,180,0.09) 1px, transparent 1px, transparent 44px), repeating-linear-gradient(90deg, rgba(99,102,180,0.09) 0px, rgba(99,102,180,0.09) 1px, transparent 1px, transparent 44px)',
              }}
            />

            {/* Live indicator (top-right) */}
            <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-border bg-white/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live · updates 15s
            </div>

            {/* Markers */}
            {inTransit.map((load, i) => {
              const pos = posFor(load, i)
              const isSel = load.id === selectedId
              const driver = driverById(load.driverId)
              const truck = truckById(load.truckId)
              return (
                <button
                  key={load.id}
                  onClick={() => setSelectedId(load.id)}
                  className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                  style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
                  aria-label={`Load ${load.loadNumber}`}
                >
                  {/* Pulsing ring */}
                  <span
                    className={`absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full ${isSel ? 'animate-ping bg-brand-400/50' : 'bg-brand-400/25'}`}
                  />
                  {/* Pin dot */}
                  <span
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-white shadow-lg transition-transform group-hover:scale-110 ${isSel ? 'scale-110 ring-2 ring-brand-500 ring-offset-2' : ''}`}
                  >
                    <Truck size={14} />
                  </span>

                  {/* Tooltip */}
                  <span
                    className={`pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-52 -translate-x-1/2 rounded-lg border border-border bg-white p-2.5 text-left shadow-xl transition-opacity ${isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-foreground">{load.loadNumber}</span>
                      <LoadStatusBadge status={load.status} />
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {driver?.name ?? 'Unassigned'}{truck && ` · #${truck.unitNumber}`}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-foreground">
                      {load.originCity}, {load.originState}
                      <Navigation size={10} className="text-brand-500" />
                      {load.destCity}, {load.destState}
                    </span>
                  </span>
                </button>
              )
            })}

            {/* Legend (bottom-left) */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 rounded-lg border border-border bg-white/90 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border border-white bg-brand-500 shadow" />
                In Transit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-brand-500 ring-offset-1" />
                Selected
              </span>
            </div>
          </div>
        </Card>

        {/* -------------------- Side list (right, ~1/3) -------------------- */}
        <Card className="flex min-h-0 flex-col">
          <CardHeader
            title="En Route"
            subtitle={`${inTransit.length} load${inTransit.length === 1 ? '' : 's'} currently in transit`}
            action={<Button variant="outline" size="sm" onClick={() => notify('Map re-centered on active fleet')}><MapPin size={14} />Center</Button>}
          />
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {inTransit.map((load) => {
              const driver = driverById(load.driverId)
              const truck = truckById(load.truckId)
              const isSel = load.id === selectedId
              const late = load.flag === 'RUNNING_LATE' || load.flag === 'CRITICAL'
              return (
                <button
                  key={load.id}
                  onClick={() => setSelectedId(load.id)}
                  className={`mb-1.5 w-full rounded-lg border p-3 text-left transition-colors ${isSel ? 'border-primary bg-secondary ring-1 ring-primary' : 'border-border bg-white hover:bg-muted/60'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[12px] font-semibold text-white">
                      {driver ? initials(driver.name) : '—'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-foreground">{driver?.name ?? 'Unassigned'}</span>
                        <Badge tone="purple">{load.loadNumber}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {truck ? `#${truck.unitNumber} · ${truck.make}` : 'No truck'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-foreground">
                    <MapPin size={12} className="shrink-0 text-brand-500" />
                    <span className="truncate">{load.originCity}, {load.originState}</span>
                    <Navigation size={11} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{load.destCity}, {load.destState}</span>
                  </div>

                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{load.progress}% · {load.miles} mi</span>
                      <span className="font-medium text-foreground">ETA {etaFor(load)}</span>
                    </div>
                    <Progress value={load.progress} tone={late ? 'red' : 'purple'} />
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    {load.flag !== 'NONE' && (
                      <Badge tone={flagTone[load.flag]}>
                        <Circle size={8} className="fill-current" />
                        {flagLabel[load.flag]}
                      </Badge>
                    )}
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                      Del {formatDateShort(load.deliveryDate)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
