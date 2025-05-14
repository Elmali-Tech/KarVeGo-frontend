import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale/tr';
import JsBarcode from 'jsbarcode';

interface BarkodPreviewProps {
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
}

export default function BarkodPreview({ config }: BarkodPreviewProps) {
  const today = new Date();
  const formattedDate = format(today, 'dd/MM/yyyy HH:mm', { locale: tr });
  const barcodeRef = useRef<SVGSVGElement>(null);
  
  // Örnek veriler
  const mockData = {
    referansNo: '2704066924235236065',
    gonderiTipi: 'NORMAL GÖNDERİ',
    odemeTipi: 'GÖNDERİCİ ÖDEMELİ',
    siparisTarihi: formattedDate,
    gonderen: 'Nuvora',
    alici: {
      name: 'Serdar ŞEKER',
      address: 'Merkez Mahallesi Ceylan Sokak No: 6-1 Nazımgülbey Aprt. Kat: 2 D:7 34404',
      city: 'İstanbul',
      district: 'Gaziosmanpaşa',
      phone: '5352210443'
    },
    urunler: [
      { name: 'TETRİS ()', quantity: 1 }
    ],
    kgDesi: '0.50',
    paket: '1/1',
    anlasmaTuru: 'CARİ'
  };
  
  // Barkodu oluştur
  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, mockData.referansNo, {
        format: "CODE128",
        width: 2,
        height: config.barcodeHeight,
        displayValue: false,
        background: config.backgroundColor,
        lineColor: "#000000"
      });
    }
  }, [config.barcodeHeight, config.backgroundColor, mockData.referansNo]);
  
  const containerStyle: React.CSSProperties = {
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    border: `1px solid ${config.borderColor}`,
    backgroundColor: config.backgroundColor,
    color: config.textColor,
    padding: '10px',
    width: `${config.width}px`,
    minHeight: `${config.height}px`,
    position: 'relative',
    boxSizing: 'border-box',
    overflow: 'hidden',
    margin: '0 auto',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
  };
  
  const headerStyle: React.CSSProperties = {
    color: config.headerColor,
    fontWeight: 'bold',
    marginBottom: '8px'
  };
  
  const sectionStyle: React.CSSProperties = {
    borderBottom: `1px solid ${config.borderColor}`,
    padding: '8px 0',
    display: 'flex'
  };
  
  const leftColumnStyle: React.CSSProperties = {
    width: '50%',
    paddingRight: '10px',
    borderRight: `1px solid ${config.borderColor}`
  };
  
  const rightColumnStyle: React.CSSProperties = {
    width: '50%',
    paddingLeft: '10px'
  };
  
  // Logo bölümü için düzenlenmiş stil
  const getLogoContainerStyle = (): React.CSSProperties => {
    let logoAlign = 'left';
    
    if (config.logoPosition === 'center') {
      logoAlign = 'center';
    } else if (config.logoPosition === 'right') {
      logoAlign = 'right';
    }
    
    return {
      textAlign: logoAlign as 'left' | 'center' | 'right',
      marginBottom: '15px',
      minHeight: '50px',
      width: '50%'
    };
  };
  
  const logoImageStyle: React.CSSProperties = {
    width: `${config.logoWidth}px`,
    height: `${config.logoHeight}px`,
    objectFit: 'contain'
  };
  
  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
    borderTop: `1px solid ${config.borderColor}`,
    paddingTop: '8px',
    fontSize: config.fontSize - 1
  };
  
  // Barkod render etme fonksiyonu
  const renderBarcode = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '50%' }}>
        <div style={{ 
          height: `${config.barcodeHeight}px`,
          width: `${config.barcodeWidth}px`,
          textAlign: 'center',
          overflow: 'hidden'
        }}>
          <svg ref={barcodeRef} style={{ maxWidth: '100%', maxHeight: '100%' }}></svg>
        </div>
        {config.showBarcodeText && (
          <div className="text-right mt-1" style={{ fontSize: config.fontSize - 2, letterSpacing: '1px' }}>
            {mockData.referansNo}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div style={containerStyle} className="barkod-preview">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {config.showLogo && config.logoPosition !== 'none' && config.logoUrl ? (
          <div style={getLogoContainerStyle()} className="logo">
            <img 
              src={config.logoUrl}
              alt="Firma Logosu"
              style={logoImageStyle}
            />
          </div>
        ) : (
          <div style={{ ...getLogoContainerStyle(), display: 'flex', alignItems: 'center' }}>
            {config.showLogo && config.logoPosition !== 'none' && (
              <div style={{ 
                width: `${config.logoWidth}px`, 
                height: `${config.logoHeight}px`, 
                border: '1px dashed #ccc', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '12px',
                color: '#888',
                margin: config.logoPosition === 'center' ? '0 auto' : 
                       config.logoPosition === 'right' ? '0 0 0 auto' : '0'
              }}>
                Logo Alanı
              </div>
            )}
          </div>
        )}
        
        {renderBarcode()}
      </div>
      
      {(config.showGonderiTipi || config.showOdemeTipi) && (
        <div style={sectionStyle}>
          {config.showGonderiTipi && (
            <div style={leftColumnStyle}>
              <div style={headerStyle}>GÖNDERİ TİPİ:</div>
              <div>{mockData.gonderiTipi}</div>
            </div>
          )}
          
          {config.showOdemeTipi && (
            <div style={rightColumnStyle}>
              <div style={headerStyle}>ÖDEME TİPİ:</div>
              <div>{mockData.odemeTipi}</div>
              <div style={{ fontSize: config.fontSize - 2, marginTop: '5px' }}>SİPARİŞ TARİHİ: {mockData.siparisTarihi}</div>
            </div>
          )}
        </div>
      )}
      
      {(config.showGonderen || config.showAlici) && (
        <div style={sectionStyle}>
          {config.showGonderen && (
            <div style={leftColumnStyle}>
              <div style={headerStyle}>GÖNDEREN:</div>
              <div>{mockData.gonderen}</div>
            </div>
          )}
          
          {config.showAlici && (
            <div style={rightColumnStyle}>
              <div style={headerStyle}>ALICI:</div>
              <div>{mockData.alici.name}</div>
              <div>{mockData.alici.address}</div>
              <div>{mockData.alici.district} - {mockData.alici.city}</div>
              <div>{mockData.alici.phone}</div>
            </div>
          )}
        </div>
      )}
      
      {config.showUrunler && (
        <div style={sectionStyle}>
          <div style={{ width: '100%' }}>
            <div style={headerStyle}>ÜRÜNLER (1):</div>
            <div>
              {mockData.urunler.map((urun, index) => (
                <div key={index}>
                  {urun.name} <span style={{ float: 'right' }}>{urun.quantity} Adet</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {(config.showKgDesi || config.showPaketBilgisi || config.showAnlasmaTuru) && (
        <div style={footerStyle}>
          <div>
            NO: #13
          </div>
          
          {config.showKgDesi && (
            <div>
              KG/DESİ: {mockData.kgDesi}
            </div>
          )}
          
          {config.showPaketBilgisi && (
            <div>
              PAKET: {mockData.paket}
            </div>
          )}
          
          {config.showAnlasmaTuru && (
            <div>
              ANLAŞMA: {mockData.anlasmaTuru}
            </div>
          )}
        </div>
      )}
      
      <div style={{ 
        marginTop: '10px', 
        borderTop: `1px solid ${config.borderColor}`,
        paddingTop: '5px',
        fontSize: '10px',
        textAlign: 'right',
        color: config.footerColor
      }}>
        {config.footerText}
      </div>
    </div>
  );
} 