'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import { AuthService } from '@/lib/auth/supabase-auth';
import { SessionSecurityService } from '@/lib/auth/session-security';
import { logger } from '@/lib/logger';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const authService = useMemo(() => new AuthService(supabase), [supabase]);

  useEffect(() => {
    let mounted = true;
    let teardownMonitoring: (() => void) | undefined;

    const getInitialSession = async () => {
      try {
        const currentSession = await authService.getCurrentSession();
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession) {
          SessionSecurityService.touchActivity();
        }
      } catch (err) {
        logger.error('Failed to get initial session', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        if (mounted) {
          setLoading(false);
          // Start idle watchdog only after the first session read settles so we
          // do not race Supabase's own auto-refresh on mount.
          teardownMonitoring =
            SessionSecurityService.setupSessionMonitoring(authService);
        }
      }
    };

    void getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      setError(null);

      switch (event) {
        case 'SIGNED_IN':
          SessionSecurityService.touchActivity();
          // Defer navigation refresh so it does not interrupt in-flight auth I/O.
          queueMicrotask(() => {
            router.refresh();
          });
          break;
        case 'SIGNED_OUT':
          queueMicrotask(() => {
            router.push('/auth/login');
            router.refresh();
          });
          break;
        case 'TOKEN_REFRESHED':
          logger.info('Session refreshed', {
            userId: nextSession?.user?.id,
          });
          break;
        case 'PASSWORD_RECOVERY':
          queueMicrotask(() => {
            router.push('/auth/reset-password');
          });
          break;
        default:
          break;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      teardownMonitoring?.();
    };
  }, [authService, router, supabase]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        const body = (await response.json()) as {
          error?: string;
          redirectTo?: string;
          accessToken?: string;
          refreshToken?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? 'Invalid credentials');
        }

        // Server set cookies; also hydrate the browser client so RouteGuard
        // does not see loading=false + session=null (blank white dashboard).
        let nextSession =
          body.accessToken && body.refreshToken
            ? await authService.setSessionFromTokens(
                body.accessToken,
                body.refreshToken
              )
            : await authService.getCurrentSession();

        if (!nextSession) {
          // Brief cookie race after Set-Cookie — retry once.
          await new Promise((resolve) => setTimeout(resolve, 50));
          nextSession = await authService.getCurrentSession();
        }

        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        SessionSecurityService.touchActivity();

        const destination = body.redirectTo ?? '/dashboard';
        // Full navigation remounts AuthProvider — reliable after account switch.
        window.location.assign(destination);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Invalid credentials';
        setError(message);
        setLoading(false);
        throw err;
      }
    },
    [authService]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await authService.signUp(email, password);
        const needsEmailConfirmation = !data.session;
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          SessionSecurityService.touchActivity();
          window.location.assign('/auth/username');
          return { needsEmailConfirmation };
        }
        return { needsEmailConfirmation };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Sign up failed';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authService]
  );

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.signInWithGoogle();
      if (data.url) {
        window.location.assign(data.url);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message);
      setLoading(false);
      throw err;
    }
  }, [authService]);

  const signInAsDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/demo', { method: 'POST' });
      const body = (await response.json()) as {
        error?: string;
        redirectTo?: string;
        accessToken?: string;
        refreshToken?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? 'Demo sign-in failed');
      }

      let nextSession =
        body.accessToken && body.refreshToken
          ? await authService.setSessionFromTokens(
              body.accessToken,
              body.refreshToken
            )
          : await authService.getCurrentSession();

      if (!nextSession) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        nextSession = await authService.getCurrentSession();
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      SessionSecurityService.touchActivity();
      window.location.assign(body.redirectTo ?? '/dashboard');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Demo sign-in failed';
      setError(message);
      setLoading(false);
      throw err;
    }
  }, [authService]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.signOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authService]);

  const resetPassword = useCallback(
    async (email: string) => {
      setError(null);
      try {
        await authService.resetPassword(email);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Password reset failed';
        setError(message);
        throw err;
      }
    },
    [authService]
  );

  const updatePassword = useCallback(
    async (password: string) => {
      setError(null);
      try {
        await authService.updatePassword(password, {
          email: user?.email ?? undefined,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Password update failed';
        setError(message);
        throw err;
      }
    },
    [authService, user]
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      error,
      isAuthenticated: Boolean(session),
      signIn,
      signUp,
      signInWithGoogle,
      signInAsDemo,
      signOut,
      resetPassword,
      updatePassword,
      clearError,
    }),
    [
      user,
      session,
      loading,
      error,
      signIn,
      signUp,
      signInWithGoogle,
      signInAsDemo,
      signOut,
      resetPassword,
      updatePassword,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
