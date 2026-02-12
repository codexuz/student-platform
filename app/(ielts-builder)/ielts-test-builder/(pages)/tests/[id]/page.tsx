"use client";

import { use } from "react";
import TestDetail from "@/components/ielts-builder/TestDetail";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function TestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return <TestDetail testId={id} onNavigate={navigate} />;
}
