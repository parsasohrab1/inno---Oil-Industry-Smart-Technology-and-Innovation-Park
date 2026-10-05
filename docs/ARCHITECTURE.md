# Oil Smart Park (OIPMS) System Architecture

## Overview

The system is designed based on the **Physical–Cyber–Social (PCS)** model:

| Layer | Components | Status in this repository |
| :--- | :--- | :--- |
| Physical | IoT sensors, face recognition camera, plate reader (LPR), automatic gates | Simulated with a synthetic dataset |
| Cyber | Data processing, analytics, digital twin, management dashboard | **Implemented** (this repository) |
| Social | Panels for companies, startups, investors, operators | Operator dashboard implemented; panels of other roles are on the roadmap |

## Technical layering (Frontend)

```
src/
├── app/            Route configuration and navigation
├── layout/         Application shell: sidebar (right-aligned), header, footer
├── pages/          Dashboard pages (each SRS module = one page)
├── components/     Shared UI components and charts (Recharts)
├── services/       Data access layer + analytical functions (analytics.ts)
├── data/           Reproducible synthetic dataset generator (seeded RNG)
├── lib/            Domain types, Persian/rial/Jalali formatting, RNG, Faker
├── hooks/          useDataset — dataset loading and caching
└── store/          Global state (shell, sidebar) with Zustand
```

## Data flow

1. `services/index.ts` → depending on `VITE_DATA_SOURCE`:
   - `mock` (default): reads from `data/dataset.ts` which runs `data/generate.ts` with a fixed seed.
   - `api`: reads from `GET {VITE_API_BASE_URL}/api/dataset`.
2. `hooks/useDataset.ts` fetches the result once and caches it in module memory.
3. Pages give the raw dataset to `services/analytics.ts` to compute KPIs and chart series.

## Real backend (`server/`)

Implemented. Express + `node:sqlite` (no native dependencies, running TypeScript directly on Node 22.5+).

```
server/src/
├── index.ts          bootstrap + route mounting + automatic seed
├── db/
│   ├── schema.sql     DDL (users, entities, contract_events, audit_log, meta)
│   ├── index.ts       SQLite connection + entities helpers + audit()
│   └── seed.ts        loading the synthetic dataset + contracts + 6 sample users
├── lib/
│   ├── synth.ts       dataset generator (TS port of the frontend's src/data/generate.ts)
│   ├── auth.ts        bcrypt + JWT
│   ├── rbac.ts        role → permission (Permission) mapping
│   ├── dataset.ts     assembleDataset() from the tables
│   ├── contracts.ts   hash chain, automatic execution of conditions
│   └── reports.ts     report definitions + xlsx/csv/html output
├── middleware/auth.ts requireAuth / requireRole / requirePermission
└── routes/           auth, dataset, company, contracts, mentor, investor, reports, admin, misc
```

**Authentication:** JWT in the `login`/`register` response; the client keeps it in `localStorage` and sends it in the
`Authorization: Bearer` header. The `requireAuth` middleware verifies the token and fills `req.auth`.

**Access control:** Six roles (`admin`, `operator`, `company`, `startup`, `investor`, `mentor`).
Each route is protected with `requirePermission('...')` and data is row-limited
(a company user sees only their own `company_id`).

**Smart contract:** The `contract_events` table is an append-only ledger with a hash chain:
`hash = sha256({event, prevHash})`. `verifyContractChain()` checks the integrity of the whole chain.
`runContractConditions()` executes the conditions: late-payment penalty ≥2 months, gate blocking,
automatic renewal or expiry at maturity.

**Reporting:** `GET /api/reports/:id.(xlsx|csv|html)` — xlsx with ExcelJS, html is a printable version
(the user makes a PDF from the browser).

**Replacing the data source:** The `entities` store is generic; to migrate to Postgres it is enough to rewrite
the `db/index.ts` helpers.

## Key integrations implemented in the synthetic logic

- **Finance ↔ traffic control:** A company with arrears ≥ 2 months → `gateAccessRevoked=true` and the vehicle traffic originating from it `authorized=false`.
- **Derived notifications:** Critical/warning alerts are built from debts, unauthorized traffic, upcoming events and approved financing.
- **Startup judging:** SRS formula: `0.3×team + 0.35×product + 0.35×market` × industry coefficient × growth stage coefficient.
