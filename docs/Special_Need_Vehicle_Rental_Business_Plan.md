# Special Need Vehicle Rental
## Management-Level Business Plan

**Version:** 1.0.0
**Date:** June 2026
**Jurisdiction:** New South Wales, Australia
**Prepared for:** Facility Owner / Management

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Overview](#2-business-overview)
3. [Market Analysis](#3-market-analysis)
4. [Service Description](#4-service-description)
5. [Legal & Regulatory Compliance (NSW)](#5-legal--regulatory-compliance-nsw)
6. [Operations Plan](#6-operations-plan)
7. [Technology Overview](#7-technology-overview)
8. [Financial Plan](#8-financial-plan)
9. [Marketing & Customer Acquisition](#9-marketing--customer-acquisition)
10. [Risk Management](#10-risk-management)
11. [SWOT Analysis](#11-swot-analysis)
12. [Governance & Staffing](#12-governance--staffing)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [Key Performance Indicators](#14-key-performance-indicators)
15. [Appendices](#15-appendices)

---

## 1. Executive Summary

**Service Name:** Special Need Vehicle Rental
**Parent Organisation:** [Elderly Care Facility Name], New South Wales, Australia
**Proposed Launch:** [Target Month] 2026

Special Need Vehicle Rental is a web-based vehicle hire service operated as an ancillary revenue stream by an established elderly care facility in New South Wales. The service makes up to **100 facility-owned vehicles available for public hire** during periods when those vehicles are not required for facility operations.

The service is designed for the local community — particularly families of residents, carers, allied health professionals, and community organisations — who require accessible, reliable transport for medical appointments, therapy sessions, community activities, and daily mobility. The application is embedded as a single link within the facility's existing production website, ensuring a seamless, low-friction customer experience.

**Key Highlights:**

| Metric | Projection |
|---|---|
| Fleet size | Up to 100 vehicles — **already owned by the facility** |
| Vehicle acquisition cost | **$0 — no new fleet purchase required** |
| Target market | Greater Sydney region (NSW) |
| Estimated gross revenue (Year 1, conservative) | AUD $47,520 – $89,100 p.a. |
| Monthly infrastructure cost | < AUD $20 / month |
| Break-even point | Approximately 29 bookings/month (< 1 per day) |
| Payment gateway | Form-only (Phase 1); Stripe/eWAY (Phase 2) |
| Primary differentiator | Accessibility-first, community-focused, care-sector trusted; zero fleet acquisition cost |

This business plan outlines the operational, financial, legal, and strategic framework required to launch and sustain the service in compliance with applicable NSW and Commonwealth legislation.

---

## 2. Business Overview

### 2.1 Background

The facility already owns and operates a fleet of up to 100 vehicles used to transport residents to medical appointments, recreational activities, and other engagements. These vehicles experience significant idle time — typically outside business hours, on weekends, and during staff leave periods. Because the fleet is already purchased and maintained as part of facility operations, **no new vehicle acquisition is required** to launch this service. This idle capacity represents a high-margin commercial opportunity: the vehicles are a sunk cost, and every rental booking is incremental revenue with minimal additional overhead.

**Key Value Proposition — Why This Works:**

| Advantage | Detail |
|---|---|
| Zero fleet acquisition cost | Vehicles are already owned and paid for by the facility |
| Low marginal cost per rental | Main added costs are staff time, cleaning supplies, and an insurance endorsement — no vehicle loan or depreciation expense |
| Existing maintenance infrastructure | Vehicles are already serviced, registered, and roadworthy |
| Trusted brand | The facility's community reputation transfers directly to the rental service |
| High-margin incremental revenue | Every booking is near-pure profit above the small variable costs |

### 2.2 Mission Statement

> To provide safe, accessible, and affordable vehicle hire to individuals and organisations in our community, while generating a sustainable supplementary income stream for the facility.

### 2.3 Vision

To become the most trusted accessible vehicle hire service in our region, recognised for exceptional care, reliability, and commitment to the independence and mobility of elderly and disabled community members.

### 2.4 Business Structure

The service operates as an extension of the existing facility's legal entity (no separate incorporation required for MVP). Revenue is received into the facility's existing ABN. A dedicated cost centre or profit centre may be established for accounting purposes. Legal and insurance matters are managed in conjunction with the facility's existing insurer, solicitor, and accountant.

---

## 3. Market Analysis

### 3.1 Market Context — Greater Sydney Region

New South Wales has approximately **1.2 million people aged 65 or over** (ABS, 2021 Census), representing 14.3% of the state population. The Greater Sydney region contains the highest concentration of elderly residents in NSW. According to Transport for NSW data, a significant proportion of elderly and mobility-impaired individuals report difficulty accessing appropriate transport for medical appointments and daily activities.

Key market drivers:

- **Ageing population:** NSW's population aged 65+ is projected to grow 50% by 2041 (NSW Department of Planning)
- **NDIS growth:** National Disability Insurance Scheme participant numbers continue to grow; many participants require accessible transport
- **Gaps in accessible transport:** Standard rideshare and taxi services often lack wheelchair-accessible vehicles; wait times can be excessive
- **Family carer demand:** Adult children and carers of elderly residents require reliable, familiar, affordable transport options

### 3.2 Target Customer Segments

| Segment | Description | Priority |
|---|---|---|
| **Families of facility residents** | Need transport for residents to attend appointments, family gatherings, social outings | Primary |
| **Community carers** | Professional and informal carers needing accessible transport for clients | Primary |
| **Allied health providers** | Physiotherapists, occupational therapists, medical practices arranging transport | Secondary |
| **Community organisations** | Disability services, senior citizens groups, community centres | Secondary |
| **Individual renters** | Community members needing accessible or larger-capacity vehicles | Tertiary |

### 3.3 Competitive Landscape

| Competitor | Type | Limitation vs. This Service |
|---|---|---|
| Enterprise / Hertz | National car rental | Rarely accessible vehicles; no community focus; higher pricing |
| Rideshare (Uber, DiDi) | On-demand transport | No wheelchair-accessible options; not available for multi-hour/day hire |
| Maxi Taxi / Wheelchair Taxis | Regulated hire car | Per-trip only; expensive for long durations; booking friction |
| NDIS transport providers | Registered providers | Limited to NDIS participants; fixed routes |
| Council transport services | Community buses | Limited hours; requires advance registration |

**Competitive Advantage:** This service uniquely combines trusted care-sector credentials, a fleet optimised for accessibility, competitive daily rates, and a community-first ethos. The facility's existing reputation provides an immediate trust advantage over commercial competitors.

---

## 4. Service Description

### 4.1 Service Offering

| Offering | Detail |
|---|---|
| Vehicle types | Sedans, station wagons, people movers, wheelchair-accessible vans |
| Booking method | Online via facility website link; phone backup for accessibility |
| Booking window | Minimum 1 hour; maximum 7 days (configurable) |
| Collection method | Vehicle pickup at facility; key handover by staff |
| Operating hours | Subject to staff availability; initially 8:00 AM – 6:00 PM AEST Mon–Sat |
| Payment | Phase 1: form capture, confirmed by staff; Phase 2: online payment gateway |

### 4.2 Pricing Structure (Proposed)

All prices inclusive of GST (10%) as required under the *A New Tax System (Goods and Services Tax) Act 1999 (Cth)*.

| Rate Type | Price (AUD, incl. GST) | Notes |
|---|---|---|
| Hourly | $22.00/hr | Short-duration trips, minimum 1 hour |
| Half-day (up to 5 hrs) | $88.00 | Popular for medical appointments |
| Full day | $132.00 | Up to 24 hours from pickup |
| Wheelchair-accessible premium | +$11.00/day | Covers additional cleaning and equipment check |
| Security deposit | $200.00 (refundable) | Held pending return inspection; Phase 2 |

*Note: Prices are subject to review by management and should be validated against local market rates prior to launch.*

### 4.3 Add-On Services

| Add-On | Price (AUD, incl. GST) | Notes |
|---|---|---|
| Child booster seat | $5.50/day | Subject to availability |
| GPS navigation unit | $5.50/day | For vehicles without built-in nav |
| Extended hours pickup | $11.00/booking | Outside standard operating hours |

---

## 5. Legal & Regulatory Compliance (NSW)

Compliance with the following legislation and regulations is **mandatory** prior to public launch.

### 5.1 Vehicle Hire Licensing (NSW)

Under the **Motor Dealers and Repairers Act 2013 (NSW)**, hiring out vehicles to the public may require a **Motor Dealer's Licence** or a specific vehicle hire authorisation depending on the nature of operations. The facility must:

- Consult **NSW Fair Trading** to confirm whether a licence is required for the planned hire model
- If required, apply for the appropriate licence category before accepting bookings
- Display licence details on the website as required by law

> **Action required:** Engage NSW Fair Trading or a legal adviser to confirm licensing requirements before launch.

### 5.2 Insurance

| Insurance Type | Requirement | Action |
|---|---|---|
| Compulsory Third Party (CTP) | Required for all registered vehicles under **Motor Accidents Injuries Act 2017 (NSW)** | Confirm existing CTP covers hire use; some CTP policies restrict commercial hire |
| Comprehensive vehicle insurance | Recommended; must include third-party hire cover | Obtain endorsement for hire/rental use from insurer |
| Public liability | Strongly recommended; minimum $10 million | Confirm existing policy extends to hire customers |
| Renter damage liability | Optional damage excess waiver product | Consider as add-on revenue stream in Phase 2 |

> **Action required:** Engage the facility's existing insurer or an insurance broker to obtain appropriate endorsements. Some policies exclude vehicles hired to third parties — this must be resolved before launch.

### 5.3 Driver & Renter Eligibility

- Renter must hold a current, valid **Australian driver's licence** (or international equivalent as permitted under NSW road rules)
- Minimum age: **25 years** (recommended for insurance and risk management; confirm with insurer)
- Renter must sign a **Hire Agreement and Liability Waiver** prior to vehicle handover
- For accessible vehicles with special controls, confirm renter holds appropriate licence endorsements

### 5.4 Vehicle Registration & Roadworthiness

Under the **Road Transport Act 2013 (NSW)** and associated regulations:

- All vehicles must hold current NSW registration
- Vehicles offered for hire must meet roadworthiness standards
- A **maintenance log** must be kept per vehicle
- Vehicles must be inspected at regular intervals (minimum annually or per manufacturer schedule)
- Buffer time between bookings allows staff to conduct a pre-hire safety inspection

### 5.5 Privacy — Australian Privacy Principles (APPs)

Under the **Privacy Act 1988 (Cth)**, the facility is required to:

- Publish a **Privacy Policy** accessible on the booking website
- Collect only the personal information reasonably necessary for the booking service
- Protect personal information from misuse, loss, or unauthorised access
- Allow individuals to access and correct their personal information
- Not disclose personal information to overseas entities without appropriate safeguards
- Notify affected individuals in the event of a serious data breach (Notifiable Data Breaches scheme)

### 5.6 Australian Consumer Law (ACL)

Under the **Competition and Consumer Act 2010 (Cth), Schedule 2**:

- Terms and conditions must be clear, fair, and not contain unfair contract terms
- Refund and cancellation policies must be disclosed before booking is confirmed
- Services must be provided with due care and skill, and fit for purpose
- Misleading or deceptive conduct in advertising is prohibited

### 5.7 Anti-Discrimination

Under the **Disability Discrimination Act 1992 (Cth)** and the **Anti-Discrimination Act 1977 (NSW)**:

- The booking website must be accessible (WCAG 2.1 AA compliance)
- Services must not unlawfully discriminate on the basis of disability, age, or other protected attributes
- Reasonable adjustments must be made for customers with accessibility needs (e.g., phone booking as alternative)

### 5.8 Disability Inclusion Act 2014 (NSW)

While primarily applicable to government agencies, the **Disability Inclusion Act 2014 (NSW)** reflects the NSW Government's commitment to disability inclusion. As an aged care and community-facing operator, the facility should voluntarily align with its principles, including accessible service design and inclusive communication.

### 5.9 Workplace Health & Safety

Under the **Work Health and Safety Act 2011 (NSW)**, staff involved in vehicle handover, cleaning, and inspection must be trained in safe manual handling, vehicle inspection procedures, and emergency protocols. Risk assessments for vehicle hire operations should be documented.

### 5.10 GST & Tax

Under the **A New Tax System (Goods and Services Tax) Act 1999 (Cth)**:

- If the facility's annual turnover exceeds AUD $75,000 (or it is already registered), **GST registration is required**
- Vehicle hire is a taxable supply subject to 10% GST
- All invoices and receipts must display the total GST component and the facility's **ABN**
- BAS (Business Activity Statement) lodgement must reflect hire income

> **Action required:** Confirm with accountant that GST registration is current and that hire income is reported correctly on BAS.

### 5.11 Electronic Transactions

Under the **Electronic Transactions Act 2000 (NSW)**, electronic contracts (booking agreements, terms acceptance via website checkbox) are legally binding provided the customer has the ability to print or save the agreement. Ensure the booking confirmation page includes a downloadable PDF or email copy of the terms agreed.

---

## 6. Operations Plan

### 6.1 Booking & Handover Workflow

```
Customer Books Online
        │
        ▼
Booking System Sends Confirmation Email to Customer
        │
        ▼
System Notifies Staff (Email / Dashboard Alert)
        │
        ▼
Staff Confirms Booking (calls customer if needed) + Processes Payment
        │
        ▼
Vehicle Prepared: Cleaned, Fuelled, Safety Checked
        │
        ▼
Customer Arrives → Staff Verifies ID + Licence
        │
        ▼
Customer Signs Hire Agreement & Waiver
        │
        ▼
Keys Handed Over + Vehicle Walked Around (photos taken)
        │
        ▼
Customer Uses Vehicle
        │
        ▼
Vehicle Returned → Staff Inspects + Records Condition
        │
        ▼
Booking Marked Complete → Deposit Released (Phase 2)
```

### 6.2 Key Management & Security

- Vehicle keys stored in a **locked key cabinet** inside the facility
- Each key set tagged with vehicle ID and a numbered fob
- Key handover recorded in booking system (mark as "picked up")
- After-hours key return via secure drop-box (Phase 2 optional)

### 6.3 Vehicle Turnaround Standards

| Step | Time Allocation |
|---|---|
| Pre-hire safety inspection | 15 minutes |
| Cleaning and sanitising (standard) | 30 minutes |
| Cleaning (accessible van) | 45 minutes |
| Fuelling (if required) | 20 minutes |
| Buffer between bookings (system-enforced) | 60 minutes minimum |

### 6.4 Fleet Maintenance Schedule

| Interval | Action |
|---|---|
| Before each hire | Visual inspection: tyres, lights, fluids, cleanliness |
| Weekly | Full walk-around inspection; tyre pressure |
| Monthly | Fluid top-ups, interior deep clean |
| Per manufacturer schedule | Scheduled servicing (logbook) |
| Annually (or per insurer requirement) | Roadworthiness inspection |

Vehicles must be removed from the booking system (status set to `maintenance`) whenever they are scheduled for service.

### 6.5 Customer Support

| Channel | Detail |
|---|---|
| Phone | Facility main number during business hours |
| Email | Dedicated inbox (e.g., rentals@facility.com.au); 4-hour response SLA |
| Website | FAQ page covering bookings, payments, cancellations, accessibility |
| Complaints | NSW Fair Trading complaint process linked in footer |

### 6.6 Accessibility Standards for Service Delivery

In alignment with the Disability Inclusion Act 2014 (NSW) and Disability Discrimination Act 1992 (Cth):

- Phone booking available for customers who cannot use the online system
- Staff trained in disability awareness and appropriate communication
- Pickup area accessible for wheelchair users (kerb cuts, ramp access)
- Vehicle handover area compliant with accessible parking standards
- All accessible vehicle features (ramps, anchor points, hand controls) inspected before each hire

---

## 7. Technology Overview

### 7.1 System Summary

The booking platform is a purpose-built web application with:

- A **public booking portal** accessible via a link on the facility's existing website
- An **admin dashboard** for staff to manage vehicles, reservations, and operations
- A **small database** (SQLite) stored on the cloud server — no ongoing database licensing costs
- **In-memory caching** for fast availability queries

### 7.2 Infrastructure Summary

| Component | Details |
|---|---|
| Hosting | Cloud VPS — Sydney region (DigitalOcean / AWS Lightsail) |
| Estimated monthly cost | AUD $14–20 |
| Database | SQLite (file-based; suitable for 100 vehicles, low traffic) |
| TLS / Security | HTTPS enforced; Let's Encrypt certificate (free, auto-renewing) |
| Backups | Automated daily database backup; 14-day retention |
| Uptime target | 99.5% (monitored by free uptime service) |

### 7.3 Payment Processing Phases

| Phase | Mechanism | Timeline |
|---|---|---|
| Phase 1 (Launch) | Payment form captures billing details; staff confirms payment manually by phone/bank transfer | Month 0–3 |
| Phase 2 | Integrated payment gateway (Stripe, eWAY, or Tyro — Australian-compliant) | Month 3–6 |
| Phase 3 (Optional) | Security deposit hold, automated receipts, NDIS invoicing integration | Month 6–12 |

---

## 8. Financial Plan

### 8.1 Revenue Projections

#### Scenario Assumptions

| Scenario | Bookings/Day (fleet avg.) | Avg. Revenue/Booking | Monthly Revenue | Annual Revenue |
|---|---|---|---|---|
| Conservative | 1.5 | $88 | $3,960 | $47,520 |
| Moderate | 2.5 | $99 | $7,425 | $89,100 |
| Optimistic | 4.0 | $110 | $13,200 | $158,400 |

*GST-inclusive figures above. GST (10%) is remitted to the ATO — net revenue is approximately 9.09% lower.*

### 8.2 Cost Structure

#### Fixed Monthly Costs

| Item | Monthly Cost (AUD est.) |
|---|---|
| Cloud hosting (VPS + backups + domain) | $15–20 |
| Email service (SMTP provider e.g. Mailgun free tier or similar) | $0–5 |
| Uptime monitoring (UptimeRobot free) | $0 |
| Payment gateway fees (Phase 2, variable) | ~2.9% + $0.30 per transaction |
| **Total Fixed Tech** | **~$15–25 / month** |

#### Variable Operating Costs (Rental-Specific Only)

> **Important:** Vehicle purchase, registration, and routine mechanical servicing are **existing facility costs** and are not included below. The rental service adds only the marginal costs shown.

| Item | Monthly Estimate (AUD) | Notes |
|---|---|---|
| Staff time: vehicle preparation, admin, handover (est. 12 hrs/wk @ $32/hr award) | $1,664 | Attributable to rental operations |
| Additional vehicle maintenance / wear reserve | $300–600 | Incremental wear from public hire, above baseline facility use |
| Cleaning supplies (rental-related) | $100–200 | Above normal facility cleaning |
| Insurance premium increase (hire endorsement) | $200–500 | Endorsement to existing policy to cover third-party hire; confirm with insurer |
| Marketing (ongoing) | $100–300 | |
| **Total Variable (rental-attributable)** | **~$2,364–3,264 / month** | |

*Vehicle purchase, standard servicing, registration, and CTP are existing facility costs. They are not charged to the rental service.*

### 8.3 Break-Even Analysis

Based on conservative revenue of $88 per booking:

| Cost Element | Monthly (AUD) |
|---|---|
| Fixed tech | $20 |
| Insurance allocation | $300 |
| Staff (minimum viable) | $1,664 |
| Maintenance reserve | $500 |
| **Total Operating** | **$2,484** |

**Bookings to break even:** $2,484 ÷ $88 ≈ **29 bookings/month** (< 1 booking per day)

This is a highly achievable threshold given the target market size and the facility's existing community relationships.

### 8.4 Capital Requirements

Because the facility already owns the fleet, **vehicle acquisition is not a startup cost**. The capital required to launch is limited to technology, legal preparation, and marketing.

| Item | One-Off Cost (AUD) | Notes |
|---|---|---|
| ~~Vehicle fleet purchase~~ | ~~—~~ | **Not required — already owned** |
| Application development | $5,000–$15,000 | If outsourced to a developer; $0 if built in-house |
| Legal review (T&Cs, hire agreement, privacy policy) | $1,500–$3,000 | Solicitor review; strongly recommended |
| Insurance endorsement / broker fees | $500–$1,500 | One-off to add hire endorsement to existing policy |
| Staff training | $500–$1,000 | System training, handover procedures |
| Initial marketing (launch campaign, signage, flyers) | $500–$1,500 | |
| **Total Estimated Capital** | **$8,000–$22,000** | Extremely low compared to starting a new rental business from scratch |

*This is a fraction of what it would cost to launch a vehicle hire service with a new fleet. A comparable commercial rental startup acquiring 100 vehicles would face AUD $3–8 million in fleet capital alone.*

### 8.5 Payback Period

At moderate scenario revenue ($7,425/month gross) minus rental-attributable operating costs (~$2,484/month):

**Monthly net contribution:** ~$4,941
**Payback on $15,000 capital investment:** approximately **3 months**
**Payback on $8,000 capital investment (low end):** approximately **2 months**

Because there is no vehicle loan, lease, or depreciation expense attributable to the rental service, the effective margin per booking is high. Even a single busy weekend can cover a full month of operating costs.

---

## 9. Marketing & Customer Acquisition

### 9.1 Launch Strategy

**Phase 1 — Internal Capture (Month 1–3):**
- Email newsletter to families of all current residents announcing the new service
- Printed flyers in facility common areas, visitor reception, and car park
- Staff word-of-mouth (staff as brand ambassadors)
- Link prominently placed on facility website homepage

**Phase 2 — Community Reach (Month 3–6):**
- Partner with local GP clinics, specialist medical practices, and allied health centres
- Approach local NDIS service coordinators and support coordinators
- List on local community Facebook groups and Nextdoor
- Contact Local Area Coordinator (LAC) networks in the region

**Phase 3 — Digital Growth (Month 6–12):**
- Google My Business listing (free)
- Paid local Google Ads targeting "wheelchair hire Sydney", "accessible car hire NSW"
- Seasonal promotions (Christmas, school holidays)
- Referral discount program

### 9.2 Key Messages

- "Trusted transport from a care organisation you already know"
- "Accessible vehicles, accessible booking — online in minutes"
- "Community rates — supporting the people who support your family"

### 9.3 Promotional Offers

| Offer | Detail |
|---|---|
| Launch promotion | 10% off first booking for facility families (first 90 days) |
| Community partner discount | 15% off for registered NDIS providers (code-based) |
| Referral credit | $10 off next booking for each referral |
| Loyalty rate | After 5 bookings, qualify for monthly subscriber rate |

---

## 10. Risk Management

### 10.1 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Uninsured damage to vehicle by renter | Medium | High | Signed waiver; security deposit (Phase 2); comprehensive insurance with hire endorsement |
| Insurance gap — insurer excludes hire use | High | Critical | **Resolve before launch.** Engage broker; obtain written confirmation of hire cover |
| Licensing non-compliance (Motor Dealers Act) | Medium | High | Obtain legal advice pre-launch; apply for relevant licence if required |
| Low booking adoption | Medium | Medium | Target facility families first; introductory promotions; community partnerships |
| Vehicle double-booking | Low | Medium | Atomic reservation transactions in software; in-memory cache with short TTL |
| Data breach (customer PII) | Low | High | HTTPS, access controls, limited data collection; Notifiable Data Breach procedure in place |
| Staff capacity overrun during peak periods | Medium | Medium | Stagger booking windows; limit daily booking slots; recruit casual staff |
| Vehicle unavailability (maintenance) | Medium | Low | Fleet buffer; maintenance status in system blocks bookings proactively |
| Payment fraud (Phase 1) | Low | Medium | Manual confirmation by phone; verify ID at pickup; Phase 2 gateway handles fraud controls |
| Regulatory change (transport, hire licensing) | Low | Medium | Annual legal review; subscribe to NSW Fair Trading and Transport for NSW updates |

### 10.2 Incident Response

- **Vehicle accident:** Call police if required; notify insurer within 24 hours; document via incident report; remove vehicle from booking system
- **Customer complaint:** Log in system; respond within 24 hours; escalate to facility manager if unresolved within 48 hours; NSW Fair Trading referral if dispute unresolved
- **Data breach:** Follow Notifiable Data Breach procedures (Privacy Act 1988, Cth); notify OAIC and affected individuals as required

---

## 11. SWOT Analysis

| | **Strengths** | **Weaknesses** |
|---|---|---|
| **Internal** | ✔ Fleet already owned — zero acquisition cost | ✗ Limited to operating hours (staff dependent) |
| | ✔ Vehicles already registered, serviced, and insured | ✗ Manual processes in Phase 1 |
| | ✔ Existing trusted brand in community | ✗ Small team; limited capacity to handle surge in bookings |
| | ✔ Low capital outlay vs. any competitor starting from scratch | ✗ No prior vehicle hire experience |
| | ✔ Community relationships already established | ✗ Revenue depends on vehicles being idle (facility use takes priority) |
| **External** | **Opportunities** | **Threats** |
| | ✔ Growing elderly and NDIS population in NSW | ✗ Competitor rideshare platforms improving accessibility |
| | ✔ Gap in accessible vehicle hire market | ✗ Insurance premium increases for hire use |
| | ✔ NDIS funding can be applied to transport | ✗ NSW regulatory changes (licensing, transport rules) |
| | ✔ Community goodwill for care-sector operators | ✗ Low awareness initially if marketing is insufficient |

---

## 12. Governance & Staffing

### 12.1 Organisational Responsibility

| Role | Responsibilities |
|---|---|
| **Facility Owner / Director** | Strategic oversight; insurance and legal sign-off; financial approvals |
| **Operations Manager** | Day-to-day booking management; staff scheduling; incident response |
| **Front Desk / Admin Staff** | Booking confirmations; customer communication; key handover; system updates |
| **Maintenance Staff** | Vehicle cleaning; pre-hire inspections; maintenance scheduling |
| **IT / Developer (contracted)** | Platform maintenance; software updates; backup verification |

### 12.2 Staff Training Requirements

Before launch, the following training must be completed:

- Booking system operation (admin dashboard)
- Key handover procedure and vehicle walk-around checklist
- Hire agreement and waiver process
- Accessibility awareness (disability-inclusive customer service)
- Privacy obligations under the APPs
- Incident reporting procedure

### 12.3 Policies Required

| Policy | Status |
|---|---|
| Vehicle Hire Terms & Conditions | Draft (legal review required) |
| Privacy Policy | Draft (APP-compliant) |
| Cancellation & Refund Policy | Draft |
| Damage Assessment & Deposit Policy | Draft (Phase 2) |
| Vehicle Maintenance & Safety Policy | Draft |
| Driver Eligibility & Licence Verification Policy | Draft |
| Incident Response Policy | Draft |

---

## 13. Implementation Roadmap

### Phase 1 — Launch (Months 0–3)

| Milestone | Owner | Target |
|---|---|---|
| Legal review of hire licensing requirements | Legal adviser | Week 1 |
| Insurance endorsement confirmed | Broker | Week 2 |
| Terms, conditions, and privacy policy drafted and reviewed | Legal adviser | Week 2–3 |
| Booking platform development completed | Developer | Week 4–6 |
| Fleet photographed and entered into system | Admin staff | Week 5 |
| Staff trained on system and procedures | Operations manager | Week 6 |
| Soft launch (facility families only) | All | Week 7 |
| Public launch via website and email | Marketing | Week 8 |

### Phase 2 — Consolidation (Months 3–6)

| Milestone | Owner |
|---|---|
| Payment gateway integrated (Stripe or eWAY) | Developer |
| Automated email confirmations and reminders | Developer |
| Security deposit flow implemented | Developer |
| Community partner outreach completed | Operations |
| First KPI review and pricing adjustment | Management |

### Phase 3 — Growth (Months 6–12)

| Milestone | Owner |
|---|---|
| NDIS invoicing support (optional) | Developer / Accountant |
| Driver validation (licence scan) integration | Developer |
| Reporting dashboard for management | Developer |
| Evaluate fleet expansion or mix adjustment | Management |
| Annual legal and insurance review | Legal / Broker |

---

## 14. Key Performance Indicators

| KPI | Measurement Method | Target (Year 1) |
|---|---|---|
| Fleet utilisation rate | Hours rented ÷ hours available | ≥ 15% |
| Monthly bookings | Admin dashboard | ≥ 30/month by Month 3 |
| Booking conversion rate | Visits ÷ completed bookings | ≥ 10% |
| Average revenue per rental | Total revenue ÷ bookings | ≥ $88 AUD |
| Customer satisfaction | Post-rental email survey (1–5 stars) | ≥ 4.2 / 5.0 |
| Cancellation rate | Cancelled ÷ total reservations | ≤ 15% |
| Repeat customer rate | Customers with > 1 booking | ≥ 30% by Month 6 |
| Incident rate | Incidents per 100 rentals | ≤ 2 |
| Platform uptime | Monitoring service | ≥ 99.5% |

---

## 15. Appendices

### Appendix A — Applicable Legislation Summary

| Legislation | Jurisdiction | Relevance |
|---|---|---|
| Motor Dealers and Repairers Act 2013 | NSW | Vehicle hire licensing |
| Road Transport Act 2013 | NSW | Vehicle registration, road use |
| Motor Accidents Injuries Act 2017 | NSW | CTP insurance |
| Work Health and Safety Act 2011 | NSW | Staff safety in hire operations |
| Anti-Discrimination Act 1977 | NSW | Non-discrimination in service provision |
| Disability Inclusion Act 2014 | NSW | Inclusive service design |
| Privacy Act 1988 | Commonwealth | Australian Privacy Principles |
| Competition and Consumer Act 2010 (Sch. 2) | Commonwealth | Australian Consumer Law |
| Disability Discrimination Act 1992 | Commonwealth | Web accessibility, service access |
| A New Tax System (GST) Act 1999 | Commonwealth | GST on hire services |
| Electronic Transactions Act 2000 | NSW | Validity of online agreements |

### Appendix B — Recommended Professional Advisers

| Role | Purpose |
|---|---|
| Solicitor (transport / commercial) | Hire agreement, licensing advice, terms and conditions review |
| Insurance broker (commercial motor) | Hire endorsements, public liability, CTP confirmation |
| Chartered accountant | GST registration, BAS, revenue reporting |
| IT / web developer | Platform build, hosting, security |

### Appendix C — Useful NSW Government Resources

- NSW Fair Trading — Motor Vehicle Dealers: www.fairtrading.nsw.gov.au
- Transport for NSW: www.transport.nsw.gov.au
- NDIS Quality and Safeguards Commission: www.ndiscommission.gov.au
- Office of the Australian Information Commissioner (OAIC): www.oaic.gov.au
- Digital NSW Accessibility: www.digital.nsw.gov.au/delivery/accessibility-and-inclusivity

---

*This business plan is a working document and should be reviewed and updated at each phase milestone. All financial projections are illustrative and should be validated against actual trading results. Legal and insurance matters must be resolved with qualified professional advisers before commencing public hire operations.*
