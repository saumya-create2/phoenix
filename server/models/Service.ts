/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ChargeType = 'per_booking' | 'per_day' | 'per_person';

export class HotelService {
  constructor(
    public serviceId: number,
    public name: string,
    public description: string,
    public price: number,
    public chargeType: ChargeType = 'per_booking',
    public icon: string = 'Coffee',
    public isActive: boolean = true
  ) {}

  /**
   * Encapsulated business rule: calculates the total service charge
   * depending on the chargeType, duration of stay, and guest count.
   */
  public computeCharge(nights: number, guests: number, quantity: number = 1): number {
    const validNights = Math.max(1, nights);
    const validGuests = Math.max(1, guests);
    const validQty = Math.max(1, quantity);

    switch (this.chargeType) {
      case 'per_day':
        return this.price * validNights * validQty;
      case 'per_person':
        return this.price * validGuests * validQty;
      case 'per_booking':
      default:
        return this.price * validQty;
    }
  }
}
