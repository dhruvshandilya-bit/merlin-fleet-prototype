/* ============================================================================
 * Multi-tenant inspection configuration.
 *
 * The product principle: ONE inspection engine, configured per client — not a
 * fork per customer. An OrgConfig carries feature toggles + inspection
 * templates. The app renders capture, web views, and nav entirely from the
 * active org's config, so switching client (BWN ↔ ProSet) re-shapes the whole
 * product with zero code changes. Anything one client needs and the other does
 * not is a toggle, not a branch.
 * ========================================================================== */

export type InspectionType = 'PRE_TRIP' | 'POST_TRIP' | 'TRAILER_TOW'

export const inspectionTypeLabel: Record<InspectionType, string> = {
  PRE_TRIP: 'Pre-Trip',
  POST_TRIP: 'Post-Trip',
  TRAILER_TOW: 'Trailer Tow',
}

/** A single pass/fail check on the form. */
export interface InspectionItem {
  id: string
  label: string
  /** Optional richer prompt shown under the label on capture. */
  hint?: string
}

/** A grouped set of checks (Exterior, Lighting, …). Toggleable per org. */
export interface InspectionSection {
  id: string
  title: string
  items: InspectionItem[]
  enabled: boolean
}

/** Header field captured before the checklist. `auto` = pre-populated. */
export interface HeaderField {
  id: string
  label: string
  auto: boolean
  enabled: boolean
  /** Manual fields only: must be filled before submit. */
  required?: boolean
}

export interface InspectionTemplate {
  id: string
  name: string
  appliesTo: InspectionType[]
  headerFields: HeaderField[]
  sections: InspectionSection[]
  requirePhotos: boolean
  requireSignature: boolean
  /** Show the "Safe to operate → if no, safe to drive?" gate at the end. */
  safeToOperateGate: boolean
}

/** Feature toggles that gate nav + optional workflow steps. */
export interface OrgFeatures {
  /** Post-trip inspections (some clients run pre-trip only). */
  postTrip: boolean
  /** Live GPS map + assignment-based location. */
  locationTracking: boolean
  /** DOT service-log database screen. */
  serviceLog: boolean
  /** Separate trailer-tow inspection template. */
  trailerTowInspection: boolean
  /** Photos required to submit an inspection with a defect. */
  photosRequired: boolean
  /** Defect routes to a mechanic/repair certification (DVIR flow). */
  mechanicCertification: boolean
  /** Capture Project / Jobsite on the header. */
  projectJobsite: boolean
  /** Capture odometer on the header. */
  odometer: boolean
}

/** PDF / print layout the client's inspections export as. */
export type PdfTemplate = 'bwn-daily' | 'proset-report'
export interface PdfConfig {
  template: PdfTemplate
  showLogo: boolean
  retentionNote: boolean
  includePhotos: boolean
  paper: 'A4' | 'Letter'
  /** Uploaded logo (data URL). Falls back to the initials mark when empty. */
  logoDataUrl?: string
  /** Brand accent hex for the sheet header. */
  brandColor?: string
}

export interface OrgConfig {
  id: string
  name: string
  /** Legal carrier name printed on the DVIR / inspection PDF. */
  legalName: string
  initials: string
  industry: string
  /** Marketing-style one-liner for the switcher. */
  blurb: string
  features: OrgFeatures
  pdf: PdfConfig
  templates: InspectionTemplate[]
}

export const PDF_TEMPLATE_META: { key: PdfTemplate; label: string; help: string }[] = [
  { key: 'bwn-daily', label: 'Daily DVIR sheet', help: 'Two-column Pre-Trip / Post-Trip safety sheet (FMCSA style).' },
  { key: 'proset-report', label: 'Sectioned report', help: 'Section-by-section inspection report with photos appended.' },
]

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

const sec = (id: string, title: string, items: [string, string, string?][], enabled = true): InspectionSection => ({
  id,
  title,
  enabled,
  items: items.map(([iid, label, hint]) => ({ id: iid, label, hint })),
})

/** Every check item across a template's enabled sections. */
export function templateItems(t: InspectionTemplate): InspectionItem[] {
  return t.sections.filter((s) => s.enabled).flatMap((s) => s.items)
}

export function templateItemCount(t: InspectionTemplate): number {
  return templateItems(t).length
}

export function templateFor(org: OrgConfig, type: InspectionType): InspectionTemplate | undefined {
  return org.templates.find((t) => t.appliesTo.includes(type))
}

/** The vehicle (pre-trip) template — where standard-library sections get added. */
export function primaryTemplate(org: OrgConfig): InspectionTemplate | undefined {
  return org.templates.find((t) => t.appliesTo.includes('PRE_TRIP'))
}

/* -------------------------------------------------------------------------- */
/* Standard checklist library — tick a section to populate a client's         */
/* template. This is the "standard way": build a client by picking standard    */
/* blocks rather than free-typing.                                             */
/* -------------------------------------------------------------------------- */
export const STANDARD_LIBRARY: InspectionSection[] = [
  sec('lib-brakes', 'Brakes', [['b1', 'Service brakes responsive'], ['b2', 'Parking brake holds'], ['b3', 'Air lines & pressure build-up'], ['b4', 'Brake adjustment within limits']]),
  sec('lib-steering', 'Steering & Suspension', [['s1', 'Steering — no excess play'], ['s2', 'Suspension & shocks'], ['s3', 'Kingpin / fifth wheel secure']]),
  sec('lib-lighting', 'Lighting', [['l1', 'Headlights'], ['l2', 'Tail lights'], ['l3', 'Brake lights'], ['l4', 'Turn signals'], ['l5', 'Hazard flashers'], ['l6', 'Marker / clearance lights']]),
  sec('lib-tires', 'Tires & Wheels', [['t1', 'Tread depth'], ['t2', 'Inflation'], ['t3', 'Lug nuts secure'], ['t4', 'Rims / wheels — no cracks']]),
  sec('lib-cab', 'Cab & Interior', [['c1', 'Seat belts'], ['c2', 'Horn'], ['c3', 'Wipers & washer fluid'], ['c4', 'Mirrors'], ['c5', 'Gauges / dash warning lights'], ['c6', 'Registration & insurance present']]),
  sec('lib-engine', 'Engine & Fluids', [['e1', 'Oil level'], ['e2', 'Coolant level'], ['e3', 'Brake fluid'], ['e4', 'No visible leaks'], ['e5', 'Fuel / DEF level']]),
  sec('lib-safety', 'Safety Equipment', [['sf1', 'Fire extinguisher (charged)'], ['sf2', 'First aid kit'], ['sf3', 'Warning triangles / flares'], ['sf4', 'Wheel chocks'], ['sf5', 'Spill / environmental kit']]),
  sec('lib-trailer', 'Trailer', [['tr1', 'Coupler / hitch secure'], ['tr2', 'Safety chains'], ['tr3', 'Breakaway cable'], ['tr4', 'Trailer brakes'], ['tr5', 'Landing gear'], ['tr6', 'Load securement rated'], ['tr7', 'Mud flaps & conspicuity tape']]),
]

const libSection = (id: string): InspectionSection => ({ ...STANDARD_LIBRARY.find((s) => s.id === id)!, enabled: true })

/** A new client's standard baseline — a full working config with no custom work.
    Everything is then tuned from the Configurator. */
let orgSeq = 1
export function makeStandardOrg({ name, initials, industry }: { name: string; initials: string; industry: string }): OrgConfig {
  orgSeq += 1
  const suffix = `${initials.toLowerCase()}${orgSeq}`
  const vehicle: InspectionTemplate = {
    id: `veh-${suffix}`, name: 'Vehicle Inspection', appliesTo: ['PRE_TRIP', 'POST_TRIP'],
    requirePhotos: true, requireSignature: true, safeToOperateGate: true,
    headerFields: [
      { id: 'driver', label: 'Driver', auto: true, enabled: true },
      { id: 'datetime', label: 'Date / Time', auto: true, enabled: true },
      { id: 'vehicle', label: 'Vehicle ID', auto: true, enabled: true },
      { id: 'trailer', label: 'Trailer', auto: true, enabled: true },
      { id: 'odometer', label: 'Odometer', auto: false, enabled: true, required: true },
      { id: 'location', label: 'Start Location', auto: false, enabled: true },
    ],
    sections: ['lib-brakes', 'lib-steering', 'lib-lighting', 'lib-tires', 'lib-cab', 'lib-engine', 'lib-safety'].map(libSection),
  }
  const trailer: InspectionTemplate = {
    id: `tr-${suffix}`, name: 'Trailer Tow Inspection', appliesTo: ['TRAILER_TOW'],
    requirePhotos: true, requireSignature: true, safeToOperateGate: true,
    headerFields: [
      { id: 'driver', label: 'Driver', auto: true, enabled: true },
      { id: 'truck', label: 'Truck', auto: true, enabled: true },
      { id: 'trailer', label: 'Trailer ID', auto: true, enabled: true },
    ],
    sections: [libSection('lib-trailer')],
  }
  return {
    id: `org-${suffix}`, name, legalName: name, initials: initials.slice(0, 2).toUpperCase(), industry,
    blurb: 'Standard vehicle inspection — tune from the Configurator.',
    features: { postTrip: true, locationTracking: true, serviceLog: false, trailerTowInspection: true, photosRequired: true, mechanicCertification: false, projectJobsite: false, odometer: true },
    pdf: { template: 'proset-report', showLogo: true, retentionNote: true, includePhotos: true, paper: 'A4' },
    templates: [vehicle, trailer],
  }
}

/* ========================================================================== */
/* BWN — compact DVIR (Driver Vehicle Inspection Report)                       */
/* ========================================================================== */

const BWN_DVIR: InspectionTemplate = {
  id: 'bwn-dvir',
  name: 'DVIR — Driver Vehicle Inspection Report',
  appliesTo: ['PRE_TRIP', 'POST_TRIP'],
  requirePhotos: false,
  requireSignature: true,
  safeToOperateGate: true,
  headerFields: [
    { id: 'carrier', label: 'Carrier', auto: true, enabled: true },
    { id: 'driver', label: 'Driver', auto: true, enabled: true },
    { id: 'vehicle', label: 'Truck / Unit #', auto: true, enabled: true },
    { id: 'trailer', label: 'Trailer #', auto: true, enabled: true },
    { id: 'plate', label: 'License Plate', auto: true, enabled: true },
    { id: 'location', label: 'Start Location', auto: false, enabled: true },
    { id: 'odometer', label: 'Odometer', auto: false, enabled: true, required: true },
  ],
  sections: [
    sec('bwn-checklist', 'Inspection Checklist', [
      ['brakes-service', 'Service brakes'],
      ['brakes-parking', 'Parking brake'],
      ['steering', 'Steering mechanism'],
      ['lighting', 'Lighting devices & reflectors'],
      ['tires', 'Tires'],
      ['horn', 'Horn'],
      ['wipers', 'Windshield wipers'],
      ['mirrors', 'Rear-vision mirrors'],
      ['coupling', 'Coupling devices'],
      ['wheels', 'Wheels & rims'],
      ['emergency', 'Emergency equipment'],
      ['fluids', 'Fluid levels & leaks'],
    ]),
    // Best-practice add-ons — off by default, enable in the Configurator.
    sec('bwn-addons', 'Best-practice add-ons', [
      ['suspension', 'Suspension & air lines'],
      ['exhaust', 'Exhaust system — no leaks'],
      ['def', 'Fuel / DEF level'],
      ['backup', 'Backup alarm / camera'],
      ['plate', 'License plate & registration sticker current'],
    ], false),
  ],
}

export const BWN: OrgConfig = {
  id: 'bwn',
  name: 'BWN Fleet',
  legalName: 'Basement Waterproofing Nationwide',
  initials: 'BW',
  industry: 'Regional carrier',
  blurb: 'Standard FMCSA DVIR — quick 12-point check, defect → mechanic certification.',
  features: {
    postTrip: true,
    locationTracking: true,
    serviceLog: false,
    trailerTowInspection: false,
    photosRequired: false,
    mechanicCertification: true,
    projectJobsite: false,
    odometer: true,
  },
  pdf: { template: 'bwn-daily', showLogo: true, retentionNote: true, includePhotos: false, paper: 'Letter', brandColor: '#1d4ed8' },
  templates: [BWN_DVIR],
}

/* ========================================================================== */
/* ProSet — detailed field inspection + trailer-tow                            */
/* (built from the client's requested form)                                    */
/* ========================================================================== */

const PROSET_VEHICLE: InspectionTemplate = {
  id: 'proset-vehicle',
  name: 'Vehicle Inspection',
  appliesTo: ['PRE_TRIP', 'POST_TRIP'],
  requirePhotos: true,
  requireSignature: true,
  safeToOperateGate: true,
  headerFields: [
    { id: 'driver', label: 'Driver Name', auto: true, enabled: true },
    { id: 'datetime', label: 'Date / Time', auto: true, enabled: true },
    { id: 'vehicle', label: 'Vehicle ID', auto: true, enabled: true },
    { id: 'odometer', label: 'Odometer', auto: false, enabled: true, required: true },
    { id: 'project', label: 'Project / Jobsite', auto: false, enabled: true },
  ],
  sections: [
    sec('exterior', 'Exterior', [
      ['tires', 'Tires', 'No visible damage, good tread, inflated to appropriate level'],
      ['lugs', 'Wheel lug nuts secure'],
      ['glass', 'Windshield, mirrors & windows in safe condition'],
      ['leaks', 'No visible fluid leaks'],
      ['wipers', 'Wipers & washer fluid'],
      ['bodydamage', 'No new body damage'],
    ]),
    sec('brakes', 'Brakes & Steering', [
      ['servicebrakes', 'Service brakes responsive'],
      ['parkingbrake', 'Parking brake holds'],
      ['steering', 'Steering — no excess play'],
    ]),
    sec('lighting', 'Lighting', [
      ['headlights', 'Headlights operational'],
      ['taillights', 'Tail lights operational'],
      ['brakelights', 'Brake lights operational'],
      ['turnsignals', 'Turn signals operational'],
      ['hazards', 'Hazard flashers operational'],
    ]),
    sec('cab', 'Cab', [
      ['seatbelts', 'Seat belts operational'],
      ['horn', 'Horn operational'],
      ['registration', 'Registration & insurance present'],
      ['annual', 'Annual inspection up to date'],
    ]),
    sec('engine', 'Engine', [
      ['warninglights', 'No warning lights present on dash'],
      ['fluids', 'Fluids OK', 'Visually check oil, brake, coolant'],
    ]),
    sec('safety', 'Safety Equipment', [
      ['extinguisher', 'Fire extinguisher (charged, in green)'],
      ['firstaid', 'First aid kit stocked'],
      ['roadside', 'Emergency roadside kit'],
      ['triangles', 'Warning triangles / flares'],
      ['chocks', 'Wheel chocks'],
      ['spill', 'Spill / environmental kit'],
    ]),
  ],
}

const PROSET_TRAILER: InspectionTemplate = {
  id: 'proset-trailer',
  name: 'Trailer Tow Inspection',
  appliesTo: ['TRAILER_TOW'],
  requirePhotos: true,
  requireSignature: true,
  safeToOperateGate: true,
  headerFields: [
    { id: 'driver', label: 'Driver', auto: true, enabled: true },
    { id: 'truck', label: 'Truck', auto: true, enabled: true },
    { id: 'trailer', label: 'Trailer ID', auto: true, enabled: true },
  ],
  sections: [
    sec('hitch', 'Hitch', [
      ['coupler', 'Coupler secure'],
      ['chains', 'Safety chains attached'],
      ['breakaway', 'Breakaway cable connected'],
    ]),
    sec('tires', 'Tires', [
      ['tires', 'Tires', 'No visible damage, good tread, inflated to appropriate level'],
      ['lugs', 'Wheel lug nuts secure'],
    ]),
    sec('lighting', 'Lighting', [
      ['running', 'Running lights'],
      ['brake', 'Brake lights'],
      ['turn', 'Turn lights'],
    ]),
    sec('brakes', 'Brakes', [
      ['trailerbrakes', 'Trailer brakes functioning', 'If equipped'],
    ]),
    sec('load', 'Load', [
      ['secured', 'Load properly secured'],
      ['shifting', 'No shifting hazards'],
    ]),
  ],
}

export const PROSET: OrgConfig = {
  id: 'proset',
  name: 'ProSet',
  legalName: 'ProSet Field Services',
  initials: 'PS',
  industry: 'Construction / field services',
  blurb: 'Detailed field inspection + separate trailer-tow, required photos, project/jobsite, DOT service log.',
  features: {
    postTrip: true,
    locationTracking: true,
    serviceLog: true,
    trailerTowInspection: true,
    photosRequired: true,
    mechanicCertification: false,
    projectJobsite: true,
    odometer: true,
  },
  pdf: { template: 'proset-report', showLogo: true, retentionNote: true, includePhotos: true, paper: 'A4', brandColor: '#5d2f70' },
  templates: [PROSET_VEHICLE, PROSET_TRAILER],
}

export const SEED_ORGS: OrgConfig[] = [BWN, PROSET]

/* Human-readable labels for the feature toggles (used by the Configurator). */
export const FEATURE_META: { key: keyof OrgFeatures; label: string; help: string }[] = [
  { key: 'postTrip', label: 'Post-trip inspections', help: 'Adds the end-of-day Post-Trip. Turn off for pre-trip-only clients.' },
  { key: 'trailerTowInspection', label: 'Trailer-tow inspection', help: 'Adds a separate trailer-tow inspection. Turn off for clients with no trailers.' },
  { key: 'locationTracking', label: 'Location tracking', help: 'Live GPS map + assignment-based vehicle location.' },
  { key: 'serviceLog', label: 'Service log database', help: 'DOT service-history log (annual, oil, brakes) per vehicle.' },
  { key: 'photosRequired', label: 'Photos required on defect', help: 'A defect requires attached photos before submit.' },
  { key: 'mechanicCertification', label: 'Mechanic certification', help: 'Defects route to a mechanic/repair certification (DVIR).' },
  { key: 'projectJobsite', label: 'Project / Jobsite capture', help: 'Capture the jobsite an inspection was performed at.' },
  { key: 'odometer', label: 'Odometer capture', help: 'Capture odometer reading on the inspection header.' },
]
