/* Inspection records + DOT service log — seed data, org-scoped. */
import type { InspectionType } from './orgConfig'

export type ItemStatus = 'PASS' | 'FAIL' | 'NA'
export type InspectionStatus = 'SUBMITTED' | 'NEEDS_REVIEW' | 'CLOSED'
export type MechanicStatus = 'PENDING' | 'CERTIFIED'

export interface ItemResult {
  sectionId: string
  itemId: string
  label: string
  status: ItemStatus
  note?: string
}

export interface InspectionRecord {
  id: string
  orgId: string
  type: InspectionType
  driverId?: string | null
  driverName: string
  vehicleLabel: string
  trailerLabel?: string
  odometer?: number | null
  projectJobsite?: string
  location?: string       // start location (pre) / end location (post)
  dateTime: string        // Time Out (pre) / Time In (post) is derived from this
  results: ItemResult[]
  defectCount: number
  safeToOperate: boolean
  safeToDrive?: boolean // only meaningful when safeToOperate === false
  photos: number
  signedBy?: string
  remarks?: string
  mechanic?: { status: MechanicStatus; by?: string; note?: string; date?: string }
  status: InspectionStatus
}

export interface ServiceLog {
  id: string
  orgId: string
  vehicleLabel: string
  serviceType: string
  date: string
  odometer: number
  vendor: string
  cost: number
  nextDueDate?: string | null
  nextDueOdometer?: number | null
  notes: string
}

/* -------------------------------------------------------------------------- */
/* Seed inspection records                                                     */
/* -------------------------------------------------------------------------- */

const pass = (sectionId: string, itemId: string, label: string): ItemResult => ({ sectionId, itemId, label, status: 'PASS' })
const fail = (sectionId: string, itemId: string, label: string, note: string): ItemResult => ({ sectionId, itemId, label, status: 'FAIL', note })

/* All 12 BWN checklist items, with a subset failing when `fails` is provided. */
const bwnItems = (fails: Record<string, string> = {}): ItemResult[] => ([
  ['brakes-service', 'Service brakes'], ['brakes-parking', 'Parking brake'], ['steering', 'Steering mechanism'],
  ['lighting', 'Lighting devices & reflectors'], ['tires', 'Tires'], ['horn', 'Horn'],
  ['wipers', 'Windshield wipers'], ['mirrors', 'Rear-vision mirrors'], ['coupling', 'Coupling devices'],
  ['wheels', 'Wheels & rims'], ['emergency', 'Emergency equipment'], ['fluids', 'Fluid levels & leaks'],
] as [string, string][]).map(([id, label]) => fails[id]
  ? fail('bwn-checklist', id, label, fails[id])
  : pass('bwn-checklist', id, label))

export const seedInspections: InspectionRecord[] = [
  /* ---- BWN: DVIR records (labels match fleet trucks) ---- */
  // #101 (Marcus Reed) — a complete daily sheet: pre-trip + post-trip, both clean.
  {
    id: 'INS-3001', orgId: 'bwn', type: 'PRE_TRIP', driverId: 'D-1', driverName: 'Marcus Reed',
    vehicleLabel: '#101', trailerLabel: '#201', odometer: 284410, location: '109 E Wheel Rd, Bel Air, MD',
    dateTime: '2026-07-30T06:12:00', photos: 0, signedBy: 'Marcus Reed', safeToOperate: true, defectCount: 0,
    status: 'CLOSED', results: bwnItems(), remarks: 'No defects. Vehicle safe to operate.',
  },
  {
    id: 'INS-3005', orgId: 'bwn', type: 'POST_TRIP', driverId: 'D-1', driverName: 'Marcus Reed',
    vehicleLabel: '#101', trailerLabel: '#201', odometer: 284688, location: '109 E Wheel Rd, Bel Air, MD',
    dateTime: '2026-07-30T17:40:00', photos: 0, signedBy: 'Marcus Reed', safeToOperate: true, defectCount: 0,
    status: 'CLOSED', results: bwnItems(), remarks: 'End of day — no defects.',
  },
  // #102 (Elena Vasquez) — pre-trip with an open defect (out of service).
  {
    id: 'INS-3002', orgId: 'bwn', type: 'PRE_TRIP', driverId: 'D-2', driverName: 'Elena Vasquez',
    vehicleLabel: '#102', trailerLabel: '#202', odometer: 198220, location: 'Fort Worth Terminal, TX',
    dateTime: '2026-07-30T05:48:00', photos: 2, signedBy: 'Elena Vasquez', safeToOperate: false, safeToDrive: false,
    defectCount: 1, status: 'NEEDS_REVIEW',
    results: bwnItems({ tires: 'Front-left tire below tread depth, visible cording.' }),
    remarks: 'Front-left tire unsafe. Flagged out of service.', mechanic: { status: 'PENDING' },
  },
  // #104 (Jose Alvarez) — post-trip defect, repaired & certified.
  {
    id: 'INS-3003', orgId: 'bwn', type: 'POST_TRIP', driverId: 'D-4', driverName: 'Jose Alvarez',
    vehicleLabel: '#104', trailerLabel: '#204', odometer: 331890, location: 'Waco Yard, TX',
    dateTime: '2026-07-29T18:40:00', photos: 1, signedBy: 'Jose Alvarez', safeToOperate: true, defectCount: 1,
    status: 'CLOSED',
    results: bwnItems({ lighting: 'Right marker light out — replaced at yard.' }),
    remarks: 'Marker light replaced. Certified.',
    mechanic: { status: 'CERTIFIED', by: 'J. Ortiz (Mechanic)', note: 'Replaced right marker lamp, tested OK.', date: '2026-07-29T20:05:00' },
  },

  /* ---- ProSet: vehicle + trailer-tow records (labels match fleet trucks) ---- */
  {
    id: 'INS-4001', orgId: 'proset', type: 'PRE_TRIP', driverId: 'D-1', driverName: 'Marcus Reed',
    vehicleLabel: '#101', odometer: 74210, projectJobsite: 'Riverside Plant Expansion', location: 'Riverside Plant, Irving, TX',
    dateTime: '2026-07-30T06:30:00', photos: 3, signedBy: 'Marcus Reed', safeToOperate: true, defectCount: 0,
    status: 'CLOSED',
    results: [
      pass('exterior', 'tires', 'Tires'), pass('exterior', 'lugs', 'Wheel lug nuts secure'),
      pass('lighting', 'headlights', 'Headlights operational'), pass('lighting', 'brakelights', 'Brake lights operational'),
      pass('cab', 'seatbelts', 'Seat belts operational'), pass('cab', 'registration', 'Registration & insurance present'),
      pass('engine', 'warninglights', 'No warning lights present on dash'), pass('engine', 'fluids', 'Fluids OK'),
      pass('safety', 'extinguisher', 'Fire extinguisher'), pass('safety', 'firstaid', 'First aid kit'),
    ],
    remarks: 'All sections clear.',
  },
  {
    id: 'INS-4002', orgId: 'proset', type: 'PRE_TRIP', driverId: 'D-2', driverName: 'Elena Vasquez',
    vehicleLabel: '#102', odometer: 61980, projectJobsite: 'Downtown Substation', location: 'Downtown Substation, Dallas, TX',
    dateTime: '2026-07-30T06:05:00', photos: 4, signedBy: 'Elena Vasquez', safeToOperate: false, safeToDrive: true,
    defectCount: 2, status: 'NEEDS_REVIEW',
    results: [
      pass('exterior', 'tires', 'Tires'), pass('exterior', 'leaks', 'No visible fluid leaks'),
      fail('lighting', 'brakelights', 'Brake lights operational', 'Left brake light intermittent.'),
      fail('engine', 'fluids', 'Fluids OK', 'Coolant below minimum line.'),
      pass('safety', 'firstaid', 'First aid kit'),
    ],
    remarks: 'Reported to shop; drivable to yard only.',
  },
  {
    id: 'INS-4003', orgId: 'proset', type: 'TRAILER_TOW', driverId: 'D-4', driverName: 'Jose Alvarez',
    vehicleLabel: '#103', trailerLabel: '#203', projectJobsite: 'Highway 9 Culvert', location: 'FM-9 & County Rd 210',
    dateTime: '2026-07-29T14:20:00', photos: 2, signedBy: 'Jose Alvarez', safeToOperate: true, defectCount: 0,
    status: 'CLOSED',
    results: [
      pass('hitch', 'coupler', 'Coupler secure'), pass('hitch', 'chains', 'Safety chains attached'),
      pass('hitch', 'breakaway', 'Breakaway cable connected'), pass('tires', 'tires', 'Tires'),
      pass('lighting', 'brake', 'Brake lights'), pass('load', 'secured', 'Load properly secured'),
      pass('load', 'shifting', 'No shifting hazards'),
    ],
    remarks: 'Trailer safe to operate.',
  },
]

/* -------------------------------------------------------------------------- */
/* Seed DOT service logs (ProSet)                                              */
/* -------------------------------------------------------------------------- */

export const seedServiceLogs: ServiceLog[] = [
  {
    id: 'SVC-9001', orgId: 'proset', vehicleLabel: '#101', serviceType: 'DOT Annual Inspection',
    date: '2026-05-14', odometer: 71800, vendor: 'Certified DOT Lane', cost: 240,
    nextDueDate: '2027-05-14', nextDueOdometer: null, notes: 'Passed. Certificate on file.',
  },
  {
    id: 'SVC-9002', orgId: 'proset', vehicleLabel: '#101', serviceType: 'Oil & Filter',
    date: '2026-07-02', odometer: 73900, vendor: 'FleetPro Service', cost: 118,
    nextDueDate: null, nextDueOdometer: 78900, notes: 'Synthetic, 5k interval.',
  },
  {
    id: 'SVC-9003', orgId: 'proset', vehicleLabel: '#102', serviceType: 'Brake Service',
    date: '2026-06-20', odometer: 60100, vendor: 'FleetPro Service', cost: 620,
    nextDueDate: null, nextDueOdometer: 90100, notes: 'Front pads + rotors.',
  },
  {
    id: 'SVC-9004', orgId: 'proset', vehicleLabel: '#103', serviceType: 'DOT Annual Inspection',
    date: '2026-03-30', odometer: 51200, vendor: 'Certified DOT Lane', cost: 240,
    nextDueDate: '2027-03-30', nextDueOdometer: null, notes: 'Passed with note: replace wiper blades (done).',
  },
]
