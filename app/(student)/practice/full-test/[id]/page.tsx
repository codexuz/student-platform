"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Badge,
  HStack,
  VStack,
  SimpleGrid,
  Card,
  Icon,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  BookOpen,
  Headphones,
  PenTool,
  Clock,
  Target,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import { ieltsTestsAPI } from "@/lib/ielts-api";

export default function FullTestPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <ProtectedRoute>
      <FullTestContent testId={id} />
    </ProtectedRoute>
  );
}

function FullTestContent({ testId }: { testId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [readingModules, setReadingModules] = useState<any[]>([]);
  const [listeningModules, setListeningModules] = useState<any[]>([]);
  const [writingModules, setWritingModules] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const testData = await ieltsTestsAPI.getById(testId);

      setTest(testData);
      setReadingModules(testData?.readings || []);
      setListeningModules(testData?.listenings || []);
      setWritingModules(testData?.writings || []);
    } catch (error) {
      console.error("Error fetching full test data:", error);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    if (testId) fetchData();
  }, [testId, fetchData]);

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
        <Sidebar />
        <Flex ml={{ base: 0, lg: "240px" }} h="100vh" align="center" justify="center">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Box>
    );
  }

  if (!test) {
    return (
      <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
        <Sidebar />
        <Box ml={{ base: 0, lg: "240px" }} p={8}>
          <VStack gap={4} align="center" mt={20}>
            <Heading size="lg">Test not found</Heading>
            <Button onClick={() => router.push("/practice")} variant="outline">
              Back to Practice
            </Button>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Sidebar />
      <Box ml={{ base: 0, lg: "240px" }} pb={{ base: "100px", lg: 8 }}>
        {/* Header Bar */}
        <Flex
          h={{ base: "14", md: "16" }}
          px={{ base: 4, md: 8 }}
          alignItems="center"
          justifyContent="space-between"
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderBottomWidth="1px"
        >
          <HStack gap={4}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/practice")}
            >
              <ArrowLeft size={20} />
            </Button>
            <Heading size={{ base: "sm", md: "md" }}>{test.title}</Heading>
          </HStack>
          <NotificationsDrawer />
        </Flex>

        <Box p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
          <VStack align="stretch" gap={8}>
            {/* Test Info Segment */}
            <Box bg="white" _dark={{ bg: "gray.800" }} p={6} borderRadius="2xl" shadow="sm">
              <VStack align="start" gap={3}>
                <HStack>
                  <Badge colorPalette="purple" variant="subtle" px={3} py={1} borderRadius="full">
                    {test.category || "Full Test"}
                  </Badge>
                  <Badge colorPalette="blue" variant="outline" px={3} py={1} borderRadius="full">
                    Practice Mode
                  </Badge>
                </HStack>
                <Heading size="lg">{test.title}</Heading>
                <Text color="gray.600" _dark={{ color: "gray.400" }}>
                  This test contains all modules necessary for a full IELTS practice session. You can complete each module individually.
                </Text>
              </VStack>
            </Box>

            {/* Reading Modules */}
            <ModuleSection
              title="Reading"
              icon={BookOpen}
              items={readingModules}
              color="blue"
              onStart={(id) => router.push(`/practice/reading/test/${id}`)}
            />

            {/* Listening Modules */}
            <ModuleSection
              title="Listening"
              icon={Headphones}
              items={listeningModules}
              color="orange"
              onStart={(id) => router.push(`/practice/listening/test/${id}`)}
            />

            {/* Writing Modules */}
            <ModuleSection
              title="Writing"
              icon={PenTool}
              items={writingModules}
              color="green"
              onStart={(id) => router.push(`/practice/writing/test/${id}`)}
            />
          </VStack>
        </Box>
      </Box>
      <MobileBottomNav />
    </Box>
  );
}

function ModuleSection({ title, icon, items, color, onStart }: {
  title: string;
  icon: any;
  items: any[];
  color: string;
  onStart: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <VStack align="stretch" gap={4}>
      <HStack>
        <Icon as={icon} color={`${color}.500`} size="lg" />
        <Heading size="md">{title} Modules</Heading>
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        {items.map((item) => (
          <Card.Root key={item.id} borderRadius="xl" shadow="sm" overflow="hidden" _hover={{ shadow: "md" }} transition="all 0.2s">
            <Card.Body>
              <VStack align="start" gap={4}>
                <Heading size="sm" lineClamp={2}>{item.title}</Heading>
                <HStack fontSize="xs" color="gray.500" gap={4}>
                  <HStack gap={1}>
                    <Target size={14} />
                    <Text>{item.difficulty || "MEDIUM"}</Text>
                  </HStack>
                </HStack>
                <Button colorPalette={color} width="full" size="sm" onClick={() => onStart(item.id)}>
                  Start {title}
                </Button>
              </VStack>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>
    </VStack>
  );
}
