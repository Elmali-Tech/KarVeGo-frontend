import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        {/* Ana Footer İçeriği */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
          {/* KarVeGo Bölümü */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-darkGreen bg-opacity-10 rounded-lg">
                <Package className="w-6 h-6 text-darkGreen" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">KarVeGo</h2>
            </div>
            <p className="text-gray-600 mb-4 font-medium">
              Sipariş ve Kargo Takip Platformu
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              KarVeGo, online satış yapan işletmelerin sipariş ve kargo takip süreçlerini tek platform üzerinden yönetmelerini sağlayarak zaman ve maliyet tasarrufu sunar.
            </p>
            
            {/* Sosyal Medya İkonları */}
            <div className="flex space-x-4 pt-2">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all hover:bg-darkGreen hover:text-white text-darkGreen"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer" 
                className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all hover:bg-darkGreen hover:text-white text-darkGreen"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all hover:bg-darkGreen hover:text-white text-darkGreen"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer" 
                className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all hover:bg-darkGreen hover:text-white text-darkGreen"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {/* Hızlı Erişim Bölümü */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-200">
              Hızlı Bağlantılar
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-600 hover:text-darkGreen transition-colors group flex items-center">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Ana Sayfa</span>
                  <ExternalLink className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/siparisler" className="text-gray-600 hover:text-darkGreen transition-colors group flex items-center">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Siparişler</span>
                  <ExternalLink className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/kargo-fiyatlari" className="text-gray-600 hover:text-darkGreen transition-colors group flex items-center">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Kargo Fiyatları</span>
                  <ExternalLink className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Bilgi Sayfaları */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-200">
              Bilgi Sayfaları
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/sikca-sorulan-sorular" className="text-gray-600 hover:text-darkGreen transition-colors group flex items-center">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Sık Sorulan Sorular</span>
                  <ExternalLink className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link to="/gizlilik-sozlesmesi" className="text-gray-600 hover:text-darkGreen transition-colors group flex items-center">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Gizlilik Sözleşmesi</span>
                  <ExternalLink className="ml-1 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>
          
          {/* İletişim Bölümü */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-200">
              İletişim
            </h3>
            <ul className="space-y-4">
              <li className="text-gray-600 flex">
                <Mail className="w-5 h-5 text-darkGreen shrink-0 mt-0.5" />
                <div className="ml-3">
                  <span className="block text-xs text-gray-500 mb-1">E-posta:</span>
                  <a href="mailto:karvegoltd@gmail.com" className="hover:text-darkGreen transition-colors">
                    karvegoltd@gmail.com
                  </a>
                </div>
              </li>
              <li className="text-gray-600 flex">
                <Phone className="w-5 h-5 text-darkGreen shrink-0 mt-0.5" />
                <div className="ml-3">
                  <span className="block text-xs text-gray-500 mb-1">Telefon:</span>
                  <a href="tel:+902121234567" className="hover:text-darkGreen transition-colors">
                    0212 123 45 67
                  </a>
                </div>
              </li>
              <li className="text-gray-600 flex">
                <MapPin className="w-5 h-5 text-darkGreen shrink-0 mt-0.5" />
                <div className="ml-3">
                  <span className="block text-xs text-gray-500 mb-1">Adres:</span>
                  <span>İstanbul, Türkiye</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Alt Bölüm - Telif Hakkı */}
        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-center text-gray-500 text-sm">
            &copy; {currentYear} KarVeGo. Tüm hakları saklıdır.
          </p>
          
          {/* Alt Bağlantılar */}
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/gizlilik-sozlesmesi" className="text-sm text-gray-500 hover:text-darkGreen transition-colors">
              Gizlilik
            </Link>
            <Link to="/sikca-sorulan-sorular" className="text-sm text-gray-500 hover:text-darkGreen transition-colors">
              SSS
            </Link>
            <a href="mailto:karvegoltd@gmail.com" className="text-sm text-gray-500 hover:text-darkGreen transition-colors">
              Destek
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 