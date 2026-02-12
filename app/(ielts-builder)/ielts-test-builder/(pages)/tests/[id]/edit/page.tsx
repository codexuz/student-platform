"use client";

import { use } from "react";
import TestForm from "@/components/ielts-builder/TestForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return <TestForm editId={id} onNavigate={navigate} />;
}
