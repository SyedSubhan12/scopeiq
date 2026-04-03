import { ErrorHandler } from "hono";
import { AppError, ApiErrorResponse } from "@novabots/types";

export const errorHandler: ErrorHandler = async (err, c) => {
    console.error(err);

    if (err instanceof AppError) {
        const errorResponse: ApiErrorResponse = {
            error: {
                code: (err as any).code || "APP_ERROR",
                message: err.message,
                details: (err as any).details,
            },
        };
        return c.json(errorResponse, (err as any).statusCode || 500);
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
