import React from 'react';
import { Package, Menu, LogOut, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  balance: number;
  openBalanceModal: () => void;
}

export default function Header({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  balance, 
  openBalanceModal 
}: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      toast.error('Çıkış yapılırken bir hata oluştu');
    }
  };

  const goToOrders = () => {
    navigate('/siparisler');
  };

  return (
    <header className="bg-white border-b border-lightGreen shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-darkGreen hover:text-lightGreen lg:hidden transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div 
              className="flex items-center gap-2 ml-4 lg:ml-0 cursor-pointer"
              onClick={goToOrders}
            >
              <Package className="w-8 h-8 text-darkGreen" />
              <span className="text-xl font-semibold text-black">KarVeGo</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div 
                className="text-sm text-gray-600 mr-2 cursor-pointer hover:text-darkGreen transition-colors flex items-center"
                onClick={openBalanceModal}
                title="Bakiye Eklemek İçin Tıklayın"
              >
                Bakiye: <span className="font-medium text-darkGreen ml-1">{balance.toFixed(2)} TL</span>
              </div>
              <button
                onClick={openBalanceModal}
                className="flex items-center justify-center p-1.5 bg-lightGreen rounded-full text-white hover:bg-darkGreen transition-colors"
                title="Bakiye Ekle"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="hidden sm:inline">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700"
                title="Çıkış Yap"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 