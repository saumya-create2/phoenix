/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Payment } from './Payment.js';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded' | 'Failed';

export interface BookingRoomItem {
  roomId: number;
  roomNumber?: string;
  roomTypeName?: string;
  pricePerNight: number;
  nights: number;
  subtotal: number;
}

export interface BookingServiceItem {
  serviceId: number;
  serviceName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * OOP Concept: Encapsulation in Domain Aggregate Entity (Booking)
 * Private fields with controlled state transition methods (`confirm()`,
 * `checkIn()`, `checkOut()`, `cancel()`) and encapsulated tax/total
 * calculation (`recalculateTotals()`) prevent invalid booking states.
 */
export class Booking {
  private static readonly TAX_RATE = 0.12; // 12% GST

  private _bookingId: number;
  private _bookingReference: string;
  private _customerId: number;
  private _checkInDate: string;
  private _checkOutDate: string;
  private _totalGuests: number;
  private _roomCharges: number;
  private _servicesCharges: number;
  private _taxAmount: number;
  private _totalAmount: number;
  private _bookingStatus: BookingStatus;
  private _paymentStatus: PaymentStatus;
  private _specialRequests: string;
  private _rooms: BookingRoomItem[];
  private _services: BookingServiceItem[];
  private _payment?: Payment;
  private _customerName?: string;
  private _customerEmail?: string;
  private _customerPhone?: string;
  private _createdAt?: string;

  constructor(
    bookingId: number,
    bookingReference: string,
    customerId: number,
    checkInDate: string,
    checkOutDate: string,
    totalGuests: number,
    roomCharges: number = 0,
    servicesCharges: number = 0,
    taxAmount: number = 0,
    totalAmount: number = 0,
    bookingStatus: BookingStatus = 'Pending',
    paymentStatus: PaymentStatus = 'Pending',
    specialRequests: string = '',
    rooms: BookingRoomItem[] = [],
    services: BookingServiceItem[] = [],
    payment?: Payment,
    customerName?: string,
    customerEmail?: string,
    customerPhone?: string,
    createdAt?: string
  ) {
    this._bookingId = bookingId;
    this._bookingReference = bookingReference;
    this._customerId = customerId;
    this._checkInDate = checkInDate;
    this._checkOutDate = checkOutDate;
    this._totalGuests = Math.max(1, totalGuests);
    this._roomCharges = roomCharges;
    this._servicesCharges = servicesCharges;
    this._taxAmount = taxAmount;
    this._totalAmount = totalAmount;
    this._bookingStatus = bookingStatus;
    this._paymentStatus = paymentStatus;
    this._specialRequests = specialRequests;
    this._rooms = rooms;
    this._services = services;
    this._payment = payment;
    this._customerName = customerName;
    this._customerEmail = customerEmail;
    this._customerPhone = customerPhone;
    this._createdAt = createdAt;
  }

  // Controlled Getters & Setters (Encapsulation)
  public get bookingId(): number {
    return this._bookingId;
  }
  public get bookingReference(): string {
    return this._bookingReference;
  }
  public get customerId(): number {
    return this._customerId;
  }
  public get checkInDate(): string {
    return this._checkInDate;
  }
  public get checkOutDate(): string {
    return this._checkOutDate;
  }
  public get totalGuests(): number {
    return this._totalGuests;
  }
  public get roomCharges(): number {
    return this._roomCharges;
  }
  public get servicesCharges(): number {
    return this._servicesCharges;
  }
  public get taxAmount(): number {
    return this._taxAmount;
  }
  public get totalAmount(): number {
    return this._totalAmount;
  }
  public get bookingStatus(): BookingStatus {
    return this._bookingStatus;
  }
  public get paymentStatus(): PaymentStatus {
    return this._paymentStatus;
  }
  public get specialRequests(): string {
    return this._specialRequests;
  }
  public get rooms(): BookingRoomItem[] {
    return [...this._rooms];
  }
  public get services(): BookingServiceItem[] {
    return [...this._services];
  }
  public get payment(): Payment | undefined {
    return this._payment;
  }
  public get customerName(): string | undefined {
    return this._customerName;
  }
  public get customerEmail(): string | undefined {
    return this._customerEmail;
  }
  public get customerPhone(): string | undefined {
    return this._customerPhone;
  }
  public get createdAt(): string | undefined {
    return this._createdAt;
  }

  public calculateNights(): number {
    const start = new Date(this._checkInDate);
    const end = new Date(this._checkOutDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }

  public recalculateTotals(): void {
    this._roomCharges = this._rooms.reduce((acc, r) => acc + r.subtotal, 0);
    this._servicesCharges = this._services.reduce((acc, s) => acc + s.subtotal, 0);
    const preTaxSubtotal = this._roomCharges + this._servicesCharges;
    this._taxAmount = Math.round(preTaxSubtotal * Booking.TAX_RATE * 100) / 100;
    this._totalAmount = Math.round((preTaxSubtotal + this._taxAmount) * 100) / 100;
  }

  public canBeCancelled(): boolean {
    if (this._bookingStatus === 'Cancelled' || this._bookingStatus === 'Checked-Out') {
      return false;
    }
    const checkIn = new Date(this._checkInDate);
    const now = new Date();
    return now <= checkIn || this._bookingStatus === 'Confirmed' || this._bookingStatus === 'Pending';
  }

  public cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error('This booking cannot be cancelled in its current state.');
    }
    this._bookingStatus = 'Cancelled';
    if (this._paymentStatus === 'Paid') {
      this._paymentStatus = 'Refunded';
    }
  }

  public confirm(): void {
    this._bookingStatus = 'Confirmed';
  }

  public checkIn(): void {
    this._bookingStatus = 'Checked-In';
  }

  public checkOut(): void {
    this._bookingStatus = 'Checked-Out';
  }
}
