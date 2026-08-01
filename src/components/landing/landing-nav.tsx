'use client';

import { Button } from '@/components/ui/base';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const DEMO_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || 'codevertex-demo';
const DEMO_LOGIN_HREF = `/${DEMO_SLUG}/login`;

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Trust & compliance', href: '#trust' },
  { label: 'Pricing', href: '#pricing' },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Codevertex Afya home">
          <span className="h-9 w-9 rounded-xl bg-brand-primary text-brand-contrast flex items-center justify-center font-black text-sm shadow-sm">
            CA
          </span>
          <span className="text-lg font-black tracking-tight text-foreground">
            Codevertex <span className="text-brand-primary">Afya</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href={DEMO_LOGIN_HREF}>
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href={DEMO_LOGIN_HREF}>
            <Button variant="primary" size="sm" className="bg-brand-primary text-brand-contrast hover:bg-brand-emphasis">
              Try the Demo
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          'md:hidden overflow-hidden border-t border-border/70 bg-background transition-[max-height] duration-300 ease-out',
          open ? 'max-h-80' : 'max-h-0 border-t-0',
        )}
      >
        <div className="px-4 sm:px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-semibold text-foreground/80 hover:bg-accent transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-border/70">
            <Link href={DEMO_LOGIN_HREF} onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full">Sign In</Button>
            </Link>
            <Link href={DEMO_LOGIN_HREF} onClick={() => setOpen(false)}>
              <Button variant="primary" className="w-full bg-brand-primary text-brand-contrast hover:bg-brand-emphasis">
                Try the Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
