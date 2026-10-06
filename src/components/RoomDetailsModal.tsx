/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Room } from '../types/index.js';
import { api } from '../services/api.js';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  X,
  Users,
  Bed,
  Maximize2,
  ShieldCheck,
  Star,
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';

interface RoomDetailsModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (room: Room) => void;
}

export const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  room,
  isOpen,
  onClose,
  onBookNow,
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToCart, setIsCartOpen } = useCart();

  useEffect(() => {
    if (room && isOpen) {
      loadReviews(room.roomId);
    }
  }, [room, isOpen]);

  const loadReviews = async (roomId: number) => {
    setLoading(true);
    try {
      const res = await api.getRoomById(roomId);
      setReviews(res.room.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !room) return null;

  const { roomType } = room;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1F33]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-3xl bg-[#F8F5EF] rounded-3xl shadow-2xl border border-[#C9A45C]/35 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header Banner */}
        <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-[#0B1F33]">
          <img
            src={room.imageUrl || roomType.imageUrl}
            alt={roomType.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33] via-[#0B1F33]/50 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#0B1F33]/80 backdrop-blur-md text-[#F8F5EF] hover:text-[#C9A45C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Room Title Floating In Header */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold text-[#C9A45C] mb-1">
                {roomType.code} · Floor {room.floorNumber}
                {room.housekeepingStatus ? ` · ${room.housekeepingStatus}` : ''}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F8F5EF] tracking-wide">
                {roomType.name}
              </h2>
            </div>

            <div className="text-right tabular-nums">
              <div className="font-display text-2xl sm:text-3xl font-semibold text-[#C9A45C]">
                ₹{roomType.basePrice.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-[#EDE7DC]/80 font-medium">per night + 12% GST</div>
            </div>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Key Specs Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-[#EDE7DC] flex items-center space-x-3">
              <Users className="w-5 h-5 text-[#C9A45C]" />
              <div>
                <div className="text-[11px] font-medium text-[#6B6B6B]">Max Capacity</div>
                <div className="text-xs font-semibold text-[#252525] tabular-nums">{roomType.maxOccupancy} Guests</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#EDE7DC] flex items-center space-x-3">
              <Bed className="w-5 h-5 text-[#C9A45C]" />
              <div>
                <div className="text-[11px] font-medium text-[#6B6B6B]">Bedding</div>
                <div className="text-xs font-semibold text-[#252525] truncate">{roomType.bedType}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#EDE7DC] flex items-center space-x-3">
              <Maximize2 className="w-5 h-5 text-[#C9A45C]" />
              <div>
                <div className="text-[11px] font-medium text-[#6B6B6B]">Suite Dimensions</div>
                <div className="text-xs font-semibold text-[#252525] tabular-nums">{roomType.sizeSqft} Sq. Ft.</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#EDE7DC] flex items-center space-x-3">
              <CheckCircle2 className={`w-5 h-5 ${room.isAvailableForQuery ? 'text-[#3F7652]' : 'text-[#9B4545]'}`} />
              <div>
                <div className="text-[11px] font-medium text-[#6B6B6B]">Status</div>
                <div className={`text-xs font-semibold ${room.isAvailableForQuery ? 'text-[#3F7652]' : 'text-[#9B4545]'}`}>
                  {room.isAvailableForQuery ? 'Available' : 'Unavailable'}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-display text-base font-semibold text-[#0B1F33] mb-2">Suite Overview</h4>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              {roomType.description}
            </p>
            {room.notes && (
              <p className="mt-2.5 text-xs font-medium text-[#0B1F33] bg-[#EDE7DC] p-3 rounded-xl border border-[#C9A45C]/30">
                Residence Note: {room.notes}
              </p>
            )}
          </div>

          {/* Amenities Grid */}
          <div>
            <h4 className="font-display text-base font-semibold text-[#0B1F33] mb-3">Included Sanctuary Amenities</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {roomType.amenities.map((am) => (
                <div
                  key={am.amenityId}
                  className="p-3 rounded-xl bg-white border border-[#EDE7DC] text-xs font-medium text-[#252525]"
                >
                  {am.name}
                </div>
              ))}
            </div>
          </div>

          {/* Guest Reviews Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-base font-semibold text-[#0B1F33]">Verified Guest Impressions</h4>
              <div className="flex items-center space-x-1 text-xs font-semibold text-[#C9A45C] tabular-nums">
                <Star className="w-4 h-4 fill-[#C9A45C] text-[#C9A45C]" />
                <span>4.9 / 5.0 (52 stays)</span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-6 text-xs text-[#6B6B6B]">Loading guest impressions...</div>
            ) : reviews.length === 0 ? (
              <div className="text-xs text-[#6B6B6B] italic p-3.5 bg-white rounded-xl border border-[#EDE7DC]">
                No recent reviews for this category yet. Be the first to share your experience at Phoenix.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.review_id || rev.reviewId}
                    className="p-3.5 rounded-xl bg-white border border-[#EDE7DC] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0B1F33]">{rev.guest_name || rev.guestName}</span>
                      <div className="flex items-center space-x-0.5">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-[#C9A45C] text-[#C9A45C]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#6B6B6B] italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assurance Box */}
          <div className="p-4 rounded-2xl bg-[#EDE7DC] border border-[#C9A45C]/30 flex items-start space-x-3 text-xs text-[#252525]">
            <ShieldCheck className="w-5 h-5 text-[#C9A45C] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-0.5 text-[#0B1F33]">Phoenix Direct Reservation Privilege</div>
              <p className="text-[#6B6B6B] leading-relaxed">
                Complimentary cancellation up to 24 hours prior to arrival. Includes artisanal breakfast buffet, high-speed optical Wi-Fi, and 24/7 concierge care.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer / CTA */}
        <div className="p-6 bg-[#EDE7DC] border-t border-[#C9A45C]/25 flex items-center justify-between">
          <div className="tabular-nums">
            <div className="text-xs text-[#6B6B6B]">Nightly Tariff</div>
            <div className="font-display text-xl font-semibold text-[#0B1F33]">
              ₹{roomType.basePrice.toLocaleString('en-IN')} <span className="text-xs font-sans font-normal text-[#6B6B6B]">/ night</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#0B1F33]/20 bg-[#F8F5EF] text-[#252525] hover:bg-white text-xs font-semibold cursor-pointer"
            >
              Back
            </button>
            {room.isAvailableForQuery && (
              <button
                onClick={() => {
                  addToCart(room, 1);
                  onClose();
                  setIsCartOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-[#C9A45C] bg-[#0B1F33] text-[#F8F5EF] hover:bg-[#132B45] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#C9A45C]" />
                <span>Add to Cart</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onBookNow(room);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>Reserve Suite</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
