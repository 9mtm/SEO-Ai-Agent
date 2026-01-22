import React from 'react';
import {
  Globe,
  TrendingUp,
  Users,
  Sparkles,
  Bot,
  Target,
  Upload,
  BarChart3,
  Code2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const EnhancedFeatures: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    // Row 1 - Tracking & Analysis
    {
      icon: Globe,
      title: t('landing.features.multiCountry.title'),
      description: t('landing.features.multiCountry.description'),
      benefits: [
        t('landing.features.multiCountry.benefit1'),
        t('landing.features.multiCountry.benefit2'),
        t('landing.features.multiCountry.benefit3'),
        t('landing.features.multiCountry.benefit4'),
      ],
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      category: 'tracking',
    },
    {
      icon: TrendingUp,
      title: t('landing.features.gscIntegration.title'),
      description: t('landing.features.gscIntegration.description'),
      benefits: [
        t('landing.features.gscIntegration.benefit1'),
        t('landing.features.gscIntegration.benefit2'),
        t('landing.features.gscIntegration.benefit3'),
        t('landing.features.gscIntegration.benefit4'),
      ],
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      category: 'tracking',
    },
    {
      icon: Users,
      title: t('landing.features.competitorAnalysis.title'),
      description: t('landing.features.competitorAnalysis.description'),
      benefits: [
        t('landing.features.competitorAnalysis.benefit1'),
        t('landing.features.competitorAnalysis.benefit2'),
        t('landing.features.competitorAnalysis.benefit3'),
        t('landing.features.competitorAnalysis.benefit4'),
      ],
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      category: 'tracking',
    },
    // Row 2 - AI Features
    {
      icon: Sparkles,
      title: t('landing.features.aiContent.title'),
      description: t('landing.features.aiContent.description'),
      benefits: [
        t('landing.features.aiContent.benefit1'),
        t('landing.features.aiContent.benefit2'),
        t('landing.features.aiContent.benefit3'),
        t('landing.features.aiContent.benefit4'),
      ],
      iconColor: 'text-violet-600',
      bgColor: 'bg-violet-50',
      category: 'ai',
    },
    {
      icon: Bot,
      title: t('landing.features.chatIntegration.title'),
      description: t('landing.features.chatIntegration.description'),
      benefits: [
        t('landing.features.chatIntegration.benefit1'),
        t('landing.features.chatIntegration.benefit2'),
        t('landing.features.chatIntegration.benefit3'),
        t('landing.features.chatIntegration.benefit4'),
      ],
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      category: 'ai',
    },
    {
      icon: Target,
      title: t('landing.features.seoScoring.title'),
      description: t('landing.features.seoScoring.description'),
      benefits: [
        t('landing.features.seoScoring.benefit1'),
        t('landing.features.seoScoring.benefit2'),
        t('landing.features.seoScoring.benefit3'),
        t('landing.features.seoScoring.benefit4'),
      ],
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-50',
      category: 'ai',
    },
    // Row 3 - Publishing & Integration
    {
      icon: Upload,
      title: t('landing.features.wordpressPublishing.title'),
      description: t('landing.features.wordpressPublishing.description'),
      benefits: [
        t('landing.features.wordpressPublishing.benefit1'),
        t('landing.features.wordpressPublishing.benefit2'),
        t('landing.features.wordpressPublishing.benefit3'),
        t('landing.features.wordpressPublishing.benefit4'),
      ],
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      category: 'publishing',
    },
    {
      icon: BarChart3,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
      benefits: [
        t('landing.features.analytics.benefit1'),
        t('landing.features.analytics.benefit2'),
        t('landing.features.analytics.benefit3'),
        t('landing.features.analytics.benefit4'),
      ],
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      category: 'publishing',
    },
    {
      icon: Code2,
      title: t('landing.features.apiWebhooks.title'),
      description: t('landing.features.apiWebhooks.description'),
      benefits: [
        t('landing.features.apiWebhooks.benefit1'),
        t('landing.features.apiWebhooks.benefit2'),
        t('landing.features.apiWebhooks.benefit3'),
        t('landing.features.apiWebhooks.benefit4'),
      ],
      iconColor: 'text-slate-600',
      bgColor: 'bg-slate-50',
      category: 'publishing',
    },
  ];

  // Schema.org ItemList for features
  const featuresSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('landing.features.title'),
    description: t('landing.features.subtitle'),
    itemListElement: features.map((feature, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: feature.title,
        description: feature.description,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: 'https://seo-agent.net/',
        },
      },
    })),
  };

  return (
    <section
      className="py-20 bg-gradient-to-b from-white to-neutral-50"
      aria-labelledby="features-heading"
      id="features"
    >
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featuresSchema) }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4"
          >
            {t('landing.features.title')}
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
            {t('landing.features.subtitle')}
          </p>
        </div>

        {/* Features Grid - 3x3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                key={index}
                className="bg-white rounded-xl border border-neutral-200 p-8 hover:border-neutral-300 hover:shadow-lg transition-all duration-300 group"
                itemScope
                itemType="https://schema.org/SoftwareApplication"
              >
                {/* Icon */}
                <div
                  className={`${feature.bgColor} w-14 h-14 rounded-lg flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon
                    className={`w-7 h-7 ${feature.iconColor}`}
                    aria-hidden="true"
                  />
                </div>

                {/* Title */}
                <h3
                  className="text-xl font-bold text-neutral-900 mb-3"
                  itemProp="name"
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p
                  className="text-neutral-600 mb-4 leading-relaxed text-sm"
                  itemProp="description"
                >
                  {feature.description}
                </p>

                {/* Benefits List */}
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-start text-sm text-neutral-700"
                    >
                      <svg
                        className={`w-4 h-4 ${feature.iconColor} mr-2 mt-0.5 flex-shrink-0`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        {/* Category Tags - For SEO */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-3">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {t('landing.features.categoryTracking')}
            </span>
            <span className="px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
              {t('landing.features.categoryAI')}
            </span>
            <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
              {t('landing.features.categoryPublishing')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedFeatures;
