"use client";

import { useState } from "react";
import {
  Box,
  Heading,
  Text,
  Grid,
  Card,
  Badge,
  HStack,
  VStack,
  Button,
  Icon,
  Flex,
  Image,
} from "@chakra-ui/react";
import {
  Headphones,
  BookOpen,
  PenTool,
  MessageSquare,
} from "lucide-react";
import { LuBell } from "react-icons/lu";

import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";

type QuestionType =
  | "Completion"
  | "Labelling"
  | "Matching"
  | "Multiple Choice"
  | "Map";

interface PracticeQuestion {
  id: string;
  title: string;
  completed: number;
  total: number;
  types: QuestionType[];
  category: "listening" | "reading" | "writing";
}

const categories = [
  { id: "listening", label: "Listening", icon: Headphones },
  { id: "reading", label: "Reading", icon: BookOpen },
  { id: "writing", label: "Writing", icon: PenTool },
];

// Mock data - replace with API call
const mockQuestions: PracticeQuestion[] = [
  {
    id: "1",
    title: "Levels of Management",
    completed: 0,
    total: 1,
    types: ["Completion"],
    category: "listening",
  },
  {
    id: "2",
    title: "University Campus",
    completed: 0,
    total: 3,
    types: ["Completion", "Labelling", "Matching"],
    category: "listening",
  },
  {
    id: "3",
    title: "Sustainable Urban Agriculture",
    completed: 0,
    total: 3,
    types: ["Labelling", "Completion"],
    category: "reading",
  },
  {
    id: "4",
    title: "Residential Water Wells",
    completed: 0,
    total: 3,
    types: ["Completion", "Labelling"],
    category: "reading",
  },
  {
    id: "5",
    title: "Track Selection",
    completed: 0,
    total: 3,
    types: ["Multiple Choice", "Map"],
    category: "reading",
  },
  {
    id: "6",
    title: "City Market",
    completed: 0,
    total: 3,
    types: ["Completion", "Labelling", "Matching"],
    category: "reading",
  },
  {
    id: "7",
    title: "Ancient Civilizations",
    completed: 1,
    total: 4,
    types: ["Multiple Choice", "Matching"],
    category: "reading",
  },
  {
    id: "8",
    title: "Climate Change Effects",
    completed: 2,
    total: 3,
    types: ["Completion", "Matching"],
    category: "writing",
  },
];

export default function PracticePage() {
  return (
    <ProtectedRoute>
      <PracticeContent />
    </ProtectedRoute>
  );
}

function PracticeContent() {
  const [activeCategory, setActiveCategory] = useState<string>("listening");
  const [questions] = useState<PracticeQuestion[]>(mockQuestions);
  const [loading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const userName = user?.first_name
    ? `${user.first_name}`.trim()
    : user?.username || "User";

  // TODO: Replace with actual API call
  // useEffect(() => {
  //   const fetchQuestions = async () => {
  //     try {
  //       const data = await practiceAPI.getQuestions();
  //       setQuestions(data);
  //     } catch (error) {
  //       console.error("Error fetching questions:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchQuestions();
  // }, []);

  const filteredQuestions = questions.filter(
    (q) => q.category === activeCategory,
  );

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Sidebar />
      <Box ml={{ base: 0, lg: "240px" }} pb={{ base: "80px", lg: 0 }}>
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
          <Heading size={{ base: "sm", md: "md" }}>Practice</Heading>
          <HStack gap={{ base: 2, md: 4 }}>
            <Icon fontSize={{ base: "lg", md: "xl" }} color="gray.600">
              <LuBell />
            </Icon>
            <HStack gap={2} display={{ base: "none", sm: "flex" }}>
              {user?.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={userName}
                  w={{ base: 8, md: 10 }}
                  h={{ base: 8, md: 10 }}
                  rounded="full"
                  objectFit="cover"
                />
              ) : (
                <Box
                  w={{ base: 8, md: 10 }}
                  h={{ base: 8, md: 10 }}
                  rounded="full"
                  bg="brand.300"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontWeight="medium" fontSize={{ base: "sm", md: "md" }}>
                    {userName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </Text>
                </Box>
              )}
              <Text fontWeight="medium" display={{ base: "none", md: "block" }}>
                {userName}
              </Text>
            </HStack>
          </HStack>
        </Flex>

        {/* Main Content */}
        <Box p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
          {/* Category Tabs */}
          <HStack
            gap={4}
            mb={6}
            pb={4}
            borderBottomWidth="2px"
            overflowX="auto"
            css={{
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <Button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  variant="ghost"
                  colorPalette={isActive ? "brand" : "gray"}
                  size="lg"
                  borderBottomWidth={isActive ? "3px" : "0"}
                  borderBottomColor={isActive ? "brand.500" : "transparent"}
                  borderRadius="0"
                  pb={2}
                  minW="fit-content"
                  fontWeight={isActive ? "semibold" : "medium"}
                  color={isActive ? "brand.600" : "gray.600"}
                  _dark={{
                    color: isActive ? "brand.400" : "gray.400",
                  }}
                >
                  <Icon fontSize="xl" mr={2}>
                    <IconComponent />
                  </Icon>
                  {category.label}
                </Button>
              );
            })}
          </HStack>

          {/* Practice Questions Header */}
          <Flex justify="space-between" align="start" mb={4}>
            <Box>
              <Heading size="xl" mb={3}>
                Practice Questions
              </Heading>
              <Text color="gray.600" _dark={{ color: "gray.400" }} maxW="3xl">
                Mockmee AI recommends the question types you need to work on the
                most. By comparing your test data to that of other users with
                similar learning profiles, the AI predicts what question types
                you are most likely to struggle with.
              </Text>
            </Box>
            <Button
              variant="outline"
              colorPalette="gray"
              display={{ base: "none", md: "flex" }}
            >
              <MessageSquare size={18} />
              <Text ml={2}>Question Log</Text>
            </Button>
          </Flex>

          {/* Questions Grid */}
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              }}
              gap={6}
              mt={8}
            >
              {filteredQuestions.map((question) => (
                <Card.Root
                  key={question.id}
                  cursor="pointer"
                  transition="all 0.2s"
                  borderRadius="2xl"
                  overflow="hidden"
                  _hover={{
                    transform: "translateY(-4px)",
                    shadow: "lg",
                  }}
                  //   onClick={() => router.push(`/practice/${question.id}`)}
                >
                  <Card.Body>
                    <VStack align="stretch" gap={4}>
                      <Flex justify="space-between" align="start">
                        <Heading size="md" flex="1">
                          {question.title}
                        </Heading>
                        <Badge
                          colorPalette="gray"
                          fontSize="sm"
                          px={2}
                          py={1}
                          borderRadius="md"
                        >
                          {question.completed}/{question.total}
                        </Badge>
                      </Flex>

                      <HStack gap={2} flexWrap="wrap">
                        {question.types.map((type, idx) => (
                          <Badge
                            key={idx}
                            colorPalette="gray"
                            variant="subtle"
                            fontSize="xs"
                            px={2}
                            py={1}
                          >
                            {type}
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
      <MobileBottomNav />
    </Box>
  );
}
