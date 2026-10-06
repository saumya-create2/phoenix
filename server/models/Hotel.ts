/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * OOP Concept: Encapsulation & Singleton Pattern
 * Encapsulates the Phoenix Hotel configuration and domain policies using
 * private fields and read-only getters so hotel configuration cannot be
 * arbitrarily mutated at runtime.
 */
export class Hotel {
  private static instance: Hotel | null = null;

  private readonly _name: string = 'Phoenix Hotel & Suites';
  private readonly _tagline: string = 'Timeless Elegance. Tranquil Luxury. Bespoke Hospitality.';
  private readonly _starRating: number = 5;
  private readonly _currency: string = 'INR';
  private readonly _currencySymbol: string = '₹';
  private readonly _checkInTime: string = '14:00 (2:00 PM)';
  private readonly _checkOutTime: string = '11:00 (11:00 AM)';
  private readonly _address: string = 'Plot 18, Golf Course Road, Sector 42, Gurugram, Haryana 122002, India';
  private readonly _phone: string = '+91 (124) 490-8800';
  private readonly _email: string = 'reservations@phoenixhotel.com';
  private readonly _taxRatePercent: number = 12.0;

  private constructor() {}

  public static getInstance(): Hotel {
    if (!Hotel.instance) {
      Hotel.instance = new Hotel();
    }
    return Hotel.instance;
  }

  public get name(): string {
    return this._name;
  }
  public get tagline(): string {
    return this._tagline;
  }
  public get starRating(): number {
    return this._starRating;
  }
  public get currency(): string {
    return this._currency;
  }
  public get currencySymbol(): string {
    return this._currencySymbol;
  }
  public get checkInTime(): string {
    return this._checkInTime;
  }
  public get checkOutTime(): string {
    return this._checkOutTime;
  }
  public get address(): string {
    return this._address;
  }
  public get phone(): string {
    return this._phone;
  }
  public get email(): string {
    return this._email;
  }
  public get taxRatePercent(): number {
    return this._taxRatePercent;
  }

  public getHotelSummary() {
    return {
      name: this._name,
      tagline: this._tagline,
      starRating: this._starRating,
      currency: this._currency,
      currencySymbol: this._currencySymbol,
      checkInTime: this._checkInTime,
      checkOutTime: this._checkOutTime,
      address: this._address,
      phone: this._phone,
      email: this._email,
      taxRatePercent: this._taxRatePercent,
    };
  }
}

export const stayEaseHotel = Hotel.getInstance();
export const phoenixHotel = Hotel.getInstance();
