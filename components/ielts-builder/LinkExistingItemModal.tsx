"use client";

import {
  Box,
  Button,
  CloseButton,
  Dialog,
  HStack,
  Input,
  Portal,
  Text,
  VStack,
  Badge,
  Spinner,
  IconButton,
} from "@chakra-ui/react";
import { Link2, Search, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

// Generic item shape — any entity with id + title
interface LinkableItem {
  id: string;
  title?: string;
  part?: string;
  task?: string;
  mode?: string;
  difficulty?: string;
  prompt?: string;
  [key: string]: unknown;
}

interface LinkExistingItemModalProps {
  open: boolean;
  onClose: () => void;
  /** Label shown in header, e.g. "Reading Part", "Listening Part", "Writing Task" */
  itemLabel: string;
  /** Fetch all available items (for the search / browse list) */
  fetchItems: (search?: string) => Promise<LinkableItem[]>;
  /** IDs already linked — to grey them out */
  alreadyLinkedIds: string[];
  /** Called when user confirms linking */
  onLink: (itemId: string, order?: number) => Promise<void>;
}

export default function LinkExistingItemModal({
  open,
  onClose,
  itemLabel,
  fetchItems,
  alreadyLinkedIds,
  onLink,
}: LinkExistingItemModalProps) {
  const [items, setItems] = useState<LinkableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchItems(search);
      // handle both array and paginated response
      const list = Array.isArray(result)
        ? result
        : ((result as { data?: LinkableItem[] }).data ?? []);
      setItems(list);
    } catch {
      setError("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, [fetchItems, search]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleLink = async (item: LinkableItem) => {
    setLinking(item.id);
    setError("");
    try {
      const nextOrder = alreadyLinkedIds.length + 1;
      await onLink(item.id, nextOrder);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to link";
      if (
        msg.toLowerCase().includes("409") ||
        msg.toLowerCase().includes("conflict")
      ) {
        setError(`This ${itemLabel.toLowerCase()} is already linked.`);
      } else {
        setError(msg);
      }
    } finally {
      setLinking(null);
    }
  };

  const getDisplayTitle = (item: LinkableItem) => {
    if (item.title) return item.title;
    if (item.prompt)
      return item.prompt.slice(0, 80) + (item.prompt.length > 80 ? "…" : "");
    return `${itemLabel} ${item.id.slice(0, 8)}`;
  };

  const handleClose = () => {
    setSearch("");
    setError("");
    onClose();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) handleClose();
      }}
      size="lg"
      placement="center"
      motionPreset="scale"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                <HStack gap={2}>
                  <Link2 size={20} />
                  <Text>Link Existing {itemLabel}</Text>
                </HStack>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body pb={6}>
              <VStack gap={4} alignItems="stretch">
                {/* Search */}
                <HStack>
                  <Input
                    placeholder={`Search ${itemLabel.toLowerCase()}s…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && load()}
                  />
                  <IconButton
                    aria-label="Search"
                    size="sm"
                    variant="outline"
                    onClick={load}
                  >
                    <Search size={16} />
                  </IconButton>
                </HStack>

                {error && (
                  <Text color="red.500" fontSize="sm">
                    {error}
                  </Text>
                )}

                {/* Items List */}
                {loading ? (
                  <Box textAlign="center" py={8}>
                    <Spinner size="lg" />
                  </Box>
                ) : items.length === 0 ? (
                  <Box textAlign="center" py={8}>
                    <Text color="gray.500">
                      No {itemLabel.toLowerCase()}s found
                    </Text>
                  </Box>
                ) : (
                  <VStack
                    gap={2}
                    alignItems="stretch"
                    maxH="400px"
                    overflowY="auto"
                  >
                    {items.map((item) => {
                      const isLinked = alreadyLinkedIds.includes(item.id);
                      return (
                        <HStack
                          key={item.id}
                          p={3}
                          borderWidth={1}
                          borderRadius="md"
                          bg={isLinked ? "gray.50" : "white"}
                          _dark={{
                            bg: isLinked ? "gray.800" : "gray.900",
                          }}
                          opacity={isLinked ? 0.6 : 1}
                          justifyContent="space-between"
                        >
                          <Box flex={1} minW={0}>
                            <Text fontWeight="medium" fontSize="sm" truncate>
                              {getDisplayTitle(item)}
                            </Text>
                            <HStack gap={1} mt={1} flexWrap="wrap">
                              {item.part && (
                                <Badge size="sm" colorPalette="blue">
                                  {item.part.replace("_", " ")}
                                </Badge>
                              )}
                              {item.task && (
                                <Badge size="sm" colorPalette="blue">
                                  {item.task.replace("_", " ")}
                                </Badge>
                              )}
                              {item.mode && (
                                <Badge
                                  size="sm"
                                  colorPalette={
                                    item.mode === "mock" ? "purple" : "green"
                                  }
                                >
                                  {item.mode}
                                </Badge>
                              )}
                              {item.difficulty && (
                                <Badge
                                  size="sm"
                                  colorPalette={
                                    item.difficulty === "HARD"
                                      ? "red"
                                      : item.difficulty === "MEDIUM"
                                        ? "orange"
                                        : "green"
                                  }
                                >
                                  {item.difficulty}
                                </Badge>
                              )}
                            </HStack>
                          </Box>
                          {isLinked ? (
                            <Badge size="sm" colorPalette="gray">
                              Already linked
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              colorPalette="blue"
                              variant="outline"
                              onClick={() => handleLink(item)}
                              loading={linking === item.id}
                              loadingText="Linking…"
                            >
                              <Link2 size={14} />
                              Link
                            </Button>
                          )}
                        </HStack>
                      );
                    })}
                  </VStack>
                )}
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
