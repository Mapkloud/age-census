import { AppNav } from "@/components/AppNav";
import { requireOnboardedUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireOnboardedUser();
  return (
    <div className="flex min-h-full flex-col">
      <AppNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
