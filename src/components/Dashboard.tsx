import React, { useState, useEffect } from 'react';
import { Package, Plus, Download, Store, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import ProductForm from './forms/ProductForm';
import Layout from './layout/Layout';

interface Product {
  id: string;
  name: string;
  code: string;
  sku: string;
  price: number;
  vat_rate: number;
  width: number;
  height: number;
  length: number;
  weight: number;
  created_at: string;
  shopify_store?: string;
}

interface ShopifyIntegration {
  shop_url: string;
  is_active: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [shopifyStore, setShopifyStore] = useState<ShopifyIntegration | null>(null);
  const [importProgress, setImportProgress] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchShopifyIntegration();
  }, [user]);

  const fetchShopifyIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('shop_url, is_active')
        .eq('type', 'SHOPIFY')
        .eq('user_id', user?.id)
        .single();

      if (!error && data) {
        setShopifyStore(data);
      }
    } catch (err) {
      console.error('Failed to fetch Shopify integration:', err);
    }
  };

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Ürünler yüklenirken bir hata oluştu:', error);
      toast.error('Ürünler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      const confirmResult = await Swal.fire({
        title: 'Ürünü Sil',
        text: `"${productName}" ürününü silmek istediğinize emin misiniz?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Evet, Sil',
        cancelButtonText: 'İptal',
      });

      if (confirmResult.isConfirmed) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (error) throw error;

        await Swal.fire({
          title: 'Başarılı!',
          text: `"${productName}" başarıyla silindi`,
          icon: 'success',
          confirmButtonColor: '#10B981',
        });

        fetchProducts();
      }
    } catch (error) {
      console.error('Ürün silinirken bir hata oluştu:', error);
      Swal.fire({
        title: 'Hata!',
        text: 'Ürün silinirken bir hata oluştu',
        icon: 'error',
        confirmButtonColor: '#EF4444',
      });
    }
  };

  const importShopifyProducts = async () => {
    try {
      setImporting(true);
      setImportProgress('Shopify bağlantısı kontrol ediliyor...');

      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('*')
        .eq('type', 'SHOPIFY')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();

      if (integrationError || !integration) {
        toast.error('Aktif bir Shopify bağlantısı bulunamadı');
        return;
      }

      setImportProgress('Oturum doğrulanıyor...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Oturum bilgisi alınamadı');
        return;
      }

      setImportProgress('Shopify ürünleri alınıyor...');

      const response = await fetch(
        'https://odimfgfsorhrrvkfddjd.supabase.co/functions/v1/products',
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ürünler içe aktarılırken bir hata oluştu');
      }

      setImportProgress('Ürünler veritabanına kaydediliyor...');

      const result = await response.json();
      toast.success(`${result.count} ürün başarıyla içe aktarıldı`);
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ürünler içe aktarılırken bir hata oluştu');
    } finally {
      setImporting(false);
      setImportProgress('');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Package className="w-8 h-8 text-darkGreen" />
          <h1 className="text-2xl font-bold text-black">Ürün Yönetimi</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Store className="w-6 h-6 text-darkGreen flex-shrink-0" />
              <div>
                <h2 className="text-lg font-medium text-black">Shopify Entegrasyonu</h2>
                {shopifyStore ? (
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600">{shopifyStore.shop_url}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      shopifyStore.is_active 
                        ? 'bg-lightGreen bg-opacity-20 text-darkGreen' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {shopifyStore.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-600">
                    Henüz Shopify mağazası bağlanmamış
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 md:mt-0">
              <a
                href="/ayarlar/entegrasyon"
                className="text-sm text-darkGreen hover:text-lightGreen flex items-center gap-1 transition-colors"
              >
                Entegrasyon Ayarları
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={importShopifyProducts}
                disabled={importing || !shopifyStore?.is_active}
                className="flex items-center gap-2 bg-lightGreen text-white px-3 py-2 rounded-lg hover:bg-darkGreen transition-colors disabled:opacity-50 text-sm w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" />
                {importing ? 'İçe Aktarılıyor...' : 'Shopify Ürünlerini İçe Aktar'}
              </button>
              <button
                onClick={() => setShowProductForm(true)}
                className="flex items-center gap-2 bg-darkGreen text-white px-3 py-2 rounded-lg hover:bg-lightGreen transition-colors text-sm w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                Yeni Ürün Ekle
              </button>
            </div>
          </div>
        </div>

        {importProgress && (
          <div className="bg-lightGreen bg-opacity-10 border border-lightGreen rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-darkGreen border-t-transparent"></div>
              <span className="text-darkGreen">{importProgress}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün Adı
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ürün Kodu
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok Kodu
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fiyat
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KDV
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Boyutlar
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shopify
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-black">
                        {product.name}
                      </td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {product.code}
                      </td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {product.sku}
                      </td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {product.price} TL
                      </td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        %{product.vat_rate}
                      </td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {product.width}x{product.height}x{product.length} cm
                      </td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {product.shopify_store ? (
                          <span className="inline-flex items-center">
                            <Store className="w-4 h-4 mr-1 text-blue-500" />
                            <span className="hidden sm:inline">{product.shopify_store}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm">
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showProductForm && (
          <ProductForm
            onClose={() => setShowProductForm(false)}
            onSuccess={() => {
              setShowProductForm(false);
              fetchProducts();
            }}
          />
        )}
      </div>
    </Layout>
  );
}