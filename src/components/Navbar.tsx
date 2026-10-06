/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import {
  User,
  Shield,
  LogOut,
  Calendar,
  Menu,
  X,
  ChevronDown,
  ShoppingBag,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
}

/**
 * Guest Portal Navigation Bar
 * - Never exposes admin credentials in frontend JavaScript.
 * - Does NOT display Admin Portal navigation items to logged-in Guests (`role === 'customer'`).
 * - Shows "My Bookings" and "Admin Portal" exclusively inside the Account dropdown
 *   according to the user's verified role.
 */
export const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useAuth();
  const { totalRoomsInCart, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-[#0B1F33] text-[#F8F5EF] border-b border-[#C9A45C]/25 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Zone 1: Brand Title */}
          <Link
            to="/"
            className="font-display text-2xl font-semibold tracking-wider text-[#F8F5EF] hover:text-[#C9A45C] transition-colors duration-200 whitespace-nowrap"
          >
            PHOENIX
          </Link>

          {/* Zone 2: Desktop Navigation Links (Main Dashboard shows only Home & Rooms & Suites) */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link
              to="/"
              className={`transition-colors duration-200 py-1 border-b-2 whitespace-nowrap ${
                isActive('/')
                  ? 'text-[#C9A45C] border-[#C9A45C] font-semibold'
                  : 'text-[#EDE7DC]/80 border-transparent hover:text-[#F8F5EF] hover:border-[#C9A45C]/40'
              }`}
            >
              Home
            </Link>
            <Link
              to="/rooms"
              className={`transition-colors duration-200 py-1 border-b-2 whitespace-nowrap ${
                isActive('/rooms')
                  ? 'text-[#C9A45C] border-[#C9A45C] font-semibold'
                  : 'text-[#EDE7DC]/80 border-transparent hover:text-[#F8F5EF] hover:border-[#C9A45C]/40'
              }`}
            >
              Rooms & Suites
            </Link>
          </div>

          {/* Zone 3: Actions (Cart, Account Dropdown, Reserve CTA) */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Room Cart Button for Multi-Room Booking (Guest feature) */}
            {user?.role !== 'admin' && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#132B45] hover:bg-[#1A3756] border border-[#C9A45C]/30 text-xs font-semibold text-[#F8F5EF] transition-colors duration-200 cursor-pointer whitespace-nowrap"
                title="Open Room Booking Cart"
              >
                <ShoppingBag className="w-4 h-4 text-[#C9A45C]" />
                <span>Cart</span>
                {totalRoomsInCart > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#C9A45C] text-[#0B1F33] text-[10px] font-bold leading-none tabular-nums">
                    {totalRoomsInCart}
                  </span>
                )}
              </button>
            )}

            {/* Account Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2.5 py-1.5 px-3 rounded-xl bg-[#132B45] hover:bg-[#1A3756] border border-[#C9A45C]/30 transition-colors duration-200 cursor-pointer whitespace-nowrap"
              >
                <div className="w-7 h-7 rounded-full bg-[#C9A45C] text-[#0B1F33] flex items-center justify-center font-bold text-xs uppercase">
                  {user ? user.name.charAt(0) : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="text-left text-xs leading-tight hidden lg:block">
                  <div className="font-semibold text-[#F8F5EF] truncate max-w-[120px]">
                    {user ? user.name : 'Account'}
                  </div>
                  <div className="text-[10px] text-[#C9A45C]">
                    {user
                      ? user.role === 'admin'
                        ? 'ADMIN Role'
                        : 'GUEST Role'
                      : 'Sign In / Portal'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#C9A45C]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0B1F33] shadow-xl border border-[#C9A45C]/30 py-2 z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-2.5 border-b border-[#C9A45C]/20">
                        <p className="text-xs font-semibold text-[#F8F5EF]">{user.name}</p>
                        <p className="text-[11px] text-[#EDE7DC]/70 truncate">{user.email}</p>
                      </div>

                      <div className="py-1">
                        {/* Guests only see My Bookings — Admin items are never shown to Guests */}
                        {user.role === 'customer' && (
                          <Link
                            to="/customer/bookings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="px-4 py-2.5 text-xs text-[#EDE7DC] hover:bg-[#132B45] hover:text-[#C9A45C] flex items-center space-x-2 transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5 text-[#C9A45C]" />
                            <span>My Bookings</span>
                          </Link>
                        )}

                        {/* Admins see Admin Portal */}
                        {user.role === 'admin' && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="px-4 py-2.5 text-xs text-[#EDE7DC] hover:bg-[#132B45] hover:text-[#C9A45C] flex items-center space-x-2 transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5 text-[#C9A45C]" />
                            <span>Admin Portal</span>
                          </Link>
                        )}
                      </div>

                      <button
                        onClick={async () => {
                          await logout();
                          setUserDropdownOpen(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-[#E5989B] hover:bg-[#9B4545]/20 flex items-center space-x-2 border-t border-[#C9A45C]/20 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-[#E5989B]" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <div className="py-1">
                      <div className="px-4 py-1.5 border-b border-[#C9A45C]/15 text-[11px] font-semibold text-[#C9A45C]">
                        Guest Portal
                      </div>
                      <Link
                        to="/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="px-4 py-2.5 text-xs text-[#EDE7DC] hover:bg-[#132B45] hover:text-[#C9A45C] flex items-center space-x-2 transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5 text-[#C9A45C]" />
                        <span>Guest Sign In</span>
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setUserDropdownOpen(false)}
                        className="px-4 py-2.5 text-xs text-[#EDE7DC] hover:bg-[#132B45] hover:text-[#C9A45C] flex items-center space-x-2 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-[#C9A45C]" />
                        <span>Create Guest Account</span>
                      </Link>
                      <Link
                        to="/customer/bookings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="px-4 py-2.5 text-xs text-[#EDE7DC] hover:bg-[#132B45] hover:text-[#C9A45C] flex items-center space-x-2 transition-colors border-b border-[#C9A45C]/15"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#C9A45C]" />
                        <span>My Bookings</span>
                      </Link>

                      <div className="px-4 py-1.5 text-[11px] font-semibold text-[#C9A45C]">
                        Staff Administration
                      </div>
                      <Link
                        to="/admin/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="px-4 py-2.5 text-xs text-[#EDE7DC] hover:bg-[#132B45] hover:text-[#C9A45C] flex items-center space-x-2 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#C9A45C]" />
                        <span>Admin Portal</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Book Room CTA Button */}
            <Link
              to="/rooms"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#0B1F33] bg-[#C9A45C] hover:bg-[#B58E47] transition-colors duration-200 cursor-pointer whitespace-nowrap shadow-xs"
            >
              Reserve Stay
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            {user?.role !== 'admin' && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-lg text-[#F8F5EF] hover:bg-[#132B45]"
              >
                <ShoppingBag className="w-5 h-5 text-[#C9A45C]" />
                {totalRoomsInCart > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#C9A45C] text-[#0B1F33] text-[10px] font-bold leading-none tabular-nums">
                    {totalRoomsInCart}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#F8F5EF] hover:bg-[#132B45]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#C9A45C]/20 bg-[#0B1F33] px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#F8F5EF] py-2 border-b border-[#C9A45C]/15"
          >
            Home
          </Link>
          <Link
            to="/rooms"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#F8F5EF] py-2 border-b border-[#C9A45C]/15"
          >
            Rooms & Suites
          </Link>

          {user ? (
            <>
              {user.role === 'customer' && (
                <Link
                  to="/customer/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium text-[#C9A45C] py-2 border-b border-[#C9A45C]/15"
                >
                  My Bookings
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-semibold text-[#C9A45C] py-2 border-b border-[#C9A45C]/15"
                >
                  Admin Portal
                </Link>
              )}
              <button
                onClick={async () => {
                  await logout();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full text-left text-sm font-medium text-[#E5989B] py-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#C9A45C] text-[#0B1F33] text-center"
              >
                Guest Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#132B45] border border-[#C9A45C]/30 text-[#F8F5EF] text-center"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
