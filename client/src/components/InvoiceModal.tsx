import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  FileCheck2,
  Printer,
  Download,
  X,
  Building2,
  Calendar,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { printInvoicePdf, downloadInvoiceHtmlFile, numberToWords } from '../utils/invoicePdf';

interface InvoiceModalProps {
  invoice: any | null;
  invoiceId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice: initialInvoice,
  invoiceId,
  isOpen,
  onClose,
}) => {
  const [invoice, setInvoice] = useState<any | null>(initialInvoice);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (invoiceId && (!initialInvoice || !initialInvoice.items)) {
        fetchInvoice(invoiceId);
      } else {
        setInvoice(initialInvoice);
      }
    }
  }, [isOpen, invoiceId, initialInvoice]);

  const fetchInvoice = async (id: string) => {
    setLoading(true);
    try {
      // Try /invoices/:id first (factory auth), fallback to /buyer-portal/invoices
      const res = await api.get<any>(`/invoices/${id}`);
      setInvoice(res);
    } catch {
      try {
        const buyerInvoices = await api.get<any[]>('/buyer-portal/invoices');
        const match = buyerInvoices.find((i) => i.id === id);
        if (match) setInvoice(match);
      } catch (e) {
        console.error('Failed to load invoice details:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentInv = invoice || initialInvoice;
  if (!currentInv && !loading) return null;

  const subtotal = currentInv?.subtotal || currentInv?.totalAmount || 0;
  const taxAmount = currentInv?.taxAmount || Math.round(subtotal * 0.05);
  const totalAmount = currentInv?.totalAmount || (subtotal + taxAmount);
  const paidAmount = currentInv?.paidAmount || 0;
  const balanceAmount = currentInv?.balanceAmount ?? (totalAmount - paidAmount);
  const buyerTaxNo = currentInv?.buyer?.taxNumber || '';
  const isInterState = buyerTaxNo.length > 2 && !buyerTaxNo.startsWith('33');

  const items = currentInv?.items && currentInv.items.length > 0
    ? currentInv.items
    : [
        {
          description: 'Premium Cotton Twill Fabric (Roll Consignment)',
          hsnCode: '5208',
          quantityMeters: 2000,
          unitPrice: 100,
          totalPrice: subtotal,
        },
      ];

  const payments = currentInv?.payments || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Modal Top Action Bar */}
        <div className="bg-zinc-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold tracking-tight text-white font-mono">
                  {currentInv?.invoiceNumber || 'TAX INVOICE'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    balanceAmount <= 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : paidAmount > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {balanceAmount <= 0 ? 'PAID IN FULL' : paidAmount > 0 ? 'PARTIALLY PAID' : 'PAYMENT DUE'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                GST INV-01 Compliant Commercial Tax Invoice • AGT Textile Mills
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => printInvoicePdf(currentInv)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-xs"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={() => downloadInvoiceHtmlFile(currentInv)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition border border-zinc-700"
              title="Download Standalone Bill (.html)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Bill</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Document Body */}
        <div className="overflow-y-auto p-5 sm:p-8 bg-zinc-100/60 flex-1">
          {loading ? (
            <div className="p-16 text-center text-zinc-400 text-xs font-medium">
              Generating full tax invoice bill...
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto space-y-6 text-zinc-900 text-xs">
              {/* Mill Header */}
              <div className="border-b-2 border-indigo-600 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex items-center space-x-3.5">
                  <img
                    src="/logo.png"
                    alt="AGT Logo"
                    className="w-12 h-12 object-contain rounded-lg border border-zinc-200 p-0.5 bg-white"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-zinc-900">
                      AGT TEXTILE MILLS PRIVATE LIMITED
                    </h2>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      Integrated Manufacturing, Weaving & Export Mills
                    </p>
                    <div className="text-[11px] text-zinc-500 mt-1 space-y-0.5">
                      <p>SF No. 412/2, Palladam Road, Veerapandi Post, Tirupur - 641 605, Tamil Nadu</p>
                      <p className="font-mono text-[10px]">
                        <strong>GSTIN:</strong> 33AAACA1122K1Z9 | <strong>PAN:</strong> AAACA1122K | <strong>State:</strong> 33 (TN)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-extrabold text-xs uppercase tracking-wider rounded-md">
                    TAX INVOICE
                  </span>
                  <div className="font-mono font-bold text-sm text-zinc-900">
                    {currentInv?.invoiceNumber}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium">
                    Original for Recipient
                  </div>
                </div>
              </div>

              {/* Bill To & Invoice References Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/80 p-4 rounded-xl border border-zinc-200/80 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider mb-1">
                    Billed & Shipped To (Buyer)
                  </span>
                  <div className="font-bold text-zinc-900 text-sm">
                    {currentInv?.buyer?.companyName || currentInv?.buyer?.name || 'Valued Buyer'}
                  </div>
                  <div className="text-zinc-600 mt-1 space-y-0.5 text-[11px]">
                    <p><strong>Contact:</strong> {currentInv?.buyer?.name || 'Accounts Desk'}</p>
                    <p><strong>Address:</strong> {currentInv?.buyer?.address || 'India'}</p>
                    <p className="font-mono">
                      <strong>GSTIN / Tax ID:</strong> {currentInv?.buyer?.taxNumber || 'URP (Unregistered)'}
                    </p>
                    <p>
                      <strong>Place of Supply:</strong>{' '}
                      {isInterState ? 'Inter-State Consignment (IGST 5%)' : 'Tamil Nadu (33 - Intra-State)'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Invoice Date
                    </span>
                    <span className="font-semibold text-zinc-900">
                      {currentInv?.issueDate
                        ? new Date(currentInv.issueDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Today'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Due Date (Credit)
                    </span>
                    <span className="font-semibold text-amber-700">
                      {currentInv?.dueDate
                        ? new Date(currentInv.dueDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Net 30 Days'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Order Reference
                    </span>
                    <span className="font-mono font-semibold text-zinc-900">
                      {currentInv?.order?.orderNumber || 'ORD-2026'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Dispatch Ref
                    </span>
                    <span className="font-mono font-semibold text-zinc-900">
                      {currentInv?.dispatch?.dispatchNumber || 'DSP-CONSIGN'}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      Carrier Logistics Tracking
                    </span>
                    <span className="font-mono text-zinc-700 text-[11px]">
                      {currentInv?.dispatch?.trackingNumber || 'AGT-SEAFRT-99812'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-900 text-white font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3">Description of Goods</th>
                      <th className="py-2.5 px-3 font-mono">HSN</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3 text-zinc-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-zinc-900 block">
                            {item.description || 'Woven Cotton Fabric Rolls'}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            100% Cotton, Tested & Certified under AGT Quality Seal
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-600">{item.hsnCode || '5208'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-800">
                          {(item.quantityMeters || item.quantity || 0).toLocaleString()} m
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-700">
                          ₹{(item.unitPrice || 100).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                          ₹{(item.totalPrice || (item.quantityMeters || 0) * (item.unitPrice || 100) || subtotal).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Calculations & Bank Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                {/* Bank Settlement Account Details */}
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 space-y-2 text-[11px]">
                  <div className="flex items-center space-x-1.5 text-zinc-900 font-bold">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Official Bank Settlement Details</span>
                  </div>
                  <div className="space-y-0.5 text-zinc-600">
                    <p>Beneficiary: <strong>AGT Textile Mills Private Limited</strong></p>
                    <p>Bank: <strong>HDFC Bank — Tirupur Main Branch</strong></p>
                    <p className="font-mono">Account No: <strong>50200088192341</strong> (Current)</p>
                    <p className="font-mono">IFSC Code: <strong>HDFC0000182</strong></p>
                    <p className="text-[10px] text-zinc-400 pt-1">
                      * Please quote invoice reference #{currentInv?.invoiceNumber} on RTGS / NEFT advice.
                    </p>
                  </div>
                </div>

                {/* Tax & Total Calculation */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-zinc-100 text-zinc-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-semibold text-zinc-900">₹{subtotal.toLocaleString()}</span>
                  </div>

                  {isInterState ? (
                    <div className="flex justify-between py-1 border-b border-zinc-100 text-zinc-600">
                      <span>IGST (5.0%):</span>
                      <span className="font-mono font-semibold text-zinc-900">₹{taxAmount.toLocaleString()}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between py-1 border-b border-zinc-100 text-zinc-600">
                        <span>CGST (2.5%):</span>
                        <span className="font-mono font-semibold text-zinc-900">
                          ₹{Math.round(taxAmount / 2).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-100 text-zinc-600">
                        <span>SGST (2.5%):</span>
                        <span className="font-mono font-semibold text-zinc-900">
                          ₹{Math.round(taxAmount / 2).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between py-2 border-y-2 border-zinc-900 font-extrabold text-sm text-zinc-900">
                    <span>Total Invoice Value:</span>
                    <span className="font-mono">₹{totalAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1 text-emerald-700 font-semibold">
                    <span>Settled / Paid to Date:</span>
                    <span className="font-mono">₹{paidAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-900 text-white font-bold">
                    <span>Balance Due:</span>
                    <span className="font-mono text-amber-300">₹{balanceAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Amount in words */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] text-zinc-700">
                <span className="font-bold text-indigo-900 uppercase tracking-wide block text-[10px]">
                  Amount Chargeable (in words):
                </span>
                <span className="font-semibold text-zinc-900">{numberToWords(totalAmount)}</span>
              </div>

              {/* Payment Receipts Ledger if any */}
              {payments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-200">
                  <div className="flex items-center space-x-1.5 text-zinc-900 font-bold text-xs">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Payment Remittances ({payments.length})</span>
                  </div>
                  <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[9px]">
                        <tr>
                          <th className="py-2 px-3">Receipt #</th>
                          <th className="py-2 px-3">Credit Date</th>
                          <th className="py-2 px-3">Mode</th>
                          <th className="py-2 px-3">Bank Ref #</th>
                          <th className="py-2 px-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {payments.map((p: any, i: number) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-mono font-bold text-zinc-900">{p.paymentNumber}</td>
                            <td className="py-2 px-3 text-zinc-600">
                              {new Date(p.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 text-zinc-700">{p.paymentMethod}</td>
                            <td className="py-2 px-3 font-mono text-zinc-600">{p.transactionReference}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              ₹{p.amount?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Signatures & Footer Notice */}
              <div className="pt-6 border-t border-zinc-200 grid grid-cols-2 gap-4 text-[10px] text-zinc-500">
                <div>
                  <p className="font-semibold text-zinc-700 mb-1">Declaration & Terms:</p>
                  <p>1. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                  <p>2. Subject to Tirupur jurisdiction only.</p>
                </div>
                <div className="text-right flex flex-col justify-end items-end">
                  <p className="font-bold text-zinc-900 text-xs">For AGT TEXTILE MILLS PVT LTD</p>
                  <div className="h-10"></div>
                  <p className="font-semibold text-zinc-700 border-t border-zinc-300 pt-1 w-48 text-center">
                    Authorized Signatory
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-white px-6 py-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            Clicking <strong className="text-zinc-800">Print / Save as PDF</strong> opens the standard browser print dialog to directly save as a vector PDF or send to printer.
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => printInvoicePdf(currentInv)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={() => downloadInvoiceHtmlFile(currentInv)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs border border-zinc-200/80 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Bill</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
