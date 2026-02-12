"use client";

import { use } from "react";
import ListeningPartForm from "@/components/ielts-builder/ListeningPartForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function EditListeningPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return <ListeningPartForm editId={id} onNavigate={navigate} />;
}
