/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReceiptPayload {
  bookingReference: string;
  bookingStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  transactionReference?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCity?: string;
  roomNumber: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guests: number;
  roomCharges: number;
  servicesCharges: number;
  discountAmount?: number;
  promoCode?: string;
  taxAmount: number;
  totalAmount: number;
  issuedDate?: string;
}

export function buildReceiptHtml(data: ReceiptPayload): string {
  const issuedDate = data.issuedDate || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const discountRow =
    data.discountAmount && data.discountAmount > 0
      ? `<tr style="color: #3F7652;">
          <td style="padding: 10px 12px; border-bottom: 1px solid #EDE7DC;">Privilege Discount (${data.promoCode || 'APPLIED'})</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #EDE7DC; text-align: right; font-family: monospace;">-₹${data.discountAmount.toLocaleString('en-IN')}</td>
        </tr>`
      : '';

  const servicesRow =
    data.servicesCharges > 0
      ? `<tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #EDE7DC;">Selected Add-On Hotel Services</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #EDE7DC; text-align: right; font-family: monospace;">₹${data.servicesCharges.toLocaleString('en-IN')}</td>
        </tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Phoenix Payment Confirmation Receipt - ${data.bookingReference}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #F8F5EF;
      color: #252525;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .receipt-card {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #C9A45C;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 10px 25px rgba(11, 31, 51, 0.06);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0B1F33;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 700;
      color: #0B1F33;
      letter-spacing: 0.02em;
    }
    .brand-sub {
      font-size: 12px;
      color: #6B6B6B;
      margin-top: 4px;
    }
    .badge {
      display: inline-block;
      margin-top: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      background: #EDE7DC;
      color: #3F7652;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      background: #F8F5EF;
      border: 1px solid #EDE7DC;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .grid-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #6B6B6B;
      letter-spacing: 0.05em;
    }
    .grid-value {
      font-size: 13px;
      font-weight: 700;
      color: #0B1F33;
      margin-top: 2px;
    }
    .grid-sub {
      font-size: 11px;
      color: #6B6B6B;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    th {
      background: #0B1F33;
      color: #F8F5EF;
      text-align: left;
      padding: 10px 12px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .total-row td {
      padding: 14px 12px;
      font-size: 16px;
      font-weight: 800;
      background: #EDE7DC;
      color: #0B1F33;
      border-top: 2px solid #C9A45C;
    }
    .footer-notes {
      border-top: 1px solid #EDE7DC;
      padding-top: 16px;
      font-size: 11px;
      color: #6B6B6B;
    }
    .footer-notes p {
      margin-bottom: 4px;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .receipt-card { border: none; box-shadow: none; padding: 16px; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div>
        <div class="brand-title">Phoenix Hotel &amp; Suites</div>
        <div class="brand-sub">Plot 18, Golf Course Road, Sector 42, Gurugram</div>
        <div class="brand-sub">Phone: +91 (124) 490-8800 · GSTIN: 07AAACS1429B1Z2</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 15px; font-weight: 800; color: #0B1F33;">PAYMENT CONFIRMATION RECEIPT</div>
        <div class="brand-sub">Ref: <strong>${data.bookingReference}</strong></div>
        <div class="brand-sub">Issued: ${issuedDate}</div>
        <span class="badge">${data.bookingStatus} · ${data.paymentStatus}</span>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="grid-label">Guest Details</div>
        <div class="grid-value">${data.guestName}</div>
        ${data.guestPhone ? `<div class="grid-sub">${data.guestPhone}</div>` : ''}
        ${data.guestEmail ? `<div class="grid-sub">${data.guestEmail}</div>` : ''}
      </div>
      <div>
        <div class="grid-label">Assigned Suite</div>
        <div class="grid-value">Room #${data.roomNumber}</div>
        <div class="grid-sub">${data.roomTypeName}</div>
      </div>
      <div>
        <div class="grid-label">Stay Schedule</div>
        <div class="grid-value">${data.checkInDate} → ${data.checkOutDate}</div>
        <div class="grid-sub">${data.nights} Night(s) · ${data.guests} Guest(s)</div>
      </div>
      <div>
        <div class="grid-label">Payment Info</div>
        <div class="grid-value">${data.paymentMethod}</div>
        <div class="grid-sub">${data.transactionReference || `Status: ${data.paymentStatus}`}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #EDE7DC;">
            ${data.roomTypeName} (Room #${data.roomNumber}) × ${data.nights} Night(s)
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #EDE7DC; text-align: right; font-family: monospace;">
            ₹${data.roomCharges.toLocaleString('en-IN')}
          </td>
        </tr>
        ${discountRow}
        ${servicesRow}
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #EDE7DC;">Goods &amp; Services Tax (GST 12%)</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #EDE7DC; text-align: right; font-family: monospace;">
            ₹${data.taxAmount.toLocaleString('en-IN')}
          </td>
        </tr>
        <tr class="total-row">
          <td>Total Amount</td>
          <td style="text-align: right; font-family: monospace;">₹${data.totalAmount.toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer-notes">
      <p><strong>Check-In &amp; Check-Out Policy:</strong> Standard Check-In is 2:00 PM; Check-Out is 11:00 AM.</p>
      <p><strong>Identification Requirement:</strong> Please present a valid government-issued photo ID (Passport, Aadhaar Card, or Driving License) along with this confirmation receipt at reception.</p>
      <p>Thank you for choosing Phoenix Hotel &amp; Suites.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers a direct file download of the Payment Confirmation Receipt (.html)
 */
export function downloadReceiptFile(data: ReceiptPayload): void {
  const htmlContent = buildReceiptHtml(data);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Phoenix-Receipt-${data.bookingReference}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Prints the Payment Confirmation Receipt using an isolated hidden iframe
 */
export function printReceiptDocument(data: ReceiptPayload): void {
  try {
    const htmlContent = buildReceiptHtml(data);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc && iframe.contentWindow) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }
      };
    } else {
      document.body.removeChild(iframe);
      window.print();
    }
  } catch {
    window.print();
  }
}
