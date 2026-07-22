import {
  isActiveSubscriptionStatus,
  verifyRazorpayWebhookSignature,
} from '@/lib/billing/razorpay';
import crypto from 'crypto';

describe('billing razorpay helpers', () => {
  afterEach(() => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  });

  it('treats active and authenticated as entitled', () => {
    expect(isActiveSubscriptionStatus('active')).toBe(true);
    expect(isActiveSubscriptionStatus('authenticated')).toBe(true);
    expect(isActiveSubscriptionStatus('cancelled')).toBe(false);
  });

  it('rejects missing signature or secret', () => {
    expect(verifyRazorpayWebhookSignature('{}', null)).toBe(false);
    process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec';
    expect(verifyRazorpayWebhookSignature('{}', null)).toBe(false);
  });

  it('accepts a valid HMAC signature', () => {
    const secret = 'test_webhook_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    const body = '{"event":"subscription.activated"}';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    expect(verifyRazorpayWebhookSignature(body, signature)).toBe(true);
    expect(verifyRazorpayWebhookSignature(body, 'deadbeef')).toBe(false);
  });
});
