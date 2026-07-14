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
  signIn: (email: string, password: string) => Promise<void>;
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

    const getInitialSession = async () => {
      try {
        const currentSession = await authService.getCurrentSession();
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (err) {
        logger.error('Failed to get initial session', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      setError(null);

      switch (event) {
        case 'SIGNED_IN':
          SessionSecurityService.touchActivity();
          router.refresh();
          break;
        case 'SIGNED_OUT':
          router.push('/auth/login');
          router.refresh();
          break;
        case 'TOKEN_REFRESHED':
          logger.info('Session refreshed', {
            userId: nextSession?.user?.id,
          });
          break;
        case 'PASSWORD_RECOVERY':
          router.push('/auth/reset-password');
          break;
        default:
          break;
      }
    });

    const teardownMonitoring =
      SessionSecurityService.setupSessionMonitoring(authService);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      teardownMonitoring();
    };
  }, [authService, router, supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        await authService.signIn(email, password);
        SessionSecurityService.touchActivity();
        router.push('/dashboard');
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Invalid credentials';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [authService, router]
  );

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
