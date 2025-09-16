'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  Shield, 
  Key, 
  FileText, 
  Activity, 
  Settings, 
  User,
  Crown,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '../utils';
import type { AuthorizedUser } from '@acme/rbac/client';
import { PERMISSIONS } from '@acme/rbac/client';

interface SidebarProps {
  user: AuthorizedUser;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  memberCount: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: string;
  badge?: string | number;
}

export function Sidebar({ user, tenant, memberCount }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('/dashboard');
  
  const handleTenantSwitch = () => {
    // TODO: Implement tenant switching modal/dropdown
    console.log('Tenant switch requested');
  };

  const handleProfileMenu = () => {
    // TODO: Implement profile menu
    console.log('Profile menu requested');
  };

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    return user.isSuperuser || user.permissions.includes(permission);
  };

  const navigationItems: NavItem[] = [
    {
      href: `/${tenant.slug}/dashboard`,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      permission: PERMISSIONS.DASHBOARD_VIEW,
    },
  ];

  const managementItems: NavItem[] = [
    {
      href: `/${tenant.slug}/members`,
      label: 'Team Members',
      icon: <Users className="w-4 h-4" />,
      permission: PERMISSIONS.MEMBER_VIEW,
      badge: memberCount,
    },
    {
      href: `/${tenant.slug}/roles`,
      label: 'Roles & Permissions',
      icon: <Shield className="w-4 h-4" />,
      permission: PERMISSIONS.ROLE_VIEW,
    },
    {
      href: `/${tenant.slug}/api-keys`,
      label: 'API Keys',
      icon: <Key className="w-4 h-4" />,
      permission: PERMISSIONS.APIKEY_VIEW,
    },
  ];

  const securityItems: NavItem[] = [
    {
      href: `/${tenant.slug}/audit`,
      label: 'Audit Logs',
      icon: <FileText className="w-4 h-4" />,
      permission: PERMISSIONS.AUDIT_VIEW,
    },
    {
      href: `/${tenant.slug}/sessions`,
      label: 'Sessions',
      icon: <Activity className="w-4 h-4" />,
    },
  ];

  const settingsItems: NavItem[] = [
    {
      href: `/${tenant.slug}/settings`,
      label: 'Tenant Settings',
      icon: <Settings className="w-4 h-4" />,
      permission: PERMISSIONS.TENANT_UPDATE,
    },
    {
      href: `/${tenant.slug}/profile`,
      label: 'Profile',
      icon: <User className="w-4 h-4" />,
      permission: PERMISSIONS.PROFILE_VIEW,
    },
  ];

  const NavSection = ({ 
    title, 
    items 
  }: { 
    title: string; 
    items: NavItem[] 
  }) => (
    <div className="pt-4">
      <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="mt-2 space-y-1">
        {items.filter(item => hasPermission(item.permission)).map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors",
              activeItem === item.href && "text-primary bg-primary/10"
            )}
            onClick={() => setActiveItem(item.href)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <aside className="flex flex-col w-64 bg-card border-r border-border">
      {/* Logo and Brand */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Better Auth</h1>
            <p className="text-xs text-muted-foreground">Enterprise</p>
          </div>
        </div>
      </div>

      {/* Tenant Switcher */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <button 
            onClick={handleTenantSwitch}
            className="flex items-center justify-between w-full p-2 text-sm text-left bg-muted rounded-md hover:bg-secondary transition-colors"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-accent-foreground">
                  {tenant.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium text-foreground">{tenant.name}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Superuser Badge */}
        {user.isSuperuser && (
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                Superuser Mode
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {/* Dashboard */}
        <div>
          {navigationItems.filter(item => hasPermission(item.permission)).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md",
                activeItem === item.href 
                  ? "text-primary bg-primary/10" 
                  : "text-foreground hover:bg-muted transition-colors"
              )}
              onClick={() => setActiveItem(item.href)}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </div>

        <NavSection title="Management" items={managementItems} />
        <NavSection title="Security" items={securityItems} />
        <NavSection title="Settings" items={settingsItems} />
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <button 
            onClick={handleProfileMenu}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
