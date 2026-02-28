"use client";

import { use } from "react";
import LinkedReadingParts from "@/components/ielts-builder/LinkedReadingParts";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function ReadingLinkedPartsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return <LinkedReadingParts readingId={id} onNavigate={navigate} />;
}
