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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-neutral-900">
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center text-white font-mono text-xs font-semibold">
                ET
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-tight text-neutral-900">EVEREST TEXTILE MILLS</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                  Buyer Portal
                </span>
              </div>
            </div>

            {/* Buyer Account Card & Actions */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-md bg-neutral-50 border border-neutral-200">
                <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-xs font-medium text-neutral-700">
                  {user?.buyerCompany || 'Authenticated Buyer'}
                </span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md relative transition"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neutral-900"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-neutral-900 border border-neutral-200 rounded-lg shadow-lg p-3 z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-2">
                      <span className="text-xs font-semibold text-neutral-900">Order Updates ({unreadCount})</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[11px] font-medium text-neutral-600 hover:text-neutral-900 hover:underline">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-neutral-400 text-center py-4">No notifications yet</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded border text-xs ${
                              n.isRead
                                ? 'bg-neutral-50 border-neutral-200 text-neutral-500'
                                : 'bg-neutral-100/70 border-neutral-300 text-neutral-800'
                            }`}
                          >
                            <p className="font-semibold text-neutral-900">{n.title}</p>
                            <p className="text-[11px] text-neutral-600 mt-0.5">{n.message}</p>
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
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 text-xs font-medium border border-neutral-200 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="flex space-x-1 py-1.5 border-t border-neutral-100 overflow-x-auto">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition shrink-0 ${
                      isActive
                        ? 'bg-neutral-100 text-neutral-900 border border-neutral-200 font-semibold'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
          <p>© 2026 Everest Textile Mills. All rights reserved.</p>
          <p className="text-neutral-400">Swiss International Typographic Interface • Buyer Portal</p>
        </div>
      </footer>
    </div>
  );
};
