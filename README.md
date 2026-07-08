# Merlin — Vehicle Management (Fleet) Module · Prototype

A working, self-contained prototype of a **Vehicle Management / Dispatch** module styled to Merlin's
UI/UX (brand purple, Inter, shadcn-style components). Built to demonstrate an end-to-end asset-based
trucking operation for a client migrating off **Alvys**, and structured so features can be added
incrementally as customer requirements firm up.

## Run

```bash
npm install
npm run dev      # http://localhost:5184
npm run build    # typechecks (tsc) + production build
```

## What it covers (end-to-end operation)

| Screen | Purpose |
|--------|---------|
| **Dashboard** | Ship Summary (loads by status), Requires-Attention feed, Safety Summary (expiring/expired), 8-week revenue, Top Customers |
| **Dispatch** | Plan-by-Trips & Plan-by-Drivers; best-match ranking (eligibility, equipment fit, HOS); rich driver side-panel + "Find Trips"; one-click dispatch |
| **Loads** | Load/trip list with footer rollups (miles, revenue, RPM); New Load w/ mock AI rate-con parsing + stop builder; lifecycle: Not Covered → Dispatched → In Transit → Delivered + POD |
| **Trucks / Trailers / Drivers** | Asset system-of-record: list + tabbed detail drawer (specs, compliance, assignment, maintenance, docs, notes) |
| **Live Map** | Mock GPS tracking of in-transit loads (self-contained, no external tiles) |
| **Maintenance** | Work-order list + New Work Order form; open/in-progress/completed + cost rollup |
| **Compliance** | Expiration tracking across all assets (CDL, medical, registration, insurance, inspection) + DOT safety events |
| **Invoicing** *(Billing)* | Accounts receivable — line-haul + accessorials, aging, factored flag, statuses (Incomplete→Released→Invoiced→Paid, Discrepancy); AR/Overdue/DSO metrics |
| **Settlements** *(Billing)* | Driver payroll (per-load pay = miles × rate, deductions, net) + Carrier pay; approve/pay workflow |
| **Fuel & Tolls** *(Billing)* | Card & transponder transaction ledger reconciled to trucks/drivers; fuel spend, avg $/gal, cost-per-mile |

**Create flows:** New Load, New Work Order, Add Truck, Add Trailer, and Add Driver all open a form modal that
writes a real record into the store and updates the list + metrics live. Row/detail actions (dispatch, deliver,
release/pay invoice, approve/pay settlement) also mutate live state.

**Design:** the shell (light sidebar + header + branch sub-nav), primitives, and tokens mirror the real
`ether-web-v1` frontend (Merlin token vocabulary: `text-strong-950`, `stroke-soft-200`, `brand-*`, `state-*`).
Metric summary rows appear on every list screen, and `InfoTip` "ⓘ" tooltips (matching Merlin's shadcn
Tooltip + Info idiom) explain metrics, columns, and domain terms throughout.

## Architecture

- **Vite + React + TypeScript + Tailwind**, no backend — in-memory store (`src/lib/store.tsx`).
- `src/lib/` — `types.ts` (domain model), `data.ts` (seed fleet: 8 trucks, 8 trailers, 9 drivers, 10 loads),
  `store.tsx` (state + actions), `status.tsx` (badge/status helpers), `utils.ts`.
- `src/components/ui/` — shadcn-style primitives (Card, Table, Drawer, Modal, Tabs, Badge, …).
- `src/components/layout/Shell.tsx` — Merlin module rail + header + horizontal sub-nav.
- `src/features/<screen>/` — one folder per screen.

## Mocked vs. real (prototype scope)

- **Real & live:** all state transitions (dispatch, deliver, create load/work-order) update the store and
  reflect across every screen instantly.
- **Mocked:** AI rate-con parsing (fills a canned load), GPS positions, the 8-week revenue series, "today"
  is pinned to 2026-07-08 for deterministic expiry math. Asset-pool suggestions in Dispatch are simplified
  (may reuse a trailer already hooked when no idle unit of the right equipment exists).

## Maps to Merlin's existing platform (`ether-server`)

Designed to sit on top of what Merlin already has, not replace it:
`Vehicle`, `VehicleInspection` (DVIR), `Driver`, `Delivery` (routes/stops/POD), `Equipment`/`EquipmentLog`,
the `CrmFieldConfig` custom-field engine, and the `ConfigKeyRegistry` per-org feature-flag system.
New objects this module implies: `Trailer`, `Load`, `Assignment`, `MaintenanceRecord`, fuel/toll ledgers.

## Deliberately deferred (Phase 2/3)

Driver/carrier settlements & payroll, factoring, IFTA, e-checks, load-board/marketplace integrations,
carrier onboarding packets, brokerage. These are where Alvys is deepest; v1 focuses on the
dispatch + asset-compliance layers that run daily operations.
