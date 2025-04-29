# Admin Kurulumu

Bu dokümanda, KarVeGo uygulaması için admin paneli kurulumu ve admin kullanıcısı oluşturma adımları anlatılmaktadır.

## Admin Kullanıcısı Oluşturma

Admin paneline erişim için özel bir admin kullanıcısı oluşturmanız gerekmektedir. Bu kullanıcı özel izinlere sahip olacak ve admin paneline erişebilecektir.

### Admin Kullanıcı Bilgileri:

- **E-posta**: admin@karvego.com
- **Şifre**: admin123
- **Rol**: admin

### Kurulum Adımları:

1. Supabase projenizdeki SQL Editor'ı açın.
2. Önce `supabase/functions/admin.sql` dosyasındaki kodları çalıştırın. Bu kodlar, admin kullanıcı yönetimi için gerekli fonksiyonları oluşturacaktır.
3. Ardından `supabase/admin_user.sql` dosyasındaki kodları çalıştırın. Bu kodlar, admin kullanıcısını oluşturacak ve gerekli tabloları hazırlayacaktır.

## Admin Paneline Erişim

Admin kullanıcısı oluşturulduktan sonra, aşağıdaki adımlarla admin paneline erişebilirsiniz:

1. KarVeGo uygulamasına `admin@karvego.com` ve `admin123` bilgileriyle giriş yapın.
2. Normal kullanıcı panelinde, sol menüde "Admin Paneli" linkini göreceksiniz. Bu linke tıklayarak admin paneline geçiş yapabilirsiniz.
3. Admin panelinde Dashboard, Kullanıcı Yönetimi ve Sistem Ayarları sekmelerine erişebilirsiniz.

## Admin Paneli Özellikleri

Admin paneli aşağıdaki özellikleri içermektedir:

### Dashboard

- Toplam sipariş, müşteri, ürün sayıları
- Toplam gelir
- Bekleyen, teslim edilen ve iade edilen siparişlerin sayıları

### Kullanıcı Yönetimi

- Tüm kullanıcıları görüntüleme
- Yeni kullanıcı ekleme
- Kullanıcıları aktif/pasif yapma
- Kullanıcı rolünü değiştirme

### Sistem Ayarları

- Genel site ayarları
- Bakım modu ayarları
- Varsayılan kargo şirketi seçimi
- E-posta gönderim ayarları

## Güvenlik Notları

- Admin kullanıcı bilgilerini güvenli bir şekilde saklayın.
- Üretim ortamına geçmeden önce admin şifresini değiştirmeniz önerilir.
- Admin paneline sadece güvenli bağlantılar üzerinden erişim sağlanmalıdır. 