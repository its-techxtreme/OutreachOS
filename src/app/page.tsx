import type { Metadata } from 'next';

import { JsonLd } from '@/components/seo/JsonLd';
import { LandingGate } from '@/components/landing/LandingGate';
import { APP_NAME } from '@/lib/brand';
import { getPublicSiteUrl } from '@/lib/seo/site-url';

const site = getPublicSiteUrl();

export const metadata: Metadata = {
  title: `${APP_NAME} — Personal lead vault for cold outreach`,
  description:
    'Import Excel prospects, keep every account private, and run outreach without spreadsheet chaos. Free vault (500 leads) or Premium (₹1499 / $15).',
  alternates: { canonical: '/' },
  openGraph: {
    title: `${APP_NAME} — Personal lead vault for cold outreach`,
    description:
      'Import prospects, organize privately, dial with call scripts. Free and Premium plans.',
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
        url: site,
        logo: `${site}/brand/outreachos-logo-512.png`,
      },
      {
        '@type': 'WebSite',
        name: APP_NAME,
        url: site,
        description:
          'Personal lead vault for cold outreach — import, organize, dial.',
      },
      {
        '@type': 'SoftwareApplication',
        name: APP_NAME,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: site,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free plan up to 500 leads',
        },
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
