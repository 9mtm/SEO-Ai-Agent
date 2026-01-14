import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { CreditCard, FileText, Check, Zap, Download, User, Building2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const BillingPage: NextPage = () => {
    const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');

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

                <Tabs defaultValue="invoices" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="invoices" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Invoice Details
                        </TabsTrigger>
                        <TabsTrigger value="subscription" className="gap-2">
                            <CreditCard className="h-4 w-4" />
                            Subscription Plan
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <Download className="h-4 w-4" />
                            Invoices
                        </TabsTrigger>
                    </TabsList>

                    {/* Invoice Details Tab */}
                    <TabsContent value="invoices">
                        <Card>
                            <CardHeader>
                                <CardTitle>Invoice Information</CardTitle>
                                <CardDescription>Enter details to show on your invoices</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="address">Billing Address</Label>
                                        <Input
                                            id="address"
                                            placeholder="Street, City, Zip Code, Country"
                                            value={invoiceInfo.address}
                                            onChange={(e) => handleInvoiceChange('address', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
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
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button>Save Invoice Details</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* Invoices Tab (History) */}
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
                                                { id: 'INV-003', date: 'Nov 01, 2025', amount: '$79.00', status: 'Paid' },
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

                    {/* Subscription Plan Tab */}
                    <TabsContent value="subscription" className="space-y-6">
                        {/* Current Plan */}
                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-blue-900">Current Plan: Pro</CardTitle>
                                        <CardDescription className="text-blue-700">Active until Feb 14, 2026</CardDescription>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">Active</span>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Free Plan */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Free</CardTitle>
                                    <CardDescription>Forever free</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-3xl font-bold">$0</span>
                                        <span className="text-gray-500">/mo</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-gray-600">
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> 1 Domain</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> 9 Keywords</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Limited Updates</div>
                                </CardContent>
                                <CardFooter><Button variant="outline" className="w-full">Current Plan</Button></CardFooter>
                            </Card>

                            {/* Basic Plan */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic</CardTitle>
                                    <CardDescription>For getting started</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-3xl font-bold">$9</span>
                                        <span className="text-gray-500">/mo</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-gray-600">
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> 1 Domain</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> 100 Keywords</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Weekly Updates</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> MCP Access</div>
                                </CardContent>
                                <CardFooter><Button variant="outline" className="w-full">Downgrade</Button></CardFooter>
                            </Card>

                            {/* Pro Plan */}
                            <Card className="border-2 border-blue-600 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1 bg-blue-600 text-white text-xs font-bold rounded-bl">POPULAR</div>
                                <CardHeader>
                                    <CardTitle>Pro</CardTitle>
                                    <CardDescription>For growing businesses</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-3xl font-bold">$35</span>
                                        <span className="text-gray-500">/mo</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-gray-600">
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> 5 Domains</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> 1,000 Keywords</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Daily Updates</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> AI Content</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> MCP Access</div>
                                </CardContent>
                                <CardFooter><Button disabled className="w-full">Current Plan</Button></CardFooter>
                            </Card>

                            {/* Enterprise Plan */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Agency</CardTitle>
                                    <CardDescription>For agencies & teams</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-3xl font-bold">$99</span>
                                        <span className="text-gray-500">/mo</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-gray-600">
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Unlimited Domains</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> 5,000 Keywords</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> Priority Support</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> API Access</div>
                                    <div className="flex gap-2"><Check className="h-4 w-4 text-green-500" /> MCP Access</div>
                                </CardContent>
                                <CardFooter><Button className="w-full">Upgrade</Button></CardFooter>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default BillingPage;
