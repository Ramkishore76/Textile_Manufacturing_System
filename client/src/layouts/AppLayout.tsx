import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  Truck,
  Cpu,
  ShieldCheck,
  Layers,
  Send,
  FileText,
  Users,
  Wallet,
  Bell,
  LogOut,
  ChevronDown,
  Factory,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const notifs = await api.get<any[]>('/notifications');
        setNotifications(notifs);
      } catch (err) {
        // silent
      }
    }
    loadNotifications();
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    for (const n of notifications) {
      if (!n.isRead) {
        await api.put(`/notifications/${n.id}/read`, {}).catch(() => {});
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const navItems = [
    { to: '/app/dashboard', label: 'Factory Dashboard', icon: LayoutDashboard },
    { to: '/app/orders', label: 'Buyer Orders', icon: ShoppingBag },
    { to: '/app/inventory', label: 'Yarn & BOM Inventory', icon: Boxes },
    { to: '/app/purchases', label: 'Suppliers & Purchases', icon: Truck },
    { to: '/app/production', label: 'Production & Machines', icon: Cpu },
    { to: '/app/quality', label: 'Quality & Inspections', icon: ShieldCheck },
    { to: '/app/finished-goods', label: 'Finished Fabric Stock', icon: Layers },
    { to: '/app/dispatch', label: 'Dispatch & Shipments', icon: Send },
    { to: '/app/accounts', label: 'Invoices & Cost Reports', icon: FileText },
    { to: '/app/attendance', label: 'Shift Attendance', icon: Users },
    { to: '/app/wages', label: 'Labour Wages', icon: Wallet },
  ];

  const demoRoles = [
    { role: 'ADMIN', label: 'Admin / Owner', email: 'admin@everesttextile.com', pass: 'Admin@123' },
    { role: 'SALES', label: 'Sales Staff', email: 'sales@everesttextile.com', pass: 'Sales@123' },
    { role: 'STORE', label: 'Store Manager', email: 'store@everesttextile.com', pass: 'Store@123' },
    { role: 'PRODUCTION', label: 'Production Mgr', email: 'production@everesttextile.com', pass: 'Prod@123' },
    { role: 'QUALITY', label: 'Quality Inspector', email: 'quality@everesttextile.com', pass: 'Quality@123' },
    { role: 'DISPATCH', label: 'Dispatch Staff', email: 'dispatch@everesttextile.com', pass: 'Dispatch@123' },
    { role: 'ACCOUNTS', label: 'HR / Accounts', email: 'accounts@everesttextile.com', pass: 'Accounts@123' },
  ];

  const handleQuickSwitchRole = async (demo: (typeof demoRoles)[0]) => {
    try {
      const res = await api.post<any>('/auth/login', {
        email: demo.email,
        password: demo.pass,
      });
      login(res.token, res.user);
      setShowRoleSwitcher(false);
      navigate(res.redirectUrl);
    } catch (err: any) {
      alert('Error switching role: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-neutral-800 font-sans antialiased">
      {/* Sidebar Navigation - Swiss Minimalist Structured Layout */}
      <aside className="w-64 bg-white text-neutral-700 flex flex-col shrink-0 border-r border-neutral-200">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-neutral-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center text-white">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-tight text-neutral-900 uppercase">Everest Mills</h1>
              <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Manufacturing ERP</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs transition ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-950 font-semibold border-l-2 border-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-neutral-500" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50/60">
          <div className="flex items-center justify-between p-2 rounded-lg border border-neutral-200/80 bg-white mb-1">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-neutral-900 truncate">{user?.name}</p>
              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-neutral-500 font-medium">Factory Operations</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-900 font-semibold capitalize">
              {location.pathname.replace('/app/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
                <span>Role: <strong className="text-neutral-900">{user?.role}</strong></span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-xl shadow-lg p-2 z-50">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1">
                    Select Active Persona
                  </p>
                  <div className="space-y-1">
                    {demoRoles.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => handleQuickSwitchRole(r)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                          user?.role === r.role
                            ? 'bg-neutral-100 text-neutral-950 font-semibold'
                            : 'text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <span>{r.label}</span>
                        {user?.role === r.role && <CheckCircle className="w-3.5 h-3.5 text-neutral-800" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg relative transition"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-xl shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-2">
                    <span className="text-xs font-bold text-neutral-800">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-semibold text-neutral-700 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">No notifications</p>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-lg border text-xs ${
                            n.isRead
                              ? 'bg-neutral-50 border-neutral-100 text-neutral-500'
                              : 'bg-neutral-100/60 border-neutral-200 text-neutral-800 font-medium'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <p className="font-semibold text-neutral-900">{n.title}</p>
                            <span className="text-[10px] text-neutral-400">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Link to Buyer Portal */}
            <NavLink
              to="/buyer/dashboard"
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg border border-neutral-200 transition"
            >
              Buyer Portal ↗
            </NavLink>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
