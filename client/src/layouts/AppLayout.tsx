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
  X,
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
    { role: 'ADMIN', label: 'Admin / Owner', email: 'admin@agttextile.com', pass: 'Admin@123' },
    { role: 'SALES', label: 'Sales Staff', email: 'sales@agttextile.com', pass: 'Sales@123' },
    { role: 'STORE', label: 'Store Manager', email: 'store@agttextile.com', pass: 'Store@123' },
    { role: 'PRODUCTION', label: 'Production Mgr', email: 'production@agttextile.com', pass: 'Prod@123' },
    { role: 'QUALITY', label: 'Quality Inspector', email: 'quality@agttextile.com', pass: 'Quality@123' },
    { role: 'DISPATCH', label: 'Dispatch Staff', email: 'dispatch@agttextile.com', pass: 'Dispatch@123' },
    { role: 'ACCOUNTS', label: 'HR / Accounts', email: 'accounts@agttextile.com', pass: 'Accounts@123' },
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
            <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200/90 p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img src="/logo.png" alt="AGT Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xs font-bold tracking-tight text-zinc-900 uppercase">AGT Mills</h1>
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
            {/* Quick Demo Role Switcher Trigger */}
            <button
              onClick={() => setShowRoleSwitcher(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-indigo-200 transition shadow-2xs"
              title="Click to switch active role or persona"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
              <span>Role: <strong className="text-indigo-600">{user?.role}</strong></span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
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
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200/90 rounded-2xl shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 mb-2">
                      <span className="text-xs font-bold text-zinc-800">Notifications ({unreadCount})</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-semibold text-indigo-600 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {roleFilteredNotifications.length === 0 ? (
                        <p className="text-xs text-zinc-400 text-center py-4">No notifications for your role</p>
                      ) : (
                        roleFilteredNotifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl border text-xs ${
                              n.isRead
                                ? 'bg-zinc-50 border-zinc-100 text-zinc-500'
                                : 'bg-indigo-50/60 border-indigo-200 text-zinc-800 font-medium'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <p className="font-semibold text-zinc-900">{n.title}</p>
                              <span className="text-[10px] text-zinc-400">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-600 mt-0.5">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
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

      {/* Role / Persona Switcher Modal Dialog (Centered with Backdrop - Never Overlaps Content Buttons) */}
      {showRoleSwitcher && (
        <div
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRoleSwitcher(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center shadow-2xs">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Switch Active Role & Persona</h3>
                  <p className="text-[11px] text-zinc-500 font-medium">Test functional permissions and scoped event isolation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleSwitcher(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 mb-3">
              Select any factory role persona below to instantly switch session context and verify functional access:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {demoRoles.map((r) => {
                const isActive = user?.role === r.role;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleQuickSwitchRole(r)}
                    className={`text-left p-3 rounded-xl border text-xs transition flex items-center justify-between group ${
                      isActive
                        ? 'bg-indigo-50/90 border-indigo-300 text-indigo-950 font-semibold shadow-xs ring-1 ring-indigo-500/20'
                        : 'bg-zinc-50/70 border-zinc-200/80 text-zinc-700 hover:bg-white hover:border-indigo-200 hover:shadow-2xs'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className="font-semibold text-zinc-900">{r.label}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isActive ? 'bg-indigo-600 text-white' : 'bg-zinc-200/70 text-zinc-600'
                          }`}
                        >
                          {r.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate font-mono">{r.email}</p>
                    </div>
                    {isActive ? (
                      <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-300 group-hover:border-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-3.5 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">
                Current: <strong className="text-zinc-700">{user?.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowRoleSwitcher(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
