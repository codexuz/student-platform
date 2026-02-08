"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  IconButton,
  Drawer,
  Dialog,
  Badge,
  Spinner,
  Flex,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { LuBell, LuInfo } from "react-icons/lu";
import { notificationsAPI } from "@/lib/api";

interface UserNotification {
  id: string;
  user_id: string;
  notification_id: string;
  seen: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  img_url: string | null;
  createdAt: string;
  updatedAt: string;
  user_notifications: UserNotification[];
}

export default function NotificationsDrawer() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationsAPI.getAllNotificationsWithUnseenCount();
      const data = response?.data || response;
      const items = data?.notifications || data || [];
      setNotifications(Array.isArray(items) ? items : []);
      setUnseenCount(
        data?.unseenCount ??
          data?.unseen_count ??
          (Array.isArray(items)
            ? items.filter(
                (n: Notification) => !n.user_notifications?.[0]?.seen
              ).length
            : 0)
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const isSeen = (n: Notification) => n.user_notifications?.[0]?.seen ?? false;

  const handleMarkAsSeen = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsSeen(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                user_notifications: n.user_notifications.map((un) => ({
                  ...un,
                  seen: true,
                })),
              }
            : n
        )
      );
      setUnseenCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as seen:", error);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="end">
      <Drawer.Trigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          position="relative"
          aria-label="Notifications"
        >
          <LuBell />
          {unseenCount > 0 && (
            <Badge
              colorPalette="red"
              variant="solid"
              position="absolute"
              top="-1"
              right="-1"
              fontSize="2xs"
              borderRadius="full"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {unseenCount > 99 ? "99+" : unseenCount}
            </Badge>
          )}
        </IconButton>
      </Drawer.Trigger>
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content>
          <Drawer.Header borderBottomWidth="1px">
            <Flex justify="space-between" align="center" w="full">
              <Drawer.Title>Notifications</Drawer.Title>
              {unseenCount > 0 && (
                <Badge colorPalette="red" variant="subtle">
                  {unseenCount} new
                </Badge>
              )}
            </Flex>
          </Drawer.Header>
          <Drawer.CloseTrigger />
          <Drawer.Body p={0}>
            {loading ? (
              <Flex justify="center" py={12}>
                <Spinner size="lg" color="brand.500" />
              </Flex>
            ) : notifications.length === 0 ? (
              <Flex
                justify="center"
                align="center"
                direction="column"
                py={12}
                gap={3}
              >
                <Icon fontSize="3xl" color="gray.400">
                  <LuBell />
                </Icon>
                <Text color="gray.500">No notifications yet</Text>
              </Flex>
            ) : (
              <VStack gap={0} align="stretch">
                {notifications.map((notification) => {
                  const seen = isSeen(notification);

                  return (
                    <HStack
                      key={notification.id}
                      px={4}
                      py={3}
                      gap={3}
                      bg={seen ? "transparent" : "blue.50"}
                      _dark={{
                        bg: seen ? "transparent" : "blue.950",
                      }}
                      borderBottomWidth="1px"
                      cursor="pointer"
                      _hover={{
                        bg: seen ? "gray.50" : "blue.100",
                        _dark: {
                          bg: seen ? "gray.700" : "blue.900",
                        },
                      }}
                      transition="all 0.15s"
                      onClick={() => {
                        if (!seen) handleMarkAsSeen(notification.id);
                        setSelected(notification);
                      }}
                    >
                      <Icon
                        fontSize="lg"
                        color={seen ? "gray.400" : "blue.500"}
                        mt={0.5}
                      >
                        <LuInfo />
                      </Icon>
                      <Box flex="1" minW={0}>
                        <Text
                          fontWeight={seen ? "normal" : "semibold"}
                          fontSize="sm"
                          truncate
                        >
                          {notification.title}
                        </Text>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          lineClamp={2}
                        >
                          {notification.message}
                        </Text>
                      </Box>
                      <Text fontSize="2xs" color="gray.400" flexShrink={0}>
                        {formatDate(notification.createdAt)}
                      </Text>
                      {!seen && (
                        <Box
                          w={2}
                          h={2}
                          rounded="full"
                          bg="blue.500"
                          flexShrink={0}
                        />
                      )}
                    </HStack>
                  );
                })}
              </VStack>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>

      <Dialog.Root
        open={!!selected}
        onOpenChange={(e) => !e.open && setSelected(null)}
        size="md"
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title fontSize="md">{selected?.title}</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
              <Dialog.Body pb={6}>
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {selected?.message}
                </Text>
                <Text fontSize="xs" color="gray.400" mt={4}>
                  {selected?.createdAt &&
                    new Date(selected.createdAt).toLocaleString()}
                </Text>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
