import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { CreditCard, FileText, Check, Zap, Download, User, Building2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const BillingPage: NextPage = () => {
    const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    const [invoiceInfo, setInvoiceInfo] = useState({
        type: 'company',
        companyName: '',
        vatId: '',
        address: '',
        email: ''
    });

    const handleInvoiceChange = (key: string, value: string) => {
        setInvoiceInfo({ ...invoiceInfo, [key]: value });
    };

    const handlePlanSelect = (plan: any) => {
        // Basic is yearly only
        if (plan.id === 'basic') {
            setBillingCycle('yearly');
        }
        setSelectedPlan(plan);
        setIsCheckoutOpen(true);
    };

    const plans = [
        {
            id: 'free',
            name: 'Free',
            description: 'Forever free',
            price: { monthly: 0, yearly: 0 },
            features: [
                '1 Domain',
                '9 Keywords',
                'Limited Updates'
            ],
            current: true,
            buttonText: 'Current Plan',
            disabled: true
        },
        {
            id: 'basic',
            name: 'Basic',
            description: 'For getting started',
            price: { monthly: null, yearly: 9 }, // Monthly price shown, but billed yearly
            features: [
                '1 Domain',
                '25 Keywords',
                'Weekly Updates',
                'MCP Access'
            ],
            current: false,
            buttonText: 'Upgrade',
            note: 'Billed yearly only'
        },
        {
            id: 'pro',
            name: 'Pro',
            description: 'For growing businesses',
            price: { monthly: 35, yearly: 29 }, // Discounted yearly? Assuming $29/mo if yearly
            features: [
                '5 Domains',
                '500 Keywords',
                'Daily Updates',
                'AI Content',
                'MCP Access'
            ],
            current: false,
            buttonText: 'Upgrade',
            popular: true
        },
        {
            id: 'premium',
            name: 'Premium',
            description: 'For power users & teams',
            price: { monthly: 99, yearly: 79 }, // Discounted yearly
            features: [
                'Unlimited Domains',
                '5,000 Keywords',
                'Priority Support',
                'API Access',
                'MCP Access'
            ],
            current: false,
            buttonText: 'Upgrade'
        }
    ];

    const InvoiceForm = () => (
        <div className="space-y-4">
            {/* Account Type Selection */}
            <div className="space-y-3">
                <Label>Account Type</Label>
                <RadioGroup
                    defaultValue="company"
                    value={invoiceInfo.type}
                    onValueChange={(val: string) => handleInvoiceChange('type', val)}
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="company" id="r-company" />
                        <Label
                            htmlFor="r-company"
                            className={`cursor-pointer flex items-center gap-2 ${invoiceInfo.type === 'company' ? 'text-primary' : ''}`}
                        >
                            <Building2 className={`h-4 w-4 ${invoiceInfo.type === 'company' ? 'text-primary' : 'text-gray-500'}`} />
                            Company
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="r-individual" />
                        <Label
                            htmlFor="r-individual"
                            className={`cursor-pointer flex items-center gap-2 ${invoiceInfo.type === 'individual' ? 'text-primary' : ''}`}
                        >
                            <User className={`h-4 w-4 ${invoiceInfo.type === 'individual' ? 'text-primary' : 'text-gray-500'}`} />
                            Individual
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="companyName">
                        {invoiceInfo.type === 'company' ? 'Company Name' : 'Full Name'}
                    </Label>
                    <Input
                        id="companyName"
                        placeholder={invoiceInfo.type === 'company' ? "e.g. Dpro GmbH" : "e.g. John Doe"}
                        value={invoiceInfo.companyName}
                        onChange={(e) => handleInvoiceChange('companyName', e.target.value)}
                    />
                </div>

                {invoiceInfo.type === 'company' && (
                    <div className="space-y-2">
                        <Label htmlFor="vatId">VAT ID (Optional)</Label>
                        <Input
                            id="vatId"
                            placeholder="e.g. DE123456789"
                            value={invoiceInfo.vatId}
                            onChange={(e) => handleInvoiceChange('vatId', e.target.value)}
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="address">Billing Address</Label>
                    <Input
                        id="address"
                        placeholder="Street, City, Zip Code, Country"
                        value={invoiceInfo.address}
                        onChange={(e) => handleInvoiceChange('address', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Billing Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="billing@example.com"
                        value={invoiceInfo.email}
                        onChange={(e) => handleInvoiceChange('email', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout selectedLang={selectedLang} onLanguageChange={setSelectedLang}>
            <Head>
                <title>Billing - SEO AI Agent</title>
            </Head>

            <div className="max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">Billing & Subscription</h1>
                    <p className="text-neutral-600">Manage your billing details and subscription plan</p>
                </div>

                <Tabs defaultValue="subscription" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="subscription" className="gap-2">
                            <CreditCard className="h-4 w-4" />
                            Subscription Plan
                        </TabsTrigger>
                        <TabsTrigger value="invoices" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Invoice Details
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <Download className="h-4 w-4" />
                            Invoices
                        </TabsTrigger>
                    </TabsList>

                    {/* Subscription Plan Tab */}
                    <TabsContent value="subscription" className="space-y-6">
                        {/* Current Plan */}
                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-blue-900">Current Plan: Free</CardTitle>
                                        <CardDescription className="text-blue-700">You are on the free plan</CardDescription>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">Active</span>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {plans.map((plan) => {
                                // Show monthly price by default, or yearly if only available yearly
                                let price = plan.price.monthly || plan.price.yearly;
                                let period = 'mo';
                                let subtext = 'billed monthly';

                                if (plan.id === 'basic') {
                                    // Basic is yearly only, so we show the yearly price (monthly equivalent is confusing if shown as main price without context, 
                                    // but usually plans show monthly cost billed yearly. Let's show yearly price per month if we want, or total?
                                    // User previously had $9. If that's monthly cost, total is 108.
                                    // Let's show $9 / mo
                                    price = plan.price.yearly;
                                    subtext = 'billed yearly';
                                } else if (plan.id === 'free') {
                                    subtext = 'forever free';
                                }

                                return (
                                    <Card key={plan.id} className={`flex flex-col ${plan.popular ? 'border-2 border-primary relative' : ''} ${plan.disabled ? 'opacity-75' : ''}`}>
                                        {plan.popular && <div className="absolute top-0 right-0 p-1 bg-primary text-primary-foreground text-xs font-bold rounded-bl">POPULAR</div>}
                                        <CardHeader>
                                            <CardTitle>{plan.name}</CardTitle>
                                            <CardDescription>{plan.description}</CardDescription>
                                            <div className="mt-4">
                                                <div className="flex items-baseline">
                                                    <span className="text-3xl font-bold">${price}</span>
                                                    <span className="text-gray-500 ml-1">/{period}</span>
                                                </div>
                                                {plan.id !== 'free' && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm text-gray-600 flex-1">
                                            {plan.features.map((feature, i) => (
                                                <div key={i} className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> {feature}</div>
                                            ))}
                                            {plan.id === 'basic' && (
                                                <div className="flex gap-2 text-amber-600 mt-2 text-xs font-medium">
                                                    <AlertCircle className="h-4 w-4" /> Billed Yearly Only
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
                                <CardTitle>Global Invoice Information</CardTitle>
                                <CardDescription>Set default details for all your invoices</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <InvoiceForm />
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button>Save Defaults</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* Invoices History Tab */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Invoice History</CardTitle>
                                <CardDescription>Download your past invoices</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm text-left">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Date</th>
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Amount</th>
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Download</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {[
                                                { id: 'INV-001', date: 'Jan 01, 2026', amount: '$79.00', status: 'Paid' },
                                                { id: 'INV-002', date: 'Dec 01, 2025', amount: '$79.00', status: 'Paid' },
                                            ].map((invoice) => (
                                                <tr key={invoice.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle">{invoice.date}</td>
                                                    <td className="p-4 align-middle font-medium">{invoice.amount}</td>
                                                    <td className="p-4 align-middle">
                                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800 hover:bg-green-100/80">
                                                            {invoice.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle text-right">
                                                        <Button variant="ghost" size="sm" className="h-8 gap-2">
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
                    </TabsContent>
                </Tabs>
            </div>

            {/* Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Complete {selectedPlan?.id === 'basic' ? 'Yearly' : (billingCycle === 'yearly' ? 'Yearly' : 'Monthly')} Subscription
                        </DialogTitle>
                        <DialogDescription>
                            Review your plan and confirm invoice details.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPlan && (
                        <div className="grid gap-6 py-4">
                            {/* Billing Cycle Selection (Inside Dialog) */}
                            {selectedPlan.id !== 'basic' && selectedPlan.id !== 'free' && (
                                <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
                                    <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-primary' : 'text-gray-500'}`}>Monthly</span>
                                    <Switch
                                        checked={billingCycle === 'yearly'}
                                        onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                                    />
                                    <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-primary' : 'text-gray-500'}`}>
                                        Yearly <span className="text-xs text-green-600 font-normal">(Save ~20%)</span>
                                    </span>
                                </div>
                            )}

                            {/* Plan Summary */}
                            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-lg">{selectedPlan.name} Plan</h3>
                                    <span className="text-xl font-bold font-mono">
                                        ${selectedPlan.id === 'basic' ? selectedPlan.price.yearly : (billingCycle === 'yearly' ? selectedPlan.price.yearly : selectedPlan.price.monthly)}
                                        <span className="text-sm text-gray-500 font-normal">/mo</span>
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 flex justify-between">
                                    <span>Billing Cycle:</span>
                                    <span className="font-medium capitalize">
                                        {selectedPlan.id === 'basic' ? 'Yearly' : billingCycle}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 flex justify-between mt-1">
                                    <span>Total due today:</span>
                                    <span className="font-bold text-neutral-900">
                                        {/* Calculate Total: Price * 12 if yearly, else Price * 1 */}
                                        ${selectedPlan.id === 'basic'
                                            ? selectedPlan.price.yearly * 12
                                            : (billingCycle === 'yearly' ? selectedPlan.price.yearly * 12 : selectedPlan.price.monthly)}
                                    </span>
                                </div>
                            </div>

                            {/* Invoice Details Form (Reusable) */}
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Invoice Information
                                </h4>
                                <InvoiceForm />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                            // Handle payment logic here
                            setIsCheckoutOpen(false);
                            alert("Redirecting to payment provider...");
                        }}>Confirm & Pay</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
};

export default BillingPage;
