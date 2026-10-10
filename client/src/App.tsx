import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { BuyerLayout } from './layouts/BuyerLayout';

// Internal Management Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { ProductionPage } from './pages/ProductionPage';
import { QualityPage } from './pages/QualityPage';
import { FinishedGoodsPage } from './pages/FinishedGoodsPage';
import { DispatchPage } from './pages/DispatchPage';
import { AccountsPage } from './pages/AccountsPage';
import { AttendancePage } from './pages/AttendancePage';
import { WagesPage } from './pages/WagesPage';

// Buyer Portal Pages
import { BuyerCatalogPage } from './pages/BuyerCatalogPage';
import { BuyerDashboardPage } from './pages/BuyerDashboardPage';
import { BuyerOrdersPage } from './pages/BuyerOrdersPage';
import { BuyerOrderDetailPage } from './pages/BuyerOrderDetailPage';
import { BuyerDispatchPage } from './pages/BuyerDispatchPage';
import { BuyerInvoicesPage } from './pages/BuyerInvoicesPage';
import { BuyerPaymentsPage } from './pages/BuyerPaymentsPage';


// Root redirect handler
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200/90 p-2 shadow-xs flex items-center justify-center">
            <img src="/logo.png" alt="AGT Logo" className="w-full h-full object-contain" />
          </div>
          <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Connecting to AGT Textile Mills...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'BUYER') {
    return <Navigate to="/buyer/dashboard" replace />;
  }

  return <Navigate to="/app/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Factory Internal Management Portal */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route
              path="orders"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'STORE', 'PRODUCTION', 'DISPATCH', 'ACCOUNTS']}>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STORE', 'PRODUCTION']}>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="purchases"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'STORE']}>
                  <PurchasesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="production"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'PRODUCTION', 'QUALITY']}>
                  <ProductionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="quality"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'QUALITY', 'PRODUCTION']}>
                  <QualityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="finished-goods"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'PRODUCTION', 'QUALITY', 'STORE', 'DISPATCH', 'SALES']}>
                  <FinishedGoodsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="dispatch"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DISPATCH']}>
                  <DispatchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="accounts"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTS']}>
                  <AccountsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="attendance"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTS']}>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="wages"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTS']}>
                  <WagesPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Dedicated External Buyer Portal */}
          <Route
            path="/buyer"
            element={
              <ProtectedRoute requireBuyer={true}>
                <BuyerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/buyer/catalog" replace />} />
            <Route path="catalog" element={<BuyerCatalogPage />} />
            <Route path="dashboard" element={<BuyerDashboardPage />} />
            <Route path="orders" element={<BuyerOrdersPage />} />
            <Route path="orders/:id" element={<BuyerOrderDetailPage />} />
            <Route path="dispatch" element={<BuyerDispatchPage />} />
            <Route path="invoices" element={<BuyerInvoicesPage />} />
            <Route path="payments" element={<BuyerPaymentsPage />} />

          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
  );
}

export default App;
