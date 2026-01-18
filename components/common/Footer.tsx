import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

const Footer: React.FC = () => {
   const { t } = useLanguage();

   return (
      <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
               {/* Company Info */}
               <div>
                  <div className="flex items-center space-x-2 mb-4">
                     <Image src="/dpro_logo.png" alt="SEO Agent" width={32} height={32} className="h-8 w-8" />
                     <span className="text-lg font-bold text-white">SEO Agent</span>
                  </div>
                  <div className="text-sm text-neutral-400">
                     <p>Dpro GmbH</p>
                     <p>Wipplingerstraße 20/18</p>
                     <p>1010 Wien, Austria</p>
                     <p className="mt-2">+43 676 905 4441</p>
                     <p>office@dpro.at</p>
                  </div>
               </div>

               {/* Product */}
               <div>
                  <h3 className="text-white font-semibold mb-4">{t('footerMenu.product')}</h3>
                  <ul className="space-y-2 text-sm">
                     <li><Link href="/#features" className="hover:text-white transition-colors">{t('nav.features')}</Link></li>
                     <li><Link href="/mcp-seo" className="hover:text-white transition-colors">{t('nav.mcpIntegration')}</Link></li>
                     <li><Link href="/profile/api-keys" className="hover:text-white transition-colors">API & Webhooks</Link></li>
                     <li><a href="https://flowxtra.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('footerMenu.talentManagement')}</a></li>
                     <li><a href="https://flowxtra.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('footerMenu.ats')}</a></li>
                  </ul>
               </div>

               {/* Resources */}
               <div>
                  <h3 className="text-white font-semibold mb-4">{t('footerMenu.resources')}</h3>
                  <ul className="space-y-2 text-sm">
                     <li><span className="text-neutral-400">{t('footerMenu.documentation')}</span></li>
                     <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
                  </ul>
               </div>

               {/* Legal */}
               <div>
                  <h3 className="text-white font-semibold mb-4">{t('footerMenu.legal')}</h3>
                  <ul className="space-y-2 text-sm">
                     <li><Link href="/imprint" locale="en" className="hover:text-white transition-colors">Imprint</Link></li>
                     <li><Link href="/privacy" locale="en" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                     <li><Link href="/terms" locale="en" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  </ul>
               </div>
            </div>

            <div className="border-t border-neutral-800 pt-8 text-center text-sm text-neutral-400">
               <p>© 2026 SEO Agent by <a href="https://dpro.at" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Dpro GmbH</a>. All rights reserved.</p>
            </div>
         </div>
      </footer>
   );
};

export default Footer;
