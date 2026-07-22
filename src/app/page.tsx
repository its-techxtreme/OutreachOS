import type { Metadata } from 'next';

import { JsonLd } from '@/components/seo/JsonLd';
import { LandingGate } from '@/components/landing/LandingGate';
import { APP_NAME } from '@/lib/brand';
import { getPublicSiteUrl } from '@/lib/seo/site-url';

const site = getPublicSiteUrl();

export const metadata: Metadata = {
  title: 'OutreachOS — Personal Lead Management Vault for Cold Outreach',
  description:
    'OutreachOS is a personal lead management vault: import Excel prospects, keep every account private, filter by niche and country, and run cold outreach without spreadsheet chaos. Free and Premium.',
  keywords: [
    'OutreachOS',
    'lead management vault',
    'personal lead vault',
    'cold outreach tool',
    'Excel lead import',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'OutreachOS — Personal Lead Management Vault',
    description:
      'Import prospects, organize privately, dial with call scripts. Free vault or Premium.',
    url: '/',
    type: 'website',
  },
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: APP_NAME,
        alternateName: 'Outreach OS',
        url: site,
        logo: `${site}/brand/outreachos-logo-512.png`,
        email: 'techxtremebuisness@gmail.com',
      },
      {
        '@type': 'WebSite',
        name: APP_NAME,
        alternateName: ['Outreach OS', 'OutreachOS lead vault'],
        url: site,
        description:
          'Personal lead management vault for cold outreach — import Excel leads, organize privately, dial with scripts.',
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${site}/auth/signup`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: APP_NAME,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Lead Management',
        operatingSystem: 'Web',
        url: site,
        description:
          'Personal lead management vault for solo outreach operators. Import Excel, filter leads, private vaults.',
        offers: [
          {
            '@type': 'Offer',
            name: 'Free',
            price: '0',
            priceCurrency: 'USD',
            description: 'Up to 500 leads in your personal lead vault',
          },
          {
            '@type': 'Offer',
            name: 'Premium',
            price: '15',
            priceCurrency: 'USD',
            description: 'Unlimited lead management vault — also ₹1499/month INR',
            url: `${site}/pricing`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LandingGate />
    </>
  );
}
