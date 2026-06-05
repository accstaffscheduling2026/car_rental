import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../utils/stripe.js';
import { getVehicle, createReservation, createPaymentIntent, cancelReservation } from '../utils/api.js';
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

  // Step 3 — Stripe
  const [reservation,  setReservation]  = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    if (!vehicleId) { navigate('/availability'); return; }
    getVehicle(vehicleId).then(r => setVehicle(r.data)).catch(() => navigate('/availability'));
  }, [vehicleId]);

  useEffect(() => { headingRef.current?.focus(); }, [step]);

  if (!vehicle) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500" aria-live="polite">Loading…</div>
  );

  const hourlyRate  = parseFloat(vehicle.hourly_rate_aud);
  const dailyRate   = parseFloat(vehicle.daily_rate_aud);
  const ms          = startUtc && endUtc ? new Date(endUtc) - new Date(startUtc) : 0;
  const hours       = ms / 3600000;
  const days        = Math.floor(hours / 24);
  const remH        = Math.ceil(hours % 24);
  const rentalTotal = days * dailyRate + remH * hourlyRate;
  const addonsTotal = addons.reduce((s, a) => s + (ADDON_PRICES[a] || 0), 0);
  const grandTotal  = rentalTotal + addonsTotal;
  const gst         = grandTotal * 10 / 110;

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

  // ── Step 2 → Step 3: create reservation + PaymentIntent ──
  async function handleStep2Next() {
    if (!agreed) { setErrs2({ terms: 'You must agree to the hire terms and conditions to proceed' }); return; }
    setErrs2({});
    setError('');
    setTransitioning(true);

    try {
      const res = await createReservation({
        vehicle_id:     parseInt(vehicleId, 10),
        customer_name:  name,
        customer_email: email,
        customer_phone: phone.replace(/\s/g, ''), // strip spaces — backend regex requires no spaces
        intended_use:   use || undefined,
        addons_json:    addons,
        start_utc:      startUtc,
        end_utc:        endUtc,
        terms_accepted: true,
      });

      const resv = res.data;
      setReservation(resv);

      const { client_secret } = await createPaymentIntent(resv.id);
      setClientSecret(client_secret);
      setStep(3);
    } catch (err) {
      if (err.status === 409) {
        setError('This vehicle was just booked by another customer. Please go back and choose a different vehicle or time.');
      } else if (err.status === 422 && err.data?.issues?.length) {
        // Show the first specific field error from Zod rather than the generic "Validation failed"
        const first = err.data.issues[0];
        const field = first.path?.join(' → ') || 'field';
        setError(`Please check your details — ${first.message} (${field}). Go back to Step 1 to correct it.`);
      } else {
        setError(err.message || 'Unable to set up booking. Please try again.');
      }
    } finally {
      setTransitioning(false);
    }
  }

  // ── Back from Step 3: cancel the reservation so the vehicle is freed up ──
  async function handleBackFromStep3() {
    if (reservation) {
      try {
        await cancelReservation(reservation.id, { customer_email: email, reason: 'Customer went back to modify booking' });
      } catch (_) {
        // Ignore errors — we still navigate back regardless
      }
    }
    setReservation(null);
    setClientSecret(null);
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
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-gray-900">{formatAUDFromString(grandTotal.toFixed(2))}</p>
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

      {/* ===== Step 3: Stripe Payment ===== */}
      {step === 3 && (
        <section className="card p-6" aria-labelledby="step3-heading">
          <h2 id="step3-heading" className="text-xl font-semibold text-gray-900 mb-5">
            Step 3 of 3 — Payment
          </h2>

          {clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: { colorPrimary: '#2563eb', borderRadius: '8px' },
                },
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
          ) : (
            <div className="py-12 text-center text-gray-500" aria-live="polite">
              <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-3" aria-hidden="true" />
              <p className="font-medium">Setting up secure payment…</p>
              <p className="text-xs mt-1 text-gray-400">Connecting to Stripe — usually takes 2–5 seconds</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
