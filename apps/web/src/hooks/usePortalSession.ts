import { useContext } from "react";
import { PortalSessionContext } from "@/providers/portal-session-provider";

export function usePortalSession() {
    return useContext(PortalSessionContext);
}
