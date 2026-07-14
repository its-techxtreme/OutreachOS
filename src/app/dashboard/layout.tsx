import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | OutreachOS',
  description: 'Lead management and outreach dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
