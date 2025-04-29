import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Package } from "lucide-react";
import { Toaster } from "sonner";
import Login from "./auth/Login";
import Register from "./auth/Register";
import Dashboard from "./components/Dashboard";
import Orders from "./pages/dashboard/Orders";
import Customers from "./pages/dashboard/Customers";
import AccountInfo from "./pages/dashboard/AccountInfo";
import SenderProfiles from "./pages/SenderProfiles";
import Addresses from "./pages/dashboard/Addresses";
import Integration from "./pages/Integration";
import Agreement from "./pages/Agreement";
import ChangePassword from "./pages/auth/ChangePassword";
import Landing from "./pages/Landing";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
// import { useAuth } from './lib/auth';
import CarrierPrices from "./pages/CarrierPrices";
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersList from "./pages/admin/UsersList";
import BalanceRequests from "./pages/admin/BalanceRequests";
import CarrierPriceManager from "./pages/admin/CarrierPriceManager";
import CarrierManager from "./pages/admin/CarrierManager";
import BarkodAyarlari from './pages/admin/BarkodAyarlari';

function AuthWrapper() {
  return <AuthPages />;
}

function AuthPages() {
  const [isLogin, setIsLogin] = React.useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-lightGreen/20 flex items-center justify-center p-4">
      <Toaster position="top-right" richColors />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Package className="w-8 h-8 text-darkGreen" />
            <h1 className="text-3xl font-bold text-black">KarVeGo</h1>
          </div>
          <p className="text-gray-600">Sipariş ve Kargo Takip Platformu</p>
        </div>

        {isLogin ? (
          <Login onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <Register onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthWrapper />} />
          <Route path="/siparisler" element={<Orders />} />
          <Route path="/kargo-fiyatlari" element={<CarrierPrices />} />
          <Route
            path="/urunler"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/musteriler"
            element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayarlar"
            element={
              <ProtectedRoute>
                <Navigate to="/ayarlar/hesap-bilgileri" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayarlar/hesap-bilgileri"
            element={
              <ProtectedRoute>
                <AccountInfo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayarlar/gonderici-profili"
            element={
              <ProtectedRoute>
                <SenderProfiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayarlar/adreslerim"
            element={
              <ProtectedRoute>
                <Addresses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayarlar/entegrasyon"
            element={
              <ProtectedRoute>
                <Integration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayarlar/anlasmam"
            element={
              <ProtectedRoute>
                <Agreement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopify/callback"
            element={
              <ProtectedRoute>
                <Integration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayarlar/sifre-degistir"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UsersList />} />
            <Route path="bakiye-talepleri" element={<BalanceRequests />} />
            <Route path="kargo-firmalari" element={<CarrierManager />} />
            <Route path="kargo-fiyatlari" element={<CarrierPriceManager />} />
            <Route
              path="siparisler"
              element={
                <div className="p-6">
                  <h1 className="text-2xl font-semibold">Sipariş Yönetimi</h1>
                </div>
              }
            />
            <Route
              path="urunler"
              element={
                <div className="p-6">
                  <h1 className="text-2xl font-semibold">Ürün Yönetimi</h1>
                </div>
              }
            />
            <Route
              path="ayarlar"
              element={
                <div className="p-6">
                  <h1 className="text-2xl font-semibold">Sistem Ayarları</h1>
                </div>
              }
            />
            <Route path="barkodayarlari" element={<BarkodAyarlari />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
