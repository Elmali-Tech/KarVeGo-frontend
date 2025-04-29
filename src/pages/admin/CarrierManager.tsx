import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Truck, Plus, Trash, Edit, Save, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Carrier {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export default function CarrierManager() {
  const [loading, setLoading] = useState(true);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCarrierId, setEditingCarrierId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_active: true
  });

  useEffect(() => {
    fetchCarriers();
  }, []);

  const fetchCarriers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .order('name');

      if (error) throw error;

      setCarriers(data || []);
    } catch (err) {
      console.error('Error fetching carriers:', err);
      toast.error('Kargo firmaları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      is_active: true
    });
    setEditingCarrierId(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditCarrier = (carrier: Carrier) => {
    setFormData({
      name: carrier.name,
      code: carrier.code,
      is_active: carrier.is_active
    });
    setEditingCarrierId(carrier.id);
    setShowForm(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('carriers')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // Lokal state'i güncelle
      setCarriers(carriers.map(carrier => 
        carrier.id === id ? { ...carrier, is_active: !currentStatus } : carrier
      ));

      toast.success(`Kargo firması ${!currentStatus ? 'aktif' : 'pasif'} duruma getirildi`);
    } catch (err) {
      console.error('Error toggling carrier status:', err);
      toast.error('Durum değiştirilirken bir hata oluştu');
    }
  };

  const handleDeleteCarrier = async (id: string) => {
    const confirmed = window.confirm('Bu kargo firmasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bu kargo firmasına ait tüm fiyatlar silinecektir.');
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('carriers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCarriers(carriers.filter(carrier => carrier.id !== id));
      toast.success('Kargo firması başarıyla silindi');
    } catch (err) {
      console.error('Error deleting carrier:', err);
      toast.error('Kargo firması silinirken bir hata oluştu. Bu firmaya ait fiyatlar veya aktif kullanımlar olabilir.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      if (editingCarrierId) {
        // Güncelleme işlemi
        const { error } = await supabase
          .from('carriers')
          .update({
            name: formData.name,
            code: formData.code,
            is_active: formData.is_active
          })
          .eq('id', editingCarrierId);

        if (error) throw error;
        
        // Lokal state'i güncelle
        setCarriers(carriers.map(carrier => 
          carrier.id === editingCarrierId ? { ...carrier, ...formData } : carrier
        ));

        toast.success('Kargo firması başarıyla güncellendi');
      } else {
        // Yeni kayıt ekleme
        const { data, error } = await supabase
          .from('carriers')
          .insert({
            name: formData.name,
            code: formData.code,
            is_active: formData.is_active
          })
          .select();

        if (error) throw error;

        if (data) {
          setCarriers([...carriers, data[0]]);
        }

        toast.success('Kargo firması başarıyla eklendi');
      }

      // Formu sıfırla ve kapat
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Error saving carrier:', err);
      toast.error('Kargo firması kaydedilirken bir hata oluştu');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Truck className="w-8 h-8 text-lightGreen" />
          <h1 className="text-2xl font-bold text-darkGreen">Kargo Firmaları</h1>
        </div>
        
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Truck className="w-8 h-8 text-lightGreen" />
          <h1 className="text-2xl font-bold text-darkGreen">Kargo Firmaları</h1>
        </div>
        <button 
          onClick={handleAddNew}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-lightGreen hover:bg-darkGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkGreen"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kargo Firması
        </button>
      </div>

      {/* Uyarı mesajı */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Kargo firması ekleyerek her firma için ayrı desi fiyatları tanımlayabilirsiniz.
              Bir kargo firmasını sildiğinizde, o firmaya ait tüm fiyat tanımları da silinecektir.
            </p>
          </div>
        </div>
      </div>

      {/* Kargo Firma Formu */}
      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-darkGreen">
              {editingCarrierId ? 'Kargo Firması Düzenle' : 'Yeni Kargo Firması Ekle'}
            </h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Firma Adı
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-lightGreen focus:border-lightGreen block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Örn: Aras Kargo"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Firma Kodu
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="code"
                    id="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-lightGreen focus:border-lightGreen block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Örn: ARAS"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-center">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-lightGreen focus:ring-lightGreen border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Aktif (İşaretli değilse kullanıcılar bu kargo firmasını göremeyecektir)
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lightGreen mr-3"
              >
                İptal
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-darkGreen hover:bg-darkGreen/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkGreen"
              >
                <Save className="mr-2 h-4 w-4" />
                {editingCarrierId ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kargo Firma Tablosu */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Firma Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Firma Kodu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oluşturulma Tarihi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {carriers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Henüz kargo firması eklenmemiş. Yukarıdaki "Yeni Kargo Firması" butonuna tıklayarak ekleyebilirsiniz.
                  </td>
                </tr>
              ) : (
                carriers.map((carrier) => (
                  <tr key={carrier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{carrier.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{carrier.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        carrier.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {carrier.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(carrier.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(carrier.id, carrier.is_active)}
                          className={`${
                            carrier.is_active ? 'text-gray-400 hover:text-gray-500' : 'text-green-600 hover:text-green-700'
                          }`}
                          title={carrier.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                        >
                          {carrier.is_active ? (
                            <X className="h-5 w-5" />
                          ) : (
                            <AlertCircle className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditCarrier(carrier)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Düzenle"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCarrier(carrier.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Sil"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 