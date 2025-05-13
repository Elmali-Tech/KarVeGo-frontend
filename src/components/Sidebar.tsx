import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Box, 
  Users, 
  Settings, 
  DollarSign, 
  LayoutDashboard,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  isAdmin: boolean;
  isSettingsPage: boolean;
}

export default function Sidebar({ isAdmin, isSettingsPage }: SidebarProps) {
  const [expandedSettings, setExpandedSettings] = React.useState(isSettingsPage);
  const settingsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setExpandedSettings(isSettingsPage);
  }, [isSettingsPage]);

  const toggleSettingsMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setExpandedSettings(!expandedSettings);
  };

  return (
    <div className="w-full">
      <nav className="space-y-2 bg-white rounded-lg">
        {isAdmin && (
          <MainNavLink href="/admin" icon={<LayoutDashboard className="w-5 h-5" />}>
            Admin Paneli
          </MainNavLink>
        )}
        <MainNavLink href="/siparisler" icon={<FileText className="w-5 h-5" />}>
          Siparişler
        </MainNavLink>
        <MainNavLink href="/urunler" icon={<Box className="w-5 h-5" />}>
          Ürünler
        </MainNavLink>
        <MainNavLink href="/musteriler" icon={<Users className="w-5 h-5" />}>
          Müşteriler
        </MainNavLink>
        <div className="relative">
          <MainNavLink 
            href="/ayarlar" 
            icon={<Settings className="w-5 h-5" />}
            onClick={toggleSettingsMenu}
            showChevron={true}
            isExpanded={expandedSettings}
          >
            Ayarlar
          </MainNavLink>
          
          {/* Settings Sub-Navigation */}
          <div 
            ref={settingsRef}
            className={`mt-1 ml-4 pl-2 border-l border-gray-200 space-y-1 transition-all duration-300 ${
              expandedSettings ? 'block' : 'hidden'
            }`}
          >
            <SubNavLink href="/ayarlar/hesap-bilgileri">
              Hesap Bilgileri
            </SubNavLink>
            <SubNavLink href="/ayarlar/gonderici-profili">
              Gönderici Profili
            </SubNavLink>
            <SubNavLink href="/ayarlar/adreslerim">
              Adreslerim
            </SubNavLink>
            <SubNavLink href="/ayarlar/entegrasyon">
              Entegrasyon / Uygulama
            </SubNavLink>
            <SubNavLink href="/ayarlar/anlasmam">
              Kendi Anlaşmamı Ekle
            </SubNavLink>
            <SubNavLink href="/ayarlar/barkod-ayarlari">
              Barkod Ayarları
            </SubNavLink>
            <SubNavLink href="/ayarlar/sifre-degistir">
              Şifre Değiştir
            </SubNavLink>
          </div>
        </div>
        <MainNavLink href="/kargo-fiyatlari" icon={<DollarSign className="w-5 h-5" />}>
          Kargo Fiyatları
        </MainNavLink>
      </nav>
    </div>
  );
}

interface MainNavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  showChevron?: boolean;
  isExpanded?: boolean;
}

function MainNavLink({ href, icon, children, onClick, showChevron = false, isExpanded = false }: MainNavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === href || location.pathname.startsWith(`${href}/`);
  
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-lightGreen bg-opacity-10 text-darkGreen'
          : 'text-gray-600 hover:bg-gray-50 hover:text-darkGreen'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={isActive ? 'text-darkGreen' : 'text-gray-400'}>
          {icon}
        </span>
        <span>{children}</span>
      </div>
      {showChevron && (
        isExpanded ? 
          <ChevronDown className="h-4 w-4 text-gray-400" /> : 
          <ChevronRight className="h-4 w-4 text-gray-400" />
      )}
    </Link>
  );
}

interface SubNavLinkProps {
  href: string;
  children: React.ReactNode;
}

function SubNavLink({ href, children }: SubNavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === href;
  
  return (
    <Link
      to={href}
      className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'text-darkGreen bg-lightGreen bg-opacity-10'
          : 'text-gray-600 hover:text-darkGreen hover:bg-gray-50'
      }`}
    >
      {children}
    </Link>
  );
} 