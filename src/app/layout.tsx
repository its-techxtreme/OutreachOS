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
    default: 'OutreachOS',
    template: '%s | OutreachOS',
  },
  description:
    'Personal lead pipelines with a sketchbook soul — import, organize, and outreach your way.',
  icons: {
    icon: [
      { url: '/brand/outreachos-logo-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/brand/outreachos-logo-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/brand/outreachos-mark.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/brand/outreachos-logo-512.png', sizes: '512x512' }],
  },
  openGraph: {
    title: 'OutreachOS',
    description:
      'Personal lead pipelines with a sketchbook soul — import, organize, and outreach your way.',
    url: siteUrl,
    siteName: 'OutreachOS',
    type: 'website',
    images: [
      {
        url: '/brand/og-outreachos.png',
        width: 1200,
        height: 630,
        alt: 'OutreachOS — personal lead vault',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OutreachOS',
    description:
      'Personal lead pipelines with a sketchbook soul — import, organize, and outreach your way.',
    images: ['/brand/og-outreachos.png'],
  },
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
