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
  Tabs,
  Image,
} from "@chakra-ui/react";
import { LuFilm, LuEye, LuClock, LuBookOpen } from "react-icons/lu";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { moviesAPI, articlesAPI } from "@/lib/api";

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

interface Article {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  author?: string;
  image?: string;
  views?: number;
  created_at?: string;
  updated_at?: string;
}

export default function ResourcesPage() {
  const { user } = useAuth();
  const userName = user?.first_name || user?.username || "Student";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"movies" | "articles">("movies");

  useEffect(() => {
    const fetchResources = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch movies and articles in parallel
        const [moviesResponse, articlesResponse] = await Promise.all([
          moviesAPI.getMovies(),
          articlesAPI.getArticles(100),
        ]);

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

        // Handle articles response
        if (Array.isArray(articlesResponse)) {
          setArticles(articlesResponse);
        } else if (articlesResponse?.data) {
          setArticles(
            Array.isArray(articlesResponse.data)
              ? articlesResponse.data
              : [articlesResponse.data],
          );
        } else if (articlesResponse?.articles) {
          setArticles(articlesResponse.articles);
        } else {
          setArticles([]);
        }
      } catch (err) {
        console.error("Failed to fetch resources:", err);
        setError("Failed to load resources. Please try again later.");
        setMovies([]);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [user]);

  const handleMovieClick = (movieId: string) => {
    router.push(`/resources/movie/${movieId}`);
  };

  const handleArticleClick = (articleId: string) => {
    router.push(`/resources/article/${articleId}`);
  };

  return (
    <ProtectedRoute>
      <Flex minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
        {/* Desktop Sidebar */}
        <Box display={{ base: "none", lg: "block" }}>
          <Sidebar />
        </Box>

        {/* Main Content */}
        <Box
          flex="1"
          display="flex"
          flexDirection="column"
          ml={{ base: 0, lg: "240px" }}
        >
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
            <Heading size={{ base: "sm", md: "md" }}>Resources</Heading>
            <HStack gap={{ base: 2, md: 4 }}>
              <NotificationsDrawer />
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
                    Resources
                  </Heading>
                  <Text color="gray.600" _dark={{ color: "gray.400" }}>
                    Explore educational movies and articles
                  </Text>
                </Box>
              </VStack>

              {/* Tabs */}
              <Tabs.Root
                value={activeTab}
                onValueChange={(e) =>
                  setActiveTab(e.value as "movies" | "articles")
                }
                variant="enclosed"
                mb={6}
              >
                <Tabs.List>
                  <Tabs.Trigger value="movies">
                    <HStack>
                      <Icon fontSize="lg">
                        <LuFilm />
                      </Icon>
                      <Text>Movies ({movies.length})</Text>
                    </HStack>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="articles">
                    <HStack>
                      <Icon fontSize="lg">
                        <LuBookOpen />
                      </Icon>
                      <Text>Articles ({articles.length})</Text>
                    </HStack>
                  </Tabs.Trigger>
                </Tabs.List>

                <Box mt={6}>
                  <Tabs.Content value="movies">
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
                                    <Text color="gray.500" _dark={{ color: "gray.400" }}>
                                      {movie.release_year}
                                    </Text>
                                  )}
                                  {movie.duration && (
                                    <HStack color="gray.500" _dark={{ color: "gray.400" }}>
                                      <Icon>
                                        <LuClock />
                                      </Icon>
                                      <Text>{movie.duration}</Text>
                                    </HStack>
                                  )}
                                </HStack>
                                {movie.views !== undefined && (
                                  <HStack fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
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
                  </Tabs.Content>

                  <Tabs.Content value="articles">
                    {loading ? (
                      <Flex justify="center" align="center" minH="400px">
                        <VStack gap={4}>
                          <Spinner size="xl" color="blue.500" />
                          <Text color="gray.600" _dark={{ color: "gray.400" }}>
                            Loading articles...
                          </Text>
                        </VStack>
                      </Flex>
                    ) : error ? (
                      <Flex justify="center" align="center" minH="400px">
                        <VStack gap={4}>
                          <Icon fontSize="4xl" color="red.500">
                            <LuBookOpen />
                          </Icon>
                          <Text color="red.500">{error}</Text>
                        </VStack>
                      </Flex>
                    ) : articles.length === 0 ? (
                      <Flex justify="center" align="center" minH="400px">
                        <VStack gap={4}>
                          <Icon fontSize="4xl" color="gray.400">
                            <LuBookOpen />
                          </Icon>
                          <Text color="gray.600" _dark={{ color: "gray.400" }}>
                            No articles available
                          </Text>
                        </VStack>
                      </Flex>
                    ) : (
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                        {articles.map((article) => (
                          <Card.Root
                            key={article.id}
                            overflow="hidden"
                            cursor="pointer"
                            _hover={{
                              transform: "translateY(-4px)",
                              shadow: "xl",
                            }}
                            transition="all 0.2s"
                            onClick={() => handleArticleClick(article.id)}
                          >
                            {/* Thumbnail */}
                            <Box
                              position="relative"
                              aspectRatio="16/9"
                              h="180px"
                              bg="gray.200"
                              _dark={{ bg: "gray.700" }}
                            >
                              {article.image ? (
                                <Image
                                  src={article.image}
                                  alt={article.title}
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
                                    <LuBookOpen />
                                  </Icon>
                                </Flex>
                              )}
                            </Box>

                            <Card.Body>
                              <VStack align="stretch" gap={2}>
                                <Heading size="md" lineClamp={2}>
                                  {article.title}
                                </Heading>
                                {article.summary && (
                                  <Text
                                    fontSize="sm"
                                    color="gray.600"
                                    _dark={{ color: "gray.400" }}
                                    lineClamp={3}
                                  >
                                    {article.summary}
                                  </Text>
                                )}
                                <HStack
                                  justify="space-between"
                                  fontSize="sm"
                                  flexWrap="wrap"
                                >
                                  {article.author && (
                                    <Text color="gray.500" _dark={{ color: "gray.400" }} fontWeight="medium">
                                      By {article.author}
                                    </Text>
                                  )}
                                  {article.views !== undefined && (
                                    <HStack color="gray.500" _dark={{ color: "gray.400" }}>
                                      <Icon>
                                        <LuEye />
                                      </Icon>
                                      <Text>{article.views} views</Text>
                                    </HStack>
                                  )}
                                </HStack>
                                {article.created_at && (
                                  <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
                                    {new Date(
                                      article.created_at,
                                    ).toLocaleDateString()}
                                  </Text>
                                )}
                              </VStack>
                            </Card.Body>
                          </Card.Root>
                        ))}
                      </SimpleGrid>
                    )}
                  </Tabs.Content>
                </Box>
              </Tabs.Root>
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
