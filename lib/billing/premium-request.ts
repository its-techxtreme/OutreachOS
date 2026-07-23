import { PREMIUM_PRICE_INR, PREMIUM_PRICE_USD } from '@/lib/billing/razorpay';
import { APP_NAME, PREMIUM_REQUEST_EMAIL } from '@/lib/brand';

export type PremiumRequestCurrency = 'INR' | 'USD';

export type PremiumRequestDraft = {
  to: string;
  subject: string;
  body: string;
  /** Full text ready to paste into any mail client */
  copyText: string;
  mailto: string;
};

export function buildPremiumRequestDraft(input: {
  currency: PremiumRequestCurrency;
  userEmail: string;
  userId: string;
  username: string;
}): PremiumRequestDraft {
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

  const to = PREMIUM_REQUEST_EMAIL;
  const params = new URLSearchParams({ subject, body });
  const mailto = `mailto:${to}?${params.toString()}`;
  const copyText = [`To: ${to}`, `Subject: ${subject}`, ``, body].join('\n');

  return { to, subject, body, copyText, mailto };
}

export function buildPremiumRequestMailto(input: {
  currency: PremiumRequestCurrency;
  userEmail: string;
  userId: string;
  username: string;
}): string {
  return buildPremiumRequestDraft(input).mailto;
}
