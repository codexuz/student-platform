"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import IELTSSidebar from "@/components/ielts-builder/IELTSSidebar";

export default function IELTSTestBuilderPage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== "teacher") {
      router.push("/home");
    }
  }, [role, loading, router]);

  useEffect(() => {
    if (!loading && role === "teacher") {
      router.replace("/ielts-test-builder/tests");
    }
  }, [role, loading, router]);

  return (
    <ProtectedRoute>
      <Flex h="100vh" align="center" justify="center" bg="gray.100">
        <VStack gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Loading...</Text>
        </VStack>
      </Flex>
    </ProtectedRoute>
  );
}
