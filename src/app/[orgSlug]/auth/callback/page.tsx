'use client';

import { SSOCallbackError } from '@bengo-hub/shared-ui-lib/auth';
import { useAuthStore } from '@/store/auth';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const orgSlug = params?.orgSlug as string;
    const code = searchParams?.get('code');
    const error = searchParams?.get('error');
    const errorDescription = searchParams?.get('error_description');
    const { handleSSOCallback, status, error: authError, redirectToSSO } = useAuthStore();
    const hasStarted = useRef(false);

    useEffect(() => {
        if (code && orgSlug && !hasStarted.current) {
            hasStarted.current = true;
            const callbackUrl = `${window.location.origin}/${orgSlug}/auth/callback`;
            void handleSSOCallback(orgSlug, code, callbackUrl);
        }
    }, [code, orgSlug, handleSSOCallback]);

    useEffect(() => {
        if (status === 'authenticated') {
            const returnTo = sessionStorage.getItem('sso_return_to');
            sessionStorage.removeItem('sso_return_to');
            router.replace(returnTo || `/${orgSlug}/dashboard`);
        }
    }, [status, orgSlug, router]);

    if (error || authError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <SSOCallbackError
                    error={error}
                    errorDescription={errorDescription ?? authError}
                    orgSlug={orgSlug}
                    onRetry={() => void redirectToSSO(orgSlug, `/${orgSlug}/dashboard`)}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <h1 className="text-xl font-medium">Completing sign-in…</h1>
                <p className="text-muted-foreground">Setting up your session.</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <AuthCallbackContent />
        </Suspense>
    );
}
