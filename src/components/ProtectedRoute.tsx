import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('status, role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const approved = data.status === 'APPROVED';
        setIsApproved(approved);
        setUserRole(data.role);

        // Onaylanmamış kullanıcılar için uygun hata mesajı göster
        if (!approved) {
          switch(data.status) {
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
          
          // Oturumu kapat
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error('Kullanıcı durumu kontrol edilirken hata oluştu:', error);
        setIsApproved(false);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkUserStatus();
  }, [user]);

  if (loading || checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa /auth sayfasına yönlendir
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Kullanıcı giriş yapmış ama onaylanmamışsa (veya bir hata oluştuysa) / sayfasına yönlendir
  // useEffect içinde zaten oturum kapatılıyor ve toast mesajı gösteriliyor.
  if (isApproved === false) {
    return <Navigate to="/" replace />;
  }
  
  // Admin kullanıcılarını admin paneline yönlendir
  // Ancak zaten admin sayfalarında ise yönlendirme yapma
  if (userRole === 'admin' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

  // Kullanıcı giriş yapmış ve onaylanmışsa (isApproved === true) içeriği göster
  return <>{children}</>;
}