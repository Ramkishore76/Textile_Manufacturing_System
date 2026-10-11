import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Wallet,
  Calculator,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FileCheck2,
  UserCheck,
  Calendar,
  X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const WagesPage: React.FC = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [wages, setWages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Calculate Wage Modal
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [calcEmployeeId, setCalcEmployeeId] = useState<string>('');
  const [bonuses, setBonuses] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [calcSubmitting, setCalcSubmitting] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  useEffect(() => {
    loadWagesData();
  }, [selectedMonth, selectedYear]);

  const loadWagesData = async () => {
    setLoading(true);
    try {
      const [wagesRes, empsRes] = await Promise.all([
        api.get<any[]>(`/wages?month=${selectedMonth}&year=${selectedYear}`),
        api.get<any[]>('/employees'),
      ]);
      setWages(wagesRes);
      setEmployees(empsRes);
      if (empsRes.length > 0 && !calcEmployeeId) {
        setCalcEmployeeId(empsRes[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load wages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateWage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcEmployeeId) return;

    setCalcSubmitting(true);
    setCalcError(null);
    try {
      await api.post('/wages/calculate', {
        employeeId: calcEmployeeId,
        periodMonth: Number(selectedMonth),
        periodYear: Number(selectedYear),
        bonuses: Number(bonuses),
        deductions: Number(deductions),
        adjustmentReason: adjustmentReason.trim() || undefined,
      });

      setCalcModalOpen(false);
      setBonuses(0);
      setDeductions(0);
      setAdjustmentReason('');
      loadWagesData();
    } catch (err: any) {
      setCalcError(err.message || 'Wage calculation failed.');
    } finally {
      setCalcSubmitting(false);
    }
  };

  const handleUpdateStatus = async (wageId: string, status: 'APPROVED' | 'PAID') => {
    try {
      await api.put(`/wages/${wageId}/status`, { status });
      toast.success(`Wage payroll status marked as ${status}!`);
      loadWagesData();
    } catch (err: any) {
      toast.error('Status update failed: ' + err.message);
    }
  };

  // Metrics
  const totalNetPayroll = wages.reduce((sum, w) => sum + w.netWage, 0);
  const totalOvertime = wages.reduce((sum, w) => sum + w.overtimePay, 0);
  const totalBasePay = wages.reduce((sum, w) => sum + w.basePay, 0);
  const paidCount = wages.filter((w) => w.status === 'PAID').length;

  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Labour Wages & Payroll Register</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Monthly payroll calculated from shift presence logs, base rates, and overtime hours.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Month & Year Selectors */}
          <div className="flex items-center space-x-2 bg-white border border-zinc-200 px-3 py-2 rounded-xl text-xs shadow-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs text-zinc-800 font-medium focus:outline-none"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
            <span className="text-zinc-300">/</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs text-zinc-800 font-medium focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setCalcModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculate Wages</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Total Net Payroll</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">₹{totalNetPayroll.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">For {months.find((m) => m.value === selectedMonth)?.name} {selectedYear}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Base Days Salary</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">₹{totalBasePay.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Standard shift hours</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Overtime Disbursed</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">₹{totalOvertime.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Overtime incentive payout</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <p className="text-xs font-medium text-zinc-500">Settlement Status</p>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-bold tracking-tight text-emerald-700">
              {paidCount} / {wages.length}
            </span>
            <span className="text-xs text-zinc-400">paid</span>
          </div>
        </div>
      </div>

      {/* Wages Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs font-medium">Loading wages register...</div>
        ) : wages.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-zinc-700">No Wage Records Generated Yet</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Click "Calculate Wages" to auto-compile attendance and overtime into monthly wages.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Base Pay</th>
                  <th className="py-3 px-4">Overtime Pay</th>
                  <th className="py-3 px-4">Bonuses</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Wage</th>
                  <th className="py-3 px-4">Audit Breakdown</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {wages.map((w) => (
                  <tr key={w.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-zinc-900 block">{w.employee?.employeeCode}</span>
                      <span className="font-semibold text-zinc-800">{w.employee?.name}</span>
                      <span className="text-[10px] text-zinc-400 block">{w.employee?.department}</span>
                    </td>

                    <td className="py-3.5 px-4 text-zinc-800 font-medium">
                      ₹{w.basePay?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-zinc-800 font-medium">
                      ₹{w.overtimePay?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                      +₹{w.bonuses?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-rose-600 font-medium">
                      -₹{w.deductions?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-zinc-900">
                      ₹{w.netWage?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-[11px] text-zinc-500 line-clamp-2" title={w.calculationNotes}>
                        {w.calculationNotes}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          w.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            : w.status === 'APPROVED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/70'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/70'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {w.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(w.id, 'APPROVED')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
                        >
                          Approve
                        </button>
                      )}
                      {w.status === 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateStatus(w.id, 'PAID')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition"
                        >
                          Mark Paid
                        </button>
                      )}
                      {w.status === 'PAID' && (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Settled</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Calculate Wage Modal */}
      {calcModalOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCalcModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-4">
              <h3 className="font-bold text-sm text-zinc-900">Calculate Monthly Wage</h3>
              <button
                onClick={() => setCalcModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {calcError && (
              <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-800 text-xs font-medium">
                {calcError}
              </div>
            )}

            <form onSubmit={handleCalculateWage} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Select Employee *
                </label>
                <select
                  value={calcEmployeeId}
                  onChange={(e) => setCalcEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-800 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  required
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.employeeCode} - {e.name} ({e.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Bonuses (₹)
                  </label>
                  <input
                    type="number"
                    value={bonuses}
                    onChange={(e) => setBonuses(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Deductions (₹)
                  </label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Adjustment Reason (Optional)
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Festival attendance bonus"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-800 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCalcModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calcSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
                >
                  {calcSubmitting ? 'Calculating...' : 'Run Auto Calculation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
