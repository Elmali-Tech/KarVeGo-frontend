import { toast } from 'sonner';

interface SuratKargoGonderi {
  KisiKurum: string;
  SahisBirim: string;
  AliciAdresi: string;
  Il: string;
  Ilce: string;
  TelefonEv: string;
  TelefonIs: string;
  TelefonCep: string;
  Email: string;
  AliciKodu: string;
  KargoTuru: number;
  OdemeTipi: number;
  IrsaliyeSeriNo: string;
  IrsaliyeSiraNo: string;
  ReferansNo: string;
  OzelKargoTakipNo: string;
  Adet: number;
  BirimDesi: string;
  BirimKg: string;
  KargoIcerigi: string;
  KapidanOdemeTahsilatTipi: number;
  KapidanOdemeTutari: number;
  EkHizmetler: string;
  TasimaSekli: number;
  TeslimSekli: number;
  SevkAdresi: string;
  GonderiSekli: number;
  TeslimSubeKodu: string;
  Pazaryerimi: number;
  EntegrasyonFirmasi: string;
  Iademi: number;
}

interface SuratKargoRequest {
  KullaniciAdi: string;
  Sifre: string;
  Gonderi: SuratKargoGonderi;
}

interface SuratKargoResponse {
  Message: string;
  IsError: boolean;
  StatusCode: number;
  Value: null;
}

// Backend API URL
// Geliştirme ortamında localhost, üretimde gerçek URL kullanılacak
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3000/api' 
  : 'https://karvego.com/api';

/**
 * Sürat Kargo GonderiyiKargoyaGonder API'sini çağıran fonksiyon
 * Bu yeni API'de barkod veya ZPL kodu dönmüyor, sadece başarı durumu dönüyor
 */
export async function sendToSuratKargoV2(gonderi: SuratKargoGonderi): Promise<SuratKargoResponse> {
  try {
    console.log('Sürat Kargo V2 isteği gönderiliyor...', {
      gonderi
    });

    // Alan uzunluklarını kontrol et ve kısalt
    const sanitizedGonderi: SuratKargoGonderi = {
      ...gonderi,
      KisiKurum: gonderi.KisiKurum?.substring(0, 40) || "İsimsiz Alıcı",
      AliciAdresi: gonderi.AliciAdresi?.substring(0, 100) || "Adres belirtilmemiş",
      ReferansNo: gonderi.ReferansNo?.substring(0, 15) || "",
      OzelKargoTakipNo: gonderi.OzelKargoTakipNo?.substring(0, 10) || `3636${Math.floor(Math.random() * 10000000)}`.substring(0, 10),
      KargoIcerigi: gonderi.KargoIcerigi?.substring(0, 100) || "",
      SevkAdresi: gonderi.SevkAdresi?.substring(0, 30) || "Depo",
      TelefonCep: (gonderi.TelefonCep?.replace(/\D/g, '') || "5555555555").substring(0, 10)
    };
    
    // İl ve ilçe kontrolü
    if (sanitizedGonderi.Il === "İstanbul") {
      const validDistricts = [
        "Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", 
        "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", 
        "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", 
        "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", 
        "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", 
        "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", 
        "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", 
        "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"
      ];
      
      if (!validDistricts.includes(sanitizedGonderi.Ilce)) {
        console.log(`Geçersiz İstanbul ilçesi: ${sanitizedGonderi.Ilce}, Üsküdar ile değiştiriliyor`);
        sanitizedGonderi.Ilce = "Üsküdar";
      }
    }
    
    // API için istek payload'ını oluştur
    const requestPayload: SuratKargoRequest = {
      KullaniciAdi: "1472651760",
      Sifre: "Kargo.2025",
      Gonderi: sanitizedGonderi
    };

    console.log('Sürat Kargo V2 isteği:', requestPayload);
    
    // Backend proxy API isteği yap
    const response = await fetch(`${API_BASE_URL}/surat-kargo/gonderiye-gonder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Hatası: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.IsError) {
      throw new Error(data.Message || 'Kargo etiketi oluşturulurken bir hata oluştu');
    }

    console.log('Sürat Kargo V2 API yanıtı:', data);
    return data;
      
  } catch (error: unknown) {
    console.error('Sürat Kargo V2 API Error:', error);
    if (error instanceof Error) {
      toast.error('Kargo etiketi oluşturulurken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } else {
      toast.error('Kargo etiketi oluşturulurken bilinmeyen bir hata oluştu');
    }
    throw error;
  }
}

// Sürat Kargo etiket iptali için backend fonksiyonu
export const cancelSuratKargoLabelV2 = async (trackingNumber: string) => {
  try {
    console.log('Etiket iptal isteği gönderiliyor:', { trackingNumber });
    
    const response = await fetch(`${API_BASE_URL}/surat-kargo/cancel-label`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trackingNumber })
    });

    const responseText = await response.text();
    console.log('Backend yanıtı:', { status: response.status, text: responseText });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || 'Etiket iptal edilirken bir hata oluştu';
      } catch (e) {
        errorMessage = `Backend hatası (${response.status}): ${responseText}`;
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Geçersiz JSON yanıtı: ${responseText}`);
    }

    console.log('Etiket iptal başarılı:', data);
    return data;
  } catch (error) {
    console.error('Sürat Kargo etiket iptal hatası:', error);
    if (error instanceof Error) {
      toast.error('Etiket iptal edilirken bir hata oluştu: ' + error.message);
    } else {
      toast.error('Etiket iptal edilirken bilinmeyen bir hata oluştu');
    }
    throw error;
  }
}; 