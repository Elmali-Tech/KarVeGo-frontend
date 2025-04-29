import React, { useEffect, useState } from 'react';
import { Package, ArrowRight, Truck, Store, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function Landing() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserRole(data.role);
      } catch (error) {
        console.error('Kullanıcı rolü alınırken hata:', error);
      }
    };

    fetchUserRole();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-lightGreen/30">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-darkGreen" />
              <span className="text-xl font-semibold text-black">KarVeGo</span>
            </div>
            <div>
              {user ? (
                <Link
                  to={userRole === 'admin' ? "/admin" : "/siparisler"}
                  className="flex items-center gap-2 text-darkGreen hover:text-lightGreen font-medium"
                >
                  {userRole === 'admin' ? "Admin Panel" : "Dashboard"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="flex items-center gap-4">
                  <Link
                    to="/auth"
                    className="text-darkGreen hover:text-lightGreen font-medium"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    to="/auth"
                    className="bg-darkGreen text-white px-4 py-2 rounded-lg hover:bg-lightGreen transition-colors"
                  >
                    Ücretsiz Dene
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-6">
            E-ticaret siparişlerinizi
            <br />
            <span className="text-darkGreen">tek noktadan</span> yönetin
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Shopify mağazanızı bağlayın, siparişlerinizi kolayca takip edin ve
            kargo süreçlerinizi otomatikleştirin.
          </p>
          {user ? (
            <Link
              to={userRole === 'admin' ? "/admin" : "/siparisler"}
              className="inline-flex items-center gap-2 bg-darkGreen text-white px-8 py-4 rounded-lg hover:bg-lightGreen transition-colors text-lg font-medium"
            >
              {userRole === 'admin' ? "Admin Panel" : "Dashboard"}
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 bg-darkGreen text-white px-8 py-4 rounded-lg hover:bg-lightGreen transition-colors text-lg font-medium"
            >
              Hemen Başlayın
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <Store className="w-12 h-12 text-darkGreen mb-6" />
            <h3 className="text-xl font-semibold text-black mb-4">
              Shopify Entegrasyonu
            </h3>
            <p className="text-gray-600">
              Shopify mağazanızı tek tıkla bağlayın ve siparişlerinizi otomatik olarak senkronize edin.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <Truck className="w-12 h-12 text-darkGreen mb-6" />
            <h3 className="text-xl font-semibold text-black mb-4">
              Kargo Takibi
            </h3>
            <p className="text-gray-600">
              Tüm kargo firmalarıyla çalışın ve gönderilerinizi tek platformdan yönetin.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <BarChart3 className="w-12 h-12 text-darkGreen mb-6" />
            <h3 className="text-xl font-semibold text-black mb-4">
              Detaylı Raporlar
            </h3>
            <p className="text-gray-600">
              Sipariş ve kargo performansınızı analiz edin, işletmenizi daha iyi yönetin.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-darkGreen" />
              <span className="text-xl font-semibold text-black">KarVeGo</span>
            </div>
            <p className="text-gray-500">© 2025 KarVeGo. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}