'use client';

import { apiClient } from '@/lib/api/client';
import { parseLimitInfo } from '@/lib/api/error-handler';
import { LimitReachedModal } from '@/components/subscription/limit-reached-modal';
import { useLimitModal } from '@/store/limit-modal';
import { useAuthStore } from '@/store/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function AuthProvider({ children }: { children: ReactNode }) {
    const { status, initialize } = useAuthStore();
    const pathname = usePathname();
    const params = useParams();
    const router = useRouter();
    const orgSlug = params?.orgSlug as string;
    const logout = useAuthStore((s) => s.logout);
    const queryClient = useQueryClient();

    const isAuthRoute = !!pathname && pathname.includes('/auth/');
    const isLoginRoute = !!pathname && pathname.includes('/login');

    // `ready` = initialize() has run and restored any persisted session. We must NOT decide to
    // redirect an "idle" user to /login until this completes, otherwise a page refresh bounces
    // an authenticated user to login before their stored session is rehydrated.
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let active = true;
        initialize().finally(() => { if (active) setReady(true); });
        return () => { active = false; };
    }, [initialize]);

    // Register 401 handler: clear all caches and redirect to SSO.
    useEffect(() => {
        apiClient.setOn401(() => {
            const { status, lastAuthenticatedAt } = useAuthStore.getState();
            if (status === 'syncing' || status === 'loading') return;
            if (lastAuthenticatedAt && Date.now() - lastAuthenticatedAt < 15_000) return;
            queryClient.clear();
            void logout();
        });
        return () => apiClient.setOn401(null);
    }, [queryClient, logout]);

    // Subscription 403s and 5xx errors must never fail silently — always toast.
    useEffect(() => {
        apiClient.setOnSubscription403(() => {
            toast.error('This feature is not available on your current plan.');
        });
        apiClient.setOnServerError((_status, message) => {
            toast.error(message || 'Something went wrong on our end. Please try again.');
        });
        apiClient.setOnLimitReached((data) => {
            const info = parseLimitInfo(data);
            if (info) useLimitModal.getState().show(info);
        });
        return () => {
            apiClient.setOnSubscription403(null);
            apiClient.setOnServerError(null);
            apiClient.setOnLimitReached(null);
        };
    }, []);

    // Unauthenticated users land on the plain SSO login page.
    useEffect(() => {
        if (ready && status === 'idle' && !isAuthRoute && !isLoginRoute && orgSlug) {
            router.replace(`/${orgSlug}/login`);
        }
    }, [ready, status, isAuthRoute, isLoginRoute, orgSlug, router]);

    const loading = !ready || status === 'loading';
    if (loading && !isAuthRoute) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">Initializing session...</div>
            </div>
        );
    }

    return (
        <>
            {children}
            <LimitReachedModal />
        </>
    );
}
