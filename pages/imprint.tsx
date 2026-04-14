import { GetStaticProps } from 'next';
import React from 'react';
import Head from 'next/head';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';
import LandingHeader from '../components/common/LandingHeader';
import Footer from '../components/common/Footer';

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};

const ImprintPage: React.FC = () => {

  // Schema.org for organization
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Dpro GmbH',
    legalName: 'Dpro GmbH',
    url: 'https://seo-agent.net',
    logo: 'https://seo-agent.net/logo.png',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Wipplingerstraße 20/18',
      addressLocality: 'Wien',
      postalCode: '1010',
      addressCountry: 'AT',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+43-676-905-4441',
      contactType: 'customer support',
      email: 'office@seo-agent.net',
      availableLanguage: ['German', 'English'],
    },
    vatID: 'ATU81090445',
    taxID: 'ATU81090445',
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Imprint - Legal Information | SEO Agent</title>
        <meta name="description" content="Legal information and company details for Dpro GmbH, operator of SEO Agent" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://seo-agent.net/imprint" />
        <link rel="icon" href="/favicon.ico" />

        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </Head>

      <LandingHeader />

      <main className="pt-24">
        <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
                  Imprint
                </h1>
                <p className="text-lg text-neutral-600">
                  Legal Information & Company Details
                </p>
              </div>

              {/* Main Content */}
              <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 sm:p-12">
                {/* Company Information */}
                <section className="mb-10">
                  <div className="flex items-center mb-6">
                    <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-neutral-900">
                      Company Information
                    </h2>
                  </div>
                  <div className="space-y-3 text-neutral-700 text-lg">
                    <p className="font-semibold text-neutral-900">Dpro GmbH</p>
                    <p itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                      <span itemProp="streetAddress">Wipplingerstraße 20/18</span>
                      <br />
                      <span itemProp="postalCode">1010</span>{' '}
                      <span itemProp="addressLocality">Wien</span>
                      <br />
                      <span itemProp="addressCountry">Österreich (Austria)</span>
                    </p>
                  </div>
                </section>

                {/* Contact Information */}
                <section className="mb-10 pb-10 border-b border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center text-neutral-700">
                      <Phone className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                      <a
                        href="tel:+436769054441"
                        className="hover:text-blue-600 transition-colors duration-200"
                        itemProp="telephone"
                      >
                        +43 676 905 4441
                      </a>
                    </div>
                    <div className="flex items-center text-neutral-700">
                      <Mail className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                      <a
                        href="mailto:office@seo-agent.net"
                        className="hover:text-blue-600 transition-colors duration-200"
                        itemProp="email"
                      >
                        office@seo-agent.net
                      </a>
                    </div>
                    <div className="flex items-start text-neutral-700">
                      <MapPin className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span>
                        Wipplingerstraße 20/18
                        <br />
                        1010 Wien, Austria
                      </span>
                    </div>
                  </div>
                </section>

                {/* Legal Information */}
                <section className="mb-10 pb-10 border-b border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    Legal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-neutral-700">
                    <div>
                      <p className="font-semibold text-neutral-900 mb-1">
                        VAT ID:
                      </p>
                      <p itemProp="vatID">ATU81090445</p>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 mb-1">
                        Company Register Number:
                      </p>
                      <p>631492s</p>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 mb-1">
                        Commercial Register Court:
                      </p>
                      <p>Handelsgericht Wien</p>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 mb-1">
                        Commercial Register:
                      </p>
                      <p>R150S0606</p>
                    </div>
                  </div>
                </section>

                {/* Business Activities */}
                <section className="mb-10 pb-10 border-b border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    Business Activities
                  </h3>
                  <p className="text-neutral-700 leading-relaxed">
                    Software development, web applications, SEO tools, and digital marketing solutions
                  </p>
                </section>

                {/* Responsible for Content */}
                <section className="mb-10 pb-10 border-b border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    Responsible for Content
                  </h3>
                  <p className="text-neutral-700">
                    <span className="font-semibold">
                      Managing Director:
                    </span>{' '}
                    Dpro GmbH Geschäftsführung
                  </p>
                </section>

                {/* Dispute Resolution */}
                <section className="mb-10 pb-10 border-b border-neutral-200">
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    EU Dispute Resolution
                  </h3>
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    The European Commission provides a platform for online dispute resolution (OS):
                  </p>
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline transition-colors duration-200"
                  >
                    https://ec.europa.eu/consumers/odr
                  </a>
                </section>

                {/* Disclaimer */}
                <section>
                  <h3 className="text-xl font-bold text-neutral-900 mb-4">
                    Disclaimer
                  </h3>
                  <div className="space-y-4 text-neutral-700 leading-relaxed">
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-2">
                        Content Liability:
                      </h4>
                      <p>The content of our pages has been created with great care. However, we cannot guarantee the accuracy, completeness, and timeliness of the content.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-2">
                        Links Liability:
                      </h4>
                      <p>Our site contains links to external websites. We have no influence on the content of these websites and cannot accept any responsibility for them.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-2">
                        Copyright:
                      </h4>
                      <p>The content and works created by the site operators are subject to Austrian copyright law.</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer Note */}
              <div className="mt-8 text-center">
                <p className="text-sm text-neutral-500">
                  Last Updated: Januar 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ImprintPage;
