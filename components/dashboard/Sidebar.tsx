"use client";

import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Heading,
  Menu,
  Portal,
  Image,
} from "@chakra-ui/react";
import {
  Home,
  BookOpen,
  ClipboardCheck,
  Bookmark,
  Settings,
  Target,
  LogOut,
  ChevronUp,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

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
    icon: ClipboardCheck,
    label: "My Mock Tests",
    href: "/mock-tests",
    section: "MAIN",
  },
  {
    icon: Bookmark,
    label: "Resources",
    href: "/resources",
    section: "MAIN",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "User";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Box
      display={{ base: "none", lg: "block" }}
      w="240px"
      bg="white"
      _dark={{ bg: "gray.800" }}
      borderRightWidth="1px"
      position="fixed"
      top={0}
      left={0}
      h="100vh"
      overflowY="auto"
      zIndex={10}
    >
      <Flex h="16" px={6} alignItems="center" borderBottomWidth="1px">
        <HStack gap={2}>
          <Image src="/logo.png" alt="Mockmee" w={8} h={8} rounded="md" />
          <Heading size="md">Mockmee</Heading>
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
                  <Icon as={item.icon} fontSize="lg" />
                  <Text fontWeight="medium">{item.label}</Text>
                </HStack>
              </Link>
            );
          })}
      </VStack>

      {/* Sidebar Footer */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        borderTopWidth="1px"
        p={3}
        bg="white"
        _dark={{ bg: "gray.800" }}
      >
        <Menu.Root>
          <Menu.Trigger asChild>
            <HStack
              px={3}
              py={2}
              rounded="lg"
              cursor="pointer"
              _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
              transition="all 0.2s"
              w="full"
            >
              {user?.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={fullName}
                  w={9}
                  h={9}
                  rounded="full"
                  objectFit="cover"
                  flexShrink={0}
                />
              ) : (
                <Box
                  w={9}
                  h={9}
                  rounded="full"
                  bg="brand.500"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Text color="white" fontWeight="bold" fontSize="sm">
                    {initials}
                  </Text>
                </Box>
              )}
              <Box flex="1" minW={0}>
                <Text fontWeight="semibold" fontSize="sm" truncate>
                  {fullName}
                </Text>
                <Text fontSize="xs" color="gray.500" truncate>
                  {user?.phone || ""}
                </Text>
              </Box>
              <Icon as={ChevronUp} fontSize="md" color="gray.400" />
            </HStack>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content minW="200px">
                <Menu.Item value="settings" asChild>
                  <Link href="/settings">
                    <Icon as={Settings} fontSize="md" mr={2} />
                    Settings
                  </Link>
                </Menu.Item>
                <Menu.Item
                  value="logout"
                  color="fg.error"
                  _hover={{ bg: "bg.error", color: "fg.error" }}
                  onClick={logout}
                >
                  <Icon as={LogOut} fontSize="md" mr={2} />
                  Log out
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Box>
    </Box>
  );
}

function Flex(props: React.ComponentProps<typeof Box>) {
  return <Box display="flex" {...props} />;
}
