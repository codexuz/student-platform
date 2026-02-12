"use client";

import { useSearchParams } from "next/navigation";
import WritingForm from "@/components/ielts-builder/WritingForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function CreateWritingPage() {
  const navigate = useIELTSNavigate();
  const searchParams = useSearchParams();
  const testId = searchParams.get("testId") || undefined;
  return <WritingForm prefillTestId={testId} onNavigate={navigate} />;
}
