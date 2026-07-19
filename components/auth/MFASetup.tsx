'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/hooks/useAuth';

interface MFASetupProps {
  user: { id: string; email?: string | null };
}

export function MFASetup({ user: _user }: MFASetupProps) {
  const { user: authUser } = useAuth();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [enabled, setEnabled] = useState(
    Boolean(authUser?.user_metadata?.mfa_enabled)
  );

  const handleEnable = async () => {
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/mfa/setup', { method: 'POST' });
      const data = (await res.json()) as {
        error?: string;
        qrCode?: string;
        secret?: string;
        backupCodes?: string[];
      };
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to setup MFA');
      }
      setQrCode(data.qrCode ?? null);
      setSecret(data.secret ?? null);
      setBackupCodes(data.backupCodes ?? []);
      setMessage('Scan QR code with your authenticator app. Save backup codes now.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup MFA');
    } finally {
      setIsBusy(false);
    }
  };

  const handleVerify = async () => {
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Verification failed');
      }
      if (!data.success) {
        setError('Invalid verification code');
        return;
      }
      setEnabled(true);
      setMessage('MFA enabled successfully');
      setQrCode(null);
      setSecret(null);
      setBackupCodes([]);
      setToken('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisable = async () => {
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to disable MFA');
      }
      if (!data.success) {
        setError('Invalid verification code');
        return;
      }
      setEnabled(false);
      setMessage('MFA disabled');
      setToken('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable MFA');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="doodle-border-soft bg-paper-deep/40 p-4 sm:p-5" data-testid="mfa-setup">
      <h2 className="font-display text-lg font-bold text-ink">
        Multi-factor authentication
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Add an authenticator app for stronger account security.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-danger/40 bg-white/50 px-3 py-2 text-sm text-danger"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mt-4 rounded-md border border-marker/40 bg-highlighter/40 px-3 py-2 text-sm text-ink"
        >
          {message}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {!enabled && !qrCode && (
          <Button
            onClick={() => void handleEnable()}
            disabled={isBusy}
            className="doodle-btn bg-coral/95 text-ink"
          >
            Enable MFA
          </Button>
        )}

        {qrCode && (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">Scan QR code</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCode}
              alt="MFA QR code"
              width={180}
              height={180}
              className="rounded-md border border-ink bg-white p-2"
            />
            {secret && (
              <p className="break-all font-mono text-xs text-ink-muted">
                Secret: {secret}
              </p>
            )}
            {backupCodes.length > 0 && (
              <div className="rounded-md border border-ink/20 bg-white/60 p-3">
                <p className="text-xs font-medium text-ink">Backup codes (save these)</p>
                <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs text-ink-muted">
                  {backupCodes.map((code) => (
                    <li key={code}>{code}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mfa-token">Verification code</Label>
              <Input
                id="mfa-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="doodle-input border-ink bg-paper-deep"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>
            <Button
              onClick={() => void handleVerify()}
              disabled={isBusy || token.length < 6}
              className="doodle-btn bg-coral/95 text-ink"
            >
              Verify
            </Button>
          </div>
        )}

        {enabled && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-marker">MFA is enabled</p>
            <div className="space-y-2">
              <Label htmlFor="disable-mfa-token">Verification code</Label>
              <Input
                id="disable-mfa-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="doodle-input border-ink bg-paper-deep"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => void handleDisable()}
              disabled={isBusy || token.length < 6}
              className="doodle-btn border-ink bg-paper"
            >
              Disable MFA
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
