import { PREMIUM_PRICE_INR, PREMIUM_PRICE_USD } from '@/lib/billing/razorpay';
import { APP_NAME, PREMIUM_REQUEST_EMAIL } from '@/lib/brand';

export type PremiumRequestCurrency = 'INR' | 'USD';

export function buildPremiumRequestMailto(input: {
  currency: PremiumRequestCurrency;
  userEmail: string;
  userId: string;
  username: string;
}): string {
  const username = input.username.trim().replace(/^@/, '');
  const price =
    input.currency === 'INR'
      ? `₹${PREMIUM_PRICE_INR}`
      : `$${PREMIUM_PRICE_USD}`;

  const subject = `${APP_NAME} Premium request — @${username} (${input.currency})`;
  const body = [
    `Hi Techxtreme,`,
    ``,
    `I want to buy the ${APP_NAME} Premium plan.`,
    ``,
    `Username: @${username}`,
    `Account email: ${input.userEmail.trim()}`,
    `User id: ${input.userId}`,
    `Preferred currency / price: ${input.currency} (${price} / month)`,
    ``,
    `Please reply with payment instructions (UPI / bank transfer / invoice).`,
    ``,
    `Thanks,`,
    `@${username}`,
  ].join('\n');

  const params = new URLSearchParams({ subject, body });
  return `mailto:${PREMIUM_REQUEST_EMAIL}?${params.toString()}`;
}
