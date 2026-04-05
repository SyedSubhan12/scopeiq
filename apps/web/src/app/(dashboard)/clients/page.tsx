"use client";

import { useState } from "react";
import { Plus, Mail, User, Building2, Copy, Check, ExternalLink, ChevronDown, ChevronUp, FolderKanban } from "lucide-react";
import { Button, Card, Skeleton, Dialog, Input, Textarea, useToast } from "@novabots/ui";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";

function ClientPortalLinks({ clientId }: { clientId: string }) {
  const { data, isLoading } = useProjects({ clientId });
  const [copied, setCopied] = useState<string | null>(null);
  const projects = (data?.data ?? []) as Array<{ id: string; name: string; portalToken?: string | null }>;

  const handleCopy = (token: string, id: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    void navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) return <div className="mt-3 h-8 animate-pulse rounded bg-gray-100" />;
  if (projects.length === 0) return (
    <p className="mt-3 text-xs text-[rgb(var(--text-muted))]">No projects yet.</p>
  );

  return (
    <div className="mt-3 space-y-1.5">
      {projects.map((p) => (
        <div key={p.id} className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border-default))] bg-[rgb(var(--surface-subtle))] px-2.5 py-1.5">
          <FolderKanban className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--text-muted))]" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-[rgb(var(--text-secondary))]">{p.name}</span>
          {p.portalToken ? (
            <>
              <button
                onClick={() => handleCopy(p.portalToken!, p.id)}
                title="Copy portal link"
                className="rounded p-0.5 hover:bg-[rgb(var(--border-default))]"
              >
                {copied === p.id
                  ? <Check className="h-3.5 w-3.5 text-green-500" />
                  : <Copy className="h-3.5 w-3.5 text-[rgb(var(--text-muted))]" />}
              </button>
              <a
                href={`/portal/${p.portalToken}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open portal"
                className="rounded p-0.5 hover:bg-[rgb(var(--border-default))]"
              >
                <ExternalLink className="h-3.5 w-3.5 text-[rgb(var(--text-muted))]" />
              </a>
            </>
          ) : (
            <span className="text-xs text-[rgb(var(--text-muted))]">No portal</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ClientCard({ client }: { client: { id: string; name: string; contactName?: string | null; contactEmail?: string | null; notes?: string | null } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card hoverable className="group">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[rgb(var(--text-primary))]">{client.name}</h3>
          {client.contactName && (
            <p className="flex items-center gap-1 text-sm text-[rgb(var(--text-secondary))]">
              <User className="h-3 w-3" />
              {client.contactName}
            </p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-md p-1 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-subtle))]"
          title={expanded ? "Hide projects" : "Show portal links"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {client.contactEmail && (
        <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
          <Mail className="h-3.5 w-3.5" />
          {client.contactEmail}
        </div>
      )}
      {client.notes && (
        <p className="mt-2 line-clamp-2 text-xs text-[rgb(var(--text-muted))]">{client.notes}</p>
      )}

      {expanded && <ClientPortalLinks clientId={client.id} />}
    </Card>
  );
}

export default function ClientsPage() {
  const { data, isLoading } = useClients();
  const createClient = useCreateClient();
  const { toast } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");

  const clients = data?.data ?? [];

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      await createClient.mutateAsync({
        name: name.trim(),
        ...(contactName.trim() ? { contactName: contactName.trim() } : {}),
        ...(contactEmail.trim() ? { contactEmail: contactEmail.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast("success", "Client created");
      setShowCreate(false);
      setName("");
      setContactName("");
      setContactEmail("");
      setNotes("");
    } catch {
      toast("error", "Failed to create client");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Clients</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Manage your client contacts
          </p>
        </div>
        <Button size="md" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : clients.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client: { id: string; name: string; contactName?: string | null; contactEmail?: string | null; notes?: string | null }) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <Card className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            No clients yet
          </h3>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Add your first client to start managing projects.
          </p>
          <Button size="md" className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New Client">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Company Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Contact Name
            </label>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Jane Smith"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Contact Email
            </label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="e.g. jane@acme.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[rgb(var(--text-primary))]">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleCreate()}
              disabled={!name.trim() || createClient.isPending}
            >
              {createClient.isPending ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
