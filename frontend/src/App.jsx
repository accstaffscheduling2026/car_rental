import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Landing from './pages/Landing.jsx';
import Availability from './pages/Availability.jsx';
import VehicleDetail from './pages/VehicleDetail.jsx';
import Booking from './pages/Booking.jsx';
import Confirmation from './pages/Confirmation.jsx';
import CancelPage from './pages/Cancel.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import AdminLogin from './pages/admin/Login.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminReservations from './pages/admin/Reservations.jsx';
import AdminReservationDetail from './pages/admin/ReservationDetail.jsx';
import AdminVehicles from './pages/admin/Vehicles.jsx';
import AdminReports from './pages/admin/Reports.jsx';
import { useAdminAuth } from './hooks/useAdminAuth.js';

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function AdminLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function ProtectedAdmin({ children }) {
  const { isAdmin, loading } = useAdminAuth();
  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
        <Route path="/availability" element={<PublicLayout><Availability /></PublicLayout>} />
        <Route path="/vehicles/:id" element={<PublicLayout><VehicleDetail /></PublicLayout>} />
        <Route path="/booking" element={<PublicLayout><Booking /></PublicLayout>} />
        <Route path="/booking/confirmation" element={<PublicLayout><Confirmation /></PublicLayout>} />
        <Route path="/cancel/:id" element={<PublicLayout><CancelPage /></PublicLayout>} />
        <Route path="/privacy" element={<PublicLayout><Privacy /></PublicLayout>} />
        <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLayout><AdminLogin /></AdminLayout>} />
        <Route path="/admin" element={<ProtectedAdmin><AdminLayout><AdminDashboard /></AdminLayout></ProtectedAdmin>} />
        <Route path="/admin/dashboard" element={<ProtectedAdmin><AdminLayout><AdminDashboard /></AdminLayout></ProtectedAdmin>} />
        <Route path="/admin/reservations" element={<ProtectedAdmin><AdminLayout><AdminReservations /></AdminLayout></ProtectedAdmin>} />
        <Route path="/admin/reservations/:id" element={<ProtectedAdmin><AdminLayout><AdminReservationDetail /></AdminLayout></ProtectedAdmin>} />
        <Route path="/admin/vehicles" element={<ProtectedAdmin><AdminLayout><AdminVehicles /></AdminLayout></ProtectedAdmin>} />
        <Route path="/admin/reports" element={<ProtectedAdmin><AdminLayout><AdminReports /></AdminLayout></ProtectedAdmin>} />

        {/* Fallback */}
        <Route path="*" element={<PublicLayout>
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
            <a href="/" className="btn-primary">Return Home</a>
          </div>
        </PublicLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
