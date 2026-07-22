import type { Metadata } from 'next';

import { PricingClient } from '@/components/billing/PricingClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { APP_NAME } from '@/lib/brand';
import { PREMIUM_PRICE_INR, PREMIUM_PRICE_USD } from '@/lib/billing/razorpay';
import { getPublicSiteUrl } from '@/lib/seo/site-url';

export const metadata: Metadata = {
  title: 'Pricing — Free lead vault & Premium unlimited',
  description:
    'OutreachOS pricing for your personal lead management vault. Free for 500 leads, or Premium at ₹1499 / $15 per month for unlimited leads.',
  keywords: ['OutreachOS pricing', 'lead management vault', 'Premium lead vault'],
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'OutreachOS Pricing — Lead Management Vault',
    description:
      'Free vs Premium for personal lead vaults. ₹1499 / $15 monthly.',
    url: '/pricing',
  },
};

export default function PricingPage() {
  const site = getPublicSiteUrl();
  const offerLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: APP_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: site,
    offers: [
      {
        '@type': 'Offer',
        name: 'Premium INR',
        price: String(PREMIUM_PRICE_INR),
        priceCurrency: 'INR',
        url: `${site}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Premium USD',
        price: String(PREMIUM_PRICE_USD),
        priceCurrency: 'USD',
        url: `${site}/pricing`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={offerLd} />
      <PricingClient />
    </>
  );
}
