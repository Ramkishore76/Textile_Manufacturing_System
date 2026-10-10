import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { hasRoleAccess, getRoleTitle, getRoleShort } from '../utils/permissions';
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

  // Filter notifications to only those accessible to the current user's role
  const roleFilteredNotifications = notifications.filter((n) => {
    if (!n.link) return true;
    return hasRoleAccess(user?.role, n.link);
  });

  const unreadCount = roleFilteredNotifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    for (const n of roleFilteredNotifications) {
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

  // Strictly filter navigation items by the user's role permissions
  const visibleNavItems = navItems.filter((item) => hasRoleAccess(user?.role, item.to));

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
    <div className="min-h-screen flex bg-[#fafafa] text-zinc-900 font-sans antialiased">
      {/* Sidebar Navigation - Modern IT Task Manager Aesthetic */}
      <aside className="w-64 bg-white text-zinc-700 flex flex-col shrink-0 border-r border-zinc-200/80 shadow-xs">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-zinc-200/80 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-xs">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-bold tracking-tight text-zinc-900 uppercase">Everest Mills</h1>
              <p className="text-[10px] text-zinc-500 font-medium tracking-wide">Manufacturing Vault</p>
            </div>
          </div>
        </div>

        {/* Role Scoping Banner in Sidebar */}
        <div className="px-4 py-2.5 bg-zinc-50/70 border-b border-zinc-200/70">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 font-medium">Active Workspace</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
              {getRoleShort(user?.role)}
            </span>
          </div>
        </div>

        {/* Navigation Links - Filtered to only authorized role functions */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs transition ${
                    isActive
                      ? 'bg-indigo-50/90 text-indigo-700 font-semibold border border-indigo-200/70 shadow-xs'
                      : 'text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-zinc-200/80 bg-zinc-50/60">
          <div className="flex items-center justify-between p-2 rounded-xl border border-zinc-200/80 bg-white mb-1 shadow-xs">
            <div className="flex items-center space-x-2.5 truncate pr-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-indigo-500/20">
                {user?.name?.slice(0, 2).toUpperCase() || 'EM'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-900 truncate">{user?.name}</p>
                <span className="inline-block text-[10px] text-zinc-500 truncate max-w-full">
                  {getRoleTitle(user?.role)}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-zinc-200/80 flex items-center justify-between px-6 shrink-0 z-10 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-500 font-medium">{getRoleTitle(user?.role)}</span>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-900 font-semibold capitalize">
              {location.pathname.replace('/app/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                <span>Role: <strong className="text-indigo-600">{user?.role}</strong></span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-xl shadow-lg p-2 z-50">
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
                    {roleFilteredNotifications.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">No notifications for your role</p>
                    ) : (
                      roleFilteredNotifications.slice(0, 10).map((n) => (
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
              className="px-3 py-1.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200/70 transition shadow-2xs"
            >
              Buyer Portal ↗
            </NavLink>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#fafafa]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
