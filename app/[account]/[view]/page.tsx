import { notFound } from "next/navigation";
import ViewSwitcher from "@/components/ViewSwitcher";
import { isView } from "@/lib/views";

export default async function ViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (!isView(view)) notFound();
  return <ViewSwitcher />;
}
