"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Full reload so the proxy picks up the new session cookie and routes us in.
    router.refresh();
    router.replace("/");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-ink/10 px-3 py-2 outline-none focus:border-pine"
          placeholder="you@camp.org"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-ink/10 px-3 py-2 outline-none focus:border-pine"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-pine py-2.5 font-semibold text-white transition hover:bg-pine/90 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-xs text-ink/50">
        Operator access only. Ask an admin to set your role.
      </p>
    </form>
  );
}
