import { useState } from 'react'
import { Wrench, Plus, Truck, Container, DollarSign, Clock, CheckCircle2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import {
  Card, Table, Th, Td, Tr, Button, Badge, Stat, Modal, Field, Input, Select, Textarea,
  EmptyState,
} from '@/components/ui'
import { PageHead } from '@/features/vehicles/VehiclesScreen'
import { maintStatusTone, maintStatusLabel } from '@/lib/status'
import { currency, formatDate, daysUntil } from '@/lib/utils'
import type { MaintenanceCategory, MaintenanceStatus } from '@/lib/types'

const STATUS_FILTERS: (MaintenanceStatus | 'ALL')[] = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED']
const CATEGORIES: MaintenanceCategory[] = ['Preventive', 'Tires', 'Brakes', 'Engine', 'Electrical', 'DOT Repair', 'Other']

const statusRank: Record<MaintenanceStatus, number> = { OPEN: 0, IN_PROGRESS: 1, COMPLETED: 2 }

interface FormState {
  assetType: 'Truck' | 'Trailer'
  assetId: string
  category: MaintenanceCategory
  vendor: string
  odometer: string
  amount: string
  dateDue: string
  description: string
}

const emptyForm: FormState = {
  assetType: 'Truck',
  assetId: '',
  category: 'Preventive',
  vendor: '',
  odometer: '',
  amount: '',
  dateDue: '',
  description: '',
}

export function MaintenanceScreen() {
  const { maintenance, trucks, trailers, createMaintenance } = useStore()
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'ALL'>('ALL')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  const openCount = maintenance.filter((m) => m.status === 'OPEN').length
  const inProgressCount = maintenance.filter((m) => m.status === 'IN_PROGRESS').length
  const completedCount = maintenance.filter((m) => m.status === 'COMPLETED').length
  const totalCost = maintenance.reduce((sum, m) => sum + m.amount, 0)

  const rows = maintenance
    .filter((m) => statusFilter === 'ALL' || m.status === statusFilter)
    .slice()
    .sort((a, b) => statusRank[a.status] - statusRank[b.status])

  const assetOptions = form.assetType === 'Truck' ? trucks : trailers

  function resetAndClose() {
    setForm(emptyForm)
    setOpen(false)
  }

  function handleCreate() {
    const asset = assetOptions.find((a) => a.id === form.assetId)
    createMaintenance({
      assetType: form.assetType,
      assetId: form.assetId,
      assetLabel: asset ? `${form.assetType} #${asset.unitNumber}` : '',
      category: form.category,
      vendor: form.vendor,
      odometer: form.odometer === '' ? null : Number(form.odometer),
      amount: form.amount === '' ? 0 : Number(form.amount),
      dateDue: form.dateDue || null,
      description: form.description,
      status: 'OPEN',
    })
    resetAndClose()
  }

  return (
    <div className="space-y-4">
      <PageHead
        title="Maintenance"
        count={maintenance.length}
        sub="Work orders & preventive service"
        action={<Button size="sm" onClick={() => setOpen(true)}><Plus size={15} />New Work Order</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open" value={openCount} tone="amber" icon={<Wrench size={16} />} info="Work orders opened but not started." />
        <Stat label="In Progress" value={inProgressCount} tone="blue" icon={<Clock size={16} />} info="Work currently being performed in the shop." />
        <Stat label="Completed" value={completedCount} tone="green" icon={<CheckCircle2 size={16} />} />
        <Stat label="Total Cost" value={currency(totalCost, { compact: true })} icon={<DollarSign size={16} />} info="Sum of all work-order amounts (labor + parts)." />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${statusFilter === s ? 'border-primary bg-secondary text-primary' : 'border-border bg-white text-muted-foreground hover:bg-muted'}`}
          >
            {s === 'ALL' ? 'All' : maintStatusLabel[s]}
          </button>
        ))}
      </div>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>WO #</Th><Th>Asset</Th><Th>Category</Th><Th>Description</Th>
              <Th>Status</Th><Th>Due / Performed</Th><Th>Vendor</Th><Th>Amount</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const overdue = !m.datePerformed && !!m.dateDue && daysUntil(m.dateDue) < 0
              return (
                <Tr key={m.id}>
                  <Td>
                    <div className="font-semibold">{m.poNumber}</div>
                    <div className="text-[11px] text-muted-foreground">{m.category}</div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary">
                        {m.assetType === 'Truck' ? <Truck size={14} /> : <Container size={14} />}
                      </span>
                      <span className="font-medium">{m.assetLabel}</span>
                    </div>
                  </Td>
                  <Td><Badge tone="gray">{m.category}</Badge></Td>
                  <Td><div className="max-w-[220px] truncate text-muted-foreground">{m.description}</div></Td>
                  <Td><Badge tone={maintStatusTone[m.status]}>{maintStatusLabel[m.status]}</Badge></Td>
                  <Td>
                    {m.datePerformed
                      ? <span>Done {formatDate(m.datePerformed)}</span>
                      : m.dateDue
                        ? <span className={overdue ? 'text-red-600' : undefined}>Due {formatDate(m.dateDue)}</span>
                        : <span className="text-muted-foreground">—</span>}
                  </Td>
                  <Td>{m.vendor || <span className="text-muted-foreground">—</span>}</Td>
                  <Td className="tabular-nums">{m.amount === 0 ? <span className="text-muted-foreground">—</span> : currency(m.amount)}</Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
        {rows.length === 0 && <EmptyState icon={<Wrench size={28} />} title="No work orders" hint="Open a maintenance record to track work orders and preventive service." />}
      </Card>

      <Modal
        open={open}
        onClose={resetAndClose}
        title="New Work Order"
        subtitle="Open a maintenance record / work order"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={resetAndClose}>Cancel</Button>
            <Button size="sm" onClick={handleCreate}>Create Work Order</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Asset Type">
            <Select
              value={form.assetType}
              onChange={(e) => setForm((f) => ({ ...f, assetType: e.target.value as 'Truck' | 'Trailer', assetId: '' }))}
            >
              <option value="Truck">Truck</option>
              <option value="Trailer">Trailer</option>
            </Select>
          </Field>
          <Field label="Asset">
            <Select
              value={form.assetId}
              onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))}
            >
              <option value="">Select asset…</option>
              {assetOptions.map((a) => (
                <option key={a.id} value={a.id}>{form.assetType} #{a.unitNumber}</option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as MaintenanceCategory }))}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Vendor">
            <Input value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} placeholder="e.g. TA Truck Service" />
          </Field>
          <Field label="Odometer">
            <Input type="number" value={form.odometer} onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))} placeholder="Miles" />
          </Field>
          <Field label="Amount">
            <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" />
          </Field>
          <Field label="Due Date">
            <Input type="date" value={form.dateDue} onChange={(e) => setForm((f) => ({ ...f, dateDue: e.target.value }))} />
          </Field>
          <div className="col-span-2">
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the work required…" />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  )
}
