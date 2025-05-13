import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Plus, X, Store, MessageSquare, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import Layout from '../components/layout/Layout';

interface SenderProfile {
  id: string;
  name: string;
  website: string;
  instagram: string;
  logo_url: string | null;
  sms_enabled: boolean;
  allow_customer_returns: boolean;
  status: 'PENDING' | 'APPROVED';
}

export default function SenderProfiles() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<SenderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    website: '',
    instagram: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('sender_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      toast.error('Gönderici profilleri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.from('sender_profiles').insert({
        user_id: user?.id,
        name: newProfile.name,
        website: newProfile.website,
        instagram: newProfile.instagram,
      });

      if (error) throw error;

      toast.success('Gönderici profili oluşturuldu');
      setShowNewProfileModal(false);
      setNewProfile({ name: '', website: '', instagram: '' });
      fetchProfiles();
    } catch (error) {
      console.error('Profil oluşturma hatası:', error);
      toast.error('Profil oluşturulurken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sender_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Profil silindi');
      fetchProfiles();
    } catch (error) {
      console.error('Profil silme hatası:', error);
      toast.error('Profil silinirken bir hata oluştu');
    }
  };

  const handleToggleSetting = async (id: string, field: 'sms_enabled' | 'allow_customer_returns', value: boolean) => {
    try {
      const { error } = await supabase
        .from('sender_profiles')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      fetchProfiles();
    } catch (error) {
      console.error('Ayar güncelleme hatası:', error);
      toast.error('Ayar güncellenirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 px-2 sm:px-0 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-100 p-4 md:p-6 rounded-lg">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Gönderici Profillerim</h1>
          <button
            onClick={() => setShowNewProfileModal(true)}
            className="flex items-center justify-center gap-1 md:gap-2 bg-darkGreen text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-lightGreen transition-colors text-xs md:text-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Profil Ekle
          </button>
        </div>

        {profiles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Henüz Gönderici Profiliniz Yok</h3>
            <p className="text-gray-500 mb-4">Kargo gönderimi yapabilmek için en az bir gönderici profili oluşturmanız gerekir.</p>
            <button
              onClick={() => setShowNewProfileModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-darkGreen text-white px-4 py-2 rounded-lg hover:bg-lightGreen transition-colors"
            >
              <Plus className="w-5 h-5" />
              İlk Profilinizi Oluşturun
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 md:mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-darkGreen" />
                      <h3 className="text-base md:text-lg font-medium text-gray-900">{profile.name}</h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          profile.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {profile.status === 'APPROVED' ? 'Onaylı' : 'Onay Bekliyor'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-gray-500">
                      {profile.website && (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-darkGreen"
                        >
                          {profile.website}
                          <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                        </a>
                      )}
                      {profile.instagram && (
                        <a
                          href={`https://instagram.com/${profile.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-darkGreen"
                        >
                          @{profile.instagram}
                          <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="self-start text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>

                <div className="space-y-3 bg-gray-50 rounded-lg p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative inline-block w-10 h-5 transition duration-200 ease-in-out bg-gray-200 rounded-full cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.sms_enabled}
                        onChange={(e) => handleToggleSetting(profile.id, 'sms_enabled', e.target.checked)}
                        className="absolute w-0 h-0 opacity-0"
                        id={`sms-toggle-${profile.id}`}
                      />
                      <label
                        htmlFor={`sms-toggle-${profile.id}`}
                        className={`absolute left-0 w-5 h-5 scale-95 bg-white rounded-full transition transform duration-150 ease-in-out cursor-pointer ${
                          profile.sms_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      ></label>
                      <div className={`w-full h-full rounded-full transition duration-150 ease-in-out ${
                        profile.sms_enabled ? 'bg-darkGreen' : 'bg-gray-300'
                      }`}></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span className="text-xs md:text-sm text-gray-700">SMS Gönderileri {profile.sms_enabled ? 'Açık' : 'Kapalı'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative inline-block w-10 h-5 transition duration-200 ease-in-out bg-gray-200 rounded-full cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.allow_customer_returns}
                        onChange={(e) => handleToggleSetting(profile.id, 'allow_customer_returns', e.target.checked)}
                        className="absolute w-0 h-0 opacity-0"
                        id={`returns-toggle-${profile.id}`}
                      />
                      <label
                        htmlFor={`returns-toggle-${profile.id}`}
                        className={`absolute left-0 w-5 h-5 scale-95 bg-white rounded-full transition transform duration-150 ease-in-out cursor-pointer ${
                          profile.allow_customer_returns ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      ></label>
                      <div className={`w-full h-full rounded-full transition duration-150 ease-in-out ${
                        profile.allow_customer_returns ? 'bg-darkGreen' : 'bg-gray-300'
                      }`}></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-gray-500" />
                      <span className="text-xs md:text-sm text-gray-700">
                        Müşteri İadeleri {profile.allow_customer_returns ? 'Açık' : 'Kapalı'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Profile Modal */}
      {showNewProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 md:p-6 border-b">
              <h2 className="text-base md:text-lg font-medium text-gray-900">Profil Bilgisi</h2>
              <button
                onClick={() => setShowNewProfileModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  GÖNDERİCİ ADI / MARKA ADI
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Store className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={newProfile.name}
                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                    className="pl-10 block w-full rounded-md focus:ring-darkGreen focus:border-darkGreen sm:text-sm border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">WEBSITE</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={newProfile.website}
                    onChange={(e) => setNewProfile({ ...newProfile, website: e.target.value })}
                    className="pl-10 block w-full rounded-md focus:ring-darkGreen focus:border-darkGreen sm:text-sm border-gray-300"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">INSTAGRAM</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">@</span>
                  </div>
                  <input
                    type="text"
                    value={newProfile.instagram}
                    onChange={(e) => setNewProfile({ ...newProfile, instagram: e.target.value })}
                    className="pl-10 block w-full rounded-md focus:ring-darkGreen focus:border-darkGreen sm:text-sm border-gray-300"
                    placeholder="kullaniciadi"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewProfileModal(false)}
                  className="px-3 py-1.5 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1.5 text-xs md:text-sm font-medium text-white bg-darkGreen border border-transparent rounded-md hover:bg-lightGreen"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}