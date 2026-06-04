import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto" role="contentinfo">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Special Need Vehicle Rental — NSW, Australia</p>
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link to="/privacy" className="hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
              Terms &amp; Conditions
            </Link>
            <a href="https://www.fairtrading.nsw.gov.au" target="_blank" rel="noopener noreferrer"
              className="hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
              NSW Fair Trading
            </a>
          </nav>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center sm:text-left">
          ABN: XX XXX XXX XXX · Operated under NSW motor vehicle hire regulations
        </p>
      </div>
    </footer>
  );
}
