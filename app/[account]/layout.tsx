import { notFound, redirect } from "next/navigation";
import PlannerProvider from "@/components/PlannerProvider";
import TopBar from "@/components/TopBar";
import { canAccess, getAccess, publicAccount } from "@/lib/access";
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
  const access = await getAccess();
  if (!canAccess(access, accountId)) {
    // A guest whose every link was reset gets told so; otherwise it's just not theirs to see.
    if (!access.owner && access.accountIds.length === 0) redirect("/unlock?expired=1");
    notFound();
  }
  const accounts = (await ensureAccounts())
    .filter((a) => canAccess(access, a.id))
    .map(publicAccount);
  const account = accounts.find((a) => a.id === accountId);
  if (!account) notFound();
  const posts = await getStore().listPosts(account.id);

  return (
    <PlannerProvider
      key={account.id}
      account={account}
      initialAccounts={accounts}
      initialPosts={posts}
      isOwner={access.owner}
    >
      <TopBar />
      <main className="mx-auto w-full max-w-7xl flex-1 overflow-x-clip px-4 pb-28 pt-5 md:pb-10">{children}</main>
    </PlannerProvider>
  );
}
