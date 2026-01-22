import React from 'react';
import { Star, Quote } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const Testimonials: React.FC = () => {
  const { t } = useLanguage();

  const testimonials = [
    {
      name: 'Sarah Ahmed',
      position: t('landing.testimonials.testimonial1.position'),
      company: 'TechCorp',
      review: t('landing.testimonials.testimonial1.review'),
      rating: 5,
      image: 'SA',
      color: 'bg-blue-500',
    },
    {
      name: 'Michael Schmidt',
      position: t('landing.testimonials.testimonial2.position'),
      company: 'GrowthAgency',
      review: t('landing.testimonials.testimonial2.review'),
      rating: 5,
      image: 'MS',
      color: 'bg-emerald-500',
    },
    {
      name: 'Lisa Chen',
      position: t('landing.testimonials.testimonial3.position'),
      company: 'StartupHub',
      review: t('landing.testimonials.testimonial3.review'),
      rating: 5,
      image: 'LC',
      color: 'bg-violet-500',
    },
  ];


  return (
    <section
      className="py-20 bg-gradient-to-b from-neutral-50 to-white"
      aria-labelledby="testimonials-heading"
      id="testimonials"
    >

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            id="testimonials-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4"
          >
            {t('landing.testimonials.title')}
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
            {t('landing.testimonials.subtitle')}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <article
              key={index}
              className="bg-white rounded-2xl border border-neutral-200 p-8 hover:shadow-xl hover:border-neutral-300 transition-all duration-300 relative"
              itemScope
              itemType="https://schema.org/Review"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Quote className="w-6 h-6 text-white" aria-hidden="true" />
              </div>

              {/* Rating Stars */}
              <div
                className="flex items-center mb-4"
                itemProp="reviewRating"
                itemScope
                itemType="https://schema.org/Rating"
              >
                <meta itemProp="ratingValue" content={testimonial.rating.toString()} />
                <meta itemProp="bestRating" content="5" />
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-amber-400 fill-amber-400"
                    aria-hidden="true"
                  />
                ))}
                <span className="ml-2 text-sm text-neutral-600 font-medium">
                  {testimonial.rating}.0
                </span>
              </div>

              {/* Review Text */}
              <blockquote className="mb-6">
                <p
                  className="text-neutral-700 leading-relaxed text-base italic"
                  itemProp="reviewBody"
                >
                  "{testimonial.review}"
                </p>
              </blockquote>

              {/* Reviewer Info */}
              <div
                className="flex items-center"
                itemProp="author"
                itemScope
                itemType="https://schema.org/Person"
              >
                {/* Avatar */}
                <div
                  className={`w-12 h-12 ${testimonial.color} rounded-full flex items-center justify-center mr-4 flex-shrink-0`}
                >
                  <span className="text-white font-bold text-lg">
                    {testimonial.image}
                  </span>
                </div>

                {/* Name & Position */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-neutral-900 truncate"
                    itemProp="name"
                  >
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-neutral-600 truncate">
                    <span itemProp="jobTitle">{testimonial.position}</span>
                    {' @ '}
                    <span
                      itemProp="worksFor"
                      itemScope
                      itemType="https://schema.org/Organization"
                    >
                      <span itemProp="name">{testimonial.company}</span>
                    </span>
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-amber-50 border border-amber-200 rounded-full">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500 mr-2" />
            <span className="text-neutral-900 font-semibold mr-2">5.0</span>
            <span className="text-neutral-600">
              {t('landing.testimonials.trustBadge')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
