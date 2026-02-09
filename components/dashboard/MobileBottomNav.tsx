"use client";

import { Box, Icon, Text, VStack } from "@chakra-ui/react";
import { Home, BookOpen, ClipboardCheck, BookMarked, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Target, label: "Practice", href: "/practice" },
  { icon: BookOpen, label: "Courses", href: "/courses" },
  // { icon: ClipboardCheck, label: "My Mock Tests", href: "/mock-tests" },
  { icon: BookMarked, label: "Resources", href: "/resources" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
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
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
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
              <Text fontSize="xs" fontWeight={isActive ? "semibold" : "medium"}>
                {item.label}
              </Text>
            </VStack>
          </Link>
        );
      })}
    </Box>
  );
}
