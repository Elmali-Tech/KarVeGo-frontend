import { supabase } from '../../lib/supabase';
import { calculateShippingPrice, sendToNewSuratCargoApi } from './ShippingLabelService';
import Swal from 'sweetalert2';
import { toast } from 'sonner';

interface BulkLabelResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  totalSpent: number;
  remainingBalance: number;
}

/**
 * Toplu etiket oluşturma işlemini gerçekleştirir
 * @param selectedOrders Seçilen sipariş ID'leri
 * @param onOrderUpdate Siparişler güncellendiğinde çağrılacak callback
 * @returns Promise<BulkLabelResult>
 */
export const createBulkLabels = async (
  selectedOrders: string[],
  onOrderUpdate: () => void
): Promise<BulkLabelResult> => {
  if (selectedOrders.length === 0) {
    toast.error('Lütfen en az bir sipariş seçin');
    throw new Error('Sipariş seçilmedi');
  }
  
  // Maksimum 10 sipariş seçilebilir
  if (selectedOrders.length > 10) {
    toast.error('En fazla 10 sipariş için toplu etiket oluşturabilirsiniz');
    throw new Error('Maksimum sipariş sayısı aşıldı');
  }
  
  // Seçilen siparişlerin bilgilerini al
  const { data: selectedOrdersData, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .in('id', selectedOrders);
    
  if (ordersError) throw ordersError;
  
  // Daha önce etiketi olan siparişleri filtrele
  const ordersWithoutLabels = selectedOrdersData.filter(order => !order.tracking_number);
  
  if (ordersWithoutLabels.length === 0) {
    toast.error('Seçilen siparişlerin tümü zaten etiketlenmiş');
    throw new Error('Etiketlenmemiş sipariş yok');
  }
  
  // Varsayılan gönderici adresi
  const { data: addressesData, error: addressesError } = await supabase
    .from('sender_addresses')
    .select('*')
    .order('is_default', { ascending: false });
    
  if (addressesError) throw addressesError;
  
  if (!addressesData || addressesData.length === 0) {
    toast.error('Gönderici adresi bulunamadı');
    throw new Error('Gönderici adresi bulunamadı');
  }
  
  const defaultAddress = addressesData[0];
  
  // Tüm siparişler için toplam fiyat hesapla
  let totalPrice = 0;
  for (const order of ordersWithoutLabels) {
    try {
      const price = await calculateShippingPrice(order, defaultAddress);
      totalPrice += price;
    } catch (err) {
      console.error(`Sipariş ${order.id} için fiyat hesaplanamadı:`, err);
    }
  }
  
  // Kullanıcının bakiyesini kontrol et
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Kullanıcı oturumu bulunamadı');
  }
  
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('balance, subscription_type')
    .eq('id', user.id)
    .single();
    
  if (profileError) throw profileError;
  
  if (!profileData || profileData.balance < totalPrice) {
    toast.error(`Yetersiz bakiye! Bu etiketleri oluşturmak için ${totalPrice.toFixed(2)} TL gerekiyor, mevcut bakiyeniz ${profileData ? profileData.balance.toFixed(2) : 0} TL.`);
    throw new Error('Yetersiz bakiye');
  }
  
  // Onay mesajı göster
  const result = await Swal.fire({
    title: 'Toplu Etiket Oluştur',
    html: `
      <div class="text-left">
        <p>${ordersWithoutLabels.length} sipariş için etiket oluşturmak istediğinize emin misiniz?</p>
        <p class="mt-3 font-semibold">Toplam Tutar: ${totalPrice.toFixed(2)} TL</p>
        <p class="mt-1 text-sm">Mevcut Bakiye: ${profileData.balance.toFixed(2)} TL</p>
        <p class="mt-3 text-xs text-gray-500">İşlem tamamlanana kadar lütfen bekleyin. Bu işlem biraz zaman alabilir.</p>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Evet, Oluştur',
    cancelButtonText: 'İptal'
  });
  
  if (!result.isConfirmed) {
    throw new Error('İşlem iptal edildi');
  }
  
  // Etiketi olmayan siparişler için işleme başla
  let successCount = 0;
  let errorCount = 0;
  let remainingBalance = profileData.balance;
  
  // İlerleme modalını göster
  Swal.fire({
    title: 'Etiketler Oluşturuluyor',
    html: `
      <div class="mt-3">
        <p id="progress-text">0/${ordersWithoutLabels.length} etiket oluşturuldu</p>
        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div id="progress-bar" class="bg-green-600 h-2.5 rounded-full" style="width: 0%"></div>
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
  
  // Siparişleri sırayla işle
  for (let i = 0; i < ordersWithoutLabels.length; i++) {
    const order = ordersWithoutLabels[i];
    
    // İlerleme göstergesini güncelle
    const progressPercent = Math.round((i / ordersWithoutLabels.length) * 100);
    document.getElementById('progress-bar')!.style.width = `${progressPercent}%`;
    document.getElementById('progress-text')!.textContent = `${i}/${ordersWithoutLabels.length} etiket oluşturuldu`;
    document.getElementById('current-order')!.textContent = `İşleniyor: ${order.id} (${order.customer?.name || 'İsimsiz Müşteri'})`;
    
    try {
      // Sipariş için fiyat hesapla
      const price = await calculateShippingPrice(order, defaultAddress);
      
      // Kargo etiketi oluştur
      const result = await sendToNewSuratCargoApi(order, defaultAddress);
      
      if (!result.isSuccess) {
        throw new Error(result.message || 'Kargo etiketi oluşturulurken bir hata oluştu');
      }
      
      // Takip numarası al
      const trackingNumber = result.trackingNumber || '';
      
      // Siparişi güncelle
      await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumber,
          status: 'PRINTED',
          shipping_tracking_code: trackingNumber
        })
        .eq('id', order.id);
      
      // Etiket bilgilerini veritabanına kaydet
      await supabase
        .from('shipping_labels')
        .insert({
          order_id: order.id,
          tracking_number: trackingNumber,
          kargo_takip_no: trackingNumber,
          carrier: 'Sürat Kargo',
          customer_id: order.customer?.id || null,
          subscription_type: profileData.subscription_type,
          created_at: new Date().toISOString(),
          shipping_price: price
        });
        
      // Bakiyeyi güncelle
      remainingBalance -= price;
      
      // Bakiyeyi kullanıcı profilinde güncelle
      if (i === ordersWithoutLabels.length - 1) {
        // Son siparişte topluca güncelle
        await supabase
          .from('profiles')
          .update({ 
            balance: profileData.balance - totalPrice
          })
          .eq('id', user.id);
      }
      
      successCount++;
    } catch (err) {
      console.error(`Order ${order.id} için etiket oluşturma hatası:`, err);
      errorCount++;
    }
    
    // Her istek arasında 2-3 saniye bekle (son istek hariç)
    if (i < ordersWithoutLabels.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
  }
  
  // İlerleme modalını kapat
  Swal.close();
  
  // Başarı/hata durumuna göre bildirim göster
  if (successCount > 0) {
    await Swal.fire({
      title: 'İşlem Tamamlandı',
      html: `
        <div class="text-left">
          <p>${successCount} sipariş için etiket başarıyla oluşturuldu${errorCount > 0 ? `, ${errorCount} sipariş için etiket oluşturulamadı` : ''}.</p>
          <p class="mt-3 font-semibold">Toplam Harcanan: ${(profileData.balance - remainingBalance).toFixed(2)} TL</p>
          <p class="mt-1 text-sm">Kalan Bakiye: ${remainingBalance.toFixed(2)} TL</p>
        </div>
      `,
      icon: successCount === ordersWithoutLabels.length ? 'success' : 'warning',
      confirmButtonColor: '#10B981',
    });
    
    // Bakiye güncellemesi için özel bir event fırlat
    window.dispatchEvent(new CustomEvent('balanceUpdated', {
      detail: { newBalance: remainingBalance }
    }));
    
    onOrderUpdate();
  } else if (errorCount > 0) {
    toast.error(`${errorCount} sipariş için etiket oluşturulamadı`);
  }
  
  return {
    success: successCount > 0,
    successCount,
    errorCount,
    totalSpent: profileData.balance - remainingBalance,
    remainingBalance
  };
};