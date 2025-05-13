import React, { useState } from 'react';
import { toast } from 'sonner';
import { Lock, KeyRound, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/layout/Layout';

export default function ChangePassword() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);

    try {
      // First get the current user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error('Kullanıcı bilgileri alınamadı');
        return;
      }

      // Verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.currentPassword,
      });

      if (signInError) {
        toast.error('Mevcut şifre yanlış');
        return;
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) throw updateError;

      toast.success('Şifreniz başarıyla güncellendi');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Şifre değişikliği hatası:', error);
      toast.error('Şifre güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[A-Z]/)) strength += 1;
    if (password.match(/[0-9]/)) strength += 1;
    if (password.match(/[^A-Za-z0-9]/)) strength += 1;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 0:
        return { label: 'Zayıf', color: 'bg-red-500' };
      case 1:
        return { label: 'Orta', color: 'bg-orange-500' };
      case 2:
        return { label: 'İyi', color: 'bg-yellow-500' };
      case 3:
        return { label: 'Güçlü', color: 'bg-green-500' };
      case 4:
        return { label: 'Çok Güçlü', color: 'bg-green-600' };
      default:
        return { label: '', color: '' };
    }
  };

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-4 md:p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-darkGreen bg-opacity-10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-darkGreen" />
              </div>
              <h2 className="text-base md:text-lg font-medium text-gray-900">Şifre Değiştir</h2>
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="bg-blue-50 text-blue-700 p-3 rounded-md flex items-start mb-6">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-2 shrink-0" />
              <div className="text-xs md:text-sm">
                <p className="font-medium">Güvenli Şifre İpuçları</p>
                <ul className="mt-1 list-disc list-inside text-blue-600 text-xs space-y-1">
                  <li>En az 8 karakter uzunluğunda olmalı</li>
                  <li>Büyük ve küçük harf kullanın</li>
                  <li>Sayı ve özel karakter ekleyin</li>
                  <li>Kolayca tahmin edilebilir bilgiler kullanmayın</li>
                </ul>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  MEVCUT ŞİFRE
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, currentPassword: e.target.value })
                    }
                    className="block w-full pl-10 pr-12 py-2 rounded-md border-gray-300 focus:ring-darkGreen focus:border-darkGreen text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  YENİ ŞİFRE
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={formData.newPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, newPassword: e.target.value });
                      checkPasswordStrength(e.target.value);
                    }}
                    className="block w-full pl-10 pr-12 py-2 rounded-md border-gray-300 focus:ring-darkGreen focus:border-darkGreen text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Şifre Gücü:</span>
                      <span className={`font-medium ${
                        passwordStrength < 2 ? 'text-red-600' : 
                        passwordStrength < 3 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {getPasswordStrengthLabel().label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${getPasswordStrengthLabel().color}`} style={{ width: `${passwordStrength * 25}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  YENİ ŞİFRE TEKRAR
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="block w-full pl-10 pr-12 py-2 rounded-md border-gray-300 focus:ring-darkGreen focus:border-darkGreen text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">Şifreler eşleşmiyor</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs md:text-sm font-medium text-white bg-darkGreen border border-transparent rounded-md shadow-sm hover:bg-lightGreen transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}