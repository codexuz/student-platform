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
import { Link2, Unlink, Plus, ArrowLeft, GripVertical } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  ieltsListeningAPI,
  ieltsListeningPartsAPI,
} from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import LinkExistingItemModal from "./LinkExistingItemModal";
import type { PageId, IELTSListeningPart } from "./types";

interface LinkedListeningPartsProps {
  listeningId: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function LinkedListeningParts({
  listeningId,
  onNavigate,
}: LinkedListeningPartsProps) {
  const [linkedParts, setLinkedParts] = useState<IELTSListeningPart[]>([]);
  const [listeningTitle, setListeningTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const loadLinkedParts = useCallback(async () => {
    setLoading(true);
    try {
      const [linkedRes, listeningRes] = await Promise.all([
        ieltsListeningAPI.getLinkedParts(listeningId),
        ieltsListeningAPI.getById(listeningId),
      ]);
      const parts = Array.isArray(linkedRes)
        ? linkedRes.map(
            (link: { listeningPart?: IELTSListeningPart; listening_part_id: string; order?: number }) =>
              link.listeningPart
                ? { ...link.listeningPart, _junctionOrder: link.order }
                : { id: link.listening_part_id, _junctionOrder: link.order },
          )
        : (linkedRes as { data?: IELTSListeningPart[] }).data ?? [];
      setLinkedParts(parts as IELTSListeningPart[]);
      setListeningTitle(listeningRes?.title || "");
    } catch {
      toaster.error({ title: "Failed to load linked parts" });
    } finally {
      setLoading(false);
    }
  }, [listeningId]);

  useEffect(() => {
    loadLinkedParts();
  }, [loadLinkedParts]);

  const handleUnlink = async (partId: string) => {
    if (!confirm("Unlink this listening part from the listening section?")) return;
    setUnlinking(partId);
    try {
      await ieltsListeningAPI.unlinkPart({
        listening_id: listeningId,
        listening_part_id: partId,
      });
      toaster.success({ title: "Part unlinked" });
      loadLinkedParts();
    } catch {
      toaster.error({ title: "Failed to unlink part" });
    } finally {
      setUnlinking(null);
    }
  };

  const handleLink = async (partId: string, order?: number) => {
    await ieltsListeningAPI.linkPart({
      listening_id: listeningId,
      listening_part_id: partId,
      order,
    });
    toaster.success({ title: "Part linked!" });
    loadLinkedParts();
  };

  const fetchAvailableParts = async (search?: string) => {
    const params: Record<string, string | number> = { limit: 50 };
    if (search?.trim()) params.search = search.trim();
    const res = await ieltsListeningPartsAPI.getAll(params);
    return res?.data || res || [];
  };

  if (loading) {
    return (
      <Flex justifyContent="center" py={12}>
        <Spinner size="lg" color="#4f46e5" />
      </Flex>
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
          onClick={() => onNavigate("listenings")}
        >
          Listenings
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>{listeningTitle || "Listening"}</Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>Linked Parts</Text>
      </HStack>

      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <HStack gap={2}>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("listenings")}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </IconButton>
          <Heading size="md" fontWeight="700">
            <Link2 size={18} style={{ display: "inline", marginRight: 8 }} />
            Linked Listening Parts
          </Heading>
        </HStack>
        <HStack gap={2}>
          <Button
            size="sm"
            variant="outline"
            colorPalette="blue"
            onClick={() => setLinkModalOpen(true)}
          >
            <Link2 size={14} /> Link Existing Part
          </Button>
          <Button
            size="sm"
            bg="#4f46e5"
            color="white"
            _hover={{ bg: "#3730a3" }}
            onClick={() =>
              onNavigate("listening-part-form", { listeningId })
            }
          >
            <Plus size={14} /> Create & Link New Part
          </Button>
        </HStack>
      </Flex>

      {linkedParts.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Text fontSize="4xl" mb={3}>
            🔗
          </Text>
          <Heading size="sm" color="gray.500" mb={1}>
            No parts linked yet
          </Heading>
          <Text fontSize="sm">
            Link existing listening parts or create new ones to add to this
            listening section.
          </Text>
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
                  {["Order", "Title", "Part", "Mode", "Difficulty", "Questions", "Actions"].map(
                    (h) => (
                      <Box
                        as="th"
                        key={h}
                        textAlign="left"
                        px={4}
                        py={2.5}
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
                    ),
                  )}
                </Box>
              </Box>
              <Box as="tbody">
                {linkedParts.map((p, idx) => (
                  <Box
                    as="tr"
                    key={p.id}
                    _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                  >
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <HStack gap={1}>
                        <GripVertical size={14} color="gray" />
                        <Text fontSize="sm" fontWeight="600">
                          {(p as IELTSListeningPart & { _junctionOrder?: number })._junctionOrder ?? idx + 1}
                        </Text>
                      </HStack>
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {p.title || "-"}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {p.part && (
                        <Badge colorPalette="red" variant="subtle" fontSize="xs">
                          {p.part.toLowerCase().replace("_", " ")}
                        </Badge>
                      )}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {p.mode && (
                        <Badge
                          colorPalette={p.mode === "mock" ? "purple" : "blue"}
                          variant="subtle"
                          fontSize="xs"
                        >
                          {p.mode === "mock" ? "Mock" : "Practice"}
                        </Badge>
                      )}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {p.difficulty && (
                        <Badge
                          colorPalette={
                            p.difficulty === "HARD"
                              ? "red"
                              : p.difficulty === "MEDIUM"
                                ? "orange"
                                : "green"
                          }
                          variant="subtle"
                          fontSize="xs"
                        >
                          {p.difficulty}
                        </Badge>
                      )}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Text fontSize="sm">{p.totalQuestions ?? "-"}</Text>
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
                        <IconButton
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            onNavigate("listening-part-form", { editId: p.id })
                          }
                          aria-label="Edit part"
                          title="Edit this part"
                        >
                          <Link2 size={14} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          loading={unlinking === p.id}
                          onClick={() => handleUnlink(p.id)}
                          aria-label="Unlink"
                          title="Unlink from this listening"
                        >
                          <Unlink size={14} />
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

      <LinkExistingItemModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        itemLabel="Listening Part"
        fetchItems={fetchAvailableParts}
        alreadyLinkedIds={linkedParts.map((p) => p.id)}
        onLink={handleLink}
      />
    </Box>
  );
}
