import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Clock,
  Truck,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Calendar,
  AlertCircle,
  Sparkles,
  Building2,
  FileCheck2,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const BuyerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/buyer-portal/dashboard');
      setData(res);
    } catch (err: any) {
      console.error('Failed to load buyer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400 font-medium text-xs">
        Loading client portal dashboard...
      </div>
    );
  }

  const summary = data?.summary || {
    totalOrders: 0,
    activeOrders: 0,
    inProduction: 0,
    awaitingQuality: 0,
    readyToShip: 0,
    dispatched: 0,
    totalOutstandingBalance: 0,
  };

  const upcomingDeliveries = data?.upcomingDeliveries || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 mb-3">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Buyer Portal • {user?.buyerCompany || user?.name}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Welcome, {user?.buyerCompany || user?.name}
            </h1>
            <p className="text-zinc-500 text-xs mt-1 max-w-2xl">
              Live status overview for active textile manufacturing orders, roll inspections, and upcoming dispatch deliveries.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => navigate('/buyer/orders')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Orders */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Orders</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 mt-1">{summary.activeOrders}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Out of {summary.totalOrders} total booked</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* In Production */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">On The Looms</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 mt-1">{summary.inProduction}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Weaving & spinning now</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Ready to Ship */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Ready To Ship</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 mt-1">{summary.readyToShip}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Inspection passed 100%</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Outstanding Balance</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 mt-1">
              ₹{summary.totalOutstandingBalance?.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Terms: 30-day net billing</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">Your Current Production Orders</h2>
              <p className="text-xs text-zinc-500">Track stages from yarn allocation to dispatch</p>
            </div>
            <Link
              to="/buyer/orders"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs italic">
              No orders registered yet. Contact sales representative to book your manufacturing order.
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((ord: any) => (
                <div
                  key={ord.id}
                  onClick={() => navigate(`/buyer/orders/${ord.id}`)}
                  className="p-4 rounded-xl border border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50/60 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono font-bold text-zinc-900 text-xs">{ord.orderNumber}</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          ord.status === 'READY_TO_SHIP'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            : ord.status === 'IN_PRODUCTION'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/70'
                            : ord.status === 'DISPATCHED'
                            ? 'bg-zinc-100 text-zinc-800 border border-zinc-200/80'
                            : 'bg-zinc-100 text-zinc-700 border border-zinc-200/80'
                        }`}
                      >
                        {ord.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-zinc-500">
                      <span>Booked: {new Date(ord.orderDate).toLocaleDateString()}</span>
                      <span>Target Delivery: {new Date(ord.requiredDeliveryDate).toLocaleDateString()}</span>
                      <span className="font-semibold text-zinc-800">Total: ₹{ord.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-indigo-600 font-semibold text-xs">
                    <span>Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deliveries Schedule */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center space-x-2 text-zinc-900">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Delivery Schedule</h3>
              <p className="text-[11px] text-zinc-500">Upcoming committed warehouse delivery dates</p>
            </div>
          </div>

          {upcomingDeliveries.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs italic">
              No upcoming scheduled deliveries.
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {upcomingDeliveries.map((del: any, idx: number) => {
                const d = new Date(del.deliveryDate);
                const isUrgent = d.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                      isUrgent
                        ? 'border-amber-200/70 bg-amber-50/60 text-amber-900'
                        : 'border-zinc-200/80 bg-zinc-50 text-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-zinc-900">{del.orderNumber}</div>
                      <div className="text-[10px] text-zinc-500">Status: {del.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-zinc-900">{d.toLocaleDateString()}</div>
                      <div className="text-[10px] text-zinc-500">Scheduled Dispatch</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-zinc-100">
            <div className="bg-zinc-50 border border-zinc-200/80 p-3.5 rounded-xl text-xs space-y-1.5">
              <span className="font-bold text-zinc-900 block">AGT Mill Dispatch Assurance</span>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                All finished rolls undergo 4-point fabric inspection and tamper-proof barcode serialization prior to dispatch release.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
