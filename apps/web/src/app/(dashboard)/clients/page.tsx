"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Mail, User, Building2, Copy, Check, ExternalLink, ChevronDown, ChevronUp, FolderKanban } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PageEnter } from "@/components/shared/PageEnter";
import { Button, Card, Skeleton, Dialog, Input, Textarea, useToast } from "@novabots/ui";
import { useAssetsReady } from "@/hooks/useAssetsReady";
import { getClientsQueryOptions, useClients, useCreateClient } from "@/hooks/useClients";
import { queryClient } from "@/lib/query-client";
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

function ClientCard({
  client,
  index,
}: {
  client: { id: string; name: string; contactName?: string | null; contactEmail?: string | null; notes?: string | null };
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // GSAP back.out entrance staggered by index
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    let cancelled = false;
    void import("gsap/dist/gsap").then((mod) => {
      if (cancelled) return;
      const gsap = (mod as { default: { from: (t: unknown, v: unknown) => void } }).default;
      gsap.from(el, {
        opacity: 0,
        y: 18,
        scale: 0.96,
        duration: 0.38,
        delay: index * 0.07,
        ease: "back.out(1.4)",
        clearProps: "all",
      });
    });
    return () => { cancelled = true; };
  }, [index]);

  return (
    <div ref={cardRef}>
      <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
        <Card hoverable className="group h-full">
          <div className="mb-3 flex items-start gap-3">
            {/* Avatar */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">{client.name}</h3>
              {client.contactName && (
                <p className="flex items-center gap-1 text-sm text-[rgb(var(--text-secondary))]">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">{client.contactName}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-xl p-1.5 text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-subtle))] hover:text-[rgb(var(--text-primary))]"
              title={expanded ? "Hide projects" : "Show portal links"}
              aria-expanded={expanded}
            >
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </button>
          </div>

          {client.contactEmail && (
            <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))]">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{client.contactEmail}</span>
            </div>
          )}
          {client.notes && (
            <p className="mt-2 line-clamp-2 text-xs text-[rgb(var(--text-muted))]">{client.notes}</p>
          )}

          {/* Animated accordion for portal links */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <ClientPortalLinks clientId={client.id} />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ClientsPage() {
  useAssetsReady({
    scopeId: "page:clients",
    tasks: [() => queryClient.ensureQueryData(getClientsQueryOptions())],
  });

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
    <PageEnter>
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Clients</h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
            Manage your client contacts
          </p>
        </div>
        <Button size="md" className="max-sm:w-full max-sm:justify-center" onClick={() => setShowCreate(true)}>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client: { id: string; name: string; contactName?: string | null; contactEmail?: string | null; notes?: string | null }, i: number) => (
            <ClientCard key={client.id} client={client} index={i} />
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
    </PageEnter>
  );
}
