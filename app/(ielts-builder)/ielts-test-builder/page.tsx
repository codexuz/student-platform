"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import IELTSSidebar from "@/components/ielts-builder/IELTSSidebar";
import TestsList from "@/components/ielts-builder/TestsList";
import TestForm from "@/components/ielts-builder/TestForm";
import TestDetail from "@/components/ielts-builder/TestDetail";
import ReadingsList from "@/components/ielts-builder/ReadingsList";
import ReadingForm from "@/components/ielts-builder/ReadingForm";
import ReadingPartsList from "@/components/ielts-builder/ReadingPartsList";
import ReadingPartForm from "@/components/ielts-builder/ReadingPartForm";
import ListeningsList from "@/components/ielts-builder/ListeningsList";
import ListeningForm from "@/components/ielts-builder/ListeningForm";
import ListeningPartsList from "@/components/ielts-builder/ListeningPartsList";
import ListeningPartForm from "@/components/ielts-builder/ListeningPartForm";
import WritingsList from "@/components/ielts-builder/WritingsList";
import WritingForm from "@/components/ielts-builder/WritingForm";
import WritingTasksList from "@/components/ielts-builder/WritingTasksList";
import WritingTaskForm from "@/components/ielts-builder/WritingTaskForm";
import type { PageId } from "@/components/ielts-builder/types";

interface PageState {
  page: PageId;
  data?: Record<string, string>;
}

export default function IELTSTestBuilderPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>({ page: "tests" });

  useEffect(() => {
    if (!loading && role !== "teacher") {
      router.push("/home");
    }
  }, [role, loading, router]);

  const navigate = useCallback(
    (page: PageId, data?: Record<string, string>) => {
      setPageState({ page, data });
    },
    [],
  );

  const renderPage = () => {
    const { page, data } = pageState;

    switch (page) {
      case "tests":
        return <TestsList onNavigate={navigate} />;

      case "test-form":
        return <TestForm editId={data?.editId || null} onNavigate={navigate} />;

      case "test-detail":
        return <TestDetail testId={data?.testId || ""} onNavigate={navigate} />;

      case "readings":
        return <ReadingsList onNavigate={navigate} />;

      case "reading-form":
        return (
          <ReadingForm prefillTestId={data?.testId} onNavigate={navigate} />
        );

      case "reading-parts":
        return <ReadingPartsList onNavigate={navigate} />;

      case "reading-part-form":
        return (
          <ReadingPartForm
            editId={data?.editId || null}
            prefillReadingId={data?.readingId}
            onNavigate={navigate}
          />
        );

      case "listenings":
        return <ListeningsList onNavigate={navigate} />;

      case "listening-form":
        return (
          <ListeningForm prefillTestId={data?.testId} onNavigate={navigate} />
        );

      case "listening-parts":
        return <ListeningPartsList onNavigate={navigate} />;

      case "listening-part-form":
        return (
          <ListeningPartForm
            editId={data?.editId || null}
            prefillListeningId={data?.listeningId}
            onNavigate={navigate}
          />
        );

      case "writings":
        return <WritingsList onNavigate={navigate} />;

      case "writing-form":
        return (
          <WritingForm prefillTestId={data?.testId} onNavigate={navigate} />
        );

      case "writing-tasks":
        return <WritingTasksList onNavigate={navigate} />;

      case "writing-task-form":
        return (
          <WritingTaskForm
            prefillWritingId={data?.writingId}
            onNavigate={navigate}
          />
        );

      default:
        return <TestsList onNavigate={navigate} />;
    }
  };

  return (
    <ProtectedRoute>
      {role !== "teacher" ? (
        <Flex h="100vh" align="center" justify="center" bg="gray.100">
          <VStack gap={4}>
            <Spinner size="xl" color="blue.500" />
            <Text color="gray.500">Redirecting...</Text>
          </VStack>
        </Flex>
      ) : (
        <Flex h="100vh" bg="gray.100" _dark={{ bg: "gray.900" }}>
          {/* Sidebar */}
          <IELTSSidebar activePage={pageState.page} onNavigate={navigate} />

          {/* Main Content Area */}
          <Box
            flex="1"
            ml={{ base: 0, lg: "260px" }}
            overflowY="auto"
            p={{ base: 4, md: 6 }}
          >
            {renderPage()}
          </Box>
        </Flex>
      )}
    </ProtectedRoute>
  );
}
