import { supabase } from '../../lib/supabase';
import { cancelSuratCargoLabel } from './ShippingLabelService';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

interface BulkCancelResult {
  success: boolean;
  canceledCount: number;
  errorCount: number;
  totalRefund: number;
  remainingBalance: number;
}

/**
 * Toplu sipariş iptal işlemini gerçekleştirir
 * @param selectedOrders Seçilen sipariş ID'leri
 * @param onOrderUpdate Siparişler güncellendiğinde çağrılacak callback
 * @returns Promise<BulkCancelResult>
 */
export const cancelBulkOrders = async (
  selectedOrders: string[],
  onOrderUpdate: () => void
): Promise<BulkCancelResult> => {
  if (selectedOrders.length === 0) {
    toast.error('Lütfen en az bir sipariş seçin');
    throw new Error('Sipariş seçilmedi');
  }
  

  
  // Önce siparişlerin durumlarını kontrol et
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('id, status, tracking_number')
    .in('id', selectedOrders);
  
  if (ordersError) throw ordersError;
  
  // Sadece yazdırıldı durumundaki siparişler iptal edilebilir
  const cancelableOrders = ordersData.filter(order => (order.status === 'PRINTED' || order.status === 'READY') && order.tracking_number);
  const nonCancelableOrders = ordersData.filter(order => (order.status !== 'PRINTED' && order.status !== 'READY') || !order.tracking_number);
  
  if (cancelableOrders.length === 0) {
    toast.error('Seçilen siparişlerden hiçbiri iptal edilemez. Sadece "Hazırlandı" veya "Yazdırıldı" durumundaki siparişler iptal edilebilir.');
    throw new Error('İptal edilebilir sipariş yok');
  }
  
  // İptal edilebilir siparişlerin ID'lerini al
  const cancelableOrderIds = cancelableOrders.map(order => order.id);
  
  // İptal edilebilir siparişlerin etiket fiyatlarını al
  const { data: labelData, error: labelError } = await supabase
    .from('shipping_labels')
    .select('order_id, shipping_price, tracking_number')
    .in('order_id', cancelableOrderIds);
    
  if (labelError) {
    console.error('Etiket bilgileri alınamadı:', labelError);
    toast.error('Etiket bilgileri alınamadı, bakiye iadesi yapılamayabilir.');
  }
  
  // Toplam iade edilecek tutarı hesapla
  let totalRefundAmount = 0;
  if (labelData && labelData.length > 0) {
    totalRefundAmount = labelData.reduce((total, label) => total + label.shipping_price, 0);
  }
  
  // Onay mesajı göster
  const result = await Swal.fire({
    title: 'Siparişleri İptal Et',
    html: `
      <div class="text-left">
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z"></path>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-900">Onay Gerekiyor</p>
            <p class="text-sm text-gray-500">${
              nonCancelableOrders.length > 0 
                ? `Seçilen ${ordersData.length} siparişten <strong>${cancelableOrders.length}</strong> tanesi iptal edilebilir.` 
                : `${cancelableOrders.length} siparişi iptal etmek istediğinize emin misiniz?`
            }</p>
          </div>
        </div>
        
        ${nonCancelableOrders.length > 0 ? `
        <div class="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div class="flex items-start">
            <svg class="mt-0.5 h-5 w-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z"></path>
            </svg>
            <span class="text-sm text-yellow-700">
              <strong>${nonCancelableOrders.length}</strong> sipariş uygun durumda olmadığı için iptal edilemez.
            </span>
          </div>
        </div>
        ` : ''}
        
        ${totalRefundAmount > 0 ? `
        <div class="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 shadow-sm">
          <p class="font-medium text-gray-800 mb-2">İade Özeti</p>
          <div class="space-y-2">
            <div class="flex justify-between items-center pb-2 border-b border-red-100">
              <span class="text-gray-600">İptal Edilecek Etiket:</span>
              <span class="font-medium bg-red-100 px-2 py-0.5 rounded-full text-red-800">${cancelableOrders.length} adet</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Toplam İade Tutarı:</span>
              <span class="font-bold text-green-600">${totalRefundAmount.toFixed(2)} TL</span>
            </div>
          </div>
        </div>
        ` : ''}
        
        <p class="mt-4 text-xs text-gray-500 flex items-center">
          <svg class="h-4 w-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z"></path>
          </svg>
          İşlem tamamlanana kadar lütfen bekleyin. Bu işlem geri alınamaz.
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Evet, İptal Et',
    cancelButtonText: 'Vazgeç',
  });
  
  if (!result.isConfirmed) {
    throw new Error('İşlem iptal edildi');
  }

  // Kullanıcı bilgisini al
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Kullanıcı oturumu bulunamadı');
  }
  
  // İlerleme modalını göster
  Swal.fire({
    title: 'Siparişler İptal Ediliyor',
    html: `
      <div class="mt-3">
        <div class="flex items-center justify-center mb-3">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
          <span class="ml-3 text-red-600 font-medium" id="progress-text">0/${cancelableOrders.length} sipariş iptal edildi</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden shadow-inner">
          <div id="progress-bar" class="bg-gradient-to-r from-red-400 to-red-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" style="width: 0%"></div>
        </div>
        <div class="text-center bg-red-50 p-3 rounded-lg border border-red-100 shadow-sm">
          <p id="current-order" class="text-sm text-gray-600">İşlem başlatılıyor...</p>
        </div>
      </div>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  
  // Kullanıcının mevcut bakiyesini al
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Profil bilgisi alınamadı:', profileError);
    throw new Error('Profil bilgisi alınamadı');
  }
  
  let successCount = 0;
  let errorCount = 0;
  let totalRefunded = 0;
  
  // Siparişleri sırayla iptal et
  for (let i = 0; i < cancelableOrders.length; i++) {
    const order = cancelableOrders[i];
    const trackingNumber = order.tracking_number;
    
    // İlerleme göstergesini güncelle
    const progressPercent = Math.round((i / cancelableOrders.length) * 100);
    document.getElementById('progress-bar')!.style.width = `${progressPercent}%`;
    document.getElementById('progress-text')!.textContent = `${i}/${cancelableOrders.length} sipariş iptal edildi`;
    document.getElementById('current-order')!.textContent = `İşleniyor: ${trackingNumber}`;
    
    try {
      // Sürat Kargo API'sine iptal isteği gönder
      const apiResult = await cancelSuratCargoLabel(trackingNumber);
      
      if (!apiResult.success) {
        throw new Error(apiResult.message || 'Sürat Kargo API\'sinde iptal işlemi başarısız oldu');
      }
      
      // Etiket bilgilerini bul
      const labelInfo = labelData?.find(label => label.order_id === order.id);
      
      if (labelInfo) {
        // İade edilecek tutarı topla
        totalRefunded += labelInfo.shipping_price;
        
        // İptal kaydını shipping_labels tablosuna ekle
        await supabase
          .from('shipping_labels')
          .insert({
            order_id: order.id,
            tracking_number: labelInfo.tracking_number,
            kargo_takip_no: labelInfo.tracking_number,
            carrier: 'Sürat Kargo',
            customer_id: null,
            subscription_type: null,
            created_at: new Date().toISOString(),
            shipping_price: -labelInfo.shipping_price, // Negatif değer, iade işlemi
            is_canceled: true,
            canceled_at: new Date().toISOString(),
            cancel_note: 'Toplu iptal işlemi'
          });
      }
      
      // Siparişi iptal et
      await supabase
        .from('orders')
        .update({ status: 'CANCELED' })
        .eq('id', order.id);
      
      successCount++;
    } catch (err) {
      console.error(`Sipariş ${order.id} için iptal hatası:`, err);
      errorCount++;
    }
    
    // Her istek arasında 2-3 saniye bekle (son istek hariç)
    if (i < cancelableOrders.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
  }
  
  // İlerleme modalını kapat
  Swal.close();
  
  // Toplam iade tutarı için bakiyeyi güncelle
  if (totalRefunded > 0) {
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ 
        balance: profileData.balance + totalRefunded 
      })
      .eq('id', user.id);

    if (balanceError) {
      console.error('Bakiye güncellenirken hata:', balanceError);
      toast.error('Bakiye iade edilemedi: Güncelleme hatası');
    } else {
      // Bakiye güncellemesi için özel bir event fırlat
      window.dispatchEvent(new CustomEvent('balanceUpdated', {
        detail: { newBalance: profileData.balance + totalRefunded }
      }));
    }
  }
  
  // Başarı/hata durumuna göre bildirim göster
  if (successCount > 0) {
    await Swal.fire({
      title: 'İşlem Tamamlandı',
      html: `
        <div class="text-left">
          <div class="flex items-center mb-3">
            <div class="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
              <svg class="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-base font-medium text-gray-900">Başarıyla Tamamlandı</p>
              <p class="text-sm text-gray-600">${successCount} sipariş başarıyla iptal edildi</p>
            </div>
          </div>
          
          ${errorCount > 0 ? `
          <div class="flex items-center mb-4">
            <div class="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shadow-sm">
              <svg class="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-base font-medium text-gray-900">Bazı İşlemler Başarısız</p>
              <p class="text-sm text-gray-600">${errorCount} sipariş için iptal işlemi başarısız oldu</p>
            </div>
          </div>
          ` : ''}
          
          ${totalRefunded > 0 ? `
          <div class="mt-5 p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm">
            <p class="font-medium text-gray-800 mb-3 pb-2 border-b border-green-100">Bakiye Özeti</p>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Toplam İade Tutarı:</span>
                <span class="font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">${totalRefunded.toFixed(2)} TL</span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-green-100">
                <span class="text-gray-700 font-medium">Yeni Bakiye:</span>
                <span class="font-medium text-green-600 bg-green-100 px-3 py-1 rounded-lg">${(profileData.balance + totalRefunded).toFixed(2)} TL</span>
              </div>
            </div>
          </div>
          ` : ''}
        </div>
      `,
      icon: successCount === cancelableOrders.length ? 'success' : 'warning',
      confirmButtonColor: '#10B981',
    });
    
    onOrderUpdate();
  } else if (errorCount > 0) {
    toast.error(`${errorCount} sipariş için iptal işlemi başarısız oldu`);
  }
  
  return {
    success: successCount > 0,
    canceledCount: successCount,
    errorCount,
    totalRefund: totalRefunded,
    remainingBalance: profileData.balance + totalRefunded
  };
}; 