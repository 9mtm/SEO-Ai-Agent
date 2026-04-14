import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Step1 from '../../components/onboarding/Step1';
import Step2 from '../../components/onboarding/Step2';
import Step2_5 from '../../components/onboarding/Step2_5';
import Step3 from '../../components/onboarding/Step3';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const Onboarding = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [onboardingData, setOnboardingData] = useState<any>({});

    // Check for newsletter subscription from registration
    useEffect(() => {
        const syncNewsletter = async () => {
            const hasSubscribed = localStorage.getItem('newsletter_subscription');
            if (hasSubscribed === 'true') {
                try {
                    const token = localStorage.getItem('auth_token');
                    const headers: any = { 'Content-Type': 'application/json' };
                    if (token) headers.Authorization = `Bearer ${token}`;

                    await fetch('/api/user/update-notifications', {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({
                            marketingEmails: true,
                            emailAlerts: true,
                            weeklyReport: true,
                            securityAlerts: true
                        })
                    });
                    // Clear the flag so we don't request again
                    localStorage.removeItem('newsletter_subscription');
                } catch (error) {
                    console.error('Failed to sync newsletter subscription:', error);
                }
            }
        };
        syncNewsletter();
    }, []);

    const handleNext = (data?: any) => {
        if (data) {
            setOnboardingData((prev: any) => ({ ...prev, ...data }));
        }

        if (step < 4) {
            setStep(step + 1);
        } else {
            // After completing onboarding, redirect to domains page
            router.push('/profile/domains');
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <Head>
                <title>Onboarding - SEO Ai Agent</title>
            </Head>

            <OnboardingLayout>
                {step === 1 && <Step1 onNext={handleNext} />}
                {step === 2 && <Step2 onNext={handleNext} onBack={handleBack} initialData={onboardingData.aiData} />}
                {step === 3 && <Step2_5 onNext={handleNext} onBack={handleBack} suggestedKeywords={onboardingData.suggestedKeywords} />}
                {step === 4 && <Step3 onNext={handleNext} onBack={handleBack} suggestedCompetitors={onboardingData.suggestedCompetitors} />}
            </OnboardingLayout>
        </div>
    );
};

export default Onboarding;
