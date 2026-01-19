import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Toaster, toast } from 'react-hot-toast';
import { Bell, Loader2, Save, Globe, Mail, Send } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFetchDomains } from '../../services/domains';
import { useLanguage } from '../../context/LanguageContext';

const NotificationsPage: NextPage = () => {
    const router = useRouter();
    const { t, locale, setLocale } = useLanguage();
    const currentLocale = locale || 'en';

    const { data: domainsData } = useFetchDomains(router);
    const [isSaving, setIsSaving] = useState(false);

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        weeklyReport: true,
        marketingEmails: false,
        securityAlerts: true
    });
    const [notificationEmail, setNotificationEmail] = useState('');

    const getAuthHeaders = () => {
        const headers: any = { 'Content-Type': 'application/json' };
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/user/update-notifications', {
                    headers: getAuthHeaders()
                });
                const data = await res.json();
                if (data.success && data.settings) {
                    setNotifications({
                        emailAlerts: data.settings.email_alerts,
                        weeklyReport: data.settings.weekly_report,
                        marketingEmails: data.settings.marketing_emails,
                        securityAlerts: data.settings.security_alerts
                    });

                    if (data.settings.notification_email) {
                        setNotificationEmail(data.settings.notification_email);
                    } else {
                        setNotificationEmail(data.userEmail || '');
                    }
                } else if (data.success && data.userEmail) {
                    // No settings yet, but we have user email
                    setNotificationEmail(data.userEmail);
                }
            } catch (error) {
                console.error('Failed to load settings', error);
            }
        };
        fetchSettings();
    }, []);

    const [domainNotifications, setDomainNotifications] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (domainsData?.domains) {
            const initialStatus: Record<string, boolean> = {};
            domainsData.domains.forEach((d: any) => {
                initialStatus[d.slug] = d.notification !== undefined ? d.notification : true;
            });
            // Update only if empty to avoid overwriting user changes during re-renders if this was a real app
            if (Object.keys(domainNotifications).length === 0) {
                setDomainNotifications(initialStatus);
            }
        }
    }, [domainsData]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/user/update-notifications', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...notifications,
                    notificationEmail,
                    domainNotifications
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success(t('notifications.success'));
            } else {
                throw new Error(data.error || 'Failed manually');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error(currentLocale === 'en' ? 'Failed to save settings' : 'Fehler beim Speichern');
        } finally {
            setIsSaving(false);
        }
    };


    const handleTestNotification = async (slug: string) => {
        const loadingToast = toast.loading('Sending test email...');
        try {
            const response = await fetch('/api/user/notification', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ slug })
            });

            const data = await response.json();
            console.log('--- TEST EMAIL REPORT ---');
            console.log('Success:', data.success);
            console.log('Message:', data.message);
            console.log('Full Response:', data);

            if (response.ok && data.success) {
                toast.success('Test email sent successfully!', { id: loadingToast });
            } else {
                throw new Error(data.error || 'Failed to send');
            }
        } catch (error: any) {
            console.error('Test notification error:', error);
            toast.error(`Failed: ${error.message || 'Error sending email'}`, { id: loadingToast });
        }
    };

    return (
        <DashboardLayout selectedLang={currentLocale} onLanguageChange={setLocale} domains={domainsData?.domains || []}>
            <Head>
                <title>{t('notifications.title')} - SEO AI Agent</title>
            </Head>

            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t('notifications.title')}</h1>
                    <p className="text-neutral-600">{t('notifications.description')}</p>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            {t('notifications.emailSettingsTitle')}
                        </CardTitle>
                        <CardDescription>{t('notifications.emailSettingsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="notification-email">{t('notifications.notificationEmailLabel')}</Label>
                            <Input
                                id="notification-email"
                                value={notificationEmail}
                                onChange={(e) => setNotificationEmail(e.target.value)}
                                placeholder={t('notifications.notificationEmailPlaceholder')}
                                className="max-w-md"
                            />
                            <p className="text-sm text-neutral-500">{t('notifications.notificationEmailHelp')}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            {t('notifications.generalTitle')}
                        </CardTitle>
                        <CardDescription>{t('notifications.generalDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="email-alerts" className='text-base'>{t('notifications.emailAlerts')}</Label>
                                <p className="text-sm text-neutral-500">{t('notifications.emailAlertsDesc')}</p>
                            </div>
                            <Switch
                                id="email-alerts"
                                checked={notifications.emailAlerts}
                                onCheckedChange={(c) => setNotifications({ ...notifications, emailAlerts: c })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="weekly-report" className='text-base'>{t('notifications.weeklyReport')}</Label>
                                <p className="text-sm text-neutral-500">{t('notifications.weeklyReportDesc')}</p>
                            </div>
                            <Switch
                                id="weekly-report"
                                checked={notifications.weeklyReport}
                                onCheckedChange={(c) => setNotifications({ ...notifications, weeklyReport: c })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="marketing-emails" className='text-base'>{t('notifications.marketingEmails')}</Label>
                                <p className="text-sm text-neutral-500">{t('notifications.marketingEmailsDesc')}</p>
                            </div>
                            <Switch
                                id="marketing-emails"
                                checked={notifications.marketingEmails}
                                onCheckedChange={(c) => setNotifications({ ...notifications, marketingEmails: c })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="security-alerts" className='text-base'>{t('notifications.securityAlerts')}</Label>
                                <p className="text-sm text-neutral-500">{t('notifications.securityAlertsDesc')}</p>
                            </div>
                            <Switch
                                id="security-alerts"
                                checked={notifications.securityAlerts}
                                disabled={true} // Usually mandatory
                            />
                        </div>
                    </CardContent>

                </Card>

                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            {t('notifications.domainTitle')}
                        </CardTitle>
                        <CardDescription>{t('notifications.domainDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {domainsData?.domains && domainsData.domains.length > 0 ? (
                            domainsData.domains.map((domain: any) => (
                                <div key={domain.ID || domain.id} className="flex items-center justify-between space-x-2 pt-4 first:pt-0 border-t first:border-0 border-neutral-100">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            {domain.favicon && <img src={domain.favicon} alt="" className="w-4 h-4 rounded-sm" />}
                                            <Label htmlFor={`domain-${domain.slug}`} className='text-base cursor-pointer'>{domain.domain}</Label>
                                        </div>
                                        <p className="text-sm text-neutral-500">{t('notifications.domainLabel')} {domain.domain}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900"
                                            onClick={() => handleTestNotification(domain.slug)}
                                            title="Send Test Notification"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                        <Switch
                                            id={`domain-${domain.slug}`}
                                            checked={domainNotifications[domain.slug] ?? true}
                                            onCheckedChange={(c) => setDomainNotifications(prev => ({ ...prev, [domain.slug]: c }))}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-neutral-500 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                                No domains connected yet.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end mt-6 pb-10">
                    <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto min-w-[150px]">
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('notifications.saving')}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {t('notifications.save')}
                            </>
                        )}
                    </Button>
                </div>
            </div>
            <Toaster position="bottom-right" />
        </DashboardLayout >
    );
};

export default NotificationsPage;
