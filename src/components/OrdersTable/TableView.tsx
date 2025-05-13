import React from 'react';
import { Package, Trash2, Code, Edit, Tag, Eye, MoreHorizontal, Filter, X } from 'lucide-react';
import { Order } from './types';
import { getStatusBadgeClass, getStatusText } from './utils';

interface TableViewProps {
  filteredOrders: Order[];
  selectedOrders: string[];
  handleSelectOrder: (orderId: string) => void;
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getWeightInfo: (order: Order) => React.ReactNode;
  handleShowDetail: (order: Order) => void;
  handleEditOrder: (order: Order) => void;
  handleBuyLabel: (order: Order) => void;
  showOrderJson: (order: Order) => void;
  handleDeleteOrder: (orderId: string) => void;
}

const TableView: React.FC<TableViewProps> = ({
  filteredOrders,
  selectedOrders,
  handleSelectOrder,
  handleSelectAll,
  getWeightInfo,
  handleShowDetail,
  handleEditOrder,
  handleBuyLabel,
  showOrderJson,
  handleDeleteOrder
}) => {
  // State for dropdown menus
  const [openActionMenu, setOpenActionMenu] = React.useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = React.useState(false);

  // Toggle action menu for a specific order
  const toggleActionMenu = (orderId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setOpenActionMenu(prev => prev === orderId ? null : orderId);
  };

  // Close all action menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setOpenActionMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (filteredOrders.length === 0) {
    return (
      <div className="bg-white py-12">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sipariş Bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">
            Filtreleri değiştirerek daha fazla sonuç görüntüleyebilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Table Container with Horizontal Scroll */}
      <div className="hidden md:block overflow-x-auto rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-darkGreen focus:ring-lightGreen"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Müşteri
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ürünler
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adres
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kargo
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 border-b border-gray-200">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleSelectOrder(order.id)}
                    className="rounded border-gray-300 text-darkGreen focus:ring-lightGreen"
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <div className="text-sm font-medium text-gray-900">{order.customer?.name}</div>
                  {order.source_name && (
                    <div className="text-xs text-gray-500">{order.source_name}</div>
                  )}
                </td>
                <td className="px-3 py-4">
                  <div className="text-sm text-gray-900 max-w-[250px] overflow-hidden hover:overflow-visible hover:whitespace-normal">
                    {order.products?.map((p, i) => (
                      <span key={i} className="inline-block mr-1">
                        {i > 0 && <span className="text-gray-400 mr-1">•</span>}
                        <span className="whitespace-nowrap">{p.name} <span className="font-medium">x{p.quantity}</span></span>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div className="text-sm text-gray-900">
                    {order.shipping_address?.city}, {order.shipping_address?.district}
                  </div>
                  <div className="text-xs text-gray-500 max-w-[250px] truncate hover:text-clip hover:overflow-visible">
                    {order.shipping_address?.address1}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{getWeightInfo(order)}</div>
                  {order.tracking_number && (
                    <div className="text-xs text-gray-500">{order.tracking_number}</div>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium relative">
                  <div className="flex items-center justify-center">
                    <button 
                      onClick={(e) => toggleActionMenu(order.id, e)}
                      className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"
                      title="İşlemler"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    
                    {openActionMenu === order.id && (
                      <div className="absolute right-6 mt-24 bg-white rounded-md shadow-lg z-20 w-40 border">
                        <div className="py-1">
                          <button
                            onClick={() => handleShowDetail(order)}
                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 mr-2 text-blue-500" />
                            Detay
                          </button>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 mr-2 text-darkGreen" />
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleBuyLabel(order)}
                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                          >
                            <Tag className="w-4 h-4 mr-2 text-darkGreen" />
                            Etiket
                          </button>
                          <button
                            onClick={() => showOrderJson(order)}
                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                          >
                            <Code className="w-4 h-4 mr-2 text-gray-500" />
                            JSON
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Sil
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Minimalist Mobile View with Cards */}
      <div className="md:hidden relative">
        <div className="space-y-2 px-2 py-2 pb-16">
          {filteredOrders.map((order) => (
            <div 
              key={order.id}
              className="bg-white rounded-lg border shadow-sm relative"
              onClick={() => handleShowDetail(order)}
            >
              {/* Header with status and checkbox */}
              <div className="flex items-center justify-between p-2 border-b">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectOrder(order.id);
                    }}
                    className="rounded border-gray-300 text-darkGreen focus:ring-lightGreen"
                  />
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                {/* Menu button */}
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => toggleActionMenu(order.id, e)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                  </button>
                  
                  {openActionMenu === order.id && (
                    <div className="absolute right-2 mt-1 bg-white border rounded-md shadow-lg z-20 w-32">
                      <div className="py-1">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="flex items-center w-full px-3 py-2 text-xs text-left text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="w-3 h-3 mr-2" />
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleBuyLabel(order)}
                          className="flex items-center w-full px-3 py-2 text-xs text-left text-gray-700 hover:bg-gray-100"
                        >
                          <Tag className="w-3 h-3 mr-2" />
                          Etiket
                        </button>
                        <button
                          onClick={() => showOrderJson(order)}
                          className="flex items-center w-full px-3 py-2 text-xs text-left text-gray-700 hover:bg-gray-100"
                        >
                          <Code className="w-3 h-3 mr-2" />
                          JSON
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="flex items-center w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-red-50 border-t"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Sil
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer and product info */}
              <div className="p-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">{order.customer?.name}</h3>
                  <span className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-800 font-medium truncate max-w-[220px]">
                    {order.products?.map((p, i) => (
                      <span key={i}>
                        {i > 0 && ' • '}
                        {p.name} x{p.quantity}
                      </span>
                    ))}
                  </span>
                </div>
                
                {/* Footer with minimal info */}
                <div className="flex items-center justify-between mt-2 pt-1 text-xs text-gray-500 border-t">
                  <div className="truncate max-w-[60%]">
                    {order.shipping_address?.city}, {order.shipping_address?.district}
                  </div>
                  <div>
                    {order.tracking_number ? (
                      <span className="font-medium text-blue-700">{order.tracking_number}</span>
                    ) : getWeightInfo(order)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Fixed Filter Button */}
        <button
          onClick={() => setShowFilterModal(true)}
          className="fixed left-4 bottom-4 z-30 bg-darkGreen text-white p-3 rounded-full shadow-lg"
        >
          <Filter className="w-5 h-5" />
        </button>
        
        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-end justify-center">
            <div className="bg-white rounded-t-xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-lg font-medium">Filtreler</h3>
                <button 
                  onClick={() => setShowFilterModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              
              <div className="p-4">
                {/* Filtre içeriği burada olacak */}
                <div className="text-center py-8 text-gray-500">
                  Bu bölüm Filters bileşeni ile entegre edilmelidir.
                </div>
                
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="w-full bg-darkGreen text-white py-2 rounded-lg mt-4"
                >
                  Uygula
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TableView; 