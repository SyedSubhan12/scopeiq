"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">Check your email</h2>
        <p className="mt-2 text-sm text-[rgb(var(--text-secondary))]">
          We sent a password reset link to {email}
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm text-[rgb(var(--primary-teal))] hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">Reset your password</h2>
      <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-primary))]">Email</label>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[rgb(var(--border-default,#E5E7EB))] px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-[rgb(var(--status-red))]">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-[rgb(var(--primary-teal))] py-2 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-[rgb(var(--text-muted))]">
        <Link href="/login" className="text-[rgb(var(--primary-teal))] hover:underline">Back to login</Link>
      </p>
    </div>
  );
}
