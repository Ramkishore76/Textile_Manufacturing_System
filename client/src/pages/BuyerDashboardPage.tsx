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
      <div className="p-12 text-center text-slate-400 font-medium">
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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dedicated Buyer Command Portal</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome back, {user?.buyerCompany || user?.name}
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Real-time status monitor for your active textile manufacturing orders, roll inspections, and consignments with Everest Textile Mills.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Active Orders</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{summary.activeOrders}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Out of {summary.totalOrders} total booked</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* In Production */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">On The Looms</p>
            <p className="text-3xl font-black text-indigo-600 mt-1">{summary.inProduction}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Weaving & spinning now</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Ready to Ship */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Ready To Ship</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{summary.readyToShip}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Inspection passed 100%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Outstanding Balance</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ₹{summary.totalOutstandingBalance?.toLocaleString()}
            </p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Payable under 30-day terms</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Your Current Production Orders</h2>
              <p className="text-xs text-slate-400">Track stages from yarn allocation to dispatch</p>
            </div>
            <Link
              to="/buyer/orders"
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
            >
              <span>View All Orders</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No orders registered yet. Contact sales representative to book your manufacturing order.
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((ord: any) => (
                <div
                  key={ord.id}
                  onClick={() => navigate(`/buyer/orders/${ord.id}`)}
                  className="p-4 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/20 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{ord.orderNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.status === 'READY_TO_SHIP'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'IN_PRODUCTION'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.status === 'DISPATCHED'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {ord.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>Booked: {new Date(ord.orderDate).toLocaleDateString()}</span>
                      <span>Target Delivery: {new Date(ord.requiredDeliveryDate).toLocaleDateString()}</span>
                      <span>Total: ₹{ord.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-teal-600 font-bold text-xs">
                    <span>Track</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deliveries Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center space-x-2 text-slate-900">
            <Calendar className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-black">Delivery Schedule</h3>
          </div>
          <p className="text-xs text-slate-400">Upcoming committed warehouse delivery dates</p>

          {upcomingDeliveries.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs italic">
              No upcoming scheduled deliveries.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {upcomingDeliveries.map((del: any, idx: number) => {
                const d = new Date(del.deliveryDate);
                const isUrgent = d.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      isUrgent
                        ? 'border-amber-200 bg-amber-50/40 text-amber-900'
                        : 'border-slate-100 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold">{del.orderNumber}</div>
                      <div className="text-[10px] text-slate-500">Status: {del.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{d.toLocaleDateString()}</div>
                      <div className="text-[10px] font-semibold text-teal-700">Scheduled Dispatch</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-2">
              <span className="font-bold text-slate-700 block">Everest Mill Dispatch Assurance</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                All finished rolls undergo 4-point fabric inspection and tamper-proof barcode serialization prior to dispatch release.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
