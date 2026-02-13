"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { PageId } from "@/components/ielts-builder/types";

const BASE = "/ielts-test-builder";

/** Map a PageId + optional data to a URL path */
export function pageIdToRoute(
  pageId: PageId,
  data?: Record<string, string>,
): string {
  switch (pageId) {
    case "tests":
      return `${BASE}/tests`;

    case "test-form":
      return data?.editId
        ? `${BASE}/tests/${data.editId}/edit`
        : `${BASE}/tests/create`;

    case "test-detail":
      return `${BASE}/tests/${data?.testId}`;

    case "readings":
      return `${BASE}/readings`;

    case "reading-form": {
      const qs = data?.testId ? `?testId=${data.testId}` : "";
      return `${BASE}/readings/create${qs}`;
    }

    case "reading-parts":
      return `${BASE}/reading-parts`;

    case "reading-part-form":
      if (data?.editId) return `${BASE}/reading-parts/${data.editId}/edit`;
      const rpQs = data?.readingId ? `?readingId=${data.readingId}` : "";
      return `${BASE}/reading-parts/create${rpQs}`;

    case "listenings":
      return `${BASE}/listenings`;

    case "listening-form": {
      const qs = data?.testId ? `?testId=${data.testId}` : "";
      return `${BASE}/listenings/create${qs}`;
    }

    case "listening-parts":
      return `${BASE}/listening-parts`;

    case "listening-part-form":
      if (data?.editId) return `${BASE}/listening-parts/${data.editId}/edit`;
      const lpQs = data?.listeningId ? `?listeningId=${data.listeningId}` : "";
      return `${BASE}/listening-parts/create${lpQs}`;

    case "reading-part-questions":
      return `${BASE}/reading-parts/${data?.partId}/questions`;

    case "listening-part-questions":
      return `${BASE}/listening-parts/${data?.partId}/questions`;

    case "writings":
      return `${BASE}/writings`;

    case "writing-form": {
      const qs = data?.testId ? `?testId=${data.testId}` : "";
      return `${BASE}/writings/create${qs}`;
    }

    case "writing-tasks":
      return `${BASE}/writing-tasks`;

    case "writing-task-form": {
      const qs = data?.writingId ? `?writingId=${data.writingId}` : "";
      return `${BASE}/writing-tasks/create${qs}`;
    }

    default:
      return `${BASE}/tests`;
  }
}

/** Derive an active sidebar key from a pathname */
export function pathnameToSidebarKey(pathname: string): string {
  const rel = pathname.replace(BASE, "");
  if (rel.startsWith("/writing-tasks")) return "writing-tasks";
  if (rel.startsWith("/writings")) return "writings";
  if (rel.startsWith("/listening-parts")) return "listening-parts";
  if (rel.startsWith("/listenings")) return "listenings";
  if (rel.startsWith("/reading-parts")) return "reading-parts";
  if (rel.startsWith("/readings")) return "readings";
  return "tests";
}

/** Hook that returns an onNavigate callback compatible with all IELTS components */
export function useIELTSNavigate() {
  const router = useRouter();
  return useCallback(
    (pageId: PageId, data?: Record<string, string>) => {
      router.push(pageIdToRoute(pageId, data));
    },
    [router],
  );
}
