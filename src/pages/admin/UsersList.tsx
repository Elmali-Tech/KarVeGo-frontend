import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, Search, UserPlus, RefreshCw, ArrowUpDown,
  CheckCircle, XCircle, AlertCircle, Clock, Filter, Edit,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

type Profile = {
  id: string;
  full_name: string | null;
  email?: string;
  phone: string | null;
  account_type: string;
  status: string;
  role: string;
  balance: number;
  created_at: string;
  subscription_type: string | null;
};

const UsersList = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Profile>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isEditingBalance, setIsEditingBalance] = useState<string | null>(null);
  const [isEditingSubscription, setIsEditingSubscription] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');
  const [newSubscriptionType, setNewSubscriptionType] = useState<string>('');
  const itemsPerPage = 10;

  // Temel veri çekme fonksiyonu
  const fetchProfiles = async () => {
    setLoading(true);
    
    try {
      const searchTermLower = searchTerm.toLowerCase();
      const searchFilterString = `full_name.ilike.%${searchTermLower}%,phone.ilike.%${searchTermLower}%`;
      
      // Toplam kayıt sayısını al
      let countQuery = supabase.from('profiles').select('id', { count: 'exact' });
      
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter);
      }

      if (searchTerm) {
        countQuery = countQuery.or(searchFilterString);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      setTotalCount(count || 0);
      
      // Ana veri sorgusu
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          account_type,
          status,
          role,
          balance,
          created_at,
          subscription_type
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });
        
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (searchTerm) {
        query = query.or(searchFilterString);
      }
      
      // Sayfalama
      query = query.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Veriyi düzenle ve state'e kaydet
      const formattedData = (data || []).map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        account_type: profile.account_type,
        status: profile.status,
        role: profile.role,
        balance: profile.balance || 0,
        created_at: profile.created_at,
        subscription_type: profile.subscription_type
      }));
      
      setProfiles(formattedData);
    } catch (error) {
      console.error('Kullanıcı profilleri alınırken hata oluştu:', error);
      toast.error('Kullanıcı listesi alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa, sıralama, arama veya filtre değiştiğinde verileri yeniden yükle
  useEffect(() => {
    fetchProfiles();
  }, [currentPage, sortField, sortDirection, searchTerm, statusFilter]);

  const handleSort = (field: keyof Profile) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const isAnyFilterActive = () => {
    return statusFilter !== 'all';
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED':
        return {
          class: 'bg-darkGreen bg-opacity-10 text-darkGreen border border-darkGreen',
          text: 'Onaylandı',
          icon: <CheckCircle className="mr-1 h-3 w-3" />
        };
      case 'PENDING':
        return {
          class: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
          text: 'Onay Bekliyor',
          icon: <Clock className="mr-1 h-3 w-3" />
        };
      case 'REJECTED':
        return {
          class: 'bg-red-100 text-red-800 border border-red-300',
          text: 'Reddedildi',
          icon: <XCircle className="mr-1 h-3 w-3" />
        };
      case 'SUSPENDED':
        return {
          class: 'bg-gray-100 text-gray-800 border border-gray-300',
          text: 'Askıya Alındı',
          icon: <AlertCircle className="mr-1 h-3 w-3" />
        };
      default:
        return {
          class: 'bg-gray-100 text-gray-800 border border-gray-300',
          text: status,
          icon: null
        };
    }
  };

  // Kullanıcı durumunu değiştir (onay, red, askıya alma işlemleri)
  const updateUserStatus = async (userId: string, newStatus: string) => {
    if (!userId) return;
    
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);
      
      if (error) {
        console.error("Durum güncelleme hatası:", error);
        throw error;
      }
      
      // Başarı mesajı göster
      let message = '';
      switch (newStatus) {
        case 'APPROVED':
          message = 'Kullanıcı başarıyla onaylandı';
          break;
        case 'REJECTED':
          message = 'Kullanıcı reddedildi';
          break;
        case 'SUSPENDED':
          message = 'Kullanıcı askıya alındı';
          break;
        case 'PENDING':
          message = 'Kullanıcı bekleme durumuna alındı';
          break;
        default:
          message = 'Kullanıcı durumu güncellendi';
      }
      
      toast.success(message);
      
      // UI'ı hemen güncelle
      setProfiles(prevProfiles => 
        prevProfiles.map(profile => 
          profile.id === userId 
            ? { ...profile, status: newStatus }
            : profile
        )
      );
      
      // Filtre değiştiğinde yeniden yükleme
      if (statusFilter !== 'all' && statusFilter !== newStatus) {
        fetchProfiles();
      }
    } catch (error) {
      console.error('Kullanıcı durumu güncellenirken hata oluştu:', error);
      toast.error('İşlem başarısız oldu');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Kullanıcıyı onayla
  const approveUser = (userId: string) => {
    updateUserStatus(userId, 'APPROVED');
  };
  
  // Kullanıcıyı reddet
  const rejectUser = (userId: string) => {
    updateUserStatus(userId, 'REJECTED');
  };
  
  // Kullanıcıyı askıya al
  const suspendUser = (userId: string) => {
    updateUserStatus(userId, 'SUSPENDED');
  };
  
  // Kullanıcıyı beklemeye al
  const pendingUser = (userId: string) => {
    updateUserStatus(userId, 'PENDING');
  };

  // Yeni kullanıcı ekleme fonksiyonu (placeholder)
  const handleAddUser = () => {
    toast.info('Yeni kullanıcı ekleme özelliği yakında eklenecektir.');
    // TODO: Yeni kullanıcı ekleme modalı veya sayfası açılabilir
  };

  // Bakiye düzenleme modalı açma
  const openBalanceEdit = (userId: string, currentBalance: number) => {
    setIsEditingBalance(userId);
    setNewBalance(currentBalance.toString());
  };

  // Bakiye güncelleme
  const updateUserBalance = async (userId: string) => {
    if (!userId || !newBalance) return;
    
    setProcessingId(userId);
    try {
      const balance = parseFloat(newBalance);
      
      if (isNaN(balance)) {
        toast.error('Geçerli bir bakiye giriniz');
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ balance })
        .eq('id', userId);
      
      if (error) {
        console.error("Bakiye güncelleme hatası:", error);
        throw error;
      }
      
      toast.success('Kullanıcı bakiyesi güncellendi');
      
      // UI'ı hemen güncelle
      setProfiles(prevProfiles => 
        prevProfiles.map(profile => 
          profile.id === userId 
            ? { ...profile, balance }
            : profile
        )
      );
      setIsEditingBalance(null);
    } catch (error) {
      console.error('Kullanıcı bakiyesi güncellenirken hata oluştu:', error);
      toast.error('İşlem başarısız oldu');
    } finally {
      setProcessingId(null);
    }
  };

  // Bakiye düzenleme iptali
  const cancelBalanceEdit = () => {
    setIsEditingBalance(null);
    setNewBalance('');
  };

  // Abonelik düzenleme modalı açma
  const openSubscriptionEdit = (userId: string, currentSubscription: string | null) => {
    setIsEditingSubscription(userId);
    setNewSubscriptionType(currentSubscription || 'BRONZE');
  };

  // Abonelik güncelleme
  const updateUserSubscription = async (userId: string) => {
    if (!userId || !newSubscriptionType) return;
    
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_type: newSubscriptionType })
        .eq('id', userId);
      
      if (error) {
        console.error("Abonelik tipi güncelleme hatası:", error);
        throw error;
      }
      
      toast.success('Kullanıcı abonelik tipi güncellendi');
      
      // UI'ı hemen güncelle
      setProfiles(prevProfiles => 
        prevProfiles.map(profile => 
          profile.id === userId 
            ? { ...profile, subscription_type: newSubscriptionType }
            : profile
        )
      );
      setIsEditingSubscription(null);
    } catch (error) {
      console.error('Kullanıcı abonelik tipi güncellenirken hata oluştu:', error);
      toast.error('İşlem başarısız oldu');
    } finally {
      setProcessingId(null);
    }
  };

  // Abonelik düzenleme iptali
  const cancelSubscriptionEdit = () => {
    setIsEditingSubscription(null);
    setNewSubscriptionType('');
  };

  // Abonelik tipi için badge
  const getSubscriptionBadge = (subscriptionType: string | null) => {
    switch(subscriptionType) {
      case 'BRONZE':
        return {
          class: 'bg-yellow-600 bg-opacity-10 text-yellow-700 border border-yellow-600',
          text: 'Bronze'
        };
      case 'GOLD':
        return {
          class: 'bg-yellow-300 bg-opacity-20 text-yellow-800 border border-yellow-400',
          text: 'Gold'
        };
      case 'PREMIUM':
        return {
          class: 'bg-purple-300 bg-opacity-20 text-purple-800 border border-purple-400',
          text: 'Premium'
        };
      default:
        return {
          class: 'bg-gray-100 text-gray-800 border border-gray-300',
          text: 'Belirtilmemiş'
        };
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold flex items-center">
          <Users className="mr-2 h-6 w-6 text-darkGreen" />
          Kullanıcı Yönetimi
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Ara..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-darkGreen focus:border-darkGreen w-full sm:w-auto"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button 
            type="button"
            className="p-2 rounded-lg bg-darkGreen text-white hover:opacity-90 transition-colors flex items-center justify-center"
            onClick={fetchProfiles}
            title="Yenile"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button 
            type="button"
            className="p-2 rounded-lg bg-darkGreen text-white hover:opacity-90 transition-colors flex items-center justify-center"
            title="Yeni Kullanıcı Ekle"
            onClick={handleAddUser}
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="bg-white p-3 rounded-lg shadow-sm mb-4 overflow-x-auto">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-darkGreen mr-2" />
              <span className="text-sm font-medium text-gray-700">Filtreler</span>
              {isAnyFilterActive() && (
                <span className="ml-2 inline-flex items-center bg-darkGreen bg-opacity-10 text-darkGreen px-2 py-0.5 rounded-full text-xs">
                  Aktif
                </span>
              )}
            </div>
            
            {isAnyFilterActive() && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Filtreleri Sıfırla
              </button>
            )}
          </div>
          
          {/* Durum Filtreleri - Her zaman görünür */}
          <div className="flex flex-wrap items-center space-x-1 overflow-x-auto pb-1">
            <span className="text-sm font-medium text-gray-500 mr-2 flex-shrink-0">Durum:</span>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${statusFilter === 'all' 
                ? 'bg-darkGreen bg-opacity-10 text-darkGreen font-medium border border-darkGreen' 
                : 'hover:bg-gray-100'}`}
              onClick={() => handleStatusFilter('all')}
            >
              Tümü
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-sm flex items-center whitespace-nowrap ${statusFilter === 'PENDING' 
                ? 'bg-yellow-100 text-yellow-800 font-medium border border-yellow-300' 
                : 'hover:bg-gray-100'}`}
              onClick={() => handleStatusFilter('PENDING')}
            >
              <Clock className="mr-1 h-3 w-3" />
              Onay Bekleyenler
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-sm flex items-center whitespace-nowrap ${statusFilter === 'APPROVED' 
                ? 'bg-darkGreen bg-opacity-10 text-darkGreen font-medium border border-darkGreen' 
                : 'hover:bg-gray-100'}`}
              onClick={() => handleStatusFilter('APPROVED')}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Onaylananlar
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-sm flex items-center whitespace-nowrap ${statusFilter === 'REJECTED' 
                ? 'bg-red-100 text-red-800 font-medium border border-red-300' 
                : 'hover:bg-gray-100'}`}
              onClick={() => handleStatusFilter('REJECTED')}
            >
              <XCircle className="mr-1 h-3 w-3" />
              Reddedilenler
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-sm flex items-center whitespace-nowrap ${statusFilter === 'SUSPENDED' 
                ? 'bg-gray-100 text-gray-800 font-medium border border-gray-300' 
                : 'hover:bg-gray-100'}`}
              onClick={() => handleStatusFilter('SUSPENDED')}
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              Askıya Alınanlar
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center">
                    İsim
                    {sortField === 'full_name' && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('account_type')}
                >
                  <div className="flex items-center">
                    Hesap Türü
                    {sortField === 'account_type' && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Durum
                    {sortField === 'status' && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('balance')}
                >
                  <div className="flex items-center">
                    Bakiye
                    {sortField === 'balance' && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('subscription_type')}
                >
                  <div className="flex items-center">
                    Abonelik Tipi
                    {sortField === 'subscription_type' && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Kayıt Tarihi
                    {sortField === 'created_at' && (
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin h-5 w-5 text-darkGreen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="ml-2">Yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex flex-col items-center py-6">
                      <Users className="h-10 w-10 text-gray-300 mb-2" />
                      <p className="text-gray-500 mb-1">Kullanıcı bulunamadı</p>
                      <p className="text-sm text-gray-400">Filtreleri değiştirerek tekrar deneyin</p>
                    </div>
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => {
                  const statusBadge = getStatusBadge(profile.status);
                  return (
                    <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-darkGreen bg-opacity-10 text-darkGreen rounded-full flex items-center justify-center">
                            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {profile.full_name || 'İsimsiz'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{profile.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{profile.account_type === 'INDIVIDUAL' ? 'Bireysel' : profile.account_type === 'BUSINESS' ? 'Kurumsal' : profile.account_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${statusBadge.class}`}>
                          {statusBadge.icon}
                          {statusBadge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditingBalance === profile.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              className="w-24 py-1 px-2 border rounded text-sm focus:ring-darkGreen focus:border-darkGreen"
                              value={newBalance}
                              onChange={(e) => setNewBalance(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateUserBalance(profile.id);
                                } else if (e.key === 'Escape') {
                                  cancelBalanceEdit();
                                }
                              }}
                            />
                            <button
                              onClick={() => updateUserBalance(profile.id)}
                              className="p-1 bg-darkGreen bg-opacity-10 text-darkGreen rounded hover:bg-opacity-20"
                              title="Kaydet"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelBalanceEdit}
                              className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                              title="İptal"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="text-sm font-medium text-gray-700 cursor-pointer hover:text-darkGreen group flex items-center"
                            onClick={() => openBalanceEdit(profile.id, profile.balance)}
                            title="Bakiyeyi düzenlemek için tıklayın"
                          >
                            {profile.balance?.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₺
                            <Edit className="h-3.5 w-3.5 ml-1.5 text-darkGreen" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditingSubscription === profile.id ? (
                          <div className="flex items-center space-x-2">
                            <select
                              className="w-32 py-1 px-2 border rounded text-sm focus:ring-darkGreen focus:border-darkGreen"
                              value={newSubscriptionType}
                              onChange={(e) => setNewSubscriptionType(e.target.value)}
                              autoFocus
                            >
                              <option value="BRONZE">Bronze</option>
                              <option value="GOLD">Gold</option>
                              <option value="PREMIUM">Premium</option>
                            </select>
                            <button
                              onClick={() => updateUserSubscription(profile.id)}
                              className="p-1 bg-darkGreen bg-opacity-10 text-darkGreen rounded hover:bg-opacity-20"
                              title="Kaydet"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelSubscriptionEdit}
                              className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                              title="İptal"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="text-sm font-medium cursor-pointer hover:text-darkGreen group flex items-center"
                            onClick={() => openSubscriptionEdit(profile.id, profile.subscription_type)}
                            title="Abonelik tipini düzenlemek için tıklayın"
                          >
                            <span className={`px-2.5 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getSubscriptionBadge(profile.subscription_type).class}`}>
                              {getSubscriptionBadge(profile.subscription_type).text}
                            </span>
                            <Edit className="h-3.5 w-3.5 ml-1.5 text-darkGreen opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(profile.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {processingId === profile.id ? (
                          <div className="flex justify-center">
                            <svg className="animate-spin h-5 w-5 text-darkGreen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1.5">
                            {profile.status === 'PENDING' && (
                              <>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    approveUser(profile.id);
                                  }}
                                  className="p-1.5 rounded-full bg-darkGreen bg-opacity-10 text-darkGreen hover:bg-opacity-20 transition-colors hover:shadow-sm"
                                  title="Onayla"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    rejectUser(profile.id);
                                  }}
                                  className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors hover:shadow-sm"
                                  title="Reddet"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            
                            {profile.status === 'APPROVED' && (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  suspendUser(profile.id);
                                }}
                                className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors hover:shadow-sm"
                                title="Askıya Al"
                              >
                                <AlertCircle className="h-4 w-4" />
                              </button>
                            )}
                            
                            {(profile.status === 'REJECTED' || profile.status === 'SUSPENDED') && (
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  pendingUser(profile.id);
                                }}
                                className="p-1.5 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors hover:shadow-sm"
                                title="Beklemeye Al"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Sayfalama */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">
            {/* Mobil Sayfalama */}
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                  ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Önceki
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                  ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Sonraki
              </button>
            </div>
            
            {/* Masaüstü Sayfalama */}
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span> ile{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> arası gösteriliyor, toplam{' '}
                  <span className="font-medium">{totalCount}</span> kullanıcı
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {/* Önceki Sayfa Butonu */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium
                      ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="sr-only">Önceki</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Sayfa Numaraları */}
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    // Gösterilecek sayfa numarasını hesapla
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                          ${currentPage === pageNum 
                            ? 'z-10 bg-darkGreen bg-opacity-10 border-darkGreen text-darkGreen' 
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {/* Sonraki Sayfa Butonu */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium
                      ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="sr-only">Sonraki</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList; 