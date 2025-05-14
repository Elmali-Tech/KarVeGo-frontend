import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, RefreshCw, ExternalLink, ArrowRight,
  Wallet, TruckIcon, BarChart3, Package, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

type AdminStats = {
  userCount: number;
  pendingBalanceCount: number;
  totalBalance: number;
};

type RecentUser = {
  id: string;
  full_name: string | null;
  phone: string | null;
  account_type: string;
  status: string;
  created_at: string;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    userCount: 0,
    pendingBalanceCount: 0,
    totalBalance: 0
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        // Kullanıcı sayısını al
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        // Bekleyen bakiye taleplerini al
        const { count: pendingBalanceCount } = await supabase
          .from('balance_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'PENDING');
        
        // Toplam bakiyeyi al
        const { data: balanceData, error: balanceError } = await supabase
          .from('profiles')
          .select('balance');
        
        if (balanceError) throw balanceError;
        
        const totalBalance = balanceData.reduce((sum, profile) => sum + (profile.balance || 0), 0);
        
        // Son 5 kullanıcıyı al
        const { data: latestUsers, error: usersError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            phone,
            account_type,
            status,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (usersError) throw usersError;
        
        setStats({
          userCount: userCount || 0,
          pendingBalanceCount: pendingBalanceCount || 0,
          totalBalance: totalBalance
        });
        
        setRecentUsers(latestUsers || []);
      } catch (error) {
        console.error('İstatistikler alınırken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED':
        return {
          class: 'bg-green-100 text-green-800 border border-green-200',
          text: 'Onaylandı'
        };
      case 'PENDING':
        return {
          class: 'bg-amber-100 text-amber-800 border border-amber-200',
          text: 'Onay Bekliyor'
        };
      case 'REJECTED':
        return {
          class: 'bg-red-100 text-red-800 border border-red-200',
          text: 'Reddedildi'
        };
      default:
        return {
          class: 'bg-gray-100 text-gray-800 border border-gray-200',
          text: status
        };
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-darkGreen" />
          <h1 className="text-2xl font-bold text-gray-800">Admin Paneli</h1>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Yenile
        </button>
      </div>
      
      {/* Quick navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link to="/admin/users" className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-50 text-blue-600 mr-4">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">Kullanıcılar</h3>
            <p className="text-sm text-gray-500">Kullanıcı yönetimi</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </Link>
        
        <Link to="/admin/bakiye-talepleri" className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-50 text-amber-600 mr-4">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">Bakiye Talepleri</h3>
            <p className="text-sm text-gray-500">Bakiye işlemleri</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
        </Link>
        
        <Link to="/admin/kargo-fiyatlari" className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all group">
          <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-50 text-green-600 mr-4">
            <TruckIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">Kargo Fiyatları</h3>
            <p className="text-sm text-gray-500">Fiyat yönetimi</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
        </Link>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Toplam Kullanıcı</h2>
            <Users className="h-6 w-6 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{stats.userCount}</p>
          <Link 
            to="/admin/users" 
            className="inline-flex items-center mt-4 text-sm text-blue-100 hover:text-white transition-colors"
          >
            Tüm kullanıcıları görüntüle
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Bekleyen Bakiyeler</h2>
            <Wallet className="h-6 w-6 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{stats.pendingBalanceCount}</p>
          <Link 
            to="/admin/bakiye-talepleri" 
            className="inline-flex items-center mt-4 text-sm text-amber-100 hover:text-white transition-colors"
          >
            Bakiye taleplerini görüntüle
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Toplam Bakiye</h2>
            <DollarSign className="h-6 w-6 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalBalance)}</p>
          <Link 
            to="/admin/users" 
            className="inline-flex items-center mt-4 text-sm text-green-100 hover:text-white transition-colors"
          >
            Kullanıcı bakiyelerini görüntüle
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
      
      {/* Recent users section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-darkGreen" />
            <h2 className="text-lg font-semibold text-gray-800">Son Kullanıcılar</h2>
          </div>
          <Link to="/admin/users" className="text-sm text-darkGreen hover:text-lightGreen flex items-center gap-1 transition-colors font-medium">
            Tümünü Görüntüle
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-darkGreen border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hesap Türü</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{user.full_name || 'İsimsiz'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.account_type === 'INDIVIDUAL' ? 'Bireysel' : 'Kurumsal'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs rounded-full ${getStatusBadge(user.status).class}`}>
                          {getStatusBadge(user.status).text}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(user.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Henüz kullanıcı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;