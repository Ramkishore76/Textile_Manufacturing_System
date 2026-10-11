import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { getRoleTitle, getRoleShort, getRolePrimaryAction } from '../utils/permissions';
import {
  ShoppingBag,
  Boxes,
  Cpu,
  ShieldCheck,
  Truck,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowRight,
  Activity,
  Zap,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const role = user?.role || 'ADMIN';
  const primaryAction = getRolePrimaryAction(role);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const metrics = await api.get<any>('/reports/dashboard');
        setData(metrics);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [role]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
          <div className="h-32 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
          <div className="h-32 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
          <div className="h-32 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
          <div className="h-72 rounded-2xl bg-zinc-100 shimmer-block border border-zinc-200"></div>
        </div>
      </div>
    );
  }

  // Visual chart configurations
  const machineChartData = [
    { name: 'Running', count: data?.machines?.running || 0, color: '#4f46e5' },
    { name: 'Idle', count: data?.machines?.idle || 0, color: '#a1a1aa' },
    { name: 'Maintenance', count: data?.machines?.maintenance || 0, color: '#f59e0b' },
    { name: 'Breakdown', count: data?.machines?.breakdown || 0, color: '#ef4444' },
  ];

  const jobsChartData = [
    { name: 'Completed', count: data?.jobsBreakdown?.completed || 0, color: '#10b981' },
    { name: 'In Progress', count: data?.jobsBreakdown?.inProgress || 0, color: '#4f46e5' },
    { name: 'Pending Queue', count: data?.jobsBreakdown?.pending || 0, color: '#f59e0b' },
  ];

  const qualityChartData = [
    { name: 'Passed', value: (data?.finishedGoods?.rollsCount || 0) + 5, color: '#10b981' },
    { name: 'Rework Req', value: data?.quality?.reworkCount || 1, color: '#f59e0b' },
    { name: 'Rejected', value: data?.quality?.rejectedCount || 0, color: '#ef4444' },
  ];

  const financialBarData = data?.financials
    ? [
        { name: 'Sales Revenue', amount: data.financials.totalInvoiced || 0 },
        { name: 'Mfg Cost', amount: data.financials.totalRecordedCost || 0 },
        { name: 'Gross Profit', amount: data.financials.estimatedGrossProfit || 0 },
      ]
    : [];

  const yarnBarData = (data?.yarnsDistribution || []).map((y: any) => ({
    name: y.name,
    stock: y.stockKg,
  }));

  const getRoleHeaderInfo = () => {
    switch (role) {
      case 'PRODUCTION':
        return {
          title: 'Production Operations & Machine Fleet',
          subtitle: 'Real-time loom tracking, hourly weaving logs, job queues, and roll generation.',
        };
      case 'SALES':
        return {
          title: 'Sales & Customer Fulfillment Desk',
          subtitle: 'Buyer customer orders, delivery deadlines, and fabric stock availability.',
        };
      case 'STORE':
        return {
          title: 'Yarn Material Inventory & Warehouse',
          subtitle: 'Raw material stock levels, shortage alerts, and goods inward (GRN) records.',
        };
      case 'QUALITY':
        return {
          title: 'Quality Assurance & 4-Point Inspection Desk',
          subtitle: 'Fabric defect grading, rework routing, and roll release certification.',
        };
      case 'DISPATCH':
        return {
          title: 'Logistics, Packing & Shipping Center',
          subtitle: 'Passed fabric rolls, pending buyer consignments, and transport dispatch.',
        };
      case 'ACCOUNTS':
        return {
          title: 'Commercial Ledger & HR Wages Administration',
          subtitle: 'Tax invoices, payment remittances, shift attendance, and payroll registers.',
        };
      case 'ADMIN':
      default:
        return {
          title: 'Factory Operations & Plant Executive Overview',
          subtitle: 'Full-spectrum manufacturing metrics, machine fleet availability, and financial health.',
        };
    }
  };

  const headerInfo = getRoleHeaderInfo();

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner Card (IT Task Manager Hero Style) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                  Welcome back, {user?.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {getRoleTitle(role)}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-center">
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 font-medium">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Shift Active • Oct 2026</span>
            </div>
            <button
              onClick={() => navigate(primaryAction.to)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <span>{primaryAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Role-Tailored KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Case 1: PRODUCTION Manager KPIs */}
        {role === 'PRODUCTION' && (
          <>
            <div
              onClick={() => navigate('/app/production')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Looms</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition">
                  <Zap className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.machines?.running || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">running</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                {data?.machines?.maintenance || 0} maintenance • {data?.machines?.breakdown || 0} breakdown
              </div>
            </div>

            <div
              onClick={() => navigate('/app/production')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Today's Fabric Output</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  {(data?.production?.todayProducedMeters || 0).toLocaleString()}
                </span>
                <span className="text-xs font-medium text-zinc-500">Meters</span>
              </div>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Shift pick rate on target
              </div>
            </div>

            <div
              onClick={() => navigate('/app/production')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Jobs In Progress</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.jobsBreakdown?.inProgress || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">/ {data?.jobsBreakdown?.pending || 0} queued</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                {data?.jobsBreakdown?.completed || 0} completed batches
              </div>
            </div>

            <div
              onClick={() => navigate('/app/inventory')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Yarn Available</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  {(data?.inventory?.availableStockKg || 0).toLocaleString()}
                </span>
                <span className="text-xs font-medium text-zinc-500">KG</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                Reserved: {(data?.inventory?.reservedStockKg || 0).toLocaleString()} KG
              </div>
            </div>
          </>
        )}

        {/* Case 2: SALES Staff KPIs */}
        {role === 'SALES' && (
          <>
            <div
              onClick={() => navigate('/app/orders')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Orders</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.orders?.active || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">/ {data?.orders?.total || 0} total</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                {data?.orders?.approachingDeadline || 0} due within 7 days
              </div>
            </div>

            <div
              onClick={() => navigate('/app/orders')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Delivery Urgency</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.orders?.approachingDeadline || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">due soon</span>
              </div>
              <div className="mt-2 text-[11px] text-rose-700 font-medium">
                {data?.orders?.delayed || 0} delayed orders
              </div>
            </div>

            <div
              onClick={() => navigate('/app/finished-goods')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Available Fabric</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  {(data?.finishedGoods?.totalMeters || 0).toLocaleString()}
                </span>
                <span className="text-xs font-medium text-zinc-500">Meters</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                {data?.finishedGoods?.rollsCount || 0} inspected rolls ready to sell
              </div>
            </div>

            <div
              onClick={() => navigate('/app/orders')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pending Dispatch</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.orders?.pendingDispatch || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">orders ready</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                Fulfillment queue updated
              </div>
            </div>
          </>
        )}

        {/* Case 3: STORE Manager KPIs */}
        {role === 'STORE' && (
          <>
            <div
              onClick={() => navigate('/app/inventory')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Available Yarn</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  {(data?.inventory?.availableStockKg || 0).toLocaleString()}
                </span>
                <span className="text-xs font-medium text-zinc-500">KG</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                Total warehouse: {(data?.inventory?.totalStockKg || 0).toLocaleString()} KG
              </div>
            </div>

            <div
              onClick={() => navigate('/app/inventory')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Reserved Stock</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  {(data?.inventory?.reservedStockKg || 0).toLocaleString()}
                </span>
                <span className="text-xs font-medium text-zinc-500">KG</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                Allocated for active jobs
              </div>
            </div>

            <div
              onClick={() => navigate('/app/inventory')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Shortage Alerts</span>
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.inventory?.lowStockAlertsCount || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">alerts</span>
              </div>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                Below safety threshold
              </div>
            </div>

            <div
              onClick={() => navigate('/app/finished-goods')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Finished Rolls</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.finishedGoods?.rollsCount || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">rolls in bins</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                {(data?.finishedGoods?.totalMeters || 0).toLocaleString()} meters ready
              </div>
            </div>
          </>
        )}

        {/* Case 4: QUALITY Inspector KPIs */}
        {role === 'QUALITY' && (
          <>
            <div
              onClick={() => navigate('/app/quality')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pending Inspections</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.quality?.pendingInspections || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">rolls</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                Awaiting 4-point inspection table
              </div>
            </div>

            <div
              onClick={() => navigate('/app/quality')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Rework Required</span>
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.quality?.reworkCount || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">rolls</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                {(data?.quality?.reworkMeters || 0).toLocaleString()} meters queued
              </div>
            </div>

            <div
              onClick={() => navigate('/app/finished-goods')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Passed & Certified</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.finishedGoods?.rollsCount || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">passed rolls</span>
              </div>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Ready with QR traceability
              </div>
            </div>

            <div
              onClick={() => navigate('/app/quality')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Rejected Scrap</span>
                <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 flex items-center justify-center group-hover:bg-zinc-200 transition">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.quality?.rejectedCount || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">rolls</span>
              </div>
              <div className="mt-2 text-[11px] text-rose-700 font-medium">
                {(data?.quality?.rejectedMeters || 0).toLocaleString()} meters rejected
              </div>
            </div>
          </>
        )}

        {/* Case 5: DISPATCH Staff KPIs */}
        {role === 'DISPATCH' && (
          <>
            <div
              onClick={() => navigate('/app/dispatch')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ready for Dispatch</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.orders?.pendingDispatch || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">orders</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                Awaiting vehicle loading
              </div>
            </div>

            <div
              onClick={() => navigate('/app/finished-goods')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Available Rolls</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.finishedGoods?.rollsCount || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">rolls</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                {(data?.finishedGoods?.totalMeters || 0).toLocaleString()} meters ready
              </div>
            </div>

            <div
              onClick={() => navigate('/app/orders')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Orders Due Soon</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.orders?.approachingDeadline || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">due this week</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                Delivery deadline monitor
              </div>
            </div>

            <div
              onClick={() => navigate('/app/dispatch')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gate Passes</span>
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center group-hover:bg-teal-100 transition">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">Active</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                Vehicle tracking active
              </div>
            </div>
          </>
        )}

        {/* Case 6: ACCOUNTS / HR KPIs */}
        {role === 'ACCOUNTS' && (
          <>
            <div
              onClick={() => navigate('/app/accounts')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Invoiced Sales</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  ₹{(data?.financials?.totalInvoiced || 0).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                From commercial invoices
              </div>
            </div>

            <div
              onClick={() => navigate('/app/accounts')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Recorded Mfg Cost</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  ₹{(data?.financials?.totalRecordedCost || 0).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                Wages + Overheads
              </div>
            </div>

            <div
              onClick={() => navigate('/app/accounts')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gross Margin</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  {data?.financials?.profitMargin || 0}%
                </span>
              </div>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                ₹{(data?.financials?.estimatedGrossProfit || 0).toLocaleString()} profit
              </div>
            </div>

            <div
              onClick={() => navigate('/app/accounts')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Receivables</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  ₹{(data?.financials?.outstandingReceivables || 0).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                Outstanding buyer balance
              </div>
            </div>
          </>
        )}

        {/* Case 7: ADMIN Plant Executive KPIs */}
        {role === 'ADMIN' && (
          <>
            <div
              onClick={() => navigate('/app/orders')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Orders</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">{data?.orders?.active || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">/ {data?.orders?.total || 0} total</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                {data?.orders?.delayed > 0 ? (
                  <span className="text-rose-700 font-semibold">{data.orders.delayed} Delayed</span>
                ) : (
                  <span>{data?.orders?.approachingDeadline || 0} due soon</span>
                )}
              </div>
            </div>

            <div
              onClick={() => navigate('/app/inventory')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Available Yarn</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  {(data?.inventory?.availableStockKg || 0).toLocaleString()}
                </span>
                <span className="text-xs font-medium text-zinc-500">KG</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                Reserved: {(data?.inventory?.reservedStockKg || 0).toLocaleString()} KG
              </div>
            </div>

            <div
              onClick={() => navigate('/app/production')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Today's Output</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  {(data?.production?.todayProducedMeters || 0).toLocaleString()}
                </span>
                <span className="text-xs font-medium text-zinc-500">Meters</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                {data?.machines?.running || 0} active looms running
              </div>
            </div>

            <div
              onClick={() => navigate('/app/dispatch')}
              className="bg-white p-5 rounded-2xl border border-zinc-200/80 hover:border-indigo-200 hover:shadow-xs cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Finished Fabric</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                  {(data?.finishedGoods?.totalMeters || 0).toLocaleString()}
                </span>
                <span className="text-xs font-medium text-zinc-500">Meters</span>
              </div>
              <div className="mt-2 text-[11px] text-zinc-600 font-medium">
                {data?.finishedGoods?.rollsCount || 0} rolls ready to ship
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confidential Financial Health Row - strictly guarded to ADMIN & ACCOUNTS */}
      {(role === 'ADMIN' || role === 'ACCOUNTS') && data?.financials && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Plant Owner Financial Governance
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Live Audit
              </span>
            </div>
            <button
              onClick={() => navigate('/app/accounts?tab=analytics')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Monthly & Annual Profit Explorer</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Recorded Invoiced Sales</p>
              <p className="text-2xl font-extrabold tracking-tight text-zinc-900 mt-1">
                ₹{(data.financials.totalInvoiced || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-zinc-500 font-normal">From commercial tax invoices</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Recorded Manufacturing Cost</p>
              <p className="text-2xl font-extrabold tracking-tight text-zinc-900 mt-1">
                ₹{(data.financials.totalRecordedCost || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-zinc-500 font-normal">Material + Utilities + Labour</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Estimated Gross Profit</p>
              <p className="text-2xl font-extrabold tracking-tight text-zinc-900 mt-1">
                ₹{(data.financials.estimatedGrossProfit || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-semibold inline-block mt-1">
                Margin: {data.financials.profitMargin || 0}%
              </span>
            </div>
          </div>
        </div>
      )}


      {/* Role Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Depends on role */}
        {role === 'PRODUCTION' ? (
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Production Jobs Queue Status</h2>
                <p className="text-[11px] text-zinc-500">Breakdown of weaving & spinning job batches</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Live Queue
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobsChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : role === 'STORE' ? (
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Yarn Warehouse Stocks (KG)</h2>
                <p className="text-[11px] text-zinc-500">Current stock availability by yarn specification</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                Warehouse Ledger
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yarnBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : role === 'QUALITY' ? (
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 tracking-tight">4-Point Inspection Grading</h2>
                <p className="text-[11px] text-zinc-500">Fabric rolls certification & defect distribution</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                ASTM D5430
              </span>
            </div>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={qualityChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {qualityChartData.map((entry, index) => (
                      <Cell key={`qc-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (role === 'ADMIN' || role === 'ACCOUNTS') ? (
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Financial Overview (Recorded Ledger)</h2>
                <p className="text-[11px] text-zinc-500">Revenue, manufacturing cost and gross margins</p>
              </div>
              <button
                onClick={() => navigate('/app/accounts?tab=analytics')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 flex items-center space-x-1 transition cursor-pointer"
              >
                <span>Monthly & Annual Profit Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-zinc-900 mb-4 tracking-tight">Finished Rolls In Inventory</h2>
            <div className="h-64 flex items-center justify-center text-center">
              <div>
                <p className="text-4xl font-extrabold text-zinc-900">{data?.finishedGoods?.rollsCount || 0}</p>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Rolls ready for buyer allocation</p>
                <p className="text-xs font-mono text-indigo-600 font-semibold mt-2">
                  {(data?.finishedGoods?.totalMeters || 0).toLocaleString()} Meters
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chart 2: Machine Fleet Status */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Machine Fleet Availability</h2>
              <p className="text-[11px] text-zinc-500">Real-time loom and spinning frame operational states</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700">
              Fleet Monitor
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {machineChartData.map((m) => (
              <div key={m.name} className="p-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50 text-center">
                <span className="text-[11px] font-semibold text-zinc-500 block">{m.name}</span>
                <span className="text-lg font-bold text-zinc-900 mt-0.5 block">{m.count}</span>
              </div>
            ))}
          </div>
          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={machineChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                  {machineChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Role Operational Events & Activity Stream */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Recent Role Events & Audit Trail</h2>
              <p className="text-[11px] text-zinc-500">Live system events filtered for {getRoleTitle(role)}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            {data?.recentEvents?.length || 0} events
          </span>
        </div>

        {(!data?.recentEvents || data.recentEvents.length === 0) ? (
          <div className="text-center py-8 text-zinc-400 text-xs font-medium">
            No recent operational events recorded for this role.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {data.recentEvents.map((evt: any) => {
              let parsedDetails: any = null;
              try {
                parsedDetails = typeof evt.details === 'string' ? JSON.parse(evt.details) : evt.details;
              } catch (e) {
                parsedDetails = { raw: evt.details };
              }

              return (
                <div key={evt.id} className="py-3 flex items-start justify-between text-xs hover:bg-zinc-50/60 rounded-xl px-2 transition">
                  <div className="flex items-start space-x-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/70 mt-0.5 shrink-0">
                      {evt.action}
                    </span>
                    <div>
                      <p className="font-semibold text-zinc-900">
                        {evt.entityType} <span className="font-mono text-zinc-500 font-normal">#{evt.entityId?.slice(0, 10)}</span>
                      </p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">
                        {parsedDetails?.description ||
                          parsedDetails?.orderNumber ||
                          parsedDetails?.rollCode ||
                          parsedDetails?.machineCode ||
                          JSON.stringify(parsedDetails).slice(0, 90)}
                      </p>
                      <span className="text-[10px] text-zinc-400">Recorded by {evt.performedByName}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0 ml-4 font-mono">
                    {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
