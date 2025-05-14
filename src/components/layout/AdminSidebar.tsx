import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Users,
  ShoppingBag,
  Package,
  Settings,
  BarChart3,
  Home,
  LogOut,
  DollarSign,
  TruckIcon,
  Barcode,
} from "lucide-react";

interface AdminSidebarProps {
  pendingBalanceCount: number;
}

const AdminSidebar = ({ pendingBalanceCount }: AdminSidebarProps) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white shadow-md">
        <div className="flex items-center justify-center h-20 shadow-sm">
          <h1 className="text-xl font-bold text-darkGreen">KarVeGo Admin</h1>
        </div>
        <div className="flex flex-col flex-1 p-4 space-y-2">
          <Link
            to="/admin"
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-darkGreen" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Users className="h-5 w-5 text-darkGreen" />
            <span>Kullanıcılar</span>
          </Link>
          <Link
            to="/admin/urunler"
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Package className="h-5 w-5 text-darkGreen" />
            <span>Ürünler</span>
          </Link>
          <Link
            to="/admin/bakiye-talepleri"
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <DollarSign className="h-5 w-5 text-darkGreen" />
            <div className="flex items-center">
              <span>Bakiye Talepleri</span>
              {pendingBalanceCount > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {pendingBalanceCount}
                </span>
              )}
            </div>
          </Link>
          <Link
            to="/admin/kargo-fiyatlari"
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <TruckIcon className="h-5 w-5 text-darkGreen" />
            <span>Kargo Fiyatları</span>
          </Link>
          <Link
            to="/admin/barkodayarlari"
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Barcode className="h-5 w-5 text-darkGreen" />
            <span>Barkod Ayarları</span>
          </Link>
          <Link
            to="/admin/ayarlar"
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-5 w-5 text-darkGreen" />
            <span>Sistem Ayarları</span>
          </Link>
          <div className="flex-grow"></div>
          <Link
            to="/"
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Home className="h-5 w-5 text-darkGreen" />
            <span>Siteye Dön</span>
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 text-red-500 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>

      {/* Mobile sidebar (responsive) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="grid grid-cols-5 p-2">
          <Link to="/admin" className="flex flex-col items-center p-2">
            <BarChart3 className="h-6 w-6 text-darkGreen" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link to="/admin/users" className="flex flex-col items-center p-2">
            <Users className="h-6 w-6 text-darkGreen" />
            <span className="text-xs">Kullanıcılar</span>
          </Link>
          <Link
            to="/admin/bakiye-talepleri"
            className="flex flex-col items-center p-2 relative"
          >
            <DollarSign className="h-6 w-6 text-darkGreen" />
            <span className="text-xs">Bakiye</span>
            {pendingBalanceCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {pendingBalanceCount > 9 ? "9+" : pendingBalanceCount}
              </span>
            )}
          </Link>
          <Link
            to="/admin/kargo-fiyatlari"
            className="flex flex-col items-center p-2"
          >
            <TruckIcon className="h-6 w-6 text-darkGreen" />
            <span className="text-xs">Fiyatlar</span>
          </Link>
          <Link
            to="/admin/barkodayarlari"
            className="flex flex-col items-center p-2"
          >
            <Barcode className="h-6 w-6 text-darkGreen" />
            <span className="text-xs">Barkod</span>
          </Link>
          <Link to="/admin/ayarlar" className="flex flex-col items-center p-2">
            <Settings className="h-6 w-6 text-darkGreen" />
            <span className="text-xs">Ayarlar</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
