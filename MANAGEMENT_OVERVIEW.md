# SwiftRide Rentals — Management Overview
## Special Need Vehicle Rental Platform

**Prepared:** June 2026
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
- Receive instant booking confirmation by email
- Self-cancel bookings via a link in the confirmation email

### For Staff (Admin)
- View all bookings in a dashboard — today, this week, upcoming
- Confirm, update, and manage reservation statuses
- Manage the vehicle fleet — add vehicles, set maintenance windows
- Export booking and revenue reports as CSV
- Full audit trail of all actions

### What It Does Automatically
- Prevents double-bookings — no two customers can book the same vehicle at the same time
- Calculates prices — hourly and daily rates, add-ons, GST-inclusive totals
- Sends confirmation emails to customers and alert emails to staff
- Displays all times in Sydney time (AEST/AEDT)
- Records terms acceptance with a legal timestamp for each booking

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

## 9. Booking Management — Staff Workflow

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
- Customers can self-cancel via the link in their confirmation email
- Staff can cancel from the admin dashboard
- Refunds are currently processed manually via the Stripe Dashboard

---

## 10. What Comes Next

### Immediate (before public launch)
- [ ] **Legal review** — Privacy Policy and Terms & Conditions reviewed by a NSW solicitor
- [ ] **Stripe live keys** — Switch from test mode to live; complete a $1 test transaction
- [ ] **Stripe webhook** — Register `https://swiftriderentals.com.au/api/v1/payments/webhook` in Stripe Dashboard
- [ ] **Email setup** — Configure Mailgun SMTP so confirmation emails are sent to customers
- [ ] **Admin password** — Change temporary password to a permanent one
- [ ] **Vehicle photos** — Add real photos for each vehicle in the admin dashboard

### Short Term
- [ ] **Uptime monitoring** — Set up UptimeRobot to alert staff if the site goes down
- [ ] **Automated backups** — Configure daily database backup script on the server
- [ ] **Insurance confirmation** — Confirm with insurer in writing that third-party hire is covered
- [ ] **NSW licensing** — Confirm motor vehicle hire licensing requirements with NSW Fair Trading

### Future Enhancements
- **Automatic refunds** — Stripe refund API triggered automatically based on cancellation policy
- **Staff notifications via SMS** — Twilio integration for booking alerts
- **Calendar view** — Visual calendar showing all bookings across the fleet
- **Reporting dashboard** — Revenue charts, fleet utilisation, booking trends
- **Customer accounts** — Returning customers save their details for faster booking
- **Maintenance scheduling** — Integration with a vehicle maintenance calendar

---

## 11. Source Code & Documentation

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

## 12. Key Contacts & Access

| Role | Detail |
|---|---|
| Domain registrar | VentraIP — https://vip.ventraip.com.au |
| Server hosting | DigitalOcean — https://cloud.digitalocean.com |
| Payment processing | Stripe — https://dashboard.stripe.com |
| Source code | GitHub — https://github.com/accstaffscheduling2026/car_rental |
| Server IP | 209.38.29.102 (DigitalOcean SYD1) |
| Admin panel | https://swiftriderentals.com.au/admin |

---

*This document provides a management-level overview of the SwiftRide Rentals platform as of June 2026.
For technical implementation details, refer to `COMPLETE_DEVELOPER_GUIDE.md`.
For operational procedures, refer to `PRODUCTION.md`.*
