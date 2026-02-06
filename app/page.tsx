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
import { LuBell, LuFlame, LuCoins, LuTrophy, LuTarget } from "react-icons/lu";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import SectionProgressRadar from "@/components/dashboard/SectionProgressRadar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { progressAPI } from "@/lib/api";

interface ProgressProfile {
  id: string;
  user_id: string;
  points: number;
  coins: number;
  streaks: number;
  level: number;
  last_active_date: string;
  createdAt: string;
  updatedAt: string;
}

interface ProgressData {
  rank: number;
  profile: ProgressProfile;
}

interface SectionStats {
  average: number;
  submissions: number;
  trend: number[];
}

interface StatsData {
  overall: number;
  sections: {
    reading: SectionStats;
    listening: SectionStats;
    grammar: SectionStats;
    writing: SectionStats;
    speaking: SectionStats;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.first_name || user?.username || "Student";
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [statsData, setStatsData] = useState<StatsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log("Dashboard useEffect - user:", user);

      if (!user?.id) {
        console.log("No user id available, skipping fetch");
        setLoading(false);
        return;
      }

      try {
        console.log("Starting to fetch dashboard data for user id:", user.id);
        setLoading(true);

        // Small delay to ensure userStore is set in AuthContext
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("Calling progressAPI.getCurrentUserRank...");
        const rankData = await progressAPI.getCurrentUserRank(user.id);
        console.log("Rank data:", rankData);

        console.log("Calling progressAPI.getOverallSectionsProgress...");
        const sectionStats = await progressAPI.getOverallSectionsProgress();
        console.log("Section stats:", sectionStats);

        setProgressData(rankData);
        setStatsData(sectionStats);
        console.log("Data fetched successfully!");
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const userStats = {
    overallProgress: Math.round(statsData?.overall || 0),
    coins: progressData?.profile?.coins || 0,
    points: progressData?.profile?.points || 0,
    streak: progressData?.profile?.streaks || 0,
    ranking: progressData?.rank || 0,
    level: progressData?.profile?.level || 0,
  };

  const sectionData = statsData?.sections
    ? [
        {
          section: "Listening",
          score: Math.round(statsData.sections.listening?.average || 0),
        },
        {
          section: "Reading",
          score: Math.round(statsData.sections.reading?.average || 0),
        },
        {
          section: "Writing",
          score: Math.round(statsData.sections.writing?.average || 0),
        },
        {
          section: "Speaking",
          score: Math.round(statsData.sections.speaking?.average || 0),
        },
        {
          section: "Grammar",
          score: Math.round(statsData.sections.grammar?.average || 0),
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
        <Box flex="1" overflowY="auto" pb={{ base: "16", lg: "0" }}>
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
              <Icon fontSize={{ base: "lg", md: "xl" }} color="gray.600">
                <LuBell />
              </Icon>
              <HStack gap={2} display={{ base: "none", sm: "flex" }}>
                <Box
                  w={{ base: 8, md: 10 }}
                  h={{ base: 8, md: 10 }}
                  rounded="full"
                  bg="gray.300"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontWeight="medium" fontSize={{ base: "sm", md: "md" }}>
                    AA
                  </Text>
                </Box>
                <Text
                  fontWeight="medium"
                  display={{ base: "none", md: "block" }}
                >
                  {userName}
                </Text>
              </HStack>
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

              {/* Stats Cards */}
              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(5, 1fr)",
                }}
                gap={{ base: 3, md: 4 }}
              >
                {/* Overall Progress */}
                <Card.Root>
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                        >
                          Overall Progress
                        </Text>
                        <Icon
                          color="blue.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuTarget />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {userStats.overallProgress}%
                      </Heading>
                      <Badge colorPalette="blue" size="sm">
                        Pro Learner
                      </Badge>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Coins */}
                <Card.Root>
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                        >
                          Coins
                        </Text>
                        <Icon
                          color="yellow.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuCoins />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {userStats.coins}
                      </Heading>
                      <Text fontSize="xs" color="gray.500">
                        Keep earning!
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Points */}
                <Card.Root>
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                        >
                          Points
                        </Text>
                        <Icon
                          color="purple.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuTrophy />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {userStats.points}
                      </Heading>
                      <Text fontSize="xs" color="gray.500">
                        Level {userStats.level}
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Streak */}
                <Card.Root>
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                        >
                          Day Streak
                        </Text>
                        <Icon
                          color="orange.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuFlame />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        {userStats.streak}
                      </Heading>
                      <Text fontSize="xs" color="gray.500">
                        Days in a row
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Ranking */}
                <Card.Root>
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack gap={2} alignItems="flex-start">
                      <HStack justify="space-between" w="full">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="gray.600"
                        >
                          Ranking
                        </Text>
                        <Icon
                          color="green.500"
                          fontSize={{ base: "md", md: "lg" }}
                        >
                          <LuTrophy />
                        </Icon>
                      </HStack>
                      <Heading size={{ base: "xl", md: "2xl" }}>
                        #{userStats.ranking}
                      </Heading>
                      <Text fontSize="xs" color="gray.500">
                        In your class
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </Grid>

              {/* Section Progress Radar Chart */}
              {loading ? (
                <Card.Root>
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <Flex justifyContent="center" alignItems="center" h="400px">
                      <Spinner size="xl" color="brand.500" />
                    </Flex>
                  </Card.Body>
                </Card.Root>
              ) : (
                <SectionProgressRadar data={sectionData} />
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
