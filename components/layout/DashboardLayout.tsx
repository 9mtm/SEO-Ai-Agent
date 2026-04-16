import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  CreditCard,
  User,
  PenTool,
  Key,
  Bell,
  Building2,
  Shield,
  Gift,
} from 'lucide-react';
import AccountMenu from '../common/AccountMenu';
import WorkspaceIndicator from '../common/WorkspaceIndicator';
import { useWorkspaceRole } from '../../hooks/useWorkspaceRole';
import DomainSelector from '../domains/DomainSelector';
import SetupProgress from '../setup/SetupProgress';
import { useLanguage } from '../../context/LanguageContext';

interface DashboardLayoutProps {
  children: ReactNode;
  selectedLang?: 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'zh' | 'nl' | 'tr' | 'ar';
  onLanguageChange?: (lang: 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'zh' | 'nl' | 'tr' | 'ar') => void;
  domains?: DomainType[];
  hideSidebar?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  selectedLang,
  onLanguageChange,
  domains = [],
  hideSidebar = false,
}) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();
  const { canManage } = useWorkspaceRole();

  const currentSlug = router.query.slug as string;
  // Try to find domain by slug, and if not found, try by domain name (for backward compatibility).
  // On non-domain pages (e.g. /setup, /), fall back to the first available domain so the user
  // always sees the main sidebar (Insight/Discover/Tracking/Posts/Settings).
  const currentDomain = domains.find(d => d.slug === currentSlug) ||
    domains.find(d => d.domain === currentSlug) ||
    (!router.pathname.startsWith('/profile') && domains.length > 0 ? domains[0] : null);

  const navigation: { name: string; href: string; icon: any }[] = [];

  if (currentDomain) {
    navigation.push(
      { name: t('sidebar.insight'), href: `/domain/insight/${currentDomain.slug}`, icon: LineChart },
      { name: t('sidebar.discover'), href: `/domain/console/${currentDomain.slug}`, icon: Search },
      { name: t('sidebar.tracking'), href: `/tracking/${currentDomain.slug}`, icon: BarChart3 },
      /* { name: t('sidebar.agent'), href: `/domain/agent/${currentDomain.slug}`, icon: Bot }, */
      { name: t('sidebar.posts'), href: `/domain/posts/${currentDomain.slug}`, icon: PenTool },
      { name: t('sidebar.settings'), href: `/domain/settings/${currentDomain.slug}`, icon: Settings }
    );
  } else if (router.pathname.startsWith('/profile')) {
    // Profile sidebar — trimmed for team members (non-owners).
    // Everyone sees: Profile, Notifications, Connected Apps.
    // Owners also see: Workspaces, Team, Search Console, Billing, Scraper.
    navigation.push({ name: t('sidebar.profile'), href: '/profile', icon: User });
    if (canManage) {
      navigation.push(
        { name: t('sidebar.domains'), href: '/profile/domains', icon: Globe },
        { name: t('sidebar.workspaces'), href: '/profile/workspaces', icon: Building2 },
        { name: t('sidebar.teamMembers'), href: '/profile/team', icon: Users },
        { name: t('sidebar.searchConsole'), href: '/profile/search-console', icon: Search }
      );
    }
    navigation.push({ name: t('sidebar.notifications'), href: '/profile/notifications', icon: Bell });
    if (canManage) {
      navigation.push({ name: t('sidebar.billing'), href: '/profile/billing', icon: CreditCard });
    }
    navigation.push({ name: t('sidebar.referrals'), href: '/profile/referrals', icon: Gift });
    navigation.push({ name: t('sidebar.connectedApps'), href: '/profile/oauth-apps', icon: Shield });
    if (canManage) {
      navigation.push({ name: t('sidebar.scraper'), href: '/profile/scraper', icon: Settings });
    }
  } else {
    // Default sidebar for home, /setup and other top-level pages
    navigation.push({ name: t('sidebar.myDomains'), href: '/', icon: Globe });
    if (canManage) {
      navigation.push({ name: t('sidebar.setup'), href: '/setup', icon: Settings });
    }
    navigation.push({ name: t('sidebar.profile'), href: '/profile', icon: User });
    if (canManage) {
      navigation.push(
        { name: t('sidebar.workspaces'), href: '/profile/workspaces', icon: Building2 },
        { name: t('sidebar.teamMembers'), href: '/profile/team', icon: Users },
        { name: t('sidebar.billing'), href: '/profile/billing', icon: CreditCard }
      );
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {sidebarOpen && !hideSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {!hideSidebar && (
        <aside
          className={`
            fixed top-0 left-0 h-full w-64 bg-white border-r border-neutral-200 z-50
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-5">
              <Link
                href={currentDomain ? `/domain/insight/${currentDomain.slug}` : (domains.length > 0 ? `/domain/insight/${domains[0].slug}` : '/')}
                className="flex items-center gap-3"
              >
                <Image src="/dpro_logo.png" alt="Dpro" width={32} height={32} className="h-8 w-8" />
                <span className="text-lg font-semibold text-neutral-900">SEO AI Agent</span>
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

            {/* Setup Progress Widget */}
            <div className="px-3 mb-2">
              <SetupProgress />
            </div>

            <div className="p-4 border-t border-neutral-200">
              <DomainSelector
                domains={domains}
                currentDomain={currentDomain}
              />
            </div>
          </div>
        </aside>
      )}

      <div className={hideSidebar ? "" : "lg:pl-64"}>
        <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {!hideSidebar && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}

            {hideSidebar && (
              <Link
                href="/"
                className="flex items-center gap-3"
              >
                <Image src="/dpro_logo.png" alt="Dpro" width={32} height={32} className="h-8 w-8" />
                <span className="text-lg font-semibold text-neutral-900">SEO AI Agent</span>
              </Link>
            )}

            <div className="flex items-center gap-3 ml-4">
              {!hideSidebar && <WorkspaceIndicator />}
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center gap-3">
              {/* Account Menu in Header - Using the same component */}
              <AccountMenu
                domains={domains}
                currentDomain={currentDomain}
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
