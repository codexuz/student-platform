"use client";

import { use } from "react";
import ReadingPartForm from "@/components/ielts-builder/ReadingPartForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function EditReadingPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return <ReadingPartForm editId={id} onNavigate={navigate} />;
}
