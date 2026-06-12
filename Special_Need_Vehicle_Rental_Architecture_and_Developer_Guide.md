# Special Need Vehicle Rental
## Application Architecture & Developer Guide

**Version:** 1.1.0
**Last Updated:** June 2026 (updated to reflect built implementation)
**Jurisdiction:** New South Wales, Australia
**Audience:** Software developers, DevOps engineers, technical leads

---

> **⚠️ This document has been superseded.**
>
> This is the original architecture specification (v1.1.0). It covers Phase 1 only and does not include:
> - Customer accounts and My Bookings (`/login`, `/my-bookings`, `users` table, `booking_feedback` table)
> - Promo codes with per-code discount percentages (`promo_codes` table, `discount_percent` column)
> - Refund workflow (customer pending queue + admin immediate Stripe refund, `refund_requests` table)
> - Cancellation policy configuration (`settings` table, `/admin/promo-codes` settings section)
> - Enterprise redesign (Aurora Indigo theme, dark gradient header/footer, rainbow status system)
> - Corrected migration instructions (`npm run migrate` is broken on existing databases — use the idempotent inline snippet)
>
> **The authoritative reference is [`COMPLETE_DEVELOPER_GUIDE.md`](COMPLETE_DEVELOPER_GUIDE.md) (v2.0.0).**
> This file is kept for historical reference only.

---

## Table of Contents

1. [Overview & Purpose](#1-overview--purpose)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Data Model](#4-data-model)
5. [API Specification](#5-api-specification)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Payment Form (MVP)](#7-payment-form-mvp)
8. [Security & Compliance](#8-security--compliance)
9. [Developer Setup](#9-developer-setup)
10. [Database Migrations & Seeding](#10-database-migrations--seeding)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment Guide](#12-deployment-guide)
13. [Cloud Hosting Cost Estimate](#13-cloud-hosting-cost-estimate)
14. [Monitoring & Observability](#14-monitoring--observability)
15. [Backup & Recovery](#15-backup--recovery)
16. [Handoff Deliverables](#16-handoff-deliverables)

---

## 1. Overview & Purpose

Special Need Vehicle Rental is a lean, secure web application that allows the public to browse and book the facility's **already-owned vehicles** during their idle hours — when they are not in use for resident transport. It is presented as a single external link embedded in the existing facility production website. The application is designed to be:

- **Minimal in scope** — up to 100 vehicles, low traffic, single region
- **Low-cost** — targets under AUD $35/month total infrastructure
- **NSW-compliant** — privacy, accessibility, GST and insurance requirements observed
- **Extensible** — payment gateway integration is deferred to Phase 2; all other scaffolding is in place

### Integration Pattern

```
Facility Production Website
        │
        │  <a href="https://rentals.facility.example.au">
        ▼
Special Need Vehicle Rental (standalone subdomain or path)
        │
        ├── Public Booking UI  ──► REST API ──► SQLite DB
        └── Admin UI           ──► REST API ──► SQLite DB
```

The application lives on its own subdomain (e.g., `rentals.facilitydomain.com.au`) and shares no session or data with the parent site. Cross-origin resource sharing (CORS) is restricted to the parent domain.

---

## 2. System Architecture

### 2.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUD VPS (Sydney Region)                │
│                                                                   │
│  ┌───────────────┐    ┌─────────────────────────────────────┐   │
│  │               │    │          Node.js / Express           │   │
│  │     Nginx     │───►│                                      │   │
│  │  (Reverse     │    │  ┌─────────────┐ ┌───────────────┐  │   │
│  │   Proxy +     │    │  │  REST API   │ │   Admin API   │  │   │
│  │   TLS Term.)  │    │  │  (Public)   │ │  (Protected)  │  │   │
│  │               │    │  └──────┬──────┘ └───────┬───────┘  │   │
│  └───────────────┘    │         │                 │          │   │
│         │             │  ┌──────▼─────────────────▼──────┐  │   │
│         │             │  │    In-Memory Availability Cache │  │   │
│         │             │  │    (Node.js Map / node-cache)   │  │   │
│         │             │  └──────────────┬─────────────────┘  │   │
│         │             │                 │                     │   │
│         │             │  ┌──────────────▼─────────────────┐  │   │
│         │             │  │        SQLite Database           │  │   │
│         │             │  │   (file: /data/rental.sqlite)   │  │   │
│         │             │  └─────────────────────────────────┘  │   │
│         │             └─────────────────────────────────────┘   │
│         │                                                         │
│         │  ┌──────────────────────────────┐                      │
│         └─►│  Static Assets (React Build)  │                      │
│            │  served by Nginx directly      │                      │
│            └──────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
         ▲                              ▲
         │                              │
   Public Internet                Admin (VPN or
   (Renters)                       IP Restricted)
```

### 2.2 Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS | Wide ecosystem, async I/O suits booking concurrency |
| Database | SQLite | Zero managed-DB cost; 100 vehicles = < 5 MB data |
| Caching | In-process Map / node-cache | Availability queries are hot; TTL = 30 seconds |
| Frontend | React 18 SPA | Modern component model; CRA or Vite for build |
| Reverse Proxy | Nginx | TLS termination, gzip, static file serving |
| Process Manager | PM2 | Auto-restart, cluster mode, log management |
| TLS | Let's Encrypt / Certbot | Free, auto-renewing |

### 2.3 Timezone & Locale

- All dates stored in SQLite as **ISO 8601 UTC** strings (`2026-06-15T04:00:00Z`)
- All dates displayed to users in **Australia/Sydney** (AEST UTC+10 / AEDT UTC+11)
- The UI explicitly labels timezone on every date/time field
- Currency: **AUD** with two decimal places; all prices include GST (10%) where applicable

---

## 3. Technology Stack

### 3.1 Backend

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20.x LTS |
| Framework | Express | 4.x |
| Database driver | better-sqlite3 | 9.x |
| Caching | node-cache | 5.x |
| Validation | zod | 3.x |
| Auth (admin) | express-session + bcrypt | — |
| Rate limiting | express-rate-limit | 7.x |
| Email | nodemailer (SMTP) | 6.x |
| Logging | pino + pino-http | 8.x |
| Security headers | helmet (dev) + manual headers | 7.x |
| CORS | cors | 2.x |
| Process mgr | PM2 | 5.x |

### 3.2 Frontend

> **Implementation note:** shadcn/ui, react-hook-form, and react-datepicker were not used in the built implementation. Custom accessible components were built with Tailwind CSS directly — this keeps the dependency footprint minimal, avoids client-side Zod bundle, and gives full control over WCAG 2.1 AA compliance. Native `<input type="datetime-local">` is used for date/time picking.

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18.x |
| Build tool | Vite | 5.x |
| Routing | React Router | 6.x |
| Date/Time | date-fns + date-fns-tz | 3.x |
| UI library | Custom components + Tailwind CSS | — |
| Forms | Native React state + manual validation | — |
| Date picker | Native `<input type="datetime-local">` | — |
| Accessibility | Bespoke ARIA-compliant components (see §8.4) | — |

### 3.3 Infrastructure

| Component | Technology |
|---|---|
| VPS | DigitalOcean / AWS Lightsail / EC2 t4g.nano |
| Web server | Nginx 1.24+ |
| TLS | Let's Encrypt (Certbot) |
| OS | Ubuntu 22.04 LTS |
| Backups | Cron → rsync to S3-compatible storage |
| CI/CD (optional) | GitHub Actions → SSH deploy |

---

## 4. Data Model

### 4.1 Entity-Relationship Overview

```
vehicles ────────┐
                 │ 1:M
                 ▼
           reservations
                 │
          (customer data embedded)
```

### 4.2 Full SQL Schema

```sql
-- ============================================================
-- migrations/001_initial_schema.sql
-- ============================================================
PRAGMA journal_mode = WAL;          -- concurrent readers while writing
PRAGMA foreign_keys = ON;

-- Vehicle catalogue
CREATE TABLE IF NOT EXISTS vehicles (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL,
  type                TEXT    NOT NULL,  -- 'sedan' | 'wagon' | 'van' | 'wheelchair'
  capacity            INTEGER NOT NULL DEFAULT 1,
  plate               TEXT    UNIQUE,
  accessibility_notes TEXT,              -- ramp, wheelchair lift, hand controls, etc.
  photos_json         TEXT,              -- JSON array of relative image paths
  hourly_rate_cents   INTEGER NOT NULL DEFAULT 0,
  daily_rate_cents    INTEGER NOT NULL DEFAULT 0,
  buffer_minutes      INTEGER NOT NULL DEFAULT 30, -- cleaning gap between bookings
  status              TEXT    NOT NULL DEFAULT 'active',
                      -- 'active' | 'maintenance' | 'retired'
  maintenance_until   TEXT,              -- ISO UTC; set when status = 'maintenance'
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT
);

-- Customer reservations
CREATE TABLE IF NOT EXISTS reservations (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id          INTEGER NOT NULL REFERENCES vehicles(id),
  customer_name       TEXT    NOT NULL,
  customer_email      TEXT    NOT NULL,
  customer_phone      TEXT    NOT NULL,
  intended_use        TEXT,             -- free-text: 'medical appointment', etc.
  addons_json         TEXT,             -- JSON array of selected add-ons
  start_utc           TEXT    NOT NULL, -- ISO 8601 UTC
  end_utc             TEXT    NOT NULL,
  status              TEXT    NOT NULL DEFAULT 'pending',
                      -- 'pending' | 'confirmed' | 'picked_up' | 'completed'
                      -- | 'cancelled'
  price_cents         INTEGER NOT NULL DEFAULT 0,
  gst_cents           INTEGER NOT NULL DEFAULT 0,
  deposit_cents       INTEGER NOT NULL DEFAULT 0,
  payment_status      TEXT    NOT NULL DEFAULT 'none',
                      -- 'none' | 'form_captured' | 'paid' | 'refunded'
  payment_token       TEXT,             -- placeholder; replaced by gateway token in Phase 2
  -- Phase 1 payment form capture (stored directly; Phase 2 replaces with gateway token)
  cardholder_name     TEXT,
  card_last4          TEXT,             -- last 4 digits only; never full card number
  expiry_month        TEXT,             -- MM
  expiry_year         TEXT,             -- YYYY
  terms_accepted      INTEGER NOT NULL DEFAULT 0, -- boolean 0|1
  terms_accepted_at   TEXT,             -- ISO UTC timestamp
  cancellation_reason TEXT,
  notes               TEXT,             -- admin staff notes
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT
);

-- Audit log (append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  entity     TEXT NOT NULL,             -- 'reservation' | 'vehicle'
  entity_id  INTEGER NOT NULL,
  action     TEXT NOT NULL,             -- 'create' | 'update' | 'cancel' | 'complete'
  actor      TEXT,                      -- 'customer' | 'admin'
  detail_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_res_vehicle_time
  ON reservations(vehicle_id, start_utc, end_utc);

CREATE INDEX IF NOT EXISTS idx_res_status
  ON reservations(status);

CREATE INDEX IF NOT EXISTS idx_res_email
  ON reservations(customer_email);
```

### 4.3 Availability Overlap Logic

A vehicle is **available** for interval `[NEW_START, NEW_END)` when no existing reservation satisfies:

```sql
-- Overlap condition (existing record conflicts with proposed interval)
SELECT id FROM reservations
WHERE vehicle_id = ?
  AND status IN ('pending', 'confirmed', 'picked_up')
  AND NOT (end_utc <= ? OR start_utc >= ?)
--                  ↑NEW_START      ↑NEW_END
```

This uses the standard Allen interval complement: two intervals do **not** overlap if one ends before the other starts or vice versa. The NOT of that is the overlap. Implement inside a **BEGIN IMMEDIATE TRANSACTION** to prevent concurrent double-bookings.

---

## 5. API Specification

All endpoints prefix: `/api/v1`
Content-Type: `application/json`
Dates: ISO 8601 UTC strings in request/response bodies
Authentication: Admin endpoints require session cookie; public endpoints are unauthenticated but rate-limited.

### 5.1 Public Endpoints

#### `GET /api/v1/vehicles`

Returns all active vehicles with pricing.

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Toyota HiAce (Wheelchair)",
      "type": "van",
      "capacity": 4,
      "accessibility_notes": "Rear wheelchair ramp, 2 anchor points",
      "hourly_rate_aud": "20.00",
      "daily_rate_aud": "120.00",
      "buffer_minutes": 30,
      "photos": ["/uploads/vehicles/1/front.jpg"]
    }
  ]
}
```

---

#### `GET /api/v1/availability`

Returns vehicles available for a given time window.

**Query parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `start` | ISO 8601 UTC | Yes | Requested start time |
| `end` | ISO 8601 UTC | Yes | Requested end time |
| `type` | string | No | Filter by vehicle type |

**Response 200:**
```json
{
  "requested_start": "2026-06-15T04:00:00Z",
  "requested_end":   "2026-06-16T04:00:00Z",
  "timezone_display": "Australia/Sydney",
  "available": [ { "id": 1, "name": "Toyota HiAce (Wheelchair)", ... } ],
  "unavailable": [ { "id": 2, "name": "Ford Territory", "reason": "booked" } ]
}
```

**Caching:** Results cached in-memory for 30 seconds per `start+end+type` key. Cache is invalidated on any reservation write.

---

#### `POST /api/v1/reservations`

Creates a new reservation. Validates availability atomically.

**Request body:**
```json
{
  "vehicle_id": 1,
  "customer_name": "Jane Smith",
  "customer_email": "jane.smith@example.com",
  "customer_phone": "+61412345678",
  "intended_use": "Medical appointment",
  "start_utc": "2026-06-15T04:00:00Z",
  "end_utc":   "2026-06-16T04:00:00Z",
  "terms_accepted": true
}
```

**Responses:**

| Code | Meaning |
|---|---|
| 201 | Reservation created; returns full reservation object |
| 409 | Vehicle no longer available for requested window |
| 422 | Validation error (missing fields, invalid dates) |
| 429 | Rate limit exceeded |

---

#### `GET /api/v1/reservations/:id`

Returns a reservation by ID. Requires customer email match (query param `email=`) for security.

---

#### `PATCH /api/v1/reservations/:id/cancel`

Customer self-cancellation within the policy window.

**Request body:**
```json
{ "customer_email": "jane.smith@example.com", "reason": "Plans changed" }
```

---

#### `POST /api/v1/payments/form`

Captures payment form fields for an existing reservation. **Phase 1 only — no gateway processing.**

**Request body:**
```json
{
  "reservation_id": 42,
  "cardholder_name": "Jane Smith",
  "billing_email": "jane.smith@example.com",
  "billing_phone": "+61412345678",
  "card_last4": "4242",
  "expiry_month": "12",
  "expiry_year": "2028",
  "amount_aud": "120.00"
}
```

> **Security:** Raw card numbers are NEVER accepted or stored. The frontend must not transmit full card numbers to this endpoint. In Phase 1, the UI instructs users that payment will be confirmed by staff prior to pickup. Phase 2 replaces this with a Stripe Payment Element or equivalent, handling card data exclusively on the gateway's PCI-compliant servers.

---

### 5.2 Admin Endpoints (Protected)

All admin routes require a valid admin session obtained via `POST /api/v1/admin/login`. Full prefix: `/api/v1/admin`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/admin/login` | Authenticate admin (username + password) |
| POST | `/api/v1/admin/logout` | Invalidate session |
| GET  | `/api/v1/admin/me` | Returns current admin username (used for session check) |
| GET  | `/api/v1/admin/reservations` | List all reservations; filterable by `status`, `vehicle_id`, `from`, `to`, `email` |
| GET  | `/api/v1/admin/reservations/:id` | Get single reservation detail (includes `vehicle_name`) |
| PATCH | `/api/v1/admin/reservations/:id` | Update `status`, `payment_status`, and/or `notes` |
| GET  | `/api/v1/admin/vehicles` | List all vehicles including `maintenance` and `retired` |
| POST | `/api/v1/admin/vehicles` | Add new vehicle |
| PATCH | `/api/v1/admin/vehicles/:id` | Update vehicle details / set maintenance window |
| DELETE | `/api/v1/admin/vehicles/:id` | Retire vehicle (soft-delete — sets `status = 'retired'`) |
| GET  | `/api/v1/admin/reports/csv` | Export reservations CSV; accepts `from` and `to` ISO query params |
| GET  | `/api/v1/admin/audit` | View audit log (last 500 entries, newest first) |

---

## 6. Frontend Architecture

### 6.1 Page Structure

```
/                        Landing page — hero, fleet types, trust signals, how it works
/availability            Availability search + results list (date/time/type filter)
/vehicles/:id            Vehicle detail — gallery, accessibility notes, add-ons, price summary
/booking                 Multi-step booking form (query: vehicle_id, start, end, addons)
  Step 1: Personal details + intended use
  Step 2: Terms & conditions acceptance (scrollable, timestamped checkbox)
  Step 3: Payment details (card last-4 capture, Phase 1 only)
/booking/confirmation    Confirmation + booking summary (passed via router state)
/cancel/:id              Customer self-cancellation (email verification required)
/privacy                 Privacy Policy (APP-compliant, NSW)
/terms                   Terms & Conditions (NSW-specific, Electronic Transactions Act 2000)
/admin/login             Admin login form
/admin  (→ /dashboard)   Redirect to dashboard
/admin/dashboard         Stats, today's reservations, pending payment actions
/admin/reservations      Filterable reservations list
/admin/reservations/:id  Reservation detail + inline status/payment/notes editor
/admin/vehicles          Fleet list + add/edit/retire form
/admin/reports           CSV export + audit log link
```

**File locations (frontend/src/):**

```
pages/
  Landing.jsx
  Availability.jsx
  VehicleDetail.jsx
  Booking.jsx             (contains all 3 steps)
  Confirmation.jsx
  Cancel.jsx
  Privacy.jsx
  Terms.jsx
  admin/
    Login.jsx
    Dashboard.jsx
    Reservations.jsx
    ReservationDetail.jsx
    Vehicles.jsx
    Reports.jsx
components/
  Header.jsx
  Footer.jsx
  VehicleCard.jsx
  BookingProgress.jsx
  Alert.jsx               (AlertInfo, AlertWarning, AlertError, AlertSuccess)
hooks/
  useAdminAuth.js         (polls /api/v1/admin/me for session check)
utils/
  api.js                  (all fetch wrappers)
  formatters.js           (AUD, Sydney timezone, ref numbers, badge classes)
```

### 6.2 Availability Calendar Component

The availability picker should be a date-range selector that:
- Defaults to `Australia/Sydney` timezone
- Disables past dates
- Highlights dates where some vehicles are available (green) vs. fully booked (red/grey)
- Shows minimum rental duration (1 hour) and maximum (configurable, default 7 days)
- Displays buffer times visually so renters do not select a slot too close to an existing booking

### 6.3 Accessibility Requirements (WCAG 2.1 AA)

The application must conform to **WCAG 2.1 Level AA** as mandated by the Australian Government's Digital Service Standard and consistent with the *Disability Discrimination Act 1992 (Cth)*:

- All form inputs have associated `<label>` elements
- All interactive components are keyboard navigable (Tab/Shift+Tab, Enter, Space, Escape)
- Colour contrast ratio: minimum 4.5:1 for normal text, 3:1 for large text
- No information conveyed by colour alone (use icons + text)
- All images have descriptive `alt` text
- Error messages are programmatically associated with fields via `aria-describedby`
- Focus management: on step change, focus moves to the new step heading
- Date pickers include keyboard alternatives (manual date entry fields)
- ARIA live regions announce dynamic updates (e.g., "Vehicle no longer available")
- Use semantic HTML5 landmarks: `<header>`, `<main>`, `<nav>`, `<footer>`, `<section>`

---

## 7. Payment Form (MVP)

### 7.1 Fields

| Field | UI Label | Stored? | Notes |
|---|---|---|---|
| `cardholder_name` | Name on card | Yes | Plain text |
| `card_last4` | Card number (last 4) | Yes | UI masks; never full number |
| `expiry_month` | Expiry month | Yes | MM format |
| `expiry_year` | Expiry year | Yes | YYYY format |
| `billing_email` | Email | Yes | Matches reservation |
| `billing_phone` | Phone | Yes | Australian format |
| `amount_aud` | Amount (AUD, incl. GST) | Yes | Read-only, prefilled |
| `reservation_id` | — | Yes | Hidden field |

### 7.2 Behaviour

1. Backend stores a **placeholder payment token** and sets `payment_status = 'form_captured'`
2. Admin is notified to manually confirm payment by phone or bank transfer before vehicle handover
3. Confirmation page states clearly: *"Your booking is held pending payment confirmation. Our staff will contact you within 2 business hours to finalise payment."*

### 7.3 Phase 2 Gateway Upgrade Path

Replace the form endpoint with a **Stripe Payment Element** (or Tyro / eWAY / Braintree for Australian-first options). The `payment_token` column stores the Stripe `PaymentIntent.id`. No card data ever passes through the application server in Phase 2.

---

## 8. Security & Compliance

### 8.1 Transport Security

- All traffic HTTPS; HTTP redirects to HTTPS via Nginx
- TLS 1.2 minimum; TLS 1.3 preferred
- HSTS header: `max-age=31536000; includeSubDomains`
- Let's Encrypt cert auto-renewing via Certbot systemd timer

### 8.2 Application Security

| Control | Implementation |
|---|---|
| Input validation | Zod schemas on all API inputs (server-side) + client-side mirroring |
| SQL injection | Parameterised queries via better-sqlite3 (no string concatenation) |
| XSS | React's default JSX escaping; CSP header via Nginx |
| CSRF | SameSite=Strict cookies for admin session; public API is stateless |
| Rate limiting | 100 req/15min for booking endpoints; 20/min for payment form |
| Admin auth | Bcrypt password hashing; session expiry 8 hours; optional IP allowlist |
| Secrets | Environment variables only; never in source code or SQLite |
| Logging | Pino structured logs; no PII in log bodies; separate audit table |

### 8.3 Content Security Policy (Nginx)

```nginx
add_header Content-Security-Policy
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
   img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';"
  always;
```

### 8.4 Australian Privacy Principles (APPs) — Privacy Act 1988 (Cth)

| APP | Obligation | Implementation |
|---|---|---|
| APP 1 | Privacy policy published | `/privacy` page with data handling disclosure |
| APP 3 | Collect only what is necessary | Collect only: name, email, phone, intended use |
| APP 5 | Notify at collection | Inline notice on booking form |
| APP 6 | Use only for stated purpose | Data used only for reservation management |
| APP 11 | Secure personal information | HTTPS + access controls + limited retention |
| APP 12 | Access to own information | Contact admin email stated on confirmation page |

### 8.5 PCI DSS Considerations

- Phase 1 (form-only): avoid raw card data in transit; store only masked/last-4; document that full card entry is to be replaced
- Phase 2 (gateway): use a PCI-validated gateway's hosted fields / Payment Element — application server is out of PCI scope
- Never log card numbers at any phase

---

## 9. Developer Setup

### 9.1 Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20.x LTS |
| npm | 10.x |
| Git | 2.40+ |
| SQLite CLI | 3.x (optional, for inspection) |

### 9.2 Clone & Configure

```bash
git clone https://github.com/your-org/special-need-vehicle-rental.git car_rental
cd car_rental
cp .env.example .env
```

### 9.3 Environment Variables

Copy `.env.example` to `.env` and fill in values before running. Full set:

```env
# Server
PORT=8080
NODE_ENV=development
BASE_URL=http://localhost:8080

# Database
DATABASE_PATH=./data/rental.sqlite

# Admin credentials
# Generate hash: node -e "require('bcrypt').hash('YOUR_PW',12).then(h=>console.log(h))"
# In development with no hash set, password defaults to 'admin'
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$change_this_bcrypt_hash

# Email (SMTP for booking confirmations)
# Leave blank to disable email; bookings still work, emails are silently skipped
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@facility.example.com.au
SMTP_PASS=smtp_password_here
EMAIL_FROM=Special Need Vehicle Rental <noreply@facility.example.com.au>

# Business details — shown in emails and confirmation pages
FACILITY_NAME=Special Need Vehicle Rental
FACILITY_PHONE=(02) XXXX XXXX
FACILITY_EMAIL=rentals@facility.com.au
FACILITY_ADDRESS=123 Care Street, Sydney NSW 2000

# Security
SESSION_SECRET=generate_a_random_64_char_secret_here
# Multiple origins comma-separated (include both prod domain and localhost in dev)
CORS_ORIGIN=https://www.facilitydomain.com.au

# Locale
TZ=UTC
DISPLAY_TZ=Australia/Sydney
CURRENCY=AUD
GST_RATE=0.10

# Rate limits
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 9.4 Install & Run

```bash
# 1. Install backend dependencies
npm install

# 2. Create SQLite database and run migrations
npm run migrate

# 3. Seed 100 sample vehicles
npm run seed

# 4. Install frontend dependencies
cd frontend && npm install && cd ..
```

**Development mode (two terminals):**

```bash
# Terminal 1 — Backend API (uses Node --watch for hot reload)
npm run dev
# API available at http://localhost:8080

# Terminal 2 — Frontend (Vite dev server with HMR)
cd frontend && npm run dev
# UI available at http://localhost:5173
# Vite proxies /api/* to http://localhost:8080 automatically
```

**Production mode (single server):**

```bash
# Build frontend static assets first
cd frontend && npm install && npm run build && cd ..

# Start API server — also serves the built frontend from frontend/dist
npm start
# Everything at http://localhost:8080
```

### 9.5 Development URLs

```
http://localhost:5173        → Frontend (Vite HMR dev server)
http://localhost:5173/admin  → Admin UI — login with username: admin, password: admin
http://localhost:8080        → API + serves built frontend (production mode)
http://localhost:8080/api/v1 → REST API base
http://localhost:8080/api/v1/health → Health check endpoint
```

> **Note:** In development, always use port `5173` for the UI — the Vite proxy forwards API calls to `8080`. In production, both are served from port `8080` after `npm run build`.

---

## 10. Database Migrations & Seeding

### 10.1 Migration Runner

The runner loads `.env`, auto-creates the `data/` directory, then executes the SQL schema file:

```javascript
// scripts/migrate.js
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DATABASE_PATH || './data/rental.sqlite';
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
const sql = fs.readFileSync(
  path.join(__dirname, '../migrations/001_initial_schema.sql'), 'utf8'
);
db.exec(sql);
db.close();
console.log('Migration complete.');
```

### 10.2 Seed Script (100 Sample Vehicles)

The seed produces 100 vehicles across 5 types using `INSERT OR IGNORE` (safe to re-run):

| Group | Count | Type | Rate |
|---|---|---|---|
| Toyota HiAce Wheelchair Vans | 20 | `wheelchair` | $30/hr · $165/day |
| Toyota Tarago Accessible Vans | 20 | `wheelchair` | $30/hr · $165/day |
| Kia Carnival People Movers | 20 | `van` | $25/hr · $132/day |
| Subaru Outback Station Wagons | 20 | `wagon` | $22/hr · $132/day |
| Toyota Camry Sedans | 20 | `sedan` | $22/hr · $132/day |

All prices are in cents (AUD, GST-inclusive). The wheelchair premium is reflected in the higher daily rate. Buffer time is 60 minutes for wheelchair vehicles and 30 minutes for others.

Run: `npm run seed` (or `node scripts/seed.js`)

---

## 11. Testing Strategy

### 11.1 Unit Tests (Jest)

Focus areas:
- Availability overlap algorithm (edge cases: adjacent bookings, buffer times, UTC boundary conditions)
- Price calculation with GST
- Input validation schemas (Zod)

```bash
npm test
```

### 11.2 Integration Tests

Focus areas:
- Complete booking flow: browse → select → reserve → payment form submit → confirm
- Concurrent reservation race condition (two requests for same slot simultaneously)
- Admin login, vehicle CRUD, reservation status updates
- Cancellation within / outside policy window

```bash
npm run test:integration
```

### 11.3 Accessibility Testing

- Run **axe-core** automated checks on all pages (integrate into Playwright/Cypress E2E)
- Manual keyboard-only navigation walkthrough of the booking flow
- Test with screen reader (NVDA/VoiceOver)

---

## 12. Deployment Guide

### 12.1 Provision VPS (Ubuntu 22.04, Sydney Region)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx, Certbot, Git, SQLite
sudo apt install -y nginx certbot python3-certbot-nginx git sqlite3

# Install PM2
sudo npm install -g pm2
```

### 12.2 Nginx Configuration

The full template is in `nginx.conf.example`. Key additions vs. the original spec: CSP header includes `font-src` for Google Fonts, `.env` is blocked, `gzip_static on`, `proxy_read_timeout 30s`, and separate access/error log paths.

```nginx
# /etc/nginx/sites-available/rental  (copy from nginx.conf.example)
server {
    listen 80;
    server_name rentals.facilitydomain.com.au;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rentals.facilitydomain.com.au;

    ssl_certificate     /etc/letsencrypt/live/rentals.facilitydomain.com.au/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rentals.facilitydomain.com.au/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none';" always;

    root /var/www/rental/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }

    location / {
        try_files $uri $uri/ /index.html;
        gzip_static on;
    }

    # Block sensitive files
    location /data/ { deny all; }
    location /.env  { deny all; }

    access_log /var/log/nginx/rental_access.log;
    error_log  /var/log/nginx/rental_error.log;
}
```

### 12.3 PM2 Process Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'rental-api',
    script: './src/server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    max_restarts: 10,
    restart_delay: 5000,
    error_file: '/var/log/rental/error.log',
    out_file:   '/var/log/rental/out.log'
  }]
};
```

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # generates systemd unit for auto-start on reboot
```

### 12.4 Let's Encrypt Certificate

```bash
sudo certbot --nginx -d rentals.facilitydomain.com.au
# Certbot auto-renews via systemd timer; verify with:
sudo systemctl status certbot.timer
```

### 12.5 Optional GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_KEY }}
          script: |
            cd /var/www/rental
            git pull
            npm ci --production
            cd frontend && npm ci && npm run build && cd ..
            pm2 reload rental-api
```

---

## 13. Cloud Hosting Cost Estimate

Target: **≤ AUD $35 / month**

### Option A — DigitalOcean Droplet (Recommended)

| Item | Monthly Cost (AUD est.) |
|---|---|
| Basic Droplet — 1 vCPU, 1 GB RAM, 25 GB SSD (Sydney region) | ~$10 |
| Weekly automated backups (DigitalOcean) | ~$2 |
| Domain renewal (com.au) | ~$2 |
| **Total** | **~$14 / month** |

### Option B — AWS Lightsail (Sydney ap-southeast-2)

| Item | Monthly Cost (AUD est.) |
|---|---|
| Lightsail instance — 1 vCPU, 1 GB RAM, 40 GB SSD | ~$10 |
| Manual snapshot (weekly) | ~$3 |
| Domain (Route 53) | ~$2 |
| **Total** | **~$15 / month** |

### Option C — AWS EC2 t4g.nano (Reserved 1-year)

| Item | Monthly Cost (AUD est.) |
|---|---|
| EC2 t4g.nano (1 vCPU, 512 MB RAM) | ~$4 |
| EBS gp3 20 GB | ~$3 |
| S3 backup (< 1 GB) | ~$0.03 |
| Elastic IP | ~$0 (attached) |
| **Total** | **~$7–10 / month** |

> All options are comfortably under AUD $35/month. DigitalOcean is recommended for simplicity (managed backups, intuitive interface, Sydney availability).

---

## 14. Monitoring & Observability

### 14.1 Application Health

```bash
# Health check endpoint
GET /api/v1/health
# Returns: { "status": "ok", "db": "ok", "uptime_seconds": 12345 }
```

Configure an uptime monitor (UptimeRobot free tier, or BetterUptime) to ping `/api/v1/health` every 5 minutes and alert via email.

### 14.2 Log Management

- PM2 rotates logs daily (configure `pm2-logrotate` module)
- Application logs use `pino` structured JSON: timestamp, level, request ID, route, latency
- Access logs via Nginx: `/var/log/nginx/rental_access.log`
- Error alerts: pipe `pino` ERROR-level logs to an email webhook

### 14.3 Database Integrity

Weekly integrity check via cron:

```bash
# crontab -e (root or deploy user)
0 2 * * 0 sqlite3 /var/www/rental/data/rental.sqlite "PRAGMA integrity_check;" \
  | mail -s "Rental DB integrity check" admin@facility.example.com.au
```

---

## 15. Backup & Recovery

### 15.1 Automated Daily Backup

```bash
#!/bin/bash
# /usr/local/bin/backup-rental-db.sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_PATH="/var/www/rental/data/rental.sqlite"
BACKUP_DIR="/var/backups/rental"

mkdir -p "$BACKUP_DIR"
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/rental_$TIMESTAMP.sqlite'"

# Keep last 14 days
find "$BACKUP_DIR" -name "rental_*.sqlite" -mtime +14 -delete

# Optional: sync to object storage
# rclone copy "$BACKUP_DIR" remote:rental-backups/
```

```bash
# crontab entry (run at 2:30 AM Sydney time = 16:30 UTC)
30 16 * * * /usr/local/bin/backup-rental-db.sh
```

### 15.2 Recovery Procedure

```bash
# Stop application
pm2 stop rental-api

# Restore from backup
cp /var/backups/rental/rental_20260615_163001.sqlite \
   /var/www/rental/data/rental.sqlite

# Verify integrity
sqlite3 /var/www/rental/data/rental.sqlite "PRAGMA integrity_check;"

# Restart application
pm2 start rental-api
```

---

## 16. Handoff Deliverables

Status key: ✅ Delivered · ⚠️ Outstanding

| Artefact | Status | Notes |
|---|---|---|
| `QUICKSTART.md` | ✅ | Quick-start, env vars, run commands, deployment summary |
| `migrations/001_initial_schema.sql` | ✅ | Full SQL schema as documented in §4.2 |
| `scripts/seed.js` | ✅ | 100 vehicles (5 types × 20); loop-generated with accessibility metadata |
| `scripts/migrate.js` | ✅ | Auto-creates `data/` dir; loads `.env` |
| `ecosystem.config.js` | ✅ | PM2 process configuration |
| `nginx.conf.example` | ✅ | Nginx site configuration template with full security headers |
| `.env.example` | ✅ | All env vars with comments; no secrets |
| `frontend/src/pages/Privacy.jsx` | ✅ | Privacy Policy embedded in the app at `/privacy` (APP 1, 3, 5, 6, 11, 12) |
| `frontend/src/pages/Terms.jsx` | ✅ | Terms & Conditions embedded at `/terms` (NSW-specific) |
| `openapi.yaml` | ⚠️ | Not yet created — generate from route definitions in `src/routes/` |
| `postman_collection.json` | ⚠️ | Not yet created — import `openapi.yaml` into Postman to generate |
| `tests/` | ⚠️ | Not yet created — see §11 for test strategy; Jest is configured in `package.json` |

### Outstanding Items Prioritised

1. **`openapi.yaml`** — Required for any third-party integrations or API documentation. Can be auto-generated with `swagger-jsdoc` or written by hand from §5.
2. **`tests/`** — Unit tests for `src/utils/pricing.js` (GST edge cases) and `src/routes/availability.js` (overlap algorithm) are highest priority before launch. Integration test for the concurrent booking race condition is strongly recommended given its data-integrity implications.
3. **Legal documents** — Privacy Policy and Terms & Conditions are currently embedded in the app UI. Before public launch, both must be reviewed by a solicitor experienced in NSW commercial and transport law. The UI versions are drafts only.

---

*This document is a living guide. Update the version number and date fields whenever material changes are made to the codebase.*
