import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";
import { ensureAccounts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const access = await getAccess();
  if (!access.owner) {
    // Guest: their most recently opened shared account, or back to the lock screen if all links were reset.
    redirect(access.accountIds.length ? `/${access.accountIds[0]}/calendar` : "/unlock?expired=1");
  }
  const accounts = await ensureAccounts();
  redirect(`/${accounts[0].id}/calendar`);
}
