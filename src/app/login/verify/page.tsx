export default function VerifyRequestPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Check the console</h1>
      <p className="text-sm text-neutral-700">
        In development, the magic link is logged on the Next.js server. Open that
        URL to finish signing in.
      </p>
    </main>
  );
}
