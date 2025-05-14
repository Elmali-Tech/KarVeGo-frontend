import React from 'react';
import { Modal } from '../common/Modal';
import { Order } from './types';
import { getStatusBadgeClass, getStatusText, calculateDesi, formatPrice } from './utils';

interface OrderDetailProps {
  detailOrder: Order | null;
  showDetailModal: boolean;
  setShowDetailModal: (show: boolean) => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({
  detailOrder,
  showDetailModal,
  setShowDetailModal
}) => {
  if (!detailOrder) return null;

  return (
    <Modal
      title="Sipariş Detayları"
      isOpen={showDetailModal}
      onClose={() => setShowDetailModal(false)}
    >
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Müşteri Bilgileri */}
          <div className="bg-gray-50 p-4 rounded-md shadow-sm">
            <h3 className="text-sm font-medium text-darkGreen mb-3">Müşteri Bilgileri</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Ad Soyad:</span> {detailOrder?.customer?.name}
              </p>
              {detailOrder?.customer?.email && (
                <p className="text-sm">
                  <span className="font-medium">E-posta:</span> {detailOrder.customer.email}
                </p>
              )}
              {detailOrder.customer?.phone && (
                <p className="text-sm">
                  <span className="font-medium">Telefon:</span> {detailOrder.customer.phone}
                </p>
              )}
            </div>
          </div>

          {/* Sipariş Bilgileri */}
          <div className="bg-gray-50 p-4 rounded-md shadow-sm">
            <h3 className="text-sm font-medium text-darkGreen mb-3">Sipariş Bilgileri</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Sipariş ID:</span> {detailOrder.id}
              </p>
              <p className="text-sm">
                <span className="font-medium">Oluşturulma Tarihi:</span> {new Date(detailOrder.created_at).toLocaleDateString('tr-TR')}
              </p>
              <p className="text-sm">
                <span className="font-medium">Durum:</span>{" "}
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(detailOrder.status)}`}>
                  {getStatusText(detailOrder.status)}
                </span>
              </p>
              {detailOrder.source_name && (
                <p className="text-sm">
                  <span className="font-medium">Kaynak:</span> {detailOrder.source_name}
                </p>
              )}
            </div>
          </div>

          {/* Teslimat Adresi */}
          {detailOrder.shipping_address && (
            <div className="bg-gray-50 p-4 rounded-md shadow-sm">
              <h3 className="text-sm font-medium text-darkGreen mb-3">Teslimat Adresi</h3>
              <div className="space-y-2">
                {detailOrder.shipping_address.name && (
                  <p className="text-sm">
                    <span className="font-medium">Ad Soyad:</span> {detailOrder.shipping_address.name}
                  </p>
                )}
                {detailOrder.shipping_address.address1 && (
                  <p className="text-sm">
                    <span className="font-medium">Adres:</span> {detailOrder.shipping_address.address1}
                    {detailOrder.shipping_address.address2 && `, ${detailOrder.shipping_address.address2}`}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">İlçe/İl:</span> {detailOrder.shipping_address.district || '-'}/{detailOrder.shipping_address.city || '-'}
                </p>
                {detailOrder.shipping_address.phone && (
                  <p className="text-sm">
                    <span className="font-medium">Telefon:</span> {detailOrder.shipping_address.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Kargo Bilgileri */}
          <div className="bg-gray-50 p-4 rounded-md shadow-sm">
            <h3 className="text-sm font-medium text-darkGreen mb-3">Kargo Bilgileri</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Boyutlar:</span> {detailOrder.package_length}x{detailOrder.package_width}x{detailOrder.package_height} cm
              </p>
              <p className="text-sm">
                <span className="font-medium">Desi:</span> {calculateDesi(detailOrder)}
              </p>
              <p className="text-sm">
                <span className="font-medium">Ağırlık:</span> {detailOrder.package_weight} kg
              </p>
              {detailOrder.tracking_number && (
                <p className="text-sm">
                  <span className="font-medium">Takip Numarası:</span> {detailOrder.tracking_number}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ürün Listesi */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-darkGreen mb-3">Ürünler</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ürün</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adet</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birim Fiyat</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detailOrder.products.map((product, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.name}</div>
                      {product.sku && <div className="text-xs text-gray-500">SKU: {product.sku}</div>}
                      {product.vendor && <div className="text-xs text-gray-500">Satıcı: {product.vendor}</div>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{product.quantity}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {product.unit_price ? formatPrice(product.unit_price) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {product.total_price ? formatPrice(product.total_price) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Not */}
        {detailOrder.note && (
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-darkGreen mb-2">Sipariş Notu</h3>
            <p className="text-sm text-gray-700">{detailOrder.note}</p>
          </div>
        )}

        {/* Etiketler */}
        {detailOrder.tags && detailOrder.tags.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-darkGreen mb-2">Etiketler</h3>
            <div className="flex flex-wrap gap-2">
              {detailOrder.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OrderDetail; 