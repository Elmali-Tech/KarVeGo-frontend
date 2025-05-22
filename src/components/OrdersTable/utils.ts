import { Order } from './types';

// Status badge rengini döndüren fonksiyon
export const getStatusBadgeClass = (status: Order['status']) => {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-800';
    case 'READY':
      return 'bg-yellow-100 text-yellow-800';
    case 'PRINTED':
      return 'bg-gray-100 text-gray-800';
    case 'SHIPPED':
      return 'bg-orange-100 text-orange-800';
    case 'PROBLEMATIC':
      return 'bg-red-100 text-red-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELED':
      return 'bg-red-50 text-red-600';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Status metnini Türkçe olarak döndüren fonksiyon
export const getStatusText = (status: Order['status']) => {
  switch (status) {
    case 'NEW':
      return 'Yeni';
    case 'READY':
      return 'Hazırlandı';
    case 'PRINTED':
      return 'Yazdırıldı';
    case 'SHIPPED':
      return 'Kargoda';
    case 'PROBLEMATIC':
      return 'Sorunlu';
    case 'COMPLETED':
      return 'Tamamlandı';
    case 'CANCELED':
      return 'İptal Edildi';
    default:
      return status;
  }
};

// Desi hesaplayan fonksiyon
export const calculateDesi = (order: Order | null): string => {
  if (!order?.package_height || !order?.package_width || !order?.package_length) {
    return '-';
  }
  const desi = (order.package_height * order.package_width * order.package_length) / 3000;
  return desi.toFixed(2);
};

// Fiyatlandırma için desi hesaplayan fonksiyon (yuvarlamalı)
export const calculateRoundedDesi = (order: Order | null): number => {
  if (!order?.package_height || !order?.package_width || !order?.package_length) {
    return 0;
  }
  
  const desi = (order.package_height * order.package_width * order.package_length) / 3000;
  const fraction = desi % 1;
  
  // 0.5'ten küçükse aşağı, 0.5 ve üzeriyse yukarı yuvarla
  if (fraction < 0.5) {
    return Math.floor(desi);
  } else {
    return Math.ceil(desi);
  }
};

// Fiyat formatlaması
export const formatPrice = (price?: number) => {
  if (!price) return '';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(price);
};

// Arama metninden ürün-miktar çiftlerini bulma yardımcı fonksiyonu
export const findProductQuantityPairs = (searchText: string): {product: string, quantity: number}[] => {
  const pairs: {product: string, quantity: number}[] = [];
  
  // "ürün x2" formatını ara (ürün çoklu kelime olabilir)
  const regex = /([a-zğüşıöçA-ZĞÜŞİÖÇ\s]+?)\s*x\s*(\d+)/g;
  let match;
  
  while ((match = regex.exec(searchText)) !== null) {
    const product = match[1].trim().toLowerCase();
    const quantity = parseInt(match[2], 10);
    if (product && !isNaN(quantity)) {
      pairs.push({ product, quantity });
    }
  }
  
  // "2x ürün" formatını ara (ürün çoklu kelime olabilir)
  const altRegex = /(\d+)\s*x\s*([a-zğüşıöçA-ZĞÜŞİÖÇ][a-zğüşıöçA-ZĞÜŞİÖÇ\s]*)/g;
  while ((match = altRegex.exec(searchText)) !== null) {
    const quantity = parseInt(match[1], 10);
    const product = match[2].trim().toLowerCase();
    if (product && !isNaN(quantity)) {
      pairs.push({ product, quantity });
    }
  }

  // Çok sıkı regex'ler çalışmazsa, daha basit bir yaklaşımla deneyelim
  if (pairs.length === 0) {
    // Metnin x karakterlerine göre bölümlerini incele
    const parts = searchText.split(/\s+/);
    for (let i = 0; i < parts.length - 1; i++) {
      // "ürün x2" formatını kontrol et
      if (parts[i+1].startsWith('x') && !isNaN(Number(parts[i+1].substring(1)))) {
        const product = parts[i].toLowerCase();
        const quantity = parseInt(parts[i+1].substring(1), 10);
        pairs.push({ product, quantity });
      }
      // "2x ürün" formatını kontrol et
      else if (parts[i].endsWith('x') && !isNaN(Number(parts[i].substring(0, parts[i].length - 1)))) {
        const quantity = parseInt(parts[i].substring(0, parts[i].length - 1), 10);
        const product = parts[i+1].toLowerCase();
        pairs.push({ product, quantity });
      }
    }
  }
  
  return pairs;
};

// Varsayılan paket boyutları
export const calculateDefaultDimensions = () => {
  // 1 desi = 3000 cm³
  // Default olarak 10x10x30 cm boyutlarını kullanıyoruz (3000 cm³ = 1 desi)
  return {
    height: 10,
    width: 10,
    length: 30,
    weight: 1 // 1 kg
  };
}; 