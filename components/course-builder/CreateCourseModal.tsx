"use client";

import { Box, Button, Input, Textarea, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { ieltsCourseBuilderAPI } from "@/lib/teacher-api";
import { toaster } from "@/components/ui/toaster";
import type { Course } from "./types";

interface Props {
  onClose: () => void;
  onCreated: (course: Course) => void;
}

export default function CreateCourseModal({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) {
      toaster.error({ title: "Title is required" });
      return;
    }
    setSaving(true);
    try {
      const r = await ieltsCourseBuilderAPI.create({
        title,
        description: desc || undefined,
      });
      toaster.success({ title: "Course created!" });
      onCreated(r);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create course";
      toaster.error({ title: msg });
    }
    setSaving(false);
  };

  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.500"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={200}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Box
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="xl"
        shadow="lg"
        w="90%"
        maxW="520px"
        overflow="hidden"
      >
        {/* Header */}
        <Box
          px={6}
          py={5}
          borderBottomWidth="1px"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text fontWeight="700" fontSize="md">
            Create Mini Course
          </Text>
          <Box
            as="button"
            w={8}
            h={8}
            rounded="md"
            bg="gray.100"
            _dark={{ bg: "gray.700" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            fontSize="lg"
            color="gray.500"
            _hover={{ bg: "gray.200" }}
            onClick={onClose}
          >
            ×
          </Box>
        </Box>

        {/* Body */}
        <VStack p={6} gap={4} align="stretch">
          <Box>
            <Text
              fontSize="xs"
              fontWeight="600"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="0.3px"
              mb={1}
            >
              Course Title
            </Text>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. IELTS Academic Masterclass"
              autoFocus
            />
          </Box>

          <Box>
            <Text
              fontSize="xs"
              fontWeight="600"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="0.3px"
              mb={1}
            >
              Description (optional)
            </Text>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Course description…"
              rows={3}
            />
          </Box>
        </VStack>

        {/* Footer */}
        <Box
          px={6}
          py={4}
          borderTopWidth="1px"
          display="flex"
          justifyContent="flex-end"
          gap={2}
        >
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorPalette="blue"
            size="sm"
            onClick={save}
            disabled={saving}
            loading={saving}
            loadingText="Creating…"
          >
            Create
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
