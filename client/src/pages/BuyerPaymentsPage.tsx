import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  Receipt,
  FileCheck2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const BuyerPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get<any[]>('/buyer-portal/payments');
      setPayments(res);
    } catch (err: any) {
      console.error('Failed to load buyer payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = payments.filter(
    (p) =>
      p.paymentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.transactionReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-neutral-500 mb-1">
            <CreditCard className="w-4 h-4 text-neutral-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Settlements & Receipts</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Payment Receipts Ledger</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Official proof of payments credited against your commercial invoices
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 px-4 py-2 rounded-lg text-left md:text-right">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide block">Total Remitted</span>
          <span className="text-2xl font-bold tracking-tight text-neutral-900 font-mono">
            ₹{totalPaid.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Payment #, Txn Ref #, or Invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-400 font-medium text-xs">Loading payment receipts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-800">No Payment Records Found</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Payments recorded by Everest Textile accounts desk will appear here with official verification.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Receipt #</th>
                  <th className="py-2.5 px-4">Credit Date</th>
                  <th className="py-2.5 px-4">Invoiced Target</th>
                  <th className="py-2.5 px-4">Amount Paid</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4">Bank Transaction Ref #</th>
                  <th className="py-2.5 px-4 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900 text-xs">
                      {p.paymentNumber}
                    </td>

                    <td className="py-3 px-4 text-neutral-500">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      {p.invoice?.invoiceNumber}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-neutral-900 text-xs">
                      ₹{p.amount?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {p.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-neutral-600">
                      {p.transactionReference}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                        <ShieldCheck className="w-3 h-3 text-emerald-700" />
                        <span>Verified & Credited</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
