'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogOut, Settings, User, Volume2, VolumeX } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getUserDisplayName } from '@/lib/auth/display-name';
import { useAuth } from '@/lib/hooks/useAuth';
import { isSoundMuted, playSound, setSoundMuted } from '@/lib/sound';

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setMuted(isSoundMuted());
  }, []);

  if (!user) {
    return null;
  }

  const displayName = getUserDisplayName(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          data-testid="user-menu"
          onClick={() => playSound('tap')}
        >
          <User className="h-4 w-4" />
          <span className="hidden max-w-[180px] truncate md:inline">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className="flex items-center gap-2"
            data-testid="account-menu-link"
          >
            <Settings className="h-4 w-4" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-testid="sound-toggle"
          onSelect={(event) => {
            event.preventDefault();
            const next = !muted;
            setSoundMuted(next);
            setMuted(next);
            if (!next) {
              playSound('pop');
            }
          }}
          className="flex items-center gap-2"
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {muted ? 'Unmute sounds' : 'Mute sounds'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={loading}
          data-testid="logout-button"
          onSelect={(event) => {
            event.preventDefault();
            playSound('soft');
            void signOut();
          }}
          className="flex items-center gap-2 text-red-300 focus:text-red-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
