import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center">
      <h1 className="text-2xl font-semibold text-zinc-100">Access denied</h1>
      <p className="max-w-md text-sm text-zinc-400">
        You do not have permission to view this page. Contact an administrator
        if you believe this is an error.
      </p>
      <Button asChild>
        <Link href="/dashboard">Return to dashboard</Link>
      </Button>
    </div>
  );
}
