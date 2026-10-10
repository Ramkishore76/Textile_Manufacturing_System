import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  FileText,
  CreditCard,
  TrendingUp,
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  X,
  DollarSign,
  PieChart,
  Layers,
  Cpu,
  Boxes,
  Building2
} from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'expenses' | 'profitability'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Profitability per order state
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [orderCostReport, setOrderCostReport] = useState<any | null>(null);
  const [orderCostLoading, setOrderCostLoading] = useState(false);

  // Record Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Record Expense Modal State
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<string>('ELECTRICITY_UTILITIES');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDescription, setExpenseDescription] = useState<string>('');
  const [expenseOrderId, setExpenseOrderId] = useState<string>('');
  const [receiptRef, setReceiptRef] = useState<string>('');
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [invRes, payRes, expRes, ordRes, finRes] = await Promise.all([
        api.get<any[]>('/invoices'),
        api.get<any[]>('/payments'),
        api.get<any[]>('/expenses'),
        api.get<any[]>('/orders'),
        api.get<any>('/reports/financials'),
      ]);
      setInvoices(invRes);
      setPayments(payRes);
      setExpenses(expRes);
      setOrders(ordRes);
      setFinancials(finRes);

      if (ordRes.length > 0 && !selectedOrderId) {
        setSelectedOrderId(ordRes[0].id);
        loadOrderCost(ordRes[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load accounts data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderCost = async (orderId: string) => {
    if (!orderId) return;
    setOrderCostLoading(true);
    try {
      const report = await api.get<any>(`/reports/order-cost/${orderId}`);
      setOrderCostReport(report);
    } catch (err: any) {
      console.error('Failed to load order cost:', err);
    } finally {
      setOrderCostLoading(false);
    }
  };

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balanceAmount);
    setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPaymentError(null);
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (paymentAmount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }
    if (!transactionRef.trim()) {
      setPaymentError('Transaction reference number is required.');
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError(null);
    try {
      await api.post('/payments', {
        invoiceId: selectedInvoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        transactionReference: transactionRef.trim(),
        notes: paymentNotes,
      });

      setPaymentModalOpen(false);
      loadAllData();
    } catch (err: any) {
      setPaymentError(err.message || 'Payment recording failed.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) {
      setExpenseError('Expense amount must be greater than zero.');
      return;
    }
    if (!expenseDescription.trim()) {
      setExpenseError('Description is required.');
      return;
    }

    setExpenseSubmitting(true);
    setExpenseError(null);
    try {
      await api.post('/expenses', {
        category: expenseCategory,
        amount: Number(expenseAmount),
        description: expenseDescription.trim(),
        orderId: expenseOrderId || undefined,
        receiptReference: receiptRef.trim() || undefined,
      });

      setExpenseModalOpen(false);
      setExpenseAmount(0);
      setExpenseDescription('');
      setReceiptRef('');
      loadAllData();
    } catch (err: any) {
      setExpenseError(err.message || 'Expense recording failed.');
    } finally {
      setExpenseSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">Billing, Payments & Cost Control</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Commercial invoices, buyer receipts, plant expenses, and order margin analysis.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Plant Expense</span>
          </button>
        </div>
      </div>

      {/* Financial Executive Summary Cards */}
      {financials && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
            <p className="text-xs font-medium text-neutral-500">Gross Invoiced Revenue</p>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-semibold text-neutral-900">
                ₹{financials.salesRevenue?.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">+ ₹{financials.gstCollected?.toLocaleString()} GST collected</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
            <p className="text-xs font-medium text-neutral-500">Cash Collected</p>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-semibold text-emerald-700">
                ₹{financials.cashPaymentsReceived?.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Settled payments received</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
            <p className="text-xs font-medium text-neutral-500">Accounts Receivable</p>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-semibold text-amber-700">
                ₹{financials.outstandingReceivables?.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Pending buyer collections</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
            <p className="text-xs font-medium text-neutral-500">Gross Operating Margin</p>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-semibold text-neutral-900">
                {financials.profitMargin}%
              </span>
              <span className="text-xs font-normal text-neutral-500">
                (₹{financials.netProfit?.toLocaleString()})
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Net of materials, power & labour</p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-200 space-x-6 text-xs">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-2.5 transition border-b-2 text-xs ${
            activeTab === 'invoices'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 font-normal'
          }`}
        >
          Commercial Invoices ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-2.5 transition border-b-2 text-xs ${
            activeTab === 'payments'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 font-normal'
          }`}
        >
          Buyer Payments Ledger ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-2.5 transition border-b-2 text-xs ${
            activeTab === 'expenses'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 font-normal'
          }`}
        >
          Manufacturing Overheads ({expenses.length})
        </button>

        <button
          onClick={() => setActiveTab('profitability')}
          className={`pb-2.5 transition border-b-2 text-xs ${
            activeTab === 'profitability'
              ? 'border-neutral-900 text-neutral-900 font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 font-normal'
          }`}
        >
          Order Cost & Profit Explorer
        </button>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg border border-neutral-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/40 border-b border-neutral-200/80 text-neutral-500 font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Buyer Company</th>
                  <th className="py-2.5 px-4">Order #</th>
                  <th className="py-2.5 px-4">Issue Date</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Subtotal</th>
                  <th className="py-2.5 px-4">Total (5% GST)</th>
                  <th className="py-2.5 px-4">Paid / Balance</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/60 transition">
                    <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-800">
                      {inv.buyer?.companyName}
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-900">
                      {inv.order?.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-neutral-500">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-neutral-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      ₹{inv.subtotal?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      ₹{inv.totalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-emerald-700 font-medium">
                        Paid: ₹{inv.paidAmount?.toLocaleString()}
                      </div>
                      <div className="text-neutral-500 text-[10px]">
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
                            : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inv.balanceAmount > 0 && (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENTS LEDGER */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg border border-neutral-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/40 border-b border-neutral-200/80 text-neutral-500 font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Payment #</th>
                  <th className="py-2.5 px-4">Payment Date</th>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Buyer Company</th>
                  <th className="py-2.5 px-4">Amount Received</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Txn Reference #</th>
                  <th className="py-2.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/60 transition">
                    <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3 px-4 text-neutral-500">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-neutral-800">
                      {p.invoice?.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-neutral-700">
                      {p.invoice?.buyer?.companyName}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      ₹{p.amount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      {p.transactionReference}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 italic">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MANUFACTURING EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-lg border border-neutral-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/40 border-b border-neutral-200/80 text-neutral-500 font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Expense #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Cost Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Associated Order</th>
                  <th className="py-2.5 px-4">Voucher / Receipt Ref</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-neutral-50/60 transition">
                    <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                      {e.expenseNumber}
                    </td>
                    <td className="py-3 px-4 text-neutral-500">
                      {new Date(e.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                        {e.category?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-800">
                      {e.description}
                    </td>
                    <td className="py-3 px-4 font-medium text-neutral-800">
                      {e.order?.orderNumber || 'General Plant Overhead'}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-500">
                      {e.receiptReference || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-neutral-900">
                      ₹{e.amount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ORDER PROFITABILITY EXPLORER */}
      {activeTab === 'profitability' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-semibold text-neutral-900">Order-wise Profitability Breakdown</h3>
              <p className="text-[11px] text-neutral-500">Select any buyer order to analyze raw materials, machine hours, and margins</p>
            </div>

            <div className="w-full sm:w-72">
              <select
                value={selectedOrderId}
                onChange={(e) => {
                  setSelectedOrderId(e.target.value);
                  loadOrderCost(e.target.value);
                }}
                className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 bg-white focus:outline-none focus:border-neutral-900"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} - {o.buyer?.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {orderCostLoading ? (
            <div className="p-8 text-center text-neutral-400 font-normal text-xs">Calculating profitability breakdown...</div>
          ) : orderCostReport ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Financial Summary Card */}
              <div className="bg-white p-5 rounded-lg border border-neutral-200/80 md:col-span-1 space-y-3">
                <h4 className="text-xs font-semibold text-neutral-900">
                  Profit Statement: {orderCostReport.orderNumber}
                </h4>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Gross Sales Revenue</span>
                    <span className="font-semibold text-neutral-900">
                      ₹{orderCostReport.financials.revenue?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-neutral-100 text-neutral-600">
                    <span>(-) Raw Material BOM Cost</span>
                    <span className="font-medium text-neutral-900">
                      ₹{orderCostReport.financials.materialCost?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-neutral-100 text-neutral-600">
                    <span>(-) Machine Operating Cost</span>
                    <span className="font-medium text-neutral-900">
                      ₹{orderCostReport.financials.machineOperatingCost?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-neutral-100 text-neutral-600">
                    <span>(-) Plant Direct Expenses</span>
                    <span className="font-medium text-neutral-900">
                      ₹{orderCostReport.financials.attributableExpenses?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-neutral-200 font-medium text-neutral-900">
                    <span>Total Manufacturing Cost</span>
                    <span className="text-neutral-900">
                      ₹{orderCostReport.financials.totalCost?.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80 text-neutral-900">
                    <span className="font-semibold">Net Gross Profit</span>
                    <div className="text-right">
                      <div className="font-semibold">₹{orderCostReport.financials.netProfit?.toLocaleString()}</div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        {orderCostReport.financials.profitMarginPercentage}% Margin
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Cost Drivers */}
              <div className="bg-white p-5 rounded-lg border border-neutral-200/80 md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900 mb-2 flex items-center space-x-1.5">
                    <Boxes className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Raw Material Breakdown (Yarn Consumption & Wastage)</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50/40 text-neutral-500 font-medium text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Yarn Name</th>
                          <th className="py-2 px-3">Quantity (Kg)</th>
                          <th className="py-2 px-3">Cost/Kg</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {orderCostReport.breakdowns.materials.map((m: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-medium text-neutral-800">{m.yarnName} ({m.yarnCode})</td>
                            <td className="py-2 px-3">{m.quantityKg.toFixed(1)} kg</td>
                            <td className="py-2 px-3">₹{m.unitCost}</td>
                            <td className="py-2 px-3 text-right font-medium text-neutral-900">
                              ₹{m.totalCost.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-neutral-900 mb-2 flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Machine Operating Breakdown (Power & Looms)</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50/40 text-neutral-500 font-medium text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Job & Stage</th>
                          <th className="py-2 px-3">Loom Machine</th>
                          <th className="py-2 px-3">Operating Hours</th>
                          <th className="py-2 px-3">Hourly Rate</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {orderCostReport.breakdowns.machines.map((mac: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-medium text-neutral-800">{mac.jobNumber} ({mac.stage})</td>
                            <td className="py-2 px-3 text-neutral-600">{mac.machineName}</td>
                            <td className="py-2 px-3">{mac.operatingHours} hrs</td>
                            <td className="py-2 px-3">₹{mac.hourlyRate}/hr</td>
                            <td className="py-2 px-3 text-right font-medium text-neutral-900">
                              ₹{mac.totalCost.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Record Buyer Payment</h3>
                <p className="text-[11px] text-neutral-500">Invoice #{selectedInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentError && (
              <div className="mb-3 p-2.5 rounded-md bg-rose-50 border border-rose-200/60 text-rose-800 text-xs">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  max={selectedInvoice.balanceAmount}
                  min={1}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900 font-medium"
                  required
                />
                <span className="text-[10px] text-neutral-400 block mt-0.5">
                  Remaining balance: ₹{selectedInvoice.balanceAmount?.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 bg-white focus:outline-none focus:border-neutral-900"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI / Digital</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                  <option value="CASH">Cash Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Transaction / Bank Ref No. *
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UTR-98234123"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Notes / Narration
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received via Bank Current A/C"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-3 py-1.5 rounded-md bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-4 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition"
                >
                  {paymentSubmitting ? 'Recording...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {expenseModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <h3 className="text-sm font-semibold text-neutral-900">Record Manufacturing Expense</h3>
              <button
                onClick={() => setExpenseModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {expenseError && (
              <div className="mb-3 p-2.5 rounded-md bg-rose-50 border border-rose-200/60 text-rose-800 text-xs">
                {expenseError}
              </div>
            )}

            <form onSubmit={handleRecordExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Cost Category *
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 bg-white focus:outline-none focus:border-neutral-900"
                >
                  <option value="RAW_MATERIAL_CONSUMED">Raw Material Consumed</option>
                  <option value="DIRECT_LABOUR">Direct Labour</option>
                  <option value="MACHINE_OPERATING">Machine Operating Cost</option>
                  <option value="ELECTRICITY_UTILITIES">Electricity & Power Utilities</option>
                  <option value="DYEING_PROCESSING">Dyeing & Chemical Processing</option>
                  <option value="MAINTENANCE">Loom Maintenance & Spare Parts</option>
                  <option value="OTHER">Other Plant Overhead</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="e.g. Monthly electricity tariff"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Associate with Order (Optional)
                </label>
                <select
                  value={expenseOrderId}
                  onChange={(e) => setExpenseOrderId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 bg-white focus:outline-none focus:border-neutral-900"
                >
                  <option value="">-- General Factory Overhead --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.buyer?.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Voucher / Receipt Ref # (Optional)
                </label>
                <input
                  type="text"
                  value={receiptRef}
                  onChange={(e) => setReceiptRef(e.target.value)}
                  placeholder="e.g. TANGEDCO-EB-8812"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-3 py-1.5 rounded-md bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expenseSubmitting}
                  className="px-4 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition"
                >
                  {expenseSubmitting ? 'Recording...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
