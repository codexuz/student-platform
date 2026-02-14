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
  IconButton,
} from "@chakra-ui/react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ieltsReadingAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { IELTSReading, PageId } from "./types";

interface ReadingsListProps {
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function ReadingsList({ onNavigate }: ReadingsListProps) {
  const [items, setItems] = useState<IELTSReading[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ieltsReadingAPI.getAll();
      setItems(data?.data || data || []);
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this reading?")) return;
    try {
      await ieltsReadingAPI.delete(id);
      toaster.success({ title: "Deleted!" });
      load();
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toaster.success({ title: "ID copied!" });
  };

  const truncId = (id: string) => (id ? id.substring(0, 8) + "..." : "-");

  if (loading)
    return (
      <Flex justifyContent="center" py={12}>
        <Spinner size="lg" color="#4f46e5" />
      </Flex>
    );

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md" fontWeight="700">
          📖 Readings
        </Heading>
        <Button
          size="sm"
          bg="#4f46e5"
          color="white"
          _hover={{ bg: "#3730a3" }}
          onClick={() => onNavigate("reading-form")}
        >
          <Plus size={14} /> Create Reading
        </Button>
      </Flex>

      {items.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Text fontSize="4xl" mb={3}>
            📖
          </Text>
          <Heading size="sm" color="gray.500">
            No readings yet
          </Heading>
        </Box>
      ) : (
        <Box
          bg="white"
          _dark={{ bg: "gray.800" }}
          rounded="lg"
          borderWidth="1px"
          shadow="sm"
          overflow="hidden"
        >
          <Box overflowX="auto">
            <Box as="table" w="full" fontSize="sm">
              <Box as="thead">
                <Box as="tr">
                  {["Title", "Test ID", "ID", "Actions"].map((h) => (
                    <Box
                      as="th"
                      key={h}
                      textAlign="left"
                      px={4}
                      py={2.5}
                      bg="gray.50"
                      _dark={{
                        bg: "gray.700",
                        color: "gray.400",
                        borderColor: "gray.600",
                      }}
                      fontSize="xs"
                      textTransform="uppercase"
                      color="gray.500"
                      fontWeight="700"
                      borderBottomWidth="2px"
                      borderColor="gray.200"
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {items.map((r) => (
                  <Box
                    as="tr"
                    key={r.id}
                    _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                  >
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      fontWeight="600"
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {r.title || "-"}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
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
                        onClick={() => copyId(r.test_id)}
                        variant="plain"
                      >
                        {truncId(r.test_id)}
                      </Badge>
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
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
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <HStack gap={1}>
                        <Button
                          size="xs"
                          bg="#4f46e5"
                          color="white"
                          _hover={{ bg: "#3730a3" }}
                          onClick={() =>
                            onNavigate("reading-part-form", { readingId: r.id })
                          }
                        >
                          <Plus size={12} /> Part
                        </Button>
                        <IconButton
                          size="xs"
                          colorPalette="blue"
                          variant="ghost"
                          onClick={() =>
                            onNavigate("reading-form", { editId: r.id })
                          }
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => deleteItem(r.id)}
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </HStack>
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
