import React, { createContext, useContext, useMemo, useState, useCallback } from 'react'
import type {
  Truck, Trailer, Driver, Load, MaintenanceRecord, SafetyEvent,
  Invoice, DriverSettlement, CarrierSettlement, FuelTransaction, TollTransaction,
} from './types'
import {
  seedTrucks, seedTrailers, seedDrivers, seedLoads, seedMaintenance, seedSafety,
  seedInvoices, seedDriverSettlements, seedCarrierSettlements, seedFuel, seedTolls,
} from './data'
import { uid } from './utils'
import { SEED_ORGS, type OrgConfig } from './orgConfig'
import { seedInspections, seedServiceLogs, type InspectionRecord, type ServiceLog } from './inspectionData'
import { INSPECTION_ONLY } from './appMode'

export type Section =
  | 'dashboard' | 'vehicles' | 'trailers' | 'drivers'
  | 'loads' | 'dispatch' | 'map' | 'maintenance' | 'compliance'
  | 'invoicing' | 'settlements' | 'fuel'
  | 'driver' | 'inspections' | 'servicelog' | 'onboarding' | 'settings'

interface Toast { id: string; message: string }

interface Store {
  trucks: Truck[]
  trailers: Trailer[]
  drivers: Driver[]
  loads: Load[]
  maintenance: MaintenanceRecord[]
  safety: SafetyEvent[]
  invoices: Invoice[]
  driverSettlements: DriverSettlement[]
  carrierSettlements: CarrierSettlement[]
  fuel: FuelTransaction[]
  tolls: TollTransaction[]
  section: Section
  setSection: (s: Section) => void
  toasts: Toast[]
  notify: (message: string) => void
  // multi-tenant config
  orgs: OrgConfig[]
  orgId: string
  org: OrgConfig
  setOrgId: (id: string) => void
  updateOrg: (id: string, updater: (o: OrgConfig) => OrgConfig) => void
  addOrg: (o: OrgConfig) => void
  // driver app persona (who is "signed in" on the mobile app)
  currentDriverId: string
  setCurrentDriverId: (id: string) => void
  // inspections + service log
  inspections: InspectionRecord[]
  createInspection: (r: Partial<InspectionRecord>) => InspectionRecord
  certifyInspection: (id: string, by: string, note: string) => void
  serviceLogs: ServiceLog[]
  createServiceLog: (s: Partial<ServiceLog>) => void
  // actions
  createLoad: (l: Partial<Load>) => Load
  createTruck: (t: Partial<Truck>) => void
  createTrailer: (t: Partial<Trailer>) => void
  createDriver: (d: Partial<Driver>) => void
  assignDriver: (driverId: string, truckId: string | null) => void
  dispatchLoad: (loadId: string, driverId: string, truckId: string, trailerId: string) => void
  advanceLoad: (loadId: string, progress: number) => void
  deliverLoad: (loadId: string) => void
  createMaintenance: (m: Partial<MaintenanceRecord>) => void
  releaseInvoice: (id: string) => void
  markInvoicePaid: (id: string) => void
  approveSettlement: (id: string) => void
  paySettlement: (id: string) => void
  // helpers
  truckById: (id?: string | null) => Truck | undefined
  trailerById: (id?: string | null) => Trailer | undefined
  driverById: (id?: string | null) => Driver | undefined
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [trucks, setTrucks] = useState<Truck[]>(seedTrucks)
  const [trailers, setTrailers] = useState<Trailer[]>(seedTrailers)
  const [drivers, setDrivers] = useState<Driver[]>(seedDrivers)
  const [loads, setLoads] = useState<Load[]>(seedLoads)
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(seedMaintenance)
  const [safety] = useState<SafetyEvent[]>(seedSafety)
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices)
  const [driverSettlements, setDriverSettlements] = useState<DriverSettlement[]>(seedDriverSettlements)
  const [carrierSettlements, setCarrierSettlements] = useState<CarrierSettlement[]>(seedCarrierSettlements)
  const [fuel] = useState<FuelTransaction[]>(seedFuel)
  const [tolls] = useState<TollTransaction[]>(seedTolls)
  const [section, setSection] = useState<Section>(INSPECTION_ONLY ? 'inspections' : 'dashboard')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [orgs, setOrgs] = useState<OrgConfig[]>(SEED_ORGS)
  const [orgId, setOrgIdState] = useState<string>(SEED_ORGS[0].id)
  const [currentDriverId, setCurrentDriverId] = useState<string>('D-1')
  const [inspections, setInspections] = useState<InspectionRecord[]>(seedInspections)
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>(seedServiceLogs)

  const org = useMemo(() => orgs.find((o) => o.id === orgId) ?? orgs[0], [orgs, orgId])

  const notify = useCallback((message: string) => {
    const id = uid('toast')
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const truckById = useCallback((id?: string | null) => trucks.find((t) => t.id === id), [trucks])
  const trailerById = useCallback((id?: string | null) => trailers.find((t) => t.id === id), [trailers])
  const driverById = useCallback((id?: string | null) => drivers.find((d) => d.id === id), [drivers])

  const createLoad = useCallback((l: Partial<Load>): Load => {
    const id = uid('L')
    const load: Load = {
      id, loadNumber: id, customer: l.customer || 'New Customer', poNumber: l.poNumber || '',
      commodity: l.commodity || 'General freight', equipmentType: l.equipmentType || 'Dry Van',
      weight: l.weight || 40000, status: 'NOT_COVERED', flag: 'NONE',
      originCity: l.originCity || '', originState: l.originState || '', destCity: l.destCity || '', destState: l.destState || '',
      miles: l.miles || 0, customerRate: l.customerRate || 0, carrierRate: 0,
      stops: l.stops || [], driverId: null, truckId: null, trailerId: null,
      pickupDate: l.pickupDate || '2026-07-10', deliveryDate: l.deliveryDate || '2026-07-10', progress: 0, podUploaded: false,
    }
    setLoads((ls) => [load, ...ls])
    notify(`Load ${id} created`)
    return load
  }, [notify])

  const createTruck = useCallback((p: Partial<Truck>) => {
    const id = uid('T')
    const unitNumber = p.unitNumber || String(200 + Math.floor(Math.random() * 700))
    const truck: Truck = {
      id, unitNumber, vin: p.vin || 'VIN-PENDING', year: p.year || 2024, make: p.make || 'Freightliner',
      model: p.model || 'Cascadia', plate: p.plate || 'TX 0000-XX', status: p.status || 'IDLE',
      fleet: p.fleet || 'Dry Van Fleet', ownerOperator: p.ownerOperator ?? false, odometer: p.odometer || 0,
      fuelType: p.fuelType || 'Diesel', fuelCard: p.fuelCard || 'WEX ••0000', eldProvider: p.eldProvider || 'Samsara',
      registrationExp: p.registrationExp || '2027-06-30', insuranceExp: p.insuranceExp || '2027-06-30',
      inspectionExp: p.inspectionExp || '2027-06-30', assignedDriverId: null, maintenanceFlag: false, docs: [], notes: '',
    }
    setTrucks((ts) => [truck, ...ts])
    notify(`Truck #${unitNumber} added`)
  }, [notify])

  const createTrailer = useCallback((p: Partial<Trailer>) => {
    const id = uid('TR')
    const unitNumber = p.unitNumber || String(200 + Math.floor(Math.random() * 700))
    const trailer: Trailer = {
      id, unitNumber, vin: p.vin || 'VIN-PENDING', year: p.year || 2024, make: p.make || 'Wabash',
      equipmentType: p.equipmentType || 'Dry Van', plate: p.plate || 'TX 00-000', status: p.status || 'IDLE',
      maxWeight: p.maxWeight || 45000, registrationExp: p.registrationExp || '2027-06-30',
      inspectionExp: p.inspectionExp || '2027-06-30', assignedTruckId: null, maintenanceFlag: false, docs: [], notes: '',
    }
    setTrailers((rs) => [trailer, ...rs])
    notify(`Trailer #${unitNumber} added`)
  }, [notify])

  const createDriver = useCallback((p: Partial<Driver>) => {
    const id = uid('D')
    const name = p.name || 'New Driver'
    const driver: Driver = {
      id, name, phone: p.phone || '(000) 000-0000', email: p.email || '', homeCity: p.homeCity || '',
      status: 'AVAILABLE', hireDate: p.hireDate || '2026-07-08', cdlNumber: p.cdlNumber || 'TX-DL-00000',
      cdlExp: p.cdlExp || '2029-06-30', medicalCardExp: p.medicalCardExp || '2027-06-30',
      endorsements: p.endorsements || [], hosRemaining: 11, payRatePerMile: p.payRatePerMile || 0.58,
      assignedTruckId: null, docs: [], notes: '',
    }
    setDrivers((ds) => [driver, ...ds])
    notify(`Driver ${name} added`)
  }, [notify])

  const assignDriver = useCallback((driverId: string, truckId: string | null) => {
    setDrivers((ds) => ds.map((d) => (d.id === driverId ? { ...d, assignedTruckId: truckId } : d)))
    setTrucks((ts) => ts.map((t) => {
      if (t.id === truckId) return { ...t, assignedDriverId: driverId }
      if (t.assignedDriverId === driverId) return { ...t, assignedDriverId: null }
      return t
    }))
    const d = drivers.find((x) => x.id === driverId)
    const t = trucks.find((x) => x.id === truckId)
    notify(truckId ? `${d?.name ?? 'Driver'} → Truck #${t?.unitNumber ?? ''}` : `${d?.name ?? 'Driver'} unassigned`)
  }, [drivers, trucks, notify])

  const dispatchLoad = useCallback((loadId: string, driverId: string, truckId: string, trailerId: string) => {
    setLoads((ls) => ls.map((l) => (l.id === loadId ? { ...l, driverId, truckId, trailerId, status: 'DISPATCHED', flag: 'NONE' } : l)))
    setTrucks((ts) => ts.map((t) => (t.id === truckId ? { ...t, assignedDriverId: driverId, status: 'ACTIVE' } : t)))
    setTrailers((rs) => rs.map((r) => (r.id === trailerId ? { ...r, assignedTruckId: truckId } : r)))
    setDrivers((ds) => ds.map((d) => (d.id === driverId ? { ...d, assignedTruckId: truckId, status: 'ON_DUTY' } : d)))
    const d = drivers.find((x) => x.id === driverId)
    notify(`Dispatched ${loadId} → ${d?.name ?? 'driver'}`)
  }, [drivers, notify])

  const advanceLoad = useCallback((loadId: string, progress: number) => {
    setLoads((ls) => ls.map((l) => (l.id === loadId ? { ...l, status: 'IN_TRANSIT', progress } : l)))
  }, [])

  const deliverLoad = useCallback((loadId: string) => {
    setLoads((ls) => ls.map((l) => (l.id === loadId ? { ...l, status: 'DELIVERED', progress: 100, podUploaded: true, flag: 'NONE', stops: l.stops.map((s) => ({ ...s, completed: true })) } : l)))
    notify(`Load ${loadId} delivered — POD captured`)
  }, [notify])

  const createMaintenance = useCallback((m: Partial<MaintenanceRecord>) => {
    const id = uid('M')
    const rec: MaintenanceRecord = {
      id, assetType: m.assetType || 'Truck', assetId: m.assetId || '', assetLabel: m.assetLabel || '',
      category: m.category || 'Preventive', description: m.description || '', status: m.status || 'OPEN',
      datePerformed: m.datePerformed ?? null, dateDue: m.dateDue ?? null, vendor: m.vendor || '',
      odometer: m.odometer ?? null, amount: m.amount || 0, poNumber: m.poNumber || id.replace('M', 'WO'),
    }
    setMaintenance((ms) => [rec, ...ms])
    if (rec.assetType === 'Truck') setTrucks((ts) => ts.map((t) => (t.id === rec.assetId ? { ...t, maintenanceFlag: true } : t)))
    else setTrailers((rs) => rs.map((r) => (r.id === rec.assetId ? { ...r, maintenanceFlag: true } : r)))
    notify(`Work order ${id} opened`)
  }, [notify])

  const releaseInvoice = useCallback((id: string) => {
    setInvoices((xs) => xs.map((i) => (i.id === id ? { ...i, status: i.status === 'INCOMPLETE' ? 'RELEASED' : 'INVOICED' } : i)))
    notify(`Invoice ${id} moved forward`)
  }, [notify])
  const markInvoicePaid = useCallback((id: string) => {
    setInvoices((xs) => xs.map((i) => (i.id === id ? { ...i, status: 'PAID', paidDate: '2026-07-08' } : i)))
    notify(`Invoice ${id} marked paid`)
  }, [notify])
  const approveSettlement = useCallback((id: string) => {
    setDriverSettlements((xs) => xs.map((s) => (s.id === id ? { ...s, status: 'APPROVED' } : s)))
    setCarrierSettlements((xs) => xs.map((s) => (s.id === id ? { ...s, status: 'APPROVED' } : s)))
    notify(`Settlement ${id} approved`)
  }, [notify])
  const paySettlement = useCallback((id: string) => {
    setDriverSettlements((xs) => xs.map((s) => (s.id === id ? { ...s, status: 'PAID' } : s)))
    setCarrierSettlements((xs) => xs.map((s) => (s.id === id ? { ...s, status: 'PAID' } : s)))
    notify(`Settlement ${id} paid`)
  }, [notify])

  const setOrgId = useCallback((id: string) => {
    setOrgIdState(id)
    const o = SEED_ORGS.find((x) => x.id === id)
    notify(`Switched to ${o?.name ?? id}`)
    // If a feature-gated screen is open that the new org disables, fall back.
    setSection((s) => {
      if (s === 'servicelog' && !o?.features.serviceLog) return 'inspections'
      return s
    })
  }, [notify])

  const updateOrg = useCallback((id: string, updater: (o: OrgConfig) => OrgConfig) => {
    setOrgs((os) => os.map((o) => (o.id === id ? updater(o) : o)))
  }, [])

  const addOrg = useCallback((o: OrgConfig) => {
    setOrgs((os) => [...os, o])
    setOrgIdState(o.id)
    notify(`Client "${o.name}" created`)
  }, [notify])

  const createInspection = useCallback((r: Partial<InspectionRecord>): InspectionRecord => {
    const id = uid('INS')
    const defectCount = r.defectCount ?? (r.results?.filter((x) => x.status === 'FAIL').length ?? 0)
    const rec: InspectionRecord = {
      id, orgId: r.orgId || orgId, type: r.type || 'PRE_TRIP',
      driverId: r.driverId ?? null, driverName: r.driverName || 'Driver',
      vehicleLabel: r.vehicleLabel || '—', trailerLabel: r.trailerLabel,
      odometer: r.odometer ?? null, projectJobsite: r.projectJobsite, location: r.location,
      dateTime: r.dateTime || '2026-07-30T07:00:00', results: r.results || [],
      defectCount, safeToOperate: r.safeToOperate ?? true, safeToDrive: r.safeToDrive,
      photos: r.photos ?? 0, signedBy: r.signedBy, remarks: r.remarks,
      mechanic: r.mechanic, status: r.status || (defectCount > 0 ? 'NEEDS_REVIEW' : 'CLOSED'),
    }
    setInspections((xs) => [rec, ...xs])
    notify(`Inspection ${id} submitted${defectCount ? ` · ${defectCount} defect(s)` : ''}`)
    return rec
  }, [orgId, notify])

  const certifyInspection = useCallback((id: string, by: string, note: string) => {
    setInspections((xs) => xs.map((r) => (r.id === id
      ? { ...r, status: 'CLOSED', mechanic: { status: 'CERTIFIED', by, note, date: '2026-07-30T09:00:00' } }
      : r)))
    notify(`Inspection ${id} certified`)
  }, [notify])

  const createServiceLog = useCallback((s: Partial<ServiceLog>) => {
    const id = uid('SVC')
    const rec: ServiceLog = {
      id, orgId: s.orgId || orgId, vehicleLabel: s.vehicleLabel || '—',
      serviceType: s.serviceType || 'Service', date: s.date || '2026-07-30',
      odometer: s.odometer || 0, vendor: s.vendor || '', cost: s.cost || 0,
      nextDueDate: s.nextDueDate ?? null, nextDueOdometer: s.nextDueOdometer ?? null, notes: s.notes || '',
    }
    setServiceLogs((xs) => [rec, ...xs])
    notify(`Service log ${id} added`)
  }, [orgId, notify])

  const value = useMemo<Store>(() => ({
    trucks, trailers, drivers, loads, maintenance, safety,
    invoices, driverSettlements, carrierSettlements, fuel, tolls,
    section, setSection, toasts, notify,
    orgs, orgId, org, setOrgId, updateOrg, addOrg,
    currentDriverId, setCurrentDriverId,
    inspections, createInspection, certifyInspection, serviceLogs, createServiceLog,
    createLoad, createTruck, createTrailer, createDriver, assignDriver, dispatchLoad, advanceLoad, deliverLoad, createMaintenance,
    releaseInvoice, markInvoicePaid, approveSettlement, paySettlement,
    truckById, trailerById, driverById,
  }), [trucks, trailers, drivers, loads, maintenance, safety, invoices, driverSettlements, carrierSettlements, fuel, tolls, section, toasts, notify, orgs, orgId, org, setOrgId, updateOrg, addOrg, currentDriverId, inspections, createInspection, certifyInspection, serviceLogs, createServiceLog, createLoad, createTruck, createTrailer, createDriver, assignDriver, dispatchLoad, advanceLoad, deliverLoad, createMaintenance, releaseInvoice, markInvoicePaid, approveSettlement, paySettlement, truckById, trailerById, driverById])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used within StoreProvider')
  return s
}
