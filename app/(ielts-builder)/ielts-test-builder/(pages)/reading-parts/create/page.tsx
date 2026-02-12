"use client";

import { useSearchParams } from "next/navigation";
import ReadingPartForm from "@/components/ielts-builder/ReadingPartForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function CreateReadingPartPage() {
  const navigate = useIELTSNavigate();
  const searchParams = useSearchParams();
  const readingId = searchParams.get("readingId") || undefined;
  return (
    <ReadingPartForm
      editId={null}
      prefillReadingId={readingId}
      onNavigate={navigate}
    />
  );
}
