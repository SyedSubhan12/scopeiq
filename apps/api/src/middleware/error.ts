import type { ErrorHandler } from "hono";
import { AppError, type ApiErrorResponse } from "@novabots/types";

export const errorHandler: ErrorHandler = async (err, c) => {
    console.error(err);

    if (err instanceof AppError) {
        const errorResponse: ApiErrorResponse = {
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
        };
        return c.json(errorResponse, err.statusCode as Parameters<typeof c.json>[1]);
    }

    // Handle generic errors
    const errorResponse: ApiErrorResponse = {
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
        },
    };
    return c.json(errorResponse, 500);
};
