import { GetStaticProps } from 'next';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '@/context/LanguageContext';
import { Shield, Lock, Eye, Database, Cookie, Menu, X, Mail } from 'lucide-react';
import AccountMenu from '../components/common/AccountMenu';
import Footer from '../components/common/Footer';
import { useFetchDomains } from '../services/domains';

export const getStaticProps: GetStaticProps = async ({ locale }) => {
    if (locale !== 'en') {
        return {
            redirect: {
                destination: '/privacy',
                permanent: true,
            },
        };
    }
    return {
        props: {},
    };
};

const PrivacyPolicyPage: React.FC = () => {
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
                <title>Privacy Policy | SEO Agent</title>
                <meta
                    name="description"
                    content="Privacy Policy for SEO Agent - Learn how we collect, use, and protect your data. GDPR compliant SEO tracking and AI content platform."
                />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href="https://seo-agent.net/privacy" />
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
                                    <Shield className="w-12 h-12 text-blue-600" />
                                </div>
                                <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
                                    Privacy Policy
                                </h1>
                                <p className="text-lg text-neutral-600">
                                    Last Updated: January 16, 2026
                                </p>
                            </div>

                            {/* Main Content */}
                            <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 sm:p-12 space-y-10">
                                {/* Introduction */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">1. Introduction</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        Welcome to SEO Agent, operated by <strong>Dpro GmbH</strong> ("we," "us," or "our"). We are committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our SEO tracking and AI content platform.
                                    </p>
                                    <p className="text-neutral-700 leading-relaxed">
                                        By using SEO Agent, you agree to the collection and use of information in accordance with this policy. This policy complies with the EU General Data Protection Regulation (GDPR) and Austrian data protection laws.
                                    </p>
                                </section>

                                {/* Data Controller */}
                                <section>
                                    <div className="flex items-start mb-4">
                                        <Database className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                        <h2 className="text-2xl font-bold text-neutral-900">2. Data Controller</h2>
                                    </div>
                                    <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
                                        <p className="font-semibold text-neutral-900 mb-2">Dpro GmbH</p>
                                        <p className="text-neutral-700">Wipplingerstraße 20/18</p>
                                        <p className="text-neutral-700">1010 Wien, Austria</p>
                                        <p className="text-neutral-700 mt-2">Email: <a href="mailto:office@dpro.at" className="text-blue-600 hover:underline">office@dpro.at</a></p>
                                        <p className="text-neutral-700">Phone: +43 676 905 4441</p>
                                        <p className="text-neutral-700 mt-2">VAT ID: ATU81090445</p>
                                    </div>
                                </section>

                                {/* Information We Collect */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">3. Information We Collect</h2>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">3.1 Information You Provide</h3>
                                    <ul className="space-y-3 mb-6">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                            <div>
                                                <strong className="text-neutral-900">Account Information:</strong>
                                                <span className="text-neutral-700"> When you register, we collect your email address, name, and optionally your company name.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                            <div>
                                                <strong className="text-neutral-900">Authentication Data:</strong>
                                                <span className="text-neutral-700"> If you register with email/password, we store a securely hashed version of your password. If you sign in with Google, we receive your email, name, and profile picture from Google.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                            <div>
                                                <strong className="text-neutral-900">Domain & SEO Data:</strong>
                                                <span className="text-neutral-700"> Website domains you add, keywords you track, competitor websites, business information, target countries, and language preferences.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                            <div>
                                                <strong className="text-neutral-900">Content Data:</strong>
                                                <span className="text-neutral-700"> Blog posts and articles you create using our AI content generation tools.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                            <div>
                                                <strong className="text-neutral-900">Integration Settings:</strong>
                                                <span className="text-neutral-700"> WordPress, Shopify, Webflow, or Wix connection details (API keys, site URLs) if you choose to connect these platforms.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                            <div>
                                                <strong className="text-neutral-900">AI API Keys:</strong>
                                                <span className="text-neutral-700"> If you provide your own API keys for OpenAI, Claude, Gemini, or other AI services.</span>
                                            </div>
                                        </li>
                                    </ul>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">3.2 Google Search Console Data</h3>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        When you connect your Google Search Console account, we request <strong>read-only access</strong> to:
                                    </p>
                                    <ul className="space-y-2 mb-6 ml-6">
                                        <li className="text-neutral-700">• Search performance data (queries, impressions, clicks, CTR, position)</li>
                                        <li className="text-neutral-700">• Site verification status</li>
                                        <li className="text-neutral-700">• URL inspection data</li>
                                    </ul>
                                    <p className="text-neutral-700 leading-relaxed bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                                        <strong>Important:</strong> We only <strong>read</strong> this data from Google. We do <strong>not</strong> store Google Search Console data permanently on our servers. The data is fetched in real-time when you view your analytics dashboard and is used solely for display purposes.
                                    </p>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3 mt-6">3.3 Automatically Collected Information</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start">
                                            <Cookie className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                            <div>
                                                <strong className="text-neutral-900">Cookies & Session Data:</strong>
                                                <span className="text-neutral-700"> We use HTTP-only cookies to maintain your login session. These cookies expire after 24 hours.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <Eye className="w-5 h-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                            <div>
                                                <strong className="text-neutral-900">Usage Data:</strong>
                                                <span className="text-neutral-700"> Last login timestamp, onboarding progress, and subscription plan status.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </section>

                                {/* How We Use Your Data */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">4. How We Use Your Data</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">We use your information for the following purposes:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                            <h4 className="font-semibold text-neutral-900 mb-2">✓ Service Provision</h4>
                                            <p className="text-sm text-neutral-700">Track keyword rankings, analyze SEO performance, and generate AI content</p>
                                        </div>
                                        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                            <h4 className="font-semibold text-neutral-900 mb-2">✓ Account Management</h4>
                                            <p className="text-sm text-neutral-700">Create and manage your user account, authenticate logins</p>
                                        </div>
                                        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                            <h4 className="font-semibold text-neutral-900 mb-2">✓ Communication</h4>
                                            <p className="text-sm text-neutral-700">Send service updates, notifications, and respond to support requests</p>
                                        </div>
                                        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                            <h4 className="font-semibold text-neutral-900 mb-2">✓ Platform Integration</h4>
                                            <p className="text-sm text-neutral-700">Connect with Google Search Console, WordPress, and other platforms</p>
                                        </div>
                                        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                            <h4 className="font-semibold text-neutral-900 mb-2">✓ Security</h4>
                                            <p className="text-sm text-neutral-700">Protect against unauthorized access and fraudulent activity</p>
                                        </div>
                                        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                            <h4 className="font-semibold text-neutral-900 mb-2">✓ Service Improvement</h4>
                                            <p className="text-sm text-neutral-700">Analyze usage patterns to improve features and user experience</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Legal Basis (GDPR) */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">5. Legal Basis for Processing (GDPR)</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">Under GDPR, we process your data based on:</p>
                                    <ul className="space-y-3">
                                        <li className="flex items-start">
                                            <span className="font-semibold text-blue-600 mr-3">a)</span>
                                            <div>
                                                <strong className="text-neutral-900">Contractual Necessity:</strong>
                                                <span className="text-neutral-700"> Processing is necessary to provide the SEO tracking and content generation services you've subscribed to.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-semibold text-blue-600 mr-3">b)</span>
                                            <div>
                                                <strong className="text-neutral-900">Consent:</strong>
                                                <span className="text-neutral-700"> When you connect Google Search Console or third-party integrations, you explicitly consent to data access.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-semibold text-blue-600 mr-3">c)</span>
                                            <div>
                                                <strong className="text-neutral-900">Legitimate Interest:</strong>
                                                <span className="text-neutral-700"> We have a legitimate interest in improving our service, preventing fraud, and ensuring platform security.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </section>

                                {/* Data Sharing */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">6. Data Sharing & Third Parties</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        We <strong>do not sell</strong> your personal data. We may share data with the following third parties:
                                    </p>
                                    <div className="space-y-4">
                                        <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                                            <h4 className="font-semibold text-neutral-900 mb-2">✓ Google APIs</h4>
                                            <p className="text-sm text-neutral-700">We use Google OAuth 2.0 for authentication and Google Search Console API for SEO data retrieval. Google's use of your data is governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google's Privacy Policy</a>.</p>
                                        </div>
                                        <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                                            <h4 className="font-semibold text-neutral-900 mb-2">✓ AI Service Providers</h4>
                                            <p className="text-sm text-neutral-700">When you generate content, we send your prompts to AI providers (OpenAI, Anthropic, Google Gemini) based on your selection. These providers process data according to their own privacy policies.</p>
                                        </div>
                                        <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                                            <h4 className="font-semibold text-neutral-900 mb-2">✓ CMS Platforms</h4>
                                            <p className="text-sm text-neutral-700">If you connect WordPress, Shopify, Webflow, or Wix, we use your provided API credentials to publish content on your behalf.</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Data Storage & Security */}
                                <section>
                                    <div className="flex items-start mb-4">
                                        <Lock className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                        <h2 className="text-2xl font-bold text-neutral-900">7. Data Storage & Security</h2>
                                    </div>
                                    <ul className="space-y-3">
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                            <div>
                                                <strong className="text-neutral-900">Data Location:</strong>
                                                <span className="text-neutral-700"> Your data is stored on secure servers located in the European Union (EU).</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                            <div>
                                                <strong className="text-neutral-900">Encryption:</strong>
                                                <span className="text-neutral-700"> All data transmission is encrypted using HTTPS/TLS. Passwords are hashed using bcrypt with salt.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                            <div>
                                                <strong className="text-neutral-900">Access Control:</strong>
                                                <span className="text-neutral-700"> Only authorized personnel have access to user data, and access is logged for security auditing.</span>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                            <div>
                                                <strong className="text-neutral-900">Retention:</strong>
                                                <span className="text-neutral-700"> We retain your data as long as your account is active. After account deletion, data is permanently removed within 30 days.</span>
                                            </div>
                                        </li>
                                    </ul>
                                </section>

                                {/* Your Rights (GDPR) */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">8. Your Rights Under GDPR</h2>
                                    <p className="text-neutral-700 leading-relaxed mb-4">You have the following rights:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-neutral-900 mb-2">→ Right to Access</h4>
                                            <p className="text-sm text-neutral-700">Request a copy of your personal data</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-neutral-900 mb-2">→ Right to Rectification</h4>
                                            <p className="text-sm text-neutral-700">Correct inaccurate or incomplete data</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-neutral-900 mb-2">→ Right to Erasure</h4>
                                            <p className="text-sm text-neutral-700">Request deletion of your data ("right to be forgotten")</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-neutral-900 mb-2">→ Right to Data Portability</h4>
                                            <p className="text-sm text-neutral-700">Receive your data in a machine-readable format</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-neutral-900 mb-2">→ Right to Object</h4>
                                            <p className="text-sm text-neutral-700">Object to processing based on legitimate interests</p>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-neutral-900 mb-2">→ Right to Withdraw Consent</h4>
                                            <p className="text-sm text-neutral-700">Revoke consent for data processing at any time</p>
                                        </div>
                                    </div>
                                    <p className="text-neutral-700 leading-relaxed mt-4">
                                        To exercise these rights, contact us at <a href="mailto:office@dpro.at" className="text-blue-600 hover:underline font-semibold">office@dpro.at</a>
                                    </p>
                                </section>

                                {/* Cookies */}
                                <section>
                                    <div className="flex items-start mb-4">
                                        <Cookie className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                        <h2 className="text-2xl font-bold text-neutral-900">9. Cookies</h2>
                                    </div>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        We use <strong>essential cookies only</strong> to maintain your login session. These cookies are:
                                    </p>
                                    <ul className="space-y-2 ml-6 mb-4">
                                        <li className="text-neutral-700">• <strong>HTTP-only:</strong> Not accessible via JavaScript (enhanced security)</li>
                                        <li className="text-neutral-700">• <strong>SameSite=Lax:</strong> Protection against CSRF attacks</li>
                                        <li className="text-neutral-700">• <strong>24-hour expiry:</strong> Automatic logout after 24 hours of inactivity</li>
                                    </ul>
                                    <p className="text-neutral-700 leading-relaxed">
                                        We do <strong>not</strong> use tracking cookies, advertising cookies, or third-party analytics cookies.
                                    </p>
                                </section>

                                {/* Children's Privacy */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">10. Children's Privacy</h2>
                                    <p className="text-neutral-700 leading-relaxed">
                                        SEO Agent is not intended for users under the age of 16. We do not knowingly collect personal data from children. If you believe we have inadvertently collected data from a child, please contact us immediately.
                                    </p>
                                </section>

                                {/* Changes to Policy */}
                                <section>
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-4">11. Changes to This Policy</h2>
                                    <p className="text-neutral-700 leading-relaxed">
                                        We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a prominent notice on our platform. Continued use of SEO Agent after changes constitutes acceptance of the updated policy.
                                    </p>
                                </section>

                                {/* Contact */}
                                <section className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border-2 border-blue-200">
                                    <div className="flex items-start mb-4">
                                        <Mail className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                        <h2 className="text-2xl font-bold text-neutral-900">12. Contact Us</h2>
                                    </div>
                                    <p className="text-neutral-700 leading-relaxed mb-4">
                                        If you have any questions about this Privacy Policy or wish to exercise your rights, please contact:
                                    </p>
                                    <div className="bg-white p-6 rounded-lg border border-blue-200">
                                        <p className="font-semibold text-neutral-900">Dpro GmbH - Data Protection Officer</p>
                                        <p className="text-neutral-700">Wipplingerstraße 20/18, 1010 Wien, Austria</p>
                                        <p className="text-neutral-700 mt-2">
                                            Email: <a href="mailto:office@dpro.at" className="text-blue-600 hover:underline font-semibold">office@dpro.at</a>
                                        </p>
                                        <p className="text-neutral-700">Phone: +43 676 905 4441</p>
                                    </div>
                                    <p className="text-sm text-neutral-600 mt-4">
                                        You also have the right to lodge a complaint with the Austrian Data Protection Authority (Datenschutzbehörde): <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.dsb.gv.at</a>
                                    </p>
                                </section>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-8 text-center">
                                <p className="text-sm text-neutral-500">
                                    Last Updated: January 16, 2026 | Effective Date: January 16, 2026
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

export default PrivacyPolicyPage;
