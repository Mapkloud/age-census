import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    redirect(user?.birthDate && user.timezone ? "/map" : "/onboarding");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col justify-center gap-6 px-4 py-16">
      <p className="text-sm text-neutral-600">A yearly rite</p>
      <h1 className="text-3xl font-semibold tracking-tight">Age Census</h1>
      <p className="text-neutral-700">
        Home is a map of ages. One stamp a year. Seal a letter to a future self;
        open it on that birthday.
      </p>
      <Link href="/login" className="w-fit border border-neutral-800 px-4 py-2 text-sm">
        Sign in
      </Link>
    </main>
  );
}
