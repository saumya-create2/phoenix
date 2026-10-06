/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Room } from '../types/index.js';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Users,
  Bed,
  Maximize2,
  ArrowRight,
  Eye,
  ShoppingBag,
  Plus,
  Minus,
} from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onViewDetails: (room: Room) => void;
  onBookNow: (room: Room) => void;
  requestedGuests?: number;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onViewDetails,
  onBookNow,
  requestedGuests = 1,
}) => {
  const { roomType } = room;
  const isAvailable = room.isAvailableForQuery;
  const { addToCart, updateCartQuantity, getQuantityForType, setIsCartOpen } = useCart();

  const qtyInCart = getQuantityForType(room.roomTypeId);
  const maxAvailable = Math.max(1, roomType.availableRooms ?? 3);
  const neededRoomsForParty =
    requestedGuests > roomType.maxOccupancy
      ? Math.ceil(requestedGuests / roomType.maxOccupancy)
      : 1;

  const handleAddRoomToCart = (countToAdd = 1) => {
    addToCart(room, countToAdd);
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#C9A45C]/30 shadow-xs hover:shadow-lg hover:border-[#C9A45C] transition-all duration-200 flex flex-col overflow-hidden">
      
      {/* Room Image Container */}
      <div className="relative aspect-16/10 overflow-hidden bg-[#0B1F33]">
        <img
          src={room.imageUrl || roomType.imageUrl}
          alt={roomType.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/85 via-[#0B1F33]/25 to-transparent pointer-events-none" />

        {/* Availability Status Indicator */}
        <div className="absolute top-3.5 right-3.5 flex items-center space-x-1.5">
          {isAvailable ? (
            <span className="inline-flex items-center space-x-1.5 bg-[#3F7652] text-[#F8F5EF] text-[11px] font-semibold px-3 py-1 rounded-lg shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F8F5EF]"></span>
              <span>Available</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 bg-[#9B4545] text-[#F8F5EF] text-[11px] font-semibold px-3 py-1 rounded-lg shadow-xs">
              <span>{room.physicalStatus}</span>
            </span>
          )}
        </div>

        {/* Price Overlay */}
        <div className="absolute bottom-3.5 right-4 text-right tabular-nums">
          <div className="text-[#F8F5EF] font-display text-xl font-semibold drop-shadow-sm">
            ₹{roomType.basePrice.toLocaleString('en-IN')}
          </div>
          <div className="text-[#EDE7DC]/90 text-[10px] font-medium drop-shadow-xs">
            per night + 12% GST
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Clean Unboxed Metadata */}
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1">
            <span className="text-[#C9A45C] font-semibold">
              {roomType.code} · Floor {room.floorNumber}
            </span>
            <span>
              {room.housekeepingStatus || 'Inspected'}
            </span>
          </div>

          <h3 className="font-display text-lg font-semibold text-[#0B1F33] group-hover:text-[#C9A45C] transition-colors line-clamp-1">
            {roomType.name}
          </h3>

          <p className="text-xs text-[#6B6B6B] line-clamp-2 mt-1.5 leading-relaxed">
            {room.notes ? `${room.notes}. ` : ''}
            {roomType.description}
          </p>

          <div className="mt-2.5 flex items-center justify-between text-[11px] bg-[#F8F5EF] px-3 py-1.5 rounded-lg border border-[#EDE7DC]">
            <span className="font-semibold text-[#252525]">{roomType.name}</span>
            <span className={`font-semibold ${isAvailable ? 'text-[#3F7652]' : 'text-[#9B4545]'}`}>
              {isAvailable ? 'Available for booking' : 'Unavailable for selected dates'}
            </span>
          </div>

          {isAvailable && neededRoomsForParty > 1 && neededRoomsForParty <= maxAvailable && (
            <button
              type="button"
              onClick={() => {
                handleAddRoomToCart(neededRoomsForParty);
                setIsCartOpen(true);
              }}
              className="mt-2 w-full text-left px-3 py-1.5 rounded-lg bg-[#EDE7DC] hover:bg-[#E4DCCE] border border-[#C9A45C]/40 text-[11px] text-[#0B1F33] font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>For {requestedGuests} guests: Add {neededRoomsForParty} separate rooms</span>
              <span className="font-bold text-[#C9A45C] underline">+ Add {neededRoomsForParty}</span>
            </button>
          )}

          {/* Key Specs */}
          <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-[#EDE7DC] text-xs text-[#6B6B6B] tabular-nums">
            <div className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
              <span>Max {roomType.maxOccupancy}/rm</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Bed className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
              <span className="truncate">{roomType.bedType}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-[#C9A45C] shrink-0" />
              <span>{roomType.sizeSqft} sq.ft</span>
            </div>
          </div>

          {/* Unboxed Amenities Metadata */}
          {roomType.amenities && roomType.amenities.length > 0 && (
            <div className="text-[11px] text-[#6B6B6B] mt-3 pt-2 border-t border-[#EDE7DC]/70 truncate">
              {roomType.amenities.slice(0, 3).map((a) => a.name).join(' · ')}
              {roomType.amenities.length > 3 ? ` · +${roomType.amenities.length - 3} more` : ''}
            </div>
          )}
        </div>

        {/* Action Buttons: Add to Cart (Multi-Room), Details, and Book Now */}
        <div className="pt-2 space-y-2">
          {isAvailable && (
            <div className="flex items-center gap-2">
              {qtyInCart > 0 ? (
                <div className="flex-1 flex items-center justify-between bg-[#EDE7DC] border border-[#C9A45C]/50 rounded-xl px-2.5 py-1.5">
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(room.roomTypeId, qtyInCart - 1)}
                      className="p-1 rounded-lg bg-[#F8F5EF] hover:bg-white text-[#252525] border border-[#C9A45C]/30 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-[#0B1F33] px-1 tabular-nums">
                      {qtyInCart} in Cart ({qtyInCart * roomType.maxOccupancy} guests)
                    </span>
                    <button
                      type="button"
                      disabled={qtyInCart >= maxAvailable}
                      onClick={() => updateCartQuantity(room.roomTypeId, qtyInCart + 1)}
                      className="p-1 rounded-lg bg-[#F8F5EF] hover:bg-white text-[#252525] border border-[#C9A45C]/30 disabled:opacity-40 cursor-pointer"
                      title={qtyInCart >= maxAvailable ? 'Maximum available rooms reached' : 'Add another room'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="text-[11px] font-bold text-[#0B1F33] hover:text-[#C9A45C] underline cursor-pointer whitespace-nowrap"
                  >
                    View Cart
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAddRoomToCart(1)}
                  className="w-full py-2 px-3 rounded-xl border border-[#C9A45C]/50 bg-[#F8F5EF] hover:bg-[#EDE7DC] text-[#0B1F33] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#C9A45C]" />
                  <span>Add to Cart (Book Multiple Rooms)</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewDetails(room)}
              className="flex-1 py-2.5 px-3 rounded-xl border border-[#0B1F33]/20 text-[#252525] hover:bg-[#EDE7DC]/60 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5 text-[#0B1F33]" />
              <span>Details</span>
            </button>

            <button
              onClick={() => onBookNow(room)}
              disabled={!isAvailable}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isAvailable
                  ? 'bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] shadow-xs'
                  : 'bg-[#EDE7DC] text-[#6B6B6B] cursor-not-allowed'
              }`}
            >
              <span>{isAvailable ? 'Reserve Now' : 'Reserved'}</span>
              {isAvailable && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
