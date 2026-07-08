# Fleet — Vehicle Management Module · Prototype

A working, self-contained prototype of a **Vehicle Management / Dispatch + Billing** module for an
asset-based trucking operation. Front-end only, in-memory data, built to demo an end-to-end operational
flow and be extended incrementally.

**Stack:** Vite + React + TypeScript + Tailwind (shadcn-style components, Inter, no backend).

## Run

```bash
npm install
npm run dev      # http://localhost:5184
npm run build    # typecheck (tsc) + production build
```

## What it covers (end-to-end operation)

| Screen | Purpose |
|--------|---------|
| **Dashboard** | Ship Summary (loads by status), Requires-Attention feed, Safety Summary (expiring/expired), 8-week revenue, Top Customers |
| **Dispatch** | Plan-by-Trips & Plan-by-Drivers; best-match ranking (eligibility, equipment fit, HOS); driver side-panel + "Find Trips"; one-click dispatch |
| **Loads** | Load/trip list with footer rollups (miles, revenue, RPM); New Load w/ mock rate-con parsing + stop builder; lifecycle: Not Covered → Dispatched → In Transit → Delivered + POD |
| **Trucks / Trailers / Drivers** | Asset system-of-record: list + tabbed detail drawer (specs, compliance, assignment, maintenance, docs, notes) |
| **Live Map** | Mock GPS tracking of in-transit loads (self-contained, no external tiles) |
| **Maintenance** | Work-order list + New Work Order form; open/in-progress/completed + cost rollup |
| **Compliance** | Expiration tracking across all assets (CDL, medical, registration, insurance, inspection) + DOT safety events |
| **Invoicing** *(Billing)* | Accounts receivable — line-haul + accessorials, aging, statuses (Incomplete→Released→Invoiced→Paid, Discrepancy); AR/Overdue/DSO metrics |
| **Settlements** *(Billing)* | Driver payroll (per-load pay = miles × rate, deductions, net) + Carrier pay; approve/pay workflow |
| **Fuel & Tolls** *(Billing)* | Card & transponder transaction ledger reconciled to trucks/drivers; fuel spend, avg $/gal, cost-per-mile |

**Create flows:** New Load, New Work Order, Add Truck, Add Trailer, and Add Driver each open a form modal that
writes a real record into the store and updates the list + metrics live. Row/detail actions (dispatch, deliver,
release/pay invoice, approve/pay settlement) also mutate live state. Metric summary rows and `InfoTip` "ⓘ"
tooltips (explaining metrics, columns, and domain terms) appear throughout.

## Architecture

- **In-memory store** (`src/lib/store.tsx`) — no backend; state resets on refresh.
- `src/lib/` — `types.ts` (domain model), `data.ts` (seed fleet: 8 trucks, 8 trailers, 9 drivers, 10 loads),
  `store.tsx` (state + actions), `status.tsx` (badge/status helpers), `utils.ts`.
- `src/components/ui/` — shadcn-style primitives (Card, Table, Drawer, Modal, Tabs, Badge, InfoTip, …).
- `src/components/layout/Shell.tsx` — module rail + header + horizontal sub-nav.
- `src/features/<screen>/` — one folder per screen.

## Mocked vs. real (prototype scope)

- **Real & live:** all state transitions (dispatch, deliver, create load/work-order/asset, invoice/settlement
  actions) update the store and reflect across every screen instantly.
- **Mocked:** rate-con parsing (fills a canned load), GPS positions, the 8-week revenue series; "today" is
  pinned to 2026-07-08 for deterministic expiry math. All company/driver/load names are fictional sample data.
- **Not included:** auth, persistence, and back-end integrations (ELD/telematics, load boards, fuel cards,
  accounting sync). This is a UI/UX and workflow prototype.
