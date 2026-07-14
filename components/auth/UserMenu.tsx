'use client';

import Link from 'next/link';
import { LogOut, Settings, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getUserDisplayName } from '@/lib/auth/display-name';
import { Permission } from '@/lib/auth/rbac';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRBAC } from '@/lib/hooks/useRBAC';

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const { hasPermission } = useRBAC();
  const canOpenSettings = hasPermission(Permission.SYSTEM_SETTINGS);

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
        >
          <User className="h-4 w-4" />
          <span className="hidden max-w-[180px] truncate md:inline">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canOpenSettings && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Security settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          disabled={loading}
          data-testid="logout-button"
          onSelect={(event) => {
            event.preventDefault();
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
