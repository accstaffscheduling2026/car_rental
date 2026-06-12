import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../hooks/useSiteConfig.jsx';

export default function Footer() {
  const { business_name, business_abn, business_phone, business_address, business_email, business_hours } = useSiteConfig();
  return (
    <footer className="bg-gradient-header mt-auto" role="contentinfo">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-40" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-btn flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm">{business_name}</span>
            </div>
            <div className="space-y-0.5 text-brand-300 text-xs leading-relaxed">
              <p>Trusted, accessible vehicle hire for the community.</p>
              <p>NSW, Australia{business_abn ? ` · ABN: ${business_abn}` : ''}</p>
              {business_address && <p>{business_address}</p>}
              {business_phone && (
                <p><a href={`tel:${business_phone.replace(/\s/g,'')}`} className="hover:text-brand-100 transition-colors">{business_phone}</a></p>
              )}
              {business_email && (
                <p><a href={`mailto:${business_email}`} className="hover:text-brand-100 transition-colors">{business_email}</a></p>
              )}
              {business_hours && <p className="pt-0.5 text-brand-400">{business_hours}</p>}
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="text-brand-300 text-xs font-semibold uppercase tracking-widest mb-3">Legal</p>
            <nav aria-label="Footer legal navigation" className="flex flex-col gap-2">
              <Link to="/privacy" className="text-brand-200 text-sm hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms"   className="text-brand-200 text-sm hover:text-white transition-colors">Terms &amp; Conditions</Link>
              <a href="https://www.fairtrading.nsw.gov.au" target="_blank" rel="noopener noreferrer"
                className="text-brand-200 text-sm hover:text-white transition-colors">NSW Fair Trading ↗</a>
            </nav>
          </div>

          {/* Compliance */}
          <div>
            <p className="text-brand-300 text-xs font-semibold uppercase tracking-widest mb-3">Compliance</p>
            <div className="space-y-1.5 text-xs text-brand-300 leading-relaxed">
              <p>Operated under NSW motor vehicle hire regulations</p>
              <p>Australian Consumer Law applies to all rentals</p>
              <p>Stripe-secured payments · SSL encrypted</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-brand-400 text-xs">© {new Date().getFullYear()} {business_name}. All rights reserved.</p>
          {business_hours && <p className="text-brand-500 text-xs">{business_hours}</p>}
        </div>
      </div>
    </footer>
  );
}
