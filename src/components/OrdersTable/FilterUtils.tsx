import { Order, ProductFilter } from './types';
import { findProductQuantityPairs } from './utils';

// Filtreleme mantığını içeren yardımcı fonksiyon
export const filterOrders = (
  orders: Order[],
  filterStatus: Order['status'] | 'ALL',
  productFilters: ProductFilter[],
  selectedProductFilters: string[],
  productQuantityFilters: {[product: string]: number | null},
  searchTerm: string
): Order[] => {
  return orders.filter(order => {
    // Durum filtresi
    if (filterStatus !== 'ALL' && order.status !== filterStatus) {
      return false;
    }
    
    // Ürün-miktar filtreleme
    if (productFilters.length > 0) {
      // Tüm filtrelerin sipariş içinde olmasını kontrol et (VE mantığı)
      for (const filter of productFilters) {
        const productExists = order.products.some(p => 
          p.name.toLowerCase().includes(filter.product.toLowerCase()) && 
          p.quantity === filter.quantity
        );
        
        // Eğer filtrelerden herhangi biri yoksa, bu sipariş filtreye uymuyor demektir
        if (!productExists) {
          return false;
        }
      }
      
      // Tüm filtreler varsa, sipariş filtreye uygun
      return true;
    }
    
    // Multi-select ürün filtreleri
    if (selectedProductFilters.length > 0) {
      // Tüm filtrelerin sipariş içinde olmasını kontrol et (VE mantığı)
      for (const productFilter of selectedProductFilters) {
        const quantity = productQuantityFilters[productFilter];
        
        // Her bir ürünün ve miktarın siparişte olup olmadığını kontrol et
        const productExists = order.products.some(p => 
          p.name === productFilter && 
          (quantity === null || p.quantity === quantity)
        );
        
        // Eğer filtrelerden herhangi biri yoksa, bu sipariş filtreye uymuyor demektir
        if (!productExists) {
          return false;
        }
      }
      
      // Tüm filtreler varsa, sipariş filtreye uygun
      return true;
    }
    
    // Arama filtresi
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      
      // Çoklu ürün ve miktar araması için (örn: "pantolon x5 tişört x3")
      if (searchLower.includes('x')) {
        // Potansiyel ürün+miktar kombinasyonlarını bul
        const productQuantityMatches = findProductQuantityPairs(searchLower);
        
        if (productQuantityMatches.length > 0) {
          // Tüm ürün-miktar eşleşmelerini kontrol et (VE mantığı)
          for (const { product, quantity } of productQuantityMatches) {
            // Sipariş içinde bu ürün+miktar kombinasyonu var mı?
            const productExists = order.products.some(p => 
              p.name.toLowerCase().includes(product) && p.quantity === quantity
            );
            
            // Eğer ürün+miktar kombinasyonu yoksa, filtreleme başarısız
            if (!productExists) {
              return false;
            }
          }
          
          // Tüm kombinasyonlar varsa, sipariş filtreye uygun
          return true;
        }
      }
      
      // Tek ürün araması veya normal arama
      return (
        (order.customer?.name?.toLowerCase().includes(searchLower)) ||
        (order.shipping_address?.address1?.toLowerCase().includes(searchLower)) ||
        (order.shipping_address?.city?.toLowerCase().includes(searchLower)) ||
        (order.tracking_number?.toLowerCase().includes(searchLower)) ||
        (order.products.some(p => p.name.toLowerCase().includes(searchLower)))
      );
    }
    
    return true;
  });
}; 