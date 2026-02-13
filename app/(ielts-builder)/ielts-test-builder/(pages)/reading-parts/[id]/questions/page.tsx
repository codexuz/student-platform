"use client";

import { use } from "react";
import QuestionsManager from "@/components/ielts-builder/QuestionsManager";
import { useIELTSNavigate } from "@/lib/ielts-navigation";

export default function ReadingPartQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const navigate = useIELTSNavigate();
  return (
    <QuestionsManager partId={id} partType="reading" onNavigate={navigate} />
  );
}
