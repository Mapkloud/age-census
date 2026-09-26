import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

export function AppNav() {
  return (
    <header className="border-b border-neutral-300">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 text-sm">
        <Link href="/map" className="font-medium">
          Age Census
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/map">Map</Link>
          <Link href="/settings">Settings</Link>
          <form action={signOutAction}>
            <button type="submit">Sign out</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
