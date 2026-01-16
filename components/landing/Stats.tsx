import React from 'react';
import { Users, TrendingUp, FileText, Star } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const Stats: React.FC = () => {
  const { t } = useLanguage();

  const stats = [
    {
      icon: Users,
      value: '5,000+',
      label: t('landing.stats.activeUsers'),
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: TrendingUp,
      value: '50,000+',
      label: t('landing.stats.keywordsTracked'),
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: FileText,
      value: '100,000+',
      label: t('landing.stats.reportsGenerated'),
      color: 'from-violet-500 to-violet-600',
    },
    {
      icon: Star,
      value: '98%',
      label: t('landing.stats.customerSatisfaction'),
      color: 'from-amber-500 to-amber-600',
    },
  ];

  return (
    <section
      className="py-16 bg-gradient-to-b from-neutral-50 to-white"
      aria-labelledby="stats-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hidden heading for SEO and accessibility */}
        <h2 id="stats-heading" className="sr-only">
          {t('landing.stats.title')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <article
                key={index}
                className="relative bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow duration-300"
                itemScope
                itemType="https://schema.org/AggregateRating"
              >
                {/* Gradient background decoration */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color} rounded-t-xl`} />

                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                </div>

                <div>
                  <p
                    className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2"
                    itemProp="ratingValue"
                  >
                    {stat.value}
                  </p>
                  <p className="text-sm sm:text-base text-neutral-600" itemProp="name">
                    {stat.label}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;
