import type { Metadata } from 'next';
import { Caveat, IBM_Plex_Mono, Space_Grotesk, Work_Sans } from 'next/font/google';

import { Providers } from '@/components/providers';

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

export const metadata: Metadata = {
  title: 'OutreachOS',
  description:
    'Personal lead pipelines with a sketchbook soul — import, organize, and outreach your way.',
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
