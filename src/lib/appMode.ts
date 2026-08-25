/* Focused-app mode. Visiting the app with ?view=inspection strips the fleet
   console down to just the Vehicle Inspection module (mobile + web), so the
   inspection product can be demoed on its own link without the other modules. */
export const INSPECTION_ONLY =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('view') === 'inspection'

/* Sections shown in inspection-only mode — lean: mobile, web data, setup, config. */
export const INSPECTION_SECTIONS = ['driver', 'inspections', 'onboarding', 'settings'] as const
