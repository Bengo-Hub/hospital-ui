'use client';

import { useAuthStore } from '@/store/auth';
import { useAppPermissions } from '@/hooks/use-app-permissions';
import { useState } from 'react';
import { ChevronDown, ExternalLink, LogOut, Menu, User } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { useBranding } from '@/providers/branding-provider';
import { useParams } from 'next/navigation';
import { useVisibleServices, type ServiceKey } from '@bengo-hub/shared-ui-lib/app-switcher';

// Canonical service list (labels/icons/coverage, incl. 'coming-soon' entries) lives in
// shared-ui-lib's app-switcher — see useVisibleServices below. hospital-ui ('afya' in the
// registry) doesn't list itself; this is the map of the OTHER services it links out to, each
// base URL resolved from this app's own NEXT_PUBLIC_* env vars (mirrors pos-ui's header.tsx,
// which carries the reciprocal `afya: NEXT_PUBLIC_HOSPITAL_UI_URL` entry).
const SERVICE_URLS: Partial<Record<ServiceKey, string>> = {
  pos: process.env.NEXT_PUBLIC_POS_UI_URL ?? 'https://pos.codevertexafrica.com',
  inventory: process.env.NEXT_PUBLIC_INVENTORY_UI_URL ?? 'https://inventory.codevertexafrica.com',
  marketflow: process.env.NEXT_PUBLIC_CRM_UI_URL ?? process.env.NEXT_PUBLIC_MARKETFLOW_UI_URL ?? 'https://marketflow.codevertexafrica.com',
  logistics: process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ?? 'https://logistics.codevertexafrica.com',
  erp: process.env.NEXT_PUBLIC_ERP_UI_URL ?? 'https://erp.codevertexafrica.com',
  ordering: process.env.NEXT_PUBLIC_ORDERING_UI_URL ?? 'https://ordering.codevertexafrica.com',
  projects: process.env.NEXT_PUBLIC_PROJECTS_UI_URL ?? 'https://projects.codevertexafrica.com',
  subscriptions: process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL ?? 'https://pricing.codevertexafrica.com',
  auth: process.env.NEXT_PUBLIC_AUTH_UI_URL ?? 'https://accounts.codevertexafrica.com',
};

function displayName(user: { fullName?: string; email?: string } | null): string {
  if (!user) return 'Account';
  return user.fullName || user.email?.split('@')[0] || 'Account';
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const params = useParams();
  const orgSlug = (params?.orgSlug as string) || 'codevertex';
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const { getServiceTitle } = useBranding();
  const [profileOpen, setProfileOpen] = useState(false);
  const isAuthenticated = !!user && !!session;
  const name = displayName(user);
  const role = user?.roles?.[0];

  const { isSuperuser } = useAppPermissions();
  // No mid-tier "manager" role is defined for hospital-api's RBAC catalog yet (Sprint-0) — gate
  // the cross-service switcher on superuser/platform-owner only, same signal isSuperuser already
  // carries. Widen this once hospital-api ships facility-admin-style roles.
  const canManageLinks = isSuperuser || !!user?.isPlatformOwner;
  const services = useVisibleServices({ orgSlug, urls: SERVICE_URLS, canManageLinks });

  return (
    <header className="h-16 sm:h-20 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-accent transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
        <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground uppercase truncate">
          {getServiceTitle('Afya')}
        </h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        <ThemeToggle />
        <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

        {isAuthenticated && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-3 rounded-2xl hover:bg-accent p-1 transition-all group"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="Open profile menu"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-105">
                {name[0]?.toUpperCase() ?? <User className="h-5 w-5" />}
              </div>
              <div className="hidden md:block text-left mr-1">
                <p className="text-xs font-black text-foreground truncate max-w-[120px]">{name}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{role || 'Staff'}</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-5rem)] overflow-y-auto rounded-[1.5rem] p-3 shadow-2xl border border-border bg-popover">
                  <div className="mb-2 px-3 py-2">
                    <p className="text-sm font-black text-foreground">{name}</p>
                    <p className="text-[10px] text-muted-foreground truncate font-bold uppercase tracking-widest mt-0.5">
                      {role || 'Staff'} · {orgSlug}
                    </p>
                  </div>

                  {canManageLinks && services.length > 0 && (
                    <>
                      <div className="h-px bg-border my-2 mx-1" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 mb-1.5">Services</p>
                      <div className="grid gap-1">
                        {services.map(({ key, label, href, Icon }) =>
                          href ? (
                            <a
                              key={key}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-foreground/70 hover:bg-accent hover:text-foreground transition-all group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center group-hover:text-primary transition-colors">
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="flex-1">{label}</span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60" />
                            </a>
                          ) : (
                            <div
                              key={key}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-muted-foreground/60 cursor-default"
                              title={`${label} — coming soon`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="flex-1">{label}</span>
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-accent px-1.5 py-0.5 rounded-full">Soon</span>
                            </div>
                          ),
                        )}
                      </div>
                    </>
                  )}

                  <div className="h-px bg-border my-2 mx-1" />
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); void logout(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-500/10 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center transition-colors">
                      <LogOut className="h-4 w-4" />
                    </div>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
