import React, { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const Pricing: React.FC = () => {
  const { t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: t('landing.pricing.free.name'),
      price: 0,
      yearlyPrice: 0,
      description: t('landing.pricing.free.description'),
      features: [
        t('landing.pricing.free.feature1'),
        t('landing.pricing.free.feature2'),
        t('landing.pricing.free.feature3'),
        t('landing.pricing.free.feature4'),
      ],
      cta: t('landing.pricing.free.cta'),
      ctaLink: '/auth/register',
      popular: false,
      color: 'border-neutral-200',
      buttonStyle: 'bg-neutral-900 hover:bg-neutral-800 text-white',
    },
    {
      name: t('landing.pricing.pro.name'),
      price: 29,
      yearlyPrice: 24, // 290€/year = ~24€/month
      description: t('landing.pricing.pro.description'),
      features: [
        t('landing.pricing.pro.feature1'),
        t('landing.pricing.pro.feature2'),
        t('landing.pricing.pro.feature3'),
        t('landing.pricing.pro.feature4'),
        t('landing.pricing.pro.feature5'),
        t('landing.pricing.pro.feature6'),
        t('landing.pricing.pro.feature7'),
      ],
      cta: t('landing.pricing.pro.cta'),
      ctaLink: '/auth/register?plan=pro',
      popular: true,
      color: 'border-blue-500',
      buttonStyle: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50',
    },
    {
      name: t('landing.pricing.enterprise.name'),
      price: 99,
      yearlyPrice: 79, // 990€/year = ~79€/month
      description: t('landing.pricing.enterprise.description'),
      features: [
        t('landing.pricing.enterprise.feature1'),
        t('landing.pricing.enterprise.feature2'),
        t('landing.pricing.enterprise.feature3'),
        t('landing.pricing.enterprise.feature4'),
        t('landing.pricing.enterprise.feature5'),
        t('landing.pricing.enterprise.feature6'),
        t('landing.pricing.enterprise.feature7'),
        t('landing.pricing.enterprise.feature8'),
      ],
      cta: t('landing.pricing.enterprise.cta'),
      ctaLink: '/contact',
      popular: false,
      color: 'border-neutral-200',
      buttonStyle: 'bg-neutral-900 hover:bg-neutral-800 text-white',
    },
  ];

  // Schema.org Offer structured data
  const pricingSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'SEO Agent',
    description: 'Complete SEO tracking and AI content platform',
    image: 'https://seo-agent.net/logo.png',
    brand: {
      '@type': 'Brand',
      name: 'SEO Agent',
    },
    offers: plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      description: plan.description,
      price: billingCycle === 'monthly' ? plan.price : plan.yearlyPrice * 12,
      priceCurrency: 'EUR',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: billingCycle === 'monthly' ? plan.price : plan.yearlyPrice,
        priceCurrency: 'EUR',
        unitCode: billingCycle === 'monthly' ? 'MON' : 'ANN',
      },
      availability: 'https://schema.org/InStock',
    })),
  };

  return (
    <section
      className="py-20 bg-gradient-to-b from-white to-neutral-50"
      aria-labelledby="pricing-heading"
      id="pricing"
    >
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2
            id="pricing-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4"
          >
            {t('landing.pricing.title')}
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed mb-8">
            {t('landing.pricing.subtitle')}
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white border border-neutral-200 rounded-full p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${billingCycle === 'monthly'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
                }`}
            >
              {t('landing.pricing.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 relative ${billingCycle === 'yearly'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
                }`}
            >
              {t('landing.pricing.yearly')}
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <article
              key={index}
              className={`relative bg-white rounded-2xl border-2 ${plan.color} p-8 hover:shadow-2xl transition-all duration-300 ${plan.popular ? 'shadow-xl scale-105 md:scale-110' : 'shadow-sm'
                }`}
              itemScope
              itemType="https://schema.org/Offer"
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1 rounded-full shadow-lg">
                    <Zap className="w-4 h-4 mr-1 fill-white" />
                    <span className="text-sm font-semibold">
                      {t('landing.pricing.mostPopular')}
                    </span>
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <h3
                className="text-2xl font-bold text-neutral-900 mb-2 mt-4"
                itemProp="name"
              >
                {plan.name}
              </h3>

              {/* Description */}
              <p className="text-neutral-600 mb-6" itemProp="description">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span
                    className="text-5xl font-bold text-neutral-900"
                    itemProp="price"
                  >
                    {billingCycle === 'monthly' ? plan.price : plan.yearlyPrice}
                  </span>
                  <span className="text-2xl text-neutral-600 ml-1">€</span>
                  <span className="text-neutral-600 ml-2">
                    / {billingCycle === 'monthly' ? t('landing.pricing.perMonth') : t('landing.pricing.perMonth')}
                  </span>
                  <meta itemProp="priceCurrency" content="EUR" />
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    {t('landing.pricing.saveYearly')}
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Link
                href={plan.ctaLink}
                className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${plan.buttonStyle} mb-8`}
              >
                {plan.cta}
              </Link>

              {/* Features List */}
              <ul className="space-y-3" itemProp="itemOffered" itemScope itemType="https://schema.org/Service">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check
                      className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-neutral-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-neutral-600 mb-2">
            {t('landing.pricing.noCreditCard')}
          </p>
          <p className="text-sm text-neutral-500">
            {t('landing.pricing.cancelAnytime')}
          </p>
        </div>

        {/* SEO Keywords */}
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-400 max-w-4xl mx-auto">
            {t('landing.pricing.seoFooter')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
