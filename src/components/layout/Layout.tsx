import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import Header from '../Header';
import Sidebar from '../Sidebar';
import { CheckCircle, Upload, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [balance, setBalance] = useState(0);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceFile, setBalanceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const isSettingsPage = location.pathname.startsWith('/ayarlar');

  // Set sidebar open by default on large screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Initial check
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

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

  // Add overlay for mobile sidebar
  const handleOverlayClick = () => {
    setIsSidebarOpen(false);
  };

  // Disable body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Component */}
      <Header 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        balance={balance} 
        openBalanceModal={openBalanceModal} 
      />

      {/* Mobile Sidebar Overlay with blur */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleOverlayClick}
          aria-hidden="true"
        ></div>
      )}

      {/* Mobile Sidebar Container */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          <span className="text-lg font-semibold text-darkGreen">Menü</span>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Menüyü Kapat"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 h-[calc(100%-4rem)] overflow-y-auto">
          <Sidebar
            isAdmin={isAdmin}
            isSettingsPage={isSettingsPage}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8 relative">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar 
              isAdmin={isAdmin}
              isSettingsPage={isSettingsPage}
            />
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
            {children}
          </main>
        </div>
      </div>

      {/* Bakiye Ekleme Modal */}
      {isBalanceModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
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
                  <div 
                    className={`w-full border-2 border-dashed rounded-lg p-4 ${balanceFile ? 'border-lightGreen bg-lightGreen bg-opacity-10' : 'border-gray-300 hover:border-darkGreen'} transition-colors cursor-pointer`}
                    onClick={() => {
                      if (!balanceFile) {
                        document.getElementById('balanceFile')?.click();
                      }
                    }}
                  >
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setBalanceFile(null);
                            }}
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
                    disabled={isSubmitting}
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