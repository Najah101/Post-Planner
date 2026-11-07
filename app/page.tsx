import { redirect } from "next/navigation";
import { ensureAccounts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const accounts = await ensureAccounts();
  redirect(`/${accounts[0].id}/calendar`);
}
