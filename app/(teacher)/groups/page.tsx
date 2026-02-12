"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  HStack,
  VStack,
  Card,
  Spinner,
  SimpleGrid,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { LuUsers } from "react-icons/lu";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { groupsAPI } from "@/lib/teacher-api";

interface Group {
  id: string;
  name: string;
  description?: string;
  teacher_id: string;
  status?: string;
  createdAt?: string;
}

export default function GroupsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await groupsAPI.getByTeacherId(user.id);
        setGroups(Array.isArray(response) ? response : response?.data || []);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  return (
    <ProtectedRoute>
      <Flex
        h="100vh"
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
        direction={{ base: "column", lg: "row" }}
      >
        <Box display={{ base: "none", lg: "block" }}>
          <Sidebar />
        </Box>

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
            <Heading size={{ base: "sm", md: "md" }}>Groups</Heading>
            <HStack gap={{ base: 2, md: 4 }}>
              <NotificationsDrawer />
            </HStack>
          </Flex>

          <Container
            maxW="7xl"
            py={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6 }}
          >
            <VStack gap={{ base: 4, md: 6 }} alignItems="stretch">
              <Box>
                <Heading size={{ base: "lg", md: "xl" }} mb={2}>
                  My Groups
                </Heading>
                <Text color="gray.600" _dark={{ color: "gray.400" }}>
                  Manage your student groups
                </Text>
              </Box>

              {loading ? (
                <Flex justify="center" align="center" minH="300px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : groups.length === 0 ? (
                <Card.Root>
                  <Card.Body>
                    <VStack gap={4} py={12}>
                      <Icon fontSize="5xl" color="gray.400">
                        <LuUsers />
                      </Icon>
                      <Heading
                        size="md"
                        color="gray.600"
                        _dark={{ color: "gray.400" }}
                      >
                        No groups yet
                      </Heading>
                      <Text
                        color="gray.500"
                        _dark={{ color: "gray.400" }}
                        textAlign="center"
                      >
                        Your groups will appear here.
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                  {groups.map((group) => (
                    <Card.Root
                      key={group.id}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ transform: "translateY(-2px)", shadow: "md" }}
                      borderRadius="xl"
                      onClick={() => router.push(`/groups/${group.id}`)}
                    >
                      <Card.Body p={6}>
                        <VStack gap={3} alignItems="flex-start">
                          <HStack justify="space-between" w="full">
                            <Heading size="md">{group.name}</Heading>
                            <Badge colorPalette="green" size="sm">
                              {group.status || "Active"}
                            </Badge>
                          </HStack>
                          {group.description && (
                            <Text
                              fontSize="sm"
                              color="gray.600"
                              _dark={{ color: "gray.400" }}
                              lineClamp={2}
                            >
                              {group.description}
                            </Text>
                          )}
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  ))}
                </SimpleGrid>
              )}
            </VStack>
          </Container>
        </Box>

        <MobileBottomNav />
      </Flex>
    </ProtectedRoute>
  );
}
