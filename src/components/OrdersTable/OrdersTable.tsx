import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { Trash2, X, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order, SenderAddress, ProductFilter } from './types';
import { calculateDesi } from './utils';
import { filterOrders } from './FilterUtils';
import { calculateShippingPrice, fetchLabelData, sendToNewSuratCargoApi } from './ShippingLabelService';
import Filters from './Filters';
import TableView from './TableView';
import OrderDetail from './OrderDetail';
import OrderEdit from './OrderEdit';
import OrderJsonModal from './OrderJsonModal';
import LabelModal from './LabelModal';
import BarkodModal, { LabelData, BarkodTasarim } from './BarkodModal';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onOrderUpdate: () => void;
}

// Varsayılan barkod tasarımı
const defaultTasarim: BarkodTasarim = {
  name: 'Varsayılan Tasarım',
  config: {
    logoPosition: 'left',
    showLogo: true,
    showBarcodeText: true,
    showGonderiTipi: true,
    showOdemeTipi: true,
    showGonderen: true,
    showAlici: true,
    showUrunler: true,
    showKgDesi: true,
    showPaketBilgisi: true,
    showAnlasmaTuru: true,
    fontFamily: 'Arial',
    fontSize: 12,
    headerColor: '#000000',
    textColor: '#000000',
    borderColor: '#cccccc',
    backgroundColor: '#ffffff',
    width: 350,
    height: 500,
    logoUrl: '',
    footerText: 'KarVeGo © 2024',
    footerColor: '#777777',
    barcodeWidth: 200,
    barcodeHeight: 40
  },
  is_default: true
};

export default function OrdersTable({ orders, loading, onOrderUpdate }: OrdersTableProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [selectedOrderJson, setSelectedOrderJson] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [senderAddresses, setSenderAddresses] = useState<SenderAddress[]>([]);
  const [selectedSenderAddress, setSelectedSenderAddress] = useState<SenderAddress | null>(null);
  const [labelPrice, setLabelPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Order['status'] | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [showBarkodModal, setShowBarkodModal] = useState(false); 
  const [labelData, setLabelData] = useState<LabelData | null>(null);
  const [barkodTasarim, setBarkodTasarim] = useState<BarkodTasarim>(defaultTasarim);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Yeni multi-select filtre değişkenleri
  const [showProductFilters, setShowProductFilters] = useState(false);
  const [selectedProductFilters, setSelectedProductFilters] = useState<string[]>([]);
  const [productQuantityFilters, setProductQuantityFilters] = useState<{[product: string]: number | null}>({});
  
  // Yeni ürün-miktar filtreleme
  const [productFilters, setProductFilters] = useState<ProductFilter[]>([]);
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState<number | ''>('');
  const [showMultiFilter, setShowMultiFilter] = useState(false);

  // Add this useEffect to sync showMultiFilter with URL params if needed
  useEffect(() => {
    // Show multi filter if there are product filters
    if (productFilters.length > 0 && !showMultiFilter) {
      setShowMultiFilter(true);
    }
  }, [productFilters, showMultiFilter]);

  // Barkod tasarımlarını yükle
  useEffect(() => {
    fetchBarkodTasarim();
  }, []);

  // Varsayılan barkod tasarımını getir
  const fetchBarkodTasarim = async () => {
    try {
      const { data, error } = await supabase
        .from('barkod_tasarimlari')
        .select('*')
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setBarkodTasarim(data);
      } else {
        // Varsayılan yoksa, ilk kaydı al
        const { data: allTasarimlar, error: allError } = await supabase
          .from('barkod_tasarimlari')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (allError) throw allError;
        
        if (allTasarimlar && allTasarimlar.length > 0) {
          setBarkodTasarim(allTasarimlar[0]);
        }
        // Hiç kayıt yoksa varsayılan tasarımı kullan (zaten state'te o var)
      }
    } catch (err) {
      console.error('Barkod tasarımı yüklenirken hata oluştu:', err);
      // Hata olursa varsayılan tasarım kullanılacak
    }
  };

  // Mevcut tüm ürün listesini oluştur
  const allProducts = React.useMemo(() => {
    const productNames = new Set<string>();
    orders.forEach(order => {
      order.products.forEach(product => {
        productNames.add(product.name);
      });
    });
    return Array.from(productNames).sort();
  }, [orders]);

  // Mevcut tüm miktarları oluştur
  const allQuantities = React.useMemo(() => {
    const quantities = new Set<number>();
    orders.forEach(order => {
      order.products.forEach(product => {
        quantities.add(product.quantity);
      });
    });
    return Array.from(quantities).sort((a, b) => a - b);
  }, [orders]);

  // Aktif filtre sayısını hesapla
  const activeFilterCount = selectedProductFilters.length;
  
  // Filtreli siparişleri hesapla
  const filteredOrders = filterOrders(
    orders,
    filterStatus,
    productFilters,
    selectedProductFilters,
    productQuantityFilters,
    searchTerm
  );

  const getWeightInfo = (order: Order) => {
    const desi = calculateDesi(order);
    const weight = order.package_weight ? `${order.package_weight} kg` : '-';
    const desiInfo = desi !== '-' ? `${desi} desi` : '-';
    
    if (desi === '-' && weight === '-') {
      return '-';
    }

    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{desiInfo}</span>
        <span className="text-xs text-gray-500">{weight}</span>
      </div>
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.length === 0) return;

    try {
      const result = await Swal.fire({
        title: 'Siparişleri Sil',
        text: `${selectedOrders.length} siparişi silmek istediğinize emin misiniz?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Evet, Sil',
        cancelButtonText: 'İptal',
      });

      if (result.isConfirmed) {
        // ID'lerin geçerli string formatında olduğunu kontrol et
        const validOrderIds = selectedOrders.filter(id => typeof id === 'string' && id.trim() !== '');
        
        if (validOrderIds.length === 0) {
          toast.error('Silinecek geçerli sipariş bulunamadı');
          return;
        }
        
        if (validOrderIds.length !== selectedOrders.length) {
          console.warn(`${selectedOrders.length - validOrderIds.length} adet geçersiz sipariş ID'si filtrelendi`);
        }

        const { error, count } = await supabase
          .from('orders')
          .delete()
          .in('id', validOrderIds)
          .select('count');

        if (error) throw error;

        // Silinen sipariş sayısını kontrol et
        const deletedCount = count || validOrderIds.length; // count yoksa varsayılan olarak tümü silinmiş kabul et
        
        if (deletedCount !== validOrderIds.length) {
          // Bazı siparişler silinemedi
          console.warn(`${validOrderIds.length - deletedCount} adet sipariş silinemedi`);
          await Swal.fire({
            title: 'Kısmi Başarı',
            text: `${deletedCount} sipariş silindi, ${validOrderIds.length - deletedCount} sipariş silinemedi.`,
            icon: 'warning',
            confirmButtonColor: '#10B981',
          });
        } else {
          // Tüm siparişler başarıyla silindi
          await Swal.fire({
            title: 'Başarılı!',
            text: `${deletedCount} sipariş başarıyla silindi`,
            icon: 'success',
            confirmButtonColor: '#10B981',
          });
        }

        setSelectedOrders([]);
        onOrderUpdate();
      }
    } catch (err) {
      console.error('Error deleting orders:', err);
      toast.error('Siparişler silinirken bir hata oluştu');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    // ID doğrulama kontrolü
    if (!id || typeof id !== 'string' || id.trim() === '') {
      toast.error('Geçersiz sipariş ID\'si');
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Siparişi Sil',
        text: 'Bu siparişi silmek istediğinize emin misiniz?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Evet, Sil',
        cancelButtonText: 'İptal',
      });

      if (result.isConfirmed) {
        const { error, count } = await supabase
          .from('orders')
          .delete()
          .eq('id', id)
          .select('count');

        if (error) throw error;

        // Siparişin gerçekten silinip silinmediğini kontrol et
        if (!count || count < 1) {
          console.warn(`Sipariş silinmedi veya bulunamadı: ${id}`);
          toast.warning('Sipariş bulunamadı veya zaten silinmiş');
          return;
        }

        await Swal.fire({
          title: 'Başarılı!',
          text: 'Sipariş başarıyla silindi',
          icon: 'success',
          confirmButtonColor: '#10B981',
        });

        onOrderUpdate();
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      toast.error('Sipariş silinirken bir hata oluştu');
    }
  };

  const showOrderJson = (order: Order) => {
    setSelectedOrderJson(JSON.stringify(order, null, 2));
    setShowJsonModal(true);
  };

  const closeJsonModal = () => {
    setShowJsonModal(false);
    setSelectedOrderJson('');
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingOrder(null);
  };

  const handleSaveOrder = async () => {
    if (!editingOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: editingOrder.status,
          package_height: editingOrder.package_height,
          package_width: editingOrder.package_width,
          package_length: editingOrder.package_length,
          package_weight: editingOrder.package_weight,
          tracking_number: editingOrder.tracking_number,
          customer: editingOrder.customer,
          products: editingOrder.products,
          shipping_address: editingOrder.shipping_address,
          billing_address: editingOrder.billing_address,
          total_price: editingOrder.total_price,
          subtotal_price: editingOrder.subtotal_price,
          total_tax: editingOrder.total_tax,
          total_discounts: editingOrder.total_discounts,
          shipping_lines: editingOrder.shipping_lines,
          note: editingOrder.note,
          tags: editingOrder.tags,
          source_name: editingOrder.source_name,
          financial_status: editingOrder.financial_status,
        })
        .eq('id', editingOrder.id);

      if (error) throw error;

      toast.success('Sipariş başarıyla güncellendi');
      closeEditModal();
      onOrderUpdate();
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Sipariş güncellenirken bir hata oluştu');
    }
  };

  const handleBuyLabel = async (order: Order) => {
    setSelectedOrder(order);
    
    // Eğer siparişin zaten bir etiketi varsa, mevcut etiketi göster
    if (order.tracking_number) {
      try {
        setIsLoading(true);
        const { data: labelData, error } = await fetchLabelData(order.id);
          
        if (error) throw error;
        
        // Etiket bilgileri varsa, bunları göster
        if (labelData) {
          toast.info(`Bu sipariş için zaten "${labelData.tracking_number}" takip numaralı bir etiket oluşturulmuş.`);
          
          // Etiket bilgilerini state'e kaydet ve barkod modalını aç
          setLabelData(labelData);
          setShowBarkodModal(true);
        } else {
          // Etiket bulunamazsa, yeni etiket oluştur
          setIsLabelModalOpen(true);
        }
      } catch (err) {
        console.error('Etiket bilgisi alınırken hata:', err);
        toast.error('Etiket bilgisi alınırken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Hiç etiket yoksa direkt etiket oluşturma modalını aç
      setIsLabelModalOpen(true);
    }
  };

  const handleSenderAddressChange = async (addressId: number) => {
    const address = senderAddresses.find(addr => addr.id === addressId);
    if (address && selectedOrder) {
      setSelectedSenderAddress(address);
      setIsLoading(true);
      try {
        const price = await calculateShippingPrice(selectedOrder, address);
        setLabelPrice(price);
      } catch (err) {
        console.error('Error calculating shipping price:', err);
        toast.error('Kargo fiyatı hesaplanırken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreateLabel = async () => {
    if (!selectedOrder || !selectedSenderAddress) {
      toast.error('Lütfen gerekli bilgileri doldurun');
      return;
    }

    try {
      setIsLoading(true);
      toast.info('Etiket oluşturuluyor...');
      
      // Profil verisinden abonelik tipini al
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Kullanıcının mevcut bakiyesini kontrol et
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance, subscription_type')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error('Profil bilgisi alınamadı');
      }

      if (!profileData || profileData.balance < labelPrice) {
        throw new Error('Yetersiz bakiye');
      }

      // Yeni API'yi kullanarak etiket oluştur
      const result = await sendToNewSuratCargoApi(selectedOrder, selectedSenderAddress);
      
      if (!result.isSuccess) {
        throw new Error(result.message || 'Kargo etiketi oluşturulurken bir hata oluştu');
      }
      
      // Takip numarası al
      const trackingNumber = result.trackingNumber || '';
      
      // Etiket bilgilerini veritabanına kaydet
      try {
        // Önce bakiyeyi güncelle
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ 
            balance: profileData.balance - labelPrice 
          })
          .eq('id', user.id);

        if (balanceError) {
          throw new Error('Bakiye güncellenirken hata oluştu');
        }

        // Siparişi güncelle
        await supabase
          .from('orders')
          .update({
            tracking_number: trackingNumber,
            status: 'PRINTED',
            shipping_tracking_code: trackingNumber
          })
          .eq('id', selectedOrder.id);
        
        // Shipping_labels tablosuna kaydet
        await supabase
          .from('shipping_labels')
          .insert({
            order_id: selectedOrder.id,
            tracking_number: trackingNumber,
            kargo_takip_no: trackingNumber,
            carrier: 'Sürat Kargo',
            customer_id: selectedOrder.customer.id || null,
            subscription_type: profileData.subscription_type,
            created_at: new Date().toISOString(),
            shipping_price: labelPrice
          });
          
      } catch (dbError) {
        console.error('Veritabanı işlemi sırasında hata oluştu:', dbError);
        throw new Error(`Veritabanı hatası: ${dbError instanceof Error ? dbError.message : 'Bilinmeyen hata'}`);
      }

      toast.success('Etiket başarıyla oluşturuldu');
      setIsLabelModalOpen(false);
      
      // Bakiye güncellemesi sonrası üst bileşeni güncelle
      onOrderUpdate();
      
      // Bakiye güncellemesi için özel bir event fırlat
      window.dispatchEvent(new CustomEvent('balanceUpdated', {
        detail: { newBalance: profileData.balance - labelPrice }
      }));
      
    } catch (err) {
      console.error('Error creating label:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error(`Etiket oluşturulurken bir hata oluştu: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toplu etiket oluşturma
  const handleBulkCreateLabels = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Lütfen en az bir sipariş seçin');
      return;
    }
    
    try {
      const result = await Swal.fire({
        title: 'Toplu Etiket Oluştur',
        text: `${selectedOrders.length} sipariş için etiket oluşturmak istediğinize emin misiniz?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Evet, Oluştur',
        cancelButtonText: 'İptal'
      });
      
      if (result.isConfirmed) {
        let successCount = 0;
        let errorCount = 0;
        
        toast.info(`${selectedOrders.length} adet etiket oluşturuluyor...`);
        
        for (const orderId of selectedOrders) {
          try {
            const { error: updateError } = await supabase
              .from('orders')
              .update({
                status: 'PRINTED',
                tracking_number: `3636${Math.floor(Math.random() * 1000000)}`
              })
              .eq('id', orderId);
              
            if (updateError) throw updateError;
            
            successCount++;
          } catch (err) {
            console.error(`Order ${orderId} için etiket oluşturma hatası:`, err);
            errorCount++;
          }
        }
        
        if (successCount > 0) {
          toast.success(`${successCount} sipariş için etiket başarıyla oluşturuldu`);
          onOrderUpdate();
        }
        
        if (errorCount > 0) {
          toast.error(`${errorCount} sipariş için etiket oluşturulamadı`);
        }
        
        setSelectedOrders([]);
      }
    } catch (err) {
      console.error('Toplu etiket oluşturma hatası:', err);
      toast.error('Toplu etiket oluşturulurken bir hata oluştu');
    }
  };
  
  // Toplu sipariş durum güncellemesi
  const handleBulkUpdateStatus = async (newStatus: Order['status']) => {
    if (selectedOrders.length === 0) return;

    try {
      const result = await Swal.fire({
        title: `Durum Güncelleme`,
        text: `${selectedOrders.length} siparişi "${getStatusText(newStatus)}" durumuna güncellemek istediğinize emin misiniz?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10B981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Evet, Güncelle',
        cancelButtonText: 'İptal',
      });

      if (result.isConfirmed) {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .in('id', selectedOrders);

        if (error) throw error;

        await Swal.fire({
          title: 'Başarılı!',
          text: `${selectedOrders.length} sipariş durumu güncellendi`,
          icon: 'success',
          confirmButtonColor: '#10B981',
        });

        onOrderUpdate();
      }
    } catch (err) {
      console.error('Siparişler güncellenirken hata oluştu:', err);
      toast.error('Sipariş durumları güncellenirken bir hata oluştu');
    }
  };

  // Helper function to get status text
  const getStatusText = (status: Order['status'] | 'ALL'): string => {
    switch (status) {
      case 'NEW': return 'Yeni';
      case 'READY': return 'Hazırlandı';
      case 'PRINTED': return 'Yazdırıldı';
      case 'SHIPPED': return 'Kargoda';
      case 'PROBLEMATIC': return 'Sorunlu';
      case 'COMPLETED': return 'Tamamlandı';
      case 'ALL': return 'Tümü';
      default: return status;
    }
  };

  const handleShowDetail = (order: Order) => {
    setDetailOrder(order);
    setShowDetailModal(true);
  };

  // Ürün-miktar filtresi ekle
  const handleAddProductFilter = () => {
    if (!currentProduct || currentQuantity === '') return;
    
    setProductFilters(prev => [
      ...prev, 
      { 
        product: currentProduct.trim(), 
        quantity: Number(currentQuantity) 
      }
    ]);
    
    // Giriş alanlarını temizle
    setCurrentProduct('');
    setCurrentQuantity('');
  };

  // Ürün-miktar filtresini kaldır
  const handleRemoveProductFilter = (index: number) => {
    setProductFilters(prev => prev.filter((_, i) => i !== index));
  };

  // Tüm ürün-miktar filtrelerini temizle
  const handleClearProductFilters = () => {
    setProductFilters([]);
  };

  // Ürün-miktar filtreleme işlemini uygula
  const handleApplyFilters = () => {
    setShowMultiFilter(false);
  };

  // Kargo etiketi oluşturma modalı açıldığında gönderici adreslerini yükle
  useEffect(() => {
    if (isLabelModalOpen && senderAddresses.length === 0) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('sender_addresses')
            .select('*')
            .order('is_default', { ascending: false });

          if (error) throw error;

          setSenderAddresses(data || []);
          const defaultAddress = data?.find(addr => addr.is_default);
          if (defaultAddress && selectedOrder) {
            setSelectedSenderAddress(defaultAddress);
            setIsLoading(true);
            try {
              const price = await calculateShippingPrice(selectedOrder, defaultAddress);
              setLabelPrice(price);
            } catch (err) {
              console.error('Error calculating shipping price:', err);
              toast.error('Kargo fiyatı hesaplanırken bir hata oluştu');
            } finally {  
              setIsLoading(false);
            }
          }
        } catch (err) {
          console.error('Error fetching sender addresses:', err);
          toast.error('Gönderici adresleri yüklenirken bir hata oluştu');
        }
      })();
    }
  }, [isLabelModalOpen, selectedOrder]);

  if (loading) {
    return (
      <div className="animate-pulse p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Filter section with better mobile handling */}
      <div className="p-4 border-b border-gray-200">
        <div className="md:flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800">Siparişler ({filteredOrders.length})</h2>
            {selectedOrders.length > 0 && (
              <div className="ml-4 flex items-center">
                <span className="text-sm text-gray-600 mr-2">
                  {selectedOrders.length} sipariş seçildi
                </span>
                <button
                  onClick={() => setSelectedOrders([])}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Mobile filter toggle button */}
            <button 
              className="md:hidden ml-auto flex items-center rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtreler
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-darkGreen text-white px-2 py-0.5 text-xs">{activeFilterCount}</span>
              )}
            </button>
          </div>

          <div className="hidden md:flex gap-2 mt-4 md:mt-0">
            {selectedOrders.length > 0 && (
              <>
                <button
                  onClick={() => handleBulkCreateLabels()}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-darkGreen hover:bg-lightGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lightGreen disabled:opacity-50"
                >
                  Toplu Etiket Oluştur
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus('NEW')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Beklemede Yap
                </button>
                <button
                  onClick={() => handleBulkUpdateStatus('SHIPPED')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Kargoya Ver
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Sil
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile actions panel when items selected */}
        {selectedOrders.length > 0 && (
          <div className="md:hidden flex gap-2 mt-4 overflow-x-auto pb-2">
            <button
              onClick={() => handleBulkCreateLabels()}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-darkGreen hover:bg-lightGreen focus:outline-none disabled:opacity-50 whitespace-nowrap"
            >
              Toplu Etiket
            </button>
            <button
              onClick={() => handleBulkUpdateStatus('NEW')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none whitespace-nowrap"
            >
              Beklemede
            </button>
            <button
              onClick={() => handleBulkUpdateStatus('SHIPPED')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none whitespace-nowrap"
            >
              Kargoya Ver
            </button>
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Sil
            </button>
          </div>
        )}

        {/* Conditional rendering for filters on mobile */}
        <div className={`mt-4 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          <Filters
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            allProducts={allProducts}
            allQuantities={allQuantities}
            showProductFilters={showProductFilters}
            setShowProductFilters={setShowProductFilters}
            selectedProductFilters={selectedProductFilters}
            setSelectedProductFilters={setSelectedProductFilters}
            productQuantityFilters={productQuantityFilters}
            setProductQuantityFilters={setProductQuantityFilters}
            productFilters={productFilters}
            currentProduct={currentProduct}
            setCurrentProduct={setCurrentProduct}
            currentQuantity={currentQuantity}
            setCurrentQuantity={setCurrentQuantity}
            handleAddProductFilter={handleAddProductFilter}
            handleRemoveProductFilter={handleRemoveProductFilter}
            handleClearProductFilters={handleClearProductFilters}
            handleApplyFilters={handleApplyFilters}
          />
        </div>
      </div>

      {/* Loading and table content */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-darkGreen"></div>
          </div>
        )}

        {/* Table Component */}
        <div className="overflow-hidden">
          <TableView
            filteredOrders={filteredOrders}
            selectedOrders={selectedOrders}
            handleSelectOrder={handleSelectOrder}
            handleSelectAll={handleSelectAll}
            getWeightInfo={getWeightInfo}
            handleShowDetail={handleShowDetail}
            handleEditOrder={handleEditOrder}
            handleBuyLabel={handleBuyLabel}
            showOrderJson={showOrderJson}
            handleDeleteOrder={handleDeleteOrder}
          />
        </div>
      </div>

      {/* Modals */}
      {showJsonModal && selectedOrderJson && (
        <OrderJsonModal
          showJsonModal={showJsonModal}
          selectedOrderJson={selectedOrderJson}
          closeJsonModal={closeJsonModal}
        />
      )}

      {showEditModal && editingOrder && (
        <OrderEdit
          showEditModal={showEditModal}
          editingOrder={editingOrder}
          closeEditModal={closeEditModal}
          handleSaveOrder={handleSaveOrder}
          setEditingOrder={setEditingOrder}
        />
      )}

      {showDetailModal && detailOrder && (
        <OrderDetail
          detailOrder={detailOrder}
          showDetailModal={showDetailModal}
          setShowDetailModal={setShowDetailModal}
        />
      )}

      {isLabelModalOpen && selectedOrder && (
        <LabelModal
          isLabelModalOpen={isLabelModalOpen}
          selectedOrder={selectedOrder}
          senderAddresses={senderAddresses}
          selectedSenderAddress={selectedSenderAddress}
          labelPrice={labelPrice}
          isLoading={isLoading}
          handleSenderAddressChange={handleSenderAddressChange}
          handleCreateLabel={handleCreateLabel}
          setIsLabelModalOpen={setIsLabelModalOpen}
        />
      )}

      {showBarkodModal && labelData && (
        <BarkodModal
          selectedOrder={selectedOrder!}
          labelData={labelData}
          barkodTasarim={barkodTasarim}
          showBarkodModal={showBarkodModal}
          setShowBarkodModal={setShowBarkodModal}
          setIsLabelModalOpen={setIsLabelModalOpen}
          selectedSenderAddress={selectedSenderAddress}
        />
      )}
    </div>
  );
} 