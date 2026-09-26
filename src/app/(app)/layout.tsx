import { AppNav } from "@/components/AppNav";
import { requireOnboardedUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireOnboardedUser();
  return (
    <div className="min-h-full">
      <AppNav />
      <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>
    </div>
  );
}
