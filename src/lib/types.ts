export type AssetStatus = 'ACTIVE' | 'IDLE' | 'IN_MAINTENANCE' | 'OUT_OF_SERVICE'
export type DriverStatus = 'AVAILABLE' | 'ON_DUTY' | 'DRIVING' | 'OFF_DUTY' | 'SLEEPER'

export interface DocRef {
  id: string
  name: string
  type: string
  uploadedAt: string
}

export interface Truck {
  id: string
  unitNumber: string
  vin: string
  year: number
  make: string
  model: string
  plate: string
  status: AssetStatus
  fleet: string
  ownerOperator: boolean
  odometer: number
  fuelType: string
  fuelCard: string
  eldProvider: string
  registrationExp: string
  insuranceExp: string
  inspectionExp: string
  assignedDriverId?: string | null
  maintenanceFlag: boolean
  docs: DocRef[]
  notes: string
}

export type EquipmentType = 'Dry Van' | 'Reefer' | 'Flatbed' | 'Step Deck' | 'Tanker'

export interface Trailer {
  id: string
  unitNumber: string
  vin: string
  year: number
  make: string
  equipmentType: EquipmentType
  plate: string
  status: AssetStatus
  maxWeight: number
  registrationExp: string
  inspectionExp: string
  assignedTruckId?: string | null
  maintenanceFlag: boolean
  docs: DocRef[]
  notes: string
}

export interface Driver {
  id: string
  name: string
  phone: string
  email: string
  homeCity: string
  status: DriverStatus
  hireDate: string
  cdlNumber: string
  cdlExp: string
  medicalCardExp: string
  endorsements: string[]
  hosRemaining: number // hours of service remaining today
  payRatePerMile: number
  assignedTruckId?: string | null
  docs: DocRef[]
  notes: string
}

export interface Stop {
  id: string
  type: 'PICKUP' | 'DELIVERY'
  location: string
  city: string
  state: string
  scheduleType: 'APPOINTMENT' | 'FCFS'
  window: string
  loadingType: 'Live' | 'Hook' | 'Drop & Hook'
  commodity: string
  completed: boolean
}

export type LoadStatus = 'NOT_COVERED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED'
export type LoadFlag = 'NONE' | 'CAUTION' | 'IMPORTANT' | 'CRITICAL' | 'RUNNING_LATE' | 'TEMP_DISCREPANCY'

export interface Load {
  id: string
  loadNumber: string
  customer: string
  poNumber: string
  commodity: string
  equipmentType: EquipmentType
  weight: number
  status: LoadStatus
  flag: LoadFlag
  originCity: string
  originState: string
  destCity: string
  destState: string
  miles: number
  customerRate: number
  carrierRate: number
  stops: Stop[]
  driverId?: string | null
  truckId?: string | null
  trailerId?: string | null
  pickupDate: string
  deliveryDate: string
  progress: number // 0-100 for in-transit
  podUploaded: boolean
}

export type MaintenanceCategory = 'Preventive' | 'Tires' | 'Brakes' | 'Engine' | 'Electrical' | 'DOT Repair' | 'Other'
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'

export interface MaintenanceRecord {
  id: string
  assetType: 'Truck' | 'Trailer'
  assetId: string
  assetLabel: string
  category: MaintenanceCategory
  description: string
  status: MaintenanceStatus
  datePerformed?: string | null
  dateDue?: string | null
  vendor: string
  odometer?: number | null
  amount: number
  poNumber: string
}

/* ---------------- Financial / back-office ---------------- */

export interface Accessorial {
  type: 'Detention' | 'Lumper' | 'Layover' | 'TONU' | 'Fuel Surcharge' | 'Stop-off'
  amount: number
}

export type InvoiceStatus = 'INCOMPLETE' | 'RELEASED' | 'INVOICED' | 'PAID' | 'DISCREPANCY'

export interface Invoice {
  id: string
  invoiceNumber: string
  customer: string
  loadNumbers: string[]
  lineHaul: number
  accessorials: Accessorial[]
  amount: number
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  paidDate?: string | null
  factored: boolean
}

export type SettlementStatus = 'DRAFT' | 'APPROVED' | 'PAID'

export interface SettlementLine {
  loadNumber: string
  lane: string
  miles: number
  rate: number // per mile (driver) or flat
  pay: number
}

export interface DriverSettlement {
  id: string
  driverId: string
  driverName: string
  periodStart: string
  periodEnd: string
  lines: SettlementLine[]
  gross: number
  deductions: number
  reimbursements: number
  net: number
  status: SettlementStatus
}

export interface CarrierSettlement {
  id: string
  carrier: string
  mcNumber: string
  loadNumbers: string[]
  amount: number
  status: SettlementStatus
  dueDate: string
}

export interface FuelTransaction {
  id: string
  date: string
  truckId: string
  driverId?: string | null
  location: string
  state: string
  gallons: number
  pricePerGal: number
  amount: number
  cardLast4: string
}

export interface TollTransaction {
  id: string
  date: string
  truckId: string
  location: string
  state: string
  amount: number
  transponder: string
}

export interface IftaJurisdiction {
  state: string
  miles: number
  taxableGallons: number
  taxPaidGallons: number
  taxRate: number
  netTax: number
}

export type FactoringStatus = 'QUEUED' | 'SUBMITTED' | 'ADVANCED' | 'SETTLED'

export interface FactoringItem {
  id: string
  invoiceNumber: string
  customer: string
  amount: number
  advanceRate: number
  advance: number
  feeRate: number
  fee: number
  status: FactoringStatus
  submittedDate?: string | null
}

export type SafetyEventType = 'ACCIDENT' | 'ROADSIDE_INSPECTION'

export interface SafetyEvent {
  id: string
  type: SafetyEventType
  date: string
  driverId?: string | null
  truckId?: string | null
  trailerId?: string | null
  location: string
  level: string
  status: 'OPEN' | 'UNDER_REVIEW' | 'CLOSED'
  comments: string
}
