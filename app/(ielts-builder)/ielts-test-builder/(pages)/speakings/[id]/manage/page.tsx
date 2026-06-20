"use client";

import { useParams } from "next/navigation";
import SpeakingPartsManager from "@/components/ielts-builder/SpeakingPartsManager";

export default function ManageSpeakingPage() {
  const params = useParams();
  return <SpeakingPartsManager speakingId={String(params.id)} />;
}
