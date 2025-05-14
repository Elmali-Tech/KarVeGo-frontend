import React from 'react';
import { Filter, ChevronDown, X, Plus, RefreshCw } from 'lucide-react';
import { Order, ProductFilter } from './types';

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: Order['status'] | 'ALL';
  setFilterStatus: (value: Order['status'] | 'ALL') => void;
  showProductFilters: boolean;
  setShowProductFilters: (value: boolean) => void;
  selectedProductFilters: string[];
  setSelectedProductFilters: (value: string[]) => void;
  productQuantityFilters: {[product: string]: number | null};
  setProductQuantityFilters: (value: {[product: string]: number | null}) => void;
  allProducts: string[];
  allQuantities: number[];
  productFilters: ProductFilter[];
  setProductFilters?: (value: ProductFilter[]) => void;
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
  showProductFilters,
  setShowProductFilters,
  selectedProductFilters,
  setSelectedProductFilters,
  productQuantityFilters,
  setProductQuantityFilters,
  allProducts,
  allQuantities,
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
  const [showMultiFilter, setShowMultiFilter] = React.useState(false);
  const activeFilterCount = selectedProductFilters.length;
  
  const clearProductFilters = () => {
    setSelectedProductFilters([]);
    setProductQuantityFilters({});
    handleApplyFilters();
  };
  
  return (
    <div className="w-full">
      {/* Arama kutusu */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="relative flex-1 w-full">
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
      </div>
      
      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3 mt-3">
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
        
        {/* Ürün filtreleri temizleme butonu */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearProductFilters}
            className="flex items-center gap-1 px-3 py-2 border rounded-md bg-red-50 text-red-600 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4" />
            Filtreleri Temizle
          </button>
        )}
        
        {/* Yeni çoklu ürün-miktar filtresi butonu */}
        <button
          onClick={() => setShowMultiFilter(!showMultiFilter)}
          className={`flex items-center gap-1 px-3 py-2 border rounded-md ${productFilters.length > 0 ? 'bg-lightGreen text-white' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          <Filter className="w-4 h-4" />
          {productFilters.length > 0 ? `${productFilters.length} Ürün-Miktar Filtresi` : 'Ürün-Miktar Filtresi'}
          <ChevronDown className="w-4 h-4 ml-1" />
        </button>
        
        {/* Ürün-miktar filtreleri temizleme butonu */}
        {productFilters.length > 0 && (
          <button
            onClick={() => {
              handleClearProductFilters();
              handleApplyFilters();
            }}
            className="flex items-center gap-1 px-3 py-2 border rounded-md bg-red-50 text-red-600 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4" />
            Filtreleri Temizle
          </button>
        )}
      </div>
      
      {/* Ürün filtre paneli */}
      {showProductFilters && (
        <div className="bg-gray-50 p-4 rounded-md border mt-3 relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Ürünlere Göre Filtrele</h3>
            <button
              onClick={() => setShowProductFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-60 overflow-auto mb-3 pr-2">
            <div className="space-y-2 max-w-xs">
              {allProducts.map((product) => (
                <div key={product} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`product-${product}`}
                      checked={selectedProductFilters.includes(product)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProductFilters([...selectedProductFilters, product]);
                        } else {
                          setSelectedProductFilters(selectedProductFilters.filter(p => p !== product));
                        }
                      }}
                      className="rounded border-gray-300 text-darkGreen focus:ring-lightGreen"
                    />
                    <label htmlFor={`product-${product}`} className="ml-2 text-sm text-gray-700 truncate max-w-[150px]">
                      {product}
                    </label>
                  </div>
                  
                  {selectedProductFilters.includes(product) && (
                    <div className="flex items-center">
                      <select
                        value={productQuantityFilters[product] || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? null : parseInt(e.target.value);
                          setProductQuantityFilters({
                            ...productQuantityFilters,
                            [product]: value
                          });
                        }}
                        className="ml-2 border border-gray-300 rounded text-sm p-1 w-16"
                      >
                        <option value="">Tümü</option>
                        {allQuantities.map((qty) => (
                          <option key={qty} value={qty}>
                            x{qty}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleApplyFilters}
              className="bg-darkGreen text-white px-3 py-1 rounded-md hover:bg-lightGreen transition-colors text-sm"
            >
              Filtrele
            </button>
          </div>
        </div>
      )}
      
      {/* Ürün-Miktar Filtre Paneli */}
      {showMultiFilter && (
        <div className="bg-gray-50 p-4 rounded-md border mt-3 relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Ürün-Miktar Filtresi</h3>
            <button
              onClick={() => setShowMultiFilter(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Form alanları */}
          <div className="flex flex-col md:flex-row gap-2 mb-3">
            <select
              value={currentProduct}
              onChange={(e) => setCurrentProduct(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="">Ürün Seçin</option>
              {allProducts.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
            
            <input
              type="number"
              min="1"
              placeholder="Miktar"
              value={currentQuantity === '' ? '' : currentQuantity}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                setCurrentQuantity(val);
              }}
              className="w-24 border border-gray-300 rounded-md p-2 text-sm"
            />
            
            <button
              onClick={handleAddProductFilter}
              disabled={!currentProduct || !currentQuantity}
              className="flex items-center gap-1 bg-darkGreen text-white px-3 py-2 rounded-md hover:bg-lightGreen transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </div>
          
          {/* Mevcut filtreler */}
          {productFilters.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Mevcut Filtreler:</h4>
              <div className="flex flex-wrap gap-2">
                {productFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-white border rounded-full px-3 py-1 text-sm"
                  >
                    <span>{filter.product} x{filter.quantity}</span>
                    <button
                      onClick={() => handleRemoveProductFilter(index)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={handleApplyFilters}
              className="bg-darkGreen text-white px-3 py-1 rounded-md hover:bg-lightGreen transition-colors text-sm"
            >
              Filtrele
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters; 