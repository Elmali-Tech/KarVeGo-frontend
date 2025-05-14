import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, X, Search, Download, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import Layout from '../../components/layout/Layout';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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
  const [showCustomerDetailsModal, setShowCustomerDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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
    } catch (error) {
      console.error(error);
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
    } catch (error) {
      console.error(error);
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
    } catch (error) {
      console.error(error);
      toast.error('Müşteri silinirken bir hata oluştu');
    }
  };

  const handleViewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetailsModal(true);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = async () => {
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Müşteriler');

      // Add logo and title (company name) if you have one
      // worksheet.addImage({ ... });

      // Define columns
      worksheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Ad Soyad', key: 'name', width: 25 },
        { header: 'Telefon', key: 'phone', width: 15 },
        { header: 'İl', key: 'city', width: 15 },
        { header: 'İlçe', key: 'district', width: 20 },
        { header: 'Adres', key: 'address', width: 40 }
      ];

      // Style the header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2F855A' } // darkGreen
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 24;

      // Add data rows
      filteredCustomers.forEach((customer, index) => {
        worksheet.addRow({
          no: index + 1,
          name: customer.name,
          phone: customer.phone,
          city: customer.city,
          district: customer.district,
          address: customer.address
        });
      });

      // Style data rows
      for (let i = 2; i <= filteredCustomers.length + 1; i++) {
        const row = worksheet.getRow(i);
        row.height = 20;
        row.alignment = { vertical: 'middle' };
        
        // Alternate row colors
        if (i % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F3FAF7' } // Light green tint
          };
        }
      }

      // Add borders
      worksheet.eachRow({ includeEmpty: false }, function(row) {
        row.eachCell({ includeEmpty: false }, function(cell) {
          cell.border = {
            top: { style: 'thin', color: { argb: 'E2E8F0' } },
            left: { style: 'thin', color: { argb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
            right: { style: 'thin', color: { argb: 'E2E8F0' } }
          };
        });
      });

      // Footer with total count
      const footerRow = worksheet.addRow(['Toplam Müşteri Sayısı:', filteredCustomers.length]);
      footerRow.font = { bold: true };
      footerRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F0FFF4' }
      };
      footerRow.getCell(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F0FFF4' }
      };

      // Generate and download excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'musteriler.xlsx');
      
      toast.success('Excel dosyası başarıyla indirildi');
    } catch (error) {
      console.error('Excel oluşturma hatası:', error);
      toast.error('Excel dosyası oluşturulurken bir hata oluştu');
    }
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <h1 className="text-2xl font-semibold text-darkGreen">Müşterilerim</h1>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-darkGreen text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-lightGreen transition-colors shadow-sm text-sm sm:text-base"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Excel'e Aktar</span>
            </button>
            <button
              onClick={() => setShowNewCustomerModal(true)}
              className="flex items-center gap-2 bg-lightGreen text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-darkGreen transition-colors shadow-sm text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Müşteri Ekle</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-100">
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Müşteri Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-lightGreen focus:border-lightGreen text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    Ad Soyad
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider hidden sm:table-cell">
                    İl
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider hidden sm:table-cell">
                    İlçe
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-darkGreen uppercase tracking-wider hidden md:table-cell">
                    Adres
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-darkGreen uppercase tracking-wider">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {customer.phone}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                      {customer.city}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                      {customer.district}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-500 max-w-xs truncate hidden md:table-cell">
                      {customer.address}
                    </td>
                    <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewCustomerDetails(customer)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full transition-colors flex items-center sm:hidden"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="sr-only">Detay</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-full transition-colors"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-2 sm:px-6 py-6 sm:py-10 text-center text-xs sm:text-sm text-gray-500">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl my-4">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-medium text-darkGreen">Müşteri Bilgisi</h2>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="text-gray-400 hover:text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-darkGreen mb-1">
                  AD SOYAD
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="block w-full rounded-md border-gray-200 focus:ring-lightGreen focus:border-lightGreen text-xs sm:text-sm shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-darkGreen mb-1">
                  TELEFON
                </label>
                <input
                  type="tel"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="block w-full rounded-md border-gray-200 focus:ring-lightGreen focus:border-lightGreen text-xs sm:text-sm shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-darkGreen mb-1">
                    İL
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    className="block w-full rounded-md border-gray-200 focus:ring-lightGreen focus:border-lightGreen text-xs sm:text-sm shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-darkGreen mb-1">
                    İLÇE
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer.district}
                    onChange={(e) => setNewCustomer({ ...newCustomer, district: e.target.value })}
                    className="block w-full rounded-md border-gray-200 focus:ring-lightGreen focus:border-lightGreen text-xs sm:text-sm shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-darkGreen mb-1">
                  ADRES
                </label>
                <textarea
                  required
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  rows={3}
                  className="block w-full rounded-md border-gray-200 focus:ring-lightGreen focus:border-lightGreen text-xs sm:text-sm shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lightGreen"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-darkGreen border border-transparent rounded-md shadow-sm hover:bg-lightGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkGreen transition-colors"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showCustomerDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl my-4">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-base sm:text-lg font-medium text-darkGreen">Müşteri Detayları</h2>
              <button
                onClick={() => setShowCustomerDetailsModal(false)}
                className="text-gray-400 hover:text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">Ad Soyad</h3>
                  <p className="text-sm sm:text-base font-medium text-gray-900 mt-1">{selectedCustomer.name}</p>
                </div>
                
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">Telefon</h3>
                  <p className="text-sm sm:text-base text-gray-900 mt-1">{selectedCustomer.phone}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase">İl</h3>
                    <p className="text-sm sm:text-base text-gray-900 mt-1">{selectedCustomer.city}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase">İlçe</h3>
                    <p className="text-sm sm:text-base text-gray-900 mt-1">{selectedCustomer.district}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">Adres</h3>
                  <p className="text-sm sm:text-base text-gray-900 mt-1 break-words">{selectedCustomer.address}</p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowCustomerDetailsModal(false)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-darkGreen border border-transparent rounded-md shadow-sm hover:bg-lightGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkGreen transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}