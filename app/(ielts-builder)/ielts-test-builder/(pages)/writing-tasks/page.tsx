"use client";

import WritingTasksList from "@/components/ielts-builder/WritingTasksList";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function WritingTasksPage() {
  const navigate = useIELTSNavigate();
  return <WritingTasksList onNavigate={navigate} />;
}
