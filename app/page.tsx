"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Box, Spinner, VStack } from "@chakra-ui/react";

export default function RootPage() {
  const { role, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    if (role === "teacher") {
      router.replace("/dashboard");
    } else {
      router.replace("/home");
    }
  }, [role, isAuthenticated, loading, router]);

  return (
    <Box
      h="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
    >
      <VStack gap={4}>
        <Spinner size="xl" color="brand.500" />
      </VStack>
    </Box>
  );
}
