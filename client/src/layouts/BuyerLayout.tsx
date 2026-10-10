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
    { to: '/buyer/dashboard', label: 'Overview', icon: Package },
    { to: '/buyer/orders', label: 'My Orders', icon: Clock },
    { to: '/buyer/dispatch', label: 'Shipment Tracking', icon: Truck },
    { to: '/buyer/invoices', label: 'Commercial Invoices', icon: FileCheck2 },
    { to: '/buyer/payments', label: 'Payment Receipts', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans text-zinc-900">
      {/* Top Header - IT Task Manager Style */}
      <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-50 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                ET
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="text-sm font-bold tracking-tight text-zinc-900">EVEREST TEXTILE MILLS</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  Buyer Vault
                </span>
              </div>
            </div>

            {/* Buyer Account Card & Actions */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-700">
                  {user?.buyerCompany || 'Authenticated Buyer'}
                </span>
              </div>

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
          <p>© 2026 Everest Textile Mills. All rights reserved.</p>
          <p className="text-zinc-400">IT Vault Platform • External Buyer Governance Portal</p>
        </div>
      </footer>
    </div>
  );
};
