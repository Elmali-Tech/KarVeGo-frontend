import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  DollarSign, RefreshCw, CheckCircle, XCircle, 
  Clock, Filter, ArrowUpDown, Search, FileText, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

type BalanceRequest = {
  id: string;
  user_id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  proof_document: string;
  user_details?: {
    full_name: string | null;
    email: string | null; // Aslında bu phone değeri ancak mevcut arayüzde değiştirmemek için email olarak tutuyoruz
  };
};

const BalanceRequests = () => {
  const [requests, setRequests] = useState<BalanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof BalanceRequest>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Bakiye taleplerini yükleme
  const fetchBalanceRequests = async () => {
    setLoading(true);
    
    try {
      // Toplam kayıt sayısını al
      let countQuery = supabase.from('balance_requests').select('id', { count: 'exact' });
      
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter);
      }
      
      if (searchTerm) {
        countQuery = countQuery.or(`user_id.ilike.%${searchTerm}%`);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      setTotalCount(count || 0);
      
      // Ana veri sorgusu
      let query = supabase
        .from('balance_requests')
        .select(`
          id,
          user_id,
          amount,
          status,
          created_at,
          proof_document
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      // Filtreler
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Sayfalama
      query = query.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Kullanıcı bilgilerini tek bir sorgu ile alalım
      const userIds = [...new Set((data || []).map(request => request.user_id))];
      
      if (userIds.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }
      
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds);
      
      if (usersError) throw usersError;
      
      // Kullanıcı ID'lerini hızlı erişim için bir map'e dönüştürelim
      const usersMap = (usersData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, { id: string, full_name: string | null, phone: string | null }>);
      
      // Taleplere kullanıcı bilgilerini ekleyelim
      const requestsWithUserDetails = (data || []).map(request => {
        const userData = usersMap[request.user_id];
        return {
          id: request.id,
          user_id: request.user_id,
          amount: request.amount,
          status: request.status,
          created_at: request.created_at,
          proof_document: request.proof_document,
          user_details: userData ? {
            full_name: userData.full_name,
            email: userData.phone // Burada email yerine phone kullanıyoruz çünkü email alanı yok
          } : undefined
        } as BalanceRequest;
      });
      
      setRequests(requestsWithUserDetails);
    } catch (error) {
      console.error('Bakiye talepleri alınırken hata oluştu:', error);
      toast.error('Bakiye talepleri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa, sıralama, arama veya filtre değiştiğinde verileri yeniden yükle
  useEffect(() => {
    fetchBalanceRequests();
  }, [currentPage, sortField, sortDirection, searchTerm, statusFilter]);

  const handleSort = (field: keyof BalanceRequest) => {
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

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Belgeyi yeni sekmede açma fonksiyonu
  const openDocument = (url: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  // Bakiye talebini onayla
  const approveBalanceRequest = async (requestId: string, userId: string, amount: number) => {
    setProcessingId(requestId);
    
    try {
      // Önce mevcut kullanıcının bakiyesini al
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      
      // Yeni bakiye hesapla
      const currentBalance = userData.balance || 0;
      const newBalance = currentBalance + amount;
      
      // Supabase transaction yoktur, sırayla işlemleri gerçekleştireceğiz
      
      // 1. Kullanıcı bakiyesini güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      // 2. Bakiye talebinin durumunu güncelle
      const { error: requestError } = await supabase
        .from('balance_requests')
        .update({ status: 'APPROVED' })
        .eq('id', requestId);
      
      if (requestError) throw requestError;
      
      toast.success(`Bakiye talebi onaylandı. ${amount} TL kullanıcıya eklendi.`);
      
      // Listeyi güncelle
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { ...req, status: 'APPROVED' }
            : req
        )
      );
    } catch (error) {
      console.error('Bakiye talebi onaylanırken hata oluştu:', error);
      toast.error('İşlem başarısız oldu');
    } finally {
      setProcessingId(null);
    }
  };
  
  // Bakiye talebini reddet
  const rejectBalanceRequest = async (requestId: string) => {
    setProcessingId(requestId);
    
    try {
      const { error } = await supabase
        .from('balance_requests')
        .update({ status: 'REJECTED' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast.success('Bakiye talebi reddedildi');
      
      // Listeyi güncelle
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? { ...req, status: 'REJECTED' }
            : req
        )
      );
    } catch (error) {
      console.error('Bakiye talebi reddedilirken hata oluştu:', error);
      toast.error('İşlem başarısız oldu');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-3 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-semibold flex items-center">
          <DollarSign className="mr-2 h-5 w-5 md:h-6 md:w-6 text-darkGreen" />
          Bakiye Talep Yönetimi
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Ara..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-darkGreen focus:border-darkGreen w-full"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button 
            type="button"
            className="p-2 rounded-lg bg-darkGreen text-white hover:bg-opacity-90 transition-colors flex items-center justify-center shadow-sm"
            onClick={fetchBalanceRequests}
            title="Yenile"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm mb-4 overflow-x-auto border border-gray-100">
        <div className="flex items-center space-x-1 flex-wrap gap-1">
          <Filter className="h-4 w-4 text-gray-500 mr-1" />
          <button
            type="button"
            className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md text-xs md:text-sm whitespace-nowrap ${statusFilter === 'all' 
              ? 'bg-darkGreen bg-opacity-10 text-darkGreen font-medium border border-darkGreen border-opacity-30' 
              : 'hover:bg-gray-100'}`}
            onClick={() => handleStatusFilter('all')}
          >
            Tümü
          </button>
          <button
            type="button"
            className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md text-xs md:text-sm flex items-center whitespace-nowrap ${statusFilter === 'PENDING' 
              ? 'bg-yellow-100 text-yellow-800 font-medium border border-yellow-300' 
              : 'hover:bg-gray-100'}`}
            onClick={() => handleStatusFilter('PENDING')}
          >
            <Clock className="mr-1 h-3 w-3" />
            Bekleyenler
          </button>
          <button
            type="button"
            className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md text-xs md:text-sm flex items-center whitespace-nowrap ${statusFilter === 'APPROVED' 
              ? 'bg-lightGreen bg-opacity-20 text-darkGreen font-medium border border-lightGreen border-opacity-30' 
              : 'hover:bg-gray-100'}`}
            onClick={() => handleStatusFilter('APPROVED')}
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Onaylananlar
          </button>
          <button
            type="button"
            className={`px-2 py-1 md:px-3 md:py-1.5 rounded-md text-xs md:text-sm flex items-center whitespace-nowrap ${statusFilter === 'REJECTED' 
              ? 'bg-red-100 text-red-800 font-medium border border-red-300' 
              : 'hover:bg-gray-100'}`}
            onClick={() => handleStatusFilter('REJECTED')}
          >
            <XCircle className="mr-1 h-3 w-3" />
            Reddedilenler
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    <span className="hidden sm:inline">Talep Tarihi</span>
                    <span className="sm:hidden">Tarih</span>
                    {sortField === 'created_at' && (
                      <ArrowUpDown className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center">
                    Kullanıcı
                  </div>
                </th>
                <th 
                  className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Tutar
                    {sortField === 'amount' && (
                      <ArrowUpDown className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                    )}
                  </div>
                </th>
                <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Belge</span>
                  <span className="sm:hidden">Blg</span>
                </th>
                <th 
                  className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    <span className="hidden sm:inline">Durum</span>
                    <span className="sm:hidden">Drm</span>
                    {sortField === 'status' && (
                      <ArrowUpDown className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                    )}
                  </div>
                </th>
                <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">İşlemler</span>
                  <span className="sm:hidden">İşl</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin h-5 w-5 text-darkGreen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="ml-2">Yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-center text-gray-500">
                    <div className="flex flex-col items-center py-4 md:py-6">
                      <DollarSign className="h-8 w-8 md:h-10 md:w-10 text-gray-300 mb-2" />
                      <p className="text-gray-500 mb-1 text-sm md:text-base">Bakiye talebi bulunamadı</p>
                      <p className="text-xs md:text-sm text-gray-400">Filtreleri değiştirerek tekrar deneyin</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((request) => {
                  return (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 md:px-4 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm text-gray-600">
                          {new Date(request.created_at).toLocaleDateString('tr-TR')}
                        </div>
                        <div className="text-xs text-gray-500 hidden sm:block">
                          {new Date(request.created_at).toLocaleTimeString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-6 w-6 md:h-8 md:w-8 bg-darkGreen bg-opacity-10 text-darkGreen rounded-full flex items-center justify-center text-xs md:text-sm">
                            {request.user_details?.full_name ? request.user_details.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="ml-2 md:ml-3">
                            <div className="text-xs md:text-sm font-medium text-gray-900">
                              {request.user_details?.full_name || 'İsimsiz'}
                            </div>
                            <div className="text-xs text-gray-500 hidden sm:block">
                              {request.user_details?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm font-medium text-gray-900">
                          {request.amount.toFixed(2)} TL
                        </div>
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-4 whitespace-nowrap">
                        {request.proof_document ? (
                          <button
                            onClick={() => openDocument(request.proof_document)}
                            className="inline-flex items-center px-1.5 py-1 md:px-2.5 md:py-1.5 bg-darkGreen bg-opacity-10 text-darkGreen rounded-md hover:bg-opacity-20 transition-colors text-xs font-medium"
                          >
                            <FileText className="h-3 w-3 md:h-3.5 md:w-3.5 mr-0.5 md:mr-1" />
                            <span className="hidden sm:inline">Belgeyi Görüntüle</span>
                            <span className="sm:hidden">Görüntüle</span>
                            <ExternalLink className="ml-0.5 md:ml-1 h-2.5 w-2.5 md:h-3 md:w-3" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Yok</span>
                        )}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-4 whitespace-nowrap">
                        {request.status === 'APPROVED' ? (
                          <span className="px-1.5 py-1 md:px-2.5 md:py-1.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-lightGreen bg-opacity-20 text-darkGreen border border-lightGreen border-opacity-30">
                            <CheckCircle className="mr-0.5 md:mr-1 h-3 w-3" />
                            <span className="hidden sm:inline">Onaylandı</span>
                            <span className="sm:hidden">Onay</span>
                          </span>
                        ) : request.status === 'PENDING' ? (
                          <span className="px-1.5 py-1 md:px-2.5 md:py-1.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                            <Clock className="mr-0.5 md:mr-1 h-3 w-3" />
                            <span className="hidden sm:inline">Onay Bekliyor</span>
                            <span className="sm:hidden">Bekliyor</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-1 md:px-2.5 md:py-1.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-300">
                            <XCircle className="mr-0.5 md:mr-1 h-3 w-3" />
                            <span className="hidden sm:inline">Reddedildi</span>
                            <span className="sm:hidden">Red</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 md:px-4 md:py-4 whitespace-nowrap">
                        {processingId === request.id ? (
                          <div className="flex justify-center">
                            <svg className="animate-spin h-4 w-4 md:h-5 md:w-5 text-darkGreen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        ) : request.status === 'PENDING' ? (
                          <div className="flex justify-end space-x-1 md:space-x-2">
                            <button 
                              type="button"
                              onClick={() => approveBalanceRequest(request.id, request.user_id, request.amount)}
                              className="p-1 md:p-1.5 rounded-full bg-lightGreen bg-opacity-20 text-darkGreen hover:bg-opacity-30 transition-colors hover:shadow-sm"
                              title="Onayla"
                            >
                              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => rejectBalanceRequest(request.id)}
                              className="p-1 md:p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors hover:shadow-sm"
                              title="Reddet"
                            >
                              <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 italic">
                            <span className="hidden sm:inline">
                              {request.status === 'APPROVED' ? 'İşlem tamamlandı' : 'Talep reddedildi'}
                            </span>
                            <span className="sm:hidden">
                              {request.status === 'APPROVED' ? 'Tamamlandı' : 'Reddedildi'}
                            </span>
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
        
        {/* Sayfalandırma */}
        {!loading && requests.length > 0 && totalPages > 1 && (
          <div className="px-3 py-2 md:px-6 md:py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Önceki
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-700">
                  <span className="font-medium">{totalCount}</span> sonuçtan{' '}
                  <span className="font-medium">{Math.max(1, (currentPage - 1) * itemsPerPage + 1)}</span>-
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> arası gösteriliyor
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Önceki</span>
                    &lsaquo;
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    let pageNumber: number;
                    
                    // Display logic for pages
                    if (totalPages <= 5) {
                      pageNumber = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + idx;
                    } else {
                      pageNumber = currentPage - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          currentPage === pageNumber
                            ? 'z-10 bg-darkGreen bg-opacity-10 border-darkGreen text-darkGreen'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        } text-sm font-medium`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Sonraki</span>
                    &rsaquo;
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

export default BalanceRequests; 