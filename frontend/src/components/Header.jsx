import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../hooks/useUserAuth.jsx';
import { useSiteConfig } from '../hooks/useSiteConfig.jsx';

export default function Header() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const isAdmin   = location.pathname.startsWith('/admin');
  const { user, logout } = useUserAuth();
  const { business_name, business_phone } = useSiteConfig();
  const phone = business_phone || import.meta.env.VITE_FACILITY_PHONE || '';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
    <header className="bg-gradient-header shadow-lg" role="banner">
      {/* Subtle accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent rounded-lg"
            aria-label="Special Need Vehicle Rental — Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-btn flex items-center justify-center shadow-btn group-hover:shadow-btn-hover transition-shadow">
              <svg aria-hidden="true" className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="hidden sm:block text-white font-bold text-base tracking-tight">
                {business_name}
              </span>
              <span className="sm:hidden text-white font-bold text-base">
                {business_name.split(' ').map(w => w[0]).join('').slice(0, 4)}
              </span>
              <span className="hidden sm:block text-brand-300 text-xs font-medium tracking-wide">NSW, Australia</span>
            </div>
          </Link>

          {/* Nav */}
          <nav aria-label="Primary navigation" className="flex items-center gap-2">
            {!isAdmin && (
              <>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand-200 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
                    aria-label={`Call us: ${phone}`}
                  >
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {phone}
                  </a>
                )}

                {user ? (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen(v => !v)}
                      className="flex items-center gap-2 text-sm font-medium text-white hover:bg-white/10 px-2 py-1.5 rounded-lg transition-colors"
                      aria-expanded={menuOpen}
                      aria-haspopup="true"
                    >
                      <span className="w-8 h-8 rounded-full bg-gradient-btn flex items-center justify-center text-xs font-bold text-white shadow-btn select-none">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="hidden sm:block max-w-[120px] truncate text-brand-100">{user.name}</span>
                      <svg className="w-3.5 h-3.5 text-brand-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-card-lg z-50 py-1.5 animate-fade-in">
                        <div className="px-4 py-2.5 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Signed in as</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        </div>
                        <Link
                          to="/my-bookings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                        >
                          <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          My Bookings
                        </Link>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
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
                    className="flex items-center gap-1.5 text-sm font-semibold text-white border border-white/25 hover:border-white/60 hover:bg-white/10 px-4 py-1.5 rounded-lg transition-all duration-200"
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
              <span className="text-xs font-bold text-brand-200 bg-white/10 border border-white/20 px-3 py-1 rounded-full tracking-widest uppercase">
                Admin Portal
              </span>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
