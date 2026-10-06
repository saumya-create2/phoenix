/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PaymentProcessResult {
  success: boolean;
  transactionReference: string;
  paymentStatus: 'Completed' | 'Pending' | 'Failed';
  message: string;
  processedAt: string;
}

/**
 * OOPS Concept: Abstraction & Polymorphic Hierarchy
 * Abstract Base Class: Payment
 */
export abstract class Payment {
  protected _paymentId?: number;
  protected _bookingId: number;
  protected _transactionReference: string;
  protected _amount: number;
  protected _paymentMethod: 'Cash at Hotel' | 'Demo Card Payment' | 'UPI' | 'Net Banking';
  protected _paymentStatus: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  protected _paidAt: string;

  constructor(
    bookingId: number,
    amount: number,
    paymentMethod: 'Cash at Hotel' | 'Demo Card Payment' | 'UPI' | 'Net Banking',
    transactionReference?: string,
    paymentStatus: 'Completed' | 'Pending' | 'Failed' | 'Refunded' = 'Completed',
    paymentId?: number,
    paidAt: string = new Date().toISOString()
  ) {
    this._bookingId = bookingId;
    this._amount = amount;
    this._paymentMethod = paymentMethod;
    this._paymentStatus = paymentStatus;
    this._paymentId = paymentId;
    this._paidAt = paidAt;
    this._transactionReference = transactionReference || this.generateReference();
  }

  protected generateReference(): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `TXN-${Date.now()}-${random}`;
  }

  // Getters
  public get bookingId(): number {
    return this._bookingId;
  }
  public get amount(): number {
    return this._amount;
  }
  public get paymentMethod(): string {
    return this._paymentMethod;
  }
  public get paymentStatus(): string {
    return this._paymentStatus;
  }
  public get transactionReference(): string {
    return this._transactionReference;
  }
  public get paidAt(): string {
    return this._paidAt;
  }

  // Abstract Method for polymorphic processing
  public abstract processPayment(payload?: any): Promise<PaymentProcessResult>;
  public abstract getReceiptSummary(): Record<string, any>;
}

/**
 * Concrete Subclass: CashPayment
 * Polymorphic implementation for offline settlement at front desk
 */
export class CashPayment extends Payment {
  constructor(bookingId: number, amount: number) {
    super(bookingId, amount, 'Cash at Hotel', undefined, 'Pending');
    this._transactionReference = `CASH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  }

  public async processPayment(): Promise<PaymentProcessResult> {
    // For Cash at Hotel, payment status is pending until customer checks in at reception
    return {
      success: true,
      transactionReference: this._transactionReference,
      paymentStatus: 'Pending',
      message: 'Reservation guaranteed. Full payment of ₹' + this._amount.toLocaleString('en-IN') + ' due upon arrival at hotel reception.',
      processedAt: new Date().toISOString(),
    };
  }

  public getReceiptSummary(): Record<string, any> {
    return {
      method: 'Cash at Hotel',
      reference: this._transactionReference,
      amount: this._amount,
      note: 'Payable at reception during check-in',
      isSettled: false,
    };
  }
}

/**
 * Concrete Subclass: DemoCardPayment
 * Polymorphic implementation for instant digital card authorization simulation
 */
export class DemoCardPayment extends Payment {
  private _cardNumber: string;
  private _cardHolder: string;
  private _cardLastFour: string;

  constructor(bookingId: number, amount: number, cardNumber: string, cardHolder: string) {
    super(bookingId, amount, 'Demo Card Payment', undefined, 'Completed');
    this._cardNumber = cardNumber;
    this._cardHolder = cardHolder;
    const cleanNum = cardNumber.replace(/\s+/g, '');
    this._cardLastFour = cleanNum.slice(-4) || '4242';
    this._transactionReference = `CARD-${Date.now()}-${this._cardLastFour}`;
  }

  public get cardLastFour(): string {
    return this._cardLastFour;
  }

  public async processPayment(payload?: { cvv?: string; expiry?: string }): Promise<PaymentProcessResult> {
    // Simulate payment gateway tokenization and verification
    return {
      success: true,
      transactionReference: this._transactionReference,
      paymentStatus: 'Completed',
      message: `Payment of ₹${this._amount.toLocaleString('en-IN')} approved via Card ending in ${this._cardLastFour}.`,
      processedAt: new Date().toISOString(),
    };
  }

  public getReceiptSummary(): Record<string, any> {
    return {
      method: 'Demo Card Payment',
      reference: this._transactionReference,
      cardLastFour: this._cardLastFour,
      cardHolder: this._cardHolder,
      amount: this._amount,
      isSettled: true,
    };
  }
}
