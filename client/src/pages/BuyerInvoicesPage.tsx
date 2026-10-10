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
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-indigo-600 mb-2">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Commercial Billing & Accounts</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Commercial Invoices</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Official tax invoices generated for fabric roll consignments dispatched to your company
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Invoiced Amount</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">₹{totalInvoiced.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Cumulative invoice value incl 5% GST</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Settled Payments</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-700 font-mono">₹{totalPaid.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Verified payment receipts credited</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Outstanding Balance</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold tracking-tight text-amber-700 font-mono">₹{totalOutstanding.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Under standard 30-day net credit</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Invoice # or Order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 font-medium text-xs">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck2 className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-800">No Invoices Found</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Invoices are issued automatically upon roll dispatch confirmation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Total Amount (5% GST)</th>
                  <th className="py-3 px-4">Paid / Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 text-xs">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-zinc-900">
                      {inv.order?.orderNumber}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-500">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-800">
                      ₹{inv.subtotal?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 text-xs">
                      ₹{inv.totalAmount?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-emerald-700 font-semibold">
                        Paid: ₹{inv.paidAmount?.toLocaleString()}
                      </div>
                      <div className="font-mono text-zinc-500 text-[11px]">
                        Bal: ₹{inv.balanceAmount?.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                            : 'bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 text-zinc-700 font-semibold text-xs border border-zinc-200/70 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-zinc-500" />
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
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedInvoice(null);
          }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Commercial Tax Invoice</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex justify-between items-center bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Invoice Ref</span>
                  <span className="font-mono font-bold text-zinc-900 text-xs">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Order Ref</span>
                  <span className="font-semibold text-zinc-900">{selectedInvoice.order?.orderNumber}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-zinc-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Subtotal Amount:</span>
                  <span className="font-mono font-medium text-zinc-900">₹{selectedInvoice.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">GST (5% SGST + CGST):</span>
                  <span className="font-mono font-medium text-zinc-900">₹{selectedInvoice.taxAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-zinc-200 pt-2 text-zinc-900">
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{selectedInvoice.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-700 font-medium">
                  <span>Amount Paid:</span>
                  <span className="font-mono">₹{selectedInvoice.paidAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-900 font-bold bg-zinc-50 border border-zinc-200/80 p-3 rounded-xl">
                  <span>Remaining Due:</span>
                  <span className="font-mono text-amber-700">₹{selectedInvoice.balanceAmount?.toLocaleString()}</span>
                </div>
              </div>

              {/* AGT Mill Bank Settlement Details */}
              <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80 space-y-1 text-[11px]">
                <span className="font-bold text-zinc-900 block mb-0.5">Bank Settlement Instructions:</span>
                <p className="text-zinc-600">Beneficiary: <strong>AGT Textile Mills Private Limited</strong></p>
                <p className="text-zinc-600">Bank: <strong>HDFC Bank — Tirupur Main Branch</strong></p>
                <p className="text-zinc-600 font-mono">A/C: <strong>50200088192341</strong> | IFSC: <strong>HDFC0000182</strong></p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
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
