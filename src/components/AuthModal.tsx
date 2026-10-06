/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { X, Lock, Mail, User, Phone, MapPin } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register({ name, email, phone, password, city, address });
      }
      onClose();
      navigate('/customer/bookings');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1F33]/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#F8F5EF] rounded-3xl shadow-2xl border border-[#C9A45C]/35 overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-[#0B1F33] px-6 py-6 text-[#F8F5EF] relative border-b border-[#C9A45C]/30">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#EDE7DC]/70 hover:text-[#C9A45C] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-1">
            <span className="font-display font-semibold text-xs tracking-widest text-[#C9A45C]">
              PHOENIX GUEST PORTAL
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-wide text-[#F8F5EF]">
            {mode === 'login' ? 'Guest Sign In' : 'Create Guest Account'}
          </h2>
          <p className="text-xs text-[#EDE7DC]/75 mt-1">
            {mode === 'login'
              ? 'Sign in to access your reservations and multi-room booking cart.'
              : 'Register for direct reservations and digital invoice management.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-[#252525]">
          
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#EDE7DC] rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#0B1F33] text-[#F8F5EF] shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#252525]'
              }`}
            >
              Guest Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#0B1F33] text-[#F8F5EF] shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#252525]'
              }`}
            >
              Register Guest
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#9B4545]/10 border border-[#9B4545]/30 text-[#9B4545] text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#C9A45C] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Aditya Mehta"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#C9A45C]/35 text-[#252525] focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#252525] mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#C9A45C] absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#C9A45C]/35 text-[#252525] focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#252525] mb-1">City</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#C9A45C] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Bengaluru"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#C9A45C]/35 text-[#252525] focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252525] mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street / Apartment"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#C9A45C]/35 text-[#252525] focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C9A45C] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@phoenixhotel.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#C9A45C]/35 text-[#252525] focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C9A45C] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#C9A45C]/35 text-[#252525] focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] font-bold text-xs shadow-sm transition-colors duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In to Guest Portal' : 'Create Guest Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
