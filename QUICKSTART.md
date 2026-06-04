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

# 2. Create the database and run migrations
npm run migrate

# 3. Seed 100 sample vehicles
npm run seed

# 4. Install frontend dependencies and build (or run dev server instead)
cd frontend
npm install
cd ..
```

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

To generate a bcrypt hash for a secure password:
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

---

## What Was Built

- **Public booking site** — landing page, availability search, vehicle detail, 3-step booking form, confirmation, cancellation
- **Admin dashboard** — reservations management, fleet management, CSV reports, audit log
- **REST API** — `/api/v1/vehicles`, `/availability`, `/reservations`, `/payments/form`, `/admin/*`, `/health`
- **100 sample vehicles** — 20 wheelchair vans, 20 accessible Taragos, 20 people movers, 20 wagons, 20 sedans
- **WCAG 2.1 AA accessibility** — keyboard navigation, ARIA, colour contrast, skip links, semantic HTML
- **NSW compliance** — GST-inclusive pricing, Privacy Policy (APP-compliant), Terms & Conditions, electronic agreement
- **Security** — HTTPS-ready, rate limiting, Zod validation, bcrypt auth, parameterised SQL, no card numbers stored
- **Phase 1 payment** — form capture only; staff contacts customer to confirm payment manually

---

## Deployment (DigitalOcean Sydney — ~AUD $14/month)

See `Special_Need_Vehicle_Rental_Architecture_and_Developer_Guide.md` for full deployment instructions.

Key steps:
1. Provision Ubuntu 22.04 droplet in SYD1 region
2. Install Node.js 20, Nginx, Certbot, PM2
3. Copy project files, run `npm ci --production`, run migrations and seed
4. Build frontend: `cd frontend && npm ci && npm run build`
5. Configure Nginx (example in `nginx.conf.example`)
6. Obtain Let's Encrypt TLS certificate
7. Start with PM2: `pm2 start ecosystem.config.js --env production`
