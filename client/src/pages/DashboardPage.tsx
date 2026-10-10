import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
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
  IndianRupee,
  Layers,
  ArrowRight,
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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const machineChartData = [
    { name: 'Running', count: data?.machines?.running || 0, color: '#10b981' },
    { name: 'Idle', count: data?.machines?.idle || 0, color: '#64748b' },
    { name: 'Maintenance', count: data?.machines?.maintenance || 0, color: '#f59e0b' },
    { name: 'Breakdown', count: data?.machines?.breakdown || 0, color: '#ef4444' },
  ];

  const qualityChartData = [
    { name: 'Passed', value: data?.quality?.passedCount || 5, color: '#10b981' },
    { name: 'Rework Req', value: data?.quality?.reworkCount || 1, color: '#f59e0b' },
    { name: 'Rejected', value: data?.quality?.rejectedCount || 0, color: '#ef4444' },
  ];

  const financialBarData = [
    { name: 'Sales Revenue', amount: data?.financials?.totalInvoiced || 0 },
    { name: 'Manufacturing Cost', amount: data?.financials?.totalRecordedCost || 0 },
    { name: 'Est. Gross Profit', amount: data?.financials?.estimatedGrossProfit || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Everest Textile Operations Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time live production metrics, inventory balances, and order fulfillment status.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/app/orders')}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <span>Create New Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Orders */}
        <div
          onClick={() => navigate('/app/orders')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Orders</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{data?.orders?.active || 0}</span>
            <span className="text-xs text-slate-500">/ {data?.orders?.total || 0} total</span>
          </div>
          <div className="mt-2 flex items-center space-x-3 text-[11px]">
            {data?.orders?.delayed > 0 && (
              <span className="text-rose-600 font-semibold flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{data.orders.delayed} Delayed</span>
              </span>
            )}
            <span className="text-amber-600 font-medium">
              {data?.orders?.approachingDeadline || 0} due soon
            </span>
          </div>
        </div>

        {/* Yarn Available Stock */}
        <div
          onClick={() => navigate('/app/inventory')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Available Yarn Stock</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">
              {(data?.inventory?.availableStockKg || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">KG</span>
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Reserved: {(data?.inventory?.reservedStockKg || 0).toLocaleString()} KG</span>
            {data?.inventory?.lowStockAlertsCount > 0 ? (
              <span className="text-amber-600 font-semibold">{data.inventory.lowStockAlertsCount} Low Stock</span>
            ) : (
              <span className="text-emerald-600 font-medium">Stock Healthy</span>
            )}
          </div>
        </div>

        {/* Today's Output */}
        <div
          onClick={() => navigate('/app/production')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Fabric Output</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">
              {(data?.production?.todayProducedMeters || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">M</span>
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{data?.machines?.running || 0} Machines running right now</span>
          </div>
        </div>

        {/* Finished Goods & Dispatches */}
        <div
          onClick={() => navigate('/app/dispatch')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Finished Goods Ready</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-100 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">
              {(data?.finishedGoods?.totalMeters || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">M</span>
            </span>
            <span className="text-xs text-slate-500">({data?.finishedGoods?.rollsCount || 0} rolls)</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-700 font-semibold flex items-center space-x-1">
            <Truck className="w-3.5 h-3.5" />
            <span>{data?.orders?.pendingDispatch || 0} Orders ready for dispatch</span>
          </div>
        </div>
      </div>

      {/* Financial Health Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Recorded Invoiced Sales</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{(data?.financials?.totalInvoiced || 0).toLocaleString()}</p>
          <span className="text-[11px] text-emerald-600 font-medium">From commercial invoices</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Recorded Manufacturing Cost</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{(data?.financials?.totalRecordedCost || 0).toLocaleString()}</p>
          <span className="text-[11px] text-slate-500">Material + Power + Labour</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Estimated Gross Profit</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">₹{(data?.financials?.estimatedGrossProfit || 0).toLocaleString()}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Margin: {data?.financials?.profitMargin || 0}%</span>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Revenue vs Cost */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Financial Overview (Recorded Transactions)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialBarData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Amount']} />
                <Bar dataKey="amount" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Statuses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Live Machine Fleet Status</h2>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {machineChartData.map((m) => (
              <div key={m.name} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-center">
                <span className="text-[11px] font-medium text-slate-500 block">{m.name}</span>
                <span className="text-lg font-bold text-slate-900 mt-0.5 block">{m.count}</span>
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
    </div>
  );
};
