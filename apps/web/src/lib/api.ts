import { AppError } from "@novabots/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function fetchWithAuth(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AppError(
            errorData.error?.code || "API_ERROR",
            errorData.error?.message || "An unexpected error occurred",
            response.status,
            errorData.error?.details,
        );
    }

    return response.json();
}
