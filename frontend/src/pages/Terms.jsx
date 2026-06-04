import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms &amp; Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Special Need Vehicle Rental · NSW, Australia · Version 1.0 · June 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-gray-700">

        <p><strong>Important:</strong> These terms constitute a legally binding agreement under the Electronic Transactions Act 2000 (NSW). Please read carefully before booking.</p>

        {[
          { h: '1. Eligibility', body: 'The renter must hold a current, valid Australian driver\'s licence (or international equivalent as permitted under NSW road rules). Minimum age: 25 years. For vehicles with special controls (hand controls, etc.), the renter must hold the appropriate licence endorsement. We may verify your licence at vehicle pickup.' },
          { h: '2. Vehicle Use', body: 'The vehicle must only be used for lawful purposes on suitable roads. The vehicle must not be used for commercial passenger carrying, sub-hire, motorsport, racing, towing, or off-road driving unless expressly agreed. The renter is responsible for all tolls, parking fees, infringement notices, and other charges incurred during the hire period.' },
          { h: '3. Fuel', body: 'Vehicles are provided with a full tank of fuel. The vehicle must be returned with the same fuel level. Failure to do so will incur a refuelling charge at current market rates, plus a $25 administration fee.' },
          { h: '4. Care and Condition', body: 'The renter must take reasonable care of the vehicle. A walk-around inspection will be conducted at pickup and return. Any pre-existing damage will be noted. The renter is liable for new damage caused during the hire period.' },
          { h: '5. Accidents and Incidents', body: 'Any accident, damage, theft, or incident involving the vehicle must be reported to us immediately by phone. If police attendance is required by law (e.g. accident causing injury), the renter must report to police immediately. An incident report must be completed.' },
          { h: '6. Insurance and Liability', body: 'The vehicle is comprehensively insured. The renter accepts liability for damage or loss up to an agreed excess. The renter must not drive under the influence of alcohol or drugs. Violation of these conditions voids insurance cover and makes the renter fully liable for all costs.' },
          { h: '7. Cancellation and Refund Policy', body: 'Free cancellation: more than 48 hours before pickup — no charge. 24–48 hours notice: 50% of hire cost may apply. Less than 24 hours notice: full hire cost applies. Refunds are processed within 3 business days (Phase 1: manually by staff; Phase 2: via payment gateway). To cancel, use the cancellation link in your confirmation email or call us.' },
          { h: '8. Late Return', body: 'Vehicles must be returned at the agreed time. Late returns are charged at the standard hourly rate. Significant late returns may affect other customers\' bookings. Please call us immediately if you cannot return on time.' },
          { h: '9. Payment', body: 'Payment is due prior to vehicle handover. In Phase 1, our staff will contact you to confirm payment by phone or bank transfer. No vehicle keys will be issued until payment is confirmed. GST (10%) is included in all displayed prices as required under the A New Tax System (GST) Act 1999 (Cth).' },
          { h: '10. Privacy', body: 'Your personal information is handled in accordance with our Privacy Policy and the Privacy Act 1988 (Cth). See our Privacy Policy for details.' },
          { h: '11. Complaints', body: 'Complaints may be directed to us by email or phone. If unresolved, you may contact NSW Fair Trading at www.fairtrading.nsw.gov.au or call 13 32 20.' },
          { h: '12. Governing Law', body: 'These terms are governed by the laws of New South Wales, Australia. Any disputes are subject to the exclusive jurisdiction of NSW courts.' },
          { h: '13. Australian Consumer Law', body: 'These terms do not exclude, restrict, or modify any rights you have under the Australian Consumer Law (Competition and Consumer Act 2010, Schedule 2) that cannot be lawfully excluded.' },
        ].map(({ h, body }) => (
          <section key={h}>
            <h2 className="text-base font-semibold text-gray-900 mb-1">{h}</h2>
            <p>{body}</p>
          </section>
        ))}

        <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
          These terms and conditions are a draft for review purposes. A solicitor experienced in NSW commercial and transport law should review this document before public launch. This document does not constitute legal advice.
        </p>
      </div>

      <div className="mt-8 flex gap-4">
        <Link to="/" className="btn-secondary">← Home</Link>
        <Link to="/privacy" className="btn-secondary">Privacy Policy</Link>
      </div>
    </div>
  );
}
