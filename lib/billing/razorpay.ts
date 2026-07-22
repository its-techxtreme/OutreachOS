import crypto from 'crypto';

import Razorpay from 'razorpay';

export type BillingCurrency = 'INR' | 'USD';

export const PREMIUM_PRICE_INR = 1499;
export const PREMIUM_PRICE_USD = 15;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() &&
      process.env.RAZORPAY_KEY_SECRET?.trim() &&
      process.env.RAZORPAY_PLAN_ID_INR?.trim() &&
      process.env.RAZORPAY_PLAN_ID_USD?.trim()
  );
}

export function getRazorpayClient(): Razorpay {
  return new Razorpay({
    key_id: requireEnv('RAZORPAY_KEY_ID'),
    key_secret: requireEnv('RAZORPAY_KEY_SECRET'),
  });
}

export function planIdForCurrency(currency: BillingCurrency): string {
  return currency === 'INR'
    ? requireEnv('RAZORPAY_PLAN_ID_INR')
    : requireEnv('RAZORPAY_PLAN_ID_USD');
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}

export function isActiveSubscriptionStatus(status: string): boolean {
  return status === 'active' || status === 'authenticated';
}
