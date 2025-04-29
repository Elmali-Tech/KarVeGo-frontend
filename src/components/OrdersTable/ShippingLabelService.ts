import { supabase } from '../../lib/supabase';
import { Order, SenderAddress } from './types';
import { sendToSuratKargoV2 } from '../../lib/surat-kargo-v2';
import { toast } from 'react-hot-toast';

// Kargo fiyatı hesaplayan fonksiyon
export const calculateShippingPrice = async (order: Order, senderAddress: SenderAddress) => {
  if (!order.shipping_address || !order.package_height || !order.package_width || !order.package_length) {
    return 0;
  }

  const desi = (order.package_height * order.package_width * order.package_length) / 3000;
  
  const isLocal = senderAddress.city.toLowerCase() === order.shipping_address.city?.toLowerCase();
  
  // Profil tablosundan abonelik tipini al
  let subscriptionType = 'BRONZE'; // Varsayılan olarak BRONZE

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_type')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('Profil bilgisi alınamadı:', profileError);
      } else if (profileData) {
        subscriptionType = profileData.subscription_type || 'BRONZE';
      }
    }
  } catch (err) {
    console.error('Profil bilgisi alınırken beklenmeyen hata:', err);
  }
  
  console.log(`Kullanıcı abonelik tipi: ${subscriptionType}`);
  
  // Abonelik tipine göre fiyat al
  const { data: prices, error: pricesError } = await supabase
    .from('carrier_prices')
    .select('city_price, intercity_price, desi, subscription_type')
    .eq('subscription_type', subscriptionType)
    .order('desi')
    .gte('desi', desi)
    .limit(1);
    
  if (pricesError) {
    console.error('Fiyat bilgisi alınamadı:', pricesError);
    return 0;
  }

  if (!prices || prices.length === 0) {
    // Eğer abonelik tipine özgü desi aralığı bulunamazsa, 
    // o abonelik tipindeki en yüksek desi değerini al
    const { data: maxPrices, error: maxPricesError } = await supabase
      .from('carrier_prices')
      .select('city_price, intercity_price, desi')
      .eq('subscription_type', subscriptionType)
      .order('desi', { ascending: false })
      .limit(1);
      
    if (maxPricesError) {
      console.error('Maksimum fiyat bilgisi alınamadı:', maxPricesError);
      return 0;
    }

    if (!maxPrices || maxPrices.length === 0) {
      console.log(`${subscriptionType} abonelik tipi için fiyat bulunamadı, BRONZE kullanılıyor`);
      
      // Eğer belirtilen abonelik tipi için fiyat yoksa BRONZE'a geri dön
      if (subscriptionType !== 'BRONZE') {
        const { data: bronzePrices } = await supabase
          .from('carrier_prices')
          .select('city_price, intercity_price, desi')
          .eq('subscription_type', 'BRONZE')
          .order('desi', { ascending: false })
          .limit(1);
          
        if (bronzePrices && bronzePrices.length > 0) {
          return isLocal ? bronzePrices[0].city_price : bronzePrices[0].intercity_price;
        }
      }
      
      return 0;
    }
    
    return isLocal ? maxPrices[0].city_price : maxPrices[0].intercity_price;
  }

  return isLocal ? prices[0].city_price : prices[0].intercity_price;
};

// Gönderici adreslerini getiren fonksiyon
export const fetchSenderAddresses = async () => {
  try {
    const { data, error } = await supabase
      .from('sender_addresses')
      .select('*')
      .order('is_default', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error fetching sender addresses:', err);
    return { data: null, error: err };
  }
};

// Etiket bilgilerini getiren fonksiyon
export const fetchLabelData = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from('shipping_labels')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) throw error;
    return { data: data && data.length > 0 ? data[0] : null, error: null };
  } catch (err) {
    console.error('Error fetching label data:', err);
    return { data: null, error: err };
  }
};

// Yeni Sürat Kargo API'sine gönderimi sağlayan fonksiyon
export const sendToNewSuratCargoApi = async (order: Order, senderAddress: SenderAddress) => {
  try {
    if (!order.shipping_address) {
      throw new Error('Sipariş kargo adresi bulunamadı');
    }

    // Alıcı bilgilerini hazırla
    let aliciAdi = order.shipping_address?.name || '';
    if (!aliciAdi && order.customer?.name) {
      aliciAdi = order.customer.name;
    }
    
    let aliciAdresi = '';
    if (order.shipping_address?.address1) {
      aliciAdresi += order.shipping_address.address1 + ' ';
    }
    if (order.shipping_address?.address2) {
      aliciAdresi += order.shipping_address.address2;
    }
    
    // Müşteri telefon numarasını temizle ve formatla
    let telefonCep = order.shipping_address?.phone || order.customer?.phone || '';
    telefonCep = telefonCep.replace(/\D/g, '');
    if (telefonCep.length > 10) {
      telefonCep = telefonCep.substring(0, 10);
    }
    
    // Ürünlerin açıklamasını hazırla
    const kargoIcerigi = order.products.map(p => 
      `${p.name} x${p.quantity}`
    ).join(', ').substring(0, 100);

    // Benzersiz takip numarası oluştur
    const uniqueTrackingCode = `3636${Math.floor(Math.random() * 10000000)}`.substring(0, 10);

    // Yeni API için istek payload'ını oluştur
    const gonderi = {
      KisiKurum: aliciAdi,
      SahisBirim: "",
      AliciAdresi: aliciAdresi,
      Il: order.shipping_address.city || "İstanbul",
      Ilce: order.shipping_address.district || "Üsküdar",
      TelefonEv: "",
      TelefonIs: "",
      TelefonCep: telefonCep || "5555555555",
      Email: "",
      AliciKodu: "",
      KargoTuru: 3,
      OdemeTipi: 1,
      IrsaliyeSeriNo: "", 
      IrsaliyeSiraNo: "",
      ReferansNo: "",
      OzelKargoTakipNo: uniqueTrackingCode,
      Adet: 1,
      BirimDesi: String(order.package_length && order.package_width && order.package_height ? 
        (order.package_length * order.package_width * order.package_height) / 3000 : 1),
      BirimKg: String(order.package_weight || 1),
      KargoIcerigi: kargoIcerigi,
      KapidanOdemeTahsilatTipi: 0,
      KapidanOdemeTutari: 0,
      EkHizmetler: "",
      TasimaSekli: 1,
      TeslimSekli: 1,
      SevkAdresi: senderAddress.address1,
      GonderiSekli: 0,
      TeslimSubeKodu: "",
      Pazaryerimi: 0,
      EntegrasyonFirmasi: "",
      Iademi: 0
    };

    // Yeni API'yi çağır
    const data = await sendToSuratKargoV2(gonderi);
    
    return {
      isSuccess: !data.IsError,
      trackingNumber: uniqueTrackingCode,
      message: data.Message,
      data
    };
      
  } catch (error: unknown) {
    console.error('Sürat Kargo Yeni API Error:', error);
    throw error;
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
      .select('balance')
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
    onOrderUpdate();
  } catch (err) {
    console.error('Error creating label:', err);
    const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
    toast.error(`Etiket oluşturulurken bir hata oluştu: ${errorMessage}`);
  } finally {
    setIsLoading(false);
  }
}; 