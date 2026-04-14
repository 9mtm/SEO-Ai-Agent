import { GetStaticProps } from 'next';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '@/context/LanguageContext';
import { FileText, AlertTriangle, CheckCircle, XCircle, Menu, X, Mail } from 'lucide-react';
import AccountMenu from '../components/common/AccountMenu';
import Footer from '../components/common/Footer';
import { useFetchDomains } from '../services/domains';

export const getStaticProps: GetStaticProps = async () => {
    return {
        props: {},
    };
};

const TermsOfServicePage: React.FC = () => {
    const router = useRouter();
    const { t } = useLanguage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const { data: domainsData } = useFetchDomains(router, false, { enabled: isLoggedIn });
    const domains = domainsData?.domains || [];

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    useEffect(() => {
        fetch('/api/user', { headers: getAuthHeaders() })
            .then((res) => {
                if (res.ok) {
                    setIsLoggedIn(true);
                }
            })
            .catch(() => {
                // Not logged in
            });
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <Head>
                <title>Terms of Service | SEO Agent</title>
                <meta
                    name="description"
                    content="Terms of Service for SEO Agent - Read our terms and conditions for using our SEO tracking and AI content generation platform."
                />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://seo-agent.net/terms" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                            <Image src="/dpro_logo.png" alt="SEO Agent Logo" width={32} height={32} className="h-8 w-8" />
                            <span className="text-xl font-bold text-neutral-900">SEO Agent</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/#features" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                                {t('nav.features')}
                            </Link>
                            <Link href="/mcp-seo" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                                {t('nav.mcpIntegration')}
                            </Link>

                            {isLoggedIn ? (
                                <AccountMenu domains={domains} />
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                                    >
                                        {t('landing.login')}
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                                    >
                                        {t('landing.cta')}
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
                            aria-label="Toggle mobile menu"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-neutral-200 bg-white">
                        <div className="px-4 py-4 space-y-3">
                            <Link
                                href="/#features"
                                className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {t('nav.features')}
                            </Link>
                            <Link
                                href="/mcp-seo"
                                className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {t('nav.mcpIntegration')}
                            </Link>
                            <Link
                                href="/login"
                                className="block px-4 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {t('landing.login')}
                            </Link>
                            <Link
                                href="/register"
                                className="block px-4 py-2 bg-blue-600 text-white rounded-lg text-center font-semibold hover:bg-blue-700 transition-all active:scale-[0.98]"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {t('landing.cta')}
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            <main className="pt-24">
                <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white py-16">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-4xl mx-auto">
                            {/* Header */}
                            <div className="text-center mb-12">
                                <div className="flex items-center justify-center mb-4">
                                    <FileText className="w-12 h-12 text-blue-600" />
                                </div>
                                <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
                                    Terms of Service
                                </h1>
                                <p className="text-lg text-neutral-600">
                                    Last Updated: January 16, 2026
                                </p>
                            </div>

                            {/* Main Content */}
                            <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 sm:p-12 space-y-10">
                                {/* Introduction */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">1. Agreement to Terms</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        Welcome to <strong>SEO Agent</strong>, a service provided by <strong>Dpro GmbH</strong> ("Company," "we," "us," or "our"). These Terms of Service ("Terms") govern your access to and use of our SEO tracking, analytics, and AI content generation platform (the "Service").
                                    </p>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        By creating an account, accessing, or using SEO Agent, you agree to be bound by these Terms and our <Link href="/privacy" className="text-blue-600 hover:underline font-semibold">Privacy Policy</Link>. If you do not agree to these Terms, you may not use the Service.
                                    </p>
                                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                                        <p className="text-sm text-neutral-700">
                                            <strong>Important:</strong> These Terms constitute a legally binding agreement. Please read them carefully.
                                        </p>
                                    </div>
                                </section>

                                {/* Eligibility */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">2. Eligibility</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        To use SEO Agent, you must:
                                    </p>
                                    <ul className="space-y-2 ml-6 mb-4">
                                        <li className="text-neutral-700">• Be at least <strong>16 years of age</strong></li>
                                        <li className="text-neutral-700">• Have the legal capacity to enter into binding contracts</li>
                                        <li className="text-neutral-700">• Provide accurate and complete registration information</li>
                                        <li className="text-neutral-700">• Not be prohibited from using the Service under applicable laws</li>
                                    </ul>
                                    <p className="text-neutral-700 leading-relaxed">
                                        If you are using the Service on behalf of a company or organization, you represent that you have the authority to bind that entity to these Terms.
                                    </p>
                                </section>

                                {/* Account Registration */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">3. Account Registration & Security</h2>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">3.1 Account Creation</h3>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        You may register for an account using:
                                    </p>
                                    <ul className="space-y-2 ml-6 mb-6">
                                        <li className="text-neutral-700">• Email and password</li>
                                        <li className="text-neutral-700">• Google OAuth authentication</li>
                                    </ul>
                                    <p className="text-neutral-700 leading-relaxed mb-6">
                                        You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.
                                    </p>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">3.2 Account Security</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start">
                                            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-neutral-700">You are responsible for maintaining the confidentiality of your password and account credentials.</p>
                                        </div>
                                        <div className="flex items-start">
                                            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-neutral-700">You are responsible for all activities that occur under your account.</p>
                                        </div>
                                        <div className="flex items-start">
                                            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-neutral-700">You must notify us immediately of any unauthorized use of your account.</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Subscription Plans & Billing */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">4. Subscription Plans, Billing & Refund Policy</h2>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">4.1 Plan Types</h3>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        SEO Agent offers the following subscription plans:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                            <h4 className="font-semibold text-neutral-900 mb-2">Free Plan</h4>
                                            <p className="text-sm text-neutral-700">EUR 0.00/year — 1 domain, 9 keywords</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-neutral-900 mb-2">Basic Plan</h4>
                                            <p className="text-sm text-neutral-700">EUR 29.00/year — 2 domains, 25 keywords</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <h4 className="font-semibold text-neutral-900 mb-2">Pro Plan</h4>
                                            <p className="text-sm text-neutral-700">EUR 79.00/year — 5 domains, 500 keywords</p>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                            <h4 className="font-semibold text-neutral-900 mb-2">Premium Plan</h4>
                                            <p className="text-sm text-neutral-700">EUR 199.00/year — unlimited domains, 1000 keywords</p>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">4.2 Payment Terms</h3>
                                    <ul className="space-y-2 ml-6 mb-6">
                                        <li className="text-neutral-700">• All paid subscriptions are billed <strong>annually in advance</strong> (yearly billing only)</li>
                                        <li className="text-neutral-700">• Payments are processed securely through <strong>Stripe</strong>. We do not store your credit card or payment details on our servers</li>
                                        <li className="text-neutral-700">• All prices are in Euros (EUR) and include applicable taxes unless otherwise stated</li>
                                        <li className="text-neutral-700">• We reserve the right to change pricing with 30 days' prior notice. Existing subscriptions will continue at the current rate until the end of the billing period</li>
                                        <li className="text-neutral-700">• Failure to pay may result in service suspension or termination</li>
                                    </ul>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">4.3 Cancellation Policy</h3>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        You may cancel your subscription at any time through your account settings under <strong>Profile → Billing</strong>. When you cancel:
                                    </p>
                                    <ul className="space-y-2 ml-6 mb-6">
                                        <li className="text-neutral-700">• Your subscription will <strong>not be renewed</strong> at the next billing cycle</li>
                                        <li className="text-neutral-700">• You will <strong>retain full access</strong> to all paid features until the end of your current billing period</li>
                                        <li className="text-neutral-700">• After your billing period expires, your account will automatically downgrade to the Free plan</li>
                                        <li className="text-neutral-700">• Your data (domains, keywords, tracking history) will be preserved and remain accessible under Free plan limits</li>
                                    </ul>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">4.4 Refund Policy</h3>
                                    <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 mb-4">
                                        <p className="text-neutral-800 leading-relaxed font-medium mb-3">
                                            All subscription fees are <strong>non-refundable</strong>.
                                        </p>
                                        <ul className="space-y-2 ml-4">
                                            <li className="text-neutral-700 text-sm">• Since all plans include a <strong>Free plan</strong> to evaluate the service before upgrading, no refunds are issued for paid subscriptions</li>
                                            <li className="text-neutral-700 text-sm">• Partial refunds for unused periods are not available — cancellation takes effect at the end of the current billing cycle, not immediately</li>
                                            <li className="text-neutral-700 text-sm">• No refunds are issued for plan downgrades</li>
                                            <li className="text-neutral-700 text-sm">• Refunds required by applicable consumer protection laws (e.g., EU Consumer Rights Directive) will be honored as required by law</li>
                                        </ul>
                                    </div>
                                    <p className="text-neutral-700 leading-relaxed">
                                        If you believe a charge was made in error, please contact us at <a href="mailto:office@dpro.at" className="text-blue-600 hover:underline font-semibold">office@dpro.at</a> within 14 days of the charge. We will review each case individually.
                                    </p>
                                </section>

                                {/* Acceptable Use */}
                                <section>
                                    <div className="flex items-start mb-4">
                                        <AlertTriangle className="w-6 h-6 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                                        <h2 className="text-2xl font-bold text-neutral-900">5. Acceptable Use Policy</h2>
                                    </div>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        You agree <strong>NOT</strong> to use the Service to:
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-start">
                                            <XCircle className="w-5 h-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-neutral-700">Violate any applicable laws, regulations, or third-party rights</p>
                                        </div>
                                        <div className="flex items-start">
                                            <XCircle className="w-5 h-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-neutral-700">Transmit malware, viruses, or any malicious code</p>
                                        </div>
                                        <div className="flex items-start">
                                            <XCircle className="w-5 h-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-neutral-700">Attempt to gain unauthorized access to our systems or other users' accounts</p>
                                        </div>
                                        <div className="flex items-start">
                                            <XCircle className="w-5 h-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-neutral-700">Reverse engineer, decompile, or disassemble any part of the Service</p>
                                        </div>
                                        <div className="flex items-start">
                                            <XCircle className="w-5 h-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-neutral-700">Use automated systems (bots, scrapers) to access the Service without permission</p>
                                        </div>
                                        <div className="flex items-start">
                                            <XCircle className="w-5 h-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-neutral-700">Resell, sublicense, or redistribute the Service without authorization</p>
                                        </div>
                                        <div className="flex items-start">
                                            <XCircle className="w-5 h-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-neutral-700">Generate or publish illegal, harmful, defamatory, or offensive content</p>
                                        </div>
                                        <div className="flex items-start">
                                            <XCircle className="w-5 h-5 text-red-600 mr-3 mt-1 flex-shrink-0" />
                                            <p className="text-neutral-700">Abuse API rate limits or engage in excessive usage that impacts service performance</p>
                                        </div>
                                    </div>
                                    <p className="text-neutral-700 leading-relaxed mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                                        <strong>Violation of this policy may result in immediate account suspension or termination without refund.</strong>
                                    </p>
                                </section>

                                {/* Intellectual Property */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">6. Intellectual Property Rights</h2>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">6.1 Our IP</h3>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        The Service, including all software, designs, text, graphics, logos, and other content, is owned by Dpro GmbH and protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Service for its intended purpose.
                                    </p>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">6.2 Your Content</h3>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        You retain all rights to the content you create using SEO Agent (blog posts, articles, etc.). By using the Service, you grant us a limited license to:
                                    </p>
                                    <ul className="space-y-2 ml-6 mb-4">
                                        <li className="text-neutral-700">• Store and process your content to provide the Service</li>
                                        <li className="text-neutral-700">• Display your content within your account dashboard</li>
                                        <li className="text-neutral-700">• Publish content to third-party platforms (WordPress, Shopify, etc.) upon your explicit instruction</li>
                                    </ul>
                                    <p className="text-neutral-700 leading-relaxed">
                                        We do <strong>not</strong> claim ownership of your content and will not use it for any purpose other than providing the Service.
                                    </p>
                                </section>

                                {/* Third-Party Services */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">7. Third-Party Services & Integrations</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        SEO Agent integrates with third-party services, including:
                                    </p>
                                    <ul className="space-y-2 ml-6 mb-4">
                                        <li className="text-neutral-700">• <strong>Google Search Console:</strong> For SEO data retrieval</li>
                                        <li className="text-neutral-700">• <strong>AI Providers:</strong> OpenAI (GPT), Anthropic (Claude), Google (Gemini), Perplexity</li>
                                        <li className="text-neutral-700">• <strong>CMS Platforms:</strong> WordPress, Shopify, Webflow, Wix</li>
                                    </ul>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        Your use of these third-party services is subject to their respective terms of service and privacy policies. We are not responsible for the availability, functionality, or security of third-party services.
                                    </p>
                                    <p className="text-neutral-700 leading-relaxed bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                        <strong>Note:</strong> You are responsible for obtaining and maintaining valid API keys and credentials for third-party integrations.
                                    </p>
                                </section>

                                {/* Data & Privacy */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">8. Data & Privacy</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        Our collection, use, and protection of your personal data is governed by our <Link href="/privacy" className="text-blue-600 hover:underline font-semibold">Privacy Policy</Link>. By using the Service, you consent to our data practices as described in the Privacy Policy.
                                    </p>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Key points:
                                    </p>
                                    <ul className="space-y-2 ml-6 mt-2">
                                        <li className="text-neutral-700">• We store your data on secure EU-based servers</li>
                                        <li className="text-neutral-700">• We do <strong>not</strong> permanently store Google Search Console data</li>
                                        <li className="text-neutral-700">• We comply with GDPR and Austrian data protection laws</li>
                                        <li className="text-neutral-700">• You have the right to access, correct, or delete your data</li>
                                    </ul>
                                </section>

                                {/* Service Availability */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">9. Service Availability & Modifications</h2>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">9.1 Uptime</h3>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        While we strive to provide reliable service, we do not guarantee 100% uptime. The Service may be temporarily unavailable due to maintenance, updates, or unforeseen technical issues.
                                    </p>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">9.2 Modifications</h3>
                                    <p className="text-neutral-700 leading-relaxed">
                                        We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or without notice. We are not liable for any modification, suspension, or discontinuation of the Service.
                                    </p>
                                </section>

                                {/* Disclaimers */}
                                <section>
                                    <div className="flex items-start mb-4">
                                        <AlertTriangle className="w-6 h-6 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                                        <h2 className="text-2xl font-bold text-neutral-900">10. Disclaimers & Warranties</h2>
                                    </div>
                                    <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
                                        <p className="text-neutral-700 leading-relaxed mb-4">
                                            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                                        </p>
                                        <ul className="space-y-2 ml-6">
                                            <li className="text-neutral-700">• Warranties of merchantability or fitness for a particular purpose</li>
                                            <li className="text-neutral-700">• Accuracy, reliability, or completeness of SEO data or AI-generated content</li>
                                            <li className="text-neutral-700">• Uninterrupted or error-free operation</li>
                                            <li className="text-neutral-700">• Security of data transmission</li>
                                        </ul>
                                        <p className="text-neutral-700 leading-relaxed mt-4">
                                            <strong>You use the Service at your own risk.</strong> We do not guarantee specific SEO results or ranking improvements.
                                        </p>
                                    </div>
                                </section>

                                {/* Limitation of Liability */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">11. Limitation of Liability</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, DPRO GMBH SHALL NOT BE LIABLE FOR:
                                    </p>
                                    <ul className="space-y-2 ml-6 mb-4">
                                        <li className="text-neutral-700">• Indirect, incidental, special, consequential, or punitive damages</li>
                                        <li className="text-neutral-700">• Loss of profits, revenue, data, or business opportunities</li>
                                        <li className="text-neutral-700">• Damages resulting from third-party services or integrations</li>
                                        <li className="text-neutral-700">• Damages caused by unauthorized access to your account</li>
                                    </ul>
                                    <p className="text-neutral-700 leading-relaxed bg-neutral-50 border-l-4 border-neutral-400 p-4 rounded-r-lg">
                                        Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim, or €100, whichever is greater.
                                    </p>
                                </section>

                                {/* Indemnification */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">12. Indemnification</h2>
                                    <p className="text-neutral-700 leading-relaxed">
                                        You agree to indemnify, defend, and hold harmless Dpro GmbH, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, or expenses (including legal fees) arising from:
                                    </p>
                                    <ul className="space-y-2 ml-6 mt-4">
                                        <li className="text-neutral-700">• Your use or misuse of the Service</li>
                                        <li className="text-neutral-700">• Your violation of these Terms</li>
                                        <li className="text-neutral-700">• Your violation of any third-party rights</li>
                                        <li className="text-neutral-700">• Content you create or publish using the Service</li>
                                    </ul>
                                </section>

                                {/* Termination */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">13. Termination</h2>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">13.1 By You</h3>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        You may terminate your account at any time by contacting us at <a href="mailto:office@dpro.at" className="text-blue-600 hover:underline">office@dpro.at</a> or through your account settings.
                                    </p>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">13.2 By Us</h3>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        We may suspend or terminate your account immediately if:
                                    </p>
                                    <ul className="space-y-2 ml-6 mb-4">
                                        <li className="text-neutral-700">• You violate these Terms or our Acceptable Use Policy</li>
                                        <li className="text-neutral-700">• Your account is used for fraudulent or illegal activities</li>
                                        <li className="text-neutral-700">• You fail to pay subscription fees</li>
                                        <li className="text-neutral-700">• We are required to do so by law</li>
                                    </ul>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">13.3 Effect of Termination</h3>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Upon termination, your right to use the Service will immediately cease. We will delete your account data within 30 days unless required to retain it by law. You remain responsible for any fees incurred before termination.
                                    </p>
                                </section>

                                {/* Governing Law */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">14. Governing Law & Dispute Resolution</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        These Terms are governed by the laws of <strong>Austria</strong>, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be resolved in the courts of Vienna, Austria.
                                    </p>
                                    <p className="text-neutral-700 leading-relaxed">
                                        For EU consumers, you may also have the right to bring disputes before the courts of your country of residence.
                                    </p>
                                </section>

                                {/* Changes to Terms */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">15. Changes to These Terms</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        We may update these Terms from time to time. We will notify you of significant changes by:
                                    </p>
                                    <ul className="space-y-2 ml-6 mb-4">
                                        <li className="text-neutral-700">• Email notification</li>
                                        <li className="text-neutral-700">• Prominent notice on the platform</li>
                                        <li className="text-neutral-700">• Updating the "Last Updated" date at the top of this page</li>
                                    </ul>
                                    <p className="text-neutral-700 leading-relaxed">
                                        Your continued use of the Service after changes take effect constitutes acceptance of the updated Terms. If you do not agree to the changes, you must stop using the Service and terminate your account.
                                    </p>
                                </section>

                                {/* Miscellaneous */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">16. Miscellaneous</h2>
                                    <ul className="space-y-3">
                                        <li className="flex items-start">
                                            <span className="font-semibold text-blue-600 mr-3">→</span>
                                            <div>
                                                <strong className="text-neutral-900">Entire Agreement:</strong>
                                                <span className="text-neutral-700"> These Terms, together with our Privacy Policy, constitute the entire agreement between you and Dpro GmbH.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-semibold text-blue-600 mr-3">→</span>
                                            <div>
                                                <strong className="text-neutral-900">Severability:</strong>
                                                <span className="text-neutral-700"> If any provision is found unenforceable, the remaining provisions will remain in full effect.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-semibold text-blue-600 mr-3">→</span>
                                            <div>
                                                <strong className="text-neutral-900">Waiver:</strong>
                                                <span className="text-neutral-700"> Our failure to enforce any right or provision does not constitute a waiver of that right.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-semibold text-blue-600 mr-3">→</span>
                                            <div>
                                                <strong className="text-neutral-900">Assignment:</strong>
                                                <span className="text-neutral-700"> You may not assign or transfer these Terms without our consent. We may assign our rights without restriction.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </section>

                                {/* Referral Program */}
                                <section id="referral-program" className="scroll-mt-24">
                                    <div className="flex items-start mb-4">
                                        <CheckCircle className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                        <h2 className="text-2xl font-bold text-neutral-900">17. Referral Program</h2>
                                    </div>
                                    <ul className="space-y-4">
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-3 mt-0.5 flex-shrink-0">17.1</span>
                                            <span className="text-neutral-700"><strong>Eligibility.</strong> Any registered user with an active SEO Agent account may participate in the Referral Program. Participation is voluntary and subject to these terms.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-3 mt-0.5 flex-shrink-0">17.2</span>
                                            <span className="text-neutral-700"><strong>Referral Link.</strong> Each participant receives a unique referral link. When a new user registers through this link and subscribes to a paid plan, the referrer earns a commission.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-3 mt-0.5 flex-shrink-0">17.3</span>
                                            <div className="text-neutral-700">
                                                <strong>Commission Structure.</strong> Commissions are earned based on the referred user's subscription plan. A payout of EUR 60.00 is earned when the following thresholds are met:
                                                <ul className="mt-2 ml-4 space-y-1 list-disc text-sm">
                                                    <li>Basic Plan (EUR 29.00/year): 4 referred subscribers</li>
                                                    <li>Pro Plan (EUR 79.00/year): 2 referred subscribers</li>
                                                    <li>Premium Plan (EUR 199.00/year): 1 referred subscriber</li>
                                                </ul>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-3 mt-0.5 flex-shrink-0">17.4</span>
                                            <span className="text-neutral-700"><strong>Payout Method.</strong> Payouts are made exclusively via PayPal. You must provide a valid PayPal email address and complete payout details in your account settings before requesting a payout.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-3 mt-0.5 flex-shrink-0">17.5</span>
                                            <span className="text-neutral-700"><strong>Payout Processing.</strong> Payout requests are reviewed and processed manually. Dpro GmbH reserves the right to approve, reject, or request additional information for any payout. Processing may take up to 30 business days.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-3 mt-0.5 flex-shrink-0">17.6</span>
                                            <span className="text-neutral-700"><strong>Tax Responsibility.</strong> Referral commissions may be subject to income tax or other taxes in your jurisdiction. You are solely responsible for reporting and paying any applicable taxes on earned commissions.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-3 mt-0.5 flex-shrink-0">17.7</span>
                                            <span className="text-neutral-700"><strong>Cancellation of Commission.</strong> If a referred user cancels their subscription or requests a refund, the associated commission may be revoked. Already paid-out commissions are not affected.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-3 mt-0.5 flex-shrink-0">17.8</span>
                                            <span className="text-neutral-700"><strong>Prohibited Conduct.</strong> Self-referrals, fake accounts, spam, misleading advertising, and any form of fraud are strictly prohibited. Violation will result in forfeiture of all pending commissions and possible account termination.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-blue-600 mr-3 mt-0.5 flex-shrink-0">17.9</span>
                                            <span className="text-neutral-700"><strong>Program Changes.</strong> Dpro GmbH reserves the right to modify, suspend, or terminate the Referral Program at any time with 30 days notice. Earned and approved commissions will be honored.</span>
                                        </li>
                                    </ul>
                                </section>

                                {/* Contact */}
                                <section className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border-2 border-blue-200">
                                    <div className="flex items-start mb-4">
                                        <Mail className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                        <h2 className="text-2xl font-bold text-neutral-900">18. Contact Information</h2>
                                    </div>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        If you have questions about these Terms, please contact us:
                                    </p>
                                    <div className="bg-white p-6 rounded-lg border border-blue-200">
                                        <p className="font-semibold text-neutral-900">Dpro GmbH</p>
                                        <p className="text-neutral-700">Wipplingerstraße 20/18</p>
                                        <p className="text-neutral-700">1010 Wien, Austria</p>
                                        <p className="text-neutral-700 mt-2">
                                            Email: <a href="mailto:office@dpro.at" className="text-blue-600 hover:underline font-semibold">office@dpro.at</a>
                                        </p>
                                        <p className="text-neutral-700">Phone: +43 676 905 4441</p>
                                        <p className="text-neutral-700 mt-2">VAT ID: ATU81090445</p>
                                    </div>
                                </section>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-8 text-center">
                                <p className="text-sm text-neutral-500">
                                    Last Updated: January 16, 2026 | Effective Date: January 16, 2026
                                </p>
                                <p className="text-sm text-neutral-500 mt-2">
                                    By using SEO Agent, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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

export default TermsOfServicePage;
