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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 mb-1">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Settlements & Receipts</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Receipts Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Official proof of payments credited against your commercial invoices
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-right">
          <span className="text-xs font-bold text-emerald-800 uppercase block">Total Remitted</span>
          <span className="text-2xl font-black text-emerald-700 font-mono">
            ₹{totalPaid.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Payment #, Txn Ref #, or Invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading payment receipts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Payment Records Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Payments recorded by Everest Textile accounts desk will appear here immediately with official verification stamps.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Credit Date</th>
                  <th className="py-3 px-4">Invoiced Target</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Bank Transaction Ref #</th>
                  <th className="py-3 px-4 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700 text-sm">
                      {p.paymentNumber}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.invoice?.invoiceNumber}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-sm">
                      ₹{p.amount?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 font-medium">
                      {p.transactionReference}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
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
