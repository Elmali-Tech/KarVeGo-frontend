import React from 'react';
import { Package, Trash2, Code, Edit, Tag, Eye } from 'lucide-react';
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
      {/* Desktop Table */}
      <table className="hidden md:table min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
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
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-3 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => handleSelectOrder(order.id)}
                  className="rounded border-gray-300 text-darkGreen focus:ring-lightGreen"
                />
              </td>
              <td className="px-3 py-4">
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
                <div className="text-sm text-gray-900 max-w-[200px] truncate">
                  {order.products?.map((p, i) => (
                    <span key={i}>
                      {i > 0 && ", "}
                      {p.name} x{p.quantity}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-3 py-4">
                <div className="text-sm text-gray-900">
                  {order.shipping_address?.city}, {order.shipping_address?.district}
                </div>
                <div className="text-xs text-gray-500 max-w-[200px] truncate">
                  {order.shipping_address?.address1}
                </div>
              </td>
              <td className="px-3 py-4">
                <div className="text-sm text-gray-900">{getWeightInfo(order)}</div>
                {order.tracking_number && (
                  <div className="text-xs text-gray-500">{order.tracking_number}</div>
                )}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(order.created_at).toLocaleDateString('tr-TR')}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-center text-sm font-medium">
                <div className="flex items-center justify-center space-x-2">
                  <button 
                    onClick={() => handleShowDetail(order)}
                    className="text-blue-500 hover:text-blue-700"
                    title="Detay Görüntüle"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleEditOrder(order)}
                    className="text-darkGreen hover:text-lightGreen"
                    title="Düzenle"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleBuyLabel(order)}
                    className="text-darkGreen hover:text-lightGreen"
                    title="Etiket Oluştur"
                  >
                    <Tag className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => showOrderJson(order)}
                    className="text-gray-500 hover:text-gray-700"
                    title="JSON Görüntüle"
                  >
                    <Code className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteOrder(order.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile View */}
      <div className="md:hidden space-y-4 px-4 py-2">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => handleSelectOrder(order.id)}
                  className="mr-3 rounded border-gray-300 text-darkGreen focus:ring-lightGreen"
                />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{order.customer?.name}</h3>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(order.created_at).toLocaleDateString('tr-TR')}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="text-sm">
                <div className="font-medium mb-1">Ürünler:</div>
                <div className="text-gray-700">
                  {order.products?.map((p, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                      <span>{p.name}</span>
                      <span className="font-medium">x{p.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div>
                <div className="font-medium text-gray-500">Adres:</div>
                <div className="text-gray-700">
                  {order.shipping_address?.address1}<br />
                  {order.shipping_address?.district}, {order.shipping_address?.city}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-500">Kargo Bilgisi:</div>
                <div className="text-gray-700">
                  {getWeightInfo(order)}<br />
                  {order.tracking_number || 'Takip No: -'}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
              <div>
                {order.source_name && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {order.source_name}
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleShowDetail(order)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleEditOrder(order)}
                  className="text-darkGreen hover:text-lightGreen"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleBuyLabel(order)}
                  className="text-darkGreen hover:text-lightGreen"
                >
                  <Tag className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => showOrderJson(order)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Code className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDeleteOrder(order.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TableView; 