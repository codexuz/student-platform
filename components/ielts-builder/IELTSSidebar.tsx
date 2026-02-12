"use client";

import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Heading,
  Badge,
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
} from "lucide-react";
import Link from "next/link";
import type { PageId } from "./types";

interface NavItem {
  icon: React.ElementType;
  label: string;
  pageId: PageId;
}

const navItems: NavItem[] = [
  { icon: ClipboardList, label: "Tests", pageId: "tests" },
  { icon: BookOpen, label: "Readings", pageId: "readings" },
  { icon: FileText, label: "Reading Parts", pageId: "reading-parts" },
  { icon: Headphones, label: "Listenings", pageId: "listenings" },
  { icon: Volume2, label: "Listening Parts", pageId: "listening-parts" },
  { icon: PenTool, label: "Writings", pageId: "writings" },
  { icon: ListChecks, label: "Writing Tasks", pageId: "writing-tasks" },
];

interface IELTSSidebarProps {
  activePage: PageId;
  onNavigate: (pageId: PageId) => void;
  counts?: Record<string, number>;
}

export default function IELTSSidebar({
  activePage,
  onNavigate,
  counts = {},
}: IELTSSidebarProps) {
  const isActive = (pageId: PageId) => {
    if (activePage === pageId) return true;
    // Also highlight parent nav when on sub-pages
    if (pageId === "tests" && ["test-form", "test-detail"].includes(activePage))
      return true;
    if (pageId === "readings" && activePage === "reading-form") return true;
    if (pageId === "reading-parts" && activePage === "reading-part-form")
      return true;
    if (pageId === "listenings" && activePage === "listening-form") return true;
    if (pageId === "listening-parts" && activePage === "listening-part-form")
      return true;
    if (pageId === "writings" && activePage === "writing-form") return true;
    if (pageId === "writing-tasks" && activePage === "writing-task-form")
      return true;
    return false;
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
          {navItems.map((item) => {
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
