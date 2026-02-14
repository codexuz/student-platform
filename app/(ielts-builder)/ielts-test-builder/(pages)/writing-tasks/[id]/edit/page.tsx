"use client";

import { use } from "react";
import WritingTaskForm from "@/components/ielts-builder/WritingTaskForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function EditWritingTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return <WritingTaskForm editId={id} onNavigate={navigate} />;
}
