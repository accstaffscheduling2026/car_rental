import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../utils/stripe.js';
import { getVehicle, createReservation, createPaymentIntent, cancelReservation, validateBookingCode, validatePromoCode } from '../utils/api.js';
import { useUserAuth } from '../hooks/useUserAuth.js';
import BookingProgress from '../components/BookingProgress.jsx';
import { AlertError, AlertInfo } from '../components/Alert.jsx';
import { formatAUDFromString, formatSydney } from '../utils/formatters.js';

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
Refunds are processed within 3–5 business days via Stripe to the original payment method.

7. RETURN OF VEHICLE
The vehicle must be returned on time and in the same condition as at pickup. Late returns without prior agreement will be charged at the standard hourly rate.

8. PRIVACY
Your personal information is collected and handled in accordance with the Privacy Act 1988 (Cth) and our Privacy Policy available at our website.

9. GOVERNING LAW
These terms are governed by the laws of New South Wales, Australia. Any disputes are subject to the jurisdiction of NSW courts.

10. ELECTRONIC AGREEMENT
By checking the acceptance box, you agree that this constitutes a legally binding electronic agreement under the Electronic Transactions Act 2000 (NSW).`;

const ADDON_PRICES = {
  child_seat:   5.50,
  gps:          5.50,
  extended_hrs: 11.00,
};
const ADDON_LABELS = {
  child_seat:   'Child Booster Seat',
  gps:          'GPS Navigation Unit',
  extended_hrs: 'Extended Hours Pickup',
};

// ─── Stripe payment form — must be a child of <Elements> to use useStripe/useElements ───
function StripePaymentForm({ grandTotal, gst, onBack, reservationId, customerName, customerEmail, customerPhone, globalError, setGlobalError }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);

  async function handlePay(e) {
    e.preventDefault();

    // Guard: show diagnostic message if Stripe isn't ready instead of silently failing
    if (!stripe) {
      setGlobalError('Payment system not ready — stripe not initialised. Please refresh the page and try again.');
      return;
    }
    if (!elements) {
      setGlobalError('Payment form not ready — elements not initialised. Please refresh the page and try again.');
      return;
    }

    setSubmitting(true);
    setGlobalError('');

    const returnUrl = `${window.location.origin}/booking/confirmation?reservation_id=${reservationId}`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('__timeout__')), 45000)
    );

    try {
      const { error } = await Promise.race([
        stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: returnUrl,
            payment_method_data: {
              billing_details: {
                name:  customerName,
                email: customerEmail,
                phone: customerPhone,
              },
            },
          },
        }),
        timeoutPromise,
      ]);

      // Only reached on a Stripe error — success redirects the browser away.
      if (error) {
        setGlobalError(
          error.type === 'card_error' || error.type === 'validation_error'
            ? error.message
            : `Payment failed (${error.code || error.type}): ${error.message}`
        );
      }
    } catch (err) {
      if (err.message === '__timeout__') {
        setGlobalError(
          'Payment timed out — browser could not reach Stripe. ' +
          'Check your internet connection and try again. No charge has been made.'
        );
      } else {
        // Show the real error so we can diagnose it
        setGlobalError(`Error: ${err.message || String(err)}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handlePay} noValidate>
      {/* Amount summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total charge (incl. GST)</span>
          <span className="font-bold text-gray-900 text-base">{formatAUDFromString(grandTotal.toFixed(2))} AUD</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">GST included: {formatAUDFromString(gst.toFixed(2))}</p>
      </div>

      {/* Stripe Payment Element — renders card input, Apple Pay, Google Pay depending on browser */}
      <div className="mb-5">
        <PaymentElement
          onReady={() => setStripeReady(true)}
          options={{
            layout: 'tabs',
            fields: {
              billingDetails: {
                email: 'never',  // already collected in Step 1
                phone: 'never',
              },
            },
          }}
        />
      </div>

      {globalError && (
        <div className="mb-4">
          <AlertError>{globalError}</AlertError>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mb-5 flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Secured by Stripe. Your card details are never stored on our servers.
      </p>

      <div className="flex justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="btn-secondary"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || !stripeReady || submitting}
          className="btn-primary flex-1"
        >
          {submitting
            ? <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                </svg>
                Processing… please wait
              </span>
            : `Pay ${formatAUDFromString(grandTotal.toFixed(2))} AUD`
          }
        </button>
      </div>

      {submitting && (
        <p className="text-xs text-gray-400 text-center mt-3" aria-live="polite">
          Contacting your bank — this usually takes 5–15 seconds. Please do not close or refresh the page.
        </p>
      )}
    </form>
  );
}

// ─── Main Booking component ──────────────────────────────────────────────────
export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const headingRef     = useRef(null);
  const { user }       = useUserAuth();

  const vehicleId = searchParams.get('vehicle_id');
  const startUtc  = searchParams.get('start');
  const endUtc    = searchParams.get('end');
  const addonsStr = searchParams.get('addons') || '';
  const addons    = addonsStr ? addonsStr.split(',').filter(Boolean) : [];

  const [vehicle, setVehicle]           = useState(null);
  const [step, setStep]                 = useState(1);
  const [error, setError]               = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Step 1 fields
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [use,   setUse]   = useState('');
  const [errs1, setErrs1] = useState({});

  // Step 2
  const [agreed, setAgreed] = useState(false);
  const [errs2,  setErrs2]  = useState({});

  // Promo code (special rate discount)
  const [promoCode,       setPromoCode]       = useState('');
  const [promoApplied,    setPromoApplied]    = useState(null); // { code, discount_percent }
  const [promoErr,        setPromoErr]        = useState('');
  const [promoChecking,   setPromoChecking]   = useState(false);

  // Step 3 — payment option
  const [paymentOption, setPaymentOption]   = useState('card'); // 'card' | 'code'
  const [employeeCode,  setEmployeeCode]    = useState('');
  const [codeInfo,      setCodeInfo]        = useState(null);   // { employee_name, expires_at } when verified
  const [codeErr,       setCodeErr]         = useState('');
  const [codeSubmitting, setCodeSubmitting] = useState(false);

  // Step 3 — Stripe card path
  const [reservation,  setReservation]  = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    if (!vehicleId) { navigate('/availability'); return; }
    getVehicle(vehicleId).then(r => setVehicle(r.data)).catch(() => navigate('/availability'));
  }, [vehicleId]);

  useEffect(() => {
    if (user && step === 1) {
      if (!name)  setName(user.name  || '');
      if (!email) setEmail(user.email || '');
      if (!phone) setPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => { headingRef.current?.focus(); }, [step]);

  if (!vehicle) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500" aria-live="polite">Loading…</div>
  );

  const hourlyRate       = parseFloat(vehicle.hourly_rate_aud);
  const dailyRate        = parseFloat(vehicle.daily_rate_aud);
  const ms               = startUtc && endUtc ? new Date(endUtc) - new Date(startUtc) : 0;
  const hours            = ms / 3600000;
  const days             = Math.floor(hours / 24);
  const remH             = Math.ceil(hours % 24);
  const discountPct      = promoApplied?.discount_percent || 0;
  const effectiveDailyRate = dailyRate * (1 - discountPct / 100);
  const rentalTotal      = days * effectiveDailyRate + remH * hourlyRate;
  const rentalNoDiscount = days * dailyRate + remH * hourlyRate;
  const addonsTotal      = addons.reduce((s, a) => s + (ADDON_PRICES[a] || 0), 0);
  const grandTotal       = rentalTotal + addonsTotal;
  const grandNoDiscount  = rentalNoDiscount + addonsTotal;
  const gst              = grandTotal * 10 / 110;

  // ── Promo code ──
  async function handleApplyPromo() {
    const trimmed = promoCode.trim().toUpperCase();
    if (!trimmed) { setPromoErr('Please enter a promo code'); return; }
    setPromoErr('');
    setPromoChecking(true);
    try {
      const res = await validatePromoCode(trimmed);
      setPromoApplied({ code: res.code, discount_percent: res.discount_percent });
    } catch (err) {
      setPromoErr(err.message || 'Invalid promo code');
    } finally {
      setPromoChecking(false);
    }
  }

  // ── Step 1 ──
  function validateStep1() {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Full name is required (at least 2 characters)';
    if (!email.trim()) e.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email address';
    if (!phone.trim()) e.phone = 'Mobile phone number is required';
    else if (!/^(\+61|0)[2-478]\d{8,9}$/.test(phone.replace(/\s/g, '')))
      e.phone = 'Please enter a valid Australian number (e.g. 0412 345 678)';
    return e;
  }

  function handleStep1Next() {
    const e = validateStep1();
    setErrs1(e);
    if (Object.keys(e).length === 0) { setStep(2); setError(''); }
  }

  // ── Step 2 → Step 3: just move, no API calls until user chooses payment method ──
  function handleStep2Next() {
    if (!agreed) { setErrs2({ terms: 'You must agree to the hire terms and conditions to proceed' }); return; }
    setErrs2({});
    setError('');
    setStep(3);
  }

  // ── Step 3: employee code path ──
  async function handleCodeSubmit() {
    const trimmed = employeeCode.trim().toUpperCase();
    if (trimmed.length !== 12) { setCodeErr('Please enter the full 12-character code'); return; }
    setCodeErr('');
    setCodeSubmitting(true);
    setError('');
    try {
      const res = await createReservation({
        vehicle_id:     parseInt(vehicleId, 10),
        customer_name:  name,
        customer_email: email,
        customer_phone: phone.replace(/\s/g, ''),
        intended_use:   use || undefined,
        addons_json:    addons,
        start_utc:      startUtc,
        end_utc:        endUtc,
        terms_accepted: true,
        booking_code:   trimmed,
      });
      navigate('/booking/confirmation', { state: { reservation: res.data, vehicle } });
    } catch (err) {
      if (err.status === 409) {
        setError('This vehicle was just booked by another customer. Please go back and choose a different time.');
      } else if (err.status === 422 && err.message?.toLowerCase().includes('code')) {
        setCodeErr(err.message);
      } else {
        setError(err.message || 'Booking failed. Please try again.');
      }
    } finally {
      setCodeSubmitting(false);
    }
  }

  // ── Step 3: card path — create reservation + PaymentIntent ──
  async function handleCardContinue() {
    setTransitioning(true);
    setError('');
    try {
      const res = await createReservation({
        vehicle_id:     parseInt(vehicleId, 10),
        customer_name:  name,
        customer_email: email,
        customer_phone: phone.replace(/\s/g, ''),
        intended_use:   use || undefined,
        addons_json:    addons,
        start_utc:      startUtc,
        end_utc:        endUtc,
        terms_accepted: true,
        promo_code:     promoApplied?.code || undefined,
      });
      const resv = res.data;
      setReservation(resv);
      const { client_secret } = await createPaymentIntent(resv.id);
      setClientSecret(client_secret);
    } catch (err) {
      if (err.status === 409) {
        setError('This vehicle was just booked by another customer. Please go back and choose a different time.');
      } else if (err.status === 422 && err.data?.issues?.length) {
        const first = err.data.issues[0];
        setError(`Please check your details — ${first.message}. Go back to Step 1 to correct it.`);
      } else {
        setError(err.message || 'Unable to set up payment. Please try again.');
      }
    } finally {
      setTransitioning(false);
    }
  }

  // ── Back from Step 3 ──
  async function handleBackFromStep3() {
    if (reservation) {
      try {
        await cancelReservation(reservation.id, { customer_email: email, reason: 'Customer went back to modify booking' });
      } catch (_) { /* ignore */ }
    }
    setReservation(null);
    setClientSecret(null);
    setCodeInfo(null);
    setCodeErr('');
    setEmployeeCode('');
    setStep(2);
    setError('');
  }

  const inputClass = (err) => `input ${err ? 'input-error' : ''}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold text-gray-900 mb-6 outline-none">
        Complete Your Booking
      </h1>

      <BookingProgress step={step} />

      {/* Booking summary bar */}
      <div className="card p-4 mb-6 text-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-900">{vehicle.name}</p>
            {startUtc && endUtc && (
              <p className="text-gray-500 mt-0.5">
                {formatSydney(startUtc)} → {formatSydney(endUtc)}
              </p>
            )}
            {promoApplied && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                {promoApplied.discount_percent}% special rate applied
              </span>
            )}
          </div>
          <div className="text-right">
            {promoApplied && (
              <p className="text-xs text-gray-400 line-through">{formatAUDFromString(grandNoDiscount.toFixed(2))}</p>
            )}
            <p className={`font-bold text-lg ${promoApplied ? 'text-green-700' : 'text-gray-900'}`}>
              {formatAUDFromString(grandTotal.toFixed(2))}
            </p>
            <p className="text-xs text-gray-500">incl. GST</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <AlertError>
            {error}{' '}
            {error.includes('booked by another') && (
              <a href="/availability" className="underline font-medium">Back to search</a>
            )}
          </AlertError>
        </div>
      )}

      {/* ===== Step 1: Personal details ===== */}
      {step === 1 && (
        <section className="card p-6" aria-labelledby="step1-heading">
          <h2 id="step1-heading" className="text-xl font-semibold text-gray-900 mb-5">
            Step 1 of 3 — Personal Details
          </h2>

          {!user && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-5">
              <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-sm text-blue-700 flex-1">
                <Link to="/login" state={{ from: '/booking' + window.location.search }}
                  className="font-semibold underline hover:text-blue-800">Sign in</Link>{' '}
                to auto-fill your details and track this booking in My Bookings.
              </p>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-5 text-sm text-green-700">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Signed in as <strong className="ml-1">{user.name}</strong> — details pre-filled. You can still edit them below.
            </div>
          )}

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
          {/* Promo code */}
          <div className="border-t border-gray-200 pt-4 mt-2">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Promo code{' '}
              <span className="font-normal text-gray-400">(optional — unlocks special rate)</span>
            </p>
            {promoApplied ? (
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-green-800">
                    Special rate applied — {promoApplied.discount_percent}% off daily rate
                  </p>
                  <p className="text-green-700 font-mono text-xs mt-0.5">{promoApplied.code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPromoApplied(null); setPromoCode(''); setPromoErr(''); }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove promo code"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoErr(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                  placeholder="Enter promo code"
                  className={`input flex-1 font-mono uppercase tracking-widest ${promoErr ? 'input-error' : ''}`}
                  maxLength={12}
                  aria-describedby={promoErr ? 'promo-err' : undefined}
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoChecking || !promoCode.trim()}
                  className="btn-secondary whitespace-nowrap"
                >
                  {promoChecking ? 'Checking…' : 'Apply'}
                </button>
              </div>
            )}
            {promoErr && <p id="promo-err" className="error-text mt-1" role="alert">⚠ {promoErr}</p>}
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={handleStep1Next} className="btn-primary">Next: Terms &amp; Conditions →</button>
          </div>
        </section>
      )}

      {/* ===== Step 2: Terms & Conditions ===== */}
      {step === 2 && (
        <section className="card p-6" aria-labelledby="step2-heading">
          <h2 id="step2-heading" className="text-xl font-semibold text-gray-900 mb-4">
            Step 2 of 3 — Terms &amp; Conditions
          </h2>
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
            <button onClick={() => setStep(1)} className="btn-secondary" disabled={transitioning}>← Back</button>
            <button onClick={handleStep2Next} disabled={transitioning} className="btn-primary">
              {transitioning ? 'Setting up payment…' : 'Next: Payment →'}
            </button>
          </div>
        </section>
      )}

      {/* ===== Step 3: Payment ===== */}
      {step === 3 && (
        <section className="card p-6" aria-labelledby="step3-heading">
          <h2 id="step3-heading" className="text-xl font-semibold text-gray-900 mb-5">
            Step 3 of 3 — Payment
          </h2>

          {/* Amount summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total charge (incl. GST)</span>
              <span className="font-bold text-gray-900 text-base">{formatAUDFromString(grandTotal.toFixed(2))} AUD</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">GST included: {formatAUDFromString(gst.toFixed(2))}</p>
          </div>

          {/* Payment option selector — only shown before Stripe is loaded */}
          {!clientSecret && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => { setPaymentOption('card'); setCodeErr(''); }}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  paymentOption === 'card'
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="font-semibold text-sm text-gray-900">Pay by Card</span>
                </div>
                <p className="text-xs text-gray-500">Credit or debit card via Stripe</p>
              </button>

              <button
                type="button"
                onClick={() => { setPaymentOption('code'); setError(''); }}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  paymentOption === 'code'
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span className="font-semibold text-sm text-gray-900">Employee Code</span>
                </div>
                <p className="text-xs text-gray-500">Use a staff booking code — no card needed</p>
              </button>
            </div>
          )}

          {/* ── Employee code form ── */}
          {paymentOption === 'code' && !clientSecret && (
            <div>
              <label htmlFor="emp-code" className="label">
                Enter your booking code <span className="text-red-500">*</span>
              </label>
              <input
                id="emp-code"
                type="text"
                value={employeeCode}
                onChange={e => { setEmployeeCode(e.target.value.toUpperCase()); setCodeErr(''); }}
                maxLength={12}
                placeholder="e.g. AB3C7KP!9MN2"
                className={`input font-mono text-lg tracking-widest ${codeErr ? 'input-error' : ''}`}
                aria-describedby={codeErr ? 'code-err' : 'code-hint'}
                aria-required="true"
              />
              <p id="code-hint" className="text-xs text-gray-500 mt-1">
                12-character code from your admin-issued booking email
              </p>
              {codeErr && <p id="code-err" className="error-text mt-1" role="alert">⚠ {codeErr}</p>}

              <div className="flex justify-between mt-6 gap-4">
                <button type="button" onClick={handleBackFromStep3} disabled={codeSubmitting} className="btn-secondary">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleCodeSubmit}
                  disabled={codeSubmitting || employeeCode.length < 12}
                  className="btn-primary flex-1"
                >
                  {codeSubmitting ? 'Processing…' : 'Complete Booking with Code'}
                </button>
              </div>
            </div>
          )}

          {/* ── Card payment ── */}
          {paymentOption === 'card' && !clientSecret && (
            <div>
              <div className="flex justify-between gap-4">
                <button type="button" onClick={handleBackFromStep3} disabled={transitioning} className="btn-secondary">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleCardContinue}
                  disabled={transitioning}
                  className="btn-primary flex-1"
                >
                  {transitioning ? 'Setting up payment…' : 'Continue to Card Payment →'}
                </button>
              </div>
            </div>
          )}

          {/* ── Stripe element (after Continue to Card Payment is clicked) ── */}
          {paymentOption === 'card' && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: 'stripe', variables: { colorPrimary: '#2563eb', borderRadius: '8px' } },
              }}
            >
              <StripePaymentForm
                grandTotal={grandTotal}
                gst={gst}
                onBack={handleBackFromStep3}
                reservationId={reservation?.id}
                customerName={name}
                customerEmail={email}
                customerPhone={phone.replace(/\s/g, '')}
                globalError={error}
                setGlobalError={setError}
              />
            </Elements>
          )}

          {paymentOption === 'card' && !clientSecret && transitioning && (
            <div className="py-6 text-center text-gray-500" aria-live="polite">
              <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm">Connecting to Stripe…</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
