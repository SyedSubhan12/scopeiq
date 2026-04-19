"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Download, Printer } from "lucide-react";
import { Button, cn } from "@novabots/ui";

export interface ChangeOrderLineItem {
  label: string;
  qty: number;
  rate: number;
  total: number;
}

export interface ChangeOrderPDFProps {
  changeOrder: {
    id: string;
    title: string;
    description: string;
    amount: number;
    lineItems?: ChangeOrderLineItem[];
    sentAt: string | null;
    workspaceName: string;
    clientName: string;
  };
  agencyLogoUrl?: string;
  brandColor?: string;
  signatureName?: string;
  onSigned?: (name: string) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function WorkspaceInitials({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

export function ChangeOrderPDF({
  changeOrder,
  agencyLogoUrl,
  brandColor = "#1D9E75",
  signatureName,
  onSigned,
}: ChangeOrderPDFProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const lineItemsRef = useRef<HTMLTableSectionElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);

  const [typedName, setTypedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);

  const totalAmount =
    changeOrder.lineItems && changeOrder.lineItems.length > 0
      ? changeOrder.lineItems.reduce((sum, item) => sum + item.total, 0)
      : changeOrder.amount;

  useEffect(() => {
    // Dynamic GSAP import to avoid SSR issues
    import("gsap/dist/gsap").then(({ gsap }) => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      if (headerRef.current) {
        tl.fromTo(
          headerRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.3 },
        );
      }

      if (lineItemsRef.current) {
        const rows = lineItemsRef.current.querySelectorAll("tr");
        if (rows.length > 0) {
          tl.fromTo(
            Array.from(rows),
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.2, stagger: 0.06 },
            "-=0.1",
          );
        }
      }

      if (signatureRef.current) {
        tl.fromTo(
          signatureRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.25 },
          "-=0.05",
        );
      }
    });
  }, []);

  function handleSign() {
    if (!typedName.trim() || !agreed) return;
    const now = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    setSigned(true);
    setSignedAt(now);
    onSigned?.(typedName.trim());
  }

  const coNumber = `CO-${changeOrder.id.slice(-6).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Print button — hidden in print */}
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.print()}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Document */}
      <div className="rounded-3xl bg-white shadow-xl ring-1 ring-[rgb(var(--border-subtle))]">
        {/* Header */}
        <div ref={headerRef} className="px-10 pt-10 pb-8 border-b border-[rgb(var(--border-subtle))]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {agencyLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agencyLogoUrl}
                  alt={changeOrder.workspaceName}
                  className="h-12 w-12 rounded-2xl object-contain"
                />
              ) : (
                <WorkspaceInitials name={changeOrder.workspaceName} color={brandColor} />
              )}
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                  {changeOrder.workspaceName}
                </p>
                <p className="text-xs text-[rgb(var(--text-muted))]">Agency</p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="text-xs font-bold uppercase tracking-[0.12em]"
                style={{ color: brandColor }}
              >
                Change Order
              </p>
              <p className="mt-0.5 font-mono text-xl font-bold text-[rgb(var(--text-primary))]">
                {coNumber}
              </p>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-8 grid grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
                Date Issued
              </p>
              <p className="mt-1 text-sm font-medium text-[rgb(var(--text-primary))]">
                {formatDate(changeOrder.sentAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
                Prepared for
              </p>
              <p className="mt-1 text-sm font-medium text-[rgb(var(--text-primary))]">
                {changeOrder.clientName}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
                Status
              </p>
              <span className="mt-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                Awaiting Approval
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="px-10 py-6 border-b border-[rgb(var(--border-subtle))]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
            Change Order Title
          </p>
          <h2 className="mt-1 text-xl font-bold text-[rgb(var(--text-primary))]">
            {changeOrder.title}
          </h2>
        </div>

        {/* Description */}
        <div className="px-10 py-6 border-b border-[rgb(var(--border-subtle))]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))] mb-3">
            Scope of Additional Work
          </p>
          <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-subtle))] px-6 py-5">
            <p className="text-sm leading-7 text-[rgb(var(--text-secondary))] whitespace-pre-wrap">
              {changeOrder.description}
            </p>
          </div>
        </div>

        {/* Line items or flat amount */}
        <div className="px-10 py-6 border-b border-[rgb(var(--border-subtle))]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))] mb-4">
            Cost Breakdown
          </p>

          {changeOrder.lineItems && changeOrder.lineItems.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="rounded-xl text-white text-xs font-bold uppercase tracking-widest"
                  style={{ backgroundColor: brandColor }}
                >
                  <th className="py-3 pl-4 text-left rounded-l-xl">Description</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Rate</th>
                  <th className="py-3 pr-4 text-right rounded-r-xl">Total</th>
                </tr>
              </thead>
              <tbody ref={lineItemsRef}>
                {changeOrder.lineItems.map((item, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "border-b border-[rgb(var(--border-subtle))]",
                      index % 2 === 1 && "bg-[rgb(var(--surface-subtle))]",
                    )}
                  >
                    <td className="py-3 pl-4 text-[rgb(var(--text-secondary))]">{item.label}</td>
                    <td className="py-3 px-3 text-right text-[rgb(var(--text-secondary))]">
                      {item.qty}
                    </td>
                    <td className="py-3 px-3 text-right text-[rgb(var(--text-secondary))]">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-[rgb(var(--text-primary))]">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <tbody ref={lineItemsRef}>
                <tr className="border-b border-[rgb(var(--border-subtle))]">
                  <td className="py-3 text-[rgb(var(--text-secondary))]">{changeOrder.title}</td>
                  <td className="py-3 text-right font-medium text-[rgb(var(--text-primary))]">
                    {formatCurrency(changeOrder.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* Subtotal / total */}
          <div className="mt-4 space-y-2">
            {changeOrder.lineItems && changeOrder.lineItems.length > 0 && (
              <div className="flex items-center justify-between px-1 text-sm text-[rgb(var(--text-secondary))]">
                <span>Subtotal</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            )}
            <div
              className="flex items-center justify-between rounded-2xl px-5 py-4 text-white"
              style={{ backgroundColor: brandColor }}
            >
              <span className="text-sm font-bold">Total Additional Cost</span>
              <span className="text-2xl font-bold">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Signature section */}
        <div ref={signatureRef} className="px-10 py-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))] mb-4">
            Digital Signature
          </p>

          {signatureName || signed ? (
            /* Already signed — display cursive name + timestamp */
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-800">Signed</p>
              </div>
              <p className="font-serif text-3xl italic" style={{ color: brandColor }}>
                {signatureName ?? typedName}
              </p>
              <p className="mt-2 text-xs text-[rgb(var(--text-muted))]">
                Digitally signed on{" "}
                {signedAt ?? formatDate(changeOrder.sentAt)}
              </p>
            </div>
          ) : (
            /* Unsigned — show input form */
            <div className="space-y-5">
              <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
                Type your full legal name below to provide a legally binding digital signature
                accepting this change order.
              </p>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="h-12 w-full rounded-2xl border border-[rgb(var(--border-default))] bg-white px-4 font-serif text-lg italic text-[rgb(var(--text-primary))] outline-none transition-all focus:ring-2"
                  style={
                    {
                      "--tw-ring-color": `${brandColor}33`,
                    } as React.CSSProperties
                  }
                />
                {typedName && (
                  <p className="mt-2 text-right font-serif text-lg italic" style={{ color: brandColor }}>
                    {typedName}
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[rgb(var(--border-default))]"
                />
                <span className="text-sm leading-relaxed text-[rgb(var(--text-secondary))]">
                  I agree to the additional scope, cost, and terms described in this change order,
                  and acknowledge that my typed name constitutes a legally binding digital signature.
                </span>
              </label>

              <motion.div whileHover={{ scale: 1.01 }} className="inline-block w-full">
                <button
                  type="button"
                  disabled={!typedName.trim() || !agreed}
                  onClick={handleSign}
                  className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: brandColor }}
                >
                  Sign & Accept Change Order
                </button>
              </motion.div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[rgb(var(--border-subtle))] px-10 py-4 text-center">
          <p className="text-xs text-[rgb(var(--text-muted))]">
            Powered by{" "}
            <span className="font-semibold" style={{ color: brandColor }}>
              ScopeIQ
            </span>{" "}
            &mdash; Secure digital change order management
          </p>
        </div>
      </div>
    </div>
  );
}
