
export const PLAN_LIMITS = {
    free: { domains: 2, keywords: 9 },
    basic: { domains: 3, keywords: 25 },
    pro: { domains: 5, keywords: 500 },
    premium: { domains: 99999, keywords: 5000 },
    enterprise: { domains: 99999, keywords: 10000 }
};

export type PlanType = keyof typeof PLAN_LIMITS;

export const getPlanLimits = (plan: string) => {
    // Normalize plan name (handle casing or unknown values)
    const normalizedPlan = (plan || 'free').toLowerCase();

    // Check if plan exists, otherwise default to 'free'
    if (normalizedPlan in PLAN_LIMITS) {
        return PLAN_LIMITS[normalizedPlan as PlanType];
    }
    return PLAN_LIMITS.free;
};
