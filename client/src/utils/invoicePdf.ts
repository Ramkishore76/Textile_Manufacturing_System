/**
 * =========================================================================
 * AGT TEXTILE MILLS — COMMERCIAL TAX INVOICE PDF & PRINT GENERATOR
 * Standard GST INV-01 Compliant Tax Invoice
 * =========================================================================
 */

export function numberToWords(amount: number): string {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return twoDigits[n - 10];
    return `${tensMultiple[Math.floor(n / 10)]} ${singleDigits[n % 10]}`.trim();
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let res = '';
    if (hundred > 0) {
      res += `${singleDigits[hundred]} Hundred `;
    }
    if (remainder > 0) {
      res += convertTwoDigits(remainder);
    }
    return res.trim();
  }

  const rounded = Math.round(amount);
  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const remaining = rounded % 1000;

  let str = '';
  if (crore > 0) str += `${convertThreeDigits(crore)} Crore `;
  if (lakh > 0) str += `${convertThreeDigits(lakh)} Lakh `;
  if (thousand > 0) str += `${convertThreeDigits(thousand)} Thousand `;
  if (remaining > 0) str += `${convertThreeDigits(remaining)} `;

  return `Rupees ${str.trim()} Only`;
}

export function generateInvoiceHtml(invoice: any): string {
  const buyerName = invoice.buyer?.name || invoice.buyer?.companyName || 'Valued Customer';
  const buyerCompany = invoice.buyer?.companyName || buyerName;
  const buyerAddress = invoice.buyer?.address || 'India';
  const buyerTaxNo = invoice.buyer?.taxNumber || 'URP (Unregistered)';
  const invoiceNo = invoice.invoiceNumber || 'INV-2026-001';
  const issueDate = invoice.issueDate
    ? new Date(invoice.issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString('en-IN');
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Net 30 Days';

  const orderNo = invoice.order?.orderNumber || 'ORD-2026';
  const dispatchNo = invoice.dispatch?.dispatchNumber || 'DSP-2026';
  const trackingNo = invoice.dispatch?.trackingNumber || 'AGT-SEAFRT-99812';

  const subtotal = invoice.subtotal || invoice.totalAmount || 0;
  const taxAmount = invoice.taxAmount || Math.round(subtotal * 0.05);
  const totalAmount = invoice.totalAmount || (subtotal + taxAmount);
  const paidAmount = invoice.paidAmount || 0;
  const balanceAmount = invoice.balanceAmount ?? (totalAmount - paidAmount);

  const isInterState = buyerTaxNo.length > 2 && !buyerTaxNo.startsWith('33');
  const cgst = isInterState ? 0 : Math.round(taxAmount / 2);
  const sgst = isInterState ? 0 : Math.round(taxAmount / 2);
  const igst = isInterState ? taxAmount : 0;

  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [
        {
          description: 'Premium Cotton Twill Fabric (Roll Lot)',
          hsnCode: '5208',
          quantityMeters: 2000,
          unitPrice: 100,
          totalPrice: subtotal,
        },
      ];

  const payments = invoice.payments || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoiceNo} - AGT Textile Mills</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.4;
    }
    .invoice-wrapper {
      max-width: 800px;
      margin: 20px auto;
      background: #ffffff;
      padding: 32px 36px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    @media print {
      body {
        background: #ffffff;
      }
      .invoice-wrapper {
        margin: 0;
        padding: 0;
        border: none;
        border-radius: 0;
        box-shadow: none;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
    .print-bar {
      max-width: 800px;
      margin: 12px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 10px 18px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #4f46e5;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 12px;
      text-decoration: none;
      cursor: pointer;
      border: none;
    }
    .btn:hover {
      background: #4338ca;
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .company-sub {
      font-size: 11px;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .invoice-badge {
      display: inline-block;
      background: #eef2ff;
      color: #4338ca;
      font-weight: 800;
      font-size: 14px;
      padding: 4px 12px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .meta-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .meta-grid td {
      padding: 10px 14px;
      vertical-align: top;
      width: 50%;
    }
    .meta-grid td:first-child {
      border-right: 1px solid #e2e8f0;
    }
    .label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .val {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
    }
    .val-muted {
      font-size: 10px;
      color: #475569;
      line-height: 1.4;
    }
    table.line-items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    table.line-items th {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 10px;
      font-size: 10px;
      font-weight: 700;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    table.line-items th.text-right {
      text-align: right;
    }
    table.line-items td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }
    table.line-items td.text-right {
      text-align: right;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .summary-table td {
      vertical-align: top;
    }
    .bank-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      font-size: 10px;
      line-height: 1.5;
    }
    .totals-box {
      width: 280px;
      margin-left: auto;
      border-collapse: collapse;
    }
    .totals-box td {
      padding: 4px 8px;
      font-size: 11px;
    }
    .totals-box tr.grand-total td {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 6px 8px;
    }
    .badge-status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-paid {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .badge-partial {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .badge-unpaid {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .signature-row {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .words-box {
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <div style="font-size: 12px; font-weight: 600; color: #334155;">
      AGT Textile Mills — Tax Invoice Viewer (${invoiceNo})
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn btn-secondary" onclick="window.close()">Close</button>
      <button class="btn" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Print / Save as PDF
      </button>
    </div>
  </div>

  <div class="invoice-wrapper">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top; width: 65%;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <img src="${typeof window !== 'undefined' ? window.location.origin : ''}/logo.png" alt="AGT Logo" style="width: 44px; height: 44px; object-fit: contain; border-radius: 6px;" onerror="this.style.display='none'">
            <div>
              <h1 class="company-title">AGT TEXTILE MILLS PRIVATE LIMITED</h1>
              <p class="company-sub">Integrated Manufacturing, Weaving & Export Mills</p>
            </div>
          </div>
          <div style="color: #475569; font-size: 10px; line-height: 1.4;">
            SF No. 412/2, Palladam Road, Veerapandi Post, Tirupur - 641 605, Tamil Nadu, India<br>
            <strong>GSTIN:</strong> 33AAACA1122K1Z9 &nbsp;|&nbsp; <strong>PAN:</strong> AAACA1122K &nbsp;|&nbsp; <strong>State Code:</strong> 33<br>
            <strong>Email:</strong> accounts@agttextile.com &nbsp;|&nbsp; <strong>Phone:</strong> +91 98422 10001
          </div>
        </td>
        <td style="vertical-align: top; text-align: right; width: 35%;">
          <div class="invoice-badge">TAX INVOICE</div>
          <div style="margin-top: 8px; font-size: 14px; font-weight: 800; color: #0f172a;">${invoiceNo}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Original for Recipient</div>
          <div style="margin-top: 6px;">
            <span class="badge-status ${balanceAmount <= 0 ? 'badge-paid' : paidAmount > 0 ? 'badge-partial' : 'badge-unpaid'}">
              ${balanceAmount <= 0 ? 'PAID IN FULL' : paidAmount > 0 ? 'PARTIALLY PAID' : 'PAYMENT DUE'}
            </span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Metadata Grid -->
    <table class="meta-grid">
      <tr>
        <td>
          <div class="label">Billed & Shipped To (Buyer)</div>
          <div class="val">${buyerCompany}</div>
          <div class="val-muted" style="margin-top: 4px;">
            <strong>Contact:</strong> ${buyerName}<br>
            <strong>Address:</strong> ${buyerAddress}<br>
            <strong>GSTIN / Tax ID:</strong> <span style="font-family: monospace; font-weight: 600;">${buyerTaxNo}</span><br>
            <strong>Place of Supply:</strong> ${isInterState ? 'Inter-State (IGST 5%)' : 'Tamil Nadu (33 - Intra-State)'}
          </div>
        </td>
        <td>
          <div class="label">Invoice & Order References</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
            <div>
              <div class="label">Invoice Date</div>
              <div class="val" style="font-size: 11px;">${issueDate}</div>
            </div>
            <div>
              <div class="label">Due Date</div>
              <div class="val" style="font-size: 11px; color: #b45309;">${dueDate}</div>
            </div>
            <div>
              <div class="label">Order Number</div>
              <div class="val" style="font-size: 11px; font-family: monospace;">${orderNo}</div>
            </div>
            <div>
              <div class="label">Dispatch Ref</div>
              <div class="val" style="font-size: 11px; font-family: monospace;">${dispatchNo}</div>
            </div>
            <div style="grid-column: span 2;">
              <div class="label">Logistics Tracking</div>
              <div class="val" style="font-size: 10px; font-family: monospace; color: #475569;">${trackingNo}</div>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Line Items Table -->
    <table class="line-items">
      <thead>
        <tr>
          <th style="width: 35px;">#</th>
          <th>Description of Goods / Fabric Specification</th>
          <th style="width: 75px;">HSN/SAC</th>
          <th class="text-right" style="width: 90px;">Quantity</th>
          <th class="text-right" style="width: 90px;">Rate (₹)</th>
          <th class="text-right" style="width: 110px;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item: any, idx: number) => `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <strong>${item.description || 'Woven Cotton Fabric Rolls'}</strong>
            <div style="font-size: 9px; color: #64748b;">100% Cotton, Inspected & Serialized with AGT Barcode</div>
          </td>
          <td style="font-family: monospace;">${item.hsnCode || '5208'}</td>
          <td class="text-right" style="font-weight: 600;">${(item.quantityMeters || item.quantity || 0).toLocaleString()} m</td>
          <td class="text-right" style="font-family: monospace;">₹${(item.unitPrice || 0).toLocaleString()}</td>
          <td class="text-right" style="font-weight: 700; font-family: monospace;">₹${(item.totalPrice || item.amount || 0).toLocaleString()}</td>
        </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <!-- Amount in Words -->
    <div class="words-box">
      <strong>Amount Chargeable (in words):</strong> ${numberToWords(totalAmount)}
    </div>

    <!-- Summary & Settlement Section -->
    <table class="summary-table">
      <tr>
        <td style="width: 55%; padding-right: 16px;">
          <div class="bank-box">
            <strong style="color: #0f172a; text-transform: uppercase; font-size: 10px;">Bank Remittance Instructions</strong>
            <div style="margin-top: 4px; color: #334155;">
              <strong>Beneficiary:</strong> AGT Textile Mills Private Limited<br>
              <strong>Bank Name:</strong> HDFC Bank Limited (Tirupur Branch)<br>
              <strong>Account No:</strong> <span style="font-family: monospace; font-weight: 700;">50200088192341</span><br>
              <strong>IFSC Code:</strong> <span style="font-family: monospace; font-weight: 700;">HDFC0000182</span><br>
              <strong>UPI ID:</strong> agttextile@hdfcbank
            </div>
            <div style="margin-top: 8px; font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px;">
              Please mention Invoice No <strong>${invoiceNo}</strong> on remittance advice.
            </div>
          </div>

          ${payments.length > 0 ? `
          <div style="margin-top: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
            <strong style="font-size: 10px; text-transform: uppercase; color: #0f172a;">Verified Payment Receipts</strong>
            ${payments.map((p: any) => `
              <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px; color: #334155;">
                <span>• ${new Date(p.paymentDate).toLocaleDateString()} (${p.paymentMethod} - ${p.referenceNumber || 'TXN'})</span>
                <strong style="color: #059669;">₹${p.amount?.toLocaleString()}</strong>
              </div>
            `).join('')}
          </div>
          ` : ''}
        </td>

        <td style="width: 45%;">
          <table class="totals-box">
            <tr>
              <td style="color: #64748b;">Taxable Value:</td>
              <td style="text-align: right; font-family: monospace; font-weight: 600;">₹${subtotal.toLocaleString()}</td>
            </tr>
            ${!isInterState ? `
            <tr>
              <td style="color: #64748b;">CGST @ 2.5%:</td>
              <td style="text-align: right; font-family: monospace;">₹${cgst.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">SGST @ 2.5%:</td>
              <td style="text-align: right; font-family: monospace;">₹${sgst.toLocaleString()}</td>
            </tr>
            ` : `
            <tr>
              <td style="color: #64748b;">IGST @ 5.0%:</td>
              <td style="text-align: right; font-family: monospace;">₹${igst.toLocaleString()}</td>
            </tr>
            `}
            <tr class="grand-total">
              <td>Total Invoice Value:</td>
              <td style="text-align: right; font-family: monospace;">₹${totalAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #059669; font-weight: 600;">Paid Amount:</td>
              <td style="text-align: right; font-family: monospace; font-weight: 600; color: #059669;">₹${paidAmount.toLocaleString()}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="color: ${balanceAmount > 0 ? '#b45309' : '#059669'}; font-weight: 700; font-size: 12px;">Balance Due:</td>
              <td style="text-align: right; font-family: monospace; font-weight: 800; font-size: 12px; color: ${balanceAmount > 0 ? '#b45309' : '#059669'};">
                ₹${balanceAmount.toLocaleString()}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Terms & Signature Row -->
    <div class="signature-row">
      <div style="width: 60%; font-size: 9px; color: #64748b; line-height: 1.4;">
        <strong>Terms & Conditions:</strong><br>
        1. Interest @ 18% p.a. will be levied on payments delayed beyond the due date.<br>
        2. Discrepancies if any must be notified within 7 days of delivery.<br>
        3. Subject to Tirupur, Tamil Nadu jurisdiction only.
      </div>
      <div style="width: 35%; text-align: center;">
        <div style="font-size: 10px; font-weight: 700; color: #0f172a; margin-bottom: 36px;">
          For AGT TEXTILE MILLS PRIVATE LIMITED
        </div>
        <div style="border-top: 1px dashed #94a3b8; padding-top: 4px; font-size: 10px; font-weight: 600; color: #334155;">
          Authorized Signatory / Accounts Desk
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Open print-ready PDF invoice dialog in isolated browser window
 */
export function printInvoicePdf(invoice: any) {
  const html = generateInvoiceHtml(invoice);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    // Allow assets/fonts to settle before invoking print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 350);
  } else {
    // Fallback if popup blocked: create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    }
  }
}

/**
 * Download Invoice as standalone offline HTML document
 */
export function downloadInvoiceHtmlFile(invoice: any) {
  const html = generateInvoiceHtml(invoice);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${invoice.invoiceNumber || 'AGT'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
