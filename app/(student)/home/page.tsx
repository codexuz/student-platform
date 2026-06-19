"use client";

import {
  Box,
  Container,
  Grid,
  Heading,
  Text,
  Flex,
  Icon,
  HStack,
  VStack,
  Card,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import {
  LuBookOpen,
  LuHeadphones,
  LuPenLine,
  LuClock,
  LuTrophy,
  LuChartBarBig,
  LuCircleCheck,
} from "react-icons/lu";
import { useState, useEffect } from "react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Area,
  AreaChart,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { ieltsAnswersAPI } from "@/lib/ielts-api";

interface IeltsStatistics {
  overview: {
    totalSubmitted: number;
    totalInProgress: number;
    totalAbandoned: number;
    totalAttempts: number;
  };
  highestScore: number;
  listening: number;
  reading: number;
  writing: number;
  time: {
    averageTimeSpentMinutes: number;
    totalTimeSpentMinutes: number;
  };
  recentScores: { title: string; score: number }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.first_name || user?.username || "Student";
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<IeltsStatistics | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await ieltsAnswersAPI.getStatistics();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch IELTS statistics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const chartData = stats?.recentScores
    ? stats.recentScores.map((item) => ({
        test: item.title,
        score: item.score,
      }))
    : [];
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <ProtectedRoute>
      <Flex
        h="100vh"
        bg="gray.50"
        background="radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 500px), radial-gradient(circle at bottom left, rgba(16,185,129,0.12), transparent 500px), var(--chakra-colors-gray-50)"
        _dark={{ 
          bg: "gray.900",
          background: "radial-gradient(circle at top right, rgba(59,130,246,0.15), transparent 500px), radial-gradient(circle at bottom left, rgba(16,185,129,0.15), transparent 500px), var(--chakra-colors-gray-900)"
        }}
        direction={{ base: "column", lg: "row" }}
      >
        {/* Left Sidebar */}
        <Box display={{ base: "none", lg: "block" }}>
          <Sidebar />
        </Box>

        {/* Main Content */}
        <Box
          flex="1"
          overflowY="auto"
          pb={{ base: "16", lg: "0" }}
          ml={{ base: 0, lg: "240px" }}
        >
          <Flex
            h={{ base: "14", md: "16" }}
            px={{ base: 4, md: 8 }}
            alignItems="center"
            justifyContent="space-between"
            bg="white"
            _dark={{ bg: "gray.800" }}
            borderBottomWidth="1px"
          >
            <Heading size={{ base: "sm", md: "md" }}>Dashboard</Heading>
            <HStack gap={{ base: 2, md: 4 }}>
            </HStack>
          </Flex>

          <Container
            maxW="7xl"
            py={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6 }}
          >
            {/* Greeting Section */}
            <VStack gap={{ base: 4, md: 6, lg: 8 }} alignItems="stretch">
              <Box
                position="relative"
                p={{ base: 8, md: 12 }}
                borderRadius="3xl"
                overflow="hidden"
                bg="blue.600"
                _dark={{ bg: "blue.800" }}
                color="white"
                shadow="2xl"
              >
                <Box
                  position="absolute"
                  top="-50%"
                  right="-10%"
                  w="400px"
                  h="400px"
                  bg="purple.500"
                  filter="blur(120px)"
                  opacity={0.6}
                  borderRadius="full"
                  zIndex={0}
                  pointerEvents="none"
                />
                <Box
                  position="absolute"
                  bottom="-50%"
                  left="-10%"
                  w="300px"
                  h="300px"
                  bg="teal.400"
                  filter="blur(100px)"
                  opacity={0.5}
                  borderRadius="full"
                  zIndex={0}
                  pointerEvents="none"
                />
                <Box position="relative" zIndex={1}>
                  <Heading size={{ base: "2xl", md: "4xl" }} mb={3} letterSpacing="tight">
                    {getGreeting()}, {userName.split(" ")[0]}! 👋
                  </Heading>
                  <Text fontSize={{ base: "lg", md: "xl" }} color="blue.100" maxW="2xl" lineHeight="tall">
                    Welcome back to your learning dashboard. Here's a quick overview of your latest IELTS performance and progress.
                  </Text>
                </Box>
              </Box>

              {/* IELTS Stats Cards */}
              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)",
                }}
                gap={{ base: 3, md: 4 }}
              >
                {/* Best Band Score */}
                <Card.Root 
                  borderRadius="3xl" 
                  overflow="hidden"
                  bg="rgba(255, 255, 255, 0.85)"
                  backdropFilter="blur(20px)"
                  border="1px solid"
                  borderColor="rgba(0, 0, 0, 0.05)"
                  boxShadow="0 8px 32px rgba(0, 0, 0, 0.04)"
                  _dark={{
                    bg: "rgba(30, 30, 35, 0.6)",
                    borderColor: "whiteAlpha.200",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{
                    transform: "translateY(-4px) scale(1.02)",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.08)",
                    _dark: {
                      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6)",
                    }
                  }}
                >
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          Best Band Score
                        </Text>
                        <Icon
                          color="yellow.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuTrophy />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {stats?.highestScore ?? "—"}
                      </Heading>
                      {stats?.recentScores && stats.recentScores.length > 0 && (
                        <Badge colorPalette="yellow" size="sm">
                          Avg: {(stats.recentScores.reduce((a, b) => a + b.score, 0) / stats.recentScores.length).toFixed(1)}
                        </Badge>
                      )}
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Reading Accuracy */}
                <Card.Root borderRadius="2xl" overflow="hidden">
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          Reading Score
                        </Text>
                        <Icon
                          color="green.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuBookOpen />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {stats?.reading ?? "—"}
                      </Heading>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Listening Accuracy */}
                <Card.Root borderRadius="2xl" overflow="hidden">
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          Listening Score
                        </Text>
                        <Icon
                          color="purple.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuHeadphones />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {stats?.listening ?? "—"}
                      </Heading>
                    </VStack>
                  </Card.Body>
                </Card.Root>
                {/* Writing Score */}
                <Card.Root borderRadius="2xl" overflow="hidden">
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          Writing Score
                        </Text>
                        <Icon
                          color="teal.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuPenLine />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {stats?.writing ?? "—"}
                      </Heading>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </Grid>

              {/* Section Accuracy Area Chart */}
              {loading ? (
                <Card.Root borderRadius="2xl" overflow="hidden">
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <Flex justifyContent="center" alignItems="center" h="200px">
                      <Spinner size="xl" color="brand.500" />
                    </Flex>
                  </Card.Body>
                </Card.Root>
              ) : (
                <RecentScoresChart data={chartData} />
              )}
            </VStack>
          </Container>
        </Box>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </Flex>
    </ProtectedRoute>
  );
}

interface RecentScoreData {
  test: string;
  score: number;
}

function RecentScoresChart({ data }: { data: RecentScoreData[] }) {
  const chart = useChart({
    data,
    series: [
      { name: "score", color: "blue.solid" },
    ],
  });

  return (
    <Card.Root borderRadius="2xl" overflow="hidden">
      <Card.Body p={{ base: 4, md: 6 }}>
        <Heading size={{ base: "md", md: "lg" }} mb={1}>
          Recent Performance
        </Heading>
        <Text
          fontSize={{ base: "xs", md: "sm" }}
          color="gray.600"
          _dark={{ color: "gray.400" }}
          mb={{ base: 4, md: 6 }}
        >
          Your band scores from recent tests
        </Text>
        <Chart.Root maxH="sm" chart={chart}>
          <LineChart data={chart.data}>
            <CartesianGrid
              stroke={chart.color("border.muted")}
              vertical={false}
            />
            <XAxis
              axisLine={false}
              tickLine={false}
              dataKey={chart.key("test")}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              domain={[0, 9]}
              ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
            />
            <Tooltip
              cursor={false}
              animationDuration={100}
              content={<Chart.Tooltip />}
            />
            <Line
              type="monotone"
              isAnimationActive={false}
              dataKey={chart.key("score")}
              stroke={chart.color("blue.solid")}
              strokeWidth={3}
              dot={{ r: 4, fill: chart.color("blue.solid") }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </Chart.Root>
      </Card.Body>
    </Card.Root>
  );
}
