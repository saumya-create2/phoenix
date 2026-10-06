/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { Room } from '../types/index.js';
import { RoomCard } from '../components/RoomCard.js';
import { RoomDetailsModal } from '../components/RoomDetailsModal.js';
import {
  Calendar,
  Users,
  Search,
  Sparkles,
  Utensils,
  Car,
  Wifi,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Search parameters
  const [checkIn, setCheckIn] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    return tomorrow.toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState(2);

  // Featured Rooms
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const [roomsRes] = await Promise.all([
        api.getRooms({ status: 'Available' }),
      ]);
      // Pick 1 featured available room from each of the 6 room categories
      const byCategory = new Map<number, Room>();
      for (const r of roomsRes.rooms) {
        if (!byCategory.has(r.roomTypeId)) {
          byCategory.set(r.roomTypeId, r);
        }
      }
      const sixCategoryRooms = Array.from(byCategory.values()).slice(0, 6);
      setFeaturedRooms(sixCategoryRooms.length > 0 ? sixCategoryRooms : roomsRes.rooms.slice(0, 6));
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room);
    setIsDetailsOpen(true);
  };

  const handleBookNow = (room: Room) => {
    navigate(`/book/${room.roomId}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#252525]">
      
      {/* 1. HERO SECTION (Deep Navy #0B1F33 & Champagne Gold #C9A45C) */}
      <section className="relative bg-[#0B1F33] text-[#F8F5EF] pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-[#C9A45C]/30 overflow-hidden">
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          
          <p className="text-xs sm:text-sm text-[#C9A45C] font-medium tracking-widest mb-3">
            Five-Star Luxury Sanctuary · Direct Reservations
          </p>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-wide text-[#F8F5EF] mb-4 leading-tight max-w-3xl mx-auto">
            Phoenix Hotel & Suites
          </h1>

          <p className="text-lg sm:text-xl text-[#EDE7DC] font-light mb-5">
            Timeless Elegance. Tranquil Luxury. Bespoke Hospitality.
          </p>

          <p className="text-sm sm:text-base text-[#EDE7DC]/80 max-w-2xl mx-auto mb-12 leading-relaxed font-normal">
            Experience refined architectural suites, real-time availability, commission-free direct reservations, and personalized concierge care in the heart of the city.
          </p>

          {/* Search Widget Container */}
          <div className="max-w-4xl mx-auto bg-[#F8F5EF] p-5 sm:p-6 rounded-2xl shadow-xl border border-[#C9A45C]/40 text-[#252525] text-left">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              
              {/* Check-In */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">
                  Check-In Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#C9A45C] absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold rounded-xl bg-white border border-[#C9A45C]/35 focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C] transition-all text-[#252525]"
                  />
                </div>
              </div>

              {/* Check-Out */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">
                  Check-Out Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#C9A45C] absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold rounded-xl bg-white border border-[#C9A45C]/35 focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C] transition-all text-[#252525]"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-xs font-semibold text-[#6B6B6B] mb-1.5">
                  Guests & Suites
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-[#C9A45C] absolute left-3 top-3" />
                  <select
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value, 10))}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold rounded-xl bg-white border border-[#C9A45C]/35 focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C] transition-all text-[#252525]"
                  >
                    <option value={1}>1 Guest (Single / King)</option>
                    <option value={2}>2 Guests (Standard / Deluxe)</option>
                    <option value={3}>3 Guests (Executive / Cart)</option>
                    <option value={4}>4 Guests (Suite or 2 Rooms)</option>
                    <option value={5}>5 Guests (Family Suite / Cart)</option>
                  </select>
                </div>
              </div>

              {/* Champagne Gold Search Button */}
              <div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors duration-200 cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  <span>Check Availability</span>
                </button>
              </div>

            </form>
          </div>

          {/* Key Hospitality Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-14 pt-10 border-t border-[#C9A45C]/25 text-center tabular-nums">
            <div>
              <div className="font-display text-3xl sm:text-4xl font-semibold text-[#F8F5EF]">35,000+</div>
              <div className="text-xs text-[#EDE7DC]/75 mt-1 font-medium">Bespoke Stays Hosted</div>
            </div>
            <div>
              <div className="font-display text-3xl sm:text-4xl font-semibold text-[#C9A45C]">6</div>
              <div className="text-xs text-[#EDE7DC]/75 mt-1 font-medium">Signature Suite Categories</div>
            </div>
            <div>
              <div className="font-display text-3xl sm:text-4xl font-semibold text-[#F8F5EF]">100%</div>
              <div className="text-xs text-[#EDE7DC]/75 mt-1 font-medium">Direct Rate Guarantee</div>
            </div>
            <div>
              <div className="font-display text-3xl sm:text-4xl font-semibold text-[#C9A45C]">4.9 / 5.0</div>
              <div className="text-xs text-[#EDE7DC]/75 mt-1 font-medium">Verified Guest Rating</div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. FEATURED ROOMS & SUITES */}
      <section className="py-20 bg-[#F8F5EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-[#C9A45C] font-semibold text-xs">
                Six Signature Accommodations
              </span>
              <h2 className="font-display text-3xl font-semibold text-[#0B1F33] mt-1">
                Featured Rooms & Luxury Suites
              </h2>
            </div>
            <button
              onClick={() => navigate('/rooms')}
              className="mt-4 md:mt-0 inline-flex items-center space-x-2 text-xs font-semibold text-[#0B1F33] hover:text-[#C9A45C] group cursor-pointer"
            >
              <span>Explore All Room Categories</span>
              <ArrowRight className="w-4 h-4 text-[#C9A45C] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 rounded-2xl bg-[#EDE7DC] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRooms.map((room) => (
                <RoomCard
                  key={room.roomId}
                  room={room}
                  onViewDetails={handleViewDetails}
                  onBookNow={handleBookNow}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. HOTEL AMENITIES (Soft Beige #EDE7DC Section) */}
      <section className="py-20 bg-[#EDE7DC] border-y border-[#C9A45C]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[#0B1F33] font-semibold text-xs">
              Sanctuary Privileges
            </span>
            <h2 className="font-display text-3xl font-semibold text-[#0B1F33] mt-1">
              Curated Hotel Amenities & Experiences
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-2">
              Thoughtfully tailored for executive retreats, private leisure escapes, and family residences.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#F8F5EF] border border-[#C9A45C]/30 shadow-2xs">
              <Utensils className="w-6 h-6 text-[#C9A45C] mb-3" />
              <h3 className="font-display font-semibold text-base text-[#0B1F33] mb-1.5">Gourmet Dining & Breakfast</h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                Freshly prepared artisanal continental and regional culinary spreads crafted by our executive chefs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F5EF] border border-[#C9A45C]/30 shadow-2xs">
              <Sparkles className="w-6 h-6 text-[#C9A45C] mb-3" />
              <h3 className="font-display font-semibold text-base text-[#0B1F33] mb-1.5">Holistic Rejuvenation Spa</h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                60-minute bespoke herbal aromatherapy massages, botanical facials, and private thermal therapy.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F5EF] border border-[#C9A45C]/30 shadow-2xs">
              <Car className="w-6 h-6 text-[#C9A45C] mb-3" />
              <h3 className="font-display font-semibold text-base text-[#0B1F33] mb-1.5">Private Chauffeur Transfer</h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                Luxury sedan airport arrivals and departures coordinated with real-time flight monitoring.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F5EF] border border-[#C9A45C]/30 shadow-2xs">
              <Wifi className="w-6 h-6 text-[#C9A45C] mb-3" />
              <h3 className="font-display font-semibold text-base text-[#0B1F33] mb-1.5">High-Speed Optical Wi-Fi</h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                Dedicated private connectivity throughout all suites, boardrooms, and lounge terraces.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F5EF] border border-[#C9A45C]/30 shadow-2xs">
              <Clock className="w-6 h-6 text-[#C9A45C] mb-3" />
              <h3 className="font-display font-semibold text-base text-[#0B1F33] mb-1.5">24/7 Private Concierge</h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                Around-the-clock suite dining, garment care, and curated cultural itineraries.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION BANNER */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0B1F33] border border-[#C9A45C]/40 rounded-3xl p-8 sm:p-14 text-[#F8F5EF] shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-semibold text-[#C9A45C]">
              Direct Reservation Privilege
            </span>
            <h3 className="font-display text-2xl sm:text-4xl font-semibold tracking-wide text-[#F8F5EF]">
              Reserve Direct & Enjoy 10% Off With Code WELCOME10
            </h3>
            <p className="text-sm text-[#EDE7DC]/80 leading-relaxed font-normal">
              Receive complimentary gourmet breakfast, zero booking fees, flexible cancellation, and priority suite selection.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => navigate('/rooms')}
              className="px-8 py-3.5 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] font-bold text-xs transition-colors duration-200 shadow-md cursor-pointer whitespace-nowrap"
            >
              Explore Suites & Availability
            </button>
          </div>
        </div>
      </section>

      {/* Room Details Modal */}
      <RoomDetailsModal
        room={selectedRoom}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onBookNow={handleBookNow}
      />

    </div>
  );
};
