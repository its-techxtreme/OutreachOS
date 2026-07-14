import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Settings | OutreachOS',
  description: 'Manage authentication and MFA settings',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
