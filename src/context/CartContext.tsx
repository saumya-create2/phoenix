/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Room } from '../types/index.js';

export interface CartRoomItem {
  roomTypeId: number;
  sampleRoomId: number;
  roomTypeName: string;
  code: string;
  basePrice: number;
  maxOccupancy: number;
  bedType: string;
  sizeSqft: number;
  imageUrl: string;
  quantity: number;
  maxAvailable: number;
}

interface CartContextType {
  cartItems: CartRoomItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (room: Room, quantityToAdd?: number) => void;
  updateCartQuantity: (roomTypeId: number, quantity: number) => void;
  removeFromCart: (roomTypeId: number) => void;
  clearCart: () => void;
  totalRoomsInCart: number;
  totalGuestCapacity: number;
  totalPricePerNight: number;
  getQuantityForType: (roomTypeId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartRoomItem[]>(() => {
    try {
      const saved = localStorage.getItem('stayease_room_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('stayease_room_cart', JSON.stringify(cartItems));
    } catch {
      // Ignore storage error
    }
  }, [cartItems]);

  const addToCart = (room: Room, quantityToAdd = 1) => {
    const rt = room.roomType;
    const maxAvail = Math.max(1, rt.availableRooms ?? 3);

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.roomTypeId === room.roomTypeId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const current = updated[existingIndex];
        const nextQty = Math.min(current.maxAvailable, current.quantity + quantityToAdd);
        updated[existingIndex] = {
          ...current,
          quantity: nextQty,
          maxAvailable: maxAvail,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            roomTypeId: room.roomTypeId,
            sampleRoomId: room.roomId,
            roomTypeName: rt.name,
            code: rt.code,
            basePrice: rt.basePrice,
            maxOccupancy: rt.maxOccupancy,
            bedType: rt.bedType,
            sizeSqft: rt.sizeSqft,
            imageUrl: room.imageUrl || rt.imageUrl,
            quantity: Math.min(maxAvail, Math.max(1, quantityToAdd)),
            maxAvailable: maxAvail,
          },
        ];
      }
    });
  };

  const updateCartQuantity = (roomTypeId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(roomTypeId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.roomTypeId === roomTypeId
          ? { ...item, quantity: Math.min(item.maxAvailable, quantity) }
          : item
      )
    );
  };

  const removeFromCart = (roomTypeId: number) => {
    setCartItems((prev) => prev.filter((item) => item.roomTypeId !== roomTypeId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getQuantityForType = (roomTypeId: number) => {
    return cartItems.find((i) => i.roomTypeId === roomTypeId)?.quantity || 0;
  };

  const totalRoomsInCart = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalGuestCapacity = cartItems.reduce((sum, i) => sum + i.maxOccupancy * i.quantity, 0);
  const totalPricePerNight = cartItems.reduce((sum, i) => sum + i.basePrice * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        totalRoomsInCart,
        totalGuestCapacity,
        totalPricePerNight,
        getQuantityForType,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
};
