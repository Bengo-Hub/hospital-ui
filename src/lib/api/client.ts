import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const isDev = process.env.NODE_ENV !== 'production';
const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (isDev ? 'http://localhost:4200' : 'https://afyaapi.codevertexafrica.com');

class ApiClient {
    private instance: AxiosInstance;
    private accessToken: string | null = null;
    private tenantId: string | null = null;
    private tenantSlug: string | null = null;
    private platformOwner = false;

    constructor() {
        this.instance = axios.create({
            baseURL: apiBaseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });

        this.instance.interceptors.request.use(this.handleRequest);
        this.instance.interceptors.response.use(this.handleResponse, this.handleError);
    }

    private handleRequest = (config: InternalAxiosRequestConfig) => {
        // FormData must be sent as multipart — delete the default application/json header
        // so Axios (and the browser) can set Content-Type with the correct multipart boundary.
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        if (this.accessToken) {
            config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        if (!this.platformOwner) {
            if (this.tenantId) {
                config.headers['X-Tenant-ID'] = this.tenantId;
            }
            if (this.tenantSlug) {
                config.headers['X-Tenant-Slug'] = this.tenantSlug;
            }
        }
        return config;
    };

    private handleResponse = (response: AxiosResponse) => response;

    private on401Callback: (() => void) | null = null;
    private onSubscription403Callback: ((data: any) => void) | null = null;
    private onLimitReachedCallback: ((data: any) => void) | null = null;
    private onServerErrorCallback: ((status: number, message: string) => void) | null = null;

    /** Register a callback to run when any API response is 401 (e.g. clear session / redirect to auth). */
    public setOn401(callback: (() => void) | null) {
        this.on401Callback = callback;
    }

    /** Register a callback for subscription-related 403 errors (code=subscription_inactive, upgrade=true). */
    public setOnSubscription403(callback: ((data: any) => void) | null) {
        this.onSubscription403Callback = callback;
    }

    /** Register a callback for 402 plan-limit-reached errors. */
    public setOnLimitReached(callback: ((data: any) => void) | null) {
        this.onLimitReachedCallback = callback;
    }

    /** Register a callback for 5xx server errors so a global toast can be shown (never fail silently). */
    public setOnServerError(callback: ((status: number, message: string) => void) | null) {
        this.onServerErrorCallback = callback;
    }

    private handleError = async (error: any) => {
        const status = error.response?.status;

        if (status === 401) {
            // If token is already cleared (explicit logout in progress), skip entirely
            if (!this.accessToken) return Promise.reject(error);

            const url: string = error.config?.url ?? '';
            if (!url.includes('/auth/me') && !error.config?._retried) {
                const { refreshAccessToken } = await import('@/lib/auth/token-refresh');
                const newToken = await refreshAccessToken();

                if (newToken) {
                    this.accessToken = newToken;
                    error.config._retried = true;
                    error.config.headers.Authorization = `Bearer ${newToken}`;
                    return this.instance.request(error.config);
                }

                this.on401Callback?.();
            }
        }
        if (status === 403 && this.onSubscription403Callback) {
            const data = error.response?.data;
            if (data?.code === 'subscription_inactive' || data?.upgrade === true) {
                this.onSubscription403Callback(data);
            }
        }
        // 402 Payment Required = a plan limit was hit.
        if (status === 402 && this.onLimitReachedCallback) {
            this.onLimitReachedCallback(error.response?.data);
        }
        if (status >= 500 && this.onServerErrorCallback) {
            const data = error.response?.data;
            const message = data?.message ?? data?.error ?? 'A server error occurred. Please try again.';
            this.onServerErrorCallback(status, message);
        }
        // Normalize the real backend message onto the error so call sites can show it
        // (instead of a generic "Failed to …"). Handles Blob bodies from responseType:'blob'.
        try {
            const { apiErrorMessage } = await import('./error-message');
            const msg = await apiErrorMessage(error, '');
            if (msg) (error as { normalizedMessage?: string }).normalizedMessage = msg;
        } catch {
            /* never let normalization mask the original error */
        }
        return Promise.reject(error);
    };

    public setAccessToken(token: string | null) {
        this.accessToken = token;
    }

    public setTenantInfo(id: string | null, slug: string | null) {
        this.tenantId = id;
        this.tenantSlug = slug;
    }

    public setPlatformOwner(isPlatformOwner: boolean) {
        this.platformOwner = isPlatformOwner;
    }

    public get<T>(url: string, params?: any): Promise<T> {
        return this.instance.get<T>(url, { params }).then((res: AxiosResponse<T>) => res.data);
    }

    public post<T>(url: string, data?: any): Promise<T> {
        return this.instance.post<T>(url, data).then((res: AxiosResponse<T>) => res.data);
    }

    public put<T>(url: string, data?: any): Promise<T> {
        return this.instance.put<T>(url, data).then((res: AxiosResponse<T>) => res.data);
    }

    public patch<T>(url: string, data?: any): Promise<T> {
        return this.instance.patch<T>(url, data).then((res: AxiosResponse<T>) => res.data);
    }

    public delete<T>(url: string): Promise<T> {
        return this.instance.delete<T>(url).then((res: AxiosResponse<T>) => res.data);
    }

    /** GET a binary payload (e.g. a generated PDF) as a Blob, carrying the shared auth + tenant headers. */
    public getBlob(url: string, params?: any): Promise<Blob> {
        return this.instance
            .get(url, { params, responseType: 'blob' })
            .then((res: AxiosResponse<Blob>) => res.data);
    }

    /** The configured API base URL (for building direct <img>/download links). */
    public get baseUrl(): string {
        return apiBaseUrl;
    }
}

export const apiClient = new ApiClient();
