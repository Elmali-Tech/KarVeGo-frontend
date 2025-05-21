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
  
  // Maksimum 10 sipariş seçilebilir
  if (selectedOrders.length > 10) {
    toast.error('En fazla 10 sipariş için toplu iptal işlemi yapabilirsiniz');
    throw new Error('Maksimum sipariş sayısı aşıldı');
  }
  
  // Önce siparişlerin durumlarını kontrol et
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('id, status, tracking_number')
    .in('id', selectedOrders);
  
  if (ordersError) throw ordersError;
  
  // Sadece yazdırıldı durumundaki siparişler iptal edilebilir
  const cancelableOrders = ordersData.filter(order => order.status === 'PRINTED' && order.tracking_number);
  const nonCancelableOrders = ordersData.filter(order => order.status !== 'PRINTED' || !order.tracking_number);
  
  if (cancelableOrders.length === 0) {
    toast.error('Seçilen siparişlerden hiçbiri iptal edilemez. Sadece "Yazdırıldı" durumundaki siparişler iptal edilebilir.');
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
  
  let confirmMessage = '';
  
  if (nonCancelableOrders.length > 0) {
    confirmMessage = `Seçilen ${ordersData.length} siparişten <strong>${cancelableOrders.length}</strong> tanesi iptal edilebilir.<br/><br/>
                    <strong>${nonCancelableOrders.length}</strong> sipariş "Yazdırıldı" durumunda olmadığı için iptal edilemez.`;
  } else {
    confirmMessage = `${cancelableOrders.length} siparişi iptal etmek istediğinize emin misiniz?`;
  }
  
  if (totalRefundAmount > 0) {
    confirmMessage += `<br/><br/>İptal işlemi sonrasında toplam <strong>${totalRefundAmount} TL</strong> bakiyenize iade edilecektir.`;
  }
  
  const result = await Swal.fire({
    title: 'Siparişleri İptal Et',
    html: confirmMessage,
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
        <p id="progress-text">0/${cancelableOrders.length} sipariş iptal edildi</p>
        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div id="progress-bar" class="bg-red-600 h-2.5 rounded-full" style="width: 0%"></div>
        </div>
        <p id="current-order" class="mt-2 text-sm">İşlem başlatılıyor...</p>
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
    document.getElementById('current-order')!.textContent = `İşleniyor: ${order.id} (Takip No: ${trackingNumber})`;
    
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
          <p>${successCount} sipariş başarıyla iptal edildi${errorCount > 0 ? `, ${errorCount} sipariş için iptal işlemi başarısız oldu` : ''}.</p>
          ${totalRefunded > 0 ? `<p class="mt-3 font-semibold">Toplam İade: ${totalRefunded.toFixed(2)} TL</p>
          <p class="mt-1 text-sm">Yeni Bakiye: ${(profileData.balance + totalRefunded).toFixed(2)} TL</p>` : ''}
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