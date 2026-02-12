"use client";

import TestForm from "@/components/ielts-builder/TestForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function CreateTestPage() {
  const navigate = useIELTSNavigate();
  return <TestForm editId={null} onNavigate={navigate} />;
}
