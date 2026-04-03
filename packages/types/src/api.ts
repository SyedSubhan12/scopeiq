export interface ApiResponse<T> {
    data: T;
}

export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export interface CursorPagination {
    next_cursor: string | null;
    has_more: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: CursorPagination;
}
