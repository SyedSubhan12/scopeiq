"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">Set new password</h2>
      {success ? (
        <p className="mt-4 text-sm text-[rgb(var(--status-green))]">Password updated! Redirecting...</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-primary))]">New Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border-default,#E5E7EB))] px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-primary))]">Confirm Password</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border-default,#E5E7EB))] px-3 py-2 text-sm" />
          </div>
          {error && <p className="text-sm text-[rgb(var(--status-red))]">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-[rgb(var(--primary-teal))] py-2 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
