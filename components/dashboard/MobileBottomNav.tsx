"use client";

import { useState } from "react";
import {
  Box,
  Icon,
  Text,
  VStack,
  HStack,
  Drawer,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import {
  Home,
  BookOpen,
  BookMarked,
  Target,
  Users,
  ClipboardList,
  Mic,
  BarChart3,
  Trophy,
  Settings,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const studentPrimaryItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/home" },
  { icon: Target, label: "Practice", href: "/practice" },
  { icon: BookOpen, label: "Courses", href: "/courses" },
];

const studentMoreItems: NavItem[] = [
  { icon: Mic, label: "Speaking", href: "/practice/speaking" },
  { icon: BarChart3, label: "My Results", href: "/practice/results" },
  { icon: BookMarked, label: "Resources", href: "/resources" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

const teacherPrimaryItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: BookOpen, label: "Courses", href: "/course-builder" },
  { icon: Users, label: "Groups", href: "/groups" },
];

const teacherMoreItems: NavItem[] = [
  { icon: ClipboardList, label: "IELTS", href: "/ielts-test-builder" },
  { icon: ClipboardList, label: "Grade Writing", href: "/grade-writing" },
  { icon: Users, label: "Mock", href: "/mock-assign" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();
  const [open, setOpen] = useState(false);

  const primaryItems =
    role === "teacher" ? teacherPrimaryItems : studentPrimaryItems;
  const moreItems = role === "teacher" ? teacherMoreItems : studentMoreItems;

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const moreActive = moreItems.some((item) => isItemActive(item.href));

  return (
    <>
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        _dark={{ bg: "gray.800" }}
        borderTopWidth="1px"
        display={{ base: "flex", lg: "none" }}
        justifyContent="space-around"
        alignItems="center"
        h="16"
        zIndex={50}
        boxShadow="0 -2px 10px rgba(0,0,0,0.05)"
      >
        {primaryItems.map((item) => {
          const isActive = isItemActive(item.href);
          const IconComponent = item.icon;

          return (
            <Link key={item.href} href={item.href} style={{ flex: 1 }}>
              <VStack
                gap={0.5}
                py={2}
                cursor="pointer"
                color={isActive ? "brand.500" : "gray.600"}
                _dark={{
                  color: isActive ? "brand.400" : "gray.400",
                }}
                transition="all 0.2s"
              >
                <Icon fontSize="xl">
                  <IconComponent strokeWidth={isActive ? 2.5 : 2} />
                </Icon>
                <Text
                  fontSize="xs"
                  fontWeight={isActive ? "semibold" : "medium"}
                >
                  {item.label}
                </Text>
              </VStack>
            </Link>
          );
        })}

        {/* More button */}
        <Box
          as="button"
          flex={1}
          onClick={() => setOpen(true)}
          bg="transparent"
        >
          <VStack
            gap={0.5}
            py={2}
            cursor="pointer"
            color={moreActive ? "brand.500" : "gray.600"}
            _dark={{
              color: moreActive ? "brand.400" : "gray.400",
            }}
            transition="all 0.2s"
          >
            <Icon fontSize="xl">
              <MoreHorizontal strokeWidth={moreActive ? 2.5 : 2} />
            </Icon>
            <Text
              fontSize="xs"
              fontWeight={moreActive ? "semibold" : "medium"}
            >
              More
            </Text>
          </VStack>
        </Box>
      </Box>

      {/* Full-screen More drawer */}
      <Drawer.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        size="full"
        placement="bottom"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content
              bg="white"
              _dark={{ bg: "gray.900" }}
              display={{ base: "flex", lg: "none" }}
            >
              <Drawer.Header borderBottomWidth="1px">
                <Drawer.Title>More</Drawer.Title>
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" position="absolute" top={3} right={3} />
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body p={4}>
                <VStack gap={1} alignItems="stretch">
                  {moreItems.map((item) => {
                    const isActive = isItemActive(item.href);
                    const IconComponent = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                      >
                        <HStack
                          px={4}
                          py={3}
                          rounded="lg"
                          cursor="pointer"
                          bg={isActive ? "#0f172a" : "transparent"}
                          color={isActive ? "white" : "gray.700"}
                          _dark={{
                            color: isActive ? "white" : "gray.300",
                          }}
                          _hover={{
                            bg: isActive ? "#1e293b" : "gray.100",
                            _dark: { bg: isActive ? "#1e293b" : "gray.700" },
                          }}
                          transition="all 0.2s"
                        >
                          <Icon as={IconComponent} fontSize="xl" />
                          <Text fontWeight="medium">{item.label}</Text>
                        </HStack>
                      </Link>
                    );
                  })}
                </VStack>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}
