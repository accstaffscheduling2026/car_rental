import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { adminLogout } from '../utils/api.js';

const NAV_ITEMS = [
  { to: '/admin/dashboard',   label: 'Dashboard'    },
  { to: '/admin/reservations',label: 'Reservations' },
  { to: '/admin/vehicles',    label: 'Vehicles'     },
  { to: '/admin/employees',   label: 'Employees'    },
  { to: '/admin/codes',       label: 'Booking Codes'},
  { to: '/admin/reports',     label: 'Reports'      },
];

export default function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    await adminLogout().catch(() => {});
    navigate('/admin/login');
  }

  return (
    <nav
      aria-label="Admin navigation"
      className="bg-white border-b border-gray-200 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 overflow-x-auto gap-1">
          <div className="flex items-center gap-1 flex-shrink-0">
            {NAV_ITEMS.map(n => {
              const active = location.pathname === n.to ||
                (n.to !== '/admin/dashboard' && location.pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors whitespace-nowrap flex-shrink-0 ml-4"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
