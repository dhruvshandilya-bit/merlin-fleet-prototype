import { useState } from 'react'
import { Building2, SlidersHorizontal, ListChecks, Eye, Check, Plus, ChevronRight, ArrowUp, ArrowDown, Trash2, UserPlus } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Card, CardHeader, Badge, Button, InfoTip, Modal, Field, Input } from '@/components/ui'
import { PageHead } from '@/features/vehicles/VehiclesScreen'
import {
  STANDARD_LIBRARY, makeStandardOrg, FEATURE_META, templateItemCount, inspectionTypeLabel,
  type OrgFeatures, type InspectionTemplate, type OrgConfig,
} from '@/lib/orgConfig'

export function SettingsScreen() {
  const { orgs, org, orgId, setOrgId, updateOrg, addOrg } = useStore()
  const [newOpen, setNewOpen] = useState(false)
  const [nf, setNf] = useState({ name: '', initials: '', industry: '' })
  const createClient = () => {
    if (!nf.name.trim()) return
    addOrg(makeStandardOrg({ name: nf.name.trim(), initials: (nf.initials || nf.name).trim(), industry: nf.industry.trim() || 'Fleet' }))
    setNf({ name: '', initials: '', industry: '' }); setNewOpen(false)
  }

  const addStandardSection = (tid: string, sid: string) => updateOrg(orgId, (o) => ({
    ...o,
    templates: o.templates.map((t) => {
      if (t.id !== tid || t.sections.some((s) => s.id === sid)) return t
      const lib = STANDARD_LIBRARY.find((s) => s.id === sid)
      return lib ? { ...t, sections: [...t.sections, { ...lib, enabled: true }] } : t
    }),
  }))

  const toggleFeature = (key: keyof OrgFeatures) =>
    updateOrg(orgId, (o) => ({ ...o, features: { ...o.features, [key]: !o.features[key] } }))

  const toggleSection = (tid: string, sid: string) =>
    updateOrg(orgId, (o) => ({
      ...o,
      templates: o.templates.map((t) => t.id === tid
        ? { ...t, sections: t.sections.map((s) => s.id === sid ? { ...s, enabled: !s.enabled } : s) }
        : t),
    }))

  const toggleHeader = (tid: string, fid: string) =>
    updateOrg(orgId, (o) => ({
      ...o,
      templates: o.templates.map((t) => t.id === tid
        ? { ...t, headerFields: t.headerFields.map((f) => f.id === fid ? { ...f, enabled: !f.enabled } : f) }
        : t),
    }))

  const togglePhotos = (tid: string) =>
    updateOrg(orgId, (o) => ({
      ...o,
      templates: o.templates.map((t) => t.id === tid ? { ...t, requirePhotos: !t.requirePhotos } : t),
    }))

  const toggleHeaderRequired = (tid: string, fid: string) =>
    updateOrg(orgId, (o) => ({
      ...o,
      templates: o.templates.map((t) => t.id === tid
        ? { ...t, headerFields: t.headerFields.map((f) => f.id === fid ? { ...f, required: !f.required } : f) }
        : t),
    }))

  const mapSection = (o: OrgConfig, tid: string, sid: string, fn: (items: { id: string; label: string; hint?: string }[]) => { id: string; label: string; hint?: string }[]): OrgConfig => ({
    ...o,
    templates: o.templates.map((t) => t.id === tid
      ? { ...t, sections: t.sections.map((s) => s.id === sid ? { ...s, items: fn(s.items) } : s) }
      : t),
  })
  const addItem = (tid: string, sid: string, label: string) => {
    if (!label.trim()) return
    const id = `custom-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`
    updateOrg(orgId, (o) => mapSection(o, tid, sid, (items) => [...items, { id, label: label.trim() }]))
  }
  const removeItem = (tid: string, sid: string, itemId: string) =>
    updateOrg(orgId, (o) => mapSection(o, tid, sid, (items) => items.filter((i) => i.id !== itemId)))
  const moveItem = (tid: string, sid: string, itemId: string, dir: -1 | 1) =>
    updateOrg(orgId, (o) => mapSection(o, tid, sid, (items) => {
      const idx = items.findIndex((i) => i.id === itemId)
      const j = idx + dir
      if (idx < 0 || j < 0 || j >= items.length) return items
      const next = [...items];[next[idx], next[j]] = [next[j], next[idx]]; return next
    }))

  return (
    <div className="space-y-4">
      <PageHead title="Configuration" sub="Tailor the inspection product per client — no code changes" />

      {/* Client selector */}
      <Card>
        <CardHeader title={<span className="flex items-center gap-2"><Building2 size={15} className="text-brand-500" />Client / Organization</span>} subtitle="The whole app — nav, capture, data views — is driven by the selected client."
          action={<Button size="sm" onClick={() => setNewOpen(true)}><UserPlus size={14} />New client</Button>} />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {orgs.map((o) => {
            const active = o.id === orgId
            return (
              <button key={o.id} onClick={() => setOrgId(o.id)}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${active ? 'border-brand-400 bg-state-information-lighter/40' : 'border-stroke-soft-200 hover:bg-bg-weak-50'}`}>
                <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg text-[13px] font-semibold ${active ? 'bg-brand-500 text-white' : 'bg-bg-weak-50 text-text-sub-600'}`}>{o.initials}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-text-strong-950">{o.name}</span>
                    {active && <Badge tone="green"><Check size={11} />Active</Badge>}
                  </div>
                  <p className="text-[11.5px] text-text-soft-400">{o.industry}</p>
                  <p className="mt-1 text-[12px] text-text-sub-600">{o.blurb}</p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Feature toggles */}
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><SlidersHorizontal size={15} className="text-brand-500" />Features</span>} subtitle={`${org.name} — turn capabilities on or off`} />
          <div className="divide-y divide-border">
            {FEATURE_META.map((f) => {
              const on = org.features[f.key]
              return (
                <div key={f.key} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-[13px] font-medium text-text-strong-950">{f.label}<InfoTip content={f.help} /></p>
                    <p className="text-[11.5px] text-text-soft-400">{f.help}</p>
                  </div>
                  <Toggle on={on} onClick={() => toggleFeature(f.key)} />
                </div>
              )
            })}
          </div>
        </Card>

        {/* Live preview */}
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Eye size={15} className="text-brand-500" />What the driver sees</span>} subtitle="Live preview of the active configuration" />
          <div className="space-y-3 p-4">
            {org.templates.map((t) => (
              <div key={t.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-text-strong-950">{t.name}</p>
                  <Badge tone="slate">{templateItemCount(t)} checks</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {t.appliesTo.map((ty) => <Badge key={ty} tone="blue">{inspectionTypeLabel[ty]}</Badge>)}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.sections.filter((s) => s.enabled).map((s) => (
                    <span key={s.id} className="rounded bg-bg-weak-50 px-2 py-0.5 text-[11px] text-text-sub-600">{s.title}</span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-soft-400">
                  {t.requirePhotos && <span className="flex items-center gap-1"><Check size={11} className="text-emerald-600" />Photos required</span>}
                  {t.requireSignature && <span className="flex items-center gap-1"><Check size={11} className="text-emerald-600" />Signature</span>}
                  {t.safeToOperateGate && <span className="flex items-center gap-1"><Check size={11} className="text-emerald-600" />Safe-to-operate gate</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Template editor (checklist = template + standard library, unified) */}
      <Card>
        <CardHeader title={<span className="flex items-center gap-2"><ListChecks size={15} className="text-brand-500" />Checklist &amp; fields</span>} subtitle="Add standard sections, add custom items, reorder, and set required fields" />
        <div className="space-y-4 p-4">
          {org.templates.map((t) => <TemplateEditor key={t.id} t={t} onSection={toggleSection} onHeader={toggleHeader} onPhotos={togglePhotos} onHeaderRequired={toggleHeaderRequired} onAddItem={addItem} onRemoveItem={removeItem} onMoveItem={moveItem} onAddStandard={addStandardSection} />)}
        </div>
      </Card>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New client" subtitle="Creates a standard vehicle-inspection setup — tune it here after."
        footer={<div className="flex w-full justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setNewOpen(false)}>Cancel</Button><Button size="sm" onClick={createClient}>Create client</Button></div>}>
        <div className="space-y-3">
          <Field label="Client name"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="Acme Contractors" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Initials (badge)"><Input value={nf.initials} onChange={(e) => setNf({ ...nf, initials: e.target.value })} placeholder="AC" maxLength={2} /></Field>
            <Field label="Industry"><Input value={nf.industry} onChange={(e) => setNf({ ...nf, industry: e.target.value })} placeholder="Construction" /></Field>
          </div>
          <p className="rounded-lg bg-state-information-lighter/50 px-3 py-2 text-[12px] text-text-sub-600">Starts with standard sections (Brakes, Lighting, Tires, Cab, Engine, Safety) + trailer-tow, Pre/Post trip, photos & signature. Change anything below.</p>
        </div>
      </Modal>
    </div>
  )
}

function TemplateEditor({ t, onSection, onHeader, onPhotos, onHeaderRequired, onAddItem, onRemoveItem, onMoveItem, onAddStandard }: {
  t: InspectionTemplate
  onSection: (tid: string, sid: string) => void
  onHeader: (tid: string, fid: string) => void
  onPhotos: (tid: string) => void
  onHeaderRequired: (tid: string, fid: string) => void
  onAddItem: (tid: string, sid: string, label: string) => void
  onRemoveItem: (tid: string, sid: string, itemId: string) => void
  onMoveItem: (tid: string, sid: string, itemId: string, dir: -1 | 1) => void
  onAddStandard: (tid: string, sid: string) => void
}) {
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const available = STANDARD_LIBRARY.filter((s) => !t.sections.some((x) => x.id === s.id))
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <p className="text-[13px] font-semibold text-text-strong-950">{t.name}</p>
        <div className="flex items-center gap-2 text-[12px] text-text-sub-600">Photos required<Toggle on={t.requirePhotos} onClick={() => onPhotos(t.id)} /></div>
      </div>
      <div className="p-4">
        {/* header fields */}
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-soft-400">Header fields</p>
        <div className="mb-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {t.headerFields.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-2 rounded-md bg-bg-weak-50 px-2.5 py-1.5">
              <span className="text-[12.5px] text-text-strong-950">{f.label}{f.auto && <span className="ml-1 rounded bg-state-success-lighter px-1 text-[9px] font-semibold text-state-success-base">AUTO</span>}</span>
              <div className="flex items-center gap-2">
                {f.enabled && !f.auto && (
                  <button onClick={() => onHeaderRequired(t.id, f.id)}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${f.required ? 'bg-state-error-lighter text-state-error-base' : 'bg-bg-white-0 text-text-soft-400 border border-stroke-soft-200'}`}>REQ</button>
                )}
                <Toggle on={f.enabled} onClick={() => onHeader(t.id, f.id)} />
              </div>
            </div>
          ))}
        </div>

        {/* sections with item editor */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-soft-400">Sections &amp; items</p>
          {available.length > 0 && (
            <select value="" onChange={(e) => { if (e.target.value) onAddStandard(t.id, e.target.value) }}
              className="h-7 rounded-md border border-stroke-soft-200 bg-bg-white-0 px-2 text-[12px] text-text-sub-600 focus:border-brand-400 focus:outline-none">
              <option value="">+ Add standard section…</option>
              {available.map((s) => <option key={s.id} value={s.id}>{s.title} · {s.items.length}</option>)}
            </select>
          )}
        </div>
        <div className="space-y-1.5">
          {t.sections.map((s) => {
            const expanded = openSection === s.id
            return (
              <div key={s.id} className="rounded-md border border-stroke-soft-200">
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                  <button onClick={() => setOpenSection(expanded ? null : s.id)} className="flex items-center gap-1.5 text-left">
                    <ChevronRight size={13} className={`text-text-soft-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    <span className="text-[12.5px] font-medium text-text-strong-950">{s.title} <span className="text-text-soft-400">· {s.items.length}</span></span>
                  </button>
                  <Toggle on={s.enabled} onClick={() => onSection(t.id, s.id)} />
                </div>
                {expanded && (
                  <div className="border-t border-stroke-soft-200 p-2.5">
                    <div className="space-y-1">
                      {s.items.map((it, idx) => (
                        <div key={it.id} className="flex items-center gap-1.5 rounded bg-bg-weak-50 px-2 py-1">
                          <span className="flex-1 text-[12px] text-text-strong-950">{it.label}</span>
                          <button disabled={idx === 0} onClick={() => onMoveItem(t.id, s.id, it.id, -1)} className="p-0.5 text-text-soft-400 disabled:opacity-30 hover:text-text-strong-950"><ArrowUp size={13} /></button>
                          <button disabled={idx === s.items.length - 1} onClick={() => onMoveItem(t.id, s.id, it.id, 1)} className="p-0.5 text-text-soft-400 disabled:opacity-30 hover:text-text-strong-950"><ArrowDown size={13} /></button>
                          <button onClick={() => onRemoveItem(t.id, s.id, it.id)} className="p-0.5 text-text-soft-400 hover:text-state-error-base"><Trash2 size={13} /></button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <input value={draft[s.id] || ''} onChange={(e) => setDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { onAddItem(t.id, s.id, draft[s.id] || ''); setDraft((d) => ({ ...d, [s.id]: '' })) } }}
                        placeholder="Add a custom item…"
                        className="h-8 flex-1 rounded-md border border-stroke-soft-200 px-2 text-[12px] focus:border-brand-400 focus:outline-none" />
                      <button onClick={() => { onAddItem(t.id, s.id, draft[s.id] || ''); setDraft((d) => ({ ...d, [s.id]: '' })) }}
                        className="flex items-center gap-1 rounded-md bg-brand-500 px-2.5 text-[12px] font-semibold text-white hover:bg-brand-600"><Plus size={12} />Add</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on}
      className={`relative inline-flex h-5 w-9 flex-none items-center rounded-full transition-colors ${on ? 'bg-brand-500' : 'bg-stroke-soft-200'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}
