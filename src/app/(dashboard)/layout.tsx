import { getOperatorContext } from "@/lib/auth";
import { signOut } from "@/app/auth-actions";
import Sidebar from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getOperatorContext();

  // Middleware guarantees a logged-in user here. If they're not an operator
  // (or have no camp yet), show a gate instead of the console.
  if (!ctx) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mb-3 text-4xl">🔒</div>
          <h1 className="mb-2 text-xl font-bold text-ink">Operator access needed</h1>
          <p className="mb-5 text-sm text-ink/60">
            Your account isn&apos;t set up as a camp operator yet. An admin needs
            to set your role to <code>operator</code> and assign your camp.
          </p>
          <form action={signOut}>
            <button className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5">
              Sign out
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        campName={ctx.camp?.name ?? "No camp assigned"}
        email={ctx.email ?? ""}
        signOutAction={signOut}
      />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
