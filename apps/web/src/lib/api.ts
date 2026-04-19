import { AppError } from "@novabots/types";
import { supabase } from "./supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Production-grade API client with automatic Supabase auth token injection,
 * transparent token refresh on 401, and structured error handling.
 */
class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Retrieve the current Supabase access token, refreshing if expired.
     */
    private async getAccessToken(): Promise<string | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
    }

    /**
     * Build merged headers with auth token and content-type defaults.
     */
    private async buildHeaders(overrides: HeadersInit = {}): Promise<Record<string, string>> {
        const token = await this.getAccessToken();
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        // Merge caller-provided overrides (they win)
        if (overrides instanceof Headers) {
            overrides.forEach((v, k) => { headers[k] = v; });
        } else if (Array.isArray(overrides)) {
            overrides.forEach(([k, v]) => { headers[k] = v; });
        } else {
            Object.assign(headers, overrides);
        }
        return headers;
    }

    /**
     * Core request method: fires the request, handles 401 refresh-and-retry,
     * and converts non-OK responses into structured AppError objects.
     */
    private async request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
        const headers = await this.buildHeaders(options.headers);

        let response = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers,
        });

        // On 401, attempt a single token refresh then retry
        if (response.status === 401) {
            const { error } = await supabase.auth.refreshSession();
            if (!error) {
                const refreshedHeaders = await this.buildHeaders(options.headers);
                response = await fetch(`${this.baseUrl}${path}`, {
                    ...options,
                    headers: refreshedHeaders,
                });
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new AppError(
                errorData.error?.code || "API_ERROR",
                errorData.error?.message || `Request failed with status ${response.status}`,
                response.status,
                errorData.error?.details,
            );
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return undefined as T;
        }

        return response.json();
    }

    // Public convenience methods

    async get<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
        return this.request<T>(path, { ...options, method: "GET" });
    }

    async post<T = unknown>(path: string, body?: unknown, options: RequestInit = {}): Promise<T> {
        return this.request<T>(path, {
            ...options,
            method: "POST",
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
    }

    async patch<T = unknown>(path: string, body?: unknown, options: RequestInit = {}): Promise<T> {
        return this.request<T>(path, {
            ...options,
            method: "PATCH",
            ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
    }

    async delete<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
        return this.request<T>(path, { ...options, method: "DELETE" });
    }
}

/** Singleton API client instance */
export const apiClient = new ApiClient(API_BASE_URL);

/**
 * Legacy-compatible wrapper – drop-in replacement for existing call-sites.
 * All existing `fetchWithAuth(path, options)` calls continue to work unchanged.
 */
export async function fetchWithAuth(path: string, options: RequestInit = {}) {
    const headers = options.headers as Record<string, string> | undefined;

    // Derive method & body from the existing call-site shape
    const method = options.method?.toUpperCase() ?? "GET";

    if (method === "GET" || method === "HEAD") {
        return apiClient.get(path, options);
    }
    if (method === "DELETE") {
        return apiClient.delete(path, options);
    }
    if (method === "PATCH" || method === "POST") {
        const parsedBody = typeof options.body === "string" 
            ? JSON.parse(options.body) 
            : options.body;
            
        const { body: _, ...restOptions } = options;
        const mergedOptions = headers ? { ...restOptions, headers } : restOptions;
        
        return method === "PATCH"
            ? apiClient.patch(path, parsedBody, mergedOptions)
            : apiClient.post(path, parsedBody, mergedOptions);
    }
    
    // Fallback for everything else
    return apiClient.post(path, undefined, headers ? { ...options, headers } : options);
}
