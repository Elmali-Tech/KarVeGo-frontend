import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Eye, Plus, Check, Trash, RefreshCcw, Layout as LayoutIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BarkodPreview from '../../components/user/BarkodPreview';
import { useAuth } from '../../lib/auth';
import Layout from '../../components/layout/Layout';

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
    logoWidth: number;
    logoHeight: number;
    footerText: string;
    footerColor: string;
    barcodeWidth: number;
    barcodeHeight: number;
  };
  user_id: string;
  is_default: boolean;
  created_at?: string;
}

const defaultTasarim: BarkodTasarim = {
  name: 'Varsayılan Tasarım',
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
    logoWidth: 100,
    logoHeight: 50,
    footerText: 'SHIPINK © 2025',
    footerColor: '#777777',
    barcodeWidth: 200,
    barcodeHeight: 40
  },
  user_id: '',
  is_default: true
};

export default function BarkodTasarimi() {
  const [tasarimListesi, setTasarimListesi] = useState<BarkodTasarim[]>([]);
  const [currentTasarim, setCurrentTasarim] = useState<BarkodTasarim>(defaultTasarim);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [showNewTasarimInput, setShowNewTasarimInput] = useState(false);
  const [newTasarimName, setNewTasarimName] = useState('');
  const [activeTab, setActiveTab] = useState<'genel' | 'icerik' | 'gorunum'>('genel');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      // Set user_id in defaultTasarim
      defaultTasarim.user_id = user.id;
      fetchTasarimlar();
    }
  }, [user?.id]);

  const fetchTasarimlar = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('barkod_tasarimlari')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setTasarimListesi(data);
        
        // Find default design or use the first one
        const defaultDesign = data.find(t => t.is_default) || data[0];
        
        // Eğer mevcut tasarım null veya undefined içeriyorsa varsayılan değerler ata
        if (defaultDesign && defaultDesign.config) {
          // Eksik değerler için varsayılan değerler ekle
          if (defaultDesign.config.logoWidth === undefined) {
            defaultDesign.config.logoWidth = 100;
          }
          if (defaultDesign.config.logoHeight === undefined) {
            defaultDesign.config.logoHeight = 50;
          }
        }
        
        setCurrentTasarim(defaultDesign);
        setLogoPreview(defaultDesign.config.logoUrl || '');
      } else {
        // If no designs exist, create a default one
        await createDefaultDesign();
      }
    } catch (error) {
      console.error('Tasarımlar yüklenirken hata oluştu:', error);
      toast.error('Tasarımlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultDesign = async () => {
    try {
      const newDesign = {
        ...defaultTasarim,
        user_id: user?.id,
        is_default: true
      };

      const { data, error } = await supabase
        .from('barkod_tasarimlari')
        .insert([newDesign])
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        setTasarimListesi([data[0]]);
        setCurrentTasarim(data[0]);
      }
    } catch (error) {
      console.error('Varsayılan tasarım oluşturulurken hata oluştu:', error);
      toast.error('Varsayılan tasarım oluşturulamadı');
    }
  };

  // Barkodun 'Tasarımlarım' bölümünde değişiklik varsa reset etme
  useEffect(() => {
    if (tasarimListesi.length > 0 && !currentTasarim.id) {
      // Eğer tasarım listesi varsa ve mevcut tasarımın ID'si yoksa,
      // listedeki ilk tasarımı kullan
      setCurrentTasarim(tasarimListesi[0]);
    }
  }, [tasarimListesi, currentTasarim.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
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
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCurrentTasarim(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [name]: checked
        }
      }));
    } else if (type === 'range' || type === 'number') {
      setCurrentTasarim(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [name]: Number(value) || 0 // Sayısal değerler için varsayılan 0 ekle
        }
      }));
    } else {
      setCurrentTasarim(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [name]: value || '' // String değerler için varsayılan boş string ekle
        }
      }));
    }
  };

  // Logo yükleme işlemi
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setLogoFile(file);
    
    // Önizleme için URL oluştur
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    
    // Tasarım nesnesini güncelle - Sadece geçici önizleme için
    setCurrentTasarim(prev => ({
      ...prev,
      config: {
        ...prev.config,
        logoUrl: objectUrl // önizleme için geçici url
      }
    }));
  };

  // Logo kaydetme fonksiyonu
  const uploadLogo = async () => {
    if (!logoFile || !user?.id) return '';
    
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `logo-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      console.log('Dosya yükleniyor...', fileName);
      
      // Dosyayı Supabase'e yükle
      const { data, error } = await supabase.storage
        .from('assets')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: true // false yerine true kullanarak mevcut dosyanın üzerine yaz
        });
      
      if (error) {
        console.error('Yükleme hatası:', error);
        throw error;
      }
      
      console.log('Dosya başarıyla yüklendi:', data);
      
      // Dosya URL'ini al
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);
      
      console.log('Alınan URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Logo yüklenirken hata oluştu:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error(`Logo yüklenemedi: ${errorMessage}`);
      return '';
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }
    
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
      
      // Kullanıcının tasarımını güncelle
      if (currentTasarim.id) {
        const { error } = await supabase
          .from('barkod_tasarimlari')
          .update({
            name: currentTasarim.name,
            config: updatedConfig,
            is_default: true
          })
          .eq('id', currentTasarim.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        toast.success('Barkod tasarımınız başarıyla kaydedildi');
      } else {
        // Yeni tasarım oluştur
        const { error } = await supabase
          .from('barkod_tasarimlari')
          .insert([{
            name: currentTasarim.name,
            config: updatedConfig,
            is_default: true,
            user_id: user.id
          }]);
          
        if (error) throw error;
        toast.success('Yeni barkod tasarımınız oluşturuldu');
      }
      
      fetchTasarimlar();
    } catch (error) {
      console.error('Tasarım kaydedilirken hata oluştu:', error);
      toast.error('Tasarım kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Seçili tasarımı değiştirme
  const handleTasarimChange = (tasarimId: string) => {
    const selected = tasarimListesi.find(t => t.id === tasarimId);
    if (selected) {
      setCurrentTasarim(selected);
      setLogoPreview(selected.config.logoUrl || '');
    }
  };

  // Yeni tasarım oluşturma fonksiyonu
  const handleCreateNewTasarim = async () => {
    if (!newTasarimName.trim()) {
      toast.error('Tasarım adı boş olamaz');
      return;
    }

    if (!user?.id) {
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }

    setLoading(true);
    try {
      // Yeni tasarım nesnesi oluştur
      const newTasarim: BarkodTasarim = {
        name: newTasarimName,
        config: defaultTasarim.config,
        user_id: user.id,
        is_default: false
      };

      // Yeni tasarımı veritabanına ekle
      const { data, error } = await supabase
        .from('barkod_tasarimlari')
        .insert([newTasarim])
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        toast.success('Yeni tasarım oluşturuldu');
        // Tasarım listesini güncelle
        await fetchTasarimlar();
        // Yeni oluşturulan tasarımı seç
        setCurrentTasarim(data[0]);
        // Input alanını sıfırla
        setNewTasarimName('');
        setShowNewTasarimInput(false);
      }
    } catch (error) {
      console.error('Tasarım oluşturulurken hata:', error);
      toast.error('Tasarım oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  // Tasarımı varsayılan olarak ayarlama
  const setDefaultTasarim = async (tasarimId: string) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Önce tüm tasarımların is_default değerini false yap
      await supabase
        .from('barkod_tasarimlari')
        .update({ is_default: false })
        .eq('user_id', user.id);
      
      // Seçilen tasarımı varsayılan yap
      const { error } = await supabase
        .from('barkod_tasarimlari')
        .update({ is_default: true })
        .eq('id', tasarimId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast.success('Varsayılan tasarım güncellendi');
      await fetchTasarimlar();
    } catch (error) {
      console.error('Varsayılan tasarım güncellenirken hata:', error);
      toast.error('Varsayılan tasarım güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Tasarımı silme
  const deleteTasarim = async (tasarimId: string) => {
    if (!user?.id) return;
    
    // Eğer silinecek tasarım şu an seçili olan tasarımsa
    const isCurrent = currentTasarim.id === tasarimId;
    
    // Eğer bu tasarım varsayılan tasarımsa silme
    const isDefault = tasarimListesi.find(t => t.id === tasarimId)?.is_default;
    if (isDefault) {
      toast.error('Varsayılan tasarım silinemez');
      return;
    }
    
    // Eğer sadece bir tasarım kaldıysa silme
    if (tasarimListesi.length <= 1) {
      toast.error('En az bir tasarım bulunmalıdır');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('barkod_tasarimlari')
        .delete()
        .eq('id', tasarimId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      toast.success('Tasarım silindi');
      
      // Tasarımları yeniden yükle
      await fetchTasarimlar();
      
      // Eğer şu an seçili olan tasarım silindiyse, başka bir tasarımı seç
      if (isCurrent) {
        // Tasarım listesini güncelle ve varsayılan veya ilk tasarımı seç
        const updatedList = tasarimListesi.filter(t => t.id !== tasarimId);
        const defaultOrFirst = updatedList.find(t => t.is_default) || updatedList[0];
        if (defaultOrFirst) {
          setCurrentTasarim(defaultOrFirst);
        }
      }
    } catch (error) {
      console.error('Tasarım silinirken hata:', error);
      toast.error('Tasarım silinemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-100 p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <LayoutIcon className="w-5 h-5 text-lightGreen" />
                <h1 className="text-xl font-semibold text-gray-800">Barkod Tasarım Ayarlarım</h1>
              </div>
              
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  onClick={() => fetchTasarimlar()}
                  className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-md flex items-center gap-2 text-sm transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" /> Yenile
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-darkGreen hover:bg-lightGreen text-white rounded-md flex items-center gap-2 text-sm transition-colors"
                >
                  <Save className="w-4 h-4" /> Kaydet
                </button>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-4 py-2 ${previewMode ? 'bg-gray-700' : 'bg-lightGreen hover:bg-darkGreen'} text-white rounded-md flex items-center gap-2 text-sm transition-colors`}
                >
                  <Eye className="w-4 h-4" /> {previewMode ? 'Düzenleme Modu' : 'Önizleme Modu'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Tasarım seçimi ve yönetimi */}
          <div className="bg-gray-50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Tasarım Seçin</label>
                <select 
                  value={currentTasarim.id || ''}
                  onChange={(e) => handleTasarimChange(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-md bg-white text-gray-700 shadow-sm focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition-all outline-none"
                  disabled={loading}
                >
                  {tasarimListesi.map((tasarim) => (
                    <option key={tasarim.id} value={tasarim.id}>
                      {tasarim.name} {tasarim.is_default ? '(Varsayılan)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                {!showNewTasarimInput ? (
                  <button
                    onClick={() => setShowNewTasarimInput(true)}
                    className="h-10 px-4 bg-gradient-to-r from-darkGreen to-lightGreen hover:from-lightGreen hover:to-darkGreen text-white rounded-md flex items-center gap-2 shadow-sm transition-all"
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4" /> Yeni Tasarım
                  </button>
                ) : (
                  <div className="flex w-full items-center gap-2">
                    <div className="flex-grow">
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Yeni Tasarım Adı</label>
                      <input
                        type="text"
                        value={newTasarimName}
                        onChange={(e) => setNewTasarimName(e.target.value)}
                        placeholder="Tasarım adı"
                        className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition-all outline-none"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex items-end gap-2 h-10">
                      <button
                        onClick={handleCreateNewTasarim}
                        className="h-10 px-3 bg-darkGreen hover:bg-lightGreen text-white rounded-md flex items-center justify-center shadow-sm transition-colors"
                        disabled={loading || !newTasarimName.trim()}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setShowNewTasarimInput(false);
                          setNewTasarimName('');
                        }}
                        className="h-10 px-3 bg-gray-500 hover:bg-gray-600 text-white rounded-md flex items-center justify-center shadow-sm transition-colors"
                        disabled={loading}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-end gap-2">
                {currentTasarim.id && !currentTasarim.is_default && (
                  <button
                    onClick={() => currentTasarim.id && setDefaultTasarim(currentTasarim.id)}
                    className="h-10 px-4 bg-lightGreen hover:bg-darkGreen text-white rounded-md flex items-center gap-2 shadow-sm transition-colors"
                    disabled={loading}
                  >
                    <Check className="w-4 h-4" /> Varsayılan Yap
                  </button>
                )}
                
                {currentTasarim.id && !currentTasarim.is_default && tasarimListesi.length > 1 && (
                  <button
                    onClick={() => currentTasarim.id && deleteTasarim(currentTasarim.id)}
                    className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2 shadow-sm transition-colors"
                    disabled={loading}
                  >
                    <Trash className="w-4 h-4" /> Sil
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          {!previewMode && (
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('genel')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'genel' 
                      ? 'border-lightGreen text-darkGreen' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Genel Ayarlar
                </button>
                <button
                  onClick={() => setActiveTab('gorunum')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'gorunum' 
                      ? 'border-lightGreen text-darkGreen' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Görünüm
                </button>
                <button
                  onClick={() => setActiveTab('icerik')}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'icerik' 
                      ? 'border-lightGreen text-darkGreen' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  İçerik Seçenekleri
                </button>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex flex-col lg:flex-row">
            {/* Settings Panel */}
            {!previewMode && (
              <div className="w-full lg:w-1/2 border-r border-gray-100">
                {activeTab === 'genel' && (
                  <div className="p-6 space-y-5">
                    <div className="space-y-4">
                      <h3 className="text-base font-medium text-darkGreen">Temel Bilgiler</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Tasarım Adı</label>
                          <input
                            type="text"
                            name="name"
                            value={currentTasarim.name}
                            onChange={handleInputChange}
                            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition-all outline-none"
                            placeholder="Tasarım adı girin"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Footer Metni</label>
                          <input
                            type="text"
                            name="footerText"
                            value={currentTasarim.config.footerText}
                            onChange={handleConfigChange}
                            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition-all outline-none"
                            placeholder="Alt bilgi metni girin"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h3 className="text-base font-medium text-darkGreen">Logo Ayarları</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Logo Yükle</label>
                          <div className="flex flex-col gap-3">
                            <input
                              type="file"
                              onChange={handleLogoUpload}
                              accept="image/*"
                              className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2.5 file:px-4
                              file:rounded-md file:border-0
                              file:text-sm file:font-medium
                              file:bg-lightGreen file:text-white
                              hover:file:bg-darkGreen 
                              cursor-pointer focus:outline-none"
                            />
                            
                            {(logoPreview || currentTasarim.config.logoUrl) && (
                              <div className="flex items-center justify-center p-3 border border-gray-200 rounded-md bg-gray-50">
                                <img 
                                  src={logoPreview || currentTasarim.config.logoUrl} 
                                  alt="Logo önizleme" 
                                  className="max-h-24 max-w-full" 
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Logo Konumu</label>
                          <select
                            name="logoPosition"
                            value={currentTasarim.config.logoPosition}
                            onChange={handleConfigChange}
                            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition-all outline-none"
                          >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                            <option value="none">Gösterme</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">
                              Logo Genişliği: <span className="text-darkGreen">{currentTasarim.config.logoWidth}px</span>
                            </label>
                            <input
                              type="range"
                              name="logoWidth"
                              value={currentTasarim.config.logoWidth}
                              onChange={handleConfigChange}
                              min="50"
                              max="200"
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lightGreen"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1.5">
                              Logo Yüksekliği: <span className="text-darkGreen">{currentTasarim.config.logoHeight}px</span>
                            </label>
                            <input
                              type="range"
                              name="logoHeight"
                              value={currentTasarim.config.logoHeight}
                              onChange={handleConfigChange}
                              min="30"
                              max="150"
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lightGreen"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h3 className="text-base font-medium text-darkGreen">Boyut Ayarları</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">
                            Etiket Genişliği: <span className="text-darkGreen">{currentTasarim.config.width}px</span>
                          </label>
                          <input
                            type="range"
                            name="width"
                            value={currentTasarim.config.width}
                            onChange={handleConfigChange}
                            min="300"
                            max="800"
                            step="10"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lightGreen"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">
                            Etiket Yüksekliği: <span className="text-darkGreen">{currentTasarim.config.height}px</span>
                          </label>
                          <input
                            type="range"
                            name="height"
                            value={currentTasarim.config.height}
                            onChange={handleConfigChange}
                            min="300"
                            max="800"
                            step="10"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lightGreen"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">
                            Barkod Genişliği: <span className="text-darkGreen">{currentTasarim.config.barcodeWidth}px</span>
                          </label>
                          <input
                            type="range"
                            name="barcodeWidth"
                            value={currentTasarim.config.barcodeWidth}
                            onChange={handleConfigChange}
                            min="100"
                            max="300"
                            step="5"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lightGreen"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">
                            Barkod Yüksekliği: <span className="text-darkGreen">{currentTasarim.config.barcodeHeight}px</span>
                          </label>
                          <input
                            type="range"
                            name="barcodeHeight"
                            value={currentTasarim.config.barcodeHeight}
                            onChange={handleConfigChange}
                            min="20"
                            max="80"
                            step="2"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lightGreen"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'gorunum' && (
                  <div className="p-6 space-y-5">
                    <div className="space-y-4">
                      <h3 className="text-base font-medium text-darkGreen">Yazı ve Font Ayarları</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">Yazı Tipi</label>
                          <select
                            name="fontFamily"
                            value={currentTasarim.config.fontFamily}
                            onChange={handleConfigChange}
                            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition-all outline-none"
                          >
                            <option value="Arial">Arial</option>
                            <option value="Helvetica">Helvetica</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Courier New">Courier New</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Tahoma">Tahoma</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1.5">
                            Yazı Boyutu: <span className="text-darkGreen">{currentTasarim.config.fontSize}px</span>
                          </label>
                          <input
                            type="range"
                            name="fontSize"
                            value={currentTasarim.config.fontSize}
                            onChange={handleConfigChange}
                            min="8"
                            max="16"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lightGreen"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h3 className="text-base font-medium text-darkGreen mb-2">Renk Ayarları</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-100 hover:border-lightGreen transition-all">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Başlık Rengi</label>
                          <div className="flex items-center">
                            <div className="relative">
                              <input
                                type="color"
                                name="headerColor"
                                value={currentTasarim.config.headerColor}
                                onChange={handleConfigChange}
                                className="w-10 h-8 p-0.5 border border-gray-300 rounded-l-md cursor-pointer"
                              />
                              <div className="absolute inset-0 opacity-0 hover:opacity-10 bg-black rounded-l-md transition-opacity"></div>
                            </div>
                            <input 
                              type="text" 
                              value={currentTasarim.config.headerColor} 
                              onChange={(e) => handleConfigChange({
                                target: { name: 'headerColor', value: e.target.value, type: 'text' }
                              } as React.ChangeEvent<HTMLInputElement>)}
                              className="flex-1 py-1.5 px-2 text-sm border border-l-0 border-gray-300 rounded-r-md focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition-all outline-none truncate"
                            />
                          </div>
                        </div>
                        
                        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-100 hover:border-lightGreen transition-all">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Metin Rengi</label>
                          <div className="flex items-center">
                            <div className="relative">
                              <input
                                type="color"
                                name="textColor"
                                value={currentTasarim.config.textColor}
                                onChange={handleConfigChange}
                                className="w-10 h-8 p-0.5 border border-gray-300 rounded-l-md cursor-pointer"
                              />
                              <div className="absolute inset-0 opacity-0 hover:opacity-10 bg-black rounded-l-md transition-opacity"></div>
                            </div>
                            <input 
                              type="text" 
                              value={currentTasarim.config.textColor} 
                              onChange={(e) => handleConfigChange({
                                target: { name: 'textColor', value: e.target.value, type: 'text' }
                              } as React.ChangeEvent<HTMLInputElement>)}
                              className="flex-1 py-1.5 px-2 text-sm border border-l-0 border-gray-300 rounded-r-md focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition-all outline-none truncate"
                            />
                          </div>
                        </div>
                        
                        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-100 hover:border-lightGreen transition-all">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kenarlık Rengi</label>
                          <div className="flex items-center">
                            <div className="relative">
                              <input
                                type="color"
                                name="borderColor"
                                value={currentTasarim.config.borderColor}
                                onChange={handleConfigChange}
                                className="w-10 h-8 p-0.5 border border-gray-300 rounded-l-md cursor-pointer"
                              />
                              <div className="absolute inset-0 opacity-0 hover:opacity-10 bg-black rounded-l-md transition-opacity"></div>
                            </div>
                            <input 
                              type="text" 
                              value={currentTasarim.config.borderColor} 
                              onChange={(e) => handleConfigChange({
                                target: { name: 'borderColor', value: e.target.value, type: 'text' }
                              } as React.ChangeEvent<HTMLInputElement>)}
                              className="flex-1 py-1.5 px-2 text-sm border border-l-0 border-gray-300 rounded-r-md focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition-all outline-none truncate"
                            />
                          </div>
                        </div>
                        
                        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-100 hover:border-lightGreen transition-all">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Arkaplan Rengi</label>
                          <div className="flex items-center">
                            <div className="relative">
                              <input
                                type="color"
                                name="backgroundColor"
                                value={currentTasarim.config.backgroundColor}
                                onChange={handleConfigChange}
                                className="w-10 h-8 p-0.5 border border-gray-300 rounded-l-md cursor-pointer"
                              />
                              <div className="absolute inset-0 opacity-0 hover:opacity-10 bg-black rounded-l-md transition-opacity"></div>
                            </div>
                            <input 
                              type="text" 
                              value={currentTasarim.config.backgroundColor} 
                              onChange={(e) => handleConfigChange({
                                target: { name: 'backgroundColor', value: e.target.value, type: 'text' }
                              } as React.ChangeEvent<HTMLInputElement>)}
                              className="flex-1 py-1.5 px-2 text-sm border border-l-0 border-gray-300 rounded-r-md focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition-all outline-none truncate"
                            />
                          </div>
                        </div>
                        
                        <div className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-100 hover:border-lightGreen transition-all">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Footer Rengi</label>
                          <div className="flex items-center">
                            <div className="relative">
                              <input
                                type="color"
                                name="footerColor"
                                value={currentTasarim.config.footerColor}
                                onChange={handleConfigChange}
                                className="w-10 h-8 p-0.5 border border-gray-300 rounded-l-md cursor-pointer"
                              />
                              <div className="absolute inset-0 opacity-0 hover:opacity-10 bg-black rounded-l-md transition-opacity"></div>
                            </div>
                            <input 
                              type="text" 
                              value={currentTasarim.config.footerColor} 
                              onChange={(e) => handleConfigChange({
                                target: { name: 'footerColor', value: e.target.value, type: 'text' }
                              } as React.ChangeEvent<HTMLInputElement>)}
                              className="flex-1 py-1.5 px-2 text-sm border border-l-0 border-gray-300 rounded-r-md focus:ring-2 focus:ring-lightGreen focus:border-lightGreen transition-all outline-none truncate"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'icerik' && (
                  <div className="p-6">
                    <h3 className="text-base font-medium text-darkGreen mb-4">Görüntülenecek Bilgiler</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-lightGreen cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="showLogo"
                          checked={currentTasarim.config.showLogo}
                          onChange={handleConfigChange}
                          className="h-4 w-4 text-lightGreen border-gray-300 rounded focus:ring-lightGreen"
                        />
                        <span className="ml-2 text-sm text-gray-700">Logo</span>
                      </label>
                      
                      <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-lightGreen cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="showBarcodeText"
                          checked={currentTasarim.config.showBarcodeText}
                          onChange={handleConfigChange}
                          className="h-4 w-4 text-lightGreen border-gray-300 rounded focus:ring-lightGreen"
                        />
                        <span className="ml-2 text-sm text-gray-700">Barkod Metni</span>
                      </label>
                      
                      <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-lightGreen cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="showGonderiTipi"
                          checked={currentTasarim.config.showGonderiTipi}
                          onChange={handleConfigChange}
                          className="h-4 w-4 text-lightGreen border-gray-300 rounded focus:ring-lightGreen"
                        />
                        <span className="ml-2 text-sm text-gray-700">Gönderi Tipi</span>
                      </label>
                      
                      <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-lightGreen cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="showOdemeTipi"
                          checked={currentTasarim.config.showOdemeTipi}
                          onChange={handleConfigChange}
                          className="h-4 w-4 text-lightGreen border-gray-300 rounded focus:ring-lightGreen"
                        />
                        <span className="ml-2 text-sm text-gray-700">Ödeme Tipi</span>
                      </label>
                      
                      <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-lightGreen cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="showGonderen"
                          checked={currentTasarim.config.showGonderen}
                          onChange={handleConfigChange}
                          className="h-4 w-4 text-lightGreen border-gray-300 rounded focus:ring-lightGreen"
                        />
                        <span className="ml-2 text-sm text-gray-700">Gönderen Bilgisi</span>
                      </label>
                      
                      <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-lightGreen cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="showAlici"
                          checked={currentTasarim.config.showAlici}
                          onChange={handleConfigChange}
                          className="h-4 w-4 text-lightGreen border-gray-300 rounded focus:ring-lightGreen"
                        />
                        <span className="ml-2 text-sm text-gray-700">Alıcı Bilgisi</span>
                      </label>
                      
                      <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-lightGreen cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="showUrunler"
                          checked={currentTasarim.config.showUrunler}
                          onChange={handleConfigChange}
                          className="h-4 w-4 text-lightGreen border-gray-300 rounded focus:ring-lightGreen"
                        />
                        <span className="ml-2 text-sm text-gray-700">Ürün İçerikleri</span>
                      </label>
                      
                      <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-lightGreen cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="showKgDesi"
                          checked={currentTasarim.config.showKgDesi}
                          onChange={handleConfigChange}
                          className="h-4 w-4 text-lightGreen border-gray-300 rounded focus:ring-lightGreen"
                        />
                        <span className="ml-2 text-sm text-gray-700">KG/Desi Bilgisi</span>
                      </label>
                      
                      <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-lightGreen cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="showPaketBilgisi"
                          checked={currentTasarim.config.showPaketBilgisi}
                          onChange={handleConfigChange}
                          className="h-4 w-4 text-lightGreen border-gray-300 rounded focus:ring-lightGreen"
                        />
                        <span className="ml-2 text-sm text-gray-700">Paket Bilgisi</span>
                      </label>
                      
                      <label className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-lightGreen cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="showAnlasmaTuru"
                          checked={currentTasarim.config.showAnlasmaTuru}
                          onChange={handleConfigChange}
                          className="h-4 w-4 text-lightGreen border-gray-300 rounded focus:ring-lightGreen"
                        />
                        <span className="ml-2 text-sm text-gray-700">Anlaşma Türü</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Preview Panel */}
            <div className={`w-full ${previewMode ? 'lg:w-full' : 'lg:w-1/2'} p-6`}>
              <div className="rounded-md border border-gray-200 bg-white shadow-sm h-full p-6">
                <h3 className="text-lg font-medium mb-6 text-center text-darkGreen">Barkod Önizleme</h3>
                <div className="overflow-auto flex justify-center items-center" style={{ maxHeight: '700px' }}>
                  <BarkodPreview config={currentTasarim.config} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 