import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/context/LanguageContext';

const AccessibilityPanel = dynamic(() => import('../Accessibility/AccessibilityPanel'), { ssr: false });
const ConsentPreferencesPanel = dynamic(() => import('../CookieConsent/ConsentPreferences'), { ssr: false });

const Footer: React.FC = () => {
   const { t } = useLanguage();
   const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
   const [showConsentPreferences, setShowConsentPreferences] = useState(false);

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
                     <p>office@seo-agent.net</p>
                  </div>
               </div>

               {/* Product */}
               <div>
                  <h3 className="text-white font-semibold mb-4">{t('footerMenu.product')}</h3>
                  <ul className="space-y-2 text-sm">
                     <li><Link href="/#features" className="hover:text-white transition-colors">{t('nav.features')}</Link></li>
                     <li><Link href="/mcp-seo" className="hover:text-white transition-colors">{t('nav.mcpIntegration')}</Link></li>
                     <li><Link href="/seo-expert-skill" className="hover:text-white transition-colors">SEO Expert Skill</Link></li>
                     <li><a href="https://flowxtra.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('footerMenu.talentManagement')}</a></li>
                     <li><a href="https://flowxtra.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('footerMenu.ats')}</a></li>
                  </ul>
               </div>

               {/* Resources */}
               <div>
                  <h3 className="text-white font-semibold mb-4">{t('footerMenu.resources')}</h3>
                  <ul className="space-y-2 text-sm">
                     <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                     <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
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

            {/* Bottom bar */}
            <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
               <p className="text-sm text-neutral-400">
                  © 2026 SEO Agent by <a href="https://dpro.at" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Dpro GmbH</a>. All rights reserved.
               </p>

               <div className="flex items-center gap-4">
                  {/* Consent Preferences */}
                  <button
                     onClick={() => setShowConsentPreferences(true)}
                     className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors underline decoration-1 underline-offset-2"
                     aria-label="Consent Preferences"
                  >
                     <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                     <span>Consent Preferences</span>
                  </button>

                  {/* Accessibility Button */}
                  <button
                     onClick={() => setShowAccessibilityPanel(true)}
                     className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors underline decoration-1 underline-offset-2"
                     aria-label="Accessibility"
                  >
                     <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.5 6.5C13.5 7.328 12.828 8 12 8C11.172 8 10.5 7.328 10.5 6.5C10.5 5.672 11.172 5 12 5C12.828 5 13.5 5.672 13.5 6.5Z" fill="currentColor" />
                        <path d="M6.051 8.684C5.877 9.208 6.16 9.774 6.684 9.949C6.859 10.007 7.036 10.061 7.213 10.114C7.536 10.211 7.989 10.341 8.507 10.47C9.089 10.616 9.781 10.769 10.478 10.873C10.432 11.765 10.321 12.406 10.217 12.831L8.106 17.053C7.859 17.547 8.059 18.148 8.553 18.395C9.047 18.642 9.647 18.441 9.894 17.947L12 13.736L14.106 17.947C14.353 18.441 14.953 18.642 15.447 18.395C15.941 18.148 16.141 17.547 15.894 17.053L13.783 12.831C13.68 12.406 13.568 11.765 13.522 10.873C14.219 10.769 14.911 10.616 15.493 10.47C16.011 10.341 16.464 10.211 16.787 10.114C16.963 10.062 17.138 10.008 17.313 9.95C17.826 9.78 18.12 9.198 17.949 8.684C17.774 8.16 17.208 7.877 16.684 8.052C16.528 8.103 16.37 8.151 16.213 8.199C15.911 8.289 15.489 8.41 15.008 8.53C14.022 8.777 12.871 9 12 9C11.129 9 9.978 8.777 8.993 8.53C8.511 8.41 8.089 8.289 7.787 8.199C7.632 8.152 7.476 8.104 7.322 8.053C6.802 7.882 6.225 8.162 6.051 8.684Z" fill="currentColor" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M23 12C23 18.075 18.075 23 12 23C5.925 23 1 18.075 1 12C1 5.925 5.925 1 12 1C18.075 1 23 5.925 23 12ZM3.007 12C3.007 16.967 7.033 20.993 12 20.993C16.967 20.993 20.993 16.967 20.993 12C20.993 7.033 16.967 3.007 12 3.007C7.033 3.007 3.007 7.033 3.007 12Z" fill="currentColor" />
                     </svg>
                     <span>Accessibility</span>
                  </button>
               </div>
            </div>
         </div>

         {/* Accessibility Panel */}
         {showAccessibilityPanel && (
            <AccessibilityPanel onClose={() => setShowAccessibilityPanel(false)} />
         )}
         {/* Consent Preferences Panel */}
         {showConsentPreferences && (
            <ConsentPreferencesPanel onClose={() => setShowConsentPreferences(false)} />
         )}
      </footer>
   );
};

export default Footer;
