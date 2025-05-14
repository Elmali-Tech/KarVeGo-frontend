import React, { useState, useEffect } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface OrderFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Product {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  city?: string;
  district?: string;
  address?: string;
  phone?: string;
}

export default function OrderForm({ onClose, onSuccess }: OrderFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<{ 
    productId: string; 
    name: string;
    quantity: number 
  }[]>([]);
  
  const [note, setNote] = useState('');
  
  const [packageInfo, setPackageInfo] = useState({
    height: '10',
    width: '10',
    length: '30',
    weight: '1',
  });
  
  // Yeni müşteri için state
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    address: '',
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Ürünler yüklenirken hata oluştu:', err);
      toast.error('Ürünler yüklenirken hata oluştu');
    }
  };

  const fetchCustomers = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('customers')
        .select('id, name, city, district, address, phone')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Müşteriler yüklenirken hata oluştu:', err);
      toast.error('Müşteriler yüklenirken hata oluştu');
    }
  };
  
  // Yeni müşteri ekleme fonksiyonu
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Ana formun submit edilmesini engelle
    setSavingCustomer(true);

    try {
      const { data, error } = await supabase.from('customers').insert({
        user_id: user?.id,
        ...newCustomer,
      }).select();

      if (error) throw error;

      toast.success('Müşteri başarıyla eklendi');
      
      // Müşteri listesini güncelle
      await fetchCustomers();
      
      // Yeni eklenen müşteriyi seç
      if (data && data.length > 0) {
        setSelectedCustomer(data[0].id);
      }
      
      // Formu kapat ve temizle
      setShowNewCustomerForm(false);
      setNewCustomer({
        name: '',
        phone: '',
        city: '',
        district: '',
        address: '',
      });
    } catch (err) {
      console.error('Müşteri eklenirken bir hata oluştu:', err);
      toast.error('Müşteri eklenirken bir hata oluştu');
    } finally {
      setSavingCustomer(false);
    }
  };

  const addProduct = () => {
    setSelectedProducts([
      ...selectedProducts, 
      { productId: '', name: '', quantity: 1 }
    ]);
  };

  const updateProduct = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const updatedProducts = [...selectedProducts];
    
    if (field === 'productId') {
      const selectedProduct = products.find(p => p.id === value);
      updatedProducts[index] = {
        ...updatedProducts[index],
        productId: value as string,
        name: selectedProduct ? selectedProduct.name : ''
      };
    } else if (field === 'quantity') {
      updatedProducts[index] = { 
        ...updatedProducts[index], 
        quantity: typeof value === 'string' ? parseInt(value) || 1 : value
      };
    }
    
    setSelectedProducts(updatedProducts);
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error('Lütfen bir müşteri seçin');
      return;
    }
    
    if (selectedProducts.length === 0 || selectedProducts.some(p => !p.productId)) {
      toast.error('Lütfen en az bir ürün seçin');
      return;
    }
    
    setLoading(true);

    try {
      // Müşteri bilgilerini al
      const customer = customers.find(c => c.id === selectedCustomer);
      
      if (!customer) {
        throw new Error('Müşteri bilgisi bulunamadı');
      }
      
      if (!customer.address || !customer.city || !customer.district) {
        throw new Error('Müşterinin adres bilgileri eksik');
      }
      
      // Siparişi oluştur
      const orderProducts = selectedProducts.map(p => {
        const product = products.find(prod => prod.id === p.productId);
        return {
          name: product?.name || '',
          quantity: p.quantity,
        };
      });
      
      // Adres bilgilerini hazırla
      const addressData = {
        name: customer.name,
        address1: customer.address,
        city: customer.city,
        district: customer.district,
        country: 'Türkiye',
        phone: customer.phone || '',
      };
      
      const { error } = await supabase.from('orders').insert({
        user_id: user?.id,
        status: 'NEW',
        order_created_at: new Date().toISOString(),
        total_weight: parseFloat(packageInfo.weight),
        package_height: parseFloat(packageInfo.height),
        package_width: parseFloat(packageInfo.width),
        package_length: parseFloat(packageInfo.length),
        package_weight: parseFloat(packageInfo.weight),
        customer: {
          name: customer.name,
          phone: customer.phone,
        },
        shipping_address: addressData,
        billing_address: addressData,
        products: orderProducts,
        note: note,
        source_name: 'manual',
      });

      if (error) throw error;

      toast.success('Sipariş başarıyla oluşturuldu');
      onSuccess();
    } catch (error) {
      console.error('Sipariş oluşturulurken bir hata oluştu:', error);
      toast.error('Sipariş oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="p-4 max-h-[80vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Müşteri Seçimi */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Müşteri
              </label>
              <button
                type="button"
                onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                className="inline-flex items-center text-xs px-2 py-1 text-darkGreen hover:text-lightGreen transition-colors"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                {showNewCustomerForm ? 'İptal' : 'Yeni Müşteri Ekle'}
              </button>
            </div>
            
            {!showNewCustomerForm ? (
              <select
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-lightGreen focus:border-lightGreen"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                required={!showNewCustomerForm}
                disabled={showNewCustomerForm}
              >
                <option value="">Müşteri Seçin</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-3 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-medium text-darkGreen mb-3">Yeni Müşteri Bilgileri</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      AD SOYAD
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="block w-full rounded-md border-gray-300 focus:ring-lightGreen focus:border-lightGreen text-sm shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      TELEFON
                    </label>
                    <input
                      type="tel"
                      required
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="block w-full rounded-md border-gray-300 focus:ring-lightGreen focus:border-lightGreen text-sm shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        İL
                      </label>
                      <input
                        type="text"
                        required
                        value={newCustomer.city}
                        onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                        className="block w-full rounded-md border-gray-300 focus:ring-lightGreen focus:border-lightGreen text-sm shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        İLÇE
                      </label>
                      <input
                        type="text"
                        required
                        value={newCustomer.district}
                        onChange={(e) => setNewCustomer({ ...newCustomer, district: e.target.value })}
                        className="block w-full rounded-md border-gray-300 focus:ring-lightGreen focus:border-lightGreen text-sm shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      ADRES
                    </label>
                    <textarea
                      required
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      rows={2}
                      className="block w-full rounded-md border-gray-300 focus:ring-lightGreen focus:border-lightGreen text-sm shadow-sm"
                    />
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleCreateCustomer}
                      disabled={savingCustomer}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm rounded-md text-white bg-darkGreen hover:bg-lightGreen focus:outline-none transition-colors"
                    >
                      {savingCustomer ? 'Kaydediliyor...' : 'Müşteri Kaydet'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Müşteri Detayları - Sadece bir müşteri seçildiğinde göster */}
          {selectedCustomerData && !showNewCustomerForm && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-sm font-medium text-darkGreen mb-2">Müşteri Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">Ad Soyad:</span> {selectedCustomerData.name}</p>
                <p><span className="font-medium">Telefon:</span> {selectedCustomerData.phone || '-'}</p>
                <p className="md:col-span-2"><span className="font-medium">Adres:</span> {selectedCustomerData.address || '-'}</p>
                <p><span className="font-medium">İlçe/İl:</span> {selectedCustomerData.district || '-'}/{selectedCustomerData.city || '-'}</p>
              </div>
              {(!selectedCustomerData.address || !selectedCustomerData.city || !selectedCustomerData.district) && (
                <p className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                  Uyarı: Müşterinin bazı adres bilgileri eksik. Lütfen müşteri bilgilerini güncelleyin.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Ürünler */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Ürünler
            </label>
            <button
              type="button"
              onClick={addProduct}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-darkGreen hover:bg-lightGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkGreen transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ürün Ekle
            </button>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">Henüz ürün eklenmedi</p>
              <button
                type="button"
                onClick={addProduct}
                className="mt-2 inline-flex items-center px-3 py-1 border border-darkGreen text-sm leading-4 font-medium rounded-md text-darkGreen hover:bg-darkGreen hover:text-white focus:outline-none transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Ürün Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedProducts.map((product, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                  <div className="flex-grow">
                    <select
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-lightGreen focus:border-lightGreen text-sm"
                      value={product.productId}
                      onChange={(e) => updateProduct(index, 'productId', e.target.value)}
                      required
                    >
                      <option value="">Ürün Seçin</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-lightGreen focus:border-lightGreen text-sm"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paket Bilgileri */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-darkGreen mb-3">Paket Boyutları</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Yükseklik (cm)
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-lightGreen focus:border-lightGreen"
                value={packageInfo.height}
                onChange={(e) => setPackageInfo({ ...packageInfo, height: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Genişlik (cm)
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-lightGreen focus:border-lightGreen"
                value={packageInfo.width}
                onChange={(e) => setPackageInfo({ ...packageInfo, width: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Uzunluk (cm)
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-lightGreen focus:border-lightGreen"
                value={packageInfo.length}
                onChange={(e) => setPackageInfo({ ...packageInfo, length: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Ağırlık (kg)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-lightGreen focus:border-lightGreen"
                value={packageInfo.weight}
                onChange={(e) => setPackageInfo({ ...packageInfo, weight: e.target.value })}
                required
              />
            </div>
          </div>
          
          {/* Not */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Not
            </label>
            <textarea
              rows={2}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-lightGreen focus:border-lightGreen text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Sipariş ile ilgili eklemek istediğiniz notlar..."
            />
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-darkGreen hover:bg-lightGreen focus:outline-none transition-colors"
          >
            {loading ? "Kaydediliyor..." : "Sipariş Oluştur"}
          </button>
        </div>
      </form>
    </div>
  );
} 