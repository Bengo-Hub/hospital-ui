'use client';

import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { AuthProvider } from '@/providers/auth-provider';
import { BrandingProvider } from '@/providers/branding-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';

export function OrgShell({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    }));
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    // The login page and /auth/* callback are full-screen routes — render them standalone,
    // NOT inside the authenticated app shell (sidebar/header).
    const isStandaloneRoute = !!pathname && (pathname.includes('/auth/') || pathname.includes('/login'));

    if (isStandaloneRoute) {
        return (
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <BrandingProvider>
                        <div className="min-h-screen bg-background">{children}</div>
                    </BrandingProvider>
                </AuthProvider>
            </QueryClientProvider>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <BrandingProvider>
                    <div className="fixed inset-0 flex overflow-hidden bg-background">
                        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            <Header onMenuClick={() => setSidebarOpen(true)} />
                            <main className="flex-1 min-h-0 overflow-y-auto bg-accent/5">
                                <div className="min-h-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6">{children}</div>
                            </main>
                        </div>
                    </div>
                </BrandingProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
