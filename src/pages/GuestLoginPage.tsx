/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';

export const GuestLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/customer/bookings';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      setSuccess('Authenticated successfully. Redirecting to your guest portal...');
      setTimeout(() => {
        navigate(redirectTo);
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Invalid guest email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] bg-[#F8F5EF] text-[#252525] flex items-center justify-center py-14 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#C9A45C]/35 overflow-hidden">
        
        {/* Luxury Deep Navy Header */}
        <div className="bg-[#0B1F33] px-7 py-7 text-[#F8F5EF] border-b border-[#C9A45C]/30">
          <div className="flex items-center space-x-2 text-[#C9A45C] text-xs font-semibold tracking-wider uppercase mb-1.5">
            <UserCheck className="w-4 h-4" />
            <span>Registered Guest Portal</span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-wide text-[#F8F5EF]">
            Guest Sign In
          </h1>
          <p className="text-xs text-[#EDE7DC]/75 mt-1">
            Sign in to manage your Phoenix reservations, multi-room cart, and stay preferences.
          </p>
        </div>

        {/* Form Body */}
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
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Guest Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C9A45C] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@phoenixhotel.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-[#252525] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C9A45C] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/35 text-[#252525] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] font-bold text-xs shadow-sm transition-colors duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Signing In...' : 'Sign In to Guest Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#EDE7DC] flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>New to Phoenix Hotel?</span>
            <Link
              to="/register"
              className="font-semibold text-[#0B1F33] hover:text-[#C9A45C] transition-colors"
            >
              Create Guest Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
