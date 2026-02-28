"use client";

import { use } from "react";
import LinkedListeningParts from "@/components/ielts-builder/LinkedListeningParts";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function ListeningLinkedPartsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return <LinkedListeningParts listeningId={id} onNavigate={navigate} />;
}
