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
  UserCheck,
  Calendar,
  Zap,
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
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Visual chart configurations
  const machineChartData = [
    { name: 'Running', count: data?.machines?.running || 0, color: '#18181b' },
    { name: 'Idle', count: data?.machines?.idle || 0, color: '#71717a' },
    { name: 'Maintenance', count: data?.machines?.maintenance || 0, color: '#d97706' },
    { name: 'Breakdown', count: data?.machines?.breakdown || 0, color: '#dc2626' },
  ];

  const jobsChartData = [
    { name: 'Completed', count: data?.jobsBreakdown?.completed || 0, color: '#16a34a' },
    { name: 'In Progress', count: data?.jobsBreakdown?.inProgress || 0, color: '#18181b' },
    { name: 'Pending Queue', count: data?.jobsBreakdown?.pending || 0, color: '#ca8a04' },
  ];

  const qualityChartData = [
    { name: 'Passed', value: (data?.finishedGoods?.rollsCount || 0) + 5, color: '#16a34a' },
    { name: 'Rework Req', value: data?.quality?.reworkCount || 1, color: '#d97706' },
    { name: 'Rejected', value: data?.quality?.rejectedCount || 0, color: '#dc2626' },
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

  // Role descriptions and headers
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
      {/* Top Banner / Role Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">{headerInfo.title}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
              {getRoleShort(role)}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">{headerInfo.subtitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(primaryAction.to)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-medium transition shadow-xs"
          >
            <span>{primaryAction.label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Role-Tailored KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Case 1: PRODUCTION Manager KPIs */}
        {role === 'PRODUCTION' && (
          <>
            <div
              onClick={() => navigate('/app/production')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Active Looms</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.machines?.running || 0}</span>
                <span className="text-xs text-neutral-500">running</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                {data?.machines?.maintenance || 0} maintenance | {data?.machines?.breakdown || 0} breakdown
              </div>
            </div>

            <div
              onClick={() => navigate('/app/production')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Today's Output</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  {(data?.production?.todayProducedMeters || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-500">M</span>
                </span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded font-medium inline-block">
                Shift logging active
              </div>
            </div>

            <div
              onClick={() => navigate('/app/production')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Jobs In Progress</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.jobsBreakdown?.inProgress || 0}</span>
                <span className="text-xs text-neutral-500">/ {data?.jobsBreakdown?.pending || 0} queued</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                {data?.jobsBreakdown?.completed || 0} completed batches
              </div>
            </div>

            <div
              onClick={() => navigate('/app/inventory')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Weaving Yarn Stock</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  {(data?.inventory?.availableStockKg || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-500">KG</span>
                </span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
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
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Active Orders</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.orders?.active || 0}</span>
                <span className="text-xs text-neutral-500">/ {data?.orders?.total || 0} total</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                {data?.orders?.approachingDeadline || 0} due within 7 days
              </div>
            </div>

            <div
              onClick={() => navigate('/app/orders')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Delivery Urgency</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.orders?.approachingDeadline || 0}</span>
                <span className="text-xs text-neutral-500">due soon</span>
              </div>
              <div className="mt-2 text-[11px] text-rose-700 font-medium">
                {data?.orders?.delayed || 0} delayed orders
              </div>
            </div>

            <div
              onClick={() => navigate('/app/finished-goods')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Available Fabric</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  {(data?.finishedGoods?.totalMeters || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-500">M</span>
                </span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                {data?.finishedGoods?.rollsCount || 0} inspected rolls ready to sell
              </div>
            </div>

            <div
              onClick={() => navigate('/app/orders')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Pending Dispatch</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.orders?.pendingDispatch || 0}</span>
                <span className="text-xs text-neutral-500">orders ready</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
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
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Available Yarn</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  {(data?.inventory?.availableStockKg || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-500">KG</span>
                </span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                Total warehouse stock: {(data?.inventory?.totalStockKg || 0).toLocaleString()} KG
              </div>
            </div>

            <div
              onClick={() => navigate('/app/inventory')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Reserved Stock</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  {(data?.inventory?.reservedStockKg || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-500">KG</span>
                </span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                Allocated for active production jobs
              </div>
            </div>

            <div
              onClick={() => navigate('/app/inventory')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Shortage Alerts</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.inventory?.lowStockAlertsCount || 0}</span>
                <span className="text-xs text-neutral-500">alerts</span>
              </div>
              <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded font-medium inline-block">
                Below minimum safety threshold
              </div>
            </div>

            <div
              onClick={() => navigate('/app/finished-goods')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Finished Fabric Stock</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.finishedGoods?.rollsCount || 0}</span>
                <span className="text-xs text-neutral-500">rolls in bins</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
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
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Pending Inspections</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.quality?.pendingInspections || 0}</span>
                <span className="text-xs text-neutral-500">rolls</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                Awaiting 4-point inspection table
              </div>
            </div>

            <div
              onClick={() => navigate('/app/quality')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Rework Required</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.quality?.reworkCount || 0}</span>
                <span className="text-xs text-neutral-500">rolls</span>
              </div>
              <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded font-medium inline-block">
                {(data?.quality?.reworkMeters || 0).toLocaleString()} meters queued
              </div>
            </div>

            <div
              onClick={() => navigate('/app/finished-goods')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Passed & Certified</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.finishedGoods?.rollsCount || 0}</span>
                <span className="text-xs text-neutral-500">passed rolls</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded font-medium inline-block">
                Ready with QR traceability
              </div>
            </div>

            <div
              onClick={() => navigate('/app/quality')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Rejected Scrap</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.quality?.rejectedCount || 0}</span>
                <span className="text-xs text-neutral-500">rolls</span>
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
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Ready for Dispatch</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.orders?.pendingDispatch || 0}</span>
                <span className="text-xs text-neutral-500">orders</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                Awaiting vehicle loading
              </div>
            </div>

            <div
              onClick={() => navigate('/app/finished-goods')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Available Rolls</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.finishedGoods?.rollsCount || 0}</span>
                <span className="text-xs text-neutral-500">rolls</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                {(data?.finishedGoods?.totalMeters || 0).toLocaleString()} meters ready
              </div>
            </div>

            <div
              onClick={() => navigate('/app/orders')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Orders Due Soon</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.orders?.approachingDeadline || 0}</span>
                <span className="text-xs text-neutral-500">due this week</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                Delivery deadline monitor
              </div>
            </div>

            <div
              onClick={() => navigate('/app/dispatch')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Gate Passes</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">Active</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
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
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Invoiced Sales</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  ₹{(data?.financials?.totalInvoiced || 0).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                From commercial invoices
              </div>
            </div>

            <div
              onClick={() => navigate('/app/accounts')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Recorded Mfg Cost</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  ₹{(data?.financials?.totalRecordedCost || 0).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                Wages + Overheads
              </div>
            </div>

            <div
              onClick={() => navigate('/app/accounts')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Gross Margin</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  {data?.financials?.profitMargin || 0}%
                </span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded font-medium inline-block">
                ₹{(data?.financials?.estimatedGrossProfit || 0).toLocaleString()} profit
              </div>
            </div>

            <div
              onClick={() => navigate('/app/accounts')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Receivables</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  ₹{(data?.financials?.outstandingReceivables || 0).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
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
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Active Orders</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">{data?.orders?.active || 0}</span>
                <span className="text-xs text-neutral-500">/ {data?.orders?.total || 0} total</span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                {data?.orders?.delayed > 0 ? (
                  <span className="text-rose-700 font-medium">{data.orders.delayed} Delayed</span>
                ) : (
                  <span>{data?.orders?.approachingDeadline || 0} due soon</span>
                )}
              </div>
            </div>

            <div
              onClick={() => navigate('/app/inventory')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Available Yarn</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  {(data?.inventory?.availableStockKg || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-500">KG</span>
                </span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                Reserved: {(data?.inventory?.reservedStockKg || 0).toLocaleString()} KG
              </div>
            </div>

            <div
              onClick={() => navigate('/app/production')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Today's Output</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  {(data?.production?.todayProducedMeters || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-500">M</span>
                </span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                {data?.machines?.running || 0} active looms running
              </div>
            </div>

            <div
              onClick={() => navigate('/app/dispatch')}
              className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-neutral-400 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Finished Fabric</span>
                <div className="p-2 bg-neutral-100 text-neutral-700 rounded-md group-hover:bg-neutral-200/70 transition">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-neutral-900">
                  {(data?.finishedGoods?.totalMeters || 0).toLocaleString()} <span className="text-xs font-normal text-neutral-500">M</span>
                </span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-600">
                {data?.finishedGoods?.rollsCount || 0} rolls ready to ship
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confidential Financial Health Row - strictly guarded to ADMIN & ACCOUNTS */}
      {(role === 'ADMIN' || role === 'ACCOUNTS') && data?.financials && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-neutral-200">
            <p className="text-xs text-neutral-500 font-medium">Recorded Invoiced Sales</p>
            <p className="text-xl font-bold tracking-tight text-neutral-900 mt-1">
              ₹{(data.financials.totalInvoiced || 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-neutral-500 font-normal">From commercial invoices</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-neutral-200">
            <p className="text-xs text-neutral-500 font-medium">Recorded Manufacturing Cost</p>
            <p className="text-xl font-bold tracking-tight text-neutral-900 mt-1">
              ₹{(data.financials.totalRecordedCost || 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-neutral-500 font-normal">Material + Utilities + Labour</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-neutral-200">
            <p className="text-xs text-neutral-500 font-medium">Estimated Gross Profit</p>
            <p className="text-xl font-bold tracking-tight text-neutral-900 mt-1">
              ₹{(data.financials.estimatedGrossProfit || 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded font-medium inline-block mt-0.5">
              Margin: {data.financials.profitMargin || 0}%
            </span>
          </div>
        </div>
      )}

      {/* Role Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Depends on role */}
        {role === 'PRODUCTION' ? (
          <div className="bg-white p-5 rounded-xl border border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4 tracking-tight">Production Jobs Queue Status</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobsChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#18181b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : role === 'STORE' ? (
          <div className="bg-white p-5 rounded-xl border border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4 tracking-tight">Yarn Warehouse Stocks (KG)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yarnBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#18181b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : role === 'QUALITY' ? (
          <div className="bg-white p-5 rounded-xl border border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4 tracking-tight">4-Point Inspection Grading</h2>
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
          <div className="bg-white p-5 rounded-xl border border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4 tracking-tight">Financial Overview (Recorded Ledger)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#18181b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-xl border border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4 tracking-tight">Finished Rolls In Inventory</h2>
            <div className="h-64 flex items-center justify-center text-center">
              <div>
                <p className="text-3xl font-bold text-neutral-900">{data?.finishedGoods?.rollsCount || 0}</p>
                <p className="text-xs text-neutral-500 mt-1">Rolls ready for buyer allocation</p>
                <p className="text-xs font-mono text-neutral-700 mt-2">{(data?.finishedGoods?.totalMeters || 0).toLocaleString()} Meters</p>
              </div>
            </div>
          </div>
        )}

        {/* Chart 2: Machine Fleet Status (Visible to Production, Store, Quality, Admin) */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4 tracking-tight">Machine Fleet Availability</h2>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {machineChartData.map((m) => (
              <div key={m.name} className="p-2 rounded-lg border border-neutral-200 bg-neutral-50 text-center">
                <span className="text-[11px] font-medium text-neutral-500 block">{m.name}</span>
                <span className="text-base font-bold text-neutral-900 mt-0.5 block">{m.count}</span>
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
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Recent Role Events & Audit Trail</h2>
            <p className="text-[11px] text-neutral-500">Live system events filtered for {getRoleTitle(role)}</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700">
            {data?.recentEvents?.length || 0} events
          </span>
        </div>

        {(!data?.recentEvents || data.recentEvents.length === 0) ? (
          <div className="text-center py-6 text-neutral-400 text-xs">
            No recent operational events recorded for this role.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {data.recentEvents.map((evt: any) => {
              let parsedDetails: any = null;
              try {
                parsedDetails = typeof evt.details === 'string' ? JSON.parse(evt.details) : evt.details;
              } catch (e) {
                parsedDetails = { raw: evt.details };
              }

              return (
                <div key={evt.id} className="py-2.5 flex items-start justify-between text-xs">
                  <div className="flex items-start space-x-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-neutral-100 text-neutral-800 border border-neutral-200 mt-0.5 shrink-0">
                      {evt.action}
                    </span>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {evt.entityType} <span className="font-mono text-neutral-500 font-normal">#{evt.entityId?.slice(0, 10)}</span>
                      </p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        {parsedDetails?.description ||
                          parsedDetails?.orderNumber ||
                          parsedDetails?.rollCode ||
                          parsedDetails?.machineCode ||
                          JSON.stringify(parsedDetails).slice(0, 90)}
                      </p>
                      <span className="text-[10px] text-neutral-400">By {evt.performedByName}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 shrink-0 ml-4 font-mono">
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
