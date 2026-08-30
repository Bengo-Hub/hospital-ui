import { apiClient } from '@/lib/api/client';
import { useOutletStore } from '@/store/outlet';
import {
    buildAuthorizeUrl,
    exchangeCodeForTokens,
    fetchHospitalProfile,
    loginWithPassword as loginWithPasswordRequest,
    revokeServerSession,
    type PasswordLoginResult,
} from '@/lib/auth/api';
import {
    consumeVerifier,
    generateCodeChallenge,
    generateCodeVerifier,
    generateState,
    storeState,
    storeVerifier
} from '@/lib/auth/pkce';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
    permissions: string[];
    tenant_id: string;
    tenant_slug: string;
    isPlatformOwner?: boolean;
    isSuperUser?: boolean;
}

interface Session {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}

interface AuthState {
    status: 'idle' | 'loading' | 'authenticated' | 'error' | 'syncing';
    user: UserProfile | null;
    session: Session | null;
    error: string | null;
    lastAuthenticatedAt: number | null;

    /** Subscription info fetched lazily after login (undefined = not started, null = loading). */
    subscriptionInfo: Record<string, unknown> | null | undefined;
    setSubscriptionInfo: (info: Record<string, unknown> | null) => void;

    initialize: () => Promise<void>;
    redirectToSSO: (orgSlug: string, returnTo?: string) => Promise<void>;
    handleSSOCallback: (orgSlug: string, code: string, callbackUrl: string) => Promise<void>;
    /** Email+password login (see lib/auth/api.ts's loginWithPassword). Returns an MFA challenge
     *  the caller should re-submit with totpCode filled in, or resolves once fully authenticated. */
    loginWithPassword: (orgSlug: string, email: string, password: string, totpCode?: string) => Promise<PasswordLoginResult>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            status: 'idle',
            user: null,
            session: null,
            error: null,
            lastAuthenticatedAt: null,
            subscriptionInfo: undefined,
            setSubscriptionInfo: (info: Record<string, unknown> | null) => set({ subscriptionInfo: info }),

            initialize: async () => {
                const { session, user } = get();
                if (!session) {
                    set({ status: 'idle' });
                    return;
                }

                apiClient.setAccessToken(session.accessToken);
                if (user) {
                    apiClient.setTenantInfo(user.tenant_id, user.tenant_slug);
                }

                // Hydrate from storage if user profile exists and token hasn't expired.
                if (user && session.expiresAt) {
                    const expiresAt = new Date(session.expiresAt).getTime();
                    if (Date.now() < expiresAt - 60_000) {
                        set({ status: 'authenticated', lastAuthenticatedAt: Date.now() });
                        return;
                    }
                }

                set({ status: 'loading' });

                const storedSlug = user?.tenant_slug
                    ?? (typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') : null)
                    ?? '';
                try {
                    const freshUser = await fetchHospitalProfile(storedSlug, session.accessToken);
                    apiClient.setTenantInfo(freshUser.tenant_id, freshUser.tenant_slug);
                    set({ user: freshUser, status: 'authenticated', lastAuthenticatedAt: Date.now() });
                } catch (error) {
                    console.error('Failed to initialize auth:', error);
                    set({ status: 'idle', session: null, user: null });
                }
            },

            redirectToSSO: async (orgSlug: string, returnTo?: string) => {
                set({ status: 'loading', error: null });
                try {
                    const verifier = generateCodeVerifier();
                    const challenge = await generateCodeChallenge(verifier);
                    const state = generateState();

                    storeVerifier(verifier);
                    storeState(state);

                    if (returnTo && typeof window !== 'undefined') {
                        sessionStorage.setItem('sso_return_to', returnTo);
                    }

                    const callbackUrl = `${window.location.origin}/${orgSlug}/auth/callback`;
                    const authorizeUrl = buildAuthorizeUrl({
                        codeChallenge: challenge,
                        state,
                        redirectUri: callbackUrl,
                        tenant: orgSlug,
                    });

                    window.location.href = authorizeUrl;
                } catch (error) {
                    set({ status: 'error', error: 'Failed to start sign-in' });
                    throw error;
                }
            },

            handleSSOCallback: async (orgSlug: string, code: string, callbackUrl: string) => {
                set({ status: 'syncing', error: null });
                const verifier = consumeVerifier();

                if (!verifier) {
                    set({ status: 'error', error: 'Session expired' });
                    return;
                }

                try {
                    const tokens = await exchangeCodeForTokens({
                        code,
                        codeVerifier: verifier,
                        redirectUri: callbackUrl,
                    });

                    const session: Session = {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token || '',
                        expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                    };

                    apiClient.setAccessToken(session.accessToken);
                    set({ session });

                    if (typeof window !== 'undefined') {
                        localStorage.setItem('tenantSlug', orgSlug);
                    }

                    const user = await fetchHospitalProfile(orgSlug, session.accessToken);
                    apiClient.setTenantInfo(user.tenant_id, user.tenant_slug);
                    set({ user, status: 'authenticated', lastAuthenticatedAt: Date.now() });
                } catch {
                    set({ status: 'error', error: 'Sign-in failed' });
                }
            },

            loginWithPassword: async (orgSlug: string, email: string, password: string, totpCode?: string) => {
                set({ status: 'loading', error: null });
                let result: PasswordLoginResult;
                try {
                    result = await loginWithPasswordRequest({ email, password, tenantSlug: orgSlug, totpCode });
                } catch (error) {
                    set({ status: 'idle', error: error instanceof Error ? error.message : 'Sign-in failed' });
                    throw error;
                }
                if (result.mfaRequired) {
                    // Not yet authenticated — the caller (login form) re-prompts for a TOTP code
                    // and calls loginWithPassword again with it. Reset to idle, not error: this
                    // is an expected intermediate step, not a failure.
                    set({ status: 'idle' });
                    return result;
                }

                const session: Session = {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken || '',
                    expiresAt: new Date(Date.now() + result.expiresIn * 1000).toISOString(),
                };
                apiClient.setAccessToken(session.accessToken);
                set({ session });
                if (typeof window !== 'undefined') {
                    localStorage.setItem('tenantSlug', orgSlug);
                }
                try {
                    const user = await fetchHospitalProfile(orgSlug, session.accessToken);
                    apiClient.setTenantInfo(user.tenant_id, user.tenant_slug);
                    set({ user, status: 'authenticated', lastAuthenticatedAt: Date.now() });
                } catch (error) {
                    set({ status: 'error', error: 'Signed in, but could not load your profile' });
                    throw error;
                }
                return result;
            },

            logout: async () => {
                const token = get().session?.accessToken;
                const slug = get().user?.tenant_slug
                    ?? (typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') : null)
                    ?? '';
                await revokeServerSession(token);
                set({ status: 'idle', user: null, session: null, subscriptionInfo: undefined, lastAuthenticatedAt: null });
                apiClient.setAccessToken(null);
                apiClient.setTenantInfo(null, null);
                useOutletStore.getState().clear();
                if (typeof window !== 'undefined') {
                    try { localStorage.removeItem('tenantSlug'); } catch { /* no-op */ }
                    try { localStorage.removeItem('hospital-auth-storage'); } catch { /* no-op */ }
                    try { sessionStorage.clear(); } catch { /* no-op */ }
                    window.location.href = slug ? `/${slug}/login` : '/';
                }
            },
        }),
        {
            name: 'hospital-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                session: state.session,
                user: state.user,
            }),
            // Restore the access token + tenant headers onto the API client the instant the store
            // rehydrates — BEFORE any query fires. Otherwise the first request on a page refresh
            // goes out unauthenticated, 401s, and the on401 handler logs the user out.
            onRehydrateStorage: () => (state) => {
                if (state?.session?.accessToken) {
                    apiClient.setAccessToken(state.session.accessToken);
                    if (state.user) {
                        apiClient.setTenantInfo(state.user.tenant_id, state.user.tenant_slug);
                    }
                    const exp = state.session.expiresAt ? new Date(state.session.expiresAt).getTime() : 0;
                    if (!exp || Date.now() < exp) {
                        state.lastAuthenticatedAt = Date.now();
                        state.status = 'authenticated';
                    }
                }
            },
        }
    )
);
