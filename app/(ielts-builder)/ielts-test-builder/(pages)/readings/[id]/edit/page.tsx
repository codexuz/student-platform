"use client";

import { use } from "react";
import ReadingForm from "@/components/ielts-builder/ReadingForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function EditReadingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return <ReadingForm editId={id} onNavigate={navigate} />;
}
