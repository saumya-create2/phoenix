/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { useCart } from '../context/CartContext.js';
import { Room, HotelService } from '../types/index.js';
import { downloadReceiptFile, ReceiptPayload } from '../utils/receiptGenerator.js';
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Download,
  Coffee,
  Plus,
  Minus,
  AlertCircle,
  Tag,
  QrCode,
  ShoppingBag,
} from 'lucide-react';

export const BookingPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    updateCartQuantity,
    clearCart,
    totalRoomsInCart,
    totalGuestCapacity,
    totalPricePerNight,
    setIsCartOpen,
  } = useCart();

  const isCartCheckout = searchParams.get('mode') === 'cart' && cartItems.length > 0;
  const [singleRoomQuantity, setSingleRoomQuantity] = useState<number>(1);

  // Current Step: 1 -> 2 -> 3 -> 4 -> 5
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Room & Hotel Services Data
  const [room, setRoom] = useState<Room | null>(null);
  const [allServices, setAllServices] = useState<HotelService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Dates & Guests
  const [checkIn, setCheckIn] = useState<string>(() => {
    return searchParams.get('checkIn') || new Date().toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState<string>(() => {
    if (searchParams.get('checkOut')) return searchParams.get('checkOut')!;
    const tom = new Date();
    tom.setDate(tom.getDate() + 3);
    return tom.toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState<number>(() => {
    const g = searchParams.get('guests');
    return g ? parseInt(g, 10) : 2;
  });

  // Step 2: Guest Details
  const [guestName, setGuestName] = useState<string>(user?.name || 'Aditya Mehta');
  const [guestEmail, setGuestEmail] = useState<string>(user?.email || 'guest@phoenixhotel.com');
  const [guestPhone, setGuestPhone] = useState<string>(user?.phone || '+91 98111 22233');
  const [specialRequests, setSpecialRequests] = useState<string>('High floor preferred, extra pillows if possible.');

  // Step 3: Selected Services (Map of serviceId -> quantity)
  const [selectedServices, setSelectedServices] = useState<Record<number, number>>({
    1: 1, // Default Buffet Breakfast selected
  });

  // Promo Code Engine
  const [promoCodeInput, setPromoCodeInput] = useState<string>('WELCOME10');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPct: number } | null>({
    code: 'WELCOME10',
    discountPct: 10,
  });
  const [promoMessage, setPromoMessage] = useState<string | null>('Code WELCOME10 applied! 10% discount on room charges.');

  // Step 4: Payment Simulation & Mode
  const [paymentOption, setPaymentOption] = useState<'full_card' | 'partial_card' | 'pay_at_hotel'>('full_card');
  const [paymentMethod, setPaymentMethod] = useState<'Demo Card Payment' | 'Cash at Hotel'>('Demo Card Payment');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState<string>(user?.name || 'Aditya Mehta');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv] = useState<string>('123');

  // Step 5: Final Confirmed Booking Result
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Sync user state if logged in
  useEffect(() => {
    if (user) {
      if (!guestName) setGuestName(user.name);
      if (!guestEmail) setGuestEmail(user.email);
      if (!guestPhone) setGuestPhone(user.phone);
      if (!cardHolder) setCardHolder(user.name);
    }
  }, [user]);

  // Load Room and Services
  useEffect(() => {
    loadData();
  }, [roomId]);

  const loadData = async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const [roomRes, servicesRes] = await Promise.all([
        api.getRoomById(parseInt(roomId, 10)),
        api.getServices(),
      ]);
      setRoom(roomRes.room);
      setAllServices(servicesRes.services);

      const maxOcc = roomRes.room.roomType.maxOccupancy || 2;
      const maxAvail = Math.max(1, roomRes.room.roomType.availableRooms ?? 3);
      if (guests > maxOcc) {
        setSingleRoomQuantity(Math.min(maxAvail, Math.ceil(guests / maxOcc)));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load room details.');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const calculateNights = (): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return Math.max(1, diff || 1);
  };

  const nights = calculateNights();
  const effectiveRoomsCount = isCartCheckout ? totalRoomsInCart : singleRoomQuantity;
  const effectiveMaxGuests = isCartCheckout
    ? totalGuestCapacity
    : (room?.roomType.maxOccupancy || 2) * singleRoomQuantity;
  const roomPricePerNight = isCartCheckout
    ? totalPricePerNight
    : (room?.roomType.basePrice || 0) * singleRoomQuantity;
  const roomSubtotal = roomPricePerNight * nights;

  // Calculate Services Total
  const calculateServicesTotal = (): number => {
    let total = 0;
    for (const service of allServices) {
      const qty = selectedServices[service.serviceId] || 0;
      if (qty > 0) {
        if (service.chargeType === 'per_day') {
          total += service.price * nights * qty;
        } else if (service.chargeType === 'per_person') {
          total += service.price * guests * qty;
        } else {
          total += service.price * qty;
        }
      }
    }
    return total;
  };

  const servicesSubtotal = calculateServicesTotal();
  const discountAmount = appliedPromo ? Math.round((roomSubtotal * appliedPromo.discountPct) / 100) : 0;
  const preTaxTotal = Math.max(0, roomSubtotal - discountAmount) + servicesSubtotal;
  const taxAmount = Math.round(preTaxTotal * 0.12 * 100) / 100; // 12% GST
  const grandTotal = Math.round((preTaxTotal + taxAmount) * 100) / 100;

  // Deposit vs Balance breakdown
  const depositAmount = paymentOption === 'partial_card' ? Math.round(grandTotal * 0.2) : paymentOption === 'full_card' ? grandTotal : 0;
  const balanceAtHotel = grandTotal - depositAmount;

  // Toggle Services Quantity
  const handleServiceChange = (serviceId: number, delta: number) => {
    setSelectedServices((prev) => {
      const current = prev[serviceId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  // Promo Code Validation
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCodeInput.trim().toUpperCase();
    if (code === 'WELCOME10') {
      setAppliedPromo({ code: 'WELCOME10', discountPct: 10 });
      setPromoMessage('Code WELCOME10 applied! 10% discount on room charges.');
    } else if (code === 'PHOENIX20' || code === 'STAYEASE20') {
      setAppliedPromo({ code, discountPct: 20 });
      setPromoMessage(`Code ${code} applied! 20% privilege discount on room charges.`);
    } else if (code === 'SUMMER15') {
      setAppliedPromo({ code: 'SUMMER15', discountPct: 15 });
      setPromoMessage('Code SUMMER15 applied! 15% seasonal discount on room charges.');
    } else {
      setAppliedPromo(null);
      setPromoMessage('Invalid coupon code. Try WELCOME10 or PHOENIX20.');
    }
  };

  // Step 4 -> 5 Submission
  const handleCompleteReservation = async () => {
    if (!room) return;
    setSubmitting(true);
    setError(null);

    try {
      const servicesPayload = Object.entries(selectedServices).map(([sId, qty]) => ({
        serviceId: parseInt(sId, 10),
        quantity: qty,
      }));

      const resolvedPaymentMethod = paymentOption === 'pay_at_hotel' ? 'Cash at Hotel' : 'Demo Card Payment';

      const bookingPayload: any = {
        roomId: room.roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalGuests: guests,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests: `${specialRequests}${appliedPromo ? ` [Coupon Applied: ${appliedPromo.code}]` : ''}`,
        selectedServices: servicesPayload,
        paymentMethod: resolvedPaymentMethod,
        cardDetails:
          resolvedPaymentMethod === 'Demo Card Payment'
            ? {
                cardNumber,
                cardHolder,
                expiry: cardExpiry,
                cvv: cardCvv,
              }
            : undefined,
      };

      if (isCartCheckout) {
        bookingPayload.cartItems = cartItems.map((item) => ({
          roomTypeId: item.roomTypeId,
          quantity: item.quantity,
        }));
      } else if (singleRoomQuantity > 1) {
        bookingPayload.cartItems = [
          {
            roomTypeId: room.roomTypeId,
            quantity: singleRoomQuantity,
          },
        ];
      }

      const res = await api.createBooking(bookingPayload);

      if (isCartCheckout) {
        clearCart();
      }

      setConfirmedBooking({
        ...res.booking,
        discountAmount,
        depositAmount,
        balanceAtHotel,
        paymentOption,
      });
      setCurrentStep(5);

      try {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#0B1F33', '#C9A45C', '#3F7652', '#EDE7DC'],
        });
      } catch {
        // Confetti fallback
      }
    } catch (err: any) {
      setError(err.message || 'Reservation submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5EF] flex items-center justify-center p-6 text-sm text-[#6B6B6B]">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-[#C9A45C] border-t-transparent rounded-full animate-spin"></div>
          <span>Preparing Phoenix reservation environment...</span>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#F8F5EF] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="font-display text-xl font-semibold text-[#0B1F33]">Suite Not Found</h2>
        <p className="text-xs text-[#6B6B6B]">The requested accommodation does not exist or has been modified.</p>
        <button
          onClick={() => navigate('/rooms')}
          className="px-5 py-2.5 rounded-xl bg-[#C9A45C] text-[#0B1F33] text-xs font-bold hover:bg-[#B58E47] transition-colors cursor-pointer"
        >
          Return to Rooms & Suites
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#252525] pb-20">
      
      {/* Header & Step Tracker (Deep Navy #0B1F33 & Champagne Gold #C9A45C) */}
      <div className="bg-[#0B1F33] text-[#F8F5EF] py-10 px-4 sm:px-6 lg:px-8 border-b border-[#C9A45C]/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[#C9A45C] font-semibold text-xs tracking-widest">
                Phoenix Direct Reservation
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold mt-0.5 text-[#F8F5EF]">
                Reserve Your Stay at Phoenix
              </h1>
            </div>
            <div className="hidden sm:block text-right tabular-nums">
              <span className="text-xs font-mono text-[#EDE7DC]/70">Step {currentStep} of 5</span>
              <div className="text-xs font-semibold text-[#C9A45C]">
                {currentStep === 1 && 'Dates & Suite Selection'}
                {currentStep === 2 && 'Guest Contact Details'}
                {currentStep === 3 && 'Hotel Add-Ons & Voucher'}
                {currentStep === 4 && 'Payment Simulation'}
                {currentStep === 5 && 'Confirmed Receipt Voucher'}
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { num: 1, label: 'Dates' },
              { num: 2, label: 'Guest' },
              { num: 3, label: 'Add-Ons' },
              { num: 4, label: 'Payment' },
              { num: 5, label: 'Confirmed' },
            ].map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="space-y-1">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isDone
                        ? 'bg-[#3F7652]'
                        : isCurrent
                        ? 'bg-[#C9A45C]'
                        : 'bg-[#132B45]'
                    }`}
                  />
                  <div
                    className={`text-[10px] font-semibold text-center truncate ${
                      isCurrent ? 'text-[#C9A45C]' : isDone ? 'text-[#EDE7DC]' : 'text-[#EDE7DC]/50'
                    }`}
                  >
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-[#9B4545]/10 border border-[#9B4545]/30 text-[#9B4545] text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: DATES & ROOM */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C9A45C]/30 shadow-xs space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-[#EDE7DC]">
              <div>
                <span className="text-xs font-semibold text-[#C9A45C]">01. Residence & Schedule</span>
                <h2 className="font-display text-xl font-semibold text-[#0B1F33] mt-0.5">
                  {isCartCheckout ? 'Review Cart Rooms, Dates & Party Size' : 'Select Dates & Party Size'}
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#0B1F33] tabular-nums">
                {isCartCheckout
                  ? `${totalRoomsInCart} ${totalRoomsInCart === 1 ? 'Room' : 'Rooms'} in Cart`
                  : `${singleRoomQuantity > 1 ? `${singleRoomQuantity}× ` : ''}${room.roomType.name}`}
              </span>
            </div>

            {/* Multi-Room Cart Banner OR Single Room Banner with Quantity Stepper */}
            {isCartCheckout ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0B1F33] flex items-center space-x-1.5">
                    <ShoppingBag className="w-4 h-4 text-[#C9A45C]" />
                    <span>Selected Rooms in Cart ({totalRoomsInCart} {totalRoomsInCart === 1 ? 'Room' : 'Separate Rooms'} · Up to {totalGuestCapacity} Guests)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="text-xs font-semibold text-[#0B1F33] hover:text-[#C9A45C] underline cursor-pointer"
                  >
                    Edit Cart
                  </button>
                </div>

                {cartItems.map((item) => (
                  <div
                    key={item.roomTypeId}
                    className="p-4 rounded-2xl bg-[#F8F5EF] border border-[#C9A45C]/30 flex flex-col sm:flex-row gap-4 items-center"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.roomTypeName}
                      className="w-full sm:w-28 h-20 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-display font-semibold text-sm text-[#0B1F33]">{item.roomTypeName}</span>
                        <span className="text-xs font-medium text-[#C9A45C]">
                          · {item.code}
                        </span>
                      </div>
                      <div className="text-xs text-[#6B6B6B] font-medium">
                        {item.bedType} · Max {item.maxOccupancy} Guests/Room ({item.maxOccupancy * item.quantity} Guests Total)
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-white border border-[#C9A45C]/35 rounded-xl px-2.5 py-1.5 tabular-nums">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.roomTypeId, item.quantity - 1)}
                        className="p-1 rounded-lg hover:bg-[#EDE7DC] text-[#252525] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-semibold text-[#0B1F33] px-1.5">
                        {item.quantity} {item.quantity === 1 ? 'Room' : 'Rooms'}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.maxAvailable}
                        onClick={() => updateCartQuantity(item.roomTypeId, item.quantity + 1)}
                        className="p-1 rounded-lg hover:bg-[#EDE7DC] text-[#252525] disabled:opacity-30 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right sm:border-l sm:border-[#EDE7DC] sm:pl-4 tabular-nums">
                      <div className="text-base font-bold text-[#0B1F33]">
                        ₹{(item.basePrice * item.quantity).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-[#6B6B6B]">per night + GST</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#F8F5EF] border border-[#EDE7DC] flex flex-col sm:flex-row gap-4 items-center">
                <img
                  src={room.imageUrl || room.roomType.imageUrl}
                  alt={room.roomType.name}
                  className="w-full sm:w-36 h-24 object-cover rounded-xl shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-display font-semibold text-sm text-[#0B1F33]">{room.roomType.name}</span>
                    <span className="text-[11px] text-[#6B6B6B]">· Floor {room.floorNumber}</span>
                  </div>
                  <p className="text-xs text-[#6B6B6B] line-clamp-1">{room.roomType.description}</p>
                  <div className="text-xs text-[#6B6B6B] font-medium pt-1">
                    {room.roomType.bedType} · Max {room.roomType.maxOccupancy} Guests/Room · {room.roomType.sizeSqft} sq.ft
                  </div>

                  {/* Multi-Room Quantity Selector for Direct Booking */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-[#252525]">Number of Rooms:</span>
                    <div className="inline-flex items-center space-x-2 bg-white border border-[#C9A45C]/35 rounded-xl px-2.5 py-1 tabular-nums">
                      <button
                        type="button"
                        onClick={() => {
                          const nextQty = Math.max(1, singleRoomQuantity - 1);
                          setSingleRoomQuantity(nextQty);
                          const maxAllowed = nextQty * room.roomType.maxOccupancy;
                          if (guests > maxAllowed) setGuests(maxAllowed);
                        }}
                        className="p-1 rounded-lg hover:bg-[#EDE7DC] text-[#252525] cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold text-[#0B1F33] px-1">
                        {singleRoomQuantity} {singleRoomQuantity === 1 ? 'Room' : 'Separate Rooms'} (Up to {singleRoomQuantity * room.roomType.maxOccupancy} Guests)
                      </span>
                      <button
                        type="button"
                        disabled={singleRoomQuantity >= Math.max(1, room.roomType.availableRooms ?? 3)}
                        onClick={() => setSingleRoomQuantity(singleRoomQuantity + 1)}
                        className="p-1 rounded-lg hover:bg-[#EDE7DC] text-[#252525] disabled:opacity-30 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-right sm:border-l sm:border-[#EDE7DC] sm:pl-4 tabular-nums">
                  <div className="font-display text-lg font-semibold text-[#0B1F33]">
                    ₹{(room.roomType.basePrice * singleRoomQuantity).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-[#6B6B6B]">
                    {singleRoomQuantity > 1 ? `${singleRoomQuantity} rooms / night + 12% GST` : 'per night + 12% GST'}
                  </div>
                </div>
              </div>
            )}

            {/* Dates Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Check-In Date</label>
                <input
                  type="date"
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:bg-white focus:ring-2 focus:ring-[#C9A45C] focus:outline-hidden text-[#252525]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Check-Out Date</label>
                <input
                  type="date"
                  required
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:bg-white focus:ring-2 focus:ring-[#C9A45C] focus:outline-hidden text-[#252525]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">
                  Total Guests ({effectiveRoomsCount} {effectiveRoomsCount === 1 ? 'Room' : 'Rooms'})
                </label>
                <select
                  value={Math.min(guests, effectiveMaxGuests)}
                  onChange={(e) => setGuests(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:bg-white focus:ring-2 focus:ring-[#C9A45C] focus:outline-hidden text-[#252525]"
                >
                  {[...Array(Math.max(1, effectiveMaxGuests))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary preview */}
            <div className="p-4 rounded-xl bg-[#EDE7DC] border border-[#C9A45C]/30 text-xs text-[#252525] flex items-center justify-between tabular-nums">
              <div>
                Stay Duration: <strong className="text-[#0B1F33]">{nights} {nights === 1 ? 'Night' : 'Nights'}</strong> · <strong className="text-[#0B1F33]">{effectiveRoomsCount} {effectiveRoomsCount === 1 ? 'Room' : 'Separate Rooms'}</strong>
              </div>
              <div className="text-right">
                Room Base Total: <strong className="text-[#0B1F33]">₹{roomSubtotal.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => navigate('/rooms')}
                className="px-5 py-2.5 rounded-xl border border-[#0B1F33]/20 text-[#252525] hover:bg-[#F8F5EF] text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Suites</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <span>Continue to Guest Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GUEST INFORMATION */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C9A45C]/30 shadow-xs space-y-6">
            <div className="pb-4 border-b border-[#EDE7DC]">
              <span className="text-xs font-semibold text-[#C9A45C]">02. Guest Registration</span>
              <h2 className="font-display text-xl font-semibold text-[#0B1F33] mt-0.5">Guest Information & Preferences</h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Please provide primary guest contact details for reservation registration.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Aditya Mehta"
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:bg-white focus:ring-2 focus:ring-[#C9A45C] focus:outline-hidden text-[#252525]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:bg-white focus:ring-2 focus:ring-[#C9A45C] focus:outline-hidden text-[#252525]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:bg-white focus:ring-2 focus:ring-[#C9A45C] focus:outline-hidden text-[#252525]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252525] mb-1">Guests & Rooms</label>
                <input
                  type="text"
                  disabled
                  value={`${guests} Guests · ${effectiveRoomsCount} ${effectiveRoomsCount === 1 ? 'Room' : 'Rooms'}`}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-[#EDE7DC] border border-[#C9A45C]/25 text-[#6B6B6B] cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252525] mb-1">
                Special Requests or Dietary Requirements (Optional)
              </label>
              <textarea
                rows={3}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Let us know if you need early check-in, private airport transfer flight details, or specific floor preferences."
                className="w-full p-3 text-xs rounded-xl bg-[#F8F5EF] border border-[#C9A45C]/30 focus:bg-white focus:ring-2 focus:ring-[#C9A45C] focus:outline-hidden text-[#252525]"
              />
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl border border-[#0B1F33]/20 text-[#252525] hover:bg-[#F8F5EF] text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <span>Continue to Add-On Services</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: HOTEL ADD-ON SERVICES & PROMO CODE */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C9A45C]/30 shadow-xs space-y-6">
            <div className="pb-4 border-b border-[#EDE7DC]">
              <span className="text-xs font-semibold text-[#C9A45C]">03. Bespoke Enhancements</span>
              <h2 className="font-display text-xl font-semibold text-[#0B1F33] mt-0.5">Curate Your Experience (Add-On Services)</h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Select optional hotel privileges to enhance your stay. Charges update automatically.</p>
            </div>

            <div className="space-y-3">
              {allServices.map((service) => {
                const qty = selectedServices[service.serviceId] || 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={service.serviceId}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#C9A45C] bg-[#F8F5EF] shadow-2xs'
                        : 'border-[#EDE7DC] bg-[#F8F5EF]/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#0B1F33] text-[#C9A45C]' : 'bg-[#EDE7DC] text-[#6B6B6B]'
                        }`}
                      >
                        <Coffee className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#0B1F33]">{service.name}</div>
                        <div className="text-xs text-[#6B6B6B] leading-snug max-w-md">{service.description}</div>
                        <div className="text-[11px] font-semibold text-[#0B1F33] mt-1 tabular-nums">
                          ₹{service.price.toLocaleString('en-IN')}{' '}
                          <span className="text-[#6B6B6B] font-normal capitalize">({service.chargeType.replace('_', ' ')})</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center space-x-2 tabular-nums">
                      <button
                        type="button"
                        onClick={() => handleServiceChange(service.serviceId, -1)}
                        disabled={qty === 0}
                        className="w-7 h-7 rounded-lg border border-[#C9A45C]/40 flex items-center justify-center text-[#252525] hover:bg-[#EDE7DC] disabled:opacity-30 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-[#0B1F33]">{qty}</span>
                      <button
                        type="button"
                        onClick={() => handleServiceChange(service.serviceId, 1)}
                        className="w-7 h-7 rounded-lg bg-[#C9A45C] text-[#0B1F33] flex items-center justify-center hover:bg-[#B58E47] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo Code Input Box */}
            <div className="p-4 rounded-2xl bg-[#F8F5EF] border border-[#C9A45C]/30 space-y-2">
              <label className="block text-xs font-semibold text-[#0B1F33] flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-[#C9A45C]" />
                <span>Promotional Voucher / Privilege Code</span>
              </label>
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  placeholder="Enter code (e.g. WELCOME10, PHOENIX20)"
                  className="flex-1 px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl bg-white border border-[#C9A45C]/35 text-[#252525] focus:outline-hidden focus:ring-2 focus:ring-[#C9A45C]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B1F33] hover:bg-[#132B45] text-[#F8F5EF] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Apply Code
                </button>
              </form>
              {promoMessage && (
                <p className={`text-[11px] font-medium ${appliedPromo ? 'text-[#3F7652]' : 'text-[#6B6B6B]'}`}>
                  {promoMessage}
                </p>
              )}
            </div>

            {/* Live Breakdown Box */}
            <div className="p-5 rounded-2xl bg-[#0B1F33] text-[#F8F5EF] space-y-2 text-xs tabular-nums">
              <div className="flex justify-between text-[#EDE7DC]/80">
                <span>Room Charges ({nights} nights × ₹{roomPricePerNight.toLocaleString('en-IN')})</span>
                <span>₹{roomSubtotal.toLocaleString('en-IN')}</span>
              </div>
              {appliedPromo && discountAmount > 0 && (
                <div className="flex justify-between text-[#C9A45C] font-semibold">
                  <span>Privilege Discount ({appliedPromo.code} - {appliedPromo.discountPct}%)</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-[#EDE7DC]/80">
                <span>Selected Add-On Services</span>
                <span>₹{servicesSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#EDE7DC]/80">
                <span>Goods & Services Tax (GST 12%)</span>
                <span>₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-[#C9A45C]/25 flex justify-between text-sm font-bold text-[#C9A45C]">
                <span>Grand Total Amount</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl border border-[#0B1F33]/20 text-[#252525] hover:bg-[#F8F5EF] text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <span>Continue to Payment Simulation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: PAYMENT SIMULATION */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#C9A45C]/30 shadow-xs space-y-6">
            <div className="pb-4 border-b border-[#EDE7DC]">
              <span className="text-xs font-semibold text-[#C9A45C]">04. Settlement</span>
              <h2 className="font-display text-xl font-semibold text-[#0B1F33] mt-0.5">Payment Simulation</h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Choose between 100% online settlement or payment at the Phoenix reception desk upon arrival.
              </p>
            </div>

            {/* 2-Way Payment Strategy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <button
                type="button"
                onClick={() => {
                  setPaymentOption('full_card');
                  setPaymentMethod('Demo Card Payment');
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  paymentOption === 'full_card'
                    ? 'border-[#C9A45C] bg-[#F8F5EF] shadow-xs ring-1 ring-[#C9A45C]'
                    : 'border-[#EDE7DC] bg-[#F8F5EF]/40 hover:bg-white'
                }`}
              >
                <div>
                  <CreditCard className="w-5 h-5 text-[#C9A45C] mb-2" />
                  <div className="font-semibold text-xs text-[#0B1F33]">100% Full Payment</div>
                  <div className="text-[11px] text-[#6B6B6B] mt-1">Instant simulated card transaction with immediate confirmation.</div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#EDE7DC] font-bold text-xs text-[#0B1F33] tabular-nums">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentOption('pay_at_hotel');
                  setPaymentMethod('Cash at Hotel');
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  paymentOption === 'pay_at_hotel'
                    ? 'border-[#C9A45C] bg-[#F8F5EF] shadow-xs ring-1 ring-[#C9A45C]'
                    : 'border-[#EDE7DC] bg-[#F8F5EF]/40 hover:bg-white'
                }`}
              >
                <div>
                  <Banknote className="w-5 h-5 text-[#C9A45C] mb-2" />
                  <div className="font-semibold text-xs text-[#0B1F33]">Pay at Hotel Front-Desk</div>
                  <div className="text-[11px] text-[#6B6B6B] mt-1">Settle 100% via Cash, UPI, or Card at Phoenix reception.</div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#EDE7DC] font-bold text-xs text-[#C9A45C]">
                  Pay at Check-In
                </div>
              </button>

            </div>

            {/* Card Simulator Fields (If Card Payment Mode selected) */}
            {paymentOption !== 'pay_at_hotel' && (
              <div className="p-5 rounded-2xl bg-[#0B1F33] text-[#F8F5EF] space-y-4">
                <div className="flex items-center justify-between text-xs text-[#EDE7DC]/70">
                  <span>Interactive Card Simulator</span>
                  <span className="font-mono text-[#C9A45C] font-semibold">PHOENIX SECURE</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#EDE7DC]/80 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-[#132B45] border border-[#C9A45C]/30 text-[#F8F5EF] focus:outline-hidden focus:ring-1 focus:ring-[#C9A45C]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#EDE7DC]/80 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#132B45] border border-[#C9A45C]/30 text-[#F8F5EF] focus:outline-hidden focus:ring-1 focus:ring-[#C9A45C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#EDE7DC]/80 mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-[#132B45] border border-[#C9A45C]/30 text-[#F8F5EF] focus:outline-hidden focus:ring-1 focus:ring-[#C9A45C] text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Final Amount Due Notice */}
            <div className="p-4 rounded-xl bg-[#EDE7DC] border border-[#C9A45C]/35 flex items-center justify-between tabular-nums">
              <div>
                <span className="text-xs text-[#6B6B6B] font-medium">Total Reservation Value</span>
                <div className="font-display text-xl font-semibold text-[#0B1F33]">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right text-xs text-[#6B6B6B]">
                <div>Includes 12% GST</div>
                <div className="font-semibold text-[#3F7652]">Instant confirmation voucher</div>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl border border-[#0B1F33]/20 text-[#252525] hover:bg-[#F8F5EF] text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleCompleteReservation}
                className="px-8 py-3 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] text-xs font-bold flex items-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Processing Transaction...' : 'Authorize & Confirm Booking'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: CONFIRMATION RECEIPT */}
        {currentStep === 5 && confirmedBooking && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#C9A45C]/35 shadow-lg space-y-6">
            
            {/* Top Success Banner */}
            <div className="text-center space-y-2 pb-6 border-b border-[#EDE7DC]">
              <div className="w-16 h-16 rounded-full bg-[#3F7652]/15 text-[#3F7652] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B1F33]">
                Reservation Confirmed
              </h2>
              <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
                Thank you, <strong className="text-[#252525]">{guestName}</strong>. Your reservation has been registered at Phoenix Hotel & Suites.
              </p>
              <div className="pt-2">
                <span className="font-mono text-sm font-bold px-3.5 py-1 rounded-lg bg-[#F8F5EF] text-[#0B1F33] border border-[#C9A45C]/40">
                  Booking Reference: {confirmedBooking.bookingReference}
                </span>
              </div>
            </div>

            {/* Printable Receipt Voucher Box */}
            <div id="booking-receipt" className="p-6 rounded-2xl bg-[#F8F5EF] border border-[#C9A45C]/30 space-y-5 text-xs text-[#252525] font-sans">
              
              <div className="flex justify-between items-start pb-4 border-b border-[#EDE7DC]">
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#0B1F33]">Phoenix Hotel & Suites</h3>
                  <p className="text-[#6B6B6B]">Plot 18, Golf Course Road, Sector 42, Gurugram</p>
                  <p className="text-[#6B6B6B]">Phone: +91 (124) 490-8800 · GSTIN: 07AAACS1429B1Z2</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#0B1F33]">Tax Invoice / Receipt Voucher</div>
                  <div className="text-[#6B6B6B]">Date: {new Date().toLocaleDateString('en-IN')}</div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-[#3F7652]/15 text-[#3F7652]">
                    Status: {confirmedBooking.bookingStatus}
                  </span>
                </div>
              </div>

              {/* Guest & Stay Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] font-semibold text-[#6B6B6B]">Guest Name</span>
                  <div className="font-semibold text-[#0B1F33]">{guestName}</div>
                  <div className="text-[#6B6B6B] text-[11px]">{guestPhone}</div>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-[#6B6B6B]">Suite Details</span>
                  <div className="font-semibold text-[#0B1F33]">Room #{confirmedBooking.roomNumber}</div>
                  <div className="text-[#6B6B6B] text-[11px]">{confirmedBooking.roomTypeName}</div>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-[#6B6B6B]">Stay Duration</span>
                  <div className="font-semibold text-[#0B1F33]">{checkIn} to {checkOut}</div>
                  <div className="text-[#6B6B6B] text-[11px] tabular-nums">{confirmedBooking.nights} Nights · {guests} Guests</div>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-[#6B6B6B]">Payment Mode</span>
                  <div className="font-semibold text-[#0B1F33]">{paymentMethod}</div>
                  <div className="text-[#6B6B6B] text-[11px]">Status: {confirmedBooking.paymentStatus}</div>
                </div>
              </div>

              {/* Front Desk QR Verification */}
              <div className="p-3.5 rounded-xl bg-white border border-[#EDE7DC] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#F8F5EF] rounded-lg text-[#0B1F33] border border-[#C9A45C]/30">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-[#0B1F33]">Fast Front-Desk Check-In Pass</div>
                    <div className="text-[11px] text-[#6B6B6B]">Present at Phoenix reception upon arrival for express key card activation.</div>
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-[#6B6B6B] hidden sm:block">
                  PASS-ID: {confirmedBooking.bookingReference}
                </div>
              </div>

              {/* Financial Charges Table */}
              <div className="pt-2 border-t border-[#EDE7DC]">
                <table className="w-full text-left tabular-nums">
                  <thead>
                    <tr className="border-b border-[#EDE7DC] text-[10px] text-[#6B6B6B]">
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE7DC] font-mono text-[11px]">
                    <tr>
                      <td className="py-2">
                        {confirmedBooking.roomTypeName} (Room #{confirmedBooking.roomNumber}) × {confirmedBooking.nights} Nights
                      </td>
                      <td className="py-2 text-right">₹{confirmedBooking.roomCharges.toLocaleString('en-IN')}</td>
                    </tr>
                    {appliedPromo && discountAmount > 0 && (
                      <tr className="text-[#3F7652]">
                        <td className="py-2">Privilege Discount ({appliedPromo.code})</td>
                        <td className="py-2 text-right">-₹{discountAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    {confirmedBooking.servicesCharges > 0 && (
                      <tr>
                        <td className="py-2">Selected Add-On Services</td>
                        <td className="py-2 text-right">₹{confirmedBooking.servicesCharges.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2">Hotel GST (12%)</td>
                      <td className="py-2 text-right">₹{confirmedBooking.taxAmount.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="font-bold text-sm text-[#0B1F33] border-t border-[#C9A45C]/40">
                      <td className="py-2.5">Final Grand Total</td>
                      <td className="py-2.5 text-right text-[#0B1F33]">
                        ₹{confirmedBooking.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Terms and Hotel Policies */}
              <div className="pt-2 border-t border-[#EDE7DC] text-[10px] text-[#6B6B6B] space-y-1">
                <p>· Standard Check-In time is 2:00 PM; Check-Out time is 11:00 AM.</p>
                <p>· Government-issued photo identification (Aadhaar, Passport, or Driving License) is required for all adult guests.</p>
                <p>· Complimentary cancellation is supported up to 24 hours prior to scheduled arrival via the Guest Portal.</p>
              </div>

            </div>

            {/* Actions: Download & Dashboard Navigation */}
            <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const payload: ReceiptPayload = {
                      bookingReference: confirmedBooking.bookingReference,
                      bookingStatus: confirmedBooking.bookingStatus,
                      paymentStatus: confirmedBooking.paymentStatus,
                      paymentMethod,
                      transactionReference: confirmedBooking.transactionReference,
                      guestName,
                      guestEmail,
                      guestPhone,
                      roomNumber: confirmedBooking.roomNumber,
                      roomTypeName: confirmedBooking.roomTypeName,
                      checkInDate: checkIn,
                      checkOutDate: checkOut,
                      nights: confirmedBooking.nights,
                      guests,
                      roomCharges: confirmedBooking.roomCharges,
                      servicesCharges: confirmedBooking.servicesCharges,
                      discountAmount: appliedPromo ? discountAmount : 0,
                      promoCode: appliedPromo?.code,
                      taxAmount: confirmedBooking.taxAmount,
                      totalAmount: confirmedBooking.totalAmount,
                    };
                    downloadReceiptFile(payload);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#C9A45C] hover:bg-[#B58E47] text-[#0B1F33] text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Receipt</span>
                </button>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <Link
                  to="/customer/bookings"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0B1F33] hover:bg-[#132B45] text-[#F8F5EF] text-xs font-semibold text-center shadow-xs"
                >
                  View in Guest Portal
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
