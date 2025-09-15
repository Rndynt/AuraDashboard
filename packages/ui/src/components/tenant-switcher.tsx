'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Building2, Check } from 'lucide-react';
import { cn } from '../utils.js';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface TenantSwitcherProps {
  currentTenant: Tenant;
  availableTenants: Tenant[];
  onTenantChange: (tenant: Tenant) => void;
  onCreateTenant?: () => void;
  className?: string;
}

export function TenantSwitcher({
  currentTenant,
  availableTenants,
  onTenantChange,
  onCreateTenant,
  className,
}: TenantSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTenantSelect = (tenant: Tenant) => {
    onTenantChange(tenant);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 text-sm text-left bg-muted rounded-md hover:bg-secondary transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-accent-foreground">
              {currentTenant.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-foreground">{currentTenant.name}</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform",
          isOpen && "transform rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-md shadow-lg z-50">
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mb-2">
                Switch Tenant
              </div>
              
              <div className="space-y-1">
                {availableTenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => handleTenantSelect(tenant)}
                    className={cn(
                      "w-full flex items-center space-x-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      tenant.id === currentTenant.id && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {tenant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">/{tenant.slug}</div>
                    </div>
                    {tenant.id === currentTenant.id && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>

              {onCreateTenant && (
                <>
                  <div className="border-t border-border my-2" />
                  <button
                    onClick={() => {
                      onCreateTenant();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Plus className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-medium">Create Tenant</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
