import { Smartphone } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Modal } from '@/components/ui'
import { InspectionForm } from './InspectionForm'

/* Admin-side capture: the driver's inspection form in a phone frame, opened
   from the web Inspections screen. Uses the same InspectionForm as the driver
   mobile app. */
export function CaptureFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { org } = useStore()
  return (
    <Modal open={open} onClose={onClose} width="max-w-md"
      title={<span className="flex items-center gap-2"><Smartphone size={16} className="text-brand-500" />Mobile capture · {org.name}</span>}
      subtitle="Field driver view — rendered live from this client's template">
      <div className="mx-auto max-w-[360px] rounded-[26px] border-[6px] border-neutral-900 bg-neutral-900 shadow-xl">
        <div className="flex max-h-[66vh] flex-col overflow-hidden rounded-[20px] bg-bg-weak-50">
          <InspectionForm onDone={onClose} />
        </div>
      </div>
    </Modal>
  )
}
