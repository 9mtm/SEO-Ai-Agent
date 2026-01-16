import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const FinalCTA: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section
      className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-8">
            <Sparkles className="w-10 h-10 text-white" aria-hidden="true" />
          </div>

          {/* Heading */}
          <h2
            id="final-cta-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6"
          >
            {t('landing.finalCTA.title')}
          </h2>

          {/* Description */}
          <p className="text-lg sm:text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto">
            {t('landing.finalCTA.description')}
          </p>

          {/* CTA Buttons - Hidden */}
          {/* <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="group inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-lg hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
            >
              {t('landing.finalCTA.primaryCTA')}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div> */}

          {/* Trust Badge */}
          <div className="mt-8 flex items-center justify-center text-blue-100">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm font-medium">
              {t('landing.finalCTA.noCreditCard')}
            </span>
          </div>

          {/* Stats Row */}
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white mb-1">5,000+</p>
              <p className="text-sm text-blue-200">{t('landing.finalCTA.users')}</p>
            </div>
            <div className="text-center border-l border-r border-white/20">
              <p className="text-3xl sm:text-4xl font-bold text-white mb-1">50K+</p>
              <p className="text-sm text-blue-200">{t('landing.finalCTA.keywords')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white mb-1">98%</p>
              <p className="text-sm text-blue-200">{t('landing.finalCTA.satisfaction')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
