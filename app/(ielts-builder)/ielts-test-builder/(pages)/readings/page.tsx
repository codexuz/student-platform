"use client";

import ReadingsList from "@/components/ielts-builder/ReadingsList";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function ReadingsPage() {
  const navigate = useIELTSNavigate();
  return <ReadingsList onNavigate={navigate} />;
}
