import React, { useEffect, useState } from 'react';
import { zplToPng, downloadZplAsPng, viewZplInNewWindow } from '../lib/zpl-utils';
import { Loader2, Download, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface ShippingLabelViewerProps {
  zplCode: string;
  trackingNumber: string;
  onClose?: () => void;
}

const ShippingLabelViewer: React.FC<ShippingLabelViewerProps> = ({
  zplCode,
  trackingNumber
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showBarcodeInfo, setShowBarcodeInfo] = useState<boolean>(false);

  const convertZplToPng = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!zplCode) {
        setError('Etiket kodu bulunamadı.');
        setLoading(false);
        return;
      }
      const base64Image = await zplToPng(zplCode);
      setImageUrl(base64Image);
    } catch (err) {
      console.error('ZPL dönüştürme hatası:', err);
      setError('Etiket görüntüsü oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (zplCode) {
      convertZplToPng();
    } else {
      setLoading(false);
      setError('Etiket kodu bulunamadı.');
    }
  }, [zplCode]);

  const handleDownload = () => {
    downloadZplAsPng(zplCode, `kargo-etiketi-${trackingNumber}.png`);
  };

  const handleOpenInNewWindow = () => {
    viewZplInNewWindow(zplCode);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {trackingNumber ? `Kargo Etiketi: ${trackingNumber}` : 'Kargo Etiketi'}
        </h2>
        <div className="flex space-x-2">
          {zplCode && (
            <>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-darkGreen hover:bg-green-700 transition-colors"
                disabled={loading || !imageUrl}
                title="Etiketi PNG olarak indir"
              >
                <Download className="h-4 w-4 mr-1" />
                İndir
              </button>
              <button
                onClick={handleOpenInNewWindow}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                disabled={loading}
                title="Labelary.com'da görüntüle"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Tarayıcıda Aç
              </button>
              <button
                onClick={convertZplToPng}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                disabled={loading}
                title="Etiketi yenile"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowBarcodeInfo(!showBarcodeInfo)}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
                  showBarcodeInfo ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                } hover:bg-blue-600 hover:text-white transition-colors`}
                title="Barkod Bilgisini Göster/Gizle"
              >
                Barkod Bilgisi
              </button>
            </>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-2 bg-white shadow-sm w-full overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-darkGreen" />
            <span className="ml-2 text-gray-600">Etiket görüntüsü oluşturuluyor...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-red-500">
            <AlertCircle className="h-10 w-10 mb-2" />
            <p className="text-lg font-medium">{error}</p>
            <p className="text-sm mt-2">
              {zplCode ? 'Labelary API ile etiket görüntülenemiyor. Tarayıcıda açmayı deneyin.' : 'Bu sipariş için henüz oluşturulmuş bir etiket bulunmuyor.'}
            </p>
            {zplCode && (
              <button
                onClick={handleOpenInNewWindow}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-darkGreen hover:bg-green-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Tarayıcıda Aç
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center">
            <img 
              src={imageUrl} 
              alt={`Kargo Etiketi ${trackingNumber}`}
              className="max-w-full h-auto object-contain"
            />
          </div>
        )}
      </div>

      {showBarcodeInfo && zplCode && (
        <div className="mt-4 border rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-medium mb-2">Barkod Bilgileri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Takip Numarası</span>
              <span className="text-sm">{trackingNumber}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Etiket Tipi</span>
              <span className="text-sm">Sürat Kargo ZPL</span>
            </div>
          </div>
        </div>
      )}

      {zplCode && (
        <div className="mt-4">
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">ZPL Kodunu Göster</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded-md overflow-auto text-gray-800 text-xs">
              {zplCode}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ShippingLabelViewer; 