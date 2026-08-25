import { Printer, X, Camera } from 'lucide-react'
import { useStore } from '@/lib/store'
import { templateFor, type OrgConfig, type PdfConfig } from '@/lib/orgConfig'
import { dailySheetFor } from '@/lib/dvir'
import type { InspectionRecord, ItemStatus } from '@/lib/inspectionData'

/* Print-ready inspection sheet (browser "Save as PDF"). BWN renders the daily
   two-column Pre/Post safety sheet; ProSet renders a sectioned report. Both are
   generated from the same record data — the client only changes the layout. */

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '')
const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '')
const box = (on?: boolean) => (on ? '☑' : '☐')

export function InspectionSheetOverlay({ record, onClose }: { record: InspectionRecord; onClose: () => void }) {
  const { org } = useStore()

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-neutral-700/50">
      <div className="no-print flex items-center justify-between border-b border-neutral-700 bg-neutral-900 px-4 py-2.5 text-white">
        <span className="text-[13px] font-medium">Inspection sheet · {record.vehicleLabel} · use “Save as PDF” in the print dialog</span>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-1.5 text-[13px] font-semibold hover:bg-brand-600"><Printer size={14} />Print / Save as PDF</button>
          <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-600 px-3 py-1.5 text-[13px]"><X size={14} />Close</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div id="dvir-print" className="mx-auto max-w-[820px] bg-white p-8 text-black shadow-xl">
          {org.pdf.template === 'bwn-daily'
            ? <BwnSheet record={record} org={org} cfg={org.pdf} />
            : <ProsetSheet record={record} org={org} cfg={org.pdf} />}
        </div>
      </div>
    </div>
  )
}

/* ============================ BWN daily sheet ============================ */
function BwnSheet({ record, org, cfg }: { record: InspectionRecord; org: OrgConfig; cfg: PdfConfig }) {
  const { inspections } = useStore()
  const pair = dailySheetFor(inspections, record)
  const pre = pair.pre, post = pair.post
  const tpl = templateFor(org, 'PRE_TRIP')
  const items = (tpl?.sections.flatMap((s) => s.items) ?? []).slice(0, 12)

  const statusOf = (rec: InspectionRecord | undefined, id: string): ItemStatus | undefined => rec?.results.find((r) => r.itemId === id)?.status
  const noteOf = (rec: InspectionRecord | undefined, id: string) => rec?.results.find((r) => r.itemId === id)?.note

  const anyMechanic = pre?.mechanic || post?.mechanic
  const safe = pre?.safeToOperate ?? post?.safeToOperate ?? true
  const remarks = [pre?.remarks, post?.remarks].filter(Boolean).join(' · ')

  return (
    <div className="text-[11px] leading-tight">
      {/* header */}
      <div className="mb-3 flex items-center justify-center gap-3">
        {cfg.showLogo && (cfg.logoDataUrl
          ? <img src={cfg.logoDataUrl} alt="logo" className="h-11 w-11 object-contain" />
          : <div className="flex h-11 w-11 items-center justify-center rounded bg-gradient-to-br from-blue-700 to-red-600 text-[13px] font-black text-white" style={{ clipPath: 'polygon(50% 0,100% 20%,100% 70%,50% 100%,0 70%,0 20%)' }}>BW</div>)}
        <h1 className="font-serif text-[22px]">Vehicle safety inspection sheet (Daily)</h1>
      </div>

      <table className="w-full border-collapse border border-black">
        <thead>
          <tr>
            <th className="border border-black bg-neutral-100 py-1.5 text-center text-[15px] font-semibold" colSpan={4}>Pre-Trip</th>
            <th className="border border-black bg-neutral-100 py-1.5 text-center text-[15px] font-semibold" colSpan={4}>Post-Trip</th>
          </tr>
        </thead>
        <tbody>
          {/* field rows */}
          <FieldRow l="Carrier Name" lv={org.legalName} r="Date" rv={fmtDate(pair.date + 'T00:00')} />
          <FieldRow l="Driver Name" lv={pre?.driverName} r="Truck/Unit #" rv={record.vehicleLabel} />
          <FieldRow l="Trailer #" lv={pre?.trailerLabel} r="Odometer" rv={post?.odometer?.toLocaleString() ?? pre?.odometer?.toLocaleString()} />
          <FieldRow l="Start Location" lv={pre?.location} r="End Location" rv={post?.location} />
          <FieldRow l="Time Out" lv={fmtTime(pre?.dateTime)} r="Time In" rv={fmtTime(post?.dateTime)} />

          {/* item header */}
          <tr className="text-[10px] font-semibold">
            <td className="border border-black px-1 py-1">Inspection Item</td><td className="border border-black px-1 text-center">OK</td><td className="border border-black px-1 text-center">Defect</td><td className="border border-black px-1">Comments</td>
            <td className="border border-black px-1 py-1">Inspection Item</td><td className="border border-black px-1 text-center">OK</td><td className="border border-black px-1 text-center">Defect</td><td className="border border-black px-1">Comments</td>
          </tr>
          {items.map((it) => {
            const ps = statusOf(pre, it.id), qs = statusOf(post, it.id)
            return (
              <tr key={it.id}>
                <td className="border border-black px-1 py-1">{it.label}</td>
                <td className="border border-black text-center">{box(ps === 'PASS')}</td>
                <td className="border border-black text-center">{box(ps === 'FAIL')}</td>
                <td className="border border-black px-1 text-[9.5px] text-red-700">{noteOf(pre, it.id)}</td>
                <td className="border border-black px-1 py-1">{it.label}</td>
                <td className="border border-black text-center">{box(qs === 'PASS')}</td>
                <td className="border border-black text-center">{box(qs === 'FAIL')}</td>
                <td className="border border-black px-1 text-[9.5px] text-red-700">{noteOf(post, it.id)}</td>
              </tr>
            )
          })}

          {/* bottom block */}
          <tr>
            <td className="border border-black p-2 align-top" colSpan={4}>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-2 font-semibold">Driver Signature</td><td className="border-b border-black">{pre?.signedBy ? `— ${pre.signedBy}` : ''}</td><td className="pl-2">Date</td><td className="border-b border-black pl-1">{fmtDate(pre?.dateTime)}</td></tr>
                  <tr><td className="py-2 font-semibold">Mechanic/Repair Certification</td><td className="border-b border-black">{anyMechanic?.status === 'CERTIFIED' ? `— ${anyMechanic.by ?? ''}` : ''}</td><td className="pl-2">Date</td><td className="border-b border-black pl-1">{fmtDate(anyMechanic?.date)}</td></tr>
                  <tr><td className="py-2 font-semibold">Vehicle Safe to Operate?</td><td>{box(safe)} Yes&nbsp;&nbsp;{box(!safe)} No</td><td /><td /></tr>
                </tbody>
              </table>
            </td>
            <td className="border border-black p-2 align-top" colSpan={4}>
              <div className="mb-1 text-[10px] font-semibold italic">Driver Remarks/Defects Noted:</div>
              <div className="min-h-[120px] text-[10px]">{remarks}</div>
            </td>
          </tr>
        </tbody>
      </table>
      {cfg.retentionNote && <p className="mt-2 text-[8.5px] italic text-neutral-600">Retention Note: Motor carriers must retain completed DVIRs for at least 3 months as required by 49 CFR 396.11(c)(2).</p>}
    </div>
  )
}

function FieldRow({ l, lv, r, rv }: { l: string; lv?: string | null; r: string; rv?: string | null }) {
  return (
    <tr>
      <td className="border border-black px-1 py-1 align-top text-[10px] font-semibold" colSpan={1}>{l}</td>
      <td className="border border-black px-1 py-1 align-middle" colSpan={3}>{lv || ''}</td>
      <td className="border border-black px-1 py-1 align-top text-[10px] font-semibold" colSpan={1}>{r}</td>
      <td className="border border-black px-1 py-1 align-middle" colSpan={3}>{rv || ''}</td>
    </tr>
  )
}

/* ============================ ProSet report ============================ */
function ProsetSheet({ record, org, cfg }: { record: InspectionRecord; org: OrgConfig; cfg: PdfConfig }) {
  const tpl = templateFor(org, record.type)
  const titleOf: Record<string, string> = Object.fromEntries((tpl?.sections ?? []).map((s) => [s.id, s.title]))
  const bySection = record.results.reduce<Record<string, typeof record.results>>((acc, r) => { (acc[r.sectionId] ||= []).push(r); return acc }, {})
  const isTrailer = record.type === 'TRAILER_TOW'

  return (
    <div className="text-[11px] leading-snug">
      <div className="mb-4 flex items-center justify-between border-b-2 pb-3" style={{ borderColor: cfg.brandColor || '#5d2f70' }}>
        <div className="flex items-center gap-3">
          {cfg.showLogo && (cfg.logoDataUrl
            ? <img src={cfg.logoDataUrl} alt="logo" className="h-11 w-11 object-contain" />
            : <div className="flex h-11 w-11 items-center justify-center rounded-lg text-[15px] font-black text-white" style={{ background: cfg.brandColor || '#5d2f70' }}>PS</div>)}
          <div>
            <h1 className="text-[19px] font-bold">{isTrailer ? 'Trailer Tow Inspection' : 'Vehicle Inspection Report'}</h1>
            <p className="text-[11px] text-neutral-600">{org.legalName}</p>
          </div>
        </div>
        <div className="text-right text-[10px] text-neutral-600">
          <p className="font-semibold text-black">{record.id}</p>
          <p>{fmtDate(record.dateTime)} · {fmtTime(record.dateTime)}</p>
        </div>
      </div>

      {/* driver info */}
      <div className="mb-3 grid grid-cols-3 gap-x-6 gap-y-1.5 rounded border border-neutral-300 p-3">
        <Info l="Driver" v={record.driverName} />
        <Info l="Vehicle ID" v={record.vehicleLabel} />
        {record.trailerLabel && <Info l="Trailer ID" v={record.trailerLabel} />}
        {record.odometer != null && <Info l="Odometer" v={record.odometer.toLocaleString()} />}
        {record.projectJobsite && <Info l="Project / Jobsite" v={record.projectJobsite} />}
        {record.location && <Info l="Location" v={record.location} />}
      </div>

      {/* sections */}
      {Object.entries(bySection).map(([sid, items]) => (
        <table key={sid} className="mb-2 w-full border-collapse">
          <thead>
            <tr><th className="border border-neutral-400 bg-neutral-100 px-2 py-1 text-left text-[11px] font-bold" colSpan={4}>{titleOf[sid] || sid}</th></tr>
            <tr className="text-[9.5px] font-semibold text-neutral-600">
              <td className="border border-neutral-300 px-2 py-0.5">Item</td><td className="border border-neutral-300 px-2 text-center">OK</td><td className="border border-neutral-300 px-2 text-center">Defect</td><td className="border border-neutral-300 px-2">Comments</td>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.itemId}>
                <td className="border border-neutral-300 px-2 py-1">{r.label}</td>
                <td className="border border-neutral-300 text-center">{box(r.status === 'PASS')}</td>
                <td className="border border-neutral-300 text-center">{box(r.status === 'FAIL')}</td>
                <td className="border border-neutral-300 px-2 text-[9.5px] text-red-700">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}

      {/* overall */}
      <div className="mt-3 rounded border border-neutral-300 p-3">
        <p className="text-[12px] font-bold">Overall</p>
        <p className="mt-1">{isTrailer ? 'Trailer' : 'Vehicle'} safe to operate?&nbsp;&nbsp;{box(record.safeToOperate)} Yes&nbsp;&nbsp;{box(!record.safeToOperate)} No</p>
        {!record.safeToOperate && <p className="mt-1">Safe to drive?&nbsp;&nbsp;{box(record.safeToDrive === true)} Yes&nbsp;&nbsp;{box(record.safeToDrive === false)} No</p>}
        <p className="mt-1 text-neutral-600">Photos attached: {record.photos}</p>
        {record.remarks && <p className="mt-1"><span className="font-semibold">Remarks:</span> {record.remarks}</p>}
      </div>

      {/* photos */}
      {cfg.includePhotos && record.photos > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[12px] font-bold">Photos ({record.photos})</p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: record.photos }).map((_, i) => (
              <div key={i} className="flex h-20 w-28 items-center justify-center rounded border border-neutral-300 bg-neutral-50 text-neutral-400"><Camera size={18} /></div>
            ))}
          </div>
        </div>
      )}

      {/* signature */}
      <div className="mt-3 flex items-end gap-6">
        <div className="flex-1"><div className="border-b border-black pb-6" />{<p className="mt-1 text-[10px] text-neutral-600">Driver Signature {record.signedBy ? `— ${record.signedBy}` : ''}</p>}</div>
        <div className="w-40"><div className="border-b border-black pb-6" /><p className="mt-1 text-[10px] text-neutral-600">Date — {fmtDate(record.dateTime)}</p></div>
      </div>
      {cfg.retentionNote && <p className="mt-3 text-[8.5px] italic text-neutral-600">Generated by Merlin · DOT compliance record. Retain per company policy and 49 CFR 396.11.</p>}
    </div>
  )
}

function Info({ l, v }: { l: string; v?: string | null }) {
  return <div><span className="block text-[9px] font-semibold uppercase tracking-wide text-neutral-500">{l}</span><span className="text-[11px]">{v || '—'}</span></div>
}
