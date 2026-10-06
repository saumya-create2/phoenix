/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  Users,
  Bed,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    totalRoomsInCart,
    totalGuestCapacity,
    totalPricePerNight,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckoutCart = async () => {
    if (cartItems.length === 0) return;
    setIsCartOpen(false);
    const targetUrl = `/book/${cartItems[0].sampleRoomId}?mode=cart&guests=${Math.min(totalGuestCapacity, Math.max(2, totalRoomsInCart * 2))}`;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }
    navigate(targetUrl);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0B1F33]/70 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-md bg-[#F8F5EF] h-full shadow-2xl border-l border-[#C9A45C]/30 flex flex-col justify-between">
        
        {/* Drawer Header */}
        <div className="bg-[#0B1F33] text-[#F8F5EF] px-6 py-5 flex items-center justify-between border-b border-[#C9A45C]/25">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#132B45] border border-[#C9A45C]/40 flex items-center justify-center text-[#C9A45C]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-[#F8F5EF]">Suite & Room Selection</h3>
              <p className="text-[11px] text-[#EDE7DC]/75 tabular-nums">
                {totalRoomsInCart} {totalRoomsInCart === 1 ? 'Room' : 'Rooms'} Selected · Up to {totalGuestCapacity} Guests
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-lg text-[#EDE7DC]/70 hover:text-[#C9A45C] hover:bg-[#132B45] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#EDE7DC] text-[#0B1F33] border border-[#C9A45C]/30 flex items-center justify-center">
                <Bed className="w-7 h-7 text-[#C9A45C]" />
              </div>
              <h4 className="font-display text-base font-semibold text-[#0B1F33]">Your Room Cart is Empty</h4>
              <p className="text-xs text-[#6B6B6B] max-w-xs leading-relaxed">
                Reserving for a larger party (such as 4 guests across 2 separate Standard Rooms)? Select <strong>"Add to Cart"</strong> on any room category to combine multiple rooms in a single reservation.
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/rooms');
                }}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#C9A45C] text-[#0B1F33] text-xs font-semibold hover:bg-[#B58E47] transition-colors cursor-pointer"
              >
                Explore Rooms & Suites
              </button>
            </div>
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-[#EDE7DC] border border-[#C9A45C]/35 text-xs text-[#252525] flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-[#C9A45C] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#0B1F33]">Multi-Room Reservation:</span> Your selected accommodations welcome up to <strong>{totalGuestCapacity} guests</strong> across <strong>{totalRoomsInCart} {totalRoomsInCart === 1 ? 'room' : 'separate rooms'}</strong>.
                </div>
              </div>

              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.roomTypeId}
                    className="p-4 rounded-2xl bg-white border border-[#C9A45C]/25 flex gap-3.5 items-center shadow-2xs"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.roomTypeName}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#EDE7DC]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-semibold text-[#C9A45C]">
                            {item.code}
                          </span>
                          <h4 className="font-display font-semibold text-sm text-[#0B1F33] truncate">
                            {item.roomTypeName}
                          </h4>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.roomTypeId)}
                          className="text-[#6B6B6B] hover:text-[#9B4545] p-1 cursor-pointer"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-[11px] text-[#6B6B6B] mt-0.5 flex items-center space-x-2">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-[#C9A45C]" />
                          <span>Max {item.maxOccupancy}/room ({item.maxOccupancy * item.quantity} total)</span>
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        {/* Quantity Stepper */}
                        <div className="flex items-center space-x-2 bg-[#F8F5EF] border border-[#C9A45C]/30 rounded-xl px-2 py-1">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.roomTypeId, item.quantity - 1)}
                            className="p-1 rounded-lg hover:bg-[#EDE7DC] text-[#252525] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-semibold text-[#0B1F33] px-1.5 tabular-nums">
                            {item.quantity} {item.quantity === 1 ? 'Room' : 'Rooms'}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.maxAvailable}
                            onClick={() => updateCartQuantity(item.roomTypeId, item.quantity + 1)}
                            className="p-1 rounded-lg hover:bg-[#EDE7DC] text-[#252525] disabled:opacity-30 cursor-pointer"
                            title={item.quantity >= item.maxAvailable ? 'Max available rooms reached' : 'Add another room'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right tabular-nums">
                          <div className="text-xs font-bold text-[#0B1F33]">
                            ₹{(item.basePrice * item.quantity).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-[#6B6B6B]">per night</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div className="p-5 bg-[#EDE7DC] border-t border-[#C9A45C]/30 space-y-4">
            <div className="space-y-1.5 text-xs tabular-nums">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Total Rooms Selected</span>
                <span className="font-semibold text-[#252525]">{totalRoomsInCart} {totalRoomsInCart === 1 ? 'Room' : 'Separate Rooms'}</span>
              </div>
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Combined Guest Capacity</span>
                <span className="font-semibold text-[#3F7652]">Up to {totalGuestCapacity} Guests</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#0B1F33] pt-2 border-t border-[#C9A45C]/25">
                <span>Combined Rate / Night</span>
                <span>₹{totalPricePerNight.toLocaleString('en-IN')} + GST</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="px-3.5 py-2.5 rounded-xl border border-[#0B1F33]/20 bg-[#F8F5EF] text-[#252525] hover:bg-white text-xs font-semibold cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleCheckoutCart}
                className="flex-1 py-3 px-4 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Proceed to Book {totalRoomsInCart} {totalRoomsInCart === 1 ? 'Room' : 'Rooms'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
