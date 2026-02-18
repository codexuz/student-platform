"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  HStack,
  Input,
  Portal,
  Spinner,
  Text,
  Badge,
} from "@chakra-ui/react";
import { Search } from "lucide-react";
import {
  ieltsReadingPartsAPI,
  ieltsListeningPartsAPI,
  ieltsWritingTasksAPI,
} from "@/lib/ielts-api";

type PracticeType = "reading" | "listening" | "writing";

interface PickerItem {
  id: string;
  label: string;
  badge: string;
  badgeColor: string;
  sub: string;
}

interface IeltsPracticePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (practiceType: PracticeType, id: string, label: string) => void;
  initialTab?: PracticeType;
}

const PAGE_SIZE = 8;

const TABS: { value: PracticeType; label: string; icon: string }[] = [
  { value: "reading", label: "Reading Parts", icon: "📖" },
  { value: "listening", label: "Listening Parts", icon: "🎧" },
  { value: "writing", label: "Writing Tasks", icon: "✍️" },
];

export default function IeltsPracticePickerModal({
  open,
  onClose,
  onSelect,
  initialTab = "reading",
}: IeltsPracticePickerModalProps) {
  const [tab, setTab] = useState<PracticeType>(initialTab);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PickerItem[]>([]);

  // Reset when tab/open changes
  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setSearch("");
      setPage(1);
    }
  }, [open, initialTab]);

  // Fetch data when tab changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setPage(1);

    const fetchData = async () => {
      try {
        let result: PickerItem[] = [];

        if (tab === "reading") {
          const data = await ieltsReadingPartsAPI.getAll();
          const list = data?.data || data || [];
          result = list.map(
            (p: {
              id: string;
              title?: string;
              part?: string;
              mode?: string;
              reading?: { title?: string } | null;
            }) => ({
              id: p.id,
              label: p.title || `Reading Part ${p.part?.replace("_", " ")}`,
              badge: p.part?.replace("_", " ") || "",
              badgeColor: "red",
              sub: [p.mode === "mock" ? "Mock" : "Practice", p.reading?.title]
                .filter(Boolean)
                .join(" · "),
            }),
          );
        } else if (tab === "listening") {
          const data = await ieltsListeningPartsAPI.getAll();
          const list = data?.data || data || [];
          result = list.map(
            (p: {
              id: string;
              title?: string;
              part?: string;
              mode?: string;
              listening?: { title?: string } | null;
            }) => ({
              id: p.id,
              label: p.title || `Listening Part ${p.part?.replace("_", " ")}`,
              badge: p.part?.replace("_", " ") || "",
              badgeColor: "purple",
              sub: [p.mode === "mock" ? "Mock" : "Practice", p.listening?.title]
                .filter(Boolean)
                .join(" · "),
            }),
          );
        } else {
          const data = await ieltsWritingTasksAPI.getAll();
          const raw = Array.isArray(data) ? data : data?.data || [];
          result = raw.map(
            (t: {
              id: string;
              task?: string;
              mode?: string;
              prompt?: string;
              writing?: { title?: string } | null;
            }) => ({
              id: t.id,
              label:
                (t.prompt?.replace(/<[^>]+>/g, "") || "").substring(0, 60) ||
                `Writing ${t.task?.replace("_", " ")}`,
              badge: t.task?.replace("_", " ") || "",
              badgeColor: "orange",
              sub: [t.mode === "mock" ? "Mock" : "Practice", t.writing?.title]
                .filter(Boolean)
                .join(" · "),
            }),
          );
        }

        if (!cancelled) setItems(result);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [tab, open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.sub.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q),
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, tab]);

  return (
    <Dialog.Root
      lazyMount
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="600px" maxH="80vh">
            <Dialog.Header pb={2}>
              <Dialog.Title fontSize="md" fontWeight="700">
                Select IELTS Practice
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body
              pt={0}
              overflow="hidden"
              display="flex"
              flexDirection="column"
            >
              {/* Tabs */}
              <HStack gap={1} mb={3}>
                {TABS.map((t) => (
                  <Button
                    key={t.value}
                    size="xs"
                    variant={tab === t.value ? "solid" : "outline"}
                    colorPalette={
                      t.value === "reading"
                        ? "blue"
                        : t.value === "listening"
                          ? "purple"
                          : "orange"
                    }
                    onClick={() => setTab(t.value)}
                  >
                    {t.icon} {t.label}
                  </Button>
                ))}
              </HStack>

              {/* Search */}
              <HStack gap={2} mb={3}>
                <Box position="relative" flex={1}>
                  <Box
                    position="absolute"
                    left={2.5}
                    top="50%"
                    transform="translateY(-50%)"
                    color="gray.400"
                    zIndex={1}
                  >
                    <Search size={14} />
                  </Box>
                  <Input
                    size="sm"
                    pl={8}
                    placeholder="Search by title, ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Box>
              </HStack>

              {/* List */}
              <Box flex={1} overflowY="auto" minH="200px">
                {loading ? (
                  <Flex justify="center" py={8}>
                    <Spinner size="md" color="blue.500" />
                  </Flex>
                ) : paginated.length === 0 ? (
                  <Box textAlign="center" py={8} color="gray.400">
                    <Text fontSize="sm">
                      {search
                        ? "No matching items found"
                        : "No items available"}
                    </Text>
                  </Box>
                ) : (
                  paginated.map((item) => (
                    <Box
                      key={item.id}
                      px={3}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                      _hover={{
                        bg: "gray.50",
                        _dark: { bg: "gray.700" },
                      }}
                      display="flex"
                      alignItems="center"
                      gap={3}
                      cursor="pointer"
                      onClick={() => {
                        onSelect(tab, item.id, item.label);
                        onClose();
                      }}
                    >
                      <Box flex={1} minW={0}>
                        <HStack gap={2} mb={0.5}>
                          <Badge
                            colorPalette={item.badgeColor}
                            variant="subtle"
                            fontSize="2xs"
                          >
                            {item.badge}
                          </Badge>
                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            truncate
                            color="gray.700"
                            _dark={{ color: "gray.200" }}
                          >
                            {item.label}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.400" truncate>
                          {item.sub}
                        </Text>
                      </Box>
                      <Button
                        size="xs"
                        variant="outline"
                        colorPalette="blue"
                        flexShrink={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(tab, item.id, item.label);
                          onClose();
                        }}
                      >
                        Select
                      </Button>
                    </Box>
                  ))
                )}
              </Box>

              {/* Pagination */}
              {!loading && filtered.length > PAGE_SIZE && (
                <Flex
                  pt={2}
                  borderTopWidth="1px"
                  borderColor="gray.100"
                  _dark={{ borderColor: "gray.700" }}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text fontSize="xs" color="gray.500">
                    {filtered.length} items · Page {page}/{totalPages}
                  </Text>
                  <HStack gap={1}>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Prev
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </HStack>
                </Flex>
              )}
            </Dialog.Body>

            <Dialog.Footer pt={2}>
              <Button size="sm" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
