import crypto from 'crypto';
import User from '../database/models/user';
import Referral from '../database/models/referral';
import ReferralPayout from '../database/models/referralPayout';
import { Op, fn, col, literal } from 'sequelize';

const PAYOUT_AMOUNT = 60;
const COMMISSION_THRESHOLDS: Record<string, { count: number; perReferral: number }> = {
  basic: { count: 4, perReferral: 15 },
  pro: { count: 2, perReferral: 30 },
  premium: { count: 1, perReferral: 60 },
};

// --- Code Generation ---

export function generateReferralCode(): string {
  return crypto.randomBytes(6).toString('base64url').slice(0, 8).toUpperCase();
}

export async function ensureReferralCode(userId: number): Promise<string> {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  if (user.referral_code) return user.referral_code;

  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode();
    try {
      await user.update({ referral_code: code });
      return code;
    } catch (err: any) {
      if (err.name === 'SequelizeUniqueConstraintError') continue;
      throw err;
    }
  }
  throw new Error('Failed to generate unique referral code');
}

// --- Referral Creation ---

export async function createReferral(referrerId: number, referredUserId: number): Promise<void> {
  if (referrerId === referredUserId) return;
  try {
    await Referral.create({ referrer_id: referrerId, referred_id: referredUserId });
  } catch (err: any) {
    // Silently handle duplicate — user already referred
    if (err.name === 'SequelizeUniqueConstraintError') return;
    console.error('[Referral] Failed to create referral:', err.message);
  }
}

// --- Commission Activation ---

export async function activateCommission(referredUserId: number, plan: string): Promise<void> {
  const normalizedPlan = plan.toLowerCase();
  const threshold = COMMISSION_THRESHOLDS[normalizedPlan];
  if (!threshold) return; // free or unknown plan — no commission

  const referral = await Referral.findOne({ where: { referred_id: referredUserId } });
  if (!referral) return; // user wasn't referred
  if (referral.status === 'active' && referral.plan === normalizedPlan) return; // already active on same plan

  // Update referral status
  await referral.update({
    status: 'active',
    plan: normalizedPlan,
    commission_eur: threshold.perReferral,
    activated_at: new Date(),
  });

  // Calculate total payouts earned by this referrer
  await recalculatePayouts(referral.referrer_id);
}

export async function cancelCommission(referredUserId: number): Promise<void> {
  const referral = await Referral.findOne({ where: { referred_id: referredUserId } });
  if (!referral || referral.status === 'cancelled') return;
  await referral.update({ status: 'cancelled' });
  // Don't remove existing payouts — already earned
}

async function recalculatePayouts(referrerId: number): Promise<void> {
  // Count active referrals grouped by plan
  const activeReferrals = await Referral.findAll({
    where: { referrer_id: referrerId, status: 'active' },
    attributes: ['plan', [fn('COUNT', col('id')), 'count']],
    group: ['plan'],
    raw: true,
  }) as any[];

  let totalPayoutsEarned = 0;
  for (const row of activeReferrals) {
    const threshold = COMMISSION_THRESHOLDS[row.plan];
    if (threshold) {
      totalPayoutsEarned += Math.floor(parseInt(row.count) / threshold.count);
    }
  }

  // Count existing payouts
  const existingPayouts = await ReferralPayout.count({ where: { user_id: referrerId } });

  // Create new payout records if earned more
  if (totalPayoutsEarned > existingPayouts) {
    const newPayouts = totalPayoutsEarned - existingPayouts;
    for (let i = 0; i < newPayouts; i++) {
      await ReferralPayout.create({
        user_id: referrerId,
        amount_eur: PAYOUT_AMOUNT,
        status: 'pending',
      });
    }
  }
}

// --- User Dashboard Data ---

export async function getReferralStats(userId: number) {
  const totalReferrals = await Referral.count({ where: { referrer_id: userId } });
  const activeReferrals = await Referral.count({ where: { referrer_id: userId, status: 'active' } });

  const pendingPayouts = await ReferralPayout.sum('amount_eur', {
    where: { user_id: userId, status: ['pending', 'requested', 'approved'] },
  }) || 0;

  const paidPayouts = await ReferralPayout.sum('amount_eur', {
    where: { user_id: userId, status: 'paid' },
  }) || 0;

  return {
    totalReferrals,
    activeReferrals,
    pendingEarnings: Number(pendingPayouts),
    totalEarned: Number(paidPayouts),
  };
}

export async function getReferredUsers(userId: number) {
  const referrals = await Referral.findAll({
    where: { referrer_id: userId },
    include: [{ model: User, as: 'referred', attributes: ['id', 'name', 'email', 'subscription_plan'] }],
    order: [['createdAt', 'DESC']],
  });

  return referrals.map((r) => {
    const referred = r.referred;
    const name = referred?.name || 'User';
    // Anonymize: "Mohamed A."
    const parts = name.split(' ');
    const anonymized = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];

    return {
      id: r.id,
      name: anonymized,
      plan: r.plan || 'free',
      status: r.status,
      commission: Number(r.commission_eur),
      date: r.createdAt,
      activatedAt: r.activated_at,
    };
  });
}

// --- Payout Settings ---

export async function getPayoutSettings(userId: number) {
  const user = await User.findByPk(userId, { attributes: ['referral_payout_settings'] });
  return user?.referral_payout_settings || null;
}

export async function updatePayoutSettings(userId: number, settings: any) {
  if (settings.paypal_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.paypal_email)) {
    throw new Error('Invalid PayPal email');
  }
  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');
  await user.update({ referral_payout_settings: settings });
  return settings;
}

// --- Payout Requests ---

export async function getPayoutHistory(userId: number) {
  return ReferralPayout.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
  });
}

export async function requestPayout(userId: number, payoutId: number) {
  const payout = await ReferralPayout.findOne({ where: { id: payoutId, user_id: userId } });
  if (!payout) throw new Error('Payout not found');
  if (payout.status !== 'pending') throw new Error('Payout is not in pending status');

  const user = await User.findByPk(userId);
  if (!user?.referral_payout_settings?.paypal_email) {
    throw new Error('Please set your PayPal email in payout settings first');
  }

  const settings = user.referral_payout_settings;
  await payout.update({
    status: 'requested',
    requested_at: new Date(),
    paypal_email: settings.paypal_email,
    payout_name: settings.name || user.name,
    payout_address: settings.address,
    payout_city: settings.city,
    payout_zip: settings.zip,
    payout_country: settings.country,
    payout_company: settings.company_name,
    payout_vat_id: settings.vat_id,
    is_business: settings.is_business || false,
  });

  return payout;
}

// --- Admin Functions ---

export async function adminGetOverviewStats() {
  const totalReferrals = await Referral.count();
  const activeReferrals = await Referral.count({ where: { status: 'active' } });
  const totalCommissions = await Referral.sum('commission_eur', { where: { status: 'active' } }) || 0;
  const pendingPayouts = await ReferralPayout.count({ where: { status: 'requested' } });

  return { totalReferrals, activeReferrals, totalCommissions: Number(totalCommissions), pendingPayouts };
}

export async function adminGetAllReferrals(page = 1, limit = 20, search = '') {
  const where: any = {};
  const include = [
    { model: User, as: 'referrer', attributes: ['id', 'name', 'email'] },
    { model: User, as: 'referred', attributes: ['id', 'name', 'email', 'subscription_plan'] },
  ];

  if (search) {
    // Search will be applied via include where
    include[0] = {
      model: User, as: 'referrer', attributes: ['id', 'name', 'email'],
      where: { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }] },
    } as any;
  }

  const { rows, count } = await Referral.findAndCountAll({
    where,
    include,
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { referrals: rows, total: count, page, totalPages: Math.ceil(count / limit) };
}

export async function adminGetPayoutRequests(page = 1, limit = 20, status?: string) {
  const where: any = {};
  if (status && status !== 'all') where.status = status;

  const { rows, count } = await ReferralPayout.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return { payouts: rows, total: count, page, totalPages: Math.ceil(count / limit) };
}

export async function adminUpdatePayoutStatus(payoutId: number, status: string, adminNote?: string) {
  const payout = await ReferralPayout.findByPk(payoutId);
  if (!payout) throw new Error('Payout not found');

  // Validate state transitions
  const validTransitions: Record<string, string[]> = {
    requested: ['approved', 'rejected'],
    approved: ['paid'],
  };

  const allowed = validTransitions[payout.status];
  if (!allowed || !allowed.includes(status)) {
    throw new Error(`Cannot transition from ${payout.status} to ${status}`);
  }

  await payout.update({
    status,
    admin_note: adminNote || payout.admin_note,
    processed_at: ['paid', 'rejected'].includes(status) ? new Date() : payout.processed_at,
  });

  return payout;
}
