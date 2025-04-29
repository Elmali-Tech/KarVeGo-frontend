import React from 'react';
import { X } from 'lucide-react';
import { Order, SenderAddress } from './types';
import { formatPrice } from './utils';

interface LabelModalProps {
  isLabelModalOpen: boolean;
  selectedOrder: Order | null;
  senderAddresses: SenderAddress[];
  selectedSenderAddress: SenderAddress | null;
  labelPrice: number;
  isLoading: boolean;
  handleSenderAddressChange: (addressId: number) => void;
  handleCreateLabel: () => void;
  setIsLabelModalOpen: (isOpen: boolean) => void;
}

const LabelModal: React.FC<LabelModalProps> = ({
  isLabelModalOpen,
  selectedOrder,
  senderAddresses,
  selectedSenderAddress,
  labelPrice,
  isLoading,
  handleSenderAddressChange,
  handleCreateLabel,
  setIsLabelModalOpen
}) => {
  if (!isLabelModalOpen || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4 sm:block">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => setIsLabelModalOpen(false)}
            >
              <span className="sr-only">Kapat</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-6 text-gray-900">
              Kargo Etiketi Oluştur
            </h3>
            <div className="mt-4">
              <div className="p-4 space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-darkGreen mb-2">Sipariş Bilgileri</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><span className="font-medium">Müşteri:</span> {selectedOrder.customer?.name}</p>
                    <p><span className="font-medium">Adres:</span> {selectedOrder.shipping_address?.address1}, {selectedOrder.shipping_address?.district}, {selectedOrder.shipping_address?.city}</p>
                    <p><span className="font-medium">Paket Boyutu:</span> {selectedOrder.package_length}x{selectedOrder.package_width}x{selectedOrder.package_height} cm</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gönderici Adresi</label>
                  {senderAddresses.length > 0 ? (
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-darkGreen focus:ring-darkGreen sm:text-sm"
                      value={selectedSenderAddress?.id || ''}
                      onChange={(e) => handleSenderAddressChange(parseInt(e.target.value))}
                    >
                      <option value="">Gönderici adresi seçin</option>
                      {senderAddresses.map(address => (
                        <option key={address.id} value={address.id}>
                          {address.name} - {address.address1}, {address.district}, {address.city}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-red-600">
                      Kayıtlı gönderici adresi bulunamadı. Lütfen önce gönderici adresi ekleyin.
                    </div>
                  )}
                </div>
                
                {selectedSenderAddress && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-darkGreen mb-2">Kargo Bilgileri</h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><span className="font-medium">Taşıyıcı:</span> Sürat Kargo</p>
                      <p><span className="font-medium">Tahmini Fiyat:</span> {formatPrice(labelPrice)}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsLabelModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleCreateLabel}
                    disabled={!selectedSenderAddress || isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-darkGreen hover:bg-lightGreen rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        İşleniyor...
                      </span>
                    ) : (
                      "Etiket Oluştur"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelModal; 