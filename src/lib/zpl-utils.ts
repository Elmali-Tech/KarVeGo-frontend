/**
 * ZPL kodunu PNG formatına dönüştürmek için yardımcı fonksiyonlar
 * Labelary API (https://labelary.com/service.html) kullanılarak ZPL kodunu görselleştirir
 */

/**
 * ZPL kodunu PNG formatına dönüştürür
 * @param zplCode ZPL kodu (^XA ile başlayıp ^XZ ile biten)
 * @param dpmm Baskı çözünürlüğü (8, 12 veya 24 dpmm) - Optional, varsayılan 8
 * @param width Etiket genişliği (inç olarak) - Optional, varsayılan 4
 * @param height Etiket yüksekliği (inç olarak) - Optional, varsayılan 6
 * @returns Base64 formatında PNG görüntüsü (HTML img element src özelliğinde kullanılabilir)
 */
export const zplToPng = async (
  zplCode: string,
  dpmm: 8 | 12 | 24 = 8,
  width: number = 4,
  height: number = 6
): Promise<string> => {
  try {
    // Labelary API'ye istek yap
    const response = await fetch(
      `https://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${width}x${height}/0/`,
      {
        method: 'POST',
        headers: {
          Accept: 'image/png',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: zplCode,
      }
    );

    if (!response.ok) {
      throw new Error(
        `API Hatası: ${response.status} ${response.statusText}`
      );
    }

    // Response'u blob olarak al
    const blob = await response.blob();

    // Blob'u base64'e dönüştür
    const base64Image = await blobToBase64(blob);
    return base64Image;
  } catch (error) {
    console.error('ZPL kodu PNG\'ye dönüştürülürken hata oluştu:', error);
    throw error;
  }
};

/**
 * Blob'u base64 formatına dönüştürür
 * @param blob Dönüştürülecek blob
 * @returns Base64 formatında string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * ZPL kodunu yeni pencerede görüntüler
 * @param zplCode ZPL kodu
 */
export const viewZplInNewWindow = (zplCode: string): void => {
  const encodedZpl = encodeURIComponent(zplCode);
  const url = `https://labelary.com/viewer.html?zpl=${encodedZpl}`;
  window.open(url, '_blank');
};

/**
 * ZPL kodunu indirilecek PNG dosyası haline getirir
 * @param zplCode ZPL kodu
 * @param fileName İndirilecek dosya adı (varsayılan: etiket.png)
 */
export const downloadZplAsPng = async (
  zplCode: string,
  fileName: string = 'etiket.png'
): Promise<void> => {
  try {
    const base64Image = await zplToPng(zplCode);
    
    // Base64'ü blob'a dönüştür
    const byteString = atob(base64Image.split(',')[1]);
    const mimeString = base64Image.split(',')[0].split(':')[1].split(';')[0];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    
    // İndirme bağlantısı oluştur
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('ZPL kodu PNG olarak indirilirken hata oluştu:', error);
    throw error;
  }
}; 