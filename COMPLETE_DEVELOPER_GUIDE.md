# Special Need Vehicle Rental
## Complete Developer Guide

**Version:** 2.0.0 (updated with customer accounts, promo codes, refund workflow, enterprise redesign)
**Last Updated:** June 2026
**Business:** SwiftRide Rentals Pty Ltd — 483 Hume Highway, Yagoona NSW 2199
**Jurisdiction:** New South Wales, Australia
**Audience:** Software developers, DevOps engineers, technical leads, and business owners overseeing a developer handoff
**Production server:** `209.38.29.102` (DigitalOcean SYD1)
**Live URL:** https://swiftriderentals.com.au — see `PRODUCTION.md` for full operational reference

> **What this document is:** A single, self-contained reference that merges the Application Architecture & Developer Guide (v1.1.0) with the Developer Environment Guide (v1.0.0) into one downloadable file. Every section from both source documents is present here. You do not need to consult the other documents.

---

## Table of Contents

### Part 1 — Architecture & Design
1. [Overview & Purpose](#1-overview--purpose)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack with Exact Versions](#3-technology-stack-with-exact-versions)
4. [Data Model](#4-data-model)
5. [API Specification](#5-api-specification)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Payment Integration — Stripe & Employee Codes](#7-payment-integration--stripe--employee-codes)
8. [Security & Compliance](#8-security--compliance)

### Part 2 — Developer Environments
9. [Environment Overview](#9-environment-overview)
10. [Local Development Environment](#10-local-development-environment)
11. [Local Production Simulation](#11-local-production-simulation)
12. [Cloud Production Environment](#12-cloud-production-environment)

### Part 3 — Operations
13. [Database Migrations & Seeding](#13-database-migrations--seeding)
14. [Testing Strategy](#14-testing-strategy)
15. [Email (SMTP) Setup](#15-email-smtp-setup)
16. [Domain & DNS](#16-domain--dns)
17. [Monitoring & Observability](#17-monitoring--observability)
18. [Backup & Recovery](#18-backup--recovery)

### Part 4 — Reference
19. [Cloud Hosting Cost Estimate](#19-cloud-hosting-cost-estimate)
20. [Environment Comparison Table](#20-environment-comparison-table)
21. [Troubleshooting](#21-troubleshooting)
22. [Handoff Deliverables](#22-handoff-deliverables)

---

# PART 1 — ARCHITECTURE & DESIGN

---

## 1. Overview & Purpose

Special Need Vehicle Rental is a lean, secure web application that allows the public to browse and book the facility's **already-owned vehicles** during their idle hours — when they are not in use for resident transport. It is presented as a single external link embedded in the existing facility website. The application is designed to be:

- **Minimal in scope** — up to 100 vehicles, low traffic, single region
- **Low-cost** — targets under AUD $35/month total infrastructure
- **NSW-compliant** — privacy, accessibility, GST and insurance requirements observed
- **Extensible** — payment gateway integration is deferred to Phase 2; all scaffolding is already in place

### 1.1 Integration Pattern

```
Facility Production Website
        │
        │  <a href="https://rentals.facility.example.au">
        ▼
Special Need Vehicle Rental (standalone subdomain)
        │
        ├── Public Booking UI  ──► REST API ──► SQLite DB
        └── Admin UI           ──► REST API ──► SQLite DB
```

The application lives on its own subdomain (e.g. `rentals.facilitydomain.com.au`) and shares no session or data with the parent site. Cross-origin resource sharing (CORS) is restricted to the parent domain only.

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
│         │             │  │    (node-cache, 30-second TTL)  │  │   │
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
   Public Internet                Admin (browser,
   (Renters)                       IP-restricted optional)
```

### 2.2 Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS | Wide ecosystem; async I/O suits booking concurrency |
| Database | SQLite | Zero managed-DB cost; 100 vehicles = < 5 MB data |
| Caching | node-cache (in-process) | Availability queries are hot; 30-second TTL, invalidated on writes |
| Frontend | React 18 SPA + Vite | Modern component model with fast HMR development experience |
| Reverse Proxy | Nginx 1.24 | TLS termination, gzip, static file serving |
| Process Manager | PM2 5.x | Auto-restart, crash recovery, log management, systemd integration |
| TLS | Let's Encrypt / Certbot | Free, auto-renewing every 90 days |

### 2.3 Two-Server Development vs Single-Server Production

**Development (two servers):**

```
Browser (http://localhost:5173)
    │
    ├──► Vite Dev Server (5173) ─── React UI + Hot Module Replacement
    │          └── /api/* proxied to ►
    └──► Node.js Express API (8080) ─── REST API + --watch auto-restart
               └──► SQLite file: ./data/rental.sqlite
```

**Production (single server behind Nginx):**

```
Internet → Nginx (443) → Static React files (frontend/dist/) served directly
                      → /api/* proxy_pass → Node.js Express (8080) via PM2
                                             └──► SQLite file: /var/www/rental/data/rental.sqlite
```

In development, the Vite proxy (in `frontend/vite.config.js`) transparently forwards `/api/*` requests to port 8080. The browser sees everything on the same origin — no CORS issues. In production, Nginx does the same forwarding role.

### 2.4 Timezone & Locale

- All dates stored in SQLite as **ISO 8601 UTC** strings (`2026-06-15T04:00:00Z`)
- All dates displayed to users in **Australia/Sydney** (AEST UTC+10 / AEDT UTC+11)
- The UI explicitly labels timezone on every date/time field
- Currency: **AUD** with two decimal places; all prices are GST-inclusive (10%)
- GST extracted for BAS reporting: `Math.round(totalCents * 0.10 / 1.10)`

---

## 3. Technology Stack with Exact Versions

### 3.1 Backend npm Packages

These are the exact version specifiers from `package.json`. The `^` prefix means "compatible with this minor version" — npm will install the newest patch release.

| Package | Version Spec | Purpose |
|---|---|---|
| `express` | `^4.18.3` | HTTP server framework |
| `better-sqlite3` | `^9.4.3` | Synchronous SQLite driver — no callback complexity; WAL mode enabled |
| `node-cache` | `^5.1.2` | In-memory availability cache, 30-second TTL |
| `zod` | `^3.22.4` | Runtime schema validation on all API inputs (server-side) |
| `express-session` | `^1.18.0` | Server-side session for admin authentication |
| `bcrypt` | `^5.1.1` | Password hashing for admin credentials (cost factor 12) |
| `express-rate-limit` | `^7.2.0` | Rate limiting: 100 req/15min booking; 20/min payment form |
| `nodemailer` | `^6.9.12` | SMTP email: booking confirmations, staff alerts, cancellations |
| `pino` | `^8.19.0` | Structured JSON logging — no PII in log bodies |
| `pino-http` | `^10.1.0` | Per-request HTTP logging middleware |
| `helmet` | `^7.1.0` | Common security response headers |
| `cors` | `^2.8.5` | CORS — allows Vite dev server (5173) to call the API (8080) |
| `jest` *(dev)* | `^29.7.0` | Unit test runner |

### 3.2 Frontend npm Packages

These are the exact version specifiers from `frontend/package.json`.

| Package | Version Spec | Purpose |
|---|---|---|
| `react` | `^18.3.1` | UI framework |
| `react-dom` | `^18.3.1` | DOM renderer for React |
| `react-router-dom` | `^6.23.1` | Client-side routing (SPA) |
| `date-fns` | `^3.6.0` | Date manipulation utilities |
| `date-fns-tz` | `^3.1.3` | Timezone conversion — Australia/Sydney display |
| `react-hook-form` | `^7.51.3` | Installed but not actively used; validation is native React state |
| `vite` *(dev)* | `^5.2.11` | Build tool and dev server with Hot Module Replacement |
| `@vitejs/plugin-react` *(dev)* | `^4.3.0` | Vite plugin for React JSX and Fast Refresh |
| `tailwindcss` *(dev)* | `^3.4.3` | Utility-first CSS framework |
| `postcss` *(dev)* | `^8.4.38` | CSS processing pipeline (required by Tailwind) |
| `autoprefixer` *(dev)* | `^10.4.19` | Adds vendor prefixes to CSS output |
| `@types/react` *(dev)* | `^18.3.3` | TypeScript types for IDE autocomplete |
| `@types/react-dom` *(dev)* | `^18.3.0` | TypeScript types for React DOM |

> **Implementation note:** shadcn/ui, and react-datepicker were not used in the built implementation. Custom accessible components were built with Tailwind CSS directly — this keeps the dependency footprint minimal and gives full control over WCAG 2.1 AA compliance. Native `<input type="datetime-local">` is used for date/time picking.

### 3.3 Runtime & Server Tools

| Tool | Version | Source | Notes |
|---|---|---|---|
| **Node.js** | **20.x LTS** (min 20.11.0) | https://nodejs.org/en/download/ | `iron` release. Do NOT use Node 18 (near EOL), 21/22 (not LTS). |
| **npm** | **10.x** | Bundled with Node 20 | Do not install separately. |
| **Git** | **2.40+** | https://git-scm.com/downloads | Required for version control and CI/CD deploy. |
| **Ubuntu** | **22.04.5 LTS** (Jammy) | DigitalOcean droplet image | Support until April 2027. **Deployed: 22.04.5** |
| **Nginx** | **1.30.2** (stable) | Nginx official apt repo | Ubuntu's default apt ships 1.18.x — always use the official Nginx repo. **Deployed: 1.30.2** |
| **PM2** | **7.0.1** | `npm install -g pm2` | Process manager: auto-restart, log rotation, systemd integration. **Deployed: 7.0.1** |
| **Certbot** | **5.6.0** | `snap install --classic certbot` | Manages free Let's Encrypt TLS certificates. Auto-renews every 90 days. **Deployed: 5.6.0** |
| **SQLite CLI** | **3.37.2** | `apt install sqlite3` | Ships with Ubuntu 22.04. Only needed for manual DB inspection. **Deployed: 3.37.2** |

---

## 4. Data Model

### 4.1 Entity-Relationship Overview

```
employees ───────────────────────┐
                                 │ 1:M
                                 ▼
                          booking_codes ──────────┐
                                                  │ M:1 (when used)
                   promo_codes ──────────┐        │
                                         │ M:1    │
vehicles ────────┐                       │        │
                 │ 1:M                   │        │
                 ▼                       ▼        ▼
           reservations ◄─────────────────────────────
                 │                       │
                 │ 1:M                   │ 1:M
                 ▼                       ▼
         booking_feedback        refund_requests
                 │
          (customer data embedded in reservations)
                 │
           audit_log ◄── append-only audit trail

users ── optional account; matched to reservations by customer_email COLLATE NOCASE

settings ── single-row key/value store (cancellation policy thresholds)
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
                      -- 'pending' | 'confirmed' | 'picked_up' | 'completed' | 'cancelled'
  price_cents         INTEGER NOT NULL DEFAULT 0,
  gst_cents           INTEGER NOT NULL DEFAULT 0,
  deposit_cents       INTEGER NOT NULL DEFAULT 0,
  payment_status      TEXT    NOT NULL DEFAULT 'none',
                      -- 'none' | 'paid' | 'code_redeemed' | 'refunded'
  payment_token       TEXT,             -- Stripe PaymentIntent.id (e.g. pi_3xxx); null for code bookings

  -- Phase 1 legacy columns — not written in Phase 2; retained for historical data integrity
  cardholder_name     TEXT,
  card_last4          TEXT,
  expiry_month        TEXT,
  expiry_year         TEXT,

  terms_accepted      INTEGER NOT NULL DEFAULT 0, -- boolean 0|1
  terms_accepted_at   TEXT,             -- ISO UTC timestamp (NSW Electronic Transactions Act 2000)
  cancellation_reason TEXT,
  notes               TEXT,             -- admin staff notes
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT
);

-- Audit log (append-only — never updated or deleted)
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

-- ============================================================
-- migrations/002_employees_and_codes.sql
-- ============================================================

-- Staff employee table
CREATE TABLE IF NOT EXISTS employees (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  emp_id     TEXT    NOT NULL UNIQUE,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE,
  phone      TEXT,
  status     TEXT    NOT NULL DEFAULT 'active',   -- 'active' | 'inactive'
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

-- One-time booking codes issued to employees (free hire, no payment required)
CREATE TABLE IF NOT EXISTS booking_codes (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  code                 TEXT    NOT NULL UNIQUE,           -- 12 chars: 11 alphanumeric + 1 special
  employee_id          INTEGER NOT NULL REFERENCES employees(id),
  generated_by         TEXT    NOT NULL DEFAULT 'admin',  -- admin username
  status               TEXT    NOT NULL DEFAULT 'active', -- 'active' | 'used' | 'expired' | 'disabled'
  expires_at           TEXT    NOT NULL,                  -- ISO UTC, 24 hours after generation
  used_at              TEXT,
  used_reservation_id  INTEGER REFERENCES reservations(id),
  created_at           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_codes_code     ON booking_codes(code);
CREATE INDEX IF NOT EXISTS idx_codes_employee ON booking_codes(employee_id);
CREATE INDEX IF NOT EXISTS idx_codes_status   ON booking_codes(status);

-- ============================================================
-- migrations/003_settings_and_promo_codes.sql
-- ============================================================

-- Key/value settings store (single-row; keys enumerated below)
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Promo codes — public-facing discount codes distributed to customers
CREATE TABLE IF NOT EXISTS promo_codes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  code           TEXT    NOT NULL UNIQUE,          -- uppercase alphanumeric, 8–12 chars
  generated_by   TEXT    NOT NULL DEFAULT 'admin',
  status         TEXT    NOT NULL DEFAULT 'active', -- 'active' | 'used' | 'expired' | 'disabled'
  expires_at     TEXT,                              -- ISO UTC; null = never expires
  used_at        TEXT,
  used_reservation_id INTEGER REFERENCES reservations(id),
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_promo_code   ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_status ON promo_codes(status);

-- ============================================================
-- migrations/004_cancellation_policy_and_refunds.sql
-- ============================================================

-- Adds cancellation policy columns to settings (populated with defaults on first use)

-- Pending refund queue for customer-initiated cancellations
CREATE TABLE IF NOT EXISTS refund_requests (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id  INTEGER NOT NULL REFERENCES reservations(id),
  amount_cents    INTEGER NOT NULL DEFAULT 0,
  reason          TEXT,
  status          TEXT    NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  reviewed_by     TEXT,
  reviewed_at     TEXT,
  stripe_refund_id TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_refunds_status        ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refunds_reservation   ON refund_requests(reservation_id);

-- ============================================================
-- migrations/005_user_accounts.sql
-- ============================================================

-- Customer accounts (optional — bookings work without an account)
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  email        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  phone        TEXT,
  password_hash TEXT   NOT NULL,              -- bcrypt, cost factor 12
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email COLLATE NOCASE);

-- Star-rating feedback submitted after a completed hire
CREATE TABLE IF NOT EXISTS booking_feedback (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL UNIQUE REFERENCES reservations(id),
  rating         INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- migrations/006_promo_code_discount.sql
-- ============================================================

-- Adds per-code discount percentage (replaces single global rate)
ALTER TABLE promo_codes ADD COLUMN discount_percent INTEGER NOT NULL DEFAULT 0;
```

### 4.3 Availability Overlap Logic

A vehicle is **available** for interval `[NEW_START, NEW_END)` when no existing active reservation conflicts:

```sql
-- Overlap check: finds conflicting reservations for a vehicle
SELECT id FROM reservations
WHERE vehicle_id = ?
  AND status IN ('pending', 'confirmed', 'picked_up')
  AND NOT (end_utc <= ? OR start_utc >= ?)
--                  ↑ NEW_START        ↑ NEW_END
```

This uses the Allen interval complement: two intervals do **not** overlap if one ends before the other starts, or vice versa. The `NOT` of that is the overlap condition.

**Critical:** This query must run inside a `BEGIN IMMEDIATE TRANSACTION`. This prevents the race condition where two simultaneous booking requests both see the vehicle as available and both succeed — only the first transaction to acquire the write lock proceeds; the second waits, then re-checks and correctly returns a 409 conflict.

### 4.4 GST Calculation

All prices are stored as **GST-inclusive cents**. The GST component is extracted for receipts and BAS reporting:

```javascript
// GST = total × 10 / 110  (since price = subtotal × 1.10)
const gstCents = Math.round(totalCents * GST_RATE / (1 + GST_RATE));
// e.g. $165.00 total → gst = Math.round(16500 * 0.10 / 1.10) = 1500 cents = $15.00
```

---

## 5. API Specification

**Base prefix:** `/api/v1`
**Content-Type:** `application/json`
**Dates:** ISO 8601 UTC strings in all request and response bodies
**Authentication:** Admin endpoints require an admin session cookie (`req.session.adminId`). Customer auth endpoints require a customer session cookie (`req.session.userId`). Public endpoints are unauthenticated but rate-limited.

### 5.1 Public Endpoints

#### `GET /api/v1/vehicles`

Returns all active vehicles with pricing.

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Toyota HiAce Wheelchair Van 1",
      "type": "wheelchair",
      "capacity": 4,
      "accessibility_notes": "Rear wheelchair ramp, 2 anchor points",
      "hourly_rate_aud": "30.00",
      "daily_rate_aud": "165.00",
      "buffer_minutes": 60,
      "photos": []
    }
  ]
}
```

---

#### `GET /api/v1/availability`

Returns vehicles available for a given time window. Results are cached in-memory for 30 seconds per `start+end+type` key. Cache is invalidated on any reservation write.

**Query parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `start` | ISO 8601 UTC | Yes | Requested start time |
| `end` | ISO 8601 UTC | Yes | Requested end time |
| `type` | string | No | Filter by vehicle type (`sedan`, `wagon`, `van`, `wheelchair`) |

**Response 200:**
```json
{
  "requested_start": "2026-06-15T04:00:00Z",
  "requested_end":   "2026-06-16T04:00:00Z",
  "timezone_display": "Australia/Sydney",
  "available": [ { "id": 1, "name": "Toyota HiAce Wheelchair Van 1", "price_for_period_aud": "165.00" } ],
  "unavailable": [ { "id": 2, "name": "Toyota HiAce Wheelchair Van 2", "reason": "booked" } ]
}
```

---

#### `POST /api/v1/reservations`

Creates a new reservation. Validates availability atomically inside a `BEGIN IMMEDIATE TRANSACTION`.

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
| 201 | Reservation created; returns full reservation object with `ref_number` |
| 409 | Vehicle no longer available for requested window (concurrent booking) |
| 422 | Validation error — missing fields, invalid dates, invalid phone format |
| 429 | Rate limit exceeded (100 req/15min per IP) |

---

#### `GET /api/v1/reservations/:id`

Returns a reservation by ID. Requires matching customer email as query param `?email=` for security — customers can only see their own reservations.

---

#### `PATCH /api/v1/reservations/:id/cancel`

Customer self-cancellation within policy window.

**Request body:**
```json
{ "customer_email": "jane.smith@example.com", "reason": "Plans changed" }
```

---

#### `POST /api/v1/payments/intent`

Creates a Stripe PaymentIntent for an existing `pending` reservation. Called by the frontend when the customer selects "Pay by Card" and clicks "Continue to Card Payment".

**Request body:**
```json
{ "reservation_id": 42 }
```

**Response 200:**
```json
{ "client_secret": "pi_3xxx_secret_xxx" }
```

The `client_secret` is passed to Stripe's `confirmPayment()` on the frontend. Card data never passes through the application server — it goes directly from the browser to Stripe.

---

#### `GET /api/v1/payments/verify`

Called by the Confirmation page after Stripe redirects back to the site. Verifies PaymentIntent status with Stripe and updates the reservation's `payment_status` accordingly.

**Query parameters:** `payment_intent` (Stripe PaymentIntent ID), `reservation_id`

**Response 200:**
```json
{ "status": "succeeded", "reservation": { "id": 42, "payment_status": "paid", ... } }
```

---

#### `POST /api/v1/payments/webhook`

Stripe webhook endpoint. Receives signed events from Stripe for async payment confirmations. Verifies the Stripe signature using `STRIPE_WEBHOOK_SECRET` (skipped in development if the variable is unset). Updates `payment_status = 'paid'` on `payment_intent.succeeded` events.

Register this URL in Stripe Dashboard → Developers → Webhooks. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`.

---

#### `GET /api/v1/health`

Health check. Used by uptime monitoring services (UptimeRobot etc.) and PM2.

**Response 200:**
```json
{ "status": "ok", "db": "ok", "uptime_seconds": 12345 }
```

---

#### `POST /api/v1/promo/validate`

Validates a promo code without redeeming it. Called on every keystroke in the booking form promo field.

**Request body:**
```json
{ "code": "SUMMER20" }
```

**Response 200 (valid):**
```json
{ "valid": true, "discount_percent": 20, "code": "SUMMER20" }
```

**Response 200 (invalid):**
```json
{ "valid": false, "error": "Code not found / expired / already used" }
```

The discount is applied to the daily rate only: `discountedDailyRate = dailyRate × (1 − discount_percent / 100)`. The code is not marked as used until the reservation is successfully created.

---

#### `GET /api/v1/public/cancellation-policy`

Returns the current cancellation policy thresholds (read from the `settings` table). Used by the booking form to display the policy to customers before they accept terms.

**Response 200:**
```json
{
  "full_refund_hours": 48,
  "partial_refund_hours": 24,
  "partial_refund_percent": 50
}
```

---

### 5.2 Admin Endpoints (Protected — Session Required)

All admin routes require a valid admin session obtained via `POST /api/v1/admin/login`. Sessions expire after 8 hours.

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/admin/login` | Authenticate admin (username + bcrypt password) |
| POST | `/api/v1/admin/logout` | Invalidate session |
| GET  | `/api/v1/admin/me` | Returns current admin username (used by frontend for session poll) |
| GET  | `/api/v1/admin/reservations` | List all reservations; filter by `status`, `vehicle_id`, `from`, `to`, `email` |
| GET  | `/api/v1/admin/reservations/:id` | Single reservation detail (includes `vehicle_name`) |
| PATCH | `/api/v1/admin/reservations/:id` | Update `status`, `payment_status`, and/or `notes` |
| POST | `/api/v1/admin/reservations/:id/cancel` | Admin-initiated cancel — fires immediate full Stripe refund (T&C §2.5f), emails customer |
| GET  | `/api/v1/admin/vehicles` | List all vehicles including `maintenance` and `retired` |
| POST | `/api/v1/admin/vehicles` | Add new vehicle |
| PATCH | `/api/v1/admin/vehicles/:id` | Update vehicle details / set maintenance window |
| DELETE | `/api/v1/admin/vehicles/:id` | Retire vehicle (soft-delete — sets `status = 'retired'`) |
| GET  | `/api/v1/admin/reports/csv` | Export reservations as CSV; accepts `from` and `to` ISO query params |
| GET  | `/api/v1/admin/audit` | View audit log (last 500 entries, newest first) |
| GET  | `/api/v1/admin/promo-codes` | List all promo codes |
| POST | `/api/v1/admin/promo-codes` | Generate a batch of promo codes (`count`, `discount_percent`, optional `expires_at`) |
| PATCH | `/api/v1/admin/promo-codes/:id/disable` | Disable an active promo code |
| GET  | `/api/v1/admin/refund-requests` | List refund requests, filterable by status |
| POST | `/api/v1/admin/refund-requests/:id/approve` | Approve a pending refund — fires Stripe refund, emails customer |
| POST | `/api/v1/admin/refund-requests/:id/reject` | Reject a pending refund request |
| GET  | `/api/v1/admin/settings` | Read cancellation policy settings |
| POST | `/api/v1/admin/settings` | Update cancellation policy (`full_refund_hours`, `partial_refund_hours`, `partial_refund_percent`) |

### 5.3 Employee & Booking Code Endpoints (Admin Protected)

| Method | Path | Description |
|---|---|---|
| GET    | `/api/v1/admin/employees` | List all employees |
| POST   | `/api/v1/admin/employees` | Create employee (`emp_id`, `name`, `email`, `phone`) |
| PATCH  | `/api/v1/admin/employees/:id` | Update employee details or status |
| DELETE | `/api/v1/admin/employees/:id` | Deactivate employee (soft delete) |
| POST   | `/api/v1/admin/employees/:id/generate-code` | Generate a booking code for employee — stores record and sends email |
| GET    | `/api/v1/admin/employees/codes/all` | List all booking codes with employee info (auto-expires stale active codes) |
| PATCH  | `/api/v1/admin/employees/codes/:id/disable` | Disable an active code immediately |

### 5.4 Public Code Validation

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/codes/validate` | Validate a booking code without redeeming it — returns `{ valid, employee_name, expires_at }` |

**Code format:** 12 characters — 11 uppercase alphanumeric + 1 special character (`!@#$%&*`) inserted at a random position. Example: `AB3C7KP!9MN2`

**Using a code in a reservation:** Add `booking_code` field to `POST /api/v1/reservations`. If valid, the code is redeemed and the reservation is created with `status=confirmed` and `payment_status=code_redeemed` atomically. No Stripe PaymentIntent is created.

### 5.5 Customer Auth Endpoints

Customer accounts are optional — guests can still book without one. Accounts use a separate session namespace (`req.session.userId`) that is completely independent of the admin session (`req.session.adminId`).

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new account (`name`, `email`, `phone`, `password`). Password hashed with bcrypt cost 12. |
| POST | `/api/v1/auth/login` | Sign in — sets `req.session.userId`. Returns `{ id, name, email, phone }`. |
| POST | `/api/v1/auth/logout` | Destroy customer session. |
| GET  | `/api/v1/auth/me` | Returns current customer user, or 401 if not signed in. Called on every page load to restore session. |
| PATCH | `/api/v1/auth/profile` | Update `name` and/or `phone` for the signed-in customer. |

### 5.6 Customer Bookings Endpoints (Customer Session Required)

| Method | Path | Description |
|---|---|---|
| GET  | `/api/v1/my-bookings` | Returns all reservations where `customer_email COLLATE NOCASE` matches the signed-in user's email. Includes guest bookings made before account creation. |
| POST | `/api/v1/my-bookings/:id/feedback` | Submit star rating (`rating` 1–5, optional `comment`) for a completed booking. One submission per reservation (UNIQUE constraint on `booking_feedback.reservation_id`). |

---

## 6. Frontend Architecture

### 6.1 Page Structure & Routes

```
/                        Landing — Aurora Indigo hero, fleet cards, how-it-works (enterprise redesign)
/availability            Availability search + results (date/time/type filter)
/vehicles/:id            Vehicle detail — accessibility notes, price summary
/booking                 Multi-step booking form (query: vehicle_id, start, end)
  Step 1: Personal details (auto-filled from account if signed in; promo code field)
  Step 2: Terms & conditions acceptance (scrollable, timestamped checkbox)
  Step 3: Payment — choose Pay by Card (Stripe) or Employee Booking Code
/booking/confirmation    Confirmation + booking summary; verifies Stripe PaymentIntent status
/cancel/:id              Customer self-cancellation (email verification required)
/login                   Customer sign in / register — tabbed AuthPage; redirects to /my-bookings
/my-bookings             Customer bookings dashboard (session required → redirects to /login)
                         Active: status badge + cancel link
                         Completed without feedback: 5-star rating form + comment
/privacy                 Privacy Policy (APP-compliant, NSW)
/terms                   Terms & Conditions (NSW-specific, Electronic Transactions Act 2000)
/admin/login             Admin login form
/admin                   Redirects to /admin/dashboard
/admin/dashboard         Stats, today's reservations, pending payment actions
/admin/reservations      Filterable reservations list
/admin/reservations/:id  Reservation detail + inline status/payment/notes editor + admin-cancel button
/admin/vehicles          Fleet list + add/edit/retire form
/admin/employees         Employee list + add/edit/deactivate + generate booking codes
/admin/codes             Booking code list + filter by status + disable codes
/admin/promo-codes       Promo code generation (discount % per batch) + cancellation policy settings
/admin/refund-requests   Pending refund queue — approve triggers Stripe refund + customer email
/admin/reports           CSV export + audit log link
```

### 6.2 File Tree (`frontend/src/`)

```
pages/
  Landing.jsx             (Aurora Indigo enterprise hero; rainbow fleet cards teal/violet/amber/rose)
  Availability.jsx
  VehicleDetail.jsx
  Booking.jsx             (all 3 steps; Step 1 auto-fills from user session; promo code field)
  Confirmation.jsx        (verifies Stripe PaymentIntent via /payments/verify)
  Cancel.jsx
  AuthPage.jsx            (combined Sign In / Register — tabbed; redirects to /my-bookings on success)
  MyBookings.jsx          (active bookings + cancel; completed bookings + 5-star feedback form)
  Privacy.jsx
  Terms.jsx
  admin/
    Login.jsx
    Dashboard.jsx
    Reservations.jsx
    ReservationDetail.jsx (includes admin-cancel button — fires immediate Stripe refund)
    Vehicles.jsx
    Employees.jsx         (add/deactivate employees, generate booking codes)
    BookingCodes.jsx      (list all codes, filter by status, disable active codes)
    PromoCodes.jsx        (generate batches with discount %; cancellation policy config)
    RefundRequests.jsx    (pending queue; approve triggers Stripe refund + customer email)
    Reports.jsx
components/
  Header.jsx              (dark gradient; logo + NSW subtitle; user dropdown; admin badge)
  Footer.jsx              (dark gradient matching header; brand/legal/compliance columns)
  VehicleCard.jsx
  BookingProgress.jsx
  AdminNav.jsx            (shared navigation bar included on all admin pages)
  Alert.jsx               (AlertInfo, AlertWarning, AlertError, AlertSuccess)
hooks/
  useAdminAuth.js         (polls /api/v1/admin/me to check session validity)
  useUserAuth.jsx         (UserAuthProvider context; login/register/logout; pre-fills booking form)
utils/
  api.js                  (all fetch() wrappers for the REST API)
  formatters.js           (formatAUD, formatSydney, refNum, vehicleTypeLabel,
                           statusBadgeClass, paymentBadgeClass)
```

### 6.3 Booking Reference Number Format

Generated in both backend (`src/utils/email.js`) and frontend (`src/utils/formatters.js`) for display:

```
SNVR-YYYYMMDD-NNN
e.g. SNVR-20260615-042
```

Where `YYYYMMDD` is the creation date in Sydney timezone and `NNN` is the zero-padded reservation ID.

### 6.4 Accessibility Requirements (WCAG 2.1 Level AA)

The application must conform to **WCAG 2.1 Level AA** as required by the Australian Government's Digital Service Standard and consistent with the *Disability Discrimination Act 1992 (Cth)* and *Disability Inclusion Act 2014 (NSW)*:

- All form inputs have associated `<label>` elements
- All interactive components are keyboard navigable (Tab/Shift+Tab, Enter, Space, Escape)
- Colour contrast ratio: minimum 4.5:1 for normal text, 3:1 for large text
- No information conveyed by colour alone (icons + text always paired)
- All images have descriptive `alt` text
- Error messages programmatically associated with fields via `aria-describedby`
- Focus management: on booking step change, focus moves to the new step heading (`headingRef.current?.focus()`)
- Minimum touch target size: 44×44px
- ARIA live regions announce dynamic updates (e.g. "Vehicle no longer available")
- Semantic HTML5 landmarks: `<header>`, `<main>`, `<nav>`, `<footer>`, `<section>`
- Skip-to-content link in `frontend/index.html` (first element in DOM, visible on focus)
- `lang="en-AU"` on `<html>` element

---

## 7. Payment Integration — Stripe, Promo Codes & Refunds

The application supports two payment paths on Step 3 of the booking form.

### 7.1 Path A — Pay by Card (Stripe Phase 2)

The customer selects "Pay by Card" and clicks "Continue to Card Payment". The flow:

1. **Frontend** calls `POST /api/v1/payments/intent` with the `reservation_id`
2. **Backend** creates a Stripe `PaymentIntent` (server-side, using `STRIPE_SECRET_KEY`) and returns the `client_secret`
3. **Frontend** renders the **Stripe Payment Element** using the `client_secret` — the customer sees card fields, Apple Pay, and Google Pay (if supported by their browser)
4. Customer clicks **"Pay $X.XX AUD"** — card data goes **directly from the browser to Stripe** using `stripe.confirmPayment()`. It never touches the application server.
5. Stripe redirects the browser back to `/booking/confirmation?payment_intent=pi_xxx&reservation_id=42`
6. **Confirmation page** calls `GET /api/v1/payments/verify?payment_intent=pi_xxx&reservation_id=42`
7. **Backend** verifies the PaymentIntent status with Stripe and sets `payment_status = 'paid'`
8. Confirmation page shows "Booking Confirmed — Payment received" in green

**Stripe webhook** (`POST /api/v1/payments/webhook`) provides a backup confirmation path for async events. Register it in Stripe Dashboard with events `payment_intent.succeeded` and `payment_intent.payment_failed`. The `STRIPE_WEBHOOK_SECRET` environment variable enables signature verification.

**Current status:** Live on HTTPS at swiftriderentals.com.au with **test keys** (`sk_test_...` / `pk_test_...`). Switch to live keys before accepting real payments — see `PRODUCTION.md`.

### 7.2 Path B — Employee Booking Code (no payment)

The customer selects "Employee Code" and enters their 12-character code. The flow:

1. As the user types, the frontend validates the code via `POST /api/v1/codes/validate` (non-destructive — does not redeem the code)
2. Customer clicks **"Complete Booking with Code"**
3. Backend creates the reservation and marks the code as used in a **single atomic `BEGIN IMMEDIATE TRANSACTION`** — prevents any race condition where two bookings could attempt to use the same code
4. On success: reservation is created with `status = 'confirmed'` and `payment_status = 'code_redeemed'`
5. Customer is taken directly to the Confirmation page — no Stripe involved

If the code is invalid, expired, already used, or disabled, a specific error message is shown inline.

### 7.3 DB Payment Fields

| Column | Phase | Notes |
|---|---|---|
| `payment_token` | Phase 2 | Stores the Stripe `PaymentIntent.id` (e.g. `pi_3xxx`) |
| `payment_status` | Both | `none` → `paid` (card) or `code_redeemed` (code) |
| `cardholder_name` | Phase 1 legacy | No longer populated in Phase 2; kept for historical records |
| `card_last4` | Phase 1 legacy | No longer populated in Phase 2; kept for historical records |
| `expiry_month` | Phase 1 legacy | No longer populated in Phase 2; kept for historical records |
| `expiry_year` | Phase 1 legacy | No longer populated in Phase 2; kept for historical records |

> The Phase 1 card-capture columns are retained in the schema for data integrity on any records created prior to the Phase 2 launch. They are not written to in the current codebase.

### 7.4 PCI Scope

In the current Stripe Phase 2 implementation, the application server is **entirely out of PCI scope**. Card numbers, CVCs, and expiry dates never pass through the Node.js process — they go directly from the customer's browser to Stripe's servers. Only the Stripe `PaymentIntent.id` is stored. This is the safest possible integration model.

### 7.5 Promo Code Discounts

Promo codes carry a `discount_percent` (1–100) set at generation time. Each batch can have a different percentage — different groups of customers can receive different rates simultaneously without any code change.

Discount calculation on the booking form:

```javascript
// Applied to daily rate only; hourly rate is unaffected
const discountedDailyRate = dailyRate * (1 - discount_percent / 100);
```

The code is validated (non-destructively) via `POST /api/v1/promo/validate` on each keystroke. The actual redemption — marking the code as `used` and linking it to the reservation — happens atomically inside the `POST /api/v1/reservations` transaction.

### 7.6 Refund Workflow

Two distinct refund paths exist, depending on who initiates the cancellation.

#### Customer-initiated cancellation

1. Customer visits `/cancel/:id` (link in confirmation email) or clicks Cancel in My Bookings
2. `PATCH /api/v1/reservations/:id/cancel` is called with their email for verification
3. Backend checks cancellation policy (`settings` table) to calculate refund entitlement
4. A `refund_requests` row is inserted with `status='pending'` and the calculated `amount_cents`
5. The reservation status is set to `cancelled`
6. Admin sees the pending item at `/admin/refund-requests`
7. Admin clicks **Approve** → `POST /api/v1/admin/refund-requests/:id/approve`
8. Backend calls `stripe.refunds.create({ payment_intent: row.payment_token, amount: amount_cents })`
9. Customer receives an email: "Expect your refund within 7–10 business days"

#### Admin-initiated cancellation

1. Admin clicks "Cancel This Booking" on the reservation detail page
2. `POST /api/v1/admin/reservations/:id/cancel` is called
3. Backend immediately calls `stripe.refunds.create(...)` for the **full** amount (T&C §2.5f)
4. Reservation status → `cancelled`, `payment_status` → `refunded`
5. Customer receives an automatic email notification
6. **No pending refund request is created** — it bypasses the review queue entirely

#### Cancellation policy configuration

Stored in the `settings` table and configurable from `/admin/promo-codes` (Cancellation Policy section):

| Key | Default | Meaning |
|---|---|---|
| `full_refund_hours` | `48` | Cancellations more than this many hours before pickup → 100% refund |
| `partial_refund_hours` | `24` | Cancellations between this and `full_refund_hours` before pickup → partial refund |
| `partial_refund_percent` | `50` | Percentage refunded in the partial window |
| Below `partial_refund_hours` | — | 0% refund (no refund) |

---

## 8. Security & Compliance

### 8.1 Transport Security

- All traffic HTTPS; HTTP redirects to HTTPS via Nginx (301)
- TLS 1.2 minimum; TLS 1.3 preferred
- HSTS header in production: `max-age=31536000; includeSubDomains`
- Let's Encrypt cert auto-renewing via Certbot systemd timer

### 8.2 Application Security Controls

| Control | Implementation |
|---|---|
| Input validation | Zod schemas on all API inputs (server-side); client-side mirrors for UX |
| SQL injection | Parameterised queries via `better-sqlite3` — no string concatenation ever |
| XSS | React's default JSX escaping; CSP header via Nginx |
| CSRF | `SameSite=Strict` cookies for admin session; public API is stateless |
| Rate limiting | 100 req/15min for booking endpoints; 20/min for payment form |
| Admin authentication | bcrypt cost factor 12; session expiry 8 hours; optional IP allowlist |
| Secrets | Environment variables only; never in source code or the SQLite file |
| Logging | Pino structured JSON logs; no PII in log bodies; separate `audit_log` table |
| Cookies | `secure: true` in production; `httpOnly: true`; `SameSite: Strict` |

### 8.3 Nginx Content Security Policy

```nginx
add_header Content-Security-Policy
  "default-src 'self';
   script-src 'self';
   style-src 'self' 'unsafe-inline';
   img-src 'self' data: https://fonts.gstatic.com;
   connect-src 'self';
   font-src 'self' https://fonts.gstatic.com;
   frame-ancestors 'none';"
  always;
```

`'unsafe-inline'` for styles is required by Tailwind's runtime class injection. `frame-ancestors 'none'` prevents clickjacking.

### 8.4 Australian Privacy Principles (Privacy Act 1988 (Cth))

| APP | Obligation | Implementation |
|---|---|---|
| APP 1 | Privacy policy published | `/privacy` page with full data handling disclosure |
| APP 3 | Collect only what is necessary | Only: name, email, phone, intended use, card last-4 |
| APP 5 | Notify at collection | Inline notice on booking form before submission |
| APP 6 | Use only for stated purpose | Data used only for reservation management |
| APP 11 | Secure personal information | HTTPS + access controls + data minimisation |
| APP 12 | Right of access | Contact admin email stated on confirmation page |

### 8.5 NSW-Specific Compliance

- **Electronic Transactions Act 2000 (NSW):** The `terms_accepted_at` timestamp stored in the database satisfies the requirement for electronic agreement records
- **Motor Dealers and Repairers Act 2013 (NSW):** Consult a transport law solicitor before launch — rental of accessible vehicles may require specific licensing; the Terms & Conditions page contains draft disclaimer text
- **GST Act:** All prices displayed GST-inclusive; GST component extracted and stored separately in `gst_cents` for Business Activity Statement (BAS) reporting

### 8.6 PCI DSS Considerations

The application uses **Stripe Phase 2** (Stripe Payment Element). The application server is entirely out of PCI scope — card data goes directly from the customer's browser to Stripe, never touching the Node.js process. Only the Stripe `PaymentIntent.id` is stored in the database.

- Never log card numbers. The Pino log configuration explicitly excludes payment fields from request body logging.
- The legacy `card_last4` / `cardholder_name` columns in `reservations` are Phase 1 artefacts — not written to in the current codebase.
- Employee booking codes bypass Stripe entirely; no card data is involved in that path.

---

# PART 2 — DEVELOPER ENVIRONMENTS

---

## 9. Environment Overview

This project uses three distinct environments. Each serves a specific purpose and requires different configuration.

| Environment | Purpose | Frontend served by | Backend | Database |
|---|---|---|---|---|
| **Local Development** | Day-to-day coding with hot reload | Vite dev server (port 5173) | Node `--watch` (port 8080) | Local SQLite file |
| **Local Production Sim** | Test the fully-built app before deploying | Express static files (port 8080) | `npm start` (port 8080) | Local SQLite file |
| **Cloud Production** | The live public site | Nginx (ports 80/443) | Node via PM2 (port 8080, internal) | SQLite on VPS disk |

**Why three environments — explained in plain language:**

- **Local Development** is the fastest day-to-day experience. Vite's Hot Module Replacement means your code changes appear in the browser instantly without a full page reload, and the Node `--watch` flag auto-restarts the backend when files change. This speeds up development enormously.

- **Local Production Simulation** runs the app exactly as it will run in the cloud — same single server, same compiled assets. This catches issues that only appear after building (missing imports, wrong asset paths, `NODE_ENV=production` behaviour differences) before you touch the live server.

- **Cloud Production** is the live site on DigitalOcean's Sydney data centre. Nginx handles HTTPS and serves the compiled React files as fast static assets; Node.js handles only API requests.

---

## 10. Local Development Environment

### 10.1 Windows Prerequisites (for this development machine)

The current development machine is Windows 11. These steps must be completed before any `npm` commands will work.

**Step 1 — Install Node.js 20 LTS**

Download the Windows installer: https://nodejs.org/en/download/

- Select the **LTS** tab (not "Current")
- Download **Windows Installer (.msi) — 64-bit**
- Run the installer with default options. Ensure "Add to PATH" is checked during setup.
- After install, **open a new PowerShell window** (PATH changes require a new shell session) and verify:

```powershell
node --version    # Expected output: v20.x.x
npm --version     # Expected output: 10.x.x
```

> If PowerShell says "not recognised" after install, close the terminal completely and open a fresh one. PATH is cached at terminal startup.

**Step 2 — Install Git**

Download: https://git-scm.com/download/win

- Default options are correct. During setup, select "Git from the command line and also from 3rd-party software".
- Verify:

```powershell
git --version     # Expected output: git version 2.4x.x
```

**Step 3 — (Optional) SQLite CLI for Database Inspection**

Download the Windows binary from: https://www.sqlite.org/download.html

Under "Precompiled Binaries for Windows", download `sqlite-tools-win-x64-*.zip`. Extract `sqlite3.exe` and place it on your PATH (e.g. in `C:\Windows\System32\` or a custom `C:\Tools\` folder).

```powershell
sqlite3 --version    # Expected output: 3.4x.x
```

This is optional — the application works without it, but it's useful for inspecting the database contents directly.

### 10.2 First-Time Setup

Open PowerShell and navigate to the project folder:

```powershell
cd C:\Users\DueDiligence\Desktop\car_rental
```

**Install backend dependencies:**

```powershell
npm install
```

Reads `package.json` and installs all 12 production packages plus `jest` into `node_modules/`. Takes 1–3 minutes on first run. Creates `package-lock.json` (do not edit manually — it locks exact sub-dependency versions for reproducible installs).

**Install frontend dependencies:**

```powershell
cd frontend
npm install
cd ..
```

Installs Vite/React/Tailwind tooling into `frontend/node_modules/`. First run takes 2–4 minutes.

**Create the database and run migrations:**

```bash
node -e "
const fs = require('fs');
const db = require('better-sqlite3')('./data/rental.sqlite');
const files = fs.readdirSync('./migrations').filter(f => f.endsWith('.sql')).sort();
for (const f of files) {
  try { db.exec(fs.readFileSync('./migrations/' + f, 'utf8')); console.log('Applied:', f); }
  catch(e) { console.log(e.message.includes('duplicate') || e.message.includes('already exists') ? 'Skip: ' + f : 'ERROR ' + f + ': ' + e.message); }
}
db.close();
"
```

This applies all 6 migrations idempotently. Safe to run at any time — already-applied migrations are silently skipped.

> **Note:** `npm run migrate` re-runs all SQL files and will fail on an existing database (the `ALTER TABLE` in migration 006 is not idempotent). Always use the inline snippet above.

Expected output: `Applied: 001_initial.sql  Applied: 002_...  ...  Applied: 006_promo_code_discount.sql`

**Seed 100 sample vehicles:**

```powershell
npm run seed
```

Runs `scripts/seed.js` and inserts 100 vehicles using `INSERT OR IGNORE` — safe to run multiple times without creating duplicates.

| Group | Count | Vehicle | Hourly (AUD) | Daily (AUD) | Buffer |
|---|---|---|---|---|---|
| Wheelchair vans | 20 | Toyota HiAce Wheelchair Van 1–20 | $30.00 | $165.00 | 60 min |
| Accessible vans | 20 | Toyota Tarago Accessible Van 1–20 | $30.00 | $165.00 | 60 min |
| People movers | 20 | Kia Carnival People Mover 1–20 | $25.00 | $132.00 | 30 min |
| Station wagons | 20 | Subaru Outback Wagon 1–20 | $22.00 | $132.00 | 30 min |
| Sedans | 20 | Toyota Camry Sedan 1–20 | $22.00 | $132.00 | 30 min |

Expected output: `Seeded 100 vehicles.`

All prices are GST-inclusive. The wheelchair vehicle premium reflects the additional maintenance and cleaning requirements for accessible equipment.

### 10.3 Configuring the `.env` File

The `.env` file at the project root controls all runtime configuration. A template is provided as `.env.example`. The full set of environment variables:

```env
# Server
PORT=8080
NODE_ENV=development
BASE_URL=http://localhost:8080

# Database
DATABASE_PATH=./data/rental.sqlite

# Admin credentials
# Generate a bcrypt hash: node -e "require('bcrypt').hash('YOUR_PW',12).then(h=>console.log(h))"
# In development with no hash set, the admin password defaults to the literal string 'admin'
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=        ← leave blank in development

# Email (SMTP for booking confirmations and staff alerts)
# Leave blank to disable email in development — bookings still work; emails are silently skipped
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=Special Need Vehicle Rental <noreply@facility.example.com.au>

# Business details — shown in emails and confirmation pages
FACILITY_NAME=Special Need Vehicle Rental
FACILITY_PHONE=(02) XXXX XXXX
FACILITY_EMAIL=rentals@facility.com.au
FACILITY_ADDRESS=123 Care Street, Sydney NSW 2000

# Security
SESSION_SECRET=dev_secret_please_change_for_production_use_a_random_64_char_string
# Multiple origins comma-separated
CORS_ORIGIN=http://localhost:5173,http://localhost:8080

# Locale
TZ=UTC
DISPLAY_TZ=Australia/Sydney
CURRENCY=AUD
GST_RATE=0.10

# Rate limits
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Key development-specific notes:**
- `ADMIN_PASSWORD_HASH` left blank → password defaults to `admin` in dev mode. Never expose this to a public network.
- `SMTP_HOST` left blank → email sending silently disabled. Bookings still save; confirmations are skipped.
- `SESSION_SECRET` can be any string in development; it must be a random 64-character hex string in production (see §12.8).

### 10.4 Running the Development Servers

You need **two terminal windows** open simultaneously — one for the backend, one for the frontend.

**Terminal 1 — Start the backend API:**

```powershell
cd C:\Users\DueDiligence\Desktop\car_rental
npm run dev
```

This runs `node --watch src/server.js`. The `--watch` flag is a built-in Node.js 20 feature (no nodemon required) that automatically restarts the server when any `.js` file changes.

Expected output:
```
{"level":30,"time":1749000000000,"msg":"Server running on port 8080"}
```

**Terminal 2 — Start the frontend:**

```powershell
cd C:\Users\DueDiligence\Desktop\car_rental\frontend
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open your browser to:** `http://localhost:5173`

> In VS Code, use the Tasks menu (Ctrl+Shift+P → "Run Task") instead of typing these commands. The task **"⭐ Dev: Start Both Servers"** starts both simultaneously.

### 10.5 Development URLs

| URL | What you'll see |
|---|---|
| `http://localhost:5173` | Landing page of the public booking site |
| `http://localhost:5173/availability` | Availability search |
| `http://localhost:5173/admin/login` | Admin login page |
| `http://localhost:5173/admin/dashboard` | Admin dashboard (after login) |
| `http://localhost:8080/api/v1/health` | API health check JSON |
| `http://localhost:8080/api/v1/vehicles` | Raw JSON list of all 100 vehicles |

**Admin login credentials (development only):**
- Username: `admin`
- Password: `admin`

> Always use port `5173` in development — the Vite proxy silently forwards `/api/*` to port `8080`. If you browse to `http://localhost:8080` in dev mode, the React app won't load because the `frontend/dist/` folder hasn't been built yet.

### 10.6 Working with the Local Database

The database is a single file at `./data/rental.sqlite`. You can copy it, delete it, or inspect it directly.

**To inspect the database with the SQLite CLI:**

```powershell
sqlite3 data\rental.sqlite
```

Useful commands:
```sql
.tables                                      -- list all tables
.schema vehicles                             -- show table definition
SELECT id, name, type FROM vehicles LIMIT 5;
SELECT COUNT(*) FROM vehicles;
SELECT * FROM reservations ORDER BY created_at DESC LIMIT 5;
.quit
```

**To reset the database completely (safe in development):**

```powershell
Remove-Item data\rental.sqlite
node -e "const fs=require('fs'),db=require('better-sqlite3')('./data/rental.sqlite'),files=fs.readdirSync('./migrations').filter(f=>f.endsWith('.sql')).sort();for(const f of files){try{db.exec(fs.readFileSync('./migrations/'+f,'utf8'));console.log('Applied:',f);}catch(e){console.log('Skip:',f);}}db.close();"
npm run seed
```

---

## 11. Local Production Simulation

### 11.1 Purpose

Before deploying to the live DigitalOcean server, always test the fully-built application locally. This catches:

- **Build errors** — TypeScript/JSX compilation failures, missing imports that only appear at build time
- **Asset path problems** — fonts, images not loading from the correct paths in the built output
- **Environment variable issues** — behaviour that only appears under `NODE_ENV=production` (e.g. secure cookies)
- **Single-server serving** — confirm that Express correctly serves both the API and the React static files from one process

### 11.2 Build and Run

**Step 1 — Build the frontend:**

```powershell
cd C:\Users\DueDiligence\Desktop\car_rental\frontend
npm run build
cd ..
```

Vite compiles all React/JSX, runs Tailwind's purge pass (removes unused CSS classes — dramatically reduces CSS bundle size), and bundles everything into `frontend/dist/`. Takes 15–40 seconds.

Expected output:
```
vite v5.x.x building for production...
✓ xxx modules transformed.
dist/index.html              x.xx kB
dist/assets/index-xxx.js   xxx.xx kB │ gzip: xx.xx kB
dist/assets/index-xxx.css   xx.xx kB │ gzip: x.xx kB
✓ built in x.xxs
```

**Step 2 — Set NODE_ENV and start the server:**

```powershell
$env:NODE_ENV = "production"
npm start
```

The server starts on port 8080. Because `frontend/dist/` now exists, `src/server.js` detects it and serves the built React files as static assets from Express directly.

**Step 3 — Open the browser:**

Go to `http://localhost:8080` — this is now running the same setup as production, except locally.

> **Known limitation:** With `NODE_ENV=production`, the session cookie has `secure: true`, which means it only works over HTTPS. The admin login at `/admin` will fail locally in production mode because you're on `http://`. For most production-simulation testing, focus on the public-facing booking flow. Test the admin on the live HTTPS server, or temporarily set `secure: false` in `src/server.js` for local admin testing.

**Step 4 — Reset to development mode after testing:**

```powershell
$env:NODE_ENV = "development"
```

Or simply close the terminal — PowerShell environment variables don't persist between sessions.

---

## 12. Cloud Production Environment

### 12.1 Hosting Choice — DigitalOcean (Recommended)

**Provider:** DigitalOcean — https://www.digitalocean.com

**Why DigitalOcean over AWS/Azure:**
- Flat monthly rate — no surprise bills from per-request charges
- Managed weekly backups included as a simple $2/month add-on
- **Sydney (SYD1) region** — essential for NSW data sovereignty and low latency for Australian users
- Intuitive control panel — easier for a non-technical business owner to monitor
- No free-tier complexity; predictable cost from day one

**Droplet specification:**

| Setting | Value | Reason |
|---|---|---|
| Plan | Basic (Shared CPU) | Sufficient for 100 vehicles, low concurrent traffic |
| CPU / RAM | **1 vCPU / 1 GB RAM** | Node.js typically uses 80–150 MB; fits comfortably in 1 GB |
| Storage | **25 GB SSD** | SQLite DB will never exceed 50 MB; OS + app + logs ≈ 5 GB |
| Region | **Sydney (SYD1)** | NSW data sovereignty; low latency for Australian users |
| OS image | **Ubuntu 22.04 LTS (x64)** | Jammy Jellyfish; LTS support until April 2027 |
| Backups | **Enabled** (≈$2/month) | Automated weekly snapshots stored by DigitalOcean |
| SSH key | **Required** | Add your public key at droplet creation; password auth disabled post-setup |
| **Droplet name** | **rental-server-syd** | Deployed June 2026 |
| **IP address** | **209.38.29.102** | Current production IP — update if droplet is rebuilt |
| **Domain** | **swiftriderentals.com.au** | Registered VentraIP — DNS A records point to droplet IP |
| **HTTPS** | **Live** | Let's Encrypt cert issued June 2026, expires 3 Sep 2026, auto-renews |

### 12.2 Estimated Monthly Cost

| Item | Cost (AUD/month) |
|---|---|
| Droplet — 1 vCPU / 1 GB / SYD1 | ~$10 |
| Automated backups | ~$2 |
| Domain (`.com.au` — amortised monthly) | ~$2 |
| Let's Encrypt TLS | $0 |
| Email via Mailgun (Flex free tier) | $0 |
| Uptime monitoring (UptimeRobot free) | $0 |
| **Total** | **~$14/month** |

### 12.3 Initial Server Provisioning

SSH into the droplet as `root` immediately after creation:

```bash
ssh root@YOUR_DROPLET_IP
```

**Update the OS (always do this first):**

```bash
apt update && apt upgrade -y
```

Applies all security patches. Essential before installing anything else.

**Create a non-root deploy user:**

Running the application as `root` is a significant security risk. Create a dedicated user with limited privileges:

```bash
adduser deploy
usermod -aG sudo deploy

# Copy root's SSH key to the deploy user so you can SSH in as 'deploy'
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy/
```

Switch to the deploy user for all subsequent steps:

```bash
su - deploy
```

**Disable root SSH login (security hardening):**

```bash
sudo nano /etc/ssh/sshd_config
```

Set these two lines:
```
PermitRootLogin no
PasswordAuthentication no    ← only if using SSH key auth (recommended)
```

Restart SSH:

```bash
sudo systemctl restart sshd
```

**Configure the firewall (UFW):**

```bash
sudo ufw allow OpenSSH    # port 22 — keep SSH access open
sudo ufw allow 80         # HTTP (Nginx redirects to HTTPS)
sudo ufw allow 443        # HTTPS (Nginx with TLS)
sudo ufw enable
sudo ufw status           # Should show ports 22, 80, 443 as ALLOW
```

Node.js on port 8080 is intentionally **not** open to the internet — Nginx proxies to it internally. Direct access to 8080 is blocked by the firewall.

### 12.4 Install Node.js 20 LTS

Ubuntu 22.04's default apt repository ships Node 12.x — far too old. Install via the NodeSource repository:

```bash
# Add NodeSource repository for Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js (includes npm 10.x)
sudo apt install -y nodejs

# Verify
node --version    # Must show: v20.x.x
npm --version     # Must show: 10.x.x
```

### 12.5 Install Nginx 1.24 (Stable)

Ubuntu 22.04's default apt ships Nginx 1.18.x. To get the current stable branch (1.24.x) with HTTP/2 support and latest security patches, add the official Nginx apt repository:

```bash
# Install prerequisites
sudo apt install -y curl gnupg2 ca-certificates lsb-release ubuntu-keyring

# Import Nginx signing key
curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
    | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null

# Add the stable Nginx repository
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
http://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list

# Install
sudo apt update
sudo apt install -y nginx

# Verify
nginx -v     # Expected: nginx/1.24.x
```

Enable Nginx to start on reboot:

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 12.6 Install PM2 (Process Manager)

PM2 keeps Node.js running after crashes and reboots, rotates logs, and integrates with systemd:

```bash
sudo npm install -g pm2

# Verify
pm2 --version    # Expected: 5.x.x
```

### 12.7 Install Certbot for TLS Certificates

Let's Encrypt issues free TLS certificates that auto-renew every 90 days. Install via `snap` (recommended by Let's Encrypt for Ubuntu 22.04):

```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Verify
certbot --version    # Expected: certbot 2.x.x
```

### 12.8 Install Git and SQLite CLI

```bash
sudo apt install -y git sqlite3
```

### 12.9 Deploy the Application

**Create the web root and clone the repository:**

```bash
sudo mkdir -p /var/www/rental
sudo chown deploy:deploy /var/www/rental
cd /var/www/rental
git clone https://github.com/YOUR_ORG/special-need-vehicle-rental.git .
```

> If you are not using GitHub, transfer files via `scp` from your Windows machine:
> ```powershell
> # Run on your local Windows machine (PowerShell)
> scp -r "C:\Users\DueDiligence\Desktop\car_rental\*" deploy@YOUR_DROPLET_IP:/var/www/rental/
> ```

**Create the production `.env` file:**

```bash
cd /var/www/rental
cp .env.example .env
nano .env
```

Fill in ALL values. Critical settings for production:

```env
PORT=8080
NODE_ENV=production
BASE_URL=https://rentals.facilitydomain.com.au

DATABASE_PATH=/var/www/rental/data/rental.sqlite

ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=         ← MUST set this (see §12.10 below)

SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.facilitydomain.com.au
SMTP_PASS=your_mailgun_smtp_password
EMAIL_FROM=Special Need Vehicle Rental <noreply@facilitydomain.com.au>

FACILITY_NAME=Special Need Vehicle Rental
FACILITY_PHONE=(02) XXXX XXXX
FACILITY_EMAIL=rentals@facilitydomain.com.au
FACILITY_ADDRESS=123 Care Street, Suburb NSW 2000

SESSION_SECRET=              ← MUST generate a 64-character random string (see §12.10)
CORS_ORIGIN=https://rentals.facilitydomain.com.au,https://www.facilitydomain.com.au

TZ=UTC
DISPLAY_TZ=Australia/Sydney
CURRENCY=AUD
GST_RATE=0.10

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Install backend dependencies (production — excludes dev tools):**

```bash
npm ci --omit=dev
```

> `npm ci` (Clean Install) installs exact versions from `package-lock.json`, not the `^` ranges in `package.json`. This gives reproducible, deterministic installs. `--omit=dev` excludes Jest and other dev-only packages.

**Run database migrations (idempotent — safe on an existing database):**

```bash
node -e "
const fs = require('fs');
const db = require('better-sqlite3')(process.env.DATABASE_PATH || './data/rental.sqlite');
const files = fs.readdirSync('./migrations').filter(f => f.endsWith('.sql')).sort();
for (const f of files) {
  try { db.exec(fs.readFileSync('./migrations/' + f, 'utf8')); console.log('Applied:', f); }
  catch(e) { console.log(e.message.includes('duplicate') || e.message.includes('already exists') ? 'Skip: ' + f : 'ERROR ' + f + ': ' + e.message); }
}
db.close();
"
```

> `npm run migrate` re-runs all SQL files and fails on existing databases. Use the inline snippet above instead.

**Seed the fleet (first deployment only):**

```bash
npm run seed
```

> Only run seed on the first deployment. Subsequent deployments skip this — `INSERT OR IGNORE` won't duplicate vehicles, but it's unnecessary and creates noise in logs.

**Build the frontend:**

```bash
cd /var/www/rental/frontend
npm ci
npm run build
cd ..
```

Built files are placed in `/var/www/rental/frontend/dist/`.

**Create the log directory:**

```bash
sudo mkdir -p /var/log/rental
sudo chown deploy:deploy /var/log/rental
```

### 12.10 Generate Secure Secrets

**Admin password hash:**

Never store a plain-text password. Generate a bcrypt hash (cost factor 12) of your chosen admin password:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_SECURE_PASSWORD_HERE', 12).then(h => console.log(h));"
```

The output starts with `$2b$12$...`. Copy it into `.env` as `ADMIN_PASSWORD_HASH=`. Choose a strong password — minimum 16 characters, mix of upper/lower/digits/symbols.

**Session secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'));"
```

Copy the 128-character hex string into `.env` as `SESSION_SECRET=`. This must be secret and unique per deployment. If an attacker obtains it, they can forge session cookies and log into the admin panel.

> Both of these must be set before the application handles any real traffic. In production mode, a missing or weak session secret is a critical security vulnerability.

### 12.11 Configure Nginx

Copy the template and edit it with your actual domain name:

```bash
sudo cp /var/www/rental/nginx.conf.example /etc/nginx/conf.d/rental.conf
sudo nano /etc/nginx/conf.d/rental.conf
```

Replace every occurrence of `rentals.facilitydomain.com.au` with your actual subdomain.

Full Nginx configuration:

```nginx
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

    location /data/ { deny all; }
    location /.env  { deny all; }

    access_log /var/log/nginx/rental_access.log;
    error_log  /var/log/nginx/rental_error.log;
}
```

Test the configuration before applying:

```bash
sudo nginx -t
# Expected: nginx: configuration file /etc/nginx/nginx.conf test is successful
```

If the test passes, reload Nginx:

```bash
sudo systemctl reload nginx
```

### 12.12 Obtain TLS Certificate

The domain's DNS A record must already point to the server's IP address before running this step. Let's Encrypt verifies ownership by making an HTTP request to your server.

```bash
sudo certbot --nginx -d rentals.facilitydomain.com.au
```

Certbot will:
1. Request a certificate from Let's Encrypt
2. Automatically add the certificate paths to your Nginx config
3. Set up a systemd timer for auto-renewal

Verify the renewal timer is active:

```bash
sudo systemctl status certbot.timer    # Should show: active (waiting)
```

Test renewal without actually renewing:

```bash
sudo certbot renew --dry-run
```

Certificates renew automatically every 90 days. You do not need to touch this again — Certbot emails the Let's Encrypt account address 30 days before any expiry as a warning.

### 12.13 Start the Application with PM2

```bash
cd /var/www/rental
pm2 start ecosystem.config.js --env production
```

The PM2 configuration (`ecosystem.config.js`):

```javascript
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

**Configure PM2 to start on server reboot:**

```bash
pm2 startup
# PM2 prints a command starting with "sudo env PATH=..." — copy and run it exactly
pm2 save
```

**Verify everything is running:**

```bash
pm2 status
# Should show: rental-api | online | uptime: ...

curl http://localhost:8080/api/v1/health
# Expected: {"status":"ok","db":"ok","uptime_seconds":...}
```

Then open your domain in a browser — the full application should be live over HTTPS.

### 12.14 Optional: GitHub Actions CI/CD

Automates deployment on every push to `main`:

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
            npm ci --omit=dev
            cd frontend && npm ci && npm run build && cd ..
            node -e "const fs=require('fs'),db=require('better-sqlite3')(process.env.DATABASE_PATH||'./data/rental.sqlite'),files=fs.readdirSync('./migrations').filter(f=>f.endsWith('.sql')).sort();for(const f of files){try{db.exec(fs.readFileSync('./migrations/'+f,'utf8'));console.log('Applied:',f);}catch(e){console.log(e.message.includes('duplicate')||e.message.includes('already exists')?'Skip: '+f:'ERROR '+f+': '+e.message);}}db.close();"
            pm2 reload rental-api
```

Add `VPS_HOST` (your droplet IP) and `VPS_KEY` (private SSH key contents) as GitHub repository secrets.

### 12.15 Subsequent Deployments

For all updates after the initial deployment:

```bash
cd /var/www/rental

# Pull latest code
git pull

# Update backend dependencies if package.json changed
npm ci --omit=dev

# Rebuild frontend if any frontend files changed
cd frontend && npm ci && npm run build && cd ..

# Apply any new migrations (idempotent — skips already-applied files)
node -e "
const fs = require('fs');
const db = require('better-sqlite3')(process.env.DATABASE_PATH || './data/rental.sqlite');
const files = fs.readdirSync('./migrations').filter(f => f.endsWith('.sql')).sort();
for (const f of files) {
  try { db.exec(fs.readFileSync('./migrations/' + f, 'utf8')); console.log('Applied:', f); }
  catch(e) { console.log(e.message.includes('duplicate') || e.message.includes('already exists') ? 'Skip: ' + f : 'ERROR ' + f + ': ' + e.message); }
}
db.close();
"

# Reload the application gracefully (zero downtime)
pm2 reload rental-api
```

> `pm2 reload` is preferred over `pm2 restart`. It performs a graceful reload — new requests go to the new process while in-flight requests finish on the old one, minimising user disruption.

### 12.16 Uptime Monitoring

Use **UptimeRobot** (free tier, no credit card required):

1. Create an account at https://uptimerobot.com
2. Click "Add New Monitor"
3. Type: **HTTP(S)**
4. Friendly Name: `Special Need Vehicle Rental`
5. URL: `https://rentals.facilitydomain.com.au/api/v1/health`
6. Monitoring Interval: **5 minutes**
7. Alert contacts: add the facility admin email
8. Save

UptimeRobot emails you if the health check fails — the site is down.

---

# PART 3 — OPERATIONS

---

## 13. Database Migrations & Seeding

### 13.1 Migration Runner

> **Important:** `npm run migrate` re-runs **all** SQL files in sequence. On an existing database this will fail with "table already exists" or "duplicate column" errors because migrations 001–002 use `CREATE TABLE IF NOT EXISTS` but later migrations use `ALTER TABLE` which is not idempotent. Use the **inline idempotent snippet** below for all deployments instead.

**Idempotent migration snippet (safe to run at every deploy):**

```bash
node -e "
const fs = require('fs');
const db = require('better-sqlite3')(process.env.DATABASE_PATH || './data/rental.sqlite');
const files = fs.readdirSync('./migrations').filter(f => f.endsWith('.sql')).sort();
for (const f of files) {
  try { db.exec(fs.readFileSync('./migrations/' + f, 'utf8')); console.log('Applied:', f); }
  catch(e) { console.log(e.message.includes('duplicate') || e.message.includes('already exists') ? 'Skip: ' + f : 'ERROR ' + f + ': ' + e.message); }
}
db.close();
"
```

This silently skips any file that produces a "duplicate column" or "already exists" error (migrations that have already been applied), and prints `ERROR` for genuinely new problems that need attention.

**Migration files:**

| File | Tables / Columns Created |
|---|---|
| `001_initial.sql` | `vehicles`, `reservations`, `audit_log` + indexes |
| `002_booking_codes.sql` | `employees`, `booking_codes` + indexes |
| `003_settings_and_promo_codes.sql` | `settings`, `promo_codes` + indexes |
| `004_cancellation_policy_and_refunds.sql` | `refund_requests` + indexes |
| `005_user_accounts.sql` | `users`, `booking_feedback` + indexes |
| `006_promo_code_discount.sql` | `ALTER TABLE promo_codes ADD COLUMN discount_percent` |

### 13.2 Seed Script

The seed script (`scripts/seed.js`) uses `INSERT OR IGNORE` — also idempotent. Running it multiple times will not create duplicate vehicles.

Run: `npm run seed`

Expected output: `Seeded 100 vehicles.`

### 13.3 Inspecting the Production Database

To inspect the live database without disrupting the running application:

```bash
# SSH into the production server
ssh deploy@YOUR_DROPLET_IP

# Open in read-only mode to prevent accidental writes
sqlite3 -readonly /var/www/rental/data/rental.sqlite

# Useful queries for a quick status check
SELECT COUNT(*) FROM reservations WHERE status = 'pending';
SELECT COUNT(*) FROM reservations WHERE DATE(created_at) = DATE('now');
SELECT v.name, COUNT(r.id) as bookings
  FROM vehicles v LEFT JOIN reservations r ON v.id = r.vehicle_id
  GROUP BY v.id ORDER BY bookings DESC LIMIT 10;
.quit
```

### 13.4 Adding Schema Changes (Future Migrations)

When the schema needs changing:

1. Create a new file: `migrations/007_my_feature.sql` (increment the prefix)
2. Add your `ALTER TABLE` or `CREATE TABLE IF NOT EXISTS` statements
3. Run the idempotent inline snippet from §13.1 — it applies the new file and skips already-applied ones

Do **not** modify existing migration files after they have been applied to any database — the idempotent snippet will skip them by name, not by content. Changes to an existing file will be silently ignored.

---

## 14. Testing Strategy

### 14.1 Unit Tests (Jest)

Priority test areas:

- **Availability overlap algorithm** — Edge cases: adjacent bookings (no gap), buffer time enforcement, UTC date boundary conditions (bookings crossing midnight)
- **Price calculation** — GST extraction, hourly vs daily rate logic, multi-day calculations
- **Input validation schemas** — Zod schema validation for all API inputs (valid, invalid, missing fields)

```bash
npm test
```

### 14.2 Integration Tests

Priority test areas:

- **Complete booking flow** — browse → availability search → select vehicle → POST reservation → POST payment form → confirmation page
- **Concurrent booking race condition** — two simultaneous POST requests for the same vehicle/timeslot. Only one should succeed with 201; the second should return 409. This test is critical given the data-integrity implications of double-booking an accessible vehicle.
- **Admin flow** — login, list reservations, update status/payment, fleet CRUD, CSV export
- **Cancellation** — within policy window (should succeed); outside policy window (should return appropriate error)

```bash
npm run test:integration
```

### 14.3 Accessibility Testing

- Run **axe-core** automated checks across all public pages (integrate into Playwright/Cypress E2E suite)
- Manual keyboard-only navigation through the full booking flow (Tab/Shift+Tab only — no mouse)
- Test with a screen reader (NVDA on Windows is free; VoiceOver on Mac)
- Check colour contrast ratios on all text elements using the browser DevTools accessibility inspector

### 14.4 What Is Not Yet Created

The `tests/` directory has not yet been created. Jest is configured in `package.json` and ready to run. The test files need to be written. The overlap algorithm in `src/routes/availability.js` and the GST calculation in `src/utils/pricing.js` are the highest-priority tests before public launch.

---

## 15. Email (SMTP) Setup

### 15.1 What Emails Are Sent

| Trigger | Recipient | Purpose |
|---|---|---|
| New reservation created | Customer | Booking confirmation with reference number, dates, price, cancellation link |
| New reservation created | Facility staff (`FACILITY_EMAIL`) | Alert that a paid booking has been confirmed — vehicle preparation required |
| New booking code generated | Employee | Email containing the 12-character booking code and expiry time |
| Reservation cancelled | Customer | Cancellation confirmation with reference number |

With Stripe Phase 2, payment is received automatically before the staff alert is sent. If SMTP is not configured, staff must monitor the admin dashboard for new `confirmed` reservations manually.

### 15.2 Recommended: Mailgun (Australian-Friendly)

**Provider:** Mailgun — https://www.mailgun.com
**Cost:** Flex plan — 100 emails/day free for 3 months; thereafter ≈$0.80 per 1,000 emails (effectively free at this volume)

**Setup:**
1. Create an account at mailgun.com
2. Add and verify your sending domain (e.g. `mg.facilitydomain.com.au`) — Mailgun provides DNS TXT/MX records to add at your registrar
3. Navigate to: Sending → Domain Settings → SMTP Credentials
4. Note the SMTP hostname, port, username, and password

**`.env` values for Mailgun:**

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.facilitydomain.com.au
SMTP_PASS=your_mailgun_smtp_password
EMAIL_FROM=Special Need Vehicle Rental <noreply@facilitydomain.com.au>
```

### 15.3 Alternative: AWS SES (Sydney Region)

**Provider:** Amazon Simple Email Service
**Cost:** $0.10 per 1,000 emails — at ~60 emails/month, less than $0.01/month

**Note:** Starts in "sandbox mode" — can only send to verified email addresses until you request production access (takes 1–2 business days).

```env
SMTP_HOST=email-smtp.ap-southeast-2.amazonaws.com    ← Sydney region
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE                        ← SES SMTP Access Key ID
SMTP_PASS=your_ses_smtp_secret_access_key
```

### 15.4 Testing Email Locally

Use **Mailtrap** (https://mailtrap.io — free plan) to test email sending without messages reaching real inboxes. Mailtrap provides a fake SMTP inbox — all emails are caught and displayed in a web UI.

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
```

All emails sent by the application will appear in your Mailtrap inbox. Recipients never receive them.

---

## 16. Domain & DNS

### 16.1 Recommended Domain Format

The application should be accessible on a subdomain of the facility's existing domain:

- `rentals.facilityname.com.au` — recommended (scope is clear)
- `hire.facilityname.com.au` — alternative
- `booking.facilityname.com.au` — alternative

A `.com.au` domain is appropriate for a commercial service. Annual cost: approximately **AUD $15–20/year**.

### 16.2 Australian Domain Registrars

| Registrar | Price (AUD/year) | Notes |
|---|---|---|
| **VentraIP** | ~$15 | Recommended — Australian-owned, excellent local support, fast DNS propagation |
| Crazy Domains | ~$12–15 | Popular Australian option |
| Netfleet | ~$18 | Good for premium/auction domains |
| AWS Route 53 | ~$2 (routing) + ~$15 domain | Adds complexity unless already using AWS |

### 16.3 DNS Configuration

Add the following A record at your registrar's DNS management panel after the DigitalOcean droplet is created:

| Type | Name | Value | TTL |
|---|---|---|---|
| `A` | `rentals` | `YOUR_DROPLET_IP` | `300` (5 minutes) |

**Example:** If your facility domain is `carecentre.com.au` and the droplet IP is `203.0.113.45`:

```
Type:  A
Name:  rentals
Value: 203.0.113.45
TTL:   300
```

This makes `rentals.carecentre.com.au` resolve to your DigitalOcean server. DNS propagation takes 5 minutes to 48 hours depending on the registrar and global DNS caches. Check propagation status at https://dnschecker.org.

---

## 17. Monitoring & Observability

### 17.1 Health Check Endpoint

```
GET /api/v1/health
Response: { "status": "ok", "db": "ok", "uptime_seconds": 12345 }
```

Configure UptimeRobot (free tier) to ping this endpoint every 5 minutes and send email alerts on failure. See §12.16 for setup steps.

### 17.2 Application Logs

The application uses `pino` for structured JSON logging. All logs include timestamps, request IDs, route, latency, and status codes. **No PII is logged** — customer names, emails, and card details are excluded from log output.

**View logs in production:**

```bash
pm2 logs rental-api          # tail live logs
pm2 logs rental-api --lines 100   # last 100 lines
```

Log files written to `/var/log/rental/error.log` and `/var/log/rental/out.log`.

Install the PM2 log rotation module to prevent logs from filling the disk:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 17.3 Nginx Access Logs

```bash
# View recent Nginx access log
sudo tail -f /var/log/nginx/rental_access.log

# View Nginx error log
sudo tail -f /var/log/nginx/rental_error.log
```

### 17.4 Database Integrity Check (Weekly Cron)

```bash
# crontab -e (as deploy user)
0 2 * * 0 sqlite3 /var/www/rental/data/rental.sqlite "PRAGMA integrity_check;" \
  | mail -s "Rental DB integrity check" admin@facility.example.com.au
```

Sends an email every Sunday at 2:00 AM with the integrity check result. A healthy database responds with `ok`.

---

## 18. Backup & Recovery

### 18.1 Automated Daily Backup

Create the backup script:

```bash
sudo nano /usr/local/bin/backup-rental-db.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_PATH="/var/www/rental/data/rental.sqlite"
BACKUP_DIR="/var/backups/rental"

mkdir -p "$BACKUP_DIR"

# SQLite online backup — safe to run while the app is running
sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/rental_$TIMESTAMP.sqlite'"

# Keep last 14 days only
find "$BACKUP_DIR" -name "rental_*.sqlite" -mtime +14 -delete

# Optional: sync to object storage (uncomment when rclone is configured)
# rclone copy "$BACKUP_DIR" remote:rental-backups/
```

```bash
sudo chmod +x /usr/local/bin/backup-rental-db.sh
```

Schedule via cron to run at 2:30 AM Sydney time (= 16:30 UTC):

```bash
crontab -e
```

Add this line:

```
30 16 * * * /usr/local/bin/backup-rental-db.sh
```

Test the script manually once:

```bash
/usr/local/bin/backup-rental-db.sh
ls /var/backups/rental/    # Should show a .sqlite backup file
```

This complements the DigitalOcean automated weekly droplet snapshots. Together you have: daily local backups (14-day retention) + weekly cloud snapshots.

### 18.2 Recovery Procedure

If the database is corrupted or accidentally modified:

```bash
# Stop the application
pm2 stop rental-api

# List available backups
ls -lh /var/backups/rental/

# Restore from a specific backup (replace the filename with the one you want)
cp /var/backups/rental/rental_20260615_163001.sqlite \
   /var/www/rental/data/rental.sqlite

# Verify the restored database is healthy
sqlite3 /var/www/rental/data/rental.sqlite "PRAGMA integrity_check;"
# Expected output: ok

# Restart the application
pm2 start rental-api

# Verify health
curl http://localhost:8080/api/v1/health
```

---

# PART 4 — REFERENCE

---

## 19. Cloud Hosting Cost Estimate

Target: **≤ AUD $35 / month**

### Option A — DigitalOcean (Recommended)

| Item | Monthly Cost (AUD est.) |
|---|---|
| Basic Droplet — 1 vCPU, 1 GB RAM, 25 GB SSD (Sydney SYD1) | ~$10 |
| Automated weekly backups | ~$2 |
| Domain renewal (`.com.au`, amortised) | ~$2 |
| Let's Encrypt TLS | $0 |
| Mailgun email (Flex free tier) | $0 |
| UptimeRobot monitoring (free tier) | $0 |
| **Total** | **~$14/month** |

### Option B — AWS Lightsail (Sydney ap-southeast-2)

| Item | Monthly Cost (AUD est.) |
|---|---|
| Lightsail instance — 1 vCPU, 1 GB RAM, 40 GB SSD | ~$10 |
| Manual snapshot (weekly) | ~$3 |
| Domain (Route 53) | ~$2 |
| **Total** | **~$15/month** |

### Option C — AWS EC2 t4g.nano (Reserved 1-year)

| Item | Monthly Cost (AUD est.) |
|---|---|
| EC2 t4g.nano (1 vCPU, 512 MB RAM) | ~$4 |
| EBS gp3 20 GB storage | ~$3 |
| S3 backup (< 1 GB) | ~$0.03 |
| Elastic IP (attached = free) | $0 |
| **Total** | **~$7–10/month** |

> All three options are comfortably under AUD $35/month. DigitalOcean is recommended for simplicity — managed backups, flat pricing, intuitive control panel, and Sydney availability make it the easiest to manage for a non-technical business owner who needs to log in occasionally to check status.

---

## 20. Environment Comparison Table

| Setting | Local Development | Local Prod Sim | Cloud Production |
|---|---|---|---|
| **Frontend served by** | Vite dev server (5173) | Express static (8080) | Nginx (80/443) |
| **API served by** | Node `--watch` (8080) | `npm start` (8080) | Node via PM2 (8080) |
| **Admin password** | `admin` (plaintext fallback) | bcrypt hash in `.env` | bcrypt hash in `.env` |
| **Session cookie `secure`** | `false` (HTTP allowed) | `true` (requires HTTPS) | `true` (HTTPS via Nginx) |
| **HTTPS** | No | No (or via mkcert proxy) | Yes — Let's Encrypt |
| **CORS origin** | `localhost:5173,localhost:8080` | `localhost:8080` | `rentals.facilityname.com.au` |
| **Email** | Disabled or Mailtrap | Disabled or Mailtrap | Mailgun / AWS SES |
| **Database path** | `./data/rental.sqlite` | `./data/rental.sqlite` | `/var/www/rental/data/rental.sqlite` |
| **Rate limiting** | Active (100 req/15min) | Active | Active |
| **HSTS header** | Off | Off | On (`max-age=31536000`) |
| **Log output** | Console (stdout) | Console (stdout) | PM2 log files in `/var/log/rental/` + Nginx logs in `/var/log/nginx/` |
| **NODE_ENV** | `development` | `production` | `production` |

---

## 21. Troubleshooting

### `npm` or `node` not recognised after installation (Windows)

PowerShell caches the PATH at startup. Close the terminal completely and open a new PowerShell window. If still not found, search "Environment Variables" in Windows Settings → System Properties → Environment Variables → under "Path", check for a `nodejs` entry. Add it manually if missing (typically `C:\Program Files\nodejs\`).

---

### Port 8080 already in use

Another process is using port 8080. Find and stop it:

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :8080
# Note the PID in the last column
taskkill /PID <PID> /F
```

**Linux (production server):**
```bash
lsof -i :8080
kill -9 <PID>
```

---

### `better-sqlite3` fails to install (Windows)

`better-sqlite3` contains native C++ code that must be compiled during `npm install`. On Windows, this requires the Visual Studio C++ build tools, which are not installed by default.

**Easiest fix:**
```powershell
npm install --global windows-build-tools
```

**Alternative:** Install "Desktop development with C++" from the Visual Studio Installer (free Community edition). This is a large install (~3–5 GB).

**Easiest alternative for developers:** Use WSL2 (Windows Subsystem for Linux) — this runs a real Ubuntu environment inside Windows and avoids native compilation issues entirely.

---

### `database is locked` error

SQLite uses file-level locking. This error means two processes are writing simultaneously. In development, check you haven't accidentally started two instances of the API server — check your running terminals. In production, PM2 runs a single Node.js process, so this error should not occur unless a separate script (like a manual migration or seed) is running at the same time. Check with `pm2 list`.

---

### Admin login returns 401 in production

1. Verify `ADMIN_PASSWORD_HASH` in `.env` starts with `$2b$12$`
2. Verify `ADMIN_USERNAME` matches exactly (case-sensitive)
3. Regenerate a fresh hash: `node -e "require('bcrypt').hash('YOUR_PASSWORD',12).then(h=>console.log(h));"`
4. Update `.env` and then `pm2 reload rental-api`

---

### Admin stays logged out (session cookie not sent)

With `NODE_ENV=production`, the session cookie has `secure: true` — it is only sent over HTTPS. If you're accessing over HTTP, the cookie won't be sent. Verify Nginx is correctly redirecting HTTP to HTTPS:

```bash
curl -I http://rentals.yourdomain.com.au
# Should return: 301 Moved Permanently
# Location: https://rentals.yourdomain.com.au/
```

If Nginx is not redirecting, check the Nginx config and reload it: `sudo systemctl reload nginx`.

---

### Nginx `502 Bad Gateway`

Nginx can reach the server but Node.js isn't responding on port 8080. Diagnose in order:

```bash
pm2 status              # Is rental-api showing as 'online'?
pm2 logs rental-api --lines 50    # Any startup errors in the log?
curl http://localhost:8080/api/v1/health    # Does Node respond locally?
```

The most common cause of repeated crash/restart cycles is a missing or invalid `.env` value — particularly `SESSION_SECRET` being too short, `DATABASE_PATH` pointing to a non-existent directory, or a malformed `ADMIN_PASSWORD_HASH`.

---

### Let's Encrypt certificate renewal fails

```bash
sudo certbot renew --dry-run
```

If it fails, check:
- Nginx is running: `sudo systemctl status nginx`
- Your domain resolves to this server: `dig +short rentals.yourdomain.com.au`
- Port 80 is open (Certbot uses HTTP challenge): `sudo ufw status`

Certbot emails your Let's Encrypt account address 30 days before expiry as a warning. If you receive that email, run `sudo certbot renew` manually immediately.

---

### `VITE v5.x.x  failed to resolve import` error

A frontend file is importing something that doesn't exist. The import path is case-sensitive even on Windows. Check the exact file name and path in the error message. Run `npm run build` in `frontend/` to see the full error with line numbers.

---

## 22. Handoff Deliverables

Status key: ✅ Delivered · ⚠️ Outstanding

| Artefact | Status | Notes |
|---|---|---|
| `src/server.js` | ✅ | Express app: security headers, CORS, sessions, rate limiting, static file serving |
| `src/db.js` | ✅ | SQLite connection with WAL mode + foreign keys |
| `src/cache.js` | ✅ | node-cache with 30s TTL; `invalidate()` on any reservation write |
| `src/schemas.js` | ✅ | Zod schemas for all API inputs |
| `src/utils/pricing.js` | ✅ | `calcPrice()` returning `{ totalCents, gstCents, subtotalCents, hours }` |
| `src/utils/email.js` | ✅ | Nodemailer: booking confirmation, staff alert, cancellation |
| `src/routes/availability.js` | ✅ | Cached overlap query with Allen interval complement |
| `src/routes/reservations.js` | ✅ | Atomic reservation creation with `BEGIN IMMEDIATE TRANSACTION` |
| `src/routes/admin.js` | ✅ | Protected admin routes: reservations, fleet, CSV export, audit log |
| `migrations/001_initial_schema.sql` | ✅ | Full schema: vehicles, reservations, audit_log + indexes |
| `scripts/migrate.js` | ✅ | Auto-creates `data/` dir; idempotent via `CREATE TABLE IF NOT EXISTS` |
| `scripts/seed.js` | ✅ | 100 vehicles (5 types × 20); idempotent via `INSERT OR IGNORE` |
| `ecosystem.config.js` | ✅ | PM2 config: `rental-api`, max_restarts: 10, logs to `/var/log/rental/` |
| `nginx.conf.example` | ✅ | Full Nginx config: HTTP→HTTPS redirect, TLS, CSP, proxy, gzip, block `.env` |
| `.env.example` | ✅ | All environment variables documented with comments; no secrets |
| `frontend/src/pages/` | ✅ | All 12 public + 6 admin pages implemented |
| `frontend/src/pages/Privacy.jsx` | ✅ | Privacy Policy at `/privacy` (APP 1, 3, 5, 6, 11, 12) |
| `frontend/src/pages/Terms.jsx` | ✅ | Terms & Conditions at `/terms` (Electronic Transactions Act 2000) |
| `QUICKSTART.md` | ✅ | First-time setup, run commands, URL reference |
| `DEVELOPER_ENVIRONMENTS.md` | ✅ | Full environment guide with exact versions |
| `Special_Need_Vehicle_Rental_Architecture_and_Developer_Guide.md` | ✅ | Architecture guide updated to reflect actual implementation (v1.1.0) |
| `COMPLETE_DEVELOPER_GUIDE.md` | ✅ | This file — single merged reference document |
| `PRODUCTION.md` | ✅ | Production server quick-reference (IP, URLs, SSH, deploy commands, next steps) |
| `.vscode/tasks.json` | ✅ | VS Code click-to-run tasks (setup, dev servers, build, DB tools) |
| `.vscode/launch.json` | ✅ | VS Code debug configurations (API, migration, seed, attach) |
| `.vscode/extensions.json` | ✅ | Recommended extensions (Remote-SSH, SQLite viewer, Tailwind, etc.) |
| `ssh-config.example` | ✅ | Remote-SSH template for connecting VS Code to DigitalOcean |
| `migrations/002_employees_and_codes.sql` | ✅ | Employees + booking_codes tables with indexes |
| `src/routes/employees.js` | ✅ | Admin CRUD for employees + code generation + list/disable codes |
| `src/routes/codes.js` | ✅ | Public code validation endpoint |
| `frontend/src/pages/admin/Employees.jsx` | ✅ | Admin employee management page |
| `frontend/src/pages/admin/BookingCodes.jsx` | ✅ | Admin booking codes page — filter by status, disable codes |
| `frontend/src/components/AdminNav.jsx` | ✅ | Shared admin navigation bar across all protected admin pages |
| `openapi.yaml` | ⚠️ | Not yet created — generate from `src/routes/` using `swagger-jsdoc` or write from §5 |
| `postman_collection.json` | ⚠️ | Not yet created — import `openapi.yaml` into Postman to auto-generate |
| `tests/` directory | ⚠️ | Not yet created — see §14 for strategy; Jest is configured and ready |

### Outstanding Items — Priority Order Before Public Launch

1. **Legal document review** — The Privacy Policy (`/privacy`) and Terms & Conditions (`/terms`) are drafts embedded in the app UI. Both must be reviewed by a solicitor experienced in NSW commercial and transport law before the site goes live. The Motor Dealers and Repairers Act 2013 licensing question in particular needs a legal opinion.

2. **`tests/` directory** — Unit tests for `src/utils/pricing.js` (GST edge cases, hourly vs daily boundary) and `src/routes/availability.js` (overlap algorithm edge cases) are highest priority. The concurrent booking race condition integration test is strongly recommended before launch.

3. **`openapi.yaml`** — Required if any third-party integrations are planned or if you want auto-generated API documentation. Can be produced with `swagger-jsdoc` from JSDoc annotations, or written by hand from §5 of this document.

4. **Phase 2 payment gateway** — Replace the card-capture form with Stripe Payment Element (or Tyro/eWAY for Australian-first). The database schema already has the `payment_token` column ready.

---

*This is a living document. Update the version number and date when material changes are made to the codebase or infrastructure.*

*Generated: June 2026 | Application version: 1.2.0 | NSW, Australia*
