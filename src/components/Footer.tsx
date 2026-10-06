/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B1F33] text-[#EDE7DC]/80 border-t border-[#C9A45C]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand & Heritage */}
          <div className="space-y-4">
            <span className="font-display text-2xl font-semibold text-[#F8F5EF] tracking-wider block">
              PHOENIX
            </span>
            <p className="text-sm text-[#EDE7DC]/75 leading-relaxed">
              Timeless luxury, bespoke hospitality, and serene architectural suites designed for discerning travelers.
            </p>
            <p className="text-xs text-[#C9A45C] font-medium">
              Five-Star Luxury Sanctuary · Direct Reservations
            </p>
          </div>

          {/* Curated Hospitality */}
          <div>
            <h4 className="font-display text-sm font-semibold text-[#C9A45C] mb-4">
              The Phoenix Experience
            </h4>
            <ul className="space-y-2.5 text-xs text-[#EDE7DC]/80">
              <li>Bespoke Suite & Villa Accommodations</li>
              <li>Commission-Free Direct Booking Privilege</li>
              <li>24-Hour Concierge & Chauffeur Service</li>
              <li>Holistic Wellness & Fine Dining</li>
            </ul>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-display text-sm font-semibold text-[#C9A45C] mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-[#C9A45C] transition-colors">Overview & Featured Suites</Link>
              </li>
              <li>
                <Link to="/rooms" className="hover:text-[#C9A45C] transition-colors">Accommodations & Availability</Link>
              </li>
              <li className="pt-1 text-[#EDE7DC]/60 text-[11px]">
                Check-In: 2:00 PM · Check-Out: 11:00 AM
              </li>
            </ul>
          </div>

          {/* Hotel Contact & Concierge Desk */}
          <div className="bg-[#132B45] rounded-2xl p-5 border border-[#C9A45C]/25 space-y-3">
            <div className="flex items-center space-x-2 text-[#C9A45C]">
              <MapPin className="w-4 h-4" />
              <span className="font-display text-xs font-semibold">Concierge & Location</span>
            </div>
            <div className="space-y-2 text-xs text-[#EDE7DC]/85">
              <p className="leading-relaxed">
                Plot 18, Golf Course Road, Sector 42, Gurugram, Haryana 122002
              </p>
              <div className="flex items-center space-x-2 text-[#EDE7DC]/75">
                <Phone className="w-3.5 h-3.5 text-[#C9A45C]" />
                <span>+91 (124) 490-8800</span>
              </div>
              <div className="flex items-center space-x-2 text-[#EDE7DC]/75">
                <Mail className="w-3.5 h-3.5 text-[#C9A45C]" />
                <span>reservations@phoenixhotel.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#C9A45C]/20 flex flex-col sm:flex-row items-center justify-between text-xs text-[#EDE7DC]/60 gap-4">
          <p>© {new Date().getFullYear()} Phoenix Hotel & Suites · All Rights Reserved</p>
          <p>Privacy Policy · Terms of Residence · Direct Rate Guarantee</p>
        </div>
      </div>
    </footer>
  );
};
