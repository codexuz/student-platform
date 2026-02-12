"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { Camera } from "lucide-react";
import { useState, useRef } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI, fileUploadAPI } from "@/lib/api";
import { toaster } from "@/components/ui/toaster";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [username, setUsername] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Sync when user loads asynchronously
  const [synced, setSynced] = useState(false);
  if (user && !synced) {
    setFirstName(user.first_name || "");
    setLastName(user.last_name || "");
    setPhone(user.phone || "");
    setUsername(user.username || "");
    setAvatarUrl(user.avatar_url || "");
    setSynced(true);
  }

  const initials =
    [firstName, lastName]
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toaster.error({ title: "File must be under 5MB" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toaster.error({ title: "Only image files are supported" });
      return;
    }

    setUploading(true);
    try {
      const res = await fileUploadAPI.uploadAvatar(file);
      const url = res?.url || res?.data?.url || res?.avatar_url || "";
      if (url) {
        setAvatarUrl(url);
        if (user) updateUser({ ...user, avatar_url: url });
        toaster.success({ title: "Avatar updated!" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toaster.error({ title: msg });
    }
    setUploading(false);
    // Reset input so re-selecting the same file triggers change
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userAPI.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      if (user) {
        updateUser({
          ...user,
          first_name: firstName,
          last_name: lastName,
          phone,
        });
      }
      toaster.success({ title: "Profile updated!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toaster.error({ title: msg });
    }
    setSaving(false);
  };

  return (
    <ProtectedRoute>
      <Flex
        h="100vh"
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
        direction={{ base: "column", lg: "row" }}
      >
        <Box display={{ base: "none", lg: "block" }}>
          <Sidebar />
        </Box>

        <Box
          flex="1"
          overflowY="auto"
          pb={{ base: "16", lg: "0" }}
          ml={{ base: 0, lg: "240px" }}
        >
          {/* Header */}
          <Box
            px={{ base: 4, md: 8 }}
            pt={{ base: 6, md: 10 }}
            pb={2}
            maxW="720px"
            mx="auto"
          >
            <Heading size="2xl" fontWeight="800" mb={1}>
              Profile
            </Heading>
            <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
              Manage your profile settings
            </Text>
          </Box>

          {/* Content */}
          <Box px={{ base: 4, md: 8 }} py={6} maxW="720px" mx="auto">
            <VStack gap={8} align="stretch">
              {/* Profile Picture */}
              <Box>
                <HStack gap={5} align="center">
                  {/* Avatar */}
                  <Box position="relative">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        w="80px"
                        h="80px"
                        rounded="full"
                        objectFit="cover"
                        borderWidth="2px"
                        borderColor="gray.200"
                        _dark={{ borderColor: "gray.600" }}
                      />
                    ) : (
                      <Box
                        w="80px"
                        h="80px"
                        rounded="full"
                        bg="blue.500"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                        fontSize="xl"
                        fontWeight="700"
                      >
                        {initials}
                      </Box>
                    )}
                    {uploading && (
                      <Box
                        position="absolute"
                        inset={0}
                        rounded="full"
                        bg="blackAlpha.500"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Spinner size="sm" color="white" />
                      </Box>
                    )}
                  </Box>

                  <VStack align="flex-start" gap={1}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera size={14} />
                      <Text ml={1.5}>Upload</Text>
                    </Button>
                    {avatarUrl && (
                      <Button
                        variant="ghost"
                        size="xs"
                        color="red.500"
                        onClick={() => {
                          setAvatarUrl("");
                          if (user) updateUser({ ...user, avatar_url: "" });
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </VStack>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={handleAvatarUpload}
                  />
                </HStack>
              </Box>

              {/* Divider */}
              <Box
                borderBottomWidth="1px"
                borderColor="gray.200"
                _dark={{ borderColor: "gray.700" }}
              />

              {/* Basic Info */}
              <Box>
                <Text fontWeight="700" fontSize="md" mb={0.5}>
                  Basic info
                </Text>
                <Text
                  fontSize="xs"
                  color="gray.500"
                  _dark={{ color: "gray.400" }}
                  mb={5}
                >
                  Tell us your basic info details
                </Text>

                <VStack gap={5} align="stretch">
                  {/* First name */}
                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                      mb={1.5}
                    >
                      First name
                    </Text>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      size="md"
                    />
                  </Box>

                  {/* Last name */}
                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                      mb={1.5}
                    >
                      Last name
                    </Text>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      size="md"
                    />
                  </Box>

                  {/* Username (disabled) */}
                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                      mb={1.5}
                    >
                      Username
                    </Text>
                    <Input
                      value={username}
                      disabled
                      size="md"
                      bg="gray.100"
                      _dark={{ bg: "gray.700" }}
                      cursor="not-allowed"
                    />
                  </Box>

                  {/* Phone number */}
                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="600"
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                      mb={1.5}
                    >
                      Phone number
                    </Text>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (000) 000 000"
                      size="md"
                    />
                  </Box>
                </VStack>
              </Box>

              {/* Save button */}
              <HStack justify="flex-end">
                <Button
                  colorPalette="blue"
                  size="md"
                  onClick={handleSave}
                  disabled={saving}
                  loading={saving}
                  px={8}
                >
                  Update
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>

        <MobileBottomNav />
      </Flex>
    </ProtectedRoute>
  );
}
