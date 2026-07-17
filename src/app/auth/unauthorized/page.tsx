import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="paper-texture flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-4xl font-bold text-ink">Access denied</h1>
      <p className="max-w-md text-sm text-ink-muted">
        You do not have permission to view this page. Contact an administrator
        if you believe this is an error.
      </p>
      <Link
        href="/dashboard"
        className="doodle-btn rounded-md bg-coral px-6 py-3 font-label text-sm font-bold uppercase tracking-wider text-ink"
      >
        Return to dashboard
      </Link>
    </div>
  );
}
