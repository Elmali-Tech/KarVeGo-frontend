import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { calculateDesi } from './utils';
import { Order, SenderAddress } from './types';

// html2canvas için tip tanımlaması
interface HTML2Canvas {
  default: (
    element: HTMLElement, 
    options?: {
      allowTaint?: boolean;
      useCORS?: boolean;
      scale?: number;
      logging?: boolean;
      onclone?: (document: Document, element: HTMLElement) => HTMLElement;
    }
  ) => Promise<HTMLCanvasElement>;
}

// Window objesine JsBarcode için tip eklemesi
declare global {
  interface Window {
    JsBarcode?: (element: SVGElement, data: string, options?: object) => void;
  }
}

// Kargo etiketi için veri tipi
export interface LabelData {
  id: string;
  order_id: string;
  tracking_number: string;
  kargo_takip_no?: string;
  carrier: string;
  created_at: string;
  shipping_price?: number;
  customer_id?: string;
  subscription_type?: string;
}

// Barkod tasarımı için tip tanımlaması
export interface BarkodTasarim {
  id?: string;
  name: string;
  config: {
    logoPosition: 'left' | 'center' | 'right' | 'none';
    showLogo: boolean;
    showBarcodeText: boolean;
    showGonderiTipi: boolean;
    showOdemeTipi: boolean;
    showGonderen: boolean;
    showAlici: boolean;
    showUrunler: boolean;
    showKgDesi: boolean;
    showPaketBilgisi: boolean;
    showAnlasmaTuru: boolean;
    fontFamily: string;
    fontSize: number;
    headerColor: string;
    textColor: string;
    borderColor: string;
    backgroundColor: string;
    width: number;
    height: number;
    logoUrl: string;
    logoWidth: number;
    logoHeight: number;
    footerText: string;
    footerColor: string;
    barcodeWidth: number;
    barcodeHeight: number;
  };
  user_id?: string;
  is_default: boolean;
  created_at?: string;
}

interface BarkodModalProps {
  selectedOrder: Order;
  labelData: LabelData;
  barkodTasarim: BarkodTasarim;
  showBarkodModal: boolean;
  setShowBarkodModal: (show: boolean) => void;
  setIsLabelModalOpen: (show: boolean) => void;
  selectedSenderAddress: SenderAddress | null;
}

const BarkodModal: React.FC<BarkodModalProps> = ({
  selectedOrder,
  labelData,
  barkodTasarim,
  showBarkodModal,
  setShowBarkodModal,
  setIsLabelModalOpen,
  selectedSenderAddress
}) => {
  const barkodContainerRef = useRef<HTMLDivElement>(null);

  if (!showBarkodModal || !selectedOrder || !labelData) {
    return null;
  }

  const handleDownloadPNG = () => {
    if (!barkodContainerRef.current) return;
    
    // html2canvas kütüphanesini dinamik olarak yükle
    import('html2canvas').then((html2canvas: HTML2Canvas) => {
      html2canvas.default(barkodContainerRef.current as HTMLElement, {
        allowTaint: true,  // Güvenilmeyen içeriğe izin ver
        useCORS: true,     // Cross-Origin isteklerine izin ver
        scale: 2,          // Daha yüksek kalite için
        logging: false,    // Konsol loglarını kapat
        onclone: (document: Document, element: HTMLElement) => {
          // Logo elementlerini kontrol et
          const logoImgs = element.querySelectorAll('img[alt="Logo"]');
          logoImgs.forEach((img: Element) => {
            if (img instanceof HTMLImageElement) {
              // Logo görüntüsü için crossOrigin özelliği ekle
              img.setAttribute('crossorigin', 'anonymous');
            }
          });
          return element;
        }
      }).then((canvas: HTMLCanvasElement) => {
        // Canvas'ı PNG'ye dönüştür
        const imgData = canvas.toDataURL('image/png');
        
        // İndirme bağlantısı oluştur
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `barkod-${labelData.tracking_number}.png`;
        link.click();
      });
    }).catch(err => {
      console.error('PNG indirme hatası:', err);
      alert('Barkod PNG olarak indirilemedi. Lütfen tekrar deneyin.');
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 overflow-y-auto flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-auto">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Etiket Bilgileri</h3>
          <div className="flex space-x-3">
            <button 
              onClick={() => {
                setShowBarkodModal(false);
                setIsLabelModalOpen(true);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Yeni Etiket Oluştur
            </button>
            <button 
              onClick={() => setShowBarkodModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="overflow-auto" style={{ maxHeight: '600px' }}>
          {/* Barkod önizleme alanı - satıcının tasarımına göre barkod oluşturulur */}
          <div ref={barkodContainerRef} className="barkod-container" style={{ 
            width: `${barkodTasarim.config.width}px`,
            margin: '0 auto',
            fontFamily: barkodTasarim.config.fontFamily,
            fontSize: `${barkodTasarim.config.fontSize}px`,
            border: `1px solid ${barkodTasarim.config.borderColor}`,
            background: barkodTasarim.config.backgroundColor,
            color: barkodTasarim.config.textColor,
            padding: '15px'
          }}>
            {/* Logo ve barkod alanı */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '15px',
              flexWrap: 'wrap'
            }}>
              {/* Logo alanı */}
              {barkodTasarim.config.showLogo && barkodTasarim.config.logoPosition !== 'none' && (
                <div style={{ 
                  width: barkodTasarim.config.logoPosition === 'center' ? '100%' : '45%', 
                  textAlign: barkodTasarim.config.logoPosition as 'left' | 'center' | 'right',
                  marginBottom: barkodTasarim.config.logoPosition === 'center' ? '15px' : '0',
                  order: barkodTasarim.config.logoPosition === 'right' ? 2 : 1
                }}>
                  {barkodTasarim.config.logoUrl ? (
                    <img 
                      src={barkodTasarim.config.logoUrl} 
                      alt="Logo"
                      crossOrigin="anonymous"
                      style={{ 
                        width: `${barkodTasarim.config.logoWidth}px`,
                        height: `${barkodTasarim.config.logoHeight}px`,
                        objectFit: 'contain',
                        display: 'inline-block' 
                      }}
                    />
                  ) : (
                    <div style={{ fontWeight: 'bold' }}>{selectedSenderAddress?.name || 'KarVeGo'}</div>
                  )}
                </div>
              )}
              
              {/* Barkod alanı */}
              <div style={{ 
                width: !barkodTasarim.config.showLogo || barkodTasarim.config.logoPosition === 'none' ? '100%' : '55%', 
                textAlign: 'right',
                order: barkodTasarim.config.logoPosition === 'right' ? 1 : 2
              }}>
                <svg id="barcode" ref={(ref) => {
                  if (ref) {
                    if (window.JsBarcode) {
                      window.JsBarcode(ref, labelData.tracking_number, {
                        format: "CODE128",
                        width: 1.5,
                        height: barkodTasarim.config.barcodeHeight,
                        displayValue: barkodTasarim.config.showBarcodeText,
                        background: barkodTasarim.config.backgroundColor,
                        lineColor: "#000000",
                        fontSize: barkodTasarim.config.fontSize,
                        margin: 10
                      });
                    } else {
                      const textNode = document.createElementNS("http://www.w3.org/2000/svg", "text");
                      textNode.setAttribute("x", "50%");
                      textNode.setAttribute("y", "50%");
                      textNode.setAttribute("text-anchor", "middle");
                      textNode.setAttribute("dominant-baseline", "middle");
                      textNode.textContent = labelData.tracking_number;
                      ref.appendChild(textNode);
                    }
                  }
                }} style={{ 
                  width: `${barkodTasarim.config.barcodeWidth}px`, 
                  height: `${barkodTasarim.config.barcodeHeight}px`,
                  maxWidth: '100%'
                }}></svg>
              </div>
            </div>
            
            {/* Gönderim bilgileri */}
            {(barkodTasarim.config.showGonderiTipi || barkodTasarim.config.showOdemeTipi) && (
              <div style={{ 
                borderBottom: `1px solid ${barkodTasarim.config.borderColor}`,
                display: 'flex',
                marginBottom: '10px',
                paddingBottom: '10px'
              }}>
                {barkodTasarim.config.showGonderiTipi && (
                  <div style={{ width: '50%', paddingRight: '10px' }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: barkodTasarim.config.headerColor,
                      marginBottom: '5px'
                    }}>GÖNDERİ TİPİ:</div>
                    <div>NORMAL GÖNDERİ</div>
                  </div>
                )}
                
                {barkodTasarim.config.showOdemeTipi && (
                  <div style={{ width: '50%', paddingLeft: '10px' }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: barkodTasarim.config.headerColor,
                      marginBottom: '5px'
                    }}>ÖDEME TİPİ:</div>
                    <div>GÖNDERİCİ ÖDEMELİ</div>
                    <div style={{ fontSize: barkodTasarim.config.fontSize - 2, marginTop: '5px' }}>
                      SİPARİŞ TARİHİ: {new Date(labelData.created_at).toLocaleString('tr-TR')}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Gönderici ve alıcı bilgileri */}
            {(barkodTasarim.config.showGonderen || barkodTasarim.config.showAlici) && (
              <div style={{ 
                borderBottom: `1px solid ${barkodTasarim.config.borderColor}`,
                display: 'flex',
                marginBottom: '10px',
                paddingBottom: '10px'
              }}>
                {barkodTasarim.config.showGonderen && (
                  <div style={{ width: '50%', paddingRight: '10px' }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: barkodTasarim.config.headerColor,
                      marginBottom: '5px'
                    }}>GÖNDEREN:</div>
                    <div>{selectedSenderAddress?.name || 'KarVeGo'}</div>
                    {selectedSenderAddress && (
                      <>
                        <div>{selectedSenderAddress.address1}</div>
                        <div>{selectedSenderAddress.district} - {selectedSenderAddress.city}</div>
                        <div>{selectedSenderAddress.phone}</div>
                      </>
                    )}
                  </div>
                )}
                
                {barkodTasarim.config.showAlici && (
                  <div style={{ width: '50%', paddingLeft: '10px' }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: barkodTasarim.config.headerColor,
                      marginBottom: '5px'
                    }}>ALICI:</div>
                    <div>{selectedOrder.shipping_address?.name || selectedOrder.customer?.name || ''}</div>
                    <div>{selectedOrder.shipping_address?.address1 || ''}</div>
                    <div>{selectedOrder.shipping_address?.district || ''} - {selectedOrder.shipping_address?.city || ''}</div>
                    <div>{selectedOrder.shipping_address?.phone || selectedOrder.customer?.phone || ''}</div>
                  </div>
                )}
              </div>
            )}
            
            {/* Ürün bilgileri */}
            {barkodTasarim.config.showUrunler && (
              <div style={{ 
                borderBottom: `1px solid ${barkodTasarim.config.borderColor}`,
                marginBottom: '10px',
                paddingBottom: '10px'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: barkodTasarim.config.headerColor,
                  marginBottom: '5px'
                }}>ÜRÜNLER ({selectedOrder.products.length}):</div>
                <div>
                  {selectedOrder.products.map((urun, index) => (
                    <div key={index}>
                      {urun.name} <span style={{ float: 'right' }}>{urun.quantity} Adet</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Alt bilgiler */}
            {(barkodTasarim.config.showKgDesi || barkodTasarim.config.showPaketBilgisi || barkodTasarim.config.showAnlasmaTuru) && (
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: barkodTasarim.config.fontSize - 1
              }}>
                <div>
                  NO: #{labelData.id.substring(0, 5)}
                </div>
                
                {barkodTasarim.config.showKgDesi && (
                  <div>
                    KG/DESİ: {calculateDesi(selectedOrder)}
                  </div>
                )}
                
                {barkodTasarim.config.showPaketBilgisi && (
                  <div>
                    PAKET: 1/1
                  </div>
                )}
                
                {barkodTasarim.config.showAnlasmaTuru && (
                  <div>
                    ANLAŞMA: CARİ
                  </div>
                )}
              </div>
            )}
            
            {/* Footer */}
            <div style={{ 
              marginTop: '10px', 
              borderTop: `1px solid ${barkodTasarim.config.borderColor}`,
              paddingTop: '5px',
              fontSize: '10px',
              textAlign: 'right',
              color: barkodTasarim.config.footerColor
            }}>
              {barkodTasarim.config.footerText}
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4 flex justify-center space-x-4 mt-4">
          <button 
            onClick={() => {
              // Barkodu yazdırmak için yeni bir pencere aç
              const printWindow = window.open('', '_blank', 'width=800,height=600');
              if (printWindow) {
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html lang="tr">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Barkod Yazdır - ${labelData.tracking_number}</title>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                    <style>
                      body { 
                        font-family: ${barkodTasarim.config.fontFamily}; 
                        margin: 20px; 
                        color: ${barkodTasarim.config.textColor};
                        background-color: #ffffff;
                      }
                      @media print {
                        .no-print { display: none; }
                        button { display: none; }
                      }
                      .container { 
                        width: ${barkodTasarim.config.width}px;
                        margin: 0 auto; 
                        border: 1px solid ${barkodTasarim.config.borderColor}; 
                        padding: 20px; 
                        background-color: ${barkodTasarim.config.backgroundColor};
                      }
                      .header { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        margin-bottom: 15px; 
                        flex-wrap: wrap;
                      }
                      .section {
                        border-bottom: 1px solid ${barkodTasarim.config.borderColor};
                        margin-bottom: 15px;
                        padding-bottom: 15px;
                      }
                      .section-title {
                        font-weight: bold;
                        color: ${barkodTasarim.config.headerColor};
                        margin-bottom: 5px;
                      }
                      .address-grid { 
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 15px; 
                        margin: 15px 0; 
                      }
                      .footer {
                        margin-top: 15px;
                        font-size: 10px;
                        text-align: right;
                        color: ${barkodTasarim.config.footerColor};
                      }
                      .btn { 
                        padding: 10px 15px; 
                        background-color: #4f46e5; 
                        color: white; 
                        border: none; 
                        border-radius: 4px; 
                        cursor: pointer; 
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        ${barkodTasarim.config.showLogo && barkodTasarim.config.logoPosition !== 'none' ? 
                          `<div style="
                            ${barkodTasarim.config.logoPosition === 'center' ? 'width: 100%; text-align: center; margin-bottom: 15px;' : 'width: 45%;'} 
                            text-align: ${barkodTasarim.config.logoPosition}; 
                            order: ${barkodTasarim.config.logoPosition === 'right' ? '2' : '1'};
                          ">
                            ${barkodTasarim.config.logoUrl ? 
                              `<img src="${barkodTasarim.config.logoUrl}" alt="Logo" style="width: ${barkodTasarim.config.logoWidth}px; height: ${barkodTasarim.config.logoHeight}px; object-fit: contain; display: inline-block;">` : 
                              `<strong>${selectedSenderAddress?.name || 'KarVeGo'}</strong>`}
                          </div>` : ''}
                        
                        <div style="
                          ${!barkodTasarim.config.showLogo || barkodTasarim.config.logoPosition === 'none' ? 'width: 100%;' : 'width: 55%;'} 
                          text-align: right;
                          order: ${barkodTasarim.config.logoPosition === 'right' ? '1' : '2'};
                        ">
                          <div style="text-align: center; margin-bottom: 10px;">
                            <svg id="barcode" style="width: ${barkodTasarim.config.barcodeWidth}px; height: ${barkodTasarim.config.barcodeHeight}px; max-width: 100%;"></svg>
                          </div>
                          ${barkodTasarim.config.showBarcodeText ? 
                            `<div style="text-align: center;">${labelData.tracking_number}</div>` : ''}
                        </div>
                      </div>
                      
                      ${barkodTasarim.config.showGonderiTipi || barkodTasarim.config.showOdemeTipi ? `
                        <div class="section">
                          <div class="address-grid">
                            ${barkodTasarim.config.showGonderiTipi ? `
                              <div>
                                <div class="section-title">GÖNDERİ TİPİ:</div>
                                <div>NORMAL GÖNDERİ</div>
                              </div>
                            ` : ''}
                            
                            ${barkodTasarim.config.showOdemeTipi ? `
                              <div>
                                <div class="section-title">ÖDEME TİPİ:</div>
                                <div>GÖNDERİCİ ÖDEMELİ</div>
                                <div style="font-size: smaller; margin-top: 5px;">
                                  SİPARİŞ TARİHİ: ${new Date(labelData.created_at).toLocaleString('tr-TR')}
                                </div>
                              </div>
                            ` : ''}
                          </div>
                        </div>
                      ` : ''}
                      
                      ${barkodTasarim.config.showGonderen || barkodTasarim.config.showAlici ? `
                        <div class="section">
                          <div class="address-grid">
                            ${barkodTasarim.config.showGonderen ? `
                              <div>
                                <div class="section-title">GÖNDEREN:</div>
                                <div>${selectedSenderAddress?.name || 'KarVeGo'}</div>
                                ${selectedSenderAddress ? `
                                  <div>${selectedSenderAddress.address1}</div>
                                  <div>${selectedSenderAddress.district} - ${selectedSenderAddress.city}</div>
                                  <div>${selectedSenderAddress.phone}</div>
                                ` : ''}
                              </div>
                            ` : ''}
                            
                            ${barkodTasarim.config.showAlici ? `
                              <div>
                                <div class="section-title">ALICI:</div>
                                <div>${selectedOrder.shipping_address?.name || selectedOrder.customer?.name || ''}</div>
                                <div>${selectedOrder.shipping_address?.address1 || ''}</div>
                                <div>${selectedOrder.shipping_address?.district || ''} - ${selectedOrder.shipping_address?.city || ''}</div>
                                <div>${selectedOrder.shipping_address?.phone || selectedOrder.customer?.phone || ''}</div>
                              </div>
                            ` : ''}
                          </div>
                        </div>
                      ` : ''}
                      
                      ${barkodTasarim.config.showUrunler ? `
                        <div class="section">
                          <div class="section-title">ÜRÜNLER (${selectedOrder.products.length}):</div>
                          <ul>
                            ${selectedOrder.products.map(p => `<li>${p.name} x ${p.quantity}</li>`).join('')}
                          </ul>
                        </div>
                      ` : ''}
                      
                      ${barkodTasarim.config.showKgDesi || barkodTasarim.config.showPaketBilgisi || barkodTasarim.config.showAnlasmaTuru ? `
                        <div style="display: flex; justify-content: space-between; font-size: smaller;">
                          <div>NO: #${labelData.id.substring(0, 5)}</div>
                          
                          ${barkodTasarim.config.showKgDesi ? `
                            <div>KG/DESİ: ${calculateDesi(selectedOrder)}</div>
                          ` : ''}
                          
                          ${barkodTasarim.config.showPaketBilgisi ? `
                            <div>PAKET: 1/1</div>
                          ` : ''}
                          
                          ${barkodTasarim.config.showAnlasmaTuru ? `
                            <div>ANLAŞMA: CARİ</div>
                          ` : ''}
                        </div>
                      ` : ''}
                      
                      <div class="footer">
                        ${barkodTasarim.config.footerText}
                      </div>
                    </div>
                    
                    <div class="no-print" style="text-align: center; margin-top: 20px;">
                      <button onclick="window.print()" class="btn">Yazdır</button>
                      <button onclick="window.close()" class="btn" style="margin-left: 10px; background-color: #6b7280;">Kapat</button>
                    </div>
                    
                    <script>
                      JsBarcode("#barcode", "${labelData.tracking_number}", {
                        format: "CODE128",
                        width: 1.5,
                        height: ${barkodTasarim.config.barcodeHeight},
                        displayValue: ${barkodTasarim.config.showBarcodeText},
                        background: "${barkodTasarim.config.backgroundColor}",
                        lineColor: "#000000",
                        fontSize: ${barkodTasarim.config.fontSize},
                        margin: 10
                      });
                    </script>
                  </body>
                  </html>
                `);
                printWindow.document.close();
              }
            }}
            className="px-4 py-2 bg-darkGreen text-white rounded hover:bg-lightGreen transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Etiketi Yazdır
          </button>
          
          <button 
            onClick={handleDownloadPNG}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            PNG İndir
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarkodModal; 