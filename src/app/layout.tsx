import type { Metadata, Viewport } from 'next';
import { Caveat, IBM_Plex_Mono, Space_Grotesk, Work_Sans } from 'next/font/google';

import { Providers } from '@/components/providers';
import { getPublicSiteUrl } from '@/lib/seo/site-url';

import './globals.css';

const caveat = Caveat({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const workSans = Work_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-label',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFDF7',
};

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'OutreachOS — Personal Lead Management Vault',
    template: '%s | OutreachOS',
  },
  description:
    'OutreachOS is a personal lead management vault for cold outreach — import Excel leads, keep every account private, filter by niche, and dial with call scripts.',
  applicationName: 'OutreachOS',
  keywords: [
    'OutreachOS',
    'lead management vault',
    'personal lead vault',
    'cold outreach',
    'Excel lead import',
    'private CRM',
    'outreach lead tracker',
  ],
  authors: [{ name: 'Techxtreme Digital Studio' }],
  creator: 'Athan',
  publisher: 'Techxtreme Digital Studio',
  category: 'business',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/brand/outreachos-logo-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/brand/outreachos-logo-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/brand/outreachos-mark.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/brand/outreachos-logo-512.png', sizes: '512x512' }],
  },
  openGraph: {
    title: 'OutreachOS — Personal Lead Management Vault',
    description:
      'Personal lead management vault for cold outreach. Import Excel prospects, organize privately, dial with call scripts.',
    url: siteUrl,
    siteName: 'OutreachOS',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/brand/og-outreachos.png',
        width: 1024,
        height: 537,
        alt: 'OutreachOS — personal lead management vault for cold outreach',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OutreachOS — Personal Lead Management Vault',
    description:
      'Personal lead management vault for cold outreach. Import, organize, dial.',
    images: ['/brand/og-outreachos.png'],
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${caveat.variable} ${workSans.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper font-sans text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
