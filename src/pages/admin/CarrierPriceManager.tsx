import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Package, Plus, Trash, Save, AlertCircle, TruckIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CarrierPrice {
  id?: string;
  desi: number;
  city_price: number;
  intercity_price: number;
  subscription_type: 'BRONZE' | 'GOLD' | 'PREMIUM';
  carrier_id?: string;
}

interface Carrier {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export default function CarrierPriceManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [prices, setPrices] = useState<{
    BRONZE: CarrierPrice[];
    GOLD: CarrierPrice[];
    PREMIUM: CarrierPrice[];
  }>({
    BRONZE: [],
    GOLD: [],
    PREMIUM: []
  });
  const [activeTab, setActiveTab] = useState<'BRONZE' | 'GOLD' | 'PREMIUM'>('BRONZE');

  useEffect(() => {
    fetchCarriers();
  }, []);

  useEffect(() => {
    if (selectedCarrier) {
      fetchPrices();
    }
  }, [selectedCarrier, activeTab]);

  const fetchCarriers = async () => {
    try {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .order('name');

      if (error) throw error;

      setCarriers(data || []);
      
      // Her zaman ilk (ve tek) firmayı seç
      if (data && data.length > 0) {
        setSelectedCarrier(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching carriers:', err);
      toast.error('Kargo firmaları yüklenirken bir hata oluştu');
    }
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      
      // Seçili kargo firmasına göre fiyatları getir
      const { data, error } = await supabase
        .from('carrier_prices')
        .select('*')
        .eq('carrier_id', selectedCarrier)
        .order('desi');

      if (error) throw error;

      // Fiyatları abonelik tiplerine göre grupla
      const groupedPrices = {
        BRONZE: (data || []).filter(price => price.subscription_type === 'BRONZE'),
        GOLD: (data || []).filter(price => price.subscription_type === 'GOLD'),
        PREMIUM: (data || []).filter(price => price.subscription_type === 'PREMIUM')
      };

      // Eğer herhangi bir abonelik tipinde veri yoksa, varsayılan boş kayıtlar ekle
      if (groupedPrices.BRONZE.length === 0) {
        groupedPrices.BRONZE = [createEmptyPrice('BRONZE')];
      }
      if (groupedPrices.GOLD.length === 0) {
        groupedPrices.GOLD = [createEmptyPrice('GOLD')];
      }
      if (groupedPrices.PREMIUM.length === 0) {
        groupedPrices.PREMIUM = [createEmptyPrice('PREMIUM')];
      }

      setPrices(groupedPrices);
    } catch (err) {
      console.error('Error fetching prices:', err);
      toast.error('Fiyat listesi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const createEmptyPrice = (subscriptionType: 'BRONZE' | 'GOLD' | 'PREMIUM'): CarrierPrice => {
    return {
      desi: 1,
      city_price: 0,
      intercity_price: 0,
      subscription_type: subscriptionType,
      carrier_id: selectedCarrier || undefined
    };
  };

  const handlePriceChange = (
    index: number, 
    field: 'desi' | 'city_price' | 'intercity_price', 
    value: number
  ) => {
    const updatedPrices = { ...prices };
    updatedPrices[activeTab][index][field] = value;
    setPrices(updatedPrices);
  };

  const addNewPrice = () => {
    const updatedPrices = { ...prices };
    const newDesi = updatedPrices[activeTab].length > 0 
      ? Math.max(...updatedPrices[activeTab].map(p => p.desi)) + 1 
      : 1;
    
    updatedPrices[activeTab].push({
      desi: newDesi,
      city_price: 0,
      intercity_price: 0,
      subscription_type: activeTab,
      carrier_id: selectedCarrier || undefined
    });
    
    setPrices(updatedPrices);
  };

  const removePrice = (index: number) => {
    const priceToRemove = prices[activeTab][index];
    
    if (priceToRemove.id) {
      // Veritabanında kayıtlı bir fiyatı silme
      const confirmDelete = window.confirm('Bu fiyatı silmek istediğinize emin misiniz?');
      if (!confirmDelete) return;

      const deletePrice = async () => {
        try {
          const { error } = await supabase
            .from('carrier_prices')
            .delete()
            .eq('id', priceToRemove.id);

          if (error) throw error;
          
          const updatedPrices = { ...prices };
          updatedPrices[activeTab].splice(index, 1);
          setPrices(updatedPrices);
          
          toast.success('Fiyat başarıyla silindi');
        } catch (err) {
          console.error('Error deleting price:', err);
          toast.error('Fiyat silinirken bir hata oluştu');
        }
      };
      
      deletePrice();
    } else {
      // Henüz veritabanında olmayan bir fiyatı silme
      const updatedPrices = { ...prices };
      updatedPrices[activeTab].splice(index, 1);
      setPrices(updatedPrices);
    }
  };

  const savePrices = async () => {
    try {
      setSaving(true);
      
      // Desi değerlerinin benzersiz olup olmadığını kontrol et
      const currentPrices = prices[activeTab];
      const desiValues = currentPrices.map(price => price.desi);
      const uniqueDesiValues = new Set(desiValues);
      
      if (desiValues.length !== uniqueDesiValues.size) {
        toast.error('Aynı desi değerine sahip birden fazla kayıt var. Lütfen kontrol edin.');
        return;
      }
      
      // Yeni eklemeler ve güncellemeler için toplu işlem
      for (const price of currentPrices) {
        if (price.id) {
          // Mevcut kaydı güncelle
          const { error } = await supabase
            .from('carrier_prices')
            .update({
              desi: price.desi,
              city_price: price.city_price,
              intercity_price: price.intercity_price,
              subscription_type: price.subscription_type,
              carrier_id: selectedCarrier
            })
            .eq('id', price.id);
            
          if (error) throw error;
        } else {
          // Yeni kayıt ekle
          const { error } = await supabase
            .from('carrier_prices')
            .insert({
              desi: price.desi,
              city_price: price.city_price,
              intercity_price: price.intercity_price,
              subscription_type: price.subscription_type,
              carrier_id: selectedCarrier
            });
            
          if (error) throw error;
        }
      }
      
      toast.success('Fiyatlar başarıyla kaydedildi');
      fetchPrices(); // Kaydedilen verileri tekrar yükle
    } catch (err) {
      console.error('Error saving prices:', err);
      toast.error('Fiyatlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Package className="w-8 h-8 text-lightGreen" />
          <h1 className="text-2xl font-bold text-darkGreen">Kargo Fiyat Yönetimi</h1>
        </div>
        
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (carriers.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Package className="w-8 h-8 text-lightGreen" />
          <h1 className="text-2xl font-bold text-darkGreen">Kargo Fiyat Yönetimi</h1>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Kargo firması bulunamadı. Önce kargo firması eklemeniz gerekmektedir.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="w-8 h-8 text-lightGreen" />
        <h1 className="text-2xl font-bold text-darkGreen">Kargo Fiyat Yönetimi</h1>
      </div>

      {/* Uyarı mesajı */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Bu sayfada KarVeGo kargo firması için abonelik tiplerine göre kargo fiyatlarını yönetebilirsiniz.
              Fiyatlar desi bazında hesaplanmaktadır ve kullanıcılar abonelik tiplerine göre farklı fiyatlara tabi olacaktır.
            </p>
          </div>
        </div>
      </div>

      {/* Kargo Firma Bilgisi */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <TruckIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>KarVeGo</strong> kargo firması için fiyatlandırma ayarlarını düzenliyorsunuz.
            </p>
          </div>
        </div>
      </div>

      {/* Sekme Başlıkları */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['BRONZE', 'GOLD', 'PREMIUM'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-lightGreen text-darkGreen'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'BRONZE' ? 'Bronz Üyelik' : tab === 'GOLD' ? 'Gold Üyelik' : 'Premium Üyelik'}
            </button>
          ))}
        </nav>
      </div>

      {/* Fiyat Tablosu */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Desi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Şehir İçi Fiyat (₺)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Şehirler Arası Fiyat (₺)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prices[activeTab].map((price, index) => (
                <tr key={price.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="1"
                      value={price.desi}
                      onChange={(e) => handlePriceChange(index, 'desi', parseInt(e.target.value) || 0)}
                      className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-lightGreen focus:ring-lightGreen sm:text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price.city_price === 0 ? '' : price.city_price}
                      onChange={(e) => handlePriceChange(index, 'city_price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-lightGreen focus:ring-lightGreen sm:text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price.intercity_price === 0 ? '' : price.intercity_price}
                      onChange={(e) => handlePriceChange(index, 'intercity_price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-lightGreen focus:ring-lightGreen sm:text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => removePrice(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alt Butonlar */}
      <div className="flex justify-between">
        <button
          onClick={addNewPrice}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-lightGreen hover:bg-darkGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkGreen"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Fiyat Ekle
        </button>
        
        <button
          onClick={savePrices}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-darkGreen hover:bg-darkGreen/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkGreen disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Değişiklikleri Kaydet
            </>
          )}
        </button>
      </div>
    </div>
  );
} 