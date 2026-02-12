"use client";

import { useSearchParams } from "next/navigation";
import ListeningForm from "@/components/ielts-builder/ListeningForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function CreateListeningPage() {
  const navigate = useIELTSNavigate();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId") || undefined;
  return <ListeningForm prefillTestId={testId} onNavigate={navigate} />;
}
