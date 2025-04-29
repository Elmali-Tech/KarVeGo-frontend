import React from 'react';
import { Filter, ChevronDown, X, Plus, Search, RefreshCw, Tag, Trash2 } from 'lucide-react';
import { Order, ProductFilter } from './types';
import { getStatusText } from './utils';

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: Order['status'] | 'ALL';
  setFilterStatus: (value: Order['status'] | 'ALL') => void;
  selectedOrders: string[];
  handleBulkCreateLabels: () => void;
  handleBulkUpdateStatus: (status: Order['status']) => void;
  handleDeleteSelected: () => void;
  onOrderUpdate: () => void;
  showProductFilters: boolean;
  setShowProductFilters: (value: boolean) => void;
  selectedProductFilters: string[];
  setSelectedProductFilters: (value: string[]) => void;
  productQuantityFilters: {[product: string]: number | null};
  setProductQuantityFilters: (value: {[product: string]: number | null}) => void;
  allProducts: string[];
  allQuantities: number[];
  activeFilterCount: number;
  showMultiFilter: boolean;
  setShowMultiFilter: (value: boolean) => void;
  productFilters: ProductFilter[];
  currentProduct: string;
  setCurrentProduct: (value: string) => void;
  currentQuantity: number | '';
  setCurrentQuantity: (value: number | '') => void;
  handleAddProductFilter: () => void;
  handleRemoveProductFilter: (index: number) => void;
  handleClearProductFilters: () => void;
  handleApplyFilters: () => void;
}

const Filters: React.FC<FiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  selectedOrders,
  handleBulkCreateLabels,
  handleBulkUpdateStatus,
  handleDeleteSelected,
  onOrderUpdate,
  showProductFilters,
  setShowProductFilters,
  selectedProductFilters,
  setSelectedProductFilters,
  productQuantityFilters,
  setProductQuantityFilters,
  allProducts,
  allQuantities,
  activeFilterCount,
  showMultiFilter,
  setShowMultiFilter,
  productFilters,
  currentProduct,
  setCurrentProduct,
  currentQuantity,
  setCurrentQuantity,
  handleAddProductFilter,
  handleRemoveProductFilter,
  handleClearProductFilters,
  handleApplyFilters
}) => {
  return (
    <div className="bg-white p-4 border-b flex flex-col gap-4">
      {/* Arama ve Yenileme Butonu */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        {/* Arama kutusu */}
        <div className="relative w-full md:flex-1 max-w-full">
          <input
            type="text"
            placeholder="Ara: pantolon x5 tişört x3..."
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-lightGreen"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            title="Birden fazla ürün ve miktar araması için 'pantolon x5 tişört x3' gibi kombinasyonlar kullanabilirsiniz."
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            <div className="cursor-help" title="Birden fazla ürün ve miktar araması için 'pantolon x5 tişört x3' gibi kombinasyonlar kullanabilirsiniz.">
              <Filter className="w-4 h-4" />
            </div>
          </div>
        </div>
        
        {/* Sağ Taraftaki Butonlar */}
        <div className="flex flex-wrap gap-2 justify-end">
          {selectedOrders.length > 0 && (
            <>
              <button
                onClick={handleBulkCreateLabels}
                className="flex items-center gap-1 bg-lightGreen text-white px-3 py-2 rounded-md hover:bg-darkGreen transition-colors text-sm"
              >
                <Tag className="w-4 h-4" />
                Etiket Oluştur ({selectedOrders.length})
              </button>
              
              <div className="relative inline-block">
                <button
                  className="flex items-center gap-1 bg-darkGreen text-white px-3 py-2 rounded-md hover:bg-lightGreen transition-colors text-sm"
                  onClick={() => document.getElementById('status-dropdown')?.classList.toggle('hidden')}
                >
                  <RefreshCw className="w-4 h-4" />
                  Durum Güncelle
                </button>
                <div id="status-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    <button onClick={() => handleBulkUpdateStatus('NEW')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                      Yeni
                    </button>
                    <button onClick={() => handleBulkUpdateStatus('READY')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                      Hazırlandı
                    </button>
                    <button onClick={() => handleBulkUpdateStatus('PRINTED')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                      Yazdırıldı
                    </button>
                    <button onClick={() => handleBulkUpdateStatus('SHIPPED')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                      Kargoda
                    </button>
                    <button onClick={() => handleBulkUpdateStatus('PROBLEMATIC')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                      Sorunlu
                    </button>
                    <button onClick={() => handleBulkUpdateStatus('COMPLETED')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                      Tamamlandı
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Sil ({selectedOrders.length})
              </button>
            </>
          )}
          
          <button
            onClick={onOrderUpdate}
            className="flex-shrink-0 flex items-center gap-1 bg-darkGreen text-white px-3 py-2 rounded-md hover:bg-lightGreen transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </button>
        </div>
      </div>
      
      {/* Filtreler - İkinci Satır */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Durum filtresi */}
        <div className="relative">
          <select
            className="border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-lightGreen appearance-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Order['status'] | 'ALL')}
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="NEW">Yeni</option>
            <option value="READY">Hazırlandı</option>
            <option value="PRINTED">Yazdırıldı</option>
            <option value="SHIPPED">Kargoda</option>
            <option value="PROBLEMATIC">Sorunlu</option>
            <option value="COMPLETED">Tamamlandı</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
        </div>
        
        {/* Ürün filtreleme butonu */}
        <button
          onClick={() => setShowProductFilters(!showProductFilters)}
          className={`flex items-center gap-1 px-3 py-2 border rounded-md ${activeFilterCount > 0 ? 'bg-lightGreen text-white' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          <Filter className="w-4 h-4" />
          {activeFilterCount > 0 ? `${activeFilterCount} Ürün Filtresi` : 'Ürünlere Göre Filtrele'}
          <ChevronDown className="w-4 h-4 ml-1" />
        </button>
        
        {/* Yeni çoklu ürün-miktar filtresi butonu */}
        <button
          onClick={() => setShowMultiFilter(!showMultiFilter)}
          className={`flex items-center gap-1 px-3 py-2 border rounded-md ${productFilters.length > 0 ? 'bg-lightGreen text-white' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          <Filter className="w-4 h-4" />
          {productFilters.length > 0 ? `${productFilters.length} Ürün-Miktar Filtresi` : 'Ürün-Miktar Filtresi'}
          <ChevronDown className="w-4 h-4 ml-1" />
        </button>
      </div>
      
      {/* Ürün filtre paneli */}
      {showProductFilters && (
        <div className="bg-gray-50 p-4 rounded-md border mb-2 relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Ürünlere Göre Filtrele</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedProductFilters([]);
                  setProductQuantityFilters({});
                }}
                className="text-red-500 text-sm hover:underline flex items-center"
                disabled={activeFilterCount === 0}
              >
                Filtreleri Temizle <X className="w-3 h-3 ml-1" />
              </button>
              <button
                onClick={() => setShowProductFilters(false)}
                className="text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
            {allProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center">
                <input
                    type="checkbox"
                    id={`product-${index}`}
                    checked={selectedProductFilters.includes(product)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProductFilters(prev => [...prev, product]);
                        // Başlangıçta miktar filtresi uygulanmaz
                        setProductQuantityFilters(prev => ({...prev, [product]: null}));
                      } else {
                        setSelectedProductFilters(prev => prev.filter(p => p !== product));
                        // Filtre kaldırıldığında miktar filtresini de kaldır
                        setProductQuantityFilters(prev => {
                          const newFilters = {...prev};
                          delete newFilters[product];
                          return newFilters;
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-darkGreen focus:ring-lightGreen mr-2"
                  />
                  <label htmlFor={`product-${index}`} className="text-sm">
                    {product}
                  </label>
                </div>
                
                {/* Miktar seçme */}
                {selectedProductFilters.includes(product) && (
                  <select
                    value={productQuantityFilters[product] || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : Number(e.target.value);
                      setProductQuantityFilters(prev => ({
                        ...prev,
                        [product]: value
                      }));
                    }}
                    className="text-xs border rounded-md px-1 py-1 w-16 focus:outline-none focus:ring-1 focus:ring-lightGreen"
                  >
                    <option value="">Tümü</option>
                    {allQuantities.map((quantity, idx) => (
                      <option key={idx} value={quantity}>{quantity} adet</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Yeni çoklu ürün-miktar filtre paneli */}
      {showMultiFilter && (
        <div className="bg-gray-50 p-4 rounded-md border mb-2 relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Ürün ve Miktar Filtreleri</h3>
            <div className="flex gap-2">
              <button
                onClick={handleClearProductFilters}
                className="text-red-500 text-sm hover:underline flex items-center"
                disabled={productFilters.length === 0}
              >
                Filtreleri Temizle <X className="w-3 h-3 ml-1" />
              </button>
              <button
                onClick={() => setShowMultiFilter(false)}
                className="text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Aktif filtreler */}
          {productFilters.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium mb-2 text-gray-500">Aktif Filtreler:</h4>
              <div className="flex flex-wrap gap-2">
                {productFilters.map((filter, index) => (
                  <div 
                    key={index} 
                    className="bg-lightGreen bg-opacity-10 text-darkGreen px-2 py-1 rounded-md text-sm flex items-center"
                  >
                    <span>{filter.product} x{filter.quantity}</span>
                    <button
                      onClick={() => handleRemoveProductFilter(index)}
                      className="ml-1 text-darkGreen hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Yeni filtre ekleme formu */}
          <div className="flex flex-col md:flex-row gap-2 mb-3">
            <input
              type="text"
              placeholder="Ürün Adı"
              value={currentProduct}
              onChange={(e) => setCurrentProduct(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen"
            />
            <input
              type="number"
              placeholder="Adet"
              value={currentQuantity}
              onChange={(e) => setCurrentQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              min="1"
              className="w-32 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen"
            />
            <button
              onClick={handleAddProductFilter}
              disabled={!currentProduct || currentQuantity === ''}
              className="px-3 py-2 bg-lightGreen text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Ekle
            </button>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleApplyFilters}
              className="px-3 py-2 bg-darkGreen text-white rounded-md text-sm flex items-center gap-1"
            >
              <Search className="w-4 h-4" /> Ara
            </button>
          </div>
        </div>
      )}
      
      {/* Aktif filtre etiketleri */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {selectedProductFilters.map((product, index) => (
            <div 
              key={index} 
              className="bg-lightGreen bg-opacity-10 text-darkGreen px-2 py-1 rounded-md text-sm flex items-center"
            >
              <span>{product}{productQuantityFilters[product] !== null ? ` (${productQuantityFilters[product]} adet)` : ''}</span>
                <button
                onClick={() => {
                  setSelectedProductFilters(prev => prev.filter(p => p !== product));
                  setProductQuantityFilters(prev => {
                    const newFilters = {...prev};
                    delete newFilters[product];
                    return newFilters;
                  });
                }}
                className="ml-1 text-darkGreen hover:text-red-500"
              >
                <X className="w-3 h-3" />
                </button>
              </div>
            ))}
        </div>
      )}
      
      {/* Ürün-miktar filtreleri etiketleri */}
      {productFilters.length > 0 && !showMultiFilter && (
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="text-xs text-gray-500">Ürün-Miktar Filtreleri:</span>
          {productFilters.map((filter, index) => (
            <div 
              key={index} 
              className="bg-lightGreen bg-opacity-10 text-darkGreen px-2 py-1 rounded-md text-sm flex items-center"
            >
              <span>{filter.product} x{filter.quantity}</span>
              <button
                onClick={() => handleRemoveProductFilter(index)}
                className="ml-1 text-darkGreen hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={handleClearProductFilters}
            className="text-xs text-red-500 hover:underline flex items-center"
          >
            Temizle <X className="w-3 h-3 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Filters; 