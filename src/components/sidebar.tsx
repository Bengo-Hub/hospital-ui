'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, Lock, LogOut, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useBranding } from '@/providers/branding-provider';
import { useAuthStore } from '@/store/auth';
import { facilityModulesFor, useFacilityType } from '@/lib/facility-nomenclature';
import { NAV_ENTRIES, isNavGroup, type NavItem, type NavGroup } from '@/lib/nav-config';

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

function NavLink({ item, orgSlug, onClose }: { item: NavItem; orgSlug: string; onClose?: () => void }) {
  const pathname = usePathname();
  const href = `/${orgSlug}${item.href}`;
  const active = pathname === href;
  const Icon = item.icon;

  if (item.comingSoon) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/35 font-medium cursor-default select-none"
        title="Coming soon"
      >
        <Icon className="h-4.5 w-4.5 shrink-0 opacity-50" />
        <span className="truncate flex-1">{item.label}</span>
        <span className="flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground border border-border shrink-0">
          <Lock className="h-2.5 w-2.5" />
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm',
        active
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold'
          : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-foreground/8 font-medium'
      )}
    >
      <Icon className={cn('h-4.5 w-4.5 shrink-0 transition-transform duration-200', !active && 'group-hover:scale-110')} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

/** Whether a chained sub-module dropdown should start open — either it's not collapsed-by-default,
 * or it already contains the current route (so navigating straight to a sub-page never hides it
 * behind a closed chevron on load). */
function isGroupInitiallyOpen(group: NavGroup, orgSlug: string, pathname: string | null): boolean {
  if (!group.defaultCollapsed) return true;
  return group.items.some((item) => pathname === `/${orgSlug}${item.href}`);
}

function NavGroupSection({ group, orgSlug, onClose }: { group: NavGroup; orgSlug: string; onClose?: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => isGroupInitiallyOpen(group, orgSlug, pathname));
  const Icon = group.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm',
          'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-foreground/8 font-medium'
        )}
      >
        <Icon className="h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
        <span className="truncate flex-1 text-left">{group.label}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-sidebar-foreground/35 transition-transform duration-200 group-hover:text-sidebar-foreground/60',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} orgSlug={orgSlug} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const { tenant } = useBranding();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const facilityType = useFacilityType();

  const visibleModules = new Set(facilityModulesFor(facilityType));
  const navEntries = NAV_ENTRIES.filter((entry) => visibleModules.has(entry.module));

  const displayName = user?.fullName || tenant?.orgName || orgSlug;
  const displayInitial = displayName?.[0]?.toUpperCase() ?? '?';

  const content = (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="border-b border-sidebar-border shrink-0 overflow-hidden" style={{ height: '72px' }}>
        {tenant?.logoUrl ? (
          <div className="flex items-center h-full px-3 py-2">
            <img src={tenant.logoUrl} alt={tenant.name ?? orgSlug} className="h-full w-auto max-w-full object-contain" />
          </div>
        ) : (
          <div className="flex items-center gap-3 h-full px-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-sm font-bold text-primary-foreground">
                {(tenant?.orgName ?? orgSlug).slice(0, 2).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-bold text-sidebar-foreground truncate">
              {tenant?.orgName ?? orgSlug}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-hide">
        {navEntries.map((entry) =>
          isNavGroup(entry) ? (
            <NavGroupSection key={entry.label} group={entry} orgSlug={orgSlug} onClose={onClose} />
          ) : (
            <NavLink key={entry.href} item={entry} orgSlug={orgSlug} onClose={onClose} />
          )
        )}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-foreground/5">
          <div className="h-8 w-8 rounded-lg bg-primary/25 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{displayInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-sidebar-foreground/40 mt-0.5">Codevertex Afya</p>
          </div>
          <button
            onClick={() => void logout()}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-sidebar-foreground/35 hover:text-rose-400 hover:bg-sidebar-foreground/8 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300',
          'lg:static lg:inset-auto lg:h-full lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4 lg:hidden bg-sidebar">
          <span className="text-sm font-semibold text-sidebar-foreground">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{content}</div>
      </aside>
    </>
  );
}
