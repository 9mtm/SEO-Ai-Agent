import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Step1 from '../../components/onboarding/Step1';
import Step2 from '../../components/onboarding/Step2';
import Step3 from '../../components/onboarding/Step3';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const Onboarding = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [onboardingData, setOnboardingData] = useState<any>({});

    const handleNext = (data?: any) => {
        if (data) {
            setOnboardingData((prev: any) => ({ ...prev, ...data }));
        }

        if (step < 3) {
            setStep(step + 1);
        } else {
            router.push('/domains');
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
                {step === 3 && <Step3 onNext={handleNext} onBack={handleBack} suggestedCompetitors={onboardingData.suggestedCompetitors} />}
            </OnboardingLayout>
        </div>
    );
};

export default Onboarding;
