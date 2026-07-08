import { Badge, Dot, type BadgeTone } from '@/components/ui'
import type {
  AssetStatus, DriverStatus, LoadStatus, LoadFlag, MaintenanceStatus,
  InvoiceStatus, SettlementStatus, FactoringStatus,
} from './types'
import { expiryStatus, daysUntil } from './utils'

export const assetStatusTone: Record<AssetStatus, BadgeTone> = {
  ACTIVE: 'green', IDLE: 'slate', IN_MAINTENANCE: 'amber', OUT_OF_SERVICE: 'red',
}
export const assetStatusLabel: Record<AssetStatus, string> = {
  ACTIVE: 'Active', IDLE: 'Idle', IN_MAINTENANCE: 'In Maintenance', OUT_OF_SERVICE: 'Out of Service',
}
export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return <Badge tone={assetStatusTone[status]}><Dot tone={assetStatusTone[status]} />{assetStatusLabel[status]}</Badge>
}

export const driverStatusTone: Record<DriverStatus, BadgeTone> = {
  AVAILABLE: 'green', ON_DUTY: 'blue', DRIVING: 'purple', OFF_DUTY: 'slate', SLEEPER: 'slate',
}
export const driverStatusLabel: Record<DriverStatus, string> = {
  AVAILABLE: 'Available', ON_DUTY: 'On Duty', DRIVING: 'Driving', OFF_DUTY: 'Off Duty', SLEEPER: 'Sleeper',
}
export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  return <Badge tone={driverStatusTone[status]}><Dot tone={driverStatusTone[status]} />{driverStatusLabel[status]}</Badge>
}

export const loadStatusTone: Record<LoadStatus, BadgeTone> = {
  NOT_COVERED: 'slate', DISPATCHED: 'purple', IN_TRANSIT: 'blue', DELIVERED: 'green',
}
export const loadStatusLabel: Record<LoadStatus, string> = {
  NOT_COVERED: 'Not Covered', DISPATCHED: 'Dispatched', IN_TRANSIT: 'In Transit', DELIVERED: 'Delivered',
}
export function LoadStatusBadge({ status }: { status: LoadStatus }) {
  return <Badge tone={loadStatusTone[status]}>{loadStatusLabel[status]}</Badge>
}

export const flagTone: Record<LoadFlag, BadgeTone> = {
  NONE: 'gray', CAUTION: 'amber', IMPORTANT: 'amber', CRITICAL: 'red', RUNNING_LATE: 'red', TEMP_DISCREPANCY: 'red',
}
export const flagLabel: Record<LoadFlag, string> = {
  NONE: 'On Track', CAUTION: 'Caution', IMPORTANT: 'Important', CRITICAL: 'Critical', RUNNING_LATE: 'Running Late', TEMP_DISCREPANCY: 'Temp Discrepancy',
}

export const maintStatusTone: Record<MaintenanceStatus, BadgeTone> = {
  OPEN: 'amber', IN_PROGRESS: 'blue', COMPLETED: 'green',
}
export const maintStatusLabel: Record<MaintenanceStatus, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed',
}

export const invoiceStatusTone: Record<InvoiceStatus, BadgeTone> = {
  INCOMPLETE: 'slate', RELEASED: 'purple', INVOICED: 'blue', PAID: 'green', DISCREPANCY: 'red',
}
export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  INCOMPLETE: 'Incomplete', RELEASED: 'Released', INVOICED: 'Invoiced', PAID: 'Paid', DISCREPANCY: 'Discrepancy',
}
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={invoiceStatusTone[status]}>{invoiceStatusLabel[status]}</Badge>
}

export const settlementStatusTone: Record<SettlementStatus, BadgeTone> = {
  DRAFT: 'slate', APPROVED: 'blue', PAID: 'green',
}
export const settlementStatusLabel: Record<SettlementStatus, string> = {
  DRAFT: 'Draft', APPROVED: 'Approved', PAID: 'Paid',
}

export const factoringStatusTone: Record<FactoringStatus, BadgeTone> = {
  QUEUED: 'slate', SUBMITTED: 'amber', ADVANCED: 'blue', SETTLED: 'green',
}
export const factoringStatusLabel: Record<FactoringStatus, string> = {
  QUEUED: 'Queued', SUBMITTED: 'Submitted', ADVANCED: 'Advanced', SETTLED: 'Settled',
}

export function ExpiryBadge({ iso, label }: { iso?: string | null; label?: string }) {
  const s = expiryStatus(iso)
  const tone: BadgeTone = s === 'expired' ? 'red' : s === 'soon' ? 'amber' : 'green'
  const d = iso ? daysUntil(iso) : null
  const text = !iso ? '—' : s === 'expired' ? `Expired ${Math.abs(d!)}d` : s === 'soon' ? `${d}d left` : 'Valid'
  return <Badge tone={tone}>{label ? `${label}: ` : ''}{text}</Badge>
}
