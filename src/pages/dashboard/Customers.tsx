import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Search, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import Layout from '../../components/layout/Layout';

interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string;
  district: string;
  address: string;
}

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      toast.error('Müşteriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from('customers').insert({
        user_id: user?.id,
        ...newCustomer,
      });

      if (error) throw error;

      toast.success('Müşteri başarıyla eklendi');
      setShowNewCustomerModal(false);
      setNewCustomer({
        name: '',
        phone: '',
        city: '',
        district: '',
        address: '',
      });
      fetchCustomers();
    } catch (err) {
      toast.error('Müşteri eklenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Müşteri silindi');
      fetchCustomers();
    } catch (err) {
      toast.error('Müşteri silinirken bir hata oluştu');
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    // Create CSV content
    const headers = ['Ad Soyad', 'Telefon', 'İl', 'İlçe', 'Adres'];
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map((customer) =>
        [
          customer.name,
          customer.phone,
          customer.city,
          customer.district,
          `"${customer.address.replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'musteriler.csv';
    link.click();
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
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
          <h1 className="text-2xl font-semibold text-darkGreen">Müşterilerim</h1>
          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-darkGreen text-white px-4 py-2 rounded-lg hover:bg-lightGreen transition-colors shadow-sm"
            >
              <Download className="w-5 h-5" />
              Excel'e Aktar
            </button>
            <button
              onClick={() => setShowNewCustomerModal(true)}
              className="flex items-center gap-2 bg-lightGreen text-white px-4 py-2 rounded-lg hover:bg-darkGreen transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Müşteri Ekle
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Müşteri Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-lightGreen focus:border-lightGreen"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    Ad Soyad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    İl
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    İlçe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    Adres
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-darkGreen uppercase tracking-wider">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.district}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {customer.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      Müşteri bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-medium text-darkGreen">Müşteri Bilgisi</h2>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="text-gray-400 hover:text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-darkGreen mb-1">
                  AD SOYAD
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="block w-full rounded-md border-gray-200 focus:ring-lightGreen focus:border-lightGreen sm:text-sm shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGreen mb-1">
                  TELEFON
                </label>
                <input
                  type="tel"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="block w-full rounded-md border-gray-200 focus:ring-lightGreen focus:border-lightGreen sm:text-sm shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-darkGreen mb-1">
                    İL
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    className="block w-full rounded-md border-gray-200 focus:ring-lightGreen focus:border-lightGreen sm:text-sm shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGreen mb-1">
                    İLÇE
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.district}
                    onChange={(e) => setNewCustomer({ ...newCustomer, district: e.target.value })}
                    className="block w-full rounded-md border-gray-200 focus:ring-lightGreen focus:border-lightGreen sm:text-sm shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-darkGreen mb-1">
                  ADRES
                </label>
                <textarea
                  required
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  rows={3}
                  className="block w-full rounded-md border-gray-200 focus:ring-lightGreen focus:border-lightGreen sm:text-sm shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lightGreen"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-darkGreen border border-transparent rounded-md shadow-sm hover:bg-lightGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkGreen transition-colors"
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