import { useNotifications } from "@/hooks/useNotifications";
import { Skeleton, Card, Badge } from "@novabots/ui";
import { formatDistanceToNow } from "date-fns";
import {
    Clock,
    MessageSquare,
    FileUp,
    CheckSquare,
    AlertTriangle,
    CreditCard,
    UserPlus,
    Activity
} from "lucide-react";

const actionIcons: Record<string, any> = {
    create: Activity,
    update: Clock,
    delete: AlertTriangle,
    approve: CheckSquare,
    reject: AlertTriangle,
    flag: AlertTriangle,
    send: FileUp,
    dismiss: CheckSquare
};

export function ActivityLogTab({ workspaceId }: { workspaceId: string }) {
    const { data: activity, isLoading } = useNotifications();

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    const logs = activity?.data ?? [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-[rgb(var(--text-secondary))] flex items-center gap-2 uppercase tracking-wider">
                    <Activity className="h-4 w-4" />
                    Project Audit Trail
                </h3>
            </div>

            <div className="space-y-3">
                {logs.length > 0 ? (
                    logs.map((log) => {
                        const Icon = actionIcons[log.action] ?? Activity;
                        return (
                            <div key={log.id} className="relative flex gap-4 pl-6 after:absolute after:left-[9px] after:top-6 after:bottom-[-20px] after:w-[2px] after:bg-[rgb(var(--border-subtle))] last:after:hidden">
                                <div className="absolute left-0 top-1 h-[20px] w-[20px] rounded-full bg-white border border-[rgb(var(--border-subtle))] flex items-center justify-center z-10">
                                    <Icon className="h-3 w-3 text-[rgb(var(--text-muted))]" />
                                </div>
                                <div className="flex-1 pb-6">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                                            {formatLogMessage(log)}
                                        </p>
                                        <span className="text-[10px] font-medium text-[rgb(var(--text-muted))] uppercase">
                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge status="draft" className="scale-75 origin-left h-5 px-1.5 uppercase tracking-tighter">
                                            {log.entityType.replace('_', ' ')}
                                        </Badge>
                                        <span className="text-[10px] text-[rgb(var(--text-muted))]">
                                            ID: {log.entityId.slice(0, 8)}...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <Card className="py-12 text-center text-sm text-[rgb(var(--text-muted))]">
                        No recent activity recorded for this workspace.
                    </Card>
                )}
            </div>
        </div>
    );
}

function formatLogMessage(log: any) {
    const actor = log.actorName || "System";
    const entity = log.entityType.toLowerCase().replace('_', ' ');

    switch (log.action) {
        case "create": return `${actor} created a new ${entity}`;
        case "update": return `${actor} updated ${entity} details`;
        case "delete": return `${actor} archived ${entity}`;
        case "approve": return `${actor} approved the ${entity}`;
        case "reject": return `${actor} requested changes on ${entity}`;
        case "flag": return `${actor} flagged a scope deviation`;
        case "dismiss": return `${actor} dismissed scope flag`;
        case "send": return `${actor} sent ${entity} to client`;
        default: return `${actor} performed ${log.action} on ${entity}`;
    }
}
