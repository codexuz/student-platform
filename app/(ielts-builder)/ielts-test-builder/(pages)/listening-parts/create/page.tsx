"use client";

import { useSearchParams } from "next/navigation";
import ListeningPartForm from "@/components/ielts-builder/ListeningPartForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function CreateListeningPartPage() {
  const navigate = useIELTSNavigate();
  const searchParams = useSearchParams();
  const listeningId = searchParams.get("listeningId") || undefined;
  return (
    <ListeningPartForm
      editId={null}
      prefillListeningId={listeningId}
      onNavigate={navigate}
    />
  );
}
