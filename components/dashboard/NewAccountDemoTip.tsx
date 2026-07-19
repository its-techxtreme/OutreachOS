'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { MascotCallout } from '@/components/mascots/MascotCallout';
import { Button } from '@/components/ui/button';
import { Role, RBACService } from '@/lib/auth/rbac';
import { useAuth } from '@/lib/hooks/useAuth';

export const DEMO_TUTORIAL_TIP_KEY = 'outreachos:show-demo-tutorial-tip';

/**
 * One-shot tip after a new account picks a username.
 * Suggests Try Demo on the landing page for the product tutorial.
 */
export function NewAccountDemoTip() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || RBACService.hasRole(user, Role.DEMO)) {
      return;
    }
    try {
      if (sessionStorage.getItem(DEMO_TUTORIAL_TIP_KEY) === '1') {
        setVisible(true);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const dismiss = () => {
    try {
      sessionStorage.removeItem(DEMO_TUTORIAL_TIP_KEY);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div data-testid="new-account-demo-tip" className="relative">
      <MascotCallout mascot="citygirl" title="Want the walkthrough?">
        <p>
          If you want a tutorial of how OutreachOS works, sign out and use the{' '}
          <strong className="text-ink">Try Demo</strong> button on the{' '}
          <Link
            href="/"
            className="font-medium text-marker underline decoration-2 underline-offset-2"
          >
            main page
          </Link>
          . Demo mode runs the guided tour without touching your real vault.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="doodle-btn border-ink bg-paper"
            onClick={dismiss}
            data-testid="dismiss-demo-tip"
          >
            Got it
          </Button>
        </div>
      </MascotCallout>
    </div>
  );
}
