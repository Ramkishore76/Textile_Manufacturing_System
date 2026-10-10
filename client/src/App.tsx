import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Connecting to Everest Textile Mills...</p>
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
            <Route path="orders" element={<OrdersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="quality" element={<QualityPage />} />
            <Route path="finished-goods" element={<FinishedGoodsPage />} />
            <Route path="dispatch" element={<DispatchPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="wages" element={<WagesPage />} />
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
            <Route index element={<Navigate to="/buyer/dashboard" replace />} />
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
    </AuthProvider>
  );
}

export default App;
