import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, ShoppingBag, Package
} from 'lucide-react';
import { Link } from 'react-router-dom';

type AdminStats = {
  userCount: number;
  orderCount: number;
  productCount: number;
  revenueTotal: number;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    userCount: 0,
    orderCount: 0,
    productCount: 0,
    revenueTotal: 0
  });

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        // Kullanıcı sayısını al
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        // Sipariş sayısını al (orders tablosu varsayılmıştır)
        const { count: orderCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        
        // Ürün sayısını al
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
        
        // NOT: total_amount sorgusu hata verdiği için kaldırıldı
        // Şimdilik gelir bilgisini 0 olarak ayarlıyoruz
        // Eğer orders tablosunda toplam tutarı saklayan farklı bir sütun varsa
        // o sütunu kullanarak bu kısmı güncelleyebilirsiniz
        
        setStats({
          userCount: userCount || 0,
          orderCount: orderCount || 0,
          productCount: productCount || 0,
          revenueTotal: 0 // Gelir hesaplaması devre dışı bırakıldı
        });
      } catch (error) {
        console.error('İstatistikler alınırken hata oluştu:', error);
      }
    };

    fetchAdminStats();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
      
      {/* Quick navigation */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-medium mb-3">Hızlı Erişim</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/users" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">
            <Users className="h-5 w-5 mr-1.5" />
            Kullanıcılar
          </Link>
          {/* Diğer hızlı erişim linkleri buraya eklenebilir */}
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Toplam Kullanıcı</h2>
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{stats.userCount}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Toplam Sipariş</h2>
            <ShoppingBag className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{stats.orderCount}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Toplam Ürün</h2>
            <Package className="h-6 w-6 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{stats.productCount}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Toplam Gelir</h2>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.revenueTotal.toFixed(2)} ₺</p>
        </div>
      </div>
      
      {/* Recent activity & summary sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Son Siparişler</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm">#1234</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">Ahmet Yılmaz</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">240.50 ₺</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Teslim Edildi</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm">#1233</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">Ayşe Demir</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">120.00 ₺</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Hazırlanıyor</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm">#1232</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">Mehmet Kaya</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">350.75 ₺</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Kargoda</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Sistem Durumu</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Disk Kullanımı</span>
                <span className="text-sm font-medium">65%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Bellek Kullanımı</span>
                <span className="text-sm font-medium">40%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">CPU Kullanımı</span>
                <span className="text-sm font-medium">25%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Aktif Servisler</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  API Servisi
                </li>
                <li className="flex items-center text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Veritabanı
                </li>
                <li className="flex items-center text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Kargo Entegrasyonu
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;