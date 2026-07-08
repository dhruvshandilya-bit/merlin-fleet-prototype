import { useState } from 'react'
import { Wallet, Users, Truck, CheckCircle2, Banknote, DollarSign } from 'lucide-react'
import { useStore } from '@/lib/store'
import {
  Card, Table, Th, Td, Tr, Button, Badge, Drawer, KV, Metric, MetricRow, InfoTip,
  SectionTitle, EmptyState,
} from '@/components/ui'
import { settlementStatusTone, settlementStatusLabel } from '@/lib/status'
import { currency, formatDate } from '@/lib/utils'
import type { DriverSettlement } from '@/lib/types'
import { PageHead } from '@/features/vehicles/VehiclesScreen'

type Mode = 'driver' | 'carrier'

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('')
}

export function SettlementsScreen() {
  const { driverSettlements, carrierSettlements, approveSettlement, paySettlement } = useStore()
  const [mode, setMode] = useState<Mode>('driver')
  const [selected, setSelected] = useState<string | null>(null)

  const driverGross = driverSettlements.reduce((s, x) => s + x.gross, 0)
  const driverNet = driverSettlements.reduce((s, x) => s + x.net, 0)
  const driverDrafts = driverSettlements.filter((s) => s.status === 'DRAFT').length
  const driverApproved = driverSettlements.filter((s) => s.status === 'APPROVED').length

  const carrierTotal = carrierSettlements.reduce((s, x) => s + x.amount, 0)
  const carrierDrafts = carrierSettlements.filter((s) => s.status === 'DRAFT').length
  const carrierApproved = carrierSettlements.filter((s) => s.status === 'APPROVED').length

  const openStatement: DriverSettlement | null =
    driverSettlements.find((s) => s.id === selected) ?? null

  return (
    <div className="space-y-4">
      <PageHead
        title="Settlements"
        sub="Driver payroll & carrier pay · Pay period Jul 1–7, 2026"
        action={
          <div className="inline-flex rounded-lg border border-stroke-soft-200 bg-bg-white-0 p-0.5">
            {(['driver', 'carrier'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${mode === m ? 'bg-secondary text-primary' : 'text-text-sub-600 hover:text-text-strong-950'}`}
              >
                {m === 'driver' ? <><Users size={14} />Driver Payroll</> : <><Truck size={14} />Carrier Pay</>}
              </button>
            ))}
          </div>
        }
      />

      {mode === 'driver' ? (
        <>
          <MetricRow cols={5}>
            <Metric label="Pay Period" value="Jul 1–7" />
            <Metric label="Total Gross" value={currency(driverGross)} info="Sum of per-load pay before deductions." />
            <Metric label="Total Net" tone="green" value={currency(driverNet)} info="Take-home after deductions + reimbursements." />
            <Metric label="Drafts" value={driverDrafts} />
            <Metric label="Approved" value={driverApproved} />
          </MetricRow>

          <Card>
            <Table>
              <thead>
                <tr>
                  <Th>Statement #</Th><Th>Driver</Th><Th>Period</Th><Th>Loads</Th>
                  <Th className="text-right">Gross</Th><Th className="text-right">Deductions</Th>
                  <Th className="text-right">Net</Th><Th>Status</Th><Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {driverSettlements.map((s) => (
                  <Tr key={s.id} onClick={() => setSelected(s.id)}>
                    <Td className="font-semibold">{s.id}</Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-500 text-[12px] font-semibold text-white">{initials(s.driverName)}</span>
                        <span className="font-medium">{s.driverName}</span>
                      </div>
                    </Td>
                    <Td className="text-text-sub-600">{formatDate(s.periodStart)}–{formatDate(s.periodEnd)}</Td>
                    <Td>{s.lines.length}</Td>
                    <Td className="text-right tabular-nums">{currency(s.gross)}</Td>
                    <Td className={`text-right tabular-nums ${s.deductions > 0 ? 'text-state-error-base' : ''}`}>{currency(s.deductions)}</Td>
                    <Td className="text-right font-semibold tabular-nums">{currency(s.net)}</Td>
                    <Td><Badge tone={settlementStatusTone[s.status]}>{settlementStatusLabel[s.status]}</Badge></Td>
                    <Td className="text-right">
                      {s.status === 'DRAFT' && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); approveSettlement(s.id) }}><CheckCircle2 size={14} />Approve</Button>
                      )}
                      {s.status === 'APPROVED' && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); paySettlement(s.id) }}><Banknote size={14} />Pay</Button>
                      )}
                      {s.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1 text-[12px] text-text-soft-400"><CheckCircle2 size={13} />Paid</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      ) : (
        <>
          <MetricRow cols={3}>
            <Metric label="Total Payable" value={currency(carrierTotal)} info="Owed to outside carriers for brokered loads." />
            <Metric label="Drafts" value={carrierDrafts} />
            <Metric label="Approved" value={carrierApproved} />
          </MetricRow>

          <Card>
            <Table>
              <thead>
                <tr>
                  <Th>Settlement #</Th><Th>Carrier</Th><Th>Loads</Th>
                  <Th className="text-right">Amount</Th><Th>Due</Th><Th>Status</Th><Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {carrierSettlements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="border-b border-stroke-soft-200 px-3 py-2.5 text-center text-text-sub-600">No carrier settlements this period.</td>
                  </tr>
                )}
                {carrierSettlements.map((s) => (
                  <Tr key={s.id}>
                    <Td className="font-semibold">{s.id}</Td>
                    <Td>
                      <div className="font-medium">{s.carrier}</div>
                      <div className="text-[11px] text-text-soft-400">MC# {s.mcNumber}</div>
                    </Td>
                    <Td className="text-text-sub-600">{s.loadNumbers.join(', ')}</Td>
                    <Td className="text-right font-semibold tabular-nums">{currency(s.amount)}</Td>
                    <Td className="text-text-sub-600">{formatDate(s.dueDate)}</Td>
                    <Td><Badge tone={settlementStatusTone[s.status]}>{settlementStatusLabel[s.status]}</Badge></Td>
                    <Td className="text-right">
                      {s.status === 'DRAFT' && (
                        <Button size="sm" onClick={() => approveSettlement(s.id)}><CheckCircle2 size={14} />Approve</Button>
                      )}
                      {s.status === 'APPROVED' && (
                        <Button size="sm" onClick={() => paySettlement(s.id)}><Banknote size={14} />Pay</Button>
                      )}
                      {s.status === 'PAID' && (
                        <span className="inline-flex items-center gap-1 text-[12px] text-text-soft-400"><CheckCircle2 size={13} />Paid</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      <Drawer
        open={!!openStatement}
        onClose={() => setSelected(null)}
        title={openStatement && <span className="flex items-center gap-2"><Wallet size={18} className="text-primary" />Statement {openStatement.id}</span>}
        subtitle={openStatement && `${openStatement.driverName} · ${formatDate(openStatement.periodStart)}–${formatDate(openStatement.periodEnd)}`}
        footer={openStatement && <StatementFooter id={openStatement.id} />}
      >
        {openStatement && (
          <div className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone={settlementStatusTone[openStatement.status]}>{settlementStatusLabel[openStatement.status]}</Badge>
              <span className="text-[12px] text-text-sub-600">{openStatement.lines.length} loads</span>
            </div>

            <SectionTitle>Load Pay</SectionTitle>
            <div className="overflow-hidden rounded-lg border border-stroke-soft-200">
              <Table>
                <thead>
                  <tr>
                    <Th>Load #</Th><Th>Lane</Th><Th className="text-right">Miles</Th>
                    <Th className="text-right">
                      <span className="inline-flex items-center gap-1">Rate<InfoTip content="Driver pay = miles × per-loaded-mile rate." /></span>
                    </Th>
                    <Th className="text-right">Pay</Th>
                  </tr>
                </thead>
                <tbody>
                  {openStatement.lines.map((l) => (
                    <Tr key={l.loadNumber}>
                      <Td className="font-medium">{l.loadNumber}</Td>
                      <Td className="text-text-sub-600">{l.lane}</Td>
                      <Td className="text-right tabular-nums">{l.miles.toLocaleString('en-US')}</Td>
                      <Td className="text-right tabular-nums">{`$${l.rate.toFixed(2)}/mi`}</Td>
                      <Td className="text-right tabular-nums">{currency(l.pay)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="mt-4 space-y-2 rounded-lg border border-stroke-soft-200 bg-bg-weak-50 p-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-text-sub-600">Gross</span>
                <span className="font-medium tabular-nums text-text-strong-950">{currency(openStatement.gross)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-text-sub-600">Deductions</span>
                <span className="font-medium tabular-nums text-state-error-base">-{currency(openStatement.deductions)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-text-sub-600">Reimbursements</span>
                <span className="font-medium tabular-nums text-text-strong-950">{currency(openStatement.reimbursements)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-stroke-soft-200 pt-2 text-sm">
                <span className="font-semibold text-text-strong-950">Net</span>
                <span className="font-semibold tabular-nums text-text-strong-950">{currency(openStatement.net)}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function StatementFooter({ id }: { id: string }) {
  const { driverSettlements, approveSettlement, paySettlement } = useStore()
  const s = driverSettlements.find((x) => x.id === id)
  if (!s) return null
  return (
    <div className="flex items-center justify-between">
      <div className="text-[12px] text-text-sub-600">Net pay {currency(s.net)} · <span className="font-medium text-text-strong-950">{settlementStatusLabel[s.status]}</span></div>
      <div className="flex gap-2">
        {s.status === 'DRAFT' && <Button size="sm" onClick={() => approveSettlement(s.id)}><CheckCircle2 size={14} />Approve</Button>}
        {s.status === 'APPROVED' && <Button size="sm" onClick={() => paySettlement(s.id)}><Banknote size={14} />Pay Driver</Button>}
        {s.status === 'PAID' && <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-state-success-base"><DollarSign size={14} />Paid in full</span>}
      </div>
    </div>
  )
}
