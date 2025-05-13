import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import Layout from '../../components/layout/Layout';
import { UserCircle, Building, Phone, FileText, DollarSign, PenSquare, Save, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Profile {
  full_name: string;
  tax_document_type: string;
  phone: string;
  tax_number: string;
  tax_office: string;
  national_id: string;
  account_type: 'INDIVIDUAL' | 'CORPORATE';
  balance: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function AccountInfo() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    tax_document_type: '',
    phone: '',
    tax_number: '',
    tax_office: '',
    national_id: '',
    account_type: 'INDIVIDUAL',
    balance: 0,
    status: 'PENDING'
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        full_name: data.full_name || '',
        tax_document_type: data.tax_document_type || '',
        phone: data.phone || '',
        tax_number: data.tax_number || '',
        tax_office: data.tax_office || '',
        national_id: data.national_id || '',
        account_type: data.account_type || 'INDIVIDUAL',
        balance: data.balance || 0,
        status: data.status || 'PENDING'
      });
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      toast.error('Profil bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          tax_document_type: profile.tax_document_type,
          phone: profile.phone,
          tax_number: profile.tax_number,
          tax_office: profile.tax_office,
          national_id: profile.national_id
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profil bilgileri güncellendi');
      setIsEditing(false);
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      toast.error('Profil güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = () => {
    switch (profile.status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-4 md:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              profile.status === 'APPROVED' 
                ? 'bg-green-100' 
                : profile.status === 'REJECTED'
                ? 'bg-red-100'
                : 'bg-yellow-100'
            }`}>
              {getStatusIcon()}
            </div>
            <div>
              <h2 className="text-base md:text-lg font-medium text-gray-900">Hesap Durumu</h2>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.status === 'APPROVED' 
                    ? 'bg-green-100 text-green-800'
                    : profile.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile.status === 'APPROVED' 
                    ? 'Onaylı' 
                    : profile.status === 'REJECTED'
                    ? 'Reddedildi'
                    : 'Onay Bekliyor'}
                </span>
                {profile.status === 'PENDING' && (
                  <span className="text-xs text-gray-500">Hesap bilgileriniz sistem tarafından kontrol edilecektir.</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 rounded-lg p-4 mb-2">
            <div className="flex-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-darkGreen bg-opacity-10 flex items-center justify-center">
                <Building className="w-5 h-5 text-darkGreen" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Hesap Tipi</p>
                <p className="font-medium">
                  {profile.account_type === 'INDIVIDUAL' ? 'Bireysel Hesap' : 'Kurumsal Hesap'}
                </p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-lightGreen bg-opacity-10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-lightGreen" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Bakiye</p>
                <p className="font-medium">{profile.balance.toFixed(2)} TL</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form Card */}
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-4 md:p-6 border-b flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <h2 className="text-base md:text-lg font-medium text-gray-900">Hesap Bilgileri</h2>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-darkGreen hover:text-lightGreen px-3 py-1.5 rounded-md border border-darkGreen hover:border-lightGreen transition-colors"
                >
                  <PenSquare className="w-3.5 h-3.5" />
                  Düzenle
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-md border border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-white bg-darkGreen hover:bg-lightGreen px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">AD SOYAD / KURUM ADI</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserCircle className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        disabled={!isEditing}
                        className={`block w-full pl-10 rounded-md sm:text-sm 
                          ${!isEditing ? 'bg-gray-50 border-gray-200' : 'focus:ring-darkGreen focus:border-darkGreen border-gray-300'}`}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">TELEFON</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        disabled={!isEditing}
                        className={`block w-full pl-10 rounded-md sm:text-sm 
                          ${!isEditing ? 'bg-gray-50 border-gray-200' : 'focus:ring-darkGreen focus:border-darkGreen border-gray-300'}`}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">VERGİ DAİRESİ</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={profile.tax_office}
                        onChange={(e) => setProfile({ ...profile, tax_office: e.target.value })}
                        disabled={!isEditing}
                        className={`block w-full pl-10 rounded-md sm:text-sm 
                          ${!isEditing ? 'bg-gray-50 border-gray-200' : 'focus:ring-darkGreen focus:border-darkGreen border-gray-300'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">TC KİMLİK NO</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={profile.national_id}
                        onChange={(e) => setProfile({ ...profile, national_id: e.target.value })}
                        disabled={!isEditing}
                        className={`block w-full pl-10 rounded-md sm:text-sm 
                          ${!isEditing ? 'bg-gray-50 border-gray-200' : 'focus:ring-darkGreen focus:border-darkGreen border-gray-300'}`}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">VERGİ NO</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FileText className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={profile.tax_number}
                        onChange={(e) => setProfile({ ...profile, tax_number: e.target.value })}
                        disabled={!isEditing}
                        className={`block w-full pl-10 rounded-md sm:text-sm 
                          ${!isEditing ? 'bg-gray-50 border-gray-200' : 'focus:ring-darkGreen focus:border-darkGreen border-gray-300'}`}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">HESAP TİPİ</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        disabled={!isEditing}
                        value={profile.account_type}
                        onChange={(e) => setProfile({ ...profile, account_type: e.target.value as 'INDIVIDUAL' | 'CORPORATE' })}
                        className={`block w-full pl-10 rounded-md sm:text-sm 
                          ${!isEditing ? 'bg-gray-50 border-gray-200' : 'focus:ring-darkGreen focus:border-darkGreen border-gray-300'}`}
                      >
                        <option value="INDIVIDUAL">Bireysel Hesap</option>
                        <option value="CORPORATE">Kurumsal Hesap</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Message */}
              {isEditing && (
                <div className="mt-6 flex items-start gap-2 bg-blue-50 text-blue-700 p-3 rounded-md text-xs">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Bilgilendirme</p>
                    <p>Hesap bilgileriniz güncellendiğinde, yeni bilgileriniz sistem tarafından onaylanacaktır. Onay sürecinde bazı işlemler kısıtlanabilir.</p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}