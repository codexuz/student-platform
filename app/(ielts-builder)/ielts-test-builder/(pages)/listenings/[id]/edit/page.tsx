"use client";

import { use } from "react";
import ListeningForm from "@/components/ielts-builder/ListeningForm";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function EditListeningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return <ListeningForm editId={id} onNavigate={navigate} />;
}
