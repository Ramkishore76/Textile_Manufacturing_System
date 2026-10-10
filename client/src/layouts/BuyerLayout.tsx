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
  Sparkles,
  Building2,
  CheckCheck,
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

  const navLinks = [
    { to: '/buyer/dashboard', label: 'Dashboard', icon: Package },
    { to: '/buyer/orders', label: 'My Orders', icon: Clock },
    { to: '/buyer/dispatch', label: 'Shipment Tracking', icon: Truck },
    { to: '/buyer/invoices', label: 'Commercial Invoices', icon: FileCheck2 },
    { to: '/buyer/payments', label: 'Payment Receipts', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-wider text-white">EVEREST TEXTILE MILLS</span>
                <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800 uppercase tracking-widest">
                  Buyer Portal
                </span>
              </div>
            </div>

            {/* Buyer Account Card & Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                <Building2 className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {user?.buyerCompany || 'Authenticated Buyer'}
                </span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg relative transition"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-2xl p-3 z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <span className="text-xs font-bold text-slate-800">Order Updates ({unreadCount})</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] font-semibold text-teal-600 hover:underline">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No notifications yet</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-lg border text-xs ${
                              n.isRead
                                ? 'bg-slate-50 border-slate-100 text-slate-500'
                                : 'bg-teal-50/60 border-teal-100 text-slate-800'
                            }`}
                          >
                            <p className="font-semibold text-slate-900">{n.title}</p>
                            <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="flex space-x-1 py-2 border-t border-slate-800 overflow-x-auto">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>© 2026 Everest Textile Mills. All rights reserved. Secure Buyer Portal connection.</p>
        </div>
      </footer>
    </div>
  );
};
