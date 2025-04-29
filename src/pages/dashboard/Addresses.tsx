import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Home, FileText } from 'lucide-react';
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
    type: 'SHIPPING' as const,
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Varsayılan adres güncellenirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-100 p-6 rounded-lg">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Adreslerim</h1>
          <button
            onClick={() => setShowNewAddressModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Adres
          </button>
        </div>

        <div className="grid gap-6">
          {addresses.map((address) => (
            <div key={address.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  {address.type === 'BILLING' ? (
                    <FileText className="w-6 h-6 text-purple-600 shrink-0" />
                  ) : (
                    <Home className="w-6 h-6 text-purple-600 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">{address.name}</h3>
                      {address.is_default && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Varsayılan
                        </span>
                      )}
                      <span className="text-sm text-gray-500">{address.phone}</span>
                    </div>
                    <p className="text-gray-500 mt-1">
                      {address.address}, {address.district}/{address.city}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      Varsayılan Yap
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Address Modal */}
      {showNewAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-medium text-gray-900">Yeni Adres</h2>
              <button
                onClick={() => setShowNewAddressModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAddress} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ADRES ADI</label>
                <input
                  type="text"
                  required
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Ev, İş vb."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">TELEFON NUMARASI</label>
                <input
                  type="tel"
                  required
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ŞEHİR</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">İLÇE</label>
                  <input
                    type="text"
                    required
                    value={newAddress.district}
                    onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                    className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ADRES</label>
                <textarea
                  required
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ADRES TİPİ</label>
                <div className="mt-2 space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="SHIPPING"
                      checked={newAddress.type === 'SHIPPING'}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, type: e.target.value as 'SHIPPING' | 'BILLING' })
                      }
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Teslimat Adresi</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="BILLING"
                      checked={newAddress.type === 'BILLING'}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, type: e.target.value as 'SHIPPING' | 'BILLING' })
                      }
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Fatura Adresi</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewAddressModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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