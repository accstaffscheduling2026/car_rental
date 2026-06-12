import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../hooks/useUserAuth.jsx';

const PHONE = import.meta.env.VITE_FACILITY_PHONE || '(02) XXXX XXXX';

export default function Header() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const isAdmin   = location.pathname.startsWith('/admin');
  const { user, logout } = useUserAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate('/');
  }

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

          <nav aria-label="Primary navigation" className="flex items-center gap-3">
            {!isAdmin && (
              <>
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

                {user ? (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen(v => !v)}
                      className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors"
                      aria-expanded={menuOpen}
                      aria-haspopup="true"
                    >
                      <span className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold select-none">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="hidden sm:block max-w-[120px] truncate">{user.name}</span>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                        <Link
                          to="/my-bookings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          My Bookings
                        </Link>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 border border-brand-200 hover:border-brand-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Sign In
                  </Link>
                )}
              </>
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
