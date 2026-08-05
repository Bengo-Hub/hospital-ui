import { apiClient } from '@/lib/api/client';
import { revokeServerSession as sharedRevokeServerSession } from '@bengo-hub/shared-ui-lib/auth';

const SSO_BASE_URL =
    process.env.NEXT_PUBLIC_AUTH_URL || process.env.NEXT_PUBLIC_SSO_URL || 'https://sso.codevertexafrica.com';
const SSO_CLIENT_ID = process.env.NEXT_PUBLIC_SSO_CLIENT_ID || 'hospital-ui';

export interface HospitalProfile {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
    permissions: string[];
    tenant_id: string;
    tenant_slug: string;
    isPlatformOwner: boolean;
    isSuperUser: boolean;
}

/**
 * Fetch the current user's hospital-service profile: GET /api/v1/{tenantSlug}/hospital/auth/me.
 *
 * hospital-api has not shipped this endpoint yet (Sprint-0 — only /ping is mounted under
 * /api/v1/{tenant}/hospital). Rather than crash the login flow on a 404, fall back to the SSO
 * identity (auth-api's own /auth/me) so the app still authenticates with a usable profile. Once
 * hospital-api ships local RBAC sync, this simply stops taking the fallback branch.
 */
export async function fetchHospitalProfile(tenantSlug: string, accessToken?: string): Promise<HospitalProfile> {
    try {
        const data = await apiClient.get<{
            id: string;
            email: string;
            tenant_id: string;
            tenant_slug: string;
            roles: string[];
            permissions: string[];
            is_platform_owner: boolean;
            is_superuser: boolean;
        }>(`/api/v1/${tenantSlug}/hospital/auth/me`);

        const roles: string[] = Array.isArray(data.roles) ? data.roles : [];
        return {
            id: data.id ?? '',
            email: data.email ?? '',
            fullName: data.email ?? '',
            roles,
            permissions: Array.isArray(data.permissions) ? data.permissions : [],
            tenant_id: data.tenant_id ?? '',
            tenant_slug: data.tenant_slug ?? tenantSlug,
            isPlatformOwner: data.is_platform_owner === true,
            isSuperUser: roles.includes('superuser') || roles.includes('hospital_admin'),
        };
    } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
            return fetchSSOProfileFallback(tenantSlug, accessToken);
        }
        throw err;
    }
}

async function fetchSSOProfileFallback(tenantSlug: string, accessToken?: string): Promise<HospitalProfile> {
    const profile = await fetchProfile(accessToken);
    return {
        ...profile,
        tenant_slug: profile.tenant_slug || tenantSlug,
    };
}

export interface AuthorizeParams {
    codeChallenge: string;
    state: string;
    redirectUri: string;
    scope?: string;
    /** Pass explicitly so the token is minted for this tenant (e.g. orgSlug from route). */
    tenant?: string;
}

export interface TokenExchangeParams {
    code: string;
    codeVerifier: string;
    redirectUri: string;
}

export function buildAuthorizeUrl({ codeChallenge, state, redirectUri, scope, tenant: tenantParam }: AuthorizeParams): string {
    const url = new URL('/api/v1/authorize', SSO_BASE_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', SSO_CLIENT_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scope || 'openid profile email offline_access');
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    const tenant = tenantParam ?? (typeof window !== 'undefined' ? localStorage.getItem('tenantSlug') : null);
    if (tenant) {
        url.searchParams.set('tenant', tenant);
    }

    return url.toString();
}

export async function revokeServerSession(accessToken?: string | null): Promise<void> {
    return sharedRevokeServerSession(SSO_BASE_URL, accessToken);
}

export async function exchangeCodeForTokens(params: TokenExchangeParams) {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: params.code,
        redirect_uri: params.redirectUri,
        client_id: SSO_CLIENT_ID,
        code_verifier: params.codeVerifier,
    });

    const response = await fetch(`${SSO_BASE_URL}/api/v1/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || errorData.error || 'Token exchange failed');
    }

    return response.json();
}

export async function refreshTokens(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
}> {
    const response = await fetch(`${SSO_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken, client_id: SSO_CLIENT_ID }),
    });
    if (!response.ok) throw new Error('Token refresh failed');
    return response.json();
}

/**
 * Fetch user profile directly from SSO auth-api (not hospital-api — avoids the JIT-sync delay
 * and doubles as the graceful fallback while hospital-api has no /auth/me of its own).
 */
export async function fetchProfile(accessToken?: string): Promise<HospitalProfile> {
    const token = accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${SSO_BASE_URL}/api/v1/auth/me`, { headers });
    if (!res.ok) {
        const err: any = new Error(res.status === 401 ? 'Unauthorized' : 'SSO /me failed');
        err.response = { status: res.status };
        throw err;
    }
    const data = await res.json();
    const roles: string[] = Array.isArray(data.roles) ? data.roles : [];
    return {
        id: data.id ?? '',
        email: data.email ?? '',
        fullName: data.fullName ?? data.full_name ?? data.email ?? '',
        roles,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        tenant_id: data.tenant_id ?? '',
        tenant_slug: data.tenant_slug ?? '',
        isPlatformOwner: data.is_platform_owner === true || (data.tenant_slug ?? '') === 'codevertex',
        isSuperUser: roles.includes('superuser'),
    };
}
