import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PHONE = import.meta.env.VITE_FACILITY_PHONE || '(02) XXXX XXXX';

export default function Header() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm" role="banner">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="flex items-center gap-2 text-brand-700 font-bold text-lg hover:text-brand-800 focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            aria-label="Special Need Vehicle Rental — Home"
          >
            <svg aria-hidden="true" className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:block">Special Need Vehicle Rental</span>
            <span className="sm:hidden">SNVR</span>
          </Link>

          <nav aria-label="Primary navigation" className="flex items-center gap-4">
            {!isAdmin && (
              <a
                href={`tel:${PHONE.replace(/\s/g, '')}`}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors"
                aria-label={`Call us: ${PHONE}`}
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="hidden sm:block">{PHONE}</span>
                <span className="sm:hidden">Call</span>
              </a>
            )}
            {isAdmin && (
              <span className="text-sm font-medium text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
                Admin
              </span>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
