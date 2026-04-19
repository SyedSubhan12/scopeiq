"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@novabots/ui";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // GSAP entrance animation on mount
  useEffect(() => {
    if (!formRef.current) return;
    const el = formRef.current;
    void import("gsap/dist/gsap").then((mod) => {
      const gsap = mod.default ?? mod;
      gsap.from(el, { opacity: 0, y: 20, duration: 0.35, ease: "power2.out" });
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    toast("success", "Password updated! Redirecting…");
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
        Set new password
      </h2>
      <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
        Choose a strong password for your account.
      </p>

      <form
        ref={formRef}
        onSubmit={(e) => void handleSubmit(e)}
        className="mt-6 space-y-4"
      >
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-[rgb(var(--text-primary))]"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20"
          />
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="mb-1 block text-sm font-medium text-[rgb(var(--text-primary))]"
          >
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password"
            className="w-full rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20"
          />
        </div>

        {error && (
          <p className="text-sm text-status-red">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#1D9E75] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#178a66] disabled:opacity-50"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
