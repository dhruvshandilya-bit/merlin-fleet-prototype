import { useState } from 'react'
import {
  FileText, DollarSign, Clock, AlertTriangle, Send, CheckCircle2, Landmark, Package,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import {
  Card, Table, Th, Td, Tr, Button, Badge, Drawer, Tabs, KV, Metric, MetricRow, InfoTip,
  SectionTitle, EmptyState,
} from '@/components/ui'
import { InvoiceStatusBadge } from '@/lib/status'
import { currency, formatDate, daysUntil } from '@/lib/utils'
import type { Invoice, InvoiceStatus } from '@/lib/types'
import { PageHead } from '@/features/vehicles/VehiclesScreen'

const accessorialTotal = (inv: Invoice): number =>
  inv.accessorials.reduce((sum, a) => sum + a.amount, 0)

const isOverdue = (inv: Invoice): boolean =>
  daysUntil(inv.dueDate) < 0 && inv.status !== 'PAID'

const TAB_STATUS: Record<string, InvoiceStatus | null> = {
  ALL: null,
  INCOMPLETE: 'INCOMPLETE',
  RELEASED: 'RELEASED',
  INVOICED: 'INVOICED',
  PAID: 'PAID',
  DISCREPANCY: 'DISCREPANCY',
}

export function InvoicingScreen() {
  const { invoices, releaseInvoice, markInvoicePaid } = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState('ALL')

  const selected = invoices.find((i) => i.id === selectedId) ?? null

  const arOutstanding = invoices
    .filter((i) => i.status !== 'PAID')
    .reduce((s, i) => s + i.amount, 0)
  const overdue = invoices
    .filter((i) => i.status !== 'PAID' && daysUntil(i.dueDate) < 0)
    .reduce((s, i) => s + i.amount, 0)
  const collected = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + i.amount, 0)
  const discrepancies = invoices.filter((i) => i.status === 'DISCREPANCY').length

  const countFor = (key: string): number => {
    const st = TAB_STATUS[key]
    return st === null ? invoices.length : invoices.filter((i) => i.status === st).length
  }

  const filterStatus = TAB_STATUS[tab]
  const rows = invoices.filter((i) => filterStatus === null || i.status === filterStatus)

  const rowLineHaul = rows.reduce((s, i) => s + i.lineHaul, 0)
  const rowAccessorials = rows.reduce((s, i) => s + accessorialTotal(i), 0)
  const rowTotal = rows.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-4">
      <PageHead
        title="Invoicing"
        count={invoices.length}
        sub="Accounts receivable — line-haul, accessorials & aging"
      />

      <MetricRow cols={5}>
        <Metric
          label="AR Outstanding"
          value={currency(arOutstanding)}
          info="Total invoiced value not yet collected."
        />
        <Metric
          label="Overdue"
          value={currency(overdue)}
          tone="red"
          info="Past due date and still unpaid."
        />
        <Metric
          label="Collected (30d)"
          value={currency(collected)}
          tone="green"
          info="Invoices marked paid."
        />
        <Metric
          label="Avg DSO"
          value="28 days"
          info="Days Sales Outstanding — average days to collect an invoice."
        />
        <Metric
          label="Discrepancies"
          value={discrepancies}
          tone="red"
          info="Invoices with a payment/amount dispute to resolve."
        />
      </MetricRow>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'ALL', label: 'All', count: countFor('ALL') },
          { key: 'INCOMPLETE', label: 'Incomplete', count: countFor('INCOMPLETE') },
          { key: 'RELEASED', label: 'Released', count: countFor('RELEASED') },
          { key: 'INVOICED', label: 'Invoiced', count: countFor('INVOICED') },
          { key: 'PAID', label: 'Paid', count: countFor('PAID') },
          { key: 'DISCREPANCY', label: 'Discrepancy', count: countFor('DISCREPANCY') },
        ]}
      />

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Invoice #</Th>
              <Th>Loads</Th>
              <Th className="text-right">Line Haul</Th>
              <Th className="text-right">
                <span className="inline-flex items-center gap-1">
                  Accessorials
                  <InfoTip content="Extra charges beyond line-haul: detention, lumper, fuel surcharge, etc." />
                </span>
              </Th>
              <Th className="text-right">Total</Th>
              <Th>Status</Th>
              <Th>Issued</Th>
              <Th>Due</Th>
              <Th>Factored</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <Tr key={inv.id} onClick={() => setSelectedId(inv.id)}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary"><FileText size={15} /></span>
                    <div>
                      <div className="font-semibold">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-muted-foreground">{inv.customer}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span className="flex items-center gap-1.5 text-[13px]">
                    <Package size={13} className="text-icon-soft-400" />
                    {inv.loadNumbers.join(', ')}
                  </span>
                </Td>
                <Td className="text-right tabular-nums">{currency(inv.lineHaul)}</Td>
                <Td className="text-right tabular-nums">{currency(accessorialTotal(inv))}</Td>
                <Td className="text-right font-semibold tabular-nums">{currency(inv.amount)}</Td>
                <Td><InvoiceStatusBadge status={inv.status} /></Td>
                <Td>{formatDate(inv.issueDate)}</Td>
                <Td>
                  {isOverdue(inv) ? (
                    <span className="inline-flex items-center gap-1 text-state-error-base">
                      <Clock size={12} />{formatDate(inv.dueDate)}
                    </span>
                  ) : (
                    formatDate(inv.dueDate)
                  )}
                </Td>
                <Td>
                  {inv.factored
                    ? <Badge tone="blue"><Landmark size={11} />Factored</Badge>
                    : <span className="text-muted-foreground">—</span>}
                </Td>
              </Tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-bg-weak-50 font-semibold text-text-strong-950">
              <Td className="font-semibold">{rows.length} invoice{rows.length === 1 ? '' : 's'}</Td>
              <Td />
              <Td className="text-right tabular-nums">{currency(rowLineHaul)}</Td>
              <Td className="text-right tabular-nums">{currency(rowAccessorials)}</Td>
              <Td className="text-right tabular-nums">{currency(rowTotal)}</Td>
              <Td />
              <Td />
              <Td />
              <Td />
            </tr>
          </tfoot>
        </Table>
        {rows.length === 0 && (
          <EmptyState icon={<FileText size={28} />} title="No invoices" hint="Invoices matching this filter will appear here." />
        )}
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        width="max-w-2xl"
        title={selected && <span className="flex items-center gap-2"><FileText size={18} className="text-primary" />Invoice {selected.invoiceNumber}</span>}
        subtitle={selected?.customer}
        footer={selected && <InvoiceActions invoice={selected} onRelease={releaseInvoice} onPay={markInvoicePaid} />}
      >
        {selected && (
          <div className="p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <InvoiceStatusBadge status={selected.status} />
              {selected.factored && <Badge tone="blue"><Landmark size={11} />Factored</Badge>}
              {isOverdue(selected) && <Badge tone="red"><Clock size={11} />Overdue {Math.abs(daysUntil(selected.dueDate))}d</Badge>}
            </div>

            <SectionTitle>Details</SectionTitle>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-border p-4 sm:grid-cols-3">
              <KV label="Customer" value={selected.customer} />
              <KV label="Loads" value={selected.loadNumbers.join(', ')} />
              <KV label="Issued" value={formatDate(selected.issueDate)} />
              <KV
                label="Due"
                value={isOverdue(selected)
                  ? <span className="text-state-error-base">{formatDate(selected.dueDate)}</span>
                  : formatDate(selected.dueDate)}
              />
              <KV label="Status" value={<InvoiceStatusBadge status={selected.status} />} />
            </div>

            <div className="mt-5">
              <SectionTitle>
                <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-primary" />Line Items</span>
              </SectionTitle>
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <thead>
                    <tr>
                      <Th>Charge</Th>
                      <Th className="text-right">Amount</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <Tr>
                      <Td>Line Haul</Td>
                      <Td className="text-right tabular-nums">{currency(selected.lineHaul)}</Td>
                    </Tr>
                    {selected.accessorials.map((a, idx) => (
                      <Tr key={`${a.type}-${idx}`}>
                        <Td>{a.type}</Td>
                        <Td className="text-right tabular-nums">{currency(a.amount)}</Td>
                      </Tr>
                    ))}
                    <Tr className="bg-bg-weak-50">
                      <Td className="font-semibold">Total</Td>
                      <Td className="text-right font-semibold tabular-nums">{currency(selected.amount)}</Td>
                    </Tr>
                  </tbody>
                </Table>
              </div>
            </div>

            {selected.status === 'DISCREPANCY' && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-state-error-light bg-state-error-lighter p-3 text-[12px] text-state-error-dark">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>This invoice has a payment or amount dispute. Reconcile the billed total against the customer&apos;s remittance, then resolve to clear it.</span>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

function InvoiceActions({
  invoice, onRelease, onPay,
}: {
  invoice: Invoice
  onRelease: (id: string) => void
  onPay: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-[12px] text-muted-foreground">
        Total {currency(invoice.amount)}
      </div>
      <div className="flex gap-2">
        {(invoice.status === 'INCOMPLETE' || invoice.status === 'RELEASED') && (
          <Button size="sm" onClick={() => onRelease(invoice.id)}><Send size={15} />Release &amp; Send</Button>
        )}
        {invoice.status === 'INVOICED' && (
          <Button size="sm" onClick={() => onPay(invoice.id)}><CheckCircle2 size={15} />Mark Paid</Button>
        )}
        {invoice.status === 'DISCREPANCY' && (
          <Button variant="outline" size="sm" onClick={() => onPay(invoice.id)}><AlertTriangle size={15} />Resolve Discrepancy</Button>
        )}
      </div>
    </div>
  )
}
