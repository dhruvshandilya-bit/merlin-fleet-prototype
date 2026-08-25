import { useState } from 'react'
import { Truck as TruckIcon, UserPlus, Link2, CheckCircle2, ArrowRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card, CardHeader, Button, Field, Input, Select } from '@/components/ui'
import { PageHead } from '@/features/vehicles/VehiclesScreen'
import { AssetStatusBadge } from '@/lib/status'

/* Web onboarding: bring a vehicle + driver into the fleet and assign them,
   without touching a phone. Everything here writes real records into the store. */
export function OnboardingScreen() {
  const { org, trucks, drivers, createTruck, createDriver, assignDriver } = useStore()
  const [v, setV] = useState<Record<string, string>>({})
  const [d, setD] = useState<Record<string, string>>({})

  const addVehicle = () => {
    createTruck({
      unitNumber: v.unitNumber || undefined, vin: v.vin || undefined,
      make: v.make || undefined, model: v.model || undefined, plate: v.plate || undefined,
      year: v.year ? Number(v.year) : undefined, odometer: v.odometer ? Number(v.odometer) : undefined,
    })
    setV({})
  }
  const addDriver = () => {
    createDriver({
      name: d.name || undefined, phone: d.phone || undefined, email: d.email || undefined,
      homeCity: d.homeCity || undefined, cdlNumber: d.cdlNumber || undefined,
    })
    setD({})
  }

  const unassigned = drivers.filter((x) => !x.assignedTruckId)

  return (
    <div className="space-y-4">
      <PageHead title="Onboarding" sub={`${org.name} · add vehicles, drivers & assignments from the web`} />

      <div className="rounded-lg border border-stroke-soft-200 bg-state-information-lighter/40 px-4 py-3 text-[13px] text-text-sub-600">
        <span className="font-medium text-text-strong-950">Web onboarding.</span> Field staff never have to set up records on a phone — an admin adds the vehicle and driver here, assigns them, and the mobile inspection app picks it up automatically.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Step 1 — vehicle */}
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[12px] font-semibold text-primary">1</span>Add vehicle</span>} />
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Unit #"><Input placeholder="F-350-14" value={v.unitNumber || ''} onChange={(e) => setV({ ...v, unitNumber: e.target.value })} /></Field>
              <Field label="Plate"><Input placeholder="TX 1234-AB" value={v.plate || ''} onChange={(e) => setV({ ...v, plate: e.target.value })} /></Field>
              <Field label="Make"><Input placeholder="Ford" value={v.make || ''} onChange={(e) => setV({ ...v, make: e.target.value })} /></Field>
              <Field label="Model"><Input placeholder="F-350" value={v.model || ''} onChange={(e) => setV({ ...v, model: e.target.value })} /></Field>
              <Field label="Year"><Input type="number" placeholder="2025" value={v.year || ''} onChange={(e) => setV({ ...v, year: e.target.value })} /></Field>
              <Field label="Odometer"><Input type="number" placeholder="0" value={v.odometer || ''} onChange={(e) => setV({ ...v, odometer: e.target.value })} /></Field>
            </div>
            <Field label="VIN"><Input placeholder="1FT8W3BT…" value={v.vin || ''} onChange={(e) => setV({ ...v, vin: e.target.value })} /></Field>
            <Button className="w-full" size="sm" onClick={addVehicle}><TruckIcon size={14} />Add vehicle</Button>
          </div>
        </Card>

        {/* Step 2 — driver */}
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[12px] font-semibold text-primary">2</span>Add driver</span>} />
          <div className="space-y-3 p-4">
            <Field label="Full name"><Input placeholder="Jordan Lee" value={d.name || ''} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone"><Input placeholder="(555) 010-2233" value={d.phone || ''} onChange={(e) => setD({ ...d, phone: e.target.value })} /></Field>
              <Field label="Home city"><Input placeholder="Dallas, TX" value={d.homeCity || ''} onChange={(e) => setD({ ...d, homeCity: e.target.value })} /></Field>
            </div>
            <Field label="Email"><Input placeholder="jordan@company.com" value={d.email || ''} onChange={(e) => setD({ ...d, email: e.target.value })} /></Field>
            <Field label="CDL / License #"><Input placeholder="TX-DL-88213" value={d.cdlNumber || ''} onChange={(e) => setD({ ...d, cdlNumber: e.target.value })} /></Field>
            <Button className="w-full" size="sm" onClick={addDriver}><UserPlus size={14} />Add driver</Button>
          </div>
        </Card>

        {/* Step 3 — assignment */}
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[12px] font-semibold text-primary">3</span>Assign driver → vehicle</span>} />
          <div className="space-y-3 p-4">
            <p className="text-[12px] text-text-sub-600">Assignment is what auto-populates the driver's inspection header and drives location tracking.</p>
            {unassigned.length === 0 && <p className="text-[13px] text-text-soft-400">All drivers are assigned.</p>}
            {unassigned.slice(0, 6).map((dr) => (
              <div key={dr.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text-strong-950">{dr.name}</p>
                  <p className="text-[11px] text-text-soft-400">{dr.homeCity || 'No home city'}</p>
                </div>
                <Link2 size={13} className="text-text-soft-400" />
                <Select className="h-8 w-32 text-[12px]" defaultValue="" onChange={(e) => e.target.value && assignDriver(dr.id, e.target.value)}>
                  <option value="">Vehicle…</option>
                  {trucks.filter((t) => !t.assignedDriverId).map((t) => <option key={t.id} value={t.id}>#{t.unitNumber}</option>)}
                </Select>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
