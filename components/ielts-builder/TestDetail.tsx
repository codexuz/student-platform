"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { Plus, Copy } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { IELTSTest, PageId } from "./types";

interface TestDetailProps {
  testId: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function TestDetail({ testId, onNavigate }: TestDetailProps) {
  const [test, setTest] = useState<IELTSTest | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTest = useCallback(async () => {
    setLoading(true);
    try {
      const t = await ieltsTestsAPI.getById(testId);
      setTest(t);
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toaster.success({ title: "ID copied!" });
  };

  const truncId = (id: string) => (id ? id.substring(0, 8) + "..." : "-");

  if (loading) {
    return (
      <Flex justifyContent="center" py={12}>
        <Spinner size="lg" color="#4f46e5" />
      </Flex>
    );
  }

  if (!test) {
    return (
      <Box py={12} textAlign="center" color="red.500">
        Test not found
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <HStack gap={1.5} fontSize="sm" color="gray.400" mb={4}>
        <Text
          as="span"
          color="#4f46e5"
          cursor="pointer"
          fontWeight="500"
          _hover={{ textDecoration: "underline" }}
          onClick={() => onNavigate("tests")}
        >
          Tests
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>{test.title || "Test"}</Text>
      </HStack>

      {/* Test Info Card */}
      <Box
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="lg"
        borderWidth="1px"
        shadow="sm"
        mb={4}
      >
        <Flex
          px={5}
          py={3.5}
          borderBottomWidth="1px"
          alignItems="center"
          justifyContent="space-between"
        >
          <Heading size="sm" fontWeight="600">
            {test.title}
          </Heading>
          <Badge
            bg={test.status === "published" ? "#d1fae5" : "#fef3c7"}
            color={test.status === "published" ? "#065f46" : "#92400e"}
            _dark={{
              bg: test.status === "published" ? "green.900" : "yellow.900",
              color: test.status === "published" ? "green.200" : "yellow.200",
            }}
            fontSize="xs"
            fontWeight="700"
            textTransform="uppercase"
            px={2}
            rounded="full"
            variant="plain"
          >
            {test.status}
          </Badge>
        </Flex>
        <Box px={5} py={4}>
          <Flex gap={6} mb={4} direction={{ base: "column", md: "row" }}>
            <Box>
              <Text
                fontSize="xs"
                color="gray.400"
                textTransform="uppercase"
                fontWeight="600"
              >
                Mode
              </Text>
              <Text fontWeight="600">{test.mode}</Text>
            </Box>
            <Box>
              <Text
                fontSize="xs"
                color="gray.400"
                textTransform="uppercase"
                fontWeight="600"
              >
                Category
              </Text>
              <Text fontWeight="600">{test.category || "-"}</Text>
            </Box>
            <Box>
              <Text
                fontSize="xs"
                color="gray.400"
                textTransform="uppercase"
                fontWeight="600"
              >
                ID
              </Text>
              <Badge
                bg="gray.100"
                color="gray.500"
                _dark={{ bg: "gray.700", color: "gray.400" }}
                fontSize="xs"
                fontFamily="mono"
                px={1.5}
                rounded="sm"
                cursor="pointer"
                onClick={() => copyId(test.id)}
                variant="plain"
                _hover={{ bg: "gray.200", _dark: { bg: "gray.600" } }}
              >
                <Copy size={10} /> {test.id}
              </Badge>
            </Box>
          </Flex>
          <HStack gap={2}>
            <Button
              size="sm"
              bg="#4f46e5"
              color="white"
              _hover={{ bg: "#3730a3" }}
              onClick={() => onNavigate("reading-form", { testId: test.id })}
            >
              <Plus size={14} /> Reading
            </Button>
            <Button
              size="sm"
              bg="#4f46e5"
              color="white"
              _hover={{ bg: "#3730a3" }}
              onClick={() => onNavigate("listening-form", { testId: test.id })}
            >
              <Plus size={14} /> Listening
            </Button>
            <Button
              size="sm"
              bg="#4f46e5"
              color="white"
              _hover={{ bg: "#3730a3" }}
              onClick={() => onNavigate("writing-form", { testId: test.id })}
            >
              <Plus size={14} /> Writing
            </Button>
          </HStack>
        </Box>
      </Box>

      {/* Readings */}
      {test.readings && test.readings.length > 0 && (
        <Box
          bg="white"
          _dark={{ bg: "gray.800" }}
          rounded="lg"
          borderWidth="1px"
          shadow="sm"
          mb={4}
        >
          <Box px={5} py={3.5} borderBottomWidth="1px">
            <Heading size="sm" fontWeight="600">
              📖 Readings
            </Heading>
          </Box>
          <Box p={4} overflowX="auto">
            <Box as="table" w="full" fontSize="sm">
              <Box as="thead">
                <Box as="tr">
                  {["Title", "ID", "Parts", "Actions"].map((h) => (
                    <Box
                      as="th"
                      key={h}
                      textAlign="left"
                      px={3}
                      py={2}
                      bg="gray.50"
                      _dark={{ bg: "gray.700", color: "gray.400" }}
                      fontSize="xs"
                      textTransform="uppercase"
                      color="gray.500"
                      fontWeight="700"
                      borderBottomWidth="2px"
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {test.readings.map((r) => (
                  <Box
                    as="tr"
                    key={r.id}
                    _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                  >
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      fontWeight="600"
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {r.title || "-"}
                    </Box>
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Badge
                        bg="gray.100"
                        color="gray.500"
                        _dark={{ bg: "gray.700", color: "gray.400" }}
                        fontSize="xs"
                        fontFamily="mono"
                        px={1.5}
                        rounded="sm"
                        cursor="pointer"
                        onClick={() => copyId(r.id)}
                        variant="plain"
                      >
                        {truncId(r.id)}
                      </Badge>
                    </Box>
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {(r.parts || []).length} parts
                    </Box>
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Button
                        size="xs"
                        bg="#4f46e5"
                        color="white"
                        _hover={{ bg: "#3730a3" }}
                        onClick={() =>
                          onNavigate("reading-part-form", {
                            readingId: r.id,
                          })
                        }
                      >
                        <Plus size={12} /> Part
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Listenings */}
      {test.listenings && test.listenings.length > 0 && (
        <Box
          bg="white"
          _dark={{ bg: "gray.800" }}
          rounded="lg"
          borderWidth="1px"
          shadow="sm"
          mb={4}
        >
          <Box px={5} py={3.5} borderBottomWidth="1px">
            <Heading size="sm" fontWeight="600">
              🎧 Listenings
            </Heading>
          </Box>
          <Box p={4} overflowX="auto">
            <Box as="table" w="full" fontSize="sm">
              <Box as="thead">
                <Box as="tr">
                  {["Title", "ID", "Parts", "Actions"].map((h) => (
                    <Box
                      as="th"
                      key={h}
                      textAlign="left"
                      px={3}
                      py={2}
                      bg="gray.50"
                      _dark={{ bg: "gray.700", color: "gray.400" }}
                      fontSize="xs"
                      textTransform="uppercase"
                      color="gray.500"
                      fontWeight="700"
                      borderBottomWidth="2px"
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {test.listenings.map((l) => (
                  <Box
                    as="tr"
                    key={l.id}
                    _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                  >
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      fontWeight="600"
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {l.title || "-"}
                    </Box>
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Badge
                        bg="gray.100"
                        color="gray.500"
                        _dark={{ bg: "gray.700", color: "gray.400" }}
                        fontSize="xs"
                        fontFamily="mono"
                        px={1.5}
                        rounded="sm"
                        cursor="pointer"
                        onClick={() => copyId(l.id)}
                        variant="plain"
                      >
                        {truncId(l.id)}
                      </Badge>
                    </Box>
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {(l.parts || []).length} parts
                    </Box>
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Button
                        size="xs"
                        bg="#4f46e5"
                        color="white"
                        _hover={{ bg: "#3730a3" }}
                        onClick={() =>
                          onNavigate("listening-part-form", {
                            listeningId: l.id,
                          })
                        }
                      >
                        <Plus size={12} /> Part
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Writings */}
      {test.writings && test.writings.length > 0 && (
        <Box
          bg="white"
          _dark={{ bg: "gray.800" }}
          rounded="lg"
          borderWidth="1px"
          shadow="sm"
          mb={4}
        >
          <Box px={5} py={3.5} borderBottomWidth="1px">
            <Heading size="sm" fontWeight="600">
              ✍️ Writings
            </Heading>
          </Box>
          <Box p={4} overflowX="auto">
            <Box as="table" w="full" fontSize="sm">
              <Box as="thead">
                <Box as="tr">
                  {["Title", "ID", "Tasks", "Actions"].map((h) => (
                    <Box
                      as="th"
                      key={h}
                      textAlign="left"
                      px={3}
                      py={2}
                      bg="gray.50"
                      _dark={{ bg: "gray.700", color: "gray.400" }}
                      fontSize="xs"
                      textTransform="uppercase"
                      color="gray.500"
                      fontWeight="700"
                      borderBottomWidth="2px"
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {test.writings.map((w) => (
                  <Box
                    as="tr"
                    key={w.id}
                    _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                  >
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      fontWeight="600"
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {w.title || "-"}
                    </Box>
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Badge
                        bg="gray.100"
                        color="gray.500"
                        _dark={{ bg: "gray.700", color: "gray.400" }}
                        fontSize="xs"
                        fontFamily="mono"
                        px={1.5}
                        rounded="sm"
                        cursor="pointer"
                        onClick={() => copyId(w.id)}
                        variant="plain"
                      >
                        {truncId(w.id)}
                      </Badge>
                    </Box>
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {(w.tasks || []).length} tasks
                    </Box>
                    <Box
                      as="td"
                      px={3}
                      py={2}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Button
                        size="xs"
                        bg="#4f46e5"
                        color="white"
                        _hover={{ bg: "#3730a3" }}
                        onClick={() =>
                          onNavigate("writing-task-form", {
                            writingId: w.id,
                          })
                        }
                      >
                        <Plus size={12} /> Task
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
