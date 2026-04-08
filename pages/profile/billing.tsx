
import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { CreditCard, FileText, Check, Zap, Download, User as UserIcon, Building2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from 'react-hot-toast';

import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useFetchDomains } from '../../services/domains';
import { useFetchUser } from '../../services/user';
import { useLanguage } from '../../context/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';


const BillingPage: NextPage = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { t, locale, setLocale } = useLanguage();
    const currentLocale = locale || 'en';

    const { data: domainsData } = useFetchDomains(router);
    const { data: userData } = useFetchUser();
    const user = userData?.user;

    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    // Display mode: "monthly" = show price/12 per mo (billed yearly), "yearly" = show full yearly total
    const [displayMode, setDisplayMode] = useState<'monthly' | 'yearly'>('monthly');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    const [invoiceInfo, setInvoiceInfo] = useState({
        type: 'company',
        companyName: '',
        vatId: '',
        address: '',
        city: '',
        zip: '',
        country: '',
        email: ''
    });

    useEffect(() => {
        if (router.query.success === 'true') {
            const sessionId = router.query.session_id as string;

            if (sessionId) {
                // Verify session because webhooks might not work on localhost
                const verifySession = async () => {
                    try {
                        const res = await fetch('/api/billing/verify-session', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sessionId })
                        });
                        if (res.ok) {
                            queryClient.invalidateQueries({ queryKey: ['user'] });
                            toast.success(t('billing.checkout.success') || "Subscription updated successfully!");
                        }
                    } catch (err) {
                        console.error('Failed to verify session', err);
                    }
                };
                verifySession();
            } else {
                toast.success(t('billing.checkout.success') || "Subscription updated successfully!", { duration: 5000 });
            }

            // Remove success from URL
            router.replace('/profile/billing', undefined, { shallow: true });
        }
    }, [router.query.success, router.query.session_id]);

    useEffect(() => {
        if (user?.invoice_details) {
            setInvoiceInfo(user.invoice_details);
            // If they have invoice details but no email specific to billing, 
            // and we have a user email, we can default it if it's currently empty
            if (!user.invoice_details.email && user.email) {
                setInvoiceInfo(prev => ({ ...prev, email: user.email }));
            }
        } else if (user?.email) {
            // Default to user email if no invoice details exist yet
            setInvoiceInfo(prev => ({ ...prev, email: user.email }));
        }
    }, [user?.invoice_details, user?.email]);

    const handleSaveInvoice = async () => {
        const toastId = toast.loading(t('common.saving') || "Saving...");
        try {
            const res = await fetch('/api/user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice_details: invoiceInfo })
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success(t('billing.invoice.saved') || "Invoice details saved!", { id: toastId });
        } catch (err) {
            toast.error("Failed to save invoice details", { id: toastId });
        }
    };

    const handleInvoiceChange = (key: string, value: string) => {
        setInvoiceInfo({ ...invoiceInfo, [key]: value });
    };

    const handlePlanSelect = (plan: any) => {
        // All plans are yearly only
        setBillingCycle('yearly');
        setSelectedPlan(plan);
        setIsCheckoutOpen(true);
    };

    const currentPlanId = user?.subscription_plan || 'free';

    const plans = [
        {
            id: 'free',
            name: t('billing.planNames.free'),
            description: t('billing.planDesc.free'),
            price: { monthly: 0, yearly: 0, original: 0 },
            features: [
                t('billing.features.domains', { count: 2 }),
                t('billing.features.keywords', { count: 9 }),
                t('billing.features.updates'),
            ],
            current: currentPlanId === 'free',
            buttonText: currentPlanId === 'free' ? t('billing.buttons.current') : t('billing.buttons.downgrade'),
            disabled: currentPlanId === 'free'
        },
        {
            id: 'basic',
            name: t('billing.planNames.basic'),
            description: t('billing.planDesc.basic'),
            price: { monthly: null, yearly: 29, original: 59 }, // Yearly only
            features: [
                t('billing.features.domains', { count: 3 }),
                t('billing.features.keywords', { count: 25 }),
                t('billing.features.weekly'),
                t('billing.features.mcp')
            ],
            current: currentPlanId === 'basic',
            buttonText: currentPlanId === 'basic' ? t('billing.buttons.current') : t('billing.buttons.upgrade'),
            note: t('billing.checkout.billedYearly'),
            disabled: currentPlanId === 'basic'
        },
        {
            id: 'pro',
            name: t('billing.planNames.pro'),
            description: t('billing.planDesc.pro'),
            price: { monthly: null, yearly: 79, original: 149 },
            features: [
                t('billing.features.domains', { count: 5 }),
                t('billing.features.keywords', { count: 500 }),
                t('billing.features.daily'),
                t('billing.features.ai'),
                t('billing.features.mcp')
            ],
            current: currentPlanId === 'pro',
            buttonText: currentPlanId === 'pro' ? t('billing.buttons.current') : t('billing.buttons.upgrade'),
            popular: true,
            disabled: currentPlanId === 'pro'
        },
        {
            id: 'premium',
            name: t('billing.planNames.premium'),
            description: t('billing.planDesc.premium'),
            price: { monthly: null, yearly: 199, original: 399 },
            features: [
                t('billing.features.unlimitedDomains'),
                t('billing.features.keywords', { count: 1000 }),
                t('billing.features.priority'),
                t('billing.features.api'),
                t('billing.features.mcp')
            ],
            current: currentPlanId === 'premium',
            buttonText: currentPlanId === 'premium' ? t('billing.buttons.current') : t('billing.buttons.upgrade'),
            disabled: currentPlanId === 'premium'
        }
    ];

    const currentPlan = plans.find(p => p.id === currentPlanId) || plans[0];

    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

    useEffect(() => {
        const loadInvoices = async () => {
            if (!user?.stripe_customer_id) return;
            setIsLoadingInvoices(true);
            try {
                const res = await fetch('/api/billing/invoices');
                const data = await res.json();
                if (data.invoices) {
                    setInvoices(data.invoices);
                }
            } catch (err) {
                console.error('Failed to load invoices', err);
            } finally {
                setIsLoadingInvoices(false);
            }
        };
        loadInvoices();
    }, [user?.stripe_customer_id]);
    const handleCheckout = async () => {
        if (!selectedPlan) return;

        // Map plans to Stripe Price IDs (from Environment Variables)
        const PRICE_IDS: Record<string, string | undefined> = {
            'basic_yearly': process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_YEARLY,
            'pro_yearly': process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
            'premium_yearly': process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY,
        };

        // All plans are yearly only
        const key = `${selectedPlan.id}_yearly`;
        const priceId = PRICE_IDS[key];

        if (!priceId) {
            toast.error(`Configuration Error: Price ID not found for ${key}`);
            console.error(`Missing environment variable for ${key}. Please check your .env file.`);
            return;
        }

        const toastId = toast.loading(t('billing.checkout.redirecting') || "Redirecting to checkout...");

        try {
            const res = await fetch('/api/billing/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    planId: selectedPlan.id,
                    invoiceDetails: invoiceInfo,
                    cancelUrl: window.location.href,
                    successUrl: `${window.location.origin}/profile/billing?success=true&session_id={CHECKOUT_SESSION_ID}`
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create session');
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error("Failed to start checkout");
                toast.dismiss(toastId);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "An error occurred");
            toast.dismiss(toastId);
        }
    };

    return (
        <DashboardLayout selectedLang={currentLocale} onLanguageChange={setLocale} domains={domainsData?.domains || []}>
            <Head>
                <title>{t('billing.title')} - SEO AI Agent</title>
            </Head>

            <div className="max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t('billing.title')}</h1>
                    <p className="text-neutral-600">{t('billing.desc')}</p>
                </div>

                <Tabs defaultValue="subscription" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="subscription" className="gap-2">
                            <CreditCard className="h-4 w-4" />
                            {t('billing.tabs.subscription')}
                        </TabsTrigger>
                        <TabsTrigger value="invoices" className="gap-2">
                            <FileText className="h-4 w-4" />
                            {t('billing.tabs.details')}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <Download className="h-4 w-4" />
                            {t('billing.tabs.history')}
                        </TabsTrigger>
                    </TabsList>

                    {/* Subscription Plan Tab */}
                    <TabsContent value="subscription" className="space-y-6">
                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-blue-900">
                                            {t('billing.currentPlan', { plan: currentPlan.name })}
                                            {user?.stripe_billing_interval && (
                                                <span className="ml-2 text-sm font-normal opacity-70">
                                                    ({user.stripe_billing_interval === 'year' ? t('billing.checkout.yearly') : t('billing.checkout.monthly')})
                                                </span>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="text-blue-700">
                                            {currentPlan.description}
                                            {user?.stripe_current_period_end && (
                                                <span className="block mt-1 font-medium italic">
                                                    {t('billing.renewsOn', { date: new Date(user.stripe_current_period_end).toLocaleDateString() }) || `Renews on: ${new Date(user.stripe_current_period_end).toLocaleDateString()}`}
                                                </span>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">{t('billing.active')}</span>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Display Mode Toggle — Yearly is the primary/default */}
                        <div className="flex justify-center">
                            <div className="inline-flex items-center bg-neutral-100 rounded-full p-1 border border-neutral-200 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setDisplayMode('monthly')}
                                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${displayMode === 'monthly'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-neutral-500 hover:text-neutral-800'
                                        }`}
                                >
                                    {t('billing.checkout.monthly') || 'Monthly'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDisplayMode('yearly')}
                                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${displayMode === 'yearly'
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-neutral-500 hover:text-neutral-800'
                                        }`}
                                >
                                    {t('billing.checkout.yearly') || 'Yearly'}
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${displayMode === 'yearly' ? 'bg-green-400 text-white' : 'bg-green-100 text-green-700'}`}>
                                        Save 50%
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {plans.map((plan) => {
                                // Yearly total IS what's entered in the plans array — billing is always yearly.
                                // Display mode just changes how we present the price (per mo vs per year).
                                const yearlyTotal = plan.price.yearly || 0;
                                const originalYearly = (plan.price as any).original || 0;
                                const isMonthlyDisplay = displayMode === 'monthly';

                                const price = isMonthlyDisplay
                                    ? (yearlyTotal > 0 ? Math.round((yearlyTotal / 12) * 100) / 100 : 0)
                                    : yearlyTotal;
                                const originalPrice = isMonthlyDisplay
                                    ? (originalYearly > 0 ? Math.round((originalYearly / 12) * 100) / 100 : 0)
                                    : originalYearly;

                                const hasDiscount = originalYearly > yearlyTotal && yearlyTotal > 0;
                                const discountPct = hasDiscount
                                    ? Math.round(((originalYearly - yearlyTotal) / originalYearly) * 100)
                                    : 0;
                                const period = isMonthlyDisplay
                                    ? (currentLocale === 'de' ? 'Monat' : currentLocale === 'fr' ? 'mois' : 'mo')
                                    : (currentLocale === 'de' ? 'Jahr' : currentLocale === 'fr' ? 'an' : 'year');
                                let subtext = t('billing.checkout.billedYearly');

                                if (plan.id === 'free') {
                                    subtext = t('billing.planDesc.free');
                                }

                                return (
                                    <Card key={plan.id} className={`flex flex-col ${plan.popular ? 'border-2 border-primary relative' : ''} ${plan.disabled ? 'opacity-75' : ''}`}>
                                        {plan.popular && <div className="absolute top-0 right-0 p-1 bg-primary text-primary-foreground text-xs font-bold rounded-bl z-10">POPULAR</div>}
                                        {hasDiscount && (
                                            <div className="absolute top-0 left-0 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-br z-10">
                                                -{discountPct}%
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardTitle>{plan.name}</CardTitle>
                                            <CardDescription>{plan.description}</CardDescription>
                                            <div className="mt-4">
                                                {hasDiscount && (
                                                    <div className="text-sm text-gray-400 line-through">
                                                        ${originalPrice}/{period}
                                                    </div>
                                                )}
                                                <div className="flex items-baseline">
                                                    <span className="text-3xl font-bold">${price}</span>
                                                    <span className="text-gray-500 ml-1">/{period}</span>
                                                </div>
                                                {hasDiscount && (
                                                    <p className="text-xs text-green-600 font-semibold mt-1">
                                                        Save ${isMonthlyDisplay ? (originalYearly - yearlyTotal) : (originalYearly - yearlyTotal)}/year
                                                    </p>
                                                )}
                                                {plan.id !== 'free' && !hasDiscount && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
                                                {plan.id !== 'free' && hasDiscount && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm text-gray-600 flex-1">
                                            {plan.features.map((feature, i) => (
                                                <div key={i} className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> {feature}</div>
                                            ))}
                                            {plan.id === 'basic' && (
                                                <div className="flex gap-2 text-amber-600 mt-2 text-xs font-medium">
                                                    <AlertCircle className="h-4 w-4" /> {t('billing.checkout.billedYearly')}
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter>
                                            <Button
                                                variant={plan.current ? "outline" : "default"}
                                                className="w-full"
                                                disabled={plan.disabled}
                                                onClick={() => !plan.current && handlePlanSelect(plan)}
                                            >
                                                {plan.buttonText}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* Invoice Details Tab */}
                    <TabsContent value="invoices">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('billing.invoice.title')}</CardTitle>
                                <CardDescription>{t('billing.invoice.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <InvoiceForm invoiceInfo={invoiceInfo} onChange={handleInvoiceChange} t={t} />
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button onClick={handleSaveInvoice}>{t('billing.invoice.save')}</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* Invoices History Tab */}
                    <TabsContent value="history">
                        <InvoiceHistoryTab
                            t={t}
                            isLoading={isLoadingInvoices}
                            invoices={invoices}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {t('billing.checkout.title', { cycle: 'Yearly' })}
                        </DialogTitle>
                        <DialogDescription>
                            {t('billing.checkout.desc')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPlan && (
                        <div className="grid gap-6 py-4">
                            {/* Plan Summary — Yearly Only */}
                            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-lg">{t('billing.checkout.planSummary', { plan: selectedPlan.name })}</h3>
                                    <div className="text-right">
                                        {(selectedPlan.price as any).original > selectedPlan.price.yearly && (
                                            <div className="text-sm text-gray-400 line-through font-mono">
                                                ${(selectedPlan.price as any).original}
                                            </div>
                                        )}
                                        <span className="text-xl font-bold font-mono">
                                            ${selectedPlan.price.yearly}
                                            <span className="text-sm text-gray-500 font-normal">/year</span>
                                        </span>
                                    </div>
                                </div>
                                {(selectedPlan.price as any).original > selectedPlan.price.yearly && (
                                    <div className="text-sm text-green-600 font-semibold mb-2">
                                        🎉 You save ${(selectedPlan.price as any).original - selectedPlan.price.yearly} ({Math.round((((selectedPlan.price as any).original - selectedPlan.price.yearly) / (selectedPlan.price as any).original) * 100)}% off)
                                    </div>
                                )}
                                <div className="text-sm text-gray-600 flex justify-between">
                                    <span>{t('billing.checkout.cycle')}:</span>
                                    <span className="font-medium capitalize">
                                        {t('billing.checkout.yearly')}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 flex justify-between mt-1 pt-2 border-t border-gray-200">
                                    <span className="font-semibold">{t('billing.checkout.total')}:</span>
                                    <span className="font-bold text-neutral-900">
                                        ${selectedPlan.price.yearly}
                                    </span>
                                </div>
                            </div>

                            {/* Invoice Details Form (Reusable) */}
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> {t('billing.tabs.details')}
                                </h4>
                                <InvoiceForm invoiceInfo={invoiceInfo} onChange={handleInvoiceChange} t={t} />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>{t('billing.checkout.cancel')}</Button>
                        <Button onClick={handleCheckout}>{t('billing.checkout.confirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
};

export default BillingPage;

// --- Sub-components moved out of the main render scope to prevent losing focus ---

const InvoiceForm = ({ invoiceInfo, onChange, t }: { invoiceInfo: any, onChange: (k: string, v: string) => void, t: any }) => (
    <div className="space-y-4">
        {/* Account Type Selection */}
        <div className="space-y-3">
            <Label>{t('billing.invoice.accountType')}</Label>
            <RadioGroup
                defaultValue="company"
                value={invoiceInfo.type}
                onValueChange={(val: string) => onChange('type', val)}
                className="flex gap-4"
            >
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="company" id="r-company" />
                    <Label
                        htmlFor="r-company"
                        className={`cursor-pointer flex items-center gap-2 ${invoiceInfo.type === 'company' ? 'text-primary' : ''}`}
                    >
                        <Building2 className={`h-4 w-4 ${invoiceInfo.type === 'company' ? 'text-primary' : 'text-gray-500'}`} />
                        {t('billing.invoice.company')}
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="r-individual" />
                    <Label
                        htmlFor="r-individual"
                        className={`cursor-pointer flex items-center gap-2 ${invoiceInfo.type === 'individual' ? 'text-primary' : ''}`}
                    >
                        <UserIcon className={`h-4 w-4 ${invoiceInfo.type === 'individual' ? 'text-primary' : 'text-gray-500'}`} />
                        {t('billing.invoice.individual')}
                    </Label>
                </div>
            </RadioGroup>
        </div>

        <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
                <Label htmlFor="companyName">
                    {invoiceInfo.type === 'company' ? t('billing.invoice.nameCompany') : t('billing.invoice.nameIndividual')}
                </Label>
                <Input
                    id="companyName"
                    placeholder={invoiceInfo.type === 'company' ? "e.g. Dpro GmbH" : "e.g. John Doe"}
                    value={invoiceInfo.companyName}
                    onChange={(e) => onChange('companyName', e.target.value)}
                />
            </div>

            {invoiceInfo.type === 'company' && (
                <div className="space-y-2">
                    <Label htmlFor="vatId">{t('billing.invoice.vat')}</Label>
                    <Input
                        id="vatId"
                        placeholder="e.g. DE123456789"
                        value={invoiceInfo.vatId}
                        onChange={(e) => onChange('vatId', e.target.value)}
                    />
                </div>
            )}

            {/* Address Fields */}
            <div className="space-y-2">
                <Label htmlFor="address">{t('billing.invoice.address')}</Label>
                <Input
                    id="address"
                    placeholder="Street Address"
                    value={invoiceInfo.address}
                    onChange={(e) => onChange('address', e.target.value)}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="zip">{t('billing.invoice.zip') || 'Zip Code'}</Label>
                    <Input
                        id="zip"
                        placeholder="1010"
                        value={invoiceInfo.zip}
                        onChange={(e) => onChange('zip', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="city">{t('billing.invoice.city') || 'City'}</Label>
                    <Input
                        id="city"
                        placeholder="Vienna"
                        value={invoiceInfo.city}
                        onChange={(e) => onChange('city', e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="country">{t('billing.invoice.country') || 'Country'}</Label>
                <Input
                    id="country"
                    placeholder="Austria"
                    value={invoiceInfo.country}
                    onChange={(e) => onChange('country', e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">{t('billing.invoice.email')}</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="billing@example.com"
                    value={invoiceInfo.email}
                    onChange={(e) => onChange('email', e.target.value)}
                />
            </div>
        </div>
    </div>
);

const InvoiceHistoryTab = ({ t, isLoading, invoices }: { t: any, isLoading: boolean, invoices: any[] }) => (
    <Card>
        <CardHeader>
            <CardTitle>{t('billing.history.title')}</CardTitle>
            <CardDescription>{t('billing.history.desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">{t('billing.history.date')}</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">{t('billing.history.amount')}</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground">{t('billing.history.status')}</th>
                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">{t('billing.history.download')}</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-muted-foreground">Loading invoices...</td>
                            </tr>
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-muted-foreground">No invoices found.</td>
                            </tr>
                        ) : invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="p-4 align-middle">{invoice.date}</td>
                                <td className="p-4 align-middle font-medium">{invoice.amount}</td>
                                <td className="p-4 align-middle">
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="p-4 align-middle text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-2"
                                        disabled={!invoice.download_url}
                                        onClick={() => invoice.download_url && window.open(invoice.download_url, '_blank')}
                                    >
                                        <Download className="h-4 w-4" />
                                        PDF
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>
);

