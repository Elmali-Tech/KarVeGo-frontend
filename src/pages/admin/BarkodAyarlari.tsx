import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Eye, Settings, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BarkodPreview from '../../components/admin/BarkodPreview';

interface BarkodTasarim {
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
    footerText: string;
    footerColor: string;
    barcodeWidth: number;
    barcodeHeight: number;
  };
  is_default: boolean;
  created_at?: string;
}

const defaultTasarim: BarkodTasarim = {
  name: 'Yeni Tasarım',
  config: {
    logoPosition: 'left',
    showLogo: true,
    showBarcodeText: true,
    showGonderiTipi: true,
    showOdemeTipi: true,
    showGonderen: true,
    showAlici: true,
    showUrunler: true,
    showKgDesi: true,
    showPaketBilgisi: true,
    showAnlasmaTuru: true,
    fontFamily: 'Arial',
    fontSize: 12,
    headerColor: '#000000',
    textColor: '#000000',
    borderColor: '#cccccc',
    backgroundColor: '#ffffff',
    width: 350,
    height: 500,
    logoUrl: '',
    footerText: 'SHIPINK © 2025',
    footerColor: '#777777',
    barcodeWidth: 200,
    barcodeHeight: 40
  },
  is_default: false
};

export default function BarkodAyarlari() {
  const [tasarimlar, setTasarimlar] = useState<BarkodTasarim[]>([]);
  const [currentTasarim, setCurrentTasarim] = useState<BarkodTasarim>(defaultTasarim);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    fetchTasarimlar();
  }, []);

  const fetchTasarimlar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('barkod_tasarimlari')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTasarimlar(data || []);
      if (data && data.length > 0) {
        setCurrentTasarim(data[0]);
      }
    } catch (error) {
      console.error('Tasarımlar yüklenirken hata oluştu:', error);
      toast.error('Tasarımlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTasarimChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId === 'new') {
      setCurrentTasarim(defaultTasarim);
    } else {
      const selected = tasarimlar.find(t => t.id === selectedId);
      if (selected) {
        setCurrentTasarim(selected);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Checkbox için özel kontrol
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCurrentTasarim(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [name]: checked
        }
      }));
    } else {
      setCurrentTasarim(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Checkbox için özel kontrol
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCurrentTasarim(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [name]: checked
        }
      }));
    } else {
      setCurrentTasarim(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [name]: value
        }
      }));
    }
  };

  const handleDefaultChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTasarim(prev => ({
      ...prev,
      is_default: e.target.checked
    }));
  };

  // Logo yükleme işlemi
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setLogoFile(file);
    
    // Önizleme için URL oluştur
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    
    // Tasarım nesnesini güncelle
    setCurrentTasarim(prev => ({
      ...prev,
      config: {
        ...prev.config,
        logoUrl: objectUrl
      }
    }));
  };

  // Logo kaydetme fonksiyonu
  const uploadLogo = async () => {
    if (!logoFile) return '';
    
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `barkod-logos/${fileName}`;
      
      // Dosyayı Supabase'e yükle
      const { data, error } = await supabase.storage
        .from('assets')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Dosya URL'ini al
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Logo yüklenirken hata oluştu:', error);
      toast.error('Logo yüklenemedi');
      return '';
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Logo yükle
      let logoUrl = currentTasarim.config.logoUrl;
      if (logoFile) {
        const uploadedLogoUrl = await uploadLogo();
        if (uploadedLogoUrl) {
          logoUrl = uploadedLogoUrl;
        }
      }
      
      // Güncellenmiş config nesnesi
      const updatedConfig = {
        ...currentTasarim.config,
        logoUrl: logoUrl
      };
      
      // Eğer varsayılan olarak işaretlenmişse, diğer tüm tasarımların varsayılan bayrağını kaldır
      if (currentTasarim.is_default) {
        await supabase
          .from('barkod_tasarimlari')
          .update({ is_default: false })
          .neq('id', currentTasarim.id || '0');
      }
      
      if (currentTasarim.id) {
        // Mevcut tasarımı güncelle
        const { error } = await supabase
          .from('barkod_tasarimlari')
          .update({
            name: currentTasarim.name,
            config: updatedConfig,
            is_default: currentTasarim.is_default
          })
          .eq('id', currentTasarim.id);
          
        if (error) throw error;
        toast.success('Tasarım başarıyla güncellendi');
      } else {
        // Yeni tasarım oluştur
        const { error } = await supabase
          .from('barkod_tasarimlari')
          .insert([{
            name: currentTasarim.name,
            config: updatedConfig,
            is_default: currentTasarim.is_default
          }]);
          
        if (error) throw error;
        toast.success('Yeni tasarım başarıyla oluşturuldu');
      }
      
      fetchTasarimlar();
      setLogoFile(null);
    } catch (error) {
      console.error('Tasarım kaydedilirken hata oluştu:', error);
      toast.error('Tasarım kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentTasarim.id) return;
    
    if (!window.confirm('Bu tasarımı silmek istediğinize emin misiniz?')) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('barkod_tasarimlari')
        .delete()
        .eq('id', currentTasarim.id);
        
      if (error) throw error;
      
      toast.success('Tasarım başarıyla silindi');
      fetchTasarimlar();
      setCurrentTasarim(defaultTasarim);
    } catch (error) {
      console.error('Tasarım silinirken hata oluştu:', error);
      toast.error('Tasarım silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Barkod Tasarım Ayarları</h1>
      
      {/* Kontrol Paneli */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1">
              <select 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={currentTasarim.id || 'new'}
                onChange={handleTasarimChange}
              >
                <option value="new">+ Yeni Tasarım</option>
                {tasarimlar.map(tasarim => (
                  <option key={tasarim.id} value={tasarim.id}>
                    {tasarim.name} {tasarim.is_default ? '(Varsayılan)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="p-2 text-gray-600 hover:text-blue-600 bg-gray-100 rounded"
                title={previewMode ? 'Düzenleme Modu' : 'Önizleme Modu'}
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="p-2 text-white bg-green-600 hover:bg-green-700 rounded flex items-center"
                title="Kaydet"
              >
                <Save className="w-5 h-5" />
              </button>
              {currentTasarim.id && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-2 text-white bg-red-600 hover:bg-red-700 rounded"
                  title="Sil"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {!previewMode && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="block text-gray-700 text-sm font-medium">Tasarım Adı</label>
                  <input
                    type="text"
                    name="name"
                    value={currentTasarim.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-gray-700 text-sm font-medium">Varsayılan Tasarım</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentTasarim.is_default}
                      onChange={handleDefaultChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Bu tasarımı varsayılan olarak ayarla</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Görünüm Ayarları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Logo Konumu</label>
                    <select
                      name="logoPosition"
                      value={currentTasarim.config.logoPosition}
                      onChange={handleConfigChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="left">Sol</option>
                      <option value="center">Orta</option>
                      <option value="right">Sağ</option>
                      <option value="none">Gösterme</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Yazı Tipi</label>
                    <select
                      name="fontFamily"
                      value={currentTasarim.config.fontFamily}
                      onChange={handleConfigChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Yazı Boyutu</label>
                    <input
                      type="number"
                      name="fontSize"
                      value={currentTasarim.config.fontSize}
                      onChange={handleConfigChange}
                      min="8"
                      max="16"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Başlık Rengi</label>
                    <input
                      type="color"
                      name="headerColor"
                      value={currentTasarim.config.headerColor}
                      onChange={handleConfigChange}
                      className="w-full p-1 border border-gray-300 rounded-md h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Metin Rengi</label>
                    <input
                      type="color"
                      name="textColor"
                      value={currentTasarim.config.textColor}
                      onChange={handleConfigChange}
                      className="w-full p-1 border border-gray-300 rounded-md h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Kenarlık Rengi</label>
                    <input
                      type="color"
                      name="borderColor"
                      value={currentTasarim.config.borderColor}
                      onChange={handleConfigChange}
                      className="w-full p-1 border border-gray-300 rounded-md h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Arkaplan Rengi</label>
                    <input
                      type="color"
                      name="backgroundColor"
                      value={currentTasarim.config.backgroundColor}
                      onChange={handleConfigChange}
                      className="w-full p-1 border border-gray-300 rounded-md h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Logo Yükle</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-lightGreen file:text-white
                        hover:file:bg-darkGreen"
                      />
                    </div>
                    {logoPreview && (
                      <div className="mt-2">
                        <img src={logoPreview} alt="Logo önizleme" className="max-h-20" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Barkod Genişliği</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        name="barcodeWidth"
                        value={currentTasarim.config.barcodeWidth}
                        onChange={handleConfigChange}
                        min="100"
                        max="300"
                        className="w-full"
                      />
                      <span>{currentTasarim.config.barcodeWidth}px</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Barkod Yüksekliği</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        name="barcodeHeight"
                        value={currentTasarim.config.barcodeHeight}
                        onChange={handleConfigChange}
                        min="20"
                        max="80"
                        className="w-full"
                      />
                      <span>{currentTasarim.config.barcodeHeight}px</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Barkod Genişliği</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        name="width"
                        value={currentTasarim.config.width}
                        onChange={handleConfigChange}
                        min="300"
                        max="800"
                        className="w-full"
                      />
                      <span>{currentTasarim.config.width}px</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Etiket Yüksekliği</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        name="height"
                        value={currentTasarim.config.height}
                        onChange={handleConfigChange}
                        min="300"
                        max="800"
                        className="w-full"
                      />
                      <span>{currentTasarim.config.height}px</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <label className="block text-gray-700 text-sm font-medium">Footer Metni</label>
                    <input
                      type="text"
                      name="footerText"
                      value={currentTasarim.config.footerText}
                      onChange={handleConfigChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-medium">Footer Rengi</label>
                    <input
                      type="color"
                      name="footerColor"
                      value={currentTasarim.config.footerColor}
                      onChange={handleConfigChange}
                      className="w-full p-1 border border-gray-300 rounded-md h-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">İçerik Ayarları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="showLogo"
                        checked={currentTasarim.config.showLogo}
                        onChange={handleConfigChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">Logo Göster</label>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="showBarcodeText"
                        checked={currentTasarim.config.showBarcodeText}
                        onChange={handleConfigChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">Barkod Metnini Göster</label>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="showGonderiTipi"
                        checked={currentTasarim.config.showGonderiTipi}
                        onChange={handleConfigChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">Gönderi Tipi</label>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="showOdemeTipi"
                        checked={currentTasarim.config.showOdemeTipi}
                        onChange={handleConfigChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">Ödeme Tipi</label>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="showGonderen"
                        checked={currentTasarim.config.showGonderen}
                        onChange={handleConfigChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">Gönderen Bilgisi</label>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="showAlici"
                        checked={currentTasarim.config.showAlici}
                        onChange={handleConfigChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">Alıcı Bilgisi</label>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="showUrunler"
                        checked={currentTasarim.config.showUrunler}
                        onChange={handleConfigChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">Ürün İçerikleri</label>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="showKgDesi"
                        checked={currentTasarim.config.showKgDesi}
                        onChange={handleConfigChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">KG/Desi Bilgisi</label>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="showPaketBilgisi"
                        checked={currentTasarim.config.showPaketBilgisi}
                        onChange={handleConfigChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">Paket Bilgisi</label>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="showAnlasmaTuru"
                        checked={currentTasarim.config.showAnlasmaTuru}
                        onChange={handleConfigChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-600">Anlaşma Türü</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Önizleme */}
        <div className="w-full md:w-1/2">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium mb-4 text-center">Barkod Önizleme</h3>
            <div className="overflow-auto" style={{ maxHeight: '600px' }}>
              <BarkodPreview config={currentTasarim.config} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 