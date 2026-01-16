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

const NotificationsPage: NextPage = () => {
    const router = useRouter();
    const [selectedLang, setSelectedLang] = useState<'en' | 'de'>('en');
    const { data: domainsData } = useFetchDomains(router);
    const [isSaving, setIsSaving] = useState(false);

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        weeklyReport: true,
        marketingEmails: false,
        securityAlerts: true
    });
    const [notificationEmail, setNotificationEmail] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/user/update-notifications');
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

    const translations = {
        en: {
            title: 'Notifications',
            description: 'Manage how and when you want to be notified.',
            generalTitle: 'Email Notifications',
            generalDesc: 'Configure your email preferences.',
            emailAlerts: 'Email Alerts',
            emailAlertsDesc: 'Receive alerts about your account activity.',
            weeklyReport: 'Weekly Report',
            weeklyReportDesc: 'Get a weekly summary of your domains performance.',
            marketingEmails: 'Marketing Emails',
            marketingEmailsDesc: 'Receive news, updates, and special offers.',
            securityAlerts: 'Security Alerts',
            securityAlertsDesc: 'Get notified about important security events.',
            save: 'Save Changes',
            saving: 'Saving...',
            success: 'Preferences updated successfully',
            emailSettingsTitle: 'Notification Channel',
            emailSettingsDesc: 'Where should we send your notifications?',
            notificationEmailLabel: 'Notification Email',
            notificationEmailPlaceholder: 'e.g. notifications@company.com',
            notificationEmailHelp: 'We will send notifications to this email address.',
            domainTitle: 'Domain Notifications',
            domainDesc: 'Enable or disable notifications for specific domains.',
            domainLabel: 'Receive updates for',
        },
        de: {
            title: 'Benachrichtigungen',
            description: 'Verwalten Sie, wie und wann Sie benachrichtigt werden möchten.',
            generalTitle: 'E-Mail-Benachrichtigungen',
            generalDesc: 'Konfigurieren Sie Ihre E-Mail-Einstellungen.',
            emailAlerts: 'E-Mail-Benachrichtigungen',
            emailAlertsDesc: 'Erhalten Sie Benachrichtigungen über Ihre Kontoaktivitäten.',
            weeklyReport: 'Wöchentlicher Bericht',
            weeklyReportDesc: 'Erhalten Sie eine wöchentliche Zusammenfassung Ihrer Domain-Leistung.',
            marketingEmails: 'Marketing-E-Mails',
            marketingEmailsDesc: 'Erhalten Sie Neuigkeiten, Updates und Sonderangebote.',
            securityAlerts: 'Sicherheitswarnungen',
            securityAlertsDesc: 'Werden Sie über wichtige Sicherheitsereignisse informiert.',
            save: 'Änderungen speichern',
            saving: 'Speichern...',
            success: 'Einstellungen erfolgreich aktualisiert',
            emailSettingsTitle: 'Benachrichtigungskanal',
            emailSettingsDesc: 'Wohin sollen wir Ihre Benachrichtigungen senden?',
            notificationEmailLabel: 'Benachrichtigungs-E-Mail',
            notificationEmailPlaceholder: 'z.B. benachrichtigungen@firma.de',
            notificationEmailHelp: 'Wir senden Benachrichtigungen an diese E-Mail-Adresse.',
            domainTitle: 'Domain-Benachrichtigungen',
            domainDesc: 'Aktivieren oder deaktivieren Sie Benachrichtigungen für bestimmte Domains.',
            domainLabel: 'Updates erhalten für',
        }
    };

    const t = translations[selectedLang];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/user/update-notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...notifications,
                    notificationEmail,
                    domainNotifications
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success(t.success);
            } else {
                throw new Error(data.error || 'Failed manually');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error(selectedLang === 'en' ? 'Failed to save settings' : 'Fehler beim Speichern');
        } finally {
            setIsSaving(false);
        }
    };


    const handleTestNotification = async (slug: string) => {
        const loadingToast = toast.loading('Sending test email...');
        try {
            const response = await fetch('/api/user/test-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        <DashboardLayout selectedLang={selectedLang} onLanguageChange={setSelectedLang} domains={domainsData?.domains || []}>
            <Head>
                <title>{t.title} - SEO AI Agent</title>
            </Head>

            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t.title}</h1>
                    <p className="text-neutral-600">{t.description}</p>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            {t.emailSettingsTitle}
                        </CardTitle>
                        <CardDescription>{t.emailSettingsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="notification-email">{t.notificationEmailLabel}</Label>
                            <Input
                                id="notification-email"
                                value={notificationEmail}
                                onChange={(e) => setNotificationEmail(e.target.value)}
                                placeholder={t.notificationEmailPlaceholder}
                                className="max-w-md"
                            />
                            <p className="text-sm text-neutral-500">{t.notificationEmailHelp}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            {t.generalTitle}
                        </CardTitle>
                        <CardDescription>{t.generalDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="email-alerts" className='text-base'>{t.emailAlerts}</Label>
                                <p className="text-sm text-neutral-500">{t.emailAlertsDesc}</p>
                            </div>
                            <Switch
                                id="email-alerts"
                                checked={notifications.emailAlerts}
                                onCheckedChange={(c) => setNotifications({ ...notifications, emailAlerts: c })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="weekly-report" className='text-base'>{t.weeklyReport}</Label>
                                <p className="text-sm text-neutral-500">{t.weeklyReportDesc}</p>
                            </div>
                            <Switch
                                id="weekly-report"
                                checked={notifications.weeklyReport}
                                onCheckedChange={(c) => setNotifications({ ...notifications, weeklyReport: c })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="marketing-emails" className='text-base'>{t.marketingEmails}</Label>
                                <p className="text-sm text-neutral-500">{t.marketingEmailsDesc}</p>
                            </div>
                            <Switch
                                id="marketing-emails"
                                checked={notifications.marketingEmails}
                                onCheckedChange={(c) => setNotifications({ ...notifications, marketingEmails: c })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="security-alerts" className='text-base'>{t.securityAlerts}</Label>
                                <p className="text-sm text-neutral-500">{t.securityAlertsDesc}</p>
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
                            {t.domainTitle}
                        </CardTitle>
                        <CardDescription>{t.domainDesc}</CardDescription>
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
                                        <p className="text-sm text-neutral-500">{t.domainLabel} {domain.domain}</p>
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
                                {t.saving}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {t.save}
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
