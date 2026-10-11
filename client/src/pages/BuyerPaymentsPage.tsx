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
  Sparkles,
  Printer,
  Eye
} from 'lucide-react';
import { InvoiceModal } from '../components/InvoiceModal';
import { printInvoicePdf } from '../utils/invoicePdf';

export const BuyerPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-1.5 text-indigo-600 mb-2">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Settlements & Receipts</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Payment Receipts Ledger</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Official proof of payments credited against your commercial invoices
          </p>
        </div>

        <div className="bg-zinc-50 border border-zinc-200/80 px-4 py-2.5 rounded-xl text-left md:text-right">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">Total Remitted</span>
          <span className="text-2xl font-bold tracking-tight text-zinc-900 font-mono">
            ₹{totalPaid.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Payment #, Txn Ref #, or Invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 font-medium text-xs">Loading payment receipts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-800">No Payment Records Found</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Payments recorded by AGT Textile accounts desk will appear here with official verification.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Credit Date</th>
                  <th className="py-3 px-4">Invoiced Target</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Bank Transaction Ref #</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Invoice PDF Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 text-xs">
                      {p.paymentNumber}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-500">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.invoice ? (
                        <button
                          onClick={() => setSelectedInvoice(p.invoice)}
                          className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-1"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>{p.invoice.invoiceNumber}</span>
                        </button>
                      ) : (
                        <span className="text-zinc-400 italic">Unlinked</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 text-xs">
                      ₹{p.amount?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                        {p.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-zinc-600">
                      {p.transactionReference}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {p.invoice ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => printInvoicePdf(p.invoice)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200/80 transition"
                            title="Print or Save Invoice PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>PDF Bill</span>
                          </button>
                          <button
                            onClick={() => setSelectedInvoice(p.invoice)}
                            className="inline-flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs border border-zinc-200/70 transition"
                            title="Preview Invoice"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[10px]">No invoice</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice PDF & Breakdown Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        invoiceId={selectedInvoice?.id}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};

