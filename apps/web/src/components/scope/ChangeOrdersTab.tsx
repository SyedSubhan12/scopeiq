import { useState } from "react";
import { FileSignature, Plus, MoreHorizontal, Download, ExternalLink, Trash2 } from "lucide-react";
import { Card, Badge, Button, Skeleton, DropdownMenu, DropdownItem } from "@novabots/ui";
import { useChangeOrders, useUpdateChangeOrder } from "@/hooks/change-orders";
import { format } from "date-fns";

export function ChangeOrdersTab({ projectId }: { projectId: string }) {
    const { data, isLoading } = useChangeOrders(projectId);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const orders = data?.data ?? [];

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-amber-500" />
                    Change Orders
                </h2>
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Change Order
                </Button>
            </div>

            <div className="grid gap-4">
                {orders.length > 0 ? (
                    orders.map((order: any) => (
                        <ChangeOrderCard key={order.id} order={order} />
                    ))
                ) : (
                    <Card className="py-16 text-center">
                        <FileSignature className="mx-auto h-10 w-10 text-[rgb(var(--text-muted))] mb-3" />
                        <p className="text-sm text-[rgb(var(--text-muted))]">No change orders found for this project.</p>
                        <Button variant="secondary" size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>
                            Initialize First CO
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
}

function ChangeOrderCard({ order }: { order: any }) {
    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
                        <FileSignature className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[rgb(var(--text-primary))] truncate">{order.title}</h4>
                        <div className="mt-1 flex items-center gap-3 text-xs text-[rgb(var(--text-muted))]">
                            <span>#{order.id.slice(0, 8)}</span>
                            <span>•</span>
                            <span>{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-sm font-bold text-[rgb(var(--text-primary))]">
                            ${(order.amount ?? 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-[rgb(var(--text-muted))] uppercase">Amount</p>
                    </div>

                    <Badge status={order.status === "approved" ? "active" : order.status === "pending" ? "pending" : "paused"}>
                        {order.status}
                    </Badge>

                    <DropdownMenu trigger={
                        <button className="p-1 hover:bg-[rgb(var(--surface-subtle))] rounded-md">
                            <MoreHorizontal className="h-4 w-4 text-[rgb(var(--text-muted))]" />
                        </button>
                    }>
                        <DropdownItem onClick={() => window.alert("View details")}>
                            <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Details
                        </DropdownItem>
                        <DropdownItem onClick={() => window.alert("Download PDF")}>
                            <Download className="mr-2 h-3.5 w-3.5" /> Download PDF
                        </DropdownItem>
                        <DropdownItem destructive onClick={() => window.alert("Delete CO")}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownItem>
                    </DropdownMenu>
                </div>
            </div>
        </Card>
    );
}
