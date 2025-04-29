import React, { useState } from 'react';
import { User, Mail, Globe, Instagram, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

function Register({ onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    website: '',
    instagram: '',
    taxDocument: 'VERGI_LEVHAM_VAR',
    termsAccepted: false,
    kvkkAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitDisabled) {
      toast.error('Lütfen birkaç saniye bekleyip tekrar deneyin.');
      return;
    }

    if (!formData.termsAccepted || !formData.kvkkAccepted) {
      toast.error('Lütfen üyelik koşullarını ve KVKK metnini kabul edin.');
      return;
    }

    setLoading(true);
    setSubmitDisabled(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user?.id) {
        throw new Error('Kullanıcı oluşturulamadı');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: formData.name,
          website: formData.website || null,
          instagram: formData.instagram || null,
          tax_document_type: formData.taxDocument,
        });

      if (profileError) throw profileError;

      toast.success('Kayıt başarılı! Lütfen e-posta adresinize gelen onay linkine tıklayarak hesabınızı doğrulayın.');
      onSwitchToLogin();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kayıt olurken bir hata oluştu');
    } finally {
      setLoading(false);
      setTimeout(() => setSubmitDisabled(false), 2000);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-black mb-6 text-center">Kayıt Ol</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Ad Soyad veya Ticari Ünvan"
            className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 focus:ring-darkGreen focus:border-darkGreen sm:text-sm"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            placeholder="E-mail Adresi"
            className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 focus:ring-darkGreen focus:border-darkGreen sm:text-sm"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="password"
            placeholder="Şifre"
            className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 focus:ring-darkGreen focus:border-darkGreen sm:text-sm"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="url"
            placeholder="Website Adresi"
            className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 focus:ring-darkGreen focus:border-darkGreen sm:text-sm"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
        </div>

        <div className="relative">
          <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Instagram Sayfası"
            className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 focus:ring-darkGreen focus:border-darkGreen sm:text-sm"
            value={formData.instagram}
            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="vergiLevham"
              name="taxDocument"
              value="VERGI_LEVHAM_VAR"
              checked={formData.taxDocument === 'VERGI_LEVHAM_VAR'}
              onChange={(e) => setFormData({ ...formData, taxDocument: e.target.value })}
              className="h-4 w-4 text-darkGreen focus:ring-lightGreen"
            />
            <label htmlFor="vergiLevham" className="text-gray-700">VERGİ LEVHAM VAR</label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="vergiMuafiyet"
              name="taxDocument"
              value="VERGI_MUAFIYET_BELGEM_VAR"
              checked={formData.taxDocument === 'VERGI_MUAFIYET_BELGEM_VAR'}
              onChange={(e) => setFormData({ ...formData, taxDocument: e.target.value })}
              className="h-4 w-4 text-darkGreen focus:ring-lightGreen"
            />
            <label htmlFor="vergiMuafiyet" className="text-gray-700">VERGİ MUAFİYET BELGEM VAR</label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={formData.termsAccepted}
              onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
              className="h-4 w-4 text-darkGreen focus:ring-lightGreen rounded"
              required
            />
            <label htmlFor="terms" className="text-gray-700">
              ÜYELİK KOŞULLARINI OKUDUM KABUL EDİYORUM
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="kvkk"
              checked={formData.kvkkAccepted}
              onChange={(e) => setFormData({ ...formData, kvkkAccepted: e.target.checked })}
              className="h-4 w-4 text-darkGreen focus:ring-lightGreen rounded"
              required
            />
            <label htmlFor="kvkk" className="text-gray-700">
              KVKK AÇIK RIZA METNİNİ OKUDUM ONAYLIYORUM
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-darkGreen text-white py-2 rounded-lg hover:bg-lightGreen transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || submitDisabled}
        >
          {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Zaten hesabınız var mı?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-darkGreen hover:text-lightGreen font-medium"
          >
            Giriş Yap
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;