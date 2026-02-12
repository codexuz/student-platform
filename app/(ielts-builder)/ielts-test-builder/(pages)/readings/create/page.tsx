"use client";

import { useSearchParams } from "next/navigation";
import ReadingForm from "@/components/ielts-builder/ReadingForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function CreateReadingPage() {
  const navigate = useIELTSNavigate();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId") || undefined;
  return <ReadingForm prefillTestId={testId} onNavigate={navigate} />;
}
