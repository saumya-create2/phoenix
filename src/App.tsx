/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { CartProvider } from './context/CartContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { AuthModal } from './components/AuthModal.js';
import { CartDrawer } from './components/CartDrawer.js';
import { HomePage } from './pages/HomePage.js';
import { RoomsPage } from './pages/RoomsPage.js';
import { BookingPage } from './pages/BookingPage.js';
import { CustomerDashboard } from './pages/CustomerDashboard.js';
import { AdminDashboard } from './pages/AdminDashboard.js';
import { GuestLoginPage } from './pages/GuestLoginPage.js';
import { GuestRegisterPage } from './pages/GuestRegisterPage.js';
import { AdminLoginPage } from './pages/AdminLoginPage.js';

const AppLayout: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();

  // Separate navigation and layout for Admin routes (/admin/login, /admin/dashboard)
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EF] text-[#252525] font-sans selection:bg-[#C9A45C]/25 selection:text-[#0B1F33]">
      {!isAdminRoute && <Navbar onOpenAuth={() => setAuthModalOpen(true)} />}

      <div className="flex-grow">
        <Routes>
          {/* Guest Portal & Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/book/:roomId" element={<BookingPage />} />
          <Route path="/login" element={<GuestLoginPage />} />
          <Route path="/register" element={<GuestRegisterPage />} />
          <Route path="/customer/bookings" element={<CustomerDashboard />} />

          {/* Dedicated Admin Portal Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <CartDrawer />}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppLayout />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
