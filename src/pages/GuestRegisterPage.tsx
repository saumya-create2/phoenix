/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const GuestRegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Encapsulation: Role is strictly assigned as GUEST ('customer') on the backend
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        city: city.trim(),
        address: address.trim(),
      });
      setSuccess('Guest account registered! Redirecting to your portal...');
      setTimeout(() => {
        navigate('/customer/bookings');
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] bg-[#F8F5EF] text-[#252525] flex items-center justify-center py-14 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#C9A45C]/35 overflow-hidden">
        
        {/* Deep Navy Header */}
        <div className="bg-[#0B1F33] px-7 py-7 text-[#F8F5EF] border-b border-[#C9A45C]/30">
          <div className="text-[#C9A45C] text-xs font-semibold tracking-wider uppercase mb-1">
            Phoenix Guest Registration
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-wide text-[#F8F5EF]">
            Create Your Guest Account
          </h1>
          <p className="text-xs text-[#EDE7DC]/75 mt-1">
            Register for direct suite reservations, multi-room cart checkout, and digital invoices.
          </p>
        </div>

        <div className="p-7 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#9B4545]/10 border border-[#9B4545]/30 text-[#9B4545] text-xs font-medium flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-[#3F7652]/10 border border-[#3F7652]/30 text-[#3F7652] text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#C9A45C] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aditya Mehta"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-[#252525] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#C9A45C] absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-[#252525] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C9A45C] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-[#252525] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                Password (min. 6 characters) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C9A45C] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-[#252525] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#C9A45C] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-[#252525] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Residence"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-[#252525] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] font-bold text-xs shadow-sm transition-colors duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Creating Guest Account...' : 'Complete Guest Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#EDE7DC] flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Already have a guest account?</span>
            <Link
              to="/login"
              className="font-semibold text-[#0B1F33] hover:text-[#C9A45C] transition-colors"
            >
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
