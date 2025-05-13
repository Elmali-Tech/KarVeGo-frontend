import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Home, FileText, MapPin, Phone, Check, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import Layout from '../../components/layout/Layout';

interface Address {
  id: string;
  name: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  is_default: boolean;
  type: 'BILLING' | 'SHIPPING';
}

export default function Addresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    address: '',
    type: 'SHIPPING' as 'BILLING' | 'SHIPPING',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Adres yükleme hatası:', error);
      toast.error('Adresler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from('addresses').insert({
        user_id: user?.id,
        ...newAddress,
        is_default: addresses.length === 0, // First address becomes default
      });

      if (error) throw error;

      toast.success('Adres başarıyla eklendi');
      setShowNewAddressModal(false);
      setNewAddress({
        name: '',
        phone: '',
        city: '',
        district: '',
        address: '',
        type: 'SHIPPING',
      });
      fetchAddresses();
    } catch (error) {
      console.error('Adres ekleme hatası:', error);
      toast.error('Adres eklenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Adres silindi');
      fetchAddresses();
    } catch (error) {
      console.error('Adres silme hatası:', error);
      toast.error('Adres silinirken bir hata oluştu');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // First, remove default from all addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      // Then set the selected address as default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Varsayılan adres güncellendi');
      fetchAddresses();
    } catch (error) {
      console.error('Varsayılan adres güncelleme hatası:', error);
      toast.error('Varsayılan adres güncellenirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 px-2 sm:px-0 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 md:mb-6"></div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white shadow p-4 md:p-6 rounded-lg">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Adreslerim</h1>
          <button
            onClick={() => setShowNewAddressModal(true)}
            className="flex items-center justify-center gap-1 md:gap-2 bg-darkGreen text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-lightGreen transition-colors text-xs md:text-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Yeni Adres
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Henüz Adresiniz Yok</h3>
            <p className="text-gray-500 mb-4">Kargo gönderimi ve fatura bilgileri için adres eklemeniz gerekir.</p>
            <button
              onClick={() => setShowNewAddressModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-darkGreen text-white px-4 py-2 rounded-lg hover:bg-lightGreen transition-colors"
            >
              <Plus className="w-5 h-5" />
              İlk Adresinizi Ekleyin
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => (
              <div key={address.id} className="bg-white rounded-lg shadow-sm border p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    address.type === 'BILLING' 
                      ? 'bg-purple-100' 
                      : 'bg-lightGreen bg-opacity-10'
                  }`}>
                    {address.type === 'BILLING' ? (
                      <FileText className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Home className="w-5 h-5 text-darkGreen" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-base font-medium text-gray-900">{address.name}</h3>
                      {address.is_default && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-darkGreen bg-opacity-10 text-darkGreen">
                          <Star className="w-3 h-3" />
                          Varsayılan
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {address.type === 'BILLING' ? 'Fatura Adresi' : 'Teslimat Adresi'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                      <Phone className="w-3 h-3" />
                      <span>{address.phone}</span>
                    </div>
                    
                    <p className="text-sm text-gray-700">
                      {address.address}, {address.district}/{address.city}
                    </p>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 mt-2 sm:mt-0">
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-xs font-medium text-darkGreen hover:text-lightGreen flex items-center gap-1 py-1 px-2 rounded-md border border-darkGreen hover:border-lightGreen transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Varsayılan Yap
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Address Modal */}
      {showNewAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 md:p-6 border-b">
              <h2 className="text-base md:text-lg font-medium text-gray-900">Yeni Adres</h2>
              <button
                onClick={() => setShowNewAddressModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAddress} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ADRES ADI</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    className="pl-10 block w-full rounded-md focus:ring-darkGreen focus:border-darkGreen sm:text-sm border-gray-300"
                    placeholder="Ev, İş vb."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">TELEFON NUMARASI</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="pl-10 block w-full rounded-md focus:ring-darkGreen focus:border-darkGreen sm:text-sm border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ŞEHİR</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="block w-full rounded-md focus:ring-darkGreen focus:border-darkGreen sm:text-sm border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">İLÇE</label>
                  <input
                    type="text"
                    required
                    value={newAddress.district}
                    onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                    className="block w-full rounded-md focus:ring-darkGreen focus:border-darkGreen sm:text-sm border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ADRES</label>
                <textarea
                  required
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  rows={3}
                  className="block w-full rounded-md focus:ring-darkGreen focus:border-darkGreen sm:text-sm border-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ADRES TİPİ</label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="relative flex items-center bg-gray-50 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      value="SHIPPING"
                      checked={newAddress.type === 'SHIPPING'}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, type: e.target.value as 'SHIPPING' | 'BILLING' })
                      }
                      className="h-4 w-4 text-darkGreen focus:ring-darkGreen"
                    />
                    <div className="ml-2 flex items-center">
                      <Home className="w-4 h-4 text-darkGreen mr-1.5" />
                      <span className="text-xs text-gray-700">Teslimat Adresi</span>
                    </div>
                  </label>
                  <label className="relative flex items-center bg-gray-50 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      value="BILLING"
                      checked={newAddress.type === 'BILLING'}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, type: e.target.value as 'SHIPPING' | 'BILLING' })
                      }
                      className="h-4 w-4 text-darkGreen focus:ring-darkGreen"
                    />
                    <div className="ml-2 flex items-center">
                      <FileText className="w-4 h-4 text-purple-600 mr-1.5" />
                      <span className="text-xs text-gray-700">Fatura Adresi</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewAddressModal(false)}
                  className="px-3 py-1.5 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1.5 text-xs md:text-sm font-medium text-white bg-darkGreen border border-transparent rounded-md hover:bg-lightGreen"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}