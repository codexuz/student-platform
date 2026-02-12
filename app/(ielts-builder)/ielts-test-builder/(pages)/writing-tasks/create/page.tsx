"use client";

import { useSearchParams } from "next/navigation";
import WritingTaskForm from "@/components/ielts-builder/WritingTaskForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function CreateWritingTaskPage() {
  const navigate = useIELTSNavigate();
  const searchParams = useSearchParams();
  const writingId = searchParams.get("writingId") || undefined;
  return <WritingTaskForm prefillWritingId={writingId} onNavigate={navigate} />;
}
