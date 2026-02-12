"use client";

import ListeningsList from "@/components/ielts-builder/ListeningsList";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function ListeningsPage() {
  const navigate = useIELTSNavigate();
  return <ListeningsList onNavigate={navigate} />;
}
