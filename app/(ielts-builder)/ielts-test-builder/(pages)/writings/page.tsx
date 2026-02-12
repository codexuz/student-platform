"use client";

import WritingsList from "@/components/ielts-builder/WritingsList";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function WritingsPage() {
  const navigate = useIELTSNavigate();
  return <WritingsList onNavigate={navigate} />;
}
