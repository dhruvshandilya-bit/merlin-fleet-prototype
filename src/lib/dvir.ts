/* DVIR helpers: pair a vehicle's Pre-Trip + Post-Trip into a daily sheet, and
   derive defect / out-of-service state that the web dashboards read from. */
import type { InspectionRecord } from './inspectionData'

export interface DailySheet {
  orgId: string
  vehicleLabel: string
  date: string
  pre?: InspectionRecord
  post?: InspectionRecord
  trailer?: InspectionRecord
}

const dayOf = (iso: string) => iso.slice(0, 10)

export function dailySheetFor(records: InspectionRecord[], rec: InspectionRecord): DailySheet {
  const date = dayOf(rec.dateTime)
  const sameDay = records.filter((r) => r.orgId === rec.orgId && r.vehicleLabel === rec.vehicleLabel && dayOf(r.dateTime) === date)
  return {
    orgId: rec.orgId, vehicleLabel: rec.vehicleLabel, date,
    pre: sameDay.find((r) => r.type === 'PRE_TRIP'),
    post: sameDay.find((r) => r.type === 'POST_TRIP'),
    trailer: sameDay.find((r) => r.type === 'TRAILER_TOW'),
  }
}

/** All open defects (failed items on records that aren't certified closed). */
export interface DefectItem {
  recordId: string
  orgId: string
  vehicleLabel: string
  driverName: string
  dateTime: string
  itemLabel: string
  note?: string
  sectionId: string
  safeToDrive?: boolean
  certified: boolean
}

export function openDefects(records: InspectionRecord[]): DefectItem[] {
  const out: DefectItem[] = []
  for (const r of records) {
    const certified = r.mechanic?.status === 'CERTIFIED'
    for (const item of r.results) {
      if (item.status === 'FAIL') {
        out.push({
          recordId: r.id, orgId: r.orgId, vehicleLabel: r.vehicleLabel, driverName: r.driverName,
          dateTime: r.dateTime, itemLabel: item.label, note: item.note, sectionId: item.sectionId,
          safeToDrive: r.safeToDrive, certified,
        })
      }
    }
  }
  return out
}

/** Vehicles currently flagged out-of-service (unsafe, uncertified defect). */
export function outOfServiceVehicles(records: InspectionRecord[]): string[] {
  const set = new Set<string>()
  for (const r of records) {
    if (!r.safeToOperate && r.mechanic?.status !== 'CERTIFIED') set.add(r.vehicleLabel)
  }
  return [...set]
}

/** Pre/Post completion for "today" (the latest day present in the data). */
export interface DriverCompliance {
  vehicleLabel: string
  driverName: string
  pre: boolean
  post: boolean
  hasDefect: boolean
}

export function driverComplianceForDay(records: InspectionRecord[], day: string): DriverCompliance[] {
  const rows = new Map<string, DriverCompliance>()
  for (const r of records) {
    if (dayOf(r.dateTime) !== day) continue
    const key = r.vehicleLabel
    const row = rows.get(key) || { vehicleLabel: r.vehicleLabel, driverName: r.driverName, pre: false, post: false, hasDefect: false }
    if (r.type === 'PRE_TRIP' || r.type === 'TRAILER_TOW') row.pre = true
    if (r.type === 'POST_TRIP') row.post = true
    if (r.defectCount > 0) row.hasDefect = true
    rows.set(key, row)
  }
  return [...rows.values()]
}

export function latestDay(records: InspectionRecord[]): string {
  return records.reduce((max, r) => (dayOf(r.dateTime) > max ? dayOf(r.dateTime) : max), '2000-01-01')
}
