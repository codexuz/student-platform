"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import IELTSSidebar from "@/components/ielts-builder/IELTSSidebar";

export default function IELTSBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== "teacher") {
      router.push("/home");
    }
  }, [role, loading, router]);

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
          <IELTSSidebar />
          <Box
            flex="1"
            ml={{ base: 0, lg: "260px" }}
            overflowY="auto"
            p={{ base: 4, md: 6 }}
          >
            {children}
          </Box>
        </Flex>
      )}
    </ProtectedRoute>
  );
}
