"use client";

import { useParams } from "next/navigation";
import SpeakingForm from "@/components/ielts-builder/SpeakingForm";

export default function EditSpeakingPage() {
  const params = useParams();
  return <SpeakingForm editId={String(params.id)} />;
}
