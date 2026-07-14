import type { Metadata } from 'next';

import { LandingGate } from '@/components/landing/LandingGate';

export const metadata: Metadata = {
  title: 'OutreachOS',
  description:
    'Command your prospecting pipeline with precision — automated lead management and outreach.',
};

export default function Home() {
  return <LandingGate />;
}
