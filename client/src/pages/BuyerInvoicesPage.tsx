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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 mb-1">
            <FileCheck2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Commercial Billing & Accounts</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Commercial Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Official tax invoices generated for fabric roll consignments dispatched to your company
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Invoiced Amount</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-slate-900">₹{totalInvoiced.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative invoice value incl 5% GST</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Settled Payments</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-emerald-600">₹{totalPaid.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Verified payment receipts credited</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Outstanding Balance</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-amber-600">₹{totalOutstanding.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Under standard 30-day net credit</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Invoice # or Order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Invoices Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Invoices are issued automatically upon roll dispatch confirmation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Total Amount (5% GST)</th>
                  <th className="py-3 px-4">Paid / Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700 text-sm">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {inv.order?.orderNumber}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      ₹{inv.subtotal?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                      ₹{inv.totalAmount?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-emerald-600 font-semibold">
                        Paid: ₹{inv.paidAmount?.toLocaleString()}
                      </div>
                      <div className="font-mono text-amber-600 font-bold text-[10px]">
                        Bal: ₹{inv.balanceAmount?.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-900">Commercial Tax Invoice</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Ref</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Ref</span>
                  <span className="font-bold text-teal-700">{selectedInvoice.order?.orderNumber}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal Amount:</span>
                  <span className="font-mono font-bold text-slate-900">₹{selectedInvoice.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GST (5% SGST + CGST):</span>
                  <span className="font-mono font-bold text-slate-900">₹{selectedInvoice.taxAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-2 text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{selectedInvoice.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Amount Paid:</span>
                  <span className="font-mono">₹{selectedInvoice.paidAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-black text-sm bg-amber-50 p-2 rounded-lg">
                  <span>Remaining Due:</span>
                  <span className="font-mono">₹{selectedInvoice.balanceAmount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Everest Mill Bank Settlement Details */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                <span className="font-bold text-slate-700 block">Bank Transfer Instructions (NEFT/RTGS):</span>
                <p className="text-slate-600">Beneficiary: <strong>Everest Textile Mills Private Limited</strong></p>
                <p className="text-slate-600">Bank: <strong>HDFC Bank — Tirupur Main Branch</strong></p>
                <p className="text-slate-600 font-mono">A/C No: <strong>50200088192341</strong> | IFSC: <strong>HDFC0000182</strong></p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Invoice View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
