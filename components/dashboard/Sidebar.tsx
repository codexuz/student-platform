"use client";

import { Box, Text, VStack, HStack, Icon, Heading } from "@chakra-ui/react";
import {
  Home,
  BookOpen,
  Video,
  Bookmark,
  Settings,
  HelpCircle,
  Target,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const menuItems = [
  { icon: Home, label: "Home", href: "/", section: "MAIN" },
  {
    icon: Target,
    label: "Practice",
    href: "/practice",
    section: "MAIN",
  },
  {
    icon: BookOpen,
    label: "My courses",
    href: "/courses",
    section: "MAIN",
  },
  {
    icon: Video,
    label: "Recording",
    href: "/recordings",
    section: "MAIN",
  },
  {
    icon: Bookmark,
    label: "Resources",
    href: "/resources",
    section: "MAIN",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
    section: "OTHER",
  },
  { icon: HelpCircle, label: "Help", href: "/help", section: "OTHER" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <Box
      w="240px"
      bg="white"
      _dark={{ bg: "gray.800" }}
      borderRightWidth="1px"
      h="100vh"
      overflowY="auto"
    >
      <Flex h="16" px={6} alignItems="center" borderBottomWidth="1px">
        <HStack gap={2}>
          <Box w={8} h={8} bg="blue.500" rounded="md" />
          <Heading size="md">Edupro</Heading>
        </HStack>
      </Flex>

      <VStack gap={1} p={4} alignItems="stretch">
        {/* MAIN Section */}
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.500"
          px={3}
          py={2}
          textTransform="uppercase"
        >
          Main
        </Text>
        {menuItems
          .filter((item) => item.section === "MAIN")
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <HStack
                  px={4}
                  py={2.5}
                  rounded="lg"
                  cursor="pointer"
                  bg={isActive ? "green.500" : "transparent"}
                  color={isActive ? "white" : "gray.700"}
                  _dark={{
                    color: isActive ? "white" : "gray.300",
                  }}
                  _hover={{
                    bg: isActive ? "green.600" : "gray.100",
                    _dark: { bg: isActive ? "green.600" : "gray.700" },
                  }}
                  transition="all 0.2s"
                >
                  <Icon as={item.icon} fontSize="lg" />
                  <Text fontWeight="medium">{item.label}</Text>
                </HStack>
              </Link>
            );
          })}

        {/* OTHER Section */}
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.500"
          px={3}
          py={2}
          mt={4}
          textTransform="uppercase"
        >
          Other
        </Text>
        {menuItems
          .filter((item) => item.section === "OTHER")
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <HStack
                  px={4}
                  py={2.5}
                  rounded="lg"
                  cursor="pointer"
                  bg={isActive ? "green.500" : "transparent"}
                  color={isActive ? "white" : "gray.700"}
                  _dark={{
                    color: isActive ? "white" : "gray.300",
                  }}
                  _hover={{
                    bg: isActive ? "green.600" : "gray.100",
                    _dark: { bg: isActive ? "green.600" : "gray.700" },
                  }}
                  transition="all 0.2s"
                >
                  <Icon as={item.icon} fontSize="lg" />
                  <Text fontWeight="medium">{item.label}</Text>
                </HStack>
              </Link>
            );
          })}
      </VStack>
    </Box>
  );
}

function Flex(props: React.ComponentProps<typeof Box>) {
  return <Box display="flex" {...props} />;
}
