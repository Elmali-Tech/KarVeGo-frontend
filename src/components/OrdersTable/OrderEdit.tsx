import React, { useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Order } from './types';

interface OrderEditProps {
  showEditModal: boolean;
  editingOrder: Order | null;
  closeEditModal: () => void;
  handleSaveOrder: () => void;
  setEditingOrder: (order: Order | null) => void;
  isLabelModalOpen?: boolean;
  selectedOrder?: Order | null;
  setSelectedOrder?: (order: Order | null) => void;
}

const OrderEdit: React.FC<OrderEditProps> = ({
  showEditModal,
  editingOrder,
  closeEditModal,
  handleSaveOrder,
  setEditingOrder,
  isLabelModalOpen,
  selectedOrder,
  setSelectedOrder
}) => {
  // Eğer etiket modalı açıkken sipariş düzenleniyor ve düzenlenen sipariş ile 
  // etiket modalındaki sipariş aynı ise, paket boyutları değiştiğinde 
  // etiket modalındaki siparişi de güncelle
  useEffect(() => {
    if (editingOrder && isLabelModalOpen && selectedOrder && setSelectedOrder && 
        editingOrder.id === selectedOrder.id) {
      // Sadece paket boyutları bilgilerini güncelle
      setSelectedOrder({
        ...selectedOrder,
        package_height: editingOrder.package_height,
        package_width: editingOrder.package_width,
        package_length: editingOrder.package_length,
        package_weight: editingOrder.package_weight
      });
    }
  }, [
    editingOrder,
    isLabelModalOpen,
    selectedOrder,
    setSelectedOrder
  ]);

  if (!editingOrder) return null;

  return (
    <Modal
      title="Siparişi Düzenle"
      isOpen={showEditModal}
      onClose={closeEditModal}
    >
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Durum</label>
            {editingOrder.status === 'PRINTED' ? (
              <>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-darkGreen focus:ring-darkGreen sm:text-sm"
                  value={editingOrder.status}
                  onChange={(e) => setEditingOrder({
                    ...editingOrder,
                    status: e.target.value as Order['status']
                  })}
                >
                  <option value="PRINTED">Yazdırıldı</option>
                  <option value="SHIPPED">Kargoda</option>
                  <option value="COMPLETED">Tamamlandı</option>
                </select>
                <p className="mt-1 text-xs text-orange-600">
                  Etiket oluşturulmuş siparişlerin durumu sadece Kargoda veya Tamamlandı olarak değiştirilebilir.
                </p>
              </>
            ) : editingOrder.status === 'READY' ? (
              <>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-darkGreen focus:ring-darkGreen sm:text-sm"
                  value={editingOrder.status}
                  onChange={(e) => setEditingOrder({
                    ...editingOrder,
                    status: e.target.value as Order['status']
                  })}
                >
                  <option value="READY">Hazırlandı</option>
                  <option value="SHIPPED">Kargoda</option>
                  <option value="COMPLETED">Tamamlandı</option>
                </select>
                <p className="mt-1 text-xs text-orange-600">
                  Hazırlanan siparişlerin durumu sadece Kargoda veya Tamamlandı olarak değiştirilebilir.
                </p>
              </>
            ) : editingOrder.status === 'COMPLETED' ? (
              <>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed text-gray-700 sm:text-sm"
                  value={editingOrder.status}
                  disabled
                >
                  <option value="COMPLETED">Tamamlandı</option>
                </select>
                <p className="mt-1 text-xs text-orange-600">
                  Tamamlanmış siparişlerin durumu değiştirilemez.
                </p>
              </>
            ) : (
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-darkGreen focus:ring-darkGreen sm:text-sm"
                value={editingOrder.status}
                onChange={(e) => setEditingOrder({
                  ...editingOrder,
                  status: e.target.value as Order['status']
                })}
              >
                <option value="NEW">Yeni</option>
                <option value="READY">Hazırlandı</option>
                <option value="PRINTED">Yazdırıldı</option>
                <option value="SHIPPED">Kargoda</option>
                <option value="PROBLEMATIC">Sorunlu</option>
                <option value="COMPLETED">Tamamlandı</option>
                <option value="CANCELED">İptal Edildi</option>
              </select>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Takip Numarası</label>
            <input
              type="text"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${
                editingOrder.status === 'PRINTED' || editingOrder.status === 'READY'
                  ? 'bg-gray-100 cursor-not-allowed text-gray-700' 
                  : 'focus:border-darkGreen focus:ring-darkGreen'
              } sm:text-sm`}
              value={editingOrder.tracking_number || ''}
              onChange={(e) => setEditingOrder({
                ...editingOrder,
                tracking_number: e.target.value
              })}
              disabled={editingOrder.status === 'PRINTED' || editingOrder.status === 'READY'}
            />
            {(editingOrder.status === 'PRINTED' || editingOrder.status === 'READY') && (
              <p className="mt-1 text-xs text-orange-600">
                Etiket oluşturulmuş siparişlerin takip numarası değiştirilemez.
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Paket Yüksekliği (cm)</label>
            <input
              type="number"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${
                editingOrder.status === 'PRINTED' || editingOrder.status === 'READY'
                  ? 'bg-gray-100 cursor-not-allowed text-gray-700' 
                  : 'focus:border-darkGreen focus:ring-darkGreen'
              } sm:text-sm`}
              value={editingOrder.package_height}
              onChange={(e) => setEditingOrder({
                ...editingOrder,
                package_height: parseFloat(e.target.value)
              })}
              disabled={editingOrder.status === 'PRINTED' || editingOrder.status === 'READY'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Paket Genişliği (cm)</label>
            <input
              type="number"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${
                editingOrder.status === 'PRINTED' || editingOrder.status === 'READY'
                  ? 'bg-gray-100 cursor-not-allowed text-gray-700' 
                  : 'focus:border-darkGreen focus:ring-darkGreen'
              } sm:text-sm`}
              value={editingOrder.package_width}
              onChange={(e) => setEditingOrder({
                ...editingOrder,
                package_width: parseFloat(e.target.value)
              })}
              disabled={editingOrder.status === 'PRINTED' || editingOrder.status === 'READY'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Paket Uzunluğu (cm)</label>
            <input
              type="number"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${
                editingOrder.status === 'PRINTED' || editingOrder.status === 'READY'
                  ? 'bg-gray-100 cursor-not-allowed text-gray-700' 
                  : 'focus:border-darkGreen focus:ring-darkGreen'
              } sm:text-sm`}
              value={editingOrder.package_length}
              onChange={(e) => setEditingOrder({
                ...editingOrder,
                package_length: parseFloat(e.target.value)
              })}
              disabled={editingOrder.status === 'PRINTED' || editingOrder.status === 'READY'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Paket Ağırlığı (kg)</label>
            <input
              type="number"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${
                editingOrder.status === 'PRINTED' || editingOrder.status === 'READY'
                  ? 'bg-gray-100 cursor-not-allowed text-gray-700' 
                  : 'focus:border-darkGreen focus:ring-darkGreen'
              } sm:text-sm`}
              value={editingOrder.package_weight}
              onChange={(e) => setEditingOrder({
                ...editingOrder,
                package_weight: parseFloat(e.target.value)
              })}
              disabled={editingOrder.status === 'PRINTED' || editingOrder.status === 'READY'}
            />
            {(editingOrder.status === 'PRINTED' || editingOrder.status === 'READY') && (
              <p className="mt-1 text-xs text-orange-600">
                Etiket oluşturulmuş siparişlerin paket bilgileri değiştirilemez.
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
              <button
            onClick={closeEditModal}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            İptal
              </button>
        <button
            onClick={handleSaveOrder}
            className="px-4 py-2 text-sm font-medium text-white bg-darkGreen hover:bg-lightGreen rounded-md"
        >
            Kaydet
        </button>
      </div>
      </div>
    </Modal>
  );
};

export default OrderEdit; 