import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

const AIIntegrationsShowcase: React.FC = () => {
  const { t } = useLanguage();

  const aiModels = [
    {
      name: 'ChatGPT',
      models: ['GPT-5.2', 'GPT-4.1'],
      icon: '/icon/chatgpt-logo.svg',
      available: true,
    },
    {
      name: 'Claude',
      models: ['3.5 Sonnet', '3 Opus'],
      icon: '/icon/claude-logo.svg',
      available: true,
    },
    {
      name: 'Gemini',
      models: ['2.0 Flash', '1.5 Pro'],
      icon: '/icon/gemini-logo.svg',
      available: true,
    },
    {
      name: 'Perplexity',
      models: ['Sonar'],
      icon: '/icon/perplexity-logo.svg',
      available: true,
    },
  ];

  const cmsPlatforms = [
    {
      name: 'WordPress',
      icon: '/icon/platfourms/wordPress_blue_logo.svg',
      available: true,
      comingSoon: false,
    },
    {
      name: 'Shopify',
      icon: '/icon/platfourms/shopify-icon.svg',
      available: false,
      comingSoon: true,
    },
    {
      name: 'Webflow',
      icon: '/icon/platfourms/webflow.svg',
      available: false,
      comingSoon: true,
    },
    {
      name: 'Wix',
      icon: '/icon/platfourms/wix.com_website_logo.svg',
      available: false,
      comingSoon: true,
    },
  ];

  const searchEngines = [
    {
      name: 'Google',
      icon: '/icon/google-logo.svg',
      available: true,
    },
    {
      name: 'Bing',
      icon: '/icon/bing-logo.svg',
      available: true,
    },
    {
      name: 'Yahoo',
      icon: '/icon/yahoo-logo.svg',
      available: true,
    },
    {
      name: 'DuckDuckGo',
      icon: '/icon/duckduckgo-logo.svg',
      available: true,
    },
  ];

  // Schema.org for integrations
  const integrationsSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SEO Agent',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
    featureList: [
      'ChatGPT Integration',
      'Claude AI Integration',
      'Google Gemini Integration',
      'WordPress Direct Publishing',
      'Multi-Search Engine Tracking',
      'Google Search Console Integration',
    ],
  };

  return (
    <section
      className="py-20 bg-white"
      aria-labelledby="integrations-heading"
      id="integrations"
    >
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(integrationsSchema) }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            id="integrations-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4"
          >
            {t('landing.integrations.title')}
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
            {t('landing.integrations.subtitle')}
          </p>
        </div>

        {/* 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Column 1: AI Models */}
          <article className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border-2 border-violet-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-xl mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                {t('landing.integrations.aiModels')}
              </h3>
              <span className="inline-block px-3 py-1 bg-violet-600 text-white text-xs font-semibold rounded-full">
                5+ Models
              </span>
            </div>

            <ul className="space-y-3">
              {aiModels.map((model, idx) => (
                <li
                  key={idx}
                  className="flex items-center bg-white rounded-lg p-3 hover:bg-violet-50 transition-colors duration-200"
                >
                  {model.icon ? (
                    <div className="w-8 h-8 mr-3 flex-shrink-0 relative">
                      <Image
                        src={model.icon}
                        alt={`${model.name} logo`}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 mr-3 flex-shrink-0 bg-violet-200 rounded-lg flex items-center justify-center">
                      <span className="text-violet-700 font-bold text-sm">
                        {model.name[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">
                      {model.name}
                    </p>
                  </div>
                  {model.available && (
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          </article>

          {/* Column 2: CMS Platforms */}
          <article className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                {t('landing.integrations.directPublishing')}
              </h3>
              <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                One-Click Publishing
              </span>
            </div>

            <ul className="space-y-3">
              {cmsPlatforms.map((platform, idx) => (
                <li
                  key={idx}
                  className="flex items-center bg-white rounded-lg p-3 hover:bg-blue-50 transition-colors duration-200"
                >
                  {platform.icon ? (
                    <div className="w-8 h-8 mr-3 flex-shrink-0 relative">
                      <Image
                        src={platform.icon}
                        alt={`${platform.name} logo`}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 mr-3 flex-shrink-0 bg-blue-200 rounded-lg flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">
                        {platform.name[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">
                      {platform.name}
                    </p>
                  </div>
                  {platform.available ? (
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium flex-shrink-0">
                      {t('landing.integrations.comingSoon')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </article>

          {/* Column 3: Search Engines */}
          <article className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200 p-8 hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-xl mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                {t('landing.integrations.multiEngine')}
              </h3>
              <span className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                200+ Countries
              </span>
            </div>

            <ul className="space-y-3">
              {searchEngines.map((engine, idx) => (
                <li
                  key={idx}
                  className="flex items-center bg-white rounded-lg p-3 hover:bg-emerald-50 transition-colors duration-200"
                >
                  {engine.icon ? (
                    <div className="w-8 h-8 mr-3 flex-shrink-0 relative">
                      <Image
                        src={engine.icon}
                        alt={`${engine.name} logo`}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 mr-3 flex-shrink-0 bg-emerald-200 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-700 font-bold text-sm">
                        {engine.name[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">
                      {engine.name}
                    </p>
                  </div>
                  {engine.available && (
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          </article>
        </div>

        {/* SEO Keywords Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-neutral-500 max-w-4xl mx-auto">
            {t('landing.integrations.seoFooter')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AIIntegrationsShowcase;
