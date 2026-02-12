"use client";

import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Heading,
  Badge,
  Collapsible,
} from "@chakra-ui/react";
import {
  ClipboardList,
  BookOpen,
  FileText,
  Headphones,
  Volume2,
  PenTool,
  ListChecks,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { pageIdToRoute, pathnameToSidebarKey } from "@/lib/ielts-navigation";
import type { PageId } from "./types";

interface NavItem {
  icon: React.ElementType;
  label: string;
  pageId: PageId;
}

interface NavSection {
  icon: React.ElementType;
  label: string;
  items: NavItem[];
  /** PageIds that indicate this section should be expanded */
  relatedPages: PageId[];
}

const sections: NavSection[] = [
  {
    icon: BookOpen,
    label: "Reading",
    relatedPages: [
      "readings",
      "reading-form",
      "reading-parts",
      "reading-part-form",
    ],
    items: [
      { icon: BookOpen, label: "Reading Test", pageId: "readings" },
      { icon: FileText, label: "Reading Parts", pageId: "reading-parts" },
    ],
  },
  {
    icon: Headphones,
    label: "Listening",
    relatedPages: [
      "listenings",
      "listening-form",
      "listening-parts",
      "listening-part-form",
    ],
    items: [
      { icon: Headphones, label: "Listening Test", pageId: "listenings" },
      { icon: Volume2, label: "Listening Parts", pageId: "listening-parts" },
    ],
  },
  {
    icon: PenTool,
    label: "Writing",
    relatedPages: [
      "writings",
      "writing-form",
      "writing-tasks",
      "writing-task-form",
    ],
    items: [
      { icon: PenTool, label: "Writing Test", pageId: "writings" },
      { icon: ListChecks, label: "Writing Tasks", pageId: "writing-tasks" },
    ],
  },
];

interface IELTSSidebarProps {
  counts?: Record<string, number>;
}

export default function IELTSSidebar({ counts = {} }: IELTSSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeKey = pathnameToSidebarKey(pathname);

  const onNavigate = useCallback(
    (pageId: PageId) => {
      router.push(pageIdToRoute(pageId));
    },
    [router],
  );

  const isActive = (pageId: PageId) => {
    // Map pageIds to their sidebar keys for matching
    const keyMap: Record<string, string> = {
      tests: "tests",
      "test-form": "tests",
      "test-detail": "tests",
      readings: "readings",
      "reading-form": "readings",
      "reading-parts": "reading-parts",
      "reading-part-form": "reading-parts",
      listenings: "listenings",
      "listening-form": "listenings",
      "listening-parts": "listening-parts",
      "listening-part-form": "listening-parts",
      writings: "writings",
      "writing-form": "writings",
      "writing-tasks": "writing-tasks",
      "writing-task-form": "writing-tasks",
    };
    return (keyMap[pageId] || pageId) === activeKey;
  };

  const isSectionActive = (section: NavSection) => {
    const sectionKeys = section.relatedPages.map((p) => {
      const keyMap: Record<string, string> = {
        readings: "readings",
        "reading-form": "readings",
        "reading-parts": "reading-parts",
        "reading-part-form": "reading-parts",
        listenings: "listenings",
        "listening-form": "listenings",
        "listening-parts": "listening-parts",
        "listening-part-form": "listening-parts",
        writings: "writings",
        "writing-form": "writings",
        "writing-tasks": "writing-tasks",
        "writing-task-form": "writing-tasks",
      };
      return keyMap[p] || p;
    });
    return sectionKeys.includes(activeKey);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.pageId);
    const count = counts[item.pageId];
    return (
      <HStack
        key={item.pageId}
        px={3}
        py={2}
        rounded="lg"
        cursor="pointer"
        bg={active ? "#eef2ff" : "transparent"}
        color={active ? "#4f46e5" : "gray.600"}
        fontWeight={active ? "600" : "500"}
        _dark={{
          bg: active ? "rgba(79, 70, 229, 0.15)" : "transparent",
          color: active ? "#818cf8" : "gray.400",
        }}
        _hover={{
          bg: active ? "#eef2ff" : "gray.100",
          color: active ? "#4f46e5" : "gray.800",
          _dark: {
            bg: active ? "rgba(79, 70, 229, 0.2)" : "gray.700",
            color: active ? "#818cf8" : "gray.200",
          },
        }}
        transition="all 0.1s"
        onClick={() => onNavigate(item.pageId)}
        fontSize="13px"
      >
        <Icon as={item.icon} fontSize="md" />
        <Text flex="1">{item.label}</Text>
        {count !== undefined && count > 0 && (
          <Badge
            bg={active ? "#c7d2fe" : "gray.200"}
            color={active ? "#3730a3" : "gray.600"}
            _dark={{
              bg: active ? "rgba(79, 70, 229, 0.3)" : "gray.600",
              color: active ? "#c7d2fe" : "gray.300",
            }}
            fontSize="10px"
            fontWeight="600"
            px={1.5}
            py={0}
            rounded="full"
            variant="plain"
          >
            {count}
          </Badge>
        )}
      </HStack>
    );
  };

  return (
    <Box
      display={{ base: "none", lg: "flex" }}
      flexDirection="column"
      w="260px"
      bg="white"
      _dark={{ bg: "gray.800" }}
      borderRightWidth="1px"
      position="fixed"
      top={0}
      left={0}
      h="100vh"
      zIndex={10}
    >
      {/* Header */}
      <Box
        h="14"
        px={5}
        display="flex"
        alignItems="center"
        borderBottomWidth="1px"
        flexShrink={0}
        bg="linear-gradient(135deg, #4f46e5, #3730a3)"
      >
        <HStack gap={2}>
          <Text fontSize="xl">📝</Text>
          <Heading size="sm" color="white" fontWeight="700">
            IELTS Test Builder
          </Heading>
        </HStack>
      </Box>

      {/* Back to Dashboard */}
      <Box px={3} pt={3} pb={1}>
        <Link href="/dashboard">
          <HStack
            px={3}
            py={2}
            rounded="md"
            cursor="pointer"
            color="gray.500"
            fontSize="sm"
            _hover={{
              bg: "gray.50",
              color: "gray.700",
              _dark: { bg: "gray.700", color: "gray.300" },
            }}
            transition="all 0.15s"
          >
            <Icon as={ArrowLeft} fontSize="sm" />
            <Text fontWeight="500">Back to Dashboard</Text>
          </HStack>
        </Link>
      </Box>

      {/* Navigation */}
      <Box flex="1" overflowY="auto" minH={0}>
        <VStack gap={0.5} px={3} py={2} alignItems="stretch">
          <Text
            fontSize="xs"
            fontWeight="700"
            color="gray.400"
            px={3}
            py={2}
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            Manage
          </Text>

          {/* Full Tests — standalone item */}
          {renderNavItem({
            icon: ClipboardList,
            label: "Full Tests",
            pageId: "tests",
          })}

          {/* Collapsible sections */}
          {sections.map((section) => {
            const sectionOpen = isSectionActive(section);
            return (
              <Collapsible.Root key={section.label} defaultOpen={sectionOpen}>
                <Collapsible.Trigger asChild>
                  <HStack
                    px={3}
                    py={2}
                    rounded="lg"
                    cursor="pointer"
                    color={sectionOpen ? "#4f46e5" : "gray.600"}
                    fontWeight={sectionOpen ? "600" : "500"}
                    _dark={{
                      color: sectionOpen ? "#818cf8" : "gray.400",
                    }}
                    _hover={{
                      bg: "gray.100",
                      color: "gray.800",
                      _dark: { bg: "gray.700", color: "gray.200" },
                    }}
                    transition="all 0.1s"
                    fontSize="13px"
                  >
                    <Icon as={section.icon} fontSize="md" />
                    <Text flex="1">{section.label}</Text>
                    <Collapsible.Indicator
                      transition="transform 0.2s"
                      _open={{ transform: "rotate(90deg)" }}
                    >
                      <Icon as={ChevronRight} fontSize="sm" />
                    </Collapsible.Indicator>
                  </HStack>
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <VStack gap={0.5} pl={4} pt={0.5} alignItems="stretch">
                    {section.items.map(renderNavItem)}
                  </VStack>
                </Collapsible.Content>
              </Collapsible.Root>
            );
          })}
        </VStack>
      </Box>

      {/* Footer */}
      <Box
        flexShrink={0}
        borderTopWidth="1px"
        px={4}
        py={3}
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
      >
        <Text fontSize="xs" color="gray.400" textAlign="center">
          IELTS Content Management
        </Text>
      </Box>
    </Box>
  );
}
