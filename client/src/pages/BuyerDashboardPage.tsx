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
      {/* Welcome Card */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 mb-2.5">
              <Building2 className="w-3 h-3 text-neutral-500" />
              <span>Buyer Portal • {user?.buyerCompany || user?.name}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Welcome, {user?.buyerCompany || user?.name}
            </h1>
            <p className="text-neutral-500 text-xs mt-1 max-w-2xl">
              Live status overview for active textile manufacturing orders, roll inspections, and upcoming dispatch deliveries.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => navigate('/buyer/orders')}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-medium transition"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Orders */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Active Orders</p>
            <p className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">{summary.activeOrders}</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Out of {summary.totalOrders} total booked</p>
          </div>
          <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* In Production */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">On The Looms</p>
            <p className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">{summary.inProduction}</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Weaving & spinning now</p>
          </div>
          <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Ready to Ship */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Ready To Ship</p>
            <p className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">{summary.readyToShip}</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Inspection passed 100%</p>
          </div>
          <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Outstanding Balance</p>
            <p className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
              ₹{summary.totalOutstandingBalance?.toLocaleString()}
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Terms: 30-day net billing</p>
          </div>
          <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">Your Current Production Orders</h2>
              <p className="text-xs text-neutral-500">Track stages from yarn allocation to dispatch</p>
            </div>
            <Link
              to="/buyer/orders"
              className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-xs italic">
              No orders registered yet. Contact sales representative to book your manufacturing order.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentOrders.map((ord: any) => (
                <div
                  key={ord.id}
                  onClick={() => navigate(`/buyer/orders/${ord.id}`)}
                  className="p-3.5 rounded-lg border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/70 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-neutral-900 text-xs">{ord.orderNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          ord.status === 'READY_TO_SHIP'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                            : ord.status === 'IN_PRODUCTION'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200/60'
                            : ord.status === 'DISPATCHED'
                            ? 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}
                      >
                        {ord.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-neutral-500">
                      <span>Booked: {new Date(ord.orderDate).toLocaleDateString()}</span>
                      <span>Target Delivery: {new Date(ord.requiredDeliveryDate).toLocaleDateString()}</span>
                      <span>Total: ₹{ord.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-neutral-600 font-medium text-xs">
                    <span>Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deliveries Schedule */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center space-x-2 text-neutral-900">
            <Calendar className="w-4 h-4 text-neutral-600" />
            <h3 className="text-sm font-bold tracking-tight">Delivery Schedule</h3>
          </div>
          <p className="text-xs text-neutral-500">Upcoming committed warehouse delivery dates</p>

          {upcomingDeliveries.length === 0 ? (
            <div className="p-6 text-center text-neutral-400 text-xs italic">
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
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      isUrgent
                        ? 'border-amber-200 bg-amber-50/60 text-amber-900'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-800'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-neutral-900">{del.orderNumber}</div>
                      <div className="text-[10px] text-neutral-500">Status: {del.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-neutral-900">{d.toLocaleDateString()}</div>
                      <div className="text-[10px] text-neutral-500">Scheduled Dispatch</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-neutral-100">
            <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-lg text-xs space-y-1.5">
              <span className="font-semibold text-neutral-800 block">Everest Mill Dispatch Assurance</span>
              <p className="text-neutral-500 text-[11px] leading-relaxed">
                All finished rolls undergo 4-point fabric inspection and tamper-proof barcode serialization prior to dispatch release.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
