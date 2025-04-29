import React from 'react';
import { X } from 'lucide-react';

interface OrderJsonModalProps {
  showJsonModal: boolean;
  selectedOrderJson: string;
  closeJsonModal: () => void;
}

const OrderJsonModal: React.FC<OrderJsonModalProps> = ({
  showJsonModal,
  selectedOrderJson,
  closeJsonModal
}) => {
  if (!showJsonModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-darkGreen">Sipariş Detayları (JSON)</h3>
          <button
            onClick={closeJsonModal}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
          {selectedOrderJson}
        </pre>
      </div>
    </div>
  );
};

export default OrderJsonModal; 