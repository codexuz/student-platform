"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Icon,
  HStack,
  VStack,
  Card,
  Badge,
  Spinner,
  SimpleGrid,
  Image,
} from "@chakra-ui/react";
import {
  LuFilm,
  LuEye,
  LuClock,
  LuBell,
} from "react-icons/lu";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { moviesAPI } from "@/lib/api";

interface Movie {
  id: string;
  title: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  views?: number;
  duration?: string;
  genre?: string;
  release_year?: number;
}

export default function ResourcesPage() {
  const { user } = useAuth();
  const userName = user?.first_name || user?.username || "Student";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch movies
        const moviesResponse = await moviesAPI.getMovies();

        // Handle movies response
        if (Array.isArray(moviesResponse)) {
          setMovies(moviesResponse);
        } else if (moviesResponse?.data) {
          setMovies(
            Array.isArray(moviesResponse.data)
              ? moviesResponse.data
              : [moviesResponse.data],
          );
        } else if (moviesResponse?.movies) {
          setMovies(moviesResponse.movies);
        } else {
          setMovies([]);
        }
      } catch (err) {
        console.error("Failed to fetch resources:", err);
        setError("Failed to load resources. Please try again later.");
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [user]);

  const handleMovieClick = (movieId: string) => {
    router.push(`/resources/movie/${movieId}`);
  };

  return (
    <ProtectedRoute>
      <Flex minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
        {/* Desktop Sidebar */}
        <Box display={{ base: "none", lg: "block" }}>
          <Sidebar />
        </Box>

        {/* Main Content */}
        <Box flex="1" display="flex" flexDirection="column">
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
            <Heading size={{ base: "sm", md: "md" }}>Movies</Heading>
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
                    {userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
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

          {/* Content Area */}
          <Box
            flex="1"
            overflowY="auto"
            pb={{ base: "80px", lg: "0" }}
            bg="gray.50"
            _dark={{ bg: "gray.900" }}
          >
            <Container maxW="7xl" py={6}>
              {/* Header */}
              <VStack align="stretch" gap={6} mb={8}>
                <Box>
                  <Heading size="2xl" mb={2}>
                    Movies
                  </Heading>
                  <Text color="gray.600" _dark={{ color: "gray.400" }}>
                    Explore educational movies
                  </Text>
                </Box>
              </VStack>

              {/* Movies Grid */}
              {loading ? (
                <Flex justify="center" align="center" minH="400px">
                  <VStack gap={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text color="gray.600" _dark={{ color: "gray.400" }}>
                      Loading movies...
                    </Text>
                  </VStack>
                </Flex>
              ) : error ? (
                <Flex justify="center" align="center" minH="400px">
                  <VStack gap={4}>
                    <Icon fontSize="4xl" color="red.500">
                      <LuFilm />
                    </Icon>
                    <Text color="red.500">{error}</Text>
                  </VStack>
                </Flex>
              ) : movies.length === 0 ? (
                <Flex justify="center" align="center" minH="400px">
                  <VStack gap={4}>
                    <Icon fontSize="4xl" color="gray.400">
                      <LuFilm />
                    </Icon>
                    <Text color="gray.600" _dark={{ color: "gray.400" }}>
                      No movies available
                    </Text>
                  </VStack>
                </Flex>
              ) : (
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                        {movies.map((movie) => (
                          <Card.Root
                            key={movie.id}
                            overflow="hidden"
                            cursor="pointer"
                            _hover={{
                              transform: "translateY(-4px)",
                              shadow: "xl",
                            }}
                            transition="all 0.2s"
                            onClick={() => handleMovieClick(movie.id)}
                          >
                            {/* Thumbnail */}
                            <Box
                              position="relative"
                              aspectRatio="2/3"
                              h="180px"
                              bg="gray.200"
                              _dark={{ bg: "gray.700" }}
                            >
                              {movie.thumbnail ? (
                                <Image
                                  src={movie.thumbnail}
                                  alt={movie.title}
                                  objectFit="cover"
                                  w="full"
                                  h="full"
                                />
                              ) : (
                                <Flex
                                  align="center"
                                  justify="center"
                                  h="full"
                                  bg="gray.100"
                                  _dark={{ bg: "gray.800" }}
                                >
                                  <Icon fontSize="4xl" color="gray.400">
                                    <LuFilm />
                                  </Icon>
                                </Flex>
                              )}
                              {movie.genre && (
                                <Badge
                                  position="absolute"
                                  top={2}
                                  right={2}
                                  colorScheme="blue"
                                >
                                  {movie.genre}
                                </Badge>
                              )}
                            </Box>

                            <Card.Body>
                              <VStack align="stretch" gap={2}>
                                <Heading size="md" lineClamp={2}>
                                  {movie.title}
                                </Heading>
                                {movie.description && (
                                  <Text
                                    fontSize="sm"
                                    color="gray.600"
                                    _dark={{ color: "gray.400" }}
                                    lineClamp={3}
                                  >
                                    {movie.description}
                                  </Text>
                                )}
                                <HStack justify="space-between" fontSize="sm">
                                  {movie.release_year && (
                                    <Text color="gray.500">
                                      {movie.release_year}
                                    </Text>
                                  )}
                                  {movie.duration && (
                                    <HStack color="gray.500">
                                      <Icon>
                                        <LuClock />
                                      </Icon>
                                      <Text>{movie.duration}</Text>
                                    </HStack>
                                  )}
                                </HStack>
                                {movie.views !== undefined && (
                                  <HStack fontSize="sm" color="gray.500">
                                    <Icon>
                                      <LuEye />
                                    </Icon>
                                    <Text>{movie.views} views</Text>
                                  </HStack>
                                )}
                              </VStack>
                            </Card.Body>
                          </Card.Root>
                        ))}
                      </SimpleGrid>
                    )}
            </Container>
          </Box>
        </Box>

        {/* Mobile Bottom Navigation */}
        <Box display={{ base: "block", lg: "none" }}>
          <MobileBottomNav />
        </Box>
      </Flex>
    </ProtectedRoute>
  );
}
