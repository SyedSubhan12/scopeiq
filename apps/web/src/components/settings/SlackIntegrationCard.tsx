"use client";

import { Card, CardHeader, CardTitle, CardContent, Button, useToast } from "@novabots/ui";
import { useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api";

interface SlackIntegrationCardProps {
  workspace: { settingsJson: Record<string, unknown> | null };
}

export function SlackIntegrationCard({ workspace }: SlackIntegrationCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const slackTeamName =
    typeof workspace.settingsJson?.slackTeamName === "string"
      ? workspace.settingsJson.slackTeamName
      : null;

  const isConnected = !!slackTeamName;

  const handleConnect = () => {
    window.location.href = "/api/v1/workspaces/slack/connect";
  };

  const handleDisconnect = async () => {
    try {
      await fetchWithAuth("/v1/workspaces/slack/disconnect", { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast("success", "Slack disconnected");
    } catch {
      toast("error", "Failed to disconnect Slack");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slack Integration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Slack brand mark */}
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-lg font-bold"
              style={{ backgroundColor: "#4A154B" }}
              aria-label="Slack"
            >
              #
            </div>
            <div>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">Slack</p>
              {isConnected ? (
                <p className="text-xs text-[rgb(var(--text-muted))]">
                  Connected to <span className="font-medium text-[rgb(var(--text-secondary))]">{slackTeamName}</span>
                </p>
              ) : (
                <p className="text-xs text-[rgb(var(--text-muted))]">Not connected</p>
              )}
            </div>
          </div>

          {isConnected ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void handleDisconnect()}
            >
              Disconnect
            </Button>
          ) : (
            <Button size="sm" onClick={handleConnect}>
              Connect Slack
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
