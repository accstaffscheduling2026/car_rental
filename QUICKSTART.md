# Special Need Vehicle Rental — Quick Start Guide

## Prerequisites

Install **Node.js 20 LTS** first: https://nodejs.org/en/download/

Verify installation:
```
node --version   # should show v20.x
npm --version    # should show 10.x
```

---

## First-Time Setup (run once)

Open a terminal in the `car_rental` folder:

```bash
# 1. Install backend dependencies
npm install

# 2. Apply migrations (see note below)
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

# 3. Seed 100 sample vehicles
npm run seed

# 4. Install frontend dependencies
cd frontend
npm install
cd ..
```

> **Migration note:** `npm run migrate` re-runs all SQL files and will fail on an existing database.
> Use the inline Node snippet above instead — it is idempotent and safe to run at any time.

---

## Run in Development Mode (two terminals)

**Terminal 1 — Backend API:**
```bash
npm run dev
# API running at http://localhost:8080
```

**Terminal 2 — Frontend (hot reload):**
```bash
cd frontend
npm run dev
# UI running at http://localhost:5173
```

Then open: **http://localhost:5173**

---

## URLs

| URL | Description |
|---|---|
| http://localhost:5173 | Public booking site |
| http://localhost:5173/login | Customer sign in / register |
| http://localhost:5173/my-bookings | Customer bookings dashboard |
| http://localhost:5173/admin | Admin dashboard |
| http://localhost:8080/api/v1/health | Health check |

**Admin login:** username `admin`, password `admin` (development only)

---

## Run in Production Mode (single server)

```bash
# Build frontend first
cd frontend && npm install && npm run build && cd ..

# Start production server (serves both API + frontend)
npm start
# Visit: http://localhost:8080
```

---

## Changing the Admin Password

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_PASSWORD', 12).then(h => console.log(h));"
```
Copy the hash into `.env` as `ADMIN_PASSWORD_HASH=<hash>`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` — email confirmations
- `FACILITY_PHONE` / `FACILITY_NAME` / `FACILITY_ADDRESS` — shown in UI and emails
- `SESSION_SECRET` — change to a long random string in production
- `CORS_ORIGIN` — set to your production domain
- `STRIPE_SECRET_KEY` — Stripe backend secret key
- `VITE_STRIPE_PUBLISHABLE_KEY` — set in `frontend/.env`

---

## What Was Built

### Public Site
- **Landing page** — Aurora Indigo enterprise design; rainbow fleet cards (teal/violet/amber/rose per vehicle type)
- **Availability search** — date/time picker, vehicle-type filter, real-time availability
- **Vehicle detail** — photos, specs, accessibility features, add-ons, pricing
- **3-step booking form** — personal details (auto-filled when signed in), T&C agreement, Stripe card payment or employee code
- **Promo code** — customers apply a code to unlock a discounted rate; discount % is set per code batch
- **Booking confirmation** — email sent automatically; booking reference displayed
- **Self-service cancellation** — customer cancels via `/cancel/:id`; refund workflow triggered automatically
- **Customer accounts** — register, sign in, session persists across visits
- **My Bookings** — view active bookings (with cancel link) and past bookings (with 5-star feedback form)

### Admin Dashboard
- **Reservations** — full list with filters; detail view with status management and notes
- **Admin cancel** — cancel any booking from the detail page; triggers immediate Stripe refund per T&C §2.5(f)
- **Refund requests** — pending queue for customer-initiated cancellations; approve sends Stripe refund + email
- **Fleet management** — add/edit vehicles, set hourly and daily rates, manage availability
- **Employees** — add staff, generate one-time booking codes (emailed automatically, 24-hour expiry)
- **Booking Codes** — view all codes (active/used/expired/disabled), disable any active code
- **Promo Codes & Rates** — generate promo code batches with a custom discount % per batch; cancellation policy configuration (full-refund and partial-refund time thresholds)
- **Reports** — CSV export of bookings and revenue
- **Audit log** — timestamped record of every action

### API Routes
| Route | Description |
|---|---|
| `GET /api/v1/vehicles` | List all active vehicles |
| `GET /api/v1/availability` | Check availability |
| `POST /api/v1/reservations` | Create booking |
| `PATCH /api/v1/reservations/:id/cancel` | Customer self-cancel |
| `POST /api/v1/payments/intent` | Create Stripe PaymentIntent |
| `GET /api/v1/payments/verify` | Verify payment status |
| `POST /api/v1/payments/webhook` | Stripe webhook |
| `POST /api/v1/promo/validate` | Validate promo code |
| `POST /api/v1/codes/validate` | Validate employee booking code |
| `GET /api/v1/public/cancellation-policy` | Public cancellation policy |
| `POST /api/v1/auth/register` | Register customer account |
| `POST /api/v1/auth/login` | Sign in |
| `POST /api/v1/auth/logout` | Sign out |
| `GET /api/v1/auth/me` | Current session user |
| `PATCH /api/v1/auth/profile` | Update name/phone |
| `GET /api/v1/my-bookings` | Customer's own bookings |
| `POST /api/v1/my-bookings/:id/feedback` | Submit star rating + comment |
| `GET /api/v1/health` | Health check |

### Database Migrations
| File | What it creates |
|---|---|
| `001_initial.sql` | `vehicles`, `reservations`, `audit_log` |
| `002_booking_codes.sql` | `employees`, `booking_codes` |
| `003_settings_and_promo_codes.sql` | `settings`, `promo_codes` |
| `004_cancellation_policy_and_refunds.sql` | `refund_requests`; adds cancellation columns to `settings` |
| `005_user_accounts.sql` | `users`, `booking_feedback` |
| `006_promo_code_discount.sql` | Adds `discount_percent` to `promo_codes` |

### Non-functional
- **WCAG 2.1 AA accessibility** — keyboard navigation, ARIA, skip links, semantic HTML
- **NSW compliance** — GST-inclusive pricing, Privacy Policy (APP-compliant), Terms & Conditions
- **Security** — HTTPS-ready, rate limiting, Zod validation, bcrypt auth, parameterised SQL
- **Enterprise UI** — Aurora Indigo theme; dark gradient header/footer; rainbow status system

---

## Deployment (DigitalOcean Sydney — ~AUD $14/month)

See `PRODUCTION.md` for server details and `COMPLETE_DEVELOPER_GUIDE.md` for full deployment instructions.

Key steps:
1. SSH into the server as root
2. `cd /var/www/rental && git pull origin main`
3. `npm install --omit=dev`
4. `cd frontend && npm install && npm run build && cd ..`
5. Apply any new migrations using the idempotent inline snippet above
6. `pm2 restart rental-api --update-env`
