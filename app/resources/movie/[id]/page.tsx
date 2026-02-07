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
  Button,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuEye,
  LuClock,
  LuBell,
  LuCalendar,
} from "react-icons/lu";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { moviesAPI } from "@/lib/api";

interface MovieDetail {
  movie_id: string;
  title: string;
  description?: string;
  url?: string;
  video_url?: string;
  thumbnail?: string;
  poster?: string;
  views?: number;
  duration?: string;
  genre?: string;
  release_year?: number;
  director?: string;
  cast?: string[];
  rating?: number;
  created_at?: string;
}

export default function MovieDetailPage() {
  const { user } = useAuth();
  const userName = user?.first_name || user?.username || "Student";
  const params = useParams();
  const router = useRouter();
  const movieId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!movieId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Increment view count
        await moviesAPI.incrementView(movieId);

        // Fetch movie details
        const response = await moviesAPI.getMovieById(movieId);

        if (response) {
          setMovie(response);
        } else {
          setError("Movie not found");
        }
      } catch (err) {
        console.error("Failed to fetch movie:", err);
        setError("Failed to load movie. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

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
            <Heading size={{ base: "sm", md: "md" }}>Movie Details</Heading>
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
            <Container maxW="6xl" py={6}>
              {/* Back Button */}
              <Button
                variant="ghost"
                mb={4}
                onClick={() => router.push("/resources")}
                size={{ base: "sm", md: "md" }}
              >
                <Icon>
                  <LuArrowLeft />
                </Icon>
                <Text ml={2}>Back to Resources</Text>
              </Button>

              {loading ? (
                <Flex justify="center" align="center" minH="500px">
                  <VStack gap={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text color="gray.600" _dark={{ color: "gray.400" }}>
                      Loading movie...
                    </Text>
                  </VStack>
                </Flex>
              ) : error ? (
                <Flex justify="center" align="center" minH="500px">
                  <VStack gap={4}>
                    <Text fontSize="4xl">😔</Text>
                    <Text color="red.500" fontSize="lg">
                      {error}
                    </Text>
                    <Button onClick={() => router.push("/resources")}>
                      Back to Resources
                    </Button>
                  </VStack>
                </Flex>
              ) : movie ? (
                <VStack align="stretch" gap={6}>
                  {/* Movie Player */}
                  {(movie.video_url || movie.url) && (
                    <Card.Root overflow="hidden">
                      <Box
                        position="relative"
                        w="full"
                        aspectRatio="16/9"
                        bg="black"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <video
                          controls
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        >
                          <source src={movie.video_url || movie.url} />
                          Your browser does not support the video tag.
                        </video>
                      </Box>
                    </Card.Root>
                  )}

                  {/* Movie Info */}
                  <Card.Root>
                    <Card.Body>
                      <VStack align="stretch" gap={4}>
                        <HStack justify="space-between" flexWrap="wrap" gap={4}>
                          <Heading size="xl">{movie.title}</Heading>
                          {movie.genre && (
                            <Badge size="lg" colorScheme="blue">
                              {movie.genre}
                            </Badge>
                          )}
                        </HStack>

                        {/* Meta Info */}
                        <HStack gap={4} flexWrap="wrap" fontSize="sm">
                          {movie.views !== undefined && (
                            <HStack
                              color="gray.600"
                              _dark={{ color: "gray.400" }}
                            >
                              <Icon>
                                <LuEye />
                              </Icon>
                              <Text>{movie.views} views</Text>
                            </HStack>
                          )}
                          {movie.duration && (
                            <HStack
                              color="gray.600"
                              _dark={{ color: "gray.400" }}
                            >
                              <Icon>
                                <LuClock />
                              </Icon>
                              <Text>{movie.duration}</Text>
                            </HStack>
                          )}
                          {movie.release_year && (
                            <HStack
                              color="gray.600"
                              _dark={{ color: "gray.400" }}
                            >
                              <Icon>
                                <LuCalendar />
                              </Icon>
                              <Text>{movie.release_year}</Text>
                            </HStack>
                          )}
                          {movie.rating && (
                            <HStack color="yellow.500">
                              <Text fontWeight="bold">★</Text>
                              <Text
                                color="gray.600"
                                _dark={{ color: "gray.400" }}
                              >
                                {movie.rating}/10
                              </Text>
                            </HStack>
                          )}
                        </HStack>

                        {/* Director & Cast */}
                        {(movie.director || movie.cast) && (
                          <VStack align="stretch" gap={2}>
                            {movie.director && (
                              <HStack>
                                <Text fontWeight="semibold">Director:</Text>
                                <Text>{movie.director}</Text>
                              </HStack>
                            )}
                            {movie.cast && movie.cast.length > 0 && (
                              <HStack align="flex-start">
                                <Text fontWeight="semibold">Cast:</Text>
                                <Text>{movie.cast.join(", ")}</Text>
                              </HStack>
                            )}
                          </VStack>
                        )}

                        {/* Description */}
                        {movie.description && (
                          <Box>
                            <Heading size="md" mb={2}>
                              Synopsis
                            </Heading>
                            <Text
                              color="gray.700"
                              _dark={{ color: "gray.300" }}
                              whiteSpace="pre-wrap"
                            >
                              {movie.description}
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                </VStack>
              ) : null}
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
