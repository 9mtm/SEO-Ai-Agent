import React from 'react';
import { Globe, BarChart3, Sparkles, Upload } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      number: 1,
      icon: Globe,
      title: t('landing.howItWorks.step1.title'),
      description: t('landing.howItWorks.step1.description'),
      features: [
        t('landing.howItWorks.step1.feature1'),
        t('landing.howItWorks.step1.feature2'),
        t('landing.howItWorks.step1.feature3'),
        t('landing.howItWorks.step1.feature4'),
      ],
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      number: 2,
      icon: BarChart3,
      title: t('landing.howItWorks.step2.title'),
      description: t('landing.howItWorks.step2.description'),
      features: [
        t('landing.howItWorks.step2.feature1'),
        t('landing.howItWorks.step2.feature2'),
        t('landing.howItWorks.step2.feature3'),
        t('landing.howItWorks.step2.feature4'),
      ],
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      number: 3,
      icon: Sparkles,
      title: t('landing.howItWorks.step3.title'),
      description: t('landing.howItWorks.step3.description'),
      features: [
        t('landing.howItWorks.step3.feature1'),
        t('landing.howItWorks.step3.feature2'),
        t('landing.howItWorks.step3.feature3'),
        t('landing.howItWorks.step3.feature4'),
      ],
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      number: 4,
      icon: Upload,
      title: t('landing.howItWorks.step4.title'),
      description: t('landing.howItWorks.step4.description'),
      features: [
        t('landing.howItWorks.step4.feature1'),
        t('landing.howItWorks.step4.feature2'),
        t('landing.howItWorks.step4.feature3'),
        t('landing.howItWorks.step4.feature4'),
      ],
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  // Schema.org HowTo structured data for SEO
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: t('landing.howItWorks.title'),
    description: t('landing.howItWorks.subtitle'),
    step: steps.map((step) => ({
      '@type': 'HowToStep',
      position: step.number,
      name: step.title,
      text: step.description,
      itemListElement: step.features.map((feature, idx) => ({
        '@type': 'HowToDirection',
        position: idx + 1,
        text: feature,
      })),
    })),
  };

  return (
    <section
      className="py-20 bg-white"
      aria-labelledby="how-it-works-heading"
      id="how-it-works"
    >
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - SEO Optimized */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4"
          >
            {t('landing.howItWorks.title')}
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
            {t('landing.howItWorks.subtitle')}
          </p>
        </div>

        {/* Steps Grid - 2x2 on desktop, vertical on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article
                key={step.number}
                className="relative bg-white rounded-2xl border-2 border-neutral-200 p-8 hover:border-neutral-300 hover:shadow-lg transition-all duration-300"
                itemScope
                itemType="https://schema.org/HowToStep"
              >
                {/* Step Number Badge */}
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-r from-white to-neutral-100 border-2 border-neutral-300 flex items-center justify-center shadow-md">
                  <span className="text-xl font-bold text-neutral-900">
                    {step.number}
                  </span>
                </div>

                {/* Icon */}
                <div className={`${step.bgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-6`}>
                  <Icon className={`w-8 h-8 ${step.iconColor}`} aria-hidden="true" />
                </div>

                {/* Title */}
                <h3
                  className="text-xl sm:text-2xl font-bold text-neutral-900 mb-3"
                  itemProp="name"
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-neutral-600 mb-4 leading-relaxed" itemProp="text">
                  {step.description}
                </p>

                {/* Features List */}
                <ul className="space-y-2" itemProp="itemListElement" itemScope itemType="https://schema.org/ItemList">
                  {step.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start text-sm text-neutral-700"
                      itemProp="itemListElement"
                      itemScope
                      itemType="https://schema.org/ListItem"
                    >
                      <svg
                        className={`w-5 h-5 ${step.iconColor} mr-2 mt-0.5 flex-shrink-0`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span itemProp="name">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Gradient Line at Bottom */}
                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${step.color} rounded-b-2xl`} />
              </article>
            );
          })}
        </div>

        {/* Visual Flow Indicator - Hidden on mobile */}
        <div className="hidden md:block max-w-6xl mx-auto mt-12">
          <div className="flex items-center justify-center space-x-4 text-neutral-400">
            <div className="flex items-center">
              <span className="text-sm font-medium">Track</span>
              <svg className="w-8 h-8 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium">Analyze</span>
              <svg className="w-8 h-8 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium">Create</span>
              <svg className="w-8 h-8 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium">Publish</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
