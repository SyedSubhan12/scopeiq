import { FileText, CheckSquare, MessageSquare } from "lucide-react";
import { cn } from "@novabots/ui";

export type TabKey = "brief" | "review" | "messages";

interface TabDef {
    key: TabKey;
    label: string;
    icon: typeof FileText;
    testId: string;
}

interface PortalTabsProps {
    active: TabKey;
    onChange: (tab: TabKey) => void;
    showBrief: boolean;
    showReviewWork: boolean;
    showMessages: boolean;
    brandColor: string;
}

export function PortalTabs({
    active,
    onChange,
    showBrief,
    showReviewWork,
    showMessages,
    brandColor,
}: PortalTabsProps) {
    const tabs: TabDef[] = [
        ...(showBrief ? [{ key: "brief" as TabKey, label: "Brief", icon: FileText, testId: "tab-brief" }] : []),
        ...(showReviewWork ? [{ key: "review" as TabKey, label: "Review Work", icon: CheckSquare, testId: "tab-review-work" }] : []),
        ...(showMessages ? [{ key: "messages" as TabKey, label: "Messages", icon: MessageSquare, testId: "tab-messages" }] : []),
    ];

    return (
        <div className="flex gap-1 border-b border-[rgb(var(--border-default))]">
            {tabs.map(({ key, label, icon: Icon, testId }) => (
                <button
                    key={key}
                    data-testid={testId}
                    onClick={() => onChange(key)}
                    className={cn(
                        "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap",
                        active === key
                            ? "text-[rgb(var(--text-primary))]"
                            : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]",
                    )}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                    {active === key && (
                        <div
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ backgroundColor: brandColor }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
