import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../hooks/useSiteConfig.jsx';

const SECTIONS = [
  {
    h: '1. Your Rental Contract',
    body: `Your rental contract with us comprises: (i) the online booking confirmation email; (ii) these Terms and Conditions; and (iii) our Privacy Policy. Together these documents create binding legal obligations. By completing a booking you acknowledge that you have read and agree to be bound by all of these documents.`,
  },
  {
    h: '2. Eligibility and Licence Requirements',
    body: `You must hold a current, valid driver's licence that is appropriate for the class of vehicle hired and has not been suspended, revoked, or cancelled. Minimum age: 21 years. A young driver surcharge may apply for drivers under 25. If your licence is not in English you must provide a valid International Driving Permit or a NAATI-certified English translation. We may verify your licence at vehicle handover and at any time during the hire period.`,
  },
  {
    h: '3. Payment',
    body: `Payment is due prior to vehicle handover. Accepted payment methods are credit card and Visa/MasterCard debit card via our secure payment gateway. GST (10%) is included in all displayed prices as required under the A New Tax System (GST) Act 1999 (Cth). Invoices and receipts are sent electronically to the email address you provide on your booking.`,
  },
  {
    h: '4. Cancellation and No-Show',
    body: `You may cancel your reservation at any time using the cancellation link in your confirmation email or by contacting us directly.\n\n` +
      `Cancellation refunds are calculated according to the policy displayed on the cancellation page at the time you cancel, which reflects our current configurable policy:\n` +
      `• More than 48 hours before pick-up: full refund (default).\n` +
      `• 24–48 hours before pick-up: partial refund (default: 50% of hire cost).\n` +
      `• Less than 24 hours before pick-up: no refund (default).\n\n` +
      `These thresholds and percentages are set by administration and may vary — the live policy is always shown before you confirm cancellation.\n\n` +
      `If you fail to pick up the vehicle without cancelling, a no-show charge equivalent to the full hire cost may apply.\n\n` +
      `If we cancel your reservation, you will be fully reimbursed all amounts you have paid to us (T&C §2.5f). Refunds are processed within 7–10 business days following admin approval.`,
  },
  {
    h: '5. Refund Processing',
    body: `Refunds for eligible cancellations are subject to an internal review process. After cancellation, a refund request is created for administration review. Once approved, refunds are processed via your original payment method and may take 7–10 business days to appear on your statement. You will receive an email confirmation when your refund is approved and processed. Refunds are only applicable to bookings where payment has been received.`,
  },
  {
    h: '6. Early Return',
    body: `If you return the vehicle earlier than the agreed return date and time, we will not refund any unused daily rental charges unless you provide a reasonable explanation. If a refund is granted in these circumstances, it will be calculated at the daily rate for the actual days used.`,
  },
  {
    h: '7. Late Return',
    body: `Vehicles must be returned at the agreed date and time. A grace period of 30 minutes applies. If the vehicle is returned more than 30 minutes late, one full day's hire will be charged. If the vehicle is returned more than 24 hours late without prior agreement, the standard daily rate applies for each additional 24-hour period, and damage cover may be voided.`,
  },
  {
    h: '8. Vehicle Use',
    body: `The vehicle must only be used for lawful purposes on suitable sealed roads. The vehicle must not be used for: commercial passenger carrying; sub-hire or subletting; motorsport, racing, or speed trials; off-road driving; towing (unless expressly agreed); or any purpose that contravenes applicable law. You are responsible for all tolls, parking fees, infringement notices, and other charges incurred during the hire period. You must not drive under the influence of alcohol or drugs.`,
  },
  {
    h: '9. Fuel',
    body: `Vehicles are provided with a full tank of fuel and must be returned with a full tank. Failure to do so will result in a refuelling charge at current market rates plus an administration fee.`,
  },
  {
    h: '10. Care and Condition',
    body: `You must take all reasonable care of the vehicle to prevent damage, theft, and third-party loss. A walk-around inspection will be conducted at pickup and return. Any pre-existing damage will be noted in the booking agreement. You are liable for any new damage caused during the hire period up to the agreed damage excess.`,
  },
  {
    h: '11. Accidents and Incidents',
    body: `Any accident, damage, theft, or incident involving the vehicle must be reported to us within 24 hours. If police attendance is required by law (e.g. an accident causing injury), you must report to police immediately. You must not make any admission of fault or offer to pay any third-party claim without our prior written agreement. You must complete our incident report form within 7 days of any accident.`,
  },
  {
    h: '12. GPS Tracking',
    body: `Our vehicles may be fitted with GPS tracking devices to monitor vehicle condition, performance, and location. By completing your booking you consent to the use of this technology. Information collected may be used during and after the hire period.`,
  },
  {
    h: '13. Privacy',
    body: `Your personal information is handled in accordance with our Privacy Policy and the Privacy Act 1988 (Cth). We collect only the information reasonably necessary to provide our vehicle hire service. See our Privacy Policy for full details.`,
  },
  {
    h: '14. Dispute Resolution',
    body: `If you have a complaint or believe there has been an error, please contact us in the first instance and our staff will endeavour to resolve the matter. If we are unable to resolve your complaint to your satisfaction you may:\n` +
      `• Contact NSW Fair Trading: www.fairtrading.nsw.gov.au or call 13 32 20.\n` +
      `• Seek mediation through the Australian Car Rental Conciliation Service (if applicable): www.carrentalconciliationau.com or call 1800 366 840.`,
  },
  {
    h: '15. Australian Consumer Law',
    body: `These terms do not exclude, restrict, or modify any rights or guarantees you have under the Australian Consumer Law (Competition and Consumer Act 2010, Schedule 2) or any other applicable Federal, State, or Territory legislation that cannot lawfully be excluded.`,
  },
  {
    h: '16. Governing Law',
    body: `These Terms and Conditions are governed by the laws of New South Wales, Australia. Any disputes are subject to the jurisdiction of the courts of New South Wales.`,
  },
];

export default function Terms() {
  const { legal_terms_filename, business_name } = useSiteConfig();

  if (legal_terms_filename) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms &amp; Conditions of Rental</h1>
        <p className="text-sm text-gray-500 mb-1">{business_name} · NSW, Australia</p>
        <p className="text-xs text-gray-400 mb-6">Document: {legal_terms_filename}</p>
        <div className="flex gap-3 mb-6">
          <a href="/uploads/legal/terms.pdf" target="_blank" rel="noopener noreferrer" className="btn-primary">
            Open PDF ↗
          </a>
          <a href="/uploads/legal/terms.pdf" download={legal_terms_filename} className="btn-secondary">
            Download
          </a>
        </div>
        <iframe
          src="/uploads/legal/terms.pdf"
          className="w-full border border-gray-200 rounded-lg"
          style={{ height: '72vh' }}
          title="Terms and Conditions"
        />
        <div className="mt-6 flex gap-4">
          <Link to="/" className="btn-secondary">← Home</Link>
          <Link to="/privacy" className="btn-secondary">Privacy Policy</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms &amp; Conditions of Rental</h1>
      <p className="text-sm text-gray-500 mb-8">Swiftride Rentals · NSW, Australia · Effective: 1 May 2024</p>

      <div className="space-y-6 text-sm leading-relaxed text-gray-700">
        <p>
          <strong>Important:</strong> These terms constitute a legally binding agreement under the Electronic Transactions Act 2000 (NSW). Please read carefully before making a booking.
        </p>

        {SECTIONS.map(({ h, body }) => (
          <section key={h}>
            <h2 className="text-base font-semibold text-gray-900 mb-1">{h}</h2>
            {body.split('\n').map((line, i) =>
              line ? <p key={i} className="mb-1">{line}</p> : <br key={i} />
            )}
          </section>
        ))}

        <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
          This document should be read in conjunction with our Privacy Policy. For the full Rental Terms and Conditions document, please request a copy at vehicle handover or contact us directly. These terms were last updated May 2024.
        </p>
      </div>

      <div className="mt-8 flex gap-4">
        <Link to="/" className="btn-secondary">← Home</Link>
        <Link to="/privacy" className="btn-secondary">Privacy Policy</Link>
      </div>
    </div>
  );
}

