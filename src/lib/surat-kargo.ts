import { toast } from 'sonner';

interface SuratKargoGonderen {
  MusteriId: string;
  Adi: string;
  Soyadi: string;
  Telefon: string;
  Email: string;
  Adres: string;
  IlId: number;
  IlceAdi: string;
}

interface SuratKargoAlici {
  MusteriId: string;
  Adi: string;
  Soyadi: string;
  Telefon: string;
  Email: string;
  Adres: string;
  IlId: number;
  IlceAdi: string;
}

// Backend API URL
// Geliştirme ortamında localhost, üretimde gerçek URL kullanılacak
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

// Geçerli ilçelerin listesi
const VALID_DISTRICTS = {
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"]
};

export async function createSuratKargoGonderi(
  gonderen: SuratKargoGonderen,
  alici: SuratKargoAlici,
  desi: number,
  kg: number,
  adet: number,
  icerik: string,
  satisKodu: string
) {
  try {
    console.log('Sürat Kargo isteği gönderiliyor...', {
      gonderen,
      alici,
      desi,
      kg,
      adet,
      icerik,
      satisKodu
    });

    // İl ve İlçe doğrulaması yap
    let il = "İstanbul";
    let ilce = "Üsküdar"; // Varsayılan olarak geçerli bir ilçe kullan
    
    // Eğer IlId varsa ve bir sayıya dönüştürülebiliyorsa kullan, yoksa "İstanbul" olarak ayarla
    if (alici.IlId) {
      if (typeof alici.IlId === 'number' && !isNaN(alici.IlId)) {
        // IlId 34 ise İstanbul'dur
        if (alici.IlId === 34) {
          il = "İstanbul";
        } else {
          // Diğer şehirler için sadece sayısal değeri string olarak kullan
          il = String(alici.IlId);
        }
      }
    }
    
    // İlçe adını doğrula
    if (alici.IlceAdi && alici.IlceAdi.trim() !== '') {
      const cleanIlce = alici.IlceAdi.trim();
      
      // Eğer il İstanbul ise ve ilçe listesinde varsa kullan
      if (il === "İstanbul" && VALID_DISTRICTS["İstanbul"].includes(cleanIlce)) {
        ilce = cleanIlce;
      } else if (il === "İstanbul" && cleanIlce.toLowerCase() === "üsküdar") {
        // Üsküdar özel durumu için
        ilce = "Üsküdar";
      } else if (il === "İstanbul") {
        // İstanbul için varsayılan ilçe Üsküdar olsun
        ilce = "Üsküdar";
      } else {
        // Diğer iller için ilçe adını olduğu gibi kullan
        ilce = cleanIlce || "Merkez";
      }
    }

    // Kısaltılmış bir satış kodu oluştur (12 karakterden kısa olmalı)
    const shortSalesCode = satisKodu.length > 10 ? 
      `K${Math.floor(Math.random() * 1000000)}` : 
      satisKodu;

    // API için istek payload'ını oluştur
    const requestPayload = {
      Gonderi: {
        KisiKurum: alici.Adi.trim() || "İsimsiz Alıcı",
        SahisBirim: "",
        AliciAdresi: alici.Adres.trim() || "Adres belirtilmemiş",
        Il: il,
        Ilce: ilce,
        TelefonEv: "",
        TelefonIs: "",
        TelefonCep: alici.Telefon.replace(/\D/g, '').substring(0, 10) || "1111111111",
        Email: alici.Email || "",
        AliciKodu: alici.MusteriId ? alici.MusteriId.substring(0, 10) : "",
        KargoTuru: 1, // Standart kargo
        OdemeTipi: 1, // Gönderici öder
        IrsaliyeSeriNo: "",
        IrsaliyeSiraNo: "",
        ReferansNo: `REF-${shortSalesCode}`.substring(0, 15),
        OzelKargoTakipNo: shortSalesCode.substring(0, 10),
        Adet: adet,
        BirimDesi: desi.toString(),
        BirimKg: kg.toString(),
        KargoIcerigi: icerik.substring(0, 100),
        KapidanOdemeTahsilatTipi: 0,
        KapidanOdemeTutari: "0",
        EkHizmetler: "",
        TasimaSekli: 1,
        TeslimSekli: 1,
        SevkAdresi: gonderen.Adres.substring(0, 30) || "Depo",
        GonderiSekli: 0,
        TeslimSubeKodu: "",
        Pazaryerimi: 0,
        EntegrasyonFirmasi: "Karvego",
        Iademi: false
      }
    };

    console.log('Sürat Kargo isteği:', requestPayload);
    
    // Backend proxy API isteği yap
    const response = await fetch(`${API_BASE_URL}/surat-kargo/barkod-olustur`, {
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

    console.log('Sürat Kargo backend yanıtı:', data);
    return data;
      
  } catch (error: unknown) {
    console.error('Sürat Kargo API Error:', error);
    if (error instanceof Error) {
      toast.error('Kargo etiketi oluşturulurken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } else {
      toast.error('Kargo etiketi oluşturulurken bilinmeyen bir hata oluştu');
    }
    throw error;
  }
}