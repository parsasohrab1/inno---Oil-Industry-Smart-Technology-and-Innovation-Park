# Backend of the Oil Smart Park System (OIPMS)

Express + `node:sqlite` (no native dependencies) + JWT. Runs TypeScript directly on Node 22.5+ (no build step in development).

## Setup

```bash
cd server
npm install
cp .env.example .env
npm run dev        # http://localhost:8787  (seeds the synthetic dataset the first time)
```

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Run with watch |
| `npm start` | Run the built version (`dist/`) |
| `npm run build` | Compile TypeScript |
| `npm run seed` | Fully regenerate the dataset (`--reset`) |
| `npm run typecheck` | Type checking |

## Sample users (after seed)

| Role | Email | Password |
| :--- | :--- | :--- |
| Park manager | `admin@naftpark.ir` | `admin1234` |
| Operator | `operator@naftpark.ir` | `operator1234` |
| Company manager | `company@naftpark.ir` | `company1234` |
| Startup | `startup@naftpark.ir` | `startup1234` |
| Investor | `investor@naftpark.ir` | `investor1234` |
| Mentor | `mentor@naftpark.ir` | `mentor1234` |

## Main API routes

```
POST  /api/auth/login | /api/auth/register        Authentication (JWT in the response)
GET   /api/auth/me                                 Current user + permissions
GET   /api/health                                  Service health
GET   /api/public/companies                        List of companies (for registration)

GET   /api/dataset            [dataset:read:all]   Full dataset (operator/manager)
GET   /api/dataset/mine                            Slice of the dataset for the user's company

# Company / startup (company/startup role)
GET   /api/company/me | /invoices | /contracts | /funding | /bookings | /mentoring
POST  /api/company/invoices/:id/pay                Pay an invoice (lifts the gate block)
POST  /api/company/contracts/:id/sign              Digital signature of the tenant party
POST  /api/company/funding                         Submit a financing request
POST  /api/company/bookings | /bookings/:id/cancel Book/cancel a meeting room

# Smart contract (operator/manager)
GET   /api/contracts | /contracts/:id             List + details + events + hash chain integrity
POST  /api/contracts                              Create a contract
POST  /api/contracts/:id/sign                     Signature of the park party
POST  /api/contracts/:id/run-conditions           Automatic execution of conditions
POST  /api/contracts/run-conditions/all           Automatic execution for all active contracts
POST  /api/contracts/:id/terminate                Termination (manager)

# Mentor
GET   /api/mentor/mentees | /sessions
PATCH /api/mentor/mentees/:id                     Update progress
POST  /api/mentor/sessions                        Log a mentoring session

# Investor
GET   /api/investor/startups | /startups/:id | /funding | /interests
POST  /api/investor/interests | /interests/:id/withdraw

# Reporting
GET   /api/reports                                List of reports allowed for the role
GET   /api/reports/:id.(html|csv|xlsx)            Report output (printable HTML → PDF)

# Manager
GET   /api/admin/users | /audit
POST  /api/admin/users        DELETE /api/admin/users/:id
```

## Smart contract — immutable ledger

Every contract change is recorded in the `contract_events` table with an **SHA-256 hash chain**
(`hash = sha256(event + prevHash)`). The `GET /api/contracts/:id` route re-verifies the integrity of the whole chain
(`chain.valid`). Automatic conditions: late-payment penalty ≥ 2 months, gate blocking,
automatic renewal at maturity, and expiry.

## Storage architecture

`users` (dedicated table) + `entities(collection, id, company_id, data JSON)` as the generic
entity store + `contract_events` + `audit_log`. Replacing with a real API is possible simply by
re-implementing `lib/dataset.ts` and the routes on the new data source.
