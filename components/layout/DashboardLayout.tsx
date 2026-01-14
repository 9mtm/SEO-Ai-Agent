import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  BarChart3,
  Globe,
  Search,
  Menu,
  X,
  Users,
  LineChart,
  Bot,
  Settings,
} from 'lucide-react';
import AccountMenu from '../common/AccountMenu';
import DomainSelector from '../domains/DomainSelector';

interface DashboardLayoutProps {
  children: ReactNode;
  selectedLang?: 'en' | 'de';
  onLanguageChange?: (lang: 'en' | 'de') => void;
  domains?: DomainType[];
  showAddModal?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  selectedLang = 'en',
  onLanguageChange,
  domains = [],
  showAddModal = () => { }
}) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentSlug = router.query.slug as string;
  const currentDomain = domains.find(d => d.slug === currentSlug) || null;

  const translations = {
    en: {
      dashboard: 'Dashboard',
      domains: 'Domains',
      keywords: 'Keywords',
      settings: 'Settings',
      logout: 'Logout',
      account: 'Account'
    },
    de: {
      dashboard: 'Dashboard',
      domains: 'Domains',
      keywords: 'Keywords',
      settings: 'Einstellungen',
      logout: 'Abmelden',
      account: 'Konto'
    }
  };

  const t = translations[selectedLang];

  const navigation: { name: string; href: string; icon: any }[] = [];

  if (currentDomain) {
    navigation.push(
      { name: 'Tracking', href: `/domain/${currentDomain.slug}`, icon: BarChart3 },
      { name: 'Competitors', href: `/domain/${currentDomain.slug}/competitors`, icon: Users },
      { name: 'Discover', href: `/domain/console/${currentDomain.slug}`, icon: Search },
      { name: 'Insight', href: `/domain/insight/${currentDomain.slug}`, icon: LineChart },
      { name: 'Seo Agent', href: `/domain/agent/${currentDomain.slug}`, icon: Bot },
      { name: 'Settings', href: `/domain/settings/${currentDomain.slug}`, icon: Settings }
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-neutral-200 z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200">
            <Link href="/domains" className="flex items-center space-x-2">
              <BarChart3 className="h-7 w-7 text-blue-600" />
              <span className="text-lg font-bold text-neutral-900">SEO AI Agent</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-neutral-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = router.pathname === item.href ||
                (item.href.includes('?settings') && router.query.settings);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-neutral-200">
            <DomainSelector
              domains={domains}
              currentDomain={currentDomain}
              showAddModal={showAddModal}
            />
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:flex-none"></div>

            <div className="flex items-center gap-3">


              {/* Account Menu in Header - Using the same component */}
              <AccountMenu
                showAddModal={showAddModal}
                domains={domains}
                currentDomain={currentDomain}
                selectedLang={selectedLang}
                onLanguageChange={onLanguageChange}
              />
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
