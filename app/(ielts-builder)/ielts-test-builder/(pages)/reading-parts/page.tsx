"use client";

import ReadingPartsList from "@/components/ielts-builder/ReadingPartsList";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function ReadingPartsPage() {
  const navigate = useIELTSNavigate();
  return <ReadingPartsList onNavigate={navigate} />;
}
