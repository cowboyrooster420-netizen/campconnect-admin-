"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", icon: "🏕️" },
  { href: "/challenges", label: "Challenges", icon: "🚩" },
  { href: "/review", label: "Review queue", icon: "📥" },
  { href: "/badges", label: "Badges", icon: "🏅" },
  { href: "/campers", label: "Campers", icon: "🧒" },
];

export default function Sidebar({
  campName,
  email,
  signOutAction,
}: {
  campName: string;
  email: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-ink/10 bg-white">
      <div className="border-b border-ink/10 p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine text-white">
            ⛺
          </span>
          <div>
            <p className="text-sm font-bold leading-tight text-ink">CampConnect</p>
            <p className="text-xs text-ink/50">{campName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-pine/10 text-pine"
                  : "text-ink/70 hover:bg-ink/5"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink/10 p-4">
        <p className="mb-2 truncate text-xs text-ink/50">{email}</p>
        <form action={signOutAction}>
          <button className="w-full rounded-lg border border-ink/15 py-1.5 text-sm font-medium text-ink/70 transition hover:bg-ink/5">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
