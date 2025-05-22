import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { Trash2, X, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order, SenderAddress, ProductFilter } from './types';
import { calculateDesi } from './utils';
import { filterOrders } from './FilterUtils';
import { calculateShippingPrice, fetchLabelData, sendToNewSuratCargoApi, cancelSuratCargoLabel } from './ShippingLabelService';
import { createBulkLabels } from './BulkLabelService';
import Filters from './Filters';
import TableView from './TableView';
import OrderDetail from './OrderDetail';
import OrderEdit from './OrderEdit';
import OrderJsonModal from './OrderJsonModal';
import LabelModal from './LabelModal';
import BarkodModal, { LabelData } from './BarkodModal';
import type { BarkodTasarim } from './BarkodModal';
import { cancelBulkOrders } from './BulkCancelService';

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
    logoWidth: 100,
    logoHeight: 50,
    footerText: 'KarVeGo © 2024',
    footerColor: '#777777',
    barcodeWidth: 200,
    barcodeHeight: 40
  },
  user_id: '',
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
  const [balanceError, setBalanceError] = useState<string>('');
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
      // Kullanıcı kimliğini al
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Kullanıcı oturumu bulunamadı');
        return;
      }
      
      // Kullanıcının varsayılan tasarımını veya herhangi bir tasarımını al
      const { data, error } = await supabase
        .from('barkod_tasarimlari')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Varsayılan tasarım varsa kullan
        setBarkodTasarim(data);
      } else {
        // Varsayılan yoksa, en son oluşturulan tasarımı al
        const { data: allTasarimlar, error: allError } = await supabase
          .from('barkod_tasarimlari')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (allError) throw allError;
        
        if (allTasarimlar && allTasarimlar.length > 0) {
          setBarkodTasarim(allTasarimlar[0]);
        } else {
          // Hiç tasarım yoksa varsayılan tasarımı kullan
          // Varsayılan tasarımın user_id değerini güncelle
          const newDefaultTasarim = {
            ...defaultTasarim,
            user_id: user.id
          };
          setBarkodTasarim(newDefaultTasarim);
          
          // Kullanıcı için varsayılan tasarımı oluştur
          try {
            await supabase
              .from('barkod_tasarimlari')
              .insert([newDefaultTasarim]);
            console.log('Varsayılan barkod tasarımı oluşturuldu');
          } catch (insertError) {
            console.error('Varsayılan tasarım oluşturulamadı:', insertError);
          }
        }
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

    // Silinecek siparişleri kontrol et
    const validOrderIds = selectedOrders.filter(id => typeof id === 'string' && id.trim() !== '');
    
    if (validOrderIds.length === 0) {
      toast.error('Silinecek geçerli sipariş bulunamadı');
      return;
    }
    
    try {
      // Önce siparişlerin durumlarını kontrol et
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, status')
        .in('id', validOrderIds);
      
      if (ordersError) throw ordersError;
      
      const deletableOrders = ordersData.filter(
        order => !['READY', 'PRINTED', 'SHIPPED', 'PROBLEMATIC'].includes(order.status)
      );
      
      const nonDeletableOrders = ordersData.filter(
        order => ['READY', 'PRINTED', 'SHIPPED', 'PROBLEMATIC'].includes(order.status)
      );
      
      if (deletableOrders.length === 0) {
        toast.error('Seçilen siparişlerden hiçbiri silinemez. Hazırlandı, Yazdırıldı, Kargoda veya Sorunlu durumundaki siparişler silinemez.');
        return;
      }
      
      if (nonDeletableOrders.length > 0) {
        // Kullanıcıyı uyar
        const nonDeletableCount = nonDeletableOrders.length;
        const deletableCount = deletableOrders.length;
        
        const result = await Swal.fire({
          title: 'Siparişleri Sil',
          html: `Seçilen ${ordersData.length} siparişten <strong>${deletableCount}</strong> tanesi silinebilir.<br/><br/>
                <strong>${nonDeletableCount}</strong> sipariş durumu "Hazırlandı", "Yazdırıldı", "Kargoda" veya "Sorunlu" olduğu için silinemez.<br/><br/>
                Sadece silinebilir durumda olan ${deletableCount} siparişi silmek istiyor musunuz?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Evet, Sil',
          cancelButtonText: 'İptal',
        });
        
        if (!result.isConfirmed) {
          return;
        }
      } else {
        // Tüm siparişler silinebilir
        const result = await Swal.fire({
          title: 'Siparişleri Sil',
          text: `${deletableOrders.length} siparişi silmek istediğinize emin misiniz?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Evet, Sil',
          cancelButtonText: 'İptal',
        });
        
        if (!result.isConfirmed) {
          return;
        }
      }

      // Sadece silinebilir siparişleri sil
      const deletableOrderIds = deletableOrders.map(order => order.id);
      
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', deletableOrderIds);

      if (error) throw error;

      // Başarıyla silindi
      await Swal.fire({
        title: 'Başarılı!',
        text: `${deletableOrderIds.length} sipariş başarıyla silindi`,
        icon: 'success',
        confirmButtonColor: '#10B981',
      });

      setSelectedOrders([]);
      onOrderUpdate();
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
      // Önce siparişin durumunu kontrol et
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', id)
        .single();
      
      if (orderError) throw orderError;
      
      // Yazdırıldı, Kargoda veya Sorunlu durumundaki siparişler silinemez
      if (['READY', 'PRINTED', 'SHIPPED', 'PROBLEMATIC'].includes(orderData.status)) {
        toast.error('Bu sipariş "Hazırlandı", "Yazdırıldı", "Kargoda" veya "Sorunlu" durumunda olduğu için silinemez.');
        return;
      }

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
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', id);

        if (error) throw error;

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
      // Önce siparişin mevcut durumunu veritabanından kontrol et
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('status, tracking_number')
        .eq('id', editingOrder.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Eğer sipariş PRINTED durumunda ise ve uygun olmayan duruma değiştirilmek isteniyorsa
      if (currentOrder.status === 'PRINTED' && 
          editingOrder.status !== 'PRINTED' && 
          editingOrder.status !== 'SHIPPED' && 
          editingOrder.status !== 'COMPLETED') {
        toast.error('Yazdırıldı durumundaki siparişler sadece Kargoda veya Tamamlandı durumuna geçirilebilir.');
        return;
      }
      
      // Eğer sipariş READY durumunda ise ve uygun olmayan duruma değiştirilmek isteniyorsa
      if (currentOrder.status === 'READY' && 
          editingOrder.status !== 'READY' && 
          editingOrder.status !== 'SHIPPED' && 
          editingOrder.status !== 'COMPLETED') {
        toast.error('Hazırlandı durumundaki siparişler sadece Kargoda veya Tamamlandı durumuna geçirilebilir.');
        return;
      }
      
      // Tamamlanmış siparişlerin durumu değiştirilemez
      if (currentOrder.status === 'COMPLETED' && currentOrder.status !== editingOrder.status) {
        toast.error('Tamamlanmış siparişlerin durumu değiştirilemez.');
        return;
      }

      // Yazdırıldı durumundaki siparişlerin paket boyutları ve takip numarası değiştirilemez
      let updateData = {};
      
      if (currentOrder.status === 'PRINTED' || currentOrder.status === 'READY') {
        // Yazdırıldı veya Hazırlandı durumundaki siparişler için sınırlı alanları güncelle
        updateData = {
          status: editingOrder.status, // Durumu güncellenebilir (Kargoda veya Tamamlandı)
          customer: editingOrder.customer,
          products: editingOrder.products,
          shipping_address: editingOrder.shipping_address,
          billing_address: editingOrder.billing_address,
          note: editingOrder.note,
          tags: editingOrder.tags,
        };
      } else if (currentOrder.status === 'COMPLETED') {
        // Tamamlandı durumundaki siparişler için sadece bazı alanların güncellenmesine izin ver
        // Status değişmeyecek, çünkü zaten yukarıdaki if kontrolü ile engelleniyor
        updateData = {
          customer: editingOrder.customer,
          products: editingOrder.products,
          shipping_address: editingOrder.shipping_address,
          billing_address: editingOrder.billing_address,
          note: editingOrder.note,
          tags: editingOrder.tags,
        };
      } else {
        // Normal siparişler için tüm alanların güncellenmesine izin ver
        updateData = {
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
        };
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
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
      setBalanceError('');
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

    // Reset any previous balance errors
    setBalanceError('');

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
        // Instead of throwing an error, set the balance error state and return early
        setBalanceError(`Yetersiz bakiye! Bu etiketi oluşturmak için ${labelPrice.toFixed(2)} TL gerekiyor, mevcut bakiyeniz ${profileData ? profileData.balance.toFixed(2) : 0} TL.`);
        setIsLoading(false);
        return;
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
            status: 'READY',
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
      
      // Don't show toast for insufficient balance since we already display it in the modal
      if (errorMessage !== 'Yetersiz bakiye') {
        toast.error(`Etiket oluşturulurken bir hata oluştu: ${errorMessage}`);
      }
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
      setIsLoading(true);
      
      // Yeni servis fonksiyonu kullanılıyor
      await createBulkLabels(selectedOrders, onOrderUpdate);
      
      // İşlem başarılı olduğunda seçili siparişleri temizle
      setSelectedOrders([]);
    } catch (err) {
      console.error('Toplu etiket oluşturma hatası:', err);
      
      // Hata mesajı zaten servis içinde gösterildiği için burada sadece konsola loglama yapılıyor
      if (!(err instanceof Error && (
        err.message === 'Sipariş seçilmedi' || 
        err.message === 'Maksimum sipariş sayısı aşıldı' ||
        err.message === 'Etiketlenmemiş sipariş yok' ||
        err.message === 'Gönderici adresi bulunamadı' ||
        err.message === 'Yetersiz bakiye' ||
        err.message === 'İşlem iptal edildi'
      ))) {
        toast.error('Toplu etiket oluşturulurken bir hata oluştu');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  

    // Status text converter function - kept for use in filters and display  const getStatusText = (status: Order['status'] | 'ALL'): string => {    switch (status) {      case 'NEW': return 'Yeni';      case 'READY': return 'Hazırlandı';      case 'PRINTED': return 'Yazdırıldı';      case 'SHIPPED': return 'Kargoda';      case 'PROBLEMATIC': return 'Sorunlu';      case 'COMPLETED': return 'Tamamlandı';      case 'CANCELED': return 'İptal Edildi';      case 'ALL': return 'Tümü';      default: return status;    }  };

  const handleShowDetail = (order: Order) => {
    // Siparişin müşteri, adres ve ürün bilgilerini alıp, ürün fiyat bilgilerini kontrol et ve detay modalına gönder
    // Eğer ürünlerin unit_price ve total_price alanları tanımlı değilse, bunları hesapla
    const orderWithPrices = {
      ...order,
      products: order.products.map(product => {
        // Eğer ürünün birim fiyat ve toplam fiyat değerleri yoksa, default değerler ata
        // Gerçek bir sipariş oluşturmada bu değerler olmalı, ama eski siparişlere uyumluluk için kontrol edelim
        if (!product.unit_price || !product.total_price) {
          // Makul bir default birim fiyat belirle (bu örnekte 10 TL)
          const defaultUnitPrice = 10;
          return {
            ...product,
            unit_price: product.unit_price || defaultUnitPrice,
            total_price: product.total_price || (defaultUnitPrice * product.quantity)
          };
        }
        return product;
      }),
      // Toplam değerleri hesapla
      subtotal_price: order.subtotal_price || order.products.reduce((total, p) => 
        total + (p.total_price || (p.unit_price || 10) * p.quantity), 0),
      total_tax: order.total_tax || 0,
      total_price: order.total_price || order.products.reduce((total, p) => 
        total + (p.total_price || (p.unit_price || 10) * p.quantity), 0)
    };
    
    setDetailOrder(orderWithPrices);
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

  // Etiket modalı açıkken sipariş verileri değişirse fiyatı otomatik güncelle
  useEffect(() => {
    if (isLabelModalOpen && selectedOrder && selectedSenderAddress) {
      (async () => {
        setIsLoading(true);
        try {
          const price = await calculateShippingPrice(selectedOrder, selectedSenderAddress);
          setLabelPrice(price);
        } catch (err) {
          console.error('Error calculating shipping price:', err);
          toast.error('Kargo fiyatı hesaplanırken bir hata oluştu');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [
    isLabelModalOpen, 
    selectedOrder?.package_height, 
    selectedOrder?.package_width, 
    selectedOrder?.package_length,
    selectedSenderAddress?.id
  ]);

  // Sipariş iptal etme fonksiyonu
  const handleCancelOrder = async (id: string) => {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      toast.error('Geçersiz sipariş ID\'si');
      return;
    }

    try {
      // Önce siparişin durumunu kontrol et
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('status, tracking_number')
        .eq('id', id)
        .single();
      
      if (orderError) throw orderError;
      
      // Sadece yazdırıldı durumundaki siparişler iptal edilebilir
      if (orderData.status !== 'PRINTED' && orderData.status !== 'READY') {
        toast.error('Sadece "Hazırlandı" veya "Yazdırıldı" durumundaki siparişler iptal edilebilir.');
        return;
      }

      // Etiket fiyatını shipping_labels tablosundan al
      const { data: labelData, error: labelError } = await supabase
        .from('shipping_labels')
        .select('shipping_price, tracking_number')
        .eq('order_id', id)
        .eq('tracking_number', orderData.tracking_number)
        .single();
      
      if (labelError) {
        console.error('Etiket bilgisi alınamadı:', labelError);
        toast.error('Etiket bilgisi alınamadı, bakiye iadesi yapılamayabilir.');
      }

      const result = await Swal.fire({
        title: 'Siparişi İptal Et',
        text: labelData 
          ? `Bu siparişi iptal etmek istediğinize emin misiniz? İptal edildiğinde ${labelData.shipping_price} TL bakiyenize iade edilecektir.`
          : 'Bu siparişi iptal etmek istediğinize emin misiniz?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Evet, İptal Et',
        cancelButtonText: 'Vazgeç',
      });

      if (result.isConfirmed) {
        // Transaction başlat
        setIsLoading(true);

        // Önce Sürat Kargo API'sine iptal isteği gönder
        if (orderData.tracking_number) {
          const apiResult = await cancelSuratCargoLabel(orderData.tracking_number);
          console.log('Sipariş İptal Edili:', apiResult);
          if (!apiResult.success) {
            throw new Error(apiResult.message || 'Sürat Kargo API\'sinde iptal işlemi başarısız oldu');
          }
        }

        // Kullanıcı bilgisini al
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Kullanıcı oturumu bulunamadı');
        }

        // Eğer etiket bilgisi varsa bakiyeyi güncelle
        if (labelData && labelData.shipping_price) {
          // Kullanıcının mevcut bakiyesini al
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Profil bilgisi alınamadı:', profileError);
            toast.error('Bakiye güncellenemedi: Profil bilgisi alınamadı');
          } else {
            // Bakiyeyi güncelle
            const { error: balanceError } = await supabase
              .from('profiles')
              .update({ 
                balance: profileData.balance + labelData.shipping_price 
              })
              .eq('id', user.id);

            if (balanceError) {
              console.error('Bakiye güncellenirken hata:', balanceError);
              toast.error('Bakiye iade edilemedi: Güncelleme hatası');
            } else {
              // Bakiye güncellemesi için özel bir event fırlat
              window.dispatchEvent(new CustomEvent('balanceUpdated', {
                detail: { newBalance: profileData.balance + labelData.shipping_price }
              }));
              
              // İptal kaydını shipping_labels tablosuna ekle
              try {
                await supabase
                  .from('shipping_labels')
                  .insert({
                    order_id: id,
                    tracking_number: labelData.tracking_number,
                    kargo_takip_no: labelData.tracking_number,
                    carrier: 'Sürat Kargo',
                    customer_id: null,
                    subscription_type: null,
                    created_at: new Date().toISOString(),
                    shipping_price: -labelData.shipping_price, // Negatif değer, iade işlemi
                    is_canceled: true,
                    canceled_at: new Date().toISOString(),
                    cancel_note: 'Kullanıcı tarafından iptal edildi'
                  });
              } catch (insertError) {
                console.error('İptal kaydı eklenirken hata:', insertError);
                // Bu hata kritik değil, devam et
              }
            }
          }
        }

        // Siparişi iptal et
        const { error } = await supabase
          .from('orders')
          .update({ status: 'CANCELED' })
          .eq('id', id);

        if (error) throw error;

        await Swal.fire({
          title: 'Başarılı!',
          text: labelData 
            ? `Sipariş başarıyla iptal edildi ve ${labelData.shipping_price} TL bakiyenize iade edildi.`
            : 'Sipariş başarıyla iptal edildi.',
          icon: 'success',
          confirmButtonColor: '#10B981',
        });

        onOrderUpdate();
      }
    } catch (err) {
      console.error('Error canceling order:', err);
      toast.error('Sipariş iptal edilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Toplu iptal işlemi
  const handleBulkCancelOrders = async () => {
    if (selectedOrders.length === 0) return;

    // İptal edilecek siparişleri kontrol et
    const validOrderIds = selectedOrders.filter(id => typeof id === 'string' && id.trim() !== '');
    
    if (validOrderIds.length === 0) {
      toast.error('İptal edilecek geçerli sipariş bulunamadı');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Yeni servis fonksiyonu kullanılıyor
      await cancelBulkOrders(validOrderIds, onOrderUpdate);
      
      // İşlem başarılı olduğunda seçili siparişleri temizle
      setSelectedOrders([]);
    } catch (err) {
      console.error('Toplu iptal işlemi hatası:', err);
      
      // Hata mesajı zaten servis içinde gösterildiği için burada sadece konsola loglama yapılıyor
      if (!(err instanceof Error && (
        err.message === 'Sipariş seçilmedi' || 
        err.message === 'Maksimum sipariş sayısı aşıldı' ||
        err.message === 'İptal edilebilir sipariş yok' ||
        err.message === 'Profil bilgisi alınamadı' ||
        err.message === 'İşlem iptal edildi'
      ))) {
        toast.error('Siparişler iptal edilirken bir hata oluştu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset balance error when modal is closed
    if (!isLabelModalOpen) {
      setBalanceError('');
    }
  }, [isLabelModalOpen]);

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

                    <div className="hidden md:flex gap-2 mt-4 md:mt-0">            {selectedOrders.length > 0 && (              <>                <button                  onClick={() => handleBulkCreateLabels()}                  disabled={isLoading}                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-darkGreen hover:bg-lightGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lightGreen disabled:opacity-50"                >                  Toplu Etiket Oluştur                </button>                <button                  onClick={handleBulkCancelOrders}                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"                >                  İptal Et                </button>                <button                  onClick={handleDeleteSelected}                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"                >                  <Trash2 className="h-4 w-4 mr-1" />                  Sil                </button>              </>            )}          </div>
        </div>

                {/* Mobile actions panel when items selected */}        {selectedOrders.length > 0 && (          <div className="md:hidden flex gap-2 mt-4 overflow-x-auto pb-2">            <button              onClick={() => handleBulkCreateLabels()}              disabled={isLoading}              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-darkGreen hover:bg-lightGreen focus:outline-none disabled:opacity-50 whitespace-nowrap"            >              Toplu Etiket            </button>            <button              onClick={handleBulkCancelOrders}              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none whitespace-nowrap"            >              İptal            </button>            <button              onClick={handleDeleteSelected}              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none whitespace-nowrap"            >              <Trash2 className="h-4 w-4 mr-1" />              Sil            </button>          </div>        )}

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
            handleCancelOrder={handleCancelOrder}
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
          isLabelModalOpen={isLabelModalOpen}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
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
          balanceError={balanceError}
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