/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Booking } from '../types/index.js';
import { downloadReceiptFile, printReceiptDocument, ReceiptPayload } from '../utils/receiptGenerator.js';
import {
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  FileText,
  Printer,
  Download,
  X,
  Save,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user, loading: authLoading, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'bookings' | 'profile'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editable Profile State
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login?redirect=/customer/bookings');
      return;
    }
    setProfileName(user.name || '');
    setProfilePhone(user.phone || '');
    setProfileCity(user.city || '');
    setProfileAddress(user.address || '');
    loadCustomerBookings();
  }, [user, authLoading]);

  const loadCustomerBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getBookings();
      setBookings(res.bookings);
    } catch (err: any) {
      console.error('Failed to load customer bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    try {
      await updateProfile({
        name: profileName,
        phone: profilePhone,
        city: profileCity,
        address: profileAddress,
      });
      setMessage({ type: 'success', text: 'Your guest profile has been updated.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    setCancellingId(bookingId);
    setMessage(null);

    try {
      const res = await api.cancelBooking(bookingId);
      setMessage({ type: 'success', text: res.message });
      await loadCustomerBookings();
      if (selectedBooking && selectedBooking.bookingId === bookingId) {
        setSelectedBooking(null);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to cancel reservation.' });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <span className="text-xs font-semibold text-[#3F7652]">Confirmed</span>;
      case 'Checked-In':
        return <span className="text-xs font-semibold text-[#0B1F33]">Checked-In</span>;
      case 'Checked-Out':
        return <span className="text-xs font-semibold text-[#6B6B6B]">Checked-Out</span>;
      case 'Cancelled':
        return <span className="text-xs font-semibold text-[#9B4545]">Cancelled</span>;
      case 'Pending':
      default:
        return <span className="text-xs font-semibold text-[#C9A45C]">Pending</span>;
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F8F5EF] flex items-center justify-center text-sm text-[#6B6B6B]">
        Verifying guest session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#252525] pb-20">
      
      {/* Header Banner (Deep Navy #0B1F33) */}
      <div className="bg-[#0B1F33] text-[#F8F5EF] py-12 px-4 sm:px-6 lg:px-8 border-b border-[#C9A45C]/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#C9A45C] text-[#0B1F33] flex items-center justify-center font-display text-2xl font-bold shadow-md">
              {user.name?.charAt(0) || 'G'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F8F5EF] tracking-wide">
                  {user.name || 'Valued Guest'}
                </h1>
                <span className="text-xs font-semibold text-[#C9A45C]">
                  · Registered Guest Portal
                </span>
              </div>
              <p className="text-xs text-[#EDE7DC]/75 mt-0.5 flex items-center space-x-2">
                <span>{user.email}</span>
                <span>·</span>
                <span>{user.phone || '+91 98111 22233'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="px-3.5 py-2 rounded-xl bg-[#132B45] hover:bg-[#1A3756] border border-[#C9A45C]/30 text-xs font-semibold text-[#EDE7DC] hover:text-[#F8F5EF] flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#E5989B]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Toast / Notification Banner */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs font-medium flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-[#3F7652]/10 border-[#3F7652]/30 text-[#3F7652]'
                : 'bg-[#9B4545]/10 border-[#9B4545]/30 text-[#9B4545]'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#3F7652] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#9B4545] shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#C9A45C]/25 mb-6 gap-6">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 text-xs font-semibold transition-colors flex items-center space-x-2 cursor-pointer border-b-2 ${
              activeTab === 'bookings'
                ? 'border-[#C9A45C] text-[#0B1F33]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#252525]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#C9A45C]" />
            <span>My Reservations ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs font-semibold transition-colors flex items-center space-x-2 cursor-pointer border-b-2 ${
              activeTab === 'profile'
                ? 'border-[#C9A45C] text-[#0B1F33]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#252525]'
            }`}
          >
            <User className="w-4 h-4 text-[#C9A45C]" />
            <span>My Profile & Preferences</span>
          </button>
        </div>

        {/* TAB 1: BOOKINGS LIST */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {loading ? (
              <div className="p-12 text-center text-[#6B6B6B] text-sm">Loading your reservations...</div>
            ) : bookings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#C9A45C]/30 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EDE7DC] text-[#C9A45C] flex items-center justify-center mx-auto">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-semibold text-[#0B1F33]">No Reservations Found</h3>
                <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
                  You have not reserved any stays with Phoenix yet. Explore our luxury rooms and suites to reserve your sanctuary.
                </p>
                <Link
                  to="/rooms"
                  className="inline-block px-5 py-2.5 rounded-xl bg-[#C9A45C] text-[#0B1F33] text-xs font-bold hover:bg-[#B58E47] transition-colors shadow-xs"
                >
                  Explore Rooms & Suites
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div
                    key={b.bookingId}
                    className="p-5 sm:p-6 bg-white rounded-2xl border border-[#C9A45C]/30 shadow-2xs hover:border-[#C9A45C] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    {/* Booking Details Left */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-[#0B1F33]">
                          {b.bookingReference}
                        </span>
                        <span className="text-[#6B6B6B]">·</span>
                        {getStatusText(b.bookingStatus)}
                        <span className="text-[#6B6B6B]">·</span>
                        <span className="text-[11px] font-medium text-[#6B6B6B]">
                          Payment: <strong className="text-[#252525]">{b.paymentStatus}</strong>
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-semibold text-[#0B1F33]">
                        {b.room?.roomTypeName || 'Deluxe Suite'} — Room #{b.room?.roomNumber || '101'}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B6B6B] tabular-nums">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#C9A45C]" />
                          <span>{b.checkInDate} to {b.checkOutDate}</span>
                        </div>
                        <div>·</div>
                        <div>{b.totalGuests} {b.totalGuests === 1 ? 'Guest' : 'Guests'}</div>
                        <div>·</div>
                        <div>Total: <strong className="text-[#0B1F33] text-sm">₹{b.totalAmount.toLocaleString('en-IN')}</strong></div>
                      </div>

                      {b.specialRequests && (
                        <p className="text-[11px] text-[#6B6B6B] italic">
                          Special Request: "{b.specialRequests}"
                        </p>
                      )}
                    </div>

                    {/* Actions Right */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="px-4 py-2 rounded-xl border border-[#0B1F33]/20 text-[#252525] hover:bg-[#F8F5EF] text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#C9A45C]" />
                        <span>View Invoice</span>
                      </button>

                      {b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Checked-Out' && (
                        <button
                          onClick={() => handleCancelBooking(b.bookingId)}
                          disabled={cancellingId === b.bookingId}
                          className="px-4 py-2 rounded-xl bg-[#9B4545]/10 text-[#9B4545] hover:bg-[#9B4545]/20 border border-[#9B4545]/30 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {cancellingId === b.bookingId ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE & PREFERENCES */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C9A45C]/30 shadow-2xs space-y-6">
            <div className="pb-4 border-b border-[#EDE7DC]">
              <h2 className="font-display text-xl font-semibold text-[#0B1F33]">Guest Profile Details</h2>
              <p className="text-xs text-[#6B6B6B]">Manage your contact information and personal stay preferences.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-sm font-semibold text-[#0B1F33] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-1">Email Address (Verified Identity)</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#EDE7DC]/70 border border-[#EDE7DC] text-sm font-semibold text-[#6B6B6B] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-sm font-semibold text-[#0B1F33] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-1">City / Location</label>
                  <input
                    type="text"
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    placeholder="Bengaluru, India"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-sm font-semibold text-[#0B1F33] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#6B6B6B] mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="Street address, apartment, or suite"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-sm font-semibold text-[#0B1F33] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1F33]/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#F8F5EF] rounded-3xl shadow-2xl border border-[#C9A45C]/35 overflow-hidden p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#EDE7DC]">
              <div>
                <span className="text-[11px] font-mono text-[#C9A45C] font-bold">
                  {selectedBooking.bookingReference}
                </span>
                <h3 className="font-display text-xl font-semibold text-[#0B1F33]">
                  Reservation Invoice Dossier
                </h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#0B1F33] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Summary */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white border border-[#EDE7DC]">
                <div>
                  <span className="text-[10px] font-semibold text-[#6B6B6B]">Guest</span>
                  <div className="font-semibold text-[#0B1F33]">{user.name}</div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#6B6B6B]">Room</span>
                  <div className="font-semibold text-[#0B1F33]">Room #{selectedBooking.room?.roomNumber}</div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#6B6B6B]">Dates</span>
                  <div className="font-semibold text-[#0B1F33]">{selectedBooking.checkInDate} → {selectedBooking.checkOutDate}</div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#6B6B6B]">Status</span>
                  <div>{getStatusText(selectedBooking.bookingStatus)}</div>
                </div>
              </div>

              <div className="border border-[#C9A45C]/30 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left font-mono text-xs tabular-nums">
                  <thead className="bg-[#0B1F33] text-[#F8F5EF]">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE7DC]">
                    <tr>
                      <td className="py-2.5 px-3">Room Charges</td>
                      <td className="py-2.5 px-3 text-right">₹{selectedBooking.roomCharges.toLocaleString('en-IN')}</td>
                    </tr>
                    {selectedBooking.servicesCharges > 0 && (
                      <tr>
                        <td className="py-2.5 px-3">Add-On Hotel Services</td>
                        <td className="py-2.5 px-3 text-right">₹{selectedBooking.servicesCharges.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2.5 px-3">Goods & Services Tax (12%)</td>
                      <td className="py-2.5 px-3 text-right">₹{selectedBooking.taxAmount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="font-bold text-sm bg-[#EDE7DC] text-[#0B1F33]">
                      <td className="py-3 px-3">Grand Total</td>
                      <td className="py-3 px-3 text-right">₹{selectedBooking.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nights = Math.max(
                      1,
                      Math.round(
                        (new Date(selectedBooking.checkOutDate).getTime() -
                          new Date(selectedBooking.checkInDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    );
                    const payload: ReceiptPayload = {
                      bookingReference: selectedBooking.bookingReference,
                      bookingStatus: selectedBooking.bookingStatus,
                      paymentStatus: selectedBooking.paymentStatus,
                      paymentMethod: selectedBooking.paymentMethod || 'Card / Hotel Settlement',
                      transactionReference: selectedBooking.transactionReference,
                      guestName: user.name || selectedBooking.customerName || 'Valued Guest',
                      guestEmail: user.email || selectedBooking.customerEmail,
                      guestPhone: user.phone || selectedBooking.customerPhone,
                      roomNumber: selectedBooking.room?.roomNumber || '101',
                      roomTypeName: selectedBooking.room?.roomTypeName || 'Hotel Suite',
                      checkInDate: selectedBooking.checkInDate,
                      checkOutDate: selectedBooking.checkOutDate,
                      nights,
                      guests: selectedBooking.totalGuests || 2,
                      roomCharges: selectedBooking.roomCharges,
                      servicesCharges: selectedBooking.servicesCharges,
                      taxAmount: selectedBooking.taxAmount,
                      totalAmount: selectedBooking.totalAmount,
                    };
                    printReceiptDocument(payload);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#0B1F33]/25 bg-white text-[#252525] hover:bg-[#EDE7DC] text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#C9A45C]" />
                  <span>Print Receipt</span>
                </button>

                <button
                  onClick={() => {
                    const nights = Math.max(
                      1,
                      Math.round(
                        (new Date(selectedBooking.checkOutDate).getTime() -
                          new Date(selectedBooking.checkInDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    );
                    const payload: ReceiptPayload = {
                      bookingReference: selectedBooking.bookingReference,
                      bookingStatus: selectedBooking.bookingStatus,
                      paymentStatus: selectedBooking.paymentStatus,
                      paymentMethod: selectedBooking.paymentMethod || 'Card / Hotel Settlement',
                      transactionReference: selectedBooking.transactionReference,
                      guestName: user.name || selectedBooking.customerName || 'Valued Guest',
                      guestEmail: user.email || selectedBooking.customerEmail,
                      guestPhone: user.phone || selectedBooking.customerPhone,
                      roomNumber: selectedBooking.room?.roomNumber || '101',
                      roomTypeName: selectedBooking.room?.roomTypeName || 'Hotel Suite',
                      checkInDate: selectedBooking.checkInDate,
                      checkOutDate: selectedBooking.checkOutDate,
                      nights,
                      guests: selectedBooking.totalGuests || 2,
                      roomCharges: selectedBooking.roomCharges,
                      servicesCharges: selectedBooking.servicesCharges,
                      taxAmount: selectedBooking.taxAmount,
                      totalAmount: selectedBooking.totalAmount,
                    };
                    downloadReceiptFile(payload);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Receipt</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 rounded-xl bg-[#0B1F33] text-[#F8F5EF] text-xs font-semibold hover:bg-[#132B45] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
