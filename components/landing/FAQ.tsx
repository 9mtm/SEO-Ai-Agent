import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const FAQ: React.FC = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: t('landing.faq.q1.question'),
      answer: t('landing.faq.q1.answer'),
    },
    {
      question: t('landing.faq.q2.question'),
      answer: t('landing.faq.q2.answer'),
    },
    {
      question: t('landing.faq.q3.question'),
      answer: t('landing.faq.q3.answer'),
    },
    {
      question: t('landing.faq.q4.question'),
      answer: t('landing.faq.q4.answer'),
    },
    {
      question: t('landing.faq.q5.question'),
      answer: t('landing.faq.q5.answer'),
    },
    {
      question: t('landing.faq.q6.question'),
      answer: t('landing.faq.q6.answer'),
    },
    {
      question: t('landing.faq.q7.question'),
      answer: t('landing.faq.q7.answer'),
    },
    {
      question: t('landing.faq.q8.question'),
      answer: t('landing.faq.q8.answer'),
    },
    {
      question: t('landing.faq.q9.question'),
      answer: t('landing.faq.q9.answer'),
    },
    {
      question: t('landing.faq.q10.question'),
      answer: t('landing.faq.q10.answer'),
    },
  ];

  // NOTE: FAQPage JSON-LD schema lives on the home page (pages/index.tsx) where
  // it can be SSR-rendered with server-side translations. Do NOT also emit it
  // here — Google rejects pages with two FAQPage schemas as duplicate / invalid
  // for Rich Results.

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      className="py-20 bg-white"
      aria-labelledby="faq-heading"
      id="faq"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            id="faq-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4"
          >
            {t('landing.faq.title')}
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
            {t('landing.faq.subtitle')}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <article
                key={index}
                className="bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden hover:border-neutral-300 transition-colors duration-300"
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
              >
                {/* Question Button */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-neutral-100 transition-colors duration-200"
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <h3
                    className="text-lg font-semibold text-neutral-900 pr-8"
                    itemProp="name"
                  >
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-blue-600" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-600" aria-hidden="true" />
                    )}
                  </div>
                </button>

                {/* Answer */}
                <div
                  id={`faq-answer-${index}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96' : 'max-h-0'
                    }`}
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <div className="px-6 pb-5">
                    <p
                      className="text-neutral-700 leading-relaxed"
                      itemProp="text"
                    >
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>


      </div>
    </section>
  );
};

export default FAQ;
