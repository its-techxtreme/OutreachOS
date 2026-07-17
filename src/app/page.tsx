import type { Metadata } from 'next';

import { LandingGate } from '@/components/landing/LandingGate';

export const metadata: Metadata = {
  title: 'OutreachOS — Personal lead vault for cold outreach',
  description:
    'Import prospects, keep every account private, and run outreach without the spreadsheet chaos. Free vault, demo included.',
};

export default function Home() {
  return <LandingGate />;
}
