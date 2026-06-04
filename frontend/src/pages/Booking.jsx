import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getVehicle, createReservation, submitPaymentForm } from '../utils/api.js';
import BookingProgress from '../components/BookingProgress.jsx';
import { AlertError, AlertInfo, AlertWarning } from '../components/Alert.jsx';
import { formatAUDFromString, formatSydney, vehicleTypeLabel } from '../utils/formatters.js';

const TERMS_TEXT = `VEHICLE HIRE AGREEMENT & TERMS AND CONDITIONS

Special Need Vehicle Rental — NSW, Australia

1. ELIGIBILITY
The renter must hold a current, valid Australian driver's licence (or international equivalent as permitted under NSW road rules). Minimum age: 25 years. For vehicles with special controls, appropriate licence endorsements are required.

2. USE OF VEHICLE
The vehicle must only be used on sealed roads unless otherwise agreed in writing. The vehicle must not be used for commercial carrying of passengers, racing, sub-hire, or any illegal purpose. The renter is responsible for all tolls, fines, and infringements incurred during the hire period.

3. FUEL POLICY
The vehicle must be returned with the same fuel level as at pickup. Failure to do so will incur a refuelling fee at current market rates plus an administration fee.

4. CARE OF VEHICLE
The renter must take reasonable care of the vehicle. Any damage, accident, or theft must be reported to us immediately. The renter is liable for damage caused by negligence, misuse, or breach of these terms.

5. INSURANCE
The vehicle is comprehensively insured. The renter accepts liability for any damage or loss up to the agreed excess amount. The renter must not drive under the influence of alcohol or drugs.

6. CANCELLATION POLICY
- More than 48 hours before pickup: full refund / no charge
- 24–48 hours before pickup: 50% of hire cost may be charged
- Less than 24 hours before pickup: full hire cost applies
Refunds in Phase 1 are processed manually by staff within 3 business days.

7. RETURN OF VEHICLE
The vehicle must be returned on time and in the same condition as at pickup. Late returns without prior agreement will be charged at the standard hourly rate.

8. PRIVACY
Your personal information is collected and handled in accordance with the Privacy Act 1988 (Cth) and our Privacy Policy available at our website.

9. GOVERNING LAW
These terms are governed by the laws of New South Wales, Australia. Any disputes are subject to the jurisdiction of NSW courts.

10. ELECTRONIC AGREEMENT
By checking the acceptance box, you agree that this constitutes a legally binding electronic agreement under the Electronic Transactions Act 2000 (NSW).`;

const ADDON_PRICES = {
  child_seat: 5.50,
  gps: 5.50,
  extended_hrs: 11.00,
};
const ADDON_LABELS = {
  child_seat: 'Child Booster Seat',
  gps: 'GPS Navigation Unit',
  extended_hrs: 'Extended Hours Pickup',
};

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const headingRef = useRef(null);

  const vehicleId  = searchParams.get('vehicle_id');
  const startUtc   = searchParams.get('start');
  const endUtc     = searchParams.get('end');
  const addonsStr  = searchParams.get('addons') || '';
  const addons     = addonsStr ? addonsStr.split(',').filter(Boolean) : [];

  const [vehicle, setVehicle] = useState(null);
  const [step, setStep]       = useState(1);
  const [error, setError]     = useState('');

  // Step 1 fields
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [use,   setUse]   = useState('');
  const [errs1, setErrs1] = useState({});

  // Step 2
  const [agreed, setAgreed] = useState(false);
  const [errs2, setErrs2]   = useState({});

  // Step 3
  const [cardName,  setCardName]  = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [expMonth,  setExpMonth]  = useState('');
  const [expYear,   setExpYear]   = useState('');
  const [errs3, setErrs3]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState(null);

  useEffect(() => {
    if (!vehicleId) { navigate('/availability'); return; }
    getVehicle(vehicleId).then(r => setVehicle(r.data)).catch(() => navigate('/availability'));
  }, [vehicleId]);

  // Move focus to heading on step change
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  if (!vehicle) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500" aria-live="polite">Loading…</div>
  );

  const hourlyRate = parseFloat(vehicle.hourly_rate_aud);
  const dailyRate  = parseFloat(vehicle.daily_rate_aud);
  const ms = startUtc && endUtc ? new Date(endUtc) - new Date(startUtc) : 0;
  const hours = ms / 3600000;
  const days  = Math.floor(hours / 24);
  const remH  = Math.ceil(hours % 24);
  const rentalTotal  = days * dailyRate + remH * hourlyRate;
  const addonsTotal  = addons.reduce((s, a) => s + (ADDON_PRICES[a] || 0), 0);
  const grandTotal   = rentalTotal + addonsTotal;
  const gst          = grandTotal * 10 / 110;

  // ---- Step 1 validation ----
  function validateStep1() {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Full name is required (at least 2 characters)';
    if (!email.trim()) e.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email address (e.g., name@example.com)';
    if (!phone.trim()) e.phone = 'Mobile phone number is required';
    else if (!/^(\+61|0)[2-478]\d{8,9}$/.test(phone.replace(/\s/g, '')))
      e.phone = 'Please enter a valid Australian mobile number (e.g. 0412 345 678)';
    return e;
  }

  function handleStep1Next() {
    const e = validateStep1();
    setErrs1(e);
    if (Object.keys(e).length === 0) { setStep(2); setError(''); }
  }

  // ---- Step 2 ----
  function handleStep2Next() {
    if (!agreed) { setErrs2({ terms: 'You must agree to the hire terms and conditions to proceed' }); return; }
    setErrs2({});
    setStep(3);
    setError('');
    // Pre-fill payment form from step 1
    setCardName(name);
  }

  // ---- Step 3: submit ----
  function validateStep3() {
    const e = {};
    if (!cardName.trim()) e.cardName = 'Name on card is required';
    if (!/^\d{4}$/.test(cardLast4)) e.cardLast4 = 'Please enter the last 4 digits of your card';
    if (!expMonth) e.expMonth = 'Expiry month is required';
    if (!expYear || expYear.length !== 4) e.expYear = 'Expiry year is required';
    return e;
  }

  async function handleSubmit() {
    const e = validateStep3();
    setErrs3(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    setError('');
    try {
      // Create reservation
      const res = await createReservation({
        vehicle_id:     parseInt(vehicleId, 10),
        customer_name:  name,
        customer_email: email,
        customer_phone: phone,
        intended_use:   use || undefined,
        addons_json:    addons,
        start_utc:      startUtc,
        end_utc:        endUtc,
        terms_accepted: true,
      });

      const resv = res.data;
      setReservation(resv);

      // Submit payment form
      await submitPaymentForm({
        reservation_id:  resv.id,
        cardholder_name: cardName,
        billing_email:   email,
        billing_phone:   phone,
        card_last4:      cardLast4,
        expiry_month:    expMonth,
        expiry_year:     expYear,
        amount_aud:      grandTotal.toFixed(2),
      });

      navigate('/booking/confirmation', { state: { reservation: resv, vehicle } });
    } catch (err) {
      if (err.status === 409) {
        setError('This vehicle was just booked by another customer. Please go back and choose a different vehicle or time.');
      } else {
        setError(err.message || 'Booking failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (err) => `input ${err ? 'input-error' : ''}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold text-gray-900 mb-6 outline-none">
        Complete Your Booking
      </h1>

      <BookingProgress step={step} />

      {/* Booking summary */}
      <div className="card p-4 mb-6 text-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-900">{vehicle.name}</p>
            {startUtc && endUtc && (
              <p className="text-gray-500 mt-0.5">
                {formatSydney(startUtc)} → {formatSydney(endUtc)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-gray-900">{formatAUDFromString(grandTotal.toFixed(2))}</p>
            <p className="text-xs text-gray-500">incl. GST</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-6"><AlertError>{error} <a href="/availability" className="underline font-medium">Back to search</a></AlertError></div>}

      {/* ===== Step 1 ===== */}
      {step === 1 && (
        <section className="card p-6" aria-labelledby="step1-heading">
          <h2 id="step1-heading" className="text-xl font-semibold text-gray-900 mb-5">Step 1 of 3 — Personal Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="cust-name" className="label">Full name <span className="text-red-500" aria-label="required">*</span></label>
              <input id="cust-name" type="text" value={name} onChange={e => setName(e.target.value)}
                className={inputClass(errs1.name)} autoComplete="name"
                aria-required="true" aria-describedby={errs1.name ? 'name-err' : undefined} />
              {errs1.name && <p id="name-err" className="error-text" role="alert">⚠ {errs1.name}</p>}
            </div>
            <div>
              <label htmlFor="cust-email" className="label">Email address <span className="text-red-500" aria-label="required">*</span></label>
              <input id="cust-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={inputClass(errs1.email)} autoComplete="email"
                aria-required="true" aria-describedby={errs1.email ? 'email-err' : undefined} />
              {errs1.email && <p id="email-err" className="error-text" role="alert">⚠ {errs1.email}</p>}
            </div>
            <div>
              <label htmlFor="cust-phone" className="label">Mobile phone <span className="text-red-500" aria-label="required">*</span></label>
              <input id="cust-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="0412 345 678" className={inputClass(errs1.phone)} autoComplete="tel"
                aria-required="true" aria-describedby={errs1.phone ? 'phone-err' : 'phone-hint'} />
              <p id="phone-hint" className="text-xs text-gray-500 mt-1">Australian mobile or landline (e.g. 0412 345 678)</p>
              {errs1.phone && <p id="phone-err" className="error-text" role="alert">⚠ {errs1.phone}</p>}
            </div>
            <div>
              <label htmlFor="cust-use" className="label">Intended use <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea id="cust-use" value={use} onChange={e => setUse(e.target.value)}
                rows={2} placeholder="e.g. medical appointment, community outing, family visit"
                className="input resize-none" />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={handleStep1Next} className="btn-primary">Next: Terms &amp; Conditions →</button>
          </div>
        </section>
      )}

      {/* ===== Step 2 ===== */}
      {step === 2 && (
        <section className="card p-6" aria-labelledby="step2-heading">
          <h2 id="step2-heading" className="text-xl font-semibold text-gray-900 mb-4">Step 2 of 3 — Terms &amp; Conditions</h2>
          <div
            className="border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto text-sm text-gray-700 bg-gray-50 whitespace-pre-wrap font-mono leading-relaxed"
            tabIndex={0}
            role="region"
            aria-label="Vehicle Hire Terms and Conditions — scroll to read"
          >
            {TERMS_TEXT}
          </div>
          <div className="mt-4 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 flex-shrink-0"
                aria-required="true"
                aria-describedby={errs2.terms ? 'terms-err' : 'terms-hint'}
              />
              <span className="text-sm text-gray-700">
                I have read and agree to the <strong>Vehicle Hire Agreement, Terms &amp; Conditions</strong>, and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline hover:text-brand-800">
                  Privacy Policy
                </a>.
              </span>
            </label>
            <p id="terms-hint" className="text-xs text-gray-500 ml-7">
              By accepting, you form a legally binding electronic agreement under the Electronic Transactions Act 2000 (NSW).
            </p>
            {errs2.terms && <p id="terms-err" className="error-text ml-7" role="alert">⚠ {errs2.terms}</p>}
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
            <button onClick={handleStep2Next} className="btn-primary">Next: Payment →</button>
          </div>
        </section>
      )}

      {/* ===== Step 3 ===== */}
      {step === 3 && (
        <section className="card p-6" aria-labelledby="step3-heading">
          <h2 id="step3-heading" className="text-xl font-semibold text-gray-900 mb-4">Step 3 of 3 — Payment Details</h2>

          <AlertWarning>
            <strong>Payment Notice:</strong> This form captures your payment details for staff to process.
            Your booking is <strong>held (not confirmed)</strong> until our team contacts you within 2 business hours
            to finalise payment by phone or bank transfer.
          </AlertWarning>

          <div className="space-y-4 mt-5">
            <div>
              <label htmlFor="card-name" className="label">Name on card <span className="text-red-500" aria-label="required">*</span></label>
              <input id="card-name" type="text" value={cardName} onChange={e => setCardName(e.target.value)}
                autoComplete="cc-name" className={inputClass(errs3.cardName)}
                aria-required="true" aria-describedby={errs3.cardName ? 'cname-err' : undefined} />
              {errs3.cardName && <p id="cname-err" className="error-text" role="alert">⚠ {errs3.cardName}</p>}
            </div>

            <div>
              <label htmlFor="card-last4" className="label">Card number — last 4 digits only <span className="text-red-500" aria-label="required">*</span></label>
              <input id="card-last4" type="tel" inputMode="numeric" maxLength={4}
                value={cardLast4} onChange={e => setCardLast4(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 4242" className={`input max-w-[120px] ${errs3.cardLast4 ? 'input-error' : ''}`}
                aria-required="true" aria-describedby={errs3.cardLast4 ? 'last4-err' : 'last4-hint'} />
              <p id="last4-hint" className="text-xs text-gray-500 mt-1">We only store the last 4 digits — never your full card number.</p>
              {errs3.cardLast4 && <p id="last4-err" className="error-text" role="alert">⚠ {errs3.cardLast4}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="exp-month" className="label">Expiry month <span className="text-red-500" aria-label="required">*</span></label>
                <select id="exp-month" value={expMonth} onChange={e => setExpMonth(e.target.value)}
                  className={inputClass(errs3.expMonth)} aria-required="true"
                  aria-describedby={errs3.expMonth ? 'month-err' : undefined}>
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = String(i + 1).padStart(2, '0');
                    return <option key={m} value={m}>{m}</option>;
                  })}
                </select>
                {errs3.expMonth && <p id="month-err" className="error-text" role="alert">⚠ {errs3.expMonth}</p>}
              </div>
              <div>
                <label htmlFor="exp-year" className="label">Expiry year <span className="text-red-500" aria-label="required">*</span></label>
                <select id="exp-year" value={expYear} onChange={e => setExpYear(e.target.value)}
                  className={inputClass(errs3.expYear)} aria-required="true"
                  aria-describedby={errs3.expYear ? 'year-err' : undefined}>
                  <option value="">YYYY</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const y = String(new Date().getFullYear() + i);
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
                {errs3.expYear && <p id="year-err" className="error-text" role="alert">⚠ {errs3.expYear}</p>}
              </div>
            </div>

            {/* Read-only amount */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total amount (incl. GST)</span>
                <span className="font-bold text-gray-900 text-base">{formatAUDFromString(grandTotal.toFixed(2))} AUD</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">GST component: {formatAUDFromString(gst.toFixed(2))}</p>
            </div>
          </div>

          <div className="flex justify-between mt-6 gap-4">
            <button onClick={() => setStep(2)} className="btn-secondary" disabled={submitting}>← Back</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Submitting…' : 'Submit Booking & Payment Details'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
