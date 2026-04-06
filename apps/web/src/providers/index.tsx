"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ToastProvider } from "@novabots/ui";
import { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { BootLoaderProvider } from "./boot-loader-provider";
import { GlobalNotificationHydrator } from "./global-notification-hydrator";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <BootLoaderProvider>
                <AuthProvider>
                    <ToastProvider>
                        <GlobalNotificationHydrator />
                        {children}
                    </ToastProvider>
                </AuthProvider>
            </BootLoaderProvider>
        </QueryClientProvider>
    );
}
