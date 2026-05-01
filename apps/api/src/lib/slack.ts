interface SlackScopeFlagOpts {
  accessToken: string;
  channelId: string;
  projectName: string;
  messageText: string;
  confidence: number;
  flagId: string;
}

export async function sendSlackScopeFlag(opts: SlackScopeFlagOpts): Promise<void> {
  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.accessToken}`,
      },
      body: JSON.stringify({
        channel: opts.channelId,
        text: `🚩 Scope flag detected in *${opts.projectName}*`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Scope Flag* — ${opts.projectName}\n>${opts.messageText}\n_Confidence: ${Math.round(opts.confidence * 100)}%_`,
            },
          },
        ],
      }),
    });
    const data = await response.json() as { ok: boolean; error?: string };
    if (!data.ok) {
      console.error("[Slack] chat.postMessage failed:", data.error);
    }
  } catch (err) {
    console.error("[Slack] sendSlackScopeFlag error:", err);
  }
}
