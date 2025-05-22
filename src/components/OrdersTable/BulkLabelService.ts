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
  
  // Bakiye hesaplama başlangıç bildirimi
  Swal.fire({
    title: 'Bakiye Hesaplanıyor',
    html: `
      <div class="mt-3">
        <div class="flex items-center justify-center mb-3">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span class="ml-3 text-blue-600 font-medium" id="calculation-text">Siparişler için toplam tutar hesaplanıyor...</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden shadow-inner">
          <div id="calculation-bar" class="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" style="width: 0%"></div>
        </div>
        <div class="text-center bg-blue-50 p-3 rounded-lg border border-blue-100 shadow-sm">
          <p id="calculation-order" class="text-sm text-gray-600">Lütfen bekleyin...</p>
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
  
  // Tüm siparişler için toplam fiyat hesapla
  let totalPrice = 0;
  for (let i = 0; i < ordersWithoutLabels.length; i++) {
    const order = ordersWithoutLabels[i];
    
    // İlerleme göstergesini güncelle
    const progressPercent = Math.round((i / ordersWithoutLabels.length) * 100);
    document.getElementById('calculation-bar')!.style.width = `${progressPercent}%`;
    document.getElementById('calculation-text')!.textContent = `${i+1}/${ordersWithoutLabels.length} sipariş hesaplanıyor...`;
    document.getElementById('calculation-order')!.textContent = `İşleniyor: ${order.customer?.name || 'İsimsiz Müşteri'}`;
    
    try {
      const price = await calculateShippingPrice(order, defaultAddress);
      totalPrice += price;
    } catch (err) {
      console.error(`Sipariş ${order.id} için fiyat hesaplanamadı:`, err);
    }
  }
  
  // Hesaplama tamamlandı, yükleme bildirimini kapat
  Swal.close();
  
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
        <div class="flex items-center mb-4">
          <div class="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z"></path>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-900">Onay Gerekiyor</p>
            <p class="text-sm text-gray-500">${ordersWithoutLabels.length} sipariş için etiket oluşturmak istediğinize emin misiniz?</p>
          </div>
        </div>
        
        <div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
          <p class="font-medium text-gray-800 mb-2">Ödeme Özeti</p>
          <div class="space-y-2">
            <div class="flex justify-between items-center pb-2 border-b border-blue-100">
              <span class="text-gray-600">Etiket Sayısı:</span>
              <span class="font-medium bg-blue-100 px-2 py-0.5 rounded-full text-blue-800">${ordersWithoutLabels.length} adet</span>
            </div>
            <div class="flex justify-between items-center pb-2 border-b border-blue-100">
              <span class="text-gray-600">Toplam Tutar:</span>
              <span class="font-bold text-blue-600">${totalPrice.toFixed(2)} TL</span>
            </div>
            <div class="flex justify-between items-center pb-2 border-b border-blue-100">
              <span class="text-gray-600">Mevcut Bakiye:</span>
              <span class="font-medium ${profileData.balance < totalPrice ? 'text-red-600' : 'text-green-600'}">${profileData.balance.toFixed(2)} TL</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">İşlem Sonrası Bakiye:</span>
              <span class="font-medium">${(profileData.balance - totalPrice).toFixed(2)} TL</span>
            </div>
          </div>
        </div>
        
        <p class="mt-4 text-xs text-gray-500 flex items-center">
          <svg class="h-4 w-4 text-yellow-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z"></path>
          </svg>
          İşlem tamamlanana kadar lütfen bekleyin. Bu işlem biraz zaman alabilir.
        </p>
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
        <div class="flex items-center justify-center mb-3">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          <span class="ml-3 text-green-600 font-medium" id="progress-text">0/${ordersWithoutLabels.length} etiket oluşturuldu</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2.5 mb-4 overflow-hidden shadow-inner">
          <div id="progress-bar" class="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" style="width: 0%"></div>
        </div>
        <div class="text-center bg-green-50 p-3 rounded-lg border border-green-100 shadow-sm">
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
  
  // Siparişleri sırayla işle
  for (let i = 0; i < ordersWithoutLabels.length; i++) {
    const order = ordersWithoutLabels[i];
    
    // İlerleme göstergesini güncelle
    const progressPercent = Math.round((i / ordersWithoutLabels.length) * 100);
    document.getElementById('progress-bar')!.style.width = `${progressPercent}%`;
    document.getElementById('progress-text')!.textContent = `${i}/${ordersWithoutLabels.length} etiket oluşturuldu`;
    document.getElementById('current-order')!.textContent = `İşleniyor: ${order.customer?.name || 'İsimsiz Müşteri'}`;
    
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
          status: 'READY',
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
      await new Promise(resolve => setTimeout(resolve, 3000));
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
          <div class="flex items-center mb-3">
            <div class="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
              <svg class="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-base font-medium text-gray-900">Başarıyla Tamamlandı</p>
              <p class="text-sm text-gray-600">${successCount} sipariş için etiket oluşturuldu</p>
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
              <p class="text-sm text-gray-600">${errorCount} sipariş için etiket oluşturulamadı</p>
            </div>
          </div>
          ` : ''}
          
          <div class="mt-5 p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm">
            <p class="font-medium text-gray-800 mb-3 pb-2 border-b border-green-100">Bakiye Özeti</p>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Toplam Harcanan:</span>
                <span class="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">${(profileData.balance - remainingBalance).toFixed(2)} TL</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Önceki Bakiye:</span>
                <span class="font-medium">${profileData.balance.toFixed(2)} TL</span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-green-100">
                <span class="text-gray-700 font-medium">Yeni Bakiye:</span>
                <span class="font-medium text-green-600 bg-green-100 px-3 py-1 rounded-lg">${remainingBalance.toFixed(2)} TL</span>
              </div>
            </div>
          </div>
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