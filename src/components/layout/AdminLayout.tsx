import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Toaster } from 'sonner';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingBalanceCount, setPendingBalanceCount] = useState(0);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setIsAdmin(data.role === 'admin');
      } catch (error) {
        console.error('Admin rolü kontrol edilirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  // Bekleyen bakiye taleplerini kontrol et
  useEffect(() => {
    if (!isAdmin) return;

    const fetchPendingBalanceRequests = async () => {
      try {
        const { count, error } = await supabase
          .from('balance_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'PENDING');

        if (error) throw error;
        setPendingBalanceCount(count || 0);
      } catch (error) {
        console.error('Bekleyen bakiye talepleri alınırken hata:', error);
      }
    };

    fetchPendingBalanceRequests();

    // 1 dakikada bir bekleyen bakiye taleplerini kontrol et
    const interval = setInterval(fetchPendingBalanceRequests, 60000);
    
    return () => clearInterval(interval);
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-darkGreen"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      {/* Sidebar Component */}
      <AdminSidebar pendingBalanceCount={pendingBalanceCount} />

      {/* Main content */}
      <div className="flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout; 