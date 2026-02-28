"use client";

import { use } from "react";
import LinkedWritingTasks from "@/components/ielts-builder/LinkedWritingTasks";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function WritingLinkedTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return <LinkedWritingTasks writingId={id} onNavigate={navigate} />;
}
