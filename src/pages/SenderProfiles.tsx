import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Plus, X } from 'lucide-react';
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Ayar güncellenirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-100 p-6 rounded-lg">
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Gönderici Profillerim</h1>
          <button
            onClick={() => setShowNewProfileModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Profil Ekle
          </button>
        </div>

        <div className="grid gap-6">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
                  <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        {profile.website}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {profile.instagram && (
                      <a
                        href={`https://instagram.com/${profile.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        @{profile.instagram}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profile.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {profile.status === 'APPROVED' ? 'Onaylı' : 'Onay Bekliyor'}
                  </span>
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profile.sms_enabled}
                    onChange={(e) => handleToggleSetting(profile.id, 'sms_enabled', e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">SMS Gönderilerini Kapat</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profile.allow_customer_returns}
                    onChange={(e) =>
                      handleToggleSetting(profile.id, 'allow_customer_returns', e.target.checked)
                    }
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    Müşterilerim kendileri iade kodu oluşturabilsin
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Profile Modal */}
      {showNewProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-medium text-gray-900">Profil Bilgisi</h2>
              <button
                onClick={() => setShowNewProfileModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  GÖNDERİCİ ADI / MARKA ADI
                </label>
                <input
                  type="text"
                  required
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                  className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">WEBSITE</label>
                <input
                  type="url"
                  value={newProfile.website}
                  onChange={(e) => setNewProfile({ ...newProfile, website: e.target.value })}
                  className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">INSTAGRAM</label>
                <input
                  type="text"
                  value={newProfile.instagram}
                  onChange={(e) => setNewProfile({ ...newProfile, instagram: e.target.value })}
                  className="mt-1 block w-full rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="kullaniciadi"
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewProfileModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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