import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  FileCheck2,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  CreditCard
} from 'lucide-react';

export const BuyerInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get<any[]>('/buyer-portal/invoices');
      setInvoices(res);
    } catch (err: any) {
      console.error('Failed to load buyer invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.order?.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-neutral-500 mb-1">
            <FileCheck2 className="w-4 h-4 text-neutral-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Commercial Billing & Accounts</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Commercial Invoices</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Official tax invoices generated for fabric roll consignments dispatched to your company
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total Invoiced Amount</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold tracking-tight text-neutral-900 font-mono">₹{totalInvoiced.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Cumulative invoice value incl 5% GST</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Settled Payments</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold tracking-tight text-neutral-900 font-mono">₹{totalPaid.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Verified payment receipts credited</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Outstanding Balance</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold tracking-tight text-neutral-900 font-mono">₹{totalOutstanding.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">Under standard 30-day net credit</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Invoice # or Order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-400 font-medium text-xs">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck2 className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-800">No Invoices Found</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Invoices are issued automatically upon roll dispatch confirmation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Order #</th>
                  <th className="py-2.5 px-4">Issue Date</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Subtotal</th>
                  <th className="py-2.5 px-4">Total Amount (5% GST)</th>
                  <th className="py-2.5 px-4">Paid / Balance</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900 text-xs">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      {inv.order?.orderNumber}
                    </td>

                    <td className="py-3 px-4 text-neutral-500">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-neutral-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 font-mono text-neutral-800">
                      ₹{inv.subtotal?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-neutral-900 text-xs">
                      ₹{inv.totalAmount?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-neutral-800 font-medium">
                        Paid: ₹{inv.paidAmount?.toLocaleString()}
                      </div>
                      <div className="font-mono text-neutral-500 text-[11px]">
                        Bal: ₹{inv.balanceAmount?.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium text-xs border border-neutral-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Breakdown</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Breakdown Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-neutral-600" />
                <h3 className="text-sm font-bold text-neutral-900 tracking-tight">Commercial Tax Invoice</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <div>
                  <span className="text-neutral-400 block text-[10px] uppercase font-medium">Invoice Ref</span>
                  <span className="font-mono font-bold text-neutral-900 text-xs">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400 block text-[10px] uppercase font-medium">Order Ref</span>
                  <span className="font-semibold text-neutral-900">{selectedInvoice.order?.orderNumber}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-neutral-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Subtotal Amount:</span>
                  <span className="font-mono font-medium text-neutral-900">₹{selectedInvoice.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">GST (5% SGST + CGST):</span>
                  <span className="font-mono font-medium text-neutral-900">₹{selectedInvoice.taxAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-neutral-200 pt-2 text-neutral-900">
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{selectedInvoice.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-700 font-medium">
                  <span>Amount Paid:</span>
                  <span className="font-mono">₹{selectedInvoice.paidAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-800 font-semibold bg-neutral-50 border border-neutral-200 p-2.5 rounded-lg">
                  <span>Remaining Due:</span>
                  <span className="font-mono">₹{selectedInvoice.balanceAmount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Everest Mill Bank Settlement Details */}
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-1 text-[11px]">
                <span className="font-semibold text-neutral-800 block">Bank Settlement Instructions:</span>
                <p className="text-neutral-600">Beneficiary: <strong>Everest Textile Mills Private Limited</strong></p>
                <p className="text-neutral-600">Bank: <strong>HDFC Bank — Tirupur Main Branch</strong></p>
                <p className="text-neutral-600 font-mono">A/C: <strong>50200088192341</strong> | IFSC: <strong>HDFC0000182</strong></p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
