import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import Layout from '../../components/layout/Layout';

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
    } catch (err) {
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
    } catch (err) {
      toast.error('Profil güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-2 gap-6">
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
      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Hesap Bilgileri</h2>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                Düzenle
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-sm font-medium text-gray-600 hover:text-gray-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">HESAP DURUMU</label>
                <div className="mt-1">
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profile.status === 'APPROVED' 
                        ? 'bg-green-100 text-green-800'
                        : profile.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {profile.status === 'APPROVED' 
                      ? 'Onaylı' 
                      : profile.status === 'REJECTED'
                      ? 'Reddedildi'
                      : 'Onay Bekliyor'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">HESAP TİPİ</label>
                <div className="mt-1">
                  <select
                    disabled={!isEditing}
                    value={profile.account_type}
                    onChange={(e) => setProfile({ ...profile, account_type: e.target.value as 'INDIVIDUAL' | 'CORPORATE' })}
                    className="block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm disabled:bg-gray-50"
                  >
                    <option value="INDIVIDUAL">Bireysel Hesap</option>
                    <option value="CORPORATE">Kurumsal Hesap</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">BAKİYE</label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={`${profile.balance} TL`}
                    disabled
                    className="bg-gray-50 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">TELEFON</label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">AD SOYAD / KURUM ADI</label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">TC KİMLİK NO</label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={profile.national_id}
                    onChange={(e) => setProfile({ ...profile, national_id: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">VERGİ DAİRESİ</label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={profile.tax_office}
                    onChange={(e) => setProfile({ ...profile, tax_office: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">VERGİ NO</label>
                <div className="mt-1">
                  <input
                    type="text"
                    value={profile.tax_number}
                    onChange={(e) => setProfile({ ...profile, tax_number: e.target.value })}
                    disabled={!isEditing}
                    className="block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}