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

export const WagesPage: React.FC = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [wages, setWages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      loadWagesData();
    } catch (err: any) {
      alert('Status update failed: ' + err.message);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 mb-1">
            <Wallet className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Payroll & Accounts</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Labour Wages & Payroll Register</h1>
          <p className="text-sm text-slate-500 mt-1">
            Calculate accurate wages derived from daily shift logs, base pay, overtime, and bonuses
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Month & Year Selectors */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
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
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculate Wages for Staff</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Net Payroll</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-slate-900">₹{totalNetPayroll.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">For {months.find((m) => m.value === selectedMonth)?.name} {selectedYear}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Base Days Salary</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-indigo-600">₹{totalBasePay.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Standard shift hours</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Overtime Disbursed</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-purple-600">₹{totalOvertime.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Overtime incentive payout</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Settlement Status</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-emerald-600">
              {paidCount} / {wages.length}
            </span>
            <span className="text-xs font-medium text-slate-400">paid</span>
          </div>
        </div>
      </div>

      {/* Wages Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading wages register...</div>
        ) : wages.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Wage Records Generated Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Click "Calculate Wages for Staff" to auto-compile attendance and overtime into monthly wages.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {wages.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{w.employee?.employeeCode}</span>
                      <span className="font-semibold text-slate-800">{w.employee?.name}</span>
                      <span className="text-[10px] text-slate-400 block">{w.employee?.department}</span>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      ₹{w.basePay?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono text-purple-600 font-semibold">
                      ₹{w.overtimePay?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono text-emerald-600">
                      +₹{w.bonuses?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono text-rose-600">
                      -₹{w.deductions?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                      ₹{w.netWage?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-[11px] text-slate-500 line-clamp-2" title={w.calculationNotes}>
                        {w.calculationNotes}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {w.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(w.id, 'APPROVED')}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-sm transition"
                        >
                          Approve
                        </button>
                      )}
                      {w.status === 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateStatus(w.id, 'PAID')}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-sm transition"
                        >
                          Mark Paid
                        </button>
                      )}
                      {w.status === 'PAID' && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Calculate Monthly Wage</h3>
              <button
                onClick={() => setCalcModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {calcError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {calcError}
              </div>
            )}

            <form onSubmit={handleCalculateWage} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Employee *
                </label>
                <select
                  value={calcEmployeeId}
                  onChange={(e) => setCalcEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bonuses (₹)
                  </label>
                  <input
                    type="number"
                    value={bonuses}
                    onChange={(e) => setBonuses(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Deductions (₹)
                  </label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Adjustment Reason (Optional)
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Festival attendance bonus"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCalcModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calcSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
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
