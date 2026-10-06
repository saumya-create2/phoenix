/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * OOP Concept: Encapsulation in Domain Entities (Amenity, RoomType, Room)
 * Private fields with controlled getters/setters ensure pricing, occupancy,
 * and room status transitions obey domain invariants.
 */
export class Amenity {
  private _amenityId: number;
  private _name: string;
  private _icon: string;
  private _category: string;

  constructor(
    amenityId: number,
    name: string,
    icon: string = 'Sparkles',
    category: string = 'General'
  ) {
    this._amenityId = amenityId;
    this._name = name;
    this._icon = icon;
    this._category = category;
  }

  public get amenityId(): number {
    return this._amenityId;
  }
  public get name(): string {
    return this._name;
  }
  public get icon(): string {
    return this._icon;
  }
  public get category(): string {
    return this._category;
  }
}

export class RoomType {
  private _roomTypeId: number;
  private _name: string;
  private _code: string;
  private _description: string;
  private _basePrice: number;
  private _maxOccupancy: number;
  private _bedType: string;
  private _sizeSqft: number;
  private _imageUrl: string;
  private _amenities: Amenity[];
  private _isActive: boolean;

  constructor(
    roomTypeId: number,
    name: string,
    code: string,
    description: string,
    basePrice: number,
    maxOccupancy: number,
    bedType: string,
    sizeSqft: number = 350,
    imageUrl: string = '',
    amenities: Amenity[] = [],
    isActive: boolean = true
  ) {
    this._roomTypeId = roomTypeId;
    this._name = name;
    this._code = code;
    this._description = description;
    this._basePrice = Math.max(0, basePrice);
    this._maxOccupancy = Math.max(1, maxOccupancy);
    this._bedType = bedType;
    this._sizeSqft = sizeSqft;
    this._imageUrl = imageUrl;
    this._amenities = amenities;
    this._isActive = isActive;
  }

  public get roomTypeId(): number {
    return this._roomTypeId;
  }
  public get name(): string {
    return this._name;
  }
  public get code(): string {
    return this._code;
  }
  public get description(): string {
    return this._description;
  }
  public get basePrice(): number {
    return this._basePrice;
  }
  public set basePrice(price: number) {
    if (price < 0) throw new Error('Base price cannot be negative.');
    this._basePrice = price;
  }
  public get maxOccupancy(): number {
    return this._maxOccupancy;
  }
  public get bedType(): string {
    return this._bedType;
  }
  public get sizeSqft(): number {
    return this._sizeSqft;
  }
  public get imageUrl(): string {
    return this._imageUrl;
  }
  public get amenities(): Amenity[] {
    return [...this._amenities];
  }
  public get isActive(): boolean {
    return this._isActive;
  }

  public calculateBaseCharge(nights: number): number {
    return this._basePrice * Math.max(1, nights);
  }
}

export type RoomStatus = 'Available' | 'Reserved' | 'Occupied' | 'Maintenance';

export class Room {
  private _roomId: number;
  private _roomNumber: string;
  private _roomTypeId: number;
  private _floorNumber: number;
  private _status: RoomStatus;
  private _imageUrl: string;
  private _notes: string;
  private _roomType?: RoomType;

  constructor(
    roomId: number,
    roomNumber: string,
    roomTypeId: number,
    floorNumber: number,
    status: RoomStatus = 'Available',
    imageUrl: string = '',
    notes: string = '',
    roomType?: RoomType
  ) {
    this._roomId = roomId;
    this._roomNumber = roomNumber;
    this._roomTypeId = roomTypeId;
    this._floorNumber = floorNumber;
    this._status = status;
    this._imageUrl = imageUrl;
    this._notes = notes;
    this._roomType = roomType;
  }

  public get roomId(): number {
    return this._roomId;
  }
  public get roomNumber(): string {
    return this._roomNumber;
  }
  public get roomTypeId(): number {
    return this._roomTypeId;
  }
  public get floorNumber(): number {
    return this._floorNumber;
  }
  public get status(): RoomStatus {
    return this._status;
  }
  public set status(newStatus: RoomStatus) {
    const allowed: RoomStatus[] = ['Available', 'Reserved', 'Occupied', 'Maintenance'];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid room status: ${newStatus}`);
    }
    this._status = newStatus;
  }
  public get imageUrl(): string {
    return this._imageUrl;
  }
  public get notes(): string {
    return this._notes;
  }
  public get roomType(): RoomType | undefined {
    return this._roomType;
  }

  public isAvailableForDates(): boolean {
    return this._status === 'Available';
  }

  public markOccupied(): void {
    this._status = 'Occupied';
  }

  public markAvailable(): void {
    this._status = 'Available';
  }

  public markMaintenance(): void {
    this._status = 'Maintenance';
  }
}
