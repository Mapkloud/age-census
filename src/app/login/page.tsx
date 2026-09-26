import { redirect } from "next/navigation";
import { requestMagicLink } from "@/app/actions/auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    redirect(user?.birthDate && user.timezone ? "/map" : "/onboarding");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="text-sm text-neutral-700">
        Email is how we find you in 10–20 years. A magic link will be printed in
        the server console in development.
      </p>
      <form action={requestMagicLink} className="flex flex-col gap-3">
        <label className="text-sm">
          Email
          <input
            required
            type="email"
            name="email"
            className="mt-1 w-full border border-neutral-300 px-3 py-2"
          />
        </label>
        <button type="submit" className="border border-neutral-800 px-4 py-2 text-sm">
          Send magic link
        </button>
      </form>
    </main>
  );
}
