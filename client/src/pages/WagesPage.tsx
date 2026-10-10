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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">Labour Wages & Payroll Register</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monthly payroll calculated from shift presence logs, base rates, and overtime hours.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Month & Year Selectors */}
          <div className="flex items-center space-x-2 bg-white border border-neutral-300 px-2.5 py-1.5 rounded-md text-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs text-neutral-800 focus:outline-none"
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
              className="bg-transparent text-xs text-neutral-800 focus:outline-none"
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
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculate Wages</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <p className="text-xs font-medium text-neutral-500">Total Net Payroll</p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-semibold text-neutral-900">₹{totalNetPayroll.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">For {months.find((m) => m.value === selectedMonth)?.name} {selectedYear}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <p className="text-xs font-medium text-neutral-500">Base Days Salary</p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-semibold text-neutral-900">₹{totalBasePay.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Standard shift hours</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <p className="text-xs font-medium text-neutral-500">Overtime Disbursed</p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-semibold text-neutral-900">₹{totalOvertime.toLocaleString()}</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">Overtime incentive payout</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200/80">
          <p className="text-xs font-medium text-neutral-500">Settlement Status</p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl font-semibold text-emerald-700">
              {paidCount} / {wages.length}
            </span>
            <span className="text-xs text-neutral-400">paid</span>
          </div>
        </div>
      </div>

      {/* Wages Table */}
      <div className="bg-white rounded-lg border border-neutral-200/80 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-400 text-xs font-normal">Loading wages register...</div>
        ) : wages.length === 0 ? (
          <div className="p-10 text-center">
            <Wallet className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-neutral-700">No Wage Records Generated Yet</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Click "Calculate Wages" to auto-compile attendance and overtime into monthly wages.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/40 border-b border-neutral-200/80 text-neutral-500 font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Base Pay</th>
                  <th className="py-2.5 px-4">Overtime Pay</th>
                  <th className="py-2.5 px-4">Bonuses</th>
                  <th className="py-2.5 px-4">Deductions</th>
                  <th className="py-2.5 px-4">Net Wage</th>
                  <th className="py-2.5 px-4">Audit Breakdown</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {wages.map((w) => (
                  <tr key={w.id} className="hover:bg-neutral-50/60 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium text-neutral-900 block">{w.employee?.employeeCode}</span>
                      <span className="font-medium text-neutral-800">{w.employee?.name}</span>
                      <span className="text-[10px] text-neutral-400 block">{w.employee?.department}</span>
                    </td>

                    <td className="py-3 px-4 text-neutral-800">
                      ₹{w.basePay?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-neutral-800">
                      ₹{w.overtimePay?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-neutral-800">
                      +₹{w.bonuses?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-neutral-600">
                      -₹{w.deductions?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      ₹{w.netWage?.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-[11px] text-neutral-500 line-clamp-2" title={w.calculationNotes}>
                        {w.calculationNotes}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          w.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : w.status === 'APPROVED'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200/60'
                            : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {w.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(w.id, 'APPROVED')}
                          className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition"
                        >
                          Approve
                        </button>
                      )}
                      {w.status === 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateStatus(w.id, 'PAID')}
                          className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition"
                        >
                          Mark Paid
                        </button>
                      )}
                      {w.status === 'PAID' && (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center justify-end space-x-1">
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
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <h3 className="text-sm font-semibold text-neutral-900">Calculate Monthly Wage</h3>
              <button
                onClick={() => setCalcModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {calcError && (
              <div className="mb-3 p-2.5 rounded-md bg-rose-50 border border-rose-200/60 text-rose-800 text-xs">
                {calcError}
              </div>
            )}

            <form onSubmit={handleCalculateWage} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Select Employee *
                </label>
                <select
                  value={calcEmployeeId}
                  onChange={(e) => setCalcEmployeeId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 bg-white focus:outline-none focus:border-neutral-900"
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
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Bonuses (₹)
                  </label>
                  <input
                    type="number"
                    value={bonuses}
                    onChange={(e) => setBonuses(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Deductions (₹)
                  </label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Adjustment Reason (Optional)
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Festival attendance bonus"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-300 text-xs text-neutral-800 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCalcModalOpen(false)}
                  className="px-3 py-1.5 rounded-md bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calcSubmitting}
                  className="px-4 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition"
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

