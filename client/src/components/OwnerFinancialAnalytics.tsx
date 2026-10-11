import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Printer,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Boxes,
  Users,
  Wallet,
  Cpu,
  FlaskConical,
  Wrench,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  Eye,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface CategoryItem {
  category: string;
  label: string;
  amount: number;
  color: string;
  percentage: number;
}

interface MonthItem {
  month: number;
  monthName: string;
  year: number;
  revenue: number;
  grossInvoiced: number;
  taxCollected: number;
  paidRevenue: number;
  outstandingReceivable: number;
  directExpenses: number;
  wages: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  invoiceCount: number;
  expenseCount: number;
  categoryBreakdown: Record<string, number>;
  status: 'PROFITABLE' | 'BREAKEVEN' | 'LOSS';
  recentExpenses?: any[];
}

interface AnnualItem {
  year: number;
  revenue: number;
  directExpenses: number;
  wages: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  invoicesCount: number;
  expensesCount: number;
  yoyRevenueGrowth: number;
  yoyProfitGrowth: number;
}

interface AnalyticsData {
  selectedYear: number;
  availableYears: number[];
  summary: {
    totalAnnualRevenue: number;
    totalAnnualDirectExpenses: number;
    totalAnnualWages: number;
    totalAnnualExpenses: number;
    netAnnualProfit: number;
    annualProfitMargin: number;
    totalAnnualPaidRevenue: number;
    totalAnnualOutstanding: number;
    totalAnnualTaxCollected: number;
    invoicesCount: number;
    expensesCount: number;
  };
  monthlyData: MonthItem[];
  annualComparison: AnnualItem[];
  categoryDistribution: CategoryItem[];
  kpis: {
    averageMonthlyRevenue: number;
    averageMonthlyExpense: number;
    averageMonthlyProfit: number;
    bestMonth: {
      name: string;
      month: number;
      profit: number;
      revenue: number;
    };
    highestExpenseMonth: {
      name: string;
      month: number;
      expense: number;
    };
    costToRevenueRatio: number;
    topExpenseDriver: CategoryItem;
  };
}

export const OwnerFinancialAnalytics: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMonthDetails, setSelectedMonthDetails] = useState<MonthItem | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  useEffect(() => {
    loadAnalytics(selectedYear);
  }, [selectedYear]);

  const loadAnalytics = async (year: number) => {
    setLoading(true);
    try {
      const res = await api.get<AnalyticsData>(`/reports/financial-analytics?year=${year}`);
      setData(res);
      if (res.monthlyData && res.monthlyData.length > 0) {
        // default selected month to current month if in 2026, or month with peak data
        const currentMonthIdx = new Date().getMonth();
        const active = res.monthlyData[currentMonthIdx] || res.monthlyData[8] || res.monthlyData[0];
        setSelectedMonthDetails(active);
      }
    } catch (err) {
      console.error('Failed to load financial analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
          <div className="h-32 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
          <div className="h-32 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
          <div className="h-32 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
        </div>
        <div className="h-80 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
      </div>
    );
  }

  if (!data) return null;

  // Chart data formatting
  const monthlyChartData = data.monthlyData.map((m) => ({
    name: m.monthName,
    Revenue: m.revenue,
    Expenses: m.totalExpenses,
    NetProfit: m.netProfit,
  }));

  const annualChartData = data.annualComparison.map((a) => ({
    name: `FY ${a.year}`,
    Revenue: a.revenue,
    Expenses: a.totalExpenses,
    NetProfit: a.netProfit,
  }));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ELECTRICITY_UTILITIES':
        return <Zap className="w-4 h-4 text-amber-600" />;
      case 'RAW_MATERIAL_CONSUMED':
        return <Boxes className="w-4 h-4 text-blue-600" />;
      case 'DIRECT_LABOUR':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'WAGES_PAYROLL':
        return <Wallet className="w-4 h-4 text-indigo-600" />;
      case 'MACHINE_OPERATING':
        return <Cpu className="w-4 h-4 text-pink-600" />;
      case 'DYEING_PROCESSING':
        return <FlaskConical className="w-4 h-4 text-teal-600" />;
      case 'MAINTENANCE':
        return <Wrench className="w-4 h-4 text-orange-600" />;
      default:
        return <Building2 className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Control Header Banner */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                  Plant Owner Profit & Expense Analytics
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Executive Audit
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Fiscal {selectedYear}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                Live executive ledger of monthly sales revenues, operating expense breakdowns, payroll, and net factory profit margins.
              </p>
            </div>
          </div>

          {/* Interactive Mode & Fiscal Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            {/* View Mode Toggle */}
            <div className="inline-flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 text-xs font-semibold">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'monthly'
                    ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Monthly View (12M)</span>
              </button>
              <button
                onClick={() => setViewMode('annual')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'annual'
                    ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Annual Fiscal View</span>
              </button>
            </div>

            {/* Fiscal Year Selector */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition shadow-2xs"
              >
                {data.availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Fiscal Year {yr}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Print / Export Button */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Financial Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Executive Financial Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Annual Invoiced Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-indigo-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {viewMode === 'monthly' ? `FY ${selectedYear} Revenue` : 'Total Invoiced Revenue'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold tracking-tight text-zinc-900">
              ₹{data.summary.totalAnnualRevenue.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
            <span>{data.summary.invoicesCount} Invoices issued</span>
            <span className="text-emerald-700 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              Realized
            </span>
          </div>
        </div>

        {/* KPI 2: Total Manufacturing Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-amber-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {viewMode === 'monthly' ? `FY ${selectedYear} Expenses` : 'Total Operating Costs'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold tracking-tight text-zinc-900">
              ₹{data.summary.totalAnnualExpenses.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
            <span>Direct: ₹{data.summary.totalAnnualDirectExpenses.toLocaleString()}</span>
            <span>Wages: ₹{data.summary.totalAnnualWages.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 3: Net Operating Profit */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {viewMode === 'monthly' ? `FY ${selectedYear} Net Profit` : 'Annual Net Operating Profit'}
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                data.summary.netAnnualProfit >= 0
                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                  : 'bg-rose-50 border border-rose-100 text-rose-600'
              }`}
            >
              {data.summary.netAnnualProfit >= 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span
              className={`text-2xl font-extrabold tracking-tight ${
                data.summary.netAnnualProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              ₹{data.summary.netAnnualProfit.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span
              className={`px-2 py-0.5 rounded-full font-semibold border ${
                data.summary.netAnnualProfit >= 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border-rose-200/60'
              }`}
            >
              Margin: {data.summary.annualProfitMargin}%
            </span>
            <span className="text-zinc-500 font-medium">Net of all bills</span>
          </div>
        </div>

        {/* KPI 4: Plant Cost Efficiency / Burn Rate */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-purple-200 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Operating Efficiency
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold tracking-tight text-zinc-900">
              {data.kpis.costToRevenueRatio}%
            </span>
            <span className="text-xs text-zinc-500 font-medium">Cost / Revenue</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 font-medium truncate">
            Top Cost Driver:{' '}
            <span className="font-semibold text-zinc-800">
              {data.kpis.topExpenseDriver?.label || 'Utilities'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart (2 cols): Monthly or Annual Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-2">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                {viewMode === 'monthly'
                  ? `Fiscal Year ${selectedYear} Monthly Revenue, Expenses & Net Profit`
                  : 'Multi-Year Fiscal Comparison (YoY Operating Performance)'}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {viewMode === 'monthly'
                  ? 'Comparative trend across all 12 calendar months with net operating margin tracking'
                  : 'Year-over-year revenue growth and expenditure trajectory across fiscal cycles'}
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="flex items-center space-x-1.5 text-indigo-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block"></span>
                <span>Revenue</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
                <span>Expenses</span>
              </span>
              <span className="flex items-center space-x-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                <span>Net Profit</span>
              </span>
            </div>
          </div>

          <div className="h-72 mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={viewMode === 'monthly' ? monthlyChartData : annualChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${val / 1000}k`}`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="NetProfit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Distribution (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                  Expense Cost Categories
                </h3>
                <p className="text-[11px] text-zinc-500">Distribution of FY {selectedYear} costs</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                ₹{data.summary.totalAnnualExpenses.toLocaleString()}
              </span>
            </div>

            {/* Donut Chart */}
            <div className="h-44 mt-3 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryDistribution}
                    dataKey="amount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {data.categoryDistribution.map((entry, index) => (
                      <Cell key={`cat-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e4e4e7',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category List */}
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
            {data.categoryDistribution.map((cat) => (
              <div
                key={cat.category}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-50/70 hover:bg-zinc-100/70 transition text-xs"
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  ></div>
                  <span className="font-semibold text-zinc-800 text-[11px]">{cat.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-zinc-900 text-[11px]">
                    ₹{cat.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-1.5">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Ledger Table View: Monthly vs Annual */}
      {viewMode === 'monthly' ? (
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                12-Month Calendar Ledger ({selectedYear})
              </h3>
              <p className="text-[11px] text-zinc-500">
                Month-by-month financial statement. Click on any month row to view detailed vouchers and records.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Profitable
              </span>
              <span className="flex items-center gap-1 ml-3">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Deficit
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50/90 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">Invoiced Revenue</th>
                  <th className="py-3 px-4 text-right">Operating Expenses</th>
                  <th className="py-3 px-4 text-right">Labour Wages</th>
                  <th className="py-3 px-4 text-right">Total Outflow</th>
                  <th className="py-3 px-4 text-right">Net Operating Profit</th>
                  <th className="py-3 px-4 text-center">Margin %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {data.monthlyData.map((m) => {
                  const isSelected = selectedMonthDetails?.month === m.month;
                  return (
                    <tr
                      key={m.month}
                      onClick={() => setSelectedMonthDetails(m)}
                      className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/60 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-zinc-900 flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 text-xs font-bold">
                          {m.monthName}
                        </span>
                        <span>{selectedYear}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-zinc-900">
                        {m.revenue > 0 ? `₹${m.revenue.toLocaleString()}` : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right text-zinc-700">
                        {m.directExpenses > 0 ? `₹${m.directExpenses.toLocaleString()}` : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right text-zinc-700">
                        {m.wages > 0 ? `₹${m.wages.toLocaleString()}` : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-amber-800">
                        {m.totalExpenses > 0 ? `₹${m.totalExpenses.toLocaleString()}` : <span className="text-zinc-300">—</span>}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          m.netProfit > 0
                            ? 'text-emerald-700'
                            : m.netProfit < 0
                            ? 'text-rose-700'
                            : 'text-zinc-400'
                        }`}
                      >
                        {m.revenue > 0 || m.totalExpenses > 0
                          ? `₹${m.netProfit.toLocaleString()}`
                          : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            m.profitMargin >= 20
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.profitMargin > 0
                              ? 'bg-amber-50 text-amber-700'
                              : m.profitMargin < 0
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-zinc-100 text-zinc-500'
                          }`}
                        >
                          {m.profitMargin}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            m.status === 'PROFITABLE'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                              : m.status === 'LOSS'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200/60'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMonthDetails(m);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Selected Month Deep-Dive Drawer */}
          {selectedMonthDetails && (
            <div className="p-6 bg-zinc-50/80 border-t border-zinc-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {selectedMonthDetails.monthName}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">
                      {selectedMonthDetails.monthName} {selectedYear} Operational Cost Ledger
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      Invoices Issued: {selectedMonthDetails.invoiceCount} • Expense Vouchers: {selectedMonthDetails.expenseCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-zinc-600">
                    Gross Margin:{' '}
                    <strong className="text-zinc-900">{selectedMonthDetails.profitMargin}%</strong>
                  </span>
                  <span className="text-zinc-600">
                    Net Profit:{' '}
                    <strong
                      className={
                        selectedMonthDetails.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }
                    >
                      ₹{selectedMonthDetails.netProfit.toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Month category breakdown pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {Object.entries(selectedMonthDetails.categoryBreakdown).map(([cat, amt]) => {
                  if (amt === 0) return null;
                  return (
                    <div
                      key={cat}
                      className="bg-white p-3 rounded-xl border border-zinc-200/80 shadow-2xs flex items-center space-x-2.5"
                    >
                      <div className="p-1.5 bg-zinc-50 rounded-lg">{getCategoryIcon(cat)}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-500 font-medium truncate">
                          {cat.replace('_', ' ')}
                        </p>
                        <p className="text-xs font-bold text-zinc-900">₹{amt.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vouchers list for month */}
              {selectedMonthDetails.recentExpenses && selectedMonthDetails.recentExpenses.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">
                    Recorded Vouchers for {selectedMonthDetails.monthName}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedMonthDetails.recentExpenses.map((exp: any) => (
                      <div
                        key={exp.id}
                        className="bg-white p-3 rounded-xl border border-zinc-200/80 text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-zinc-900">{exp.expenseNumber}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700">
                              {exp.categoryLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate max-w-xs">{exp.description}</p>
                        </div>
                        <span className="font-bold text-zinc-900 text-sm">₹{exp.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Annual Fiscal Comparison View */
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-zinc-200/80">
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              Multi-Year Fiscal Comparison (FY 2024 - FY 2026)
            </h3>
            <p className="text-[11px] text-zinc-500">
              Annual consolidated turnover, total manufacturing expenditures, net profit, and year-over-year expansion metrics.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50/90 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Fiscal Year</th>
                  <th className="py-3 px-4 text-right">Annual Turnover (Revenue)</th>
                  <th className="py-3 px-4 text-right">YoY Revenue Growth</th>
                  <th className="py-3 px-4 text-right">Direct Expenses</th>
                  <th className="py-3 px-4 text-right">Total Labour Payroll</th>
                  <th className="py-3 px-4 text-right">Total Expenses</th>
                  <th className="py-3 px-4 text-right">Net Operating Profit</th>
                  <th className="py-3 px-4 text-right">YoY Profit Growth</th>
                  <th className="py-3 px-4 text-center">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {data.annualComparison.map((yr) => (
                  <tr key={yr.year} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-4 px-4 font-bold text-zinc-900 flex items-center space-x-2">
                      <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        FY
                      </span>
                      <span className="text-sm">{yr.year}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-zinc-900 text-sm">
                      ₹{yr.revenue.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">
                      {yr.yoyRevenueGrowth > 0 ? (
                        <span className="text-emerald-700 inline-flex items-center">
                          <ArrowUpRight className="w-3.5 h-3.5" /> +{yr.yoyRevenueGrowth}%
                        </span>
                      ) : yr.yoyRevenueGrowth < 0 ? (
                        <span className="text-rose-700 inline-flex items-center">
                          <ArrowDownRight className="w-3.5 h-3.5" /> {yr.yoyRevenueGrowth}%
                        </span>
                      ) : (
                        <span className="text-zinc-400">Baseline</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right text-zinc-700">
                      ₹{yr.directExpenses.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-zinc-700">
                      ₹{yr.wages.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-amber-800">
                      ₹{yr.totalExpenses.toLocaleString()}
                    </td>
                    <td
                      className={`py-4 px-4 text-right font-extrabold text-sm ${
                        yr.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      ₹{yr.netProfit.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">
                      {yr.yoyProfitGrowth > 0 ? (
                        <span className="text-emerald-700 inline-flex items-center">
                          <ArrowUpRight className="w-3.5 h-3.5" /> +{yr.yoyProfitGrowth}%
                        </span>
                      ) : yr.yoyProfitGrowth < 0 ? (
                        <span className="text-rose-700 inline-flex items-center">
                          <ArrowDownRight className="w-3.5 h-3.5" /> {yr.yoyProfitGrowth}%
                        </span>
                      ) : (
                        <span className="text-zinc-400">Baseline</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          yr.profitMargin >= 20
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : yr.profitMargin > 0
                            ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {yr.profitMargin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Financial Statement Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl border border-zinc-200 print:m-0 print:p-0 print:border-none print:shadow-none">
            {/* Modal Header for Screen */}
            <div className="flex items-center justify-between pb-6 border-b border-zinc-200 print:hidden">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-bold text-zinc-900">
                  Print Financial Statement (FY {selectedYear})
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Send to Printer / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="mt-6 space-y-6 text-zinc-900">
              {/* Plant Brand Header */}
              <div className="flex items-center justify-between pb-6 border-b-2 border-zinc-800">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-white border border-zinc-300 p-1 flex items-center justify-center">
                    <img src="/logo.png" alt="AGT Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 uppercase">
                      AGT Textile Mills Pvt Ltd
                    </h1>
                    <p className="text-xs text-zinc-600">
                      Weaving, Spinning & Dyeing Divisions • Tirupur, Tamil Nadu, India
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      GSTIN: 33AAACG1234F1Z9 • CIN: U17111TZ2020PTC028811
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800 border border-zinc-300">
                    EXECUTIVE FINANCIAL AUDIT
                  </span>
                  <p className="text-xs text-zinc-600 mt-2 font-medium">
                    Fiscal Year: <strong>2026 - 2027</strong>
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Document Sub-title */}
              <div>
                <h2 className="text-base font-bold text-zinc-900">
                  Annual & Monthly Financial Statement of Profit, Loss and Manufacturing Expenditure
                </h2>
                <p className="text-xs text-zinc-600">
                  Certified operational report compiled directly from factory ERP accounting ledgers.
                </p>
              </div>

              {/* Summary Scorecard Table */}
              <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <div>
                  <p className="text-[11px] text-zinc-500 font-semibold uppercase">Total Turnover</p>
                  <p className="text-lg font-bold text-zinc-900 mt-1">₹{data.summary.totalAnnualRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 font-semibold uppercase">Operating Outflow</p>
                  <p className="text-lg font-bold text-zinc-900 mt-1">₹{data.summary.totalAnnualExpenses.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 font-semibold uppercase">Net Operating Profit</p>
                  <p className="text-lg font-bold text-emerald-700 mt-1">₹{data.summary.netAnnualProfit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 font-semibold uppercase">Profit Margin</p>
                  <p className="text-lg font-bold text-zinc-900 mt-1">{data.summary.annualProfitMargin}%</p>
                </div>
              </div>

              {/* Printable Ledger Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Monthly Fiscal Ledger (12 Months FY {selectedYear})
                </h3>
                <table className="w-full text-xs text-left border border-zinc-300 border-collapse">
                  <thead className="bg-zinc-100 border-b border-zinc-300 font-bold text-zinc-800">
                    <tr>
                      <th className="p-2 border-r border-zinc-300">Month</th>
                      <th className="p-2 border-r border-zinc-300 text-right">Invoiced Revenue (₹)</th>
                      <th className="p-2 border-r border-zinc-300 text-right">Manufacturing Expenses (₹)</th>
                      <th className="p-2 border-r border-zinc-300 text-right">Wages & Salaries (₹)</th>
                      <th className="p-2 border-r border-zinc-300 text-right">Total Outflow (₹)</th>
                      <th className="p-2 border-r border-zinc-300 text-right">Net Profit (₹)</th>
                      <th className="p-2 text-center">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {data.monthlyData.map((m) => (
                      <tr key={m.month}>
                        <td className="p-2 border-r border-zinc-200 font-semibold">{m.monthName} {selectedYear}</td>
                        <td className="p-2 border-r border-zinc-200 text-right">₹{m.revenue.toLocaleString()}</td>
                        <td className="p-2 border-r border-zinc-200 text-right">₹{m.directExpenses.toLocaleString()}</td>
                        <td className="p-2 border-r border-zinc-200 text-right">₹{m.wages.toLocaleString()}</td>
                        <td className="p-2 border-r border-zinc-200 text-right font-medium">₹{m.totalExpenses.toLocaleString()}</td>
                        <td className="p-2 border-r border-zinc-200 text-right font-bold text-zinc-900">₹{m.netProfit.toLocaleString()}</td>
                        <td className="p-2 text-center font-semibold">{m.profitMargin}%</td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-100 font-bold border-t-2 border-zinc-400">
                      <td className="p-2 border-r border-zinc-300">ANNUAL TOTALS</td>
                      <td className="p-2 border-r border-zinc-300 text-right">₹{data.summary.totalAnnualRevenue.toLocaleString()}</td>
                      <td className="p-2 border-r border-zinc-300 text-right">₹{data.summary.totalAnnualDirectExpenses.toLocaleString()}</td>
                      <td className="p-2 border-r border-zinc-300 text-right">₹{data.summary.totalAnnualWages.toLocaleString()}</td>
                      <td className="p-2 border-r border-zinc-300 text-right">₹{data.summary.totalAnnualExpenses.toLocaleString()}</td>
                      <td className="p-2 border-r border-zinc-300 text-right text-emerald-800">₹{data.summary.netAnnualProfit.toLocaleString()}</td>
                      <td className="p-2 text-center text-emerald-800">{data.summary.annualProfitMargin}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures & Certification */}
              <div className="pt-10 flex items-center justify-between border-t border-zinc-300 mt-8">
                <div>
                  <p className="text-xs font-bold text-zinc-900">Prepared By:</p>
                  <p className="text-xs text-zinc-600 mt-1">Accounts & Commercial Department</p>
                  <p className="text-[10px] text-zinc-400">AGT Textile Mills ERP System</p>
                </div>
                <div className="text-right">
                  <div className="inline-block border-b-2 border-zinc-400 pb-1 mb-1 w-48">
                    <p className="font-serif italic text-sm text-zinc-700">Rajendran Murthy</p>
                  </div>
                  <p className="text-xs font-bold text-zinc-900">Rajendran Murthy (Plant Owner)</p>
                  <p className="text-[10px] text-zinc-500">Executive Director • AGT Textile Mills</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
