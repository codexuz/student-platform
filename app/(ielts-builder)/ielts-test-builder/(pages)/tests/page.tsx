"use client";

import TestsList from "@/components/ielts-builder/TestsList";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function TestsPage() {
  const navigate = useIELTSNavigate();
  return <TestsList onNavigate={navigate} />;
}
