"use client";

import ListeningPartsList from "@/components/ielts-builder/ListeningPartsList";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function ListeningPartsPage() {
  const navigate = useIELTSNavigate();
  return <ListeningPartsList onNavigate={navigate} />;
}
