import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

export type WorkspaceUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  userType: string;
};

export function useWorkspaceUsers() {
  return useQuery<{ data: WorkspaceUser[] }>({
    queryKey: ["workspace-users"],
    queryFn: async () =>
      (await fetchWithAuth("/v1/workspaces/me/users")) as { data: WorkspaceUser[] },
  });
}
