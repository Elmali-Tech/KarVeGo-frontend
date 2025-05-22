import React, { useState } from "react";
import Layout from "../components/layout/Layout";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ: React.FC = () => {
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Genel");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleItem = (index: number) => {
    setActiveItem(activeItem === index ? null : index);
  };

  const faqItems: FAQItem[] = [
    {
      category: "Genel",
      question: "KarVeGo nedir?",
      answer: "KarVeGo, online satış yapan işletmelerin sipariş ve kargo takip süreçlerini tek bir platform üzerinden yönetebilmesini sağlayan bir hizmettir. E-ticaret platformlarınızdan gelen siparişleri entegre eder, kargo şirketleriyle iletişimi otomatikleştirir ve müşterilerinize gerçek zamanlı takip imkanı sunar."
    },
    {
      category: "Genel",
      question: "KarVeGo'yu kullanmak için ne gibi teknik gereksinimler var?",
      answer: "KarVeGo tamamen web tabanlı bir platform olduğu için herhangi bir kurulum gerektirmez. Güncel bir internet tarayıcısı (Chrome, Firefox, Safari, Edge) ve internet bağlantısı yeterlidir. Mobil cihazlardan da erişilebilir ve kullanılabilir."
    },
    {
      category: "Genel",
      question: "KarVeGo kullanmak için aylık ne kadar ödeme yapmam gerekiyor?",
      answer: "KarVeGo farklı ihtiyaçlara yönelik çeşitli abonelik paketleri sunmaktadır. Başlangıç paketimiz aylık 199 TL'den başlamakta olup, işletme büyüklüğünüze ve aylık sipariş hacminize göre farklı paketlerimiz bulunmaktadır. Ayrıca, yeni başlayan işletmeler için 14 günlük ücretsiz deneme süresi sunuyoruz. Güncel fiyatlandırma detayları için web sitemizi ziyaret edebilir veya satış ekibimizle iletişime geçebilirsiniz."
    },
    {
      category: "Genel",
      question: "Hangi e-ticaret platformlarıyla entegrasyon sağlıyorsunuz?",
      answer: "Şu anda Shopify, WooCommerce, Magento, Trendyol, Hepsiburada, N11, GittiGidiyor, Amazon, Etsy, PrestaShop, OpenCart ve daha birçok popüler e-ticaret platformuyla entegrasyon sağlıyoruz. Özel API entegrasyonları için ise ekibimizle iletişime geçebilirsiniz. Entegrasyonlarımızı sürekli olarak genişletmekteyiz."
    },
    {
      category: "Hesap",
      question: "Nasıl kayıt olurum?",
      answer: "Kayıt olmak için web sitemizin ana sayfasındaki 'Ücretsiz Başlangıç' butonuna tıklayabilir veya üst menüdeki 'Kayıt Ol' seçeneğini kullanabilirsiniz. Gerekli bilgileri doldurduktan sonra e-posta adresinize gönderilen aktivasyon bağlantısını tıklayarak hesabınızı aktifleştirebilirsiniz."
    },
    {
      category: "Hesap",
      question: "Şifremi unuttum, ne yapmalıyım?",
      answer: "Şifrenizi unuttuysanız, giriş sayfasındaki 'Şifremi Unuttum' bağlantısına tıklayarak e-posta adresinizi girmeniz yeterlidir. Size şifre sıfırlama bağlantısı içeren bir e-posta göndereceğiz. Bu bağlantıya tıklayarak yeni bir şifre oluşturabilirsiniz. E-postayı alamadıysanız, spam/gereksiz klasörünüzü kontrol edin veya karvegoltd@gmail.com adresine e-posta göndererek destek alabilirsiniz."
    },
    {
      category: "Hesap",
      question: "Bakiye yüklemesi nasıl yapılır?",
      answer: "KarVeGo hesabınıza bakiye yüklemek için, panel üzerindeki 'Bakiye Yükle' butonuna tıklayabilirsiniz. Havale/EFT ile ödeme yapabilir veya kredi kartı bilgilerinizi girerek anında bakiye yükleyebilirsiniz. Havale/EFT ödemeleriniz, dekont yüklemenizin ardından ortalama 1 iş günü içinde hesabınıza tanımlanır. Bakiye yüklemeleriyle ilgili sorunlarınız için 'Bakiye Taleplerim' sayfasından destek alabilirsiniz."
    },
    {
      category: "Hesap",
      question: "Hesabımı nasıl silerim?",
      answer: "Hesabınızı silmek için, 'Ayarlar > Hesap Bilgileri' sayfasına giderek en altta bulunan 'Hesabımı Sil' butonuna tıklayabilirsiniz. İşlemi onaylamanızın ardından hesabınız ve verileriniz sistemden silinecektir. Ancak yasal sebeplerden dolayı fatura bilgileri ve finansal işlemler gibi bazı veriler en az 5 yıl süreyle muhafaza edilecektir. Bu işlem geri alınamaz, lütfen dikkatli olun."
    },
    {
      category: "Entegrasyon",
      question: "E-ticaret platformumla nasıl entegre ederim?",
      answer: "Entegrasyon işlemi için 'Ayarlar > Entegrasyon' sayfasına gidin ve entegre etmek istediğiniz platformu seçin. Her platform için özel hazırlanmış adım adım talimatları takip ederek entegrasyonu tamamlayabilirsiniz. Çoğu platform için API anahtarı veya OAuth kimlik doğrulaması gereklidir. Entegrasyon konusunda zorluk yaşarsanız, canlı destek hattımız size yardımcı olacaktır."
    },
    {
      category: "Entegrasyon",
      question: "Shopify mağazamı bağladım ama siparişler gelmiyor, ne yapmalıyım?",
      answer: "Bu durumun birkaç nedeni olabilir. İlk olarak, 'Ayarlar > Entegrasyon' sayfasına giderek Shopify bağlantınızın aktif olduğundan emin olun. Ayrıca Shopify panelinden gerekli izinlerin verildiğini kontrol edin. Webhook ayarlarının doğru yapılandırılmış olduğunu doğrulayın. Siparişlerin senkronizasyonu için 'Siparişleri Senkronize Et' butonunu kullanabilirsiniz. Sorun devam ederse, müşteri destek ekibimizle iletişime geçerek yardım alabilirsiniz."
    },
    {
      category: "Entegrasyon",
      question: "Birden fazla e-ticaret platformu bağlayabilir miyim?",
      answer: "Evet, KarVeGo hesabınızla birden fazla e-ticaret platformunu entegre edebilirsiniz. Her platform için ayrı entegrasyon süreci tamamlanmalıdır. Standart paketimizde 3 e-ticaret platformu entegrasyonu dahildir. Premium ve kurumsal paketlerimizde sınırsız entegrasyon imkanı bulunmaktadır. Tüm platformlardan gelen siparişlerinizi tek bir panelden yönetebilir, sipariş kaynağına göre filtreleme yapabilirsiniz."
    },
    {
      category: "Entegrasyon",
      question: "E-ticaret platformuma özel entegrasyon mümkün mü?",
      answer: "Evet, standart entegrasyonlarımızın dışında, özel API gereksinimleri veya henüz desteklemediğimiz e-ticaret platformları için özel entegrasyon geliştirme hizmeti sunuyoruz. Bu hizmet için lütfen karvegoltd@gmail.com adresine detaylı bilgi gönderin veya satış ekibimizle iletişime geçin. Özel entegrasyon gereksinimleri, iş modelinize ve platformunuza bağlı olarak ek ücrete tabi olabilir."
    },
    {
      category: "Kargo",
      question: "Hangi kargo şirketleriyle çalışıyorsunuz?",
      answer: "Türkiye'deki tüm büyük kargo şirketleriyle (Yurtiçi Kargo, Aras Kargo, MNG Kargo, PTT Kargo, Sürat Kargo, UPS, DHL, FedEx vb.) entegrasyonumuz bulunmaktadır. Ayrıca uluslararası gönderiler için de DHL, UPS, FedEx ve TNT gibi global kargo firmaları ile çalışıyoruz. Her kargo şirketi için özel anlaşma şartlarınızı sisteme tanımlayabilir ve en uygun fiyatlı kargo seçeneklerini otomatik olarak hesaplatabilirsiniz."
    },
    {
      category: "Kargo",
      question: "Kargo ücreti hesaplaması nasıl yapılıyor?",
      answer: "Kargo ücretleri, tercih ettiğiniz kargo şirketinin fiyat politikasına ve sizin anlaşma şartlarınıza göre hesaplanır. Sistem, paketin ağırlığı, boyutları, gönderim ve teslimat adresleri gibi faktörleri dikkate alarak en güncel fiyatlandırmayı sunar. Kargo şirketleriyle özel anlaşmalarınız varsa, bu indirimleri 'Ayarlar > Kargo Anlaşmalarım' bölümünden sisteme tanımlayabilirsiniz. Ayrıca, desi ve ağırlık hesaplamaları için otomatik formüller tanımlayabilir veya sabit fiyat belirleyebilirsiniz."
    },
    {
      category: "Kargo",
      question: "Kargo etiketlerini nasıl yazdırabilirim?",
      answer: "Kargo etiketlerini yazdırmak için 'Siparişler' sayfasında ilgili siparişi seçip 'Kargo Etiketi Oluştur' butonuna tıklayabilirsiniz. Sistem otomatik olarak seçtiğiniz kargo firması için uygun formatta etiket oluşturacaktır. Etiketleri tekli veya toplu olarak yazdırabilirsiniz. Termal yazıcı kullanıyorsanız, 'Ayarlar > Barkod Tasarımı' bölümünden etiket boyutlarını ve içeriğini özelleştirebilirsiniz. Etiketler PDF formatında indirilir ve standart yazıcılarla yazdırılabilir."
    },
    {
      category: "Kargo",
      question: "Siparişlerin kargo durumunu müşterilerim nasıl takip edebilir?",
      answer: "Siparişin kargoya verilmesiyle birlikte sistem otomatik olarak müşterilerinize takip numarası ve takip bağlantısı içeren bir bildirim e-postası gönderir. Ayrıca, kendi web sitenize entegre edebileceğiniz bir takip arayüzü de sunuyoruz. Bu arayüz, müşterilerinizin sipariş numarası veya e-posta adresiyle kargo durumunu canlı olarak takip etmelerine olanak tanır. SMS bildirimleri için premium paketimizi tercih edebilirsiniz."
    },
    {
      category: "Raporlama",
      question: "Hangi raporlama özellikleri bulunuyor?",
      answer: "KarVeGo geniş bir raporlama altyapısı sunar. Sipariş istatistikleri, kargo performansı, teslimat süreleri, bölgesel dağılım, müşteri analizleri gibi pek çok raporu gerçek zamanlı olarak görüntüleyebilirsiniz. Raporları Excel, PDF veya CSV formatında dışa aktarabilir, otomatik e-posta raporları oluşturabilirsiniz. Ayrıca özel panolar (dashboards) oluşturarak izlemek istediğiniz metrikleri tek ekranda görebilirsiniz."
    },
    {
      category: "Raporlama",
      question: "Özel raporlar oluşturabilir miyim?",
      answer: "Evet, KarVeGo'nun gelişmiş raporlama modülünde kendi özel raporlarınızı oluşturabilirsiniz. 'Raporlar > Özel Rapor Oluştur' bölümünden tarih aralığı, sipariş kaynağı, kargo firması, ödeme yöntemi gibi çeşitli filtreleri kullanarak ihtiyacınıza özel raporlar hazırlayabilirsiniz. Premium ve kurumsal paket kullanıcıları, API üzerinden veri çekerek kendi BI (Business Intelligence) araçlarıyla entegrasyon yapabilirler."
    },
    {
      category: "Fatura",
      question: "KarVeGo kullanımı için nasıl faturalandırılıyorum?",
      answer: "KarVeGo, seçtiğiniz abonelik planına göre aylık veya yıllık olarak faturalandırılır. Faturalar, abonelik başlangıç tarihinizde otomatik olarak oluşturulur ve kayıtlı e-posta adresinize gönderilir. Yıllık ödemelerde %20 indirim sunuyoruz. Tüm faturalar elektronik olarak düzenlenir ve e-arşiv fatura olarak iletilir. Ayrıca, hesabınızın 'Faturalar' bölümünden geçmiş faturalarınıza istediğiniz zaman ulaşabilirsiniz."
    },
    {
      category: "Fatura",
      question: "Ödeme yöntemimi nasıl değiştirebilirim?",
      answer: "Ödeme yönteminizi değiştirmek için 'Ayarlar > Ödeme Bilgileri' sayfasını ziyaret edin. Burada mevcut ödeme yönteminizi görüntüleyebilir ve 'Ödeme Yöntemini Değiştir' butonuna tıklayarak yeni bir ödeme yöntemi ekleyebilirsiniz. Kredi kartı, banka havalesi/EFT veya bakiye ile ödeme seçeneklerinden birini tercih edebilirsiniz. Otomatik yenileme özelliğini de bu sayfadan yönetebilirsiniz."
    },
    {
      category: "Fatura",
      question: "Fatura adresimi nasıl güncellerim?",
      answer: "Fatura adresinizi güncellemek için 'Ayarlar > Hesap Bilgileri' sayfasına gidin ve 'Fatura Bilgileri' bölümünü düzenleyin. Burada şirket adı, vergi dairesi, vergi numarası ve adres bilgilerinizi güncelleyebilirsiniz. Fatura bilgilerinizde yapacağınız değişiklikler, bir sonraki fatura döneminden itibaren geçerli olacaktır. Cari dönem için fatura düzeltme taleplerinizi karvegoltd@gmail.com adresine iletebilirsiniz."
    },
    {
      category: "Destek",
      question: "Teknik destek nasıl alabilirim?",
      answer: "Teknik destek için birkaç kanal sunuyoruz: 1) Panel içindeki canlı destek butonu ile anlık yardım alabilirsiniz (mesai saatleri içinde), 2) karvegoltd@gmail.com adresine e-posta gönderebilirsiniz, 3) 0212 123 45 67 numaralı telefondan müşteri hizmetlerimize ulaşabilirsiniz, 4) Bilgi bankamızdaki makalelerden faydalanabilirsiniz. Premium ve kurumsal paket müşterilerimize 7/24 telefon desteği ve öncelikli yanıt hizmeti sunuyoruz."
    },
    {
      category: "Destek",
      question: "KarVeGo'yu kullanmayı öğrenmek için eğitim var mı?",
      answer: "Evet, yeni başlayan kullanıcılarımız için ücretsiz canlı eğitim webinarları düzenliyoruz. Ayrıca YouTube kanalımızda detaylı eğitim videoları, bilgi bankamızda ise adım adım rehberler bulabilirsiniz. Kurumsal müşterilerimiz için özel eğitim oturumları düzenliyoruz. Eğitim takvimimizi görmek ve kayıt olmak için 'Destek > Eğitimler' bölümünü ziyaret edebilirsiniz."
    }
  ];

  const categories = Array.from(new Set(faqItems.map(item => item.category)));

  // Filtreleme için hem kategori hem de arama sorgusunu kullan
  const filteredItems = faqItems.filter(item => {
    const matchesCategory = item.category === activeCategory;
    const matchesSearch = searchQuery === "" || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-darkGreen mb-6">Sık Sorulan Sorular</h1>
        
        <div className="mb-8">
          {/* Arama kutusu */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-darkGreen focus:border-darkGreen bg-white shadow-sm"
              placeholder="Sorunuzu arayın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Kategori butonları */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? "bg-darkGreen text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <button
                  className="w-full px-6 py-4 flex justify-between items-center focus:outline-none"
                  onClick={() => toggleItem(index)}
                >
                  <span className="font-medium text-left text-gray-800">
                    {item.question}
                  </span>
                  {activeItem === index ? (
                    <ChevronUp className="h-5 w-5 text-darkGreen" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                
                {activeItem === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Aramanızla eşleşen sonuç bulunamadı.</p>
              <button 
                className="mt-4 text-darkGreen hover:underline"
                onClick={() => setSearchQuery("")}
              >
                Aramayı temizle
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-darkGreen">Sorunuza cevap bulamadınız mı?</h2>
          <p className="mb-6 text-gray-700">
            Eğer aradığınız bilgiyi burada bulamadıysanız, lütfen müşteri destek ekibimizle iletişime geçin.
            Size en kısa sürede yardımcı olmak için buradayız.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:karvegoltd@gmail.com"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-darkGreen hover:bg-darkGreen/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkGreen"
            >
              E-posta Gönder
            </a>
            <a
              href="tel:+902121234567"
              className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-darkGreen"
            >
              Bizi Arayın: 0212 123 45 67
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ; 