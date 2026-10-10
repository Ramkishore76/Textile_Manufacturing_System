import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Package,
  Clock,
  Truck,
  CreditCard,
  FileCheck2,
  Bell,
  LogOut,
  Building2,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';


export const BuyerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    async function loadBuyerNotifs() {
      try {
        const notifs = await api.get<any[]>('/buyer-portal/notifications');
        setNotifications(notifs);
      } catch (err) {
        // silent
      }
    }
    loadBuyerNotifs();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    for (const n of notifications) {
      if (!n.isRead) {
        await api.put(`/buyer-portal/notifications/${n.id}/read`, {}).catch(() => {});
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const isStaff = user?.role === 'ADMIN' || user?.role === 'STORE';

  const navLinks = [
    {
      to: '/buyer/catalog',
      label: isStaff ? 'Fabric Catalog & Pricing' : 'Order Fabrics (Catalog)',
      icon: ShoppingBag,
    },
    { to: '/buyer/dashboard', label: 'Overview', icon: Package },
    { to: '/buyer/orders', label: isStaff ? 'Customer Orders' : 'My Orders', icon: Clock },
    { to: '/buyer/dispatch', label: 'Shipment Tracking', icon: Truck },
    { to: '/buyer/invoices', label: 'Commercial Invoices', icon: FileCheck2 },
    { to: '/buyer/payments', label: 'Payment Receipts', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-zinc-900">
      {/* Plant Owner & Store Manager Authorized Administrative Banner */}
      {isStaff && (
        <div className="bg-gradient-to-r from-amber-600 via-indigo-900 to-indigo-950 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full bg-black/25 font-bold text-[10px] tracking-wide uppercase">
              {user?.role === 'ADMIN' ? '👑 Plant Owner' : '📦 Store Manager'}
            </span>
            <span className="font-semibold text-zinc-100">
              Exclusive Management Access: You can edit fabric specifications, descriptions, and cost pricing.
            </span>
          </div>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
          >
            Return to Factory ERP (/app) →
          </button>
        </div>
      )}

      {/* Top Header - IT Task Manager Style */}
      <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-50 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200/90 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img src="/logo.png" alt="AGT Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="text-sm font-bold tracking-tight text-zinc-900">AGT TEXTILE MILLS</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  {isStaff ? 'Buyer Portal (Admin Mode)' : 'Buyer Vault'}
                </span>
              </div>
            </div>

            {/* Buyer Account Card & Actions */}
            <div className="flex items-center space-x-3">
              {isStaff ? (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <Building2 className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-xs font-bold">
                    {user?.role === 'ADMIN' ? 'Plant Owner (Admin)' : 'Store Manager'}
                  </span>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-700">
                    {user?.buyerCompany || 'Authenticated Buyer'}
                  </span>
                </div>
              )}


              <button
                onClick={() => navigate('/buyer/enroll')}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Enroll New Buyer</span>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl relative transition"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white text-zinc-900 border border-zinc-200/90 rounded-2xl shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 mb-2">
                        <span className="text-xs font-bold text-zinc-900">Order Updates ({unreadCount})</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-[11px] font-medium text-indigo-600 hover:underline">
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-zinc-400 text-center py-4">No notifications yet</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 rounded-xl border text-xs ${
                                n.isRead
                                  ? 'bg-zinc-50 border-zinc-100 text-zinc-500'
                                  : 'bg-indigo-50/70 border-indigo-200 text-zinc-800'
                              }`}
                            >
                              <p className="font-semibold text-zinc-900">{n.title}</p>
                              <p className="text-[11px] text-zinc-600 mt-0.5">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 text-zinc-600 hover:text-rose-600 text-xs font-semibold border border-zinc-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar - Pills */}
          <div className="flex space-x-1.5 py-2 border-t border-zinc-100 overflow-x-auto">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-semibold shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200/80 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <p>© 2026 AGT Textile Mills. All rights reserved.</p>
          <p className="text-zinc-400">IT Vault Platform • External Buyer Governance Portal</p>
        </div>
      </footer>
    </div>
  );
};
