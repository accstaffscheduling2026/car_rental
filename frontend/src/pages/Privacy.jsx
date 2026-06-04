import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Special Need Vehicle Rental · NSW, Australia · Effective: June 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">

        <p>This Privacy Policy explains how Special Need Vehicle Rental ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") collects, uses, and handles your personal information in accordance with the <strong>Privacy Act 1988 (Cth)</strong> and the <strong>Australian Privacy Principles (APPs)</strong>.</p>

        <section aria-labelledby="app1">
          <h2 id="app1" className="text-lg font-semibold text-gray-900">1. Who We Are</h2>
          <p>We are a vehicle hire service operated by an elderly care facility in New South Wales, Australia. We can be contacted at the email address shown in your booking confirmation.</p>
        </section>

        <section aria-labelledby="app3">
          <h2 id="app3" className="text-lg font-semibold text-gray-900">2. What Information We Collect</h2>
          <p>We collect only the personal information reasonably necessary to provide our vehicle hire service (APP 3). This includes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Full name</li>
            <li>Email address</li>
            <li>Mobile phone number</li>
            <li>Intended use of the vehicle (optional)</li>
            <li>Billing information (last 4 digits of card, expiry — no full card numbers)</li>
          </ul>
          <p>We do not collect your full credit card number at any time.</p>
        </section>

        <section aria-labelledby="app5">
          <h2 id="app5" className="text-lg font-semibold text-gray-900">3. How We Collect Information</h2>
          <p>We collect your information directly from you when you complete an online booking or contact us by phone. We notify you at the point of collection about how your information will be used (APP 5).</p>
        </section>

        <section aria-labelledby="app6">
          <h2 id="app6" className="text-lg font-semibold text-gray-900">4. How We Use Your Information</h2>
          <p>Your personal information is used only for the purpose for which it was collected (APP 6):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Processing and managing your vehicle hire reservation</li>
            <li>Contacting you to confirm payment and booking details</li>
            <li>Sending booking confirmations and reminders by email</li>
            <li>Complying with legal obligations</li>
          </ul>
          <p>We will not use your information for direct marketing without your explicit consent.</p>
        </section>

        <section aria-labelledby="app11">
          <h2 id="app11" className="text-lg font-semibold text-gray-900">5. Security of Your Information</h2>
          <p>We take reasonable steps to protect your personal information from misuse, loss, and unauthorised access (APP 11). All data is transmitted over HTTPS (TLS 1.2/1.3) and stored on secured servers in Australia.</p>
        </section>

        <section aria-labelledby="app12">
          <h2 id="app12" className="text-lg font-semibold text-gray-900">6. Accessing and Correcting Your Information</h2>
          <p>You have the right to access and correct your personal information (APP 12). To request access or correction, contact us using the email address in your booking confirmation.</p>
        </section>

        <section aria-labelledby="ndb">
          <h2 id="ndb" className="text-lg font-semibold text-gray-900">7. Data Breaches</h2>
          <p>If a serious data breach occurs that is likely to result in serious harm, we will notify affected individuals and the Office of the Australian Information Commissioner (OAIC) as required under the Notifiable Data Breaches scheme.</p>
        </section>

        <section aria-labelledby="contact-priv">
          <h2 id="contact-priv" className="text-lg font-semibold text-gray-900">8. Contact &amp; Complaints</h2>
          <p>To raise a privacy concern or complaint, contact us by email (shown in your booking confirmation). If you are not satisfied with our response, you may contact the OAIC at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">www.oaic.gov.au</a>.</p>
        </section>
      </div>

      <div className="mt-8 flex gap-4">
        <Link to="/" className="btn-secondary">← Home</Link>
        <Link to="/terms" className="btn-secondary">Terms &amp; Conditions</Link>
      </div>
    </div>
  );
}
