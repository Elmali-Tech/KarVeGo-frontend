import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Download,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  FileText,
  ExternalLink,
  Store,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import Layout from '../../components/layout/Layout';
import OrdersTable from '../../components/OrdersTable';
import OrderForm from '../../components/OrderForm';
import { Modal } from '../../components/common/Modal';

interface Order {
  id: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  status: 'NEW' | 'READY' | 'PRINTED' | 'SHIPPED' | 'PROBLEMATIC' | 'COMPLETED';
  created_at: string;
  products: {
    name: string;
    quantity: number;
    price?: number;
    total_discount?: number;
    vendor?: string;
    sku?: string;
  }[];
  shipping_address?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    phone?: string;
    name?: string;
    company?: string;
  };
  billing_address?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    name?: string;
    company?: string;
  };
  total_weight: number;
  package_height: number;
  package_width: number;
  package_length: number;
  package_weight: number;
  tracking_number?: string;
  total_price?: number;
  subtotal_price?: number;
  total_tax?: number;
  total_discounts?: number;
  note?: string;
  tags?: string[];
  source_name?: string;
  financial_status?: string;
}

interface ShopifyIntegration {
  shop_url: string;
  is_active: boolean;
}

// Shopify siparişlerini veritabanına kaydet için tipler
interface ShopifyOrder {
  id: string;
  name: string;
  created_at: string;
  total_weight: number;
  tracking_number?: string;
  package_height?: number;
  package_width?: number;
  package_length?: number;
  package_weight?: number;
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  shipping_address: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    name?: string;
    company?: string;
    phone?: string;
  };
  billing_address: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country?: string;
    name?: string;
    company?: string;
  };
  products: {
    name?: string;
    title?: string;
    sku?: string;
    quantity: number;
  }[];
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [shopifyStore, setShopifyStore] = useState<ShopifyIntegration | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState<Order['status'] | 'ALL'>('ALL');

  const fetchOrders = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          order_created_at,
          total_weight,
          tracking_number,
          package_height,
          package_width,
          package_length,
          package_weight,
          customer,
          products,
          shipping_address,
          billing_address,
          total_price,
          subtotal_price,
          total_tax,
          total_discounts,
          note,
          tags,
          source_name,
          financial_status
        `)
        .order('order_created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders = data.map(order => ({
        id: order.id,
        status: order.status,
        created_at: order.order_created_at,
        total_weight: order.total_weight,
        tracking_number: order.tracking_number,
        package_height: order.package_height,
        package_width: order.package_width,
        package_length: order.package_length,
        package_weight: order.package_weight,
        customer: order.customer,
        products: order.products,
        shipping_address: order.shipping_address,
        billing_address: order.billing_address,
        total_price: order.total_price,
        subtotal_price: order.subtotal_price,
        total_tax: order.total_tax,
        total_discounts: order.total_discounts,
        note: order.note,
        tags: order.tags,
        source_name: order.source_name,
        financial_status: order.financial_status
      }));

      setOrders(formattedOrders);
      applyStatusFilter(formattedOrders, activeStatusFilter);
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Siparişler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchShopifyIntegration = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('integrations')
        .select('shop_url, is_active')
        .eq('type', 'SHOPIFY')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setShopifyStore(data);
      }
    } catch (err) {
      console.error('Failed to fetch Shopify integration:', err);
    }
  };

  const calculateDefaultDimensions = () => {
    // 1 desi = 3000 cm³
    // Default olarak 10x10x30 cm boyutlarını kullanıyoruz (3000 cm³ = 1 desi)
    return {
      height: 10,
      width: 10,
      length: 30,
      weight: 1 // 1 kg
    };
  };

  const importShopifyOrders = async () => {
    try {
      setImporting(true);
      setImportLogs([]);
      setImportProgress('Shopify bağlantısı kontrol ediliyor...');
      addImportLog('🔍 Shopify bağlantısı kontrol ediliyor...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session Error:', sessionError);
        addImportLog(`❌ Oturum hatası: ${sessionError.message}`);
        toast.error('Oturum hatası oluştu');
        return;
      }

      if (!session) {
        console.error('No session found');
        addImportLog('❌ Oturum bulunamadı');
        toast.error('Oturum bulunamadı');
        return;
      }

      console.log('Session:', session);
      addImportLog('✅ Oturum doğrulandı');
      setImportProgress('Shopify siparişleri alınıyor...');

      // Shopify siparişlerini al
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Shopify Orders Error Response:', errorData);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const shopifyOrders = await response.json() as ShopifyOrder[];
      console.log('Shopify Orders Response:', shopifyOrders);
      addImportLog(`✅ ${shopifyOrders.length} sipariş alındı`);
      addImportLog('📦 Siparişler işleniyor...');

      // Siparişleri veritabanına kaydet
      const { error: insertError } = await supabase
        .from('orders')
        .insert(
          shopifyOrders.map((order: ShopifyOrder) => {
            const defaultDimensions = calculateDefaultDimensions();
            const packageHeight = order.package_height || defaultDimensions.height;
            const packageWidth = order.package_width || defaultDimensions.width;
            const packageLength = order.package_length || defaultDimensions.length;
            const packageWeight = order.package_weight || defaultDimensions.weight;

            return {
              user_id: session.user.id,
              shopify_id: order.id,
              name: order.name,
              status: 'NEW',
              order_created_at: order.created_at,
              total_weight: order.total_weight,
              tracking_number: order.tracking_number,
              package_height: packageHeight,
              package_width: packageWidth,
              package_length: packageLength,
              package_weight: packageWeight,
              customer: {
                name: order.customer.name,
                email: order.customer.email,
                phone: order.customer.phone,
              },
              shipping_address: order.shipping_address,
              billing_address: order.billing_address,
              products: order.products.map((product) => ({
                name: product.name || product.title || 'İsimsiz Ürün',
                sku: product.sku || '',
                quantity: product.quantity
              })),
            };
          })
        );

      if (insertError) {
        console.error('Error saving orders:', insertError);
        addImportLog(`❌ Siparişler kaydedilirken hata oluştu: ${insertError.message}`);
        toast.error('Siparişler kaydedilirken hata oluştu');
        return;
      }

      addImportLog('✅ Siparişler başarıyla kaydedildi');
      toast.success(`${shopifyOrders.length} sipariş başarıyla içe aktarıldı`);
      
      // Siparişleri yeniden yükle
      fetchOrders();
    } catch (err) {
      console.error('Error importing Shopify orders:', err);
      addImportLog(`❌ Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
      toast.error('Siparişler alınırken bir hata oluştu');
    } finally {
      setImporting(false);
      setImportProgress('');
    }
  };

  const addImportLog = (log: string) => {
    setImportLogs((prev) => [...prev, log]);
  };

  // Durum filtreleme fonksiyonu
  const applyStatusFilter = (ordersToFilter: Order[], status: Order['status'] | 'ALL') => {
    if (status === 'ALL') {
      setFilteredOrders(ordersToFilter);
    } else {
      setFilteredOrders(ordersToFilter.filter(order => order.status === status));
    }
  };

  // Durum kartına tıklandığında filtreleme işlemi
  const handleStatusCardClick = (status: Order['status'] | 'ALL') => {
    setActiveStatusFilter(status);
    applyStatusFilter(orders, status);
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchShopifyIntegration();
    }
  }, [user]);

  // Filtreleme durumu değiştiğinde
  useEffect(() => {
    if (orders.length > 0) {
      applyStatusFilter(orders, activeStatusFilter);
    }
  }, [activeStatusFilter, orders]);

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
        {/* Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4">
          {/* Tümü Kartı */}
          <div 
            className={`bg-white rounded-lg shadow p-3 md:p-4 cursor-pointer transition-all
              ${activeStatusFilter === 'ALL' 
                ? 'border-2 border-blue-500 ring-2 ring-blue-500 ring-opacity-30' 
                : 'border-l-4 border-gray-400 hover:shadow-md'}`}
            onClick={() => handleStatusCardClick('ALL')}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-700">Tüm Siparişler</h3>
                <p className="text-xl md:text-2xl font-semibold text-gray-700">
                  {orders.length}
                </p>
              </div>
            </div>
          </div>
          
          <div 
            className={`bg-white rounded-lg shadow p-3 md:p-4 cursor-pointer transition-all
              ${activeStatusFilter === 'NEW' 
                ? 'border-2 border-blue-500 ring-2 ring-blue-500 ring-opacity-30' 
                : 'border-l-4 border-blue-500 hover:shadow-md'}`}
            onClick={() => handleStatusCardClick('NEW')}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-700">Yeni Siparişler</h3>
                <p className="text-xl md:text-2xl font-semibold text-blue-600">
                  {orders.filter(o => o.status === 'NEW').length}
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white rounded-lg shadow p-3 md:p-4 cursor-pointer transition-all
              ${activeStatusFilter === 'READY' 
                ? 'border-2 border-yellow-500 ring-2 ring-yellow-500 ring-opacity-30' 
                : 'border-l-4 border-yellow-500 hover:shadow-md'}`}
            onClick={() => handleStatusCardClick('READY')}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-700">Hazırlanan</h3>
                <p className="text-xl md:text-2xl font-semibold text-yellow-600">
                  {orders.filter(o => o.status === 'READY').length}
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white rounded-lg shadow p-3 md:p-4 cursor-pointer transition-all
              ${activeStatusFilter === 'PRINTED' 
                ? 'border-2 border-purple-500 ring-2 ring-purple-500 ring-opacity-30' 
                : 'border-l-4 border-purple-500 hover:shadow-md'}`}
            onClick={() => handleStatusCardClick('PRINTED')}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-700">Yazdırılan</h3>
                <p className="text-xl md:text-2xl font-semibold text-purple-600">
                  {orders.filter(o => o.status === 'PRINTED').length}
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white rounded-lg shadow p-3 md:p-4 cursor-pointer transition-all
              ${activeStatusFilter === 'SHIPPED' 
                ? 'border-2 border-green-500 ring-2 ring-green-500 ring-opacity-30' 
                : 'border-l-4 border-green-500 hover:shadow-md'}`}
            onClick={() => handleStatusCardClick('SHIPPED')}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <Truck className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-700">Kargoya Verilen</h3>
                <p className="text-xl md:text-2xl font-semibold text-green-600">
                  {orders.filter(o => o.status === 'SHIPPED').length}
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white rounded-lg shadow p-3 md:p-4 cursor-pointer transition-all
              ${activeStatusFilter === 'PROBLEMATIC' 
                ? 'border-2 border-red-500 ring-2 ring-red-500 ring-opacity-30' 
                : 'border-l-4 border-red-500 hover:shadow-md'}`}
            onClick={() => handleStatusCardClick('PROBLEMATIC')}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-700">Sorunlu</h3>
                <p className="text-xl md:text-2xl font-semibold text-red-600">
                  {orders.filter(o => o.status === 'PROBLEMATIC').length}
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`bg-white rounded-lg shadow p-3 md:p-4 cursor-pointer transition-all
              ${activeStatusFilter === 'COMPLETED' 
                ? 'border-2 border-teal-500 ring-2 ring-teal-500 ring-opacity-30' 
                : 'border-l-4 border-teal-500 hover:shadow-md'}`}
            onClick={() => handleStatusCardClick('COMPLETED')}
          >
            <div className="flex items-center gap-2 md:gap-3">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-teal-500" />
              <div>
                <h3 className="text-xs md:text-sm font-medium text-gray-700">Tamamlanan</h3>
                <p className="text-xl md:text-2xl font-semibold text-teal-600">
                  {orders.filter(o => o.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shopify Integration Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-lg shadow p-4 md:p-6 gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Store className="w-6 h-6 text-darkGreen shrink-0" />
            <div>
              <h2 className="text-base md:text-lg font-medium text-gray-900">Shopify Entegrasyonu</h2>
              {shopifyStore ? (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs md:text-sm text-gray-600">{shopifyStore.shop_url}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    shopifyStore.is_active 
                      ? 'bg-lightGreen text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {shopifyStore.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-xs md:text-sm text-gray-600">
                  Henüz Shopify mağazası bağlanmamış
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2 sm:mt-0">
            <a
              href="/ayarlar/entegrasyon"
              className="text-xs md:text-sm text-darkGreen hover:text-lightGreen flex items-center gap-1 w-full sm:w-auto"
            >
              Entegrasyon Ayarları
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
            </a>
            <button
              onClick={importShopifyOrders}
              disabled={importing || !shopifyStore?.is_active}
              className="flex items-center justify-center gap-1 md:gap-2 bg-darkGreen text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-lightGreen transition-colors disabled:opacity-50 text-xs md:text-sm w-full sm:w-auto"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
              {importing ? 'İçe Aktarılıyor...' : 'Shopify Siparişlerini İçe Aktar'}
            </button>
          </div>
        </div>

        {/* Import Progress */}
        {importProgress && (
          <div className="bg-lightGreen bg-opacity-10 border border-lightGreen rounded-lg p-3 md:p-4 overflow-x-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-darkGreen border-t-transparent"></div>
              <span className="text-darkGreen font-medium text-xs md:text-sm">{importProgress}</span>
            </div>
            <div className="space-y-1 text-xs md:text-sm text-darkGreen font-mono">
              {importLogs.map((log, index) => (
                <div key={index} className="overflow-x-auto whitespace-nowrap md:whitespace-normal">{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Filtreleme Bilgisi */}
        {activeStatusFilter !== 'ALL' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-700 text-xs md:text-sm">
                {activeStatusFilter === 'NEW' && 'Yeni Siparişler'}
                {activeStatusFilter === 'READY' && 'Hazırlanan Siparişler'}
                {activeStatusFilter === 'PRINTED' && 'Yazdırılan Siparişler'}
                {activeStatusFilter === 'SHIPPED' && 'Kargoya Verilen Siparişler'}
                {activeStatusFilter === 'PROBLEMATIC' && 'Sorunlu Siparişler'}
                {activeStatusFilter === 'COMPLETED' && 'Tamamlanan Siparişler'}
                {' '}gösteriliyor.
              </span>
              <span className="text-xs text-blue-600">({filteredOrders.length} sipariş)</span>
            </div>
            <button 
              className="text-blue-600 hover:text-blue-800 text-xs md:text-sm flex items-center gap-1"
              onClick={() => handleStatusCardClick('ALL')}
            >
              Filtreyi Temizle
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-3 md:p-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base md:text-lg font-medium text-gray-900">Siparişler</h2>
              <button
                onClick={() => setShowNewOrderModal(true)}
                className="flex items-center justify-center gap-1 md:gap-2 bg-darkGreen text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-lightGreen transition-colors text-xs md:text-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                Yeni Sipariş
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <OrdersTable
              orders={filteredOrders}
              loading={loading}
              onOrderUpdate={fetchOrders}
            />
          </div>
        </div>

        {/* Yeni Sipariş Modal */}
        {showNewOrderModal && (
          <Modal
            title="Yeni Sipariş Oluştur"
            isOpen={showNewOrderModal}
            onClose={() => setShowNewOrderModal(false)}
          >
            <OrderForm
              onClose={() => setShowNewOrderModal(false)}
              onSuccess={() => {
                setShowNewOrderModal(false);
                fetchOrders();
                toast.success('Sipariş başarıyla oluşturuldu');
              }}
            />
          </Modal>
        )}
      </div>
    </Layout>
  );
}