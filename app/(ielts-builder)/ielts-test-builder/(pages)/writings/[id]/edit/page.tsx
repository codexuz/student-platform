"use client";

import { use } from "react";
import WritingForm from "@/components/ielts-builder/WritingForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function EditWritingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return <WritingForm editId={id} onNavigate={navigate} />;
}
