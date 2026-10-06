/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Shield, Lock, Mail, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Dedicated Administrator Authentication Page (`/admin/login`)
 * - Strictly separated from the Guest Portal (`/login`).
 * - No hardcoded admin credentials exist in the frontend JavaScript.
 * - Submits to `POST /api/auth/admin/login`, which uses `AuthenticationService.loginAdmin()`
 *   to verify credentials AND confirm the `ADMIN` role in the relational database.
 * - If a Guest tries to sign in here using valid guest credentials, the backend
 *   rejects the request with `403 Forbidden`.
 */
export const AdminLoginPage: React.FC = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await adminLogin(email.trim(), password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(
        err.message ||
          '403 Forbidden: Access denied. Only authorized ADMIN accounts may sign in here.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1F33] text-[#F8F5EF] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Top Bar */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="font-display text-2xl font-semibold tracking-wider text-[#F8F5EF] hover:text-[#C9A45C] transition-colors"
        >
          PHOENIX
        </Link>
        <Link
          to="/"
          className="text-xs font-medium text-[#EDE7DC]/80 hover:text-[#C9A45C] flex items-center space-x-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Hotel Sanctuary</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-auto bg-[#F8F5EF] text-[#252525] rounded-3xl shadow-2xl border border-[#C9A45C]/40 overflow-hidden">
        <div className="bg-[#132B45] px-7 py-7 text-[#F8F5EF] border-b border-[#C9A45C]/30">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#0B1F33] border border-[#C9A45C]/35 text-[#C9A45C] text-[11px] font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Restricted Staff & Management Access</span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-wide text-[#F8F5EF]">
            Admin Portal Authentication
          </h1>
          <p className="text-xs text-[#EDE7DC]/75 mt-1">
            Role-based access control enforced. Only verified <strong className="text-[#C9A45C]">ADMIN</strong> accounts can authenticate into this portal.
          </p>
        </div>

        <div className="p-7 space-y-5">
          {error && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-[#9B4545]/10 border border-[#9B4545]/35 text-[#9B4545] text-xs font-semibold flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#C9A45C] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter authorized admin email"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#C9A45C]/40 text-[#252525] focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1.5">
                Administrator Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#C9A45C] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#C9A45C]/40 text-[#252525] focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0B1F33] hover:bg-[#132B45] text-[#C9A45C] border border-[#C9A45C]/40 font-bold text-xs shadow-sm transition-colors duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Verifying ADMIN Role...' : 'Sign In to Admin Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#EDE7DC] flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Looking for Guest Reservations?</span>
            <Link
              to="/login"
              className="font-semibold text-[#0B1F33] hover:text-[#C9A45C] transition-colors"
            >
              Guest Portal Login →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center text-xs text-[#EDE7DC]/50">
        © {new Date().getFullYear()} Phoenix Hotel & Suites · Role-Based Access Control (RBAC) Security
      </div>
    </div>
  );
};
