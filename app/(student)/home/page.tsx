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
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
} from "recharts";
import Sidebar from "@/components/dashboard/Sidebar";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
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
  scores: {
    averageBandScore: number | null;
    bestBandScore: number | null;
  };
  reading: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
  };
  listening: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
  };
  writing: {
    totalAnswers: number;
    averageWordCount: number;
    averageScores: {
      task_response: number;
      lexical_resources: number;
      grammar_range_and_accuracy: number;
      coherence_and_cohesion: number;
      overall: number;
    } | null;
    scoredCount: number;
  };
  time: {
    averageTimeSpentMinutes: number;
    totalTimeSpentMinutes: number;
  };
  recentScores: number[];
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

  const writingGraphScore = stats?.writing.averageScores?.overall
    ? Math.round(stats.writing.averageScores.overall * 10)
    : 0;

  const sectionData = stats
    ? [
        {
          section: "Listening",
          reading: Math.round(stats.reading.accuracy),
          listening: Math.round(stats.listening.accuracy),
          writing: writingGraphScore,
        },
        {
          section: "Reading",
          reading: Math.round(stats.reading.accuracy),
          listening: Math.round(stats.listening.accuracy),
          writing: writingGraphScore,
        },
        {
          section: "Writing",
          reading: Math.round(stats.reading.accuracy),
          listening: Math.round(stats.listening.accuracy),
          writing: writingGraphScore,
        },
      ]
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
        _dark={{ bg: "gray.900" }}
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
              <NotificationsDrawer />
            </HStack>
          </Flex>

          <Container
            maxW="7xl"
            py={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6 }}
          >
            {/* Greeting Section */}
            <VStack gap={{ base: 4, md: 6, lg: 8 }} alignItems="stretch">
              <Box>
                <Heading size={{ base: "xl", md: "2xl" }} mb={2}>
                  {getGreeting()}, {userName.split(" ")[0]}! 👋
                </Heading>
                <Text
                  fontSize={{ base: "md", md: "lg" }}
                  color="gray.600"
                  _dark={{ color: "gray.400" }}
                >
                  Welcome back to your learning dashboard
                </Text>
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
                <Card.Root borderRadius="2xl" overflow="hidden">
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
                        {stats?.scores.bestBandScore ?? "—"}
                      </Heading>
                      <Badge colorPalette="yellow" size="sm">
                        Avg: {stats?.scores.averageBandScore ?? "—"}
                      </Badge>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Total Attempts */}
                <Card.Root borderRadius="2xl" overflow="hidden">
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          Total Attempts
                        </Text>
                        <Icon
                          color="blue.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuChartBarBig />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {stats?.overview.totalAttempts ?? 0}
                      </Heading>
                      <HStack gap={2}>
                        <Badge colorPalette="green" size="sm">
                          {stats?.overview.totalSubmitted ?? 0} submitted
                        </Badge>
                        <Badge colorPalette="orange" size="sm">
                          {stats?.overview.totalInProgress ?? 0} in progress
                        </Badge>
                      </HStack>
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
                          Reading Accuracy
                        </Text>
                        <Icon
                          color="green.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuBookOpen />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {stats?.reading.accuracy ?? 0}%
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        _dark={{ color: "gray.400" }}
                      >
                        {stats?.reading.correctAnswers ?? 0}/
                        {stats?.reading.totalQuestions ?? 0} correct
                      </Text>
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
                          Listening Accuracy
                        </Text>
                        <Icon
                          color="purple.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuHeadphones />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {stats?.listening.accuracy ?? 0}%
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        _dark={{ color: "gray.400" }}
                      >
                        {stats?.listening.correctAnswers ?? 0}/
                        {stats?.listening.totalQuestions ?? 0} correct
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </Grid>

              {/* Secondary Stats Row */}
              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                }}
                gap={{ base: 3, md: 4 }}
              >
                {/* Writing */}
                <Card.Root borderRadius="2xl" overflow="hidden">
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          Writing
                        </Text>
                        <Icon
                          color="teal.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuPenLine />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {stats?.writing.totalAnswers ?? 0}
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        _dark={{ color: "gray.400" }}
                      >
                        {stats?.writing.totalAnswers
                          ? `Avg ${stats.writing.averageWordCount} words`
                          : "No answers yet"}
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Time Spent */}
                <Card.Root borderRadius="2xl" overflow="hidden">
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          Time Spent
                        </Text>
                        <Icon
                          color="orange.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuClock />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {stats?.time.totalTimeSpentMinutes?.toFixed(1) ?? 0} min
                      </Heading>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        _dark={{ color: "gray.400" }}
                      >
                        Avg{" "}
                        {stats?.time.averageTimeSpentMinutes?.toFixed(1) ?? 0}{" "}
                        min per test
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Recent Scores */}
                <Card.Root borderRadius="2xl" overflow="hidden">
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          Recent Scores
                        </Text>
                        <Icon
                          color="blue.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuCircleCheck />
                        </Icon>
                      </HStack>
                      <HStack gap={2} flexWrap="wrap">
                        {stats?.recentScores?.length ? (
                          stats.recentScores.map((score, i) => (
                            <Badge
                              key={i}
                              colorPalette={
                                score >= 7
                                  ? "green"
                                  : score >= 5
                                    ? "yellow"
                                    : "red"
                              }
                              size="lg"
                              fontSize="lg"
                              px={3}
                              py={1}
                            >
                              {score}
                            </Badge>
                          ))
                        ) : (
                          <Text fontSize="sm" color="gray.500">
                            No scores yet
                          </Text>
                        )}
                      </HStack>
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
                <SectionAreaChart data={sectionData} />
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

interface SectionChartData {
  section: string;
  reading: number;
  listening: number;
  writing: number;
}

function SectionAreaChart({ data }: { data: SectionChartData[] }) {
  const chart = useChart({
    data,
    series: [
      { name: "reading", color: "green.solid" },
      { name: "listening", color: "purple.solid" },
      { name: "writing", color: "teal.solid" },
    ],
  });

  return (
    <Card.Root borderRadius="2xl" overflow="hidden">
      <Card.Body p={{ base: 4, md: 6 }}>
        <Heading size={{ base: "md", md: "lg" }} mb={1}>
          Section Accuracy
        </Heading>
        <Text
          fontSize={{ base: "xs", md: "sm" }}
          color="gray.600"
          _dark={{ color: "gray.400" }}
          mb={{ base: 4, md: 6 }}
        >
          Your performance across IELTS skill areas
        </Text>
        <Chart.Root maxH="sm" chart={chart}>
          <AreaChart data={chart.data}>
            <CartesianGrid
              stroke={chart.color("border.muted")}
              vertical={false}
            />
            <XAxis
              axisLine={false}
              tickLine={false}
              dataKey={chart.key("section")}
            />
            <Tooltip
              cursor={false}
              animationDuration={100}
              content={<Chart.Tooltip />}
            />
            <Legend content={<Chart.Legend />} />
            {chart.series.map((item) => (
              <Area
                key={item.name}
                isAnimationActive={false}
                dataKey={chart.key(item.name)}
                fill={chart.color(item.color)}
                fillOpacity={0.2}
                stroke={chart.color(item.color)}
                stackId="a"
              />
            ))}
          </AreaChart>
        </Chart.Root>
      </Card.Body>
    </Card.Root>
  );
}
