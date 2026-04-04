"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/dashboard");
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setMagicLinkSent(true);
  }

  if (magicLinkSent) {
    return (
      <div className="text-center">
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          Check your email for a magic link to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-[rgb(var(--text-primary))]">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-[rgb(var(--text-primary))]">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[rgb(var(--border-default))] px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Enter your password"
        />
      </div>

      {error && (
        <p className="text-sm text-status-red">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-mid disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[rgb(var(--border-default))]"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-[rgb(var(--text-muted))]">Or</span>
        </div>
      </div>

      <GoogleAuthButton label="Sign in with Google" />

      <button
        type="button"
        onClick={handleMagicLink}
        disabled={loading}
        className="w-full rounded-lg border border-[rgb(var(--border-default))] px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--surface-subtle))] disabled:opacity-50"
      >
        Send magic link
      </button>

      <p className="text-center text-sm text-[rgb(var(--text-muted))]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
