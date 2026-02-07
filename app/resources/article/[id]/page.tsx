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
  Image,
} from "@chakra-ui/react";
import { LuArrowLeft, LuEye, LuBell, LuCalendar, LuUser } from "react-icons/lu";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { articlesAPI } from "@/lib/api";

interface EditorJsBlock {
  id: string;
  type: string;
  data: {
    text?: string;
    src?: string;
    level?: number;
    caption?: string;
  };
}

interface ArticleContent {
  time: number;
  blocks: EditorJsBlock[];
  version: string;
}

interface ArticleDetail {
  id: string;
  article_id?: string;
  title: string;
  content?: ArticleContent | string;
  summary?: string;
  author?: string;
  image?: string;
  thumbnail?: string;
  seenCount?: number;
  views?: number;
  category?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  tags?: string[];
}

export default function ArticleDetailPage() {
  const { user } = useAuth();
  const userName = user?.first_name || user?.username || "Student";
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Increment view count
        // await articlesAPI.incrementView(articleId);

        // Fetch article details
        const response = await articlesAPI.getArticleById(articleId);

        if (response) {
          setArticle(response);
        } else {
          setError("Article not found");
        }
      } catch (err) {
        console.error("Failed to fetch article:", err);
        setError("Failed to load article. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  const renderBlock = (block: EditorJsBlock) => {
    switch (block.type) {
      case "audioPlayer":
        return (
          <Box key={block.id} my={4}>
            <audio controls style={{ width: "100%" }} src={block.data.src}>
              <source src={block.data.src} />
              Your browser does not support the audio element.
            </audio>
          </Box>
        );

      case "paragraph":
        return (
          <Box
            key={block.id}
            my={4}
            fontSize="md"
            lineHeight="1.8"
            dangerouslySetInnerHTML={{ __html: block.data.text || "" }}
          />
        );

      default:
        return null;
    }
  };

  const renderContent = () => {
    if (!article?.content) return null;

    if (typeof article.content === "string") {
      return (
        <Text whiteSpace="pre-wrap" fontSize="md" lineHeight="1.8">
          {article.content}
        </Text>
      );
    }

    const content = article.content as ArticleContent;
    return (
      <VStack align="stretch" gap={0}>
        {content.blocks?.map((block) => renderBlock(block))}
      </VStack>
    );
  };

  const getArticleImage = () => article?.image || article?.thumbnail;
  const getArticleViews = () => article?.seenCount || article?.views || 0;
  const getCreatedAt = () => article?.createdAt || article?.created_at;
  const getUpdatedAt = () => article?.updatedAt || article?.updated_at;

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
            <Heading size={{ base: "sm", md: "md" }}>Article</Heading>
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
            <Container maxW="4xl" py={6}>
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
                      Loading article...
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
              ) : article ? (
                <VStack align="stretch" gap={6}>
                  {/* Article Header */}
                  <Card.Root>
                    <Card.Body>
                      <VStack align="stretch" gap={4}>
                        {/* Category Badge */}
                        {article.category && (
                          <Box>
                            <Badge size="lg" colorScheme="blue">
                              {article.category}
                            </Badge>
                          </Box>
                        )}

                        {/* Title */}
                        <Heading size={{ base: "xl", md: "2xl" }}>
                          {article.title}
                        </Heading>

                        {/* Meta Info */}
                        <HStack gap={4} flexWrap="wrap" fontSize="sm">
                          {article.author && (
                            <HStack
                              color="gray.600"
                              _dark={{ color: "gray.400" }}
                            >
                              <Icon>
                                <LuUser />
                              </Icon>
                              <Text fontWeight="medium">{article.author}</Text>
                            </HStack>
                          )}
                          {getCreatedAt() && (
                            <HStack
                              color="gray.600"
                              _dark={{ color: "gray.400" }}
                            >
                              <Icon>
                                <LuCalendar />
                              </Icon>
                              <Text>
                                {new Date(getCreatedAt()!).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </Text>
                            </HStack>
                          )}
                          <HStack
                            color="gray.600"
                            _dark={{ color: "gray.400" }}
                          >
                            <Icon>
                              <LuEye />
                            </Icon>
                            <Text>{getArticleViews()} views</Text>
                          </HStack>
                        </HStack>

                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                          <HStack gap={2} flexWrap="wrap">
                            {article.tags.map((tag, index) => (
                              <Box
                                key={index}
                                px={3}
                                py={1}
                                bg="blue.50"
                                _dark={{ bg: "blue.900" }}
                                color="blue.600"
                                rounded="full"
                                fontSize="sm"
                                fontWeight="medium"
                              >
                                {tag}
                              </Box>
                            ))}
                          </HStack>
                        )}
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  {/* Featured Image */}
                  {getArticleImage() && (
                    <Card.Root overflow="hidden">
                      <Image
                        src={getArticleImage()}
                        alt={article.title}
                        objectFit="cover"
                        w="full"
                        maxH="500px"
                      />
                    </Card.Root>
                  )}

                  {/* Summary */}
                  {article.summary && (
                    <Card.Root>
                      <Card.Body>
                        <Box
                          p={4}
                          bg="blue.50"
                          _dark={{ bg: "blue.900" }}
                          borderLeftWidth="4px"
                          borderLeftColor="blue.500"
                          rounded="md"
                        >
                          <Text
                            fontSize="lg"
                            fontStyle="italic"
                            color="gray.700"
                            _dark={{ color: "gray.300" }}
                          >
                            {article.summary}
                          </Text>
                        </Box>
                      </Card.Body>
                    </Card.Root>
                  )}

                  {/* Article Content */}
                  {article.content && (
                    <Card.Root>
                      <Card.Body>
                        <Box
                          className="article-content"
                          color="gray.800"
                          _dark={{ color: "gray.200" }}
                        >
                          {renderContent()}
                        </Box>
                      </Card.Body>
                    </Card.Root>
                  )}

                  {/* Footer Info */}
                  {getUpdatedAt() && getUpdatedAt() !== getCreatedAt() && (
                    <Card.Root>
                      <Card.Body>
                        <Text fontSize="sm" color="gray.500">
                          Last updated:{" "}
                          {new Date(getUpdatedAt()!).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </Text>
                      </Card.Body>
                    </Card.Root>
                  )}
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
