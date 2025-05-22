import React from "react";
import Layout from "../components/layout/Layout";

const PrivacyPolicy: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-darkGreen mb-6">Gizlilik Sözleşmesi</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-darkGreen">1. Bilgi Toplama ve Kullanımı</h2>
          <p className="mb-4 text-gray-700">
            KarVeGo olarak, hizmetlerimizi sunmak ve geliştirmek için belirli kişisel bilgilerinizi toplamaktayız. 
            Bu bilgiler, adınız, e-posta adresiniz, telefon numaranız, fatura ve teslimat adresleriniz, ödeme bilgileriniz,
            işletme bilgileriniz, kargo tercihleriniz ve sipariş geçmişiniz gibi bilgileri içerebilir.
          </p>
          <p className="mb-4 text-gray-700">
            Topladığımız bilgileri aşağıdaki amaçlarla kullanmaktayız:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Hesabınızı yönetmek ve size hizmet sunmak</li>
            <li>Sipariş ve kargo takip hizmetlerimizi geliştirmek</li>
            <li>Size müşteri desteği sağlamak</li>
            <li>Gerekli bildirimleri yapmak ve güncellemeler hakkında sizi bilgilendirmek</li>
            <li>E-ticaret platformları ve kargo şirketleriyle entegrasyonları yönetmek</li>
            <li>Kargo etiketleri ve fatura oluşturmak</li>
            <li>Sipariş ve kargo durumu hakkında müşterilerinizi bilgilendirmek</li>
            <li>Ödeme işlemlerinizi güvenli bir şekilde gerçekleştirmek</li>
            <li>Hizmetlerimizi iyileştirmek ve yeni özellikler geliştirmek</li>
            <li>Kanuni yükümlülüklerimizi yerine getirmek</li>
          </ul>
          <p className="mb-4 text-gray-700">
            KarVeGo, sipariş oluşturma, kargo takibi ve müşteri bildirimleri süreçlerinde ihtiyaç duyulan bilgileri 
            toplamak için yasal dayanağa sahiptir. Bu bilgileri, hizmet sözleşmemizin yerine getirilmesi, kanuni 
            yükümlülüklerin karşılanması ve meşru menfaatlerimiz doğrultusunda işliyoruz.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-darkGreen">2. E-Ticaret Entegrasyonları ve Veri Paylaşımı</h2>
          <p className="mb-4 text-gray-700">
            KarVeGo, çeşitli e-ticaret platformlarıyla (Shopify, WooCommerce, Magento, Trendyol, Hepsiburada, vb.)
            entegrasyon sağlar. Bu entegrasyonlar aracılığıyla, sipariş bilgileri, müşteri bilgileri ve ürün detayları 
            gibi veriler, sizin yetkilendirmenize bağlı olarak e-ticaret platformunuzdan KarVeGo sistemine aktarılabilir.
          </p>
          <p className="mb-4 text-gray-700">
            Entegrasyonlar kapsamında:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Yalnızca hizmetimizi sunmak için gerekli minimum veriyi toplarız</li>
            <li>Verilerinize erişim izni, entegrasyon esnasında açıkça talep edilir ve sizin onayınıza tabidir</li>
            <li>E-ticaret platformları ile paylaşılan API anahtarları ve kimlik bilgileri güvenli şekilde saklanır</li>
            <li>Entegrasyonu istediğiniz zaman kaldırabilir ve veri paylaşımını durdurabilirsiniz</li>
          </ul>
          <p className="mb-4 text-gray-700">
            Bu entegrasyonların işleyişi ve veri güvenliği hakkında daha fazla bilgi için lütfen müşteri 
            hizmetlerimizle iletişime geçin.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-darkGreen">3. Çerezler ve İzleme Teknolojileri</h2>
          <p className="mb-4 text-gray-700">
            Web sitemizde ve hizmetlerimizde çerezler ve benzer izleme teknolojilerini kullanmaktayız. 
            Bu teknolojiler, platformumuzdaki deneyiminizi kişiselleştirmek, oturum bilgilerinizi yönetmek ve 
            hizmetlerimizi nasıl kullandığınıza dair bilgi toplamak için kullanılmaktadır.
          </p>
          <p className="mb-4 text-gray-700">
            Kullandığımız çerez türleri şunlardır:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Zorunlu Çerezler:</strong> Sitemizin düzgün çalışması için gereklidir ve devre dışı bırakılamazlar.</li>
            <li><strong>Performans ve Analiz Çerezleri:</strong> Sitemizin nasıl kullanıldığını anlamamıza ve kullanıcı deneyimini iyileştirmemize yardımcı olur.</li>
            <li><strong>İşlevsellik Çerezleri:</strong> Siteyi ziyaret ettiğinizde seçimlerinizi hatırlamamızı ve size kişiselleştirilmiş özellikler sunmamızı sağlar.</li>
            <li><strong>Hedefleme Çerezleri:</strong> İlgi alanlarınıza göre reklamlar sunmak için kullanılabilir.</li>
          </ul>
          <p className="mb-4 text-gray-700">
            Çoğu web tarayıcısı, çerezleri devre dışı bırakmanıza veya tarayıcınızın çerez gönderdiğinde uyarı vermesini sağlayacak şekilde ayarlanabilir. 
            Ancak, çerezleri devre dışı bırakırsanız, web sitemizin bazı özellikleri düzgün çalışmayabilir.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-darkGreen">4. Kargo Şirketleriyle Bilgi Paylaşımı</h2>
          <p className="mb-4 text-gray-700">
            KarVeGo, sipariş teslimatını sağlamak amacıyla kargo şirketleriyle (Yurtiçi Kargo, Aras Kargo, MNG Kargo, PTT Kargo, UPS, DHL, vb.) 
            belirli bilgileri paylaşmaktadır. Bu paylaşılan bilgiler şunları içerebilir:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Gönderici adı, adresi ve iletişim bilgileri</li>
            <li>Alıcı adı, adresi ve iletişim bilgileri</li>
            <li>Paket boyutları, ağırlığı ve içerik bilgileri</li>
            <li>Ödeme ve faturalandırma bilgileri</li>
          </ul>
          <p className="mb-4 text-gray-700">
            Bu bilgi paylaşımı, siparişinizin doğru şekilde teslim edilmesi için gereklidir ve hizmet sözleşmemizin yerine 
            getirilmesi amacıyla yapılmaktadır. Kargo şirketleri, paylaşılan bu bilgileri yalnızca teslimat hizmetini 
            gerçekleştirmek için kullanmakla yükümlüdür.
          </p>
          <p className="mb-4 text-gray-700">
            Her kargo şirketinin kendi gizlilik politikası bulunmaktadır. Bu şirketlerin verilerinizi nasıl işlediği 
            hakkında daha fazla bilgi için ilgili kargo şirketinin gizlilik politikasını incelemenizi öneririz.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-darkGreen">5. Veri Güvenliği</h2>
          <p className="mb-4 text-gray-700">
            Kişisel bilgilerinizin güvenliğini sağlamak için uygun teknik ve organizasyonel önlemleri almaktayız. 
            Bilgilerinizin yetkisiz erişime, kullanıma veya ifşa edilmeye karşı korunması için endüstri standartlarında 
            güvenlik protokolleri uygulamaktayız.
          </p>
          <p className="mb-4 text-gray-700">
            Güvenlik önlemlerimiz şunları içerir:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>SSL/TLS şifreleme teknolojisi kullanarak veri iletiminin güvenliğini sağlama</li>
            <li>Güçlü şifreleme algoritmaları ile hassas verilerin korunması</li>
            <li>Düzenli güvenlik testleri ve denetimleri yapma</li>
            <li>Çalışanlar için veri güvenliği eğitimleri düzenleme</li>
            <li>Fiziksel sunucu güvenliğini sağlama</li>
            <li>Veritabanı erişim kontrollerini uygulama</li>
            <li>Düzenli yedekleme ve felaket kurtarma planları oluşturma</li>
          </ul>
          <p className="mb-4 text-gray-700">
            Ancak, internet üzerinden hiçbir veri iletiminin veya elektronik depolamanın %100 güvenli olmadığını 
            belirtmek isteriz. Bu nedenle, bilgilerinizin güvenliğini tamamen garanti edemeyiz, ancak korumak için 
            tüm makul önlemleri alıyoruz.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-darkGreen">6. Veri Saklama ve İmha</h2>
          <p className="mb-4 text-gray-700">
            Kişisel verilerinizi, hizmetlerimizi sunmak ve yasal yükümlülüklerimizi yerine getirmek için gerekli olan 
            süre boyunca saklarız. Bu süre genellikle şu faktörlere bağlıdır:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Hizmet sözleşmemizin süresi</li>
            <li>Yasal saklama yükümlülükleri (örn. vergi mevzuatı, e-ticaret mevzuatı)</li>
            <li>Olası hukuki taleplere karşı savunma ihtiyacı</li>
            <li>İş operasyonlarımız için gereklilik</li>
          </ul>
          <p className="mb-4 text-gray-700">
            Genel olarak, aktif müşteri hesaplarına ait verileri hesap aktif olduğu sürece, sipariş ve kargo bilgilerini 
            ise en az 3 yıl süreyle (vergi mevzuatı gereklilikleri nedeniyle) saklarız. Hesabınız kapatıldıktan sonra,
            verilerinizi anonimleştirir veya yasal saklama süresi sona erdiğinde güvenli bir şekilde imha ederiz.
          </p>
          <p className="mb-4 text-gray-700">
            Verilerinizin silinmesini talep etmeniz durumunda, yasal yükümlülüklerimiz kapsamında saklanması gereken 
            bilgiler dışındaki tüm kişisel verilerinizi sileriz veya anonimleştiririz.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-darkGreen">7. Haklarınız</h2>
          <p className="mb-4 text-gray-700">
            Kişisel verilerinizle ilgili olarak aşağıdaki haklara sahipsiniz:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Bilgi Edinme Hakkı:</strong> Kişisel verilerinizin işlenip işlenmediğini öğrenme ve işleniyorsa buna ilişkin bilgi talep etme</li>
            <li><strong>Erişim Hakkı:</strong> Kişisel verilerinize erişim ve bunların bir kopyasını alma</li>
            <li><strong>Düzeltme Hakkı:</strong> Yanlış veya eksik kişisel verilerinizin düzeltilmesini isteme</li>
            <li><strong>Silme Hakkı:</strong> Belirli koşullar altında kişisel verilerinizin silinmesini isteme (unutulma hakkı)</li>
            <li><strong>İşleme Sınırlandırma Hakkı:</strong> Kişisel verilerinizin işlenmesini sınırlandırma</li>
            <li><strong>Veri Taşınabilirliği Hakkı:</strong> Kişisel verilerinizi yapılandırılmış, yaygın olarak kullanılan ve makine tarafından okunabilir bir formatta alma ve bunları başka bir veri sorumlusuna aktarma</li>
            <li><strong>İtiraz Hakkı:</strong> Kişisel verilerinizin işlenmesine itiraz etme</li>
            <li><strong>Otomatik Karar Alma Süreçlerine İtiraz Hakkı:</strong> Otomatik karar alma süreçlerine tabi olmama</li>
          </ul>
          <p className="mb-4 text-gray-700">
            Bu haklarınızı kullanmak için lütfen bizimle <a href="mailto:karvegoltd@gmail.com" className="text-blue-600 hover:underline">karvegoltd@gmail.com</a> adresinden iletişime geçin. Talebinizi aldıktan sonra 30 gün içinde yanıt vereceğiz.
          </p>
          <p className="mb-4 text-gray-700">
            Kişisel verilerinizin korunmasıyla ilgili endişeleriniz varsa ve bizimle doğrudan çözüme kavuşturamadıysanız, 
            Kişisel Verileri Koruma Kurumu'na şikayette bulunma hakkınız bulunmaktadır.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-darkGreen">8. Uluslararası Veri Transferleri</h2>
          <p className="mb-4 text-gray-700">
            KarVeGo olarak, sunucularımız ve veri işleme merkezlerimiz öncelikle Türkiye'de bulunmaktadır. Ancak, 
            bazı hizmet sağlayıcılarımız ve iş ortaklarımız yurt dışında bulunabilir, bu nedenle kişisel verileriniz 
            bazen Türkiye dışındaki ülkelere aktarılabilir.
          </p>
          <p className="mb-4 text-gray-700">
            Kişisel verilerinizi yalnızca yeterli düzeyde veri koruması sağlayan veya verilerinizin korunması için 
            uygun güvencelerin bulunduğu ülkelere aktarırız. Bu tür uluslararası transferlerde, verilerinizin korunmasını 
            sağlamak için Standart Sözleşme Maddeleri veya diğer yasal mekanizmaları kullanırız.
          </p>
          <p className="mb-4 text-gray-700">
            Uluslararası veri transferleri hakkında daha fazla bilgi edinmek isterseniz, lütfen bizimle iletişime geçin.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-darkGreen">9. Gizlilik Politikası Değişiklikleri</h2>
          <p className="mb-4 text-gray-700">
            Bu gizlilik politikasını zaman zaman güncelleyebiliriz. En güncel versiyonu web sitemizde yayınlayacağız.
            Önemli değişiklikler yaptığımızda, kayıtlı e-posta adresinize bildirim göndereceğiz.
          </p>
          <p className="mb-4 text-gray-700">
            Gizlilik politikamızdaki değişiklikler, web sitemizde yayınlandıktan sonra geçerli olacaktır. Bu nedenle, 
            düzenli olarak bu sayfayı ziyaret ederek güncellemeleri kontrol etmenizi öneririz.
          </p>
          <p className="mb-4 text-gray-700">
            Değiştirilmiş gizlilik politikasını kabul etmiyorsanız, hizmetlerimizi kullanmayı durdurmalısınız. 
            Değişikliklerden sonra hizmetlerimizi kullanmaya devam etmeniz, güncellenmiş gizlilik politikasını 
            kabul ettiğiniz anlamına gelecektir.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-darkGreen">10. İletişim</h2>
          <p className="text-gray-700 mb-4">
            Bu gizlilik politikası hakkında sorularınız veya endişeleriniz varsa, lütfen bizimle aşağıdaki iletişim 
            bilgilerinden ulaşın:
          </p>
          <div className="space-y-2 text-gray-700">
            <p><strong>Şirket:</strong> KarVeGo Ltd.</p>
            <p><strong>E-posta:</strong> <a href="mailto:karvegoltd@gmail.com" className="text-blue-600 hover:underline">karvegoltd@gmail.com</a></p>
            <p><strong>Telefon:</strong> 0212 123 45 67</p>
            <p><strong>Adres:</strong> İstanbul, Türkiye</p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-600">
          <p>Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</p>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy; 