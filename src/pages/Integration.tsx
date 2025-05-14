import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShoppingBag, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import Layout from '../components/layout/Layout';
import { useNavigate, useLocation } from 'react-router-dom';

interface Integration {
  id: string;
  type: 'SHOPIFY';
  shop_url: string;
  access_token: string;
  webhook_id?: string;
  is_active: boolean;
}

export default function Integration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [shopUrl, setShopUrl] = useState('');
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  useEffect(() => {
    if (user) fetchIntegration();
  }, [user]);

  const fetchIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('type', 'SHOPIFY')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setIntegration(data);
        setShopUrl(data.shop_url);
      }
    } catch (err) {
      console.error(err);
      toast.error('Entegrasyon bilgileri alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (!integration) return;

      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integration.id);

      if (error) throw error;

      setIntegration(null);
      setShopUrl('');
      toast.success('Shopify bağlantısı kaldırıldı');
    } catch (err) {
      console.error(err);
      toast.error('Bağlantı silinirken hata oluştu');
    }
  };

  const handleInstallApp = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const cleanShopUrl = shopUrl.trim().toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');

      if (!cleanShopUrl.match(/^[a-zA-Z0-9-]+\.myshopify\.com$/)) {
        throw new Error('Geçersiz mağaza adresi. Örnek: magazam.myshopify.com');
      }

      const state = Math.random().toString(36).substring(2);
      localStorage.setItem('shopify_oauth_state', state);
      localStorage.setItem('shopify_shop_url', cleanShopUrl);

      const scopes = [
        'read_products', 'write_products',
        'read_orders', 'write_orders',
        'read_customers', 'write_customers',
        'read_inventory', 'write_inventory',
        'read_shipping', 'write_shipping'
      ];

      const redirectUri = `https://karvego-874729167381.europe-west1.run.app/shopify/callback`;
      const authUrl = `https://${cleanShopUrl}/admin/oauth/authorize?client_id=${import.meta.env.VITE_SHOPIFY_CLIENT_ID}&scope=${scopes.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      console.log('Auth URL:', redirectUri);
      console.log('Auth URL:', authUrl);
      window.location.href = authUrl;
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Bağlantı başlatılırken hata oluştu');
      setSaving(false);
    }
  };

  useEffect(() => {
    const processCallback = async () => {
      if (!location.pathname.includes('/shopify/callback') || isProcessingCallback) return;

      setIsProcessingCallback(true);
      setSaving(true);

      try {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        const shop = params.get('shop');
        const storedState = localStorage.getItem('shopify_oauth_state');
        const storedShop = localStorage.getItem('shopify_shop_url');

        if (!code || !state || !shop) throw new Error('Callback parametreleri eksik');
        if (state !== storedState) throw new Error('OAuth güvenlik kontrolü başarısız');
        if (!storedShop) throw new Error('Mağaza bilgisi bulunamadı');

        localStorage.removeItem('shopify_oauth_state');
        localStorage.removeItem('shopify_shop_url');

        const tokenEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify/token`;
        console.log('Token endpoint:', tokenEndpoint);

        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            code,
            shop: storedShop
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Token response error:', errorData);
          throw new Error(errorData.error || 'Token alınamadı');
        }

        const data = await response.json();
        if (!data.access_token) throw new Error('Access token alınamadı');

        const { error: dbError } = await supabase.from('integrations').upsert({
          user_id: user?.id,
          type: 'SHOPIFY',
          shop_url: storedShop,
          access_token: data.access_token,
          is_active: true,
        });

        if (dbError) throw dbError;

        toast.success('Shopify entegrasyonu başarılı');
        await fetchIntegration();
      } catch (err) {
        console.error('Callback hatası:', err);
        toast.error(err instanceof Error ? err.message : 'Entegrasyon kurulamadı');
      } finally {
        setSaving(false);
        setIsProcessingCallback(false);
        navigate('/ayarlar/entegrasyon', { replace: true });
      }
    };

    processCallback();
  }, [location.pathname, user]);

  if (loading) {
    return (
      <Layout>
        <div className="p-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-darkGreen" />
              <h2 className="text-xl font-semibold text-gray-900">Shopify Entegrasyonu</h2>
            </div>
            {integration && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                integration.is_active ? 'bg-lightGreen bg-opacity-20 text-darkGreen' : 'bg-gray-100 text-gray-600'
              }`}>
                {integration.is_active ? 'Aktif' : 'Pasif'}
              </span>
            )}
          </div>

          {!integration ? (
            <>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-darkGreen mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Kurulum Adımları:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Mağaza URL'nizi girin (örn: magazam.myshopify.com)</li>
                    <li>"Shopify'a Bağlan" butonuna tıklayın</li>
                    <li>Yetki ekranında uygulamaya izin verin</li>
                    <li>Yönlendirme sonrası bağlantınız kurulmuş olacak</li>
                  </ol>
                </div>
              </div>

              <form onSubmit={handleInstallApp} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mağaza URL</label>
                  <input
                    type="text"
                    required
                    placeholder="magazam.myshopify.com"
                    value={shopUrl}
                    onChange={(e) => setShopUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-lightGreen focus:border-lightGreen"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-darkGreen text-white px-4 py-2 rounded-md hover:bg-lightGreen transition-colors disabled:opacity-50 text-sm flex items-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Yönlendiriliyor...
                      </>
                    ) : (
                      "Shopify'a Bağlan"
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-lightGreen bg-opacity-10 p-4 rounded-lg flex items-center justify-between">
                <div className="text-darkGreen font-medium flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-lightGreen rounded-full animate-ping" />
                  <span className="inline-block w-2 h-2 bg-darkGreen rounded-full" />
                  Mağaza bağlantısı aktif
                </div>
                <button
                  onClick={handleDisconnect}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Bağlantıyı Kes
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Bağlı Mağaza:</h3>
                <p className="text-sm text-gray-600">{integration.shop_url}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}