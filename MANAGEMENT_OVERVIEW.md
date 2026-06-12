# SwiftRide Rentals — Management Overview
## Special Need Vehicle Rental Platform

**Prepared:** June 2026 (updated with customer accounts, promo codes, refund workflow, enterprise redesign, and Site Settings)
**Business:** SwiftRide Rentals Pty Ltd
**Address:** 483 Hume Highway, Yagoona NSW 2199
**Phone:** 0434 620 086
**Website:** https://swiftriderentals.com.au

---

## 1. Executive Summary

SwiftRide Rentals is a purpose-built online vehicle hire platform designed for an elderly care facility in New South Wales, Australia. The platform enables the facility's existing accessible vehicle fleet — which sits idle during off-peak hours — to be hired by the public, generating supplementary revenue at near-zero marginal cost.

The system went live in June 2026. It is fully operational at **https://swiftriderentals.com.au**, secured with industry-standard HTTPS encryption, and compliant with Australian privacy, accessibility, and taxation law.

---

## 2. Business Problem Solved

The facility operates a fleet of 100 vehicles — wheelchair-accessible vans, people movers, wagons, and sedans — primarily for resident transport. These vehicles sit idle for significant portions of each day and week, representing a depreciating asset generating no return during downtime.

**The opportunity:** Make these vehicles available for community hire during idle periods, at rates that cover operating costs and generate surplus revenue, without disrupting resident transport priorities.

**The solution:** A self-service online booking platform that allows members of the public, carers, and community organisations to browse available vehicles, check real-time availability, book online, and pay securely — all without requiring staff involvement beyond vehicle handover.

---

## 3. What the Platform Does

### For Customers (Public)
- Browse the vehicle fleet with photos, accessibility details, and pricing
- Search availability for any date and time range
- Book a vehicle online in under 5 minutes
- Pay securely by credit or debit card (processed by Stripe)
- Apply a **promo code** to unlock a discounted special rate (different discount levels for different customer groups)
- Receive instant booking confirmation by email
- Self-cancel bookings via a link in the confirmation email; refund processed within 7–10 business days
- **Create an account** (optional) — details auto-fill on future bookings, all bookings visible in one place
- **My Bookings** — view active bookings, cancel, and leave star-rating feedback on completed hires

### For Staff (Admin)
- View all bookings in a dashboard — today, this week, upcoming
- Confirm, update, and manage reservation statuses
- **Cancel any booking** — triggers an immediate full Stripe refund (compliant with T&C §2.5f)
- **Refund requests queue** — review and approve customer-initiated cancellation refunds before they are processed
- Manage the vehicle fleet — add vehicles, set hourly and daily rates
- Export booking and revenue reports as CSV
- Full audit trail of all actions
- **Employee management** — add staff, generate one-time booking codes (emailed automatically, 24-hour expiry)
- **Manage booking codes** — view all codes (active/used/expired/disabled), disable any active code
- **Promo codes** — generate batches of one-time discount codes; each batch carries its own discount percentage so different customer groups can receive different rates (e.g. 15% for standard, 25% for VIP)
- **Cancellation policy** — configure full-refund and partial-refund time windows without needing developer involvement
- **Site Settings** — enable maintenance mode (manual toggle, or scheduled start/end window); publish an announcement banner shown on all public pages; edit business name, phone, address, email, and trading hours; edit the landing page headline, subheadline, and call-to-action; upload legal PDF documents to replace the built-in Terms & Conditions and Privacy Policy pages

### What It Does Automatically
- Prevents double-bookings — no two customers can book the same vehicle at the same time
- Calculates prices — hourly and daily rates, add-ons, promo discounts, GST-inclusive totals
- Sends confirmation and cancellation emails to customers; booking alerts to staff
- Sends refund approval emails telling customers to expect payment within 7–10 business days
- Displays all times in Sydney time (AEST/AEDT)
- Records terms acceptance with a legal timestamp for each booking
- Auto-expires promo codes and employee booking codes past their expiry date

---

## 4. Fleet Overview

| Vehicle Type | Count | Hourly Rate | Daily Rate |
|---|---|---|---|
| Toyota HiAce — Wheelchair Van | 20 | AUD $30.00 | AUD $165.00 |
| Toyota Tarago — Accessible Van | 20 | AUD $30.00 | AUD $165.00 |
| Kia Carnival — People Mover | 20 | AUD $25.00 | AUD $132.00 |
| Subaru Outback — Station Wagon | 20 | AUD $22.00 | AUD $132.00 |
| Toyota Camry — Sedan | 20 | AUD $22.00 | AUD $132.00 |
| **Total** | **100** | | |

All prices are GST-inclusive. Accessible vehicles carry a premium reflecting their additional maintenance and cleaning requirements.

---

## 5. Live System

| | |
|---|---|
| **Public booking site** | https://swiftriderentals.com.au |
| **Staff admin panel** | https://swiftriderentals.com.au/admin |
| **Status** | Live and operational |
| **Security** | HTTPS (SSL/TLS) — padlock in browser |
| **Domain** | swiftriderentals.com.au (registered June 2026, VentraIP) |
| **Data location** | DigitalOcean Sydney data centre (SYD1) |

---

## 6. Security & Compliance

### Customer Data & Privacy
- Compliant with the **Privacy Act 1988 (Cth)** and the **Australian Privacy Principles (APPs)**
- A Privacy Policy is published on the website at `/privacy`
- Only the minimum necessary personal information is collected: name, email, phone, intended use
- No customer data leaves Australia — servers are in Sydney
- All data is transmitted over HTTPS (encrypted in transit)
- The database is encrypted at rest and backed up daily

### Payment Security
- Payments are processed by **Stripe** — a globally trusted, PCI-DSS compliant payment processor
- Card numbers are **never** seen or stored by SwiftRide Rentals
- Card data goes directly from the customer's browser to Stripe's servers
- Only the last 4 digits of the card are recorded for reference
- Currently in **test mode** — to be switched to live mode before accepting real payments

### Accessibility
- Compliant with **WCAG 2.1 Level AA** — the Australian Government's digital accessibility standard
- Consistent with obligations under the **Disability Discrimination Act 1992 (Cth)** and **Disability Inclusion Act 2014 (NSW)**
- Works with screen readers and keyboard-only navigation
- Phone booking alternative available for customers who cannot use the online form

### Legal & NSW Compliance
- **GST:** All prices are GST-inclusive; GST component is recorded separately for BAS reporting
- **Electronic agreements:** Terms acceptance is timestamped in the database, satisfying the **Electronic Transactions Act 2000 (NSW)**
- **Terms & Conditions** and **Privacy Policy** are published on the website
- ⚠️ Both documents are currently drafts — legal review by a NSW solicitor is recommended before accepting public bookings

---

## 7. Infrastructure & Cost

### Hosting
| Item | Detail |
|---|---|
| Provider | DigitalOcean (Sydney SYD1 data centre) |
| Server | 1 vCPU, 1 GB RAM, 25 GB SSD |
| Database | SQLite (included on server — no separate DB cost) |
| Backups | Automated weekly server snapshots |
| Uptime | Auto-restarts on crash; auto-starts on server reboot |

### Monthly Running Costs
| Item | Cost (AUD/month) |
|---|---|
| Server (DigitalOcean SYD1) | ~$10 |
| Automated backups | ~$2 |
| Domain renewal (amortised) | ~$2 |
| SSL certificate (Let's Encrypt) | Free |
| Payment processing (Stripe) | ~1.7% + $0.30 per transaction |
| Email (Mailgun free tier) | Free |
| Uptime monitoring (UptimeRobot) | Free |
| **Total fixed cost** | **~AUD $14/month** |

Stripe's transaction fee (approximately 1.7% + $0.30 per booking) is the only variable cost — it scales directly with revenue.

### Reliability
- The server auto-restarts the application within seconds of any crash
- The server boots and starts the application automatically after any reboot
- SSL certificate renews automatically every 90 days (no manual action required)

---

## 8. How Payments Work

**Current status: Test mode** (no real money processed)

The payment flow using Stripe:

```
1. Customer completes booking form (name, email, phone, dates)
2. Customer accepts Terms & Conditions (legally binding, timestamped)
3. Customer enters card details into Stripe's secure hosted form
   → Card data goes directly to Stripe — never to SwiftRide's server
4. Stripe processes payment
5. Customer is redirected to confirmation page — booking confirmed immediately
6. Customer receives email confirmation + Stripe payment receipt
7. Staff receive email alert — vehicle ready to prepare for pickup
```

**To go live with real payments**, two steps are required:
1. Switch Stripe account from test mode to live mode (copy live API keys to server)
2. Register the webhook endpoint with Stripe so payment events are reliably confirmed

---

## 9. Promo Codes & Special Rates

Promo codes allow selected customers to access a discounted daily rate. Unlike a single global discount, each batch of codes carries its own percentage — so different customer groups can receive different offers simultaneously.

### How It Works

**Admin side:**
1. Go to Admin → **Promo Codes & Rates**
2. Click **+ Generate Codes**, enter a discount percentage (e.g. 20%) and how many codes to create
3. Optionally set an expiry date
4. Codes are created instantly — distribute them to customers directly (email, letter, phone)
5. Used, expired, and disabled codes are all visible in the table

**Customer side:**
1. On the booking form (Step 1), the customer enters their promo code in the "Have a promo code?" field
2. If valid, the discount is applied to the daily rate immediately and shown on screen
3. The code is single-use — it is marked as used when the booking is completed

### Code Properties

| Property | Detail |
|---|---|
| Discount | Set per batch — e.g. 15% off, 25% off, 30% off |
| Usage | Single use only |
| Expiry | Optional — leave blank for codes that never expire |
| Status | active → used (or expired / disabled) |

---

## 10. Employee Booking Codes

Staff members can be issued a one-time booking code that allows them to hire a vehicle without making a payment. This is useful for staff benefits, community hire, or facility-approved bookings.

### How It Works

**Admin side (staff management panel):**
1. Go to Admin → **Employees** and add the staff member (Employee ID, name, email, phone)
2. Click **Generate Code** next to the employee
3. A unique 12-character code is generated instantly and emailed to the employee
4. The code appears on screen for the admin to note as well
5. Admin can **Disable** any code at any time from Admin → **Booking Codes**

**Employee side (booking website):**
1. Employee searches for an available vehicle and selects their dates
2. Completes Steps 1 (personal details) and 2 (terms agreement) as normal
3. On the Payment step, selects **"Employee Code"** instead of "Pay by Card"
4. Enters their 12-character code
5. Clicks "Complete Booking with Code" — booking is confirmed immediately, no card required

### Code Properties

| Property | Detail |
|---|---|
| Format | 12 characters — 11 alphanumeric + 1 special character (e.g. `AB3C7KP!9MN2`) |
| Expiry | 24 hours from generation |
| Usage | Single use only — cannot be reused after redemption |
| Status tracking | active → used (or expired / disabled) |
| Delivery | Emailed to employee automatically when generated |
| Admin control | Can be disabled at any time before it is used |

### Admin Pages

| Page | URL | Purpose |
|---|---|---|
| Employees | `/admin/employees` | Add employees, generate codes, deactivate staff |
| Booking Codes | `/admin/codes` | View all codes, filter by status, disable active codes |

---

## 11. Cancellation Policy & Refunds

The cancellation policy is configurable from Admin → **Promo Codes & Rates** (Cancellation Policy section). Three tiers apply:

| Tier | Condition | Refund |
|---|---|---|
| Full refund | Cancelled more than X hours before pickup (default: 48h) | 100% |
| Partial refund | Cancelled between Y and X hours before pickup (default: 24–48h) | Configurable % (default: 50%) |
| No refund | Cancelled less than Y hours before pickup (default: <24h) | 0% |

**Customer-initiated cancellation:** A refund request is created in the pending queue. Admin reviews it at `/admin/refund-requests` and clicks **Approve** — Stripe processes the refund and the customer receives an email within 7–10 business days.

**Admin-initiated cancellation:** When staff cancel a booking from the reservation detail page, the full amount is refunded to Stripe immediately (no review step) and the customer is notified by email. This satisfies T&C §2.5(f).

---

## 12. Booking Management — Staff Workflow

### When a Customer Books
1. Customer receives automatic email confirmation
2. Staff receive automatic email alert to prepare the vehicle
3. Booking appears in the admin dashboard at https://swiftriderentals.com.au/admin

### On Pickup Day
1. Verify customer's driver's licence
2. Complete vehicle walk-around with customer and note any existing damage
3. Obtain signature on physical hire agreement
4. Hand over keys
5. Update reservation status to **Picked Up** in the admin dashboard

### On Vehicle Return
1. Inspect vehicle
2. Update reservation status to **Completed** in the admin dashboard

### Cancellations
- Customers can self-cancel via the link in their confirmation email or from My Bookings
- Staff can cancel any booking from the admin reservation detail page
- **Customer cancel:** creates a refund request in the admin queue; admin approves to trigger Stripe refund
- **Admin cancel:** Stripe refund fires immediately (full amount); customer is emailed automatically

---

## 13. Site Settings — Maintenance Mode & Dynamic Content

The **Site Settings** panel at `/admin/site-settings` lets staff manage several important aspects of the live site without involving a developer.

### Maintenance Mode

When the business needs to take the booking site offline temporarily (e.g. for scheduled maintenance, a public holiday closure, or a system update), maintenance mode can be activated in two ways:

| Mode | How |
|---|---|
| **Manual** | Toggle "Maintenance Mode" on — the site goes offline immediately and stays offline until the toggle is switched off |
| **Scheduled** | Set a start date/time and end date/time — the site switches to maintenance automatically during that window and returns to normal afterwards without any action required |

When maintenance mode is active:
- All public pages show a custom maintenance message instead of the booking site
- The admin panel remains fully accessible — staff can still review and manage bookings
- The maintenance message is customisable (e.g. "We are performing routine maintenance. Back online Monday 9 AM Sydney time.")

### Announcement Banner

A dismissible banner can be displayed at the top of all public pages. Use this for short-notice messages such as public holiday closures, special promotions, or service alerts. The banner can be toggled on or off at any time without affecting other settings.

### Business Information & Landing Page Content

All text that identifies the business on the website — name, phone, address, email, trading hours, and the landing page headlines — is stored in the database and editable from this panel. Changes take effect as soon as the page is saved without requiring a deployment.

| Section | Fields Editable |
|---|---|
| Business information | Business name, phone number, address, email address, trading hours |
| Landing page hero | Main headline, subheadline, tagline, call-to-action button label |

### Legal Documents

The Terms & Conditions and Privacy Policy pages can be replaced with uploaded PDF files. Once a PDF is uploaded, the web page for that document shows the PDF in an inline viewer with Open and Download buttons, rather than the built-in text version. This allows a solicitor-reviewed version to replace the draft documents without any code changes.

---

## 14. What Comes Next

### Immediate (before public launch)
- [ ] **Legal review** — Privacy Policy and Terms & Conditions reviewed by a NSW solicitor
- [ ] **Stripe live keys** — Switch from test mode to live; complete a $1 test transaction
- [ ] **Stripe webhook** — Register `https://swiftriderentals.com.au/api/v1/payments/webhook` in Stripe Dashboard (events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refund.updated`)
- [ ] **Email setup** — Configure Mailgun SMTP so confirmation, cancellation, and refund emails are sent
- [ ] **Admin password** — Change temporary password to a permanent one
- [ ] **Vehicle photos** — Add real photos for each vehicle in the admin dashboard
- [ ] **Add employees** — Register all staff in Admin → Employees before generating any booking codes

### Short Term
- [ ] **Uptime monitoring** — Set up UptimeRobot to alert staff if the site goes down
- [ ] **Automated backups** — Configure daily database backup script on the server
- [ ] **Insurance confirmation** — Confirm with insurer in writing that third-party hire is covered
- [ ] **NSW licensing** — Confirm motor vehicle hire licensing requirements with NSW Fair Trading
- [ ] **Promo code distribution** — Generate first batch of promo codes and decide distribution process

### Future Enhancements
- **SMS notifications** — Twilio integration for booking alerts to staff
- **Calendar view** — Visual calendar showing all bookings across the fleet
- **Reporting dashboard** — Revenue charts, fleet utilisation, booking trends
- **Maintenance scheduling** — Integration with a vehicle maintenance calendar
- **Multi-admin users** — Individual logins per staff member instead of a single shared admin

---

## 15. Source Code & Documentation

| Document | Purpose |
|---|---|
| `PRODUCTION.md` | Server details, SSH access, deploy commands, next steps checklist |
| `COMPLETE_DEVELOPER_GUIDE.md` | Full technical reference — architecture, API, database, environments |
| `QUICKSTART.md` | Local development setup in 5 minutes |
| `Special_Need_Vehicle_Rental_User_Flow_and_Hosting_Estimate.md` | User flows, screen layouts, testing guide with Stripe test cards |
| `Special_Need_Vehicle_Rental_Architecture_and_Developer_Guide.md` | Original architecture specification |

**GitHub repository:** https://github.com/accstaffscheduling2026/car_rental
All source code, configuration, and documentation is version-controlled. Secrets (API keys, passwords) are never stored in the repository.

---

## 16. Key Contacts & Access

| Role | Detail |
|---|---|
| Domain registrar | VentraIP — https://vip.ventraip.com.au |
| Server hosting | DigitalOcean — https://cloud.digitalocean.com |
| Payment processing | Stripe — https://dashboard.stripe.com |
| Source code | GitHub — https://github.com/accstaffscheduling2026/car_rental |
| Server IP | 209.38.29.102 (DigitalOcean SYD1) |
| Admin panel | https://swiftriderentals.com.au/admin |

---

*This document provides a management-level overview of the SwiftRide Rentals platform as of June 2026 — including all Phase 2 features and Site Settings (maintenance mode, dynamic content, legal PDF upload).
For technical implementation details, refer to `COMPLETE_DEVELOPER_GUIDE.md`.
For operational procedures (server access, deploy steps, Stripe configuration), refer to `PRODUCTION.md`.*
