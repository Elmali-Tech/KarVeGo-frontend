import React, { useEffect, useState } from 'react';
import { Package, Menu, LogOut, Settings, Box, Users, FileText, DollarSign, LayoutDashboard, Plus, Upload, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [balance, setBalance] = useState(0);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceFile, setBalanceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const isSettingsPage = location.pathname.startsWith('/ayarlar');

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, balance')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setIsAdmin(data.role === 'admin');
        setBalance(data.balance || 0);
      } catch (error) {
        console.error('Rol ve bakiye kontrolü yapılırken hata oluştu:', error);
      }
    };

    checkAdminRole();
  }, [user]);

  // Bakiye bilgisini periyodik olarak güncelle
  useEffect(() => {
    if (!user) return;

    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setBalance(data.balance || 0);
      } catch (error) {
        console.error('Bakiye bilgisi alınırken hata oluştu:', error);
      }
    };

    // İlk yüklemede bakiye bilgisini al
    fetchBalance();

    // 30 saniyede bir bakiye bilgisini güncelle
    const interval = setInterval(fetchBalance, 30000);

    // Bakiye güncelleme event'ini dinle
    const handleBalanceUpdate = (event: CustomEvent) => {
      setBalance(event.detail.newBalance);
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    
    // Component unmount olduğunda interval'ı ve event listener'ı temizle
    return () => {
      clearInterval(interval);
      window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      toast.error('Çıkış yapılırken bir hata oluştu');
    }
  };

  const openBalanceModal = () => {
    setIsBalanceModalOpen(true);
  };

  const closeBalanceModal = () => {
    setIsBalanceModalOpen(false);
    setBalanceAmount('');
    setBalanceFile(null);
    setUploadProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBalanceFile(e.target.files[0]);
    }
  };

  const submitBalanceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!balanceAmount || parseFloat(balanceAmount) <= 0) {
      toast.error('Lütfen geçerli bir tutar giriniz');
      return;
    }

    if (!balanceFile) {
      toast.error('Lütfen bir belge yükleyiniz');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);
    
    try {
      // 1. Dosyayı yükle
      const fileExt = balanceFile.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `balance-proof/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, balanceFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      setUploadProgress(60);
      
      // Dosya URL'sini al
      const { data: fileUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      // 2. Bakiye talebi oluştur
      const { error } = await supabase
        .from('balance_requests')
        .insert([
          { 
            user_id: user?.id,
            amount: parseFloat(balanceAmount),
            status: 'PENDING',
            proof_document: fileUrlData.publicUrl
          }
        ]);
      
      if (error) throw error;
      
      setUploadProgress(100);
      toast.success('Bakiye yükleme talebiniz alındı');
      closeBalanceModal();
    } catch (error) {
      console.error('Bakiye talebi oluşturulurken hata:', error);
      toast.error('Bakiye talebi gönderilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-lightGreen shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-darkGreen hover:text-lightGreen lg:hidden transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 ml-4 lg:ml-0">
                <Package className="w-8 h-8 text-darkGreen" />
                <span className="text-xl font-semibold text-black">KarVeGo</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className="text-sm text-gray-600 mr-2">
                  Bakiye: <span className="font-medium text-darkGreen">{balance.toFixed(2)} TL</span>
                </div>
                <button
                  onClick={openBalanceModal}
                  className="flex items-center justify-center p-1.5 bg-lightGreen rounded-full text-white hover:bg-darkGreen transition-colors"
                  title="Bakiye Ekle"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Navigation */}
          <aside className={`w-64 shrink-0 ${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
            <nav className="space-y-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              {isAdmin && (
                <MainNavLink href="/admin" icon={<LayoutDashboard className="w-5 h-5" />}>
                  Admin Paneli
                </MainNavLink>
              )}
              <MainNavLink href="/siparisler" icon={<FileText className="w-5 h-5" />}>
                Siparişler
              </MainNavLink>
              <MainNavLink href="/urunler" icon={<Box className="w-5 h-5" />}>
                Ürünler
              </MainNavLink>
              <MainNavLink href="/musteriler" icon={<Users className="w-5 h-5" />}>
                Müşteriler
              </MainNavLink>
              <MainNavLink href="/ayarlar" icon={<Settings className="w-5 h-5" />}>
                Ayarlar
              </MainNavLink>
              <Link
                to="/kargo-fiyatlari"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 ${
                  location.pathname === '/kargo-fiyatlari' ? 'bg-lightGreen bg-opacity-10 text-darkGreen' : 'text-gray-700'
                }`}
              >
                <DollarSign className={`w-5 h-5 ${location.pathname === '/kargo-fiyatlari' ? 'text-darkGreen' : 'text-gray-500'}`} />
                <span className="text-sm font-medium">Kargo Fiyatları</span>
              </Link>
            </nav>

            {/* Settings Sub-Navigation */}
            {isSettingsPage && (
              <nav className="mt-4 space-y-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 px-3">Ayarlar</h3>
                <SubNavLink href="/ayarlar/hesap-bilgileri">
                  Hesap Bilgileri
                </SubNavLink>
                <SubNavLink href="/ayarlar/gonderici-profili">
                  Gönderici Profili
                </SubNavLink>
                <SubNavLink href="/ayarlar/adreslerim">
                  Adreslerim
                </SubNavLink>
                <SubNavLink href="/ayarlar/entegrasyon">
                  Entegrasyon / Uygulama
                </SubNavLink>
                <SubNavLink href="/ayarlar/anlasmam">
                  Kendi Anlaşmamı Ekle
                </SubNavLink>
                <SubNavLink href="/ayarlar/barkod-ayarlari">
                  Barkod Ayarları
                </SubNavLink>
                <SubNavLink href="/ayarlar/sifre-degistir">
                  Şifre Değiştir
                </SubNavLink>
              </nav>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            {children}
          </main>
        </div>
      </div>

      {/* Bakiye Ekleme Modal */}
      {isBalanceModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-darkGreen mb-4">Bakiye Yükleme Talebi</h3>
              <form onSubmit={submitBalanceRequest}>
                <div className="mb-4">
                  <label htmlFor="balanceAmount" className="block text-sm font-medium text-gray-700 mb-1">
                    Yüklenecek Tutar (TL)
                  </label>
                  <input
                    type="number"
                    id="balanceAmount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lightGreen focus:border-lightGreen"
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="balanceFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Ödeme Belgesi (Dekont, Makbuz vb.)
                  </label>
                  <div className={`w-full border-2 border-dashed rounded-lg p-4 ${balanceFile ? 'border-lightGreen bg-lightGreen bg-opacity-10' : 'border-gray-300 hover:border-darkGreen'} transition-colors`}>
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {balanceFile ? (
                        <>
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-lightGreen bg-opacity-20 text-darkGreen">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <div className="text-sm text-center">
                            <p className="font-medium text-gray-900 truncate max-w-xs">{balanceFile.name}</p>
                            <p className="text-gray-500 text-xs">{(balanceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            className="text-xs text-darkGreen hover:text-lightGreen"
                            onClick={() => setBalanceFile(null)}
                          >
                            Dosyayı Değiştir
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-lightGreen bg-opacity-20 text-darkGreen">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-sm text-gray-600 text-center">
                            Dosyayı buraya sürükleyin ya da
                            <label className="ml-1 text-darkGreen hover:text-lightGreen cursor-pointer font-medium">
                              dosya seçin
                              <input 
                                type="file" 
                                id="balanceFile"
                                className="hidden" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={handleFileChange}
                              />
                            </label>
                          </p>
                          <p className="text-xs text-gray-500">PDF, JPG veya PNG (Max 10MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {isSubmitting && uploadProgress > 0 && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-darkGreen h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{uploadProgress}%</p>
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lightGreen"
                    onClick={closeBalanceModal}
                    disabled={isSubmitting}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-darkGreen hover:bg-lightGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkGreen transition-colors"
                    disabled={isSubmitting || !balanceFile}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        İşleniyor...
                      </>
                    ) : 'Talep Gönder'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MainNavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function MainNavLink({ href, icon, children }: MainNavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === href || location.pathname.startsWith(`${href}/`);
  
  return (
    <a
      href={href}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-lightGreen bg-opacity-10 text-darkGreen'
          : 'text-gray-600 hover:bg-gray-50 hover:text-darkGreen'
      }`}
    >
      <span className={isActive ? 'text-darkGreen' : 'text-gray-400'}>
        {icon}
      </span>
      {children}
    </a>
  );
}

interface SubNavLinkProps {
  href: string;
  children: React.ReactNode;
}

function SubNavLink({ href, children }: SubNavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === href;
  
  return (
    <a
      href={href}
      className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'text-darkGreen bg-lightGreen bg-opacity-10'
          : 'text-gray-600 hover:text-darkGreen hover:bg-gray-50'
      }`}
    >
      {children}
    </a>
  );
}