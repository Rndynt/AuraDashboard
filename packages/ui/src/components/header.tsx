'use client';

import React from 'react';
import { Bell, HelpCircle, UserPlus, ChevronRight } from 'lucide-react';
import { cn } from '../utils';
import type { AuthorizedUser } from '@acme/rbac/client';
import { PERMISSIONS } from '@acme/rbac/client';

interface HeaderProps {
  user: AuthorizedUser;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onInviteMember?: () => void;
}

export function Header({ user, breadcrumbs = [], onInviteMember }: HeaderProps) {
  const canInviteMembers = user.isSuperuser || user.permissions.includes(PERMISSIONS.MEMBER_INVITE);

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && <ChevronRight className="w-4 h-4" />}
                {crumb.href ? (
                  <a 
                    href={crumb.href} 
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className={cn(
                    index === breadcrumbs.length - 1 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground"
                  )}>
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          
          {canInviteMembers && (
            <>
              <div className="w-px h-6 bg-border" />
              <button 
                onClick={onInviteMember}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
