'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MFAService } from '@/lib/auth/mfa';
import { useAuth } from '@/lib/hooks/useAuth';

interface MFASetupProps {
  user: { id: string; email?: string | null };
}

export function MFASetup({ user }: MFASetupProps) {
  const { user: authUser } = useAuth();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [enabled, setEnabled] = useState(
    Boolean(authUser?.user_metadata?.mfa_enabled)
  );

  const mfaService = new MFAService();

  const handleEnable = async () => {
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const result = await mfaService.enableMFA(user.id);
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setMessage('Scan QR code with your authenticator app');
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
      const ok = await mfaService.verifyAndEnableMFA(user.id, token);
      if (!ok) {
        setError('Invalid verification code');
        return;
      }
      setEnabled(true);
      setMessage('MFA enabled successfully');
      setQrCode(null);
      setSecret(null);
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
      const ok = await mfaService.disableMFA(user.id, token);
      if (!ok) {
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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold text-zinc-100">
        Multi-factor authentication
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        Add an authenticator app for stronger account security.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mt-4 rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200"
        >
          {message}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {!enabled && !qrCode && (
          <Button onClick={handleEnable} disabled={isBusy}>
            Enable MFA
          </Button>
        )}

        {qrCode && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-300">Scan QR code</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCode}
              alt="MFA QR code"
              width={180}
              height={180}
              className="rounded-md bg-white p-2"
            />
            {secret && (
              <p className="break-all font-mono text-xs text-zinc-500">
                Secret: {secret}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="mfa-token">Verification code</Label>
              <Input
                id="mfa-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="border-zinc-700 bg-zinc-800"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>
            <Button onClick={handleVerify} disabled={isBusy || token.length < 6}>
              Verify
            </Button>
          </div>
        )}

        {enabled && (
          <div className="space-y-3">
            <p className="text-sm text-emerald-300">MFA is enabled</p>
            <div className="space-y-2">
              <Label htmlFor="disable-mfa-token">Verification code</Label>
              <Input
                id="disable-mfa-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="border-zinc-700 bg-zinc-800"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleDisable}
              disabled={isBusy || token.length < 6}
            >
              Disable MFA
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
