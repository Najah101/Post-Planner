import { notFound } from "next/navigation";
import PlannerProvider from "@/components/PlannerProvider";
import TopBar from "@/components/TopBar";
import { ensureAccounts, getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ account: string }>;
}) {
  const { account: accountId } = await params;
  const accounts = await ensureAccounts();
  const account = accounts.find((a) => a.id === accountId);
  if (!account) notFound();
  const posts = await getStore().listPosts(account.id);

  return (
    <PlannerProvider key={account.id} account={account} initialAccounts={accounts} initialPosts={posts}>
      <TopBar />
      <main className="mx-auto w-full max-w-7xl flex-1 overflow-x-clip px-4 pb-28 pt-5 md:pb-10">{children}</main>
    </PlannerProvider>
  );
}
