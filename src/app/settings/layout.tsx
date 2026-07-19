import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account | OutreachOS',
  description: 'Manage your OutreachOS profile, security, and preferences',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
