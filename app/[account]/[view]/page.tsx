import { notFound } from "next/navigation";
import BoardView from "@/components/BoardView";
import CalendarView from "@/components/CalendarView";
import UpcomingView from "@/components/UpcomingView";

export default async function ViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (view === "calendar") return <CalendarView />;
  if (view === "board") return <BoardView />;
  if (view === "upcoming") return <UpcomingView />;
  notFound();
}
