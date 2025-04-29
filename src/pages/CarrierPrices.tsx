import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import Layout from '../components/layout/Layout';

interface CarrierPrice {
  desi: number;
  city_price: number;
  intercity_price: number;
  subscription_type: 'BRONZE' | 'GOLD' | 'PREMIUM';
  carrier_id: string;
}

interface Carrier {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export default function CarrierPrices() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<CarrierPrice[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [userSubscriptionType, setUserSubscriptionType] = useState<'BRONZE' | 'GOLD' | 'PREMIUM'>('BRONZE');

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchCarriers();
    }
  }, [user]);

  // Carriers yüklendiğinde veya seçilen kargo firması değiştiğinde fiyatları getir
  useEffect(() => {
    if (selectedCarrier && userSubscriptionType) {
      fetchPrices(selectedCarrier, userSubscriptionType);
    }
  }, [selectedCarrier, userSubscriptionType]);

  const fetchCarriers = async () => {
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setCarriers(data || []);
      
      // Eğer kargo firması varsa, ilk firmayı seç
      if (data && data.length > 0) {
        setSelectedCarrier(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching carriers:', err);
      toast.error('Kargo firmaları yüklenirken bir hata oluştu');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_type')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      // Kullanıcının abonelik tipi varsa kullan, yoksa BRONZE kullan
      const subscriptionType = data?.subscription_type || 'BRONZE';
      setUserSubscriptionType(subscriptionType as 'BRONZE' | 'GOLD' | 'PREMIUM');
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Hata durumunda varsayılan olarak BRONZE fiyatlarını göster
      setUserSubscriptionType('BRONZE');
    }
  };

  const fetchPrices = async (carrierId: string, subscriptionType: 'BRONZE' | 'GOLD' | 'PREMIUM') => {
    try {
      const { data, error } = await supabase
        .from('carrier_prices')
        .select('desi, city_price, intercity_price, subscription_type, carrier_id')
        .eq('subscription_type', subscriptionType)
        .eq('carrier_id', carrierId)
        .order('desi');

      if (error) throw error;

      setPrices(data || []);
    } catch (err) {
      console.error('Error fetching prices:', err);
      toast.error('Fiyatlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCarrierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCarrier(e.target.value);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const getCarrierName = (carrierId: string | null) => {
    if (!carrierId) return '';
    const carrier = carriers.find(c => c.id === carrierId);
    return carrier ? carrier.name : '';
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Package className="w-8 h-8 text-lightGreen" />
          <h1 className="text-2xl font-bold text-darkGreen">Kargo Fiyat Listesi</h1>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-darkGreen mb-2">
            Mevcut Paketiniz: {userSubscriptionType === 'BRONZE' ? 'Bronz' : userSubscriptionType === 'GOLD' ? 'Gold' : 'Premium'}
          </h2>
          <p className="text-sm text-gray-600">
            Aşağıdaki fiyatlar sizin mevcut paketinize göre hesaplanmıştır. Daha avantajlı fiyatlar için üyelik paketinizi yükseltebilirsiniz.
          </p>
        </div>

        {/* Kargo Firma Seçimi */}
        {carriers.length > 0 && (
          <div className="mb-6">
            <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-2">
              Kargo Firması Seçin
            </label>
            <select
              id="carrier"
              value={selectedCarrier || ''}
              onChange={handleCarrierChange}
              className="block w-full md:w-1/3 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-lightGreen focus:border-lightGreen sm:text-sm rounded-md"
            >
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {carriers.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              Henüz kargo firması tanımlanmamış. Lütfen daha sonra tekrar kontrol edin.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden border border-lightGreen">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGreen">
              <thead className="bg-lightGreen bg-opacity-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    Desi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    Şehir İçi Fiyat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    Şehirler Arası Fiyat
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-lightGreen divide-opacity-30">
                {prices.map((price, index) => (
                  <tr key={index} className="hover:bg-lightGreen hover:bg-opacity-5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {price.desi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {formatPrice(price.city_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {formatPrice(price.intercity_price)}
                    </td>
                  </tr>
                ))}
                {prices.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      {selectedCarrier 
                        ? `${getCarrierName(selectedCarrier)} için bu abonelik tipine ait fiyat bulunamadı.`
                        : 'Lütfen bir kargo firması seçin.'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 