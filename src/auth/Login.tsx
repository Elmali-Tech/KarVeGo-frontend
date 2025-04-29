import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onSwitchToRegister: () => void;
}

function Login({ onSwitchToRegister }: LoginProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Önce auth sistemi ile giriş yap
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      
      // Kullanıcı giriş yaptıysa durumunu kontrol et
      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('status, role')
          .eq('id', authData.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        // Kullanıcının durumuna göre işlem yap
        if (profileData.status === 'APPROVED') {
          toast.success('Giriş başarılı!');
          
          // Kullanıcı rolüne göre yönlendirme yap
          if (profileData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/siparisler');
          }
        } else {
          // Giriş yapabildi ama durumu onaylı değil, çıkış yaptır
          await supabase.auth.signOut();
          
          switch(profileData.status) {
            case 'PENDING':
              toast.error('Hesabınız henüz onaylanmamış. Lütfen admin onayını bekleyin.');
              break;
            case 'REJECTED':
              toast.error('Hesabınız reddedilmiş durumda. Detaylı bilgi için yöneticilerle iletişime geçin.');
              break;
            case 'SUSPENDED':
              toast.error('Hesabınız askıya alınmış durumda. Detaylı bilgi için yöneticilerle iletişime geçin.');
              break;
            default:
              toast.error('Hesabınızla ilgili bir sorun var. Lütfen yöneticilerle iletişime geçin.');
          }
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-black mb-6 text-center">Giriş Yap</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            placeholder="E-posta Adresi"
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

        <button
          type="submit"
          className="w-full bg-darkGreen text-white py-2 rounded-lg hover:bg-lightGreen transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Hesabınız yok mu?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-darkGreen hover:text-lightGreen font-medium"
          >
            Kayıt Ol
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;