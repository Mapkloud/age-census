"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { Wordmark } from "@/components/ui/Wordmark";
import { cx } from "@/lib/cx";

const links = [
  { href: "/map", label: "Map" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark href="/map" />
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "rounded-md px-3 py-1.5 transition-colors",
                  active
                    ? "bg-surface font-medium text-ink"
                    : "text-muted hover:bg-surface hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/seals"
            className={cx(
              "ml-1 rounded-md px-2 py-1.5 text-sm",
              pathname === "/seals" || pathname.startsWith("/seals/")
                ? "bg-surface font-medium text-ink"
                : "text-muted hover:bg-surface hover:text-ink",
            )}
            aria-current={pathname === "/seals" ? "page" : undefined}
          >
            Seal balance
          </Link>
          <form action={signOutAction} className="ml-2 border-l border-line pl-3">
            <button
              type="submit"
              className="rounded-md px-2 py-1.5 text-muted transition-colors hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
