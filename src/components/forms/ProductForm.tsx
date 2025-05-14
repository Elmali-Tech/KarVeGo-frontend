import React, { useState } from 'react';
import { Package, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Modal } from '../common/Modal';

interface ProductFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductForm({ onClose, onSuccess }: ProductFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sku: '',
    price: '',
    vat_rate: '18',
    width: '',
    height: '',
    length: '',
    weight: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('products').insert({
        user_id: user?.id,
        name: formData.name,
        code: formData.code,
        sku: formData.sku,
        price: parseFloat(formData.price),
        vat_rate: parseFloat(formData.vat_rate),
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      });

      if (error) throw error;

      toast.success('Ürün başarıyla eklendi');
      onSuccess();
    } catch (error) {
      console.error('Ürün eklenirken bir hata oluştu:', error);
      toast.error('Ürün eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Ürün Ekle" isOpen={true} onClose={onClose}>
      <div className="p-4 md:p-6">
        <div className="mb-6 flex items-center text-darkGreen">
          <Package className="mr-2 h-5 w-5" />
          <h2 className="text-lg font-medium">Ürün Bilgileri</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ürün Adı */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ÜRÜN ADI
            </label>
            <input
              type="text"
              required
              placeholder="Ürün adını girin"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-lightGreen focus:border-lightGreen sm:text-sm"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* Ürün Kodu ve SKU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ÜRÜN KODU
              </label>
              <input
                type="text"
                placeholder="Örn: PRD001"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-lightGreen focus:border-lightGreen sm:text-sm"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                STOK KODU (SKU)
              </label>
              <input
                type="text"
                placeholder="Örn: SKU12345"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-lightGreen focus:border-lightGreen sm:text-sm"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </div>
          </div>

          {/* Fiyat ve KDV */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ÜRÜN FİYATI
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="block w-full pr-12 rounded-md border-gray-300 shadow-sm focus:ring-lightGreen focus:border-lightGreen sm:text-sm"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">TL</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KDV ORANI
              </label>
              <select
                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-lightGreen focus:border-lightGreen sm:text-sm"
                value={formData.vat_rate}
                onChange={(e) =>
                  setFormData({ ...formData, vat_rate: e.target.value })
                }
              >
                <option value="0">%0</option>
                <option value="1">%1</option>
                <option value="8">%8</option>
                <option value="18">%18</option>
              </select>
            </div>
          </div>

          {/* Boyutlar */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-darkGreen mb-3">Ürün Boyutları ve Ağırlık</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  GENİŞLİK
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="block w-full pr-8 rounded-md border-gray-300 shadow-sm focus:ring-lightGreen focus:border-lightGreen sm:text-sm"
                    value={formData.width}
                    onChange={(e) =>
                      setFormData({ ...formData, width: e.target.value })
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <span className="text-gray-400 text-xs">cm</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  YÜKSEKLİK
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="block w-full pr-8 rounded-md border-gray-300 shadow-sm focus:ring-lightGreen focus:border-lightGreen sm:text-sm"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({ ...formData, height: e.target.value })
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <span className="text-gray-400 text-xs">cm</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  UZUNLUK
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="block w-full pr-8 rounded-md border-gray-300 shadow-sm focus:ring-lightGreen focus:border-lightGreen sm:text-sm"
                    value={formData.length}
                    onChange={(e) =>
                      setFormData({ ...formData, length: e.target.value })
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <span className="text-gray-400 text-xs">cm</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  AĞIRLIK
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="block w-full pr-8 rounded-md border-gray-300 shadow-sm focus:ring-lightGreen focus:border-lightGreen sm:text-sm"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <span className="text-gray-400 text-xs">kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bilgilendirme notu */}
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-100">
            <p>* Boyut ve ağırlık bilgileri, kargo hesaplamalarında kullanılacaktır. Doğru ölçüler girilmesi önerilir.</p>
          </div>

          {/* Butonlar */}
          <div className="flex justify-end space-x-3 pt-4">
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-darkGreen hover:bg-lightGreen focus:outline-none transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Ürünü Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}