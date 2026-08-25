import { useState } from 'react'
import { Wrench, Plus, CalendarClock, DollarSign, ClipboardList } from 'lucide-react'
import { useStore } from '@/lib/store'
import {
  Card, CardHeader, Stat, Table, Th, Td, Tr, Button, Badge, Modal, Field, Input, Select, Textarea, EmptyState,
} from '@/components/ui'
import { PageHead } from '@/features/vehicles/VehiclesScreen'
import { formatDate, daysUntil, currency } from '@/lib/utils'

const SERVICE_TYPES = ['DOT Annual Inspection', 'Oil & Filter', 'Brake Service', 'Tire Replacement', 'Preventive Maintenance', 'Other']

export function ServiceLogScreen() {
  const { org, serviceLogs, trucks, createServiceLog } = useStore()
  const [add, setAdd] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({ serviceType: SERVICE_TYPES[0] })

  const mine = serviceLogs.filter((s) => s.orgId === org.id)
  const totalCost = mine.reduce((a, s) => a + s.cost, 0)
  const dueSoon = mine.filter((s) => s.nextDueDate && daysUntil(s.nextDueDate) <= 60 && daysUntil(s.nextDueDate) >= 0).length

  const submit = () => {
    createServiceLog({
      orgId: org.id, vehicleLabel: form.vehicleLabel || (trucks[0] ? `#${trucks[0].unitNumber}` : '—'),
      serviceType: form.serviceType, date: form.date || '2026-07-30',
      odometer: Number(form.odometer) || 0, vendor: form.vendor || '', cost: Number(form.cost) || 0,
      nextDueDate: form.nextDueDate || null, notes: form.notes || '',
    })
    setForm({ serviceType: SERVICE_TYPES[0] }); setAdd(false)
  }

  return (
    <div className="space-y-4">
      <PageHead
        title="Service Log"
        sub={`${org.name} · DOT service-history database`}
        action={<Button size="sm" onClick={() => setAdd(true)}><Plus size={14} />Add service record</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Service records" value={mine.length} icon={<ClipboardList size={18} className="text-brand-500" />} />
        <Stat label="Due within 60 days" value={dueSoon} tone="amber" icon={<CalendarClock size={18} className="text-amber-500" />} info="Records with an upcoming next-due date." />
        <Stat label="Lifetime cost" value={currency(totalCost)} icon={<DollarSign size={18} className="text-emerald-500" />} />
      </div>

      <Card>
        <CardHeader title="Service history" subtitle="Maintenance & DOT service records per vehicle" />
        <Table>
          <thead>
            <tr>
              <Th>ID</Th><Th>Vehicle</Th><Th>Service</Th><Th>Date</Th><Th>Odometer</Th><Th>Vendor</Th><Th>Cost</Th><Th>Next Due</Th>
            </tr>
          </thead>
          <tbody>
            {mine.map((s) => {
              const soon = s.nextDueDate && daysUntil(s.nextDueDate) <= 60
              return (
                <Tr key={s.id}>
                  <Td className="font-medium">{s.id}</Td>
                  <Td>{s.vehicleLabel}</Td>
                  <Td><Badge tone={s.serviceType.startsWith('DOT') ? 'purple' : 'slate'}>{s.serviceType}</Badge></Td>
                  <Td>{formatDate(s.date)}</Td>
                  <Td className="tabular-nums">{s.odometer.toLocaleString()}</Td>
                  <Td className="text-muted-foreground">{s.vendor}</Td>
                  <Td className="tabular-nums">{currency(s.cost)}</Td>
                  <Td>{s.nextDueDate ? <span className={soon ? 'font-medium text-amber-600' : 'text-muted-foreground'}>{formatDate(s.nextDueDate)}</span> : s.nextDueOdometer ? <span className="text-muted-foreground">{s.nextDueOdometer.toLocaleString()} mi</span> : '—'}</Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
        {mine.length === 0 && <EmptyState icon={<Wrench size={28} />} title="No service records" hint="Add the first DOT service record for this fleet." />}
      </Card>

      <Modal open={add} onClose={() => setAdd(false)} title="Add service record" subtitle="Log a DOT / maintenance service"
        footer={<div className="flex w-full justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setAdd(false)}>Cancel</Button><Button size="sm" onClick={submit}>Save record</Button></div>}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vehicle">
            <Select value={form.vehicleLabel || ''} onChange={(e) => setForm({ ...form, vehicleLabel: e.target.value })}>
              <option value="">Select vehicle…</option>
              {trucks.map((t) => <option key={t.id} value={`#${t.unitNumber}`}>#{t.unitNumber} · {t.make} {t.model}</option>)}
            </Select>
          </Field>
          <Field label="Service type">
            <Select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
              {SERVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Date"><Input type="date" value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Odometer"><Input type="number" placeholder="74210" value={form.odometer || ''} onChange={(e) => setForm({ ...form, odometer: e.target.value })} /></Field>
          <Field label="Vendor"><Input placeholder="FleetPro Service" value={form.vendor || ''} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></Field>
          <Field label="Cost ($)"><Input type="number" placeholder="240" value={form.cost || ''} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
          <Field label="Next due date"><Input type="date" value={form.nextDueDate || ''} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} /></Field>
          <div className="col-span-2"><Field label="Notes"><Textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
        </div>
      </Modal>
    </div>
  )
}
