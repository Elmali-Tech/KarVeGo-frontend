import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Ürün Bilgisi</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ÜRÜN ADI
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ÜRÜN KODU
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ÜRÜN STOK KODU - SKU
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ÜRÜN FİYAT
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  required
                  className="block w-full pr-12 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">TL</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ÜRÜN KDV ORANI
              </label>
              <select
                className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ÜRÜN EN
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  className="block w-full pr-12 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  value={formData.width}
                  onChange={(e) =>
                    setFormData({ ...formData, width: e.target.value })
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">cm</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ÜRÜN BOY
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  className="block w-full pr-12 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  value={formData.height}
                  onChange={(e) =>
                    setFormData({ ...formData, height: e.target.value })
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">cm</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ÜRÜN YÜKSEKLİK
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  className="block w-full pr-12 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  value={formData.length}
                  onChange={(e) =>
                    setFormData({ ...formData, length: e.target.value })
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">cm</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ÜRÜN AĞIRLIK
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  className="block w-full pr-12 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">Kg</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}